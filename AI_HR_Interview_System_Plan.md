# 🤖 AI HR INTERVIEW SYSTEM - KẾ HOẠCH TRIỂN KHAI CHI TIẾT

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Mục tiêu & Phạm vi](#2-mục-tiêu--phạm-vi)
3. [Kiến trúc hệ thống](#3-kiến-trúc-hệ-thống)
4. [Technical Stack](#4-technical-stack)
5. [Logic hệ thống chi tiết](#5-logic-hệ-thống-chi-tiết)
6. [API Design](#6-api-design)
7. [Database Design](#7-database-design)
8. [Gemini Integration](#8-gemini-integration)
9. [Security & Privacy](#9-security--privacy)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Cost Estimation](#11-cost-estimation)
12. [Risk Assessment](#12-risk-assessment)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Giới thiệu

Hệ thống AI phỏng vấn nhân sự (AI HR Interview System) là một ứng dụng thông minh được thiết kế để tự động hóa và nâng cao chất lượng quy trình phỏng vấn tuyển dụng. Hệ thống sử dụng Google Gemini API để phân tích Job Description (JD) và Curriculum Vitae (CV), từ đó tạo ra bộ câu hỏi phỏng vấn phù hợp, tiến hành phỏng vấn ảo với ứng viên, và đánh giá phản hồi một cách khách quan.

### 1.2. Bối cảnh và Nhu cầu

Trong bối cảnh thị trường lao động cạnh tranh ngày càng gay gắt, quy trình tuyển dụng truyền thống gặp nhiều thách thức đáng kể. Các nhà tuyển dụng thường xuyên phải đối mặt với áp lực xử lý hàng trăm, thậm chí hàng nghìn hồ sơ cho một vị trí, dẫn đến sự thiếu nhất quán trong việc sàng lọc và đánh giá ứng viên. Hơn nữa, yếu tố chủ quan và thiên kiến unconscious bias có thể ảnh hưởng tiêu cực đến quyết định tuyển dụng, gây ra những bất công và làm mất đi những nhân tài tiềm năng.

Hệ thống AI phỏng vấn nhân sự được phát triển nhằm giải quyết những vấn đề trên bằng cách ứng dụng trí tuệ nhân tạo để đảm bảo tính công bằng, nhất quán và hiệu quả trong quy trình tuyển dụng. Thông qua việc phân tích sâu cả JD và CV, hệ thống có thể tạo ra những câu hỏi phỏng vấn được cá nhân hóa cho từng ứng viên, tập trung vào các kỹ năng và kinh nghiệm thực sự liên quan đến vị trí công việc.

### 1.3. Giá trị cốt lõi

Hệ thống mang lại bốn giá trị cốt lõi chính cho tổ chức và ứng viên:

**Tự động hóa thông minh**: Hệ thống tự động hóa toàn bộ quy trình từ việc phân tích JD/CV, tạo câu hỏi phỏng vấn, tiến hành phỏng vấn đến đánh giá kết quả. Điều này giúp giảm thiểu đáng kể thời gian và công sức mà đội ngũ HR phải dành cho các công việc lặp đi lặp lại, cho phép họ tập trung vào những nhiệm vụ chiến lược hơn.

**Đánh giá khách quan và nhất quán**: Bằng cách sử dụng các tiêu chí đánh giá được xác định trước và thuật toán AI, hệ thống đảm bảo mọi ứng viên đều được đánh giá dựa trên cùng một bộ tiêu chuẩn, loại bỏ các yếu tố thiên kiến cá nhân và đảm bảo sự công bằng trong quy trình tuyển dụng.

**Trải nghiệm ứng viên được cá nhân hóa**: Mỗi ứng viên sẽ trải qua một buổi phỏng vấn được thiết kế riêng dựa trên hồ sơ và vị trí ứng tuyển của họ. Điều này không chỉ giúp đánh giá chính xác hơn năng lực của ứng viên mà còn tạo ấn tượng tích cực về chuyên nghiệp của tổ chức.

**Phân tích và báo cáo chi tiết**: Hệ thống cung cấp các báo cáo phân tích chuyên sâu về hiệu suất của từng ứng viên, so sánh giữa các ứng viên, và các đề xuất về việc có nên tiến tới các vòng phỏng vấn tiếp theo hay không, hỗ trợ quyết định của nhà tuyển dụng.

---

## 2. MỤC TIÊU & PHẠM VI

### 2.1. Mục tiêu chính

#### 2.1.1. Mục tiêu kinh doanh

Hệ thống được thiết kế để đạt được các mục tiêu kinh doanh cụ thể và đo lường được. Trước tiên, hệ thống hướng đến việc giảm thiểu thời gian sàng lọc ứng viên xuống ít nhất 60% so với quy trình thủ công truyền thống. Điều này được thực hiện thông qua việc tự động hóa việc phân tích CV và tạo câu hỏi phỏng vấn phù hợp, giúp đội ngũ HR không phải dành hàng giờ để đọc và so sánh từng hồ sơ.

Thứ hai, hệ thống mục tiêu cải thiện chất lượng tuyển dụng thông qua việc sử dụng các tiêu chí đánh giá khách quan và nhất quán. Các nghiên cứu chỉ ra rằng việc sử dụng AI trong quy trình tuyển dụng có thể cải thiện độ chính xác trong việc dự đoán hiệu suất công việc của ứng viên lên đến 25% so với các phương pháp truyền thống.

Thứ ba, hệ thống góp phần tạo ra trải nghiệm ứng viên tích cực và chuyên nghiệp. Trong thị trường lao động cạnh tranh, trải nghiệm của ứng viên trong quá trình tuyển dụng đóng vai trò quan trọng trong việc xây dựng thương hiệu tuyển dụng của tổ chức. Một quy trình phỏng vấn AI được thiết kế tốt có thể hoạt động 24/7, cho phép ứng viên tham gia phỏng vấn vào thời điểm phù hợp nhất với họ.

#### 2.1.2. Mục tiêu kỹ thuật

Về mặt kỹ thuật, hệ thống được thiết kế với các mục tiêu cụ thể về hiệu năng, độ tin cậy và khả năng mở rộng. Hệ thống cần đảm bảo thời gian phản hồi dưới 3 giây cho mỗi tương tác phỏng vấn, đảm bảo trải nghiệm phỏng vấn tự nhiên và liền mạch cho ứng viên. Độ khả dụng của hệ thống được đặt mục tiêu ở mức 99.5%, với các cơ chế failover và backup tự động.

Hệ thống cũng cần được thiết kế với khả năng mở rộng linh hoạt, có thể xử lý từ vài trăm đến hàng nghìn phiên phỏng vấn đồng thời mà không ảnh hưởng đáng kể đến hiệu năng. Kiến trúc microservices được chọn để đáp ứng yêu cầu này, cho phép scale các thành phần độc lập dựa trên nhu cầu thực tế.

### 2.2. Phạm vi hệ thống

#### 2.2.1. In-scope (Trong phạm vi)

Hệ thống sẽ bao gồm các chức năng chính sau đây trong phạm vi phát triển:

**Quản lý Job Description (JD)**: Hệ thống hỗ trợ nhà tuyển dụng tạo, lưu trữ và quản lý các mô tả công việc. Tính năng này bao gồm khả năng phân tích JD tự động để trích xuất các yêu cầu kỹ năng, kinh nghiệm, và trách nhiệm công việc, từ đó tạo ra khung đánh giá cho vị trí đó.

**Quản lý hồ sơ ứng viên (CV)**: Hệ thống hỗ trợ upload và phân tích CV ở các định dạng phổ biến như PDF, DOCX. Tính năng parsing tự động sẽ trích xuất thông tin quan trọng như kinh nghiệm làm việc, kỹ năng, học vấn, và các chứng chỉ để sử dụng trong quá trình đánh giá và tạo câu hỏi phỏng vấn.

**Tạo câu hỏi phỏng vấn thông minh**: Dựa trên sự phân tích JD và CV, hệ thống sẽ tự động tạo ra bộ câu hỏi phỏng vấn được cá nhân hóa. Các câu hỏi được chia thành nhiều loại: câu hỏi về kỹ năng kỹ thuật, câu hỏi về kinh nghiệm làm việc, câu hỏi tình huống (behavioral questions), và câu hỏi đánh giá tư duy và giải quyết vấn đề.

**Phỏng vấn tương tác**: Hệ thống cung cấp giao diện phỏng vấn trực tuyến nơi ứng viên có thể tương tác với AI interviewer. Ứng viên có thể trả lời bằng văn bản hoặc giọng nói (speech-to-text), và hệ thống sẽ phản hồi một cách tự nhiên như một nhà phỏng vấn thực sự.

**Đánh giá và báo cáo**: Sau mỗi phiên phỏng vấn, hệ thống sẽ tạo báo cáo đánh giá chi tiết bao gồm điểm số theo từng tiêu chí, phân tích điểm mạnh và điểm yếu của ứng viên, so sánh với các ứng viên khác cho cùng vị trí, và đề xuất về việc có nên tiến tới vòng tiếp theo hay không.

#### 2.2.2. Out-of-scope (Ngoài phạm vi)

Để đảm bảo phạm vi dự án khả thi và tập trung, một số chức năng được xác định là nằm ngoài phạm vi phát triển hiện tại:

Hệ thống sẽ không thực hiện phỏng vấn qua video call real-time với AI avatar (chỉ hỗ trợ text và voice). Tích hợp trực tiếp với các hệ thống ATS (Applicant Tracking System) của bên thứ ba như Greenhouse, Lever sẽ được xem xét trong các phase sau. Tính năng phỏng vấn nhóm (group interview) và phỏng vấn case study phức tạp cũng nằm ngoài phạm vi ban đầu. Ngoài ra, việc phát hiện cảm xúc ứng viên qua video hoặc audio analysis cũng không được bao gồm trong phiên bản đầu tiên.

### 2.3. Stakeholders

| Stakeholder | Vai trò | Mối quan tâm |
|-------------|---------|--------------|
| HR Manager | Quản lý quy trình tuyển dụng | Hiệu quả, chất lượng tuyển dụng, báo cáo |
| Recruiter | Thực hiện tuyển dụng | Dễ sử dụng, tiết kiệm thời gian |
| Ứng viên | Người được phỏng vấn | Trải nghiệm, công bằng, feedback |
| IT Admin | Triển khai và bảo trì | Bảo mật, hiệu năng, tích hợp |
| Ban lãnh đạo | Ra quyết định | ROI, compliance, brand |

---

## 3. KIẾN TRÚC HỆ THỐNG

### 3.1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Web App    │  │  Mobile App  │  │  Admin Panel │  │   API Docs   │    │
│  │  (Next.js)   │  │   (React     │  │  (Dashboard) │  │  (Swagger)   │    │
│  │              │  │   Native)    │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                API GATEWAY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Auth &     │  │   Rate       │  │   Request    │  │   Load       │    │
│  │   Security   │  │   Limiting   │  │   Routing    │  │   Balancer   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MICROSERVICES LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  JD Service     │  │  CV Service     │  │  Interview      │             │
│  │                 │  │                 │  │  Service        │             │
│  │ • JD CRUD       │  │ • CV Upload     │  │                 │             │
│  │ • JD Parsing    │  │ • CV Parsing    │  │ • Session Mgmt  │             │
│  │ • JD Analysis   │  │ • CV Analysis   │  │ • Q Generation  │             │
│  └─────────────────┘  └─────────────────┘  │ • Interview AI  │             │
│                       ┌─────────────────┐  └─────────────────┘             │
│                       │  Evaluation     │                                  │
│                       │  Service        │  ┌─────────────────┐             │
│                       │                 │  │  Notification   │             │
│                       │ • Scoring       │  │  Service        │             │
│                       │ • Reporting     │  │                 │             │
│                       │ • Analytics     │  │ • Email         │             │
│                       └─────────────────┘  │ • SMS           │             │
│                                            │ • WebSocket     │             │
│                                            └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AI/ML LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      GEMINI AI ENGINE                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ Document    │  │ Question    │  │ Interview   │  │ Evaluation  │  │  │
│  │  │ Analyzer    │  │ Generator   │  │ Engine      │  │ Engine      │  │  │
│  │  │             │  │             │  │             │  │             │  │  │
│  │  │ • JD Parse  │  │ • Technical │  │ • Context   │  │ • Sentiment │  │  │
│  │  │ • CV Parse  │  │ • Behavior  │  │   Aware     │  │ • Quality   │  │  │
│  │  │ • Match     │  │ • Situational│ │ • Adaptive  │  │ • Scoring   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      SUPPORTING AI SERVICES                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │  │
│  │  │ Speech-to-  │  │ Text-to-    │  │ Embedding   │                    │  │
│  │  │ Text (ASR)  │  │ Speech(TTS) │  │ Service     │                    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │    Redis     │  │ Elasticsearch│  │   Object     │    │
│  │  (Primary)   │  │   (Cache)    │  │  (Search)    │  │   Storage    │    │
│  │              │  │              │  │              │  │   (S3/MinIO) │    │
│  │ • Users      │  │ • Session    │  │ • JD Search  │  │ • CV Files   │    │
│  │ • JDs        │  │ • Rate Limit │  │ • CV Search  │  │ • Audio      │    │
│  │ • Interviews │  │ • Temp Data  │  │ • Analytics  │  │ • Reports    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Docker     │  │ Kubernetes   │  │   CI/CD      │  │  Monitoring  │    │
│  │  Containers  │  │  Orchestration│ │   Pipeline   │  │  & Logging   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Component Diagram

```
                                    ┌─────────────────┐
                                    │   HR Manager    │
                                    │   (Admin)       │
                                    └────────┬────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN DASHBOARD                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  JD Mgmt    │  │ Analytics   │  │ Candidate   │  │  Settings   │       │
│  │  Module     │  │ Dashboard   │  │ Overview    │  │  Panel      │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                    │ JD Service   │ │ Interview    │ │ Evaluation   │
                    │              │ │ Service      │ │ Service      │
                    └──────────────┘ └──────────────┘ └──────────────┘
                              │              │              │
                              └──────────────┼──────────────┘
                                             ▼
                                    ┌─────────────────┐
                                    │  Gemini AI      │
                                    │  Gateway        │
                                    └─────────────────┘


                                    ┌─────────────────┐
                                    │   Candidate     │
                                    │   (User)        │
                                    └────────┬────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CANDIDATE PORTAL                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  CV Upload  │  │ Interview   │  │  Progress   │  │  Feedback   │       │
│  │  Module     │  │ Interface   │  │  Tracker    │  │  View       │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3. Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW - INTERVIEW PROCESS                         │
└──────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │  JD     │────▶│  JD     │────▶│  JD     │────▶│  Match  │────▶│ Question│
    │  Input  │     │  Parse  │     │  Analyze│     │  Engine │     │ Generate│
    └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
                                                        ▲
    ┌─────────┐     ┌─────────┐     ┌─────────┐        │
    │  CV     │────▶│  CV     │────▶│  CV     │────────┘
    │  Upload │     │  Parse  │     │  Analyze│
    └─────────┘     └─────────┘     └─────────┘


    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │Question │────▶│Candidate│────▶│Response │────▶│Response │────▶│Evaluate │
    │  Send   │     │ Answer  │     │ Receive │     │ Process │     │ Answer  │
    └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
         │                                                              │
         │              ┌─────────┐                                     │
         └─────────────▶│  Next   │◀────────────────────────────────────┘
                        │ Question│
                        │ or End  │
                        └─────────┘
                              │
                              ▼
                        ┌─────────┐     ┌─────────┐     ┌─────────┐
                        │Generate │────▶│  Store  │────▶│  Notify │
                        │ Report  │     │ Results │     │   HR    │
                        └─────────┘     └─────────┘     └─────────┘
```

---

## 4. TECHNICAL STACK

### 4.1. Frontend Technologies

| Layer | Technology | Version | Mục đích |
|-------|------------|---------|----------|
| **Framework** | Next.js | 15.x | Full-stack React framework với SSR/SSG |
| **UI Library** | React | 19.x | Component-based UI development |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Component Library** | shadcn/ui | Latest | Pre-built accessible components |
| **State Management** | Zustand | 5.x | Lightweight state management |
| **Form Handling** | React Hook Form | 7.x | Performant form handling |
| **HTTP Client** | Axios | 1.x | HTTP request handling |
| **Real-time** | Socket.io Client | 4.x | WebSocket for real-time interview |
| **Audio Processing** | Web Audio API | Native | Voice input/output handling |

### 4.2. Backend Technologies

| Service | Technology | Version | Mục đích |
|---------|------------|---------|----------|
| **Runtime** | Node.js | 20.x LTS | JavaScript runtime |
| **Framework** | Express.js / Fastify | 4.x / 5.x | REST API framework |
| **Language** | TypeScript | 5.x | Type-safe development |
| **ORM** | Prisma | 6.x | Database ORM |
| **Validation** | Zod | 3.x | Schema validation |
| **Authentication** | NextAuth.js | 5.x | Authentication solution |
| **Queue** | BullMQ | 5.x | Job queue processing |
| **WebSocket** | Socket.io | 4.x | Real-time communication |

### 4.3. AI/ML Technologies

| Component | Technology | Version | Mục đích |
|-----------|------------|---------|----------|
| **Primary LLM** | Google Gemini | 2.5 Pro/Flash | Main AI engine |
| **ASR** | Google Speech-to-Text | Latest | Voice input transcription |
| **TTS** | Google Text-to-Speech | Latest | Voice output generation |
| **Embeddings** | Gemini Embedding API | Latest | Text embeddings for similarity |
| **PDF Processing** | pdf-parse / pdfjs-dist | Latest | CV/JD document parsing |

### 4.4. Database & Storage

| Component | Technology | Version | Mục đích |
|-----------|------------|---------|----------|
| **Primary DB** | PostgreSQL | 16.x | Relational data storage |
| **Cache Layer** | Redis | 7.x | Caching, session, rate limiting |
| **Search Engine** | Elasticsearch | 8.x | Full-text search, analytics |
| **Object Storage** | MinIO / AWS S3 | Latest | File storage (CV, audio, reports) |
| **Message Queue** | Redis + BullMQ | - | Background job processing |

### 4.5. Infrastructure & DevOps

| Component | Technology | Mục đích |
|-----------|------------|----------|
| **Containerization** | Docker | Application containerization |
| **Orchestration** | Kubernetes | Container orchestration (production) |
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Monitoring** | Prometheus + Grafana | System monitoring & alerting |
| **Logging** | ELK Stack / Loki | Centralized logging |
| **APM** | New Relic / Datadog | Application performance monitoring |

### 4.6. Third-party Integrations

| Service | Purpose | API |
|---------|---------|-----|
| **Google AI** | Gemini LLM, Speech APIs | REST/gRPC |
| **SendGrid** | Email notifications | REST API |
| **Twilio** | SMS notifications | REST API |
| **Cloudflare** | CDN, DDoS protection | - |

---

## 5. LOGIC HỆ THỐNG CHI TIẾT

### 5.1. JD (Job Description) Processing Flow

#### 5.1.1. JD Input & Parsing

Quy trình xử lý Job Description bắt đầu từ việc tiếp nhận input từ nhà tuyển dụng. Hệ thống hỗ trợ hai phương thức nhập liệu chính: nhập trực tiếp qua form web với các trường được cấu trúc sẵn, hoặc upload file từ các nguồn bên ngoài (PDF, DOCX, hoặc text plain).

Khi JD được nhập vào hệ thống, quy trình parsing sẽ được kích hoạt để trích xuất các thông tin quan trọng một cách có cấu trúc. Đầu tiên, hệ thống thực hiện việc làm sạch dữ liệu (data cleaning) để loại bỏ các ký tự không cần thiết, chuẩn hóa format văn bản, và xác định ngôn ngữ của JD. Sau đó, JD được gửi đến Gemini AI để thực hiện việc phân tích ngữ nghĩa và trích xuất thông tin.

```typescript
// JD Parsing Logic - Pseudo Code
interface ParsedJD {
  position: {
    title: string;
    level: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director';
    department: string;
    location: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'remote';
  };
  requirements: {
    technical: TechnicalSkill[];
    soft: SoftSkill[];
    experience: ExperienceRequirement;
    education: EducationRequirement[];
    certifications: string[];
  };
  responsibilities: Responsibility[];
  benefits: string[];
  keywords: string[];
  salary?: SalaryRange;
}

async function parseJobDescription(rawJD: string): Promise<ParsedJD> {
  // Step 1: Clean and normalize
  const cleanedJD = cleanAndNormalize(rawJD);
  
  // Step 2: Extract structured information using Gemini
  const prompt = `
    Analyze this Job Description and extract structured information.
    Return a JSON object with the following structure:
    - position: {title, level, department, location, employmentType}
    - requirements: {technical[], soft[], experience, education[], certifications[]}
    - responsibilities[]
    - benefits[]
    - keywords[]
    
    Job Description:
    ${cleanedJD}
  `;
  
  const parsed = await gemini.generateContent(prompt);
  
  // Step 3: Validate and enrich
  const validated = validateAndEnrich(parsed);
  
  // Step 4: Generate embeddings for matching
  const embeddings = await generateEmbeddings(cleanedJD);
  
  return {
    ...validated,
    embeddings
  };
}
```

#### 5.1.2. JD Analysis & Requirements Extraction

Sau khi parsing, hệ thống thực hiện phân tích sâu hơn để tạo ra một "profile" cho vị trí công việc. Phân tích này bao gồm việc xác định các yêu cầu bắt buộc (must-have) và ưu tiên (nice-to-have), đánh giá mức độ khó của vị trí, và xác định các câu hỏi trọng tâm cần hỏi trong phỏng vấn.

Quy trình phân tích cũng bao gồm việc tạo ra một "evaluation rubric" - một bộ tiêu chí đánh giá cụ thể cho vị trí đó. Mỗi tiêu chí được gán trọng số dựa trên tầm quan trọng của nó đối với vị trí công việc, và được định nghĩa rõ ràng về cách đánh giá câu trả lời của ứng viên.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        JD ANALYSIS OUTPUT STRUCTURE                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Job Position: Senior Frontend Developer                                    │
│  ─────────────────────────────────────────────────                           │
│                                                                              │
│  MUST-HAVE REQUIREMENTS (Weight: 70%)                                       │
│  ├── Technical Skills                                                       │
│  │   ├── React.js (5+ years) ────────────────────── Weight: 15%            │
│  │   ├── TypeScript (3+ years) ───────────────────── Weight: 12%            │
│  │   ├── CSS/Tailwind (3+ years) ─────────────────── Weight: 8%             │
│  │   └── REST API Integration ────────────────────── Weight: 10%            │
│  │                                                                          │
│  ├── Soft Skills                                                            │
│  │   ├── Problem Solving ─────────────────────────── Weight: 10%            │
│  │   ├── Communication ────────────────────────────── Weight: 8%             │
│  │   └── Team Collaboration ───────────────────────── Weight: 7%             │
│  │                                                                          │
│  └── Experience                                                             │
│      └── 5+ years in frontend development ────────── Weight: 10%            │
│                                                                              │
│  NICE-TO-HAVE REQUIREMENTS (Weight: 30%)                                    │
│  ├── Next.js experience ──────────────────────────── Weight: 10%            │
│  ├── Testing (Jest, Cypress) ─────────────────────── Weight: 8%             │
│  ├── CI/CD knowledge ─────────────────────────────── Weight: 7%             │
│  └── GraphQL experience ───────────────────────────── Weight: 5%            │
│                                                                              │
│  INTERVIEW FOCUS AREAS                                                       │
│  ├── Technical Deep Dive ──────────────────────────── 50%                   │
│  ├── Problem Solving ──────────────────────────────── 25%                   │
│  ├── Behavioral Assessment ────────────────────────── 15%                   │
│  └── Culture Fit ──────────────────────────────────── 10%                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2. CV (Resume) Processing Flow

#### 5.2.1. CV Upload & Parsing

Quy trình xử lý CV bắt đầu với việc ứng viên upload hồ sơ của họ. Hệ thống hỗ trợ các định dạng phổ biến bao gồm PDF, DOCX, và DOC. Khi file được upload, hệ thống sẽ thực hiện một loạt các bước xử lý để trích xuất thông tin có cấu trúc.

Bước đầu tiên là kiểm tra tính hợp lệ của file: kích thước file (tối đa 10MB), định dạng file, và quét virus cơ bản. Sau khi file được xác thực, hệ thống sẽ thực hiện parsing dựa trên định dạng của file. Đối với PDF, hệ thống sử dụng kết hợp OCR (Optical Character Recognition) và text extraction để đảm bảo thu được toàn bộ nội dung văn bản.

Sau khi có được raw text từ CV, hệ thống sẽ sử dụng Gemini AI để thực hiện việc parsing ngữ nghĩa và trích xuất thông tin có cấu trúc tương tự như quy trình xử lý JD. Thông tin được trích xuất bao gồm thông tin cá nhân, kinh nghiệm làm việc, kỹ năng, học vấn, chứng chỉ, và các hoạt động liên quan.

```typescript
// CV Parsing Logic - Pseudo Code
interface ParsedCV {
  personal: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: {
    technical: Skill[];
    soft: Skill[];
    languages: Language[];
    tools: string[];
  };
  certifications: Certification[];
  projects?: Project[];
  achievements?: string[];
  embeddings?: number[];
}

async function parseResume(file: File): Promise<ParsedCV> {
  // Step 1: Validate file
  validateFile(file);
  
  // Step 2: Extract text based on file type
  let rawText: string;
  switch (file.type) {
    case 'application/pdf':
      rawText = await extractPDFText(file);
      break;
    case 'application/docx':
      rawText = await extractDOCXText(file);
      break;
    default:
      throw new Error('Unsupported file format');
  }
  
  // Step 3: Clean and normalize
  const cleanedText = cleanAndNormalize(rawText);
  
  // Step 4: Parse using Gemini
  const prompt = `
    Parse this resume and extract structured information.
    Return a JSON object with: personal, summary, experience[], 
    education[], skills, certifications[], projects[], achievements[]
    
    Resume:
    ${cleanedText}
  `;
  
  const parsed = await gemini.generateContent(prompt);
  
  // Step 5: Generate embeddings
  const embeddings = await generateEmbeddings(cleanedText);
  
  return {
    ...parsed,
    embeddings
  };
}
```

#### 5.2.2. CV Analysis & Profiling

Sau khi parsing, hệ thống thực hiện phân tích sâu CV để tạo ra một "candidate profile" chi tiết. Phân tích này bao gồm việc đánh giá mức độ phù hợp với vị trí (fit score), xác định điểm mạnh và điểm yếu, và tạo ra các insight về ứng viên.

Quá trình phân tích sử dụng kết hợp embedding similarity và rule-based matching để đánh giá mức độ phù hợp. Embedding similarity được sử dụng để so sánh semantic similarity giữa CV và JD, trong khi rule-based matching được sử dụng để xác định các yêu cầu cụ thể như số năm kinh nghiệm, kỹ năng cụ thể, và bằng cấp.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        CV ANALYSIS OUTPUT STRUCTURE                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Candidate: Nguyen Van A                                                     │
│  Applied for: Senior Frontend Developer                                     │
│  ─────────────────────────────────────────────────                           │
│                                                                              │
│  OVERALL FIT SCORE: 78/100 ────────────── GOOD MATCH                        │
│                                                                              │
│  MATCHING BREAKDOWN                                                          │
│  ├── Technical Skills ────────────────────────────── 85%                    │
│  │   ├── React.js ✓ (6 years) ───────────────────── MATCH                   │
│  │   ├── TypeScript ✓ (4 years) ──────────────────── MATCH                  │
│  │   ├── CSS/Tailwind ✓ (5 years) ────────────────── MATCH                   │
│  │   └── REST API ✓ ──────────────────────────────── MATCH                   │
│  │                                                                          │
│  ├── Experience ──────────────────────────────────── 75%                    │
│  │   ├── Years: 6/5+ required ────────────────────── EXCEEDS                │
│  │   ├── Relevant: 5 years ───────────────────────── GOOD                    │
│  │   └── Leadership: 1 year ───────────────────────── BONUS                  │
│  │                                                                          │
│  ├── Education ───────────────────────────────────── 90%                    │
│  │   └── BS Computer Science ──────────────────────── MATCH                  │
│  │                                                                          │
│  └── Nice-to-have ────────────────────────────────── 60%                    │
│      ├── Next.js ✓ (2 years) ──────────────────────── MATCH                 │
│      ├── Testing ✓ (Jest) ─────────────────────────── MATCH                 │
│      └── GraphQL ✗ ────────────────────────────────── MISSING               │
│                                                                              │
│  STRENGTHS                                                                   │
│  ├── Strong React ecosystem experience                                      │
│  ├── Experience with large-scale applications                               │
│  └── Good track record of project delivery                                  │
│                                                                              │
│  GAPS / CONCERNS                                                            │
│  ├── No GraphQL experience mentioned                                        │
│  ├── Limited backend knowledge                                              │
│  └── Career gap of 8 months in 2022                                         │
│                                                                              │
│  RECOMMENDED INTERVIEW FOCUS                                                │
│  ├── Deep dive into React architecture decisions                           │
│  ├── Explore the career gap                                                 │
│  ├── Assess GraphQL learning willingness                                    │
│  └── Evaluate leadership potential                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.3. JD-CV Matching Algorithm

#### 5.3.1. Semantic Similarity Matching

Hệ thống sử dụng kết hợp nhiều phương pháp để đánh giá mức độ phù hợp giữa JD và CV:

**Embedding-based Similarity**: Sử dụng Gemini Embedding API để tạo vector embeddings cho cả JD và CV, sau đó tính toán cosine similarity giữa hai vectors. Phương pháp này cho phép đánh giá mức độ phù hợp về mặt ngữ nghĩa (semantic), không chỉ dựa trên từ khóa.

```typescript
// Embedding-based Matching
async function calculateSemanticMatch(jd: ParsedJD, cv: ParsedCV): Promise<number> {
  // Generate embeddings for key sections
  const jdEmbedding = await gemini.embedText(jd.requirementsText);
  const cvEmbedding = await gemini.embedText(cv.experienceText);
  
  // Calculate cosine similarity
  const similarity = cosineSimilarity(jdEmbedding, cvEmbedding);
  
  return similarity; // Returns 0-1 score
}
```

**Keyword Matching với Weighting**: Hệ thống cũng thực hiện matching dựa trên từ khóa với hệ thống trọng số. Các từ khóa được phân loại theo mức độ quan trọng (must-have vs nice-to-have) và được gán trọng số phù hợp.

```typescript
// Keyword-based Matching with Weights
interface MatchResult {
  totalScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  details: {
    mustHave: { matched: string[]; missing: string[]; score: number };
    niceToHave: { matched: string[]; missing: string[]; score: number };
  };
}

async function calculateKeywordMatch(
  jdKeywords: Keywords,
  cvSkills: Skills
): Promise<MatchResult> {
  const mustHaveMatch = matchKeywords(jdKeywords.mustHave, cvSkills);
  const niceToHaveMatch = matchKeywords(jdKeywords.niceToHave, cvSkills);
  
  // Weighted scoring
  const mustHaveWeight = 0.7;
  const niceToHaveWeight = 0.3;
  
  const totalScore = 
    (mustHaveMatch.score * mustHaveWeight) +
    (niceToHaveMatch.score * niceToHaveWeight);
  
  return {
    totalScore,
    matchedKeywords: [...mustHaveMatch.matched, ...niceToHaveMatch.matched],
    missingKeywords: [...mustHaveMatch.missing, ...niceToHaveMatch.missing],
    details: {
      mustHave: mustHaveMatch,
      niceToHave: niceToHaveMatch
    }
  };
}
```

#### 5.3.2. Experience & Qualification Matching

Bên cạnh kỹ năng, hệ thống cũng đánh giá kinh nghiệm và bằng cấp:

```typescript
// Experience Matching
interface ExperienceMatch {
  yearsRequired: number;
  yearsActual: number;
  relevanceScore: number; // How relevant is the experience
  level: 'exceeds' | 'meets' | 'below' | 'significantly-below';
}

async function matchExperience(
  jdRequirements: ExperienceRequirement,
  cvExperience: Experience[]
): Promise<ExperienceMatch> {
  const totalYears = calculateTotalYears(cvExperience);
  const relevantYears = calculateRelevantYears(
    cvExperience, 
    jdRequirements.keywords
  );
  
  return {
    yearsRequired: jdRequirements.years,
    yearsActual: relevantYears,
    relevanceScore: relevantYears / totalYears,
    level: determineLevel(relevantYears, jdRequirements.years)
  };
}
```

### 5.4. Question Generation Logic

#### 5.4.1. Question Types & Categories

Hệ thống tạo ra các loại câu hỏi khác nhau dựa trên JD và CV:

| Category | Type | Purpose | Example |
|----------|------|---------|---------|
| **Technical** | Knowledge-based | Đánh giá kiến thức kỹ thuật | "Can you explain how React's virtual DOM works?" |
| **Technical** | Code Challenge | Đánh giá khả năng coding | "How would you implement a debounce function?" |
| **Technical** | Architecture | Đánh giá tư duy hệ thống | "How would you design a scalable frontend architecture?" |
| **Experience** | Past Projects | Đánh giá kinh nghiệm thực tế | "Tell me about the most challenging frontend project you've worked on" |
| **Behavioral** | STAR Format | Đánh giá soft skills | "Describe a time when you had to resolve a conflict in your team" |
| **Situational** | Hypothetical | Đánh giá problem-solving | "If you had to optimize a slow-loading page, where would you start?" |
| **Culture Fit** | Values | Đánh giá sự phù hợp văn hóa | "What's your approach to giving and receiving feedback?" |
| **Gap Analysis** | Clarification | Làm rõ các điểm chưa rõ | "I noticed a gap in your resume from 2022. Can you explain?" |

#### 5.4.2. Dynamic Question Generation

```typescript
// Question Generation Engine
interface GeneratedQuestion {
  id: string;
  category: QuestionCategory;
  type: QuestionType;
  question: string;
  followUpPrompts: string[];
  evaluationCriteria: EvaluationCriteria[];
  expectedDuration: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard';
  relatedJDRequirement: string;
  relatedCVSection: string;
}

async function generateInterviewQuestions(
  parsedJD: ParsedJD,
  parsedCV: ParsedCV,
  matchAnalysis: MatchAnalysis
): Promise<GeneratedQuestion[]> {
  const questions: GeneratedQuestion[] = [];
  
  // 1. Generate Technical Questions based on JD requirements
  for (const skill of parsedJD.requirements.technical) {
    const question = await generateTechnicalQuestion(skill, parsedCV);
    questions.push(question);
  }
  
  // 2. Generate Experience Questions based on CV highlights
  for (const exp of parsedCV.experience.slice(0, 3)) {
    const question = await generateExperienceQuestion(exp, parsedJD);
    questions.push(question);
  }
  
  // 3. Generate Gap Questions based on match analysis
  for (const gap of matchAnalysis.gaps) {
    const question = await generateGapQuestion(gap, parsedCV);
    questions.push(question);
  }
  
  // 4. Generate Behavioral Questions
  const behavioralQuestions = await generateBehavioralQuestions(
    parsedJD.requirements.soft,
    3 // number of questions
  );
  questions.push(...behavioralQuestions);
  
  // 5. Prioritize and order questions
  return prioritizeAndOrderQuestions(questions, parsedJD.weights);
}

async function generateTechnicalQuestion(
  skill: TechnicalSkill,
  cv: ParsedCV
): Promise<GeneratedQuestion> {
  const hasExperience = cv.skills.technical.some(
    s => s.name.toLowerCase().includes(skill.name.toLowerCase())
  );
  
  const prompt = `
    Generate a technical interview question for the skill: ${skill.name}
    
    Context:
    - Required level: ${skill.level}
    - Candidate has experience: ${hasExperience}
    ${hasExperience ? `- Candidate's years of experience: ${getYearsForSkill(cv, skill)}` : ''}
    
    Requirements:
    - Question should be appropriate for ${skill.level} level
    - ${hasExperience ? 'Build upon their experience' : 'Test foundational knowledge'}
    - Include evaluation criteria for the answer
    
    Return JSON with: question, followUpPrompts[], evaluationCriteria[]
  `;
  
  return await gemini.generateContent(prompt);
}
```

#### 5.4.3. Adaptive Question Selection

Hệ thống sử dụng cơ chế adaptive questioning để điều chỉnh câu hỏi dựa trên hiệu suất của ứng viên:

```typescript
// Adaptive Question Selection
class AdaptiveQuestionEngine {
  private performanceHistory: AnswerPerformance[] = [];
  private questionBank: GeneratedQuestion[];
  
  selectNextQuestion(): GeneratedQuestion {
    const currentPerformance = this.calculateCurrentPerformance();
    
    // Adjust difficulty based on performance
    let difficulty: 'easy' | 'medium' | 'hard';
    if (currentPerformance.score > 0.8) {
      difficulty = 'hard'; // Candidate is doing well, increase difficulty
    } else if (currentPerformance.score < 0.5) {
      difficulty = 'easy'; // Struggling, ease up
    } else {
      difficulty = 'medium';
    }
    
    // Select question from appropriate pool
    const candidates = this.questionBank.filter(
      q => q.difficulty === difficulty && !this.isAsked(q.id)
    );
    
    // Apply diversity in question types
    const selected = this.applyDiversityRule(candidates);
    
    return selected;
  }
  
  calculateCurrentPerformance(): Performance {
    if (this.performanceHistory.length === 0) {
      return { score: 0.5, trend: 'neutral' };
    }
    
    const recentScores = this.performanceHistory
      .slice(-5)
      .map(p => p.score);
    
    const avgScore = average(recentScores);
    const trend = this.calculateTrend(recentScores);
    
    return { score: avgScore, trend };
  }
}
```

### 5.5. Interview Execution Logic

#### 5.5.1. Session Management

```typescript
// Interview Session State Machine
enum InterviewState {
  INIT = 'INIT',
  INTRODUCTION = 'INTRODUCTION',
  QUESTIONING = 'QUESTIONING',
  FOLLOW_UP = 'FOLLOW_UP',
  CLOSING = 'CLOSING',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED'
}

interface InterviewSession {
  id: string;
  candidateId: string;
  jdId: string;
  state: InterviewState;
  currentQuestionIndex: number;
  questions: GeneratedQuestion[];
  answers: Answer[];
  startTime: Date;
  endTime?: Date;
  metadata: {
    totalQuestions: number;
    answeredQuestions: number;
    averageResponseTime: number;
    currentScore: number;
  };
}

class InterviewStateMachine {
  private session: InterviewSession;
  
  async transition(event: InterviewEvent): Promise<InterviewState> {
    switch (this.session.state) {
      case InterviewState.INIT:
        if (event === 'START') {
          await this.handleStart();
          return InterviewState.INTRODUCTION;
        }
        break;
        
      case InterviewState.INTRODUCTION:
        if (event === 'READY') {
          await this.sendFirstQuestion();
          return InterviewState.QUESTIONING;
        }
        break;
        
      case InterviewState.QUESTIONING:
        if (event === 'ANSWER_RECEIVED') {
          await this.processAnswer();
          return InterviewState.FOLLOW_UP;
        }
        break;
        
      case InterviewState.FOLLOW_UP:
        if (event === 'FOLLOW_UP_COMPLETE') {
          if (this.hasMoreQuestions()) {
            await this.sendNextQuestion();
            return InterviewState.QUESTIONING;
          } else {
            return InterviewState.CLOSING;
          }
        }
        break;
        
      case InterviewState.CLOSING:
        if (event === 'FINISH') {
          await this.generateFinalReport();
          return InterviewState.COMPLETED;
        }
        break;
    }
    
    return this.session.state;
  }
}
```

#### 5.5.2. Real-time Response Handling

```typescript
// WebSocket-based Real-time Interview Handler
class RealtimeInterviewHandler {
  private socket: WebSocket;
  private session: InterviewSession;
  private asrService: ASRService; // Speech-to-text
  private ttsService: TTSService; // Text-to-speech
  
  async handleAnswer(audioBuffer: Buffer | text: string): Promise<void> {
    // Convert audio to text if needed
    let answerText: string;
    if (audioBuffer) {
      answerText = await this.asrService.transcribe(audioBuffer);
    } else {
      answerText = text;
    }
    
    // Store the answer
    const answer: Answer = {
      questionId: this.session.questions[this.session.currentQuestionIndex].id,
      content: answerText,
      timestamp: new Date(),
      duration: this.calculateResponseDuration()
    };
    this.session.answers.push(answer);
    
    // Evaluate the answer in real-time
    const evaluation = await this.evaluateAnswer(answer);
    
    // Determine follow-up or next question
    if (evaluation.needsFollowUp && this.canAskFollowUp()) {
      const followUp = await this.generateFollowUp(evaluation);
      await this.sendFollowUp(followUp);
    } else {
      await this.moveToNextQuestion();
    }
  }
  
  async evaluateAnswer(answer: Answer): Promise<AnswerEvaluation> {
    const question = this.session.questions.find(
      q => q.id === answer.questionId
    );
    
    const prompt = `
      Evaluate this interview answer:
      
      Question: ${question.question}
      Expected Criteria: ${JSON.stringify(question.evaluationCriteria)}
      Candidate's Answer: ${answer.content}
      
      Return JSON with:
      - score (0-100)
      - strengths[]
      - weaknesses[]
      - needsFollowUp (boolean)
      - suggestedFollowUp (string, if applicable)
    `;
    
    return await gemini.generateContent(prompt);
  }
}
```

### 5.6. Evaluation & Scoring Logic

#### 5.6.1. Multi-dimensional Scoring

Hệ thống sử dụng mô hình đánh giá đa chiều để đảm bảo đánh giá toàn diện:

```typescript
// Multi-dimensional Scoring Model
interface InterviewScore {
  overall: number; // 0-100
  dimensions: {
    technical: DimensionScore;
    experience: DimensionScore;
    communication: DimensionScore;
    problemSolving: DimensionScore;
    cultureFit: DimensionScore;
  };
  breakdown: QuestionBreakdown[];
  percentiles: {
    technical: number;
    overall: number;
  };
}

interface DimensionScore {
  score: number;
  maxScore: number;
  weight: number;
  evidence: string[];
  concerns: string[];
}

async function calculateFinalScore(
  session: InterviewSession
): Promise<InterviewScore> {
  // 1. Calculate scores for each dimension
  const technical = await this.scoreTechnical(session);
  const experience = await this.scoreExperience(session);
  const communication = await this.scoreCommunication(session);
  const problemSolving = await this.scoreProblemSolving(session);
  const cultureFit = await this.scoreCultureFit(session);
  
  // 2. Apply weights from JD
  const weights = session.jd.scoringWeights;
  
  const overall = 
    (technical.score * weights.technical) +
    (experience.score * weights.experience) +
    (communication.score * weights.communication) +
    (problemSolving.score * weights.problemSolving) +
    (cultureFit.score * weights.cultureFit);
  
  // 3. Calculate percentiles against historical data
  const percentiles = await this.calculatePercentiles(overall, technical.score);
  
  return {
    overall,
    dimensions: {
      technical,
      experience,
      communication,
      problemSolving,
      cultureFit
    },
    breakdown: this.generateBreakdown(session),
    percentiles
  };
}
```

#### 5.6.2. Sentiment & Quality Analysis

```typescript
// Advanced Answer Analysis
interface AnswerAnalysis {
  content: {
    relevance: number;      // How relevant is the answer
    completeness: number;   // Did they address all parts
    accuracy: number;       // Technical accuracy
    depth: number;          // Depth of understanding
  };
  delivery: {
    clarity: number;        // How clear was the explanation
    structure: number;      // Was it well-structured
    confidence: number;     // Confidence level detected
  };
  sentiment: {
    tone: 'positive' | 'neutral' | 'negative';
    authenticity: number;   // How genuine the answer seems
    enthusiasm: number;     // Level of enthusiasm
  };
  redFlags: string[];       // Any concerning patterns
  highlights: string[];     // Notable positive aspects
}

async function analyzeAnswer(
  answer: Answer,
  question: GeneratedQuestion
): Promise<AnswerAnalysis> {
  const prompt = `
    Analyze this interview answer comprehensively:
    
    Question: ${question.question}
    Expected Answer Criteria: ${JSON.stringify(question.evaluationCriteria)}
    Candidate's Answer: ${answer.content}
    
    Analyze and return JSON with:
    - content: {relevance, completeness, accuracy, depth} (each 0-100)
    - delivery: {clarity, structure, confidence} (each 0-100)
    - sentiment: {tone, authenticity, enthusiasm}
    - redFlags[] (any concerning patterns or inconsistencies)
    - highlights[] (notable positive aspects)
  `;
  
  return await gemini.generateContent(prompt, {
    temperature: 0.3, // Lower temperature for analysis
    model: 'gemini-2.5-pro' // Use more capable model for analysis
  });
}
```

---

## 6. API DESIGN

### 6.1. API Architecture Overview

Hệ thống API được thiết kế theo chuẩn RESTful với một số endpoint sử dụng WebSocket cho real-time communication. Tất cả API đều được version và documentation tự động thông qua OpenAPI/Swagger.

```
Base URL: https://api.hr-interview.ai/v1

Authentication: Bearer Token (JWT)
Content-Type: application/json
Rate Limit: 100 requests/minute (authenticated)
```

### 6.2. Core API Endpoints

#### 6.2.1. Authentication APIs

```yaml
# POST /auth/register
# Đăng ký tài khoản mới (cho ứng viên hoặc HR)
Request:
  {
    "email": "string",
    "password": "string",
    "role": "candidate" | "recruiter" | "admin",
    "profile": {
      "firstName": "string",
      "lastName": "string",
      "company?" : "string"  # Required for recruiters
    }
  }
Response:
  {
    "success": true,
    "data": {
      "userId": "uuid",
      "email": "string",
      "role": "string",
      "token": "jwt_token"
    }
  }

# POST /auth/login
# Đăng nhập
Request:
  {
    "email": "string",
    "password": "string"
  }
Response:
  {
    "success": true,
    "data": {
      "userId": "uuid",
      "email": "string",
      "role": "string",
      "token": "jwt_token",
      "refreshToken": "jwt_refresh_token"
    }
  }

# POST /auth/refresh
# Refresh access token
Request:
  {
    "refreshToken": "string"
  }
Response:
  {
    "success": true,
    "data": {
      "token": "new_jwt_token",
      "refreshToken": "new_refresh_token"
    }
  }
```

#### 6.2.2. Job Description APIs

```yaml
# POST /jds
# Tạo JD mới
Request:
  {
    "title": "string",
    "department": "string",
    "description": "string",  # Raw JD text or structured
    "requirements?" : {
      "technical": [...],
      "soft": [...],
      "experience": {...}
    },
    "settings": {
      "interviewDuration": 30,  # minutes
      "questionCount": 15,
      "difficulty": "adaptive" | "fixed"
    }
  }
Response:
  {
    "success": true,
    "data": {
      "id": "uuid",
      "title": "string",
      "parsedRequirements": {...},
      "evaluationRubric": {...},
      "createdAt": "ISO-date"
    }
  }

# GET /jds
# Lấy danh sách JD
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20)
  - status: "active" | "archived" | "all"
  - search: string
Response:
  {
    "success": true,
    "data": {
      "items": [...],
      "pagination": {
        "total": number,
        "page": number,
        "limit": number,
        "totalPages": number
      }
    }
  }

# GET /jds/{id}
# Lấy chi tiết JD

# PUT /jds/{id}
# Cập nhật JD

# DELETE /jds/{id}
# Xóa JD (soft delete)

# POST /jds/{id}/analyze
# Phân tích lại JD với AI
```

#### 6.2.3. Candidate & CV APIs

```yaml
# POST /candidates
# Tạo hồ sơ ứng viên mới
Request:
  {
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone?" : "string",
    "jdId": "uuid"  # JD they're applying for
  }
Response:
  {
    "success": true,
    "data": {
      "id": "uuid",
      "email": "string",
      "status": "pending_cv"
    }
  }

# POST /candidates/{id}/cv
# Upload CV cho ứng viên
Request: multipart/form-data
  - file: File (PDF/DOCX)
  - parseImmediately: boolean
Response:
  {
    "success": true,
    "data": {
      "cvId": "uuid",
      "parseStatus": "completed" | "processing",
      "parsedData?" : {
        "skills": [...],
        "experience": [...],
        "education": [...]
      },
      "matchScore?" : {
        "overall": number,
        "breakdown": {...}
      }
    }
  }

# GET /candidates/{id}/analysis
# Lấy phân tích CV chi tiết

# GET /candidates
# Lấy danh sách ứng viên
Query Parameters:
  - page, limit, search
  - jdId: filter by job
  - status: "pending" | "matched" | "interviewed" | "hired" | "rejected"
  - minScore: minimum match score
```

#### 6.2.4. Interview APIs

```yaml
# POST /interviews
# Tạo phiên phỏng vấn mới
Request:
  {
    "candidateId": "uuid",
    "jdId": "uuid",
    "settings?" : {
      "mode": "text" | "voice" | "hybrid",
      "language": "vi" | "en",
      "maxDuration": 30,  # minutes
      "adaptiveDifficulty": true
    }
  }
Response:
  {
    "success": true,
    "data": {
      "interviewId": "uuid",
      "status": "scheduled",
      "questionsGenerated": number,
      "estimatedDuration": number,
      "joinUrl": "string"  # URL for candidate to join
    }
  }

# GET /interviews/{id}
# Lấy thông tin phiên phỏng vấn

# POST /interviews/{id}/start
# Bắt đầu phiên phỏng vấn
Response:
  {
    "success": true,
    "data": {
      "websocketUrl": "wss://...",
      "sessionToken": "string",
      "firstQuestion": {
        "id": "uuid",
        "question": "string",
        "type": "string"
      }
    }
  }

# POST /interviews/{id}/answer
# Gửi câu trả lời (cho text mode)
Request:
  {
    "questionId": "uuid",
    "answer": "string",
    "duration": number  # seconds taken
  }
Response:
  {
    "success": true,
    "data": {
      "processed": true,
      "nextQuestion?" : {...},
      "followUp?" : {
        "question": "string",
        "reason": "string"
      },
      "isComplete": boolean
    }
  }

# POST /interviews/{id}/complete
# Kết thúc phiên phỏng vấn
Response:
  {
    "success": true,
    "data": {
      "status": "completed",
      "reportId": "uuid",
      "preliminaryScore": number
    }
  }

# GET /interviews/{id}/report
# Lấy báo cáo phỏng vấn chi tiết
Response:
  {
    "success": true,
    "data": {
      "interviewId": "uuid",
      "candidate": {...},
      "jobPosition": {...},
      "scores": {
        "overall": number,
        "dimensions": {...}
      },
      "transcript": [...],
      "analysis": {
        "strengths": [...],
        "weaknesses": [...],
        "redFlags": [...],
        "recommendations": "hire" | "consider" | "reject"
      },
      "comparison": {
        "rank": number,
        "percentile": number
      }
    }
  }
```

#### 6.2.5. WebSocket Events (Real-time Interview)

```yaml
# Connection: wss://api.hr-interview.ai/v1/ws/interviews/{id}

# Client -> Server Events:
{
  "event": "answer",
  "data": {
    "type": "text" | "audio",
    "content": "string | base64_audio",
    "questionId": "uuid"
  }
}

{
  "event": "heartbeat",
  "data": { "timestamp": number }
}

# Server -> Client Events:
{
  "event": "question",
  "data": {
    "id": "uuid",
    "question": "string",
    "type": "technical" | "behavioral" | ...,
    "audioUrl?" : "string"  # TTS generated
  }
}

{
  "event": "follow_up",
  "data": {
    "question": "string",
    "context": "string",
    "audioUrl?" : "string"
  }
}

{
  "event": "acknowledgment",
  "data": {
    "received": true,
    "processing": true
  }
}

{
  "event": "transcription",
  "data": {
    "text": "string",
    "confidence": number,
    "isFinal": boolean
  }
}

{
  "event": "complete",
  "data": {
    "reportUrl": "string",
    "preliminaryScore": number
  }
}
```

### 6.3. Error Handling

```typescript
// Standardized Error Response
interface APIError {
  success: false;
  error: {
    code: string;          // e.g., "VALIDATION_ERROR"
    message: string;       // Human-readable message
    details?: any;         // Additional context
    requestId: string;     // For support reference
  };
}

// Error Codes
enum ErrorCode {
  // Authentication (1xxx)
  UNAUTHORIZED = 'AUTH_1001',
  INVALID_TOKEN = 'AUTH_1002',
  TOKEN_EXPIRED = 'AUTH_1003',
  
  // Validation (2xxx)
  VALIDATION_ERROR = 'VAL_2001',
  INVALID_INPUT = 'VAL_2002',
  FILE_TOO_LARGE = 'VAL_2003',
  UNSUPPORTED_FORMAT = 'VAL_2004',
  
  // Resource (3xxx)
  NOT_FOUND = 'RES_3001',
  ALREADY_EXISTS = 'RES_3002',
  
  // Business Logic (4xxx)
  INTERVIEW_NOT_READY = 'BIZ_4001',
  CV_PARSE_FAILED = 'BIZ_4002',
  MATCH_FAILED = 'BIZ_4003',
  
  // External Service (5xxx)
  AI_SERVICE_ERROR = 'EXT_5001',
  STORAGE_ERROR = 'EXT_5002',
  
  // Rate Limiting (6xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_6001'
}
```

---

## 7. DATABASE DESIGN

### 7.1. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      users       │       │   job_positions  │       │    candidates    │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ email            │       │ title            │       │ user_id (FK)     │──┐
│ password_hash    │       │ department       │       │ first_name       │  │
│ role             │       │ created_by (FK)  │──┐    │ last_name        │  │
│ created_at       │       │ status           │  │    │ email            │  │
│ updated_at       │       │ created_at       │  │    │ phone            │  │
└──────────────────┘       │ parsed_data      │  │    │ status           │  │
                           │ evaluation_rubric│  │    │ created_at       │  │
                           └──────────────────┘  │    └──────────────────┘  │
                                   │              │            │             │
                                   │              │            │             │
                                   ▼              │            ▼             │
                           ┌──────────────────┐  │    ┌──────────────────┐  │
                           │job_requirements  │  │    │       cvs        │  │
                           ├──────────────────┤  │    ├──────────────────┤  │
                           │ id (PK)          │  │    │ id (PK)          │  │
                           │ job_id (FK)      │◀─┤    │ candidate_id(FK) │◀─┤
                           │ type             │     │ file_url         │  │
                           │ name             │     │ parsed_data      │  │
                           │ level            │     │ embeddings       │  │
                           │ weight           │     │ match_score      │  │
                           │ is_required      │     │ uploaded_at      │  │
                           └──────────────────┘     └──────────────────┘  │
                                                             │              │
                                                             │              │
                                                             ▼              │
                                                    ┌──────────────────┐     │
                                                    │    interviews    │     │
                                                    ├──────────────────┤     │
                                                    │ id (PK)          │     │
                                                    │ candidate_id(FK) │◀────┘
                                                    │ job_id (FK)      │◀───────┐
                                                    │ status           │        │
                                                    │ mode             │        │
                                                    │ started_at       │        │
                                                    │ completed_at     │        │
                                                    │ settings         │        │
                                                    └──────────────────┘        │
                                                             │                 │
                              ┌───────────────────────────────┼───────────────┐ │
                              ▼                               ▼               ▼ │
                    ┌──────────────────┐           ┌──────────────────┐        │
                    │ interview_questions│          │interview_answers │        │
                    ├──────────────────┤           ├──────────────────┤        │
                    │ id (PK)          │           │ id (PK)          │        │
                    │ interview_id (FK)│           │ question_id (FK) │        │
                    │ category         │           │ answer_text      │        │
                    │ question_text    │           │ duration_seconds │        │
                    │ order_index      │           │ audio_url        │        │
                    │ difficulty       │           │ answered_at      │        │
                    │ expected_criteria│           └──────────────────┘        │
                    └──────────────────┘                     │                 │
                              │                              ▼                 │
                              │                    ┌──────────────────┐        │
                              │                    │answer_evaluations│        │
                              │                    ├──────────────────┤        │
                              │                    │ id (PK)          │        │
                              │                    │ answer_id (FK)   │        │
                              │                    │ score            │        │
                              │                    │ strengths       │        │
                              │                    │ weaknesses      │        │
                              │                    │ sentiment_data  │        │
                              │                    └──────────────────┘        │
                              │                                                  │
                              └──────────────────────────────────────────────────┘
                                                     │
                                                     ▼
                                           ┌──────────────────┐
                                           │interview_reports │
                                           ├──────────────────┤
                                           │ id (PK)          │
                                           │ interview_id (FK)│
                                           │ overall_score    │
                                           │ dimension_scores │
                                           │ strengths        │
                                           │ weaknesses       │
                                           │ recommendation   │
                                           │ transcript       │
                                           │ created_at       │
                                           └──────────────────┘
```

### 7.2. Detailed Table Schemas

#### 7.2.1. Users & Authentication

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### 7.2.2. Job Positions & Requirements

```sql
CREATE TABLE job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    employment_type VARCHAR(20) CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'remote')),
    description TEXT,
    raw_jd_text TEXT,
    parsed_data JSONB,
    evaluation_rubric JSONB,
    interview_settings JSONB DEFAULT '{
        "duration": 30,
        "questionCount": 15,
        "difficulty": "adaptive"
    }',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES job_positions(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('technical', 'soft', 'experience', 'education', 'certification')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(50),
    years_required INTEGER,
    is_required BOOLEAN DEFAULT true,
    weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_status ON job_positions(status);
CREATE INDEX idx_jobs_created_by ON job_positions(created_by);
CREATE INDEX idx_requirements_job ON job_requirements(job_id);
```

#### 7.2.3. Candidates & CVs

```sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    current_status VARCHAR(20) DEFAULT 'new' CHECK (current_status IN ('new', 'screening', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn')),
    source VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    raw_text TEXT,
    parsed_data JSONB,
    embeddings VECTOR(768),  -- Using pgvector extension
    parsing_status VARCHAR(20) DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
    parsing_error TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE TABLE cv_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(20) CHECK (skill_category IN ('technical', 'soft', 'language', 'tool')),
    proficiency_level VARCHAR(20),
    years_experience INTEGER,
    source_section VARCHAR(50),
    confidence_score DECIMAL(5,2)
);

CREATE TABLE cv_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE,
    company VARCHAR(255),
    title VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    description TEXT,
    extracted_skills JSONB,
    location VARCHAR(100)
);

CREATE TABLE cv_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE,
    institution VARCHAR(255),
    degree VARCHAR(100),
    field_of_study VARCHAR(100),
    start_date DATE,
    end_date DATE,
    gpa DECIMAL(3,2),
    description TEXT
);

CREATE INDEX idx_candidates_status ON candidates(current_status);
CREATE INDEX idx_cvs_candidate ON cvs(candidate_id);
CREATE INDEX idx_cv_skills_name ON cv_skills(skill_name);
CREATE INDEX idx_cv_skills_cv ON cv_skills(cv_id);
```

#### 7.2.4. Interviews & Sessions

```sql
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id),
    job_id UUID REFERENCES job_positions(id),
    round_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'expired')),
    mode VARCHAR(20) DEFAULT 'text' CHECK (mode IN ('text', 'voice', 'hybrid')),
    language VARCHAR(10) DEFAULT 'vi',
    settings JSONB,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(candidate_id, job_id, round_number)
);

CREATE TABLE interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_category VARCHAR(30) CHECK (question_category IN (
        'technical_knowledge', 'technical_problem', 'experience', 
        'behavioral', 'situational', 'culture_fit', 'gap_analysis'
    )),
    question_type VARCHAR(30),
    difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    order_index INTEGER NOT NULL,
    related_requirement_id UUID REFERENCES job_requirements(id),
    expected_answer_criteria JSONB,
    follow_up_prompts JSONB,
    max_score INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interview_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES interview_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    audio_url VARCHAR(500),
    duration_seconds INTEGER,
    word_count INTEGER,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transcription_confidence DECIMAL(5,2)
);

