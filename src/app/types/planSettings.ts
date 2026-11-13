/** Đối tượng áp dụng gói đăng ký */
export type PlanAudience = 'User' | 'Creator';

/** Loại gói đăng ký có thể tạo mới */
export type CreatablePlanType = 'Reading' | 'Creative' | 'AddOn' | 'CreatorPack';

/** Quyền lợi chi tiết của gói đăng ký */
export interface PlanBenefitsInput {
  /** Số hồ sơ trẻ em tối đa */
  maxChildProfiles: number;
  /** Số truyện thư viện mới mỗi tuần (null nếu không giới hạn) */
  weeklyNewLibraryStories: number | null;
  /** Cho phép sao chép mẫu lộ trình đọc */
  canCopyRoadmapTemplates: boolean;
  /** Số lượt đọc to mỗi tháng (null nếu không giới hạn) */
  readAloudPerMonth: number | null;
  /** Số lượt trợ lý viết mỗi ngày */
  writingAssistPerDay: number;
}

/** Yêu cầu tạo mới gói đăng ký */
export interface CreateSubscriptionPlanRequest {
  /** Tên hiển thị của gói */
  name: string;
  /** Đối tượng người dùng áp dụng */
  audience: PlanAudience;
  /** Loại gói đăng ký */
  planType: CreatablePlanType;
  /** Giá gói bằng đơn vị VNĐ */
  priceVnd: number;
  /** Số lượt tạo AI được cấp */
  aiCredits: number;
  /** Số lượt gửi duyệt truyện được cấp */
  submitCredits: number;
  /** Trạng thái kích hoạt của gói */
  isActive: boolean;
  /** Quyền lợi đi kèm gói */
  benefits?: PlanBenefitsInput | null;
}

/** Cài đặt toàn hệ thống cho các gói dịch vụ và lượt dùng */
export interface PlanSettings {
  /** Tỷ lệ phần trăm phân bổ cho quỹ đọc */
  readingFundPercent: number;
  /** Tỷ lệ phần trăm phân bổ cho quỹ sáng tạo */
  creativeFundPercent: number;
  /** Số lượt AI hàng tháng của Creator */
  creatorMonthlyAiCredits: number;
  /** Số lượt gửi duyệt hàng tháng của Creator */
  creatorMonthlySubmitCredits: number;
  /** Số lượt AI hàng tháng của Đối tác */
  partnerMonthlyAiCredits: number;
  /** Số lượt gửi duyệt hàng tháng của Đối tác */
  partnerMonthlySubmitCredits: number;
  /** Thời gian đọc tối thiểu (giây) để ghi nhận hoàn thành */
  minimumReadSeconds: number;
  /** Số lượt AI dùng thử khi tạo tài khoản */
  trialAiCredits: number;
  /** Số hồ sơ trẻ em tối đa cho tài khoản miễn phí */
  freeMaxChildProfiles: number;
  /** Số truyện mới từ thư viện mỗi tuần cho tài khoản miễn phí (null nếu không giới hạn) */
  freeWeeklyNewLibraryStories: number | null;
  /** Cho phép tài khoản miễn phí sao chép mẫu lộ trình */
  freeCanCopyRoadmapTemplates: boolean;
  /** Số lượt đọc to mỗi tháng cho tài khoản miễn phí (null nếu không giới hạn) */
  freeReadAloudPerMonth: number | null;
  /** Số lượt trợ lý viết mỗi ngày cho tài khoản miễn phí */
  freeWritingAssistPerDay: number;
  /** Số lượt trợ lý viết mỗi ngày cho Creator */
  creatorWritingAssistPerDay: number;
  /** Số lượt trợ lý viết mỗi ngày cho Đối tác */
  partnerWritingAssistPerDay: number;
  /** Thời điểm cập nhật cấu hình lần cuối */
  updatedAt: string | null;
}

/** Dữ liệu cập nhật cài đặt gói hệ thống */
export type UpdatePlanSettingsRequest = Omit<PlanSettings, 'updatedAt'>;
