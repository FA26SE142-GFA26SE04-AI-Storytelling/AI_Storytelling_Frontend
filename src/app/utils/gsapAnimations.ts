import { gsap } from 'gsap';

// Tắt cảnh báo null target từ GSAP toàn cục
if (typeof window !== 'undefined') {
  gsap.config({ nullTargetWarn: false });
}

/**
 * Kiểm tra xem target có tồn tại trong DOM không trước khi chạy animation
 */
export function hasValidTarget(target: gsap.DOMTarget): boolean {
  if (!target) return false;
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (typeof target === 'string') {
    try {
      return document.querySelectorAll(target).length > 0;
    } catch {
      return false;
    }
  }
  if (Array.isArray(target)) {
    return target.length > 0 && target.some((t) => hasValidTarget(t));
  }
  if (target instanceof NodeList || target instanceof HTMLCollection) {
    return target.length > 0;
  }
  return true;
}

/**
 * GSAP Animation Helpers & Presets
 * Cung cấp các hiệu ứng xuất hiện (entrance animations) chuẩn hóa và mượt mà cho UI
 */

export const gsapEasing = {
  smooth: 'power3.out',
  bounce: 'back.out(1.4)',
  elastic: 'elastic.out(1, 0.75)',
  standard: 'power2.out',
  inOut: 'power2.inOut',
};

/**
 * Hiệu ứng trượt từ trên xuống và làm rõ (Top Bar / Header)
 */
export function animateHeaderDown(
  target: gsap.DOMTarget,
  options?: gsap.TweenVars
) {
  if (!hasValidTarget(target)) return null;
  return gsap.from(target, {
    y: -40,
    opacity: 0,
    duration: 0.6,
    ease: gsapEasing.smooth,
    ...options,
  });
}

/**
 * Hiệu ứng trượt từ trái sang (Left Drawer / Sidebar)
 */
export function animateDrawerLeft(
  target: gsap.DOMTarget,
  options?: gsap.TweenVars
) {
  if (!hasValidTarget(target)) return null;
  return gsap.from(target, {
    x: -80,
    opacity: 0,
    duration: 0.65,
    ease: gsapEasing.bounce,
    ...options,
  });
}

/**
 * Hiệu ứng trượt từ phải sang (Right Drawer / Detail Panel)
 */
export function animateDrawerRight(
  target: gsap.DOMTarget,
  options?: gsap.TweenVars
) {
  if (!hasValidTarget(target)) return null;
  return gsap.from(target, {
    x: 80,
    opacity: 0,
    duration: 0.65,
    ease: gsapEasing.bounce,
    ...options,
  });
}

/**
 * Hiệu ứng trượt từ dưới lên (Bottom Bar / Footer / Action Bar)
 */
export function animateFooterUp(
  target: gsap.DOMTarget,
  options?: gsap.TweenVars
) {
  if (!hasValidTarget(target)) return null;
  return gsap.from(target, {
    y: 35,
    opacity: 0,
    duration: 0.55,
    ease: gsapEasing.smooth,
    ...options,
  });
}

/**
 * Hiệu ứng Pop-in đàn hồi cho Hộp thoại / Modal / Card nổi bật
 */
export function animateModalPop(
  target: gsap.DOMTarget,
  options?: gsap.TweenVars
) {
  if (!hasValidTarget(target)) return null;
  return gsap.fromTo(
    target,
    {
      scale: 0.85,
      y: 25,
      opacity: 0,
    },
    {
      scale: 1,
      y: 0,
      opacity: 1,
      duration: 0.55,
      ease: gsapEasing.bounce,
      ...options,
    }
  );
}

/**
 * Hiệu ứng Stagger xuất hiện so le cho danh sách các thẻ / nút / hàng
 */
export function animateStaggerList(
  target: gsap.DOMTarget,
  options?: gsap.TweenVars & { stagger?: number }
) {
  if (!hasValidTarget(target)) return null;
  const { stagger = 0.05, ...rest } = options || {};
  return gsap.fromTo(
    target,
    {
      y: 18,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      duration: 0.45,
      stagger,
      ease: gsapEasing.standard,
      ...rest,
    }
  );
}

/**
 * Hiệu ứng Scale Pop nhẹ (nút bấm, badge, icon)
 */
