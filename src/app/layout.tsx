import type { Metadata } from "next";
import { Comfortaa, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { ChildSessionProvider } from "./context/ChildSessionContext";

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MagicTales 3D - Nền tảng Kể chuyện AI 3D cho Bé",
  description: "Biến trí tưởng tượng phong phú của con thành không gian 3D tương tác sống động và hấp dẫn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      data-theme="light"
      className={`${comfortaa.variable} ${nunitoSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-on-background font-sans transition-colors duration-300 overflow-hidden">
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <ChildSessionProvider>
                <main className="flex-1 w-full h-full">
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
