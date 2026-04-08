/**
 * Mock data for CV Sourcing demo — 8 candidates for "AI Engineer" at NovaGroup.
 * Simulates crawled CVs from LinkedIn, TopCV, VNWorks with match scores.
 */

import type { MockSourcingCandidate } from "./mock-candidates-sourcing"

export const AI_ENGINEER_JD_TITLE = "AI Engineer"
export const AI_ENGINEER_JD_DEPARTMENT = "Phòng Công nghệ - NovaGroup"

/** Full JD description — used by AI to generate personalized interview questions */
export const AI_ENGINEER_JD_DESCRIPTION = `Vị trí: AI Engineer — Phòng Công nghệ, NovaGroup

Mô tả công việc:
- Nghiên cứu, phát triển và triển khai các mô hình AI/ML phục vụ nghiệp vụ (recommendation, forecasting, NLP, computer vision)
- Xây dựng pipeline dữ liệu (ETL) và hệ thống training/serving model trên cloud (GCP/AWS)
- Fine-tune và tích hợp LLM (GPT, Claude, Gemini) vào sản phẩm nội bộ
- Phối hợp với Product Manager và Backend Engineer để đưa model vào production
- Đánh giá, benchmark và cải tiến hiệu năng model liên tục
- Viết tài liệu kỹ thuật, chia sẻ kiến thức AI trong team

Yêu cầu:
- Tốt nghiệp Đại học trở lên ngành Khoa học Máy tính, Toán ứng dụng, AI/ML hoặc tương đương
- Tối thiểu 2 năm kinh nghiệm phát triển AI/ML trong production environment
- Thành thạo Python, PyTorch hoặc TensorFlow; có kinh nghiệm với LLM/RAG/prompt engineering
- Hiểu biết về MLOps: Docker, Kubernetes, CI/CD cho ML pipeline
- Kinh nghiệm xử lý dữ liệu lớn với Spark, Pandas, SQL
- Tiếng Anh đọc hiểu tài liệu kỹ thuật tốt (đa số paper và docs bằng tiếng Anh)
- Ưu tiên: có publication hoặc đóng góp open-source trong lĩnh vực AI

Quyền lợi:
- Lương 25-50 triệu (tùy kinh nghiệm) + thưởng KPI + RSU
- GPU cluster nội bộ cho nghiên cứu, budget conference/training hàng năm
- Bảo hiểm sức khỏe NovaGroup, 18 ngày phép/năm
- Hybrid working 3 ngày office / 2 ngày remote`

