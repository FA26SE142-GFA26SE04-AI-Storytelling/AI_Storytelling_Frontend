/**
 * Kiểu dữ liệu theo DTO backend cho Content Creator (Luồng 5): đơn đăng ký (M5), quản lý tài khoản, cấp đối tác (5g),
 * chi trả (5h), thống kê cho Admin (5e) và audit log toàn hệ thống.
 */

export type CreatorApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface CreatorApplication {
  id: number;
  applicantUserId: number;
  applicantUsername: string;
  applicantFullName: string;
  applicantEmail: string;
  /** Registered: Creator chưa xác thực email nên chưa duyệt được. */
  applicantStatus: string;
  introduction: string;
  portfolioUrl: string | null;
  status: CreatorApplicationStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  rejectionReason: string | null;
}

export interface CreatorAccount {
  id: number;
  username: string;
  fullName: string;
  email: string;
  /** Active, Suspended, AwaitingApproval, Registered... */
  status: string;
  publishedStoryCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface DeactivateCreatorResult {
  creator: CreatorAccount;
  withdrawnSubmissions: number;
  closedSubmissions: number;
}

export interface PartnerCriterion {
  key: 'published_stories' | 'completion_rate' | 'valid_reads' | 'no_violation_removals' | string;
  current: number;
  target: number;
  met: boolean;
}

export interface PartnerProgress {
  windowStart: string;
  windowEnd: string;
  isEligible: boolean;
  criteria: PartnerCriterion[];
}

export interface CreatorTierEvaluation {
  periodMonth: string;
  publishedStories: number;
  completionRate: number;
  validReads: number;
  violationRemovals: number;
  eligible: boolean;
  tierBefore: string;
  tierAfter: string;
  evaluatedAt: string;
}

export interface CreatorTierOverview {
  creatorUserId: number;
  /** Standard hoặc Partner. */
  tier: string;
  partnerSince: string | null;
  progress: PartnerProgress;
  evaluations: CreatorTierEvaluation[];
}

// ---------- Chi trả (5h) ----------

export interface CreatorPayoutAccount {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  updatedAt: string;
}

export interface CreatorPayout {
  payoutId: number;
  creatorUserId: number;
  amountVnd: number;
  bankTransactionCode: string;
  transferredOn: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  recordedAt: string;
  status: 'Paid' | 'Cancelled';
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface CreatorPeriodEarningEntry {
  periodMonth: string;
  validReads: number;
  amountVnd: number;
  creditedAt: string;
}

export interface CreatorPayoutOverview {
  creatorUserId: number;
  username: string;
  fullName: string;
  balanceVnd: number;
  minimumPayoutVnd: number;
  hasPayoutAccount: boolean;
  reminder: string | null;
  payoutAccount: CreatorPayoutAccount | null;
  payouts: CreatorPayout[];
  earnings: CreatorPeriodEarningEntry[];
}

export interface CreatorPayoutDue {
  creatorUserId: number;
  username: string;
  fullName: string;
  balanceVnd: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface PayoutAccountInput {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface MarkPaidInput {
  amountVnd: number;
  bankTransactionCode: string;
  /** yyyy-MM-dd, ngày Việt Nam. */
  transferredOn: string;
}

// ---------- Thống kê Creator cho Admin (5e) ----------

export interface AdminCreatorStatisticsRow {
  creatorUserId: number;
  username: string;
  fullName: string;
  status: string;
  tier: string;
  storiesCreated: number;
  publishedStories: number;
  views: number;
  favorites: number;
  completedReadings: number;
  validReads: number;
  estimatedEarningsVnd: number;
}

export interface AdminCreatorStatistics {
  periodStart: string;
  periodEnd: string;
  totalCreators: number;
  activeCreators: number;
  partnerCreators: number;
  creatorsWithActivity: number;
  storiesCreated: number;
  publishedStories: number;
  views: number;
  favorites: number;
  completedReadings: number;
  validReads: number;
  creatorFundVnd: number;
  estimatedEarningsVnd: number;
  creators: AdminCreatorStatisticsRow[];
}

// ---------- Audit log ----------

export interface AdminAuditLog {
  id: number;
  actorUserId: number | null;
  actorUsername: string | null;
  actorFullName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: number;
  occurredAt: string;
  beforeState: string | null;
  afterState: string | null;
}

export interface AdminAuditLogQuery {
  pageIndex?: number;
  pageSize?: number;
  actorUserId?: number;
  systemOnly?: boolean;
  action?: string;
  entityType?: string;
  entityId?: number;
  from?: string;
  to?: string;
}

export interface AuditLogFilters {
  actions: string[];
  entityTypes: string[];
}

// ---------- Giới hạn sinh lại (Luồng 2, 3) ----------

export interface RegenerationCounter {
  used: number;
  limit: number;
  remaining: number;
}
