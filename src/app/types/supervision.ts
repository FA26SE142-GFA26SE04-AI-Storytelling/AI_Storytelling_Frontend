/** Kiểu dữ liệu Luồng 1: người giám sát, phân quyền, truy cập của bé, phiên đăng nhập. */

export type SupervisorRole = 'Owner' | 'AdditionalSupervisor';

/** Eight supervision permissions from the current backend contract. */
export type Permission =
  | 'ViewProgress'
  | 'ViewResults'
  | 'AssignActivity'
  | 'ReceiveReport'
  | 'ApproveReadingLevel'
  | 'ApproveStory'
  | 'ManageSafetySettings'
  | 'GenerateStory';

export interface SupervisionRelationship {
  id: number;
  childProfileId: number;
  supervisorUserId: number;
  supervisorRole: SupervisorRole | string;
}

export interface Invitation {
  id: number;
  childProfileId: number;
  invitationCode: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired' | 'Revoked' | string;
  expiresAt?: string | null;
}

export interface PermissionRequest {
  id: number;
  supervisionRelationshipId: number;
  requesterUserId: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | string;
  permissions: string[];
  createdAt: string;
  respondedAt?: string | null;
}

export interface OwnershipTransfer {
  id: number;
  childProfileId: number;
  currentOwnerUserId: number;
  targetSupervisorUserId: number;
  requesterUserId: number;
  responderUserId: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | string;
  createdAt: string;
  respondedAt?: string | null;
}

/** Bước 1.4 — nhận lời mời: backend gửi OTP tới email được mời. */
export interface InvitationClaim {
  maskedEmail: string;
  otpExpiresAt: string;
}

/** Thông tin hồ sơ được xem sau khi xác thực OTP, trước khi Nhận / Từ chối. */
export interface InvitationPreview {
  invitationId: number;
  inviterName: string;
  childNickname: string;
  childAgeBand: string;
}

/** Easy Login dùng lâu dài (BR-1.15): backend chỉ lưu bản băm nên không xem lại được mã cũ. */
export interface ChildAccessCredential {
  childProfileId: number;
  hasEasyLogin: boolean;
  easyLoginCreatedAt?: string | null;
}

/** Mã Easy Login chỉ trả về một lần lúc tạo. */
export interface EasyLoginSecret {
  secret: string;
  createdAt: string;
}

export interface ChildSession {
  childProfileId: number;
  avatarId: string;
  accessToken: string;
  expiresInSeconds: number;
}

export interface ChildSessionProfile {
  childProfileId: number;
  nickname: string;
  ageBand: string;
}

export interface LoginSession {
  id: number;
  issuedAt: string;
  expiresAt: string;
}
