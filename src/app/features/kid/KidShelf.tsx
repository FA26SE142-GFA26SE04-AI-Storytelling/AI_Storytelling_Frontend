import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

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

// Kệ sách truyện cho bé theo chủ đề đầm sen
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
    <section className="kid-shelf">
      <div className="kid-shelf-head">
        <span className={`kid-shelf-icon tone-${tone}`}>
          <Icon aria-hidden="true" />
        </span>
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
          <button
            type="button"
            className="kid-shelf-more"
            aria-label="Xem thêm truyện"
            disabled={loadingMore}
            onClick={onMore}
          >
            <ChevronRight size={40} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
