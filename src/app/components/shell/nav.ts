import { Activity, BookOpen, ChartColumn, CreditCard, KeyRound, PencilLine, Inbox, Route, ShieldCheck, UserRound, Users, WandSparkles, type LucideIcon } from "lucide-react";

export type WorkspaceId = "children" | "studio" | "authoring" | "library" | "roadmap" | "review" | "report" | "safety" | "account" | "account-security" | "account-payment" | "account-activity";

export type WorkspaceEntry = {
  id: WorkspaceId;
  label: string;
  icon: LucideIcon;
  sep?: boolean;
  /** Mở từ menu avatar thay vì thanh điều hướng: "kids" là nhóm hồ sơ bé, "account" là nhóm tài khoản. */
  inMenu?: "kids" | "account";
  /** Nằm trong menu xổ xuống của một nút khác trên thanh điều hướng (ví dụ hai cách tạo truyện dưới Studio). */
  under?: WorkspaceId;
  /** Tên và mô tả ngắn khi hiện trong menu xổ xuống. */
  menuLabel?: string;
  hint?: string;
};

export const WORKSPACES: WorkspaceEntry[] = [
  { id: "library", label: "Thư viện truyện", icon: BookOpen },
  // Nút Studio xổ ra hai cách tạo truyện: Dùng AI (chính Studio) và Thủ công.
  { id: "studio", label: "Studio tạo truyện", icon: WandSparkles, under: "studio", menuLabel: "Dùng AI", hint: "AI viết truyện từ ý tưởng của bạn, bạn duyệt từng bước" },
  { id: "authoring", label: "Thủ công", icon: PencilLine, under: "studio", hint: "Bạn tự viết truyện (có thể tải tệp lên), tự kiểm tra rồi giao cho bé" },
  { id: "roadmap", label: "Lộ trình của con", icon: Route },
  { id: "review", label: "Duyệt nội dung", icon: Inbox },
  // Mở từ menu avatar: nhóm của bé (ít dùng hằng ngày), rồi nhóm tài khoản.
  { id: "children", label: "Hồ sơ bé", icon: Users, inMenu: "kids" },
  { id: "safety", label: "Cài đặt an toàn", icon: ShieldCheck, inMenu: "kids" },
  { id: "report", label: "Báo cáo", icon: ChartColumn, inMenu: "kids" },
  { id: "account", label: "Thông tin cá nhân", icon: UserRound, inMenu: "account" },
  { id: "account-security", label: "Bảo mật & đăng nhập", icon: KeyRound, inMenu: "account" },
  { id: "account-payment", label: "Mua thêm lượt tạo truyện", icon: CreditCard, inMenu: "account" },
  { id: "account-activity", label: "Lịch sử hoạt động", icon: Activity, inMenu: "account" },
];

/** Props chung mà mọi không gian làm việc nhận được từ page.tsx. */
export type WorkspaceProps = {
  go: (id: WorkspaceId, target?: { storyId: number | null }) => void;
  resumeStoryId?: number | null;
  onKid: () => void;
};
