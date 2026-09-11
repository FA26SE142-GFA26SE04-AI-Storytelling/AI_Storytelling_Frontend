import type { Metadata } from 'next';
import { ExploreView } from './ExploreView';

export const metadata: Metadata = {
  title: 'Khám Phá Kho Tàng 5.000+ Truyện Cổ Tích AI - MagicTales',
  description: 'Khám phá kho tàng truyện cổ tích, bài học cảm xúc, vũ trụ khoa học dành cho bé được tạo bởi AI và đội ngũ chuyên gia tâm lý nhi khoa.',
};

export default function ExplorePage() {
  return <ExploreView />;
}