CREATE TABLE answer_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID REFERENCES interview_answers(id) ON DELETE CASCADE,
    score INTEGER,
    max_score INTEGER DEFAULT 100,
    dimension_scores JSONB,
    strengths JSONB,
    weaknesses JSONB,
    sentiment_analysis JSONB,
    quality_metrics JSONB,
    needs_follow_up BOOLEAN DEFAULT false,
    follow_up_question TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_job ON interviews(job_id);
CREATE INDEX idx_questions_interview ON interview_questions(interview_id);
CREATE INDEX idx_answers_question ON interview_answers(question_id);
```

#### 7.2.5. Reports & Analytics

```sql
CREATE TABLE interview_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id),
    job_id UUID REFERENCES job_positions(id),
    overall_score DECIMAL(5,2),
    dimension_scores JSONB,
    strengths JSONB,
    weaknesses JSONB,
    red_flags JSONB,
    highlights JSONB,
    recommendation VARCHAR(20) CHECK (recommendation IN ('strongly_recommend', 'recommend', 'consider', 'reject')),
    recommendation_reason TEXT,
    detailed_analysis JSONB,
    comparison_data JSONB,
    transcript JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interview_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    total_questions INTEGER,
    questions_answered INTEGER,
    average_response_time_seconds INTEGER,
    total_words_spoken INTEGER,
    sentiment_trend JSONB,
    difficulty_progression JSONB,
    score_progression JSONB,
    completion_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_interview ON interview_reports(interview_id);
