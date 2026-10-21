"use client";

import "@/app/features/review/review-tools.css";
import { useEffect, useState } from "react";
import { CircleAlert, Flag, Send, X } from "lucide-react";
import { guardianService } from "@/app/services/guardianService";
import { storyService } from "@/app/services/storyService";
import type { ReportReason } from "@/app/types/progress";
import type { StoryCard } from "@/app/lib/storyView";
import { FREE_TEXT_MAX, detectPii } from "@/app/lib/storyRules";

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dlg">
        <div className="row"><b className="display grow" style={{ fontSize: 18 }}>{title}</b><button className="btn btn-g" aria-label="Đóng" onClick={onClose}><X className="ic" /></button></div>
        {children}
      </div>
    </div>
  );
}

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "safety_concern", label: "Không an toàn cho trẻ" },
  { id: "inappropriate", label: "Nội dung không phù hợp" },
  { id: "wrong_age_band", label: "Không hợp lứa tuổi" },
  { id: "copyright", label: "Vi phạm bản quyền" },
  { id: "cultural", label: "Không phù hợp văn hoá" },
  { id: "other", label: "Lý do khác" },
];

/** Luồng 4 Bước 4.6 — báo cáo truyện có vấn đề; không tự lưu trữ, chuyển tới hàng đợi kiểm duyệt. */
export function ReportDialog({ story, onClose, onDone }: { story: StoryCard; onClose: () => void; onDone: (msg: string) => void }) {
  const [reason, setReason] = useState<ReportReason>("safety_concern");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    const r = await guardianService.reportStory(story.id, reason, desc);
    setBusy(false);
    if (r.success) onDone(r.message || "Đã gửi báo cáo."); else setErr(r.message);
  };
  return (
    <Shell title={`Báo cáo “${story.title}”`} onClose={onClose}>
      <p className="sub">Kiểm duyệt viên của nền tảng sẽ xem xét. Báo cáo không tự ẩn truyện; nếu là truyện riêng của bé, bạn có thể tự lưu trữ ngay.</p>
      <div className="sec" style={{ gap: 6 }}>
        {REASONS.map((x) => (
          <label key={x.id} className={`opt${reason === x.id ? " on" : ""}`}>
            <input type="radio" name="reason" checked={reason === x.id} onChange={() => setReason(x.id)} /><span><b>{x.label}</b></span>
          </label>
        ))}
      </div>
      <textarea className="inp" rows={3} maxLength={FREE_TEXT_MAX * 2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả thêm (không bắt buộc)" aria-label="Mô tả" />
      {err && <div className="notice err" role="alert">{err}</div>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-g" onClick={onClose}>Hủy</button>
        <button className="btn btn-no" disabled={busy} onClick={() => void submit()}><Flag className="ic" />Gửi báo cáo</button>
      </div>
    </Shell>
  );
}

/**
 * Luồng 4 Bước 4.7 — nộp truyện lên Community Story Library.
 * Chặn khi còn thông tin cá nhân; truyện nhập sẵn phải là tác phẩm của chính phụ huynh (BR-2.39).
 */
export function CommunityDialog({ story, nickname, onClose, onDone }: { story: StoryCard; nickname: string; onClose: () => void; onDone: (msg: string) => void }) {
  const [pii, setPii] = useState<string[] | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [noPii, setNoPii] = useState(false);
  const [ownWork, setOwnWork] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Backend kiểm tra cả truyện (cảnh, từ vựng, câu đố…) và các điều kiện khác; chế độ mẫu thì tự dò trong nội dung.
  useEffect(() => {
    let alive = true;
    void guardianService.communityCheck(story.id, !story.fromAi).then(async (c) => {
      if (!alive) return;
      if (c.data) {
        setPii(c.data.piiFindings.map((f) => `${f.location}: “${f.excerpt}”`));
        // Thiếu khai bản quyền được xử lý bằng ô đánh dấu bên dưới, không cần nhắc lại.
        setBlockers(c.data.blockers.filter((b) => b.code !== "pii_found" && b.code !== "copyright_required").map((b) => b.message));
        return;
      }
      if (!c.success) { setErr(c.message); setPii([]); return; }
      const r = await storyService.getStoryById(story.id);
      const text = [r.data?.title, r.data?.description, r.data?.content].filter(Boolean).join("\n");
      if (alive) setPii([...new Set(detectPii(text, nickname).map((h) => `${h.kind}: “${h.text}”`))]);
    });
    return () => { alive = false; };
  }, [story.id, story.fromAi, nickname]);

  const submit = async () => {
    setBusy(true);
    const r = await guardianService.submitCommunity(story.id, !story.fromAi);
    setBusy(false);
    if (r.success) onDone(r.message || "Đã nộp."); else setErr(r.message);
  };

  const blocked = !!pii?.length || blockers.length > 0;
  return (
    <Shell title="Nộp lên thư viện cộng đồng" onClose={onClose}>
      <p className="sub">Truyện được kiểm duyệt viên duyệt rồi mới hiện cho mọi bé trên nền tảng, với tác giả “Cộng đồng”. Bản được nộp là bản hiện tại; sửa truyện sau đó không đổi bản trong thư viện.</p>
      {pii === null && <p className="sub">Đang kiểm tra thông tin cá nhân…</p>}
      {blockers.length > 0 && (
        <div className="notice err" role="alert">
          <CircleAlert className="ic" /> Truyện chưa nộp được:
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      )}
      {!!pii?.length && (
        <div className="notice err" role="alert">
          <CircleAlert className="ic" /> Truyện còn thông tin có thể nhận ra bé hoặc gia đình, chưa nộp được. Hãy sửa thành bản mới rồi nộp lại:
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{pii!.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      {!story.fromAi && (
        <label className="row" style={{ alignItems: "flex-start", fontSize: 13 }}>
          <input type="checkbox" checked={ownWork} onChange={(e) => setOwnWork(e.target.checked)} style={{ marginTop: 3 }} />
          <span>Đây là tác phẩm do tôi sáng tác. (Truyện chỉ có quyền dùng trong gia đình thì không nộp được.)</span>
        </label>
      )}
      <label className="row" style={{ alignItems: "flex-start", fontSize: 13 }}>
        <input type="checkbox" checked={noPii} onChange={(e) => setNoPii(e.target.checked)} style={{ marginTop: 3 }} />
        <span>Tôi xác nhận truyện không chứa thông tin định danh của bé hay gia đình.</span>
      </label>
      {err && <div className="notice err" role="alert">{err}</div>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-g" onClick={onClose}>Hủy</button>
        <button className="btn btn-p" disabled={busy || pii === null || blocked || !noPii || (!story.fromAi && !ownWork)} onClick={() => void submit()}><Send className="ic" />Nộp</button>
      </div>
    </Shell>
  );
}
