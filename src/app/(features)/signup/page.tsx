import type { Metadata } from 'next';
import { SignUpForm } from './SignUpForm';

export const metadata: Metadata = {
  title: 'Đăng Ký Tài Khoản Miễn Phí - MagicTales',
  description: 'Tạo tài khoản gia đình MagicTales hoàn toàn miễn phí để bắt đầu hành trình sáng tạo truyện AI cho bé và nhận ngay 120 xu thưởng.',
};

export default function SignUpPage() {
  return <SignUpForm />;
}
