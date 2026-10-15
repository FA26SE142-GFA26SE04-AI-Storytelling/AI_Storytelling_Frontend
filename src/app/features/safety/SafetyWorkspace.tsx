"use client";

import "./safety.css";
import "../children/children.css";
import { useEffect, useState } from "react";
import { Clock, FileCheck, Inbox, CirclePause, ShieldCheck } from "lucide-react";
import { childProfileService } from "@/app/services/childProfileService";
import type { ContentCategory, PolicyRule, SafetyPolicy, SetSafetyPolicyRequest } from "@/app/types/childProfile";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { useRiseIn } from "@/app/lib/motion";
import { CONSENT_VERSION, presetBlocked } from "@/app/lib/guardian";
import { CategoryRules, ConsentBlock, normalizeRule, rulesToRequest } from "@/app/features/children/SafetyBlocks";
import { useMyRole } from "@/app/features/children/useMyRole";

const MODES: { id: SetSafetyPolicyRequest["requiredApprovalMode"]; b: string; s: string }[] = [
  { id: "AlwaysManual", b: "Luôn cần duyệt", s: "Mọi truyện AI tạo đều vào hàng chờ. Khuyên dùng cho trẻ nhỏ." },
  { id: "AutoPublishOnThreshold", b: "Tự duyệt khi đạt ngưỡng an toàn", s: "Truyện đạt điểm an toàn và độ khó theo chính sách được giao ngay, truyện còn lại vào hàng chờ." },
];
const NAV = [
  { id: "s-mode", label: "Chế độ duyệt", icon: Inbox },
  { id: "s-topic", label: "Chủ đề", icon: ShieldCheck },
  { id: "s-limit", label: "Giới hạn và quyền", icon: Clock },
  { id: "s-hold", label: "Tạm dừng khi khó", icon: CirclePause },
  { id: "s-consent", label: "Đồng ý của phụ huynh", icon: FileCheck },
];

