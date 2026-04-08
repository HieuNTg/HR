"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Brain, ExternalLink, ArrowUpDown } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InterviewLoadingOverlay } from "@/components/interview/interview-loading-overlay"
import { SourcingProgressCard } from "@/components/sourcing/sourcing-progress-card"
import {
  MOCK_SOURCING_CANDIDATES,
  MOCK_JD_TITLE,
  MOCK_JD_DEPARTMENT,
  SOURCE_LABELS,
  STATUS_OPTIONS,
  STATUS_LABELS,
  STATUS_COLORS,
  type MockSourcingCandidate,
} from "@/lib/mock-data/mock-candidates-sourcing"
import {
  AI_ENGINEER_CANDIDATES,
  AI_ENGINEER_JD_TITLE,
  AI_ENGINEER_JD_DEPARTMENT,
} from "@/lib/mock-data/mock-ai-engineer-sourcing"
import { useSourcingStore, type JdEntry } from "@/stores/sourcing-store"

/** Static JD tabs + dynamically created ones from sourcing store */
interface JdTab {
  key: string
  title: string
  department: string
  candidates: MockSourcingCandidate[]
  /** Sourcing state (only for dynamic JDs) */
  sourcing?: JdEntry
}

/** Score color badge */
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-green-100 text-green-800 border-green-200"
      : score >= 50
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200"
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border ${color}`}>
      {Math.round(score)}
    </span>
  )
}

type SortKey = "score" | "name" | "experience"

export default function CandidatesSourcingPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [minScore, setMinScore] = useState("ALL")
  const [sort, setSort] = useState<SortKey>("score")

  // Interview loading state
  const [loadingCandidate, setLoadingCandidate] = useState<MockSourcingCandidate | null>(null)

  // Dynamic JDs from sourcing store
  const dynamicJds = useSourcingStore((s) => s.jds)

  // Build tabs: static + dynamic
  const allTabs: JdTab[] = useMemo(() => {
    const staticTabs: JdTab[] = [
      { key: "purchasing", title: MOCK_JD_TITLE, department: MOCK_JD_DEPARTMENT, candidates: MOCK_SOURCING_CANDIDATES },
      { key: "ai-engineer", title: AI_ENGINEER_JD_TITLE, department: AI_ENGINEER_JD_DEPARTMENT, candidates: AI_ENGINEER_CANDIDATES },
    ]
    const dynTabs: JdTab[] = dynamicJds.map((jd) => ({
      key: jd.id,
      title: jd.title,
      department: jd.department,
      candidates: jd.status === "done" ? jd.candidates : jd.candidates.slice(0, jd.scoredCount),
      sourcing: jd,
    }))
    return [...dynTabs, ...staticTabs]
  }, [dynamicJds])

  // Auto-select newest dynamic JD when it exists
  const newestDynamic = dynamicJds[0]
  const defaultTab = newestDynamic ? newestDynamic.id : "purchasing"
  const [activeJd, setActiveJd] = useState(defaultTab)
  // If a new JD was just created (defaultTab changed), auto-switch to it
  const [lastDefaultTab, setLastDefaultTab] = useState(defaultTab)
  if (defaultTab !== lastDefaultTab) {
    setActiveJd(defaultTab)
    setLastDefaultTab(defaultTab)
  }
  const currentTab = allTabs.find((t) => t.key === activeJd) || allTabs[0]

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let results = currentTab.candidates.filter((c) => {
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.currentCompany.toLowerCase().includes(q) ||
        c.currentTitle.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter
      const matchesScore = minScore === "ALL" || c.overallScore >= Number(minScore)
      return matchesSearch && matchesStatus && matchesScore
    })

    // Sort
    results.sort((a, b) => {
      if (sort === "score") return b.overallScore - a.overallScore
      if (sort === "name") return a.fullName.localeCompare(b.fullName, "vi")
      if (sort === "experience") return b.experienceYears - a.experienceYears
      return 0
    })

    return results
  }, [search, statusFilter, minScore, sort, currentTab])

  const handleStartInterview = useCallback((candidate: MockSourcingCandidate) => {
    setLoadingCandidate(candidate)
  }, [])

  const handleLoadingComplete = useCallback(() => {
    if (loadingCandidate) {
      router.push(`/interviews/${loadingCandidate.id}`)
    }
  }, [loadingCandidate, router])

  return (
    <div className="space-y-6">
      {/* Loading overlay */}
      {loadingCandidate && (
        <InterviewLoadingOverlay
          candidateName={loadingCandidate.fullName}
          jobTitle={currentTab.title}
          onComplete={handleLoadingComplete}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            CV Sourcing — {currentTab.candidates.length} ứng viên
          </h1>
          <p className="text-muted-foreground">
            JD: {currentTab.title}{currentTab.department ? ` • ${currentTab.department}` : ""}
          </p>
        </div>
      </div>

      {/* Sourcing progress (for dynamic JDs) */}
      {currentTab.sourcing && currentTab.sourcing.status !== "done" && (
        <SourcingProgressCard
          status={currentTab.sourcing.status as "sourcing" | "scoring" | "done" | "error"}
          title={currentTab.title}
          scoredCount={currentTab.sourcing.scoredCount}
          totalCount={currentTab.sourcing.candidates.length}
          progress={currentTab.sourcing.scoringProgress}
        />
      )}

      {/* JD Tabs */}
      <div className="flex gap-2 flex-wrap">
        {allTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeJd === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => { setActiveJd(tab.key); setSearch(""); setStatusFilter("ALL"); setMinScore("ALL") }}
          >
            {tab.title}
            {tab.sourcing && tab.sourcing.status !== "done" ? (
              <span className="ml-1.5 text-xs opacity-70">⏳</span>
            ) : (
              <span className="ml-1.5 text-xs opacity-70">({tab.candidates.length})</span>
            )}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, công ty, chức danh..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Score filter */}
            <Select value={minScore} onValueChange={(v) => setMinScore(v ?? "ALL")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Score ≥" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All scores</SelectItem>
                <SelectItem value="50">≥ 50</SelectItem>
                <SelectItem value="60">≥ 60</SelectItem>
                <SelectItem value="70">≥ 70</SelectItem>
                <SelectItem value="80">≥ 80</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[170px]">
                <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score cao → thấp</SelectItem>
                <SelectItem value="name">Tên A-Z</SelectItem>
                <SelectItem value="experience">Kinh nghiệm</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <p className="text-sm">Không tìm thấy ứng viên nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Ứng viên</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Nguồn</TableHead>
                  <TableHead className="text-center">Skills</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c, idx) => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => router.push(`/candidates/${c.id}`)}
                        className="text-left hover:underline"
                      >
                        <span className="text-sm font-medium">{c.fullName}</span>
                        <p className="text-xs text-muted-foreground">
                          {c.currentTitle}
                          {c.currentCompany ? ` @ ${c.currentCompany}` : ""}
                        </p>
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge score={c.overallScore} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_LABELS[c.sourcePlatform] || c.sourcePlatform}
                        </Badge>
                        {c.sourceUrl && (
                          <a
                            href={c.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <span className="text-green-600 font-medium">{c.matchedSkills.length}</span>
                      <span className="text-muted-foreground">/{c.totalSkills}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleStartInterview(c)}
                      >
                        <Brain className="mr-1.5 h-3.5 w-3.5" />
                        AI Phỏng vấn
                      </Button>
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
