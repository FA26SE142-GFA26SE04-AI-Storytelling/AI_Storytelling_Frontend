/** Luồng F-03: chọn hồ sơ bé được đọc truyện khi gói chỉ cho N bé. Khớp DTO backend ReadingSlotsDto. */
export type ReadingSlotProfile = {
  childProfileId: number;
  nickname: string;
  canRead: boolean;
  isSelected: boolean;
};

export type ReadingSlotsDto = {
  /** Số bé tối đa được đọc theo gói hiện tại (N). */
  slots: number;
  /** true khi số hồ sơ Active vượt số chỗ: cần chọn lại. */
  isOverLimit: boolean;
  /** Mốc UTC có thể đổi lại; null nghĩa là đổi được ngay. Mốc là 00:00 thứ Hai giờ Việt Nam. */
  nextChangeAllowedAt: string | null;
  profiles: ReadingSlotProfile[];
};