/** Luồng 1 Bước 1.4 — cài đặt an toàn của bé. */
export default function SafetyWorkspace() {
  const { child, reloadChildren } = useWorkspaceData();
  // Mặc định chỉ Owner sửa được; người giám sát khác cần quyền "Sửa cài đặt an toàn" (BR-1.8). Kiểm tra lại mỗi lần đổi bé.
  const role = useMyRole(child);
  const canEdit = !!role?.can("ManageSafetySettings");
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [policy, setPolicy] = useState<SafetyPolicy | null>(null);
  const [mode, setMode] = useState<SetSafetyPolicyRequest["requiredApprovalMode"]>("AlwaysManual");
  const [rules, setRules] = useState<Record<number, PolicyRule | undefined>>({});
  const [len, setLen] = useState(2000);
  const [gate, setGate] = useState(true);
  const [consent, setConsent] = useState(false);
  const [threshold, setThreshold] = useState(70);
  const [windowSize, setWindowSize] = useState(3);
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
      const active = (c.data ?? []).filter((x) => x.isActive);
      setCats(active);
      const pol = p.success ? p.data : null;
      setPolicy(pol);
      if (pol) {
        setMode(pol.requiredApprovalMode === "AutoPublishOnThreshold" ? "AutoPublishOnThreshold" : "AlwaysManual");
        setLen(pol.maxStoryLength);
        setGate(pol.parentalGateEnabled);
        // Điều khoản đổi phiên bản thì phụ huynh phải đồng ý lại.
        setConsent(pol.consentRecorded && (pol.consentPolicyVersion ?? CONSENT_VERSION) >= CONSENT_VERSION);
        setThreshold(Number(pol.comprehensionThresholdPercent ?? 70));
        setWindowSize(pol.comprehensionWindowSize ?? 3);
        setRules(Object.fromEntries(pol.categories.map((x) => [x.contentCategoryId, normalizeRule(x.rule)])));
      } else {
        setRules(Object.fromEntries(presetBlocked(active, child.ageBand).map((id) => [id, "Blocked" as const])));
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [child]);

  if (!child) return <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}><div className="pane"><div className="empty"><b className="display">Chưa có hồ sơ bé</b></div></div></section>;

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const save = async () => {
    setSaving(true);
    setNote(null);
    const res = await childProfileService.setSafetyPolicy(child.id, {
      maxStoryLength: len,
      requiredApprovalMode: mode,
      parentalGateEnabled: gate,
      consentRecorded: consent,
      consentPolicyVersion: CONSENT_VERSION,
      safetyScoreThreshold: policy?.safetyScoreThreshold ?? null,
      readabilityScoreThreshold: policy?.readabilityScoreThreshold ?? null,
      comprehensionThresholdPercent: threshold,
      comprehensionWindowSize: windowSize,
      categories: rulesToRequest(cats, rules),
    });
    setSaving(false);
    setNote({ ok: res.success, text: res.success ? "Đã lưu cài đặt an toàn." : res.message });
    if (res.success) {
      setPolicy((p) => p ?? ({ id: child.id } as SafetyPolicy));
      void reloadChildren(child.id);
    }
  };

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "230px 1fr" }}>
      <div className="pane">
        <div className="ph"><span>Cài đặt an toàn</span></div>
        <div className="pb setnav" style={{ gap: 2 }}>
          {NAV.map((n) => <button key={n.id} onClick={() => jump(n.id)}><n.icon className="ic" />{n.label}</button>)}
          {canEdit && <button className="btn btn-p btn-c" style={{ marginTop: 12 }} disabled={saving || loading} onClick={() => void save()}>{saving ? "Đang lưu…" : "Lưu cài đặt"}</button>}
          {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
        </div>
      </div>

      <div ref={bodyRef} className="setbody">
        {loading ? <p className="sub">Đang tải chính sách của {child.nickname}…</p> : (
          <>
            {role && !canEdit && <div className="notice err">Bạn chỉ xem được cài đặt an toàn của {child.nickname}. Cần quyền “Sửa cài đặt an toàn” — xin quyền ở Hồ sơ bé → Người giám sát.</div>}
            {!policy && <div className="notice err">{child.nickname} chưa có chính sách an toàn. Đã chọn sẵn các chủ đề nên chặn theo tuổi — xem lại rồi bấm Lưu cài đặt.</div>}
            <section id="s-mode">
              <h2 className="display">Chế độ duyệt</h2>
              <p className="sub" style={{ marginBottom: 10 }}>Áp dụng cho mọi truyện AI tạo cho {child.nickname}</p>
              <div className="sec" style={{ gap: 7 }}>
                {MODES.map((m) => (
                  <label key={m.id} className={`opt${mode === m.id ? " on" : ""}`}>
                    <input type="radio" name="mode" disabled={!canEdit} checked={mode === m.id} onChange={() => setMode(m.id)} />
                    <span><b>{m.b}</b><small>{m.s}</small></span>
                  </label>
                ))}
              </div>
            </section>

            <section id="s-topic">
              <h2 className="display">Chủ đề</h2>
              <p className="sub" style={{ marginBottom: 10 }}>AI sẽ từ chối chủ đề bị chặn, kể cả khi yêu cầu nhắc tới.</p>
              <CategoryRules cats={cats} rules={rules} onChange={setRules} disabled={!canEdit} />
            </section>

            <section id="s-limit">
              <h2 className="display">Giới hạn và quyền</h2>
              <div className="field" style={{ margin: "10px 0 2px" }}>
                <span className="lbl row" style={{ justifyContent: "space-between" }}>Độ dài tối đa của truyện <b style={{ color: "var(--text)" }}>{len.toLocaleString("vi-VN")} tiếng</b></span>
                <input type="range" className="range" disabled={!canEdit} min={200} max={5000} step={100} value={len} onChange={(e) => setLen(+e.target.value)} aria-label="Độ dài tối đa" />
                <span className="sub">Đếm theo tiếng (âm tiết). Mức 1 khoảng 200–400 tiếng, mức 5 khoảng 1.600–2.400 tiếng.</span>
              </div>
              <div className="trow"><span>Cổng xác nhận người lớn<small>Hỏi mật khẩu của bạn trước khi rời chế độ của bé</small></span>
                <button className={`tog${gate ? " on" : ""}`} disabled={!canEdit} role="switch" aria-checked={gate} aria-label="Cổng xác nhận người lớn" onClick={() => setGate(!gate)} /></div>
            </section>

            <section id="s-hold">
              <h2 className="display">Tạm dừng khi bé gặp khó</h2>
              <p className="sub" style={{ marginBottom: 10 }}>Nếu {child.nickname} làm câu đố dưới ngưỡng nhiều bài liên tiếp, thư viện tạm khóa truyện mới và bạn nhận được thông báo. Bé mở khóa bằng cách đọc lại truyện đó.</p>
              <div className="field">
                <span className="lbl row" style={{ justifyContent: "space-between" }}>Ngưỡng đọc hiểu <b style={{ color: "var(--text)" }}>{threshold}%</b></span>
                <input type="range" className="range" disabled={!canEdit} min={50} max={90} step={5} value={threshold} onChange={(e) => setThreshold(+e.target.value)} aria-label="Ngưỡng đọc hiểu" />
              </div>
              <div className="field" style={{ marginTop: 10 }}>
                <span className="lbl">Số bài liên tiếp dưới ngưỡng</span>
                <div className="seg" style={{ maxWidth: 260 }}>
                  {[2, 3, 4, 5].map((n) => <button key={n} disabled={!canEdit} className={windowSize === n ? "on" : ""} onClick={() => setWindowSize(n)}>{n} bài</button>)}
                </div>
              </div>
            </section>

            <section id="s-consent">
              <h2 className="display">Đồng ý của phụ huynh</h2>
              <p className="sub" style={{ marginBottom: 10 }}>Bắt buộc để kích hoạt hồ sơ và tạo truyện mới cho {child.nickname}.</p>
              <ConsentBlock checked={consent} onChange={setConsent} disabled={!canEdit} />
            </section>
          </>
        )}
      </div>
    </section>
  );
}
