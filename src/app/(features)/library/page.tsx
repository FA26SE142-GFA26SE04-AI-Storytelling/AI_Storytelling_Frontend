import type { Metadata } from 'next';
import { LibraryView } from './LibraryView';

export const metadata: Metadata = {
  title: 'Tủ Truyện Diệu Kỳ Của Bé Bo - MagicTales',
  description: 'Quản lý tủ sách cá nhân, tiến trình đọc truyện, bài học cảm xúc, tác phẩm tự tạo cùng AI và bộ huy hiệu thám hiểm của bé.',
};

export default function LibraryPage() {
  return <LibraryView />;
}
