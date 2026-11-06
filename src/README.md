# Taletale Frontend — mã nguồn

Ứng dụng Next.js của Taletale. Giới thiệu, cấu trúc và **style thiết kế** xem [README ở thư mục cha](../README.md); quy tắc khi viết code xem [`AGENTS.md`](AGENTS.md).

## Chạy nhanh

```bash
npm install
npm run dev          # http://localhost:3000
```

Ứng dụng luôn gọi API backend. Cấu hình địa chỉ bằng `.env.local`:

```env
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

## Tài liệu

- [`../TASKS.md`](../TASKS.md): việc còn phải làm
- `docs/core-api-coverage.json`: kết quả đối soát endpoint (tạo bằng `node scripts/audit-core-api.mjs`)
