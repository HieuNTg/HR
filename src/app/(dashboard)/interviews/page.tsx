import Link from "next/link"
import { Plus, Search, Filter, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const interviews = [
  {
    id: "1",
    candidate: "Nguyễn Văn A",
    position: "Senior Frontend Developer",
    type: "AI",
    scheduledAt: "26/03/2026 09:00",
    duration: "45 phút",
    score: 8.5,
    status: "completed",
  },
  {
    id: "2",
    candidate: "Trần Thị B",
    position: "Product Manager",
    type: "AI",
    scheduledAt: "26/03/2026 14:00",
    duration: "60 phút",
    score: 7.2,
    status: "completed",
  },
  {
    id: "3",
    candidate: "Lê Văn C",
    position: "Backend Developer",
    type: "AI",
    scheduledAt: "27/03/2026 10:00",
    duration: "45 phút",
    score: null,
    status: "scheduled",
  },
  {
    id: "4",
    candidate: "Phạm Thị D",
    position: "UI/UX Designer",
    type: "AI",
    scheduledAt: "25/03/2026 11:00",
    duration: "45 phút",
    score: 9.1,
    status: "completed",
  },
  {
    id: "5",
    candidate: "Hoàng Văn E",
    position: "DevOps Engineer",
    type: "AI",
    scheduledAt: "24/03/2026 15:00",
    duration: "60 phút",
    score: 6.8,
    status: "reviewing",
  },
]

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  scheduled: { label: "Đã lên lịch", variant: "secondary" },
  in_progress: { label: "Đang diễn ra", variant: "outline" },
  completed: { label: "Hoàn thành", variant: "default" },
  reviewing: { label: "Đang xem xét", variant: "outline" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
}

export default function InterviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phỏng vấn</h1>
          <p className="text-muted-foreground">
            Quản lý lịch và kết quả các buổi phỏng vấn AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/interviews/calendar" />}>
            <Calendar className="mr-2 h-4 w-4" />
            Lịch phỏng vấn
          </Button>
          <Button render={<Link href="/interviews/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo phỏng vấn
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm phỏng vấn..." className="pl-8" />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Lọc
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ứng viên</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Thời lượng</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((interview) => (
                <TableRow
                  key={interview.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/interviews/${interview.id}`}
                      className="hover:underline"
                    >
                      {interview.candidate}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {interview.position}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{interview.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {interview.scheduledAt}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {interview.duration}
                  </TableCell>
                  <TableCell>
                    {interview.score !== null ? (
                      <span className="font-semibold">{interview.score}/10</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[interview.status]?.variant ?? "outline"}>
                      {statusConfig[interview.status]?.label ?? interview.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
