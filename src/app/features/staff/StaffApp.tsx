"use client";

import "@/app/styles/features/staff/staff.css";
import "@/app/styles/features/children/children.css";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  Activity, Archive, BookOpenText, ChartColumn, Coins, CreditCard, Flag, FolderOpen, Package, Inbox, KeyRound, LayoutDashboard, LibraryBig, ListChecks, Moon, PencilLine, Receipt, Route,
  Shield, ShieldAlert, Sparkles, Star, Sun, ScrollText, Trophy, UserRound, UserRoundCheck, Users, WalletCards, WandSparkles, type LucideIcon,
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
import { defaultPeriod } from "@/app/lib/monthPeriods";
import { moderationStatisticsService } from "@/app/services/moderationStatisticsService";
import AccountWorkspace from "@/app/features/account/AccountWorkspace";
import ContentReportsWorkspace from "./ContentReportsWorkspace";
import StoryRatingsWorkspace from "./StoryRatingsWorkspace";
import CreatorStoryReviewWorkspace from "./CreatorStoryReviewWorkspace";
import GrayZoneReviewWorkspace from "./GrayZoneReviewWorkspace";
import RoadmapTemplates from "./RoadmapTemplates";
import PublishedReviewWorkspace from "./PublishedReviewWorkspace";
import RemovalRecordsWorkspace from "./RemovalRecordsWorkspace";
import RemovalRequestsWorkspace from "./RemovalRequestsWorkspace";
import RubricWorkspace from "./RubricWorkspace";
import AuthoringGuideManagement from "./AuthoringGuideManagement";
import { CreatorCreateAi, CreatorCreateManual, type CreatorPageProps } from "./CreatorStories";
import CreatorCommunityLibrary from "./CreatorCommunityLibrary";
import { CreatorMyStories } from "./CreatorMyStories";
import { CreatorStatistics } from "./CreatorStatistics";
import ModeratorStatistics from "./ModeratorStatistics";
import { AdminStaff } from "./AdminPeople";
import { AdminCreators } from "./AdminCreators";
import { AdminAuditLog } from "./AdminAuditLog";
import AdminPermissions from "./AdminPermissions";
import AdminCatalog from "./AdminCatalog";
import WishCardManagement from "./WishCardManagement";
import { AdminPayments, AdminPlans, AdminQuota } from "./AdminSystem";
import { AdminBusinessReport } from "./AdminBusinessReport";
import EventsWorkspace from "@/app/features/events/EventsWorkspace";
import AdminOverview from "./AdminOverview";
import AdminSidebar, { type SideGroup } from "./AdminSidebar";
import { adminNavBadges, useAdminTodo } from "./adminTodo";
import { canOpenPage, visibleNav } from "./staffPageAccess";
import { AccessReadyProvider, accessOf, StaffAccessProvider, useMyAccess } from "./staffAccess";
import { LeaveGuardProvider, type LeaveGuard } from "./leaveGuard";
import { Page } from "./ui";
import { ModerationQueue } from "./Moderation";
// Trước đây chỉ ParentShell nạp file này nên ở điện thoại header nhân viên vẫn hiện thanh ngang (bị cắt) và không có thanh tab đáy.
import "@/app/styles/mobile.css";

/** Mọi trang nhân viên nhận go (chuyển trang, kèm id truyện cần mở) và target; trang không cần thì bỏ qua. */
type PageDef = { id: string; label: string; icon: LucideIcon; view: ComponentType<CreatorPageProps>; hint?: string; menuLabel?: string; short?: string };
/** Một nút trên thanh điều hướng: mở thẳng một trang, hoặc xổ menu gồm nhiều trang cùng nhóm. */
type NavEntry = string | { label: string; icon: LucideIcon; items: string[] };

