// Định dạng tiền tệ VND đầy đủ (ví dụ: '1.234.567 đ')
export const money = (n: number): string =>
  `${(Number.isFinite(n) ? n : 0).toLocaleString('vi-VN')} đ`;

// Định dạng tiền tệ rút gọn cho biểu đồ (ví dụ: '1,2 tỷ', '1,5 tr', '250k')
export const shortMoney = (n: number): string => {
  if (!Number.isFinite(n)) return '0';
  const fmt = (val: number) => val.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  if (Math.abs(n) >= 1e9) return `${fmt(n / 1e9)} tỷ`;
  if (Math.abs(n) >= 1e6) return `${fmt(n / 1e6)} tr`;
  if (Math.abs(n) >= 1e3) return `${fmt(n / 1e3)}k`;
  return fmt(n);
};

// Định dạng tỷ lệ phần trăm từ số 0..1 (ví dụ: 0.3 -> '30%')
export const pct = (rate: number): string =>
  Number.isFinite(rate) ? `${Math.round(rate * 100)}%` : '—';

/**
 * Các mức "đẹp" cho trục biểu đồ cột: mức trên cùng làm tròn lên bội của bước 1, 2, 2.5, 5 × 10^k
 * để có khoảng 4 đường kẻ ngang (ví dụ giá trị lớn nhất 99.000 → 0, 25k, 50k, 75k, 100k). Bước luôn là số nguyên.
 */
export function niceScale(max: number): { top: number; ticks: number[] } {
  const raw = Number.isFinite(max) && max > 0 ? max : 1;
  const target = Math.max(1, raw / 4);
  const mag = Math.pow(10, Math.floor(Math.log10(target)));
  const options = mag >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10];
  const step = (options.find((o) => o * mag >= target) ?? 10) * mag;
  const intervals = Math.max(1, Math.ceil(raw / step));
  return { top: intervals * step, ticks: Array.from({ length: intervals + 1 }, (_, i) => i * step) };
}

// Định dạng số lượng nguyên/thực theo chuẩn vi-VN
export const count = (n: number): string =>
  (Number.isFinite(n) ? n : 0).toLocaleString('vi-VN');
