import { BookOpen, ChartColumn, House, Inbox, ShieldCheck, WandSparkles, type LucideIcon } from "lucide-react";

export type WorkspaceId = "home" | "create" | "lib" | "review" | "report" | "safe";

export const WORKSPACES: { id: WorkspaceId; label: string; icon: LucideIcon; sep?: boolean }[] = [
  { id: "home", label: "Tổng quan", icon: House },
  { id: "create", label: "Studio tạo truyện", icon: WandSparkles },
  { id: "lib", label: "Thư viện truyện", icon: BookOpen },
  { id: "review", label: "Duyệt nội dung", icon: Inbox },
  { id: "report", label: "Báo cáo AI", icon: ChartColumn, sep: true },
  { id: "safe", label: "Cài đặt an toàn", icon: ShieldCheck },
];
