"use client";

import "./staff.css";
import "@/app/features/children/children.css";
import { useState, type ComponentType } from "react";
import {
  Activity, BookOpenText, ChartColumn, Coins, FileClock, FlaskConical, Inbox, KeyRound, LibraryBig, ListChecks, Moon, Receipt,
  ScrollText, Shield, Sparkles, Sun, UserRound, Users, type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import type { StaffRole } from "@/app/types/auth";
import Frog from "@/app/components/brand/Frog";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import NotificationBell from "@/app/components/shell/NotificationBell";
import NavMenuButton from "@/app/components/shell/NavMenuButton";
import AccountMenu from "@/app/components/shell/AccountMenu";
import { circleReveal, useRiseIn } from "@/app/lib/motion";
import AccountWorkspace from "@/app/features/account/AccountWorkspace";
import { ModerationQueue, RatingPage } from "./Moderation";
import RoadmapTemplates from "./RoadmapTemplates";
import PublishedReviewWorkspace from "./PublishedReviewWorkspace";
import RubricWorkspace from "./RubricWorkspace";
import AuthoringGuideManagement from "./AuthoringGuideManagement";
import { PromptsPage } from "./Creator";
import { CreatorStories } from "./CreatorStories";
import { AdminParents, AdminStaff } from "./AdminPeople";
import { AdminEvaluation, AdminLogs, AdminOverview } from "./AdminAi";
import AdminCatalog from "./AdminCatalog";
import WishCardManagement from "./WishCardManagement";
import { AdminBusinessReport, AdminDataRequests, AdminPayments, AdminQuota } from "./AdminSystem";

type PageDef = { id: string; label: string; icon: LucideIcon; view: ComponentType; hint?: string };
/** Một nút trên thanh điều hướng: mở thẳng một trang, hoặc xổ menu gồm nhiều trang cùng nhóm. */
type NavEntry = string | { label: string; icon: LucideIcon; items: string[] };

const ROLE_LABEL: Record<StaffRole, string> = { Administrator: "Admin Portal", Moderator: "Kiểm duyệt", ContentCreator: "Content Workspace" };

/** Các trang tài khoản, mở từ menu avatar; dùng chung cho mọi vai trò nhân viên (không có mục mua lượt). */
const ACCOUNT_PAGES: PageDef[] = [
  { id: "account", label: "Thông tin cá nhân", icon: UserRound, view: () => <AccountWorkspace page="profile" /> },
  { id: "account-security", label: "Bảo mật & đăng nhập", icon: KeyRound, view: () => <AccountWorkspace page="security" /> },
  { id: "account-activity", label: "Lịch sử hoạt động", icon: Activity, view: () => <AccountWorkspace page="activity" /> },
];

/** Luồng 5 — ba khu tách biệt theo vai trò; mỗi tài khoản đúng một vai trò (BR-5.7a). */
const PAGES: Record<StaffRole, PageDef[]> = {
  Administrator: [
    { id: "published", label: "Rà soát thư viện", icon: LibraryBig, view: PublishedReviewWorkspace, hint: "Truyện và bộ mẫu đang công khai" },
    { id: "escalated", label: "Kiểm duyệt (ca chuyển lên)", icon: Inbox, view: () => <ModerationQueue admin />, hint: "Ca Moderator chuyển lên Admin" },
    { id: "rubrics", label: "Tiêu chí vùng xám", icon: ListChecks, view: RubricWorkspace },
    { id: "authoring-guides", label: "Hướng dẫn sáng tác", icon: BookOpenText, view: AuthoringGuideManagement },
    { id: "templates", label: "Xem bộ truyện mẫu", icon: LibraryBig, view: RoadmapTemplates },
    { id: "wish-cards", label: "Thẻ ước", icon: Sparkles, view: WishCardManagement },
    { id: "catalog", label: "Danh mục & Prompt Catalog", icon: ListChecks, view: AdminCatalog },
    { id: "overview", label: "Chất lượng AI", icon: Activity, view: AdminOverview },
    { id: "logs", label: "Nhật ký sinh truyện", icon: ScrollText, view: AdminLogs },
    { id: "eval", label: "Đánh giá AI", icon: FlaskConical, view: AdminEvaluation },
    { id: "prompts", label: "Bộ test prompt", icon: FileClock, view: () => <PromptsPage admin /> },
    { id: "staff", label: "Tài khoản vận hành", icon: Shield, view: AdminStaff },
    { id: "parents", label: "Tài khoản phụ huynh", icon: Users, view: AdminParents },
    { id: "data", label: "Yêu cầu dữ liệu", icon: FileClock, view: AdminDataRequests },
    { id: "business", label: "Báo cáo nghiệp vụ", icon: ChartColumn, view: AdminBusinessReport },
    { id: "payments", label: "Đối soát thanh toán", icon: Receipt, view: AdminPayments },
    { id: "quota", label: "Token Quota", icon: Coins, view: AdminQuota },
    ...ACCOUNT_PAGES,
  ],
  Moderator: [
    { id: "queue", label: "Hàng đợi kiểm duyệt", icon: Inbox, view: () => <ModerationQueue /> },
    { id: "published", label: "Rà soát thư viện", icon: LibraryBig, view: PublishedReviewWorkspace, hint: "Truyện và bộ mẫu đang công khai" },
    { id: "rubrics", label: "Tiêu chí vùng xám", icon: ListChecks, view: RubricWorkspace },
    { id: "rating", label: "Đánh giá AI", icon: FlaskConical, view: RatingPage },
    { id: "authoring-guides", label: "Hướng dẫn sáng tác", icon: BookOpenText, view: AuthoringGuideManagement },
    { id: "templates", label: "Bộ truyện mẫu", icon: LibraryBig, view: RoadmapTemplates },
    { id: "wish-cards", label: "Thẻ ước", icon: Sparkles, view: WishCardManagement },
    ...ACCOUNT_PAGES,
  ],
  ContentCreator: [
    { id: "stories", label: "Truyện mẫu của tôi", icon: BookOpenText, view: CreatorStories },
    { id: "prompts", label: "Bộ test prompt", icon: FlaskConical, view: () => <PromptsPage /> },
    ...ACCOUNT_PAGES,
  ],
};

/**
 * Thanh điều hướng ngang của từng vai trò. Admin nhiều trang nên gom theo nhóm việc, mỗi nhóm một menu xổ xuống;
 * vai trò ít trang thì mở thẳng. Các trang tài khoản không nằm ở đây mà trong menu avatar.
 */
const NAV: Record<StaffRole, NavEntry[]> = {
  Administrator: [
    { label: "Kiểm duyệt", icon: Inbox, items: ["published", "escalated", "rubrics"] },
    { label: "Nội dung", icon: BookOpenText, items: ["authoring-guides", "templates", "wish-cards", "catalog"] },
    { label: "Chất lượng AI", icon: Activity, items: ["overview", "logs", "eval", "prompts"] },
    { label: "Người dùng", icon: Users, items: ["staff", "parents", "data"] },
    { label: "Kinh doanh", icon: ChartColumn, items: ["business", "payments", "quota"] },
  ],
  Moderator: [
    "queue",
    { label: "Rà soát & đánh giá", icon: LibraryBig, items: ["published", "rubrics", "rating"] },
    { label: "Nội dung", icon: BookOpenText, items: ["authoring-guides", "templates", "wish-cards"] },
  ],
  ContentCreator: ["stories", "prompts"],
};

function StaffNav({ role, pageId, onPage, upward }: { role: StaffRole; pageId: string; onPage: (id: string) => void; upward?: boolean }) {
  const pages = PAGES[role];
  const byId = (id: string) => pages.find((p) => p.id === id)!;
  return NAV[role].map((entry) => {
    if (typeof entry === "string") {
      const { id, label, icon: Icon } = byId(entry);
      return <button key={id} className={pageId === id ? "on" : ""} data-tip={label} title={label} aria-label={label} aria-current={pageId === id ? "page" : undefined} onClick={() => onPage(id)}><Icon /></button>;
    }
    return <NavMenuButton key={entry.label} entry={entry} items={entry.items.map(byId)} ws={pageId} onWs={onPage} upward={upward} />;
  });
}

export default function StaffApp({ role }: { role: StaffRole }) {
  const { theme, toggleTheme } = useTheme();
  const navRef = useRiseIn<HTMLElement>("button", [], { delay: 40, distance: 10 });
  const pages = PAGES[role];
  const [pageId, setPageId] = useState(pages[0].id);
  const page = pages.find((p) => p.id === pageId) ?? pages[0];
  const View = page.view;

  return (
    <div className="shell no-status top-nav">
      <PondBackdrop rich />
      <header className="top">
        <div className="logo" aria-label="Taletale"><Frog variant="face" size={46} /></div>
        <b className="display" style={{ fontSize: 17, fontWeight: 800 }}>Taletale</b>
        <span className="top-role">{ROLE_LABEL[role]}</span>

        <nav ref={navRef} className="topnav" aria-label={ROLE_LABEL[role]}>
          <StaffNav role={role} pageId={pageId} onPage={setPageId} />
        </nav>
        <div className="top-gap" />

        <button className="btn btn-g" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme); }} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}>{theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}</button>
        <NotificationBell />
        <AccountMenu ws={pageId} onWs={setPageId} groups={[ACCOUNT_PAGES]} />
      </header>

      {/* Điện thoại: header không đủ chỗ nên điều hướng nằm ở thanh tab dưới đáy. */}
      <nav className="rail rail-mobile" aria-label={ROLE_LABEL[role]}>
        <StaffNav role={role} pageId={pageId} onPage={setPageId} upward />
      </nav>

      <main className="stage"><View key={page.id} /></main>
    </div>
  );
}
