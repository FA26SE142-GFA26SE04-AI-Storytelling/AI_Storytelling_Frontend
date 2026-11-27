"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import SafeImage from "@/app/components/SafeImage";
import StorySampleAudio from "./StorySampleAudio";
import { useRiseIn } from "@/app/lib/motion";

// Explicitly requested landing mock stories; never a fallback for library API data.
const EXAMPLE_STORIES = [
  { title: "Chiếc ô của Ếch Xanh", age: "6–8 tuổi", lesson: "Biết chia sẻ", description: "Một cơn mưa và chiếc ô nhỏ giúp Ếch Xanh hiểu niềm vui khi cùng che chở cho bạn.", genre: "Truyện đời sống", tone: "mint" },
  { title: "Ngày đầu đến lớp của Bông", age: "6–8 tuổi", lesson: "Tự tin làm quen", description: "Một lời chào nhỏ giúp Bông mở ra tình bạn thật đẹp trong ngày đầu đến lớp.", genre: "Truyện học đường", tone: "lotus" },
  { title: "Hạt sen kiên trì", age: "8–10 tuổi", lesson: "Kiên trì mỗi ngày", description: "Hạt sen bé xíu học cách chờ đợi và lớn lên, qua từng ngày nắng và những cơn mưa.", genre: "Ngụ ngôn", tone: "gold" },
  { title: "Lời xin lỗi bên hồ sen", age: "6–8 tuổi", lesson: "Biết nhận lỗi", description: "Chú ếch nhỏ tìm lại sự can đảm để nói lời xin lỗi với bạn bằng cả tấm lòng.", genre: "Truyện tình bạn", tone: "water" },
  { title: "Đốm và chiếc đèn đêm", age: "6–8 tuổi", lesson: "Đối diện nỗi sợ", description: "Đốm khám phá những âm thanh ban đêm và nhận ra bóng tối cũng có điều dịu dàng.", genre: "Phiêu lưu", tone: "gold" },
  { title: "Khu vườn của bà", age: "8–10 tuổi", lesson: "Quan tâm gia đình", description: "Một buổi cùng bà chăm vườn giúp bé nhận ra yêu thương từ những việc rất nhỏ.", genre: "Truyện gia đình", tone: "mint" },
  { title: "Lá thư gửi mùa mưa", age: "8–10 tuổi", lesson: "Trân trọng tình bạn", description: "Những lá thư đi qua hồ sen giúp hai người bạn giữ lời hẹn dù ở xa nhau.", genre: "Truyện tình bạn", tone: "lotus" },
] as const;

const AUTOPLAY_INTERVAL = 2000;

