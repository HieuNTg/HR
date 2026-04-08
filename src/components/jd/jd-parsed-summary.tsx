import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, AlertCircle } from "lucide-react"

interface FocusArea {
  area: string
  percentage: number
}

interface ParsedData {
  positionLevel?: string
  focusAreas?: FocusArea[]
  keywords?: string[]
  summary?: string
}

interface JdParsedSummaryProps {
  parsedData?: ParsedData | null
}

export function JdParsedSummary({ parsedData }: JdParsedSummaryProps) {
  if (!parsedData) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-medium">Chưa parse</p>
          <p className="text-xs text-center">
            Nhấn &quot;Parse lại với AI&quot; để trích xuất thông tin từ mô tả công việc.
          </p>
        </CardContent>
      </Card>
    )
  }

  const focusAreas: FocusArea[] = parsedData.focusAreas ?? []
  const keywords: string[] = parsedData.keywords ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Brain className="h-5 w-5 text-primary" />
        <CardTitle className="text-base">Kết quả phân tích AI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {parsedData.positionLevel && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Cấp độ vị trí</p>
            <Badge variant="secondary">{parsedData.positionLevel}</Badge>
          </div>
        )}

        {parsedData.summary && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Tóm tắt</p>
            <p className="text-sm">{parsedData.summary}</p>
          </div>
        )}

        {focusAreas.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Trọng tâm phỏng vấn</p>
            <div className="space-y-2">
              {focusAreas.map((area) => (
                <div key={area.area}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{area.area}</span>
                    <span className="text-muted-foreground">{area.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${area.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {keywords.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Từ khóa</p>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
