"use client";

import { useState, type ImgHTMLAttributes } from "react";

/** Hình lá sen dùng khi ảnh không có hoặc không tải được. */
export const DEFAULT_IMAGE = "/default-image.svg";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null };

/** Thay cho thẻ img: ảnh lỗi hoặc thiếu đường dẫn thì hiện hình mặc định thay vì ô ảnh vỡ. */
export default function SafeImage({ src, alt = "", onError, ...rest }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  const useDefault = !src || failed === src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={useDefault ? DEFAULT_IMAGE : src}
      alt={alt}
      onError={(e) => { setFailed(src ?? ""); onError?.(e); }}
    />
  );
}