const ROLE_LABEL: Record<StaffRole, string> = { Administrator: "Trang quản trị", Moderator: "Kiểm duyệt", ContentCreator: "Không gian sáng tác" };

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
    { id: "overview", label: "Tổng quan", icon: LayoutDashboard, view: AdminOverview, hint: "Việc cần xử lý và tình hình kinh doanh" },
    { id: "queue", label: "Hàng đợi dự phòng", icon: Inbox, view: ModerationQueue, hint: "Nhận mục đã chuyển lên hoặc khi không còn kiểm duyệt viên" },
    { id: "published", label: "Rà soát thư viện", icon: LibraryBig, view: PublishedReviewWorkspace, hint: "Truyện và lộ trình mẫu đang công khai" },
    { id: "rubrics", label: "Tiêu chí vùng xám", icon: ListChecks, view: RubricWorkspace },
    { id: "authoring-guides", label: "Hướng dẫn sáng tác", icon: BookOpenText, view: AuthoringGuideManagement },
    { id: "templates", label: "Xem lộ trình mẫu", icon: Route, view: RoadmapTemplates },
    { id: "wish-cards", label: "Thẻ ước", icon: Sparkles, view: WishCardManagement },
    { id: "staff", label: "Tài khoản vận hành", icon: Shield, view: AdminStaff },
    { id: "permissions", label: "Phân quyền", icon: KeyRound, view: AdminPermissions, hint: "Xem và bật/tắt quyền của các role người lớn" },
    { id: "creators", label: "Nhà sáng tạo nội dung", icon: UserRoundCheck, view: AdminCreators },
    { id: "audit", label: "Nhật ký thao tác", icon: ScrollText, view: AdminAuditLog, hint: "Nhật ký thao tác nhạy cảm của toàn hệ thống" },
    { id: "business", label: "Báo cáo nghiệp vụ", icon: ChartColumn, view: AdminBusinessReport },
    { id: "payments", label: "Thanh toán", icon: Receipt, view: AdminPayments },
    { id: "plans", label: "Gói dịch vụ", icon: Package, view: AdminPlans },
    { id: "quota", label: "Lượt tạo truyện", icon: Coins, view: AdminQuota },
    { id: "events", label: "Sự kiện & Quà", short: "Sự kiện", icon: Trophy, view: () => <EventsWorkspace /> },
    ...ACCOUNT_PAGES,
  ],
  Moderator: [
    { id: "queue", label: "Duyệt truyện", menuLabel: "Duyệt truyện", short: "Duyệt truyện", icon: Inbox, view: CreatorStoryReviewWorkspace, hint: "Tiếp nhận và duyệt truyện nhà sáng tạo nộp công khai" },
    { id: "published", label: "Rà soát thư viện", short: "Rà soát thư viện", icon: LibraryBig, view: PublishedReviewWorkspace, hint: "Truyện nhà sáng tạo đang công khai" },
    { id: "removal-records", label: "Hồ sơ gỡ truyện", short: "Hồ sơ gỡ", icon: Archive, view: RemovalRecordsWorkspace, hint: "Theo dõi các hồ sơ gỡ truyện và vi phạm theo 2 nguồn độc lập" },
    { id: "gray-zone", label: "Kiểm tra vùng xám", short: "Vùng xám", icon: ShieldAlert, view: GrayZoneReviewWorkspace, hint: "Kiểm tra nội dung rơi vào vùng xám an toàn" },
    { id: "content-reports", label: "Báo cáo nội dung", short: "Báo cáo", icon: Flag, view: ContentReportsWorkspace, hint: "Tiếp nhận và xử lý báo cáo vi phạm nội dung" },
    { id: "story-ratings", label: "Đánh giá truyện", short: "Đánh giá", icon: Star, view: StoryRatingsWorkspace, hint: "Xử lý đánh giá của phụ huynh bị báo cáo hoặc bị lọc tự động" },
    { id: "removal-requests", label: "Yêu cầu gỡ truyện", short: "Yêu cầu gỡ", icon: Archive, view: RemovalRequestsWorkspace, hint: "Xử lý yêu cầu gỡ truyện công khai từ nhà sáng tạo" },
    { id: "rubrics", label: "Tiêu chí vùng xám", short: "Tiêu chí vùng xám", icon: ListChecks, view: RubricWorkspace },
    { id: "authoring-guides", label: "Hướng dẫn sáng tác", short: "Hướng dẫn sáng tác", icon: BookOpenText, view: AuthoringGuideManagement },
    { id: "templates", label: "Lộ trình mẫu", icon: Route, view: RoadmapTemplates },
    { id: "wish-cards", label: "Thẻ ước", icon: Sparkles, view: WishCardManagement },
    { id: "catalog", label: "Danh mục nội dung", short: "Danh mục", icon: ListChecks, view: AdminCatalog, hint: "Tạo, sửa, ẩn hoặc xoá danh mục nội dung dùng chung" },
    { id: "stats", label: "Thống kê", short: "Thống kê", icon: ChartColumn, view: ModeratorStatistics, hint: "Hàng đợi, SLA và quyết định của bạn" },
    { id: "events", label: "Sự kiện & Quà", short: "Sự kiện", icon: Trophy, view: () => <EventsWorkspace />, hint: "Tổ chức sự kiện sáng tác, nhiệm vụ động và trao thưởng" },
    ...ACCOUNT_PAGES,
  ],
  ContentCreator: [
    { id: "library", label: "Thư viện cộng đồng", short: "Thư viện", icon: BookOpenText, view: CreatorCommunityLibrary, hint: "Khám phá các tác phẩm đã được duyệt trong cộng đồng Taletale" },
    { id: "create-ai", label: "Viết truyện bằng AI", menuLabel: "Viết bằng AI", short: "Viết bằng AI", icon: WandSparkles, view: CreatorCreateAi, hint: "AI viết truyện mẫu từ ý tưởng của bạn" },
    { id: "create-manual", label: "Tự viết truyện", menuLabel: "Tự viết", short: "Tự viết", icon: PencilLine, view: CreatorCreateManual, hint: "Bạn tự viết nội dung, lưu thành từng phiên bản" },
    { id: "my-stories", label: "Truyện của tôi", short: "Truyện của tôi", icon: FolderOpen, view: CreatorMyStories, hint: "Mọi truyện bạn đã tạo, kể cả bản nháp đang soạn dở" },
    { id: "stats", label: "Thống kê", short: "Thống kê", icon: ChartColumn, view: CreatorStatistics, hint: "Lượt đọc, thu nhập và nội dung truyện" },
    { id: "events", label: "Sự kiện", short: "Sự kiện", icon: Trophy, view: () => <EventsWorkspace />, hint: "Tham gia sự kiện sáng tác và nhận thưởng" },
    ...CREATOR_ACCOUNT_PAGES,
  ],
};

