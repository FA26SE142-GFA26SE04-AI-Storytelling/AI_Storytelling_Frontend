"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Crown, LogOut, Mail, RefreshCw, UserMinus, X } from "lucide-react";
import { supervisionService as api } from "@/app/services/supervisionService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { Invitation, OwnershipTransfer, Permission, PermissionRequest, SupervisionRelationship } from "@/app/types/supervision";
import { PERMISSIONS, fmtDate } from "@/app/lib/guardian";

type Data = {
  rels: SupervisionRelationship[];
  perms: Record<number, string[]>;
  requests: PermissionRequest[];
  invitations: Invitation[];
  transfers: OwnershipTransfer[];
};

const INV_STATUS: Record<string, { label: string; tone: string }> = {
  Pending: { label: "Chưa nhận", tone: "wait" },
  Accepted: { label: "Đã nhận", tone: "ok" },
  Rejected: { label: "Bị từ chối", tone: "flag" },
  Expired: { label: "Hết hạn", tone: "draft" },
  Revoked: { label: "Đã hủy", tone: "draft" },
};
const permLabel = (p: string) => PERMISSIONS.find((x) => x.id === p)?.label ?? p;

/** Bước 1.5–1.7b, Mục 3 Bước G. */
export default function SupervisorsTab({ child, meId, onLeft }: { child: ChildProfile; meId: number; onLeft: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [askPerm, setAskPerm] = useState<Permission | "">("");

  const load = useCallback(async () => {
    const rels = (await api.listSupervisors(child.id)).data ?? [];
    const amOwner = rels.some((r) => r.supervisorUserId === meId && r.supervisorRole === "Owner");
    const others = rels.filter((r) => r.supervisorRole !== "Owner");
    const visible = amOwner ? others : others.filter((r) => r.supervisorUserId === meId);
    const [permList, reqList, inv, tr] = await Promise.all([
      Promise.all(visible.map((r) => api.listPermissions(r.id))),
      Promise.all(visible.map((r) => api.listPermissionRequests(r.id))),
      amOwner ? api.listInvitations(child.id) : Promise.resolve({ data: [] as Invitation[] }),
      api.listOwnershipTransfers(child.id),
    ]);
    setData({
      rels,
      perms: Object.fromEntries(visible.map((r, i) => [r.id, permList[i].data ?? []])),
      requests: reqList.flatMap((r) => r.data ?? []),
      invitations: inv.data ?? [],
      transfers: tr.data ?? [],
    });
  }, [child.id, meId]);

  useEffect(() => { setData(null); void load(); }, [load]);

  const act = async (fn: () => Promise<{ success: boolean; message: string }>, okText: string, after?: () => void) => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    const r = await fn();
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? okText : r.message || "Không thực hiện được." });
    if (r.success) { after?.(); await load(); }
  };

  if (!data) return <p className="sub">Đang tải người giám sát…</p>;

  const me = data.rels.find((r) => r.supervisorUserId === meId);
  const isOwner = me?.supervisorRole === "Owner";
  const others = data.rels.filter((r) => r.id !== me?.id);
  const name = (r: SupervisionRelationship) => (r.supervisorUserId === meId ? "Bạn" : `Người giám sát #${r.supervisorUserId}`);
  const pendingReqs = data.requests.filter((r) => r.status === "Pending");
  const pendingTransfers = data.transfers.filter((t) => t.status === "Pending");
  const myPerms = me && !isOwner ? data.perms[me.id] ?? [] : [];
  const missing = PERMISSIONS.filter((p) => !myPerms.includes(p.id) && !pendingReqs.some((r) => r.supervisionRelationshipId === me?.id && r.permissions.includes(p.id)));

  const togglePerm = (relId: number, p: Permission, has: boolean) =>
    act(() => (has ? api.revokePermission(relId, p) : api.grantPermission(relId, p)), has ? `Đã thu hồi quyền "${permLabel(p)}".` : `Đã cấp quyền "${permLabel(p)}".`);

  const invite = () => {
    const target = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(target)) { setNote({ ok: false, text: "Email chưa đúng định dạng." }); return; }
    void act(() => api.createInvitation(child.id, target), `Đã gửi lời mời tới ${target}. Mã có hiệu lực 7 ngày.`, () => setEmail(""));
  };

  const copy = (code: string) => { void navigator.clipboard?.writeText(code); setNote({ ok: true, text: "Đã sao chép mã mời." }); };

  return (
    <div className="sec" style={{ gap: 26, maxWidth: 680 }}>
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
      {/* Đề nghị chuyển quyền Owner gửi tới mình */}
      {pendingTransfers.filter((t) => t.targetSupervisorUserId === meId).map((t) => (
        <div key={t.id} className="notice ok row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <span><Crown className="ic" /> Người quản lý chính đề nghị chuyển quyền Owner của {child.nickname} cho bạn.</span>
          <span className="row">
            <button className="btn btn-ok" disabled={busy} onClick={() => void act(() => api.answerOwnershipTransfer(t.id, true), "Bạn đã là người quản lý chính.")}>Nhận quyền</button>
            <button className="btn btn-s" disabled={busy} onClick={() => void act(() => api.answerOwnershipTransfer(t.id, false), "Đã từ chối.")}>Từ chối</button>
          </span>
        </div>
      ))}

      <section className="sec" style={{ gap: 10 }}>
        <h3 className="display" style={{ margin: 0 }}>Người giám sát</h3>
        <p className="sub">Bố/mẹ còn lại hoặc người thân cùng theo dõi {child.nickname}. Người được mời nhận sẵn 4 quyền cơ bản; bạn có thể cấp thêm hoặc thu hồi bất kỳ lúc nào.</p>
        {data.rels.map((r) => {
          const extra = r.supervisorRole !== "Owner";
          const perms = data.perms[r.id] ?? [];
          const canManage = isOwner && extra;
          const transfer = pendingTransfers.find((t) => t.targetSupervisorUserId === r.supervisorUserId);
          return (
            <div key={r.id} className="sup">
              <div className="row">
                <span className="av">{r.supervisorUserId === meId ? "B" : "#"}</span>
                <b className="grow">{name(r)}</b>
                <span className={`pill ${extra ? "draft" : "ai"}`}>{extra ? "Người giám sát" : "Quản lý chính"}</span>
              </div>
              {extra && (canManage || r.id === me?.id) && (
                <div className="perm-grid">
                  {PERMISSIONS.map((p) => {
                    const has = perms.includes(p.id);
                    return (
                      <label key={p.id} className={`perm${has ? " on" : ""}`} title={p.hint}>
                        <input type="checkbox" checked={has} disabled={!canManage || busy} onChange={() => void togglePerm(r.id, p.id, has)} />
                        <span><b>{p.label}</b><small>{p.hint}</small></span>
                      </label>
                    );
                  })}
                </div>
              )}
              {canManage && (
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  {transfer
                    ? <button className="btn btn-s" disabled={busy} onClick={() => void act(() => api.cancelOwnershipTransfer(transfer.id), "Đã huỷ đề nghị chuyển quyền.")}>
                      <X className="ic" />Huỷ đề nghị chuyển quyền</button>
                    : <button className="btn btn-s" disabled={busy} onClick={() => void act(() => api.requestOwnershipTransfer(child.id, r.supervisorUserId), "Đã gửi đề nghị. Quyền Owner chỉ chuyển khi người kia đồng ý.")}>
                      <Crown className="ic" />Chuyển quyền Owner</button>}
                  <button className="btn btn-no" disabled={busy} onClick={() => { if (confirm(`Gỡ ${name(r)} khỏi hồ sơ của ${child.nickname}?`)) void act(() => api.revokeSupervisor(r.id), "Đã gỡ người giám sát. Người này mất quyền ngay."); }}>
                    <UserMinus className="ic" />Gỡ</button>
                </div>
              )}
            </div>
          );
        })}
        {others.length === 0 && isOwner && <p className="sub">Chưa có người giám sát nào khác.</p>}
      </section>

      {/* Owner: yêu cầu cấp quyền đang chờ */}
      {isOwner && pendingReqs.length > 0 && (
        <section className="sec" style={{ gap: 8 }}>
          <h3 className="display" style={{ margin: 0 }}>Yêu cầu cấp quyền</h3>
          {pendingReqs.map((q) => (
            <div key={q.id} className="ck">
              <span className="grow">Người giám sát #{q.requesterUserId} xin quyền <b>{q.permissions.map(permLabel).join(", ")}</b><small style={{ display: "block" }}>{fmtDate(q.createdAt)}</small></span>
              <button className="btn btn-ok" disabled={busy} onClick={() => void act(() => api.answerPermissionRequest(q.id, "accept"), "Đã cấp quyền.")}>Đồng ý</button>
              <button className="btn btn-s" disabled={busy} onClick={() => void act(() => api.answerPermissionRequest(q.id, "reject"), "Đã từ chối yêu cầu.")}>Từ chối</button>
            </div>
          ))}
        </section>
      )}

      {/* Additional Supervisor: xin thêm quyền, rời hồ sơ */}
      {me && !isOwner && (
        <section className="sec" style={{ gap: 10 }}>
          <h3 className="display" style={{ margin: 0 }}>Quyền của bạn</h3>
          {pendingReqs.filter((q) => q.supervisionRelationshipId === me.id).map((q) => (
            <div key={q.id} className="ck">
              <span className="grow">Đang chờ duyệt: <b>{q.permissions.map(permLabel).join(", ")}</b></span>
              <button className="btn btn-s" disabled={busy} onClick={() => void act(() => api.answerPermissionRequest(q.id, "cancel"), "Đã hủy yêu cầu.")}><X className="ic" />Hủy</button>
            </div>
          ))}
          {missing.length > 0 && (
            <div className="row">
              <select className="inp" value={askPerm} onChange={(e) => setAskPerm(e.target.value as Permission | "")} aria-label="Quyền muốn xin">
                <option value="">Chọn quyền muốn xin…</option>
                {missing.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <button className="btn btn-s" disabled={!askPerm || busy} onClick={() => askPerm && void act(() => api.requestPermission(me.id, askPerm), "Đã gửi yêu cầu tới người quản lý chính.", () => setAskPerm(""))}>Xin quyền</button>
            </div>
          )}
          <button className="btn btn-no" style={{ width: "fit-content" }} disabled={busy} onClick={() => { if (confirm(`Rời khỏi hồ sơ của ${child.nickname}? Bạn sẽ mất quyền xem ngay.`)) void act(() => api.revokeSupervisor(me.id), "Bạn đã rời hồ sơ.", onLeft); }}>
            <LogOut className="ic" />Rời hồ sơ</button>
        </section>
      )}

      {/* Owner: mời người giám sát */}
      {isOwner && (
        <section className="sec" style={{ gap: 10 }}>
          <h3 className="display" style={{ margin: 0 }}>Mời người giám sát</h3>
          <div className="row">
            <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email người được mời" aria-label="Email người được mời"
              onKeyDown={(e) => { if (e.key === "Enter") invite(); }} />
            <button className="btn btn-p" disabled={busy || !email.trim()} onClick={invite}><Mail className="ic" />Gửi lời mời</button>
          </div>
          <p className="sub">Người được mời đăng nhập tài khoản phụ huynh, nhập mã mời ở mục &quot;Nhập mã mời&quot; rồi xác thực bằng mã gửi tới email được mời. Mã chỉ dùng được một lần.</p>
          {data.invitations.length > 0 && (
            <table className="inv">
              <thead><tr><th>Mã mời</th><th>Trạng thái</th><th>Hết hạn</th><th /></tr></thead>
              <tbody>
                {data.invitations.slice().reverse().map((i) => {
                  const st = INV_STATUS[i.status] ?? { label: i.status, tone: "draft" };
                  return (
                    <tr key={i.id}>
                      <td><code>{i.invitationCode}</code></td>
                      <td><span className={`pill ${st.tone}`}>{st.label}</span></td>
                      <td>{fmtDate(i.expiresAt)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {i.status === "Pending" && <>
                          <button className="btn btn-g" aria-label="Sao chép mã" onClick={() => copy(i.invitationCode)}><Copy className="ic" /></button>
                          <button className="btn btn-g" disabled={busy} onClick={() => void act(() => api.cancelInvitation(i.id), "Đã hủy lời mời.")}>Hủy</button>
                        </>}
                        {(i.status === "Pending" || i.status === "Expired") && (
                          <button className="btn btn-g" disabled={busy} title="Cấp mã mới và gửi lại email; mã cũ hết hiệu lực"
                            onClick={() => void act(() => api.regenerateInvitation(i.id), "Đã cấp lại mã mời và gửi lại email.")}><RefreshCw className="ic" />Cấp lại mã</button>
                        )}
                        {i.status === "Revoked" && <span className="sub">Gửi lời mời mới nếu cần</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      <div className="row">
        <button className="btn btn-g" onClick={() => { setNote(null); void load(); }}><RefreshCw className="ic" />Tải lại</button>
      </div>
    </div>
  );
}
