import type { ApiResponse, AuditLogEntry } from '@/app/types/auth';
import type { PagedResult } from '@/app/types/story';
import type {
  ChildProfile,
  ContentCategory,
  CreateChildProfileRequest,
  LearningProfile,
  SafetyPolicy,
  SetLearningProfileRequest,
  SetSafetyPolicyRequest,
  TokenQuotaStatus,
  UpdateChildProfileRequest,
} from '@/app/types/childProfile';
import { apiRequest } from './apiClient';

/** Luồng 1 Bước 1.2–1.4, 1.8, Mục 7: hồ sơ bé, hồ sơ học tập, cài đặt an toàn và vòng đời hồ sơ. */
export const childProfileService = {
  /** Mọi hồ sơ mình đang giám sát (Owner hoặc Additional Supervisor), trừ hồ sơ đã lưu trữ. */
  getMyChildProfiles(): Promise<ApiResponse<ChildProfile[]>> {
    return apiRequest('/ChildProfile/mine', 'Không tải được danh sách hồ sơ bé.');
  },

  getChildProfileById(id: number): Promise<ApiResponse<ChildProfile>> {
    return apiRequest(`/ChildProfile/${id}`, 'Không tải được hồ sơ bé.');
  },

  /** Hồ sơ mới ở trạng thái Nháp; người tạo là Owner. */
  createChildProfile(data: CreateChildProfileRequest): Promise<ApiResponse<ChildProfile>> {
    return apiRequest('/ChildProfile', 'Không tạo được hồ sơ bé.', {
      method: 'POST',
      body: { nickname: data.nickname.trim(), ageBand: data.ageBand, language: data.language?.trim() || 'vi' },
    });
  },

  /** Chỉ Owner. Đổi nhóm tuổi thì backend trả gợi ý áp lại danh sách chặn và chế độ đọc. */
  updateChildProfile(id: number, data: UpdateChildProfileRequest): Promise<ApiResponse<ChildProfile>> {
    return apiRequest(`/ChildProfile/${id}`, 'Không lưu được hồ sơ bé.', {
      method: 'PUT',
      body: { nickname: data.nickname.trim(), ageBand: data.ageBand, language: data.language?.trim() || 'vi', avatarId: data.avatarId },
    });
  },

  /** Bước 1.8 — cần hồ sơ học tập, cài đặt an toàn và đồng ý theo điều khoản hiện tại. */
  activateChildProfile(id: number): Promise<ApiResponse<ChildProfile>> {
    return apiRequest(`/ChildProfile/${id}/activate`, 'Chưa kích hoạt được hồ sơ.', { method: 'PATCH' });
  },

  /** Mục 7 — tạm dừng hồ sơ đang hoạt động; phiên của bé và mã QR bị thu hồi. */
  suspendChildProfile(id: number): Promise<ApiResponse<ChildProfile>> {
    return apiRequest(`/ChildProfile/${id}/suspend`, 'Không tạm dừng được hồ sơ.', { method: 'PATCH' });
  },

  /** Mục 7 — tiếp tục hồ sơ đang tạm dừng; điều khoản đã đổi thì phải đồng ý bản mới. */
  resumeChildProfile(id: number, acceptCurrentConsent = false): Promise<ApiResponse<ChildProfile>> {
    return apiRequest(`/ChildProfile/${id}/resume`, 'Không tiếp tục được hồ sơ.', { method: 'PATCH', body: { acceptCurrentConsent } });
  },

  /** Bước 1.8b — lưu trữ hồ sơ đang hoạt động hoặc tạm dừng. */
  archiveChildProfile(id: number): Promise<ApiResponse<null>> {
    return apiRequest(`/ChildProfile/${id}`, 'Không lưu trữ được hồ sơ.', { method: 'DELETE' });
  },

  /** Bước 1.8b — khôi phục hồ sơ đã lưu trữ về Active (chỉ Owner). Mã Easy Login cũ không dùng lại được, phải tạo mới. */
  restoreChildProfile(id: number): Promise<ApiResponse<ChildProfile>> {
    return apiRequest(`/ChildProfile/${id}/restore`, 'Không khôi phục được hồ sơ.', { method: 'PATCH' });
  },

  /** Lịch sử thay đổi của hồ sơ bé (chỉ Owner). */
  getChildAuditLog(id: number, pageIndex = 1): Promise<ApiResponse<PagedResult<AuditLogEntry>>> {
    return apiRequest(`/ChildProfile/${id}/audit-log?pageIndex=${pageIndex}&pageSize=20&isDescending=true`, 'Không tải được lịch sử thay đổi.');
  },

  getLearningProfile(childProfileId: number): Promise<ApiResponse<LearningProfile>> {
    return apiRequest(`/LearningProfile/${childProfileId}`, 'Bé chưa có hồ sơ học tập.');
  },

  /** Tạo hoặc cập nhật hồ sơ học tập (Owner hoặc quyền "Sửa mức đọc"). */
  setLearningProfile(childProfileId: number, data: SetLearningProfileRequest): Promise<ApiResponse<LearningProfile>> {
    return apiRequest(`/LearningProfile/${childProfileId}`, 'Không lưu được hồ sơ học tập.', {
      method: 'PUT',
      body: {
        readingLevel: data.readingLevel,
        readingMode: data.readingMode,
        comprehensionGoal: data.comprehensionGoal?.trim() || null,
        topics: data.topics ?? [],
      },
    });
  },

  getSafetyPolicy(childProfileId: number): Promise<ApiResponse<SafetyPolicy>> {
    return apiRequest(`/SafetyPolicy/${childProfileId}`, 'Bé chưa có cài đặt an toàn.');
  },

  /**
   * Tạo hoặc cập nhật cài đặt an toàn. Lần lưu đầu bắt buộc Owner đồng ý điều khoản.
   * Backend ghi đè mọi trường, nên trường không gửi sẽ về giá trị mặc định.
   */
  setSafetyPolicy(childProfileId: number, data: SetSafetyPolicyRequest): Promise<ApiResponse<SafetyPolicy>> {
    return apiRequest(`/SafetyPolicy/${childProfileId}`, 'Không lưu được cài đặt an toàn.', { method: 'PUT', body: data });
  },

  /** Owner đồng ý lại khi điều khoản đổi phiên bản. */
  reconsent(childProfileId: number): Promise<ApiResponse<SafetyPolicy>> {
    return apiRequest(`/SafetyPolicy/${childProfileId}/reconsent`, 'Chưa ghi nhận được đồng ý.', { method: 'POST' });
  },

  /** Áp lại danh sách chặn mặc định theo nhóm tuổi hiện tại (sau khi đổi nhóm tuổi). */
  applyAgePreset(childProfileId: number): Promise<ApiResponse<SafetyPolicy>> {
    return apiRequest(`/SafetyPolicy/${childProfileId}/age-preset/apply`, 'Không áp dụng được danh sách chặn mặc định.', { method: 'POST' });
  },

  getContentCategories(): Promise<ApiResponse<ContentCategory[]>> {
    return apiRequest('/ContentCategory', 'Không tải được danh mục nội dung.');
  },

  getTokenQuotaForChild(childProfileId: number): Promise<ApiResponse<TokenQuotaStatus>> {
    return apiRequest(`/TokenQuota/child/${childProfileId}`, 'Không lấy được số lượt tạo truyện của bé.');
  },
};
