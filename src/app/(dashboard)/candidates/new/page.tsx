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

const schema = z.object({
  firstName: z.string().min(1, "Bắt buộc").max(100),
  lastName: z.string().min(1, "Bắt buộc").max(100),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().max(50).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
})

type FormData = z.input<typeof schema>

export default function NewCandidatePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Tạo ứng viên thất bại")
      }

      const created = await res.json()
      const id = created?.candidate?.id
      router.push(id ? `/candidates/${id}` : "/candidates")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi")
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/candidates" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thêm ứng viên</h1>
          <p className="text-muted-foreground text-sm">Tạo hồ sơ ứng viên mới</p>
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
            <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lastName">
                  Họ <span className="text-destructive">*</span>
                </Label>
                <Input id="lastName" placeholder="VD: Nguyễn" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="firstName">
                  Tên <span className="text-destructive">*</span>
                </Label>
                <Input id="firstName" placeholder="VD: Văn A" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" placeholder="email@example.com" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" placeholder="VD: 0901234567" {...register("phone")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source">Nguồn</Label>
              <Input id="source" placeholder="VD: LinkedIn, TopCV, Giới thiệu..." {...register("source")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú thêm về ứng viên..."
                rows={3}
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" render={<Link href="/candidates" />}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo ứng viên
          </Button>
        </div>
      </form>
    </div>
  )
}
