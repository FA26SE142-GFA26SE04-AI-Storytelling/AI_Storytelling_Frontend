"use client";
import { confirmDialog } from "@/app/lib/confirm";

import { useEffect, useState } from "react";
import { useFlash } from "@/app/lib/useFlash";
import ActivitySection from '@/app/features/account/ActivitySection';
import { Archive, Check, CirclePause, CirclePlay, CircleAlert, Save, ShieldCheck, User } from "lucide-react";
import { childProfileService } from "@/app/services/childProfileService";
import type { ChildProfile } from "@/app/types/childProfile";
import { AGE_BANDS, AVATARS, CHILD_AGES, ageBandOfAge, avatarOf, childStatus } from "@/app/lib/guardian";

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
  // Hồ sơ tạo trước khi có tuổi cụ thể: chưa có tuổi, chọn tuổi là cập nhật luôn nhóm tuổi.
  const [age, setAge] = useState<number | null>(child.age ?? null);
  const ageBand = age !== null ? ageBandOfAge(age) : child.ageBand;
  const [avatar, setAvatar] = useState(avatarOf(child.avatarId).id);
  const [checks, setChecks] = useState<Checks | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [hint, setHint] = useState<string | null>(null);
  const dirty = nickname.trim() !== child.nickname || age !== (child.age ?? null) || avatar !== avatarOf(child.avatarId).id;

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
    const r = await childProfileService.updateChildProfile(child.id, { nickname: nickname.trim(), ageBand, age, avatarId: avatar });
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
    { ok: true, label: "Thông tin bé", hint: "Biệt danh, tuổi và ảnh đại diện" },
    { ok: checks.learning, label: "Hồ sơ học tập", hint: "Mức đọc, chế độ đọc, chủ đề yêu thích", fix: () => onTab("learning") },
    { ok: checks.policy, label: "Cài đặt an toàn", hint: "Chủ đề được phép và bị chặn", fix: () => onTab("safety") },
    { ok: checks.consent, label: checks.outdated ? "Đồng ý lại điều khoản" : "Đồng ý của phụ huynh", hint: checks.outdated ? "Điều khoản đã đổi — cần đồng ý lại" : "Đọc và đồng ý điều khoản dữ liệu", fix: () => onTab("safety") },
  ] : [];
  const st = childStatus(child.status);
  const bandLabel = AGE_BANDS.find((a) => a.id === ageBand)?.label ?? ageBand;
  const liveAvatar = avatarOf(avatar);

  return (
    <div className="prof-tab">
      <div className="prof-hero">
        <span className="prof-hero-av" aria-hidden>{liveAvatar.emoji}</span>
        <div className="prof-hero-meta">
          <div className="prof-hero-title">
            <b className="display">{nickname.trim() || child.nickname}</b>
            <span className={`pill ${st.tone}`}>{st.label}</span>
          </div>
          <small className="sub">
            {age !== null ? `${age} tuổi · ` : ""}Nhóm {bandLabel}
          </small>
        </div>
        <div className="prof-hero-actions">
          {isOwner && (dirty || savedInfo) && (
            <button
              className={`btn btn-p${savedInfo ? " saved" : ""}`}
              disabled={!dirty || busy || !nickname.trim()}
              onClick={() => void save()}
            >
              {savedInfo ? <Check className="ic" /> : <Save className="ic" />}
              {savedInfo ? "Đã lưu" : "Lưu thay đổi"}
            </button>
          )}
          {isOwner && (child.status === "Active" || child.status === "Suspended") && (
            <>
              {child.status === "Active"
                ? <button className="btn btn-s" disabled={busy} onClick={() => void suspend()}><CirclePause className="ic" />Tạm dừng hồ sơ</button>
                : <button className="btn btn-p" disabled={busy} onClick={() => void resume()}><CirclePlay className="ic" />Tiếp tục hồ sơ</button>}
              <button className="btn btn-no" disabled={busy} onClick={() => void archive()}><Archive className="ic" />Lưu trữ hồ sơ</button>
            </>
          )}
        </div>
      </div>

      <div className="prof-grid">
        <div className="prof-col">
          <section className="prof-card prof-card-grow">
            <div className="prof-card-head">
              <span className="prof-card-ic" aria-hidden><User className="ic" /></span>
              <div>
                <h3 className="display">Thông tin cơ bản</h3>
                <p className="sub">Tên gọi, độ tuổi và nhân vật đại diện của bé.</p>
              </div>
            </div>

            <div className="prof-card-body">
              <label className="field">
                <span className="lbl">Biệt danh</span>
                <input className="inp prof-name-inp" maxLength={150} disabled={!isOwner} value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </label>

              <div className="field">
                <span className="lbl">Tuổi</span>
                <div className="seg prof-age-seg" role="radiogroup" aria-label="Tuổi của bé">
                  {CHILD_AGES.map((n) => <button key={n} type="button" role="radio" aria-checked={age === n} disabled={!isOwner} className={age === n ? "on" : ""} onClick={() => setAge(n)}>{n} tuổi</button>)}
                </div>
                <small className="sub">
                  {age === null
                    ? `Đang theo nhóm ${AGE_BANDS.find((a) => a.id === child.ageBand)?.label ?? child.ageBand}. Chọn tuổi cụ thể để cập nhật.`
                    : `Thuộc nhóm ${bandLabel}.`}
                </small>
              </div>

              <div className="field">
                <span className="lbl">Ảnh đại diện</span>
                <div className="avatars prof-avatars" role="radiogroup" aria-label="Avatar của bé">
                  {AVATARS.map((a) => (
                    <button key={a.id} type="button" role="radio" disabled={!isOwner} aria-checked={avatar === a.id} aria-label={a.label} title={a.label} className={`avatar${avatar === a.id ? " on" : ""}`} onClick={() => setAvatar(a.id)}>{a.emoji}</button>
                  ))}
                </div>
              </div>

              {hint && <div className="notice ok" role="status">{hint}</div>}
            </div>
          </section>
        </div>

        <div className="prof-col">
          {child.status === "Draft" && (
            <section className="prof-card">
              <div className="prof-card-head">
                <span className="prof-card-ic warn" aria-hidden><ShieldCheck className="ic" /></span>
                <div>
                  <h3 className="display">Kích hoạt hồ sơ</h3>
                  <p className="sub">Hoàn tất các bước bên dưới để bé bắt đầu sử dụng.</p>
                </div>
              </div>
              <div className="prof-card-body">
                {!checks && <p className="sub">Đang kiểm tra…</p>}
                {rows.map((r) => (
                  <div key={r.label} className="ck">
                    <span className={`st ${r.ok ? "ok" : "warn"}`}>{r.ok ? <Check /> : <CircleAlert />}</span>
                    <span className="grow" title={r.hint}>{r.label}</span>
                    {!r.ok && r.fix && <button className="btn btn-s" onClick={r.fix}>Hoàn tất</button>}
                  </div>
                ))}
                <button className="btn btn-p" style={{ width: "fit-content" }} disabled={!ready || busy || !isOwner} onClick={() => void activate()}><ShieldCheck className="ic" />Kích hoạt hồ sơ</button>
              </div>
            </section>
          )}

          <div className="prof-card prof-card-grow prof-activity">
            <ActivitySection key={`audit:${child.id}`} childId={child.id} />
          </div>
        </div>
      </div>

      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
    </div>
  );
}
