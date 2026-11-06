"use client";
import { confirmDialog } from "@/app/lib/confirm";

import "./safety.css";
import "../children/children.css";
import { useCallback, useEffect, useState, useRef } from "react";
import { Clock, FileCheck, Inbox, CirclePause, ShieldCheck, Sparkles } from "lucide-react";
import { childProfileService } from "@/app/services/childProfileService";
import type { ApprovalMode, ContentCategory, PolicyRule, SafetyPolicy } from "@/app/types/childProfile";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import type { ChildProfile } from "@/app/types/childProfile";
import { useRiseIn } from "@/app/lib/motion";
import { fmtDate, presetBlocked } from "@/app/lib/guardian";
import { CategoryRules, ConsentBlock, keptPolicyFields, normalizeRule, rulesToRequest } from "@/app/features/children/SafetyBlocks";
import { useMyRole } from "@/app/features/children/useMyRole";
import { profileLifecycleService } from '@/app/services/profileLifecycleService';

const MODES: { id: ApprovalMode; b: string; s: string }[] = [
  { id: "AlwaysManual", b: "Luôn cần duyệt", s: "Mọi truyện AI tạo đều vào hàng chờ. Khuyên dùng cho trẻ nhỏ." },
  { id: "AutoPublishOnThreshold", b: "Tự duyệt khi đạt ngưỡng an toàn", s: "Truyện đạt điểm an toàn và độ khó theo chính sách được giao ngay, truyện còn lại vào hàng chờ." },
];
const NAV = [
  { id: "s-mode", label: "Chế độ duyệt", icon: Inbox },
  { id: "s-topic", label: "Chủ đề", icon: ShieldCheck },
  { id: "s-limit", label: "Giới hạn và quyền", icon: Clock },
  { id: "s-feature", label: "Tính năng cho bé", icon: Sparkles },
  { id: "s-hold", label: "Tạm dừng khi khó", icon: CirclePause },
  { id: "s-consent", label: "Đồng ý của phụ huynh", icon: FileCheck },
];

function Toggle({ on, label, hint, disabled, strong, onChange }: { on: boolean; label: string; hint: string; disabled?: boolean; strong?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={`trow${strong ? " strong" : ""}`} title={hint}><span>{label}<small>{hint}</small></span>
      <button type="button" className={`tog${on ? " on" : ""}`} disabled={disabled} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} /></div>
  );
}

