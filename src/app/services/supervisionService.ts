import { ApiResponse } from '../types/auth';
import {
  SupervisionRelationship,
  SupervisionInvitation,
  CreateInvitationRequest,
} from '../types/childProfile';
import { authService } from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zirk5zduks.ap-southeast-1.awsapprunner.com/api/v1';

export const supervisionService = {
  /**
   * Lấy danh sách người giám sát của bé (GET /Supervision/{childProfileId}/relationships)
   */
  async getSupervisors(childProfileId: number): Promise<ApiResponse<SupervisionRelationship[]>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/${childProfileId}/relationships`,
        { method: 'GET' }
      );
      return await response.json();
    } catch (error) {
      console.error('Get supervisors error:', error);
      return {
        success: false,
        message: 'Không thể tải danh sách người giám sát.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy danh sách lời mời giám sát của bé (GET /Supervision/{childProfileId}/invitations)
   */
  async getInvitations(childProfileId: number): Promise<ApiResponse<SupervisionInvitation[]>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/${childProfileId}/invitations`,
        { method: 'GET' }
      );
      return await response.json();
    } catch (error) {
      console.error('Get invitations error:', error);
      return {
        success: false,
        message: 'Không thể tải danh sách lời mời giám sát.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Tạo lời mời giám sát mới (POST /Supervision/{childProfileId}/invitations)
   */
  async createInvitation(
    childProfileId: number,
    data: CreateInvitationRequest
  ): Promise<ApiResponse<SupervisionInvitation>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/${childProfileId}/invitations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteeEmail: data.inviteeEmail || null,
            expiresInDays: data.expiresInDays || 7,
          }),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Create invitation error:', error);
      return {
        success: false,
        message: 'Không thể tạo lời mời giám sát.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Huỷ lời mời giám sát (DELETE /Supervision/invitations/{invitationId})
   */
  async cancelInvitation(invitationId: number): Promise<ApiResponse<null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/invitations/${invitationId}`,
        { method: 'DELETE' }
      );
      return await response.json();
    } catch (error) {
      console.error('Cancel invitation error:', error);
      return {
        success: false,
        message: 'Không thể huỷ lời mời giám sát.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Cấp lại mã mời mới (Huỷ mã cũ nếu còn pending và tạo mã mới ngay)
   */
  async reissueInvitation(
    childProfileId: number,
    oldInvitationId: number,
    data: CreateInvitationRequest
  ): Promise<ApiResponse<SupervisionInvitation>> {
    try {
      // Hủy mã cũ nếu có
      await this.cancelInvitation(oldInvitationId);
      // Tạo mã mới
      return await this.createInvitation(childProfileId, data);
    } catch (error) {
      console.error('Reissue invitation error:', error);
      return {
        success: false,
        message: 'Không thể cấp lại mã mời mới.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Thu hồi quan hệ giám sát (DELETE /Supervision/relationships/{relationshipId})
   */
  async revokeSupervision(relationshipId: number): Promise<ApiResponse<null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/relationships/${relationshipId}`,
        { method: 'DELETE' }
      );
      return await response.json();
    } catch (error) {
      console.error('Revoke supervision error:', error);
      return {
        success: false,
        message: 'Không thể thu hồi quyền giám sát.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Chấp nhận lời mời giám sát bằng mã mời (POST /Supervision/invitations/accept)
   */
  async acceptInvitation(invitationCode: string): Promise<ApiResponse<SupervisionRelationship>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/invitations/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitationCode: invitationCode.trim() }),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Accept invitation error:', error);
      return {
        success: false,
        message: 'Không thể chấp nhận lời mời giám sát.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Chuyển nhượng quyền Owner cho 1 Additional Supervisor (POST /Supervision/{childProfileId}/transfer-ownership)
   */
  async transferOwnership(
    childProfileId: number,
    targetSupervisorUserId: number
  ): Promise<ApiResponse<SupervisionRelationship>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/${childProfileId}/transfer-ownership`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetSupervisorUserId }),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Transfer ownership error:', error);
      return {
        success: false,
        message: 'Không thể chuyển quyền Owner.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy danh mục toàn bộ quyền hệ thống (GET /Permission)
   */
  async getSystemPermissions(): Promise<ApiResponse<string[]>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Permission`,
        { method: 'GET' }
      );
      return await response.json();
    } catch (error) {
      console.error('Get system permissions error:', error);
      return {
        success: false,
        message: 'Không thể tải danh mục quyền hệ thống.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Lấy danh sách quyền đã cấp cho 1 quan hệ giám sát (GET /Supervision/relationships/{relationshipId}/permissions)
   */
  async getRelationshipPermissions(relationshipId: number): Promise<ApiResponse<string[]>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/relationships/${relationshipId}/permissions`,
        { method: 'GET' }
      );
      return await response.json();
    } catch (error) {
      console.error('Get relationship permissions error:', error);
      return {
        success: false,
        message: 'Không thể tải danh sách quyền của người giám sát.',
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Cấp 1 quyền cho quan hệ giám sát (POST /Supervision/relationships/{relationshipId}/permissions/{permission})
   */
  async grantPermission(relationshipId: number, permission: string): Promise<ApiResponse<null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/relationships/${relationshipId}/permissions/${permission}`,
        { method: 'POST' }
      );
      return await response.json();
    } catch (error) {
      console.error('Grant permission error:', error);
      return {
        success: false,
        message: `Không thể cấp quyền ${permission}.`,
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },

  /**
   * Thu hồi 1 quyền khỏi quan hệ giám sát (DELETE /Supervision/relationships/{relationshipId}/permissions/{permission})
   */
  async revokePermission(relationshipId: number, permission: string): Promise<ApiResponse<null>> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/Supervision/relationships/${relationshipId}/permissions/${permission}`,
        { method: 'DELETE' }
      );
      return await response.json();
    } catch (error) {
      console.error('Revoke permission error:', error);
      return {
        success: false,
        message: `Không thể thu hồi quyền ${permission}.`,
        data: null,
        errors: [(error as Error).message || 'Network error'],
      };
    }
  },
};

