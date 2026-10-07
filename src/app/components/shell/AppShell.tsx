"use client";

import { Eye, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { WORKSPACES, type WorkspaceId } from "./nav";
import { useWorkspaceData } from "./WorkspaceData";
import { ageLabel } from "./storyView";
import { USE_MOCK } from "../../mocks/config";
import { circleReveal, useClickRipple, useRiseIn } from "../../utils/motion";
import Frog from "../brand/Frog";
import PondBackdrop from "../brand/PondBackdrop";

type Props = {
  ws: WorkspaceId;
  onWs: (id: WorkspaceId) => void;
  onKid: () => void;
  children: React.ReactNode;
};

export default function AppShell({ ws, onWs, onKid, children }: Props) {
  useClickRipple();
  const railRef = useRiseIn<HTMLElement>("button", [], { delay: 40, distance: 10 });
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { children: kids, child, selectChild, reviewQueue, storiesLoading, error } = useWorkspaceData();
  const current = WORKSPACES.find((w) => w.id === ws);
  const initial = (user?.fullName || user?.username || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="shell">
      <PondBackdrop rich />
      <header className="top">
        <div className="logo" aria-label="Taletale"><Frog variant="face" size={34} /></div>
        <b className="display" style={{ fontSize: 17, fontWeight: 800 }}>Taletale</b>

        <div className="doc">
          {kids.length > 0 ? (
            <select className="inp child-pick" aria-label="Chọn bé" value={child?.id ?? ""} onChange={(e) => selectChild(+e.target.value)}>
              {kids.map((k) => <option key={k.id} value={k.id}>{k.nickname} · {ageLabel(k.ageBand)}</option>)}
            </select>
          ) : <span className="c">Chưa có hồ sơ bé</span>}
        </div>

        <button className="btn btn-g" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme); }} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}>{theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}</button>
        <button className="btn btn-k" onClick={onKid} disabled={!child}><Eye className="ic" />Xem như bé</button>
        <span className="av me" title={user?.email}>{initial}</span>
        <button className="btn btn-g" onClick={() => void logout()} aria-label="Đăng xuất"><LogOut className="ic" /></button>
      </header>

      <nav ref={railRef} className="rail" aria-label="Không gian làm việc">
        {WORKSPACES.map(({ id, label, icon: Icon, sep }) => (
          <div key={id} style={{ display: "contents" }}>
            {sep && <div className="sep" />}
            <button className={ws === id ? "on" : ""} data-tip={label} aria-label={label} aria-current={ws === id ? "page" : undefined} onClick={() => onWs(id)}>
              <Icon />
              {id === "review" && reviewQueue.length > 0 && <span className="badge">{reviewQueue.length}</span>}
            </button>
          </div>
        ))}
        <button className="bottom" data-tip="Chế độ của bé" aria-label="Chế độ của bé" onClick={onKid} disabled={!child}><Frog variant="face" size={34} animated={false} /></button>
      </nav>

      <main className="stage">{children}</main>

      <footer className="status">
        <span className={error ? "" : "live"}><i style={error ? { background: "var(--danger)" } : undefined} />{error ? "Lỗi kết nối" : storiesLoading ? "Đang đồng bộ…" : "Đã đồng bộ"}</span>
        <span>{current?.label}</span>
        <div className="r">{USE_MOCK && <span style={{ color: "var(--warn-ink)", fontWeight: 700 }}>Dữ liệu mẫu</span>}<span>{user?.fullName || user?.email}</span></div>
      </footer>
    </div>
  );
}
