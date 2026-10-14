"use client";

import Frog from "@/app/components/brand/Frog";
import type { Stage, StatusSnapshot } from "./useStoryPipeline";
import { STUDIO_STEPS, studioProgress } from "./studioProgress";
import { useRiseIn } from "@/app/lib/motion";

type Props = {
  stage: Stage;
  snapshot: StatusSnapshot | null;
  message?: string | null;
  errorCode?: string | null;
  timedOut?: boolean;
  onRetry?: () => void;
  onEdit?: () => void;
};

export default function StageProgress({ stage, snapshot, message, errorCode, timedOut, onRetry, onEdit }: Props) {
  const emptyRef = useRiseIn<HTMLDivElement>(":scope > *", [stage], { delay: 70 });
  const progress = studioProgress(stage, snapshot, null, errorCode ?? null);
  // Khung thẻ và chú ếch đứng yên; chỉ phần chữ đổi theo bước mới hiện dần, nên không nháy cả thẻ.
  const textRef = useRiseIn<HTMLDivElement>(".pipe-text > *", [progress.current, progress.mode], { delay: 40, distance: 8 });
  if (stage === "brief") {
    return (
      <div ref={emptyRef} className="empty">
        <Frog size={120} />
        <b className="display">Bắt đầu một câu chuyện mới</b>
        <span>Nhập ý tưởng ở tab Yêu cầu. AI sẽ kiểm tra an toàn, viết dàn ý cho bạn duyệt, rồi mới viết truyện.</span>
      </div>
    );
  }
  if (stage === "blocked" || stage === "stopped") {
    return (
      <div ref={emptyRef} className="empty">
        <Frog size={110} mood="think" />
        <b className="display">{stage === "stopped" ? "Truyện đã dừng" : "Ý tưởng chưa phù hợp"}</b>
        <span>{message || "Hệ thống không thể tiếp tục với ý tưởng này."}</span>
        {onEdit && <button className="btn btn-s" onClick={onEdit}>Sửa ý tưởng</button>}
        {onRetry && <button className="btn btn-p" onClick={onRetry}>Thử lại kiểm tra</button>}
      </div>
    );
  }
  // Chỉ bước dàn ý mới chờ phụ huynh ở đây; bước duyệt truyện có màn riêng (thẻ có thể thoáng thấy stage đó trong lúc Morph).
  const waitingUser = stage === "outline";
  return (
    <div className="pipe-inline">
      <div className="pipe-card pipe-now">
        <Frog size={96} mood={waitingUser ? "happy" : "think"} />
        <div ref={textRef} className="pipe-text">
          <small className="hint">Bước {progress.current + 1}/{STUDIO_STEPS.length} · {STUDIO_STEPS[progress.current]}</small>
          <h3 className="display">{waitingUser ? "Dàn ý đã sẵn sàng" : progress.caption}</h3>
          <p className="sub">{waitingUser ? "Mở tab Dàn ý để xem và duyệt, rồi AI sẽ viết truyện." : "Mỗi bước đều có quy tắc an toàn đi kèm. Bạn có thể rời màn hình này, AI vẫn tiếp tục làm."}</p>
        </div>
        {errorCode && <div className="notice err" role="alert">Mã lỗi: {errorCode}. Bạn có thể thử lại.</div>}
        {timedOut && <div className="notice err">Việc xử lý lâu hơn dự kiến. <button className="link-btn" onClick={onRetry}>Kiểm tra lại</button></div>}
      </div>
    </div>
  );
}
