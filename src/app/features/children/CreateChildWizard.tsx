"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, X } from "lucide-react";
import { confirmDialog } from "@/app/lib/confirm";
import InfoTip from "@/app/components/InfoTip";
import { useAuth } from "@/app/context/AuthContext";
import { childProfileService } from "@/app/services/childProfileService";
import type { ContentCategory, PolicyRule } from "@/app/types/childProfile";
import { AGE_BANDS, MAX_STORY_LENGTH_RANGE, defaultReadingLevel, defaultReadingMode, presetBlocked, storyLengthFor } from "@/app/lib/guardian";
import LearningForm, { learningFrom, learningRequest, type LearningValue } from "./LearningForm";
import { CategoryRules, ConsentBlock, keptPolicyFields, rulesToRequest } from "./SafetyBlocks";
import { readChildDraft, removeChildDraft, writeChildDraft } from "./childrenIntent";

const STEPS = ["Thông tin bé", "Hồ sơ học tập", "An toàn và đồng ý", "Xác nhận"];

/** Bước 1.2 → 1.2b → 1.3 → 1.4 → 1.8: tạo hồ sơ bé và kích hoạt. */
export default function CreateChildWizard({ onDone, onCancel }: { onDone: (childId: number) => void; onCancel: () => void }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  // Tải lại trang giữa chừng: điền lại các ô từ bản nháp trong sessionStorage (trừ ô "Đồng ý").
  const [draft] = useState(() => (uid === null ? null : readChildDraft(uid, STEPS.length - 1)));
  const [step, setStep] = useState(draft?.step ?? 0);
  const [nickname, setNickname] = useState(draft?.nickname ?? "");
  const [ageBand, setAgeBand] = useState<string>(draft?.ageBand ?? "Age_6_8");
  const [learning, setLearning] = useState<LearningValue>(() => draft?.learning ?? learningFrom(null, "Age_6_8"));
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [rules, setRules] = useState<Record<number, PolicyRule | undefined>>(draft?.rules ?? {});
  const [gate, setGate] = useState(draft?.gate ?? true);
  // Độ dài tối đa: chưa kéo thì theo gợi ý của nhóm tuổi + mức đọc (đổi mức là đổi theo); kéo rồi thì giữ số phụ huynh chọn.
  const [customLen, setCustomLen] = useState<number | undefined>(draft?.maxLength);
  const suggestedLen = storyLengthFor(ageBand, learning.readingLevel).target;
  const maxLen = customLen ?? suggestedLen;
  const fmt = (n: number) => n.toLocaleString("vi-VN");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Backend từ chối tạo vì đã đủ số hồ sơ của gói (409): hiện tại chỗ, kèm lối ra.
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  // Giữ id hồ sơ đã tạo để bấm lại không tạo trùng khi một bước sau bị lỗi.
  const [createdId, setCreatedId] = useState<number | null>(draft?.createdId ?? null);

  useEffect(() => {
    void childProfileService.getContentCategories().then((r) => setCats((r.data ?? []).filter((c) => c.isActive)));
  }, []);

  useEffect(() => {
    if (uid !== null) writeChildDraft(uid, { step, nickname, ageBand, learning, rules, gate, maxLength: customLen, createdId });
  }, [uid, step, nickname, ageBand, learning, rules, gate, customLen, createdId]);

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

  const pickAge = (id: string) => {
    setAgeBand(id);
    setLearning((l) => ({ ...l, readingLevel: defaultReadingLevel(id), readingMode: defaultReadingMode(id) }));
  };

  const goNext = () => {
    setErr(null);
    if (step === 0 && !nickname.trim()) { setErr("Hãy nhập biệt danh của bé."); return; }
    if (step === 1) {
      // Điền sẵn danh sách chặn theo nhóm tuổi khi lần đầu vào bước An toàn.
      setRules((cur) => (Object.keys(cur).length ? cur : Object.fromEntries(presetBlocked(cats, ageBand).map((id) => [id, "Blocked" as const]))));
    }
    setStep((s) => s + 1);
  };

  const finish = async () => {
    setBusy(true);
    setErr(null);
    setLimitMsg(null);
    try {
      let id = createdId;
      if (id === null) {
        const created = await childProfileService.createChildProfile({ nickname: nickname.trim(), ageBand });
        if (created.status === 409) { setLimitMsg(created.message || "Gói hiện tại đã đủ số hồ sơ bé."); return; }
        if (!created.success || !created.data) { setErr(created.message || "Không tạo được hồ sơ bé."); return; }
        id = created.data.id;
        setCreatedId(id);
      }
      const lp = await childProfileService.setLearningProfile(id, learningRequest(learning));
      if (!lp.success) { setErr(lp.message || "Không lưu được hồ sơ học tập."); return; }
      // Backend chỉ nhận cài đặt an toàn đầu tiên khi đã có đồng ý; chưa đồng ý thì giữ hồ sơ ở trạng thái Nháp.
      if (consent) {
        const sp = await childProfileService.setSafetyPolicy(id, {
          ...keptPolicyFields(null),
          maxStoryLength: maxLen, requiredApprovalMode: "AlwaysManual", parentalGateEnabled: gate, consentRecorded: true,
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
          <div className="sec" style={{ gap: 16 }}>
            <label className="field"><span className="lbl">Biệt danh của bé</span>
              <input className="inp" autoFocus maxLength={150} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ví dụ: Bé Na" /></label>
            <div className="field">
              <span className="lbl">Nhóm tuổi</span>
              <div className="sec" style={{ gap: 7 }}>
                {AGE_BANDS.map((a) => (
                  <label key={a.id} className={`opt${ageBand === a.id ? " on" : ""}`}>
                    <input type="radio" name="age" checked={ageBand === a.id} onChange={() => pickAge(a.id)} />
                    <span><b>{a.label}</b><small>{a.hint}</small></span>
                  </label>
                ))}
              </div>
            </div>
            <p className="notice wiz-note"><ShieldCheck className="ic" aria-hidden />Taletale không hỏi họ tên, ngày sinh, trường học hay địa chỉ của bé.</p>
          </div>
        )}

        {step === 1 && <LearningForm value={learning} onChange={setLearning} ageBand={ageBand} />}

        {step === 2 && (
          <div className="sec" style={{ gap: 18 }}>
            <div>
              <h3 className="display" style={{ margin: "0 0 8px" }}>Chủ đề <InfoTip text={`Đã chọn sẵn các chủ đề nên chặn cho ${AGE_BANDS.find((a) => a.id === ageBand)?.label ?? "bé"}. Bạn có thể bỏ bớt hoặc thêm.`} /></h3>
              <CategoryRules cats={cats} rules={rules} onChange={setRules} />
            </div>
            <div className="field">
              <span className="lbl row" style={{ justifyContent: "space-between" }}>Độ dài tối đa của truyện <b style={{ color: "var(--text)" }}>{fmt(maxLen)} từ</b></span>
              <input type="range" className="range" min={MAX_STORY_LENGTH_RANGE.min} max={MAX_STORY_LENGTH_RANGE.max} step={MAX_STORY_LENGTH_RANGE.step}
                value={maxLen} onChange={(e) => setCustomLen(+e.target.value)} aria-label="Độ dài tối đa của truyện" />
              <span className="row" style={{ gap: 8, flexWrap: "wrap", color: "var(--muted)" }}>
                <small>{customLen === undefined
                  ? `Theo mức đọc ${learning.readingLevel}: truyện khoảng ${fmt(suggestedLen)} từ. Kéo để chỉnh theo ý bạn.`
                  : `Gợi ý theo mức đọc ${learning.readingLevel}: khoảng ${fmt(suggestedLen)} từ.`}</small>
                {customLen !== undefined && customLen !== suggestedLen && (
                  <button type="button" className="btn btn-s" onClick={() => setCustomLen(undefined)}>Dùng gợi ý</button>
                )}
              </span>
              {maxLen < suggestedLen && (
                <p className="notice warn" data-inline-notice>Thấp hơn gợi ý: truyện AI tạo cho bé sẽ ngắn hơn, không quá {fmt(maxLen)} từ.</p>
              )}
            </div>
            <div className="trow"><span>Cổng xác nhận người lớn<small>Hỏi mật khẩu của bạn trước khi rời chế độ của bé</small></span>
              <button type="button" className={`tog${gate ? " on" : ""}`} role="switch" aria-checked={gate} aria-label="Cổng xác nhận người lớn" onClick={() => setGate(!gate)} /></div>
            <p className="notice wiz-note"><Check className="ic" aria-hidden />Truyện AI tạo cho bé sẽ chờ bạn duyệt (đổi được trong Cài đặt an toàn).</p>
            <ConsentBlock checked={consent} onChange={setConsent} />
          </div>
        )}

        {step === 3 && (
          <div className="sec" style={{ gap: 12 }}>
            <div className="kv">
              <div><small>Biệt danh</small><b>{nickname}</b></div>
              <div><small>Nhóm tuổi</small><b>{AGE_BANDS.find((a) => a.id === ageBand)?.label}</b></div>
              <div><small>Mức đọc</small><b>Mức {learning.readingLevel}</b></div>
              <div><small>Độ dài tối đa</small><b>{fmt(maxLen)} từ</b></div>
              <div><small>Chủ đề bị chặn</small><b>{Object.values(rules).filter((r) => r === "Blocked").length}</b></div>
            </div>
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
        {step < STEPS.length - 1
          ? <button type="button" className="btn btn-p" onClick={goNext}>Tiếp tục<ArrowRight className="ic" /></button>
          : <button type="button" className="btn btn-p" disabled={busy} onClick={() => void finish()}><Check className="ic" />{busy ? "Đang lưu…" : consent ? "Tạo và kích hoạt" : "Lưu bản nháp"}</button>}
      </div>
    </div>
  );
}
