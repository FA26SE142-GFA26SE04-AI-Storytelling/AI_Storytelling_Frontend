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
