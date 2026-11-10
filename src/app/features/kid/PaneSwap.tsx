'use client';
import type { ReactNode } from 'react';
import { useSwap } from '@/app/lib/motion';

/** Bọc nội dung một tab của bé: mỗi lần được gắn vào (đổi tab) thì trượt ngang + hiện dần. dir = 1 trượt từ phải, -1 từ trái. */
export default function PaneSwap({ dir = 1, gap = 22, children }: { dir?: 1 | -1; gap?: number; children: ReactNode }) {
  const ref = useSwap<HTMLDivElement>('mount', dir);
  return <div ref={ref} className="kid-pane" style={{ gap }}>{children}</div>;
}
