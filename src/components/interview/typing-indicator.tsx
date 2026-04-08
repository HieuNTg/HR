"use client"

/** Animated 3-dot typing indicator (AI is thinking) */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.8s" }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-2">AI đang suy nghĩ...</span>
    </div>
  )
}
