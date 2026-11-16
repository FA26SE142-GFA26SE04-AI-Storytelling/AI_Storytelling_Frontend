import qrcode from "qrcode-generator";

const WIDTH = 640;
const PAD = 40;
const QUIET = 4; // lề trắng quanh mã (số ô) để máy quét nhận ra mã
const TEXT_BOX = 150;

/** Tên tệp ảnh QR theo tên bé, bỏ dấu tiếng Việt để mọi máy đều lưu được: "Bé An" → "ma-qr-be-an.png". */
export function qrFileName(nickname: string): string {
  const slug = nickname
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `ma-qr-${slug || "cua-be"}.png`;
}

/**
 * Vẽ mã QR đăng nhập của bé thành ảnh PNG để phụ huynh lưu về máy hoặc in: nền trắng, chấm đen (quét được
 * cả khi máy đang ở giao diện tối), bên dưới ghi tên bé và dòng nhắc. Chỉ chạy trên trình duyệt.
 */
export function drawQrPng(value: string, title: string, subtitle: string): Promise<Blob> {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const cell = Math.floor((WIDTH - 2 * PAD) / (count + 2 * QUIET));
  const box = cell * (count + 2 * QUIET);
  const left = Math.round((WIDTH - box) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = PAD + box + TEXT_BOX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas"));

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) {
    if (qr.isDark(r, c)) ctx.fillRect(left + (c + QUIET) * cell, PAD + (r + QUIET) * cell, cell, cell);
  }

  // Dùng đúng phông của trang (Nunito); chưa nạp được thì trình duyệt tự lấy phông thay thế.
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const y = PAD + box;
  ctx.textAlign = "center";
  ctx.fillStyle = "#1f2a24";
  ctx.font = `800 34px ${font}`;
  ctx.fillText(title, WIDTH / 2, y + 44, WIDTH - 2 * PAD);
  ctx.fillStyle = "#55605a";
  ctx.font = `600 20px ${font}`;
  ctx.fillText(subtitle, WIDTH / 2, y + 84, WIDTH - 2 * PAD);
  ctx.font = `800 20px ${font}`;
  ctx.fillText("Taletale", WIDTH / 2, y + 120);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
}
