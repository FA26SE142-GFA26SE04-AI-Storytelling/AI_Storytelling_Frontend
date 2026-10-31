import type { ChildProfile } from "@/app/types/childProfile";
import { workspaceTransitionDone } from "@/app/lib/motion";

/**
 * Hộp chọn bé dùng chung. Trang nào cần biết thao tác cho bé nào thì hỏi ngay lúc thao tác:
 * `const kid = await chooseChild({ title: "Tạo truyện cho bé nào?" }); if (!kid) return;`
 * Chỉ có một bé phù hợp thì trả về bé đó luôn, không hiện hộp thoại.
 * ChildPickerHost (gắn trong WorkspaceDataProvider) hiển thị hộp thoại.
 */
export type ChooseChildOptions = {
  title: string;
  /** Lọc bé được chọn, ví dụ chỉ bé đang hoạt động. */
  filter?: (child: ChildProfile) => boolean;
};
export type ChooseChildRequest = ChooseChildOptions & { resolve: (child: ChildProfile | null) => void };

let listener: ((r: ChooseChildRequest) => void) | null = null;

export async function chooseChild(options: ChooseChildOptions): Promise<ChildProfile | null> {
  // Mở ngay khi vừa chuyển trang thì đợi hiệu ứng chuyển trang chạy xong, tránh ảnh chụp trang đè lên hộp thoại.
  await workspaceTransitionDone();
  const show = listener;
  if (!show) return null;
  return new Promise((resolve) => show({ ...options, resolve }));
}

export function subscribeChooseChild(fn: (r: ChooseChildRequest) => void): () => void {
  listener = fn;
  return () => { if (listener === fn) listener = null; };
}
