import type { BreakActivity, ReadingTimeState, ReadingTimeStatus } from '@/app/types/readingSchedule';

/** Các trạng thái bé không được đọc (backend trả 403 kèm mã READING_TIME_* khi bé mở truyện / vào bằng QR). */
const BLOCKING: ReadonlySet<ReadingTimeState> = new Set(['Outside', 'Bedtime', 'ScreenLimitReached', 'Break']);

export const isBlocking = (status?: ReadingTimeStatus | null): status is ReadingTimeStatus => !!status && BLOCKING.has(status.state);

const CODE_STATE: Record<string, ReadingTimeState> = {
  READING_TIME_BREAK: 'Break',
  READING_TIME_BEDTIME: 'Bedtime',
  READING_TIME_SCREEN_LIMIT: 'ScreenLimitReached',
  READING_TIME_OUTSIDE: 'Outside',
};

/** Mã lỗi READING_TIME_* trong `errors` của một phản hồi 403 → trạng thái chặn tương ứng; không phải lỗi giờ đọc thì null. */
export function blockedStateOf(errors?: readonly string[] | null): ReadingTimeState | null {
  for (const code of errors ?? []) if (CODE_STATE[code]) return CODE_STATE[code];
  return null;
}

/** Số giây còn lại tới một mốc ISO (làm tròn lên, không âm); không có mốc hoặc mốc hỏng thì null. */
export function secondsUntil(iso: string | null | undefined, nowMs: number): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.ceil((at - nowMs) / 1000));
}

/** "4:05" cho dưới 1 giờ; từ 1 giờ trở lên "1 giờ 5 phút" (khoảng chờ tới khung giờ đọc kế tiếp có thể dài). */
export function formatCountdown(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.ceil((seconds % 3600) / 60);
    return m === 60 ? `${h + 1} giờ` : m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Số phút làm tròn lên, tối thiểu 1: dùng trong câu "còn 3 phút". */
export const minutesOf = (seconds: number): number => Math.max(1, Math.ceil(seconds / 60));

const BREAK_HINT: Record<BreakActivity, string> = {
  Eyes: 'Nhìn ra xa một chút cho mắt nghỉ nhé!',
  Water: 'Em uống một ngụm nước nhé!',
  Move: 'Em đứng dậy vươn vai, đi lại vài bước nhé!',
};

export type RestCopy = { title: string; hint: string; mood: 'idle' | 'happy' | 'think'; label: string; until: string | null };

/** Lời cho màn nghỉ / màn chặn: tiêu đề, câu dặn, nhãn đếm ngược và mốc để đếm ngược tới (nếu có). */
export function restCopy(status: ReadingTimeStatus): RestCopy {
  switch (status.state) {
    case 'Break':
      return { title: 'Nghỉ một chút nhé', hint: BREAK_HINT[status.breakActivity ?? 'Eyes'], mood: 'idle', label: 'Em đọc tiếp được sau', until: status.breakUntil };
    case 'Bedtime':
      return { title: 'Đến giờ đi ngủ rồi', hint: 'Chúc em ngủ ngon! Mai mình đọc tiếp nhé.', mood: 'idle', label: 'Em đọc tiếp được sau', until: status.nextAllowedAt };
    case 'ScreenLimitReached':
      return { title: 'Hôm nay em đọc đủ rồi', hint: 'Mai mình đọc tiếp nhé!', mood: 'happy', label: 'Em đọc tiếp được sau', until: status.nextAllowedAt };
    default:
      return { title: 'Chưa tới giờ đọc', hint: 'Giờ đọc hôm nay đã hết, hẹn em ở giờ đọc sau nhé!', mood: 'think', label: 'Giờ đọc kế tiếp sau', until: status.nextAllowedAt };
  }
}

/**
 * Chip đồng hồ trên thanh của bé: mốc kết thúc gần nhất mà backend tính (`endsAt` + `endReason`).
 * Hết phút màn hình → "Còn N phút"; khung giờ / giờ ngủ → "Đọc đến HH:mm" (giờ máy); đang đọc nốt → "Đọc nốt m:ss".
 * `warn` khi còn ≤ 5 phút (EndingSoon) hoặc đang đọc nốt. Không đặt giới hạn nào hoặc đang bị chặn (đã có màn chặn) thì null.
 */
export function timeChip(status: ReadingTimeStatus | null | undefined, nowMs: number): { text: string; warn: boolean } | null {
  if (!status) return null;
  if (status.state === 'Grace') {
    const left = secondsUntil(status.graceEndsAt, nowMs);
    return left === null ? null : { text: `Đọc nốt ${formatCountdown(left)}`, warn: true };
  }
  if (status.state !== 'Allowed' && status.state !== 'EndingSoon') return null;
  const warn = status.state === 'EndingSoon';
  const left = secondsUntil(status.endsAt, nowMs);
  if (left === null) return null;
  if (status.endReason === 'ScreenLimit') return { text: `Còn ${minutesOf(left)} phút`, warn };
  const at = new Date(Date.parse(status.endsAt!));
  return { text: `Đọc đến ${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`, warn };
}

/** Dòng cảnh báo khi sắp hết giờ (EndingSoon) hoặc đang gia hạn (Grace); các trạng thái khác thì null. */
export function warnLine(status: ReadingTimeStatus | null | undefined, nowMs: number): string | null {
  if (!status) return null;
  if (status.state === 'EndingSoon') {
    const left = secondsUntil(status.endsAt, nowMs);
    return left === null ? 'Sắp hết giờ đọc rồi nhé!' : `Sắp hết giờ đọc rồi, còn khoảng ${minutesOf(left)} phút nhé!`;
  }
  if (status.state === 'Grace') {
    const left = secondsUntil(status.graceEndsAt, nowMs);
    return left === null ? 'Đến giờ nghỉ rồi, em đọc nốt đoạn này nhé!' : `Đến giờ nghỉ rồi, em đọc nốt đoạn này nhé! (còn ${formatCountdown(left)})`;
  }
  return null;
}