export const AI_ENGINEER_CANDIDATES: MockSourcingCandidate[] = [
  {
    id: "ai-1",
    fullName: "Nguyễn Hoàng Khoa",
    currentTitle: "Senior AI Engineer",
    currentCompany: "VinAI Research",
    experienceYears: 4,
    overallScore: 92,
    matchedSkills: ["PyTorch", "LLM/RAG", "MLOps", "Python", "Docker/K8s"],
    missingSkills: [],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/hoangkhoa-nguyen",
    status: "shortlisted",
    cvSummary: "4 năm AI research & engineering tại VinAI, 2 paper NeurIPS, xây dựng hệ thống NLP serving 10M requests/day.",
    scoreBreakdown: {
      keyword: { score: 48, max: 50 },
      experience: { score: 18, max: 20, detectedYears: 4 },
      education: { score: 10, max: 10, level: "Thạc sĩ" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh C1"] },
      ai: { score: 8, max: 10, summary: "Profile xuất sắc, có publication và kinh nghiệm production AI. Top candidate." },
    },
  },
  {
    id: "ai-2",
    fullName: "Trần Minh Đức",
    currentTitle: "ML Engineer",
    currentCompany: "Zalo AI (VNG)",
    experienceYears: 3,
    overallScore: 85,
    matchedSkills: ["PyTorch", "LLM/RAG", "Python", "Docker/K8s"],
    missingSkills: ["Spark/Big Data"],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/minhduc-tran-ml",
    status: "shortlisted",
    cvSummary: "3 năm ML Engineer tại Zalo, chuyên NLP/ASR, deploy model phục vụ 50M users. Contributor Hugging Face.",
    scoreBreakdown: {
      keyword: { score: 44, max: 50 },
      experience: { score: 16, max: 20, detectedYears: 3 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh B2"] },
      ai: { score: 9, max: 10, summary: "Kinh nghiệm NLP production mạnh, open-source contributor là điểm cộng lớn." },
    },
  },
  {
    id: "ai-3",
    fullName: "Phạm Thị Lan Anh",
    currentTitle: "Data Scientist",
    currentCompany: "Shopee Vietnam",
    experienceYears: 3,
    overallScore: 78,
    matchedSkills: ["Python", "PyTorch", "Spark/Big Data", "Docker/K8s"],
    missingSkills: ["LLM/RAG"],
    totalSkills: 5,
    sourcePlatform: "topcv",
    sourceUrl: "https://topcv.vn/xem-cv/lananh-pham",
    status: "scored",
    cvSummary: "3 năm Data Science tại Shopee, chuyên recommendation system và fraud detection, xử lý data PB-scale.",
    scoreBreakdown: {
      keyword: { score: 38, max: 50 },
      experience: { score: 16, max: 20, detectedYears: 3 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh B2"] },
      ai: { score: 8, max: 10, summary: "Nền tảng ML tốt, cần bổ sung kinh nghiệm LLM/GenAI." },
    },
  },
  {
    id: "ai-4",
    fullName: "Lê Quang Huy",
    currentTitle: "AI/ML Lead",
    currentCompany: "FPT Smart Cloud",
    experienceYears: 6,
    overallScore: 90,
    matchedSkills: ["PyTorch", "LLM/RAG", "MLOps", "Python", "Docker/K8s"],
    missingSkills: [],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/quanghuy-le-ai",
    status: "contacted",
    cvSummary: "6 năm AI, lead team 8 người tại FPT Smart Cloud, xây dựng FPT.AI chatbot platform phục vụ 200+ doanh nghiệp.",
    scoreBreakdown: {
      keyword: { score: 46, max: 50 },
      experience: { score: 20, max: 20, detectedYears: 6 },
      education: { score: 10, max: 10, level: "Thạc sĩ" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh C1"] },
      ai: { score: 6, max: 10, summary: "Profile rất mạnh nhưng salary expectation có thể vượt budget. Overqualified?" },
    },
  },
  {
    id: "ai-5",
    fullName: "Đỗ Thanh Tùng",
    currentTitle: "Junior ML Engineer",
    currentCompany: "Cốc Cốc",
    experienceYears: 1.5,
    overallScore: 65,
    matchedSkills: ["Python", "PyTorch"],
    missingSkills: ["LLM/RAG", "MLOps", "Docker/K8s"],
    totalSkills: 5,
    sourcePlatform: "topcv",
    sourceUrl: "https://topcv.vn/xem-cv/thanhtung-do",
    status: "scored",
    cvSummary: "1.5 năm ML tại Cốc Cốc, chuyên search ranking model. Tốt nghiệp loại giỏi HUST.",
    scoreBreakdown: {
      keyword: { score: 25, max: 50 },
      experience: { score: 10, max: 20, detectedYears: 1.5 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 6, max: 10, detected: ["Tiếng Anh B1"] },
      ai: { score: 6, max: 10, summary: "Junior nhưng nền tảng tốt từ HUST, cần mentor thêm về MLOps và LLM." },
    },
  },
  {
    id: "ai-6",
    fullName: "Vũ Thị Hồng Ngọc",
    currentTitle: "Computer Vision Engineer",
    currentCompany: "Samsung Vietnam R&D",
    experienceYears: 4,
    overallScore: 82,
    matchedSkills: ["PyTorch", "Python", "Docker/K8s", "MLOps"],
    missingSkills: ["LLM/RAG"],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/hongngoc-vu-cv",
    status: "scored",
    cvSummary: "4 năm CV Engineer tại Samsung R&D, chuyên object detection và on-device AI. 1 patent US đã file.",
    scoreBreakdown: {
      keyword: { score: 40, max: 50 },
      experience: { score: 18, max: 20, detectedYears: 4 },
      education: { score: 10, max: 10, level: "Thạc sĩ" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh C1", "Tiếng Hàn TOPIK3"] },
      ai: { score: 6, max: 10, summary: "Mạnh CV/on-device, cần transition sang NLP/LLM nhưng nền tảng rất solid." },
    },
  },
  {
    id: "ai-7",
    fullName: "Hoàng Văn Phúc",
    currentTitle: "Backend Developer",
    currentCompany: "Tiki",
    experienceYears: 4,
    overallScore: 52,
    matchedSkills: ["Python", "Docker/K8s"],
    missingSkills: ["PyTorch", "LLM/RAG", "MLOps"],
    totalSkills: 5,
    sourcePlatform: "vnworks",
    sourceUrl: "https://vnworks.vn/cv/vanphuc-hoang",
    status: "rejected",
    cvSummary: "4 năm Backend tại Tiki, muốn chuyển sang AI. Đang tự học ML qua Coursera.",
    scoreBreakdown: {
      keyword: { score: 18, max: 50 },
      experience: { score: 8, max: 20, detectedYears: 4 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 6, max: 10, detected: ["Tiếng Anh B2"] },
      ai: { score: 2, max: 10, summary: "Backend dev muốn chuyển AI, chưa đủ kinh nghiệm ML thực tế." },
    },
  },
  {
    id: "ai-8",
    fullName: "Nguyễn Thị Mai Phương",
    currentTitle: "AI Research Engineer",
    currentCompany: "Trusting Social",
    experienceYears: 3,
    overallScore: 86,
    matchedSkills: ["PyTorch", "LLM/RAG", "Python", "Spark/Big Data"],
    missingSkills: ["Docker/K8s"],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/maiphuong-nguyen-ai",
    status: "scored",
    cvSummary: "3 năm AI tại Trusting Social, chuyên credit scoring ML và LLM-based document extraction. 1 paper AAAI.",
    scoreBreakdown: {
      keyword: { score: 42, max: 50 },
      experience: { score: 16, max: 20, detectedYears: 3 },
      education: { score: 10, max: 10, level: "Thạc sĩ" },
      language: { score: 10, max: 10, detected: ["Tiếng Anh C1"] },
      ai: { score: 8, max: 10, summary: "Research + engineering balance tốt, paper AAAI là điểm sáng. Cần bổ sung DevOps." },
    },
  },
]
