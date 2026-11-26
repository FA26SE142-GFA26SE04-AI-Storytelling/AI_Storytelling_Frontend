/** Nhóm tuổi theo đặc tả Luồng 1 (WF-L1A / S8): nhóm thứ hai là 9–10 tuổi. */
export type AgeBand = 'Age_6_8' | 'Age_9_10';

/** Chế độ đọc của bé (Luồng 1 Bước 1.3): nghe là chính hoặc tự đọc. */
export type ReadingMode = 'ListenFirst' | 'ReadFirst';

export interface ChildProfile {
  id: number;
  ownerUserId: number;
  nickname: string;
  /** Avatar thuộc hồ sơ bé, backend gán mặc định khi tạo. */
  avatarId: string;
  ageBand: AgeBand | string;
  /** Tuổi cụ thể 6–10, khớp nhóm tuổi; null với hồ sơ tạo trước khi có trường này. */
  age?: number | null;
  language: string;
  status: string; // 'Draft' | 'Active' | 'Suspended' | 'Archived'
  createdAt: string;
  /** Đổi nhóm tuổi xong: gợi ý áp dụng lại danh sách chặn mặc định. */
  shouldReapplyBlockedPreset?: boolean;
  /** Đổi nhóm tuổi xong: chế độ đọc gợi ý cho nhóm tuổi mới. */
  suggestedReadingMode?: ReadingMode | string | null;
}

export interface CreateChildProfileRequest {
  nickname: string;
  ageBand: AgeBand | string;
  language?: string;
  /** Tuổi cụ thể 6–10, phải khớp nhóm tuổi. */
  age?: number | null;
  /** Ảnh đại diện; bỏ trống thì backend gán ảnh mặc định. */
  avatarId?: string;
}

export interface UpdateChildProfileRequest {
  nickname: string;
  ageBand: AgeBand | string;
  language?: string;
  avatarId?: string;
  /** Không gửi: backend giữ tuổi đang lưu nếu còn khớp nhóm tuổi, không thì xoá. */
  age?: number | null;
}

export type TopicRelation = 'FavoriteTopic';

export interface SetLearningProfileRequest {
  readingLevel: number; // 1 to 5
  readingMode?: ReadingMode;
  comprehensionGoal?: string;
  topics?: Array<{
    topic: string;
    relation: TopicRelation;
  }>;
}

/** Đặc tả (Luồng 1 v31) chỉ còn Cho phép / Chặn; backend từ chối Restricted. */
export type PolicyRule = 'Allowed' | 'Blocked';

export type ApprovalMode = 'AlwaysManual' | 'AutoPublishOnThreshold';

export interface SetSafetyPolicyRequest {
  maxStoryLength: number; // 100 to 20000
  /** Độ dài truyện phụ huynh tự chỉnh (100–9000 từ); null/bỏ trống = theo mức đọc của bé. */
  storyLengthTarget?: number | null;
  requiredApprovalMode: ApprovalMode;
  parentalGateEnabled: boolean;
  consentRecorded: boolean;
  safetyScoreThreshold?: number | null;
  readabilityScoreThreshold?: number | null;
  storyWishesEnabled?: boolean;
  allowInteractiveStories?: boolean;
  childCreationEnabled?: boolean;
  childCreationMode?: string;
  voiceAnswersEnabled?: boolean;
  voiceConsentAccepted?: boolean;
  /** Quyền của bé; bỏ trống = giữ nguyên giá trị đang lưu. */
  quizEnabled?: boolean;
  notebookEnabled?: boolean;
  libraryBrowseEnabled?: boolean;
  reflectionEnabled?: boolean;
  rewardsEnabled?: boolean;
  /** Lần lưu đầu: có tự thêm danh sách chặn theo nhóm tuổi hay không. */
  applyAgePreset?: boolean;
  categories?: Array<{
    contentCategoryId: number;
    rule: PolicyRule;
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
  readingMode?: ReadingMode | string;
  comprehensionGoal?: string | null;
  topics: LearningProfileTopic[];
}

export interface SafetyPolicyCategory {
  contentCategoryId: number;
  rule: string;
}

export type ContentCategoryGroup = 'Genre' | 'LifeValue' | 'Learning' | 'SafetyWarning';

export interface ContentCategory {
  id: number;
  code: string;
  displayName: string;
  /** Nhóm nhãn backend trả về (Genre, LifeValue, Learning, SafetyWarning). */
  group?: ContentCategoryGroup;
  isActive: boolean;
  /** Nhóm tuổi mà danh mục này bị chặn mặc định khi tạo hồ sơ. */
  defaultBlockedAgeBands?: string[];
}

export interface SafetyPolicy {
  id: number;
  childProfileId: number;
  maxStoryLength: number;
  /** Độ dài truyện phụ huynh tự chỉnh; null = theo mức đọc của bé. */
  storyLengthTarget?: number | null;
  requiredApprovalMode: string;
  parentalGateEnabled: boolean;
  consentRecorded: boolean;
  consentRecordedAt?: string | null;
  consentPolicyVersion?: number;
  /** Điều khoản đã đổi phiên bản: Owner phải đồng ý lại. */
  consentOutdated?: boolean;
  safetyScoreThreshold?: number | null;
  readabilityScoreThreshold?: number | null;
  storyWishesEnabled?: boolean;
  allowInteractiveStories?: boolean;
  childCreationEnabled?: boolean;
  childCreationMode?: string;
  voiceAnswersEnabled?: boolean;
  /** Lúc phụ huynh đồng ý mục (e) về giọng nói; null = chưa đồng ý, bật lần đầu phải đồng ý. */
  voiceConsentAt?: string | null;
  /** Quyền của bé; thiếu (backend cũ) = bật. */
  quizEnabled?: boolean;
  notebookEnabled?: boolean;
  libraryBrowseEnabled?: boolean;
  reflectionEnabled?: boolean;
  rewardsEnabled?: boolean;
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
