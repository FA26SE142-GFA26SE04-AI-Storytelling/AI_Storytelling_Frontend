export interface FeaturedTopic {
  id: string;
  title: string;
  count: string;
  icon: string;
  colorBg: string;
  cardBorder: string;
  hoverBg: string;
}

export interface ShowcaseCollection {
  id: string;
  tag: string;
  count: string;
  title: string;
  description: string;
  ages: string[];
  badgeBg: string;
  cardBg: string;
  accentBorder: string;
  btnBg: string;
}

export interface ExploreStoryItem {
  id: string;
  categoryTag: string;
  title: string;
  description: string;
  badgeText: string;
  badgeColor: string;
  duration: string;
  rating: number;
  listens: string;
  imageUrl: string;
  actionText: string;
}
