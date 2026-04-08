import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Skill {
  name: string
  category: "TECHNICAL" | "SOFT" | "LANGUAGE" | "TOOL" | string
}

interface Experience {
  company: string
  title: string
  startDate?: string | null
  endDate?: string | null
  description?: string | null
}

interface Education {
  institution: string
  degree?: string | null
  field?: string | null
  year?: string | null
}

interface Certification {
  name: string
  issuer?: string | null
}

export interface CvParsedData {
  skills?: Skill[]
  experience?: Experience[]
  education?: Education[]
  certifications?: Certification[]
  totalYearsExperience?: number | null
  summary?: string | null
}

interface CvParsedResultProps {
  data: CvParsedData
  className?: string
}

const skillCategoryConfig: Record<string, { label: string; className: string }> = {
  TECHNICAL: {
    label: "Kỹ thuật",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  },
  SOFT: {
    label: "Kỹ năng mềm",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  },
  LANGUAGE: {
    label: "Ngôn ngữ",
    className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  },
  TOOL: {
    label: "Công cụ",
    className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
  },
}

function groupSkills(skills: Skill[]) {
  return skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category ?? "TECHNICAL"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(skill)
    return acc
  }, {})
}

export function CvParsedResult({ data, className }: CvParsedResultProps) {
  const grouped = groupSkills(data.skills ?? [])

  return (
    <div className={cn("space-y-4", className)}>
      {data.totalYearsExperience != null && (
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
          <span className="text-2xl font-bold text-primary">{data.totalYearsExperience}</span>
          <span className="text-sm text-muted-foreground">năm kinh nghiệm</span>
        </div>
      )}

      {data.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tóm tắt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.summary}</p>
          </CardContent>
        </Card>
      )}

      {Object.keys(grouped).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kỹ năng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(grouped).map(([cat, skills]) => {
              const config = skillCategoryConfig[cat] ?? { label: cat, className: "" }
              return (
                <div key={cat}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{config.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <Badge key={s.name} variant="outline" className={cn("text-xs", config.className)}>
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {(data.experience ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kinh nghiệm làm việc</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l border-muted ml-2 space-y-5">
              {data.experience!.map((exp, i) => (
                <li key={i} className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border bg-primary" />
                  <p className="text-sm font-medium">{exp.title}</p>
                  <p className="text-xs text-muted-foreground">{exp.company}</p>
                  {(exp.startDate || exp.endDate) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exp.startDate ?? "?"} — {exp.endDate ?? "Hiện tại"}
                    </p>
                  )}
                  {exp.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {(data.education ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Học vấn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.education!.map((edu, i) => (
              <div key={i} className="rounded-md border p-3">
                <p className="text-sm font-medium">{edu.institution}</p>
                {edu.degree && (
                  <p className="text-xs text-muted-foreground">
                    {edu.degree}{edu.field ? ` — ${edu.field}` : ""}
                  </p>
                )}
                {edu.year && <p className="text-xs text-muted-foreground">{edu.year}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(data.certifications ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chứng chỉ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.certifications!.map((cert, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {cert.name}{cert.issuer ? ` (${cert.issuer})` : ""}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
