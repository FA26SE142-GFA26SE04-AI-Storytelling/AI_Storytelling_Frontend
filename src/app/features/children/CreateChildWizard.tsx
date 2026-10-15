"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { childProfileService } from "@/app/services/childProfileService";
import type { ContentCategory, PolicyRule } from "@/app/types/childProfile";
import { AGE_BANDS, CONSENT_VERSION, defaultReadingLevel, presetBlocked } from "@/app/lib/guardian";
import LearningForm, { learningRequest, type LearningValue } from "./LearningForm";
import { CategoryRules, ConsentBlock, rulesToRequest } from "./SafetyBlocks";

const STEPS = ["Thông tin bé", "Hồ sơ học tập", "An toàn và đồng ý", "Xác nhận"];

/** Bước 1.2 → 1.2b → 1.3 → 1.4 → 1.8: tạo hồ sơ bé và kích hoạt. */
export default function CreateChildWizard({ onDone, onCancel }: { onDone: (childId: number) => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [ageBand, setAgeBand] = useState<string>("Age_6_8");
  const [learning, setLearning] = useState<LearningValue>({ readingLevel: 1, comprehensionGoal: "", favorites: [], focus: [] });
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [rules, setRules] = useState<Record<number, PolicyRule | undefined>>({});
  const [gate, setGate] = useState(true);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Giữ id hồ sơ đã tạo để bấm lại không tạo trùng khi một bước sau bị lỗi.
  const [createdId, setCreatedId] = useState<number | null>(null);

  useEffect(() => {
    void childProfileService.getContentCategories().then((r) => setCats((r.data ?? []).filter((c) => c.isActive)));
  }, []);

  const pickAge = (id: string) => {
    setAgeBand(id);
    setLearning((l) => ({ ...l, readingLevel: defaultReadingLevel(id) }));
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
    try {
      let id = createdId;
      if (id === null) {
        const created = await childProfileService.createChildProfile({ nickname: nickname.trim(), ageBand });
        if (!created.success || !created.data) { setErr(created.message || "Không tạo được hồ sơ bé."); return; }
        id = created.data.id;
        setCreatedId(id);
      }
      const lp = await childProfileService.setLearningProfile(id, learningRequest(learning));
      if (!lp.success) { setErr(lp.message || "Không lưu được hồ sơ học tập."); return; }
      const sp = await childProfileService.setSafetyPolicy(id, {
        maxStoryLength: 2000, requiredApprovalMode: "AlwaysManual", parentalGateEnabled: gate,
        consentRecorded: consent, consentPolicyVersion: CONSENT_VERSION, categories: rulesToRequest(cats, rules),
      });
      if (!sp.success) { setErr(sp.message || "Không lưu được cài đặt an toàn."); return; }
      if (consent) {
        const act = await childProfileService.activateChildProfile(id);
        if (!act.success) { setErr(act.message || "Đã lưu hồ sơ nhưng chưa kích hoạt được."); return; }
      }
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
            <p className="sub">Taletale không hỏi họ tên đầy đủ, ngày sinh, trường học hay địa chỉ của bé. Bạn là người quản lý chính (Owner) của hồ sơ này.</p>
          </div>
        )}

        {step === 1 && <LearningForm value={learning} onChange={setLearning} />}

        {step === 2 && (
          <div className="sec" style={{ gap: 18 }}>
            <div>
              <h3 className="display" style={{ margin: "0 0 4px" }}>Chủ đề</h3>
              <p className="sub" style={{ marginBottom: 6 }}>Đã chọn sẵn các chủ đề nên chặn cho {AGE_BANDS.find((a) => a.id === ageBand)?.label}. Bạn có thể bỏ bớt hoặc thêm.</p>
              <CategoryRules cats={cats} rules={rules} onChange={setRules} />
            </div>
            <div className="trow"><span>Cổng xác nhận người lớn<small>Hỏi mật khẩu của bạn trước khi rời chế độ của bé</small></span>
              <button type="button" className={`tog${gate ? " on" : ""}`} role="switch" aria-checked={gate} aria-label="Cổng xác nhận người lớn" onClick={() => setGate(!gate)} /></div>
            <p className="sub">Mọi truyện AI tạo cho bé sẽ chờ bạn duyệt. Bạn có thể đổi trong Cài đặt an toàn.</p>
            <ConsentBlock checked={consent} onChange={setConsent} />
          </div>
        )}

        {step === 3 && (
          <div className="sec" style={{ gap: 12 }}>
            <div className="kv">
              <div><small>Biệt danh</small><b>{nickname}</b></div>
              <div><small>Nhóm tuổi</small><b>{AGE_BANDS.find((a) => a.id === ageBand)?.label}</b></div>
              <div><small>Mức đọc</small><b>Mức {learning.readingLevel}</b></div>
              <div><small>Chủ đề bị chặn</small><b>{Object.values(rules).filter((r) => r === "Blocked").length}</b></div>
            </div>
            {consent
              ? <div className="notice ok">Hồ sơ sẽ được kích hoạt ngay để bé bắt đầu đọc.</div>
              : <div className="notice err">Bạn chưa đồng ý ở bước trước. Hồ sơ sẽ được lưu ở trạng thái Nháp và chưa thể dùng cho đến khi bạn đồng ý.</div>}
          </div>
        )}

        {err && <div className="notice err" role="alert" style={{ marginTop: 12 }}>{err}</div>}
      </div>

      <div className="wizard-foot">
        <button type="button" className="btn btn-g" onClick={step === 0 ? onCancel : () => setStep(step - 1)} disabled={busy}><ArrowLeft className="ic" />{step === 0 ? "Hủy" : "Quay lại"}</button>
        <span className="grow" />
        {step < STEPS.length - 1
          ? <button type="button" className="btn btn-p" onClick={goNext}>Tiếp tục<ArrowRight className="ic" /></button>
          : <button type="button" className="btn btn-p" disabled={busy} onClick={() => void finish()}><Check className="ic" />{busy ? "Đang lưu…" : consent ? "Tạo và kích hoạt" : "Lưu bản nháp"}</button>}
      </div>
    </div>
  );
}
