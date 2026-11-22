"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import AudioRing from "./AudioRing";
import { usePreviewPages, type PreviewStory } from "./usePreviewPages";

export type { PreviewStory };

/** `loadContent`: nguồn chữ riêng (Content Creator đọc qua /creator/stories); không truyền thì dùng API của phụ huynh. */
export function Preview({
  story,
  onClose,
  loadContent,
}: {
  story: PreviewStory;
  onClose: () => void;
  loadContent?: () => Promise<string>;
}) {
  const [page, setPage] = useState(0);
  const [shot, setShot] = useState(0);
  const [broken, setBroken] = useState<string | null>(null);
  /** Ảnh đã tải xong; chưa khớp ảnh đang chọn thì hiện vòng tải thay vì ảnh cũ. */
  const [loaded, setLoaded] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  const { pages, invalidateCache } = usePreviewPages(story, page, loadContent);

  useEffect(() => {
    setPage(0);
    setShot(0);
    setBroken(null);
    setLoaded(null);
  }, [story.id]);

  useEffect(() => {
    const modal = dialogRef.current;
    if (!modal) return;
    const prevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const tabbable = () =>
      Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length > 0);
    tabbable()[0]?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== modal) return;
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        closeRef.current();
      } else if (event.key === "Tab") {
        const items = tabbable();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (!modal.contains(document.activeElement) || document.activeElement === (event.shiftKey ? first : last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (prevFocus?.isConnected && document.querySelectorAll('[role="dialog"][aria-modal="true"]').length === 0) {
        prevFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  const go = (to: number) => {
    setPage(to);
    setShot(0);
    setBroken(null);
  };

  const current = pages?.[page];
  const image = current?.images[shot];
  const shown = image && broken !== image ? image : null;

  // Phát qua portal ra <body>: nếu để trong vùng nội dung, thanh điều hướng trên cùng sẽ đè lên hộp thoại.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={dialogRef}
      className="dlg-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem trước ${story.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dlg wide preview">
        <div className="row">
          <b className="display grow" style={{ fontSize: "var(--fs-lg)" }}>
            {story.title}
          </b>
          <span className="pill draft">Xem trước — không tính lượt đọc</span>
          <button type="button" className="btn btn-g" aria-label="Đóng" onClick={onClose}>
            <X className="ic" aria-hidden="true" />
          </button>
        </div>
        <div className="preview-body">
          <div className="preview-media">
            {shown ? (
              // Ảnh là URL có chữ ký của backend, nên dùng thẻ img thường.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={shown}
                className={`preview-img${loaded === shown ? "" : " loading"}`}
                src={shown}
                alt={`Tranh minh hoạ trang ${page + 1}`}
                ref={(el) => {
                  if (el?.complete && el.naturalWidth > 0 && loaded !== shown) setLoaded(shown);
                }}
                onLoad={() => setLoaded(shown)}
                onError={() => {
                  invalidateCache();
                  setBroken(shown);
                }}
              />
            ) : (
              <div
                className="cover"
                style={{ aspectRatio: "16/9", borderRadius: 16, background: story.cover }}
                role="img"
                aria-label="Chưa có tranh minh hoạ cho trang này"
              />
            )}
            {shown && loaded !== shown && (
              <div className="preview-loading" role="status" aria-label="Đang tải tranh">
                <span className="preview-spin" aria-hidden="true" />
              </div>
            )}
            {/* Nút nghe tròn ở góc phải trên của hình; key theo trang để đổi trang thì dừng tiếng và chạy lại từ đầu. */}
            {current && current.audio.length > 0 && (
              <AudioRing key={page} urls={current.audio.map((a) => a.url)} label={`Nghe giọng đọc trang ${page + 1}`} />
            )}
          </div>
          {current && current.images.length > 1 && (
            <div className="row preview-shots" aria-label="Chọn tranh trong trang">
              {current.images.map((u, i) => (
                <button
                  key={u}
                  type="button"
                  className="btn btn-s"
                  aria-pressed={i === shot}
                  onClick={() => {
                    setShot(i);
                    setBroken(null);
                  }}
                >
                  Tranh {i + 1}
                </button>
              ))}
            </div>
          )}
          <p className="display preview-text">
            {pages === null ? "Đang mở truyện…" : current?.text || "Truyện chưa có nội dung."}
          </p>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-s"
            disabled={page === 0}
            onClick={() => go(page - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft className="ic" aria-hidden="true" />
          </button>
          <span className="grow sub" style={{ textAlign: "center" }}>
            {pages?.length ? `Trang ${page + 1} / ${pages.length}` : ""}
          </span>
          <button
            type="button"
            className="btn btn-s"
            disabled={!pages || page >= pages.length - 1}
            onClick={() => go(page + 1)}
            aria-label="Trang sau"
          >
            <ChevronRight className="ic" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