export default function LandingStoryShelf() {
  const [active, setActive] = useState(0);
  const [stageHeight, setStageHeight] = useState(720);
  const [inView, setInView] = useState(false);
  const [motionReduced, setMotionReduced] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const [samplePlaying, setSamplePlaying] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const autoplay = inView && !motionReduced && !hovered && !keyboardFocused && !samplePlaying;
  const ref = useRiseIn<HTMLElement>(".ld-shelf-heading", [], { distance: 12 });
  useEffect(() => {
    const cards = ref.current?.querySelectorAll<HTMLElement>(".ld-story-preview");
    if (!cards?.length) return;
    const observer = new ResizeObserver(() => {
      setStageHeight(Math.ceil(Math.max(...Array.from(cards, (card) => card.offsetHeight))) + 64);
    });
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [ref]);
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.intersectionRatio >= 0.3);
    }, { threshold: 0.3 });
    observer.observe(section);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setMotionReduced(preference.matches);
    preference.addEventListener("change", updatePreference);
    updatePreference();
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", updatePreference);
    };
  }, [ref]);

  useEffect(() => {
    if (!autoplay) return;
    const interval = window.setInterval(() => {
      if (!document.hidden && !touchStart.current) {
        setActive((active + 1) % EXAMPLE_STORIES.length);
      }
    }, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(interval);
  }, [active, autoplay]);

  const selectStory = (index: number) => {
    if (index === active) return;
    setSamplePlaying(false);
    setActive(index);
  };
  const turn = (step: number) => selectStory((active + step + EXAMPLE_STORIES.length) % EXAMPLE_STORIES.length);

  return (
    <section ref={ref} className="ld-story-shelf ld-carousel" aria-labelledby="ld-stories-title"
      aria-roledescription="băng chuyền" tabIndex={0}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => setKeyboardFocused(event.target.matches(":focus-visible"))}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocused(false); }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          turn(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <div className="ld-shelf-heading">
        <div>
          <span className="ld-eyebrow">MỖI CÂU CHUYỆN, MỘT ĐIỀU CON HỌC</span>
          <h2 id="ld-stories-title" className="display">Thế giới câu chuyện</h2>
          <p className="ld-carousel-intro">Đi qua từng trang sách, khám phá những bài học gần gũi cùng con.</p>
        </div>
      </div>
      <div className="ld-carousel-stage" style={{ height: stageHeight }}
        onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }}
        onTouchCancel={() => { touchStart.current = null; }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          const touch = event.changedTouches[0];
          if (!start || !touch) return;
          const dx = touch.clientX - start.x, dy = touch.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? 1 : -1);
        }}>
        <ul className="ld-carousel-track" aria-label="Truyện mẫu">
          {EXAMPLE_STORIES.map((story, index) => {
            let offset = (index - active + EXAMPLE_STORIES.length) % EXAMPLE_STORIES.length;
            if (offset > Math.floor(EXAMPLE_STORIES.length / 2)) offset -= EXAMPLE_STORIES.length;
            const distance = Math.abs(offset);
            return (
              <li key={story.title} className="ld-carousel-slide" data-active={offset === 0} data-hidden={distance > 2}
                aria-hidden={distance > 2} style={{ "--offset": offset, "--depth": distance, zIndex: 10 - distance } as CSSProperties}>
                <article className="ld-story-preview">
                  <button type="button" className={`ld-story-cover ld-story-cover-${story.tone}`}
                    tabIndex={distance > 2 ? -1 : 0} onClick={() => selectStory(index)} aria-label={`Chọn truyện: ${story.title}`}>
                    <SafeImage src="/landing-storybooks.png" alt="" loading="lazy" width={1536} height={1024} />
                    <span className="ld-cover-category"><BookOpen size={14} aria-hidden />{story.genre}</span>
                    <span className="ld-cover-age">{story.age}</span>
                  </button>
                  <div className="ld-carousel-copy">
                    <h3 className="display">{story.title}</h3>
                    <dl className="ld-story-facts">
                      <div><dt>Độ tuổi</dt><dd>{story.age}</dd></div>
                      <div><dt>Thể loại</dt><dd>{story.genre}</dd></div>
                    </dl>
                    <div className="ld-story-lesson"><GraduationCap size={20} aria-hidden /><div><span>Điều con học được</span><strong>{story.lesson}</strong></div></div>
                    <div className="ld-story-summary"><span className="ld-content-label">Nội dung câu chuyện</span><p className="ld-story-description">{story.description}</p></div>
                    <StorySampleAudio key={`${story.title}-${offset === 0}`} title={story.title} text={story.description} active={offset === 0}
                      onPlaybackChange={offset === 0 ? setSamplePlaying : undefined} />
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="ld-carousel-controls">
        <button type="button" className="ld-text-action" aria-label="Truyện trước" onClick={() => turn(-1)}><ArrowLeft size={22} aria-hidden /></button>
        <p className="ld-carousel-status" role="status" aria-live={autoplay ? "off" : "polite"} aria-atomic="true">
          <span>{active + 1} / {EXAMPLE_STORIES.length}</span><span>{EXAMPLE_STORIES[active].title}</span>
        </p>
        <button type="button" className="ld-text-action" aria-label="Truyện tiếp theo" onClick={() => turn(1)}><ArrowRight size={22} aria-hidden /></button>
      </div>
    </section>
  );
}
