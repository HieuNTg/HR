"use client"

import { useMemo, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Brain, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InterviewLoadingOverlay } from "@/components/interview/interview-loading-overlay"
import {
  MOCK_SOURCING_CANDIDATES,
  MOCK_JD_TITLE,
  SOURCE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/mock-data/mock-candidates-sourcing"
import { AI_ENGINEER_CANDIDATES, AI_ENGINEER_JD_TITLE } from "@/lib/mock-data/mock-ai-engineer-sourcing"
import { useSourcingStore } from "@/stores/sourcing-store"

const STATIC_CANDIDATES = [...MOCK_SOURCING_CANDIDATES, ...AI_ENGINEER_CANDIDATES]

/** Progress bar for score breakdown */
function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ScoreBadge({ value }: { value: number }) {
  const color =
    value >= 70
      ? "bg-green-100 text-green-800 border-green-200"
      : value >= 50
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200"
  return (
    <span className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold border-2 ${color}`}>
      {Math.round(value)}
    </span>
  )
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [showLoading, setShowLoading] = useState(false)

  const candidate = useMemo(
    () => {
      const staticMatch = STATIC_CANDIDATES.find((c) => c.id === id)
      if (staticMatch) return staticMatch
      // Check dynamic candidates from sourcing store
      return useSourcingStore.getState().getAllCandidates().find((c) => c.id === id) ?? null
    },
    [id],
  )

  const handleLoadingComplete = useCallback(() => {
    if (candidate) {
      router.push(`/interviews/${candidate.id}`)
    }
  }, [candidate, router])

  if (!candidate) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Không tìm thấy ứng viên này.</p>
        <Button variant="outline" className="mt-4" render={<Link href="/candidates" />}>
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const bd = candidate.scoreBreakdown

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Loading overlay */}
      {showLoading && (
        <InterviewLoadingOverlay
          candidateName={candidate.fullName}
          jobTitle={
            id.startsWith("ai-") ? AI_ENGINEER_JD_TITLE
              : id.startsWith("gen-") ? (useSourcingStore.getState().jds.find((j) => j.candidates.some((c) => c.id === id))?.title ?? "Vị trí tuyển dụng")
              : MOCK_JD_TITLE
          }
          onComplete={handleLoadingComplete}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/candidates" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{candidate.fullName}</h1>
              <Badge variant="outline" className={`text-xs ${STATUS_COLORS[candidate.status]}`}>
                {STATUS_LABELS[candidate.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {candidate.currentTitle} @ {candidate.currentCompany}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{candidate.experienceYears} năm kinh nghiệm</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {SOURCE_LABELS[candidate.sourcePlatform]}
                {candidate.sourceUrl && (
                  <a href={candidate.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 text-blue-500" />
                  </a>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ScoreBadge value={candidate.overallScore} />
          <Button onClick={() => setShowLoading(true)}>
            <Brain className="mr-2 h-4 w-4" />
            Kích hoạt AI Phỏng vấn
          </Button>
        </div>
      </div>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreBar label="Keyword Match (50%)" value={bd.keyword.score} max={bd.keyword.max} color="bg-blue-500" />
          <ScoreBar label="Experience (20%)" value={bd.experience.score} max={bd.experience.max} color="bg-purple-500" />
          <p className="text-xs text-muted-foreground -mt-2 ml-1">
            Phát hiện: {bd.experience.detectedYears} năm
          </p>
          <ScoreBar label="Education (10%)" value={bd.education.score} max={bd.education.max} color="bg-yellow-500" />
          <p className="text-xs text-muted-foreground -mt-2 ml-1">
            Trình độ: {bd.education.level}
          </p>
          <ScoreBar label="Language (10%)" value={bd.language.score} max={bd.language.max} color="bg-teal-500" />
          <p className="text-xs text-muted-foreground -mt-2 ml-1">
            {bd.language.detected.join(", ")}
          </p>
          <ScoreBar label="AI Assessment (10%)" value={bd.ai.score} max={bd.ai.max} color="bg-indigo-500" />
          <p className="text-xs text-muted-foreground -mt-2 ml-1 italic">
            &ldquo;{bd.ai.summary}&rdquo;
          </p>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kỹ năng phù hợp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {candidate.matchedSkills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Matched</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.matchedSkills.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {candidate.missingSkills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.missingSkills.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 line-through">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CV Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tóm tắt CV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{candidate.cvSummary}</p>
        </CardContent>
      </Card>
    </div>
  )
}
