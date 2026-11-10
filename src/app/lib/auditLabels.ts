/**
 * Chữ tiếng Việt cho nhật ký hoạt động (AuditLog) của Backend.
 * Mã lấy từ các chỗ ghi nhật ký trong Backend; mã chưa có ở đây thì hiện chữ chung, không lộ mã kỹ thuật.
 */
const ACTION: Record<string, string> = {
  // Tài khoản
  UPDATE_PROFILE: 'Sửa thông tin tài khoản',
  CHANGE_EMAIL: 'Đổi email',
  CHANGE_PASSWORD: 'Đổi mật khẩu',
  RESET_PASSWORD: 'Đặt lại mật khẩu',
  RESEND_VERIFICATION_EMAIL: 'Gửi lại email xác minh',
  LOGOUT_ALL_DEVICES: 'Đăng xuất mọi thiết bị',
  DELETE_ACCOUNT: 'Xoá tài khoản',
  ModeratorActivated: 'Kích hoạt tài khoản Moderator',
  AdministratorActivated: 'Kích hoạt tài khoản quản trị',
  // Hồ sơ bé
  CREATE_CHILD_PROFILE: 'Tạo hồ sơ bé',
  UPDATE_CHILD_PROFILE: 'Sửa hồ sơ bé',
  ACTIVATE_CHILD_PROFILE: 'Kích hoạt hồ sơ bé',
  SUSPEND_CHILD_PROFILE: 'Tạm dừng hồ sơ bé',
  RESUME_CHILD_PROFILE: 'Mở lại hồ sơ bé',
  ARCHIVE_CHILD_PROFILE: 'Lưu trữ hồ sơ bé',
  RESTORE_CHILD_PROFILE: 'Khôi phục hồ sơ bé',
  DELETE_CHILD_PROFILE_WITH_ACCOUNT: 'Xoá hồ sơ bé cùng tài khoản',
  CREATE_EASY_LOGIN: 'Tạo mã đăng nhập cho bé',
  REGENERATE_EASY_LOGIN: 'Đổi mã đăng nhập của bé',
  REVOKE_EASY_LOGIN: 'Huỷ mã đăng nhập của bé',
  // An toàn
  SET_SAFETY_POLICY: 'Đổi cài đặt an toàn',
  APPLY_AGE_PRESET: 'Áp dụng cài đặt theo tuổi',
  DELETE_SAFETY_POLICY: 'Xoá cài đặt an toàn',
  RECORD_SAFETY_CONSENT: 'Đồng ý điều khoản an toàn',
  RECONSENT_SAFETY_POLICY: 'Đồng ý lại điều khoản an toàn',
  // Lộ trình của bé
  ChildRoadmapStoryAdded: 'Thêm truyện vào lộ trình',
  ChildRoadmapWishStoryAdded: 'Thêm truyện từ điều ước vào lộ trình',
  ChildRoadmapTemplateCopied: 'Thêm bộ lộ trình mẫu',
  ChildRoadmapStoryRemoved: 'Bỏ truyện khỏi lộ trình',
  ChildRoadmapStoryMoved: 'Đổi vị trí truyện trong lộ trình',
  ChildRoadmapReordered: 'Sắp xếp lại lộ trình',
  ChildRoadmapStepCompleted: 'Đọc xong một truyện trong lộ trình',
  ChildRoadmapItemSkippedByArchive: 'Bỏ qua truyện đã bị gỡ',
  ChildRoadmapCleared: 'Xoá hết lộ trình',
  // Điều ước
  StoryWishAccepted: 'Nhận điều ước và tạo truyện',
  StoryWishDeclined: 'Từ chối điều ước',
  StoryWishFulfilledWithExistingStory: 'Đáp điều ước bằng truyện có sẵn',
  // Soạn truyện
  parent_manual_draft_created: 'Tạo bản nháp truyện',
  parent_manual_content_saved: 'Lưu nội dung truyện',
  creator_manual_draft_created: 'Tạo bản nháp truyện',
  creator_manual_content_saved: 'Lưu nội dung truyện',
  CreatorManualContentConfirmed: 'Chốt nội dung truyện',
  CreatorRevisionCreated: 'Tạo bản chỉnh sửa',
  CreatorRemovalRequested: 'Yêu cầu gỡ truyện',
  CreatorRemovalApproved: 'Duyệt yêu cầu gỡ truyện',
  CreatorRemovalRejected: 'Từ chối yêu cầu gỡ truyện',
  PublicStorySubmitted: 'Gửi truyện đi duyệt',
  PublicStoryWithdrawn: 'Rút yêu cầu duyệt',
  PublicStorySubmissionClosedByArchive: 'Đóng yêu cầu duyệt do truyện bị lưu trữ',
  CommunitySubmissionSubmitted: 'Chia sẻ truyện lên cộng đồng',
  CommunitySubmissionWithdrawn: 'Rút truyện khỏi cộng đồng',
  CommunitySubmissionRemoved: 'Gỡ truyện khỏi cộng đồng',
  CommunitySubmissionClosedByArchive: 'Đóng chia sẻ do truyện bị lưu trữ',
  // Kiểm duyệt
  ModerationItemClaimed: 'Nhận xử lý một mục',
  ModerationItemOpened: 'Mở một mục kiểm duyệt',
  ModerationReviewViewGranted: 'Được cấp quyền xem nội dung',
  ContentReviewItemCreated: 'Tạo mục kiểm duyệt',
  PublicStoryReviewPackageOpened: 'Mở hồ sơ duyệt truyện',
  PublicStoryReviewChecklistSaved: 'Lưu danh sách kiểm tra',
  PublicStoryReviewCompared: 'So sánh hai phiên bản truyện',
  PublicStoryReviewFlagResolved: 'Xử lý một chỗ bị đánh dấu',
  PublicStoryReviewApproved: 'Duyệt truyện',
  PublicStoryReviewChangesRequested: 'Yêu cầu sửa truyện',
  PublicStoryReviewRejected: 'Từ chối truyện',
  PublishedContentOpened: 'Xem truyện đã công khai',
  PublishedRoadmapOpened: 'Xem lộ trình đã công khai',
  GrayZoneReviewOpened: 'Mở mục vùng xám',
  ContentReportCreated: 'Báo cáo nội dung',
  ContentReportOpened: 'Mở báo cáo nội dung',
  ContentReportEscalated: 'Chuyển báo cáo lên Admin',
  CommunityReviewPackageOpened: 'Mở hồ sơ duyệt truyện cộng đồng',
  CommunityReviewChecklistSaved: 'Lưu danh sách kiểm tra truyện cộng đồng',
  CommunityReviewLabelsChanged: 'Đổi nhãn truyện cộng đồng',
  RoadmapReviewPackageOpened: 'Mở hồ sơ duyệt lộ trình mẫu',
  RoadmapReviewChecklistSaved: 'Lưu danh sách kiểm tra lộ trình mẫu',
  // Lộ trình mẫu
  RoadmapTemplateCreated: 'Tạo lộ trình mẫu',
  RoadmapTemplateUpdated: 'Sửa lộ trình mẫu',
  RoadmapTemplateItemsSet: 'Cập nhật truyện trong lộ trình mẫu',
  RoadmapTemplateSubmitted: 'Gửi duyệt lộ trình mẫu',
  RoadmapTemplateWithdrawn: 'Rút lộ trình mẫu',
  RoadmapTemplateApproved: 'Duyệt lộ trình mẫu',
  RoadmapTemplateArchived: 'Lưu trữ lộ trình mẫu',
  RoadmapTemplateCloned: 'Nhân bản lộ trình mẫu',
  // Thẻ ước
  WishCardCreated: 'Tạo thẻ ước',
  WishCardUpdated: 'Sửa thẻ ước',
  WishCardVisibilityChanged: 'Ẩn / hiện thẻ ước',
  WishCardMatchAdded: 'Gắn thẻ ước với truyện',
  WishCardMatchRemoved: 'Bỏ gắn thẻ ước với truyện',
  WishCardsMatchedByAi: 'AI gợi ý thẻ ước cho truyện',
  WishCardMappingsChanged: 'Đổi thẻ ước của truyện',
  // Quản trị
  AuthoringGuideDraftCreated: 'Tạo bản nháp hướng dẫn sáng tác',
  AuthoringGuideDraftDiscarded: 'Bỏ bản nháp hướng dẫn sáng tác',
  AuthoringGuideCatalogPublished: 'Phát hành hướng dẫn sáng tác',
  BusinessReportPublished: 'Phát hành báo cáo',
  TokenQuotaConfigSet: 'Đổi hạn mức sử dụng',
  PaymentPaidViaWebhook: 'Thanh toán thành công',
  PaymentMarkedPaidManually: 'Xác nhận thanh toán thủ công',
  PaymentMismatchAmount: 'Thanh toán sai số tiền',
  PaymentCreditFailed: 'Cộng lượt sau thanh toán bị lỗi',
};

