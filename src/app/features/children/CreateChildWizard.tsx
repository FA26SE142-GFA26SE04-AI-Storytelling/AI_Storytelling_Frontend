"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lightbulb, RotateCcw, ShieldCheck, SkipForward, TriangleAlert, X } from "lucide-react";
import { confirmDialog } from "@/app/lib/confirm";
import InfoTip from "@/app/components/InfoTip";
import { useAuth } from "@/app/context/AuthContext";
import { childProfileService } from "@/app/services/childProfileService";
import { readingScheduleService } from "@/app/services/readingScheduleService";
import type { ContentCategory, PolicyRule } from "@/app/types/childProfile";
import { AGE_BANDS, AVATARS, CHILD_AGES, SCHOOL_GRADES, ageBandOfAge, avatarOf, LEVEL_MODE_STORY_CAP, MAX_STORY_LENGTH_RANGE, defaultReadingLevel, defaultReadingMode, presetBlocked, storyLengthAdvice, storyLengthFor, storyLengthUpperBound } from "@/app/lib/guardian";
import LearningForm, { learningFrom, learningRequest, type LearningValue } from "./LearningForm";
import { CategoryRules, ConsentBlock, keptPolicyFields, rulesToRequest } from "./SafetyBlocks";
import { readChildDraft, removeChildDraft, writeChildDraft, type TimeDraft } from "./childrenIntent";
import { scheduleFrom, scheduleRequest, sectionOfError } from "./readingScheduleForm";
import TimeHabitsSections, { type SectionError } from "./TimeHabitsSections";

const STEPS = ["Thông tin bé", "Hồ sơ học tập", "An toàn và đồng ý", "Thời gian & thói quen", "Xác nhận"];
const TIME_STEP = 3;

