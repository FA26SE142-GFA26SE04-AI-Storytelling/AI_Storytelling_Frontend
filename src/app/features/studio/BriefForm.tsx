"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleAlert, Sparkles } from "lucide-react";
import type { UseAIStoryInputFlowResult } from "@/app/features/story-workflow/useAIStoryInputFlow";
import { childProfileService } from "@/app/services/childProfileService";
import type { TokenQuotaStatus } from "@/app/types/childProfile";
import {
  FREE_TEXT_MAX, GENRES, LENGTHS, MORAL_LESSONS, SAMPLE_CHARACTERS, SAMPLE_SETTINGS, VOCAB_CHOICES,
  copyrightHits, detectPii, lengthChoiceOf, lengthTarget,
} from "@/app/lib/storyRules";
import { useRiseIn } from "@/app/lib/motion";
import { STUDIO_PREFILL_KEY } from "@/app/features/home/WishItem";

/** Ô nhập kèm bộ đếm ký tự (BR-2.20: tối đa 200 ký tự). */
function Counted({ value, max = FREE_TEXT_MAX }: { value: string; max?: number }) {
  return <small className={`count${value.length > max * 0.9 ? " warn" : ""}`}>{value.length}/{max}</small>;
}

/** Luồng 2 mục 3.1 — yêu cầu tạo truyện bằng AI. */
export default function BriefForm({ flow, locked }: { flow: UseAIStoryInputFlowResult; locked: boolean }) {
  const { values, context, updateValues, submit, isBusy, errorMessage } = flow;
  const formRef = useRiseIn<HTMLFormElement>(".kv, .field, button[type=submit], .btn-p", [!!values && !!context], { delay: 50 });
  const [quota, setQuota] = useState<TokenQuotaStatus | null>(null);

  useEffect(() => {
    if (!context) return;
    void childProfileService.getTokenQuotaForChild(context.childProfileId).then((r) => setQuota(r.success ? r.data : null));
  }, [context]);

  // Phụ huynh chọn "Tạo truyện mới" cho điều ước của bé (Luồng 2 mục 3.5): điền sẵn từ các thẻ bé đã chọn.
  const [fromWish, setFromWish] = useState(false);
  useEffect(() => {
    if (!context || locked) return;
    try {
      const raw = sessionStorage.getItem(STUDIO_PREFILL_KEY);
      const p = raw ? JSON.parse(raw) : null;
      if (!p || p.childId !== context.childProfileId) return;
      sessionStorage.removeItem(STUDIO_PREFILL_KEY);
      updateValues({ topic: p.topic, charactersText: p.charactersText, setting: p.setting, ...(p.lesson ? { lesson: p.lesson } : {}) });
      setFromWish(true);
    } catch { /* bỏ qua */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  const warnings = useMemo(() => {
    if (!values || !context) return { pii: [], copyright: [] };
    const text = [values.topic, values.charactersText, values.setting ?? "", values.lesson].join(" \n ");
    return { pii: detectPii(text, context.childNickname), copyright: copyrightHits(text) };
  }, [values, context]);

  if (!values || !context) {
    return <div className="pb"><p className="sub">{errorMessage ?? "Đang tải cấu hình tạo truyện của bé…"}</p></div>;
  }

  const level = context.readingLevel || 2;
  const length = lengthChoiceOf(values.targetLength, level);
  const chars = values.charactersText.split(",").map((c) => c.trim()).filter(Boolean);
  const addChar = (c: string) => !chars.includes(c) && updateValues({ charactersText: [...chars, c].join(", ") });
  const outOfQuota = !!quota && !quota.isUnlimited && (quota.remaining ?? 1) <= 0;
  const tooLong = [values.topic, values.charactersText, values.setting ?? "", values.lesson].some((t) => t.length > FREE_TEXT_MAX);

  return (
    <form ref={formRef} className="pb brief" onSubmit={(e) => { e.preventDefault(); if (!tooLong && !outOfQuota) void submit(); }}>
      <p className="sub">AI chỉ viết trong khuôn khổ cài đặt an toàn của {context.childNickname}, và mọi truyện đều chờ bạn duyệt.</p>
      {fromWish && <div className="notice ok">Đã điền sẵn từ điều ước của {context.childNickname}. Bạn có thể chỉnh trước khi tạo.</div>}
      <div className="kv">
        <div><small>Độ tuổi</small><b>{context.ageBand.replace("Age_", "").replace("_", "–")} tuổi</b></div>
        <div><small>Mức đọc</small><b>Mức {level}</b></div>
      </div>

      <label className="field"><span className="lbl row" style={{ justifyContent: "space-between" }}>Ý tưởng câu chuyện <Counted value={values.topic} /></span>
        <textarea className="inp" rows={3} disabled={locked} required minLength={2} value={values.topic} onChange={(e) => updateValues({ topic: e.target.value })} placeholder="Ví dụ: Rùa Bông mang đèn lồng đến hội Trung thu" /></label>

      <div className="field"><span className="lbl">Thể loại</span>
        <div className="chips">{GENRES.map((g) => <button type="button" key={g} disabled={locked} className={`chip${values.genre === g ? " on" : ""}`} onClick={() => updateValues({ genre: g })}>{g}</button>)}</div></div>

      <div className="field"><span className="lbl row" style={{ justifyContent: "space-between" }}>Nhân vật <Counted value={values.charactersText} /></span>
        <input className="inp" aria-label="Nhân vật" disabled={locked} value={values.charactersText} onChange={(e) => updateValues({ charactersText: e.target.value })} placeholder="Để trống để AI gợi ý. Cách nhau bằng dấu phẩy." />
        {!locked && <span className="chips">{SAMPLE_CHARACTERS.filter((c) => !chars.includes(c)).slice(0, 6).map((c) => <button type="button" key={c} className="chip" onClick={() => addChar(c)}>+ {c}</button>)}</span>}
      </div>

      <div className="field"><span className="lbl row" style={{ justifyContent: "space-between" }}>Bối cảnh <Counted value={values.setting ?? ""} /></span>
        <input className="inp" aria-label="Bối cảnh" disabled={locked} value={values.setting ?? ""} onChange={(e) => updateValues({ setting: e.target.value })} placeholder="Để trống để AI gợi ý" />
        {!locked && !values.setting && <span className="chips">{SAMPLE_SETTINGS.map((s) => <button type="button" key={s} className="chip" onClick={() => updateValues({ setting: s })}>{s}</button>)}</span>}
      </div>

      <div className="field"><span className="lbl row" style={{ justifyContent: "space-between" }}>Bài học <Counted value={values.lesson} /></span>
        <input className="inp" aria-label="Bài học" disabled={locked} required minLength={2} value={values.lesson} onChange={(e) => updateValues({ lesson: e.target.value })} placeholder="Chọn gợi ý hoặc tự viết" />
        {!locked && <span className="chips">{MORAL_LESSONS.map((l) => <button type="button" key={l} className={`chip${values.lesson === l ? " on" : ""}`} onClick={() => updateValues({ lesson: l })}>{l}</button>)}</span>}
      </div>

      <div className="field"><span className="lbl">Độ dài</span>
        <div className="seg">{LENGTHS.map((l) => <button type="button" key={l.id} disabled={locked} className={length === l.id ? "on" : ""} onClick={() => updateValues({ targetLength: lengthTarget(l.id, level, context.maximumLength) })}>{l.label}</button>)}</div>
        <span className="sub">Khoảng {values.targetLength.toLocaleString("vi-VN")} tiếng, không vượt giới hạn {context.maximumLength.toLocaleString("vi-VN")} tiếng của bé.</span>
      </div>

      <div className="field"><span className="lbl">Mức từ vựng</span>
        <div className="seg">{VOCAB_CHOICES.map((v) => <button type="button" key={v.id} title={v.hint} disabled={locked} className={(values.vocabularyChoice ?? "default") === v.id ? "on" : ""} onClick={() => updateValues({ vocabularyChoice: v.id })}>{v.label}</button>)}</div>
        <span className="sub">{VOCAB_CHOICES.find((v) => v.id === (values.vocabularyChoice ?? "default"))?.hint}</span>
      </div>

      {warnings.copyright.length > 0 && (
        <div className="notice err" role="status"><CircleAlert className="ic" /> “{warnings.copyright.join(", ")}” là nhân vật có bản quyền. AI sẽ không tái tạo nhân vật này — hãy dùng nhân vật của riêng bạn, ví dụ “chú mèo máy” thay cho tên cụ thể.</div>
      )}
      {warnings.pii.length > 0 && (
        <div className="notice err" role="status"><CircleAlert className="ic" /> Yêu cầu có thể chứa thông tin cá nhân ({[...new Set(warnings.pii.map((p) => p.kind))].join(", ")}). Bạn nên bỏ để bảo vệ bé{warnings.pii.every((p) => p.kind === "biệt danh của bé") ? ", trừ khi bạn chủ ý cho bé làm nhân vật" : ""}.</div>
      )}
      {tooLong && <div className="notice err" role="alert">Mỗi ô tối đa {FREE_TEXT_MAX} ký tự.</div>}
      {errorMessage && <div className="notice err" role="alert">{errorMessage}</div>}

      {quota && !quota.isUnlimited && (
        <p className="sub">Còn <b>{quota.remaining ?? 0}</b>/{quota.quotaLimit ?? "?"} lượt tạo truyện. Mỗi truyện mới dùng 1 lượt; mỗi truyện có 3 lần sửa bằng AI miễn phí.</p>
      )}
      {outOfQuota && <div className="notice err" role="alert">Bạn đã dùng hết lượt tạo truyện của kỳ này.</div>}
      <button className="btn btn-p btn-c" style={{ padding: 9 }} disabled={locked || isBusy || tooLong || outOfQuota}><Sparkles className="ic" />{isBusy ? "Đang gửi…" : "Tạo truyện"}</button>
    </form>
  );
}
