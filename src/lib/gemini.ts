import { GoogleGenAI, HarmCategory, HarmBlockThreshold, FileState, createPartFromUri } from "@google/genai"

type GeminiModel = "gemini-3.1-flash-lite-preview" | "gemini-3.1-flash-lite-preview-lite"

interface GenerateOptions {
  model?: GeminiModel
  temperature?: number
  maxOutputTokens?: number
  signal?: AbortSignal
  timeout?: number
  /** Thinking token budget. 0 disables thinking (recommended for structured JSON output to avoid truncation). -1 = AUTOMATIC. Default: 0. */
  thinkingBudget?: number
}

// HR interview content (CV, JD, candidate answers in Vietnamese) is controlled enterprise content.
// Gemini 3 over-filters Vietnamese text at any threshold above OFF → empty responses, 500 errors,
// broken report/evaluation flows. Disable filters entirely for this enterprise HR use case.
const INTERVIEW_SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.OFF },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.OFF },
]

/** Thrown when Gemini blocks a response via safety filters or recitation checks — not retryable. */
export class GeminiBlockedError extends Error {
  constructor(public finishReason: string, context: string) {
    super(`Gemini response blocked by ${finishReason} filter (${context})`)
    this.name = "GeminiBlockedError"
  }
}

const NON_RETRYABLE_FINISH_REASONS = new Set(["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"])

const DEFAULT_TIMEOUT = 30_000
const MAX_RETRIES = 3
const MIN_RESPONSE_LENGTH = 10