/** Bước 1.2 → 1.2b → 1.3 → Thời gian & thói quen (bỏ qua được) → 1.4 → 1.8: tạo hồ sơ bé và kích hoạt. */
export default function CreateChildWizard({ onDone, onCancel }: { onDone: (childId: number) => void; onCancel: () => void }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  // Tải lại trang giữa chừng: điền lại các ô từ bản nháp trong sessionStorage (trừ ô "Đồng ý").
  const [draft] = useState(() => (uid === null ? null : readChildDraft(uid, STEPS.length - 1)));
  const [step, setStep] = useState(draft?.step ?? 0);
  const [nickname, setNickname] = useState(draft?.nickname ?? "");
  const [ageBand, setAgeBand] = useState<string>(draft?.ageBand ?? "Age_6_8");
  // Tuổi cụ thể quyết định nhóm tuổi; lớp chỉ để chọn sẵn mức đọc (không lưu); ảnh đại diện lưu cùng lúc tạo hồ sơ.
  const [age, setAge] = useState<number | null>(draft?.age ?? null);
  const [grade, setGrade] = useState<number | null>(draft?.grade ?? null);
  const [avatarId, setAvatarId] = useState(draft?.avatarId ?? avatarOf(null).id);
  const [learning, setLearning] = useState<LearningValue>(() => draft?.learning ?? learningFrom(null, "Age_6_8"));
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [rules, setRules] = useState<Record<number, PolicyRule | undefined>>(draft?.rules ?? {});
  const [gate, setGate] = useState(draft?.gate ?? true);
  // Độ dài truyện: chưa kéo thì theo gợi ý của nhóm tuổi + mức đọc (đổi mức là đổi theo); kéo rồi thì giữ số phụ huynh chọn.
  const [customLen, setCustomLen] = useState<number | undefined>(draft?.maxLength);
  const suggestedLen = storyLengthFor(ageBand, learning.readingLevel).target;
  const maxLen = customLen ?? suggestedLen;
  // Chỉ cảnh báo khi phụ huynh tự kéo dài hơn mức phù hợp với tuổi và mức đọc của bé.
  const lenAdvice = customLen !== undefined ? storyLengthAdvice(ageBand, learning.readingLevel, maxLen) : null;
  const fmt = (n: number) => n.toLocaleString("vi-VN");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Backend từ chối tạo vì đã đủ số hồ sơ của gói (409): hiện tại chỗ, kèm lối ra.
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  // Giữ id hồ sơ đã tạo để bấm lại không tạo trùng khi một bước sau bị lỗi.
  const [createdId, setCreatedId] = useState<number | null>(draft?.createdId ?? null);
  // Thời gian & thói quen: điền sẵn gợi ý theo tuổi; phụ huynh chỉnh, hoặc bỏ qua để cài sau trong tab của bé.
  const [time, setTime] = useState<TimeDraft | null>(draft?.time ?? null);
  const [skipTime, setSkipTime] = useState(draft?.skipTime ?? false);
  const [timeLoadErr, setTimeLoadErr] = useState<string | null>(null);
  const [timeErr, setTimeErr] = useState<SectionError>(null);
  const [timeReload, setTimeReload] = useState(0);

  useEffect(() => {
    void childProfileService.getContentCategories().then((r) => setCats((r.data ?? []).filter((c) => c.isActive)));
  }, []);

  useEffect(() => {
    if (uid !== null) writeChildDraft(uid, {
      step, nickname, ageBand, learning, rules, gate, maxLength: customLen, createdId, time: time ?? undefined, skipTime,
      age: age ?? undefined, grade: grade ?? undefined, avatarId,
    });
  }, [uid, step, nickname, ageBand, learning, rules, gate, customLen, createdId, time, skipTime, age, grade, avatarId]);

  // Vào bước Thời gian: tải gợi ý theo nhóm tuổi (chưa có, hoặc đổi nhóm tuổi mà phụ huynh chưa chỉnh gì).
  const needSuggestion = step === TIME_STEP && (time === null || (!time.edited && time.ageBand !== ageBand));
  useEffect(() => {
    if (!needSuggestion) return;
    const ctrl = new AbortController();
    setTimeLoadErr(null);
    void readingScheduleService.suggest(ageBand, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      if (r.success && r.data) setTime({ ageBand, value: scheduleFrom(r.data), edited: false });
      else setTimeLoadErr(r.message || "Không tải được gợi ý thời gian & thói quen.");
    });
    return () => ctrl.abort();
  }, [needSuggestion, ageBand, timeReload]);

  const cancel = () => {
    if (uid !== null) removeChildDraft(uid);
    // Hồ sơ đã tạo trên server ở lần bấm trước thì mở hồ sơ đó (đang ở trạng thái Nháp) thay vì bỏ trắng.
    if (createdId !== null) onDone(createdId);
    else onCancel();
  };

  const askCancel = async () => {
    const touched = step > 0 || nickname.trim() !== "";
    if (touched) {
      const ok = await confirmDialog(createdId !== null
        ? "Dừng tạo hồ sơ? Hồ sơ đã được lưu ở trạng thái Nháp, bạn hoàn tất sau trong trang Hồ sơ bé."
        : "Bỏ hồ sơ đang tạo? Các thông tin đã điền sẽ bị xoá.");
      if (!ok) return;
    }
    cancel();
  };

  // Đổi tuổi sang nhóm tuổi khác: đặt lại chế độ đọc và mức đọc mặc định (mức đọc theo lớp nếu đã chọn lớp).
  const pickAge = (n: number) => {
    setAge(n);
    const band = ageBandOfAge(n);
    if (band === ageBand) return;
    setAgeBand(band);
    setLearning((l) => ({ ...l, readingLevel: grade ?? defaultReadingLevel(band), readingMode: defaultReadingMode(band) }));
  };

  // Bấm lại lớp đang chọn để bỏ chọn: mức đọc quay về mặc định của nhóm tuổi.
  const pickGrade = (g: number) => {
    const next = grade === g ? null : g;
    setGrade(next);
    setLearning((l) => ({ ...l, readingLevel: next ?? defaultReadingLevel(ageBand) }));
  };

  const goNext = () => {
    setErr(null);
    if (step === 0 && !nickname.trim()) { setErr("Hãy nhập biệt danh của bé."); return; }
    if (step === 0 && age === null) { setErr("Hãy chọn tuổi của bé."); return; }
    if (step === 1) {
      // Điền sẵn danh sách chặn theo nhóm tuổi khi lần đầu vào bước An toàn.
      setRules((cur) => (Object.keys(cur).length ? cur : Object.fromEntries(presetBlocked(cats, ageBand).map((id) => [id, "Blocked" as const]))));
    }
    if (step === TIME_STEP) {
      if (!time || needSuggestion) { setErr("Chưa tải được gợi ý. Bấm Thử lại hoặc Bỏ qua, cài sau."); return; }
      setSkipTime(false);
    }
    setStep((s) => s + 1);
  };

  const skipTimeStep = () => {
    setErr(null);
    setTimeErr(null);
    setSkipTime(true);
    setStep(TIME_STEP + 1);
  };

  const finish = async () => {
    setBusy(true);
    setErr(null);
    setLimitMsg(null);
    try {
      let id = createdId;
      if (id === null) {
        const created = await childProfileService.createChildProfile({ nickname: nickname.trim(), ageBand, age, avatarId });
        if (created.status === 409) { setLimitMsg(created.message || "Gói hiện tại đã đủ số hồ sơ bé."); return; }
        if (!created.success || !created.data) { setErr(created.message || "Không tạo được hồ sơ bé."); return; }
        id = created.data.id;
        setCreatedId(id);
      }
      const lp = await childProfileService.setLearningProfile(id, learningRequest(learning));
      if (!lp.success) { setErr(lp.message || "Không lưu được hồ sơ học tập."); return; }
      // Bỏ qua thì không lưu gì: tab Thời gian & thói quen của bé vẫn hiện gợi ý để cài sau.
      if (!skipTime && time) {
        const ts = await readingScheduleService.set(id, scheduleRequest(time.value));
        if (!ts.success) {
          // Quay lại bước Thời gian và báo lỗi đúng chỗ; hồ sơ đã tạo được giữ (createdId) nên bấm lại không tạo trùng.
          const text = ts.message || "Không lưu được cấu hình thời gian & thói quen.";
          setTimeErr({ section: sectionOfError(text), text });
          setStep(TIME_STEP);
          return;
        }
      }
      // Backend chỉ nhận cài đặt an toàn đầu tiên khi đã có đồng ý; chưa đồng ý thì giữ hồ sơ ở trạng thái Nháp.
      if (consent) {
        const sp = await childProfileService.setSafetyPolicy(id, {
          ...keptPolicyFields(null),
          // Trần tự suy ra: theo mức đọc (chưa tự chỉnh) thì phủ độ dài mặc định lớn nhất, tự chỉnh thì 110% số đã chọn.
          maxStoryLength: customLen !== undefined ? storyLengthUpperBound(maxLen) : LEVEL_MODE_STORY_CAP, storyLengthTarget: customLen ?? null, requiredApprovalMode: "AlwaysManual", parentalGateEnabled: gate, consentRecorded: true,
          storyWishesEnabled: true, allowInteractiveStories: true, applyAgePreset: false, categories: rulesToRequest(cats, rules),
        });
        if (!sp.success) { setErr(sp.message || "Không lưu được cài đặt an toàn."); return; }
        const act = await childProfileService.activateChildProfile(id);
        if (!act.success) { setErr(act.message || "Đã lưu hồ sơ nhưng chưa kích hoạt được."); return; }
      }
      if (uid !== null) removeChildDraft(uid);
      onDone(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wizard">
      <ol className="steps">
        {STEPS.map((s, i) => <li key={s} className={i === step ? "on" : i < step ? "done" : ""}><span>{i < step ? <Check size={12} /> : i + 1}</span>{s}</li>)}
      </ol>

      <div className="wizard-body">
        {step === 0 && (
          <div className="wiz-info">
            <div className="wiz-pane">
              <label className="field"><span className="lbl">Biệt danh của bé</span>
                <input className="inp" autoFocus maxLength={150} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ví dụ: Bé Na" />
                <small className="sub">Tên gọi ở nhà. Tránh dùng họ tên đầy đủ của bé.</small></label>
              <div className="field">
                <span className="lbl">Tuổi của bé</span>
                <div className="seg wiz-seg" role="radiogroup" aria-label="Tuổi của bé">
                  {CHILD_AGES.map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={age === n} className={age === n ? "on" : ""} onClick={() => pickAge(n)}>{n} tuổi</button>
                  ))}
                </div>
                {(() => {
                  const band = AGE_BANDS.find((a) => a.id === ageBand);
                  return age !== null && band
                    ? <small className="sub">Nhóm {band.label}: {band.hint.toLowerCase()}. Truyện, mức đọc và chủ đề chặn sẵn theo nhóm này.</small>
                    : <small className="sub">Chỉ hỏi tuổi, không hỏi ngày sinh.</small>;
                })()}
              </div>
              <div className="field">
                <span className="lbl">Bé đang học lớp mấy? (không bắt buộc)</span>
                <div className="seg wiz-seg" role="radiogroup" aria-label="Lớp bé đang học">
                  {SCHOOL_GRADES.map((g) => (
                    <button key={g} type="button" role="radio" aria-checked={grade === g} className={grade === g ? "on" : ""} onClick={() => pickGrade(g)}>Lớp {g}</button>
                  ))}
                </div>
                <small className="sub">{grade === null
                  ? "Dùng để chọn sẵn mức đọc ở bước sau. Không lưu lớp, không hỏi tên trường."
                  : `Đã chọn sẵn mức đọc ${grade} ở bước sau (bấm lại để bỏ chọn).`}</small>
              </div>
              <p className="notice wiz-note"><ShieldCheck className="ic" aria-hidden />Taletale không hỏi họ tên, ngày sinh, trường học hay địa chỉ của bé.</p>
            </div>
            <div className="wiz-pane">
              <div className="field">
                <span className="lbl">Ảnh đại diện</span>
                <div className="avatars" role="radiogroup" aria-label="Ảnh đại diện của bé">
                  {AVATARS.map((a) => (
                    <button key={a.id} type="button" role="radio" aria-checked={avatarId === a.id} aria-label={a.label} className={`avatar${avatarId === a.id ? " on" : ""}`} onClick={() => setAvatarId(a.id)}>{a.emoji}</button>
                  ))}
                </div>
                <small className="sub">Bé nhận ra hồ sơ của mình qua ảnh này khi đăng nhập.</small>
              </div>
              {/* Xem trước thẻ hồ sơ như trong danh sách bé. */}
              <div className="wiz-kid-card" aria-label="Xem trước hồ sơ">
                <span className="wiz-kid-avatar" aria-hidden>{avatarOf(avatarId).emoji}</span>
                <span className="grow">
                  <b>{nickname.trim() || "Biệt danh của bé"}</b>
                  <small>{age !== null ? `${age} tuổi · ` : ""}{grade !== null ? `Lớp ${grade} · ` : ""}Mức đọc {learning.readingLevel}</small>
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && <LearningForm value={learning} onChange={setLearning} ageBand={ageBand} />}

        {step === 2 && (
          <div className="wiz-split wiz-safety">
            {/* Danh sách chủ đề dài: tự cuộn trong cột của nó để cả bước vừa một màn hình. */}
            <div className="wiz-pane wiz-pane-scroll">
              <h3 className="display" style={{ margin: "0 0 8px" }}>Chủ đề <InfoTip text={`Đã chọn sẵn các chủ đề nên chặn cho ${AGE_BANDS.find((a) => a.id === ageBand)?.label ?? "bé"}. Bạn có thể bỏ bớt hoặc thêm.`} /></h3>
              <CategoryRules cats={cats} rules={rules} onChange={setRules} />
            </div>
            <div className="wiz-pane">
            <div className="field">
              <span className="lbl row" style={{ justifyContent: "space-between" }}>Độ dài truyện <b style={{ color: "var(--text)" }}>{fmt(maxLen)} từ</b></span>
              <input type="range" className="range" min={MAX_STORY_LENGTH_RANGE.min} max={MAX_STORY_LENGTH_RANGE.max} step={MAX_STORY_LENGTH_RANGE.step}
                value={maxLen} onChange={(e) => setCustomLen(+e.target.value)} aria-label="Độ dài truyện" />
              <span className="row" style={{ gap: 8, flexWrap: "wrap", color: "var(--muted)" }}>
                <small>{customLen === undefined
                  ? `Theo mức đọc ${learning.readingLevel}: truyện khoảng ${fmt(suggestedLen)} từ. Kéo để chỉnh theo ý bạn.`
                  : `Gợi ý theo mức đọc ${learning.readingLevel}: khoảng ${fmt(suggestedLen)} từ.`}</small>
                {customLen !== undefined && customLen !== suggestedLen && (
                  <button type="button" className="btn btn-s" onClick={() => setCustomLen(undefined)}>Dùng gợi ý</button>
                )}
              </span>
              {maxLen < suggestedLen && (
                <p className="notice warn" data-inline-notice>Thấp hơn gợi ý: truyện AI tạo cho bé sẽ ngắn hơn, khoảng {fmt(maxLen)} từ.</p>
              )}
              {lenAdvice && (
                <p className="notice warn" data-inline-notice role="status"><TriangleAlert className="ic" aria-hidden /><span>{lenAdvice.text}</span></p>
              )}
            </div>
            <div className="trow"><span>Cổng xác nhận người lớn<small>Hỏi mật khẩu của bạn trước khi rời chế độ của bé</small></span>
              <button type="button" className={`tog${gate ? " on" : ""}`} role="switch" aria-checked={gate} aria-label="Cổng xác nhận người lớn" onClick={() => setGate(!gate)} /></div>
            <p className="notice wiz-note"><Check className="ic" aria-hidden />Truyện AI tạo cho bé sẽ chờ bạn duyệt (đổi được trong Cài đặt an toàn).</p>
            <ConsentBlock checked={consent} onChange={setConsent} />
            </div>
          </div>
        )}

        {step === TIME_STEP && (
          <div className="sec time-habits wiz-time">
            <div className="th-suggest-banner" role="status" data-inline-notice>
              <span className="th-suggest-ic" aria-hidden><Lightbulb className="ic" /></span>
              <div className="grow">
                <b>Gợi ý theo độ tuổi của {nickname.trim() || "bé"}</b>
                <p className="sub">Điều chỉnh nếu muốn, hoặc bấm “Bỏ qua, cài sau” để cài trong tab Thời gian &amp; thói quen của bé bất cứ lúc nào.</p>
              </div>
            </div>
            {timeLoadErr ? (
              <div className="sec" style={{ gap: 10 }}>
                <div className="notice err" role="alert" data-inline-notice>{timeLoadErr}</div>
                <button type="button" className="btn btn-s" style={{ width: "fit-content" }} onClick={() => setTimeReload((n) => n + 1)}><RotateCcw className="ic" />Thử lại</button>
              </div>
            ) : !time || needSuggestion ? (
              <p className="sub">Đang tải gợi ý thời gian &amp; thói quen…</p>
            ) : (
              <>
                <TimeHabitsSections
                  value={time.value}
                  onChange={(v) => { setTime({ ageBand: time.ageBand, value: v, edited: true }); setTimeErr(null); setErr(null); }}
                  disabled={busy}
                  habit={null}
                  savedGoalDays={null}
                  error={timeErr}
                />
                {timeErr?.section === "general" && <div className="notice err" role="alert" data-inline-notice>{timeErr.text}</div>}
              </>
            )}
          </div>
        )}

        {step === TIME_STEP + 1 && (
          <div className="sec wiz-narrow" style={{ gap: 12 }}>
            <div className="kv">
              <div><small>Biệt danh</small><b>{avatarOf(avatarId).emoji} {nickname}</b></div>
              <div><small>Tuổi</small><b>{age !== null ? `${age} tuổi (nhóm ${AGE_BANDS.find((a) => a.id === ageBand)?.label})` : AGE_BANDS.find((a) => a.id === ageBand)?.label}</b></div>
              <div><small>Mức đọc</small><b>Mức {learning.readingLevel}</b></div>
              <div><small>Độ dài truyện</small><b>{fmt(maxLen)} từ</b></div>
              <div><small>Chủ đề bị chặn</small><b>{Object.values(rules).filter((r) => r === "Blocked").length}</b></div>
              <div><small>Thời gian &amp; thói quen</small><b>{skipTime || !time ? "Cài sau" : "Đã thiết lập"}</b></div>
            </div>
            {(skipTime || !time) && <p className="notice wiz-note"><Lightbulb className="ic" aria-hidden />Bạn đã bỏ qua Thời gian &amp; thói quen. Có thể cài sau trong tab Thời gian &amp; thói quen của bé.</p>}
            {consent
              ? <div className="notice ok">Hồ sơ sẽ được kích hoạt ngay để bé bắt đầu đọc.</div>
              : <div className="notice err">Bạn chưa đồng ý ở bước trước. Hồ sơ sẽ được lưu ở trạng thái Nháp, chưa có cài đặt an toàn; hãy đồng ý trong Cài đặt an toàn để bé bắt đầu dùng.</div>}
          </div>
        )}

        {limitMsg && (
          <div className="notice err sec" role="alert" data-inline-notice style={{ marginTop: 12, gap: 10 }}>
            <span>{limitMsg} Các thông tin đã điền vẫn được giữ, nâng cấp xong bạn quay lại đây để tạo tiếp.</span>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <a className="btn btn-p" href="#account-payment">Nâng cấp gói</a>
              <button type="button" className="btn btn-g" onClick={() => void askCancel()}>Bỏ bản nháp</button>
            </div>
          </div>
        )}
        {err && <div className="notice err" role="alert" style={{ marginTop: 12 }}>{err}</div>}
      </div>

      <div className="wizard-foot">
        {step > 0 && <button type="button" className="btn btn-g" onClick={() => setStep(step - 1)} disabled={busy}><ArrowLeft className="ic" />Quay lại</button>}
        <button type="button" className="btn btn-g" onClick={() => void askCancel()} disabled={busy}><X className="ic" />Hủy</button>
        <span className="grow" />
        {step === TIME_STEP && <button type="button" className="btn btn-g" onClick={skipTimeStep} disabled={busy}><SkipForward className="ic" />Bỏ qua, cài sau</button>}
        {step < STEPS.length - 1
          ? <button type="button" className="btn btn-p" onClick={goNext}>{step === TIME_STEP ? "Dùng cấu hình này" : "Tiếp tục"}<ArrowRight className="ic" /></button>
          : <button type="button" className="btn btn-p" disabled={busy} onClick={() => void finish()}><Check className="ic" />{busy ? "Đang lưu…" : consent ? "Tạo và kích hoạt" : "Lưu bản nháp"}</button>}
      </div>
    </div>
  );
}
