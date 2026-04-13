import { NextRequest, NextResponse } from "next/server"
import { evaluateAnswer, generateAIResponse } from "@/lib/services/interview-ai-service"
import type { AnswerEvaluation } from "@/lib/services/interview-ai-service"

interface ChatRequestBody {
  message: string
  currentQuestion: string
  nextQuestion: string | null
  jobTitle: string
}

async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i <= maxRetries; i++) {
    try { return await fn() }
    catch (e) {
      lastError = e
      if (i < maxRetries) await new Promise(r => setTimeout(r, 1000 * 2 ** i))
    }
  }
  throw lastError
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody
    const { message, currentQuestion, nextQuestion, jobTitle } = body

    if (!message || !currentQuestion) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Evaluate with retry + graceful fallback
    const evaluation: AnswerEvaluation = await retryAsync(
      () => evaluateAnswer(currentQuestion, message, jobTitle),
    ).catch(() => ({
      score: 5,
      feedback: "Không thể đánh giá tự động.",
      strengths: [],
      improvements: [],
    }))

    if (req.signal.aborted) return new Response(null, { status: 499 })

    // Generate AI response with retry + graceful fallback
    const aiResponse: string = await retryAsync(
      () => generateAIResponse(currentQuestion, message, evaluation, nextQuestion),
    ).catch(() =>
      nextQuestion
        ? "Cảm ơn bạn đã chia sẻ. Hãy chuyển sang câu hỏi tiếp theo."
        : "Cảm ơn bạn đã tham gia buổi phỏng vấn. Kết quả sẽ được gửi qua email.",
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
