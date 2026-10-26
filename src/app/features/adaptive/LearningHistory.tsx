"use client";

import "./adaptive.css";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { adaptiveService } from "@/app/services/adaptiveService";
import type { ProfileVersion, Recommendation } from "@/app/types/adaptive";
import type { ChildProfile } from "@/app/types/childProfile";
import { CATEGORY_LABEL, STATUS_LABEL, configChange } from "@/app/lib/adaptiveRules";
import { fmtDateTime } from "@/app/lib/guardian";

/**
 * Luồng 6 Bước 6.7–6.8, Luồng 1 Bước 1.3 — lịch sử phiên bản hồ sơ học tập (từ đề xuất hoặc sửa thủ công)
 * và các đề xuất đã xử lý. Muốn hoàn tác một thay đổi, sửa lại mức đọc ở trên (ghi lịch sử nguồn "thủ công").
 */
export default function LearningHistory({ child, refreshKey }: { child: ChildProfile; refreshKey: number }) {
  const [error,setError]=useState('');
  const [versions, setVersions] = useState<ProfileVersion[] | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    let alive = true;
    void Promise.all([adaptiveService.versions(child.id), adaptiveService.recommendations(child.id)]).then(([v, r]) => {
      if (!alive) return;
      setError(!v.success?v.message:!r.success?r.message:'');
      setVersions(v.data ?? []);
      setRecs((r.data ?? []).filter((x) => x.status !== "awaiting_review"));
    });
    return () => { alive = false; };
  }, [child.id, refreshKey]);

  return (
    <section className="sec" style={{ gap: 8, marginTop: 12 }}>
      {error&&<p className="notice" role="status">{error}</p>}
      <h3 className="display row" style={{ margin: 0 }}><History className="ic" />Lịch sử thay đổi mức đọc và chế độ đọc</h3>
      {versions === null && <p className="sub">Đang tải…</p>}
      {versions?.length === 0 && <p className="sub">Chưa có thay đổi nào sau khi hồ sơ được kích hoạt.</p>}
      {versions?.map((v) => (
        <div key={v.id} className="version-row">
          <b>{configChange(v.previousConfig, v.newConfig)}</b>
          <span className="grow sub">{v.source === "recommendation" ? "Theo đề xuất" : "Sửa thủ công"} · {v.appliedByName} · {fmtDateTime(v.createdAt)}</span>
          {v.versionStatus === "active_version" && <span className="pill ok">Đang dùng</span>}
        </div>
      ))}

      {recs.length > 0 && (
        <>
          <h3 className="display" style={{ margin: "12px 0 0" }}>Đề xuất đã xử lý</h3>
          {recs.map((r) => {
            const [tone, label] = STATUS_LABEL[r.status];
            const change = r.proposedChange.readingLevel ? `Mức ${r.currentState.readingLevel} → Mức ${r.appliedChange?.readingLevel ?? r.proposedChange.readingLevel}` : `Chủ đề “${r.proposedChange.topic}”`;
            return (
              <div key={r.id} className="version-row">
                <span className="grow"><b>{CATEGORY_LABEL[r.category]}: {change}</b>
                  <small className="sub" style={{ display: "block" }}>{r.decidedByName ? `${r.decidedByName} · ${fmtDateTime(r.decidedAt)}` : fmtDateTime(r.createdAt)}{r.monitoring ? ` · ${r.monitoring.note}` : ""}</small></span>
                <span className={`pill ${tone}`}>{label}</span>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}
