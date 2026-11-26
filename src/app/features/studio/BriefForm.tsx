"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, CircleAlert, Lock, Search, ShieldAlert, Sparkles, X } from "lucide-react";
import InfoTip from "@/app/components/InfoTip";
import GenerationOptions from "./GenerationOptions";
import type { UseAIStoryInputFlowResult } from "@/app/features/story-workflow/useAIStoryInputFlow";
import { childProfileService } from "@/app/services/childProfileService";
import type { ContentCategory, TokenQuotaStatus } from "@/app/types/childProfile";
import { copyrightHits, genreGroupsFor, GENRES } from "@/app/lib/storyRules";
import { readingLevelInfo } from "@/app/lib/guardian";
import { STUDIO_PREFILL_KEY } from "@/app/features/learning/WishItem";
import { parentWishService } from "@/app/services/storyWishService";
import { takeLandingIdea } from "@/app/features/landing/landingIdea";
import {
  BRIEF_FIELDS, BRIEF_LIMITS, briefFieldErrors, briefFieldOfMessage, type BriefField, clampTargetLength, lengthPresets, MIN_TARGET_LENGTH, outputModesOf, restoreFormValues, vocabularyTone,
  type AIStoryInputFormValues, type LengthPreset,
} from "@/app/features/story-workflow/aiStoryInputFlowUtils";
import { OUTPUT_MODE } from "@/app/lib/storyRules";
import { detectPii, piiMessage } from "@/app/features/story-workflow/piiHints";
import { useRiseIn } from "@/app/lib/motion";

const LENGTHS: [LengthPreset, string][] = [["short", "Ngắn"], ["medium", "Vừa"], ["long", "Dài"]];
const TONE_LABEL = { familiar: "Quen thuộc", default: "Theo trình độ", extended: "Mở rộng" } as const;
const TONE_HINT = {
  familiar: "dùng từ bé đã quen, không thêm từ mới.",
  default: "thêm vài từ mới vừa sức bé.",
  extended: "thêm nhiều từ mới hơn, có giải nghĩa trong phần từ vựng.",
} as const;

type TextKey = "charactersText" | "setting" | "lesson";

/** Cuộn tới ô cần sửa và đặt con trỏ vào đó. */
function focusField(field: BriefField) {
  const el = document.getElementById(`brief-${field}`);
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
  el?.focus({ preventScroll: true });
}

/** Dòng lỗi ngay dưới ô; id dùng cho aria-describedby của ô. */
const FieldError = ({ field, message }: { field: BriefField; message?: string }) =>
  message ? <small id={`brief-${field}-err`} className="field-err" role="alert"><CircleAlert aria-hidden />{message}</small> : null;
const invalidProps = (field: BriefField, message?: string) =>
  message ? { "aria-invalid": true as const, "aria-describedby": `brief-${field}-err` } : {};
type GenreGroupItem = { id: string; label: string; names: string[] };

