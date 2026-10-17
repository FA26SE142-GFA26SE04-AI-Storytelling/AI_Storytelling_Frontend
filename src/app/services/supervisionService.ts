import type { ApiResponse } from '@/app/types/auth';
import type {
  Invitation, InvitationClaim, InvitationPreview, OwnershipTransfer, Permission, PermissionRequest, SupervisionRelationship,
} from '@/app/types/supervision';
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

  /** Owner cấp lại mã cho lời mời đang chờ hoặc đã hết hạn; mã cũ hết hiệu lực. */
  regenerateInvitation(invitationId: number): Promise<ApiResponse<Invitation>> {
    return apiRequest(`/Supervision/invitations/${invitationId}/regenerate`, 'Không cấp lại được mã mời.', { method: 'POST' });
  },

  /** BR-1.4 bước 1 — nhập mã mời, backend gửi OTP tới email được mời. Gọi lại để gửi lại OTP. */
  claimInvitation(invitationCode: string): Promise<ApiResponse<InvitationClaim>> {
    return apiRequest('/Supervision/invitations/claim', 'Mã mời không hợp lệ hoặc đã hết hạn.', { method: 'POST', body: { invitationCode } });
  },

  /** BR-1.4 bước 2 — xác thực OTP, nhận thông tin hồ sơ để quyết định. */
  verifyInvitationOtp(invitationCode: string, otp: string): Promise<ApiResponse<InvitationPreview>> {
    return apiRequest('/Supervision/invitations/verify-otp', 'Mã xác thực không đúng hoặc đã hết hạn.', { method: 'POST', body: { invitationCode, otp } });
  },

  /** Bước 1.6 — nhận lời mời (phải xác thực OTP trước); nhận sẵn preset quyền mặc định. */
  acceptInvitation(invitationCode: string): Promise<ApiResponse<SupervisionRelationship>> {
    return apiRequest('/Supervision/invitations/accept', 'Chưa nhận được lời mời.', { method: 'POST', body: { invitationCode } });
  },

  /** Từ chối lời mời (sau khi đã xác thực OTP). */
  rejectInvitation(invitationCode: string): Promise<ApiResponse<null>> {
    return apiRequest('/Supervision/invitations/reject', 'Chưa từ chối được lời mời.', { method: 'POST', body: { invitationCode } });
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

  /** Owner huỷ đề nghị chuyển quyền đang chờ. */
  cancelOwnershipTransfer(transferId: number): Promise<ApiResponse<OwnershipTransfer>> {
    return apiRequest(`/Supervision/ownership-transfers/${transferId}/cancel`, 'Không huỷ được đề nghị.', { method: 'POST' });
  },
};
