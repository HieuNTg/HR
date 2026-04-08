"use client"

import { Brain, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageBubbleProps {
  role: "ai" | "candidate"
  content: string
  timestamp?: Date
  /** If set, only show text up to this char index (text stream sync with TTS) */
  visibleChars?: number
}

export function ChatMessageBubble({ role, content, timestamp, visibleChars }: ChatMessageBubbleProps) {
  const isAI = role === "ai"

  // Stream mode: show text up to visibleChars, snapped to word boundary
  let displayText = content
  if (visibleChars !== undefined && visibleChars < content.length) {
    // Snap to nearest word end to avoid cutting mid-word
    const sliced = content.slice(0, visibleChars)
    const lastSpace = sliced.lastIndexOf(" ")
    displayText = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced
  }

  const isStreaming = visibleChars !== undefined && visibleChars < content.length

  return (
    <div className={cn("flex gap-2.5 px-4 py-1.5", isAI ? "justify-start" : "justify-end")}>
      {/* AI avatar */}
      {isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
          <Brain className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className={cn("max-w-[75%] space-y-1", isAI ? "" : "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
            isAI
              ? "bg-primary/5 text-foreground rounded-tl-sm"
              : "bg-primary text-primary-foreground rounded-tr-sm",
          )}
        >
          {displayText}
          {isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/60 animate-pulse align-middle rounded-sm" />}
        </div>
        {timestamp && !isStreaming && (
          <p className={cn("text-[10px] text-muted-foreground px-1", isAI ? "" : "text-right")}>
            {timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* Candidate avatar */}
      {!isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
