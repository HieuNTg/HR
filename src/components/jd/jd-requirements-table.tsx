import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface JobRequirement {
  id: string
  name: string
  type: "TECHNICAL" | "SOFT" | "EXPERIENCE" | "EDUCATION" | "CERTIFICATION"
  level?: string | null
  yearsRequired?: number | null
  isRequired: boolean
  weight: number
  description?: string | null
}

const typeConfig: Record<string, { label: string; className: string }> = {
  TECHNICAL: { label: "Kỹ thuật", className: "bg-blue-100 text-blue-700 border-blue-200" },
  SOFT: { label: "Kỹ năng mềm", className: "bg-purple-100 text-purple-700 border-purple-200" },
  EXPERIENCE: { label: "Kinh nghiệm", className: "bg-orange-100 text-orange-700 border-orange-200" },
  EDUCATION: { label: "Học vấn", className: "bg-green-100 text-green-700 border-green-200" },
  CERTIFICATION: { label: "Chứng chỉ", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
}

const TYPE_ORDER = ["TECHNICAL", "SOFT", "EXPERIENCE", "EDUCATION", "CERTIFICATION"]

interface JdRequirementsTableProps {
  requirements: JobRequirement[]
}

export function JdRequirementsTable({ requirements }: JdRequirementsTableProps) {
  if (requirements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Chưa có yêu cầu nào được thêm.
      </p>
    )
  }

  const grouped = TYPE_ORDER.reduce<Record<string, JobRequirement[]>>((acc, type) => {
    const items = requirements.filter((r) => r.type === type)
    if (items.length > 0) acc[type] = items
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([type, items]) => {
        const cfg = typeConfig[type] ?? { label: type, className: "" }
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={cfg.className}>
                {cfg.label}
              </Badge>
              <span className="text-xs text-muted-foreground">({items.length})</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên yêu cầu</TableHead>
                  <TableHead>Cấp độ</TableHead>
                  <TableHead>Năm KN</TableHead>
                  <TableHead>Trọng số</TableHead>
                  <TableHead>Bắt buộc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {req.level ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {req.yearsRequired != null ? `${req.yearsRequired} năm` : "—"}
                    </TableCell>
                    <TableCell>{req.weight}</TableCell>
                    <TableCell>
                      {req.isRequired ? (
                        <Badge variant="default" className="bg-green-600 text-white">Bắt buộc</Badge>
                      ) : (
                        <Badge variant="outline">Tùy chọn</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      })}
    </div>
  )
}