/** Bộ chọn thể loại/chủ đề gọn nhẹ thay thế dropdown native dài: hỗ trợ lọc theo nhóm và tìm nhanh. */
function GenrePicker({
  id, value, groups, fallbackGenres, disabled, onChange,
}: {
  id: string;
  value: string;
  groups: GenreGroupItem[];
  fallbackGenres: readonly string[];
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<string>(groups[0]?.id ?? "all");
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const effectiveGroups: GenreGroupItem[] = groups.length > 0
    ? groups
    : [{ id: "all", label: "Thể loại", names: [...fallbackGenres] }];
  const activeGroup = effectiveGroups.find((g) => g.id === tab) ?? effectiveGroups[0];
  const q = query.trim().toLowerCase();
  const visibleNames = q
    ? effectiveGroups.flatMap((g) => g.names).filter((n, i, a) => a.indexOf(n) === i && n.toLowerCase().includes(q))
    : activeGroup?.names ?? [];

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapRef} className="genre-picker">
      <div className="genre-trigger-row">
        <button
          id={id}
          type="button"
          className={`inp genre-trigger${open ? " open" : ""}`}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((o) => !o)}
        >
          <span className={value ? "genre-val" : "genre-ph"}>
            {value || "Chọn thể loại"}
          </span>
          <ChevronDown className="ic genre-chev" aria-hidden />
        </button>
      </div>

      {open && !disabled && (
        <div className="genre-pop" role="listbox" aria-label="Chọn thể loại hoặc chủ đề">
          <div className="genre-pop-top">
            <div className="genre-search">
              <Search className="ic" aria-hidden />
              <input
                type="text"
                className="genre-search-inp"
                placeholder="Tìm nhanh…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button type="button" aria-label="Xoá tìm kiếm" onClick={() => setQuery("")}><X size={13} /></button>
              )}
            </div>
          </div>

          {!q && effectiveGroups.length > 1 && (
            <div className="genre-tabs" role="tablist">
              {effectiveGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={g.id === activeGroup?.id}
                  className={`genre-tab${g.id === activeGroup?.id ? " on" : ""}`}
                  onClick={() => setTab(g.id)}
                >
                  <span>{g.label}</span>
                  <small>{g.names.length}</small>
                </button>
              ))}
            </div>
          )}

          <div className="genre-chips">
            {visibleNames.length === 0 ? (
              <p className="sub" style={{ margin: "4px 2px" }}>Không tìm thấy chủ đề phù hợp.</p>
            ) : (
              visibleNames.map((n) => {
                const selected = value === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`chip genre-chip${selected ? " on" : ""}`}
                    onClick={() => pick(n)}
                  >
                    {selected && <Check size={12} aria-hidden />}
                    {n}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Thể loại theo các chủ đề bé được phép (Cài đặt an toàn), chia nhóm; chưa tải được danh mục thì dùng danh sách dự phòng.
  const [cats, setCats] = useState<ContentCategory[]>([]);
  useEffect(() => {
    let alive = true;
    void childProfileService.getContentCategoriesCached().then((list) => { if (alive) setCats(list); });
    return () => { alive = false; };
  }, []);
  const genreGroups = context && cats.length > 0 ? genreGroupsFor(cats, context.allowedCategoryCodes, context.blockedCategoryCodes) : [];
  const genreNames = genreGroups.length > 0 ? genreGroups.flatMap((g) => g.names) : GENRES;

  // Phụ huynh chọn "Tạo truyện mới" cho điều ước của bé (Luồng 2 mục 3.5): điền sẵn từ các thẻ bé đã chọn.
  // Nguồn điền sẵn: điều ước của bé (Luồng 2 mục 3.5), gợi ý chủ đề của Luồng 6 Nhánh B,
  // hoặc ý tưởng khách gõ ở trang giới thiệu trước khi có tài khoản (chỉ khi form đang trống).
  const [prefilled, setPrefilled] = useState<"wish" | "recommendation" | "landing" | null>(null);
  const [wishLesson, setWishLesson] = useState(false);
  const [wishError, setWishError] = useState<string | null>(null);
  useEffect(() => {
    if (!context || locked) return;
    let p: { childId?: number; wishId?: number; source?: string; topic?: string; charactersText?: string; setting?: string; lesson?: string } | null = null;
    try {
      const raw = sessionStorage.getItem(STUDIO_PREFILL_KEY);
      p = raw ? JSON.parse(raw) : null;
    } catch { /* bỏ qua */ }
    if (p && p.childId === context.childProfileId) {
      try { sessionStorage.removeItem(STUDIO_PREFILL_KEY); } catch { /* bỏ qua */ }
      if (typeof p.wishId === "number") {
        // Điều ước của bé: backend điền sẵn form từ các thẻ bé chọn; gửi đi qua create-story của điều ước.
        const wishId = p.wishId;
        let alive = true;
        void parentWishService.generationForm(wishId).then((r) => {
          if (!alive) return;
          if (!r.success || !r.data) { setWishError(r.message); return; }
          const q = r.data.request;
          updateValues(restoreFormValues({
            topic: q.topic, genre: q.genre, lesson: q.lesson, charactersText: (q.characters ?? []).join(", "),
            setting: q.setting ?? "", vocabularyLevel: q.vocabularyLevel, targetLength: q.targetLength, outputMode: q.outputMode,
          }, context));
          flow.setWishId(wishId);
          setWishLesson(r.data.lessonLeftToParent);
          setPrefilled("wish");
        });
        return () => { alive = false; };
      }
      updateValues({ topic: p.topic ?? "", charactersText: p.charactersText ?? "", setting: p.setting ?? "", ...(p.lesson ? { lesson: p.lesson } : {}) });
      setPrefilled(p.source === "recommendation" ? "recommendation" : "wish");
      return;
    }
    if (values?.topic.trim()) return;
    const idea = takeLandingIdea();
    if (!idea) return;
    updateValues({ topic: idea.topic, ...(idea.genre ? { genre: idea.genre } : {}) });
    setPrefilled("landing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  // Bước này nút "Viết dàn ý" chỉ nằm trong form (không đăng ký lên thanh tiến trình) để không có hai nút cùng việc.
  const loaded = !!values && !!context;
  const missingText = !values?.topic.trim() || !values?.lesson.trim() || !values?.genre.trim();
  const outOfQuota = !!quota && !quota.isUnlimited && (quota.remaining ?? 1) <= 0;

  // Lỗi hiện ngay dưới từng ô. Quá dài báo ngay (kể cả nội dung điền sẵn); ô bắt buộc trống chỉ báo sau khi bấm gửi.
  const [submitted, setSubmitted] = useState(false);
  // Lỗi server gắn được vào một ô: chỉ hiện ở ô đó cho tới khi phụ huynh sửa giá trị đã gửi.
  const [serverErr, setServerErr] = useState<{ field: BriefField; message: string; value: string } | null>(null);
  useEffect(() => {
    const field = briefFieldOfMessage(errorMessage);
    if (!field || !errorMessage || !values) { setServerErr(null); return; }
    setServerErr({ field, message: errorMessage, value: values[field] });
    focusField(field);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage]);
  const blocking = values ? briefFieldErrors(values, true) : {};
  const serverField = serverErr && values && values[serverErr.field] === serverErr.value ? serverErr : null;
  const fieldErrors: Partial<Record<BriefField, string>> = {
    ...(serverField ? { [serverField.field]: serverField.message } : {}),
    ...(values ? briefFieldErrors(values, submitted) : {}),
  };
  const invalidCount = Object.keys(fieldErrors).length;

  const submitDisabled = !loaded || isBusy || outOfQuota;
  const submitReason = !loaded ? "Đang tải cấu hình của bé…"
    : outOfQuota ? "Bạn đã hết lượt tạo truyện AI."
    : invalidCount > 0 ? `Còn ${invalidCount} ô cần sửa (đánh dấu đỏ).`
    : missingText ? "Hãy nhập ý tưởng, bài học và chọn thể loại trước." : null;
  const onSubmit = () => {
    if (submitDisabled) return;
    const first = BRIEF_FIELDS.find((k) => blocking[k]);
    if (first) { setSubmitted(true); focusField(first); return; }
    void submit();
  };
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
  const levelMeta = readingLevelInfo(context.readingLevel);

  // Ô nhập tự do + ô "Gợi ý" xổ xuống bên cạnh để chọn nhanh (chọn xong ô gợi ý tự trở về trống).
  const text = (k: TextKey, label: string, placeholder: string, opts: { required?: boolean; hint?: string; suggestions?: string[]; onPick?: (v: string) => void } = {}) => {
    const field = k === "charactersText" ? null : k;
    const error = field ? fieldErrors[field] : undefined;
    return (
    <div className="field">
      <label className="lbl" htmlFor={`brief-${k}`}>{label}</label>
      <div className="brief-combo">
        <input id={`brief-${k}`} name={k} autoComplete="off" className="inp" disabled={locked} required={opts.required} value={values[k]} placeholder={placeholder}
          maxLength={field ? BRIEF_LIMITS[field] : undefined} {...(field ? invalidProps(field, error) : {})}
          onChange={(e) => updateValues({ [k]: e.target.value } as Partial<AIStoryInputFormValues>)} />
        {!locked && !!opts.suggestions?.length && (
          <select className="inp brief-suggest" aria-label={`Gợi ý ${label.toLowerCase()}`} value="" onChange={(e) => e.target.value && opts.onPick?.(e.target.value)}>
            <option value="" disabled>Gợi ý…</option>
            {opts.suggestions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
      {field && <FieldError field={field} message={error} />}
      {opts.hint && <small className="hint">{opts.hint}</small>}
    </div>
    );
  };

  return (
    <form ref={formRef} className="pb brief" noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="brief-head">
        <h3 className="display">{locked ? "Yêu cầu đã gửi" : `Truyện mới cho ${context.childNickname}`}</h3>
        <span className="brief-tag" title="Lấy từ hồ sơ của bé, đổi trong Cài đặt an toàn"><Lock aria-hidden />{context.ageBand.replace("Age_", "").replace("_", "–")} tuổi</span>
        <span className="brief-tag" title={levelMeta ? `${levelMeta.grade} — ${levelMeta.title}: câu thường ~${levelMeta.typicalWords} từ, ví dụ “${levelMeta.sample}”. Đổi trong Cài đặt an toàn` : "Lấy từ hồ sơ của bé, đổi trong Cài đặt an toàn"}>
          <Lock aria-hidden />Mức đọc {context.readingLevel}{levelMeta ? ` · Lớp ${levelMeta.level}` : ""}
        </span>
      </div>

      {prefilled && <div className="notice ok">{prefilled === "wish" ? `Đã điền sẵn từ điều ước của ${context.childNickname}.` : prefilled === "landing" ? "Đã điền sẵn ý tưởng bạn nhập ở trang giới thiệu." : `Đã điền sẵn chủ đề gợi ý cho ${context.childNickname}.`} Bạn có thể chỉnh trước khi tạo.</div>}
      {prefilled === "wish" && wishLesson && !locked && <div className="notice">{context.childNickname} để bố mẹ chọn bài học. Hãy điền bài học trước khi gửi.</div>}
      {wishError && <div className="notice err" role="alert">Không mở được điều ước: {wishError}</div>}

      <div className="brief-flow">
          <fieldset className="brief-group">
            <legend className="display">Câu chuyện về điều gì?</legend>
            <div className="field">
              <label className="lbl row" htmlFor="brief-topic" style={{ justifyContent: "space-between" }}>
                <span>Ý tưởng câu chuyện</span>
                <small className={values.topic.trim().length > BRIEF_LIMITS.topic ? "brief-count over" : "brief-count"} aria-live="polite">{values.topic.trim().length}/{BRIEF_LIMITS.topic}</small>
              </label>
              <textarea id="brief-topic" name="topic" className="inp brief-topic" rows={4} disabled={locked} required maxLength={BRIEF_LIMITS.topic} value={values.topic} onChange={(e) => updateValues({ topic: e.target.value })} placeholder="Ví dụ: Rùa Bông mang đèn lồng đến hội Trung thu…"
                {...invalidProps("topic", fieldErrors.topic)} />
              <FieldError field="topic" message={fieldErrors.topic} />
            </div>
            {text("lesson", "Bài học muốn gửi tới con", "Ví dụ: Biết chia sẻ cùng bạn bè…", {
              required: true,
            })}
            <div className="field">
              <label className="lbl" htmlFor="brief-genre">Thể loại hoặc chủ đề {genreGroups.length > 0 && <InfoTip text={`Chỉ gồm ${genreNames.length} chủ đề ${context?.childNickname ?? "bé"} được phép trong Cài đặt an toàn, chia theo nhóm.`} />}</label>
              <GenrePicker
                id="brief-genre"
                value={values.genre}
                groups={genreGroups}
                fallbackGenres={GENRES}
                disabled={locked}
                onChange={(genre) => updateValues({ genre })}
              />
              <FieldError field="genre" message={fieldErrors.genre} />
            </div>
          </fieldset>

          <fieldset className="brief-group">
            <legend className="display">Thêm chi tiết <span className="pill draft">Không bắt buộc</span> <InfoTip text="Để trống thì AI tự nghĩ." /></legend>
            {text("charactersText", "Nhân vật", "Ví dụ: Sóc Bông, Thỏ Trắng (cách nhau bằng dấu phẩy)")}
            {text("setting", "Bối cảnh", "Ví dụ: Khu rừng tre ven hồ sen…")}
          </fieldset>

          {copyright.length > 0 && (
            <div className="notice err" role="status"><CircleAlert className="ic" /> “{copyright.join(", ")}” là nhân vật có bản quyền. AI sẽ không tái tạo nhân vật này — hãy dùng nhân vật của riêng bạn, ví dụ “chú mèo máy” thay cho tên cụ thể.</div>
          )}
          {pii && <div className="notice warn" role="status"><ShieldAlert className="ic" />{pii}</div>}

        <fieldset className="brief-group">
          <legend className="display">Tuỳ chọn truyện</legend>
          <div className="field">
            <span className="lbl row" style={{ justifyContent: "space-between" }}><span id="brief-length">Độ dài <InfoTip text={`${context.recommendedTargetLength ? `Mức vừa theo đề xuất máy chủ: ${presets.medium} từ` : `Ngắn / Vừa / Dài theo mức đọc ${context.readingLevel} của bé`}; tối đa ${max} từ theo cài đặt an toàn.`} /></span><b style={{ color: "var(--text)" }}>khoảng {values.targetLength} từ</b></span>
            <div className="seg" role="group" aria-labelledby="brief-length">{LENGTHS.map(([k, label]) => (
              <button type="button" key={k} disabled={locked} aria-pressed={preset === k} className={preset === k ? "on" : ""} onClick={() => updateValues({ targetLength: presets[k] })}>{label}<small>{presets[k]}</small></button>
            ))}</div>
            <input type="range" className="range" disabled={locked} min={MIN_TARGET_LENGTH} max={max} step={10} value={clampTargetLength(values.targetLength, max)} onChange={(e) => updateValues({ targetLength: +e.target.value })} aria-label="Chỉnh độ dài chi tiết" />
          </div>

          {context.availableVocabularyLevels.length > 1 && (
            <div className="field">
              <label className="lbl" htmlFor="brief-vocab">Mức từ vựng <InfoTip text={`${TONE_LABEL[tone]}: ${TONE_HINT[tone]}`} /></label>
              <select id="brief-vocab" name="vocabularyLevel" className="inp" disabled={locked} value={values.vocabularyLevel} onChange={(e) => updateValues({ vocabularyLevel: e.target.value as typeof values.vocabularyLevel })}>
                {context.availableVocabularyLevels.map((v) => (
                  <option key={v} value={v}>
                    {v.replace("level_", "Mức ")}: {TONE_LABEL[vocabularyTone(v, context.defaultVocabularyLevel)]}{v === context.defaultVocabularyLevel ? " (theo hồ sơ)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modes.length > 1 && (
            <div className="field"><span className="lbl" id="brief-mode">Kiểu truyện <InfoTip text={OUTPUT_MODE[values.outputMode].hint} /></span>
              <div className="seg" role="group" aria-labelledby="brief-mode">{modes.map((m) => (
                <button type="button" key={m} disabled={locked} aria-pressed={values.outputMode === m} className={values.outputMode === m ? "on" : ""} onClick={() => updateValues({ outputMode: m })}>{OUTPUT_MODE[m].label}</button>
              ))}</div>
            </div>
          )}
          {flow.wishId === null && (
            <GenerationOptions mode={values.generationMode} quizCount={values.quizQuestionCount} hasQuiz={values.outputMode === "learning"} disabled={locked} onChange={updateValues} />
          )}
        </fieldset>

          {!locked && (
            <div className="brief-submit">
              {errorMessage && !serverField && <div className="notice err" role="alert">{errorMessage}</div>}
              {outOfQuota && <div className="notice err row" role="alert" data-inline-notice style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}><span>Bạn đã hết lượt tạo truyện AI. Nâng lên Gói Sáng tạo hoặc mua Add-on để tạo thêm.</span><Link className="btn btn-s" href="/app/account-payment">Nâng cấp gói</Link></div>}
              <button type="submit" className="btn btn-p brief-go" disabled={submitDisabled} aria-describedby={submitReason ? "brief-go-why" : undefined}>
                <Sparkles className="ic" aria-hidden />{isBusy ? "Đang gửi ý tưởng…" : "Viết dàn ý"}
              </button>
              <div className="brief-submit-info">
                {submitReason && <span id="brief-go-why" className="brief-why">
                  <CircleAlert aria-hidden />{submitReason}
                </span>}
                {quota && !quota.isUnlimited && (
                  <span className={`pill ${(quota.remaining ?? 0) <= 1 ? "brief-quota-low" : "draft"}`} title="Mỗi truyện có 3 lần sửa bằng AI miễn phí">Còn {quota.remaining ?? 0} lượt AI</span>
                )}
              </div>
            </div>
          )}
      </div>
    </form>
  );
}
