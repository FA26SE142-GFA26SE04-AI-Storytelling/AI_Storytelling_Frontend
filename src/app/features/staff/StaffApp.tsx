"use client";

import "./staff.css";
import "@/app/features/children/children.css";
import { useEffect, useState, type ComponentType } from "react";
import {
  Activity, Archive, BookOpenText, ChartColumn, Coins, CreditCard, Flag, FolderOpen, Package, Inbox, LibraryBig, ListChecks, Moon, PencilLine, Receipt, Route,
  Shield, ShieldAlert, Sparkles, Sun, UserRound, Users, WandSparkles, type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import { useAuth } from "@/app/context/AuthContext";
import { readCreatorAiStory, readStaffWorkspace, writeStaffWorkspace } from "@/app/features/story-workflow/storyStudioSession";
import type { StaffRole } from "@/app/types/auth";
import Frog from "@/app/components/brand/Frog";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import NotificationBell from "@/app/components/shell/NotificationBell";
import NavMenuButton from "@/app/components/shell/NavMenuButton";
import AccountMenu from "@/app/components/shell/AccountMenu";
import { circleReveal, useRiseIn } from "@/app/lib/motion";
import AccountWorkspace from "@/app/features/account/AccountWorkspace";
import ContentReportsWorkspace from "./ContentReportsWorkspace";
import CreatorStoryReviewWorkspace from "./CreatorStoryReviewWorkspace";
import GrayZoneReviewWorkspace from "./GrayZoneReviewWorkspace";
import { ModerationQueue } from "./Moderation";
import RoadmapTemplates from "./RoadmapTemplates";
import PublishedReviewWorkspace from "./PublishedReviewWorkspace";
import RemovalRecordsWorkspace from "./RemovalRecordsWorkspace";
import RemovalRequestsWorkspace from "./RemovalRequestsWorkspace";
import RubricWorkspace from "./RubricWorkspace";
import AuthoringGuideManagement from "./AuthoringGuideManagement";
import { CreatorCreateAi, CreatorCreateManual, type CreatorPageProps } from "./CreatorStories";
import { CreatorLibrary } from "./CreatorLibrary";
import { CreatorMyStories } from "./CreatorMyStories";
import { CreatorStatistics } from "./CreatorStatistics";
import ModeratorStatistics from "./ModeratorStatistics";
import { AdminStaff } from "./AdminPeople";
import AdminCatalog from "./AdminCatalog";
import WishCardManagement from "./WishCardManagement";
import { AdminPayments, AdminPlans, AdminQuota } from "./AdminSystem";
import { AdminBusinessReport } from "./AdminBusinessReport";

/** Mọi trang nhân viên nhận go (chuyển trang, kèm id truyện cần mở) và target; trang không cần thì bỏ qua. */
type PageDef = { id: string; label: string; icon: LucideIcon; view: ComponentType<CreatorPageProps>; hint?: string; menuLabel?: string; short?: string };
/** Một nút trên thanh điều hướng: mở thẳng một trang, hoặc xổ menu gồm nhiều trang cùng nhóm. */
type NavEntry = string | { label: string; icon: LucideIcon; items: string[] };

const ROLE_LABEL: Record<StaffRole, string> = { Administrator: "Admin Portal", Moderator: "Kiểm duyệt", ContentCreator: "Content Workspace" };

/** Các trang tài khoản dùng cho Admin và Moderator, mở từ menu avatar (không có mục gói và lượt). */
const ACCOUNT_PAGES: PageDef[] = [
  { id: "account", label: "Thông tin cá nhân", icon: UserRound, view: () => <AccountWorkspace page="profile" /> },
  { id: "account-activity", label: "Lịch sử hoạt động", icon: Activity, view: () => <AccountWorkspace page="activity" /> },
];

/** Trang riêng của Content Creator trong menu avatar: thông tin cá nhân, gói và lượt, lịch sử hoạt động. */
const CREATOR_ACCOUNT_PAGES: PageDef[] = [
  { id: "account", label: "Thông tin cá nhân", icon: UserRound, view: () => <AccountWorkspace page="profile" /> },
  { id: "account-plan", label: "Gói và lượt", icon: CreditCard, view: () => <AccountWorkspace page="payment" audience="creator" /> },
  { id: "account-activity", label: "Lịch sử hoạt động", icon: Activity, view: () => <AccountWorkspace page="activity" /> },
];

/** Luồng 5 — ba khu tách biệt theo vai trò; mỗi tài khoản đúng một vai trò (BR-5.7a). */
const PAGES: Record<StaffRole, PageDef[]> = {
  Administrator: [
    { id: "published", label: "Rà soát thư viện", icon: LibraryBig, view: PublishedReviewWorkspace, hint: "Truyện và lộ trình mẫu đang công khai" },
    { id: "escalated", label: "Kiểm duyệt (ca chuyển lên)", icon: Inbox, view: () => <ModerationQueue admin />, hint: "Ca Moderator chuyển lên Admin" },
    { id: "rubrics", label: "Tiêu chí vùng xám", icon: ListChecks, view: RubricWorkspace },
    { id: "authoring-guides", label: "Hướng dẫn sáng tác", icon: BookOpenText, view: AuthoringGuideManagement },
    { id: "templates", label: "Xem lộ trình mẫu", icon: Route, view: RoadmapTemplates },
    { id: "wish-cards", label: "Thẻ ước", icon: Sparkles, view: WishCardManagement },
    { id: "catalog", label: "Danh mục nội dung", icon: ListChecks, view: AdminCatalog },
    { id: "staff", label: "Tài khoản vận hành", icon: Shield, view: AdminStaff },
    { id: "business", label: "Báo cáo nghiệp vụ", icon: ChartColumn, view: AdminBusinessReport },
    { id: "payments", label: "Thanh toán", icon: Receipt, view: AdminPayments },
    { id: "plans", label: "Gói dịch vụ", icon: Package, view: AdminPlans },
    { id: "quota", label: "Lượt tạo truyện", icon: Coins, view: AdminQuota },
    ...ACCOUNT_PAGES,
  ],
  Moderator: [
    { id: "queue", label: "Duyệt truyện", menuLabel: "Duyệt truyện", short: "Duyệt truyện", icon: Inbox, view: CreatorStoryReviewWorkspace, hint: "Tiếp nhận và duyệt truyện Creator nộp công khai" },
    { id: "published", label: "Thư viện cộng đồng", short: "Thư viện cộng đồng", icon: LibraryBig, view: PublishedReviewWorkspace, hint: "Truyện Creator đang công khai" },
    { id: "removal-records", label: "Hồ sơ gỡ truyện", short: "Hồ sơ gỡ", icon: Archive, view: RemovalRecordsWorkspace, hint: "Theo dõi các hồ sơ gỡ truyện và vi phạm theo 2 nguồn độc lập" },
    { id: "gray-zone", label: "Kiểm tra vùng xám", short: "Vùng xám", icon: ShieldAlert, view: GrayZoneReviewWorkspace, hint: "Kiểm tra nội dung rơi vào vùng xám an toàn" },
    { id: "content-reports", label: "Báo cáo nội dung", short: "Báo cáo", icon: Flag, view: ContentReportsWorkspace, hint: "Tiếp nhận và xử lý báo cáo vi phạm nội dung" },
    { id: "removal-requests", label: "Yêu cầu gỡ truyện", short: "Yêu cầu gỡ", icon: Archive, view: RemovalRequestsWorkspace, hint: "Xử lý yêu cầu gỡ truyện công khai từ Creator" },
    { id: "rubrics", label: "Tiêu chí vùng xám", short: "Tiêu chí vùng xám", icon: ListChecks, view: RubricWorkspace },
    { id: "authoring-guides", label: "Hướng dẫn sáng tác", short: "Hướng dẫn sáng tác", icon: BookOpenText, view: AuthoringGuideManagement },
    { id: "templates", label: "Lộ trình mẫu", icon: Route, view: RoadmapTemplates },
    { id: "wish-cards", label: "Thẻ ước", icon: Sparkles, view: WishCardManagement },
    { id: "stats", label: "Thống kê", short: "Thống kê", icon: ChartColumn, view: ModeratorStatistics, hint: "Hàng đợi, SLA và quyết định của bạn" },
    ...ACCOUNT_PAGES,
  ],
  ContentCreator: [
    { id: "library", label: "Thư viện truyện mẫu", short: "Thư viện", icon: BookOpenText, view: CreatorLibrary },
    { id: "create-ai", label: "Viết truyện bằng AI", menuLabel: "Viết bằng AI", short: "Viết bằng AI", icon: WandSparkles, view: CreatorCreateAi, hint: "AI viết truyện mẫu từ ý tưởng của bạn" },
    { id: "create-manual", label: "Tự viết truyện", menuLabel: "Tự viết", short: "Tự viết", icon: PencilLine, view: CreatorCreateManual, hint: "Bạn tự viết nội dung, lưu thành từng phiên bản" },
    { id: "my-stories", label: "Truyện của tôi", short: "Truyện của tôi", icon: FolderOpen, view: CreatorMyStories, hint: "Mọi truyện bạn đã tạo, kể cả bản nháp đang soạn dở" },
    { id: "stats", label: "Thống kê", short: "Thống kê", icon: ChartColumn, view: CreatorStatistics, hint: "Lượt đọc, thu nhập và nội dung truyện" },
    ...CREATOR_ACCOUNT_PAGES,
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
        { label: "Người dùng", icon: Users, items: ["staff"] },
    { label: "Kinh doanh", icon: ChartColumn, items: ["business", "payments", "plans", "quota"] },
  ],
  Moderator: [
    "queue",
    { label: "Thư viện", icon: LibraryBig, items: ["published", "removal-records"] },
    { label: "Xử lý an toàn", icon: ShieldAlert, items: ["gray-zone", "content-reports", "removal-requests"] },
    { label: "Công cụ", icon: ListChecks, items: ["rubrics", "authoring-guides", "wish-cards"] },
    "templates",
    "stats",
  ],
  ContentCreator: ["library", "create-ai", "create-manual", "my-stories", "stats"],
};

function StaffNav({ role, pageId, onPage, upward }: { role: StaffRole; pageId: string; onPage: (id: string) => void; upward?: boolean }) {
  const pages = PAGES[role];
  const byId = (id: string) => pages.find((p) => p.id === id)!;
  return NAV[role].map((entry) => {
    if (typeof entry === "string") {
      const { id, label, short, icon: Icon } = byId(entry);
      return <button key={id} className={pageId === id ? "on" : ""} data-tip={label} title={label} aria-label={label} aria-current={pageId === id ? "page" : undefined} onClick={() => onPage(id)}><Icon /><span className="nav-txt">{short ?? label}</span></button>;
    }
    return <NavMenuButton key={entry.label} entry={entry} items={entry.items.map(byId)} ws={pageId} onWs={onPage} upward={upward} />;
  });
}

export default function StaffApp({ role }: { role: StaffRole }) {
  const { user } = useAuth();
  return <StaffAppInner key={`${role}:${user?.id ?? "anon"}`} role={role} userId={user?.id ?? null} />;
}

function StaffAppInner({ role, userId }: { role: StaffRole; userId: number | null }) {
  const { theme, toggleTheme } = useTheme();
  const navRef = useRiseIn<HTMLElement>("button", [], { delay: 40, distance: 10 });
  const pages = PAGES[role];
  // Tải lại trang hay quay lại từ tab khác thì quay về đúng trang (và truyện AI đang soạn), không về trang đầu.
  const [initial] = useState(() => {
    const saved = userId !== null ? readStaffWorkspace(userId) : null;
    const valid = !!saved && pages.some((p) => p.id === saved.pageId);
    return {
      pageId: valid ? saved.pageId : pages[0].id,
      target: valid ? saved.target : null,
      resumeId: valid && saved.pageId === "create-ai" && saved.target === null && userId !== null ? readCreatorAiStory(userId) : null,
    };
  });
  const [pageId, setPageId] = useState(initial.pageId);
  // Id truyện cần mở khi chuyển trang (ví dụ bấm Mở trong Thư viện truyện mẫu); null là tạo mới.
  const [target, setTarget] = useState<number | null>(initial.target);
  // Truyện AI đang soạn dở trước khi tải lại; chỉ dùng cho lần mở đầu, điều hướng sau đó thì bỏ.
  const [resumeId, setResumeId] = useState<number | null>(initial.resumeId);
  const go = (id: string, storyId: number | null = null) => { setPageId(id); setTarget(storyId); setResumeId(null); };
  useEffect(() => { if (userId !== null) writeStaffWorkspace(userId, { pageId, target }); }, [userId, pageId, target]);
  const page = pages.find((p) => p.id === pageId) ?? pages[0];
  const View = page.view;

  return (
    <div className="shell no-status top-nav">
      <PondBackdrop rich />
      <header className="top">
        <div className="logo" aria-label="Taletale"><Frog variant="face" size={46} /></div>
        <b className="display" style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>Taletale</b>
        <span className="top-role">{ROLE_LABEL[role]}</span>

        <nav ref={navRef} className="topnav" aria-label={ROLE_LABEL[role]}>
          <StaffNav role={role} pageId={pageId} onPage={(id) => go(id)} />
        </nav>
        <div className="top-gap" />

        <button className="btn btn-g" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme); }} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}>{theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}</button>
        <NotificationBell />
        <AccountMenu ws={pageId} onWs={(id) => go(id)} groups={[role === "ContentCreator" ? CREATOR_ACCOUNT_PAGES : ACCOUNT_PAGES]} />
      </header>

      {/* Điện thoại: header không đủ chỗ nên điều hướng nằm ở thanh tab dưới đáy. */}
      <nav className="rail rail-mobile" aria-label={ROLE_LABEL[role]}>
        <StaffNav role={role} pageId={pageId} onPage={(id) => go(id)} upward />
      </nav>

      <main className="stage"><View key={`${userId ?? "anon"}:${page.id}:${target ?? "new"}`} go={go} target={target} resumeId={resumeId} /></main>
    </div>
  );
}
