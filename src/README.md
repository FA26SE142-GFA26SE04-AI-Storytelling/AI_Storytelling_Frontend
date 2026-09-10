# AI Storytelling Frontend

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-storytelling-frontend.vercel.app/)

🌐 **Live Demo Website**: [https://ai-storytelling-frontend.vercel.app/](https://ai-storytelling-frontend.vercel.app/)

Frontend application for the AI Storytelling platform, built with **Next.js 16**, **React 19**, **TypeScript**, and **TailwindCSS 4**.

## Tech Stack

| Technology    | Version |
| ------------- | ------- |
| Next.js       | 16.3.4  |
| React         | 19.2.8  |
| TypeScript    | 5.x     |
| TailwindCSS   | 4.x     |

## Color Palette & Design System (Light Mode)

Hệ thống bảng màu và quy chuẩn thiết kế dành cho **Chế độ sáng (Light Mode)** của nền tảng kể chuyện AI cho bé:

### 1. Bảng màu (Color Palette)

| Loại màu | Mã Hex | Tên & Mô tả công dụng |
| :--- | :--- | :--- |
| **Primary** | `#FF6B6B` | **Coral Pink / Warm Red** - Màu chủ đạo cho nút CTA chính (`Tạo truyện AI`, `Đọc & Nghe`), điểm nhấn thương hiệu |
| **Secondary** | `#FFD166` | **Warm Gold / Soft Yellow** - Màu phụ cho huy hiệu xu thưởng, điểm đánh giá ⭐, phần nổi bật |
| **Tertiary** | `#06D6A0` | **Vibrant Mint / Emerald Green** - Màu bổ trợ cho tính năng phát âm thanh, chứng nhận an toàn `KID-SAFE` |
| **Neutral Canvas** | `#F0ECE5` | **Soft Warm Gray / Beige** - Màu nền tổng thể toàn trang (App Canvas), tạo độ tương phản dịu với các card |
| **Neutral Card** | `#FFFDF7` | **Warm Cream / Off-White** - Màu nền cho các khung container/card giúp nội dung nổi bật và ấm áp |
| **Neutral Text** | `#2B2B2B` | **Dark Charcoal** - Màu chữ văn bản chính giúp đạt độ tương phản cao, dễ đọc |

### 2. Phông chữ (Typography)

- **Headline (Tiêu đề chính):** `Comfortaa` *(Phông bo tròn mềm mại, tạo cảm giác thân thiện, diệu kỳ)*
- **Body & Label (Văn bản & Thẻ):** `Nunito Sans` *(Phông chữ rõ ràng, hiện đại, tối ưu trải nghiệm đọc cho bé và phụ huynh)*

### 3. Quy chuẩn Component (UI Guidelines)

- **Primary Button:** Nền `#FF6B6B`, chữ trắng, bo tròn pill (`rounded-full`), hiệu ứng shadow dịu.
- **Secondary / Option Pills:** Nền vàng ấm `#FFD166` hoặc mảng màu mềm mại, viền nhẹ.
- **Inverted / Dark Buttons:** Nền `#2B2B2B`, chữ trắng dành cho các chế độ ban đêm hoặc ru ngủ.
- **Search Bar / Inputs:** Thanh tìm kiếm dạng pill bo góc mềm với nền `#F0ECE1`.

---

## Project Structure

```
src/
├── app/
│   ├── assets/
│   │   ├── icons/              # SVG, PNG icon files
│   │   └── images/             # Static image assets
│   ├── components/
│   │   ├── home/               # Home page specific components (Hero, Categories, Audio...)
│   │   ├── layout/             # Layout components (Header, Footer, Sidebar, Navbar)
│   │   └── ui/                 # Reusable UI components (Button, Input, Card, Badge...)
│   ├── constants/              # Constants, enums, configuration values
│   ├── context/                # React Context providers (Auth, Theme, etc.)
│   ├── hooks/                  # Custom React hooks (useAuth, useFetch, etc.)
│   ├── lib/                    # Utility & helper functions (format, validation...)
│   ├── services/               # API service functions (backend API calls)
│   ├── styles/                 # CSS modules & additional style files
│   ├── types/                  # TypeScript interfaces & type definitions
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── favicon.ico
├── public/                     # Static files served directly (images, fonts, etc.)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

### Folder Descriptions

| Folder               | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `components/ui/`     | Atomic, reusable UI components (Button, Input, Card, Badge…)  |
| `components/layout/` | Page-level layout components (Header, Footer, Sidebar)        |
| `components/home/`   | Home page section components (Hero, Categories, Audio...)     |
| `hooks/`             | Custom React hooks for shared logic                           |
| `lib/`               | Utility functions, helpers, formatters                        |
| `services/`          | API service layer — functions that call the backend           |
| `types/`             | TypeScript type definitions & interfaces                      |
| `constants/`         | App-wide constants, enums, and config values                  |
| `context/`           | React Context providers for global state management           |
| `assets/`            | Static assets (images, icons) imported in components          |
| `styles/`            | CSS modules and additional style files                        |

### Adding New Pages

This project uses the **Next.js App Router**. To add a new page, create a folder inside `app/` with a `page.tsx` file:

```
app/
├── login/
│   └── page.tsx          →  /login
├── dashboard/
│   └── page.tsx          →  /dashboard
├── stories/
│   ├── page.tsx          →  /stories
│   └── [id]/
│       └── page.tsx      →  /stories/:id
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

### Linting

```bash
npm run lint
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) — features and API reference
- [React Documentation](https://react.dev) — React 19 docs
- [TailwindCSS Documentation](https://tailwindcss.com/docs) — utility-first CSS framework
