import { GoogleGenAI } from "@google/genai"

type GeminiModel = "gemini-3.1-flash-lite-preview" | "gemini-3.1-flash-lite-preview-lite"

interface GenerateOptions {
  model?: GeminiModel
  temperature?: number
  maxOutputTokens?: number
  signal?: AbortSignal
}

class GeminiClient {
  private client: GoogleGenAI

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set")
    }
    this.client = new GoogleGenAI({ apiKey })
  }

  async generateContent(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const { model = "gemini-3.1-flash-lite-preview", temperature, maxOutputTokens, signal } = options
    signal?.throwIfAborted()
    const response = await this.raceAbort(
      this.client.models.generateContent({
        model,
        contents: prompt,
        config: { temperature, maxOutputTokens, httpOptions: { timeout: 30_000 } },
      }),
      signal,
    )
    return response.text ?? ""
  }

  async generateJSON<T>(prompt: string, options: GenerateOptions = {}): Promise<T> {
    const { model = "gemini-3.1-flash-lite-preview", temperature, maxOutputTokens, signal } = options
    signal?.throwIfAborted()
    const response = await this.raceAbort(
      this.client.models.generateContent({
        model,
        contents: prompt,
        config: { temperature, maxOutputTokens, responseMimeType: "application/json", httpOptions: { timeout: 30_000 } },
      }),
      signal,
    )
    const text = response.text ?? ""
    try {
      return JSON.parse(text.trim()) as T
    } catch {
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
      if (!match) throw new Error("Failed to parse JSON from Gemini response")
      return JSON.parse(match[0]) as T
    }
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
}

const globalForGemini = globalThis as unknown as {
  gemini: GeminiClient | undefined
}

export function getGemini(): GeminiClient {
  if (!globalForGemini.gemini) {
    globalForGemini.gemini = new GeminiClient()
  }
  return globalForGemini.gemini
}

export default getGemini
