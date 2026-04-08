/**
 * AI-powered candidate generator — uses Gemini to create realistic mock candidates
 * based on a JD's title, department, and description. Returns candidates with
 * scoring breakdowns ready for display.
 */

import gemini from "@/lib/gemini"
import type { MockSourcingCandidate } from "@/lib/mock-data/mock-candidates-sourcing"

const PLATFORMS = ["linkedin", "topcv", "vnworks"] as const

/** Generate mock candidates for a given JD using Gemini AI */
export async function generateCandidatesForJd(params: {
  jdTitle: string
  jdDepartment?: string
  jdDescription?: string
  count?: number
}): Promise<MockSourcingCandidate[]> {
  const { jdTitle, jdDepartment, jdDescription, count = 10 } = params

  const prompt = `Bạn là hệ thống AI tuyển dụng của NovaGroup. Hãy tạo ${count} hồ sơ ứng viên mock THỰC TẾ cho vị trí tuyển dụng sau:

Vị trí: ${jdTitle}
${jdDepartment ? `Phòng ban: ${jdDepartment}` : ""}
${jdDescription ? `Mô tả JD:\n${jdDescription}` : ""}

YÊU CẦU:
- Tạo ứng viên đa dạng: từ junior đến senior, từ phù hợp cao đến thấp
- Tên Việt Nam thực tế, công ty Việt Nam thực tế (VinAI, FPT, Shopee VN, Tiki, Zalo, Samsung VN, v.v.)
- Score phân bố: 2-3 người 80+, 3-4 người 60-79, 2-3 người dưới 60
- Mỗi ứng viên cần 5 skills liên quan đến JD (matched + missing)
- Status phân bố: 1-2 shortlisted, 5-6 scored, 1-2 contacted, 1-2 rejected

Trả về JSON array, MỖI phần tử có cấu trúc CHÍNH XÁC sau (KHÔNG thêm field nào khác):
{
  "fullName": "Họ tên tiếng Việt",
  "currentTitle": "Chức danh hiện tại",
  "currentCompany": "Tên công ty",
  "experienceYears": 3,
  "overallScore": 78,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3"],
  "totalSkills": 5,
  "sourcePlatform": "linkedin",
  "status": "scored",
  "cvSummary": "Tóm tắt CV ngắn gọn 1-2 câu",
  "scoreBreakdown": {
    "keyword": { "score": 38, "max": 50 },
    "experience": { "score": 16, "max": 20, "detectedYears": 3 },
    "education": { "score": 8, "max": 10, "level": "Đại học" },
    "language": { "score": 8, "max": 10, "detected": ["Tiếng Anh B2"] },
    "ai": { "score": 8, "max": 10, "summary": "Nhận xét AI ngắn gọn" }
  }
}

QUAN TRỌNG:
- overallScore = keyword.score + experience.score + education.score + language.score + ai.score
- sourcePlatform chỉ dùng: "linkedin", "topcv", hoặc "vnworks"
- status chỉ dùng: "scored", "shortlisted", "rejected", "contacted"
- education.level chỉ dùng: "Cao đẳng", "Đại học", "Thạc sĩ", "Tiến sĩ"
- Trả về THUẦN JSON array, KHÔNG markdown, KHÔNG giải thích`

  const raw = await gemini.generateContent(prompt, { model: "gemini-3.1-flash-lite-preview" })

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = raw.trim()
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
  }

  const parsed: unknown[] = JSON.parse(jsonStr)

  // Transform to MockSourcingCandidate format with generated IDs
  const jdPrefix = jdTitle.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)
  const candidates: MockSourcingCandidate[] = parsed.map((raw: unknown, i: number) => {
    const c = raw as Record<string, unknown>
    const breakdown = c.scoreBreakdown as Record<string, Record<string, unknown>>
    const platform = PLATFORMS.includes(c.sourcePlatform as typeof PLATFORMS[number])
      ? (c.sourcePlatform as typeof PLATFORMS[number])
      : PLATFORMS[i % 3]

    return {
      id: `gen-${jdPrefix}-${i + 1}`,
      fullName: String(c.fullName ?? `Ứng viên ${i + 1}`),
      currentTitle: String(c.currentTitle ?? ""),
      currentCompany: String(c.currentCompany ?? ""),
      experienceYears: Number(c.experienceYears ?? 0),
      overallScore: Number(c.overallScore ?? 0),
      matchedSkills: Array.isArray(c.matchedSkills) ? c.matchedSkills.map(String) : [],
      missingSkills: Array.isArray(c.missingSkills) ? c.missingSkills.map(String) : [],
      totalSkills: Number(c.totalSkills ?? 5),
      sourcePlatform: platform,
      sourceUrl: null,
      status: (["scored", "shortlisted", "rejected", "contacted"].includes(String(c.status))
        ? String(c.status)
        : "scored") as MockSourcingCandidate["status"],
      cvSummary: String(c.cvSummary ?? ""),
      scoreBreakdown: {
        keyword: {
          score: Number(breakdown?.keyword?.score ?? 0),
          max: 50,
        },
        experience: {
          score: Number(breakdown?.experience?.score ?? 0),
          max: 20,
          detectedYears: Number(breakdown?.experience?.detectedYears ?? c.experienceYears ?? 0),
        },
        education: {
          score: Number(breakdown?.education?.score ?? 0),
          max: 10,
          level: String(breakdown?.education?.level ?? "Đại học"),
        },
        language: {
          score: Number(breakdown?.language?.score ?? 0),
          max: 10,
          detected: Array.isArray(breakdown?.language?.detected)
            ? (breakdown.language.detected as string[]).map(String)
            : ["Tiếng Anh B1"],
        },
        ai: {
          score: Number(breakdown?.ai?.score ?? 0),
          max: 10,
          summary: String(breakdown?.ai?.summary ?? ""),
        },
      },
    }
  })

  return candidates
}
