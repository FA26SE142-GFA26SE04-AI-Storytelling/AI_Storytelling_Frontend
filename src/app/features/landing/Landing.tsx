"use client";

import "./landing.css";
import { useEffect, useState } from "react";
import {
  BookOpen, Check, FileUp, Inbox, Lock, Moon, NotebookPen, PenLine, Route, ShieldCheck, Sparkles, Star, Sun, Users, WandSparkles,
} from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import HeroPond from "@/app/components/brand/HeroPond";
import LilyStepper from "@/app/components/brand/LilyStepper";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import { useTheme } from "@/app/context/ThemeContext";
import { circleReveal, prefersReducedMotion, useRiseIn } from "@/app/lib/motion";

const STEPS: { label: string; text: string }[] = [
  { label: "Ý tưởng", text: "Bạn kể chủ đề, nhân vật và bài học muốn gửi tới con." },
  { label: "Kiểm tra an toàn", text: "Ý tưởng được đối chiếu với cài đặt an toàn của bé trước khi AI bắt đầu viết." },
  { label: "Duyệt dàn ý", text: "AI đề xuất mở đầu, diễn biến, kết thúc. Bạn sửa hoặc nhờ viết lại." },
  { label: "Duyệt truyện", text: "Đọc bản thảo, từ vựng và câu đố. Sửa tay hoặc nhờ AI sửa đúng đoạn bạn chọn." },
  { label: "Tranh và giọng đọc", text: "Bạn duyệt xong, hệ thống vẽ tranh và tạo giọng đọc. Lúc này bé mới thấy truyện." },
];

const CONTROLS = [
  { icon: ShieldCheck, title: "Cài đặt riêng cho từng bé", text: "Chủ đề cho phép, hạn chế hay chặn, độ dài tối đa và cách duyệt, đặt theo từng con." },
  { icon: Inbox, title: "Chưa duyệt thì chưa tới tay bé", text: "Bản nháp không bao giờ hiện trong góc đọc của bé. Bé chỉ thấy truyện bạn đã đồng ý." },
  { icon: Lock, title: "Cổng phụ huynh", text: "Bé không tự thoát khỏi góc đọc hay mở phần cài đặt. Không có trò chuyện tự do với AI." },
  { icon: Users, title: "Cùng nhau giám sát", text: "Mời ông bà, người thân cùng theo dõi, mỗi người một quyền phù hợp." },
];

const KID = [
  { icon: BookOpen, title: "Đọc và nghe", text: "Lật trang bằng một cái vuốt, nghe giọng đọc tô sáng từng chữ." },
  { icon: Star, title: "Câu đố nhỏ", text: "Trả lời đúng được sao thưởng. Sai thì ếch động viên thử lại." },
  { icon: NotebookPen, title: "Sổ từ vựng", text: "Chạm vào từ mới để lưu lại, ôn bất cứ lúc nào." },
  { icon: Route, title: "Bố mẹ chọn cho em", text: "Từng truyện mở lần lượt theo lộ trình bố mẹ sắp sẵn." },
  { icon: Sparkles, title: "Gửi điều ước", text: "Bé chọn thẻ nhân vật, nơi chốn. Bố mẹ quyết định có viết truyện đó không." },
];

const WAYS = [
  { icon: WandSparkles, title: "Tạo bằng AI", text: "Từ một ý tưởng thành truyện hoàn chỉnh có tranh, giọng đọc và học liệu, qua từng bước bạn duyệt." },
  { icon: FileUp, title: "Nhập truyện có sẵn", text: "Dán hoặc tải truyện bạn có. AI đánh giá độ khó và đề xuất điều chỉnh cho hợp với con." },
  { icon: PenLine, title: "Tự viết", text: "Viết kỷ niệm gia đình hay một lời nhắn gửi con, có gợi ý cách viết và AI góp ý khi bạn cần." },
];

