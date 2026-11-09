/** Kiểu dữ liệu Luồng 1: quyền thao tác với hồ sơ bé, truy cập của bé, phiên đăng nhập. */

/** Tên các thao tác với hồ sơ bé; hiện chỉ chủ hồ sơ làm được (xem useMyRole). */
export type Permission =
  | 'ViewProgress'
  | 'ViewResults'
  | 'AssignActivity'
  | 'ReceiveReport'
  | 'ApproveReadingLevel'
  | 'ApproveStory'
  | 'ManageSafetySettings'
  | 'GenerateStory';

/** Easy Login dùng lâu dài (BR-1.15): backend chỉ lưu bản băm nên không xem lại được mã cũ. */
export interface ChildAccessCredential {
  childProfileId: number;
  hasEasyLogin: boolean;
  easyLoginCreatedAt?: string | null;
}

/** Mã Easy Login chỉ trả về một lần lúc tạo. */
export interface EasyLoginSecret {
  secret: string;
  createdAt: string;
}

export interface ChildSession {
  childProfileId: number;
  avatarId: string;
  accessToken: string;
  expiresInSeconds: number;
}

/** "Cho bé đọc truyện này" (Luồng 1c): bé nào đọc được truyện, lý do nếu không, bé được gợi ý. */
export interface StoryHandoverChild { childProfileId: number; nickname: string; canRead: boolean; skipCode: string | null; message: string | null }
export interface StoryHandoverOptions { storyId: number; suggestedChildProfileId: number | null; children: StoryHandoverChild[] }
/** Phiên của bé mở thẳng một truyện. */
export interface ChildStoryHandover extends ChildSession { storyId: number }

export interface ChildSessionProfile {
  childProfileId: number;
  nickname: string;
  ageBand: string;
}

export interface LoginSession {
  id: number;
  issuedAt: string;
  expiresAt: string;
}
