import { BookOpen, ChartColumn, House, Inbox, ShieldCheck, WandSparkles, type LucideIcon } from "lucide-react";

export type WorkspaceId = "home" | "studio" | "library" | "review" | "report" | "safety";

export const WORKSPACES: { id: WorkspaceId; label: string; icon: LucideIcon; sep?: boolean }[] = [
  { id: "home", label: "Tổng quan", icon: House },
  { id: "studio", label: "Studio tạo truyện", icon: WandSparkles },
  { id: "library", label: "Thư viện truyện", icon: BookOpen },
  { id: "review", label: "Duyệt nội dung", icon: Inbox },
  { id: "report", label: "Báo cáo", icon: ChartColumn, sep: true },
  { id: "safety", label: "Cài đặt an toàn", icon: ShieldCheck },
];

/** Props chung mà mọi không gian làm việc nhận được từ page.tsx. */
export type WorkspaceProps = {
  go: (id: WorkspaceId) => void;
  onKid: () => void;
};
