'use client';
import { Check } from 'lucide-react';
import './workflow.css';

/** Dòng "Đã xong" có dấu tick, dùng khi một bước trong trình soạn (Creator, phụ huynh) đã hoàn tất. */
export default function StepDone({ label = 'Đã xong' }: { label?: string }) {
  return <p className="ce-done" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
    <span className="ce-done-ic"><Check className="ic" aria-hidden /></span><b>{label}</b>
  </p>;
}
