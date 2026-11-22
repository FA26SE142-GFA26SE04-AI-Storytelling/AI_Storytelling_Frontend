"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronRight, Heart, Sparkles } from "lucide-react";
import Select from "@/app/components/Select";
import type { StoryCard } from "@/app/lib/storyView";
import { childProfileService } from "@/app/services/childProfileService";
import type { ChildProfile } from "@/app/types/childProfile";
import { jumpToSection, LibraryFeaturedStory } from "./LibraryDiscoveryHighlights";
import { canonicalAgeLabel, normalizeAgeKey, topicOf } from "./libraryFilters";

export type LibraryTopicAudience = {
  kids: ChildProfile[];
  loading: boolean;
  preferredKidId?: number;
  onSelectTopic: (genre: string, age: string) => void;
};

function topicKey(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");
}

function TopicsForChild({ kid, stories, onSelectTopic }: {
  kid: ChildProfile;
  stories: StoryCard[];
  onSelectTopic: LibraryTopicAudience["onSelectTopic"];
}) {
  const [learning, setLearning] = useState<{ interests: string[]; failed: boolean } | null>(null);
  useEffect(() => {
    let active = true;
    void childProfileService.getLearningProfile(kid.id).then((response) => {
      if (!active) return;
      setLearning({
        interests: (response.data?.topics ?? []).filter(({ relation }) => relation === "FavoriteTopic").map(({ topic }) => topicKey(topic)),
        failed: !response.success,
      });
    }).catch(() => {
      if (active) setLearning({ interests: [], failed: true });
    });
    return () => { active = false; };
  }, [kid.id]);

  const age = normalizeAgeKey(kid.ageBand);
  const topics = new Map<string, number>();
  for (const story of stories) {
    if (normalizeAgeKey(story.ageBand) !== age) continue;
    const label = topicOf(story);
    topics.set(label, (topics.get(label) ?? 0) + 1);
  }
  if (!learning) return <p className="sub" role="status">Đang tải sở thích của {kid.nickname}…</p>;
  const interests = new Set(learning.interests);
  const preferred = [...topics.keys()].filter((topic) => interests.has(topicKey(topic)));
  const matches = preferred.length > 0 ? preferred : [...topics.keys()];
  return (
    <>
      {learning.failed && <p className="sub">Chưa tải được sở thích. Đang gợi ý theo nhóm tuổi.</p>}
      {!learning.failed && preferred.length === 0 && matches.length > 0 && (
        <p className="sub">Gợi ý theo nhóm {canonicalAgeLabel(kid.ageBand)}.</p>
      )}
      {matches.length === 0 ? (
        <p className="sub">Chưa có truyện sẵn sàng cho nhóm {canonicalAgeLabel(kid.ageBand)}.</p>
      ) : (
        <div className="lib-filter-pills">
          {matches.map((topic) => (
            <button key={topic} type="button" className="lib-pill" onClick={() => {
              onSelectTopic(topic, age);
              requestAnimationFrame(() => jumpToSection("lib-results-heading"));
            }}>
              {topic}<span className="lib-pill-n lib-num">{topics.get(topic)}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function LibraryQuickTopics({ featured, stories, hasSpotlight, audience, onPickStory }: {
  featured?: StoryCard;
  stories: StoryCard[];
  hasSpotlight: boolean;
  audience: LibraryTopicAudience;
  onPickStory: (storyId: number, button: HTMLButtonElement) => void;
}) {
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [kidId, setKidId] = useState<string>();
  const heading = useRef<HTMLHeadingElement>(null);
  const kid = audience.kids.find(({ id }) => String(id) === kidId)
    ?? audience.kids.find(({ id }) => id === audience.preferredKidId)
    ?? audience.kids[0];
  useEffect(() => {
    if (topicsOpen) heading.current?.focus();
  }, [topicsOpen]);

  return (
    <>
      <div className={featured ? "lib-discovery-hero" : undefined}>
        {featured && <LibraryFeaturedStory story={featured} onPickStory={onPickStory} />}
        <nav className="lib-discovery-shortcuts" aria-label="Khám phá nhanh">
          {hasSpotlight && (
            <button type="button" onClick={() => jumpToSection("lib-spotlight-heading")}>
              <span className="lib-shortcut-icon"><Heart className="ic" aria-hidden="true" /></span>
              <span><strong>Nổi bật cộng đồng</strong><small>Truyện được đọc và yêu thích</small></span>
              <ChevronRight className="ic" aria-hidden="true" />
            </button>
          )}
          <div className="lib-saved-shortcut">
            <span className="lib-shortcut-icon lib-shortcut-gold"><Bookmark className="ic" aria-hidden="true" /></span>
            <span><strong>Truyện đã lưu</strong><small>Chưa hỗ trợ lưu truyện cho gia đình</small></span>
          </div>
          <button type="button" aria-expanded={topicsOpen} aria-controls="lib-child-topics" onClick={() => setTopicsOpen((open) => !open)}>
            <span className="lib-shortcut-icon lib-shortcut-gold"><Sparkles className="ic" aria-hidden="true" /></span>
            <span><strong>Chủ đề phù hợp cho bé</strong><small>Gợi ý theo độ tuổi và sở thích</small></span>
            <ChevronRight className="ic" aria-hidden="true" />
          </button>
        </nav>
      </div>
      <section id="lib-child-topics" className="lib-child-topics" aria-labelledby="lib-child-topics-heading" hidden={!topicsOpen}>
        <div className="lib-sec-head">
          <h3 id="lib-child-topics-heading" className="display" tabIndex={-1} ref={heading}>Chủ đề phù hợp cho bé</h3>
          {kid && audience.kids.length > 1 && (
            <Select ariaLabel="Chọn bé để xem chủ đề" value={String(kid.id)} onChange={setKidId}
              options={audience.kids.map(({ id, nickname }) => ({ value: String(id), label: nickname }))} portal />
          )}
        </div>
        {topicsOpen && (kid
          ? <TopicsForChild key={kid.id} kid={kid} stories={stories} onSelectTopic={audience.onSelectTopic} />
          : <p className="sub">{audience.loading ? "Đang tải hồ sơ bé…" : "Thêm hồ sơ bé để xem chủ đề theo độ tuổi và sở thích."}</p>)}
      </section>
    </>
  );
}
