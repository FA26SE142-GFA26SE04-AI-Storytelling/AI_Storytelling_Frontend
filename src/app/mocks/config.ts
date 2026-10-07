/**
 * Chế độ dữ liệu mẫu: mặc định BẬT, không gọi API thật.
 * Muốn gọi backend thật, đặt NEXT_PUBLIC_USE_MOCK=false trong .env.local.
 */
export const USE_MOCK: boolean = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export const MOCK_LATENCY_MS = 220;

export const delay = (ms = MOCK_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ok<T>(data: T, message = ''): { success: true; message: string; data: T } {
  return { success: true, message, data };
}

export function fail<T = never>(message: string): { success: false; message: string; data: T | null } {
  return { success: false, message, data: null };
}
