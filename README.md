# HR Interview System

Hệ thống tuyển dụng AI: phân tích JD, matching CV, phỏng vấn AI (text/voice/video qua Gemini Live), chấm điểm & đề xuất.

---

## ⚡ Quick Start (5 phút)

```bash
# 1. Clone & install
git clone <repo-url> && cd HR-Interview
npm install

# 2. Khởi động hạ tầng (Postgres + Redis + MinIO)
docker compose up -d
# ↑ Không có Docker? → xem phần "Không dùng Docker? (chạy native)" bên dưới

# 3. Tạo .env từ template, điền GEMINI_API_KEY
cp .env.example .env
# Mở .env, set GEMINI_API_KEY=... (lấy tại https://aistudio.google.com/apikey)
# Tạo NEXTAUTH_SECRET: npx auth secret    (hoặc: openssl rand -base64 32)

# 4. Khởi tạo database
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. Chạy dev server
npm run dev
```

Mở **http://localhost:3000** → xong.

---

## 📋 Yêu cầu

| Phần mềm               | Version    | Ghi chú                                              |
| ---------------------- | ---------- | ---------------------------------------------------- |
| Node.js                | ≥ 20       | Nên dùng LTS (20 hoặc 22)                            |
| Docker + Docker Compose| Mới nhất   | Chạy Postgres / Redis / MinIO                        |
| Gemini API Key         | Miễn phí   | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Trình duyệt            | Chrome 120+| Cho voice/video interview (WebAudio + getUserMedia)  |

---

## 🔧 Cấu hình `.env`

Sau khi `cp .env.example .env`, chỉnh các giá trị sau:

```env
# Database (khớp với docker-compose.yml — không cần đổi nếu dùng Docker local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hr_interview"
REDIS_URL="redis://localhost:6379"

# Auth — BẮT BUỘC set
NEXTAUTH_SECRET="<<chạy: npx auth secret>>"
NEXTAUTH_URL="http://localhost:3000"

# Gemini — BẮT BUỘC
GEMINI_API_KEY="<<dán key từ Google AI Studio>>"

# MinIO (object storage cho CV + audio interview)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="hr-interview"
```

---

## 🐳 Hạ tầng Docker

`docker compose up -d` khởi động:

| Service    | Cổng        | Mô tả                       |
| ---------- | ----------- | --------------------------- |
| PostgreSQL | 5432        | Database chính              |
| Redis      | 6379        | Cache + BullMQ job queue    |
| MinIO      | 9000 / 9001 | S3 storage / Web console    |

Kiểm tra trạng thái:

```bash
docker compose ps       # health status
docker compose logs -f  # theo dõi log
docker compose down     # dừng (giữ data)
docker compose down -v  # dừng + xoá data (reset sạch)
```

**MinIO Console:** http://localhost:9001 (login: `minioadmin` / `minioadmin`)

---

## 🖥️ Không dùng Docker? (chạy native)

Chỉ **PostgreSQL là BẮT BUỘC**. Redis/MinIO optional (app lazy-connect, không crash nếu thiếu — chỉ `/api/health` báo `degraded`).

### PostgreSQL (bắt buộc)

**Windows:**
```powershell
# Scoop
scoop install postgresql

# hoặc Chocolatey
choco install postgresql16

# hoặc tải installer: https://www.postgresql.org/download/windows/
```

**macOS:** `brew install postgresql@16 && brew services start postgresql@16`

**Linux (Debian/Ubuntu):** `sudo apt install postgresql-16 && sudo systemctl start postgresql`

Tạo database + user:

```bash
psql -U postgres
CREATE DATABASE hr_interview;
CREATE USER hr WITH PASSWORD 'hr';
GRANT ALL PRIVILEGES ON DATABASE hr_interview TO hr;
\q
```

Đổi `.env`:
```env
DATABASE_URL="postgresql://hr:hr@localhost:5432/hr_interview"
```

### Redis (optional)

Nếu không cài → bỏ qua hoặc comment dòng `REDIS_URL` trong `.env`. Health check báo `degraded` nhưng app vẫn chạy.

