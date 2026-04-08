import { NextRequest, NextResponse } from "next/server"
import { generateInterviewQuestions } from "@/lib/services/interview-ai-service"
import { MOCK_SOURCING_CANDIDATES, MOCK_JD_TITLE, MOCK_JD_DESCRIPTION } from "@/lib/mock-data/mock-candidates-sourcing"
import { AI_ENGINEER_CANDIDATES, AI_ENGINEER_JD_TITLE, AI_ENGINEER_JD_DESCRIPTION } from "@/lib/mock-data/mock-ai-engineer-sourcing"

/** All mock candidates + JD mapping by ID prefix */
const ALL_CANDIDATES = [...MOCK_SOURCING_CANDIDATES, ...AI_ENGINEER_CANDIDATES]

function getJdForCandidate(id: string) {
  if (id.startsWith("ai-")) {
    return { title: AI_ENGINEER_JD_TITLE, description: AI_ENGINEER_JD_DESCRIPTION }
  }
  return { title: MOCK_JD_TITLE, description: MOCK_JD_DESCRIPTION }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))

    // For dynamically generated candidates, client passes candidate + JD data in body
    let candidate = ALL_CANDIDATES.find((c) => c.id === id)
    let jd = candidate ? getJdForCandidate(id) : null

    if (!candidate && body.candidate) {
      candidate = body.candidate
      jd = { title: body.jdTitle ?? "Vị trí tuyển dụng", description: body.jdDescription ?? "" }
    }

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    if (!jd) jd = getJdForCandidate(id)

    // Build rich CV context from all candidate fields
    const cvContext = [
      `Họ tên: ${candidate.fullName}`,
      `Vị trí hiện tại: ${candidate.currentTitle} tại ${candidate.currentCompany}`,
      `Kinh nghiệm: ${candidate.experienceYears} năm`,
      `Kỹ năng phù hợp JD: ${candidate.matchedSkills.join(", ")}`,
      candidate.missingSkills.length > 0 ? `Kỹ năng còn thiếu: ${candidate.missingSkills.join(", ")}` : null,
      `Trình độ: ${candidate.scoreBreakdown.education.level}`,
      `Ngoại ngữ: ${candidate.scoreBreakdown.language.detected.join(", ")}`,
      `Tóm tắt CV: ${candidate.cvSummary}`,
      `Nhận xét AI: ${candidate.scoreBreakdown.ai.summary}`,
    ].filter(Boolean).join("\n")

    const { greeting, questions } = await generateInterviewQuestions(
      cvContext,
      jd.title,
      jd.description,
      req.signal,
    )

    // Client disconnected while Gemini was generating — don't write to closed socket
    if (req.signal.aborted) {
      return new Response(null, { status: 499 })
    }

    return NextResponse.json({
      interviewId: `interview-${id}`,
      candidateId: id,
      candidateName: candidate.fullName,
      jobTitle: jd.title,
      greeting,
      questions,
      cvSummary: cvContext,
      jdDescription: jd.description,
    })
  } catch (error) {
    // Client disconnected — swallow silently
    if (
      error instanceof Error &&
      (error.name === "AbortError" ||
        (error as NodeJS.ErrnoException).code === "ECONNRESET" ||
        (error as NodeJS.ErrnoException).code === "ABORT_ERR")
    ) {
      return new Response(null, { status: 499 })
    }
    console.error("Interview start error:", error)
    return NextResponse.json(
      { error: "Không thể tạo câu hỏi phỏng vấn" },
      { status: 500 },
    )
  }
}
