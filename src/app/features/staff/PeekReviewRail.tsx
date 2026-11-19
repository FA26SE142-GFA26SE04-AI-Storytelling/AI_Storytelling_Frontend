'use client';
import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { ClipboardCheck, Pin, PinOff } from 'lucide-react';

const CLOSE_DELAY_MS = 220;

/**
 * Cột "Kiểm tra & quyết định" thu gọn thành tab dọc ở mép phải bàn duyệt.
 * Rê chuột hoặc focus bàn phím vào thì cột mở rộng (cột đọc co lại nhường chỗ), rời chuột thì thu lại; nút ghim giữ mở (màn cảm ứng).
 * Dưới 1121px bố cục xếp một cột nên ngăn luôn hiện như cũ (CSS).
 */
export default function PeekReviewRail({ label, badge, children }: {
  label: string;
  badge?: number;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const open = hovered || focused || pinned;

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  useEffect(() => cancelClose, []);

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  return (
    <aside
      className={`mod-peek-rail${open ? ' open' : ''}`}
      aria-label={label}
      onMouseEnter={() => { cancelClose(); setHovered(true); }}
      onMouseLeave={() => {
        cancelClose();
        closeTimer.current = setTimeout(() => setHovered(false), CLOSE_DELAY_MS);
      }}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
    >
      <button
        type="button"
        className="mod-peek-handle"
        aria-expanded={open}
        aria-controls="mod-peek-drawer"
        onClick={() => setPinned(p => !p)}
      >
        <ClipboardCheck className="ic" aria-hidden="true" />
        <span className="mod-peek-handle-text">{label}</span>
        {!!badge && <span className="mod-peek-badge" aria-label={`${badge} việc cần xử lý`}>{badge}</span>}
      </button>
      <div id="mod-peek-drawer" className="st-card mod-desk-rail mod-peek-drawer">
        <div className="mod-peek-tools">
          <span className="sub">{pinned ? 'Đang ghim mở' : 'Rời chuột khỏi khung để thu gọn'}</span>
          <button
            type="button"
            className="btn btn-g mod-peek-pin"
            aria-pressed={pinned}
            onClick={() => setPinned(p => !p)}
          >
            {pinned ? <PinOff className="ic" aria-hidden="true" /> : <Pin className="ic" aria-hidden="true" />}
            {pinned ? 'Bỏ ghim' : 'Ghim mở'}
          </button>
        </div>
        {children}
      </div>
    </aside>
  );
}
