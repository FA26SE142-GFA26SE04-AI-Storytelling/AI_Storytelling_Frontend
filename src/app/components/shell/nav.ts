import { BookOpen, ChartColumn, House, Inbox, Route, ShieldCheck, UserCog, Users, WandSparkles, type LucideIcon } from "lucide-react";

export type WorkspaceId = "home" | "children" | "studio" | "library" | "roadmap" | "review" | "report" | "safety" | "account";

export const WORKSPACES: { id: WorkspaceId; label: string; icon: LucideIcon; sep?: boolean }[] = [
  { id: "home", label: "Tổng quan", icon: House },
  { id: "children", label: "Hồ sơ bé", icon: Users },
  { id: "studio", label: "Studio tạo truyện", icon: WandSparkles },
  { id: "library", label: "Thư viện truyện", icon: BookOpen },
  { id: "roadmap", label: "Lộ trình của con", icon: Route },
  { id: "review", label: "Duyệt nội dung", icon: Inbox },
  { id: "report", label: "Báo cáo", icon: ChartColumn, sep: true },
  { id: "safety", label: "Cài đặt an toàn", icon: ShieldCheck },
  { id: "account", label: "Tài khoản", icon: UserCog },
];

/** Props chung mà mọi không gian làm việc nhận được từ page.tsx. */
export type WorkspaceProps = {
  go: (id: WorkspaceId, target?: { storyId: number | null }) => void;
  resumeStoryId?: number | null;
  onKid: () => void;
};
