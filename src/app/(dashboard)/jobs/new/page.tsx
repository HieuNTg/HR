"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { useSourcingStore } from "@/stores/sourcing-store"
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
})

type FormData = z.input<typeof schema>

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  FREELANCE: "Tự do",
}

export default function NewJobPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const createAndSource = useSourcingStore((s) => s.createAndSource)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employmentType: "FULL_TIME",
    },
  })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      // Generate mock candidates with AI and redirect to candidates page
      const jdDescription = [data.rawJdText, data.description].filter(Boolean).join("\n\n")

      // Start sourcing in background — store tracks progress
      createAndSource({
        title: data.title,
        department: data.department,
        description: jdDescription,
      })

      // Redirect immediately to candidates page where progress is shown
      router.push("/candidates")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi")
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/jobs" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tạo JD mới</h1>
          <p className="text-muted-foreground text-sm">Thêm vị trí tuyển dụng mới vào hệ thống</p>
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
                defaultValue="FULL_TIME"
                onValueChange={(v) =>
                  setValue("employmentType", v as FormData["employmentType"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại hình..." />
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
              <Label htmlFor="rawJdText">Dán toàn bộ JD vào đây</Label>
              <Textarea
                id="rawJdText"
                placeholder="Dán nội dung Job Description đầy đủ để AI phân tích..."
                rows={10}
                {...register("rawJdText")}
              />
              <p className="text-xs text-muted-foreground">
                AI sẽ tự động trích xuất yêu cầu từ văn bản này.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" render={<Link href="/jobs" />}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo JD
          </Button>
        </div>
      </form>
    </div>
  )
}
