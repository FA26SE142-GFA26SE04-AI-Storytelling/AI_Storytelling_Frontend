# AI Storytelling Frontend

Frontend application for the AI Storytelling platform, built with **Next.js 16**, **React 19**, **TypeScript**, and **TailwindCSS 4**.

## Tech Stack

| Technology    | Version |
| ------------- | ------- |
| Next.js       | 16.3.4  |
| React         | 19.2.8  |
| TypeScript    | 5.x     |
| TailwindCSS   | 4.x     |

## Project Structure

```
src/
├── app/
│   ├── assets/
│   │   ├── icons/              # SVG, PNG icon files
│   │   └── images/             # Static image assets
│   ├── components/
│   │   ├── layout/             # Layout components (Header, Footer, Sidebar, Navbar)
│   │   └── ui/                 # Reusable UI components (Button, Input, Card, Modal...)
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
