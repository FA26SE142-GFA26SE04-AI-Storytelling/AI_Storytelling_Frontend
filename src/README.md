# AI Storytelling Frontend

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-storytelling-frontend.vercel.app/)

🌐 **Live Demo Website**: [https://ai-storytelling-frontend.vercel.app/](https://ai-storytelling-frontend.vercel.app/)

Frontend application for the AI Storytelling platform, built with **Next.js 16**, **React 19**, **TypeScript** and **animejs**.

## Tech Stack

| Technology    | Version |
| ------------- | ------- |
| Next.js       | 16.3.4  |
| React         | 19.2.8  |
| TypeScript    | 5.x     |
| TailwindCSS   | 4.x     |

## Thiết kế

Chủ đề **đầm sen** với linh vật ếch, có theme sáng và tối. Màu và quy ước giao diện nằm trong `app/styles/tokens.css`; quy tắc kiến trúc chi tiết xem `AGENTS.md`.

| Vai trò | Sáng | Tối |
| :--- | :--- | :--- |
| Chính (xanh lá) | `#2FA866` / nút `#1F8A55` | `#3DD68C` |
| Vàng mật (chờ duyệt) | `#FFD166` | `#FFD166` |
| Teal (an toàn, đã duyệt) | `#14B8A6` | `#2DD4BF` |
| Hoa sen (trang trí) | `#F6A9C4` | `#E98AAF` |

Phông chữ: **Baloo 2** cho tiêu đề, **Nunito** cho nội dung. Chuyển động dùng **animejs**.

## Project Structure

```
src/
├── app/
│   ├── styles/          # tokens.css, base.css, shell.css
│   ├── components/      # brand/ (ếch, đầm sen), shell/ (khung app, đăng nhập)
│   ├── features/        # home, studio, library, review, report, safety, kid, story-workflow
│   ├── context/         # Auth, Theme, WorkspaceData…
│   ├── services/        # Gọi API backend
│   ├── mocks/           # Dữ liệu mẫu
│   ├── lib/             # motion.ts, storyView.ts
│   ├── types/           # Kiểu DTO
│   ├── page.tsx         # Route duy nhất "/"
│   └── layout.tsx
├── tests/unit/
└── vitest.config.ts
```

## Dữ liệu mẫu và backend

Mặc định app chạy bằng dữ liệu mẫu, không cần backend. Để gọi backend thật, đặt trong `.env.local`:

```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:5259
```

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or yarn/pnpm)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

The page auto-updates as you edit files.

### Build for Production

```bash
npm run build
npm run start
```

### Linting & Test

```bash
npm run lint
npm test
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) — features and API reference
- [React Documentation](https://react.dev) — React 19 docs
- [TailwindCSS Documentation](https://tailwindcss.com/docs) — utility-first CSS framework
