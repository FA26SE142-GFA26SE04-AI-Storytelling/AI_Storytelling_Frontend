"use client";

import { useRef, type DragEvent, type MouseEvent, type PointerEvent } from "react";

/**
 * Kéo một hàng cuộn ngang bằng chuột (hàng ẩn thanh cuộn nên chuột không có cách nào cuộn ngang).
 * Cảm ứng để trình duyệt tự vuốt. Kéo quá vài px thì nuốt cú click kế tiếp để thả chuột không mở nhầm truyện.
 * Trả về các handler để rải lên phần tử cuộn; phần tử nên có class `kid-drag-scroll` (con trỏ bàn tay, tắt hít khi kéo).
 */
export function useMouseDragScroll() {
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);
  const stop = (el: HTMLElement) => { drag.current = null; el.classList.remove("is-dragging"); };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      swallowClick.current = false;
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) < 6) return;
      if (!d.moved) {
        d.moved = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.classList.add("is-dragging");
        // Trình duyệt đã bắt đầu bôi đen chữ từ lúc nhấn chuột; bỏ đi khi biết là đang kéo.
        window.getSelection()?.removeAllRanges();
      }
      e.currentTarget.scrollLeft = d.left - dx;
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      swallowClick.current = !!drag.current?.moved;
      stop(e.currentTarget);
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => stop(e.currentTarget),
    onClickCapture: (e: MouseEvent<HTMLElement>) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    },
    // Ảnh bìa mặc định kéo được (drag & drop) sẽ cướp mất cú kéo.
    onDragStart: (e: DragEvent<HTMLElement>) => e.preventDefault(),
  };
}
