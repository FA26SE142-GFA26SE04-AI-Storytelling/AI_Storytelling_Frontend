import type { Metadata } from 'next';
import { SignInForm } from './SignInForm';

export const metadata: Metadata = {
  title: 'Đăng Nhập Tài Khoản Gia Đình - MagicTales',
  description: 'Đăng nhập vào tài khoản gia đình MagicTales để mở khóa kho tàng câu chuyện cổ tích và sáng tạo truyện AI.',
};

export default function SignInPage() {
  return <SignInForm />;
}
