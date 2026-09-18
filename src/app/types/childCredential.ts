export interface ChildAvatarIcon {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
}

export const CHILD_AVATAR_LIST: ChildAvatarIcon[] = [
  { id: 'fox', name: 'Cáo Thông Thái', emoji: '🦊', bgColor: 'from-amber-500/30 to-orange-600/30', borderColor: 'border-orange-500/50' },
  { id: 'dino', name: 'Khủng Long Nhí', emoji: '🦖', bgColor: 'from-emerald-500/30 to-teal-600/30', borderColor: 'border-emerald-500/50' },
  { id: 'panda', name: 'Gấu Trúc Vui Vẻ', emoji: '🐼', bgColor: 'from-zinc-500/30 to-zinc-700/30', borderColor: 'border-zinc-400/50' },
  { id: 'lion', name: 'Sư Tử Dũng Cảm', emoji: '🦁', bgColor: 'from-yellow-500/30 to-amber-600/30', borderColor: 'border-yellow-500/50' },
  { id: 'rabbit', name: 'Thỏ Ngọc Nhanh Nhẹn', emoji: '🐰', bgColor: 'from-pink-500/30 to-rose-600/30', borderColor: 'border-pink-500/50' },
  { id: 'robot', name: 'Robot Tí Hon', emoji: '🤖', bgColor: 'from-cyan-500/30 to-blue-600/30', borderColor: 'border-cyan-500/50' },
  { id: 'rocket', name: 'Phi Hành Gia', emoji: '🚀', bgColor: 'from-indigo-500/30 to-purple-600/30', borderColor: 'border-indigo-500/50' },
  { id: 'penguin', name: 'Chim Cánh Cụt', emoji: '🐧', bgColor: 'from-sky-500/30 to-blue-700/30', borderColor: 'border-sky-500/50' },
  { id: 'dolphin', name: 'Cá Heo Thông Minh', emoji: '🐬', bgColor: 'from-teal-500/30 to-cyan-600/30', borderColor: 'border-teal-500/50' },
  { id: 'dragon', name: 'Rồng Con Phép Thuật', emoji: '🐲', bgColor: 'from-violet-500/30 to-fuchsia-600/30', borderColor: 'border-violet-500/50' },
  { id: 'koala', name: 'Gấu Koala Ngủ Mơ', emoji: '🐨', bgColor: 'from-stone-500/30 to-stone-700/30', borderColor: 'border-stone-400/50' },
  { id: 'tiger', name: 'Hổ Con Tinh Nghịch', emoji: '🐯', bgColor: 'from-orange-500/30 to-amber-600/30', borderColor: 'border-orange-400/50' },
];

export interface ChildAccessCredential {
  childProfileId: number;
  avatarId: string;
  pinCode: string; // 4 digits e.g. "1234"
  easyLoginBadgeCode: string; // e.g. "KID-7829-FOX"
  failedAttempts: number;
  lockedUntil: string | null; // ISO timestamp if locked
  lastLoginAt: string | null;
  updatedAt: string;
}

export interface ChildSession {
  childProfileId: number;
  nickname: string;
  ageBand: string;
  avatarId: string;
  avatarEmoji: string;
  avatarName: string;
  sessionToken: string;
  startedAt: string;
  entryMode: 'SupervisorLaunched' | 'IndependentEasyLogin';
}