/**
 * Điều hướng của từng vai trò. Moderator và Creator dùng thanh ngang trên header (nhóm thành menu xổ xuống).
 * Admin trên máy tính dùng thanh bên trái (AdminSidebar): mỗi nhóm ở đây là một mục có tiêu đề;
 * trên điện thoại vẫn là thanh tab đáy với menu xổ lên. Các trang tài khoản nằm trong menu avatar.
 */
const NAV: Record<StaffRole, NavEntry[]> = {
  Administrator: [
    "overview",
    { label: "Người dùng", icon: Users, items: ["staff", "creators", "permissions", "audit"] },
    { label: "Tài chính", icon: WalletCards, items: ["business", "payments", "plans", "quota"] },
    { label: "Nội dung & kiểm duyệt", icon: BookOpenText, items: ["queue", "published", "rubrics", "authoring-guides", "templates", "wish-cards", "events"] },
  ],
  Moderator: [
    "queue",
    { label: "Thư viện", icon: LibraryBig, items: ["published", "removal-records"] },
    { label: "Xử lý an toàn", icon: ShieldAlert, items: ["gray-zone", "content-reports", "story-ratings", "removal-requests"] },
    { label: "Công cụ", icon: ListChecks, items: ["rubrics", "authoring-guides", "wish-cards", "catalog"] },
    "templates",
    "events",
    "stats",
  ],
  ContentCreator: ["library", "create-ai", "create-manual", "my-stories", "events", "stats"],
};

const MODERATOR_QUEUE_NAV_MAP: Record<string, string> = {
  PublicStoryReview: "queue",
  GrayZoneStory: "gray-zone",
  ContentReport: "content-reports",
  StoryRating: "story-ratings",
  PublicStoryRemoval: "removal-requests",
  RoadmapTemplateReview: "templates",
};

