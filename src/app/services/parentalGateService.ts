import { ApiResponse } from '../types/auth';
import { VerifyParentalGateRequestDto } from '../types/parentalGate';
import { API_BASE_URL } from './apiConfig';

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const parentalGateService = {
  /**
   * Xác thực tài khoản người lớn để vượt qua cổng Parental Gate (POST /api/v1/ParentalGate/verify)
   * Yêu cầu nhập email và mật khẩu của phụ huynh/giám sát viên.
   * Hành động này không tạo ra session mới mà chỉ xác thực quyền quản trị.
   */
  async verify(request: VerifyParentalGateRequestDto): Promise<ApiResponse<object | null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ParentalGate/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email.trim(),
          password: request.password,
        }),
      });

      const data = await parseJsonResponse<ApiResponse<object | null>>(response);
      return (
        data ?? {
          success: response.ok,
          message: response.ok ? 'Vượt qua Parental Gate thành công.' : 'Xác thực không thành công.',
          data: null,
        }
      );
    } catch (error) {
      console.error('Parental gate verify error:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ xác thực.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },
};
