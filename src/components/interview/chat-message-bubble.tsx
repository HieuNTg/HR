"use client"

import { Brain, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageBubbleProps {
  role: "ai" | "candidate"
  content: string
  timestamp?: Date
  visibleChars?: number
  variant?: "light" | "dark"
}

export function ChatMessageBubble({ role, content, timestamp, visibleChars, variant = "light" }: ChatMessageBubbleProps) {
  const isAI = role === "ai"
  const isDark = variant === "dark"

  let displayText = content
  if (visibleChars !== undefined && visibleChars < content.length) {
    const sliced = content.slice(0, visibleChars)
    const lastSpace = sliced.lastIndexOf(" ")
    displayText = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced
  }

  const isStreaming = visibleChars !== undefined && visibleChars < content.length

  return (
    <div className={cn("flex gap-2.5 px-4 py-1.5", isAI ? "justify-start" : "justify-end")}>
      {isAI && (
        <div
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1",
            isDark ? "bg-emerald-500/15" : "bg-primary/10",
          )}
        >
          <Brain className={cn("w-3.5 h-3.5", isDark ? "text-emerald-400" : "text-primary")} />
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-0.5", isAI ? "" : "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
            isAI
              ? isDark
                ? "bg-white/5 text-slate-200 rounded-tl-sm"
                : "bg-primary/5 text-foreground rounded-tl-sm"
              : isDark
                ? "bg-emerald-600/20 text-emerald-100 rounded-tr-sm"
                : "bg-primary text-primary-foreground rounded-tr-sm",
          )}
        >
          {displayText}
          {isStreaming && (
            <span
              className={cn(
                "inline-block w-1.5 h-4 ml-0.5 animate-pulse align-middle rounded-sm",
                isDark ? "bg-emerald-400/60" : "bg-primary/60",
              )}
            />
          )}
        </div>
        {timestamp && !isStreaming && (
          <p
            className={cn(
              "text-[10px] px-1",
              isDark ? "text-slate-500" : "text-muted-foreground",
              isAI ? "" : "text-right",
            )}
          >
            {timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {!isAI && (
        <div
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1",
            isDark ? "bg-white/10" : "bg-muted",
          )}
        >
          <User className={cn("w-3.5 h-3.5", isDark ? "text-slate-400" : "text-muted-foreground")} />
        </div>
      )}
    </div>
  )
}
