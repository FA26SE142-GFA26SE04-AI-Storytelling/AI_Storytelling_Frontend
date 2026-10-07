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
