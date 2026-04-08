"use client"

import { Brain, ThumbsUp, ThumbsDown, Award, TrendingUp } from "lucide-react"
import type { InterviewReportData } from "@/lib/services/interview-ai-service"

interface InterviewReportCardProps {
  report: InterviewReportData
  candidateName: string
  jobTitle: string
}

const RECOMMENDATION_CONFIG = {
  STRONGLY_RECOMMEND: {
    label: "Nên mời phỏng vấn vòng 2",
    color: "bg-green-100 text-green-800 border-green-300",
    dot: "bg-green-500",
  },
  RECOMMEND: {
    label: "Khuyến nghị tiếp tục",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    dot: "bg-blue-500",
  },
  CONSIDER: {
    label: "Cần xem xét thêm",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    dot: "bg-yellow-500",
  },
  REJECT: {
    label: "Không phù hợp",
    color: "bg-red-100 text-red-800 border-red-300",
    dot: "bg-red-500",
  },
} as const

const SCORE_DIMENSIONS = [
  { key: "scoreTechnical" as const, label: "Kỹ năng nghiệp vụ" },
  { key: "scoreExperience" as const, label: "Kinh nghiệm" },
  { key: "scoreCommunication" as const, label: "Giao tiếp" },
  { key: "scoreProblemSolving" as const, label: "Tư duy & Giải quyết vấn đề" },
]

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, score * 10))
  const color =
    score >= 8 ? "bg-green-500" : score >= 6 ? "bg-blue-500" : score >= 4 ? "bg-yellow-500" : "bg-red-500"

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/10</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function InterviewReportCard({ report, candidateName, jobTitle }: InterviewReportCardProps) {
  const rec = RECOMMENDATION_CONFIG[report.recommendation] ?? RECOMMENDATION_CONFIG.CONSIDER
  const overallPct = Math.min(100, Math.max(0, report.overallScore * 10))
  const overallColor =
    report.overallScore >= 8
      ? "text-green-600"
      : report.overallScore >= 6
        ? "text-blue-600"
        : report.overallScore >= 4
          ? "text-yellow-600"
          : "text-red-600"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{candidateName}</h2>
            <p className="text-sm text-muted-foreground">{jobTitle} — NovaGroup</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${rec.color}`}>
          <span className={`w-2 h-2 rounded-full ${rec.dot}`} />
          {rec.label}
        </div>
      </div>

      {/* Overall score + Attitude */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Điểm tổng</p>
          <p className={`text-4xl font-bold ${overallColor}`}>{report.overallScore}</p>
          <p className="text-xs text-muted-foreground">/10</p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${overallColor.replace("text-", "bg-")}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Thái độ</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Award className="w-8 h-8 text-primary" />
            <p className="text-xl font-semibold">{report.attitude}</p>
          </div>
        </div>
      </div>

      {/* Score dimensions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" />
          Đánh giá chi tiết
        </h3>
        {SCORE_DIMENSIONS.map((dim) => (
          <ScoreBar key={dim.key} label={dim.label} score={report[dim.key]} />
        ))}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-green-700">
            <ThumbsUp className="w-4 h-4" />
            Điểm mạnh
          </h3>
          <ul className="space-y-1">
            {report.strengths.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-red-700">
            <ThumbsDown className="w-4 h-4" />
            Cần cải thiện
          </h3>
          <ul className="space-y-1">
            {report.weaknesses.map((w, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendation reason */}
      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-1">Nhận xét tổng quan</p>
        <p className="text-sm leading-relaxed">{report.recommendationReason}</p>
      </div>
    </div>
  )
}
