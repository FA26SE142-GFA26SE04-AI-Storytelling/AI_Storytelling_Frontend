/** Đơn đăng ký Content Creator (`CreatorApplicationDto` backend). Dùng chung cho màn chờ duyệt của Creator và trang duyệt của Administrator. */
export type CreatorApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface CreatorApplication {
  id: number;
  applicantUserId: number;
  applicantUsername: string;
  applicantFullName: string;
  applicantEmail: string;
  /** Trạng thái tài khoản: Registered (chưa xác thực email), AwaitingApproval, Active, Suspended. */
  applicantStatus: string;
  introduction: string;
  portfolioUrl: string | null;
  status: CreatorApplicationStatus;
  createdAt: string;
  reviewedAt: string | null;
  /** Chỉ trả cho Administrator. */
  reviewedByName: string | null;
  rejectionReason: string | null;
}

/** Nộp lại đơn sau khi bị từ chối: giới thiệu 20–1000 ký tự, portfolio là URL ≤ 500 ký tự (không bắt buộc). */
export interface CreatorApplicationInput {
  introduction: string;
  portfolioUrl?: string | null;
}
