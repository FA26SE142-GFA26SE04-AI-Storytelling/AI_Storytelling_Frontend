"use client";

import "./AdminAuditLog.css";
import { useCallback, useEffect, useState } from "react";
import { Eye, Filter, RotateCcw } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import Pager from "@/app/components/Pager";
import { creatorAdminService } from "@/app/services/creatorAdminService";
import type { AdminAuditLog as AuditRow, AdminAuditLogQuery, AuditLogFilters } from "@/app/types/creatorAdmin";
import { Page, fmt } from "./ui";
import { auditActionLabel, auditEntityLabel } from "@/app/lib/auditLabels";
import { auditStateRows } from "./readableJson";

type Draft = { action: string; entityType: string; entityId: string; actorUserId: string; systemOnly: boolean; from: string; to: string };
const EMPTY: Draft = { action: "", entityType: "", entityId: "", actorUserId: "", systemOnly: false, from: "", to: "" };

/** Ngày (yyyy-MM-dd, giờ Việt Nam) → mốc UTC: đầu ngày cho "từ", cuối ngày cho "đến". */
const dayToUtc = (day: string, endOfDay: boolean) =>
  new Date(`${day}T${endOfDay ? "23:59:59.999" : "00:00:00"}+07:00`).toISOString();

const toQuery = (d: Draft, pageIndex: number): AdminAuditLogQuery => ({
  pageIndex, pageSize: 20,
  action: d.action || undefined,
  entityType: d.entityType || undefined,
  entityId: d.entityId ? Number(d.entityId) : undefined,
  actorUserId: !d.systemOnly && d.actorUserId ? Number(d.actorUserId) : undefined,
  systemOnly: d.systemOnly || undefined,
  from: d.from ? dayToUtc(d.from, false) : undefined,
  to: d.to ? dayToUtc(d.to, true) : undefined,
});

/** Action chưa có chữ tiếng Việt thì ô lọc vẫn hiện mã để Admin phân biệt được các mục. */
const actionOption = (action: string) => { const label = auditActionLabel(action, ""); return label === "Thay đổi khác" ? action : label; };

