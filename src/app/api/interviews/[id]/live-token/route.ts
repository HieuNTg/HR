import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

const GEMINI_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
const GEMINI_WS_URI =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"

/** POST /api/interviews/[id]/live-token
 *  Returns a short-lived token for direct browser→Gemini WebSocket connection.
 *  Uses ephemeral token API (v1alpha). Falls back to API key for dev if unavailable.
 */
export async function POST(
  _req: NextRequest,
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
          liveConnectConstraints: {
            model: GEMINI_LIVE_MODEL,
          },
        },
      })

      if (tokenResult.name) {
        return NextResponse.json({
          token: tokenResult.name,
          wsUri: GEMINI_WS_URI,
          expiresAt: expireTime,
        })
      }
    } catch (e) {
      console.warn("Ephemeral token creation failed (falling back):", e)

      // In production, fail hard — do not leak the API key
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Live session unavailable" }, { status: 503 })
      }
    }

    // Dev-only fallback: return API key directly (browser uses it as ?key=)
    return NextResponse.json({
      token: apiKey,
      wsUri: GEMINI_WS_URI,
      expiresAt: null,
    })
  } catch (error) {
    console.error("live-token error:", error)
    return NextResponse.json({ error: "Failed to create live token" }, { status: 500 })
  }
}
