import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LayoutDashboard, Users, Receipt } from "lucide-react";
import AdminSidebar, { type SideGroup } from "@/app/features/staff/AdminSidebar";

const MOCK_GROUPS: SideGroup[] = [
  {
    items: [{ id: "overview", label: "Tổng quan", icon: LayoutDashboard }],
  },
  {
    label: "Người dùng",
    items: [{ id: "staff", label: "Tài khoản vận hành", icon: Users }],
  },
  {
    label: "Tài chính",
    items: [{ id: "payments", label: "Thanh toán", icon: Receipt }],
  },
];

describe("AdminSidebar", () => {
  it("renders full sidebar with groups, headers and items", () => {
    const html = renderToStaticMarkup(
      <AdminSidebar
        groups={MOCK_GROUPS}
        pageId="overview"
        onPage={vi.fn()}
        label="Trang quản trị"
        onToggleCollapse={vi.fn()}
      />
    );

    expect(html).toContain("Taletale");
    expect(html).toContain("Trang quản trị");
    expect(html).toContain("Tổng quan");
    expect(html).toContain("Người dùng");
    expect(html).toContain("Tài khoản vận hành");
    expect(html).toContain("Tài chính");
    expect(html).toContain("Thanh toán");
    expect(html).toContain("adm-collapse-btn");
  });

  it("renders collapsed sidebar mode without brand text", () => {
    const html = renderToStaticMarkup(
      <AdminSidebar
        groups={MOCK_GROUPS}
        pageId="overview"
        onPage={vi.fn()}
        label="Trang quản trị"
        collapsed={true}
        onToggleCollapse={vi.fn()}
      />
    );

    expect(html).toContain("adm-side collapsed");
    expect(html).not.toContain("adm-brand-txt");
    expect(html).toContain("adm-group-sep");
  });

  it("renders badge counts when badges are present", () => {
    const html = renderToStaticMarkup(
      <AdminSidebar
        groups={MOCK_GROUPS}
        pageId="overview"
        onPage={vi.fn()}
        label="Trang quản trị"
        badges={{ payments: 7 }}
      />
    );

    expect(html).toContain("adm-badge");
    expect(html).toContain("7");
  });
});
