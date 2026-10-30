import type { Metadata, Viewport } from "next";
import { Andika, Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./components/brand/brand.css";
import { ThemeProvider } from "./context/ThemeContext";
import ToastHost from "./components/ToastHost";
import ConfirmHost from "./components/ConfirmHost";
import { AuthProvider } from "./context/AuthContext";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
});

// Font cho chữ trong trang sách: thiết kế cho người mới tập đọc (chữ a, g một tầng; I, l, 1 khác nhau rõ).
const andika = Andika({
  variable: "--font-andika",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Taletale – Nền tảng kể chuyện AI cho trẻ em",
  description: "Tạo, duyệt và giao truyện AI an toàn cho bé, có phụ huynh đồng hành.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Đặt theme trước khi vẽ để không bị nháy sáng/tối khi tải trang.
const themeInit = `try{var t=localStorage.getItem("taletale-theme")||localStorage.getItem("magictales-theme");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t);if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      data-theme="light"
      className={`${baloo.variable} ${nunito.variable} ${andika.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="h-full">
        <AuthProvider>
          <ThemeProvider>
            <main className="h-full w-full">
              {children}
            </main>
            <ToastHost />
            <ConfirmHost />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
