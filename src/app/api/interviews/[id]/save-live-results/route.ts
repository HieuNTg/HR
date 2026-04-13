import { NextRequest, NextResponse } from "next/server"
import {
  evaluateAnswer,
  generateReportFromAudio,
  type GeneratedQuestion,
  type InterviewReportData,
  type AnswerEvaluation,
} from "@/lib/services/interview-ai-service"
import getGemini from "@/lib/gemini"

export const runtime = "nodejs"
// Audio uploads can push us past the default route body limit + processing time.
export const maxDuration = 180

interface TranscriptEntry {
  role: "ai" | "candidate"
  text: string
}

interface MetadataBody {
  transcripts: TranscriptEntry[]
  questions: GeneratedQuestion[]
  candidateName: string | null
  jobTitle: string | null
}

/**
 * Transcript-only fallback path (no audio provided). Kept so legacy clients that
 * still send JSON keep working. Extracts candidate answers by grouping speech
 * between AI turns.
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
  if (currentAnswer.length > 0) answers.push(currentAnswer.join(" ").trim())

  while (answers.length < questionCount) answers.push("")
  return answers.slice(0, questionCount)
}

async function handleTranscriptOnly(body: MetadataBody) {
  const { transcripts, questions, jobTitle } = body
  const answers = extractAnswers(transcripts, questions.length)
  const jt = jobTitle ?? "Vị trí tuyển dụng"

  const settled = await Promise.allSettled(
    questions.map(async (q, i) => {
      const answer = answers[i] || "(Không có câu trả lời)"
      const evaluation = await evaluateAnswer(q.questionText, answer, jt)
      return { question: q.questionText, answer, evaluation }
    }),
  )

  const evaluations = settled.map((result, i) => {
    if (result.status === "fulfilled") return result.value
    console.warn(`[save-live-results] evaluation failed for question ${i}:`, (result as PromiseRejectedResult).reason)
    return {
      question: questions[i].questionText,
      answer: answers[i] || "(Không có câu trả lời)",
      evaluation: { score: 0, feedback: "Không thể đánh giá", strengths: [], improvements: [] } as AnswerEvaluation,
    }
  })

  return { questionsAndAnswers: evaluations, report: null as InterviewReportData | null }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await params

    const contentType = req.headers.get("content-type") ?? ""

    // ── Branch 1: FormData with audio (audio-primary path, default) ──────
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const audioFile = form.get("audio")
      const metaRaw = form.get("metadata")
      if (typeof metaRaw !== "string") {
        return NextResponse.json({ error: "Missing metadata field" }, { status: 400 })
      }
      const meta = JSON.parse(metaRaw) as MetadataBody
      if (!meta.questions?.length) {
        return NextResponse.json({ error: "Missing questions" }, { status: 400 })
      }

      // No audio blob → fall back to transcript-only eval
      if (!(audioFile instanceof Blob) || audioFile.size === 0) {
        console.warn("[save-live-results] FormData without audio — transcript-only fallback")
        const result = await handleTranscriptOnly(meta)
        return NextResponse.json(result)
      }

      const mimeType = audioFile.type || "audio/webm"
      console.log(`[save-live-results] uploading audio: ${audioFile.size} bytes, ${mimeType}`)

      const uploaded = await getGemini().uploadFile(audioFile, mimeType, {
        displayName: `interview-${Date.now()}.webm`,
        signal: req.signal,
      })
      console.log(`[save-live-results] upload ok: ${uploaded.uri}`)

      const { questionsAndAnswers, report } = await generateReportFromAudio({
        audio: { uri: uploaded.uri, mimeType: uploaded.mimeType },
        questions: meta.questions,
        candidateName: meta.candidateName ?? "Ứng viên",
        jobTitle: meta.jobTitle ?? "Vị trí tuyển dụng",
        signal: req.signal,
      })

      return NextResponse.json({ questionsAndAnswers, report })
    }

    // ── Branch 2: legacy JSON (transcript-only) ──────────────────────────
    const body = (await req.json()) as MetadataBody
    if (!body.transcripts?.length || !body.questions?.length) {
      return NextResponse.json({ error: "Missing transcripts or questions" }, { status: 400 })
    }
    const result = await handleTranscriptOnly(body)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new Response(null, { status: 499 })
    }
    console.error("save-live-results error:", error)
    const msg = error instanceof Error ? error.message : "Không thể xử lý kết quả phỏng vấn"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
