"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import { WORKSPACES, type WorkspaceId } from "./nav";
import AccountMenu from "./AccountMenu";
import NavMenuButton from "./NavMenuButton";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { circleReveal, useRiseIn } from "@/app/lib/motion";
import Frog from "@/app/components/brand/Frog";
import NotificationBell from "./NotificationBell";
import KidButton from "./KidButton";
import PondBackdrop from "@/app/components/brand/PondBackdrop";

type Props = {
  ws: WorkspaceId;
  onWs: (id: WorkspaceId) => void;
  onKid: () => void;
  children: React.ReactNode;
};

/** Nhóm trang trong menu avatar (khai báo trong nav.ts với inMenu): hồ sơ bé rồi tới tài khoản. */
const MENU_GROUPS = [WORKSPACES.filter((w) => w.inMenu === "kids"), WORKSPACES.filter((w) => w.inMenu === "account")];

/** Các nút điều hướng; dùng chung cho thanh ngang trên header (máy tính) và thanh tab ở đáy (điện thoại). */
function NavButtons({ ws, onWs, reviewCount, upward }: { ws: WorkspaceId; onWs: (id: WorkspaceId) => void; reviewCount: number; upward?: boolean }) {
  // Mục có `under` gom vào menu của nút cha; chỉ nút cha (id trùng `under`) hiện trên thanh.
  return WORKSPACES.filter((w) => !w.inMenu && (!w.under || w.under === w.id)).map((entry) => {
    const { id, label, icon: Icon, sep } = entry;
    const group = WORKSPACES.filter((w) => w.under === id);
    return (
      <div key={id} style={{ display: "contents" }}>
        {sep && <div className="sep" />}
        {group.length > 0 ? <NavMenuButton entry={entry} items={group} ws={ws} onWs={onWs} upward={upward} /> : (
          <button className={ws === id ? "on" : ""} data-tip={label} title={label} aria-label={label} aria-current={ws === id ? "page" : undefined} onClick={() => onWs(id)}>
            <Icon />
            {id === "review" && reviewCount > 0 && <span className="badge">{reviewCount}</span>}
          </button>
        )}
      </div>
    );
  });
}

export default function AppShell({ ws, onWs, onKid, children }: Props) {
  const navRef = useRiseIn<HTMLElement>("button", [], { delay: 40, distance: 10 });
  const { theme, toggleTheme } = useTheme();
  const { reviewQueue, error } = useWorkspaceData();

  return (
    <div className="shell no-status top-nav">
      <PondBackdrop rich />
      <header className="top">
        <div className="logo" aria-label="Taletale"><Frog variant="face" size={46} /></div>
        <b className="display" style={{ fontSize: 17, fontWeight: 800 }}>Taletale</b>

        <nav ref={navRef} className="topnav" aria-label="Không gian làm việc">
          <NavButtons ws={ws} onWs={onWs} reviewCount={reviewQueue.length} />
        </nav>
        <div className="top-gap" />

        {/* Chỉ hiện khi có chuyện cần biết: mất kết nối. */}
        {error && <span className="top-note err" role="status" title={error}>Lỗi kết nối</span>}
        <button className="btn btn-g" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme); }} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}>{theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}</button>
        <NotificationBell onOpen={onWs} />
        <KidButton onKid={onKid} />
        <AccountMenu ws={ws} onWs={onWs} groups={MENU_GROUPS} />
      </header>

      {/* Điện thoại: header không đủ chỗ nên điều hướng nằm ở thanh tab dưới đáy. */}
      <nav className="rail rail-mobile" aria-label="Không gian làm việc">
        <NavButtons ws={ws} onWs={onWs} reviewCount={reviewQueue.length} upward />
      </nav>

      <main className="stage">{children}</main>
    </div>
  );
}
