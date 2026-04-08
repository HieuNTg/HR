"use client"

import { Brain, Search, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface SourcingProgressCardProps {
  status: "sourcing" | "scoring" | "done" | "error"
  title: string
  scoredCount: number
  totalCount: number
  progress: number
}

export function SourcingProgressCard({ status, title, scoredCount, totalCount, progress }: SourcingProgressCardProps) {
  if (status === "done") return null

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="py-4">
        <div className="flex items-center gap-3 mb-3">
          {status === "sourcing" ? (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
          ) : status === "scoring" ? (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-red-600" />
            </div>
          )}

          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              {status === "sourcing" && "AI đang tìm kiếm ứng viên..."}
              {status === "scoring" && "AI đang chấm điểm ứng viên..."}
              {status === "error" && "Đã xảy ra lỗi khi tìm kiếm ứng viên"}
            </p>
            <p className="text-xs text-blue-600">{title}</p>
          </div>

          {status === "scoring" && (
            <span className="text-sm font-bold text-blue-700">
              {scoredCount}/{totalCount}
            </span>
          )}
        </div>

        {status === "scoring" && (
          <div className="space-y-1.5">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-blue-500">
              <span className="flex items-center gap-1">
                {scoredCount < totalCount ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                {scoredCount < totalCount
                  ? `Đang chấm điểm ${scoredCount + 1}/${totalCount}...`
                  : "Hoàn tất chấm điểm"
                }
              </span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {status === "sourcing" && (
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full w-1/3 animate-pulse" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
