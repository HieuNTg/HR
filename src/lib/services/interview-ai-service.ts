import getGemini from "@/lib/gemini"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GeneratedQuestion {
  questionText: string
  category: "technical" | "experience" | "behavioral" | "situational"
  difficulty: "EASY" | "MEDIUM" | "HARD"
}

export interface AnswerEvaluation {
  score: number // 0-10
  feedback: string // Vietnamese feedback shown to candidate
  strengths: string[]
  improvements: string[]
}

export interface InterviewReportData {
  overallScore: number // 0-10
  scoreTechnical: number
  scoreExperience: number
  scoreCommunication: number
  scoreProblemSolving: number
  attitude: string // e.g. "Tích cực", "Trung lập", "Tiêu cực"
  recommendation: "STRONGLY_RECOMMEND" | "RECOMMEND" | "CONSIDER" | "REJECT"
  recommendationReason: string
  strengths: string[]
  weaknesses: string[]
}

// ─── Prompts ────────────────────────────────────────────────────────────────

const SYSTEM_CONTEXT = `Bạn là trợ lý tuyển dụng AI của NovaGroup, chuyên phỏng vấn sơ bộ ứng viên bằng tiếng Việt.
Phong cách: chuyên nghiệp, thân thiện, ngắn gọn. Luôn dùng "bạn" khi xưng hô.`

export async function generateInterviewQuestions(
  cvSummary: string,
  jobTitle: string,
  jdDescription?: string,
  signal?: AbortSignal,
): Promise<{ greeting: string; questions: GeneratedQuestion[] }> {
  const prompt = `${SYSTEM_CONTEXT}

Dựa trên thông tin CV ứng viên và mô tả công việc (JD), tạo lời chào + 5 câu hỏi phỏng vấn cá nhân hóa.

**Vị trí:** ${jobTitle}
${jdDescription ? `\n**Mô tả công việc (JD):**\n${jdDescription}\n` : ""}
**Thông tin CV ứng viên:**
${cvSummary}

Yêu cầu:
- Lời chào ngắn gọn (2-3 câu): nhắc tên ứng viên, vị trí tuyển dụng, 1 điểm nổi bật từ CV
- 5 câu hỏi phỏng vấn cá nhân hóa dựa trên BOTH CV và JD:
  • 1 technical: hỏi sâu về kỹ năng/công cụ ứng viên có trong CV liên quan đến yêu cầu JD
  • 2 experience: hỏi về kinh nghiệm thực tế, thành tựu ở công ty trước đối chiếu với nhiệm vụ trong JD
  • 1 behavioral: hỏi tình huống ứng xử liên quan đến môi trường làm việc mô tả trong JD
  • 1 situational: đặt giả định tình huống thực tế của vị trí này tại NovaGroup
- Nếu CV thiếu kỹ năng mà JD yêu cầu, hỏi ứng viên về khả năng/kế hoạch bổ sung
- Độ khó tăng dần: EASY → MEDIUM → HARD

Trả về JSON:
{
  "greeting": "Chào bạn [tên], tôi là trợ lý tuyển dụng của NovaGroup...",
  "questions": [
    { "questionText": "...", "category": "technical|experience|behavioral|situational", "difficulty": "EASY|MEDIUM|HARD" }
  ]
}`

  return getGemini().generateJSON<{ greeting: string; questions: GeneratedQuestion[] }>(prompt, {
    model: "gemini-3.1-flash-lite-preview",
    temperature: 0.7,
    maxOutputTokens: 2000,
    signal,
  })
}

/** Fixed questions used during live (voice/video) interviews */
export const LIVE_INTERVIEW_QUESTIONS: GeneratedQuestion[] = [
  { questionText: "Mời bạn tự giới thiệu bản thân (tên, kinh nghiệm tổng quát, điểm nổi bật)", category: "behavioral", difficulty: "EASY" },
  { questionText: "Hãy chia sẻ về một kinh nghiệm hoặc dự án nổi bật nhất mà bạn đã đề cập trong CV", category: "experience", difficulty: "MEDIUM" },
  { questionText: "Bạn mong muốn môi trường làm việc như thế nào và mức lương kỳ vọng của bạn là bao nhiêu?", category: "behavioral", difficulty: "EASY" },
]

