import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import "./kid-lobby.css";
import "./kid-shelves.css";

interface KidShelfProps {
  title: string;
  icon: LucideIcon;
  tone: "rose" | "sky" | "gold";
  children: ReactNode;
  action?: ReactNode;
  onMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}

/** Màu nút "xem thêm" theo màu kệ. */
const MORE_TONE = { rose: "is-pink", sky: "is-sky", gold: "is-gold" } as const;

// Kệ sách truyện cho bé: khung .kl-panel của sảnh, thanh đầu đổ màu theo kệ
export default function KidShelf({
  title,
  icon: Icon,
  tone,
  children,
  action,
  onMore,
  loadingMore,
  hasMore,
}: KidShelfProps) {
  return (
    <section className={`kl-panel kid-shelf tone-${tone}`}>
      <div className="kl-head kid-shelf-head">
        <Icon aria-hidden="true" />
        <h2 className="display kid-shelf-title">{title}</h2>
        <span className="kid-shelf-sprout" aria-hidden="true">
          <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
            {/* Mầm lá nhỏ: lá trái và lá phải */}
            <path
              d="M9 16C9 10 4 10 3 6C7 5 10 9 9 16Z"
              fill="var(--primary)"
            />
            <path
              d="M9 16C9 9 14 8 15 4C11 4 8 8 9 16Z"
              fill="color-mix(in srgb, var(--primary) 60%, var(--gold))"
            />
          </svg>
        </span>
        {action && <div className="kid-shelf-action">{action}</div>}
      </div>
      <div className="kid-shelf-row">
        {children}
        {onMore && hasMore !== false && (
          <div className="kid-shelf-more">
            <button
              type="button"
              className={`kid-btn3d ${MORE_TONE[tone]}`}
              aria-label="Xem thêm truyện"
              disabled={loadingMore}
              onClick={onMore}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