/** Luồng 1 Bước 1.4 — cài đặt an toàn của bé. */
export default function SafetyWorkspace({ child }: { child: ChildProfile | null }) {
  const { reloadChildren } = useWorkspaceData();
  // Mặc định chỉ Owner sửa được; người giám sát khác cần quyền "Sửa cài đặt an toàn" (BR-1.8). Kiểm tra lại mỗi lần đổi bé.
  const role = useMyRole(child);
  const canEdit = !!role?.can("ManageSafetySettings");
  const isOwner = !!role?.isOwner;
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [policy, setPolicy] = useState<SafetyPolicy | null>(null);
  const [mode, setMode] = useState<ApprovalMode>("AlwaysManual");
  const [rules, setRules] = useState<Record<number, PolicyRule | undefined>>({});
  const [len, setLen] = useState(2000);
  const [gate, setGate] = useState(true);
  const [wishes, setWishes] = useState(true);
  const [interactive, setInteractive] = useState(true);
  const [consent, setConsent] = useState(false);
  const [threshold, setThreshold] = useState(70);
  const [windowSize, setWindowSize] = useState(3);
  const [loading, setLoading] = useState(true);
  const bodyRef = useRiseIn<HTMLDivElement>("section", [child?.id, loading], { delay: 70 });
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  // Tự lưu: mỗi khi cài đặt khác với lần tải/lưu gần nhất thì chờ một lúc rồi lưu, không có nút Lưu.
  const baseline = useRef<string | null>(null);
  const lastTried = useRef<string | null>(null);
  const saveRef = useRef<() => Promise<void>>(async () => {});
  const [denied, setDenied] = useState(0);
  const deny = () => { setDenied((n) => n + 1); setTimeout(() => setDenied(0), 3500); };
  const [saving, setSaving] = useState(false);

  const apply = useCallback((pol: SafetyPolicy | null, active: ContentCategory[], ageBand: string) => {
    baseline.current = null; lastTried.current = null;
    setPolicy(pol);
    if (pol) {
      setMode(pol.requiredApprovalMode === "AutoPublishOnThreshold" ? "AutoPublishOnThreshold" : "AlwaysManual");
      setLen(pol.maxStoryLength);
      setGate(pol.parentalGateEnabled);
      setWishes(pol.storyWishesEnabled ?? true);
      setInteractive(pol.allowInteractiveStories ?? true);
      // Điều khoản đổi phiên bản thì Owner phải đồng ý lại.
      setConsent(pol.consentRecorded && !pol.consentOutdated);
      setThreshold(Number(pol.comprehensionThresholdPercent ?? 70));
      setWindowSize(pol.comprehensionWindowSize ?? 3);
      setRules(Object.fromEntries(pol.categories.map((x) => [x.contentCategoryId, normalizeRule(x.rule)])));
    } else {
      setConsent(false);
      setRules(Object.fromEntries(presetBlocked(active, ageBand).map((id) => [id, "Blocked" as const])));
    }
  }, []);

  // Chỉ tải lại khi đổi bé (theo id), không tải lại khi danh sách bé được làm mới sau khi lưu: nếu không trang sẽ nháy và cuộn về đầu.
  const childId = child?.id;
  const childAge = child?.ageBand;
  useEffect(() => {
    if (childId === undefined) return;
    let alive = true;
    setLoading(true);
    setNote(null);
    void Promise.all([childProfileService.getContentCategories(), childProfileService.getSafetyPolicy(childId)]).then(([c, p]) => {
      if (!alive) return;
      const active = (c.data ?? []).filter((x) => x.isActive);
      setCats(active);
      apply(p.success ? p.data : null, active, childAge ?? "");
      setLoading(false);
    });
    return () => { alive = false; };
  }, [childId, childAge, apply]);

  const settingsKey = JSON.stringify([mode, len, gate, wishes, interactive, threshold, windowSize, rules, consent]);
  useEffect(() => {
    if (loading || !canEdit || saving) return;
    if (baseline.current === null) { baseline.current = settingsKey; return; }
    if (settingsKey === baseline.current || settingsKey === lastTried.current) return;
    // Lần đầu (hoặc điều khoản đã đổi) backend bắt buộc Owner đồng ý trước; chưa đồng ý thì chưa lưu.
    if ((!policy?.consentRecorded || policy.consentOutdated) && !consent) return;
    const id = setTimeout(() => { lastTried.current = settingsKey; void saveRef.current(); }, 600);
    return () => clearTimeout(id);
  }, [settingsKey, loading, canEdit, saving, policy, consent]);

  if (!child) return <p className="sub">Chưa có hồ sơ bé.</p>;

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const outdated = !!policy?.consentOutdated;

  const save = async () => {
    // Lần lưu đầu backend bắt buộc Owner đồng ý điều khoản.
    if (!policy?.consentRecorded && !consent) {
      setNote({ ok: false, text: isOwner ? "Hãy đọc và đồng ý điều khoản ở mục Đồng ý của phụ huynh trước khi lưu." : "Người quản lý chính cần đồng ý điều khoản trước khi lưu cài đặt an toàn." });
      jump("s-consent");
      return;
    }
    setSaving(true);
    setNote(null);
    if (outdated && consent && isOwner) {
      const rc = await childProfileService.reconsent(child.id);
      if (!rc.success) { setSaving(false); setNote({ ok: false, text: rc.message }); return; }
    }
    const savePolicy = policy ? childProfileService.setSafetyPolicy : profileLifecycleService.createSafety;
    const res = await savePolicy(child.id, {
      ...keptPolicyFields(policy),
      maxStoryLength: len,
      requiredApprovalMode: mode,
      parentalGateEnabled: gate,
      consentRecorded: consent,
      comprehensionThresholdPercent: threshold,
      comprehensionWindowSize: windowSize,
      storyWishesEnabled: wishes,
      allowInteractiveStories: interactive,
      // Danh sách chặn mặc định đã được điền sẵn ở giao diện, không để backend thêm lần nữa.
      applyAgePreset: false,
      categories: rulesToRequest(cats, rules),
    });
    setSaving(false);
    setNote({ ok: res.success, text: res.success ? "Đã lưu cài đặt an toàn." : res.message });
    if (res.success) {
      if (res.data) apply(res.data, cats, child.ageBand);
      void reloadChildren();
    }
  };

  saveRef.current = save;

  const reapplyPreset = async () => {
    setSaving(true);
    setNote(null);
    const preview = await profileLifecycleService.agePreset(child!.id);
    if (!preview.success || !preview.data) { setSaving(false); setNote({ok:false,text:preview.message}); return; }
    const names = cats.filter(c=>preview.data!.blockedCategoryIds.includes(c.id)).map(c=>c.displayName).join(', ');
    if (!await confirmDialog(`Áp dụng chặn theo tuổi ${preview.data.ageBand}: ${names || 'không có danh mục chặn'}?`)) { setSaving(false); return; }
    const res = await childProfileService.applyAgePreset(child.id);
    setSaving(false);
    setNote({ ok: res.success, text: res.success ? "Đã áp dụng danh sách chặn mặc định cho nhóm tuổi mới." : res.message });
    if (res.success && res.data) apply(res.data, cats, child.ageBand);
  };

  return (
    <div className="safety-tab">
      <nav className="safety-jump" aria-label="Các mục cài đặt an toàn">
        {NAV.map((n) => <button key={n.id} type="button" onClick={() => jump(n.id)}><n.icon className="ic" />{n.label}</button>)}
      </nav>

      <div ref={bodyRef} className="setbody">
        {role && !canEdit && !loading && <div className="safety-deny" onClick={deny} aria-hidden />}
        {denied > 0 && <div key={denied} className="notice err" role="status">Bạn không đủ quyền hạn để chỉnh sửa cài đặt an toàn.</div>}
        {loading ? <p className="sub">Đang tải chính sách của {child.nickname}…</p> : (
          <>
            {outdated && <div className="notice err">Điều khoản sử dụng đã thay đổi. {isOwner ? "Hãy đọc lại và đồng ý ở mục Đồng ý của phụ huynh." : "Người quản lý chính cần đồng ý lại."}</div>}
            <section id="s-mode">
              <h2 className="display">Chế độ duyệt</h2>
              <div className="sec" style={{ gap: 7 }}>
                {MODES.map((m) => (
                  <label key={m.id} className={`opt${mode === m.id ? " on" : ""}`}>
                    <input type="radio" name="mode" disabled={!canEdit} checked={mode === m.id} onChange={() => setMode(m.id)} />
                    <span title={m.s}><b>{m.b}</b></span>
                  </label>
                ))}
              </div>
            </section>

            <section id="s-topic">
              <h2 className="display">Chủ đề</h2>
              {policy && child.shouldReapplyBlockedPreset && canEdit && (
                <div className="notice ok row" style={{ justifyContent: "space-between", flexWrap: "wrap", marginBottom: 10 }}>
                  <span>Nhóm tuổi của {child.nickname} vừa đổi. Có thể áp dụng danh sách chủ đề nên chặn cho nhóm tuổi mới.</span>
                  <button className="btn btn-s" disabled={saving} onClick={() => void reapplyPreset()}>Áp dụng</button>
                </div>
              )}
              <CategoryRules cats={cats} rules={rules} onChange={setRules} disabled={!canEdit} />
            </section>

            <section id="s-limit">
              <h2 className="display">Giới hạn và quyền</h2>
              <div className="field" style={{ margin: "10px 0 2px" }}>
                <span className="lbl row" style={{ justifyContent: "space-between" }}>Độ dài tối đa của truyện <b style={{ color: "var(--text)" }}>{len.toLocaleString("vi-VN")} tiếng</b></span>
                <input type="range" className="range" disabled={!canEdit} min={200} max={5000} step={100} value={len} onChange={(e) => setLen(+e.target.value)} aria-label="Độ dài tối đa" />
              </div>
              <Toggle strong on={gate} disabled={!canEdit} onChange={setGate} label="Hỏi mật khẩu khi bé thoát chế độ của bé" hint="Cổng xác nhận người lớn: bé muốn thoát ra phải nhập mật khẩu của bạn" />
            </section>

            <section id="s-feature">
              <h2 className="display">Tính năng cho bé</h2>
              <Toggle on={wishes} disabled={!canEdit} onChange={setWishes} label="Bé ước một câu chuyện" hint="Bé chọn thẻ hình để gửi điều ước, bạn xem và quyết định" />
              <Toggle on={interactive} disabled={!canEdit} onChange={setInteractive} label="Truyện nhiều lựa chọn" hint="Cho phép tạo truyện mà bé tự chọn hướng đi ở một số đoạn" />
            </section>

            <section id="s-hold">
              <h2 className="display">Tạm dừng khi bé gặp khó</h2>
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
              {(!policy?.consentRecorded || outdated) && <p className="sub" style={{ marginBottom: 10 }}>Tích đồng ý bên dưới để các cài đặt được lưu tự động.</p>}
              {policy?.consentRecorded && !outdated && <p className="sub" style={{ marginBottom: 10 }}>{`Đã đồng ý ngày ${fmtDate(policy.consentRecordedAt)}.`}</p>}
              <ConsentBlock checked={consent} onChange={setConsent} disabled={!isOwner || (!!policy?.consentRecorded && !outdated)} />
            </section>
          </>
        )}
      </div>

      {canEdit && !loading && (saving || note) && (
        <div className="safety-savebar">
          {saving ? <div className="notice" role="status">Đang lưu…</div> : note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
        </div>
      )}
    </div>
  );
}
