import {
  AssignmentItem,
  AssignmentStatus,
  SharedStoryItem,
  ShareMode,
  TeacherShareStatus,
  RecipientStatus,
  InterventionCaseItem,
  InterventionStatus,
  InterventionTrigger,
  ContentReportItem,
  ContentReportReason,
  ContentReportStatus,
  Flow4NotificationItem,
  Flow4NotificationType,
} from '../types/flow4Types';

export const SEED_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: 101,
    storyId: 1,
    storyTitle: 'Nobita và Vương Quốc Cổ Tích Bí Mật',
    storyCoverUrl: '/covers/fairytale.jpg',
    assignedByUserId: 12,
    assignedByName: 'Cô Mai (Chủ nhiệm Lớp Lá 1)',
    classGroupId: 1,
    classGroupName: 'Lớp Mầm Non Họa Mi (Lá 1)',
    status: AssignmentStatus.Assigned,
    assignedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    recipients: [
      {
        id: 201,
        assignmentId: 101,
        childProfileId: 1,
        childName: 'Nobita (Bé)',
        status: AssignmentStatus.Assigned,
      },
      {
        id: 202,
        assignmentId: 101,
        childProfileId: 2,
        childName: 'Shizuka (Bé)',
        status: AssignmentStatus.Completed,
        completedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        o2oAssessment: {
          id: 501,
          assignmentRecipientId: 202,
          teacherUserId: 12,
          teacherName: 'Cô Mai',
          bonusPoints: 1,
          notes: 'Bé phát âm rất chuẩn và tương tác tự tin trước lớp!',
          assessedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      },
    ],
  },
  {
    id: 102,
    storyId: 3,
    storyTitle: 'Chuyến Phiêu Lưu Trong Giọt Nước Tí Hon',
    storyCoverUrl: '/covers/water.jpg',
    assignedByUserId: 12,
    assignedByName: 'Cô Mai (Chủ nhiệm Lớp Lá 1)',
    classGroupId: 1,
    classGroupName: 'Lớp Mầm Non Họa Mi (Lá 1)',
    status: AssignmentStatus.Assigned,
    assignedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    dueAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    recipients: [
      {
        id: 203,
        assignmentId: 102,
        childProfileId: 1,
        childName: 'Nobita (Bé)',
        status: AssignmentStatus.Assigned,
      },
    ],
  },
];

export const SEED_SHARED_STORIES: SharedStoryItem[] = [
  {
    id: 301,
    storyId: 2,
    storyTitle: 'Khu Vườn Của Những Giấc Mơ Xanh',
    storyCoverUrl: '/covers/garden.jpg',
    sharedByUserId: 15,
    sharedByName: 'Mẹ Shizuka (Phụ huynh)',
    classGroupId: 1,
    classGroupName: 'Lớp Mầm Non Họa Mi (Lá 1)',
    shareMode: ShareMode.Broadcast,
    teacherStatus: TeacherShareStatus.Approved,
    teacherNotes: 'Nội dung rất ý nghĩa và giáo dục lòng yêu cây xanh!',
    reviewedByUserId: 12,
    reviewedByName: 'Cô Mai',
    reviewedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    recipients: [
      {
        id: 401,
        sharedStoryId: 301,
        recipientUserId: 1,
        recipientName: 'Bố Mẹ Nobita',
        childName: 'Nobita (Bé)',
        status: RecipientStatus.Pending,
      },
    ],
  },
];

export const SEED_INTERVENTIONS: InterventionCaseItem[] = [
  {
    id: 601,
    childProfileId: 1,
    childName: 'Nobita (Bé)',
    triggerType: InterventionTrigger.AutoLowComprehension,
    status: InterventionStatus.OpenHoldMode,
    openedAt: new Date(Date.now() - 86400000).toISOString(),
    triggeringStoryId: 1,
    triggeringStoryTitle: 'Nobita và Vương Quốc Cổ Tích Bí Mật',
    comprehensionRate: 62,
    skillGapNotes: 'Bé gặp khó khăn khi liên kết các sự kiện liên tiếp và ghi nhớ từ vựng miêu tả không gian.',
  },
];

export const SEED_REPORTS: ContentReportItem[] = [
  {
    id: 701,
    storyId: 4,
    storyTitle: 'Bí Mật Rừng Sương Mù',
    reporterUserId: 1,
    reporterName: 'Phụ huynh Nobita',
    reason: ContentReportReason.WrongAgeBand,
    description: 'Truyện có một số cảnh miêu tả bóng đêm hơi đáng sợ đối với các bé lứa tuổi mầm non.',
    status: ContentReportStatus.Pending,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const SEED_NOTIFICATIONS: Flow4NotificationItem[] = [
  {
    id: 801,
    userId: 1,
    type: Flow4NotificationType.HoldModeAlert,
    title: 'Cần hỗ trợ đọc hiểu (Hold Mode)',
    message: 'Bé Nobita có tỷ lệ đọc hiểu liên tục dưới 70%. Chế độ hỗ trợ sư phạm đã được kích hoạt để giáo viên đồng hành.',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 802,
    userId: 1,
    type: Flow4NotificationType.StoryShared,
    title: 'Truyện mới chia sẻ từ lớp học',
    message: 'Mẹ Shizuka vừa chia sẻ truyện "Khu Vườn Của Những Giấc Mơ Xanh" cho cả lớp. Bạn có thể duyệt nhận cho bé đọc.',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];
