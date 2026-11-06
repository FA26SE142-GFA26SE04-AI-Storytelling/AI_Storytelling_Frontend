"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import IconButton from "@/app/components/IconButton";
import SafeImage from "@/app/components/SafeImage";
import { confirmDialog } from "@/app/lib/confirm";
import { parentStorySummaryService } from "@/app/services/childReadingService";
import type { PagedParentSummaries } from "@/app/types/childReading";

/** Phần con kể lại cuối truyện: nghe lại bản ghi âm, xem những chỗ con còn thắc mắc, xoá khi cần. */
export default function StorySummaries({ childId, nickname }: { childId: number; nickname: string }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedParentSummaries | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPage(1); }, [childId]);
  const load = useCallback(async (signal?: AbortSignal) => {
    const r = await parentStorySummaryService.list(childId, page, 10, signal);
    if (signal?.aborted) return;
    setData(r.success ? r.data : null);
    setError(r.success ? "" : r.message);
  }, [childId, page]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const remove = async (summaryId: number, title: string) => {
    if (busy || !(await confirmDialog(`Xoá phần con kể lại về “${title}”? Bản ghi âm sẽ bị xoá và không khôi phục được.`))) return;
    setBusy(true);
    const r = await parentStorySummaryService.remove(childId, summaryId);
    setBusy(false);
    if (r.success) { setNote(r.message || "Đã xoá bản tóm tắt."); await load(); } else setError(r.message);
  };

  if (!data && !error) return null;
  if (data && !data.items.length && !error) return null;
  return (
    <div className="dash-block wide">
      <h3>{nickname} kể lại</h3>
      {error && <p className="notice err" role="alert" data-inline-notice>{error}</p>}
      {note && <p className="notice ok" role="status">{note}</p>}
      {data?.items.map((s) => (
        <article key={s.summaryId} className="summary-row">
          <div className="row">
            <b className="grow">{s.title}</b>
            <span className="sub">{new Date(s.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            <IconButton icon={Trash2} label={`Xoá phần kể lại về ${s.title}`} disabled={busy} onClick={() => void remove(s.summaryId, s.title)} />
          </div>
          {s.recordingUrl && <audio controls preload="none" src={s.recordingUrl} aria-label={`Nghe ${nickname} kể lại ${s.title}`} />}
          {s.flags.length > 0 && (
            <ul className="summary-flags">
              {s.flags.map((f) => (
                <li key={f.sceneId}>
                  <SafeImage src={f.illustrationUrl} alt="" />
                  <span><b>Cảnh {f.sceneIndex + 1}</b> {f.sceneText}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
      {data && data.totalPages > 1 && (
        <div className="row">
          <IconButton icon={ChevronLeft} label="Trang trước" disabled={!data.hasPreviousPage} onClick={() => setPage((p) => p - 1)} />
          <span className="sub">Trang {data.pageIndex}/{data.totalPages}</span>
          <IconButton icon={ChevronRight} label="Trang sau" disabled={!data.hasNextPage} onClick={() => setPage((p) => p + 1)} />
        </div>
      )}
    </div>
  );
}
