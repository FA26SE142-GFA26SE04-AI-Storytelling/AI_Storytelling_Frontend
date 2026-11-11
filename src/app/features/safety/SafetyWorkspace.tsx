"use client";
import { confirmDialog } from "@/app/lib/confirm";

import "./safety.css";
import "../children/children.css";
import { useCallback, useEffect, useState, useRef } from "react";
import { Clock, FileCheck, Inbox, Target, ShieldCheck, Sparkles, Mic, Trash2 } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import IconButton from "@/app/components/IconButton";
import { showToast } from "@/app/lib/toast";
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
  { id: "s-hold", label: "Mức đọc hiểu", icon: Target },
  { id: "s-consent", label: "Đồng ý của phụ huynh", icon: FileCheck },
];
/** Điều khoản (e): Backend bắt Owner đồng ý khi bật giọng nói lần đầu. */
const VOICE_CONSENT = "Khi bật giọng nói: lúc bé luyện đọc to, giọng của bé chỉ được nhận dạng tạm thời rồi bỏ, không lưu lại; bản ghi âm bé kể lại cuối truyện được lưu để bạn nghe lại, bạn xoá được bất cứ lúc nào.";

/** Thanh kéo ngưỡng 0–100; null = để hệ thống dùng mức mặc định. */
function ScoreSlider({ label, value, fallback, disabled, onChange }: { label: string; value: number | null; fallback: number; disabled: boolean; onChange: (v: number | null) => void }) {
  return (
    <div className="field" style={{ marginTop: 10 }}>
      <span className="lbl row" style={{ justifyContent: "space-between" }}>{label}
        <span className="row" style={{ gap: 8 }}>
          <b style={{ color: "var(--text)" }}>{value === null ? "Mặc định" : value}</b>
          {value !== null && <button type="button" className="btn btn-g" disabled={disabled} onClick={() => onChange(null)}>Về mặc định</button>}
        </span>
      </span>
      <input type="range" className="range" disabled={disabled} min={0} max={100} step={5} value={value ?? fallback} onChange={(e) => onChange(+e.target.value)} aria-label={label} />
    </div>
  );
}

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
  const [safetyTh, setSafetyTh] = useState<number | null>(null);
  const [readTh, setReadTh] = useState<number | null>(null);
  const [voice, setVoice] = useState(false);
  // Đã tích đồng ý (e) trong popup nhưng chưa lưu; gửi kèm lần lưu kế tiếp.
  const [voiceAccepted, setVoiceAccepted] = useState(false);
  const [askVoice, setAskVoice] = useState(false);
  const [voiceTick, setVoiceTick] = useState(false);
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
      setSafetyTh(pol.safetyScoreThreshold == null ? null : Number(pol.safetyScoreThreshold));
      setReadTh(pol.readabilityScoreThreshold == null ? null : Number(pol.readabilityScoreThreshold));
      setVoice(!!pol.voiceAnswersEnabled);
      setVoiceAccepted(false);
      setRules(Object.fromEntries(pol.categories.map((x) => [x.contentCategoryId, normalizeRule(x.rule)])));
    } else {
      // Chưa có (hoặc vừa xoá) cài đặt an toàn: hiện các giá trị mặc định.
      setMode("AlwaysManual");
      setLen(2000);
      setGate(true);
      setWishes(true);
      setInteractive(true);
      setThreshold(70);
      setSafetyTh(null);
      setReadTh(null);
      setVoice(false);
      setVoiceAccepted(false);
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

  const settingsKey = JSON.stringify([mode, len, gate, wishes, interactive, threshold, safetyTh, readTh, voice, rules, consent]);
  useEffect(() => {
    if (loading || !canEdit || saving) return;
    if (baseline.current === null) { baseline.current = settingsKey; return; }
    if (settingsKey === baseline.current || settingsKey === lastTried.current) return;
    // Lần đầu (hoặc điều khoản đã đổi) backend bắt buộc Owner đồng ý trước; chưa đồng ý thì chưa lưu.
    if ((!policy?.consentRecorded || policy.consentOutdated) && !consent) return;
    const id = setTimeout(() => { lastTried.current = settingsKey; void saveRef.current(); }, 600);
    return () => clearTimeout(id);
  }, [settingsKey, loading, canEdit, saving, policy, consent]);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const outdated = !!policy?.consentOutdated;

  const save = async () => {
    if (!child || !canEdit) return;
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
      // Chưa có tính năng nào dùng số bài liên tiếp (Hold Mode chưa làm): giữ nguyên giá trị đang lưu.
      comprehensionWindowSize: policy?.comprehensionWindowSize ?? 3,
      safetyScoreThreshold: safetyTh,
      readabilityScoreThreshold: readTh,
      voiceAnswersEnabled: voice,
      voiceConsentAccepted: voice && voiceAccepted,
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

  useEffect(() => { saveRef.current = save; });

  if (!child) return <p className="sub">Chưa có hồ sơ bé.</p>;

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

  // Backend không cho xoá khi hồ sơ bé đang hoạt động vì bé đang dùng các quy tắc này.
  const activeChild = child.status === "Active";
  const removeLabel = activeChild ? `Không xoá được khi hồ sơ của ${child.nickname} đang hoạt động. Hãy tạm dừng hồ sơ trước.` : "Xoá cài đặt an toàn";
  const removePolicy = async () => {
    if (!await confirmDialog(`Xoá cài đặt an toàn của ${child.nickname}? Chế độ duyệt, các chủ đề bị chặn, giới hạn độ dài truyện, các tính năng cho bé và ghi nhận đồng ý của bạn sẽ bị xoá và không khôi phục được. Bạn cần thiết lập và đồng ý lại trước khi kích hoạt hồ sơ cho bé.`)) return;
    setSaving(true);
    setNote(null);
    const res = await profileLifecycleService.removeSafety(child.id);
    setSaving(false);
    // 404: cài đặt đã không còn nên vẫn đưa về trạng thái chưa có.
    if (!res.success && res.status !== 404) {
      showToast(res.status === 400 ? `Không xoá được vì hồ sơ của ${child.nickname} đang hoạt động. Hãy tạm dừng hồ sơ trước.`
        : res.status === 403 ? "Chỉ người quản lý chính của bé mới xoá được cài đặt an toàn."
        : "Chưa xoá được cài đặt an toàn. Vui lòng thử lại.", "err");
      return;
    }
    apply(null, cats, child.ageBand);
    showToast(`Đã xoá cài đặt an toàn của ${child.nickname}.`, "ok");
    void reloadChildren();
  };

  return (
    <div className="safety-tab">
      <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
        <nav className="safety-jump grow" aria-label="Các mục cài đặt an toàn">
          {NAV.map((n) => <button key={n.id} type="button" onClick={() => jump(n.id)}><n.icon className="ic" />{n.label}</button>)}
        </nav>
        {isOwner && policy && !loading && (
          <span title={removeLabel}>
            <IconButton icon={Trash2} className="btn btn-no" label={removeLabel} disabled={saving || activeChild} onClick={() => void removePolicy()} />
          </span>
        )}
      </div>

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
              {mode === "AutoPublishOnThreshold" && (
                <div className="safety-auto">
                  {gate && <p className="notice warn">Đang bật &ldquo;Hỏi mật khẩu khi bé thoát&rdquo; nên truyện vẫn cần bạn duyệt tay. Muốn tự duyệt, hãy tắt mục đó ở phần Giới hạn và quyền.</p>}
                  <ScoreSlider label="Điểm an toàn tối thiểu" value={safetyTh} fallback={80} disabled={!canEdit} onChange={setSafetyTh} />
                  <ScoreSlider label="Độ dễ đọc tối thiểu" value={readTh} fallback={60} disabled={!canEdit} onChange={setReadTh} />
                </div>
              )}
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
              <Toggle on={interactive} disabled={!canEdit} onChange={setInteractive} label="Tương tác khi nghe truyện" hint="Trong lúc nghe, bé đoán tranh, điền chữ, sắp xếp sự kiện… để hiểu truyện hơn" />
              <Toggle on={voice} disabled={!canEdit} onChange={(v) => { if (v && isOwner && !policy?.voiceConsentAt && !voiceAccepted) { setVoiceTick(false); setAskVoice(true); } else setVoice(v); }}
                label="Cho bé trả lời bằng giọng nói" hint="Bé ghi âm kể lại truyện cho bạn nghe và luyện đọc to" />
            </section>

            <section id="s-hold">
              <h2 className="display">Mức đọc hiểu mục tiêu</h2>
              <div className="field">
                <span className="lbl row" style={{ justifyContent: "space-between" }}>Tỉ lệ bé cần hiểu đúng <b style={{ color: "var(--text)" }}>{threshold}%</b></span>
                <input type="range" className="range" disabled={!canEdit} min={50} max={90} step={5} value={threshold} onChange={(e) => setThreshold(+e.target.value)} aria-label="Mức đọc hiểu mục tiêu" title="AI dựa vào mức này để chọn độ khó cho câu hỏi" />
              </div>
            </section>

            <section id="s-consent">
              <h2 className="display">Đồng ý của phụ huynh</h2>
              {(!policy?.consentRecorded || outdated) && <p className="notice warn" style={{ marginBottom: 10 }}>Tích đồng ý bên dưới để các cài đặt được lưu tự động.</p>}
              {policy?.consentRecorded && !outdated && <span className="pill ok" style={{ marginBottom: 10, width: "fit-content" }}>{`Đã đồng ý ngày ${fmtDate(policy.consentRecordedAt)}`}</span>}
              <ConsentBlock checked={consent} onChange={setConsent} disabled={!isOwner || (!!policy?.consentRecorded && !outdated)} />
            </section>
          </>
        )}
      </div>

      {askVoice && (
        <Dialog title="Bật trả lời bằng giọng nói" onClose={() => setAskVoice(false)}>
          <div className="consent">
            <b>Trước khi bật, bạn cần biết:</b>
            <ol start={5} type="a"><li>{VOICE_CONSENT}</li></ol>
            <label className="row" style={{ alignItems: "flex-start" }}>
              <input type="checkbox" checked={voiceTick} onChange={(e) => setVoiceTick(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--primary)" }} />
              <span>Tôi đã đọc và đồng ý</span>
            </label>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn btn-g" onClick={() => setAskVoice(false)}>Huỷ</button>
            <span className="grow" />
            <button className="btn btn-p" disabled={!voiceTick} onClick={() => { setVoiceAccepted(true); setVoice(true); setAskVoice(false); }}><Mic className="ic" />Đồng ý và bật</button>
          </div>
        </Dialog>
      )}
      {canEdit && !loading && (saving || note) && (
        <div className="safety-savebar">
          {saving ? <div className="notice" role="status">Đang lưu…</div> : note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
        </div>
      )}
    </div>
  );
}
