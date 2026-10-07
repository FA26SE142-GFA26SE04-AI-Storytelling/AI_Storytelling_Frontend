import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import "./components/workspaces/workspaces.css";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { ChildSessionProvider } from "./context/ChildSessionContext";

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

export const metadata: Metadata = {
  title: "Taletale – Nền tảng kể chuyện AI cho trẻ em",
  description: "Tạo, duyệt và giao truyện AI an toàn cho bé, có phụ huynh đồng hành.",
};

// Đặt theme trước khi vẽ để không bị nháy sáng/tối khi tải trang.
const themeInit = `try{var t=localStorage.getItem("magictales-theme");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t);if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      data-theme="light"
      className={`${baloo.variable} ${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="h-full">
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <ChildSessionProvider>
                <main className="h-full w-full">
                  {children}
                </main>
              </ChildSessionProvider>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
