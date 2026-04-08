import gemini from "@/lib/gemini"

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

  return gemini.generateJSON<{ greeting: string; questions: GeneratedQuestion[] }>(prompt, {
    model: "gemini-3.1-flash-lite-preview",
    temperature: 0.7,
    maxOutputTokens: 2000,
  })
}

export function buildLiveSystemInstruction(params: {
  candidateName: string
  jobTitle: string
  questions: GeneratedQuestion[]
}): string {
  const { candidateName, jobTitle, questions } = params
  return `${SYSTEM_CONTEXT}
Bạn đang phỏng vấn ${candidateName} cho vị trí ${jobTitle}.

Hãy tiến hành phỏng vấn tự nhiên theo thứ tự các câu hỏi sau:
${questions.map((q, i) => `${i + 1}. ${q.questionText}`).join("\n")}

Quy tắc:
- Bắt đầu bằng lời chào ngắn gọn (1-2 câu), nhắc tên ứng viên và vị trí
- Hỏi từng câu một theo thứ tự, chờ ứng viên trả lời xong mới tiếp
- Phản hồi ngắn gọn (1-2 câu) sau mỗi câu trả lời, rồi chuyển sang câu tiếp theo
- Sau câu cuối, cảm ơn ứng viên và kết thúc buổi phỏng vấn
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

  return gemini.generateJSON<AnswerEvaluation>(prompt, {
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

  return gemini.generateContent(prompt, {
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

  return gemini.generateJSON<InterviewReportData>(prompt, {
    model: "gemini-3.1-flash-lite-preview",
    temperature: 0.3,
    maxOutputTokens: 1500,
  })
}
