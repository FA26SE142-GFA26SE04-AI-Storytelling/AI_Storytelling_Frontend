export interface CameraStage {
  id: string;
  name: string;
  camPos: [number, number, number];
  targetPos: [number, number, number];
}

export type TimeOfDay = 'morning' | 'afternoon' | 'night';

/**
 * Automatically checks current Vietnam local time (UTC+7 / Asia/Ho_Chi_Minh)
 * to determine initial atmosphere lighting mode:
 * - Morning (Sáng): 07:00 - 13:59 (7h - 14h)
 * - Afternoon (Chiều): 14:00 - 17:59 (14h - 18h)
 * - Night (Tối/Đêm): 18:00 - 06:59 (18h - 7h)
 */
export function getVietnamTimeOfDay(): TimeOfDay {
  try {
    const now = new Date();
    const vnHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: 'numeric',
      hour12: false,
    }).format(now);

    const hour = parseInt(vnHourStr, 10);
    if (isNaN(hour)) return 'afternoon';

    if (hour >= 7 && hour < 14) {
      return 'morning';
    } else if (hour >= 14 && hour < 18) {
      return 'afternoon';
    } else {
      return 'night';
    }
  } catch (e) {
    return 'afternoon';
  }
}

export const STAGES: CameraStage[] = [
  {
    id: 'overview',
    name: '1. Toàn Cảnh Căn Phòng (Perspective Model)',
    camPos: [0, 1, 4],
    targetPos: [0, 1, 0],
  },
  {
    id: 'desk',
    name: '2. Góc Bàn Học & Ghế Xoay (Right Wall)',
    camPos: [1, 2, -0.6],
    targetPos: [1.7, 0.9, -0.6],
  },
  {
    id: 'bookshelf',
    name: '3. Kệ Sách 3 Tầng (Clean Shelves)',
    camPos: [-0.6, 1.1, -0.4],
    targetPos: [-1.5, 0.7, -2.1],
  },
  {
    id: 'closet',
    name: '4. Tủ Trượt Âm Tường (Closet Panel B)',
    camPos: [0.2, 1.6, -0.4],
    targetPos: [0.9, 1.4, -2.1],
  },
  {
    id: 'window',
    name: '5. Cửa Sổ Trượt (Window Sill Detail A)',
    camPos: [-0.6, 1.5, 0.4],
    targetPos: [-2.4, 1.5, 0],
  },
  {
    id: 'backpack',
    name: '6. Cặp Sách Nobita (Đăng Nhập / Đăng Ký)',
    camPos: [1.15, 0.60, 1.25],
    targetPos: [1.90, 0.25, 0.45],
  },
];