class GeminiClient {
  private client: GoogleGenAI

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set")
    this.client = new GoogleGenAI({ apiKey })
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) return true
      if (msg.includes("503") || msg.includes("unavailable") || msg.includes("overloaded")) return true
      if (msg.includes("econnreset") || msg.includes("econnrefused") || msg.includes("timeout")) return true
      if (msg.includes("empty response") || msg.includes("no content")) return true
    }
    return false
  }

  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms)
      signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")) }, { once: true })
    })
  }

  private async generateWithRetry<T>(
    fn: () => Promise<T>,
    options: { signal?: AbortSignal; validate?: (result: T) => boolean; context?: string },
  ): Promise<T> {
    let lastError: unknown
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        options.signal?.throwIfAborted()
        const result = await fn()

        if (options.validate && !options.validate(result)) {
          const msg = `Empty/invalid response from Gemini (${options.context})`
          console.warn(`[gemini] ${msg}, attempt ${attempt + 1}/${MAX_RETRIES + 1}`)
          if (attempt < MAX_RETRIES) {
            await this.delay(1000 * 2 ** attempt, options.signal)
            continue
          }
          throw new Error(msg)
        }

        return result
      } catch (e) {
        lastError = e
        if (e instanceof DOMException && e.name === "AbortError") throw e
        if (e instanceof GeminiBlockedError) throw e
        if (attempt < MAX_RETRIES && this.isRetryable(e)) {
          console.warn(`[gemini] ${options.context}: retry ${attempt + 1}/${MAX_RETRIES} after: ${(e as Error).message}`)
          await this.delay(1000 * 2 ** attempt, options.signal)
          continue
        }
        break
      }
    }
    throw lastError
  }

  async generateContent(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const { model = "gemini-3.1-flash-lite-preview", temperature, maxOutputTokens, signal, timeout = DEFAULT_TIMEOUT, thinkingBudget = 0 } = options

    return this.generateWithRetry(async () => {
      const response = await this.raceAbort(
        this.client.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature,
            maxOutputTokens,
            safetySettings: INTERVIEW_SAFETY_SETTINGS,
            thinkingConfig: { thinkingBudget },
            httpOptions: { timeout },
          },
        }),
        signal,
      )

      const finishReason = (response as unknown as { candidates?: Array<{ finishReason?: string }> }).candidates?.[0]?.finishReason
      if (finishReason && finishReason !== "STOP") {
        console.warn(`[gemini] finishReason: ${finishReason} for generateContent (maxOutputTokens=${maxOutputTokens}, thinkingBudget=${thinkingBudget})`)
        if (NON_RETRYABLE_FINISH_REASONS.has(finishReason)) throw new GeminiBlockedError(finishReason, "generateContent")
      }

      return response.text ?? ""
    }, {
      signal,
      validate: (text) => text.trim().length >= MIN_RESPONSE_LENGTH,
      context: "generateContent",
    })
  }

  async generateJSON<T>(prompt: string, options: GenerateOptions = {}): Promise<T> {
    const { model = "gemini-3.1-flash-lite-preview", temperature, maxOutputTokens, signal, timeout = DEFAULT_TIMEOUT, thinkingBudget = 0 } = options

    return this.generateWithRetry(async () => {
      const response = await this.raceAbort(
        this.client.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature,
            maxOutputTokens,
            responseMimeType: "application/json",
            safetySettings: INTERVIEW_SAFETY_SETTINGS,
            thinkingConfig: { thinkingBudget },
            httpOptions: { timeout },
          },
        }),
        signal,
      )

      const finishReason = (response as unknown as { candidates?: Array<{ finishReason?: string }> }).candidates?.[0]?.finishReason
      if (finishReason && finishReason !== "STOP") {
        console.warn(`[gemini] finishReason: ${finishReason} for generateJSON (maxOutputTokens=${maxOutputTokens}, thinkingBudget=${thinkingBudget})`)
        if (NON_RETRYABLE_FINISH_REASONS.has(finishReason)) throw new GeminiBlockedError(finishReason, "generateJSON")
      }

      const text = response.text ?? ""
      try {
        return JSON.parse(text.trim()) as T
      } catch {
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (!match) throw new Error(`Failed to parse JSON from Gemini response (finishReason=${finishReason}). Text: "${text.slice(0, 200)}"`)
        return JSON.parse(match[0]) as T
      }
    }, {
      signal,
      validate: (result) => result !== null && result !== undefined,
      context: "generateJSON",
    })
  }

  /** Race a promise against an AbortSignal — rejects immediately on abort */
  private raceAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) return promise
    if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"))
    return new Promise<T>((resolve, reject) => {
      const onAbort = () => reject(new DOMException("Aborted", "AbortError"))
      signal.addEventListener("abort", onAbort, { once: true })
      promise.then(
        (v) => { signal.removeEventListener("abort", onAbort); resolve(v) },
        (e) => { signal.removeEventListener("abort", onAbort); reject(e) },
      )
    })
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.client.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    })
    return result.embeddings?.[0]?.values ?? []
  }

  /**
   * Upload a file (audio/video/etc.) to the Gemini Files API and wait until it's ACTIVE.
   * Returns {uri, mimeType} usable with createPartFromUri. Files auto-expire after 48h.
   */
  async uploadFile(
    blob: Blob,
    mimeType: string,
    opts: { displayName?: string; signal?: AbortSignal; pollTimeoutMs?: number } = {},
  ): Promise<{ uri: string; mimeType: string; name: string }> {
    const { displayName, signal, pollTimeoutMs = 60_000 } = opts

    const file = await this.client.files.upload({
      file: blob,
      config: { mimeType, displayName, abortSignal: signal },
    })

    if (!file.name || !file.uri) throw new Error("Gemini upload returned no name/uri")

    // Poll until ACTIVE — audio usually flips immediately; video can take seconds.
    const deadline = Date.now() + pollTimeoutMs
    let current = file
    while (current.state === FileState.PROCESSING) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
      if (Date.now() > deadline) throw new Error(`Gemini file stuck in PROCESSING after ${pollTimeoutMs}ms`)
      await this.delay(1500, signal)
      current = await this.client.files.get({ name: file.name })
    }

    if (current.state === FileState.FAILED) {
      throw new Error(`Gemini file processing FAILED: ${current.error?.message ?? "unknown"}`)
    }

    return { uri: current.uri ?? file.uri, mimeType: current.mimeType ?? mimeType, name: current.name ?? file.name }
  }

  /**
   * Generate JSON grounded on an uploaded file (e.g. conversation audio). The file part
   * is prepended to the prompt so the model can transcribe/analyze the media directly.
   */
  async generateJSONWithFile<T>(
    prompt: string,
    file: { uri: string; mimeType: string },
    options: GenerateOptions = {},
  ): Promise<T> {
    const { model = "gemini-3.1-flash-lite-preview", temperature, maxOutputTokens, signal, timeout = DEFAULT_TIMEOUT, thinkingBudget = 0 } = options

    const filePart = createPartFromUri(file.uri, file.mimeType)

    return this.generateWithRetry(async () => {
      const response = await this.raceAbort(
        this.client.models.generateContent({
          model,
          contents: [{ role: "user", parts: [filePart, { text: prompt }] }],
          config: {
            temperature,
            maxOutputTokens,
            responseMimeType: "application/json",
            safetySettings: INTERVIEW_SAFETY_SETTINGS,
            thinkingConfig: { thinkingBudget },
            httpOptions: { timeout },
          },
        }),
        signal,
      )

      const finishReason = (response as unknown as { candidates?: Array<{ finishReason?: string }> }).candidates?.[0]?.finishReason
      if (finishReason && finishReason !== "STOP") {
        console.warn(`[gemini] finishReason: ${finishReason} for generateJSONWithFile (maxOutputTokens=${maxOutputTokens})`)
        if (NON_RETRYABLE_FINISH_REASONS.has(finishReason)) throw new GeminiBlockedError(finishReason, "generateJSONWithFile")
      }

      const text = response.text ?? ""
      try {
        return JSON.parse(text.trim()) as T
      } catch {
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (!match) throw new Error(`Failed to parse JSON from Gemini audio response (finishReason=${finishReason}). Text: "${text.slice(0, 200)}"`)
        return JSON.parse(match[0]) as T
      }
    }, {
      signal,
      validate: (result) => result !== null && result !== undefined,
      context: "generateJSONWithFile",
    })
  }
}

// Module-local cache (not globalThis) so HMR reloads refresh the instance when
// this module is edited — globalThis caching would return a stale instance
// missing methods added after first boot, which broke uploadFile during dev.
let cachedClient: GeminiClient | null = null

export function getGemini(): GeminiClient {
  if (!cachedClient) cachedClient = new GeminiClient()
  return cachedClient
}

export default getGemini
