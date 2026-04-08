import { NextRequest, NextResponse } from "next/server"
import { evaluateAnswer } from "@/lib/services/interview-ai-service"
import type { GeneratedQuestion } from "@/lib/services/interview-ai-service"

interface TranscriptEntry {
  role: "ai" | "candidate"
  text: string
}

interface RequestBody {
  transcripts: TranscriptEntry[]
  questions: GeneratedQuestion[]
  candidateName: string | null
  jobTitle: string | null
}

/**
 * Extract candidate answers from the transcript by grouping candidate speech
 * between AI turns. Returns one answer string per question (by order).
 */
function extractAnswers(transcripts: TranscriptEntry[], questionCount: number): string[] {
  const answers: string[] = []
  let currentAnswer: string[] = []
  let seenFirstAi = false

  for (const entry of transcripts) {
    if (entry.role === "ai") {
      if (seenFirstAi && currentAnswer.length > 0) {
        answers.push(currentAnswer.join(" ").trim())
        currentAnswer = []
      }
      seenFirstAi = true
    } else {
      if (seenFirstAi) currentAnswer.push(entry.text)
    }
  }
  if (currentAnswer.length > 0) {
    answers.push(currentAnswer.join(" ").trim())
  }

  // Pad with empty strings if fewer answers than questions
  while (answers.length < questionCount) answers.push("")
  return answers.slice(0, questionCount)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await params // consume param
    const body = (await req.json()) as RequestBody
    const { transcripts, questions, jobTitle } = body

    if (!transcripts?.length || !questions?.length) {
      return NextResponse.json({ error: "Missing transcripts or questions" }, { status: 400 })
    }

    const answers = extractAnswers(transcripts, questions.length)
    const jt = jobTitle ?? "Vị trí tuyển dụng"

    const evaluations = await Promise.all(
      questions.map(async (q, i) => {
        const answer = answers[i] || "(Không có câu trả lời)"
        const evaluation = await evaluateAnswer(q.questionText, answer, jt)
        return { question: q.questionText, answer, evaluation }
      }),
    )

    return NextResponse.json({ questionsAndAnswers: evaluations })
  } catch (error) {
    console.error("save-live-results error:", error)
    return NextResponse.json({ error: "Không thể xử lý kết quả phỏng vấn" }, { status: 500 })
  }
}
