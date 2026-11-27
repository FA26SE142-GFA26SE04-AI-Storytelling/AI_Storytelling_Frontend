/**
 * Kiểu dữ liệu theo DTO backend (Luồng 5): cấp đối tác (5g), chi trả (5h), thống kê Creator cho Admin (5e),
 * audit log toàn hệ thống. Đơn đăng ký và tài khoản Creator: `adminCreatorService`.
 */

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
  /** Ngày đầu / ngày cuối kỳ (tính cả ngày cuối); API cũ không trả thì coi là trọn tháng periodMonth. */
  periodStart?: string;
  periodEnd?: string;
  validReads: number;
  amountVnd: number;
  creditedAt: string;
}

export interface CreatorPayoutOverview {
  creatorUserId: number;
  username: string;
  fullName: string;
  balanceVnd: number;
  /** Số dư tối thiểu để được chi, do Admin đặt; 0 = không có mức tối thiểu. */
  minimumPayoutVnd: number;
  /** Ngày trong tháng (giờ Việt Nam) chốt kỳ tháng trước và cộng thu nhập vào số dư, do Admin đặt. */
  periodCloseDay: number;
  hasPayoutAccount: boolean;
  reminder: string | null;
  payoutAccount: CreatorPayoutAccount | null;
  payouts: CreatorPayout[];
  earnings: CreatorPeriodEarningEntry[];
}

/** Kết quả Admin bấm Chốt kỳ ngay. */
export interface CreatorEarningPeriodClosed {
  id: number;
  periodStart: string;
  periodEnd: string;
  creatorFundVnd: number;
  totalValidReads: number;
  distributedVnd: number;
  creditedCreators: number;
  closedAt: string;
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
