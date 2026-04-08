"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ScoreBreakdown {
  technicalSkills: number
  experience: number
  education: number
  niceToHave: number
}

export interface MatchResult {
  overallScore: number
  breakdown: ScoreBreakdown
  matchedSkills: string[]
  missingSkills: string[]
  strengths: string[]
  gaps: string[]
  jobTitle?: string
}

interface MatchScoreCardProps {
  result: MatchResult
  className?: string
}

function ScoreColor(score: number) {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-yellow-600"
  return "text-red-600"
}

function BarColor(score: number) {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-yellow-500"
  return "bg-red-500"
}

interface BreakdownBarProps {
  label: string
  value: number
}

function BreakdownBar({ label, value }: BreakdownBarProps) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className={cn("font-medium", ScoreColor(value))}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", BarColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function MatchScoreCard({ result, className }: MatchScoreCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            {result.jobTitle && (
              <p className="text-xs text-muted-foreground mb-0.5">{result.jobTitle}</p>
            )}
            <div className="flex items-baseline gap-1">
              <span className={cn("text-4xl font-bold", ScoreColor(result.overallScore))}>
                {result.overallScore}
              </span>
              <span className="text-muted-foreground text-sm">/100</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs"
          >
            Xem chi tiết
            {expanded ? (
              <ChevronUp className="ml-1 h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Breakdown bars */}
        <div className="space-y-2.5">
          <BreakdownBar label="Kỹ năng kỹ thuật" value={result.breakdown.technicalSkills} />
          <BreakdownBar label="Kinh nghiệm" value={result.breakdown.experience} />
          <BreakdownBar label="Học vấn" value={result.breakdown.education} />
          <BreakdownBar label="Yêu cầu thêm" value={result.breakdown.niceToHave} />
        </div>

        {/* Skills matched/missing */}
        {(result.matchedSkills.length > 0 || result.missingSkills.length > 0) && (
          <div className="space-y-2">
            {result.matchedSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Kỹ năng phù hợp</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkills.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="text-xs bg-green-100 text-green-700 border-green-200"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {result.missingSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Kỹ năng còn thiếu</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="text-xs bg-red-100 text-red-700 border-red-200"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expandable details */}
        {expanded && (result.strengths.length > 0 || result.gaps.length > 0) && (
          <div className="border-t pt-3 space-y-3">
            {result.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Điểm mạnh</p>
                <ul className="space-y-0.5">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-green-600 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.gaps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Điểm cần cải thiện</p>
                <ul className="space-y-0.5">
                  {result.gaps.map((g, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-red-600 mt-0.5">•</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
