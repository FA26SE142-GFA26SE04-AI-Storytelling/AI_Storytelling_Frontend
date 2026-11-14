import { Activity, BookOpen, FolderOpen, ChartColumn, CreditCard, GraduationCap, PencilLine, UserRound, Users, WandSparkles, type LucideIcon } from "lucide-react";

export type WorkspaceId = "children" | "studio" | "authoring" | "created" | "library" | "roadmap" | "report" | "account" | "account-payment" | "account-activity";

export type WorkspaceEntry = {
  id: WorkspaceId;
  label: string;
  icon: LucideIcon;
  sep?: boolean;
  /** Mở từ menu avatar thay vì thanh điều hướng: "kids" là nhóm hồ sơ bé, "account" là nhóm tài khoản. */
  inMenu?: "kids" | "account";
  /** Nằm trong menu xổ xuống của một nút khác trên thanh điều hướng (ví dụ hai cách tạo truyện dưới Studio). */
  under?: WorkspaceId;
  /** Chữ ngắn hiện cạnh biểu tượng trên thanh điều hướng (mặc định là label). */
  short?: string;
  /** Tên và mô tả ngắn khi hiện trong menu xổ xuống. */
  menuLabel?: string;
  hint?: string;
};

export const WORKSPACES: WorkspaceEntry[] = [
  { id: "library", label: "Thư viện truyện", short: "Thư viện", icon: BookOpen },
  // Hai cách tạo truyện là hai nút riêng, tên song song: Viết bằng AI (Studio) và Tự viết (Thủ công).
  { id: "studio", label: "Viết truyện bằng AI", short: "Viết bằng AI", icon: WandSparkles, hint: "AI viết truyện từ ý tưởng của bạn, bạn duyệt từng bước" },
  { id: "authoring", label: "Tự viết truyện", short: "Tự viết", icon: PencilLine, hint: "Bạn tự viết truyện (có thể tải tệp lên), tự kiểm tra rồi giao cho bé" },
  { id: "created", label: "Truyện của tôi", icon: FolderOpen, hint: "Mọi truyện bạn đã tạo, kể cả bản nháp đang soạn dở" },
  { id: "roadmap", label: "Học tập của bé", short: "Học tập", icon: GraduationCap },
  // Mở từ menu avatar: nhóm của bé (ít dùng hằng ngày), rồi nhóm tài khoản.
  { id: "children", label: "Hồ sơ bé", icon: Users, inMenu: "kids" },
  { id: "report", label: "Báo cáo", icon: ChartColumn, inMenu: "kids" },
  { id: "account", label: "Thông tin cá nhân", icon: UserRound, inMenu: "account" },
  { id: "account-payment", label: "Gói của tôi", icon: CreditCard, inMenu: "account" },
  { id: "account-activity", label: "Lịch sử hoạt động", icon: Activity, inMenu: "account" },
];

/** Props chung mà mọi không gian làm việc nhận được từ page.tsx. */
export type WorkspaceProps = {
  go: (id: WorkspaceId, target?: { storyId: number | null }) => void;
  resumeStoryId?: number | null;
  /** Vào chế độ của bé; có storyId thì mở thẳng truyện đó ("Cho bé đọc truyện này"). */
  onKid?: (childId: number, storyId?: number | null) => void;
};
