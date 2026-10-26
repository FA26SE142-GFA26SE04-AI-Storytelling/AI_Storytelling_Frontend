"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Lock, ShieldAlert, Sparkles } from "lucide-react";
import type { UseAIStoryInputFlowResult } from "@/app/features/story-workflow/useAIStoryInputFlow";
import { childProfileService } from "@/app/services/childProfileService";
import type { TokenQuotaStatus } from "@/app/types/childProfile";
import { copyrightHits, GENRES } from "@/app/lib/storyRules";
import { STUDIO_PREFILL_KEY } from "@/app/features/home/WishItem";
import { takeLandingIdea } from "@/app/features/landing/landingIdea";
import {
  clampTargetLength, FREE_TEXT_MAX, lengthPresets, MIN_TARGET_LENGTH, outputModesOf, vocabularyTone,
  type AIStoryInputFormValues, type LengthPreset,
} from "@/app/features/story-workflow/aiStoryInputFlowUtils";
import { OUTPUT_MODE } from "@/app/lib/storyRules";
import { detectPii, piiMessage } from "@/app/features/story-workflow/piiHints";
import { useRiseIn } from "@/app/lib/motion";

const LESSONS = ["Trung thực", "Biết chia sẻ", "Dũng cảm", "Kiên trì", "Lễ phép", "Yêu thương gia đình"];
const LENGTHS: [LengthPreset, string][] = [["short", "Ngắn"], ["medium", "Vừa"], ["long", "Dài"]];
const TONE_LABEL = { familiar: "Quen thuộc", default: "Theo trình độ", extended: "Mở rộng" } as const;
const TONE_HINT = {
  familiar: "dùng từ bé đã quen, không thêm từ mới.",
  default: "thêm vài từ mới vừa sức bé.",
  extended: "thêm nhiều từ mới hơn, có giải nghĩa trong phần từ vựng.",
} as const;

type TextKey = "charactersText" | "setting" | "lesson";

/**
 * Form ý tưởng một cột, cuộn từ trên xuống: hai trường bắt buộc → chi tiết không bắt buộc → tuỳ chọn truyện → nút "Viết dàn ý".
 * Mục có nhiều lựa chọn (thể loại, mức từ vựng, gợi ý) dùng ô xổ xuống thay vì một dãy nút.
 */
