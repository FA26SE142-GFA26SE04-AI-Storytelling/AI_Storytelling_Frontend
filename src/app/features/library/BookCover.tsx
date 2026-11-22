"use client";

import type { CSSProperties, ReactNode } from "react";
import SafeImage from "@/app/components/SafeImage";
import { splitCover } from "@/app/lib/storyView";

/** Ảnh bìa mẫu (hoa sen trên lá súng) cho truyện chưa có ảnh bìa riêng. */
const DEFAULT_COVER_SRC = "/default-cover.svg";

/**
 * Bìa truyện 3:4 dùng SafeImage. Ảnh bìa có vùng cắt (`#crop=` sau đường dẫn) thì phóng ảnh để đúng vùng đó lấp đầy khung.
 * Truyện chưa có bìa thì dùng ảnh mẫu, đổi sắc độ theo id để các thẻ cạnh nhau không giống hệt nhau, và in tên truyện lên bìa.
 */
export default function BookCover({ url, title, seed, className = "", children }: { url?: string | null; title: string; seed: number; className?: string; children?: ReactNode }) {
  const { src, crop } = splitCover(url);
  const style: CSSProperties | undefined = crop
    ? { width: `${100 / crop.w}%`, height: `${100 / crop.h}%`, left: `${(-crop.x / crop.w) * 100}%`, top: `${(-crop.y / crop.h) * 100}%` }
    : undefined;
  return (
    <span className={`bkc${src ? "" : " bkc-default"} ${className}`} style={src ? undefined : ({ "--bkc-hue": `${(seed * 47) % 360}deg` } as CSSProperties)}>
      <SafeImage className={`bkc-img${crop ? " crop" : ""}`} src={src || DEFAULT_COVER_SRC} alt="" loading="lazy" style={style} />
      {!src && <span className="bkc-name display">{title}</span>}
      {children}
    </span>
  );
}
