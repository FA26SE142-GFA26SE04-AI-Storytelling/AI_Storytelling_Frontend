"use client";

import { CircleAlert, Lock, ShieldAlert, Sparkles } from "lucide-react";
import InfoTip from "@/app/components/InfoTip";
import type * as B from "@/app/types/backendContracts";
import type { VocabularyLevel } from "@/app/types/aiStory";
import { copyrightHits, GENRES, OUTPUT_MODE } from "@/app/lib/storyRules";
import { READING_LEVELS, countWords, levelAboveAge, readingLevelInfo, storyLengthFor } from "@/app/lib/guardian";
import { clampTargetLength, lengthPresets, MIN_TARGET_LENGTH, vocabularyTone, type LengthPreset } from "@/app/features/story-workflow/aiStoryInputFlowUtils";
import { detectPii, piiMessage } from "@/app/features/story-workflow/piiHints";
import CreatorQuotaChip from "./CreatorQuotaChip";

const LENGTHS: [LengthPreset, string][] = [["short", "Ngắn"], ["medium", "Vừa"], ["long", "Dài"]];
const TONE_LABEL = { familiar: "Quen thuộc", default: "Theo trình độ", extended: "Mở rộng" } as const;
const TONE_HINT = {
  familiar: "dùng từ quen thuộc, giảm từ khó.",
  default: "thêm vài từ mới vừa sức với mức đọc đang chọn.",
  extended: "thêm nhiều từ mới hơn, có giải nghĩa trong phần từ vựng.",
} as const;

export type CreatorBriefValues = { topic: string; lesson: string; genre: string; charactersText: string; setting: string; targetLength: number; vocabularyLevel: string; outputMode: string };
type Props = {
  values: CreatorBriefValues;
  context: B.CreatorAIStoryInputContextDto | null;
  contextError: string;
  busy: boolean;
  ageBand: string;
  readingLevel: number;
  onAudience: (ageBand: string, readingLevel: number) => void;
  onChange: (patch: Partial<CreatorBriefValues>) => void;
  onSubmit: () => void;
  /** Mở trang Gói và lượt khi hết lượt AI. */
  onBuyCredits?: () => void;
};

