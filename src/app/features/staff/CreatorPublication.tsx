"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranchPlus, Send, Trash2, Undo2, X } from "lucide-react";
import { creatorService } from "@/app/services/creatorService";
import type { CreatorDraft, CreatorPublication as Publication } from "@/app/types/creator";
import { Notice, useAction } from "./ui";

const REVIEW: Record<string, [string, string]> = {
  None: ["draft", "Chưa gửi duyệt"], Pending: ["wait", "Đang chờ duyệt"], Approved: ["ok", "Đã duyệt"],
  ChangesRequested: ["wait", "Moderator yêu cầu sửa"], Rejected: ["flag", "Bị từ chối"],
};

/**
 * Luồng 5 CR3–CR4 — phát hành truyện mẫu lên Thư viện chung.
 * Gửi duyệt khoá phiên bản hiện tại; muốn sửa sau khi rút / bị trả về / được gỡ thì tạo bản sửa mới.
 */
export default function CreatorPublication({ story, onClose, onChanged }: { story: CreatorDraft; onClose: () => void; onChanged: () => void }) {
  const [pub, setPub] = useState<Publication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removal, setRemoval] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await creatorService.publication(story.storyId);
    setPub(r.ok ? r.data : null);
    setError(r.ok ? null : r.message);
  }, [story.storyId]);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(async () => { await load(); onChanged(); });

  // useAction cần { success, message }; creatorService trả { ok, message }.
  const act = (fn: () => Promise<{ ok: boolean; message: string }>, okText: string) =>
    run(async () => { const r = await fn(); return { success: r.ok, message: r.message }; }, okText);

  const open = pub?.openItemId != null;
  const reviewOpen = open && pub?.openItemType === "PublicStoryReview";
  const removalOpen = open && pub?.openItemType === "PublicStoryRemoval";
  const [tone, label] = pub ? REVIEW[pub.reviewStatus] ?? ["draft", pub.reviewStatus] : ["draft", ""];

  return (
    <div className="st-card">
      <div className="row"><h3 className="grow">Phát hành “{story.title || "Truyện chưa đặt tên"}”</h3><button className="btn btn-g" aria-label="Đóng" onClick={onClose}><X className="ic" /></button></div>
      <Notice note={note} />
      {error && <div className="notice err">{error}</div>}
      {pub && (
        <>
          <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
            <span className={`pill ${tone}`}>{label}</span>
            {pub.isPublished && <span className="pill ok">Đang công khai</span>}
            {reviewOpen && <span className="pill wait">{pub.openItemStatus === "Claimed" ? "Moderator đang xem" : "Đang trong hàng đợi"}</span>}
            {removalOpen && <span className="pill wait">Đang chờ xét yêu cầu gỡ</span>}
            <small className="sub">Phiên bản #{pub.versionId}{story.status ? ` · trạng thái truyện: ${story.status}` : ""}</small>
          </div>

          {/* Chưa gửi: gửi duyệt phiên bản hiện tại. */}
          {!pub.isPublished && !open && pub.reviewStatus === "None" && (
            <>
              <p className="sub" style={{ margin: 0 }}>Gửi phiên bản hiện tại cho Moderator. Từ lúc gửi, phiên bản bị khoá không sửa được. Truyện cần ở trạng thái sẵn sàng (đã có minh hoạ, giọng đọc) mới gửi được.</p>
              <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy} onClick={() => void act(() => creatorService.submit(story.storyId, pub.versionId), "Đã gửi duyệt.")}><Send className="ic" />Gửi duyệt</button>
            </>
          )}

          {reviewOpen && (pub.openItemStatus === "Pending"
            ? <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy} onClick={() => void act(() => creatorService.withdraw(pub.openItemId!), "Đã rút yêu cầu. Tạo bản sửa mới nếu muốn chỉnh sửa.")}><Undo2 className="ic" />Rút yêu cầu duyệt</button>
            : <p className="sub" style={{ margin: 0 }}>Moderator đã nhận xử lý nên không rút được nữa. Chờ kết quả.</p>)}

          {/* Đang công khai: xin gỡ để sửa. */}
          {pub.isPublished && !open && (removal === null
            ? <button className="btn btn-s" style={{ width: "fit-content" }} onClick={() => setRemoval("")}><Trash2 className="ic" />Xin gỡ khỏi Thư viện chung</button>
            : (
              <>
                <label className="field"><span className="lbl">Lý do xin gỡ</span>
                  <textarea className="inp" rows={2} maxLength={2000} value={removal} onChange={(e) => setRemoval(e.target.value)} placeholder="Ví dụ: Cần chỉnh sửa phần kết" /></label>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-g" onClick={() => setRemoval(null)}>Hủy</button>
                  <button className="btn btn-no" disabled={busy || !removal.trim()} onClick={() => void act(() => creatorService.requestRemoval(story.storyId, removal.trim()), "Đã gửi yêu cầu gỡ. Truyện vẫn công khai đến khi Moderator đồng ý.").then((ok) => ok && setRemoval(null))}>Gửi yêu cầu gỡ</button>
                </div>
              </>
            ))}

          {/* Không công khai, không còn mục mở, phiên bản đã từng gửi: tạo bản sửa để chỉnh tiếp. */}
          {!pub.isPublished && !open && pub.reviewStatus !== "None" && (
            <>
              <p className="sub" style={{ margin: 0 }}>{pub.reviewStatus === "Approved" ? "Truyện đã được gỡ khỏi Thư viện chung." : "Phiên bản đã gửi được giữ nguyên trong lịch sử."} Tạo bản sửa mới để chỉnh rồi gửi duyệt lại.</p>
              <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy} onClick={() => void act(() => creatorService.createRevision(story.storyId, pub.versionId), "Đã tạo bản sửa mới, có thể mở trình soạn.")}><GitBranchPlus className="ic" />Tạo bản sửa mới</button>
            </>
          )}
          {/* Rút xong thì reviewStatus có thể vẫn là None nhưng phiên bản đã khoá: cho phép tạo bản sửa (backend tự từ chối nếu chưa cần). */}
          {!pub.isPublished && !open && pub.reviewStatus === "None" && (
            <button className="btn btn-g" style={{ width: "fit-content" }} disabled={busy} onClick={() => void act(() => creatorService.createRevision(story.storyId, pub.versionId), "Đã tạo bản sửa mới.")}><GitBranchPlus className="ic" />Đã rút yêu cầu? Tạo bản sửa mới</button>
          )}
        </>
      )}
    </div>
  );
}
