"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessageBubble } from "./chat-message-bubble"
import { TypingIndicator } from "./typing-indicator"
import type { ChatMessage } from "@/stores/interview-store"

interface ChatInterfaceProps {
  messages: ChatMessage[]
  loading: boolean
  disabled: boolean
  onSend: (message: string) => void
  streamingMsgId?: string | null
  spokenCharIndex?: number
}

export function ChatInterface({ messages, loading, disabled, onSend, streamingMsgId, spokenCharIndex }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, spokenCharIndex, scrollToBottom])

  useEffect(() => {
    if (!disabled && !loading) {
      inputRef.current?.focus()
    }
  }, [disabled, loading])

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
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-sm">Đang bắt đầu phỏng vấn...</p>
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
      <div className="border-t border-border/50 p-3 bg-background/50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Phỏng vấn đã kết thúc" : "Nhập câu trả lời..."}
            disabled={disabled || loading}
            className="flex-1 resize-none overflow-y-auto rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className="h-10 w-10 rounded-xl shrink-0 cursor-pointer"
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
