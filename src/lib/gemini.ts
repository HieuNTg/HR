import { GoogleGenAI } from "@google/genai"

type GeminiModel = "gemini-3.1-flash-lite-preview" | "gemini-3.1-flash-lite-preview-lite"

interface GenerateOptions {
  model?: GeminiModel
  temperature?: number
  maxOutputTokens?: number
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
    const { model = "gemini-3.1-flash-lite-preview", temperature, maxOutputTokens } = options
    const response = await this.client.models.generateContent({
      model,
      contents: prompt,
      config: { temperature, maxOutputTokens },
    })
    return response.text ?? ""
  }

  async generateJSON<T>(prompt: string, options: GenerateOptions = {}): Promise<T> {
    const { model = "gemini-3.1-flash-lite-preview", temperature, maxOutputTokens } = options
    const response = await this.client.models.generateContent({
      model,
      contents: prompt,
      config: { temperature, maxOutputTokens, responseMimeType: "application/json" },
    })
    const text = response.text ?? ""
    try {
      return JSON.parse(text.trim()) as T
    } catch {
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
      if (!match) throw new Error("Failed to parse JSON from Gemini response")
      return JSON.parse(match[0]) as T
    }
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

export const gemini = globalForGemini.gemini ?? new GeminiClient()

if (process.env.NODE_ENV !== "production") {
  globalForGemini.gemini = gemini
}

export default gemini
