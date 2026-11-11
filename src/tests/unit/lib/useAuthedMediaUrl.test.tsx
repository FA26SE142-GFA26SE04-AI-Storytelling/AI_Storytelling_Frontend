// Kiểm tra hàm thuần isAuthedMediaUrl trong môi trường Node (không cần DOM/React)
import { describe, expect, it } from 'vitest';
import { isAuthedMediaUrl } from '@/app/lib/useAuthedMediaUrl';

describe('isAuthedMediaUrl', () => {
  it('trả về true với đường dẫn tương đối tài nguyên thủ công của trẻ', () => {
    expect(isAuthedMediaUrl('/api/v1/child/manual-stories/12/assets/34')).toBe(true);
  });

  it('trả về true với URL tuyệt đối tài nguyên thủ công của trẻ', () => {
    expect(isAuthedMediaUrl('https://api.example.com/api/v1/child/manual-stories/12/assets/34')).toBe(true);
  });

  it('trả về true với đường dẫn tài nguyên gói truyện của phụ huynh', () => {
    expect(isAuthedMediaUrl('/api/v1/parent/stories/5/packages/6/assets/7')).toBe(true);
  });

  it('trả về false với URL bên ngoài không thuộc phạm vi xác thực', () => {
    expect(isAuthedMediaUrl('https://cdn.example/a.png')).toBe(false);
  });

  it('trả về false với chuỗi rỗng, null hoặc undefined', () => {
    expect(isAuthedMediaUrl('')).toBe(false);
    expect(isAuthedMediaUrl(null)).toBe(false);
    expect(isAuthedMediaUrl(undefined)).toBe(false);
  });

  it('trả về false với đường dẫn API không khớp mẫu tài nguyên xác thực', () => {
    expect(isAuthedMediaUrl('/api/v1/child/manual-stories/12/package')).toBe(false);
  });
});
