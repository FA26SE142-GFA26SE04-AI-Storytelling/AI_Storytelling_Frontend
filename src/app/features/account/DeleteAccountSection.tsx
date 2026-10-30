"use client";
import { confirmDialog } from "@/app/lib/confirm";

import PasswordInput from "@/app/components/PasswordInput";
import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { accountService } from "@/app/services/accountService";
import type { DeleteAccountPreview } from "@/app/types/auth";

/** Xoá tài khoản Phụ huynh: hồ sơ bé mình là Owner phải được chuyển quyền hoặc lưu trữ trước; hồ sơ nháp có thể xoá cùng. */
export default function DeleteAccountSection() {
  const { logout } = useAuth();
  const [preview, setPreview] = useState<DeleteAccountPreview | null>(null);
  const [password, setPassword] = useState("");
  const [dropDrafts, setDropDrafts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const check = async () => {
    setBusy(true);
    setErr(null);
    const r = await accountService.getDeleteAccountPreview();
    setBusy(false);
    if (r.success && r.data) setPreview(r.data);
    else setErr(r.message);
  };

  const remove = async (e: FormEvent) => {
    e.preventDefault();
    if (!await confirmDialog("Xoá tài khoản? Thao tác này không hoàn tác được.")) return;
    setBusy(true);
    setErr(null);
    const r = await accountService.deleteAccount(password, dropDrafts);
    setBusy(false);
    if (r.success) await logout();
    else setErr(r.message);
  };

  const names = (list: DeleteAccountPreview["blockingProfiles"]) => list.map((p) => p.nickname).join(", ");

  return (
    <section className="sec" style={{ gap: 10 }}>
      <h3 className="display" style={{ margin: 0 }}>Xoá tài khoản</h3>
      <p className="sub">Tài khoản bị xoá và ẩn danh hoá. Hồ sơ bé bạn đang quản lý chính cần được chuyển quyền Owner hoặc lưu trữ trước.</p>
      {!preview && <button className="btn btn-no" style={{ width: "fit-content" }} disabled={busy} onClick={() => void check()}><Trash2 className="ic" />Xoá tài khoản…</button>}
      {preview && !preview.canDelete && (
        <div className="notice err">Chưa xoá được: bạn còn là người quản lý chính của {names(preview.blockingProfiles)}. Hãy chuyển quyền Owner hoặc lưu trữ các hồ sơ này ở mục Hồ sơ bé.</div>
      )}
      {preview?.canDelete && (
        <form className="sec" style={{ gap: 10 }} onSubmit={remove}>
          {preview.draftProfiles.length > 0 && (
            <label className="row" style={{ alignItems: "flex-start" }}>
              <input type="checkbox" checked={dropDrafts} onChange={(e) => setDropDrafts(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--primary)" }} />
              <span>Xoá cùng các hồ sơ nháp: {names(preview.draftProfiles)}</span>
            </label>
          )}
          <label className="field"><span className="lbl">Mật khẩu hiện tại</span>
            <PasswordInput className="inp" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          <div className="row">
            <button type="button" className="btn btn-g" disabled={busy} onClick={() => { setPreview(null); setPassword(""); }}>Hủy</button>
            <button className="btn btn-no" disabled={busy || !password || (preview.draftProfiles.length > 0 && !dropDrafts)}><Trash2 className="ic" />Xoá vĩnh viễn</button>
          </div>
          {preview.draftProfiles.length > 0 && !dropDrafts && <p className="sub">Cần đồng ý xoá các hồ sơ nháp để tiếp tục.</p>}
        </form>
      )}
      {err && <div className="notice err" role="alert">{err}</div>}
    </section>
  );
}
