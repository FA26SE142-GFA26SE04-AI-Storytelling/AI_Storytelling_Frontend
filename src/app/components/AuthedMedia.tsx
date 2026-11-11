'use client';

import { useEffect, useRef } from 'react';
import type { AudioHTMLAttributes } from 'react';
import SafeImage, { DEFAULT_IMAGE } from '@/app/components/SafeImage';
import { useAuthedMediaUrl } from '@/app/lib/useAuthedMediaUrl';

// Props cho AuthedImage
interface AuthedImageProps {
  src?: string | null;
  alt?: string;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Hiển thị ảnh cần xác thực qua token.
 * - Đang tải: trả null (tránh SafeImage hiện ảnh mặc định sai lúc chờ).
 * - Tải lỗi: hiện ảnh mặc định (giống hành vi SafeImage).
 * - Thành công: hiện ảnh thật qua SafeImage.
 */
export function AuthedImage({
  src,
  alt,
  title,
  style,
  className,
  onLoad,
  onError,
}: AuthedImageProps) {
  const media = useAuthedMediaUrl(src);

  // Lưu onError vào ref để useEffect không chạy lại khi identity của callback thay đổi
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  // Gọi onError đúng một lần khi tải thất bại
  useEffect(() => {
    if (media.failed) {
      onErrorRef.current?.();
    }
  }, [media.failed]);

  // Đang tải: trả null để tránh SafeImage hiện ảnh mặc định sai khung chờ
  if (media.loading) return null;

  // Tải lỗi: hiện ảnh mặc định (onLoad vẫn được gọi nếu ảnh mặc định load xong)
  if (media.failed) {
    return (
      <SafeImage
        src={DEFAULT_IMAGE}
        alt={alt}
        title={title}
        style={style}
        className={className}
        onLoad={onLoad}
      />
    );
  }

  // Thành công: hiện ảnh thật
  return (
    <SafeImage
      src={media.src}
      alt={alt}
      title={title}
      style={style}
      className={className}
      onLoad={onLoad}
      onError={onError ? () => onError() : undefined}
    />
  );
}

/**
 * Phát âm thanh cần xác thực qua token.
 * - Đang tải, lỗi hoặc không có src: trả null.
 * - Thành công: render thẻ <audio> với URL đã xác thực.
 */
export function AuthedAudio({
  src,
  ...rest
}: { src?: string | null } & Omit<AudioHTMLAttributes<HTMLAudioElement>, 'src'>) {
  const media = useAuthedMediaUrl(src);

  // Chưa sẵn sàng: không render gì cả
  if (media.loading || media.failed || !media.src) return null;

  return <audio {...rest} src={media.src} />;
}
