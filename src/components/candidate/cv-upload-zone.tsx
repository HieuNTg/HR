"use client"

import { useState, useRef, useCallback } from "react"
import { UploadCloud, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UploadedFile {
  name: string
  status: "uploading" | "done" | "error"
  progress: number
  error?: string
}

interface CvUploadZoneProps {
  candidateId: string
  onUploadComplete?: (cvId: string) => void
  className?: string
}

const MAX_SIZE_MB = 10
const ACCEPT = ".pdf,.txt"

export function CvUploadZone({ candidateId, onUploadComplete, className }: CvUploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<UploadedFile | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(
    async (raw: File) => {
      if (raw.size > MAX_SIZE_MB * 1024 * 1024) {
        setFile({ name: raw.name, status: "error", progress: 0, error: "File vượt quá 10MB" })
        return
      }

      setFile({ name: raw.name, status: "uploading", progress: 30 })

      const formData = new FormData()
      formData.append("file", raw)

      try {
        // TODO: Replace with real API POST /api/candidates/[id]/cv
        const res = await fetch(`/api/candidates/${candidateId}/cv`, {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? "Tải lên thất bại")
        }

        const data = await res.json()
        setFile({ name: raw.name, status: "done", progress: 100 })
        onUploadComplete?.(data?.data?.id ?? data?.id ?? "")
      } catch (err) {
        setFile({
          name: raw.name,
          status: "error",
          progress: 0,
          error: err instanceof Error ? err.message : "Tải lên thất bại",
        })
      }
    },
    [candidateId, onUploadComplete]
  )

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    uploadFile(files[0])
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const onDragLeave = () => setDragging(false)

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const reset = () => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  if (file) {
    return (
      <div className={cn("rounded-lg border p-4", className)}>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            {file.status === "uploading" && (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Đang tải lên...</span>
              </div>
            )}
            {file.status === "done" && (
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">Tải lên thành công, đang phân tích...</span>
              </div>
            )}
            {file.status === "error" && (
              <div className="flex items-center gap-2 mt-1">
                <AlertCircle className="h-3 w-3 text-destructive" />
                <span className="text-xs text-destructive">{file.error}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={reset} className="shrink-0 h-7 w-7">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {file.status === "uploading" && (
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
        className
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="flex flex-col items-center justify-center py-8 px-4 gap-3 text-center">
        <UploadCloud className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Kéo thả file vào đây</p>
          <p className="text-xs text-muted-foreground mt-0.5">hoặc click để chọn file</p>
        </div>
        <p className="text-xs text-muted-foreground">PDF, TXT — tối đa {MAX_SIZE_MB}MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
