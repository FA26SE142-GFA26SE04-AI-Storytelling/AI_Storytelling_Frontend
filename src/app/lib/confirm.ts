/**
 * Hộp thoại xác nhận thay cho window.confirm. Dùng: `if (!(await confirmDialog("Tạm dừng hồ sơ? …"))) return;`
 * Câu đầu (đến dấu “?”) thành tiêu đề, phần còn lại là nội dung giải thích.
 * ConfirmHost (gắn ở layout) hiển thị hộp thoại; nếu chưa gắn thì dùng window.confirm làm phương án dự phòng.
 */
export type ConfirmRequest = { message: string; resolve: (ok: boolean) => void };

let listener: ((r: ConfirmRequest) => void) | null = null;

export function confirmDialog(message: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const show = listener;
  if (!show) return Promise.resolve(window.confirm(message));
  return new Promise<boolean>((resolve) => show({ message, resolve }));
}

export function subscribeConfirm(fn: (r: ConfirmRequest) => void): () => void {
  listener = fn;
  return () => { if (listener === fn) listener = null; };
}
