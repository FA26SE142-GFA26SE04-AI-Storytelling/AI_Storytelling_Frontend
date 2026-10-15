"use client";

import "./adaptive.css";
import { useState } from "react";
import { Check, Eye, Pencil, Sparkles, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { adaptiveService } from "@/app/services/adaptiveService";
import type { Recommendation, ReviewDecision } from "@/app/types/adaptive";
import type { ChildProfile } from "@/app/types/childProfile";
import type { WorkspaceId } from "@/app/components/shell/nav";
import { CATEGORY_LABEL, STATUS_LABEL, modifyOptions } from "@/app/lib/adaptiveRules";
import { fmtDate } from "@/app/lib/guardian";
import { FREE_TEXT_MAX } from "@/app/lib/storyRules";
import { loadMyRole, type MyRole } from "@/app/features/children/useMyRole";
import { STUDIO_PREFILL_KEY } from "@/app/features/home/WishItem";

export const DECISION_LABEL: Record<ReviewDecision, string> = { accept: "Đồng ý", modify: "Sửa rồi đồng ý", reject: "Từ chối", observe_more: "Theo dõi thêm" };

/** Bước 6.5.1 — Nhánh A cần Owner hoặc quyền "Sửa mức đọc" để quyết định cuối; Nhánh B mọi người giám sát hợp lệ đều quyết định được. */
export const hasFinalAuthority = (rec: Recommendation, role: MyRole) => rec.category === "content_personalization" || role.can("ApproveReadingLevel");

/**
 * Luồng 6 Bước 6.5–6.7 — một đề xuất: quan sát, bằng chứng, nhãn quyền và các quyết định
 * Đồng ý / Sửa / Từ chối / Theo dõi thêm. Người không có quyền quyết định cuối chỉ góp ý.
 */
export default function RecommendationCard({ rec, child, role, go, onChanged }: {
  rec: Recommendation;
  child: ChildProfile;
  role: MyRole;
  go: (id: WorkspaceId) => void;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [modifying, setModifying] = useState(false);
  const [level, setLevel] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const final = hasFinalAuthority(rec, role);
  const open = rec.status === "awaiting_review";
  const [tone, label] = STATUS_LABEL[rec.status];
  const cur = rec.currentState.readingLevel;
  const prop = rec.proposedChange.readingLevel;
  const options = cur && prop ? modifyOptions(cur, prop) : [];
  const topic = rec.appliedChange?.topic ?? rec.proposedChange.topic;

  const decide = async (decision: ReviewDecision) => {
    if (!user) return;
    setBusy(true);
    setNote(null);
    // Bước 6.6 — kiểm tra lại quyền ngay lúc bấm; nhãn trên thẻ có thể đã cũ.
    const fresh = await loadMyRole(child, user.id);
    const nowFinal = hasFinalAuthority(rec, fresh);
    if (nowFinal !== final) {
      setBusy(false);
      setNote({ ok: false, text: "Quyền của bạn đã thay đổi, vui lòng tải lại." });
      return;
    }
    const r = await adaptiveService.review(child.id, rec.id, { userId: user.id, name: user.fullName || user.email, hasFinalAuthority: nowFinal },
      { decision, modifiedValue: decision === "modify" ? level : null, reason });
    setBusy(false);
    setNote({ ok: r.success, text: r.success && r.data ? r.data.message : r.message });
    if (r.success) { setModifying(false); setReason(""); onChanged(); }
  };

  // Nhánh B — mở sẵn form tạo truyện của Studio với chủ đề được gợi ý.
  const createStory = () => {
    try { sessionStorage.setItem(STUDIO_PREFILL_KEY, JSON.stringify({ childId: child.id, source: "recommendation", topic: `Câu chuyện về ${topic}`, charactersText: "", setting: "" })); } catch { /* bỏ qua */ }
    go("studio");
  };

  return (
    <div className={`reco-card${open ? "" : " done"}`}>
      <div className="row">
        <Sparkles className="ic" style={{ color: "var(--primary)" }} />
        <b className="grow">{CATEGORY_LABEL[rec.category]}</b>
        <span className={`pill ${tone}`}>{label}</span>
      </div>
      <div className="reco-change">
        {cur && prop
          ? <>Mức {cur}<span className="arrow">→</span>Mức {rec.appliedChange?.readingLevel ?? prop}<small className="sub">(tương đương lớp {rec.appliedChange?.readingLevel ?? prop})</small></>
          : <span className="chip on">{topic}</span>}
      </div>
      <span>{rec.observation}</span>
      <details className="reco-evidence">
        <summary>Xem bằng chứng ({rec.evidence.length})</summary>
        <ul>{rec.evidence.map((e, i) => <li key={i}><span>{e.label}</span><b>{e.value}</b></li>)}</ul>
      </details>
      {rec.monitoring && <small className="sub">{rec.monitoring.note}</small>}
      {open && <span className={`pill ${final ? "ok" : "draft"}`} style={{ width: "fit-content" }}>{final ? "Bạn có thể quyết định cuối" : "Bạn chỉ có thể góp ý"}</span>}
      {rec.reviews.length > 0 && (
        <ul className="reco-reviews">
          {rec.reviews.map((v) => (
            <li key={v.id}>{v.reviewerName}: {DECISION_LABEL[v.decision]}{v.modifiedValue ? ` (mức ${v.modifiedValue})` : ""}{v.isFinal ? " — quyết định cuối" : " — góp ý"}{v.reason ? ` · “${v.reason}”` : ""}</li>
          ))}
        </ul>
      )}

      {open && (
        <>
          <input className="inp" maxLength={FREE_TEXT_MAX} value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)}
            placeholder={final ? "Lý do (không bắt buộc)" : "Góp ý của bạn (không bắt buộc)"} aria-label="Lý do" />
          {modifying && (
            <div className="seg" style={{ maxWidth: 360 }}>
              {options.map((n) => <button key={n} type="button" className={level === n ? "on" : ""} onClick={() => setLevel(n)}>Mức {n}</button>)}
            </div>
          )}
          <div className="reco-actions">
            {modifying ? (
              <>
                <button className="btn btn-ok" disabled={busy || level === null} onClick={() => void decide("modify")}><Check className="ic" />{final ? `Áp dụng mức ${level ?? "…"}` : `Góp ý: mức ${level ?? "…"}`}</button>
                <button className="btn btn-g" disabled={busy} onClick={() => setModifying(false)}>Huỷ</button>
              </>
            ) : (
              <>
                <button className="btn btn-ok" disabled={busy} onClick={() => void decide("accept")}><Check className="ic" />{final ? "Đồng ý" : "Góp ý: đồng ý"}</button>
                {options.length > 1 && <button className="btn btn-s" disabled={busy} onClick={() => { setModifying(true); setLevel(null); }}><Pencil className="ic" />Sửa</button>}
                <button className="btn btn-s" disabled={busy} onClick={() => void decide("observe_more")}><Eye className="ic" />Theo dõi thêm</button>
                <button className="btn btn-g" disabled={busy} onClick={() => void decide("reject")}><X className="ic" />Từ chối</button>
              </>
            )}
          </div>
          <small className="sub">AI chỉ đề xuất; hồ sơ của {child.nickname} chỉ đổi khi có quyết định. Tự hết hạn ngày {fmtDate(rec.expiresAt)}.</small>
        </>
      )}
      {rec.category === "content_personalization" && rec.status === "applied" && (
        <button className="btn btn-p" style={{ width: "fit-content" }} onClick={createStory}><Sparkles className="ic" />Tạo truyện với chủ đề này</button>
      )}
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
    </div>
  );
}