export function animatePopItem(
  target: gsap.DOMTarget,
  options?: gsap.TweenVars
) {
  if (!hasValidTarget(target)) return null;
  return gsap.from(target, {
    scale: 0.75,
    opacity: 0,
    duration: 0.4,
    ease: gsapEasing.bounce,
    ...options,
  });
}

/**
 * Hiệu ứng vòng tròn gợn sóng tinh tế từ nút bấm (Subtle Button Ripple Effect)
 */
export function animateExpandingCircleRipple(
  targetButton: HTMLElement,
  theme: 'morning' | 'afternoon' | 'night' = 'morning'
) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !targetButton) return;

  const rect = targetButton.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Cấu hình màu sắc gợn sóng theo buổi
  const themeColors = {
    morning: {
      border: 'rgba(56, 189, 248, 0.9)',
      glow: '0 0 12px rgba(56, 189, 248, 0.6)',
      fill: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
    },
    afternoon: {
      border: 'rgba(245, 158, 11, 0.95)',
      glow: '0 0 12px rgba(245, 158, 11, 0.6)',
      fill: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)',
    },
    night: {
      border: 'rgba(129, 140, 248, 0.95)',
      glow: '0 0 12px rgba(99, 102, 241, 0.6)',
      fill: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
    },
  };

  const currentTheme = themeColors[theme] || themeColors.morning;

  // Hiệu ứng micro-bounce cho nút được nhấn
  gsap.fromTo(
    targetButton,
    { scale: 0.9 },
    { scale: 1, duration: 0.25, ease: 'back.out(2)' }
  );

  // Vòng gợn sóng nhỏ tinh tế quanh nút
  const ring = document.createElement('div');
  ring.className = 'fixed rounded-full pointer-events-none z-50';
  ring.style.left = `${centerX}px`;
  ring.style.top = `${centerY}px`;
  ring.style.width = '16px';
  ring.style.height = '16px';
  ring.style.transform = 'translate(-50%, -50%)';
  ring.style.border = `1.5px solid ${currentTheme.border}`;
  ring.style.boxShadow = currentTheme.glow;
  ring.style.background = currentTheme.fill;
  ring.style.opacity = '1';

  document.body.appendChild(ring);

  gsap.to(ring, {
    width: 65,
    height: 65,
    opacity: 0,
    duration: 0.4,
    ease: 'power2.out',
    onComplete: () => {
      if (ring.parentNode) {
        ring.parentNode.removeChild(ring);
      }
    },
  });
}

/**
 * Hiệu ứng Circular Reveal Theme Transition chuẩn hiện đại (View Transitions API)
 * Hiển thị trực tiếp giao diện buổi mới (Text, Button, Theme, 3D Canvas) bung nở mượt mà từ tâm nút bấm.
 */
export function triggerCircularRevealTransition(
  originElementOrEvent: HTMLElement | React.MouseEvent | MouseEvent | { clientX?: number; clientY?: number } | undefined,
  _targetTheme: 'morning' | 'afternoon' | 'night',
  onApplyTheme: () => void
) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    onApplyTheme();
    return;
  }

  // 1. Tính toán tọa độ tâm bung vòng tròn
  let originX = window.innerWidth / 2;
  let originY = window.innerHeight / 2;

  if (originElementOrEvent) {
    if (originElementOrEvent instanceof HTMLElement) {
      const rect = originElementOrEvent.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    } else if ('clientX' in originElementOrEvent && typeof originElementOrEvent.clientX === 'number' && originElementOrEvent.clientX > 0) {
      originX = originElementOrEvent.clientX;
      originY = originElementOrEvent.clientY ?? originY;
    } else if (
      'currentTarget' in originElementOrEvent &&
      originElementOrEvent.currentTarget instanceof HTMLElement
    ) {
      const rect = originElementOrEvent.currentTarget.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }
  }

  // 2. Tính bán kính xa nhất tới 4 góc màn hình để vòng tròn nở kín toàn bộ viewport
  const maxRadius = Math.hypot(
    Math.max(originX, window.innerWidth - originX),
    Math.max(originY, window.innerHeight - originY)
  );

  // 3. Nếu trình duyệt hỗ trợ View Transitions API (Chrome, Edge, Safari 18+, Firefox)
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { ready: Promise<void> };
  };

  if (typeof doc.startViewTransition === 'function') {
    const transition = doc.startViewTransition(() => {
      onApplyTheme();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${maxRadius * 1.08}px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  } else {
    // Fallback cho trình duyệt cũ
    onApplyTheme();
  }
}