CREATE INDEX idx_reports_candidate ON interview_reports(candidate_id);
CREATE INDEX idx_reports_recommendation ON interview_reports(recommendation);
```

---

## 8. GEMINI INTEGRATION

### 8.1. Gemini Models Selection

Hệ thống sử dụng các model Gemini khác nhau cho các mục đích khác nhau:

| Use Case | Model | Lý do |
|----------|-------|-------|
| JD/CV Parsing | Gemini 2.5 Flash | Nhanh, hiệu quả cho structured extraction |
| Question Generation | Gemini 2.5 Pro | Cần reasoning tốt hơn |
| Answer Evaluation | Gemini 2.5 Pro | Cần phân tích sâu |
| Real-time Chat | Gemini 2.5 Flash | Nhanh cho tương tác real-time |
| Embeddings | Gemini Embedding API | Cho semantic matching |

### 8.2. Gemini API Integration Code

```typescript
// lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private models = {
    flash: null as any,
    pro: null as any,
    embedding: null as any
  };

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async initialize() {
    this.models.flash = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-latest' 
    });
    this.models.pro = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro-latest' 
    });
  }

  async generateContent(
    prompt: string,
    options: {
      model?: 'flash' | 'pro';
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
    } = {}
  ) {
    const model = options.model === 'pro' ? this.models.pro : this.models.flash;
    
    const generationConfig: any = {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2048,
    };

    if (options.jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig
    });

    return result.response.text();
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ 
      model: 'text-embedding-004' 
    });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ 
      model: 'text-embedding-004' 
    });
    
    const results = await Promise.all(
      texts.map(text => model.embedContent(text))
    );
    
    return results.map(r => r.embedding.values);
  }
}

