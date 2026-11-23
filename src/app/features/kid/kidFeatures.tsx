"use client";

import { createContext, useContext, type ReactNode } from "react";
import Frog from "@/app/components/brand/Frog";

/** Quyền của bé: mã chức năng bố mẹ bật/tắt (backend `ChildFeatures`). */
export const KID_FEATURE = {
  quiz: "child.quiz",
  notebook: "child.notebook",
  libraryBrowse: "child.library.browse",
  wishes: "child.wishes",
  voice: "child.voice",
  reflection: "child.reflection",
  rewards: "child.rewards",
} as const;

export const FEATURE_OFF_MESSAGE = "Bố mẹ chưa bật chức năng này.";

/** Ô trên dock / khu của bé ứng với chức năng nào; khu không có trong bảng là cốt lõi, luôn hiện. */
const TAB_FEATURE: Record<string, string> = {
  library: KID_FEATURE.libraryBrowse,
  notebook: KID_FEATURE.notebook,
  wishes: KID_FEATURE.wishes,
  rewards: KID_FEATURE.rewards,
};

/** Thiếu danh sách (backend cũ) = không tắt gì. */
export function disabledSet(list: readonly string[] | null | undefined): ReadonlySet<string> {
  return new Set(list ?? []);
}

export function tabEnabled(tab: string, disabled: ReadonlySet<string>): boolean {
  const feature = TAB_FEATURE[tab];
  return !feature || !disabled.has(feature);
}

/** Nguồn truyện của khung "Truyện em đọc được" ở sảnh: tắt thư viện thì chỉ còn truyện của em. */
export function lobbyStorySources(disabled: ReadonlySet<string>): ("mine" | "library")[] {
  return disabled.has(KID_FEATURE.libraryBrowse) ? ["mine"] : ["mine", "library"];
}

/** Lỗi backend khi bé gọi chức năng bố mẹ vừa tắt. */
export function isFeatureDisabledError(r: { status?: number; errors?: readonly string[] | null }): boolean {
  return r.status === 403 && !!r.errors?.includes("CHILD_FEATURE_DISABLED");
}

const KidFeaturesContext = createContext<ReadonlySet<string>>(new Set());

export function KidFeaturesProvider({ disabled, children }: { disabled: ReadonlySet<string>; children: ReactNode }) {
  return <KidFeaturesContext.Provider value={disabled}>{children}</KidFeaturesContext.Provider>;
}

export function useKidDisabledFeatures(): ReadonlySet<string> {
  return useContext(KidFeaturesContext);
}

export function useKidFeature(code: string): boolean {
  return !useContext(KidFeaturesContext).has(code);
}

/** Khu bị tắt: câu nhẹ nhàng thay vì màn lỗi. */
export function KidFeatureOff() {
  return (
    <section className="kl-panel" role="status">
      <Frog mood="idle" size={96} />
      <p>{FEATURE_OFF_MESSAGE} Em hỏi bố mẹ nhé.</p>
    </section>
  );
}
