# HR Interview System

AI-powered recruitment system: job analysis, candidate matching, AI interviews (text/voice via Gemini Live), scoring & recommendations.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL 16 + Prisma ORM
- **Cache/Queue:** Redis 7 + BullMQ
- **AI:** Google Gemini (`@google/genai`)
- **Auth:** NextAuth v5
- **Storage:** MinIO (S3-compatible)
- **State:** Zustand + TanStack Query
- **UI:** Tailwind CSS v4 + Lucide Icons

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/apikey))

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd HR-Interview
npm install
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

Services khởi động:

| Service    | Port          | Mô tả                  |
| ---------- | ------------- | ----------------------- |
| PostgreSQL | 5432          | Database chính          |
| Redis      | 6379          | Cache & job queue       |
| MinIO      | 9000 / 9001   | Object storage / Console|

### 3. Environment Variables

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hr_interview"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="generate-a-secret-here"    # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="hr-interview"
```

### 4. Database Setup

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Scripts

| Command           | Mô tả                          |
| ----------------- | ------------------------------- |
| `npm run dev`     | Dev server (hot reload)         |
| `npm run build`   | Production build                |
| `npm run start`   | Start production server         |
| `npm run lint`    | ESLint check                    |

## Project Structure

```
src/
├── app/                  # Next.js App Router (pages & API routes)
│   ├── (dashboard)/      # Dashboard pages
│   └── api/              # API endpoints
├── components/           # React components
│   └── interview/        # Interview UI (chat, video, avatar)
├── hooks/                # Custom hooks (media capture, Gemini live)
├── lib/                  # Services & utilities (Gemini client, auth)
├── stores/               # Zustand stores
└── generated/            # Prisma generated client
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Seed data
```

## Key Features

- **Text Interview:** Chat-based AI interview với đánh giá realtime
- **Voice/Video Interview:** Gemini Live API với WebSocket streaming, PCM audio, camera capture
- **Job Analysis:** AI phân tích JD, tự động tạo câu hỏi phỏng vấn
- **Candidate Matching:** Embedding-based CV matching
- **Evaluation:** AI scoring theo nhiều tiêu chí

## MinIO Console

Truy cập MinIO Console tại [http://localhost:9001](http://localhost:9001) với credentials `minioadmin/minioadmin`.

## Troubleshooting

- **DB connection failed:** Kiểm tra Docker containers đang chạy (`docker compose ps`)
- **Prisma generate error:** Chạy `npx prisma generate` trước khi `npm run dev`
- **Gemini API error:** Verify `GEMINI_API_KEY` trong `.env`
- **Port conflict:** Đổi port mapping trong `docker-compose.yml`