/** Trang giới thiệu Taletale cho người chưa đăng nhập. "Bắt đầu" mở biểu mẫu đăng ký, "Đăng nhập" mở biểu mẫu đăng nhập. */
export default function Landing({ onStart }: { onStart: (mode: "login" | "register") => void }) {
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState(0);
  const heroRef = useRiseIn<HTMLDivElement>(".ld-rise", [], { delay: 70, distance: 12 });
  const bodyRef = useRiseIn<HTMLDivElement>(".ld-card", [], { delay: 40, distance: 10 });

  // Ếch nhảy qua từng lá sen để minh hoạ quy trình; tắt khi người dùng giảm chuyển động.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2600);
    return () => clearInterval(t);
  }, []);

  const flipTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme);
  };

  return (
    <div className="ld">
      <PondBackdrop rich />
      <header className="ld-top">
        <a className="ld-brand" href="#top" aria-label="Taletale"><Frog size={34} variant="face" animated={false} /><b className="display">Taletale</b></a>
        <nav className="ld-nav" aria-label="Trang giới thiệu">
          <a href="#cach-hoat-dong">Cách hoạt động</a>
          <a href="#an-toan">An toàn</a>
          <a href="#goc-cua-be">Góc của bé</a>
        </nav>
        <div className="ld-actions">
          <button className="btn btn-g" onClick={flipTheme} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}>{theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}</button>
          <button className="btn btn-s" onClick={() => onStart("login")}>Đăng nhập</button>
        </div>
      </header>

      <main id="top">
        <section ref={heroRef} className="ld-hero">
          <div className="ld-hero-text">
            <span className="pill ai ld-rise">Kể chuyện AI cho bé 6–10 tuổi</span>
            <h1 className="display ld-rise">Truyện của con, bố mẹ duyệt từng trang</h1>
            <p className="ld-lead ld-rise">Bạn kể một ý tưởng, AI viết thành truyện có tranh và giọng đọc. Mỗi bước đều chờ bạn đồng ý, và bé chỉ thấy truyện bạn đã duyệt.</p>
            <div className="ld-cta ld-rise">
              <button className="btn btn-p ld-big" onClick={() => onStart("register")}>Bắt đầu cho con</button>
              <button className="btn btn-s ld-big" onClick={() => onStart("login")}>Tôi đã có tài khoản</button>
            </div>
            <ul className="ld-trust ld-rise">
              <li><Check className="ic" />Kiểm tra an toàn trước khi viết</li>
              <li><Check className="ic" />Không trò chuyện tự do với AI</li>
              <li><Check className="ic" />Cài đặt riêng cho từng bé</li>
            </ul>
          </div>
          <div className="ld-hero-art ld-rise" aria-hidden>
            <HeroPond mood="happy" />
            <div className="ld-story">
              <span className="ld-story-cover" />
              <div>
                <b className="display">Chú ếch và chiếc ô lá sen</b>
                <small>6–8 tuổi · 6 cảnh · có giọng đọc</small>
              </div>
              <span className="pill ok">Đã duyệt</span>
            </div>
          </div>
        </section>

        <div ref={bodyRef}>
          <section id="cach-hoat-dong" className="ld-section">
            <h2 className="display">Năm chiếc lá sen, năm lần bạn quyết định</h2>
            <p className="ld-sub">AI làm phần việc nặng, còn bạn giữ quyền ở mọi bước.</p>
            <div className="ld-stepper"><LilyStepper steps={STEPS.map((s) => s.label)} current={step} mood="happy" /></div>
            <ol className="ld-steps">
              {STEPS.map((s, i) => (
                <li key={s.label} className={`ld-card${i === step ? " on" : ""}`} onMouseEnter={() => setStep(i)}>
                  <span className="ld-num">{i + 1}</span>
                  <b>{s.label}</b>
                  <span>{s.text}</span>
                </li>
              ))}
            </ol>
          </section>

          <section id="an-toan" className="ld-section">
            <h2 className="display">Bạn nắm quyền, AI chỉ phụ việc</h2>
            <p className="ld-sub">An toàn của bé đứng trên mọi tính năng. Có nghi ngờ thì hệ thống dừng lại và hỏi bạn.</p>
            <div className="ld-grid">
              {CONTROLS.map((c) => (
                <div key={c.title} className="ld-card">
                  <span className="ld-icon"><c.icon /></span>
                  <b>{c.title}</b>
                  <span>{c.text}</span>
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
            <div className="ld-grid">
              {KID.map((k) => (
                <div key={k.title} className="ld-card ld-kid-card">
                  <span className="ld-icon gold"><k.icon /></span>
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
                  <span className="ld-icon"><w.icon /></span>
                  <b>{w.title}</b>
                  <span>{w.text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="ld-section ld-night ld-card">
            <Moon className="ld-moon" aria-hidden />
            <div className="grow">
              <h2 className="display">Đọc trước giờ ngủ</h2>
              <p className="ld-sub">Giao diện tối dịu mắt, nền xanh đêm và đom đóm vàng, để buổi đọc cuối ngày thật êm.</p>
            </div>
            <button className="btn btn-s" onClick={flipTheme}>{theme === "dark" ? <><Sun className="ic" />Xem giao diện sáng</> : <><Moon className="ic" />Thử giao diện tối</>}</button>
          </section>

          <section className="ld-section ld-final ld-card">
            <Frog size={110} mood="happy" />
            <h2 className="display">Sẵn sàng kể câu chuyện đầu tiên cho con?</h2>
            <p className="ld-sub">Tạo tài khoản, thêm hồ sơ bé và cài đặt an toàn trong vài phút.</p>
            <div className="ld-cta">
              <button className="btn btn-p ld-big" onClick={() => onStart("register")}>Bắt đầu cho con</button>
              <button className="btn btn-s ld-big" onClick={() => onStart("login")}>Đăng nhập</button>
            </div>
          </section>
        </div>
      </main>

      <footer className="ld-foot">
        <span className="ld-brand"><Frog size={26} variant="face" animated={false} /><b className="display">Taletale</b></span>
        <span className="sub">Nền tảng kể chuyện AI an toàn cho trẻ em, có phụ huynh đồng hành · taletale.site</span>
      </footer>
    </div>
  );
}
