"use client";

import "./aside.css";
import { createContext, useContext, type ReactNode, type Ref } from "react";
import { ChevronsRight, PanelRight, type LucideIcon } from "lucide-react";

/** Trạng thái thu gọn của cột phải do Studio giữ (một giá trị cho mọi state, để cột lưới không đổi giữa các bước). */
export interface AsideState {
  collapsed: boolean;
  toggle: () => void;
}

/** Không có provider (màn "Duyệt nội dung") = khung không thu gọn được và không vẽ nút. */
export const AsideContext = createContext<AsideState | null>(null);

type Props = {
  title: string;
  /** Biểu tượng hiện trên thanh dọc khi thu gọn: người dùng nhận ra khung nào để mở lại. */
  icon?: LucideIcon;
  bodyRef?: Ref<HTMLDivElement>;
  children: ReactNode;
};

/**
 * Khung bên phải có thể thu gọn: tiêu đề + nút `»`, nội dung cuộn được, và thanh dọc có biểu tượng khi đã thu gọn.
 * Nội dung giữ bề rộng cố định trong lúc khung co để không bị bóp lại; khung cha cắt phần thừa.
 */
export default function AsidePane({ title, icon: Icon = PanelRight, bodyRef, children }: Props) {
  const aside = useContext(AsideContext);
  const collapsed = !!aside?.collapsed;
  return (
    <div className={`pane aside${collapsed ? " collapsed" : ""}${aside ? " collapsible" : ""}`}>
      <div className="ph">
        <span className="aside-title">{title}</span>
        {aside && (
          <div className="act">
            <button className="btn btn-g aside-toggle" onClick={aside.toggle} aria-expanded={!collapsed}
              aria-label={collapsed ? `Mở rộng khung ${title}` : `Thu gọn khung ${title}`} title={collapsed ? "Mở rộng" : "Thu gọn"}>
              <ChevronsRight className="ic" />
            </button>
          </div>
        )}
      </div>
      {aside && (
        // Thanh dọc hiện khi thu gọn; bấm vào đâu trên thanh cũng mở lại.
        <button className="aside-rail" onClick={aside.toggle} tabIndex={collapsed ? 0 : -1} aria-hidden={!collapsed} aria-label={`Mở rộng khung ${title}`}>
          <Icon className="ic" /><span>{title}</span>
        </button>
      )}
      <div ref={bodyRef} className="pb aside-body" inert={collapsed}>{children}</div>
    </div>
  );
}
