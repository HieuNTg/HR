/**
 * Mock data for CV Sourcing demo — 12 candidates for "Nhân viên Mua hàng" at NovaGroup.
 * Simulates crawled CVs from LinkedIn, TopCV, VNWorks with match scores.
 */

export interface MockSourcingCandidate {
  id: string
  fullName: string
  currentTitle: string
  currentCompany: string
  experienceYears: number
  overallScore: number
  matchedSkills: string[]
  missingSkills: string[]
  totalSkills: number
  sourcePlatform: "linkedin" | "topcv" | "vnworks" | "upload"
  sourceUrl: string | null
  status: "scored" | "shortlisted" | "rejected" | "contacted"
  cvSummary: string
  scoreBreakdown: {
    keyword: { score: number; max: number }
    experience: { score: number; max: number; detectedYears: number }
    education: { score: number; max: number; level: string }
    language: { score: number; max: number; detected: string[] }
    ai: { score: number; max: number; summary: string }
  }
}

export const MOCK_JD_TITLE = "Nhân viên Mua hàng"
export const MOCK_JD_DEPARTMENT = "Phòng Mua hàng - NovaGroup"

/** Full JD description — used by AI to generate personalized interview questions */
export const MOCK_JD_DESCRIPTION = `Vị trí: Nhân viên Mua hàng — Phòng Mua hàng, NovaGroup

Mô tả công việc:
- Tìm kiếm, đánh giá và phát triển nguồn nhà cung cấp (NCC) trong và ngoài nước
- Đàm phán giá cả, điều khoản hợp đồng và điều kiện thanh toán với NCC
- Lập và theo dõi đơn đặt hàng (PO), đảm bảo giao hàng đúng tiến độ
- Phối hợp với bộ phận Kho, QC, Kế toán để xử lý nhập hàng và công nợ
- Theo dõi biến động giá thị trường, đề xuất phương án tối ưu chi phí
- Quản lý hồ sơ NCC, hợp đồng, chứng từ mua hàng trên hệ thống ERP

Yêu cầu:
- Tốt nghiệp Đại học chuyên ngành Quản trị kinh doanh, Thương mại, Logistics hoặc tương đương
- Tối thiểu 2 năm kinh nghiệm mua hàng (ưu tiên ngành F&B, FMCG, Bán lẻ)
- Thành thạo Excel, có kinh nghiệm sử dụng SAP MM hoặc ERP tương đương
- Kỹ năng đàm phán, giao tiếp tốt; chịu được áp lực công việc
- Tiếng Anh giao tiếp (đọc hiểu hợp đồng, email với NCC nước ngoài)
- Ưu tiên: có mối quan hệ với NCC ngành thực phẩm/FMCG

Quyền lợi:
- Lương 15-22 triệu (tùy kinh nghiệm) + thưởng KPI
- Bảo hiểm sức khỏe NovaGroup, 15 ngày phép/năm
- Môi trường chuyên nghiệp, cơ hội thăng tiến lên Trưởng nhóm Mua hàng`

export const SOURCE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  topcv: "TopCV",
  vnworks: "VNWorks",
  upload: "Upload",
}

export const STATUS_OPTIONS = ["scored", "shortlisted", "rejected", "contacted"] as const

export const STATUS_LABELS: Record<string, string> = {
  scored: "Đã chấm",
  shortlisted: "Đã chọn",
  rejected: "Loại",
  contacted: "Đã liên hệ",
}

export const STATUS_COLORS: Record<string, string> = {
  scored: "bg-gray-100 text-gray-700",
  shortlisted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  contacted: "bg-blue-100 text-blue-700",
}

