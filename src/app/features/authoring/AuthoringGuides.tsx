"use client";
import { useEffect, useState } from "react";
import type * as B from "@/app/types/backendContracts";
import { authoringGuideService as service } from "@/app/services/authoringGuideService";

export default function AuthoringGuides({
  onInsert,
}: {
  onInsert: (text: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [guides, setGuides] = useState<B.GuidePage | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<B.AuthoringGuide | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    void service
      .get(page, undefined, undefined, controller.signal)
      .then((r) => {
        if (alive) {
          setGuides(r.data);
          setError(r.success ? "" : r.message);
        }
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [page]);

  const insert = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const r = await service.render(selected.id, { values });
    setBusy(false);
    if (r.success && r.data?.isPlainText) onInsert(r.data.text);
    else setError(r.message || "Không nhận được gợi ý văn bản hợp lệ.");
  };

  return (
    <details className="pa-guides-details" open>
      <summary>Câu hỏi gợi ý và hướng dẫn soạn</summary>
      <p className="sub">
        Nội dung biên tập sẵn, dùng làm khung tham khảo. Chọn một mẫu bên dưới
        để điền thông tin và chèn nhanh vào bài viết.
      </p>
      {error && <p className="notice err">{error}</p>}
      <div className="pa-wrap">
        {guides?.items.map((g) => (
          <button
            type="button"
            className={`btn pa-guide-chip ${selected?.id === g.id ? "on" : ""}`}
            key={g.id}
            onClick={() => {
              setSelected((prev) => (prev?.id === g.id ? null : g));
              setValues({});
            }}
          >
            {g.title}
          </button>
        ))}
      </div>
      {selected && (
        <div className="sec pa-guide-detail">
          <p className="pa-guide-inst">{selected.instruction}</p>
          {selected.example && (
            <blockquote className="pa-guide-quote">
              {selected.example}
            </blockquote>
          )}
          {selected.placeholderDefinitions.map((p) => (
            <label className="field" key={p.key}>
              <span className="lbl">{p.label ?? p.key}</span>
              <input
                className="inp"
                placeholder={p.hint ?? undefined}
                value={values[p.key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [p.key]: e.target.value }))
                }
              />
            </label>
          ))}
          <div className="pa-actions">
            <button
              type="button"
              className="btn btn-p"
              disabled={busy}
              onClick={() => void insert()}
            >
              Chèn gợi ý
            </button>
          </div>
        </div>
      )}
      <div className="pa-actions pa-guide-pager">
        <button
          type="button"
          className="btn btn-g"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Gợi ý trước
        </button>
        <button
          type="button"
          className="btn btn-g"
          disabled={!guides || page * guides.pageSize >= guides.totalCount}
          onClick={() => setPage((p) => p + 1)}
        >
          Gợi ý tiếp
        </button>
      </div>
    </details>
  );
}
