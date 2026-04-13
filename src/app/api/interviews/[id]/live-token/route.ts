import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

const GEMINI_WS_EPHEMERAL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained"
const GEMINI_WS_APIKEY =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"

/** POST /api/interviews/[id]/live-token
 *  Returns a short-lived token for direct browser→Gemini WebSocket connection.
 *  Uses ephemeral token API (v1alpha). Falls back to API key for dev if unavailable.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Missing interview ID" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    // Attempt ephemeral token via v1alpha with retry (production only)
    if (process.env.NODE_ENV === "production") {
      const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } })
      const expireTime = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 60 minutes

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (req.signal.aborted) return new Response(null, { status: 499 })

          const tokenResult = await ai.authTokens.create({
            config: { uses: 3, expireTime },
          })

          if (req.signal.aborted) return new Response(null, { status: 499 })

          if (tokenResult.name) {
            console.log(`[live-token] ephemeral token created (attempt ${attempt + 1})`)
            return NextResponse.json({
              token: tokenResult.name,
              wsUri: GEMINI_WS_EPHEMERAL,
              expiresAt: expireTime,
              isEphemeral: true,
            })
          }
        } catch (e) {
          if (e instanceof Error && (e.name === "AbortError" || (e as NodeJS.ErrnoException).code === "ECONNRESET")) {
            return new Response(null, { status: 499 })
          }
          console.warn(`[live-token] token creation attempt ${attempt + 1}/3 failed:`, e)
          if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * 2 ** attempt))
        }
      }

      console.warn("[live-token] all token creation attempts failed")
      return NextResponse.json({ error: "Live session unavailable" }, { status: 503 })
    }

    if (req.signal.aborted) return new Response(null, { status: 499 })

    // Dev-only fallback: return API key directly (browser uses it as ?key=)
    console.log("[live-token] using API key fallback, v1beta/BidiGenerateContent")
    return NextResponse.json({
      token: apiKey,
      wsUri: GEMINI_WS_APIKEY,
      expiresAt: null,
      isEphemeral: false,
    })
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || (error as NodeJS.ErrnoException).code === "ECONNRESET")) {
      return new Response(null, { status: 499 })
    }
    console.error("live-token error:", error)
    return NextResponse.json({ error: "Failed to create live token" }, { status: 500 })
  }
}
