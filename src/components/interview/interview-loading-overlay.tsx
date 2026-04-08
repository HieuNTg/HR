"use client"

import { useState, useEffect } from "react"
import { Brain, FileSearch, MessageSquarePlus, CheckCircle2 } from "lucide-react"

/** Animated loading steps shown when AI prepares interview questions from CV */
const LOADING_STEPS = [
  { icon: FileSearch, text: "AI đang đọc CV...", duration: 1000 },
  { icon: Brain, text: "Đang phân tích kỹ năng và kinh nghiệm...", duration: 1000 },
  { icon: MessageSquarePlus, text: "Đang tạo bộ câu hỏi cá nhân hóa...", duration: 1000 },
  { icon: CheckCircle2, text: "Sẵn sàng phỏng vấn!", duration: 500 },
]

interface InterviewLoadingOverlayProps {
  candidateName: string
  jobTitle: string
  onComplete: () => void
}

export function InterviewLoadingOverlay({
  candidateName,
  jobTitle,
  onComplete,
}: InterviewLoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (currentStep >= LOADING_STEPS.length) {
      onComplete()
      return
    }
    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1)
    }, LOADING_STEPS[currentStep].duration)
    return () => clearTimeout(timer)
  }, [currentStep, onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center space-y-6">
        {/* NovaGroup branding */}
        <div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">NovaGroup AI Interview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {candidateName} — {jobTitle}
          </p>
        </div>

        {/* Progress steps */}
        <div className="space-y-3 text-left">
          {LOADING_STEPS.map((step, idx) => {
            const Icon = step.icon
            const isActive = idx === currentStep
            const isDone = idx < currentStep

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-primary/5 text-primary"
                    : isDone
                    ? "text-green-600"
                    : "text-gray-300"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "animate-pulse" : ""}`} />
                <span className={`text-sm ${isActive ? "font-medium" : ""}`}>
                  {step.text}
                </span>
                {isDone && <CheckCircle2 className="w-4 h-4 ml-auto text-green-500" />}
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / LOADING_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
