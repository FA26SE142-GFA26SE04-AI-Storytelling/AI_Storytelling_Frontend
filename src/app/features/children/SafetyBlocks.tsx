"use client";

import { useId, useState } from "react";
import { Ban, BookOpen, Check, ChevronDown, GraduationCap, Heart, ShieldAlert, Tag, type LucideIcon } from "lucide-react";
import type { ContentCategory, PolicyRule, SafetyPolicy, SetSafetyPolicyRequest } from "@/app/types/childProfile";
import { CONSENT_ITEMS, groupCategories, type CategoryGroupId } from "@/app/lib/guardian";

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
  const uid = useId();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Genre: true });
  const allowedCount = cats.filter((c) => rules[c.id] === "Allowed").length;
  const blockedCount = cats.filter((c) => rules[c.id] === "Blocked").length;
  const toggle = (id: number, rule: PolicyRule) => onChange({ ...rules, [id]: rules[id] === rule ? undefined : rule });
  // Đặt cả nhóm một quy tắc; nhóm đã có đủ quy tắc đó thì bấm lại để bỏ chọn, giống nút từng chủ đề.
  const setGroup = (items: ContentCategory[], rule: PolicyRule) => {
    const clear = items.every((c) => rules[c.id] === rule);
    const next = { ...rules };
    for (const c of items) next[c.id] = clear ? undefined : rule;
    onChange(next);
  };
  return (
    <div className="cat-rules">
      <div className="cat-summary" aria-live="polite">
        <p className="sub">
          {allowedCount === 0
            ? "Chưa giới hạn: mọi chủ đề không bị chặn đều được phép."
            : `Chỉ cho phép ${allowedCount} chủ đề đã chọn. Chủ đề bị chặn luôn được ưu tiên.`}
        </p>
        {(allowedCount > 0 || blockedCount > 0) && (
          <div className="cat-tally">
            {allowedCount > 0 && <span className="cat-pill allow"><Check className="ic" aria-hidden />Cho phép {allowedCount}</span>}
            {blockedCount > 0 && <span className="cat-pill block"><Ban className="ic" aria-hidden />Chặn {blockedCount}</span>}
          </div>
        )}
      </div>
      {cats.length === 0 && <p className="sub">Chưa tải được danh sách chủ đề.</p>}
      {groupCategories(cats).map((g) => {
        const open = !!openGroups[g.id];
        const allowed = g.items.filter((c) => rules[c.id] === "Allowed").length;
        const blocked = g.items.filter((c) => rules[c.id] === "Blocked").length;
        const titleId = `${uid}-${g.id}-title`;
        const listId = `${uid}-${g.id}-list`;
        // Cho phép cả nhóm "Cảnh báo an toàn" bằng một cú bấm dễ bật nhầm nội dung nhạy cảm; nhóm này chỉ cho cho phép từng chủ đề.
        const canAllowAll = g.id !== "SafetyWarning";
        return (
          <div key={g.id} className={`cat-group${open ? " open" : ""}`} data-group={g.id} role="group" aria-labelledby={titleId}>
            <div className="cat-group-head">
              <button type="button" className="cat-group-toggle" aria-expanded={open} aria-controls={listId} onClick={() => setOpenGroups((s) => ({ ...s, [g.id]: !open }))}>
                <GroupIcon id={g.id} />
                <span className="cat-group-title">
                  <b id={titleId}>{g.label}</b>
                  <small>
                    {g.items.length} chủ đề
                    {allowed > 0 && <> · <span className="t-allow">cho phép {allowed}</span></>}
                    {blocked > 0 && <> · <span className="t-block">chặn {blocked}</span></>}
                  </small>
                </span>
                <ChevronDown className="ic cat-chevron" aria-hidden />
              </button>
              {!disabled && (
                <div className="cat-bulk">
                  {canAllowAll && (
                    <button type="button" className="cat-bulk-btn allow" aria-pressed={g.items.every((c) => rules[c.id] === "Allowed")} onClick={() => setGroup(g.items, "Allowed")}>Cho phép cả nhóm</button>
                  )}
                  <button type="button" className="cat-bulk-btn block" aria-pressed={g.items.every((c) => rules[c.id] === "Blocked")} onClick={() => setGroup(g.items, "Blocked")}>Chặn cả nhóm</button>
                </div>
              )}
            </div>
            <div id={listId} className="cat-list" hidden={!open}>
              {g.items.map((c) => {
                const rule = rules[c.id];
                return (
                  <div key={c.id} className={`cat-row${rule === "Allowed" ? " is-allowed" : rule === "Blocked" ? " is-blocked" : ""}`}>
                    <span className="cat-name">{c.displayName}</span>
                    <div className="seg cat-seg" role="group" aria-label={`Quy tắc cho ${c.displayName}`}>
                      {RULES.map((r) => (
                        <button key={r.id} type="button" disabled={disabled} className={rule === r.id ? `on ${r.id === "Allowed" ? "is-allow" : "is-block"}` : ""} aria-pressed={rule === r.id} onClick={() => toggle(c.id, r.id)}>{r.label}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const GROUP_ICONS: Record<CategoryGroupId, LucideIcon> = {
  Genre: BookOpen,
  LifeValue: Heart,
  Learning: GraduationCap,
  SafetyWarning: ShieldAlert,
  Other: Tag,
};

/** Biểu tượng tròn màu theo nhóm danh mục, dùng chung cho phần chủ đề yêu thích và chủ đề an toàn. */
export function GroupIcon({ id }: { id: CategoryGroupId }) {
  const Icon = GROUP_ICONS[id];
  return <span className="cat-ic" data-group={id} aria-hidden><Icon className="ic" /></span>;
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
