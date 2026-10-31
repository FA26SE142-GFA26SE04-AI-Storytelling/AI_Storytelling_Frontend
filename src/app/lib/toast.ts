/** Hiện thông báo trượt xuống từ code không nằm trong cây React (ví dụ ngay trước khi đóng hộp thoại). */
export function showToast(text: string, tone: "ok" | "err" | "warn" | "info" = "ok") {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.className = `notice ${tone}`;
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 300);
}
