"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Save, ShieldCheck } from "lucide-react";
import { childProfileService } from "@/app/services/childProfileService";
import { staffService } from "@/app/services/staffService";
import type { ChildProfile } from "@/app/types/childProfile";
import { AGE_BANDS, childStatus, fmtDate } from "@/app/lib/guardian";
import type { WorkspaceId } from "@/app/components/shell/nav";

type Checks = { learning: boolean; policy: boolean; consent: boolean };

/** Bước 1.2 (sửa thông tin) và 1.8 (kích hoạt — đủ hồ sơ học tập, cài đặt an toàn và đồng ý). */
export default function ProfileTab({ child, isOwner, onChanged, onTab, go }: {
  child: ChildProfile;
  isOwner: boolean;
  onChanged: () => void;
  onTab: (tab: "learning") => void;
  go: (id: WorkspaceId) => void;
}) {
  const [nickname, setNickname] = useState(child.nickname);
  const [ageBand, setAgeBand] = useState(child.ageBand);
  const [checks, setChecks] = useState<Checks | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const status = childStatus(child.status);
  const dirty = nickname.trim() !== child.nickname || ageBand !== child.ageBand;

  useEffect(() => {
    let alive = true;
    void Promise.all([childProfileService.getLearningProfile(child.id), childProfileService.getSafetyPolicy(child.id)]).then(([lp, sp]) => {
      if (alive) setChecks({ learning: lp.success && !!lp.data, policy: sp.success && !!sp.data, consent: !!sp.data?.consentRecorded });
    });
    return () => { alive = false; };
  }, [child.id, child.status]);

  const save = async () => {
    setBusy(true);
    setNote(null);
    const r = await childProfileService.updateChildProfile(child.id, { nickname: nickname.trim(), ageBand });
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? "Đã lưu thông tin bé." : r.message || "Không lưu được." });
    if (r.success) onChanged();
  };

  const activate = async () => {
    setBusy(true);
    setNote(null);
    const r = await childProfileService.activateChildProfile(child.id);
    setBusy(false);
    const active = r.data?.status === "Active";
    setNote({ ok: r.success && active, text: r.success ? (active ? "Hồ sơ đã được kích hoạt." : "Cần bạn đồng ý trong Cài đặt an toàn trước khi kích hoạt.") : r.message || "Chưa kích hoạt được." });
    onChanged();
  };

  const requestData = async (type: "export" | "delete") => {
    setBusy(true);
    setNote(null);
    const r = await staffService.createDataRequest(child.id, type);
    setBusy(false);
    setNote({ ok: r.success, text: r.message || (r.success ? "Đã gửi yêu cầu." : "Không gửi được yêu cầu.") });
  };

  const ready = checks && checks.learning && checks.policy && checks.consent;
  const rows = checks ? [
    { ok: true, label: "Thông tin bé", hint: "Biệt danh và nhóm tuổi" },
    { ok: checks.learning, label: "Hồ sơ học tập", hint: "Mức đọc, chủ đề yêu thích", fix: () => onTab("learning") },
    { ok: checks.policy, label: "Cài đặt an toàn", hint: "Chủ đề được phép và bị chặn", fix: () => go("safety") },
    { ok: checks.consent, label: "Đồng ý của phụ huynh", hint: "Đọc và đồng ý điều khoản dữ liệu", fix: () => go("safety") },
  ] : [];

  return (
    <div className="sec" style={{ gap: 24, maxWidth: 620 }}>
      <section className="sec" style={{ gap: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 className="display" style={{ margin: 0 }}>Thông tin bé</h3>
          <span className={`pill ${status.tone}`}>{status.label}</span>
        </div>
        <label className="field"><span className="lbl">Biệt danh</span>
          <input className="inp" maxLength={150} disabled={!isOwner} value={nickname} onChange={(e) => setNickname(e.target.value)} /></label>
        <div className="field"><span className="lbl">Nhóm tuổi</span>
          <div className="seg" style={{ maxWidth: 320 }}>
            {AGE_BANDS.map((a) => <button key={a.id} type="button" disabled={!isOwner} className={ageBand === a.id ? "on" : ""} onClick={() => setAgeBand(a.id)}>{a.label}</button>)}
          </div>
        </div>
        <p className="sub">Tạo ngày {fmtDate(child.createdAt)}.{!isOwner && " Chỉ người quản lý chính (Owner) mới sửa được thông tin này."}</p>
        {isOwner && <button className="btn btn-s" style={{ width: "fit-content" }} disabled={!dirty || busy || !nickname.trim()} onClick={() => void save()}><Save className="ic" />Lưu thông tin</button>}
      </section>

      {child.status !== "Active" && (
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

      {isOwner && (
        <section className="sec" style={{ gap: 8 }}>
          <h3 className="display" style={{ margin: 0 }}>Dữ liệu của bé</h3>
          <p className="sub">Bạn có thể yêu cầu xuất toàn bộ dữ liệu của {child.nickname}, hoặc xoá hồ sơ. Xoá sẽ thu hồi mọi quyền truy cập, xoá truyện riêng và dữ liệu học tập; không hoàn tác được. Quản trị viên xử lý trong tối đa 72 giờ.</p>
          <div className="row">
            <button className="btn btn-s" disabled={busy} onClick={() => void requestData("export")}>Yêu cầu xuất dữ liệu</button>
            <button className="btn btn-no" disabled={busy} onClick={() => { if (confirm(`Yêu cầu xoá toàn bộ dữ liệu của ${child.nickname}? Sau khi xử lý không thể khôi phục.`)) void requestData("delete"); }}>Yêu cầu xoá hồ sơ</button>
          </div>
        </section>
      )}

      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
    </div>
  );
}
