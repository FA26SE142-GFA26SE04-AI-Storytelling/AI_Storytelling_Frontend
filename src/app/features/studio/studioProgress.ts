import { generationDisplayPhase } from "@/app/features/story-workflow/storyGenerationFlow";
import type { MediaProgressDto } from "@/app/types/aiStory";
import type { Stage, StatusSnapshot } from "./useStoryPipeline";

/** Các bước người dùng thấy trên thanh tiến trình của Studio (gộp 5 Phase của Luồng 2 thành ngôn ngữ phụ huynh). */
export const STUDIO_STEPS = [
  "Ý tưởng",
  "Kiểm tra an toàn",
  "Dàn ý",
  "Viết truyện",
  "Học liệu",
  "Duyệt",
  "Tranh & giọng đọc",
  "Sẵn sàng",
] as const;

/** run: AI đang làm · you: chờ bạn thao tác · error: dừng/lỗi · done: xong. */
export type StepMode = "done" | "run" | "you" | "error" | "todo";

export interface StudioProgress {
  /** Vị trí bước hiện tại; -1 khi truyện đã dừng. */
  current: number;
  mode: StepMode;
  caption: string;
}

export function studioProgress(
  stage: Stage,
  snapshot: StatusSnapshot | null,
  media: MediaProgressDto | null = null,
  errorCode: string | null = null,
): StudioProgress {
  const at = (current: number, mode: StepMode, caption: string): StudioProgress =>
    errorCode && mode === "run" ? { current, mode: "error", caption: "Có lỗi, hãy thử lại" } : { current, mode, caption };

  switch (stage) {
    case "brief": return at(0, "you", "Nhập ý tưởng để bắt đầu");
    case "checking": return at(1, "run", "Đang kiểm tra an toàn");
    case "blocked": return at(1, "error", "Ý tưởng chưa phù hợp");
    case "outline_wait": return at(2, "run", "AI đang viết dàn ý");
    case "outline": return at(2, "you", "Chờ bạn duyệt dàn ý");
    case "generating":
      return generationDisplayPhase(snapshot?.generation ?? null) === "learning"
        ? at(4, "run", "AI đang soạn học liệu")
        : at(3, "run", "AI đang viết truyện");
    // Luồng 2 mục 3.4: truyện vùng xám chờ kiểm duyệt viên (thường trong 24 giờ) trước khi tới lượt bạn duyệt.
    case "moderation": return at(5, "run", "Đang chờ kiểm duyệt an toàn");
    case "review": return at(5, "you", "Chờ bạn duyệt truyện");
    case "media":
      if (media?.isReady) return { current: 7, mode: "done", caption: "Truyện đã sẵn sàng" };
      if (media?.errorCode) return { current: 6, mode: "error", caption: "Tạo tranh gặp lỗi" };
      return at(6, "run", "Đang vẽ tranh, tạo giọng");
    case "stopped": return { current: -1, mode: "error", caption: "Truyện đã dừng" };
  }
}

/**
 * Quay lại / huỷ được gì ở mỗi bước. Backend không cho lùi một truyện về bước trước,
 * nên "quay lại sửa ý tưởng" = huỷ truyện hiện tại rồi mở form với ý tưởng cũ.
 * Không huỷ khi AI đang chạy: job viết truyện khi xong sẽ ghi đè trạng thái, truyện đã huỷ lại hiện ra.
 */
export interface StudioActions {
  /** API dùng để huỷ truyện hiện tại; null nếu không huỷ được ở bước này. */
  cancelWith: "reject_outline" | "archive" | null;
  /** Ý tưởng bị chặn: sửa ngay trên truyện nháp, không cần huỷ. */
  editInPlace: boolean;
  /** Truyện đã xong hoặc đã dừng: chỉ cần mở form mới, không huỷ gì. */
  startNew: boolean;
  /** Vì sao hai nút đang mờ (null khi dùng được); hiện ở tooltip. */
  waitReason: string | null;
}

export function studioActions(stage: Stage): StudioActions {
  const none: StudioActions = { cancelWith: null, editInPlace: false, startNew: false, waitReason: null };
  switch (stage) {
    case "brief": return { ...none, waitReason: "Chưa có truyện để quay lại hoặc huỷ." };
    // AI đang chạy: nút vẫn hiện nhưng mờ, không bấm được.
    case "checking":
    case "outline_wait":
    case "generating": return { ...none, waitReason: "AI đang làm bước này, chờ xong mới quay lại hoặc huỷ được." };
    case "moderation": return { ...none, waitReason: "Truyện đang chờ kiểm duyệt viên, chờ xong mới quay lại hoặc huỷ được." };
    case "blocked": return { ...none, editInPlace: true, cancelWith: "archive" };
    case "outline": return { ...none, cancelWith: "reject_outline" };
    case "review": return { ...none, cancelWith: "archive" };
    case "media":
    case "stopped": return { ...none, startNew: true };
  }
}

/**
 * Thanh tiến trình chạy dần từng bước tới bước thật thay vì nhảy thẳng: `shown` là bước đang hiển thị.
 * Trong lúc đuổi theo, lá đang đi qua hiện như đang làm; tới nơi thì dùng đúng trạng thái thật.
 */
export function displayedProgress(progress: StudioProgress, shown: number): StudioProgress {
  if (shown >= progress.current) return progress;
  return { ...progress, current: shown, mode: "run" };
}

/** Bước tiếp theo khi đuổi theo; lùi (làm lại, đã dừng) thì nhảy thẳng, không chạy ngược. */
export function nextShownStep(shown: number, target: number): number {
  return target > shown ? shown + 1 : target;
}

/** Trạng thái của từng bước trên thanh. */
export function stepMode(index: number, progress: StudioProgress): StepMode {
  if (progress.current < 0) return "todo";
  if (index < progress.current) return "done";
  return index === progress.current ? progress.mode : "todo";
}
