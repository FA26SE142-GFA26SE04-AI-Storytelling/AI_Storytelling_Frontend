"use client";

import "@/app/styles/features/landing/landing.css";
import { useState } from "react";
import { ArrowUpRight, Moon, ScanQrCode, Sun } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import Lotus from "@/app/components/brand/Lotus";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import SafeImage from "@/app/components/SafeImage";
import { useTheme } from "@/app/context/ThemeContext";
import { circleReveal, useRiseIn } from "@/app/lib/motion";
import LandingStoryShelf from "./LandingStoryShelf";
import KidQrScanner from "@/app/features/kid/KidQrScanner";

export default function Landing({ onStart, onKidCode }: {
  onStart: (mode: "login" | "register") => void;
  onKidCode: (code: string) => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const [scan, setScan] = useState(false);
  const heroRef = useRiseIn<HTMLElement>(".ld-rise", [], { delay: 70, distance: 12 });
  const flipTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme);
  };

  return (
    <div className="ld">
      <PondBackdrop rich />
      <header className="ld-top">
        <a className="ld-brand" href="#top" aria-label="Taletale, về đầu trang">
          <Frog size={40} variant="face" animated={false} />
          <b className="display">Taletale</b>
        </a>
        <nav className="ld-actions" aria-label="Tài khoản và giao diện">
          <button type="button" className="ld-text-action ld-kid-scan" onClick={() => setScan(true)}>
            <ScanQrCode size={18} aria-hidden /><span>Bé vào đọc</span>
          </button>
          <button type="button" className="ld-text-action" onClick={() => onStart("login")}>Đăng nhập</button>
          <button type="button" className="ld-text-action ld-register" onClick={() => onStart("register")}>Tạo tài khoản <ArrowUpRight size={16} aria-hidden /></button>
          <button type="button" className="ld-text-action ld-theme" onClick={flipTheme}
            aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}>
            {theme === "dark" ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
          </button>
        </nav>
      </header>
      {scan && <KidQrScanner onCode={(code) => { setScan(false); onKidCode(code); }} onClose={() => setScan(false)} />}
      <main id="top">
        <section ref={heroRef} className="ld-hero ld-hero-centered" aria-labelledby="ld-title">
          <div className="ld-hero-text">
            <span className="ld-eyebrow ld-rise">LỜI KỂ NHỎ · THẾ GIỚI LỚN</span>
            <h1 id="ld-title" className="display ld-rise">Mỗi câu chuyện,<br />một khoảnh khắc <em>bên con.</em></h1>
            <p className="ld-lead ld-rise">Nền tảng kể chuyện để bố mẹ tự viết hoặc cùng AI sáng tạo câu chuyện từ đời sống. Biến một tình huống quen thuộc thành lời kể gần gũi, giúp con hiểu và biết cách ứng xử.</p>
            <button type="button" className="ld-text-action ld-explore ld-rise" onClick={() => onStart("register")}>
              Khám phá Taletale <ArrowUpRight size={22} aria-hidden />
            </button>
          </div>
          <div className="ld-hero-art ld-rise" aria-hidden="true">
            <span className="ld-pond-glow" />

            <SafeImage className="ld-hero-books" src="/landing-storybooks.png" alt="" width={1536} height={1024} loading="eager" />
            <span className="ld-art-caption">Một lời kể, ngàn điều diệu kỳ.</span>
          </div>

        </section>
        <LandingStoryShelf />
        <section id="tuong-tuong" className="ld-editorial" aria-labelledby="ld-imagine-title">
          <div className="ld-flower-art" aria-hidden="true">
            <span className="ld-water-ring" /><Lotus size={180} /><Lotus size={78} />
          </div>
          <div className="ld-editorial-text">
            <span className="ld-eyebrow">TỪ ĐỜI SỐNG, THÀNH CÂU CHUYỆN CỦA CON</span>
            <h2 id="ld-imagine-title" className="display">Chuyện mỗi ngày,<br />bài học con hiểu.</h2>
            <p>Con chưa muốn chia sẻ đồ chơi, lo lắng ngày đầu đến lớp hay vừa làm một người bạn buồn? Bố mẹ có thể kể lại tình huống ấy qua những nhân vật và lời kể phù hợp với con.</p>
            <p className="ld-life-note">Tự viết bằng lời của bố mẹ hoặc nhờ AI hỗ trợ; bố mẹ xem lại và chọn câu chuyện muốn dành cho con.</p>
          </div>
        </section>
        <section className="ld-editorial ld-editorial-reverse" aria-labelledby="ld-together-title">
          <div className="ld-together-art" aria-hidden="true">
            <Frog size={146} mood="happy" /><Lotus size={86} />
            <span className="ld-together-pad" />
          </div>
          <div className="ld-editorial-text">
            <span className="ld-eyebrow">CHẬM LẠI MỘT CHÚT, GẦN NHAU THÊM MỘT CHÚT</span>
            <h2 id="ld-together-title" className="display">Giữ lại những<br />phút giây bên nhau.</h2>
            <p>Một câu chuyện trước giờ ngủ, một tiếng cười khi cùng lật trang. Đôi khi, điều con nhớ nhất là có bố mẹ ở bên.</p>
          </div>
        </section>
      </main>
      <footer className="ld-foot">
        <a className="ld-brand" href="#top"><Frog size={30} variant="face" animated={false} /><b className="display">Taletale</b></a>
        <p>Những câu chuyện nhỏ, nuôi dưỡng yêu thương.</p>
        <small>taletale.site</small>
      </footer>
    </div>
  );
}
