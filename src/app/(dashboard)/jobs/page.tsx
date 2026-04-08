"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, MoreHorizontal, Eye, Pencil, Cpu, Archive } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JdStatusBadge } from "@/components/jd/jd-status-badge"

// TODO: Replace with real API call to GET /api/jds
interface JobPosition {
  id: string
  title: string
  department?: string | null
  status: string
  _count?: { candidates?: number }
  createdAt: string
}

const MOCK_JOBS: JobPosition[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    department: "Kỹ thuật",
    status: "ACTIVE",
    _count: { candidates: 18 },
    createdAt: "2026-03-20T00:00:00Z",
  },
  {
    id: "2",
    title: "Product Manager",
    department: "Sản phẩm",
    status: "DRAFT",
    _count: { candidates: 0 },
    createdAt: "2026-03-18T00:00:00Z",
  },
  {
    id: "3",
    title: "Backend Developer (Node.js)",
    department: "Kỹ thuật",
    status: "ARCHIVED",
    _count: { candidates: 9 },
    createdAt: "2026-03-15T00:00:00Z",
  },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN")
}

export default function JobsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  // TODO: Replace mock with: const [jobs, setJobs] = useState<JobPosition[]>([])
  // TODO: useEffect(() => { fetch('/api/jds').then(r=>r.json()).then(d=>setJobs(d.data)) }, [])
  const jobs = MOCK_JOBS

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.department ?? "").toLowerCase().includes(search.toLowerCase())
  )

  async function handleArchive(id: string) {
    // TODO: call PUT /api/jds/[id] with { status: 'ARCHIVED' }
    alert(`Archive JD ${id} - API chưa sẵn sàng`)
  }

  async function handleParse(id: string) {
    // TODO: call POST /api/jds/[id]/parse
    alert(`Parse JD ${id} với AI - API chưa sẵn sàng`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vị trí tuyển dụng</h1>
          <p className="text-muted-foreground">
            Quản lý các vị trí tuyển dụng và mô tả công việc
          </p>
        </div>
        <Button render={<Link href="/jobs/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo JD mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm vị trí..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <p className="text-sm">Không tìm thấy vị trí nào.</p>
              <Button variant="outline" render={<Link href="/jobs/new" />}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo JD đầu tiên
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ứng viên</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((job) => (
                  <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/jobs/${job.id}`} className="hover:underline">
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {job.department ?? "—"}
                    </TableCell>
                    <TableCell>
                      <JdStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>{job._count?.candidates ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Hành động</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/jobs/${job.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/jobs/${job.id}/edit`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleParse(job.id)}>
                            <Cpu className="mr-2 h-4 w-4" />
                            Parse với AI
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleArchive(job.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Lưu trữ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
