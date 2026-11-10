"use client";

import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { GENRES } from "@/app/lib/storyRules";
import { saveLandingIdea } from "./landingIdea";

const MAX = 200;

/** Ô thử ý tưởng ngay trên trang giới thiệu. Gửi thì mở form đăng ký; ý tưởng được giữ lại để điền sẵn vào Studio. */
export default function IdeaBox({ onStart }: { onStart: () => void }) {
  const [topic, setTopic] = useState("");
  const [genre, setGenre] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (topic.trim()) saveLandingIdea({ topic: topic.trim(), genre });
    onStart();
  };

  return (
    <form className="ld-idea" onSubmit={submit}>
      <label htmlFor="ld-idea-topic" className="display ld-idea-title">Hôm nay bạn muốn kể cho con nghe chuyện gì?</label>
      <div className="ld-idea-box">
        <textarea id="ld-idea-topic" name="topic" rows={2} maxLength={MAX} autoComplete="off" value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder="Ví dụ: Chú voi con sợ bóng tối, được đom đóm dẫn đường về nhà…" />
        <div className="ld-idea-row">
          <div className="ld-idea-genres" role="group" aria-label="Thể loại">
            {GENRES.slice(0, 4).map((g) => (
              <button type="button" key={g} aria-pressed={genre === g} className={genre === g ? "on" : ""} onClick={() => setGenre(genre === g ? null : g)}>{g}</button>
            ))}
          </div>
          <button type="submit" className="btn btn-gold ld-idea-go"><Sparkles className="ic" aria-hidden />Viết thử truyện này</button>
        </div>
      </div>
      <p className="ld-idea-hint">Tạo tài khoản xong, ý tưởng này được điền sẵn trong Studio để bạn duyệt từng bước.</p>
    </form>
  );
}
