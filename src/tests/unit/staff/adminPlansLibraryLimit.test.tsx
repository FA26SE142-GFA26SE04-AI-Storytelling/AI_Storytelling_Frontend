import { isValidElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminPlans } from "@/app/features/staff/AdminSystem";
import type { AdminSubscriptionPlanDto } from "@/app/types/backendContracts";
import type { PlanBenefitsInput } from "@/app/types/planSettings";

const host = vi.hoisted(() => {
  const state: unknown[] = [];
  let cursor = 0;
  let mounted = false;

  return {
    plans: vi.fn(),
    updatePlan: vi.fn(),
    begin() { cursor = 0; },
    reset() { state.length = 0; mounted = false; },
    useState<T>(initial: T) {
      const index = cursor++;
      if (index === state.length) state.push(initial);
      return [state[index] as T, (value: T) => { state[index] = value; }] as const;
    },
    useEffect(effect: () => void) {
      if (mounted) return;
      mounted = true;
      effect();
    },
  };
});

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: host.useState,
  useEffect: host.useEffect,
  useCallback: (callback: unknown) => callback,
}));

vi.mock("@/app/services/paymentService", () => ({
  adminPaymentService: { plans: host.plans, updatePlan: host.updatePlan },
}));

type Props = {
  children?: ReactNode;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  onChange?: (event: { target: { value?: string; checked?: boolean } }) => void;
};

function find(tree: ReactNode, match: (type: unknown, props: Props) => boolean): Props | undefined {
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const result = find(child, match);
      if (result) return result;
    }
  }
  if (!isValidElement<Props>(tree)) return undefined;
  return match(tree.type, tree.props) ? tree.props : find(tree.props.children, match);
}

function field(tree: ReactNode, label: string) {
  const wrapper = find(tree, (type, props) => type === "label"
    && (Array.isArray(props.children) ? props.children : [props.children]).some(
      (child) => child === label || (isValidElement<Props>(child) && child.props.children === label),
    ));
  return find(wrapper?.children, (type) => type === "input");
}

const benefits: PlanBenefitsInput = {
  maxChildProfiles: 4,
  weeklyNewLibraryStories: null,
  canCopyRoadmapTemplates: true,
  readAloudPerMonth: 8,
  writingAssistPerDay: 2,
};

const readingPlan = {
  id: 1,
  name: "Gói Đọc",
  planType: "Reading",
  priceVnd: 50000,
  aiCredits: 0,
  isActive: true,
  benefits,
} satisfies AdminSubscriptionPlanDto & { benefits: PlanBenefitsInput };

const limitLabel = "Truyện thư viện mới mỗi chu kỳ";
const unlimitedLabel = "Không giới hạn";

function render() {
  host.begin();
  return AdminPlans();
}

async function openPlan(plan: AdminSubscriptionPlanDto) {
  host.plans.mockResolvedValue({ success: true, data: [plan] });
  host.updatePlan.mockResolvedValue({ success: true, data: plan });
  render();
  await Promise.resolve();
  const edit = find(render(), (_, props) => props.label === `Sửa ${plan.name}`);
  expect(edit?.onClick).toBeDefined();
  await edit?.onClick?.();
  return render();
}

function saveButton(tree: ReactNode) {
  return find(tree, (type, props) => type === "button" && props.children === "Lưu");
}

function change(input: Props | undefined, target: { value?: string; checked?: boolean }) {
  expect(input?.onChange).toBeDefined();
  input?.onChange?.({ target });
}

describe("AdminPlans library limit", () => {
  afterEach(() => {
    host.reset();
    vi.resetAllMocks();
  });

  it("shows library limit field prefilled for reading plan", async () => {
    const tree = await openPlan(readingPlan);

    expect(field(tree, unlimitedLabel)?.checked).toBe(true);
    expect(field(tree, limitLabel)?.disabled).toBe(true);
  });

  it("saves full benefits with new library limit", async () => {
    const tree = await openPlan(readingPlan);
    change(field(tree, unlimitedLabel), { checked: false });
    change(field(render(), limitLabel), { value: "24" });

    const save = saveButton(render());
    expect(save?.disabled).toBe(false);
    await save?.onClick?.();

    expect(host.updatePlan).toHaveBeenCalledWith(1, {
      name: readingPlan.name,
      priceVnd: readingPlan.priceVnd,
      aiCredits: readingPlan.aiCredits,
      isActive: readingPlan.isActive,
      benefits: { ...benefits, weeklyNewLibraryStories: 24 },
    });
  });

  it("does not send benefits when only name changes", async () => {
    const tree = await openPlan(readingPlan);
    change(field(tree, "Tên gói"), { value: "Gói Đọc mới" });

    const save = saveButton(render());
    expect(save?.disabled).toBe(false);
    await save?.onClick?.();

    expect(host.updatePlan).toHaveBeenCalledWith(1, {
      name: "Gói Đọc mới",
      priceVnd: readingPlan.priceVnd,
      aiCredits: readingPlan.aiCredits,
      isActive: readingPlan.isActive,
    });
  });

  it("hides library field for add-on and when benefits missing", async () => {
    const addOn = { ...readingPlan, planType: "AddOn" as const };
    const legacyReading: AdminSubscriptionPlanDto = {
      id: readingPlan.id,
      name: readingPlan.name,
      planType: "Reading",
      priceVnd: readingPlan.priceVnd,
      aiCredits: readingPlan.aiCredits,
      isActive: readingPlan.isActive,
    };

    for (const plan of [addOn, legacyReading]) {
      host.reset();
      const tree = await openPlan(plan);
      expect(field(tree, "Tên gói")).toBeDefined();
      expect(field(tree, limitLabel)).toBeUndefined();
      expect(field(tree, unlimitedLabel)).toBeUndefined();
    }
  });

  it("blocks save for negative or empty library limit", async () => {
    const creativePlan = {
      ...readingPlan,
      planType: "Creative" as const,
      benefits: { ...benefits, weeklyNewLibraryStories: 12 },
    };
    const tree = await openPlan(creativePlan);
    change(field(tree, "Tên gói"), { value: "Gói mới" });

    for (const value of ["-1", "", "2.5"]) {
      change(field(render(), limitLabel), { value });
      expect(saveButton(render())?.disabled).toBe(true);
    }
    expect(host.updatePlan).not.toHaveBeenCalled();
  });
});
