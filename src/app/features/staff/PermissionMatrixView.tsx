"use client";

import { useMemo } from "react";
import { Check, Circle } from "lucide-react";
import type { PermissionDto, RoleDto, RolePermissionsDto } from "@/app/types/accessControl";
import { conditionLegend, matrixCell, sectionPermissions } from "./permissionMatrix";

type Props = {
  catalog: PermissionDto[];
  roles: RoleDto[];
  byRole: Record<string, RolePermissionsDto>;
  onOpenRole: (code: string) => void;
};

/** Ma trận quyền × role: ✓ đang bật, ○ đang tắt (bật lại được), trống = không áp dụng; chấm = khác mặc định. */
export default function PermissionMatrixView({ catalog, roles, byRole, onOpenRole }: Props) {
  const sections = useMemo(() => sectionPermissions(catalog), [catalog]);
  const legend = useMemo(() => conditionLegend(roles.map((r) => byRole[r.code])), [roles, byRole]);

  return (
    <div className="st-card perm-card">
      <div className="st-scroll">
        <table className="st-table perm-matrix">
          <colgroup>
            <col className="perm-task-col" />
            {roles.map((r) => <col key={r.code} />)}
          </colgroup>
          <thead>
            <tr>
              <th>Việc</th>
              {roles.map((r) => (
                <th key={r.code} className="perm-role">
                  <button type="button" className="perm-role-btn" title={`Chỉnh quyền của ${r.name}`} onClick={() => onOpenRole(r.code)}>
                    {r.name}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          {sections.map(({ section, items }) => (
            <tbody key={section}>
              <tr className="perm-section"><th colSpan={roles.length + 1} scope="colgroup"><span>{section}</span></th></tr>
              {items.map((p) => (
                <tr key={p.code}>
                  <th scope="row" className="perm-task">
                    <div className="perm-name">
                      <span>{p.description}</span>
                      <code>{p.code}</code>
                    </div>
                  </th>
                  {roles.map((r) => {
                    const cell = matrixCell(byRole[r.code], p.code);
                    const label = cell.state === "on" ? "Đang bật" : cell.state === "off" ? "Đang tắt" : "Không áp dụng";
                    const hint = [`${r.name}: ${label}`, cell.changed ? "khác mặc định" : "", ...cell.conditions.map((c) => c.text)]
                      .filter(Boolean).join("\n");
                    return (
                      <td key={r.code} className={`perm-cell ${cell.state}`} title={hint} aria-label={hint}>
                        {cell.state === "on" && <Check className="ic" aria-hidden />}
                        {cell.state === "off" && <Circle className="ic" aria-hidden />}
                        {cell.changed && <i className="perm-dot" aria-hidden />}
                        {cell.conditions.length > 0 && (
                          <span className="perm-conds">{cell.conditions.map((c) => <span key={c.code} className="perm-cond">{c.label}</span>)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <div className="perm-legend">
        <span><Check className="ic" aria-hidden /> Đang bật</span>
        <span><Circle className="ic" aria-hidden /> Đang tắt, bật lại được</span>
        <span><i className="perm-dot" aria-hidden /> Khác mặc định</span>
        <span>Ô trống: quyền không dành cho role này</span>
      </div>
      {legend.length > 0 && (
        <dl className="perm-cond-legend">
          {legend.map((c) => (
            <div key={c.code}><dt><span className="perm-cond">{c.label}</span></dt><dd>{c.text}</dd></div>
          ))}
        </dl>
      )}
    </div>
  );
}
