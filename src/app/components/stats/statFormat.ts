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

// Định dạng số lượng nguyên/thực theo chuẩn vi-VN
export const count = (n: number): string =>
  (Number.isFinite(n) ? n : 0).toLocaleString('vi-VN');