function StaffNav({ role, nav, pageId, onPage, badges, upward }: { role: StaffRole; nav: NavEntry[]; pageId: string; onPage: (id: string) => void; badges?: Record<string, number>; upward?: boolean }) {
  const pages = PAGES[role];
  const byId = (id: string) => pages.find((p) => p.id === id)!;
  return nav.map((entry) => {
    if (typeof entry === "string") {
      const { id, label, short, icon: Icon } = byId(entry);
      const count = badges?.[id] ?? 0;
      return (
        <button key={id} className={pageId === id ? "on" : ""} data-tip={label} title={label} aria-label={label} aria-current={pageId === id ? "page" : undefined} onClick={() => onPage(id)}>
          <Icon />
          <span className="nav-txt">{short ?? label}</span>
          {count > 0 && <span className="badge" aria-label={`${count} mục cần xử lý`}>{count > 99 ? "99+" : count}</span>}
        </button>
      );
    }
    return <NavMenuButton key={entry.label} entry={entry} items={entry.items.map(byId)} ws={pageId} onWs={onPage} badges={badges} upward={upward} />;
  });
}

/** Nhóm của thanh bên Admin, dựng từ NAV để menu máy tính và thanh tab điện thoại luôn cùng danh sách trang. */
function sideGroups(role: StaffRole, nav: NavEntry[]): SideGroup[] {
  const pages = PAGES[role];
  const item = (id: string) => { const { label, icon } = pages.find((p) => p.id === id)!; return { id, label, icon }; };
  return nav.map((entry) => (typeof entry === "string" ? { items: [item(entry)] } : { label: entry.label, items: entry.items.map(item) }));
}

export function defaultStaffSection(role: StaffRole): string {
  return PAGES[role][0].id;
}

export default function StaffApp({
  role,
  initialSection,
  initialTarget = null,
  onNavigate,
}: {
  role: StaffRole;
  initialSection?: string;
  initialTarget?: number | null;
  onNavigate?: (section: string, storyId: number | null) => void;
}) {
  const { user } = useAuth();
  return (
    <StaffAppInner
      key={`${role}:${user?.id ?? "anon"}`}
      role={role}
      userId={user?.id ?? null}
      initialSection={initialSection}
      initialTarget={initialTarget}
      onNavigate={onNavigate}
    />
  );
}

