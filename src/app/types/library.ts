export interface LibraryStoryItem {
  id: string;
  badge: string;
  badgeBg?: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  rating?: number;
  duration?: string;
  listens?: string;
  audioVoice?: string;
  isFavorite?: boolean;
}

export interface AchievementBadge {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  bgColor: string;
}

export interface DayStreakItem {
  day: string;
  isCompleted: boolean;
  isCurrent?: boolean;
  isLocked?: boolean;
}