**Windows:** dùng [Memurai](https://www.memurai.com/) (Redis-compatible cho Windows) hoặc WSL.
**macOS:** `brew install redis && brew services start redis`
**Linux:** `sudo apt install redis-server`

### MinIO (không cần cho flow hiện tại)

Không có file nào trong `src/` thực sự gọi MinIO → skip hoàn toàn. Giữ giá trị mặc định trong `.env` cũng OK (không kết nối thì không lỗi). Audio phỏng vấn upload trực tiếp lên Gemini Files API (tự hết hạn 48h), CV hiện lưu tạm vào thư mục `uploads/` local.

### Kiểm tra

```bash
# Postgres đã chạy chưa
psql "postgresql://hr:hr@localhost:5432/hr_interview" -c "SELECT 1;"

# Redis (nếu có)
redis-cli ping   # → PONG
```

Sau đó chạy `npx prisma db push && npx prisma db seed && npm run dev`.

---

## 🗄️ Database

```bash
npx prisma generate   # sinh Prisma Client (chạy sau mỗi lần đổi schema)
npx prisma db push    # sync schema → DB (dev; không tạo migration)
npx prisma db seed    # nạp dữ liệu mẫu (user admin, JD mẫu, ...)
npx prisma studio     # UI xem/sửa data (http://localhost:5555)
```

Đổi schema → chạy lại `prisma generate && prisma db push`.

---

## 🚀 Scripts

| Lệnh              | Mục đích                       |
| ----------------- | ------------------------------ |
| `npm run dev`     | Dev server + Turbopack HMR     |
| `npm run build`   | Production build               |
| `npm run start`   | Chạy production (sau `build`)  |
| `npm run lint`    | ESLint                         |

---

## 🧪 Test luồng chính

1. **Đăng nhập** bằng account seed (xem `prisma/seed.ts`).
2. **Tạo Job Description** → AI phân tích & gợi ý câu hỏi.
3. **Upload CV ứng viên** → embedding matching.
4. **Bắt đầu phỏng vấn:**
   - **Text:** chat-based, có đánh giá realtime.
   - **Voice/Video:** yêu cầu cấp quyền mic + camera, dùng Gemini Live qua WebSocket.
5. **Kết thúc** → audio cuộc phỏng vấn upload lên Gemini Files API → AI chấm điểm + sinh report đầy đủ.

---

## 📁 Cấu trúc project

```
src/
├── app/
│   ├── (dashboard)/      # Trang dashboard (jobs, candidates, interviews, report)
│   └── api/              # API routes (interviews, auth, uploads, live-token)
├── components/interview/ # UI phỏng vấn (chat, video, avatar, chat bubbles)
├── hooks/                # useMediaCapture, useGeminiLiveSession
├── lib/
│   ├── gemini.ts                   # Gemini client (text/JSON/multimodal/files)
│   ├── gemini-live-audio-player.ts # PCM16 playback + stream tap để ghi audio
│   ├── services/                   # Business logic (interview AI, matching, ...)
│   └── video-utils.ts              # Capture frame helper
├── stores/               # Zustand (interview flow state)
└── generated/            # Prisma Client (auto-gen, đừng sửa)
prisma/
├── schema.prisma
└── seed.ts
docker-compose.yml        # Postgres + Redis + MinIO
```

---

## 🐛 Troubleshooting

| Triệu chứng                                 | Cách xử lý                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `ECONNREFUSED 5432/6379/9000`               | `docker compose ps` — service chưa up. Chạy `docker compose up -d`.     |
| `Prisma Client not generated`               | `npx prisma generate`                                                   |
| Schema drift / DB trống                     | `npx prisma db push && npx prisma db seed`                              |
| `GEMINI_API_KEY environment variable is not set` | Chưa set key trong `.env` — restart dev server sau khi sửa.        |
| `uploadFile is not a function` trên dev     | Module cache stale sau HMR — **restart dev server** (`Ctrl+C` → `npm run dev`). |
| Voice interview im lặng / không nghe AI     | Chrome block autoplay — bấm "Bắt đầu phỏng vấn" để unlock AudioContext. |
| Mic không bắt tiếng                         | Kiểm tra quyền trình duyệt + `chrome://settings/content/microphone`.    |
| Port conflict (5432/6379/9000/9001/3000)    | Đổi port mapping trong `docker-compose.yml` hoặc tắt service đang chạy. |
| Report sinh chậm / timeout                  | Audio dài → Gemini Files processing lâu. Đã set `maxDuration = 180`s.  |

---

## 🛠 Tech Stack

Next.js 16 (App Router) · TypeScript · PostgreSQL 16 + Prisma 7 · Redis 7 + BullMQ · Google Gemini (`@google/genai`) · NextAuth v5 · MinIO · Zustand + TanStack Query · Tailwind CSS v4 · Lucide Icons

---

## 📚 Tài liệu bổ sung

- `docs/` — PDR, code standards, system architecture, codebase summary
- `plans/` — implementation plans và reports
- `CLAUDE.md` — hướng dẫn AI assistant khi làm việc trên repo
