import { NextRequest, NextResponse } from "next/server"
import { evaluateAnswer, generateAIResponse } from "@/lib/services/interview-ai-service"

interface ChatRequestBody {
  message: string
  currentQuestion: string
  nextQuestion: string | null
  jobTitle: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody
    const { message, currentQuestion, nextQuestion, jobTitle } = body

    if (!message || !currentQuestion) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Evaluate the answer
    const evaluation = await evaluateAnswer(currentQuestion, message, jobTitle)

    // Generate AI spoken response (feedback + transition to next question)
    const aiResponse = await generateAIResponse(
      currentQuestion,
      message,
      evaluation,
      nextQuestion,
    )

    if (req.signal.aborted) return new Response(null, { status: 499 })

    return NextResponse.json({
      aiResponse,
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      },
    })
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || (error as NodeJS.ErrnoException).code === "ECONNRESET")) {
      return new Response(null, { status: 499 })
    }
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: "Không thể xử lý câu trả lời" },
      { status: 500 },
    )
  }
}
