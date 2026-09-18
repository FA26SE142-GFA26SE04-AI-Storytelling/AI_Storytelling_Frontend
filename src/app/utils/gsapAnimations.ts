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

