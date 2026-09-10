export interface StoryCategory {
  id: string;
  title: string;
  count: string;
  icon: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
}

export interface StoryItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  tag: string;
  tagColor: string;
  listens: string;
  rating: number;
  imageUrl: string;
  actionText: string;
  actionType: 'play' | 'read';
  isFavorite?: boolean;
}

export interface LullabySound {
  id: string;
  name: string;
  icon: string;
}
