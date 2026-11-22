"use client";

import { useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, ChevronUp, Clock, Layers3, Star, Tags } from "lucide-react";
import Lotus from "@/app/components/brand/Lotus";
import { uncroppedCover, type StoryCard } from "@/app/lib/storyView";
import { canonicalAgeLabel, estimatedReadingMinutes, topicOf } from "./libraryFilters";

const GENRE_ROW_LIMIT = 4;

export function jumpToSection(id: string) {
  const heading = document.getElementById(id);
  heading?.focus({ preventScroll: true });
  heading?.scrollIntoView({ block: "start" });
}

export function LibraryFeaturedStory({ story, onPickStory }: {
  story: StoryCard;
  onPickStory: (storyId: number, button: HTMLButtonElement) => void;
}) {
  const minutes = estimatedReadingMinutes(story);
  return (
    <article className="lib-featured" aria-labelledby="lib-featured-title">
      <div className="lib-featured-art" aria-hidden="true">
        <span style={{ background: uncroppedCover(story.raw.coverImageUrl) }} />
      </div>
      <div className="lib-featured-copy">
        <span className="lib-featured-label"><Star className="ic" aria-hidden="true" />Truyện nổi bật</span>
        <h3 id="lib-featured-title" className="display">{story.title}</h3>
        <div className="lib-featured-meta">
          <span><Tags className="ic" aria-hidden="true" />{topicOf(story)}</span>
          {story.ageBand && <span>{canonicalAgeLabel(story.ageBand)}</span>}
          {minutes !== null && (
            <span><Clock className="ic" aria-hidden="true" />{minutes} phút</span>
          )}
        </div>
        {story.raw.description?.trim() && <p>{story.raw.description}</p>}
        <button type="button" className="btn btn-gold" aria-haspopup="dialog" onClick={(event) => onPickStory(story.id, event.currentTarget)}>
          <BookOpen className="ic" aria-hidden="true" />Xem truyện<ArrowRight className="ic" aria-hidden="true" />
        </button>
      </div>
      <Lotus className="lib-featured-lotus" size={58} />
    </article>
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
