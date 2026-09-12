import type { Metadata } from 'next';
import { ParentsView } from './ParentsView';

export const metadata: Metadata = {
  title: 'Góc Cho Mẹ - Đồng Hành & Quản Lý Phát Triển Cho Bé | MagicTales',
  description: 'Báo cáo chỉ số phát triển cảm xúc, theo dõi thời gian nghe đọc và bảng điều khiển kiểm soát phụ huynh an toàn cho bé.',
};

export default function ParentsPage() {
  return <ParentsView />;
}
