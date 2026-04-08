import { NextRequest, NextResponse } from "next/server"
import { generateCandidatesForJd } from "@/lib/services/candidate-generator"

/**
 * POST /api/jds/generate-candidates
 * Generate mock candidates for a JD using Gemini AI.
 * Body: { title, department?, description?, count? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, department, description, count } = body

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const candidates = await generateCandidatesForJd({
      jdTitle: title,
      jdDepartment: department,
      jdDescription: description,
      count: count ?? 10,
    })

    return NextResponse.json({ candidates })
  } catch (error) {
    console.error("[generate-candidates] error:", error)
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Không thể tạo danh sách ứng viên", detail: msg },
      { status: 500 },
    )
  }
}
