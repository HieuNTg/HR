/**
 * WebSocket reconnect utility for Gemini Live sessions.
 * Extracted from use-gemini-live-session hook to keep file size manageable.
 * Handles exponential backoff, token refresh, and new WebSocket creation.
 */

export interface ReconnectOptions {
  interviewId: string
  maxAttempts: number
  buildSetupMsg: () => object
  /** Called before each attempt with (attempt, delayMs) */
  onAttemptStart?: (attempt: number, delayMs: number) => void
  /** Check whether user has cancelled — return true to abort reconnect */
  isCancelled: () => boolean
}

/**
 * Attempt to reconnect a Gemini Live WebSocket with exponential backoff.
 * Returns the new connected WebSocket or null if all attempts failed.
 */
export async function attemptGeminiReconnect(
  opts: ReconnectOptions,
): Promise<WebSocket | null> {
  const { interviewId, maxAttempts, buildSetupMsg, onAttemptStart, isCancelled } = opts

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delay = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
    onAttemptStart?.(attempt, delay)

    await new Promise(r => setTimeout(r, delay))
    if (isCancelled()) return null

    try {
      const res = await fetch(`/api/interviews/${interviewId}/live-token`, { method: "POST" })
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
      const { token, wsUri, isEphemeral } = await res.json()

      const wsUrl = isEphemeral ? `${wsUri}?access_token=${token}` : `${wsUri}?key=${token}`
      const newWs = new WebSocket(wsUrl)

      // Wait for open or error with timeout
      const opened = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 10000)
        newWs.onopen = () => {
          clearTimeout(timer)
          const setupMsg = buildSetupMsg()
          console.log("[gemini-ws] reconnect setup:", JSON.stringify(setupMsg).slice(0, 300))
          newWs.send(JSON.stringify(setupMsg))
          resolve(true)
        }
        newWs.onerror = () => { clearTimeout(timer); resolve(false) }
      })

      if (!opened || isCancelled()) {
        try { newWs.close() } catch { /* ignore */ }
        continue
      }

      console.log(`[gemini-ws] reconnected on attempt ${attempt}/${maxAttempts}`)
      return newWs
    } catch (err) {
      console.error(`[gemini-ws] reconnect attempt ${attempt} failed:`, err)
    }
  }

  return null
}
