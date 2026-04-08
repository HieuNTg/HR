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

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Report generation error:", error)
    return NextResponse.json(
      { error: "Không thể tạo báo cáo phỏng vấn" },
      { status: 500 },
    )
  }
}
