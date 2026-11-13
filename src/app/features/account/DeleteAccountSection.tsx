"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import PasswordInput from "@/app/components/PasswordInput";
import { useAuth } from "@/app/context/AuthContext";
import { accountService } from "@/app/services/accountService";
import type { DeleteAccountPreview } from "@/app/types/auth";

const CHILD_STATUS_LABEL: Record<string, string> = {
  Draft: "Chưa kích hoạt",
  Active: "Đang hoạt động",
  Suspended: "Tạm dừng",
  Archived: "Đã lưu trữ",
};

/** Xoá tài khoản: các hồ sơ bé còn lại sẽ bị xoá vĩnh viễn cùng tài khoản khi người dùng tick xác nhận. */
export default function DeleteAccountSection() {
  const { logout } = useAuth();
  const [preview, setPreview] = useState<DeleteAccountPreview | null>(null);
  const [password, setPassword] = useState("");
  const [confirmChildren, setConfirmChildren] = useState(false);
  const [busy, setBusy] = useState(false);

  const childProfiles = preview?.childProfiles ?? [];

  const check = async () => {
    setBusy(true);
    const r = await accountService.getDeleteAccountPreview();
    setBusy(false);
    if (r.success && r.data) {
      setPreview({ childProfiles: r.data.childProfiles ?? [] });
    } else {
      showToast(r.message, "err");
    }
  };

  const remove = async (e: FormEvent) => {
    e.preventDefault();
    if (!await confirmDialog("Xoá tài khoản? Thao tác này không hoàn tác được.")) return;
    setBusy(true);
    const r = await accountService.deleteAccount(password, childProfiles.length > 0 && confirmChildren);
    if (r.success) {
      await logout();
    } else {
      showToast(r.message, "err");
      setBusy(false);
    }
  };

  return (
    <section className="acc-card" style={{ gap: 10 }}>
      <h3 className="display" style={{ margin: 0 }}>Xoá tài khoản</h3>
      {!preview && (
        <button className="btn btn-no" style={{ width: "fit-content" }} disabled={busy} onClick={() => void check()}>
          <Trash2 className="ic" />Xoá
        </button>
      )}
      {preview && (
        <form className="sec" style={{ gap: 10 }} onSubmit={remove}>
          {childProfiles.length > 0 && (
            <>
              <p style={{ margin: 0 }}>Các hồ sơ bé sau sẽ bị xoá vĩnh viễn cùng tài khoản:</p>
              <ul>
                {childProfiles.map((p) => (
                  <li key={p.id}>
                    {p.nickname} ({CHILD_STATUS_LABEL[p.status] ?? p.status})
                  </li>
                ))}
              </ul>
              <label className="row" style={{ alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={confirmChildren}
                  onChange={(e) => setConfirmChildren(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "var(--primary)" }}
                />
                <span>Xoá cả {childProfiles.length} hồ sơ bé</span>
              </label>
            </>
          )}
          <label className="field">
            <span className="lbl">Mật khẩu hiện tại</span>
            <PasswordInput
              className="inp"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <div className="row">
            <button
              type="button"
              className="btn btn-g"
              disabled={busy}
              onClick={() => {
                setPreview(null);
                setPassword("");
                setConfirmChildren(false);
              }}
            >
              Hủy
            </button>
            <button
              className="btn btn-no"
              disabled={busy || !password || (childProfiles.length > 0 && !confirmChildren)}
            >
              <Trash2 className="ic" />Xoá
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
