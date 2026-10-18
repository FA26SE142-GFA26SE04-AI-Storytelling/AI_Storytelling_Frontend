"use client";

import "./staff.css";
import "@/app/features/children/children.css";
import { useState, type ComponentType } from "react";
import {
  Activity, BookOpenText, ChartColumn, Coins, FileClock, FlaskConical, Inbox, LibraryBig, ListChecks, LogOut, Moon, Receipt,
  ScrollText, Shield, Sun, UserCog, Users, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import type { StaffRole } from "@/app/types/auth";
import { USE_MOCK } from "@/app/mocks/config";
import Frog from "@/app/components/brand/Frog";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import NotificationBell from "@/app/components/shell/NotificationBell";
import AccountWorkspace from "@/app/features/account/AccountWorkspace";
import { ModerationQueue, RatingPage } from "./Moderation";
import { CreatorTemplates, PromptsPage } from "./Creator";
import { CreatorStories } from "./CreatorStories";
import { AdminParents, AdminStaff } from "./AdminPeople";
import { AdminEvaluation, AdminLogs, AdminOverview } from "./AdminAi";
import AdminCatalog from "./AdminCatalog";
import { AdminBusinessReport, AdminDataRequests, AdminPayments, AdminQuota } from "./AdminSystem";

type PageDef = { id: string; label: string; icon: LucideIcon; view: ComponentType; sep?: boolean };

const ROLE_LABEL: Record<StaffRole, string> = { Administrator: "Admin Portal", Moderator: "Kiểm duyệt", ContentCreator: "Content Workspace" };

/** Luồng 5 — ba khu tách biệt theo vai trò; mỗi tài khoản đúng một vai trò (BR-5.7a). */
const PAGES: Record<StaffRole, PageDef[]> = {
  Administrator: [
    { id: "overview", label: "Chất lượng AI", icon: Activity, view: AdminOverview },
    { id: "escalated", label: "Kiểm duyệt (ca chuyển lên)", icon: Inbox, view: () => <ModerationQueue admin /> },
    { id: "staff", label: "Tài khoản vận hành", icon: Shield, view: AdminStaff },
    { id: "parents", label: "Tài khoản phụ huynh", icon: Users, view: AdminParents },
    { id: "catalog", label: "Danh mục & Prompt Catalog", icon: ListChecks, view: AdminCatalog },
    { id: "logs", label: "Nhật ký sinh truyện", icon: ScrollText, view: AdminLogs },
    { id: "eval", label: "Đánh giá AI", icon: FlaskConical, view: AdminEvaluation },
    { id: "prompts", label: "Bộ test prompt", icon: FileClock, view: () => <PromptsPage admin /> },
    { id: "quota", label: "Token Quota", icon: Coins, view: AdminQuota, sep: true },
    { id: "data", label: "Yêu cầu dữ liệu", icon: FileClock, view: AdminDataRequests },
    { id: "business", label: "Báo cáo nghiệp vụ", icon: ChartColumn, view: AdminBusinessReport },
    { id: "payments", label: "Đối soát thanh toán", icon: Receipt, view: AdminPayments },
    { id: "account", label: "Tài khoản của tôi", icon: UserCog, view: AccountWorkspace, sep: true },
  ],
  Moderator: [
    { id: "queue", label: "Hàng đợi kiểm duyệt", icon: Inbox, view: () => <ModerationQueue /> },
    { id: "rating", label: "Đánh giá AI", icon: FlaskConical, view: RatingPage },
    { id: "account", label: "Tài khoản của tôi", icon: UserCog, view: AccountWorkspace, sep: true },
  ],
  ContentCreator: [
    { id: "stories", label: "Truyện mẫu của tôi", icon: BookOpenText, view: CreatorStories },
    { id: "templates", label: "Bộ truyện mẫu", icon: LibraryBig, view: CreatorTemplates },
    { id: "prompts", label: "Bộ test prompt", icon: FlaskConical, view: () => <PromptsPage /> },
    { id: "account", label: "Tài khoản của tôi", icon: UserCog, view: AccountWorkspace, sep: true },
  ],
};

export default function StaffApp({ role }: { role: StaffRole }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pages = PAGES[role];
  const [pageId, setPageId] = useState(pages[0].id);
  const page = pages.find((p) => p.id === pageId) ?? pages[0];
  const View = page.view;

  return (
    <div className="shell">
      <PondBackdrop rich />
      <header className="top">
        <div className="logo" aria-label="Taletale"><Frog variant="face" size={46} /></div>
        <b className="display" style={{ fontSize: 17, fontWeight: 800 }}>Taletale</b>
        <div className="doc"><span className="c">{ROLE_LABEL[role]}</span></div>
        <NotificationBell />
        <button className="btn btn-g" onClick={toggleTheme} aria-label={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}>{theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}</button>
        <span className="av me" title={user?.email}>{(user?.fullName || "?").charAt(0).toUpperCase()}</span>
        <button className="btn btn-g" onClick={() => void logout()} aria-label="Đăng xuất"><LogOut className="ic" /></button>
      </header>

      <nav className="rail" aria-label={ROLE_LABEL[role]}>
        {pages.map(({ id, label, icon: Icon, sep }) => (
          <div key={id} style={{ display: "contents" }}>
            {sep && <div className="sep" />}
            <button className={pageId === id ? "on" : ""} data-tip={label} aria-label={label} aria-current={pageId === id ? "page" : undefined} onClick={() => setPageId(id)}><Icon /></button>
          </div>
        ))}
      </nav>

      <main className="stage"><View key={page.id} /></main>

      <footer className="status">
        <span className="live"><i />{ROLE_LABEL[role]}</span>
        <span>{page.label}</span>
        <div className="r">{USE_MOCK && <span style={{ color: "var(--warn-ink)", fontWeight: 700 }}>Dữ liệu mẫu</span>}<span>{user?.fullName || user?.email}</span></div>
      </footer>
    </div>
  );
}
