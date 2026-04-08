import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type CandidateStatus =
  | "NEW"
  | "SCREENING"
  | "INTERVIEWED"
  | "OFFERED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN"

const statusConfig: Record<CandidateStatus, { label: string; className: string }> = {
  NEW: {
    label: "Mới",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  },
  SCREENING: {
    label: "Sàng lọc",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  INTERVIEWED: {
    label: "Đã phỏng vấn",
    className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  },
  OFFERED: {
    label: "Đã offer",
    className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
  },
  HIRED: {
    label: "Đã tuyển",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  },
  REJECTED: {
    label: "Từ chối",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  },
  WITHDRAWN: {
    label: "Rút hồ sơ",
    className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  },
}

interface CandidateStatusBadgeProps {
  status: string
  className?: string
}

export function CandidateStatusBadge({ status, className }: CandidateStatusBadgeProps) {
  const config = statusConfig[status as CandidateStatus] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  }

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
