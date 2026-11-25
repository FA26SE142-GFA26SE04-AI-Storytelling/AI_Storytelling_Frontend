"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, ChevronUp, Clock, Layers3, Star, Tags } from "lucide-react";
import { prefersReducedMotion } from "@/app/lib/motion";
import { coverFor, uncroppedCover, type StoryCard } from "@/app/lib/storyView";
import { canonicalAgeLabel, estimatedReadingMinutes, topicOf } from "./libraryFilters";

const GENRE_ROW_LIMIT = 4;

export function jumpToSection(id: string) {
  const heading = document.getElementById(id);
  heading?.focus({ preventScroll: true });
  heading?.scrollIntoView({ block: "start" });
}

const HERO_LIMIT = 5;
const HERO_INTERVAL_MS = 5000;

/**
 * Truyện lên banner (tối đa 5, phải có ảnh bìa): trước hết theo bảng xếp hạng yêu thích từ API (`ranked`),
 * thiếu thì bù bằng các truyện còn lại có nhiều lượt yêu thích rồi nhiều lượt đọc nhất.
 */
export function heroStories(ranked: StoryCard[], rest: StoryCard[]): StoryCard[] {
  const byCount = [...rest].sort((a, b) => (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0) || (b.viewCount ?? 0) - (a.viewCount ?? 0));
  const seen = new Set<number>();
  const out: StoryCard[] = [];
  for (const story of [...ranked, ...byCount]) {
    if (out.length >= HERO_LIMIT) break;
    if (seen.has(story.id) || !story.raw.coverImageUrl?.trim()) continue;
    seen.add(story.id);
    out.push(story);
  }
  return out;
}

/**
 * Banner đầu Thư viện: ảnh bìa phủ kín bề ngang, tự đổi truyện mỗi 5 giây (dừng khi rê chuột / focus, tắt khi giảm chuyển động),
 * ảnh nhỏ góc dưới để chọn truyện. Lớp ảnh kéo lên phủ cả hàng tìm kiếm và chip chủ đề phía trên (các nút đó nằm trên ảnh, nền trong suốt):
 * khối banner nằm trong luồng trang sau các nút nên ô tìm kiếm không bị dựng lại khi banner ẩn / hiện.
 */
export function LibraryHero({ stories, onPickStory }: {
  stories: StoryCard[];
  onPickStory: (storyId: number, button: HTMLButtonElement) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lift, setLift] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const count = stories.length;
  const active = index < count ? index : 0;
  const story = stories[active];

  // Lớp ảnh bám đáy banner (CSS) và kéo lên tới mép trên khung chứa: đo khoảng cách đó, đo lại khi các hàng phía trên đổi chiều cao.
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const measure = () => setLift(Math.max(0, el.getBoundingClientRect().top - parent.getBoundingClientRect().top));
    measure();
    const observer = new ResizeObserver(measure);
    // border-box: khoảng đệm trên của khung chứa (thêm khi có banner) cũng làm đổi vị trí banner.
    observer.observe(parent, { box: "border-box" });
    observer.observe(el, { box: "border-box" });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || count < 2 || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), HERO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (!story) return null;
  const minutes = estimatedReadingMinutes(story);
  return (
    <section
      ref={ref}
      className="lib-hero"
      aria-roledescription="carousel"
      aria-label="Truyện nổi bật"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}
    >
      <div className="lib-hero-bg" aria-hidden="true" style={{ top: -lift }}>
        {stories.map((item, i) => (
          <span key={item.id} className={i === active ? "on" : undefined} style={{ background: coverFor(item.raw.coverImageUrl) }} />
        ))}
      </div>
      <div key={story.id} className="lib-hero-copy" aria-live={paused ? "polite" : "off"}>
        <span className="lib-featured-label"><Star className="ic" aria-hidden="true" />Truyện nổi bật</span>
        <h3 className="display">{story.title}</h3>
        <div className="lib-featured-meta">
          <span><Tags className="ic" aria-hidden="true" />{topicOf(story)}</span>
          {story.ageBand && <span>{canonicalAgeLabel(story.ageBand)}</span>}
          {minutes !== null && <span><Clock className="ic" aria-hidden="true" />{minutes} phút</span>}
        </div>
        {story.raw.description?.trim() && <p>{story.raw.description}</p>}
        <button type="button" className="btn btn-gold" aria-haspopup="dialog" onClick={(event) => onPickStory(story.id, event.currentTarget)}>
          <BookOpen className="ic" aria-hidden="true" />Xem truyện<ArrowRight className="ic" aria-hidden="true" />
        </button>
      </div>
      {count > 1 && (
        <div className="lib-hero-thumbs" role="group" aria-label="Chọn truyện nổi bật">
          {stories.map((item, i) => (
            <button key={item.id} type="button" aria-pressed={i === active} aria-label={`Truyện ${i + 1}: ${item.title}`} title={item.title}
              style={{ background: coverFor(item.raw.coverImageUrl) }} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </section>
  );
}

export function LibraryGenreTiles({
  topics,
  stories,
  onGenreChange,
  defaultExpanded = false,
}: {
  topics: [string, number][];
  stories: StoryCard[];
  onGenreChange: (genre: string) => void;
  defaultExpanded?: boolean;
}) {
  const [showAll, setShowAll] = useState(defaultExpanded);
  if (!topics.length) return null;
  const hasMore = topics.length > GENRE_ROW_LIMIT;
  const visibleTopics = showAll ? topics : topics.slice(0, GENRE_ROW_LIMIT);
  const covers = new Map<string, string>();
  for (const story of stories) {
    const topic = topicOf(story);
    if (!covers.has(topic)) covers.set(topic, uncroppedCover(story.raw.coverImageUrl));
  }
  return (
    <section className="lib-section" aria-labelledby="lib-genre-heading">
      <div className="lib-sec-head">
        <h3 id="lib-genre-heading" className="display" tabIndex={-1}>
          <Layers3 className="ic lib-sec-ic" aria-hidden="true" />Theo thể loại
        </h3>
        {hasMore && (
          <button
            type="button"
            className="shelf-all"
            aria-expanded={showAll}
            aria-controls="lib-genre-grid"
            onClick={() => setShowAll((open) => !open)}
          >
            {showAll ? "Thu gọn" : "Xem tất cả chủ đề"}
            {showAll ? (
              <ChevronUp className="ic" aria-hidden="true" />
            ) : (
              <ChevronRight className="ic" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      <div id="lib-genre-grid" className={`lib-genre-grid${showAll ? "" : " lib-genre-row"}`}>
        {visibleTopics.map(([label, count]) => (
          <button key={label} type="button" onClick={() => {
            onGenreChange(label);
            requestAnimationFrame(() => jumpToSection("lib-results-heading"));
          }}>
            <span className="lib-genre-art" style={{ background: covers.get(label) }} aria-hidden="true" />
            <span className="lib-genre-label"><strong>{label}</strong><small>{count} truyện</small></span>
            <ChevronRight className="ic" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
