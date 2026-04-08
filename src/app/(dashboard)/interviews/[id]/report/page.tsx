"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer, Brain } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InterviewReportCard } from "@/components/interview/interview-report-card"
import { InterviewTranscript } from "@/components/interview/interview-transcript"
import { useInterviewStore } from "@/stores/interview-store"

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const store = useInterviewStore()

  // If no report in store (e.g. direct navigation), redirect back
  useEffect(() => {
    if (!store.report && store.step !== "report") {
      router.replace(`/interviews`)
    }
  }, [store.report, store.step, router])

  if (!store.report) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Đang tải báo cáo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/interviews")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Danh sách phỏng vấn
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1.5" />
          In báo cáo
        </Button>
      </div>

      {/* Report card */}
      <div className="border rounded-xl p-6 bg-card shadow-sm">
        <InterviewReportCard
          report={store.report}
          candidateName={store.candidateName ?? "Ứng viên"}
          jobTitle={store.jobTitle ?? "Vị trí"}
        />
      </div>

      {/* Transcript */}
      <div className="border rounded-xl p-4 bg-card shadow-sm">
        <InterviewTranscript messages={store.messages} />
      </div>

      {/* Footer actions */}
      <div className="flex justify-center gap-3 pt-2">
        <Button variant="outline" onClick={() => { store.reset(); router.push("/candidates") }}>
          Quay lại danh sách ứng viên
        </Button>
        <Button onClick={() => { store.reset(); router.push("/candidates") }}>
          Phỏng vấn ứng viên khác
        </Button>
      </div>
    </div>
  )
}
