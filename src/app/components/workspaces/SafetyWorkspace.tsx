"use client";

import { useEffect, useState } from "react";
import { Clock, Inbox, ShieldCheck } from "lucide-react";
import { childProfileService } from "../../services/childProfileService";
import type { ContentCategory, SafetyPolicy, SetSafetyPolicyRequest } from "../../types/childProfile";
import { useWorkspaceData } from "../shell/WorkspaceData";
import { useRiseIn } from "../../utils/motion";

type Rule = "Allowed" | "Restricted" | "Blocked";
const RULES: { id: Rule; label: string }[] = [
  { id: "Allowed", label: "Cho phép" },
  { id: "Restricted", label: "Hạn chế" },
  { id: "Blocked", label: "Chặn" },
];
const MODES: { id: SetSafetyPolicyRequest["requiredApprovalMode"]; b: string; s: string }[] = [
  { id: "AlwaysManual", b: "Luôn cần duyệt", s: "Mọi truyện AI tạo đều vào hàng chờ. Khuyên dùng cho trẻ nhỏ." },
  { id: "AutoPublishOnThreshold", b: "Tự duyệt khi đạt ngưỡng an toàn", s: "Truyện đạt điểm an toàn và độ khó theo chính sách được giao ngay, truyện còn lại vào hàng chờ." },
];
const NAV = [
  { id: "s-mode", label: "Chế độ duyệt", icon: Inbox },
  { id: "s-topic", label: "Chủ đề", icon: ShieldCheck },
  { id: "s-limit", label: "Giới hạn và quyền", icon: Clock },
];

export default function SafetyWorkspace() {
  const { child } = useWorkspaceData();
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [policy, setPolicy] = useState<SafetyPolicy | null>(null);
  const [mode, setMode] = useState<SetSafetyPolicyRequest["requiredApprovalMode"]>("AlwaysManual");
  const [rules, setRules] = useState<Record<number, Rule>>({});
  const [len, setLen] = useState(800);
  const [gate, setGate] = useState(true);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const bodyRef = useRiseIn<HTMLDivElement>("section", [child?.id, loading], { delay: 70 });
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!child) return;
    let alive = true;
    setLoading(true);
    setNote(null);
    void Promise.all([childProfileService.getContentCategories(), childProfileService.getSafetyPolicy(child.id)]).then(([c, p]) => {
      if (!alive) return;
      setCats((c.data ?? []).filter((x) => x.isActive));
      const pol = p.data;
      setPolicy(pol);
      if (pol) {
        setMode(pol.requiredApprovalMode === "AutoPublishOnThreshold" ? "AutoPublishOnThreshold" : "AlwaysManual");
        setLen(pol.maxStoryLength);
        setGate(pol.parentalGateEnabled);
        setConsent(pol.consentRecorded);
        setRules(Object.fromEntries(pol.categories.map((x) => [x.contentCategoryId, x.rule as Rule])));
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [child]);

  if (!child) return <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}><div className="pane"><div className="empty"><b className="display">Chưa có hồ sơ bé</b></div></div></section>;

  const ruleOf = (id: number): Rule => rules[id] ?? "Allowed";
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const save = async () => {
    setSaving(true);
    setNote(null);
    const res = await childProfileService.setSafetyPolicy(child.id, {
      maxStoryLength: len,
      requiredApprovalMode: mode,
      parentalGateEnabled: gate,
      consentRecorded: consent,
      categories: cats.map((c) => ({ contentCategoryId: c.id, rule: ruleOf(c.id) })),
    });
    setSaving(false);
    setNote({ ok: res.success, text: res.success ? "Đã lưu cài đặt an toàn." : res.message });
  };

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "230px 1fr" }}>
      <div className="pane">
        <div className="ph"><span>Cài đặt an toàn</span></div>
        <div className="pb setnav" style={{ gap: 2 }}>
          {NAV.map((n) => <button key={n.id} onClick={() => jump(n.id)}><n.icon className="ic" />{n.label}</button>)}
          <button className="btn btn-p btn-c" style={{ marginTop: 12 }} disabled={saving || loading} onClick={() => void save()}>{saving ? "Đang lưu…" : "Lưu cài đặt"}</button>
          {note && <div className={`login-msg ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
        </div>
      </div>

      <div ref={bodyRef} className="setbody">
        {loading ? <p className="sub">Đang tải chính sách của {child.nickname}…</p> : (
          <>
            {!policy && <div className="login-msg err">{child.nickname} chưa có chính sách an toàn. Lưu cài đặt bên dưới để tạo chính sách.</div>}
            <section id="s-mode">
              <h2 className="display">Chế độ duyệt</h2>
              <p className="sub" style={{ marginBottom: 10 }}>Áp dụng cho mọi truyện AI tạo cho {child.nickname}</p>
              <div className="sec" style={{ gap: 7 }}>
                {MODES.map((m) => (
                  <label key={m.id} className={`opt${mode === m.id ? " on" : ""}`}>
                    <input type="radio" name="mode" checked={mode === m.id} onChange={() => setMode(m.id)} />
                    <span><b>{m.b}</b><small>{m.s}</small></span>
                  </label>
                ))}
              </div>
            </section>

            <section id="s-topic">
              <h2 className="display">Chủ đề</h2>
              <p className="sub" style={{ marginBottom: 10 }}>Chọn mức cho từng nhóm nội dung. AI sẽ từ chối nhóm bị chặn.</p>
              {cats.length === 0 && <p className="sub">Chưa tải được danh sách chủ đề.</p>}
              {cats.map((c) => (
                <div key={c.id} className="trow">
                  <span>{c.displayName}</span>
                  <div className="seg" style={{ minWidth: 230 }}>
                    {RULES.map((r) => <button key={r.id} className={ruleOf(c.id) === r.id ? "on" : ""} onClick={() => setRules({ ...rules, [c.id]: r.id })}>{r.label}</button>)}
                  </div>
                </div>
              ))}
            </section>

            <section id="s-limit">
              <h2 className="display">Giới hạn và quyền</h2>
              <div className="field" style={{ margin: "10px 0 2px" }}>
                <span className="lbl row" style={{ justifyContent: "space-between" }}>Độ dài tối đa của truyện <b style={{ color: "var(--text)" }}>{len} từ</b></span>
                <input type="range" className="range" min={100} max={5000} step={100} value={len} onChange={(e) => setLen(+e.target.value)} aria-label="Độ dài tối đa" />
              </div>
              <div className="trow"><span>Cổng xác nhận người lớn<small>Hỏi xác nhận trước khi bé thoát khỏi chế độ của bé</small></span>
                <button className={`tog${gate ? " on" : ""}`} role="switch" aria-checked={gate} aria-label="Cổng xác nhận người lớn" onClick={() => setGate(!gate)} /></div>
              <div className="trow"><span>Đã có sự đồng ý của phụ huynh<small>Bắt buộc để kích hoạt hồ sơ bé</small></span>
                <button className={`tog${consent ? " on" : ""}`} role="switch" aria-checked={consent} aria-label="Đồng ý của phụ huynh" onClick={() => setConsent(!consent)} /></div>
            </section>
          </>
        )}
      </div>
    </section>
  );
}
