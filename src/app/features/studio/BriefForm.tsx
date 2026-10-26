"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Lock, ShieldAlert } from "lucide-react";
import type { UseAIStoryInputFlowResult } from "@/app/features/story-workflow/useAIStoryInputFlow";
import { childProfileService } from "@/app/services/childProfileService";
import type { TokenQuotaStatus } from "@/app/types/childProfile";
import { copyrightHits, GENRES } from "@/app/lib/storyRules";
import { STUDIO_PREFILL_KEY } from "@/app/features/home/WishItem";
import {
  clampTargetLength, FREE_TEXT_MAX, lengthPresets, MIN_TARGET_LENGTH, outputModesOf, vocabularyTone,
  type AIStoryInputFormValues, type LengthPreset,
} from "@/app/features/story-workflow/aiStoryInputFlowUtils";
import { OUTPUT_MODE } from "@/app/lib/storyRules";
import { detectPii, piiMessage } from "@/app/features/story-workflow/piiHints";
import { useRegisterApprove } from "@/app/features/story-workflow/approveSlot";
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

/** Form ý tưởng hai cột: bên trái là nội dung truyện, bên phải là độ dài và từ vựng. */
export default function BriefForm({ flow, locked }: { flow: UseAIStoryInputFlowResult; locked: boolean }) {
  const { values, context, updateValues, submit, isBusy, errorMessage } = flow;
  const [quota, setQuota] = useState<TokenQuotaStatus | null>(null);

  useEffect(() => {
    if (!context) return;
    void childProfileService.getTokenQuotaForChild(context.childProfileId).then((r) => setQuota(r.success ? r.data : null));
  }, [context]);

  // Phụ huynh chọn "Tạo truyện mới" cho điều ước của bé (Luồng 2 mục 3.5): điền sẵn từ các thẻ bé đã chọn.
  // Nguồn điền sẵn: điều ước của bé (Luồng 2 mục 3.5) hoặc gợi ý chủ đề của Luồng 6 Nhánh B.
  const [prefilled, setPrefilled] = useState<"wish" | "recommendation" | null>(null);
  useEffect(() => {
    if (!context || locked) return;
    try {
      const raw = sessionStorage.getItem(STUDIO_PREFILL_KEY);
      const p = raw ? JSON.parse(raw) : null;
      if (!p || p.childId !== context.childProfileId) return;
      sessionStorage.removeItem(STUDIO_PREFILL_KEY);
      updateValues({ topic: p.topic, charactersText: p.charactersText, setting: p.setting ?? "", ...(p.lesson ? { lesson: p.lesson } : {}) });
      setPrefilled(p.source === "recommendation" ? "recommendation" : "wish");
    } catch { /* bỏ qua */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  // Nút "Viết dàn ý" nằm trên thanh tiến trình (cùng chỗ với các nút duyệt ở những bước sau).
  const loaded = !!values && !!context;
  const missingText = !values?.topic.trim() || !values?.lesson.trim();
  const topicTooLong = (values?.topic.length ?? 0) > FREE_TEXT_MAX;
  const outOfQuota = !!quota && !quota.isUnlimited && (quota.remaining ?? 1) <= 0;
  useRegisterApprove(!locked ? {
    label: "Viết dàn ý",
    icon: "sparkles",
    disabled: !loaded || isBusy || missingText || topicTooLong || outOfQuota,
    reason: !loaded ? "Đang tải cấu hình của bé…"
      : outOfQuota ? "Bạn đã dùng hết lượt tạo truyện của kỳ này."
      : missingText ? "Hãy nhập ý tưởng và bài học trước."
      : topicTooLong ? `Ý tưởng tối đa ${FREE_TEXT_MAX} ký tự.` : null,
    run: () => void submit(),
  } : null);
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

  const text = (k: TextKey, label: string, placeholder: string, required = false) => (
    <div className="field">
      <span className="lbl row" style={{ justifyContent: "space-between" }}>{label}<em className="count">{values[k].length}/{FREE_TEXT_MAX}</em></span>
      <input className="inp" aria-label={label} disabled={locked} required={required} maxLength={FREE_TEXT_MAX} value={values[k]} placeholder={placeholder}
        onChange={(e) => updateValues({ [k]: e.target.value } as Partial<AIStoryInputFormValues>)} />
    </div>
  );

  return (
    <form ref={formRef} className="pb brief" onSubmit={(e) => { e.preventDefault(); if (!topicTooLong && !outOfQuota) void submit(); }}>
      <div className="brief-head">
        <div className="grow">
          <h3 className="display">{locked ? "Yêu cầu đã gửi" : `Truyện mới cho ${context.childNickname}`}</h3>
          <p className="sub">AI chỉ viết trong khuôn khổ chính sách an toàn của {context.childNickname}, và không trò chuyện tự do với bé.</p>
        </div>
        <div className="kv locked" title="Lấy từ hồ sơ của bé, đổi trong Cài đặt an toàn">
          <div><small><Lock /> Độ tuổi</small><b>{context.ageBand.replace("Age_", "").replace("_", "–")}</b></div>
          <div><small><Lock /> Mức đọc</small><b>Mức {context.readingLevel}</b></div>
        </div>
      </div>

      {prefilled && <div className="notice ok">{prefilled === "wish" ? `Đã điền sẵn từ điều ước của ${context.childNickname}.` : `Đã điền sẵn chủ đề gợi ý cho ${context.childNickname}.`} Bạn có thể chỉnh trước khi tạo.</div>}

      <div className="brief-grid">
        <div className="brief-col">
          <label className="field"><span className="lbl row" style={{ justifyContent: "space-between" }}>Ý tưởng câu chuyện<em className={`count${topicTooLong ? " warn" : ""}`}>{values.topic.length}/{FREE_TEXT_MAX}</em></span>
            <textarea className="inp" rows={3} disabled={locked} required value={values.topic} onChange={(e) => updateValues({ topic: e.target.value })} placeholder="Ví dụ: Rùa Bông mang đèn lồng đến hội Trung thu" /></label>

          <div className="field"><span className="lbl">Thể loại</span>
            <div className="chips">{GENRES.map((g) => <button type="button" key={g} disabled={locked} className={`chip${values.genre === g ? " on" : ""}`} onClick={() => updateValues({ genre: g })}>{g}</button>)}</div></div>

          {text("charactersText", "Nhân vật (cách nhau bằng dấu phẩy; để trống để AI gợi ý)", "Sóc Bông, Thỏ Trắng", false)}
          {text("setting", "Bối cảnh (để trống để AI gợi ý)", "Khu rừng tre ven hồ sen", false)}
        </div>

        <div className="brief-col">
          <div className="field">
            {text("lesson", "Bài học", "Biết chia sẻ cùng bạn bè", true)}
            <div className="chips">{LESSONS.map((l) => <button type="button" key={l} disabled={locked} className={`chip sm${values.lesson === l ? " on" : ""}`} onClick={() => updateValues({ lesson: l })}>{l}</button>)}</div>
          </div>

          <div className="field">
            <span className="lbl row" style={{ justifyContent: "space-between" }}>Độ dài<b style={{ color: "var(--text)" }}>~{values.targetLength} tiếng</b></span>
            <div className="seg">{LENGTHS.map(([k, label]) => (
              <button type="button" key={k} disabled={locked} className={preset === k ? "on" : ""} onClick={() => updateValues({ targetLength: presets[k] })}>{label}<small>{presets[k]}</small></button>
            ))}</div>
            <input type="range" className="range" disabled={locked} min={MIN_TARGET_LENGTH} max={max} step={10} value={clampTargetLength(values.targetLength, max)} onChange={(e) => updateValues({ targetLength: +e.target.value })} aria-label="Độ dài mục tiêu" />
            <small className="hint">{context.recommendedTargetLength ? `Mức vừa theo đề xuất máy chủ: ${presets.medium} tiếng` : `Ngắn / Vừa / Dài theo mức đọc ${context.readingLevel} của bé`}; tối đa {max} tiếng theo cài đặt an toàn.</small>
          </div>

          {context.availableVocabularyLevels.length > 1 && (
            <div className="field"><span className="lbl">Từ vựng</span>
              <div className="seg">{context.availableVocabularyLevels.map((v) => (
                <button type="button" key={v} disabled={locked} className={values.vocabularyLevel === v ? "on" : ""} onClick={() => updateValues({ vocabularyLevel: v })}
                  title={TONE_LABEL[vocabularyTone(v, context.defaultVocabularyLevel)]}>
                  {v.replace("level_", "Mức ")}{v === context.defaultVocabularyLevel && <small>hồ sơ</small>}
                </button>
              ))}</div>
              <small className="hint">{TONE_LABEL[tone]}: {TONE_HINT[tone]}</small>
            </div>
          )}

          {modes.length > 1 && (
            <div className="field"><span className="lbl">Kiểu truyện</span>
              <div className="seg">{modes.map((m) => (
                <button type="button" key={m} disabled={locked} className={values.outputMode === m ? "on" : ""} onClick={() => updateValues({ outputMode: m })}>{OUTPUT_MODE[m].label}</button>
              ))}</div>
              <small className="hint">{OUTPUT_MODE[values.outputMode].hint}</small>
            </div>
          )}
        </div>
      </div>

      {copyright.length > 0 && (
        <div className="notice err" role="status"><CircleAlert className="ic" /> “{copyright.join(", ")}” là nhân vật có bản quyền. AI sẽ không tái tạo nhân vật này — hãy dùng nhân vật của riêng bạn, ví dụ “chú mèo máy” thay cho tên cụ thể.</div>
      )}
      {pii && <div className="notice warn" role="status"><ShieldAlert className="ic" />{pii}</div>}
      {topicTooLong && <div className="notice err" role="alert">Ý tưởng tối đa {FREE_TEXT_MAX} ký tự.</div>}
      {errorMessage && <div className="notice err" role="alert">{errorMessage}</div>}
      {quota && !quota.isUnlimited && (
        <p className="sub">Còn <b>{quota.remaining ?? 0}</b>/{quota.quotaLimit ?? "?"} lượt tạo truyện. Mỗi truyện mới dùng 1 lượt; mỗi truyện có 3 lần sửa bằng AI miễn phí.</p>
      )}
      {outOfQuota && <div className="notice err" role="alert">Bạn đã dùng hết lượt tạo truyện của kỳ này.</div>}
      {!locked && (
        <div className="brief-foot">
          <small className="hint">{isBusy ? "Đang gửi ý tưởng…" : "Điền xong thì bấm ✨ trên thanh tiến trình: AI viết dàn ý trước để bạn duyệt, rồi mới viết truyện."}</small>
        </div>
      )}
    </form>
  );
}
