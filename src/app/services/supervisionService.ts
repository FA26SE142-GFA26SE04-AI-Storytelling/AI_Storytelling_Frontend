import { USE_MOCK } from '@/app/mocks/config';
import { supervisionMockOverrides } from '@/app/mocks/mockSupervision';
import type { ApiResponse } from '@/app/types/auth';
import type { Invitation, OwnershipTransfer, Permission, PermissionRequest, SupervisionRelationship } from '@/app/types/supervision';
import { apiRequest } from './apiClient';

/** Luồng 1 Bước 1.5–1.7b, Mục 3: mời, gỡ, phân quyền người giám sát và chuyển quyền Owner. */
export const supervisionService = {
  listSupervisors(childId: number): Promise<ApiResponse<SupervisionRelationship[]>> {
    return apiRequest(`/Supervision/${childId}/relationships`, 'Không tải được danh sách người giám sát.');
  },

  /** Gỡ người giám sát (Owner gỡ người khác, hoặc người đó tự rời). */
  revokeSupervisor(relationshipId: number): Promise<ApiResponse<null>> {
    return apiRequest(`/Supervision/relationships/${relationshipId}`, 'Không gỡ được người giám sát.', { method: 'DELETE' });
  },

  listInvitations(childId: number): Promise<ApiResponse<Invitation[]>> {
    return apiRequest(`/Supervision/${childId}/invitations`, 'Không tải được danh sách lời mời.');
  },

  createInvitation(childId: number, inviteeEmail: string, expiresInDays = 7): Promise<ApiResponse<Invitation>> {
    return apiRequest(`/Supervision/${childId}/invitations`, 'Không gửi được lời mời.', { method: 'POST', body: { inviteeEmail, expiresInDays } });
  },

  cancelInvitation(invitationId: number): Promise<ApiResponse<null>> {
    return apiRequest(`/Supervision/invitations/${invitationId}`, 'Không hủy được lời mời.', { method: 'DELETE' });
  },

  acceptInvitation(invitationCode: string): Promise<ApiResponse<SupervisionRelationship>> {
    return apiRequest('/Supervision/invitations/accept', 'Mã mời không hợp lệ hoặc đã hết hạn.', { method: 'POST', body: { invitationCode } });
  },

  listPermissions(relationshipId: number): Promise<ApiResponse<string[]>> {
    return apiRequest(`/Supervision/relationships/${relationshipId}/permissions`, 'Không tải được quyền.');
  },

  grantPermission(relationshipId: number, permission: Permission): Promise<ApiResponse<null>> {
    return apiRequest(`/Supervision/relationships/${relationshipId}/permissions/${permission}`, 'Không cấp được quyền.', { method: 'POST' });
  },

  revokePermission(relationshipId: number, permission: Permission): Promise<ApiResponse<null>> {
    return apiRequest(`/Supervision/relationships/${relationshipId}/permissions/${permission}`, 'Không thu hồi được quyền.', { method: 'DELETE' });
  },

  /** Bước G — Additional Supervisor xin thêm 1 quyền. */
  requestPermission(relationshipId: number, permission: Permission): Promise<ApiResponse<PermissionRequest>> {
    return apiRequest(`/Permission/relationships/${relationshipId}/requests`, 'Không gửi được yêu cầu.', { method: 'POST', body: { permissions: [permission] } });
  },

  listPermissionRequests(relationshipId: number): Promise<ApiResponse<PermissionRequest[]>> {
    return apiRequest(`/Permission/relationships/${relationshipId}/requests`, 'Không tải được yêu cầu cấp quyền.');
  },

  answerPermissionRequest(requestId: number, action: 'accept' | 'reject' | 'cancel'): Promise<ApiResponse<PermissionRequest>> {
    return apiRequest(`/Permission/requests/${requestId}/${action}`, 'Không xử lý được yêu cầu.', { method: 'POST' });
  },

  /** Bước 1.7b — Owner đề nghị chuyển quyền Owner cho một Additional Supervisor. */
  requestOwnershipTransfer(childId: number, targetSupervisorUserId: number): Promise<ApiResponse<OwnershipTransfer>> {
    return apiRequest(`/Supervision/${childId}/transfer-ownership`, 'Không gửi được đề nghị chuyển quyền.', { method: 'POST', body: { targetSupervisorUserId } });
  },

  listOwnershipTransfers(childId: number): Promise<ApiResponse<OwnershipTransfer[]>> {
    return apiRequest(`/Supervision/${childId}/ownership-transfers`, 'Không tải được đề nghị chuyển quyền.');
  },

  answerOwnershipTransfer(transferId: number, accept: boolean): Promise<ApiResponse<unknown>> {
    return apiRequest(`/Supervision/ownership-transfers/${transferId}/${accept ? 'accept' : 'reject'}`, 'Không xử lý được đề nghị.', { method: 'POST' });
  },
};

if (USE_MOCK) Object.assign(supervisionService, supervisionMockOverrides);
