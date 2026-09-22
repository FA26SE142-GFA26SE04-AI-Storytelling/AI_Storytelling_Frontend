/**
 * Cấu hình tập trung API Base URL lấy từ biến môi trường NEXT_PUBLIC_API_URL trong .env.local
 * Fallback mặc định là http://localhost:5259/api/v1 nếu biến môi trường chưa được thiết lập.
 */
export const API_BASE_URL: string = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5259/api/v1'
).replace(/\/+$/, '');