function StaffAppInner({
  role,
  userId,
  initialSection,
  initialTarget = null,
  onNavigate,
}: {
  role: StaffRole;
  userId: number | null;
  initialSection?: string;
  initialTarget?: number | null;
  onNavigate?: (section: string, storyId: number | null) => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const navRef = useRiseIn<HTMLElement>("button", [], { delay: 40, distance: 10 });
  const pages = PAGES[role];
  // Ưu tiên section từ URL Next.js (/staff/<section>), sau đó mới fallback về session đã lưu.
  const [initial] = useState(() => {
    const fromRoute = initialSection && pages.some((p) => p.id === initialSection) ? initialSection : null;
    if (fromRoute) {
      return {
        pageId: fromRoute,
        target: initialTarget,
        resumeId: fromRoute === "create-ai" && initialTarget === null && userId !== null ? readCreatorAiStory(userId) : null,
      };
    }
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
  useEffect(() => {
    if (!initialSection || !pages.some((p) => p.id === initialSection)) return;
    setPageId(initialSection);
    setTarget(initialTarget);
  }, [initialSection, initialTarget, pages]);
  const { map: granted, ready: accessReady } = useMyAccess(userId, pageId);
  const leaveGuard = useRef<LeaveGuard | null>(null);
  const registerGuard = useCallback((guard: LeaveGuard | null) => { leaveGuard.current = guard; }, []);
  const go = async (id: string, storyId: number | null = null) => {
    if (id !== pageId && leaveGuard.current && !(await leaveGuard.current())) return;
    setPageId(id);
    setTarget(storyId);
    setResumeId(null);
    onNavigate?.(id, storyId);
  };
  useEffect(() => { if (userId !== null) writeStaffWorkspace(userId, { pageId, target }); }, [userId, pageId, target]);

  const canCount = accessReady && canOpenPage(role, "stats", granted);
  const [navBadges, setNavBadges] = useState<Record<string, number>>({});
  useEffect(() => {
    if (role !== "Moderator" || userId === null || !canCount) return;
    let alive = true;
    let ctrl: AbortController | null = null;
    const load = () => {
      ctrl?.abort();
      ctrl = new AbortController();
      const period = defaultPeriod();
      moderationStatisticsService.get(period.start, period.end, ctrl.signal).then(
        (r) => {
          if (!alive || !r.success || !r.data) return;
          const next: Record<string, number> = {};
          for (const q of r.data.queueByType ?? []) {
            const navId = MODERATOR_QUEUE_NAV_MAP[q.itemType];
            if (!navId) continue;
            const total = (q.pending ?? 0) + (q.claimed ?? 0);
            if (total > 0) next[navId] = total;
          }
          setNavBadges(next);
        },
        () => { /* Bỏ qua khi bị hủy hoặc lỗi mạng tạm thời trên badge header. */ },
      );
    };
    load();
    const onRefresh = () => load();
    window.addEventListener("moderation-queue-changed", onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      alive = false;
      ctrl?.abort();
      window.removeEventListener("moderation-queue-changed", onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [role, userId, pageId, canCount]);

  const isAdmin = role === "Administrator";
  const adminTodo = useAdminTodo(isAdmin && userId !== null && accessReady, pageId, (code) => accessOf(granted, code).state !== "Hidden");
  const badges = isAdmin ? adminNavBadges(adminTodo) : navBadges;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("adm_sidebar_collapsed") === "1";
      } catch {
        return false;
      }
    }
    return false;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("adm_sidebar_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const page = pages.find((p) => p.id === pageId) ?? pages[0];
  const View = page.view;
  const nav = useMemo(() => visibleNav(NAV[role], (id) => canOpenPage(role, id, granted)), [role, granted]);
  const groups = useMemo(() => sideGroups(role, nav), [role, nav]);
  const allowed = canOpenPage(role, page.id, granted);

  return (
    <div className={`shell no-status top-nav${isAdmin ? " adm-shell" : ""}${isAdmin && sidebarCollapsed ? " adm-shell-collapsed" : ""}`}>
      <PondBackdrop rich />
      {isAdmin && (
        <AdminSidebar
          groups={groups}
          pageId={pageId}
          onPage={(id) => void go(id)}
          badges={badges}
          label={ROLE_LABEL[role]}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}
      <header className="top">
        <div className="logo" aria-label="Taletale"><Frog variant="face" size={46} /></div>
        <b className="display" style={{ fontSize: "var(--fs-lg)", fontWeight: 800 }}>Taletale</b>
        <span className="top-role">{ROLE_LABEL[role]}</span>

        {isAdmin ? (
          <div className="adm-top-title"><b>{page.label}</b>{page.hint && <small>{page.hint}</small>}</div>
        ) : (
          <nav ref={navRef} className="topnav" aria-label={ROLE_LABEL[role]}>
            <StaffNav role={role} nav={nav} pageId={pageId} onPage={(id) => void go(id)} badges={badges} />
          </nav>
        )}
        <div className="top-gap" />

        <button className="btn btn-g" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme); }} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}>{theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}</button>
        <NotificationBell />
        <AccountMenu ws={pageId} onWs={(id) => void go(id)} groups={[role === "ContentCreator" ? CREATOR_ACCOUNT_PAGES : ACCOUNT_PAGES]} />
      </header>

      {/* Điện thoại: header không đủ chỗ nên điều hướng nằm ở thanh tab dưới đáy. */}
      <nav className="rail rail-mobile" aria-label={ROLE_LABEL[role]}>
        <StaffNav role={role} nav={nav} pageId={pageId} onPage={(id) => void go(id)} badges={badges} upward />
      </nav>

      <main className="stage">
        {allowed ? (
          <StaffAccessProvider value={granted}>
            <AccessReadyProvider value={accessReady}><LeaveGuardProvider value={registerGuard}>
            <View key={`${userId ?? "anon"}:${page.id}:${target ?? "new"}`} go={(id, storyId) => void go(id, storyId)} target={target} resumeId={resumeId} />
            </LeaveGuardProvider></AccessReadyProvider>
          </StaffAccessProvider>
        ) : (
          <Page title={page.label}>
            <div className="st-card">
              <h3>Bạn không có quyền dùng trang này</h3>
              <p className="sub">Quản trị viên đã tắt quyền cần cho trang “{page.label}”. Hãy chọn mục khác trên menu hoặc liên hệ quản trị viên.</p>
            </div>
          </Page>
        )}
      </main>
    </div>
  );
}
