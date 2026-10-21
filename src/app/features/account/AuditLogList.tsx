"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, AuditLogEntry } from "@/app/types/auth";
import type { PagedResult } from "@/app/types/story";

/** "ChildProfileArchived" → "Child profile archived": mã hành động của backend, tách chữ cho dễ đọc. */
const readable = (code: string) => code.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

/** Danh sách nhật ký hoạt động có phân trang (tài khoản hoặc hồ sơ bé). */
export default function AuditLogList({ load }: { load: (pageIndex: number) => Promise<ApiResponse<PagedResult<AuditLogEntry>>> }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResult<AuditLogEntry> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void load(page).then((r) => { if (!alive) return; setData(r.data); setError(r.success ? null : r.message); });
    return () => { alive = false; };
  }, [load, page]);

  if (error) return <div className="notice err">{error}</div>;
  if (!data) return <p className="sub">Đang tải…</p>;
  if (data.items.length === 0) return <p className="sub">Chưa có hoạt động nào.</p>;
  const pages = Math.max(1, Math.ceil(data.totalCount / (data.pageSize || 20)));
  return (
    <>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
        {data.items.map((e) => (
          <li key={e.id}><b>{readable(e.action)}</b> <small className="sub">· {new Date(e.occurredAt).toLocaleString("vi-VN")}</small></li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-g" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button>
          <small className="sub">Trang {page}/{pages}</small>
          <button className="btn btn-g" disabled={page >= pages} onClick={() => setPage(page + 1)}>Sau</button>
        </div>
      )}
    </>
  );
}
