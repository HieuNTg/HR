/** Next.js instrumentation — runs once per runtime on server startup */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node")
  }
}
