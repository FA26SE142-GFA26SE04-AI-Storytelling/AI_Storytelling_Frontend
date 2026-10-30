"use client";

import { useState } from "react";
import { Check, PenLine, Plus, Sparkles, Undo2, X } from "lucide-react";
import { usePop } from "@/app/lib/motion";
import type { ApproveAction } from "@/app/features/story-workflow/approveSlot";
import type { Stage } from "./useStoryPipeline";
import { studioActions } from "./studioProgress";

type Props = {
  stage: Stage;
  /** Còn giữ được ý tưởng đã gửi để điền lại (mất khi tải lại trang vì không lưu vào trình duyệt). */
  valuesKnown: boolean;
  onEditIdea: () => void;
  /** Huỷ truyện hiện tại rồi mở form; keepIdea = điền lại ý tưởng cũ. Trả về thông báo lỗi nếu không huỷ được. */
  onRestart: (keepIdea: boolean) => Promise<string | null>;
  onStartNew: () => void;
  /** Hành động duyệt do màn đang hiện đăng ký (duyệt dàn ý hoặc duyệt truyện); null = chưa tới bước duyệt. */
  approve: ApproveAction | null;
};

type Pending = "back" | "cancel" | null;

const WHAT_IS_LOST: Partial<Record<Stage, string>> = {
  outline: "Dàn ý hiện tại sẽ bị huỷ.",
  review: "Bản truyện này sẽ được lưu trữ, bé không thấy truyện này.",
  blocked: "Bản nháp này sẽ được lưu trữ.",
};

/**
 * Nút quay lại / huỷ / duyệt trên thanh tiến trình, chỉ có biểu tượng (chữ nằm ở tooltip và aria-label).
 * Luôn hiện để vị trí cố định; bước đầu và lúc AI đang chạy thì mờ và không bấm được (tooltip nói lý do).
 * Luôn hỏi lại trước khi huỷ.
 */
export default function StudioControls({ stage, valuesKnown, onEditIdea, onRestart, onStartNew, approve }: Props) {
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const popRef = usePop<HTMLDivElement>(pending ?? "", 0.95);
  const a = studioActions(stage);

  if (a.startNew) {
    return <div className="ss-actions"><button className="btn btn-s" onClick={onStartNew}><Plus className="ic" />Tạo truyện mới</button></div>;
  }
  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    setErr(null);
    const message = await onRestart(pending === "back");
    setBusy(false);
    if (message) setErr(message);
    else setPending(null);
  };

  const canBack = a.editInPlace || a.cancelWith !== null;
  const backLabel = a.editInPlace ? "Sửa ý tưởng" : "Quay lại ý tưởng";
  const cancelLabel = "Huỷ truyện và bắt đầu lại";
  const approveLabel = approve?.label ?? "Duyệt";
  const ApproveIcon = approve?.icon === "sparkles" ? Sparkles : Check;
  const approveReady = !!approve && !approve.disabled;
  // Tooltip đặt ở khung bao vì nút bị vô hiệu không phải trình duyệt nào cũng hiện tooltip riêng.
  const approveTip = approveReady ? approveLabel : approve ? approve.reason ?? approveLabel : "Chưa tới bước duyệt.";
  return (
    // Tooltip đặt ở khung ngoài vì nút bị vô hiệu không phải trình duyệt nào cũng hiện tooltip riêng.
    <div className="ss-actions" title={a.waitReason ?? undefined}>
      <button className="btn btn-g ss-icon" disabled={busy || !canBack} title={canBack ? backLabel : undefined} aria-label={backLabel}
        onClick={() => (a.editInPlace ? onEditIdea() : setPending("back"))}>
        {a.editInPlace ? <PenLine className="ic" /> : <Undo2 className="ic" />}
      </button>
      <button className="btn btn-g ss-icon ss-cancel" disabled={busy || !a.cancelWith} title={a.cancelWith ? cancelLabel : undefined} aria-label={cancelLabel} onClick={() => setPending("cancel")}>
        <X className="ic" />
      </button>
      <span title={approveTip}>
        <button className={`btn btn-ok ss-icon${approveReady ? " ss-approve" : ""}`} disabled={busy || !approveReady} aria-label={approveLabel} onClick={() => approve?.run()}>
          <ApproveIcon className="ic" />
        </button>
      </span>

      {pending && (
        <div ref={popRef} className="ss-confirm" role="alertdialog" aria-label="Xác nhận">
          <b>{pending === "back" ? "Quay lại sửa ý tưởng?" : "Huỷ truyện này?"}</b>
          <p>
            {WHAT_IS_LOST[stage]}{" "}
            {pending === "back"
              ? valuesKnown ? "Bạn sẽ về form Ý tưởng với nội dung cũ để sửa và gửi lại." : "Trang đã được tải lại nên không còn ý tưởng cũ, form sẽ để trống."
              : "Bạn sẽ bắt đầu một truyện mới với form trống."}
          </p>
          {err && <div className="notice err" role="alert">{err}</div>}
          <div className="row">
            <button className="btn btn-g grow btn-c" disabled={busy} onClick={() => { setPending(null); setErr(null); }}>Không</button>
            <button className={`btn grow btn-c ${pending === "back" ? "btn-p" : "btn-no"}`} disabled={busy} onClick={() => void confirm()}>
              {busy ? "Đang huỷ…" : pending === "back" ? "Quay lại" : "Huỷ truyện"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