export const geminiClient = new GeminiClient();
```

### 8.3. Prompt Engineering

#### 8.3.1. JD Parsing Prompt

```typescript
const JD_PARSING_PROMPT = `
You are an expert HR analyst. Parse the following Job Description and extract structured information.

IMPORTANT INSTRUCTIONS:
1. Identify ALL technical skills mentioned (programming languages, frameworks, tools)
2. Extract soft skills and their context
3. Determine experience requirements in years
4. Identify education and certification requirements
5. Extract key responsibilities
6. Determine job level based on requirements

OUTPUT FORMAT (JSON):
{
  "position": {
    "title": "string",
    "level": "junior|mid|senior|lead|manager|director",
    "department": "string",
    "location": "string",
    "employmentType": "full-time|part-time|contract|remote"
  },
  "requirements": {
    "technical": [
      {
        "name": "skill name",
        "level": "beginner|intermediate|advanced|expert",
        "yearsRequired": number or null,
        "isRequired": boolean
      }
    ],
    "soft": [
      {
        "name": "skill name",
        "context": "how it's used in the role",
        "isRequired": boolean
      }
    ],
    "experience": {
      "totalYears": number,
      "specificExperience": ["specific experience areas"]
    },
    "education": [
      {
        "level": "bachelor|master|phd|any",
        "field": "field of study",
        "isRequired": boolean
      }
    ],
    "certifications": ["certification names"]
  },
  "responsibilities": [
    {
      "description": "responsibility text",
      "skills": ["related skills"]
    }
  ],
  "benefits": ["benefit list"],
  "keywords": ["important keywords for matching"]
}

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON, no additional text.
`;
```

#### 8.3.2. CV Parsing Prompt

```typescript
const CV_PARSING_PROMPT = `
You are an expert resume parser. Extract all relevant information from this resume/CV.

IMPORTANT INSTRUCTIONS:
1. Extract personal/contact information
2. Parse ALL work experiences with details
3. Identify ALL skills (technical, soft skills, languages, tools)
4. Extract education history
5. Identify certifications and achievements
6. Note any gaps or inconsistencies

OUTPUT FORMAT (JSON):
{
  "personal": {
    "name": "full name",
    "email": "email address",
    "phone": "phone number or null",
    "location": "city, country or null",
    "linkedin": "linkedin url or null",
    "portfolio": "portfolio url or null"
  },
  "summary": "professional summary or null",
  "experience": [
    {
      "company": "company name",
      "title": "job title",
      "startDate": "YYYY-MM or null",
      "endDate": "YYYY-MM or null (null if current)",
      "isCurrent": boolean,
      "description": "full description",
      "skills": ["skills used in this role"],
      "achievements": ["notable achievements"]
    }
  ],
  "education": [
    {
      "institution": "school name",
      "degree": "degree type",
      "field": "field of study",
      "startDate": "YYYY-MM or null",
      "endDate": "YYYY-MM or null",
      "gpa": "GPA or null"
    }
  ],
  "skills": {
    "technical": [
      {
        "name": "skill name",
        "yearsExperience": number or null,
        "proficiency": "beginner|intermediate|advanced|expert"
      }
    ],
    "soft": ["soft skills"],
    "languages": [
      {
        "language": "language name",
        "proficiency": "basic|conversational|fluent|native"
      }
    ],
    "tools": ["software/tools known"]
  },
  "certifications": [
    {
      "name": "certification name",
      "issuer": "issuing organization",
      "date": "YYYY-MM or null"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "brief description",
      "technologies": ["technologies used"]
    }
  ],
  "achievements": ["notable achievements or awards"],
  "careerGaps": [
    {
      "period": "date range",
      "duration": "duration text"
    }
  ]
}

RESUME TEXT:
{cv_text}

Return ONLY valid JSON, no additional text.
`;
```

#### 8.3.3. Question Generation Prompt

```typescript
const QUESTION_GENERATION_PROMPT = `
You are an expert interviewer creating interview questions for a candidate.

CONTEXT:
Job Position: {job_title}
Job Level: {job_level}

JOB REQUIREMENTS:
{job_requirements}

CANDIDATE PROFILE:
{candidate_profile}

MATCH ANALYSIS:
{match_analysis}

INSTRUCTIONS:
Generate {num_questions} interview questions tailored to this specific candidate.
- For skills they have: create questions that test depth of knowledge
- For skills they lack: create questions to assess learning ability/awareness
- Include behavioral and situational questions
- Consider any career gaps or inconsistencies

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "id": "unique-id",
      "category": "technical_knowledge|technical_problem|experience|behavioral|situational|culture_fit|gap_analysis",
      "type": "knowledge|problem_solving|experience|behavioral|situational",
      "question": "the actual question text",
      "difficulty": "easy|medium|hard",
      "relatedRequirement": "which job requirement this tests",
      "evaluationCriteria": [
        {
          "criterion": "what to look for",
          "excellentAnswer": "description of excellent response",
          "goodAnswer": "description of good response",
          "poorAnswer": "description of poor response"
        }
      ],
      "followUpPrompts": ["possible follow-up questions"],
      "expectedDuration": estimated_seconds
    }
  ]
}

Generate questions now:
`;
```

#### 8.3.4. Answer Evaluation Prompt

```typescript
const ANSWER_EVALUATION_PROMPT = `
You are an expert interviewer evaluating a candidate's answer.

QUESTION:
{question_text}

QUESTION CONTEXT:
- Category: {category}
- Difficulty: {difficulty}
- Evaluation Criteria: {evaluation_criteria}

CANDIDATE'S ANSWER:
{answer_text}

INSTRUCTIONS:
Evaluate the answer comprehensively. Be fair and objective.

OUTPUT FORMAT (JSON):
{
  "score": number (0-100),
  "dimensionScores": {
    "accuracy": number (0-100),
    "completeness": number (0-100),
    "clarity": number (0-100),
    "depth": number (0-100)
  },
  "strengths": [
    {
      "point": "what was good",
      "evidence": "quote from answer"
    }
  ],
  "weaknesses": [
    {
      "point": "what was missing or incorrect",
      "suggestion": "how to improve"
    }
  ],
  "sentiment": {
    "tone": "positive|neutral|negative",
    "confidence": number (0-100),
    "authenticity": number (0-100)
  },
  "keyPointsCovered": ["points from criteria that were addressed"],
  "keyPointsMissed": ["important points not addressed"],
  "redFlags": ["any concerning elements or inconsistencies"],
  "needsFollowUp": boolean,
  "followUpSuggestion": "question to dig deeper if needed",
  "overallFeedback": "brief summary of the answer quality"
}

Evaluate now:
`;
```

### 8.4. Rate Limiting & Cost Management

```typescript
// lib/gemini/rate-limiter.ts
import Bottleneck from 'bottleneck';

