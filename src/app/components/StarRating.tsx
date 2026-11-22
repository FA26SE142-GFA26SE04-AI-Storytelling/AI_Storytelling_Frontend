"use client";

import { Star } from "lucide-react";
import "@/app/styles/components/StarRating.css";

/**
 * Hàng 5 sao. Có `onChange` thì thành ô chọn sao (radiogroup, dùng được bàn phím); không có thì chỉ hiển thị.
 * `value` có thể lẻ (4.5) khi hiển thị trung bình: sao được tô theo phần trăm.
 */
export function StarRating({ value, onChange, size = 18, label = "Số sao" }: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  label?: string;
}) {
  if (!onChange) {
    return (
      <span className="star-rating" role="img" aria-label={`${value.toLocaleString("vi-VN")} trên 5 sao`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i + 1));
          return (
            <span key={i} className="star-cell" style={{ width: size, height: size }}>
              <Star size={size} className="star-empty" aria-hidden="true" />
              <span className="star-fill" style={{ width: `${fill * 100}%` }}><Star size={size} aria-hidden="true" /></span>
            </span>
          );
        })}
      </span>
    );
  }
  return (
    <span className="star-rating is-input" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} sao`}
          title={`${i} sao`}
          className={`star-btn${i <= value ? " on" : ""}`}
          onClick={() => onChange(i)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(5, value + 1)); }
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(1, value - 1)); }
          }}
        >
          <Star size={size} aria-hidden="true" />
        </button>
      ))}
    </span>
  );
}
