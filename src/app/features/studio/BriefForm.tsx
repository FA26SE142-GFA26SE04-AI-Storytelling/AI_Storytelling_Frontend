"use client";

import { Sparkles } from "lucide-react";
import type { UseAIStoryInputFlowResult } from "@/app/features/story-workflow/useAIStoryInputFlow";
import { clampTargetLength } from "@/app/features/story-workflow/aiStoryInputFlowUtils";
import { useRiseIn } from "@/app/lib/motion";

const GENRES = ["Thám hiểm & Phép thuật", "Cổ tích", "Khoa học", "Đời sống", "Động vật"];

export default function BriefForm({ flow, locked }: { flow: UseAIStoryInputFlowResult; locked: boolean }) {
  const { values, context, updateValues, submit, isBusy, errorMessage } = flow;
  const formRef = useRiseIn<HTMLFormElement>(".kv, .field, button[type=submit], .btn-p", [!!values && !!context], { delay: 50 });

  if (!values || !context) {
    return <div className="pb"><p className="sub">{errorMessage ?? "Đang tải cấu hình tạo truyện của bé…"}</p></div>;
  }
  const max = Math.min(context.maximumLength, 5000);

  return (
    <form ref={formRef} className="pb" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <p className="sub">AI chỉ viết trong khuôn khổ chính sách an toàn của {context.childNickname}, và không trò chuyện tự do với bé.</p>
      <div className="kv">
        <div><small>Độ tuổi</small><b>{context.ageBand.replace("Age_", "").replace("_", "–")}</b></div>
        <div><small>Mức đọc</small><b>Mức {context.readingLevel}</b></div>
      </div>
      <label className="field"><span className="lbl">Ý tưởng câu chuyện</span>
        <textarea className="inp" rows={3} disabled={locked} required value={values.topic} onChange={(e) => updateValues({ topic: e.target.value })} placeholder="Ví dụ: Rùa Bông mang đèn lồng đến hội Trung thu" /></label>
      <div className="field"><span className="lbl">Thể loại</span>
        <div className="chips">{GENRES.map((g) => <button type="button" key={g} disabled={locked} className={`chip${values.genre === g ? " on" : ""}`} onClick={() => updateValues({ genre: g })}>{g}</button>)}</div></div>
      <label className="field"><span className="lbl">Nhân vật (cách nhau bằng dấu phẩy, để trống nếu muốn AI gợi ý)</span>
        <input className="inp" disabled={locked} value={values.charactersText} onChange={(e) => updateValues({ charactersText: e.target.value })} /></label>
      <label className="field"><span className="lbl">Bài học</span>
        <input className="inp" disabled={locked} required value={values.lesson} onChange={(e) => updateValues({ lesson: e.target.value })} /></label>
      <label className="field"><span className="lbl row" style={{ justifyContent: "space-between" }}>Độ dài mục tiêu <b style={{ color: "var(--text)" }}>{values.targetLength} từ</b></span>
        <input type="range" className="range" disabled={locked} min={100} max={max} step={50} value={clampTargetLength(values.targetLength, max)} onChange={(e) => updateValues({ targetLength: +e.target.value })} aria-label="Độ dài mục tiêu" /></label>
      {errorMessage && <div className="notice err" role="alert">{errorMessage}</div>}
      <button className="btn btn-p btn-c" style={{ padding: 9 }} disabled={locked || isBusy}><Sparkles className="ic" />{isBusy ? "Đang gửi…" : "Tạo truyện"}</button>
    </form>
  );
}