class GeminiRateLimiter {
  private limiters = {
    // Gemini Flash: 15 RPM, 1M TPM for free tier
    flash: new Bottleneck({
      reservoir: 15,
      reservoirRefreshAmount: 15,
      reservoirRefreshInterval: 60 * 1000,
      maxConcurrent: 5
    }),
    // Gemini Pro: 2 RPM, 32K TPM for free tier
    pro: new Bottleneck({
      reservoir: 2,
      reservoirRefreshAmount: 2,
      reservoirRefreshInterval: 60 * 1000,
      maxConcurrent: 2
    }),
    // Embeddings: 100 RPM
    embedding: new Bottleneck({
      reservoir: 100,
      reservoirRefreshAmount: 100,
      reservoirRefreshInterval: 60 * 1000,
      maxConcurrent: 10
    })
  };

  async executeFlash<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiters.flash.schedule(fn);
  }

  async executePro<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiters.pro.schedule(fn);
  }

  async executeEmbedding<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiters.embedding.schedule(fn);
  }
}

// Cost tracking
class GeminiCostTracker {
  private dailyUsage = {
    flashTokens: 0,
    proTokens: 0,
    embeddingCount: 0
  };

  trackUsage(model: string, inputTokens: number, outputTokens: number) {
    const totalTokens = inputTokens + outputTokens;
    
    if (model.includes('flash')) {
      this.dailyUsage.flashTokens += totalTokens;
    } else if (model.includes('pro')) {
      this.dailyUsage.proTokens += totalTokens;
    }
    
    // Check limits and alert if approaching
    this.checkLimits();
  }

