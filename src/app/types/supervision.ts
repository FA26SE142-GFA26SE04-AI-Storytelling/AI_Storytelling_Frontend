/** Kiểu dữ liệu Luồng 1: người giám sát, phân quyền, truy cập của bé, phiên đăng nhập. */

export type SupervisorRole = 'Owner' | 'AdditionalSupervisor';

/** 7 quyền giám sát theo đặc tả Luồng 1 Mục 8 (backend có thêm GenerateStory, không hiển thị). */
export type Permission =
  | 'ViewProgress'
  | 'ViewResults'
  | 'AssignActivity'
  | 'ReceiveReport'
  | 'ApproveReadingLevel'
  | 'ApproveStory'
  | 'ManageSafetySettings';

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

export interface ChildAccessCredential {
  childProfileId: number;
  avatarId: string;
  hasPin: boolean;
  isLocked: boolean;
}

export interface EasyLoginCode {
  code: string;
  expiresAt: string;
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
