import type * as B from '@/app/types/backendContracts';
import type { LearningProfile, SafetyPolicy, SetLearningProfileRequest, SetSafetyPolicyRequest } from '@/app/types/childProfile';
import { apiRequest, apiQuery } from './apiClient';
export const profileLifecycleService = {
  accountAudit: (pageIndex: number, signal?: AbortSignal) => apiRequest<B.PagedResult<B.AuditLogDto>>(`/Auth/me/audit-log${apiQuery({pageIndex,pageSize:20})}`, 'Không tải được nhật ký.', {signal}),
  childAudit: (id: number, pageIndex: number, signal?: AbortSignal) => apiRequest<B.PagedResult<B.AuditLogDto>>(`/ChildProfile/${id}/audit-log${apiQuery({pageIndex,pageSize:20})}`, 'Không tải được nhật ký hồ sơ.', {signal}),
  restore: (id: number) => apiRequest<B.ChildProfileDto>(`/ChildProfile/${id}/restore`, 'Không khôi phục được hồ sơ.', {method:'PATCH'}),
  createLearning: (id: number, body: SetLearningProfileRequest) => apiRequest<LearningProfile>(`/LearningProfile/${id}`, 'Không tạo được hồ sơ học tập.', {method:'POST',body}),
  removeLearning: (id: number) => apiRequest<null>(`/LearningProfile/${id}`, 'Không xóa được hồ sơ học tập.', {method:'DELETE'}),
  createSafety: (id: number, body: SetSafetyPolicyRequest) => apiRequest<SafetyPolicy>(`/SafetyPolicy/${id}`, 'Không tạo được cài đặt an toàn.', {method:'POST',body}),
  removeSafety: (id: number) => apiRequest<null>(`/SafetyPolicy/${id}`, 'Không xóa được cài đặt an toàn.', {method:'DELETE'}),
  agePreset: (id: number) => apiRequest<B.AgePresetDto>(`/SafetyPolicy/${id}/age-preset`, 'Không tải được cấu hình theo tuổi.'),
};
