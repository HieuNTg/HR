/**
 * Node.js-only instrumentation — dynamically imported to avoid Edge Runtime errors.
 * Suppresses harmless ECONNRESET / ABORT_ERR from client disconnections
 * (React StrictMode remount, navigation, tab close).
 *
 * Two suppression layers:
 * 1. process.emit — catches uncaught exceptions / unhandled rejections
 * 2. console.error — catches Next.js internal error logging (dev server logs
 *    ECONNRESET via console.error before it ever becomes an uncaughtException)
 */

function isNetworkStreamError(arg: unknown): boolean {
  if (!(arg instanceof Error)) return false
  const code = (arg as NodeJS.ErrnoException).code
  return (
    code === "ECONNRESET" ||
    code === "ABORT_ERR" ||
    code === "ERR_STREAM_PREMATURE_CLOSE" ||
    arg.message === "aborted"
  )
}

// Layer 1: process.emit override for uncaught exceptions
const origEmit = process.emit
// @ts-ignore — intentional override of process.emit signature
process.emit = function (event: string) {
  if (event === "uncaughtException" || event === "unhandledRejection") {
    // eslint-disable-next-line prefer-rest-params
    if (isNetworkStreamError(arguments[1])) return true
  }
  // @ts-ignore — passthrough to original emit
  // eslint-disable-next-line prefer-rest-params
  return origEmit.apply(this, arguments)
}

// Layer 2: console.error override for Next.js internal error logging
const origConsoleError = console.error
console.error = function (...args: unknown[]) {
  if (args.some(isNetworkStreamError)) return
  return origConsoleError.apply(this, args)
}

console.log("🔧 [instrumentation-node] process.emit override installed")

export {}
