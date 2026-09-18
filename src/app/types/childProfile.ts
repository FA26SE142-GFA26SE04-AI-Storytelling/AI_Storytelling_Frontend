export interface ChildProfile {
  id: number;
  ownerUserId: number;
  nickname: string;
  ageBand: string; // 'Age_6_8' | 'Age_9_12' | string
  language: string;
  status: string; // 'Active' | 'PendingParentConsent' | 'Archived' | string
  scope: string; // 'Personal' | 'Organization' | string
  organizationId?: number | null;
  classGroupId?: number | null;
  createdAt: string;
}

export interface CreateChildProfileRequest {
  nickname: string;
  ageBand: 'Age_6_8' | 'Age_9_12' | string;
  language?: string;
  scope?: 'Personal' | 'Organization' | string;
  organizationId?: number | null;
  classGroupId?: number | null;
}

export interface OrganizationSummary {
  id: number;
  name: string;
  address?: string | null;
  contactEmail?: string | null;
  verificationStatus: 'PendingVerification' | 'Active' | 'Suspended' | 'Rejected' | string;
  createdByUserId: number;
  createdAt: string;
}

export interface ClassGroupSummary {
  id: number;
  teacherUserId: number;
  name: string;
  status: 'Active' | 'Archived' | string;
  organizationId?: number | null;
}


export interface SetLearningProfileRequest {
  readingLevel: number; // 1 to 5
  comprehensionGoal?: string;
  topics?: Array<{
    topic: string;
    relation: 'FavoriteTopic' | 'Interested' | 'Avoid';
  }>;
}

export interface SetSafetyPolicyRequest {
  maxStoryLength: number; // 100 to 20000
  requiredApprovalMode: 'AlwaysManual' | 'AutoPublishOnThreshold';
  parentalGateEnabled: boolean;
  consentRecorded: boolean;
  categories?: Array<{
    contentCategoryId: number;
    rule: 'Allowed' | 'Restricted' | 'Blocked';
  }>;
}

export interface LearningProfileTopic {
  topic: string;
  relation: string;
}

export interface LearningProfile {
  id: number;
  childProfileId: number;
  readingLevel: number;
  comprehensionGoal?: string | null;
  topics: LearningProfileTopic[];
}

export interface SafetyPolicyCategory {
  contentCategoryId: number;
  rule: string;
}

export interface ContentCategory {
  id: number;
  code: string;
  displayName: string;
  isActive: boolean;
}

export interface SafetyPolicy {
  id: number;
  childProfileId: number;
  maxStoryLength: number;
  requiredApprovalMode: string;
  parentalGateEnabled: boolean;
  consentRecorded: boolean;
  categories: SafetyPolicyCategory[];
}

export interface TokenQuotaStatus {
  isUnlimited: boolean;
  scope?: string | null;
  quotaLimit?: number | null;
  quotaUsed?: number | null;
  remaining?: number | null;
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface UpdateChildProfileRequest {
  nickname: string;
  ageBand: string;
  language?: string;
}

export interface SupervisionRelationship {
  id: number;
  childProfileId: number;
  supervisorUserId: number;
  supervisorRole: 'Owner' | 'AdditionalSupervisor' | string;
  supervisorFullName?: string | null;
  supervisorEmail?: string | null;
}

export interface SupervisionInvitation {
  id: number;
  childProfileId: number;
  invitationCode: string;
  status: 'Pending' | 'Accepted' | 'Revoked' | 'Expired' | string;
  expiresAt?: string | null;
  inviteeEmail?: string | null;
  targetEmail?: string | null;
}

export interface CreateInvitationRequest {
  inviteeEmail?: string;
  expiresInDays?: number;
}

export interface AcceptInvitationRequest {
  invitationCode: string;
}

export interface TransferOwnershipRequest {
  targetSupervisorUserId: number;
}

export type SupervisionPermissionKey =
  | 'ViewProgress'
  | 'ViewResults'
  | 'AssignActivity'
  | 'ReceiveReport'
  | 'ApproveReadingLevel'
  | 'ApproveStory'
  | 'ManageSafetySettings'
  | 'GenerateStory';

export interface SupervisionPermissionInfo {
  key: SupervisionPermissionKey;
  label: string;
  description: string;
  category: 'monitoring' | 'content' | 'safety';
}

export const SYSTEM_PERMISSIONS_LIST: SupervisionPermissionInfo[] = [
  {
    key: 'ViewProgress',
    label: 'Theo dõi tiến trình đọc',
    description: 'Xem thời gian đọc sách hàng ngày, chuỗi ngày hoàn thành của bé.',
    category: 'monitoring',
  },
  {
    key: 'ViewResults',
    label: 'Xem kết quả bài tập & Quiz',
    description: 'Xem điểm số bài trắc nghiệm đọc hiểu, từ vựng và nhận xét AI.',
    category: 'monitoring',
  },
  {
    key: 'ReceiveReport',
    label: 'Nhận báo cáo học tập',
    description: 'Nhận thông báo tổng kết tuần và phân tích sự tiến bộ của bé.',
    category: 'monitoring',
  },
  {
    key: 'AssignActivity',
    label: 'Giao bài tập & Nhiệm vụ',
    description: 'Chỉ định câu chuyện cần đọc, giao thử thách học từ mới cho bé.',
    category: 'content',
  },
  {
    key: 'ApproveReadingLevel',
    label: 'Duyệt cấp độ đọc (Reading Level)',
    description: 'Cho phép điều chỉnh hoặc phê duyệt nâng cấp độ đọc (1 - 5) cho bé.',
    category: 'content',
  },
  {
    key: 'ApproveStory',
    label: 'Kiểm duyệt truyện trước khi đọc',
    description: 'Phê duyệt hoặc từ chối câu chuyện do AI tạo trước khi bé bắt đầu đọc.',
    category: 'content',
  },
  {
    key: 'GenerateStory',
    label: 'Tạo truyện AI cho bé',
    description: 'Chủ động yêu cầu AI sinh truyện dựa trên chủ đề hoặc tài liệu học tập.',
    category: 'content',
  },
  {
    key: 'ManageSafetySettings',
    label: 'Quản lý chính sách an toàn',
    description: 'Điều chỉnh thời lượng màn hình, bộ lọc chủ đề cấm và parental gate.',
    category: 'safety',
  },
];
