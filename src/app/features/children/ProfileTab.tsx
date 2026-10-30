"use client";
import { confirmDialog } from "@/app/lib/confirm";

import { useEffect, useState } from "react";
import { useFlash } from "@/app/lib/useFlash";
import ActivitySection from '@/app/features/account/ActivitySection';
import { Archive, Check, CirclePause, CirclePlay, CircleAlert, Save, ShieldCheck } from "lucide-react";
import { childProfileService } from "@/app/services/childProfileService";
import DataRequestSection from "./DataRequestSection";
import type { ChildProfile } from "@/app/types/childProfile";
import { AGE_BANDS, AVATARS, avatarOf, fmtDate } from "@/app/lib/guardian";

type Checks = { learning: boolean; policy: boolean; consent: boolean; outdated: boolean };
type Note = { ok: boolean; text: string } | null;

/** Bước 1.2 (sửa thông tin, avatar), 1.8 (kích hoạt), 1.8b và Mục 7 (tạm dừng, tiếp tục, lưu trữ). */
export default function ProfileTab({ child, isOwner, onChanged, onArchived, onTab }: {
  child: ChildProfile;
  isOwner: boolean;
  onChanged: () => void;
  onArchived: () => void;
  onTab: (tab: "learning" | "safety") => void;
}) {
  const [nickname, setNickname] = useState(child.nickname);
  const [ageBand, setAgeBand] = useState(child.ageBand);
  const [avatar, setAvatar] = useState(avatarOf(child.avatarId).id);
  const [checks, setChecks] = useState<Checks | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [hint, setHint] = useState<string | null>(null);
  const dirty = nickname.trim() !== child.nickname || ageBand !== child.ageBand || avatar !== avatarOf(child.avatarId).id;

  useEffect(() => {
    let alive = true;
    void Promise.all([childProfileService.getLearningProfile(child.id), childProfileService.getSafetyPolicy(child.id)]).then(([lp, sp]) => {
      if (alive) setChecks({ learning: lp.success && !!lp.data, policy: sp.success && !!sp.data, consent: !!sp.data?.consentRecorded && !sp.data.consentOutdated, outdated: !!sp.data?.consentOutdated });
    });
    return () => { alive = false; };
  }, [child.id, child.status]);

  const run = async (fn: () => Promise<{ success: boolean; message: string }>, okText: string) => {
    setBusy(true);
    setNote(null);
    const r = await fn();
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? okText : r.message || "Không thực hiện được." });
    return r.success;
  };

  const [savedInfo, flashInfo] = useFlash();
  const save = async () => {
    setBusy(true);
    setNote(null);
    setHint(null);
    const r = await childProfileService.updateChildProfile(child.id, { nickname: nickname.trim(), ageBand, avatarId: avatar });
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? "Đã lưu thông tin bé." : r.message || "Không lưu được." });
    if (!r.success) return;
    flashInfo();
    // Đổi nhóm tuổi: backend gợi ý áp lại danh sách chặn và đổi chế độ đọc cho hợp tuổi.
    const tips = [
      r.data?.shouldReapplyBlockedPreset && "áp dụng danh sách chủ đề nên chặn của nhóm tuổi mới (Cài đặt an toàn)",
      r.data?.suggestedReadingMode && "xem lại chế độ đọc (tab Học tập)",
    ].filter(Boolean);
    if (tips.length) setHint(`Nhóm tuổi đã đổi. Bạn nên ${tips.join(" và ")}.`);
    onChanged();
  };

  const activate = async () => {
    if (await run(() => childProfileService.activateChildProfile(child.id), "Hồ sơ đã được kích hoạt.")) onChanged();
  };

  const suspend = async () => {
    if (!await confirmDialog(`Tạm dừng hồ sơ của ${child.nickname}? Bé sẽ thoát khỏi phiên đang đọc và mã QR đăng nhập bị thu hồi.`)) return;
    if (await run(() => childProfileService.suspendChildProfile(child.id), "Đã tạm dừng hồ sơ.")) onChanged();
  };

  const resume = async () => {
    // Điều khoản đổi phiên bản trong lúc tạm dừng: Owner phải đồng ý bản mới mới tiếp tục được.
    if (checks?.outdated && !await confirmDialog("Điều khoản sử dụng đã thay đổi. Bạn đồng ý với điều khoản hiện tại để tiếp tục hồ sơ?")) return;
    if (await run(() => childProfileService.resumeChildProfile(child.id, !!checks?.outdated), "Hồ sơ đã hoạt động trở lại. Tạo mã QR mới nếu bé cần đăng nhập.")) onChanged();
  };

  const archive = async () => {
    if (!await confirmDialog(`Lưu trữ hồ sơ của ${child.nickname}? Hồ sơ bị ẩn khỏi danh sách, mọi phiên và mã QR của bé bị thu hồi.`)) return;
    if (await run(() => childProfileService.archiveChildProfile(child.id), "Đã lưu trữ hồ sơ.")) onArchived();
  };


  const ready = checks && checks.learning && checks.policy && checks.consent;
  const rows = checks ? [
    { ok: true, label: "Thông tin bé", hint: "Biệt danh và nhóm tuổi" },
    { ok: checks.learning, label: "Hồ sơ học tập", hint: "Mức đọc, chế độ đọc, chủ đề yêu thích", fix: () => onTab("learning") },
    { ok: checks.policy, label: "Cài đặt an toàn", hint: "Chủ đề được phép và bị chặn", fix: () => onTab("safety") },
    { ok: checks.consent, label: "Đồng ý của phụ huynh", hint: checks.outdated ? "Điều khoản đã đổi — cần đồng ý lại" : "Đọc và đồng ý điều khoản dữ liệu", fix: () => onTab("safety") },
  ] : [];

  return (
    <div className="sec" style={{ gap: 24 }}>
      <section className="sec" style={{ gap: 12 }}>
        <label className="field"><span className="lbl">Biệt danh</span>
          <input className="inp" maxLength={150} disabled={!isOwner} value={nickname} onChange={(e) => setNickname(e.target.value)} /></label>
        <div className="field"><span className="lbl">Nhóm tuổi</span>
          <div className="seg" style={{ maxWidth: 320 }}>
            {AGE_BANDS.map((a) => <button key={a.id} type="button" disabled={!isOwner} className={ageBand === a.id ? "on" : ""} onClick={() => setAgeBand(a.id)}>{a.label}</button>)}
          </div>
        </div>
        <div className="field"><span className="lbl">Avatar</span>
          <div className="avatars" role="radiogroup" aria-label="Avatar của bé">
            {AVATARS.map((a) => (
              <button key={a.id} type="button" role="radio" disabled={!isOwner} aria-checked={avatar === a.id} aria-label={a.label} className={`avatar${avatar === a.id ? " on" : ""}`} onClick={() => setAvatar(a.id)}>{a.emoji}</button>
            ))}
          </div>
          <span className="sub">Avatar giúp bé nhận ra hồ sơ của mình khi đăng nhập.</span>
        </div>
        <p className="sub">Tạo ngày {fmtDate(child.createdAt)}.{!isOwner && " Chỉ người quản lý chính (Owner) mới sửa được thông tin này."}</p>
        {isOwner && <button className={`btn btn-s${savedInfo ? " saved" : ""}`} style={{ width: "fit-content" }} disabled={!dirty || busy || !nickname.trim()} onClick={() => void save()}>{savedInfo ? <Check className="ic" /> : <Save className="ic" />}{savedInfo ? "Đã lưu" : "Lưu thông tin"}</button>}
        {hint && <div className="notice ok" role="status">{hint}</div>}
      </section>

      {child.status === "Draft" && (
        <section className="sec" style={{ gap: 10 }}>
          <h3 className="display" style={{ margin: 0 }}>Kích hoạt hồ sơ</h3>
          <p className="sub">Bé chỉ đọc được truyện khi hồ sơ đang hoạt động. Cần hoàn tất các mục sau:</p>
          {!checks && <p className="sub">Đang kiểm tra…</p>}
          {rows.map((r) => (
            <div key={r.label} className="ck">
              <span className={`st ${r.ok ? "ok" : "warn"}`}>{r.ok ? <Check /> : <CircleAlert />}</span>
              <span className="grow">{r.label}<small style={{ display: "block" }}>{r.hint}</small></span>
              {!r.ok && r.fix && <button className="btn btn-s" onClick={r.fix}>Hoàn tất</button>}
            </div>
          ))}
          <button className="btn btn-p" style={{ width: "fit-content" }} disabled={!ready || busy || !isOwner} onClick={() => void activate()}><ShieldCheck className="ic" />Kích hoạt hồ sơ</button>
        </section>
      )}

      {isOwner && (child.status === "Active" || child.status === "Suspended") && (
        <section className="sec" style={{ gap: 8 }}>
          <h3 className="display" style={{ margin: 0 }}>Trạng thái hồ sơ</h3>
          <p className="sub">
            {child.status === "Active"
              ? `Tạm dừng khi ${child.nickname} cần nghỉ dùng một thời gian; dữ liệu vẫn được giữ.`
              : `Hồ sơ đang tạm dừng: ${child.nickname} chưa đăng nhập hay đọc truyện được.`}
          </p>
          <div className="row">
            {child.status === "Active"
              ? <button className="btn btn-s" disabled={busy} onClick={() => void suspend()}><CirclePause className="ic" />Tạm dừng hồ sơ</button>
              : <button className="btn btn-p" disabled={busy} onClick={() => void resume()}><CirclePlay className="ic" />Tiếp tục hồ sơ</button>}
            <button className="btn btn-no" disabled={busy} onClick={() => void archive()}><Archive className="ic" />Lưu trữ hồ sơ</button>
          </div>
        </section>
      )}

      {isOwner && <DataRequestSection child={child} />}
      <ActivitySection key={`audit:${child.id}`} childId={child.id} />

      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
    </div>
  );
}