function AuditStates({ before, after }: { before: string | null; after: string | null }) {
  const rows = auditStateRows(before, after);
  if (!rows.length) return <p className="sub">Dòng này không lưu trạng thái trước/sau.</p>;
  return (
    <div className="audit-states">
      <table className="st-table stack-table">
        <thead><tr><th>Trường</th><th>Trước</th><th>Sau</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.field} className={r.changed ? "audit-changed" : undefined}>
              <td data-label="Trường"><b>{r.field}</b></td>
              <td data-label="Trước">{r.before}</td>
              <td data-label="Sau">{r.after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Luồng 5 — Administrator xem audit log toàn hệ thống: lọc theo người làm, action, đối tượng, thời gian. Chỉ đọc. */
export function AdminAuditLog() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [applied, setApplied] = useState<Draft>(EMPTY);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [paging, setPaging] = useState({ totalPages: 1, hasPrev: false, hasNext: false });
  const [filters, setFilters] = useState<AuditLogFilters>({ actions: [], entityTypes: [] });
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<AuditRow | null>(null);

  useEffect(() => {
    void creatorAdminService.auditFilters().then((r) => { if (r.success && r.data) setFilters(r.data); });
  }, []);

  const load = useCallback(async () => {
    const r = await creatorAdminService.auditLogs(toQuery(applied, page));
    setError(r.success ? "" : r.message);
    setRows(r.data?.items ?? []);
    setTotal(r.data?.totalCount ?? 0);
    setPaging({ totalPages: r.data?.totalPages ?? 1, hasPrev: r.data?.hasPreviousPage ?? false, hasNext: r.data?.hasNextPage ?? false });
  }, [applied, page]);
  useEffect(() => { void load(); }, [load]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const badRange = !!draft.from && !!draft.to && draft.to < draft.from;
  const actor = (r: AuditRow) => (r.actorUserId == null ? "Hệ thống" : r.actorFullName || r.actorUsername || `#${r.actorUserId}`);

  return (
    <Page title="Audit log">
      <form className="st-card" onSubmit={(e) => { e.preventDefault(); if (badRange) return; setPage(1); setApplied(draft); }}>
        <div className="audit-filters">
          <label className="field"><span className="lbl">Action</span>
            <select className="inp" value={draft.action} onChange={(e) => set("action", e.target.value)}>
              <option value="">Tất cả</option>
              {filters.actions.map((a) => <option key={a} value={a}>{actionOption(a)}</option>)}
            </select>
          </label>
          <label className="field"><span className="lbl">Loại đối tượng</span>
            <select className="inp" value={draft.entityType} onChange={(e) => set("entityType", e.target.value)}>
              <option value="">Tất cả</option>
              {filters.entityTypes.map((t) => <option key={t} value={t}>{auditEntityLabel(t) === "Mục khác" ? t : auditEntityLabel(t)}</option>)}
            </select>
          </label>
          <label className="field"><span className="lbl">Mã đối tượng</span>
            <input className="inp" inputMode="numeric" value={draft.entityId} onChange={(e) => set("entityId", e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="field"><span className="lbl">Mã người làm</span>
            <input className="inp" inputMode="numeric" disabled={draft.systemOnly} value={draft.actorUserId}
              onChange={(e) => set("actorUserId", e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="field"><span className="lbl">Từ ngày</span>
            <input className="inp" type="date" value={draft.from} onChange={(e) => set("from", e.target.value)} />
          </label>
          <label className="field"><span className="lbl">Đến ngày</span>
            <input className="inp" type="date" value={draft.to} onChange={(e) => set("to", e.target.value)} />
          </label>
        </div>
        <div className="row">
          <label className="row grow"><input type="checkbox" checked={draft.systemOnly} onChange={(e) => set("systemOnly", e.target.checked)} />Chỉ log do hệ thống tự ghi</label>
          {badRange && <span className="sub">Ngày kết thúc phải sau ngày bắt đầu.</span>}
          <button type="button" className="btn btn-g" onClick={() => { setDraft(EMPTY); setApplied(EMPTY); setPage(1); }}><RotateCcw className="ic" />Xoá lọc</button>
          <button type="submit" className="btn btn-p" disabled={badRange}><Filter className="ic" />Lọc</button>
        </div>
      </form>

      <div className="st-card st-scroll">
        {error && <div className="notice err" role="status">{error}</div>}
        <div className="row"><h3 className="grow">Nhật ký thao tác</h3><span className="sub">{total.toLocaleString("vi-VN")} dòng</span></div>
        <table className="st-table stack-table">
          <thead><tr><th>Thời điểm</th><th>Người làm</th><th>Action</th><th>Đối tượng</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td data-label="Thời điểm">{fmt(r.occurredAt)}</td>
                <td data-label="Người làm">{actor(r)}{r.actorRole && <><br /><small className="sub">{r.actorRole}</small></>}</td>
                <td data-label="Action">{actionOption(r.action)}</td>
                <td data-label="Đối tượng">{auditEntityLabel(r.entityType)} #{r.entityId}</td>
                <td data-label=""><button className="btn btn-g" onClick={() => setDetail(r)}><Eye className="ic" />Chi tiết</button></td>
              </tr>
            ))}
            {rows.length === 0 && !error && <tr><td colSpan={5} className="sub">Không có dòng nào khớp bộ lọc.</td></tr>}
          </tbody>
        </table>
        <Pager page={page} totalPages={paging.totalPages} hasPrev={paging.hasPrev} hasNext={paging.hasNext} onPage={setPage} />
      </div>

      {detail && <Dialog title={`${actionOption(detail.action)} · ${auditEntityLabel(detail.entityType)} #${detail.entityId}`} onClose={() => setDetail(null)} wide>
        <p className="sub">{fmt(detail.occurredAt)} · {actor(detail)}</p>
        <AuditStates before={detail.beforeState} after={detail.afterState} />
      </Dialog>}
    </Page>
  );
}
