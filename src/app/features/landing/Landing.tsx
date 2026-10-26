"use client";

import "./landing.css";
import { Check, Moon, Sun } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import { useTheme } from "@/app/context/ThemeContext";
import { circleReveal, useRiseIn } from "@/app/lib/motion";
import StoryBookDemo from "./StoryBookDemo";
import IdeaBox from "./IdeaBox";
import HowItWorks from "./HowItWorks";
import { BENEFITS, FAQ, KID, WAYS } from "./landingContent";

/** Trang giới thiệu Taletale cho người chưa đăng nhập. "Bắt đầu" mở biểu mẫu đăng ký, "Đăng nhập" mở biểu mẫu đăng nhập. */
export default function Landing({ onStart }: { onStart: (mode: "login" | "register") => void }) {
  const { theme, toggleTheme } = useTheme();
  const heroRef = useRiseIn<HTMLDivElement>(".ld-rise", [], { delay: 70, distance: 12 });
  const bodyRef = useRiseIn<HTMLDivElement>(".ld-card", [], { delay: 40, distance: 10 });

  const flipTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme);
  };

  return (
    <div className="ld">
      <PondBackdrop rich />
      <header className="ld-top">
        <a className="ld-brand" href="#top" aria-label="Taletale, về đầu trang"><Frog size={34} variant="face" animated={false} /><b className="display">Taletale</b></a>
        <nav className="ld-nav" aria-label="Trang giới thiệu">
          <a href="#cach-hoat-dong">Cách hoạt động</a>
          <a href="#an-toan">An toàn</a>
          <a href="#goc-cua-be">Góc của bé</a>
          <a href="#hoi-dap">Hỏi đáp</a>
        </nav>
        <div className="ld-actions">
          <button className="btn btn-g" onClick={flipTheme} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}>{theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}</button>
          <button className="btn btn-s" onClick={() => onStart("login")}>Đăng nhập</button>
        </div>
      </header>

      <main id="top">
        <section ref={heroRef} className="ld-hero">
          <div className="ld-hero-text">
            <h1 className="display ld-rise">Câu chuyện cho con, qua tay bố mẹ trước</h1>
            <p className="ld-lead ld-rise">Bạn kể một ý tưởng, AI viết thành truyện có tranh và giọng đọc cho bé 3–10 tuổi. Mỗi bước đều chờ bạn đồng ý, và bé chỉ thấy truyện bạn đã duyệt.</p>
            <div className="ld-cta ld-rise">
              <button className="btn btn-p ld-big" onClick={() => onStart("register")}>Bắt đầu cho con</button>
              <button className="btn btn-s ld-big" onClick={() => onStart("login")}>Tôi đã có tài khoản</button>
            </div>
            <ul className="ld-trust ld-rise">
              <li><Check className="ic" aria-hidden />Kiểm tra an toàn trước khi viết</li>
              <li><Check className="ic" aria-hidden />Bé không trò chuyện tự do với AI</li>
              <li><Check className="ic" aria-hidden />Cài đặt riêng cho từng bé</li>
            </ul>
          </div>
          <div className="ld-rise ld-hero-book"><StoryBookDemo /></div>
        </section>

        <section className="ld-idea-band" aria-label="Thử một ý tưởng">
          <IdeaBox onStart={() => onStart("register")} />
        </section>

        <div ref={bodyRef}>
          <section id="cach-hoat-dong" className="ld-section">
            <h2 className="display">Năm bước, bạn quyết định ở mỗi bước</h2>
            <p className="ld-sub">AI làm phần việc nặng. Bấm vào từng bước để xem bạn sẽ thấy gì.</p>
            <HowItWorks />
          </section>

          <section id="an-toan" className="ld-section">
            <h2 className="display">Vì sao bố mẹ chọn Taletale</h2>
            <p className="ld-sub">An toàn của bé đứng trên mọi tính năng. Có nghi ngờ thì hệ thống dừng lại và hỏi bạn.</p>
            <div className="ld-benefits">
              {BENEFITS.map((c) => (
                <div key={c.title} className="ld-card ld-benefit">
                  <span className="ld-icon"><c.icon aria-hidden /></span>
                  <div><b>{c.title}</b><span>{c.text}</span></div>
                </div>
              ))}
            </div>
          </section>

          <section id="goc-cua-be" className="ld-section ld-kid">
            <div className="ld-kid-head">
              <Frog size={96} mood="happy" />
              <div>
                <h2 className="display">Góc đọc riêng của bé</h2>
                <p className="ld-sub">Không menu, không chữ nhỏ. Bé chỉ cần đọc, nghe và trả lời, chú ếch luôn ở bên cạnh.</p>
              </div>
            </div>
            <div className="ld-grid ld-kid-grid">
              {KID.map((k) => (
                <div key={k.title} className="ld-card ld-kid-card">
                  <span className="ld-icon gold"><k.icon aria-hidden /></span>
                  <b className="display">{k.title}</b>
                  <span>{k.text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="ld-section">
            <h2 className="display">Ba cách để có một câu chuyện</h2>
            <div className="ld-grid three">
              {WAYS.map((w) => (
                <div key={w.title} className="ld-card">
                  <span className="ld-icon"><w.icon aria-hidden /></span>
                  <b>{w.title}</b>
                  <span>{w.text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="ld-night" aria-labelledby="ld-night-title">
            <span className="ld-fireflies" aria-hidden><i /><i /><i /><i /><i /><i /></span>
            <Moon className="ld-moon" aria-hidden />
            <div className="grow">
              <h2 id="ld-night-title" className="display">Đọc trước giờ ngủ</h2>
              <p>Giao diện tối dịu mắt, nền xanh đêm và đom đóm vàng, để buổi đọc cuối ngày thật êm.</p>
            </div>
            <button className="btn btn-s" onClick={flipTheme}>{theme === "dark" ? <><Sun className="ic" />Xem giao diện sáng</> : <><Moon className="ic" />Thử giao diện tối</>}</button>
          </section>

          <section id="hoi-dap" className="ld-section ld-faq">
            <h2 className="display">Câu hỏi thường gặp</h2>
            <div className="ld-faq-list">
              {FAQ.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="ld-final">
            <Frog size={110} mood="happy" />
            <div className="grow">
              <h2 className="display">Sẵn sàng kể câu chuyện đầu tiên cho con?</h2>
              <p>Tạo tài khoản, thêm hồ sơ bé và cài đặt an toàn trong vài phút.</p>
            </div>
            <button className="btn ld-big ld-final-go" onClick={() => onStart("register")}>Bắt đầu cho con</button>
          </section>
        </div>
      </main>

      <footer className="ld-foot">
        <div className="ld-foot-brand">
          <span className="ld-brand"><Frog size={30} variant="face" animated={false} /><b className="display">Taletale</b></span>
          <p>Nền tảng kể chuyện AI an toàn cho trẻ em, có phụ huynh đồng hành.</p>
        </div>
        <nav className="ld-foot-col" aria-label="Tìm hiểu">
          <b>Tìm hiểu</b>
          <a href="#cach-hoat-dong">Cách hoạt động</a>
          <a href="#an-toan">An toàn</a>
          <a href="#goc-cua-be">Góc của bé</a>
          <a href="#hoi-dap">Hỏi đáp</a>
        </nav>
        <div className="ld-foot-col">
          <b>Tài khoản</b>
          <button className="ld-link" onClick={() => onStart("register")}>Tạo tài khoản</button>
          <button className="ld-link" onClick={() => onStart("login")}>Đăng nhập</button>
        </div>
        <small className="ld-foot-copy">taletale.site</small>
      </footer>
    </div>
  );
}
