'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/app/services/authService';
import { childAccessService } from '@/app/services/childAccessService';
import { API_BASE_URL } from '@/app/services/apiConfig';

/** Regex khớp route asset của phiên bé */
const CHILD_ASSET_RE = /^\/api\/v1\/child\/manual-stories\/\d+\/assets\/\d+$/;

/** Regex khớp route asset của phiên phụ huynh */
const PARENT_ASSET_RE = /^\/api\/v1\/parent\/stories\/\d+\/packages\/\d+\/assets\/\d+$/;

/**
 * Kiểm tra xem URL có phải là media cần xác thực qua Bearer token không.
 * Hỗ trợ cả đường dẫn tương đối lẫn tuyệt đối.
 */
export function isAuthedMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { pathname } = new URL(url, 'http://x');
    return CHILD_ASSET_RE.test(pathname) || PARENT_ASSET_RE.test(pathname);
  } catch {
    return false;
  }
}

/** Trạng thái nội bộ của hook, gắn với key = `${url}|${token ?? ''}` */
interface MediaState {
  key: string;
  blobUrl: string | null;
  failed: boolean;
}

/**
 * Hook tải media cần xác thực và trả về Blob URL tạm thời.
 *
 * - Nếu url trống: trả `{ src: null, loading: false, failed: false }`.
 * - Nếu url không thuộc route proxy: trả ngay url gốc (không fetch).
 * - Nếu là route proxy: fetch với Bearer token phù hợp, tạo Blob URL, tự thu hồi khi unmount.
 *
 * Hook LUÔN gọi useState và useEffect ở mọi lần render (không return sớm trước hook),
 * đảm bảo số lượng hook không đổi dù url chuyển giữa proxy và URL thường.
 *
 * @param url   URL của tài nguyên (tương đối hoặc tuyệt đối).
 * @param token Token ghi đè; nếu không truyền thì hook tự lấy token phù hợp.
 */
export function useAuthedMediaUrl(
  url: string | null | undefined,
  token?: string,
): { src: string | null; loading: boolean; failed: boolean } {
  // key dùng để phát hiện khi url hoặc token thay đổi
  const key = `${url ?? ''}|${token ?? ''}`;

  // State luôn được khai báo bất kể url là gì
  const [state, setState] = useState<MediaState>({ key: '', blobUrl: null, failed: false });

  // Effect luôn được khai báo; bên trong mới kiểm tra điều kiện để quyết định có fetch không
  useEffect(() => {
    // Nếu url rỗng hoặc không phải route proxy thì không làm gì cả
    if (!url || !isAuthedMediaUrl(url)) return;

    const c = new AbortController();
    let made: string | null = null;

    (async () => {
      try {
        // Xác định đây là route của bé hay phụ huynh
        const { pathname } = new URL(url, 'http://x');
        const isChild = pathname.includes('/api/v1/child/');

        // Chọn token phù hợp:
        // - Nếu caller truyền token → dùng token đó (cả hai loại route)
        // - Route bé, không truyền → lấy từ phiên bé đang lưu (hoặc '' nếu chưa có)
        // - Route phụ huynh, không truyền → undefined để authenticatedFetch dùng token phụ huynh đã lưu
        let tokenToUse: string | undefined;
        if (token !== undefined) {
          tokenToUse = token;
        } else if (isChild) {
          // BẮT BUỘC truyền chuỗi (kể cả rỗng) để không rơi vào nhánh làm mới token phụ huynh
          tokenToUse = childAccessService.readSession()?.accessToken ?? '';
        } else {
          tokenToUse = undefined;
        }

        // Chuyển url thành URL tuyệt đối so với origin của API
        const absolute = new URL(url, new URL(API_BASE_URL).origin).toString();

        const res = await authService.authenticatedFetch(
          absolute,
          { signal: c.signal, cache: 'no-store' },
          tokenToUse,
        );

        if (!res.ok) {
          // Tải thất bại (HTTP lỗi)
          if (!c.signal.aborted) {
            setState({ key, blobUrl: null, failed: true });
          }
          return;
        }

        const blob = await res.blob();
        made = URL.createObjectURL(blob);

        if (c.signal.aborted) {
          // Effect đã bị huỷ trước khi kịp set state → thu hồi Blob URL ngay
          URL.revokeObjectURL(made);
          return;
        }

        setState({ key, blobUrl: made, failed: false });
      } catch {
        // Lỗi mạng hoặc lỗi khác (không phải abort)
        if (!c.signal.aborted) {
          setState({ key, blobUrl: null, failed: true });
        }
      }
    })();

    return () => {
      // Huỷ fetch đang chờ; thu hồi Blob URL nếu đã tạo
      c.abort();
      if (made) {
        URL.revokeObjectURL(made);
      }
      // Reset state để không trả về blob đã thu hồi khi điều hướng A→B→A nhanh.
      // key sẽ không khớp với bất kỳ key nào đang chờ, hook tự trả loading
      // cho đến khi effect mới tải xong.
      setState({ key: '', blobUrl: null, failed: false });
    };
  }, [key, url, token]);

  // --- Trường hợp url rỗng ---
  if (!url) {
    return { src: null, loading: false, failed: false };
  }

  // --- Trường hợp không phải route proxy: trả ngay url gốc ---
  if (!isAuthedMediaUrl(url)) {
    return { src: url, loading: false, failed: false };
  }

  // --- Trường hợp route proxy: dùng state ---

  // Nếu state chưa cập nhật khớp key hiện tại → đang tải
  if (state.key !== key) {
    return { src: null, loading: true, failed: false };
  }

  if (state.failed) {
    return { src: null, loading: false, failed: true };
  }

  if (state.blobUrl) {
    return { src: state.blobUrl, loading: false, failed: false };
  }

  // Trạng thái trung gian (key khớp nhưng chưa có blob) — coi như đang tải
  return { src: null, loading: true, failed: false };
}
