import { AGE_BANDS } from "@/app/lib/guardian";
import type { PolicyRule } from "@/app/types/childProfile";
import type { LearningValue } from "./LearningForm";

/**
 * Mở màn "Hồ sơ bé" thẳng vào form "Thêm bé" từ màn khác (VD nút "+ Thêm bé" ở Tổng quan).
 * Dùng sessionStorage như STUDIO_PREFILL_KEY. Cờ được giữ khi màn Hồ sơ bé đang ở chế độ tạo,
 * để tải lại trang vẫn mở lại form; rời chế độ tạo thì xoá.
 */
const KEY = "taletale-children-intent";

export function openChildCreate(go: (id: "children") => void) {
  try { sessionStorage.setItem(KEY, "create"); } catch { /* trình duyệt chặn lưu trữ: vẫn mở màn Hồ sơ bé */ }
  go("children");
}

/** Có yêu cầu mở form "Thêm bé" không (chỉ đọc, chưa xoá). */
export function wantsChildCreate(): boolean {
  try { return sessionStorage.getItem(KEY) === "create"; } catch { return false; }
}

/** Ghi nhớ màn Hồ sơ bé đang ở form "Thêm bé" để tải lại trang vẫn mở đúng form. */
export function markChildCreate() {
  try { sessionStorage.setItem(KEY, "create"); } catch { /* bỏ qua */ }
}

export function clearChildIntent() {
  try { sessionStorage.removeItem(KEY); } catch { /* bỏ qua */ }
}

/**
 * Bản nháp form "Thêm bé" để tải lại trang không mất các ô đã điền.
 * Chỉ nằm trong sessionStorage của tab (đóng tab là mất), tách theo tài khoản.
 * Không lưu ô "Đồng ý": phụ huynh phải tự tích lại sau khi tải lại trang.
 */
export type ChildDraft = {
  step: number;
  nickname: string;
  ageBand: string;
  learning: LearningValue;
  rules: Record<number, PolicyRule | undefined>;
  gate: boolean;
  /** Hồ sơ đã tạo ở lần bấm Hoàn tất trước nhưng bước sau lỗi; dùng lại để không tạo trùng. */
  createdId: number | null;
};

const DRAFT_VERSION = 1;
const DRAFT_PREFIX = "taletale-child-draft:";
export const childDraftKey = (userId: number) => `${DRAFT_PREFIX}${userId}`;

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

function validLearning(v: unknown): v is LearningValue {
  if (!v || typeof v !== "object") return false;
  const l = v as Record<string, unknown>;
  return typeof l.readingLevel === "number" && typeof l.readingMode === "string" && typeof l.comprehensionGoal === "string"
    && isStrings(l.favorites) && isStrings(l.focus);
}

function validRules(v: unknown): Record<number, PolicyRule | undefined> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<number, PolicyRule | undefined> = {};
  for (const [k, r] of Object.entries(v as Record<string, unknown>)) {
    if (!/^\d+$/.test(k) || (r !== "Allowed" && r !== "Blocked")) continue;
    out[Number(k)] = r;
  }
  return out;
}

export function readChildDraft(userId: number, maxStep: number): ChildDraft | null {
  try {
    const raw = sessionStorage.getItem(childDraftKey(userId));
    if (!raw) return null;
    const d = JSON.parse(raw) as Record<string, unknown>;
    const rules = validRules(d.rules);
    const createdId = d.createdId;
    if (d.v !== DRAFT_VERSION
      || typeof d.step !== "number" || !Number.isInteger(d.step) || d.step < 0 || d.step > maxStep
      || typeof d.nickname !== "string"
      || typeof d.ageBand !== "string" || !AGE_BANDS.some((a) => a.id === d.ageBand)
      || !validLearning(d.learning) || !rules || typeof d.gate !== "boolean"
      || !(createdId === null || (typeof createdId === "number" && Number.isSafeInteger(createdId) && createdId > 0))) return null;
    return { step: d.step, nickname: d.nickname, ageBand: d.ageBand, learning: d.learning, rules, gate: d.gate, createdId };
  } catch {
    return null;
  }
}

export function writeChildDraft(userId: number, draft: ChildDraft) {
  // Chọn từng trường để không vô tình lưu thêm dữ liệu khác (như ô "Đồng ý").
  const { step, nickname, ageBand, learning, rules, gate, createdId } = draft;
  const data = { v: DRAFT_VERSION, step, nickname, ageBand, learning, rules, gate, createdId };
  try { sessionStorage.setItem(childDraftKey(userId), JSON.stringify(data)); } catch { /* lưu trữ bị chặn: form vẫn dùng được */ }
}

export function removeChildDraft(userId: number) {
  try { sessionStorage.removeItem(childDraftKey(userId)); } catch { /* bỏ qua */ }
}