/** Form ý tưởng cho Content Creator: cùng bố cục và kiểu chữ với form của phụ huynh trong Studio (xem studio/BriefForm). */
export default function CreatorBrief({ values, context, contextError, busy, ageBand, readingLevel, onAudience, onChange, onSubmit, onBuyCredits }: Props) {
  const loaded = !!context;
  const max = context ? Math.min(context.maximumLength, 5000) : 1000;
  const presets = lengthPresets(max, context?.readingLevel ?? 2, context?.recommendedTargetLength);
  const preset = LENGTHS.find(([k]) => presets[k] === values.targetLength)?.[0] ?? null;
  const missingText = !values.topic.trim() || !values.lesson.trim();
  const disabled = !loaded || busy || missingText;
  const reason = !loaded ? "Đang tải cấu hình tạo truyện…" : missingText ? "Hãy nhập ý tưởng và bài học trước." : null;
  const pii = piiMessage(detectPii([values.topic, values.charactersText, values.setting, values.lesson].join("\n"), ""));
  const copyright = copyrightHits([values.topic, values.charactersText, values.setting, values.lesson].join("\n"));
  const modes = (context?.availableOutputModes ?? []).filter((m): m is keyof typeof OUTPUT_MODE => m in OUTPUT_MODE);
  const levelMeta = readingLevelInfo(readingLevel);
  const defaultVocab = `level_${Math.min(5, Math.max(1, readingLevel))}` as VocabularyLevel;
  const vocabTone = vocabularyTone(values.vocabularyLevel as VocabularyLevel, defaultVocab);

  return (
    <form className="pb brief" onSubmit={(e) => { e.preventDefault(); if (!disabled) onSubmit(); }}>
      <div className="brief-head">
        <h3 className="display">Truyện mẫu mới</h3>
        <span className="brief-tag"><Lock aria-hidden />{ageBand.replace("-", "–")} tuổi</span>
        <span className="brief-tag" title={levelMeta ? `${levelMeta.grade} — ${levelMeta.title}: câu thường ~${levelMeta.typicalWords} từ, ví dụ “${levelMeta.sample}”` : undefined}>
          <Lock aria-hidden />Mức đọc {readingLevel}{levelMeta ? ` · Lớp ${levelMeta.level}` : ""}
        </span>
        <CreatorQuotaChip kind="ai" onBuy={onBuyCredits} />
      </div>
      {contextError && <div className="notice err" role="alert">{contextError}</div>}

      <div className="brief-flow">
        <fieldset className="brief-group">
          <legend className="display">Câu chuyện về điều gì?</legend>
          <div className="field">
            <label className="lbl" htmlFor="cbrief-topic">Ý tưởng câu chuyện</label>
            <textarea id="cbrief-topic" className="inp brief-topic" rows={4} required value={values.topic} onChange={(e) => onChange({ topic: e.target.value })} placeholder="Ví dụ: Rùa Bông mang đèn lồng đến hội Trung thu…" />
          </div>
          <div className="field">
            <label className="lbl" htmlFor="cbrief-lesson">Bài học muốn gửi tới các bé</label>
            <div className="brief-combo">
              <input id="cbrief-lesson" autoComplete="off" className="inp" required value={values.lesson} placeholder="Ví dụ: Biết chia sẻ cùng bạn bè…" onChange={(e) => onChange({ lesson: e.target.value })} />
            </div>
          </div>
        </fieldset>

        <fieldset className="brief-group">
          <legend className="display">Thêm chi tiết <small>không bắt buộc, để trống thì AI tự nghĩ</small></legend>
          <div className="field">
            <label className="lbl" htmlFor="cbrief-genre">Thể loại</label>
            <select id="cbrief-genre" className="inp" value={values.genre} onChange={(e) => onChange({ genre: e.target.value })}>
              <option value="">Để AI chọn</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              {!!values.genre && !GENRES.includes(values.genre) && <option value={values.genre}>{values.genre}</option>}
            </select>
          </div>
          <div className="field">
            <label className="lbl" htmlFor="cbrief-characters">Nhân vật</label>
            <input id="cbrief-characters" autoComplete="off" className="inp" value={values.charactersText} placeholder="Ví dụ: Sóc Bông, Thỏ Trắng…" onChange={(e) => onChange({ charactersText: e.target.value })} />
            <small className="hint">Nhiều nhân vật thì cách nhau bằng dấu phẩy. Để trống thì AI tự nghĩ.</small>
          </div>
          <div className="field">
            <label className="lbl" htmlFor="cbrief-setting">Bối cảnh</label>
            <input id="cbrief-setting" autoComplete="off" className="inp" value={values.setting} placeholder="Ví dụ: Khu rừng tre ven hồ sen…" onChange={(e) => onChange({ setting: e.target.value })} />
          </div>
        </fieldset>

        {copyright.length > 0 && <div className="notice err" role="status"><CircleAlert className="ic" /> “{copyright.join(", ")}” là nhân vật có bản quyền. AI sẽ không tái tạo nhân vật này, hãy dùng nhân vật của riêng bạn.</div>}
        {pii && <div className="notice warn" role="status"><ShieldAlert className="ic" />{pii}</div>}

        <fieldset className="brief-group">
          <legend className="display">Tuỳ chọn truyện</legend>
          <div className="field">
            <label className="lbl" htmlFor="cbrief-age">Độ tuổi</label>
            <select id="cbrief-age" className="inp" value={ageBand} onChange={(e) => onAudience(e.target.value, readingLevel)}>
              <option value="6-8">6–8 tuổi</option><option value="9-10">9–10 tuổi</option>
            </select>
          </div>
          <div className="field">
            <label className="lbl" htmlFor="cbrief-level">Mức đọc</label>
            <select id="cbrief-level" className="inp" value={readingLevel} onChange={(e) => onAudience(ageBand, Number(e.target.value))}>
              {READING_LEVELS.map((l) => (
                <option key={l.level} value={l.level}>{l.optionLabel}</option>
              ))}
            </select>
            {levelMeta && (
              <small className="hint">
                {levelMeta.grade} ({levelMeta.title}) · Câu thường khoảng {levelMeta.typicalWords} từ (trung bình tối đa {levelMeta.maxWords} từ/câu) · Ví dụ: “{levelMeta.sample}” ({countWords(levelMeta.sample)} từ).
              </small>
            )}
            {levelAboveAge(ageBand, readingLevel) && (
              <small className="hint" style={{ color: "var(--warning, #d97706)" }}>
                Lưu ý: Mức {readingLevel} tương đương lớp {readingLevel} (dành cho bé 6–8 tuổi đã tự đọc tốt; độ dài gợi ý khoảng {storyLengthFor(ageBand, readingLevel).target.toLocaleString("vi-VN")} từ và lượng học liệu tăng theo chuẩn 9–10 tuổi).
              </small>
            )}
          </div>
          <div className="field">
            <span className="lbl row" style={{ justifyContent: "space-between" }}><span id="cbrief-length">Độ dài</span><b style={{ color: "var(--text)" }}>khoảng {values.targetLength} tiếng</b></span>
            <div className="seg" role="group" aria-labelledby="cbrief-length">{LENGTHS.map(([k, label]) => (
              <button type="button" key={k} aria-pressed={preset === k} className={preset === k ? "on" : ""} onClick={() => onChange({ targetLength: presets[k] })}>{label}<small>{presets[k]}</small></button>
            ))}</div>
            <input type="range" className="range" min={MIN_TARGET_LENGTH} max={max} step={10} value={clampTargetLength(values.targetLength, max)} onChange={(e) => onChange({ targetLength: +e.target.value })} aria-label="Chỉnh độ dài chi tiết" />
            <small className="hint">Tối đa {max} tiếng theo cấu hình của máy chủ.</small>
          </div>

          {(context?.availableVocabularyLevels.length ?? 0) > 1 && (
            <div className="field">
              <label className="lbl" htmlFor="cbrief-vocab">Mức từ vựng <InfoTip text={`${TONE_LABEL[vocabTone]}: ${TONE_HINT[vocabTone]}`} /></label>
              <select id="cbrief-vocab" className="inp" value={values.vocabularyLevel} onChange={(e) => onChange({ vocabularyLevel: e.target.value })}>
                {context!.availableVocabularyLevels.map((v) => {
                  const t = vocabularyTone(v as VocabularyLevel, defaultVocab);
                  return (
                    <option key={v} value={v}>
                      {v.replace("level_", "Mức ")}: {TONE_LABEL[t]}{v === defaultVocab ? ` (khớp mức đọc ${readingLevel})` : ""}
                    </option>
                  );
                })}
              </select>
              <small className="hint">{TONE_LABEL[vocabTone]}: {TONE_HINT[vocabTone]}</small>
            </div>
          )}

          {modes.length > 1 && (
            <div className="field"><span className="lbl" id="cbrief-mode">Kiểu truyện</span>
              <div className="seg" role="group" aria-labelledby="cbrief-mode">{modes.map((m) => (
                <button type="button" key={m} aria-pressed={values.outputMode === m} className={values.outputMode === m ? "on" : ""} onClick={() => onChange({ outputMode: m })}>{OUTPUT_MODE[m].label}</button>
              ))}</div>
              {values.outputMode in OUTPUT_MODE && <small className="hint">{OUTPUT_MODE[values.outputMode as keyof typeof OUTPUT_MODE].hint}</small>}
            </div>
          )}
        </fieldset>

        <div className="brief-submit">
          <button type="submit" className="btn btn-p brief-go" disabled={disabled} aria-describedby="cbrief-go-why">
            <Sparkles className="ic" aria-hidden />{busy ? "Đang gửi ý tưởng…" : "Viết dàn ý"}
          </button>
          <div className="brief-submit-info">
            <span id="cbrief-go-why" className={reason ? "brief-why" : "hint"}>
              {reason && <CircleAlert aria-hidden />}{reason ?? "AI viết dàn ý trước để bạn duyệt, rồi mới viết truyện."}
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
