"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, Trash2, Cpu, Loader2, MapPin, Briefcase } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { JdStatusBadge } from "@/components/jd/jd-status-badge"
import { JdRequirementsTable, type JobRequirement } from "@/components/jd/jd-requirements-table"
import { JdParsedSummary } from "@/components/jd/jd-parsed-summary"

interface JobDetail {
  id: string
  title: string
  department?: string | null
  location?: string | null
  employmentType: string
  status: string
  description?: string | null
  rawJdText?: string | null
  parsedData?: Record<string, unknown> | null
  interviewSettings?: { duration?: number; questionCount?: number } | null
  requirements: JobRequirement[]
  createdAt: string
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  FREELANCE: "Tự do",
}

// TODO: Replace with real data from GET /api/jds/[id]
const MOCK_DETAIL: JobDetail = {
  id: "1",
  title: "Senior Frontend Developer",
  department: "Kỹ thuật",
  location: "Hà Nội",
  employmentType: "FULL_TIME",
  status: "ACTIVE",
  description: "Chúng tôi tìm kiếm Senior Frontend Developer có kinh nghiệm React/Next.js.",
  rawJdText: "We are looking for a Senior Frontend Developer...",
  parsedData: {
    positionLevel: "Senior",
    focusAreas: [
      { area: "Kỹ thuật", percentage: 60 },
      { area: "Problem Solving", percentage: 25 },
      { area: "Teamwork", percentage: 15 },
    ],
    keywords: ["React", "TypeScript", "Next.js", "TailwindCSS", "REST API"],
  },
  interviewSettings: { duration: 45, questionCount: 20 },
  requirements: [
    {
      id: "r1",
      name: "React / Next.js",
      type: "TECHNICAL",
      level: "Senior",
      yearsRequired: 3,
      isRequired: true,
      weight: 9,
    },
    {
      id: "r2",
      name: "TypeScript",
      type: "TECHNICAL",
      level: "Intermediate",
      yearsRequired: 2,
      isRequired: true,
      weight: 7,
    },
    {
      id: "r3",
      name: "Giao tiếp tốt",
      type: "SOFT",
      level: null,
      yearsRequired: null,
      isRequired: false,
      weight: 5,
    },
    {
      id: "r4",
      name: "Kinh nghiệm startup",
      type: "EXPERIENCE",
      level: null,
      yearsRequired: 2,
      isRequired: false,
      weight: 4,
    },
  ],
  createdAt: "2026-03-20T00:00:00Z",
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)

  useEffect(() => {
    // TODO: Replace with real API: fetch(`/api/jds/${id}`).then(r=>r.json()).then(d=>setJob(d.data))
    setTimeout(() => {
      setJob(MOCK_DETAIL)
      setLoading(false)
    }, 300)
  }, [id])

  async function handleParse() {
    if (!job) return
    setParsing(true)
    try {
      // TODO: call POST /api/jds/[id]/parse
      await new Promise((r) => setTimeout(r, 1500))
      alert("Parse thành công (mock)")
    } finally {
      setParsing(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Bạn có chắc muốn xóa vị trí này?")) return
    // TODO: call DELETE /api/jds/[id]
    alert("Xóa JD - API chưa sẵn sàng")
    router.push("/jobs")
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Không tìm thấy vị trí này.</p>
        <Button variant="outline" className="mt-4" render={<Link href="/jobs" />}>
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/jobs" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
              <JdStatusBadge status={job.status} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
              {job.department && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {job.department}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
              )}
              <span>{EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleParse}
            disabled={parsing}
          >
            {parsing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Cpu className="mr-2 h-4 w-4" />
            )}
            Parse lại với AI
          </Button>
          <Button variant="outline" size="sm" render={<Link href={`/jobs/${id}/edit`} />}>
            <Pencil className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="requirements">
            Yêu cầu ({job.requirements.length})
          </TabsTrigger>
          <TabsTrigger value="settings">Cấu hình phỏng vấn</TabsTrigger>
        </TabsList>

        {/* Tab: Thông tin */}
        <TabsContent value="info" className="space-y-4 mt-4">
          {job.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mô tả vị trí</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{job.description}</p>
              </CardContent>
            </Card>
          )}

          {job.rawJdText && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nội dung JD gốc</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground line-clamp-10">
                  {job.rawJdText}
                </p>
              </CardContent>
            </Card>
          )}

          <JdParsedSummary parsedData={job.parsedData as Parameters<typeof JdParsedSummary>[0]["parsedData"]} />
        </TabsContent>

        {/* Tab: Yêu cầu */}
        <TabsContent value="requirements" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <JdRequirementsTable requirements={job.requirements} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cấu hình */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cấu hình phỏng vấn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Thời lượng</p>
                  <p className="font-medium">{job.interviewSettings?.duration ?? 30} phút</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Số câu hỏi</p>
                  <p className="font-medium">{job.interviewSettings?.questionCount ?? 15} câu</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" render={<Link href={`/jobs/${id}/edit`} />}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Chỉnh sửa cấu hình
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
