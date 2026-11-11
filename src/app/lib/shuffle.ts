/**
 * Trả về bản xáo trộn của danh sách (Fisher–Yates), không sửa mảng gốc.
 * Có từ 2 phần tử khác nhau thì luôn ra thứ tự khác thứ tự gốc, để bé không nhớ vị trí đáp án
 * (với câu xếp thứ tự, thứ tự gốc thường chính là đáp án đúng).
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = items.slice();
  if (out.length < 2) return out;
  const allSame = out.every((x) => x === out[0]);
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (allSame || out.some((x, i) => x !== items[i])) return out;
  }
  // Hàm random bất thường (luôn trả cùng một số): xoay vòng một bước để chắc chắn khác gốc.
  return [...items.slice(1), items[0]];
}