export default function BriefForm({ flow, locked }: { flow: UseAIStoryInputFlowResult; locked: boolean }) {
  const { values, context, updateValues, submit, isBusy, errorMessage } = flow;
  const [quota, setQuota] = useState<TokenQuotaStatus | null>(null);

  useEffect(() => {
    if (!context) return;
    void childProfileService.getTokenQuotaForChild(context.childProfileId).then((r) => setQuota(r.success ? r.data : null));
  }, [context]);

  // Phụ huynh chọn "Tạo truyện mới" cho điều ước của bé (Luồng 2 mục 3.5): điền sẵn từ các thẻ bé đã chọn.
  // Nguồn điền sẵn: điều ước của bé (Luồng 2 mục 3.5), gợi ý chủ đề của Luồng 6 Nhánh B,
  // hoặc ý tưởng khách gõ ở trang giới thiệu trước khi có tài khoản (chỉ khi form đang trống).
  const [prefilled, setPrefilled] = useState<"wish" | "recommendation" | "landing" | null>(null);
  useEffect(() => {
    if (!context || locked) return;
    try {
      const raw = sessionStorage.getItem(STUDIO_PREFILL_KEY);
      const p = raw ? JSON.parse(raw) : null;
      if (p && p.childId === context.childProfileId) {
        sessionStorage.removeItem(STUDIO_PREFILL_KEY);
        updateValues({ topic: p.topic, charactersText: p.charactersText, setting: p.setting ?? "", ...(p.lesson ? { lesson: p.lesson } : {}) });
        setPrefilled(p.source === "recommendation" ? "recommendation" : "wish");
        return;
      }
    } catch { /* bỏ qua */ }
    if (values?.topic.trim()) return;
    const idea = takeLandingIdea();
    if (!idea) return;
    updateValues({ topic: idea.topic, ...(idea.genre ? { genre: idea.genre } : {}) });
    setPrefilled("landing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  // Bước này nút "Viết dàn ý" chỉ nằm trong form (không đăng ký lên thanh tiến trình) để không có hai nút cùng việc.
  const loaded = !!values && !!context;
  const missingText = !values?.topic.trim() || !values?.lesson.trim();
  const topicTooLong = (values?.topic.length ?? 0) > FREE_TEXT_MAX;
  const outOfQuota = !!quota && !quota.isUnlimited && (quota.remaining ?? 1) <= 0;
  const submitDisabled = !loaded || isBusy || missingText || topicTooLong || outOfQuota;
  const submitReason = !loaded ? "Đang tải cấu hình của bé…"
    : outOfQuota ? "Bạn đã dùng hết lượt tạo truyện của kỳ này."
    : missingText ? "Hãy nhập ý tưởng và bài học trước."
    : topicTooLong ? `Ý tưởng tối đa ${FREE_TEXT_MAX} ký tự.` : null;
  const formRef = useRiseIn<HTMLFormElement>(".kv, .field, button[type=submit], .btn-p", [!!values && !!context], { delay: 50 });

  if (!values || !context) {
    return <div className="pb"><p className="sub">{errorMessage ?? "Đang tải cấu hình tạo truyện của bé…"}</p></div>;
  }
  const max = Math.min(context.maximumLength, 5000);
  const presets = lengthPresets(max, context.readingLevel, context.recommendedTargetLength);
  const preset = LENGTHS.find(([k]) => presets[k] === values.targetLength)?.[0] ?? null;
  const pii = piiMessage(detectPii([values.topic, values.charactersText, values.setting, values.lesson].join("\n"), context.childNickname));
  const tone = vocabularyTone(values.vocabularyLevel, context.defaultVocabularyLevel);
  const copyright = copyrightHits([values.topic, values.charactersText, values.setting, values.lesson].join("\n"));
  const modes = outputModesOf(context);

  // Ô nhập tự do + ô "Gợi ý" xổ xuống bên cạnh để chọn nhanh (chọn xong ô gợi ý tự trở về trống).
  const text = (k: TextKey, label: string, placeholder: string, opts: { required?: boolean; hint?: string; suggestions?: string[]; onPick?: (v: string) => void } = {}) => (
    <div className="field">
      <label className="lbl row" htmlFor={`brief-${k}`} style={{ justifyContent: "space-between" }}>{label}<em className="count">{values[k].length}/{FREE_TEXT_MAX}</em></label>
      <div className="brief-combo">
        <input id={`brief-${k}`} name={k} autoComplete="off" className="inp" disabled={locked} required={opts.required} maxLength={FREE_TEXT_MAX} value={values[k]} placeholder={placeholder}
          onChange={(e) => updateValues({ [k]: e.target.value } as Partial<AIStoryInputFormValues>)} />
        {!locked && !!opts.suggestions?.length && (
          <select className="inp brief-suggest" aria-label={`Gợi ý ${label.toLowerCase()}`} value="" onChange={(e) => e.target.value && opts.onPick?.(e.target.value)}>
            <option value="" disabled>Gợi ý…</option>
            {opts.suggestions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
      {opts.hint && <small className="hint">{opts.hint}</small>}
    </div>
  );

  return (
    <form ref={formRef} className="pb brief" onSubmit={(e) => { e.preventDefault(); if (!submitDisabled) void submit(); }}>
      <div className="brief-head">
        <h3 className="display">{locked ? "Yêu cầu đã gửi" : `Truyện mới cho ${context.childNickname}`}</h3>
        <span className="brief-tag" title="Lấy từ hồ sơ của bé, đổi trong Cài đặt an toàn"><Lock aria-hidden />{context.ageBand.replace("Age_", "").replace("_", "–")} tuổi</span>
        <span className="brief-tag" title="Lấy từ hồ sơ của bé, đổi trong Cài đặt an toàn"><Lock aria-hidden />Mức đọc {context.readingLevel}</span>
        <p className="sub">AI chỉ viết trong khuôn khổ chính sách an toàn của {context.childNickname}, và không trò chuyện tự do với bé.</p>
      </div>

      {prefilled && <div className="notice ok">{prefilled === "wish" ? `Đã điền sẵn từ điều ước của ${context.childNickname}.` : prefilled === "landing" ? "Đã điền sẵn ý tưởng bạn nhập ở trang giới thiệu." : `Đã điền sẵn chủ đề gợi ý cho ${context.childNickname}.`} Bạn có thể chỉnh trước khi tạo.</div>}

      <div className="brief-flow">
          <fieldset className="brief-group">
            <legend className="display">Câu chuyện về điều gì?</legend>
            <div className="field">
              <label className="lbl row" htmlFor="brief-topic" style={{ justifyContent: "space-between" }}>Ý tưởng câu chuyện<em className={`count${topicTooLong ? " warn" : ""}`}>{values.topic.length}/{FREE_TEXT_MAX}</em></label>
              <textarea id="brief-topic" name="topic" className="inp brief-topic" rows={4} disabled={locked} required value={values.topic} onChange={(e) => updateValues({ topic: e.target.value })} placeholder="Ví dụ: Rùa Bông mang đèn lồng đến hội Trung thu…" />
            </div>
            {text("lesson", "Bài học muốn gửi tới con", "Ví dụ: Biết chia sẻ cùng bạn bè…", {
              required: true,
              suggestions: LESSONS,
              onPick: (l) => updateValues({ lesson: l }),
            })}
          </fieldset>

          <fieldset className="brief-group">
            <legend className="display">Thêm chi tiết <small>không bắt buộc, để trống thì AI tự nghĩ</small></legend>
            <div className="field">
              <label className="lbl" htmlFor="brief-genre">Thể loại</label>
              <select id="brief-genre" name="genre" className="inp" disabled={locked} value={values.genre} onChange={(e) => updateValues({ genre: e.target.value })}>
                <option value="">Để AI chọn</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                {!!values.genre && !GENRES.includes(values.genre) && <option value={values.genre}>{values.genre}</option>}
              </select>
            </div>
            {text("charactersText", "Nhân vật", "Ví dụ: Sóc Bông, Thỏ Trắng…", {
              hint: "Nhiều nhân vật thì cách nhau bằng dấu phẩy.",
            })}
            {text("setting", "Bối cảnh", "Ví dụ: Khu rừng tre ven hồ sen…")}
          </fieldset>

          {copyright.length > 0 && (
            <div className="notice err" role="status"><CircleAlert className="ic" /> “{copyright.join(", ")}” là nhân vật có bản quyền. AI sẽ không tái tạo nhân vật này — hãy dùng nhân vật của riêng bạn, ví dụ “chú mèo máy” thay cho tên cụ thể.</div>
          )}
          {pii && <div className="notice warn" role="status"><ShieldAlert className="ic" />{pii}</div>}

        <fieldset className="brief-group">
          <legend className="display">Tuỳ chọn truyện</legend>
          <div className="field">
            <span className="lbl row" style={{ justifyContent: "space-between" }}><span id="brief-length">Độ dài</span><b style={{ color: "var(--text)" }}>khoảng {values.targetLength} tiếng</b></span>
            <div className="seg" role="group" aria-labelledby="brief-length">{LENGTHS.map(([k, label]) => (
              <button type="button" key={k} disabled={locked} aria-pressed={preset === k} className={preset === k ? "on" : ""} onClick={() => updateValues({ targetLength: presets[k] })}>{label}<small>{presets[k]}</small></button>
            ))}</div>
            <input type="range" className="range" disabled={locked} min={MIN_TARGET_LENGTH} max={max} step={10} value={clampTargetLength(values.targetLength, max)} onChange={(e) => updateValues({ targetLength: +e.target.value })} aria-label="Chỉnh độ dài chi tiết" />
            <small className="hint">{context.recommendedTargetLength ? `Mức vừa theo đề xuất máy chủ: ${presets.medium} tiếng` : `Ngắn / Vừa / Dài theo mức đọc ${context.readingLevel} của bé`}; tối đa {max} tiếng theo cài đặt an toàn.</small>
          </div>

          {context.availableVocabularyLevels.length > 1 && (
            <div className="field">
              <label className="lbl" htmlFor="brief-vocab">Mức từ vựng</label>
              <select id="brief-vocab" name="vocabularyLevel" className="inp" disabled={locked} value={values.vocabularyLevel} onChange={(e) => updateValues({ vocabularyLevel: e.target.value as typeof values.vocabularyLevel })}>
                {context.availableVocabularyLevels.map((v) => (
                  <option key={v} value={v}>
                    {v.replace("level_", "Mức ")}: {TONE_LABEL[vocabularyTone(v, context.defaultVocabularyLevel)]}{v === context.defaultVocabularyLevel ? " (theo hồ sơ)" : ""}
                  </option>
                ))}
              </select>
              <small className="hint">{TONE_LABEL[tone]}: {TONE_HINT[tone]}</small>
            </div>
          )}

          {modes.length > 1 && (
            <div className="field"><span className="lbl" id="brief-mode">Kiểu truyện</span>
              <div className="seg" role="group" aria-labelledby="brief-mode">{modes.map((m) => (
                <button type="button" key={m} disabled={locked} aria-pressed={values.outputMode === m} className={values.outputMode === m ? "on" : ""} onClick={() => updateValues({ outputMode: m })}>{OUTPUT_MODE[m].label}</button>
              ))}</div>
              <small className="hint">{OUTPUT_MODE[values.outputMode].hint}</small>
            </div>
          )}
        </fieldset>

          {!locked && (
            <div className="brief-submit">
              {topicTooLong && <div className="notice err" role="alert">Ý tưởng tối đa {FREE_TEXT_MAX} ký tự.</div>}
              {errorMessage && <div className="notice err" role="alert">{errorMessage}</div>}
              {outOfQuota && <div className="notice err" role="alert">Bạn đã dùng hết lượt tạo truyện của kỳ này.</div>}
              <button type="submit" className="btn btn-p brief-go" disabled={submitDisabled} aria-describedby="brief-go-why">
                <Sparkles className="ic" aria-hidden />{isBusy ? "Đang gửi ý tưởng…" : "Viết dàn ý"}
              </button>
              <div className="brief-submit-info">
                <span id="brief-go-why" className={submitReason ? "brief-why" : "hint"}>
                  {submitReason && <CircleAlert aria-hidden />}{submitReason ?? "AI viết dàn ý trước để bạn duyệt, rồi mới viết truyện."}
                </span>
                {quota && !quota.isUnlimited && (
                  <small className="hint">Còn <b>{quota.remaining ?? 0}</b>/{quota.quotaLimit ?? "?"} lượt tạo truyện · mỗi truyện có 3 lần sửa bằng AI miễn phí</small>
                )}
              </div>
            </div>
          )}
      </div>
    </form>
  );
}
