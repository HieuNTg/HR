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

    // Attempt ephemeral token via v1alpha (recommended for production)
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { apiVersion: "v1alpha" },
      })

      const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      const tokenResult = await ai.authTokens.create({
        config: {
          uses: 1,
          expireTime,
        },
      })

      if (req.signal.aborted) return new Response(null, { status: 499 })

      if (tokenResult.name) {
        console.log("[live-token] ephemeral token created, using v1alpha/Constrained")
        return NextResponse.json({
          token: tokenResult.name,
          wsUri: GEMINI_WS_EPHEMERAL,
          expiresAt: expireTime,
          isEphemeral: true, // client must use ?access_token= (not ?key=)
        })
      }
    } catch (e) {
      if (e instanceof Error && (e.name === "AbortError" || (e as NodeJS.ErrnoException).code === "ECONNRESET")) {
        return new Response(null, { status: 499 })
      }
      console.warn("Ephemeral token creation failed (falling back):", e)

      // In production, fail hard — do not leak the API key
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Live session unavailable" }, { status: 503 })
      }
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