  private checkLimits() {
    // Alert if approaching 80% of daily limits
    if (this.dailyUsage.flashTokens > 800000) {
      console.warn('Approaching Flash daily token limit');
    }
    if (this.dailyUsage.proTokens > 25000) {
      console.warn('Approaching Pro daily token limit');
    }
  }
}
```

---

## 9. SECURITY & PRIVACY

### 9.1. Authentication & Authorization

#### 9.1.1. JWT-based Authentication

```typescript
// lib/auth/jwt.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'admin';
  permissions: string[];
}

class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getPermissions(user.role)
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  }

  private getPermissions(role: string): string[] {
    const permissions = {
      candidate: ['read:own', 'write:own', 'interview:participate'],
      recruiter: [
        'read:candidates', 'write:jds', 'read:reports',
        'interview:schedule', 'analytics:view'
      ],
      admin: ['*']
    };
    return permissions[role] || [];
  }
}
```

#### 9.1.2. Role-Based Access Control (RBAC)

```typescript
// Middleware for authorization
const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as TokenPayload;
    
    if (user.permissions.includes('*') || user.permissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      }
    });
  };
};

// Usage in routes
router.post('/jds', 
  authenticate, 
  requirePermission('write:jds'), 
  createJD
);

router.get('/candidates',
  authenticate,
  requirePermission('read:candidates'),
  listCandidates
);
```

### 9.2. Data Protection

#### 9.2.1. Encryption at Rest

```typescript
// Encrypt sensitive fields in database
import { encrypt, decrypt } from './crypto';

