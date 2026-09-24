/**
 * Cấu hình tập trung API Base URL lấy từ biến môi trường NEXT_PUBLIC_API_URL trong .env.local
 * Tự động chuẩn hóa đường dẫn (loại bỏ index.html, trailing slashes, đảm bảo hậu tố /api/v1).
 */
const formatBaseUrl = (rawUrl?: string): string => {
  const fallback = 'https://api.taletale.site/api/v1';
  if (!rawUrl || !rawUrl.trim()) {
    return fallback;
  }

  let cleaned = rawUrl.trim();
  // Loại bỏ /index.html hoặc /swagger nếu người dùng truyền link Swagger
  cleaned = cleaned.replace(/\/index\.html\/?$/i, '').replace(/\/swagger\/?$/i, '').replace(/\/+$/, '');

  // Nếu chưa kết thúc bằng /api/v1 thì thêm vào
  if (!cleaned.endsWith('/api/v1')) {
    cleaned = `${cleaned}/api/v1`;
  }

  return cleaned;
};

export const API_BASE_URL: string = formatBaseUrl(process.env.NEXT_PUBLIC_API_URL);