/** Đối tượng của nhật ký. */
const ENTITY: Record<string, string> = {
  UserAccount: 'Tài khoản',
  ChildProfile: 'Hồ sơ bé',
  ChildAccessCredential: 'Mã đăng nhập của bé',
  SafetyPolicy: 'Cài đặt an toàn',
  Story: 'Truyện',
  StoryVersion: 'Phiên bản truyện',
  StoryWish: 'Điều ước',
  ChildRoadmapItem: 'Lộ trình của bé',
  ModerationItem: 'Mục kiểm duyệt',
  RoadmapTemplate: 'Lộ trình mẫu',
  WishCard: 'Thẻ ước',
  AuthoringGuideCatalogVersion: 'Hướng dẫn sáng tác',
  BusinessReport: 'Báo cáo',
};

/** Một số chỗ chỉ ghi động từ chung (Created, Updated…): ghép với tên đối tượng. */
const VERB: Record<string, string> = { Created: 'Tạo', Updated: 'Sửa', Deleted: 'Xoá', Activated: 'Kích hoạt', Retired: 'Ngừng dùng', Cloned: 'Nhân bản', Evaluated: 'Đánh giá' };

export const auditEntityLabel = (type: string) => ENTITY[type] ?? 'Mục khác';
export function auditActionLabel(action: string, entityType: string) {
  if (ACTION[action]) return ACTION[action];
  if (VERB[action]) return `${VERB[action]} ${auditEntityLabel(entityType).toLowerCase()}`;
  return 'Thay đổi khác';
}