export const MOCK_SOURCING_CANDIDATES: MockSourcingCandidate[] = [
  {
    id: "src-1",
    fullName: "Trần Thị Minh Châu",
    currentTitle: "Chuyên viên Mua hàng",
    currentCompany: "Công ty CP Thực phẩm Sài Gòn",
    experienceYears: 3,
    overallScore: 82,
    matchedSkills: ["Đàm phán NCC", "SAP MM", "Quản lý đơn hàng", "Excel nâng cao"],
    missingSkills: ["ERP Oracle"],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/minhchau-tran",
    status: "shortlisted",
    cvSummary: "3 năm kinh nghiệm mua hàng thực phẩm, thành thạo SAP MM, từng quản lý 50+ NCC.",
    scoreBreakdown: {
      keyword: { score: 42, max: 50 },
      experience: { score: 16, max: 20, detectedYears: 3 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh B2"] },
      ai: { score: 8, max: 10, summary: "Profile phù hợp cao, kinh nghiệm ngành F&B là điểm cộng lớn." },
    },
  },
  {
    id: "src-2",
    fullName: "Nguyễn Văn Hùng",
    currentTitle: "Nhân viên Thu mua",
    currentCompany: "NovaFood",
    experienceYears: 5,
    overallScore: 91,
    matchedSkills: ["Đàm phán NCC", "SAP MM", "Quản lý đơn hàng", "Excel nâng cao", "ERP Oracle"],
    missingSkills: [],
    totalSkills: 5,
    sourcePlatform: "topcv",
    sourceUrl: "https://topcv.vn/xem-cv/hung-nguyen",
    status: "shortlisted",
    cvSummary: "5 năm thu mua tại NovaFood, thành thạo SAP và Oracle, quản lý budget 2 tỷ/tháng.",
    scoreBreakdown: {
      keyword: { score: 50, max: 50 },
      experience: { score: 20, max: 20, detectedYears: 5 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 6, max: 10, detected: ["Tiếng Anh B1"] },
      ai: { score: 7, max: 10, summary: "Ứng viên nội bộ NovaFood, am hiểu quy trình NovaGroup." },
    },
  },
  {
    id: "src-3",
    fullName: "Lê Thị Hồng Nhung",
    currentTitle: "Trưởng nhóm Mua hàng",
    currentCompany: "Central Retail Vietnam",
    experienceYears: 7,
    overallScore: 88,
    matchedSkills: ["Đàm phán NCC", "Quản lý đơn hàng", "Excel nâng cao", "ERP Oracle"],
    missingSkills: ["SAP MM"],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/hongnhung-le",
    status: "scored",
    cvSummary: "7 năm kinh nghiệm, từng quản lý team 5 người, chuyên mua hàng FMCG.",
    scoreBreakdown: {
      keyword: { score: 40, max: 50 },
      experience: { score: 20, max: 20, detectedYears: 7 },
      education: { score: 10, max: 10, level: "Thạc sĩ" },
      language: { score: 10, max: 10, detected: ["Tiếng Anh C1", "Tiếng Trung HSK4"] },
      ai: { score: 8, max: 10, summary: "Overqualified cho vị trí nhưng profile rất mạnh." },
    },
  },
  {
    id: "src-4",
    fullName: "Phạm Quốc Bảo",
    currentTitle: "Nhân viên Mua hàng",
    currentCompany: "Công ty TNHH Kamereo",
    experienceYears: 2,
    overallScore: 71,
    matchedSkills: ["Đàm phán NCC", "Quản lý đơn hàng", "Excel nâng cao"],
    missingSkills: ["SAP MM", "ERP Oracle"],
    totalSkills: 5,
    sourcePlatform: "vnworks",
    sourceUrl: "https://vnworks.vn/cv/quocbao-pham",
    status: "scored",
    cvSummary: "2 năm mua hàng F&B, chưa có kinh nghiệm SAP/Oracle nhưng học nhanh.",
    scoreBreakdown: {
      keyword: { score: 30, max: 50 },
      experience: { score: 12, max: 20, detectedYears: 2 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 6, max: 10, detected: ["Tiếng Anh B1"] },
      ai: { score: 5, max: 10, summary: "Cần thêm training về ERP, tiềm năng phát triển." },
    },
  },
  {
    id: "src-5",
    fullName: "Võ Thị Kim Anh",
    currentTitle: "Chuyên viên Chuỗi cung ứng",
    currentCompany: "Bách Hóa Xanh",
    experienceYears: 4,
    overallScore: 78,
    matchedSkills: ["Quản lý đơn hàng", "Excel nâng cao", "SAP MM"],
    missingSkills: ["Đàm phán NCC", "ERP Oracle"],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/kimanh-vo",
    status: "contacted",
    cvSummary: "4 năm supply chain tại BHX, thành thạo SAP, chuyển sang mua hàng.",
    scoreBreakdown: {
      keyword: { score: 35, max: 50 },
      experience: { score: 16, max: 20, detectedYears: 4 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh B2"] },
      ai: { score: 6, max: 10, summary: "Background supply chain tốt, cần đào tạo thêm negotiation." },
    },
  },
  {
    id: "src-6",
    fullName: "Đặng Minh Tuấn",
    currentTitle: "Nhân viên Kho vận",
    currentCompany: "Lazada Express",
    experienceYears: 3,
    overallScore: 45,
    matchedSkills: ["Excel nâng cao"],
    missingSkills: ["Đàm phán NCC", "SAP MM", "Quản lý đơn hàng", "ERP Oracle"],
    totalSkills: 5,
    sourcePlatform: "topcv",
    sourceUrl: "https://topcv.vn/xem-cv/minhtuan-dang",
    status: "rejected",
    cvSummary: "3 năm kho vận, ít kinh nghiệm mua hàng trực tiếp.",
    scoreBreakdown: {
      keyword: { score: 15, max: 50 },
      experience: { score: 8, max: 20, detectedYears: 3 },
      education: { score: 6, max: 10, level: "Cao đẳng" },
      language: { score: 4, max: 10, detected: ["Tiếng Anh A2"] },
      ai: { score: 2, max: 10, summary: "Không phù hợp — background kho vận, thiếu kỹ năng mua hàng." },
    },
  },
  {
    id: "src-7",
    fullName: "Huỳnh Thị Thanh Tâm",
    currentTitle: "Chuyên viên Mua hàng",
    currentCompany: "Vincommerce",
    experienceYears: 4,
    overallScore: 85,
    matchedSkills: ["Đàm phán NCC", "SAP MM", "Quản lý đơn hàng", "Excel nâng cao"],
    missingSkills: ["ERP Oracle"],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/thanhtam-huynh",
    status: "scored",
    cvSummary: "4 năm mua hàng FMCG tại Vincommerce, quản lý 80+ SKU.",
    scoreBreakdown: {
      keyword: { score: 43, max: 50 },
      experience: { score: 16, max: 20, detectedYears: 4 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh B2"] },
      ai: { score: 8, max: 10, summary: "Profile rất phù hợp, kinh nghiệm FMCG retail là điểm mạnh." },
    },
  },
  {
    id: "src-8",
    fullName: "Bùi Văn Đức",
    currentTitle: "Nhân viên Mua hàng",
    currentCompany: "Saigon Co.op",
    experienceYears: 2,
    overallScore: 68,
    matchedSkills: ["Đàm phán NCC", "Quản lý đơn hàng"],
    missingSkills: ["SAP MM", "Excel nâng cao", "ERP Oracle"],
    totalSkills: 5,
    sourcePlatform: "vnworks",
    sourceUrl: "https://vnworks.vn/cv/vanduc-bui",
    status: "scored",
    cvSummary: "2 năm mua hàng tại Co.op, quen thuộc ngành bán lẻ.",
    scoreBreakdown: {
      keyword: { score: 25, max: 50 },
      experience: { score: 12, max: 20, detectedYears: 2 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 6, max: 10, detected: ["Tiếng Anh B1"] },
      ai: { score: 5, max: 10, summary: "Kinh nghiệm cơ bản, cần đào tạo thêm tools." },
    },
  },
  {
    id: "src-9",
    fullName: "Trịnh Hoàng Nam",
    currentTitle: "Senior Buyer",
    currentCompany: "AEON Vietnam",
    experienceYears: 6,
    overallScore: 87,
    matchedSkills: ["Đàm phán NCC", "SAP MM", "Quản lý đơn hàng", "ERP Oracle", "Excel nâng cao"],
    missingSkills: [],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/hoangnam-trinh",
    status: "contacted",
    cvSummary: "6 năm buyer tại AEON, full-stack procurement, thành thạo cả SAP và Oracle.",
    scoreBreakdown: {
      keyword: { score: 48, max: 50 },
      experience: { score: 20, max: 20, detectedYears: 6 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 6, max: 10, detected: ["Tiếng Anh B2", "Tiếng Nhật N3"] },
      ai: { score: 5, max: 10, summary: "Salary expectation có thể cao hơn budget, nhưng profile xuất sắc." },
    },
  },
  {
    id: "src-10",
    fullName: "Ngô Thị Mỹ Linh",
    currentTitle: "Thực tập sinh Mua hàng",
    currentCompany: "MM Mega Market",
    experienceYears: 0.5,
    overallScore: 38,
    matchedSkills: ["Excel nâng cao"],
    missingSkills: ["Đàm phán NCC", "SAP MM", "Quản lý đơn hàng", "ERP Oracle"],
    totalSkills: 5,
    sourcePlatform: "topcv",
    sourceUrl: "https://topcv.vn/xem-cv/mylinh-ngo",
    status: "rejected",
    cvSummary: "Mới ra trường, 6 tháng thực tập, cần thêm kinh nghiệm.",
    scoreBreakdown: {
      keyword: { score: 12, max: 50 },
      experience: { score: 4, max: 20, detectedYears: 0.5 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 6, max: 10, detected: ["Tiếng Anh B1"] },
      ai: { score: 3, max: 10, summary: "Quá ít kinh nghiệm cho vị trí này." },
    },
  },
  {
    id: "src-11",
    fullName: "Lý Quang Vinh",
    currentTitle: "Nhân viên Mua hàng",
    currentCompany: "Lotte Mart Vietnam",
    experienceYears: 3,
    overallScore: 76,
    matchedSkills: ["Đàm phán NCC", "Quản lý đơn hàng", "SAP MM"],
    missingSkills: ["ERP Oracle", "Excel nâng cao"],
    totalSkills: 5,
    sourcePlatform: "vnworks",
    sourceUrl: null,
    status: "scored",
    cvSummary: "3 năm mua hàng tại Lotte, chuyên ngành thực phẩm tươi sống.",
    scoreBreakdown: {
      keyword: { score: 35, max: 50 },
      experience: { score: 14, max: 20, detectedYears: 3 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh B1", "Tiếng Hàn TOPIK2"] },
      ai: { score: 6, max: 10, summary: "Profile khá, ngôn ngữ Hàn là lợi thế nếu làm việc với NCC Hàn Quốc." },
    },
  },
  {
    id: "src-12",
    fullName: "Phan Thị Ngọc Hân",
    currentTitle: "Chuyên viên Sourcing",
    currentCompany: "GrabFood",
    experienceYears: 3,
    overallScore: 74,
    matchedSkills: ["Đàm phán NCC", "Quản lý đơn hàng", "Excel nâng cao"],
    missingSkills: ["SAP MM", "ERP Oracle"],
    totalSkills: 5,
    sourcePlatform: "linkedin",
    sourceUrl: "https://linkedin.com/in/ngochan-phan",
    status: "scored",
    cvSummary: "3 năm sourcing tại GrabFood, quen quản lý vendor F&B quy mô lớn.",
    scoreBreakdown: {
      keyword: { score: 32, max: 50 },
      experience: { score: 14, max: 20, detectedYears: 3 },
      education: { score: 8, max: 10, level: "Đại học" },
      language: { score: 8, max: 10, detected: ["Tiếng Anh B2"] },
      ai: { score: 6, max: 10, summary: "Sourcing background tốt, chuyển sang procurement truyền thống cần adapt." },
    },
  },
]
