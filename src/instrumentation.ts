/** Next.js instrumentation — runs once on server startup */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Suppress ECONNRESET / ABORT_ERR from client disconnections.
    // These are harmless socket errors when browsers close TCP mid-request
    // (e.g. React StrictMode remount, navigation, tab close).
    //
    // Strategy: monkey-patch process.emit so the uncaughtException event
    // never reaches ANY listener (including ones Next.js adds later).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalEmit = process.emit as (...args: any[]) => boolean

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(process as any).emit = function (event: string, ...args: unknown[]): boolean {
      if (event === "uncaughtException" && args[0] instanceof Error) {
        const err = args[0] as NodeJS.ErrnoException
        const code = err.code
        if (
          code === "ECONNRESET" ||
          code === "ABORT_ERR" ||
          code === "ERR_STREAM_PREMATURE_CLOSE" ||
          (!code && err.message === "aborted")
        ) {
          console.debug("Suppressed client disconnect:", code ?? err.message)
          return true // swallowed — no listener fires, no crash
        }
      }
      return originalEmit.call(process, event, ...args)
    }
  }
}
