/**
 * Capture a JPEG frame from a video element.
 * Returns the raw base64 string (without the data URL prefix).
 * Gemini Live API accepts image/jpeg at ≤1 FPS.
 *
 * Canvas is created once per (width, height) and reused to avoid per-frame
 * GPU texture allocation. Pass the same dimensions on every call for best perf.
 */
let _canvas: HTMLCanvasElement | null = null
let _canvasCtx: CanvasRenderingContext2D | null = null

export function captureFrame(
  videoElement: HTMLVideoElement,
  width = 768,
  height = 768,
  quality = 0.85,
): string {
  // Reuse canvas if dimensions match; recreate on size change
  if (!_canvas || _canvas.width !== width || _canvas.height !== height) {
    _canvas = document.createElement("canvas")
    _canvas.width = width
    _canvas.height = height
    _canvasCtx = _canvas.getContext("2d")
  }
  if (!_canvasCtx) throw new Error("canvas 2d unavailable")
  _canvasCtx.drawImage(videoElement, 0, 0, width, height)
  const dataUrl = _canvas.toDataURL("image/jpeg", quality)
  // Strip "data:image/jpeg;base64," prefix
  return dataUrl.split(",")[1]
}
