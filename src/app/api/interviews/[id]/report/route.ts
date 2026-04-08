import { NextRequest, NextResponse } from "next/server"
import { generateInterviewReport } from "@/lib/services/interview-ai-service"

interface ReportRequestBody {
  candidateName: string
  jobTitle: string
  questionsAndAnswers: Array<{
    question: string
    answer: string
    score: number
  }>
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReportRequestBody
    const { candidateName, jobTitle, questionsAndAnswers } = body

    if (!candidateName || !questionsAndAnswers?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const report = await generateInterviewReport(
      candidateName,
      jobTitle,
      questionsAndAnswers,
    )

    if (req.signal.aborted) return new Response(null, { status: 499 })

    return NextResponse.json({ report })
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || (error as NodeJS.ErrnoException).code === "ECONNRESET")) {
      return new Response(null, { status: 499 })
    }
    console.error("Report generation error:", error)
    return NextResponse.json(
      { error: "Không thể tạo báo cáo phỏng vấn" },
      { status: 500 },
    )
  }
}
