"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  title: z.string().min(2, "Tiêu đề tối thiểu 2 ký tự").max(200),
  department: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]),
  description: z.string().max(10000).optional(),
  rawJdText: z.string().max(50000).optional(),
  interviewDuration: z.coerce.number().int().min(10).max(180),
  questionCount: z.coerce.number().int().min(5).max(50),
})

type FormData = z.input<typeof schema>

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  FREELANCE: "Tự do",
}

// TODO: Replace with real data from GET /api/jds/[id]
const MOCK_JD = {
  title: "Senior Frontend Developer",
  department: "Kỹ thuật",
  location: "Hà Nội",
  employmentType: "FULL_TIME" as const,
  description: "Chúng tôi tìm kiếm Senior Frontend Developer có kinh nghiệm React/Next.js.",
  rawJdText: "We are looking for a Senior Frontend Developer...",
  interviewSettings: { duration: 45, questionCount: 20 },
}

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employmentType: "FULL_TIME",
      interviewDuration: 30,
      questionCount: 15,
    },
  })

  const employmentType = watch("employmentType")

  useEffect(() => {
    // TODO: Replace with real API: fetch(`/api/jds/${id}`).then(r=>r.json()).then(d=> populate form)
    setTimeout(() => {
      const d = MOCK_JD
      setValue("title", d.title)
      setValue("department", d.department)
      setValue("location", d.location)
      setValue("employmentType", d.employmentType)
      setValue("description", d.description)
      setValue("rawJdText", d.rawJdText)
      setValue("interviewDuration", d.interviewSettings.duration)
      setValue("questionCount", d.interviewSettings.questionCount)
      setLoading(false)
    }, 300)
  }, [id, setValue])

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      // TODO: Replace with real API call to PUT /api/jds/[id]
      const res = await fetch(`/api/jds/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          department: data.department,
          location: data.location,
          employmentType: data.employmentType,
          description: data.description,
          rawJdText: data.rawJdText,
          interviewSettings: {
            duration: data.interviewDuration,
            questionCount: data.questionCount,
          },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Cập nhật JD thất bại")
      }

      router.push(`/jobs/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href={`/jobs/${id}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa JD</h1>
          <p className="text-muted-foreground text-sm">Cập nhật thông tin vị trí tuyển dụng</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Tiêu đề vị trí <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="VD: Senior Frontend Developer"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="department">Phòng ban</Label>
                <Input id="department" placeholder="VD: Kỹ thuật" {...register("department")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Địa điểm</Label>
                <Input id="location" placeholder="VD: Hà Nội, Remote" {...register("location")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Loại hình công việc</Label>
              <Select
                value={employmentType}
                onValueChange={(v) =>
                  setValue("employmentType", v as FormData["employmentType"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Mô tả vị trí</Label>
              <Textarea
                id="description"
                placeholder="Mô tả ngắn về vị trí, trách nhiệm chính..."
                rows={4}
                {...register("description")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nội dung JD gốc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="rawJdText">Nội dung JD đầy đủ</Label>
              <Textarea
                id="rawJdText"
                placeholder="Nội dung Job Description..."
                rows={10}
                {...register("rawJdText")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cấu hình phỏng vấn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="interviewDuration">Thời lượng (phút)</Label>
                <Input
                  id="interviewDuration"
                  type="number"
                  min={10}
                  max={180}
                  {...register("interviewDuration")}
                />
                {errors.interviewDuration && (
                  <p className="text-xs text-destructive">{errors.interviewDuration.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="questionCount">Số câu hỏi</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min={5}
                  max={50}
                  {...register("questionCount")}
                />
                {errors.questionCount && (
                  <p className="text-xs text-destructive">{errors.questionCount.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" render={<Link href={`/jobs/${id}`} />}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  )
}
