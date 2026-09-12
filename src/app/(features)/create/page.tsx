import type { Metadata } from 'next';
import { CreateView } from './CreateView';

export const metadata: Metadata = {
  title: 'Xưởng Phép Thuật AI - Sáng Tạo Câu Chuyện Cho Bé | MagicTales',
  description: 'Dệt nên những câu chuyện cổ tích kỳ diệu riêng cho bé với công nghệ AI vẽ tranh minh họa và lồng tiếng sống động.',
};

export default function CreatePage() {
  return <CreateView />;
}
