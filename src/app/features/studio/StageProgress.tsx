"use client";

import Frog from "@/app/components/brand/Frog";
import LilyStepper from "@/app/components/brand/LilyStepper";
import { generationDisplayPhase } from "@/app/features/story-workflow/storyGenerationFlow";
import type { Stage, StatusSnapshot } from "./useStoryPipeline";
import { useRiseIn, usePop } from "@/app/lib/motion";

const STEPS = [
  "Kiểm tra an toàn ý tưởng",
  "Viết dàn ý",
  "Viết và kiểm duyệt nội dung truyện",
  "Tạo từ vựng, câu hỏi và gợi ý thảo luận",
  "Chờ bạn duyệt",
];

function currentStep(stage: Stage, snap: StatusSnapshot | null): number {
  switch (stage) {
    case "checking": return 0;
    case "outline_wait": return 1;
    case "outline": return 1;
    case "generating": return generationDisplayPhase(snap?.generation ?? null) === "learning" ? 3 : 2;
    default: return 0;
  }
}

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
  const cardRef = usePop<HTMLDivElement>(stage === "outline" ? "ready" : "work", 0.96);
  if (stage === "brief") {
    return (
      <div ref={emptyRef} className="empty">
        <Frog size={120} />
        <b className="display">Bắt đầu một câu chuyện mới</b>
        <span>Nhập ý tưởng ở cột bên trái. AI sẽ kiểm tra an toàn, viết dàn ý cho bạn duyệt, rồi mới viết truyện.</span>
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
  const cur = currentStep(stage, snapshot);
  const waitingUser = stage === "outline";
  return (
    <div className="pipe-inline">
      <div ref={cardRef} className="pipe-card" style={{ width: "min(760px,100%)" }}>
        <h3 className="display">{waitingUser ? "Dàn ý đã sẵn sàng" : "AI đang làm việc"}</h3>
        <p className="sub">{waitingUser ? "Xem và duyệt dàn ý ở cột bên trái để AI viết truyện." : "Mỗi bước đều có quy tắc an toàn đi kèm."}</p>
        <LilyStepper steps={STEPS} current={cur} waiting={waitingUser} />
        {errorCode && <div className="notice err" role="alert">Mã lỗi: {errorCode}. Bạn có thể thử lại.</div>}
        {timedOut && <div className="notice err">Việc xử lý lâu hơn dự kiến. <button className="link-btn" onClick={onRetry}>Kiểm tra lại</button></div>}
      </div>
    </div>
  );
}
