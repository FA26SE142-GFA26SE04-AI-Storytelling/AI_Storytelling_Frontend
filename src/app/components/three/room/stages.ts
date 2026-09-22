export interface CameraStage {
  id: string;
  name: string;
  camPos: [number, number, number];
  targetPos: [number, number, number];
}

export type TimeOfDay = 'morning' | 'afternoon' | 'night';

/**
 * Automatically checks current local time (Asia/Ho_Chi_Minh / UTC+7 or device local time)
 * to determine atmosphere lighting mode:
 * - Morning (Sáng): 05:00 - 11:59 (5h - 12h)
 * - Afternoon (Chiều): 12:00 - 17:59 (12h - 18h)
 * - Night (Tối/Đêm): 18:00 - 04:59 (18h - 5h)
 */
export function getVietnamTimeOfDay(): TimeOfDay {
  try {
    const now = new Date();
    let hour: number = now.getHours();

    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: 'numeric',
        hourCycle: 'h23',
      }).formatToParts(now);
      const hourPart = parts.find((p) => p.type === 'hour');
      if (hourPart) {
        const parsed = parseInt(hourPart.value, 10);
        if (!isNaN(parsed)) {
          hour = parsed;
        }
      }
    } catch {
      hour = now.getHours();
    }

    if (hour >= 5 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 18) {
      return 'afternoon';
    } else {
      return 'night';
    }
  } catch {
    const fallbackHour = new Date().getHours();
    if (fallbackHour >= 5 && fallbackHour < 12) return 'morning';
    if (fallbackHour >= 12 && fallbackHour < 18) return 'afternoon';
    return 'night';
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
  {
    id: 'laptop',
    name: '7. Laptop (Chính Diện Màn Hình AI)',
    camPos: [-1.70, 0.68, 0.95],
    targetPos: [-1.70, 0.48, 0.38],
  },
];
