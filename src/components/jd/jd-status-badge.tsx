import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type JobStatus = "DRAFT" | "ACTIVE" | "ARCHIVED"

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Nháp",
    className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  },
  ACTIVE: {
    label: "Đang tuyển",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  },
  ARCHIVED: {
    label: "Đã lưu trữ",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  },
}

interface JdStatusBadgeProps {
  status: string
  className?: string
}

export function JdStatusBadge({ status, className }: JdStatusBadgeProps) {
  const config = statusConfig[status as JobStatus] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  }

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
