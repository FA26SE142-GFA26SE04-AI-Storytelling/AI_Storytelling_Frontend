import { ApiResponse } from '../types/auth';
import {
  ChildProfile,
  CreateChildProfileRequest,
  OrganizationSummary,
  ClassGroupSummary,
} from '../types/childProfile';
import { authService } from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5259/api/v1';

/**
 * Trợ giúp phân tích JSON an toàn tránh lỗi 'Unexpected end of JSON input'
 */
async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const childProfileService = {
  /**
   * Lấy danh sách hồ sơ trẻ em của người dùng hiện tại (GET /api/v1/ChildProfile/mine)
   */
  async getMyChildProfiles(): Promise<ApiResponse<ChildProfile[]>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/ChildProfile/mine`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Không thể tải danh sách hồ sơ trẻ.',
          data: [],
        };
      }

      const data = await parseJsonResponse<ApiResponse<ChildProfile[]>>(response);
      return data ?? { success: true, message: '', data: [] };
    } catch (error) {
      console.error('Get my child profiles error:', error);
      return {
        success: false,
        message: 'Không thể tải danh sách hồ sơ trẻ từ Backend.',
        data: [],
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },

  /**
   * Lấy danh sách tổ chức mà tài khoản có tham gia (GET /api/v1/Organization/mine)
   */
  async getMyOrganizations(): Promise<ApiResponse<OrganizationSummary[]>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/Organization/mine`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Không thể tải danh sách tổ chức.',
          data: [],
        };
      }

      const data = await parseJsonResponse<ApiResponse<OrganizationSummary[]>>(response);
      return data ?? { success: true, message: '', data: [] };
    } catch (error) {
      console.error('Get my organizations error:', error);
      return {
        success: false,
        message: 'Không thể tải danh sách tổ chức.',
        data: [],
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy danh sách nhóm lớp học của giáo viên (GET /api/v1/ClassGroup/mine)
   */
  async getMyClassGroups(): Promise<ApiResponse<ClassGroupSummary[]>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/ClassGroup/mine`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Không thể tải danh sách lớp học.',
          data: [],
        };
      }

      const data = await parseJsonResponse<ApiResponse<ClassGroupSummary[]>>(response);
      return data ?? { success: true, message: '', data: [] };
    } catch (error) {
      console.error('Get my class groups error:', error);
      return {
        success: false,
        message: 'Không thể tải danh sách lớp học.',
        data: [],
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Tạo hồ sơ trẻ mới độc lập (POST /ChildProfile)
   * Trạng thái sau xử lý: Draft.
   * Nếu scope=Personal: organizationId và classGroupId để null.
   * Nếu scope=Organization: bắt buộc organizationId và classGroupId.
   */
  async createChildProfile(data: CreateChildProfileRequest): Promise<ApiResponse<ChildProfile>> {
    try {
      const payload: Record<string, any> = {
        nickname: data.nickname.trim(),
        ageBand: data.ageBand,
        language: data.language?.trim() || 'vi',
        scope: data.scope || 'Personal',
      };

      if (data.scope === 'Organization') {
        payload.organizationId = data.organizationId;
        payload.classGroupId = data.classGroupId;
      }

      const response = await authService.authenticatedFetch(`${API_BASE_URL}/ChildProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await parseJsonResponse<ApiResponse<ChildProfile>>(response);
      return result ?? {
        success: response.ok,
        message: response.ok ? 'Tạo hồ sơ thành công' : 'Không thể tạo hồ sơ trẻ.',
        data: null,
      };
    } catch (error) {
      console.error('Create child profile error:', error);
      return {
        success: false,
        message: 'Không thể tạo hồ sơ trẻ.',
        data: null,
        errors: [(error as Error).message || 'Network connection failed'],
      };
    }
  },
  /**
   * Tạo/cập nhật Learning Profile của bé (PUT /api/v1/LearningProfile/{childProfileId})
   */
  async setLearningProfile(
    childProfileId: number,
    data?: Partial<import('../types/childProfile').SetLearningProfileRequest>
  ): Promise<ApiResponse<unknown>> {
    try {
      const payload = {
        readingLevel: data?.readingLevel ?? 2,
        comprehensionGoal: data?.comprehensionGoal || 'Phát triển từ vựng và tư duy logic qua truyện kể',
        topics: data?.topics || [
          { topic: 'Khám phá thế giới & Thiên nhiên', relation: 'FavoriteTopic' },
          { topic: 'Khoa học & Vũ trụ', relation: 'FavoriteTopic' },
        ],
      };

      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/LearningProfile/${childProfileId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Set learning profile error:', error);
      return {
        success: false,
        message: 'Không thể thiết lập hồ sơ học tập.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Tạo/cập nhật Safety Policy của bé (PUT /api/v1/SafetyPolicy/{childProfileId})
   */
  async setSafetyPolicy(
    childProfileId: number,
    data?: Partial<import('../types/childProfile').SetSafetyPolicyRequest>
  ): Promise<ApiResponse<unknown>> {
    try {
      const payload = {
        maxStoryLength: data?.maxStoryLength ?? 2000,
        requiredApprovalMode: data?.requiredApprovalMode || 'AlwaysManual',
        parentalGateEnabled: data?.parentalGateEnabled ?? true,
        consentRecorded: data?.consentRecorded ?? true,
        categories: data?.categories || [],
      };

      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/SafetyPolicy/${childProfileId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await parseJsonResponse<ApiResponse<unknown>>(response);
      return result ?? {
        success: response.ok,
        message: response.ok ? 'Đã lưu quy tắc an toàn thành công.' : 'Không thể thiết lập quy tắc an toàn.',
        data: null,
      };
    } catch (error) {
      console.error('Set safety policy error:', error);
      return {
        success: false,
        message: 'Không thể thiết lập quy tắc an toàn.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Kích hoạt hồ sơ trẻ (PATCH /api/v1/ChildProfile/{childProfileId}/activate)
   */
  async activateChildProfile(childProfileId: number): Promise<ApiResponse<ChildProfile>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/ChildProfile/${childProfileId}/activate`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Activate child profile error:', error);
      return {
        success: false,
        message: 'Không thể kích hoạt hồ sơ trẻ.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Quy trình toàn diện 1 chạm: Thiết lập Learning Profile + Safety Policy + Kích hoạt sang Active
   */
  async setupAndActivateChild(
    childProfileId: number,
    nickname?: string,
    ageBand?: string
  ): Promise<ApiResponse<ChildProfile>> {
    try {
      let readingLevel = 2;
      if (ageBand === 'Age_3_5' || ageBand === 'Age3To5') readingLevel = 1;
      if (ageBand === 'Age_9_12' || ageBand === 'Age9To12') readingLevel = 3;

      // 1. Tạo hoặc cập nhật Learning Profile
      const lpRes = await this.setLearningProfile(childProfileId, {
        readingLevel,
        comprehensionGoal: `Phát triển tư duy nhận thức và thói quen đọc sách cho bé ${nickname || ''}`.trim(),
      });
      if (!lpRes.success) {
        return {
          success: false,
          message: lpRes.message || 'Lỗi thiết lập Learning Profile.',
          data: null,
          errors: lpRes.errors,
        };
      }

      // 2. Tạo hoặc cập nhật Safety Policy
      const spRes = await this.setSafetyPolicy(childProfileId, {
        maxStoryLength: 2500,
        requiredApprovalMode: 'AlwaysManual',
        parentalGateEnabled: true,
        consentRecorded: true,
      });
      if (!spRes.success) {
        return {
          success: false,
          message: spRes.message || 'Lỗi thiết lập Safety Policy.',
          data: null,
          errors: spRes.errors,
        };
      }

      // 3. Gọi Activate
      return await this.activateChildProfile(childProfileId);
    } catch (error) {
      console.error('Setup and activate child error:', error);
      return {
        success: false,
        message: 'Có lỗi trong quá trình kích hoạt hồ sơ trẻ.',
        data: null,
        errors: [(error as Error).message || 'Execution failed'],
      };
    }
  },

  /**
   * Lấy chi tiết hồ sơ trẻ theo ID (GET /ChildProfile/{id})
   */
  async getChildProfileById(id: number): Promise<ApiResponse<ChildProfile>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/ChildProfile/${id}`, {
        method: 'GET',
      });
      return await response.json();
    } catch (error) {
      console.error('Get child profile by id error:', error);
      return {
        success: false,
        message: 'Không thể lấy chi tiết hồ sơ trẻ.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Cập nhật thông tin hồ sơ trẻ (PUT /ChildProfile/{id})
   */
  async updateChildProfile(
    id: number,
    data: import('../types/childProfile').UpdateChildProfileRequest
  ): Promise<ApiResponse<ChildProfile>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/ChildProfile/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: data.nickname,
          ageBand: data.ageBand,
          language: data.language || 'vi',
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Update child profile error:', error);
      return {
        success: false,
        message: 'Không thể cập nhật hồ sơ trẻ.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Xóa/Lưu trữ hồ sơ trẻ (DELETE /ChildProfile/{id})
   */
  async deleteChildProfile(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/ChildProfile/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      console.error('Delete child profile error:', error);
      return {
        success: false,
        message: 'Không thể xóa hồ sơ trẻ.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy Learning Profile của trẻ (GET /LearningProfile/{childProfileId})
   */
  async getLearningProfile(
    childProfileId: number
  ): Promise<ApiResponse<import('../types/childProfile').LearningProfile>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/LearningProfile/${childProfileId}`,
        {
          method: 'GET',
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Get learning profile error:', error);
      return {
        success: false,
        message: 'Không thể lấy thông tin Learning Profile của bé.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy Safety Policy của trẻ (GET /SafetyPolicy/{childProfileId})
   */
  async getSafetyPolicy(
    childProfileId: number
  ): Promise<ApiResponse<import('../types/childProfile').SafetyPolicy>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/SafetyPolicy/${childProfileId}`,
        {
          method: 'GET',
        }
      );
      const result = await parseJsonResponse<ApiResponse<import('../types/childProfile').SafetyPolicy>>(response);
      return result ?? {
        success: false,
        message: 'Không thể lấy quy tắc an toàn của bé.',
        data: null as any,
      };
    } catch (error) {
      console.error('Get safety policy error:', error);
      return {
        success: false,
        message: 'Không thể lấy quy tắc an toàn của bé.',
        data: null as any,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy danh sách toàn bộ danh mục nội dung an toàn (GET /api/v1/ContentCategory)
   */
  async getContentCategories(): Promise<ApiResponse<import('../types/childProfile').ContentCategory[]>> {
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/ContentCategory`, {
        method: 'GET',
      });
      if (!response.ok) {
        return { success: false, message: 'Không thể tải danh mục nội dung.', data: [] };
      }
      const data = await parseJsonResponse<ApiResponse<import('../types/childProfile').ContentCategory[]>>(response);
      return data ?? { success: true, message: '', data: [] };
    } catch (error) {
      console.error('Get content categories error:', error);
      return { success: false, message: 'Lỗi tải danh mục nội dung.', data: [] };
    }
  },

  /**
   * Lấy hạn mức Token Quota AI của trẻ (GET /TokenQuota/child/{childProfileId})
   */
  async getTokenQuotaForChild(
    childProfileId: number
  ): Promise<ApiResponse<import('../types/childProfile').TokenQuotaStatus>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/TokenQuota/child/${childProfileId}`,
        {
          method: 'GET',
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Get token quota for child error:', error);
      return {
        success: false,
        message: 'Không thể lấy hạn mức Token Quota của bé.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },
};
