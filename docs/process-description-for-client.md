# AI HR Interview System — Tổng quan Quy trình

## Hệ thống này làm gì?

Hệ thống sử dụng **AI** để tự động hóa quy trình phỏng vấn tuyển dụng — từ đọc hiểu yêu cầu công việc, phân tích CV ứng viên, tiến hành phỏng vấn, đến đánh giá và đề xuất tuyển dụng.


---

## Luồng xử lý chính

```
 ① Đăng tin        ② Crawl CV       ③ AI so khớp       ④ Phỏng vấn AI      ⑤ Báo cáo
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│ Nhà tuyển│    │ Hệ thống │    │ Hệ thống tự  │    │ AI hỏi ↔ Ứng │    │ AI tổng hợp  │
│ dụng nhập│───▶│ crawl CV │──▶│ động đánh giá│───▶│ viên trả lời │───▶│ điểm & đề    │
│ mô tả    │    │ ứng viên │    │ mức độ phù   │    │ (text/voice) │    │ xuất tuyển   │
│ công việc│    │          │    │ hợp CV vs JD │    │              │    │ dụng         │
└──────────┘    └──────────┘    └──────────────┘    └───────────────┘    └──────────────┘
     │               │               │                    │                    │
     ▼               ▼               ▼                    ▼                    ▼
  AI đọc hiểu    AI trích xuất   Báo cáo %         AI đánh giá          Dashboard
  yêu cầu JD    kỹ năng từ CV   phù hợp           từng câu TL          so sánh
```

---

### ① Nhà tuyển dụng đăng tin tuyển dụng

Nhà tuyển dụng nhập mô tả công việc (JD) vào hệ thống. **AI tự động đọc hiểu** và trích xuất các yêu cầu: kỹ năng cần có, kinh nghiệm, học vấn, chứng chỉ...

### ② Crawl CV ứng viên

Hệ thống **tự động crawl và đọc hiểu CV**, trích xuất thông tin: kỹ năng, kinh nghiệm làm việc, trình độ học vấn, ngôn ngữ...

### ③ AI so khớp CV với yêu cầu công việc

Hệ thống **tự động so sánh** hồ sơ ứng viên với yêu cầu công việc, đánh giá mức độ phù hợp, chỉ ra điểm mạnh và điểm còn thiếu. Nhà tuyển dụng dựa vào đây để quyết định mời phỏng vấn.

### ④ Phỏng vấn với AI

Ứng viên tham gia phỏng vấn trực tuyến với AI:
- AI tạo **bộ câu hỏi riêng** cho từng ứng viên (dựa trên CV và yêu cầu JD)
- Ứng viên trả lời bằng **văn bản hoặc giọng nói**
- AI đánh giá **ngay từng câu trả lời** và có thể hỏi thêm để đào sâu — giống phỏng vấn viên thật
- Bao gồm câu hỏi kỹ thuật, kinh nghiệm, tình huống, tư duy giải quyết vấn đề

### ⑤ Báo cáo đánh giá & Đề xuất

Sau phỏng vấn, AI tạo **báo cáo tổng hợp**:
- Điểm số theo nhiều tiêu chí (kỹ thuật, kinh nghiệm, giao tiếp, tư duy, văn hóa)
- Phân tích điểm mạnh, điểm yếu, cảnh báo (nếu có)
- **Đề xuất**: Rất nên tuyển / Nên tuyển / Cân nhắc / Không phù hợp
- Nhà tuyển dụng xem dashboard để **so sánh các ứng viên** và ra quyết định

---

## Điểm nổi bật
- **Cá nhân hóa** : Mỗi ứng viên nhận bộ câu hỏi riêng, phù hợp với hồ sơ và vị trí
- **Khách quan** : Tất cả ứng viên được đánh giá cùng tiêu chí, loại bỏ thiên kiến
- **Tức thời** : AI đánh giá ngay khi ứng viên trả lời, tạo trải nghiệm tự nhiên