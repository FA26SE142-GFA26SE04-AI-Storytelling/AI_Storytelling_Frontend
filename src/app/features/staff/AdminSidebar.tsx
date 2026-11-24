"use client";

import { useEffect, useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import "@/app/styles/features/staff/AdminDashboard.css";

export type SideItem = { id: string; label: string; icon: LucideIcon };
/** Nhóm không có label là các mục đứng riêng ở đầu (ví dụ Tổng quan). */
export type SideGroup = { label?: string; items: SideItem[] };

const COLLAPSED_GROUPS_KEY = "adm_collapsed_groups";

function readCollapsedGroups(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COLLAPSED_GROUPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Thanh bên của Admin trên máy tính: hỗ trợ thu gọn từng danh mục hoặc thu gọn toàn bộ thanh bên. */
export default function AdminSidebar({
  groups,
  pageId,
  onPage,
  badges,
  label,
  collapsed = false,
  onToggleCollapse,
}: {
  groups: SideGroup[];
  pageId: string;
  onPage: (id: string) => void;
  badges?: Record<string, number>;
  label: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => readCollapsedGroups());

  // Lưu trạng thái thu gọn danh mục vào localStorage
  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupLabel]: !prev[groupLabel] };
      try {
        localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Tự động mở nhóm chứa trang đang xem nếu người dùng chuyển trang
  useEffect(() => {
    const currentGroup = groups.find((g) => g.label && g.items.some((it) => it.id === pageId));
    if (currentGroup?.label && collapsedGroups[currentGroup.label]) {
      setCollapsedGroups((prev) => {
        const next = { ...prev, [currentGroup.label!]: false };
        try {
          localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [pageId, groups]);

  return (
    <aside className={`adm-side${collapsed ? " collapsed" : ""}`}>
      <div className="adm-brand">
        <div className="adm-brand-main">
          <Frog variant="face" size={collapsed ? 34 : 40} />
          {!collapsed && (
            <span className="adm-brand-txt">
              <b className="display">Taletale</b>
              <small>{label}</small>
            </span>
          )}
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            className="adm-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          >
            {collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
          </button>
        )}
      </div>

      <nav className="adm-nav" aria-label={label}>
        {groups.map((g, gi) => {
          const groupKey = g.label ?? `g${gi}`;
          const isGroupCollapsed = !!g.label && !collapsed && !!collapsedGroups[g.label];
          const hasActiveItem = g.items.some((it) => it.id === pageId);

          return (
            <div
              key={groupKey}
              className={`adm-group${isGroupCollapsed ? " group-collapsed" : ""}${hasActiveItem ? " group-active" : ""}`}
              role={g.label ? "group" : undefined}
              aria-label={g.label}
            >
              {g.label ? (
                collapsed ? (
                  <div className="adm-group-sep" title={g.label} aria-hidden />
                ) : (
                  <button
                    type="button"
                    className="adm-group-h-btn"
                    onClick={() => toggleGroup(g.label!)}
                    aria-expanded={!isGroupCollapsed}
                    title={isGroupCollapsed ? `Mở rộng danh mục ${g.label}` : `Thu gọn danh mục ${g.label}`}
                  >
                    <span className="adm-group-h-txt">{g.label}</span>
                    <ChevronDown className={`adm-group-chevron${isGroupCollapsed ? " is-closed" : ""}`} aria-hidden />
                  </button>
                )
              ) : null}

              <div className={`adm-group-items${isGroupCollapsed ? " hidden" : ""}`}>
                {g.items.map(({ id, label: text, icon: Icon }) => {
                  const count = badges?.[id] ?? 0;
                  const on = id === pageId;
                  const itemTip = count > 0 ? `${text} (${count} việc)` : text;

                  return (
                    <button
                      key={id}
                      type="button"
                      className={`adm-item${on ? " on" : ""}`}
                      aria-current={on ? "page" : undefined}
                      title={collapsed ? itemTip : undefined}
                      data-tip={collapsed ? itemTip : undefined}
                      onClick={() => onPage(id)}
                    >
                      <Icon className="adm-item-ic" aria-hidden />
                      {!collapsed && <span className="adm-item-txt">{text}</span>}
                      {count > 0 && (
                        <span
                          className={`adm-badge${collapsed ? " adm-badge-dot" : ""}`}
                          aria-label={`${count} mục cần xử lý`}
                        >
                          {collapsed ? (count > 9 ? "9+" : count) : count > 99 ? "99+" : count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
