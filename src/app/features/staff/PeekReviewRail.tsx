'use client';
import { useEffect, useRef, useState, type FocusEvent, type ReactNode, type RefObject } from 'react';
import { ClipboardCheck, Pin, PinOff } from 'lucide-react';

const CLOSE_DELAY_MS = 220;
const FIT_GAP_PX = 8;
const FIT_MIN_PX = 240;

/**
 * Giữ ngăn cao vừa phần nhìn thấy của vùng cuộn: từ mép trên của ngăn tới đáy vùng cuộn.
 * Ở đầu trang ngăn chưa dính lên trên (còn thẻ hồ sơ phía trên) nên chiều cao cố định sẽ lòi đáy ra ngoài.
 * Ghi vào biến CSS --peek-fit-h; khi không đo được (màn hẹp, SSR) CSS tự dùng 100cqh.
 */
function useFitToScrollport(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const rail = ref.current;
    if (!rail || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const scroller = rail.closest<HTMLElement>('.mod-detail-col');
    if (!scroller) return;
    const wide = window.matchMedia('(min-width: 1121px)');
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!wide.matches) { rail.style.removeProperty('--peek-fit-h'); return; }
      const available = scroller.getBoundingClientRect().bottom - rail.getBoundingClientRect().top - FIT_GAP_PX;
      rail.style.setProperty('--peek-fit-h', `${Math.max(FIT_MIN_PX, Math.floor(available))}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    wide.addEventListener('change', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(scroller);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      wide.removeEventListener('change', schedule);
      observer?.disconnect();
    };
  }, [ref]);
}

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
  const railRef = useRef<HTMLElement>(null);
  const open = hovered || focused || pinned;
  useFitToScrollport(railRef);

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
      ref={railRef}
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
