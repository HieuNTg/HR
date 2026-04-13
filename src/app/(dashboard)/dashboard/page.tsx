import Link from "next/link"
import {
  Briefcase,
  Users,
  MessageSquare,
  TrendingUp,
  Plus,
  Upload,
  ArrowUpRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const stats = [
  {
    title: "Vị trí tuyển dụng",
    value: "12",
    description: "+2 so với tháng trước",
    icon: Briefcase,
  },
  {
    title: "Tổng ứng viên",
    value: "148",
    description: "+18 so với tháng trước",
    icon: Users,
  },
  {
    title: "Phỏng vấn đang hoạt động",
    value: "24",
    description: "8 phỏng vấn hôm nay",
    icon: MessageSquare,
  },
  {
    title: "Điểm trung bình",
    value: "7.8",
    description: "+0.3 so với tháng trước",
    icon: TrendingUp,
  },
]

const recentInterviews = [
  {
    id: "1",
    candidate: "Nguyễn Văn Hùng",
    position: "Nhân viên Mua hàng",
    date: "26/03/2026",
    score: 8.5,
    status: "completed",
  },
  {
    id: "2",
    candidate: "Lê Thị Hồng Nhung",
    position: "Nhân viên Mua hàng",
    date: "26/03/2026",
    score: 7.2,
    status: "completed",
  },
  {
    id: "3",
    candidate: "Trịnh Hoàng Nam",
    position: "Nhân viên Mua hàng",
    date: "25/03/2026",
    score: null,
    status: "scheduled",
  },
  {
    id: "4",
    candidate: "Huỳnh Thị Thanh Tâm",
    position: "Nhân viên Mua hàng",
    date: "25/03/2026",
    score: 9.1,
    status: "completed",
  },
  {
    id: "5",
    candidate: "Nguyễn Hoàng Khoa",
    position: "AI Engineer",
    date: "24/03/2026",
    score: 6.8,
    status: "reviewing",
  },
]

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  completed: { label: "Hoàn thành", variant: "default" },
  scheduled: { label: "Đã lên lịch", variant: "secondary" },
  reviewing: { label: "Đang xem xét", variant: "outline" },
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground">
            Chào mừng trở lại! Đây là tổng quan hệ thống của bạn.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/candidates/upload" />}>
            <Upload className="mr-2 h-4 w-4" />
            Tải lên CV
          </Button>
          <Button render={<Link href="/jobs/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo vị trí mới
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Phỏng vấn gần đây</CardTitle>
            <CardDescription>
              Danh sách các phỏng vấn mới nhất trong hệ thống
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/interviews" />}>
            Xem tất cả
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ứng viên</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInterviews.map((interview) => (
                <TableRow
                  key={interview.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    {interview.candidate}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {interview.position}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {interview.date}
                  </TableCell>
                  <TableCell>
                    {interview.score !== null ? (
                      <span className="font-semibold">{interview.score}/10</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[interview.status]?.variant ?? "outline"}>
                      {statusLabels[interview.status]?.label ?? interview.status}
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