export function buildLiveSystemInstruction(params: {
  candidateName: string
  jobTitle: string
  cvSummary?: string
  jdDescription?: string
}): string {
  const { candidateName, jobTitle, cvSummary, jdDescription } = params

  const cvBlock = cvSummary ? `\n\n**Thông tin CV ứng viên:**\n${cvSummary}` : ""
  const jdBlock = jdDescription ? `\n\n**Mô tả công việc (JD):**\n${jdDescription}` : ""

  return `${SYSTEM_CONTEXT}
Bạn đang phỏng vấn ${candidateName} cho vị trí ${jobTitle}.${cvBlock}${jdBlock}

Hãy tiến hành phỏng vấn theo đúng 4 bước sau:
1. Giới thiệu: Chào ứng viên, nhắc tên và vị trí ứng tuyển, đề cập 1 điểm nổi bật từ CV (nếu có). Mời ứng viên tự giới thiệu bản thân.
2. Kinh nghiệm trong CV: Hỏi về một kinh nghiệm hoặc dự án nổi bật nhất mà ứng viên đã đề cập trong CV, liên hệ với yêu cầu JD.
3. Mong muốn về môi trường làm việc và lương: Hỏi ứng viên mong muốn môi trường làm việc như thế nào và mức lương kỳ vọng.
4. Kết thúc: Cảm ơn ứng viên đã tham gia buổi phỏng vấn, thông báo kết quả sẽ được gửi qua email trong thời gian sớm nhất.

Quy tắc:
- Ngay khi nhận được bất kỳ âm thanh nào từ ứng viên (kể cả "xin chào"), hãy BẮT ĐẦU NGAY bằng lời chào cá nhân hóa (2-3 câu): nhắc tên ứng viên, vị trí ứng tuyển, và nhận xét tích cực về 1 điểm nổi bật từ CV
- Đi qua đúng 4 bước theo thứ tự, chờ ứng viên trả lời xong mới chuyển bước tiếp theo
- Phản hồi ngắn gọn (1 câu) sau mỗi câu trả lời để thể hiện sự lắng nghe, rồi chuyển sang bước tiếp
- Ở bước 4, sau khi nói lời cảm ơn và thông báo kết quả qua email, kết thúc buổi phỏng vấn
- Giọng thân thiện, chuyên nghiệp, luôn dùng tiếng Việt`
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  jobTitle: string,
): Promise<AnswerEvaluation> {
  const prompt = `${SYSTEM_CONTEXT}

Đánh giá câu trả lời phỏng vấn sau cho vị trí "${jobTitle}".

**Câu hỏi:** ${question}
**Câu trả lời:** ${answer}

Chấm điểm 0-10 và đưa ra nhận xét ngắn bằng tiếng Việt.

Trả về JSON:
{
  "score": 8,
  "feedback": "Nhận xét ngắn gọn bằng tiếng Việt...",
  "strengths": ["điểm mạnh 1"],
  "improvements": ["cần cải thiện 1"]
}`

  return getGemini().generateJSON<AnswerEvaluation>(prompt, {
    model: "gemini-3.1-flash-lite-preview",
    temperature: 0.3,
    maxOutputTokens: 1000,
  })
}

export async function generateAIResponse(
  question: string,
  answer: string,
  evaluation: AnswerEvaluation,
  nextQuestion: string | null,
): Promise<string> {
  const prompt = `${SYSTEM_CONTEXT}

Ứng viên vừa trả lời câu hỏi phỏng vấn. Hãy phản hồi ngắn gọn (2-3 câu) rồi chuyển sang câu hỏi tiếp theo.

**Câu hỏi vừa hỏi:** ${question}
**Câu trả lời:** ${answer}
**Điểm đánh giá:** ${evaluation.score}/10
**Nhận xét nội bộ:** ${evaluation.feedback}

${nextQuestion ? `**Câu hỏi tiếp theo cần hỏi:** ${nextQuestion}` : "Đây là câu hỏi cuối cùng. Cảm ơn ứng viên và kết thúc buổi phỏng vấn."}

Yêu cầu:
- Phản hồi tích cực, nhận xét ngắn về câu trả lời (KHÔNG nói điểm số)
- Nếu có câu tiếp, chuyển sang tự nhiên
- Nếu là câu cuối, cảm ơn và nói sẽ gửi kết quả sau
- Giọng văn thân thiện, chuyên nghiệp
- CHỈ trả về text thuần, KHÔNG JSON`

  return getGemini().generateContent(prompt, {
    model: "gemini-3.1-flash-lite-preview",
    temperature: 0.7,
    maxOutputTokens: 500,
  })
}

export async function generateInterviewReport(
  candidateName: string,
  jobTitle: string,
  questionsAndAnswers: Array<{ question: string; answer: string; score: number }>,
): Promise<InterviewReportData> {
  const qaText = questionsAndAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}\nScore: ${qa.score}/10`)
    .join("\n\n")

  const prompt = `${SYSTEM_CONTEXT}

Tạo báo cáo phỏng vấn tổng hợp cho ứng viên.

**Ứng viên:** ${candidateName}
**Vị trí:** ${jobTitle}

**Nội dung phỏng vấn:**
${qaText}

Đánh giá tổng quan và đưa ra khuyến nghị. Trả về JSON:
{
  "overallScore": 7.5,
  "scoreTechnical": 8,
  "scoreExperience": 7,
  "scoreCommunication": 8,
  "scoreProblemSolving": 7,
  "attitude": "Tích cực",
  "recommendation": "STRONGLY_RECOMMEND|RECOMMEND|CONSIDER|REJECT",
  "recommendationReason": "Lý do ngắn gọn bằng tiếng Việt...",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "weaknesses": ["điểm yếu 1"]
}`

  return getGemini().generateJSON<InterviewReportData>(prompt, {
    model: "gemini-3.1-flash-lite-preview",
    temperature: 0.3,
    maxOutputTokens: 1500,
  })
}
