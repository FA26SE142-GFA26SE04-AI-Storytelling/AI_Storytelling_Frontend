import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Nút chỉ có icon. `label` vừa là aria-label (trình đọc màn hình) vừa là title (chú thích khi rê chuột),
 * nên mọi nút icon đều có tên đọc được.
 */
export default function IconButton({ icon: Icon, label, className = "btn btn-s", iconClassName = "ic", ...props }: {
  icon: LucideIcon;
  label: string;
  iconClassName?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label" | "title">) {
  return (
    <button type="button" {...props} className={`${className} icon-only`} aria-label={label} title={label}>
      <Icon className={iconClassName} aria-hidden="true" />
    </button>
  );
}