// Schema modification for sensitive fields
// CV parsed data might contain sensitive info
const encryptSensitiveData = (data: any) => {
  return {
    ...data,
    personal: {
      ...data.personal,
      phone: data.personal.phone ? encrypt(data.personal.phone) : null,
      email: encrypt(data.personal.email)
    }
  };
};
```

#### 9.2.2. Data Anonymization

```typescript
// For analytics and reporting
const anonymizeCandidate = (candidate: Candidate) => {
  return {
    ...candidate,
    email: hashEmail(candidate.email),
    phone: null,
    name: anonymizeName(candidate.name),
    personalInfo: undefined
  };
};

// GDPR right to be forgotten
const deleteCandidateData = async (candidateId: string) => {
  // Soft delete with anonymization
  await db.candidates.update({
    where: { id: candidateId },
    data: {
      email: `deleted_${Date.now()}@deleted.com`,
      firstName: 'Deleted',
      lastName: 'User',
      phone: null,
      status: 'deleted',
      deletedAt: new Date()
    }
  });

  // Delete associated files
  await storage.deleteFiles(`candidates/${candidateId}/`);
  
  // Anonymize in reports but keep aggregate stats
  await db.interview_reports.updateMany({
    where: { candidate_id: candidateId },
    data: { candidate_data: null, anonymized: true }
  });
};
```

### 9.3. Input Validation & Sanitization

```typescript
// Using Zod for validation
import { z } from 'zod';

const JDCreateSchema = z.object({
  title: z.string().min(3).max(255),
  department: z.string().max(100).optional(),
  description: z.string().min(50).max(50000),
  requirements: z.object({
    technical: z.array(z.object({
      name: z.string().max(100),
      level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
      yearsRequired: z.number().min(0).max(50).optional()
    })).optional(),
    soft: z.array(z.string().max(100)).optional()
  }).optional()
});

const CVUploadSchema = z.object({
  file: z.custom<File>((file) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return validTypes.includes(file.type) && file.size <= maxSize;
  }, {
    message: 'Invalid file. Must be PDF or DOCX, max 10MB'
  })
});

// Sanitize user input before sending to AI
const sanitizeForAI = (input: string): string => {
  // Remove potential prompt injection attempts
  return input
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/<[^>]*>/g, '') // Remove HTML
    .replace(/\b(ignore|override|system|prompt)\b/gi, '') // Remove potential injection words
    .trim()
    .slice(0, 10000); // Limit length
};
```

### 9.4. Audit Logging

```typescript
// Comprehensive audit logging
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  changes?: any;
  status: 'success' | 'failure';
  errorMessage?: string;
}

const logAudit = async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
  await db.audit_logs.create({
    data: {
      ...log,
      timestamp: new Date()
    }
  });
};

