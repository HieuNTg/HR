"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import { ChatMessageBubble } from "./chat-message-bubble"
import type { ChatMessage } from "@/stores/interview-store"

interface InterviewTranscriptProps {
  messages: ChatMessage[]
}

export function InterviewTranscript({ messages }: InterviewTranscriptProps) {
  const [open, setOpen] = useState(false)

  if (messages.length === 0) return null

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors w-full"
      >
        <MessageSquare className="w-4 h-4" />
        Nhật ký phỏng vấn ({messages.length} tin nhắn)
        {open ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      {open && (
        <div className="border rounded-xl overflow-hidden bg-background">
          <div className="py-2 max-h-[500px] overflow-y-auto">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
