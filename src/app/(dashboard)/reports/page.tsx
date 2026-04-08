import { Download, TrendingUp, Users, MessageSquare, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const summaryStats = [
  {
    title: "Tổng phỏng vấn",
    value: "247",
    change: "+12%",
    description: "So với tháng trước",
    icon: MessageSquare,
  },
  {
    title: "Ứng viên đạt yêu cầu",
    value: "89",
    change: "+8%",
    description: "36% tỉ lệ đạt",
    icon: Users,
  },
  {
    title: "Điểm trung bình",
    value: "7.8",
    change: "+0.3",
    description: "Thang điểm 10",
    icon: Star,
  },
  {
    title: "Thời gian trung bình",
    value: "48 phút",
    change: "-5 phút",
    description: "Mỗi phỏng vấn",
    icon: TrendingUp,
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Báo cáo</h1>
          <p className="text-muted-foreground">
            Phân tích và thống kê hoạt động tuyển dụng
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-medium text-green-600">{stat.change}</span>
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="positions">Theo vị trí</TabsTrigger>
          <TabsTrigger value="trends">Xu hướng</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phỏng vấn theo tháng</CardTitle>
                <CardDescription>Số lượng phỏng vấn trong 6 tháng qua</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border rounded-lg bg-muted/20">
                  Biểu đồ sẽ được hiển thị ở đây
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phân bổ điểm số</CardTitle>
                <CardDescription>Phân phối điểm số phỏng vấn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border rounded-lg bg-muted/20">
                  Biểu đồ sẽ được hiển thị ở đây
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="positions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thống kê theo vị trí</CardTitle>
              <CardDescription>
                Số lượng ứng viên và điểm trung bình theo từng vị trí tuyển dụng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border rounded-lg bg-muted/20">
                Biểu đồ sẽ được hiển thị ở đây
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Xu hướng tuyển dụng</CardTitle>
              <CardDescription>
                Phân tích xu hướng tuyển dụng theo thời gian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border rounded-lg bg-muted/20">
                Biểu đồ sẽ được hiển thị ở đây
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
