"use client";

import type { ContentCategory, PolicyRule, SafetyPolicy, SetSafetyPolicyRequest } from "@/app/types/childProfile";
import { CONSENT_ITEMS } from "@/app/lib/guardian";

const RULES: { id: PolicyRule; label: string }[] = [
  { id: "Allowed", label: "Cho phép" },
  { id: "Blocked", label: "Chặn" },
];

/** Dữ liệu cũ có mức Restricted (đã bỏ ở đặc tả v31) được coi là Chặn cho an toàn. */
export const normalizeRule = (rule: string): PolicyRule => (rule === "Allowed" ? "Allowed" : "Blocked");

/**
 * Bước 1.4 — danh mục nội dung. Không chọn "Cho phép" cho danh mục nào nghĩa là mọi danh mục không bị chặn đều được phép;
 * chọn ít nhất 1 "Cho phép" thì truyện chỉ nằm trong các danh mục đó.
 */
export function CategoryRules({ cats, rules, onChange, disabled }: {
  cats: ContentCategory[];
  rules: Record<number, PolicyRule | undefined>;
  onChange: (next: Record<number, PolicyRule | undefined>) => void;
  disabled?: boolean;
}) {
  const allowedCount = cats.filter((c) => rules[c.id] === "Allowed").length;
  const toggle = (id: number, rule: PolicyRule) => onChange({ ...rules, [id]: rules[id] === rule ? undefined : rule });
  return (
    <div>
      <p className="sub" style={{ marginBottom: 6 }}>
        {allowedCount === 0
          ? "Chưa giới hạn: mọi chủ đề không bị chặn đều được phép."
          : `Chỉ cho phép ${allowedCount} chủ đề đã chọn. Chủ đề bị chặn luôn được ưu tiên.`}
      </p>
      {cats.length === 0 && <p className="sub">Chưa tải được danh sách chủ đề.</p>}
      {cats.map((c) => (
        <div key={c.id} className="trow">
          <span>{c.displayName}</span>
          <div className="seg" style={{ minWidth: 170 }}>
            {RULES.map((r) => (
              <button key={r.id} type="button" disabled={disabled} className={rules[c.id] === r.id ? "on" : ""} aria-pressed={rules[c.id] === r.id} onClick={() => toggle(c.id, r.id)}>{r.label}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const rulesToRequest = (cats: ContentCategory[], rules: Record<number, PolicyRule | undefined>) =>
  cats.filter((c) => rules[c.id]).map((c) => ({ contentCategoryId: c.id, rule: rules[c.id] as PolicyRule }));

/**
 * Backend ghi đè mọi trường khi lưu cài đặt an toàn: gửi lại nguyên giá trị đang lưu của các trường
 * giao diện chưa sửa (bé tự sáng tác, trả lời bằng giọng nói, ngưỡng điểm) để không bị về mặc định.
 */
export const keptPolicyFields = (p: SafetyPolicy | null): Partial<SetSafetyPolicyRequest> => ({
  safetyScoreThreshold: p?.safetyScoreThreshold ?? null,
  readabilityScoreThreshold: p?.readabilityScoreThreshold ?? null,
  childCreationEnabled: p?.childCreationEnabled ?? true,
  childCreationMode: p?.childCreationMode || "ReviewFirst",
  voiceAnswersEnabled: p?.voiceAnswersEnabled ?? false,
});

/** Nội dung đồng ý (a)–(d) kèm ô xác nhận. */
export function ConsentBlock({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="consent">
      <b>Trước khi bé dùng Taletale, bạn cần biết:</b>
      <ol>{CONSENT_ITEMS.map((t, i) => <li key={i}>{t}</li>)}</ol>
      <label className="row" style={{ alignItems: "flex-start" }}>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--primary)" }} />
        <span>Tôi đã đọc và đồng ý cho bé sử dụng nền tảng theo các điều trên.</span>
      </label>
    </div>
  );
}
