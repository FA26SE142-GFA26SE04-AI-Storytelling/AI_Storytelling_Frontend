import './components/shell/login.css';
import Link from 'next/link';
import { Home } from 'lucide-react';
import Frog from './components/brand/Frog';
import PondBackdrop from './components/brand/PondBackdrop';

export default function NotFound() {
  return (
    <div className="login-wrap">
      <PondBackdrop />
      <div className="login-card" style={{ textAlign: 'center', alignItems: 'center' }}>
        <span className="login-frog"><Frog size={110} mood="think" /></span>
        <span className="display" style={{ fontSize: 44, fontWeight: 800, color: 'var(--primary)' }}>404</span>
        <h1 className="display">Không tìm thấy trang này</h1>
        <p className="sub">Có vẻ bạn đã đi lạc khỏi Taletale. Quay về trang chủ để tiếp tục nhé!</p>
        <Link href="/" className="btn btn-p btn-c" style={{ padding: 10, width: '100%' }}><Home className="ic" />Về trang chủ</Link>
      </div>
    </div>
  );
}
