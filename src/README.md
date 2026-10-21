# Taletale Frontend — mã nguồn

Ứng dụng Next.js của Taletale. Giới thiệu, cấu trúc và **style thiết kế** xem [README ở thư mục cha](../README.md); quy tắc khi viết code xem [`AGENTS.md`](AGENTS.md).

## Chạy nhanh

```bash
npm install
npm run dev          # http://localhost:3000
```

Mặc định dùng dữ liệu mẫu. Gọi backend thật bằng `.env.local`:

```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:5259
```

## Lệnh

| Lệnh | Việc |
| :--- | :--- |
| `npm run dev` | Môi trường phát triển |
| `npm run build` / `npm run start` | Build và chạy production |
| `npm run lint` | ESLint |
| `npm test` | Vitest (`tests/unit`) |
| `npx tsc --noEmit` | Kiểm tra kiểu |

## Tài liệu trong `docs/`

- `FRONTEND_PROGRESS.md`: tiến độ từng luồng, phần còn chờ backend
- `BACKEND_API_STATUS.md`: trạng thái API backend
- `ai-story-generation-api-integration-plan.md`: kế hoạch tích hợp luồng tạo truyện AI