// Middleware to log all API access
const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  
  res.json = (body) => {
    logAudit({
      userId: req.user?.userId || 'anonymous',
      action: `${req.method} ${req.path}`,
      resourceType: req.params.resourceType || 'unknown',
      resourceId: req.params.id || 'unknown',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || '',
      status: res.statusCode < 400 ? 'success' : 'failure'
    });
    
    return originalJson(body);
  };
  
  next();
};
```

### 9.5. Security Headers & CORS

```typescript
// Security middleware configuration
import helmet from 'helmet';
import cors from 'cors';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.gemini.google.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
```

---

## 10. IMPLEMENTATION ROADMAP

### 10.1. Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMPLEMENTATION TIMELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: FOUNDATION (Week 1-4)                                             │
│  ├── Project setup & infrastructure                                         │
│  ├── Authentication & authorization                                         │
│  ├── Basic API structure                                                    │
│  └── Database setup                                                         │
│                                                                              │
│  PHASE 2: CORE FEATURES (Week 5-10)                                         │
│  ├── JD management & parsing                                                │
│  ├── CV upload & parsing                                                    │
│  ├── JD-CV matching                                                         │
│  └── Question generation                                                    │
│                                                                              │
│  PHASE 3: INTERVIEW SYSTEM (Week 11-16)                                     │
│  ├── Interview session management                                           │
│  ├── Real-time interview interface                                          │
│  ├── Answer evaluation                                                      │
│  └── Adaptive questioning                                                   │
│                                                                              │
│  PHASE 4: ANALYTICS & REPORTING (Week 17-20)                                │
│  ├── Comprehensive reporting                                                │
│  ├── Analytics dashboard                                                    │
│  ├── Comparison & ranking                                                   │
│  └── Export & notifications                                                 │
│                                                                              │
│  PHASE 5: POLISH & DEPLOYMENT (Week 21-24)                                  │
│  ├── Performance optimization                                               │
│  ├── Security audit                                                         │
│  ├── User testing                                                           │
│  └── Production deployment                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2. Detailed Phase Breakdown

#### Phase 1: Foundation (Week 1-4)

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 1 | - Initialize Next.js project<br>- Setup Docker environment<br>- Configure CI/CD pipeline<br>- Setup development tools | Project skeleton, Docker setup, GitHub Actions |
| 2 | - Design database schema<br>- Setup PostgreSQL & Prisma<br>- Implement basic models<br>- Database migrations | Database schema, Prisma models, migrations |
| 3 | - Implement JWT authentication<br>- User registration/login<br>- Role-based authorization<br>- Session management | Auth service, protected routes |
| 4 | - Basic API structure<br>- Error handling middleware<br>- Request validation<br>- API documentation setup | API foundation, Swagger docs |

#### Phase 2: Core Features (Week 5-10)

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 5 | - JD CRUD operations<br>- JD input validation<br>- Gemini integration setup<br>- JD parsing service | JD management module |
| 6 | - JD analysis & extraction<br>- Requirement identification<br>- Evaluation rubric generation<br>- JD search functionality | JD parsing & analysis |
| 7 | - CV upload functionality<br>- File validation & storage<br>- CV parsing service<br>- Text extraction | CV upload & basic parsing |
| 8 | - CV analysis & extraction<br>- Skill identification<br>- Experience parsing<br>- Education extraction | CV analysis module |
| 9 | - Embedding generation<br>- Semantic similarity<br>- Keyword matching<br>- Overall matching algorithm | JD-CV matching system |
| 10 | - Question generation logic<br>- Question categorization<br>- Question prioritization<br>- Question storage | Question generation service |

#### Phase 3: Interview System (Week 11-16)

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 11 | - Interview session model<br>- Session state machine<br>- WebSocket setup<br>- Session persistence | Interview session management |
| 12 | - Interview UI development<br>- Real-time communication<br>- Speech-to-text integration<br>- Text-to-speech integration | Interview interface |
| 13 | - Answer processing<br>- Real-time evaluation<br>- Follow-up generation<br>- Progress tracking | Real-time interview flow |
| 14 | - Answer evaluation engine<br>- Multi-dimensional scoring<br>- Sentiment analysis<br>- Quality metrics | Evaluation service |
| 15 | - Adaptive question selection<br>- Difficulty adjustment<br>- Question diversity<br>- Interview pacing | Adaptive interview system |
| 16 | - Interview completion<br>- Score aggregation<br>- Session cleanup<br>- Result storage | Complete interview flow |

#### Phase 4: Analytics & Reporting (Week 17-20)

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 17 | - Report generation<br>- Dimension breakdown<br>- Strengths/weaknesses<br>- Recommendations | Interview reports |
| 18 | - Analytics data models<br>- Aggregate statistics<br>- Trend analysis<br>- Export functionality | Analytics backend |
| 19 | - Dashboard development<br>- Visualization components<br>- Comparison views<br>- Filter & search | Analytics dashboard |
| 20 | - Notification system<br>- Email reports<br>- Webhook integrations<br>- Alert system | Notification service |

#### Phase 5: Polish & Deployment (Week 21-24)

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 21 | - Performance optimization<br>- Caching implementation<br>- Query optimization<br>- Load testing | Optimized system |
| 22 | - Security audit<br>- Penetration testing<br>- Vulnerability fixes<br>- Compliance review | Security hardening |
| 23 | - User acceptance testing<br>- Bug fixes<br>- UI/UX refinements<br>- Documentation | Polished product |
| 24 | - Production deployment<br>- Monitoring setup<br>- Backup configuration<br>- Go-live checklist | Production system |

### 10.3. Team Structure & Resources

| Role | Count | Responsibilities |
|------|-------|------------------|
| Tech Lead / Architect | 1 | Architecture decisions, code review, technical direction |
| Backend Developer | 2 | API development, database, integrations |
| Frontend Developer | 2 | UI development, user experience |
| AI/ML Engineer | 1 | Gemini integration, prompt engineering, AI logic |
| DevOps Engineer | 1 | Infrastructure, CI/CD, monitoring |
| QA Engineer | 1 | Testing, quality assurance |
| Product Manager | 1 | Requirements, roadmap, stakeholder communication |

### 10.4. Key Milestones

| Milestone | Date | Success Criteria |
|-----------|------|------------------|
| M1: Foundation Complete | Week 4 | Auth working, API structure ready |
| M2: JD/CV Processing | Week 10 | End-to-end JD/CV parsing and matching |
| M3: Interview MVP | Week 16 | Complete interview flow working |
| M4: Reporting MVP | Week 20 | Reports and analytics functional |
| M5: Production Ready | Week 24 | All features tested, deployed |

---

## 11. COST ESTIMATION

### 11.1. Development Costs

| Category | Item | Cost (USD) |
|----------|------|------------|
| **Personnel** (6 months) | | |
| | Tech Lead | $60,000 |
| | Backend Developers (2) | $72,000 |
| | Frontend Developers (2) | $72,000 |
| | AI/ML Engineer | $36,000 |
| | DevOps Engineer | $18,000 |
| | QA Engineer | $18,000 |
| | Product Manager | $24,000 |
| **Infrastructure** | | |
| | Cloud hosting (AWS/GCP) | $5,000 |
| | Domain & SSL | $500 |
| | Third-party services | $2,000 |
| **Tools & Licenses** | | |
| | Development tools | $2,000 |
| | Monitoring & logging | $1,500 |
| **Contingency** | 10% | $31,100 |
| **TOTAL** | | **$342,100** |

### 11.2. Operational Costs (Monthly)

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| **Gemini API** | | |
| - Flash (100K requests) | Pay-as-you-go | ~$200 |
| - Pro (10K requests) | Pay-as-you-go | ~$150 |
| - Embeddings (1M) | Pay-as-you-go | ~$50 |
| **Cloud Infrastructure** | | |
| - Compute (Kubernetes) | 4 nodes | $400 |
| - Database (PostgreSQL) | Managed | $150 |
| - Redis | Managed | $50 |
| - Storage (S3) | 500GB | $25 |
| **Third-party Services** | | |
| - SendGrid | Pro | $90 |
| - Monitoring | Pro | $100 |
| **TOTAL** | | **~$1,215/month** |

### 11.3. Gemini API Cost Breakdown

| Operation | Model | Tokens/Request | Cost per 1K tokens | Est. Monthly Volume | Monthly Cost |
|-----------|-------|----------------|--------------------|--------------------|--------------|
| JD Parsing | Flash | ~2,000 | $0.000075 | 500 JDs | $0.075 |
| CV Parsing | Flash | ~3,000 | $0.000075 | 5,000 CVs | $1.125 |
| Question Gen | Pro | ~1,500 | $0.00125 | 5,000 | $9.375 |
| Answer Eval | Pro | ~2,000 | $0.00125 | 50,000 | $125 |
| Chat (Interview) | Flash | ~500 | $0.000075 | 100,000 | $3.75 |
| Embeddings | Embed | ~500 chars | $0.00001 | 10,000 | $0.05 |
| **TOTAL** | | | | | **~$140/month** |

---

## 12. RISK ASSESSMENT

### 12.1. Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Gemini API rate limits/downtime | Medium | High | Implement caching, fallback models, queue system |
| CV parsing accuracy issues | Medium | Medium | Multiple parsing methods, manual review option |
| Real-time interview latency | Medium | High | Optimize prompts, use faster models, edge caching |
| Database performance at scale | Low | High | Proper indexing, read replicas, caching |
| Security vulnerabilities | Low | Critical | Regular audits, penetration testing, bug bounty |

### 12.2. Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Bias in AI evaluation | Medium | Critical | Regular bias audits, diverse training, transparency |
| Compliance issues (GDPR, etc.) | Low | Critical | Privacy-by-design, legal review, data policies |
| User adoption resistance | Medium | Medium | Training, gradual rollout, feedback integration |
| Competitive products | High | Medium | Unique features, continuous improvement |

### 12.3. Mitigation Strategies

#### Bias Mitigation

```typescript
// Regular bias audit checks
const auditBias = async (evaluations: Evaluation[]) => {
  // Check for patterns that might indicate bias
  const genderScores = groupByGender(evaluations);
  const ageScores = groupByAgeRange(evaluations);
  
  // Statistical tests for significant differences
  const genderBias = statisticalTest(genderScores);
  const ageBias = statisticalTest(ageScores);
  
  if (genderBias.pValue < 0.05 || ageBias.pValue < 0.05) {
    await alertTeam('Potential bias detected in evaluation system');
  }
};
```

#### Fallback Mechanisms

```typescript
// Graceful degradation
class AIServiceWithFallback {
  async generateContent(prompt: string): Promise<string> {
    try {
      // Try primary model
      return await geminiFlash.generate(prompt);
    } catch (error) {
      if (error.isRateLimited) {
        // Queue for later
        return this.queueRequest(prompt);
      }
      
      // Fallback to cached similar responses
      const cached = await this.findSimilarCached(prompt);
      if (cached) {
        return cached;
      }
      
      // Ultimate fallback - predefined responses
      return this.getPredefinedResponse(prompt);
    }
  }
}
```

---

## KẾT LUẬN

Hệ thống AI phỏng vấn nhân sự được thiết kế với kiến trúc hiện đại, có khả năng mở rộng và bảo trì cao. Việc sử dụng Google Gemini API làm nền tảng AI mang lại hiệu suất cao với chi phí hợp lý. Hệ thống được lên kế hoạch triển khai trong 24 tuần với roadmap rõ ràng, đảm bảo giao đúng hạn và trong ngân sách.

Các điểm nổi bật của giải pháp:

1. **Kiến trúc Microservices**: Cho phép scale linh hoạt và bảo trì dễ dàng
2. **Multi-dimensional Evaluation**: Đánh giá toàn diện trên nhiều khía cạnh
3. **Adaptive Interview**: Điều chỉnh câu hỏi theo hiệu suất ứng viên
4. **Comprehensive Security**: Bảo vệ dữ liệu cá nhân theo chuẩn GDPR
5. **Cost-effective**: Sử dụng Gemini Flash cho các tác vụ đơn giản, Pro cho các tác vụ phức tạp

Để bắt đầu triển khai, team cần:
1. Thiết lập môi trường development
2. Xin cấp API key từ Google AI Studio
3. Thiết lập infrastructure cơ bản (database, storage)
4. Bắt đầu với Phase 1 theo roadmap đã định
