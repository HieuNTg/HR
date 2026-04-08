"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessageBubble } from "./chat-message-bubble"
import { TypingIndicator } from "./typing-indicator"
import type { ChatMessage } from "@/stores/interview-store"

interface ChatInterfaceProps {
  messages: ChatMessage[]
  loading: boolean
  disabled: boolean
  onSend: (message: string) => void
  /** ID of message currently being spoken by TTS */
  streamingMsgId?: string | null
  /** How many chars of the streaming message have been spoken */
  spokenCharIndex?: number
}

export function ChatInterface({ messages, loading, disabled, onSend, streamingMsgId, spokenCharIndex }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, spokenCharIndex, scrollToBottom])

  // Focus input when not disabled
  useEffect(() => {
    if (!disabled && !loading) {
      inputRef.current?.focus()
    }
  }, [disabled, loading])

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 500)}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [input, autoResize])

  function handleSend() {
    const text = input.trim()
    if (!text || disabled || loading) return
    setInput("")
    // Reset height after clearing
    if (inputRef.current) inputRef.current.style.height = "auto"
    onSend(text)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = input.trim().length > 0 && !disabled && !loading

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Đang bắt đầu phỏng vấn...
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            visibleChars={msg.id === streamingMsgId ? spokenCharIndex : undefined}
          />
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Phỏng vấn đã kết thúc" : "Nhập câu trả lời..."}
            disabled={disabled || loading}
            className="flex-1 resize-none overflow-y-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {loading && (
          <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
            AI đang xử lý câu trả lời của bạn...
          </p>
        )}
      </div>
    </div>
  )
}
