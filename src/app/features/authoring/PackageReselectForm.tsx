'use client';
import { Check, PackagePlus, Undo2 } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import type { ChildProfile } from '@/app/types/childProfile';
import type { PackageComponents, ParentPackage } from '@/app/services/parentPackageService';
import {
  componentsEqual,
  STALE_PACKAGE_STATUSES,
} from './packageReselect';

const PARTS: { key: keyof PackageComponents; label: string }[] = [
  { key: 'vocabulary', label: 'Từ vựng' },
  { key: 'quiz', label: 'Câu đố' },
  { key: 'listening', label: 'Tương tác khi nghe' },
  { key: 'images', label: 'Tranh' },
  { key: 'narration', label: 'Giọng đọc' },
];

/** Chọn thành phần gói: dùng cho tạo mới và chọn lại thành phần gói. */
export function PartPicker({
  value,
  onChange,
  disabled,
}: {
  value: PackageComponents;
  onChange: (v: PackageComponents) => void;
  disabled?: boolean;
}) {
  return (
    <div className="fp-parts" role="group" aria-label="Thành phần của gói">
      {PARTS.map((p) => (
        <button
          key={p.key}
          type="button"
          className={`fp-part${value[p.key] ? ' on' : ''}`}
          aria-pressed={value[p.key]}
          disabled={disabled}
          onClick={() => onChange({ ...value, [p.key]: !value[p.key] })}
        >
          {value[p.key] && <Check className="ic" aria-hidden />}
          {p.label}
        </button>
      ))}
    </div>
  );
}

export default function PackageReselectForm({
  livePackages,
  eligibleNewKids,
  drafts,
  addedPicks,
  currentVersionId,
  canWrite,
  busy,
  lock,
  error,
  kidName,
  grantOf,
  onDraftChange,
  onAddToggle,
  onAddedPartsChange,
  onRevoke,
  onCancel,
  onSubmit,
}: {
  livePackages: ParentPackage[];
  eligibleNewKids: ChildProfile[];
  drafts: Record<number, PackageComponents>;
  addedPicks: Record<number, PackageComponents | null>;
  currentVersionId: number | null;
  canWrite: boolean;
  busy: boolean;
  lock: boolean;
  error: string;
  kidName: (id: number) => string;
  grantOf: (childId: number) => B.ParentFamilyConfirmationDto | null;
  onDraftChange: (childId: number, components: PackageComponents) => void;
  onAddToggle: (childId: number, checked: boolean) => void;
  onAddedPartsChange: (childId: number, components: PackageComponents) => void;
  onRevoke: (childId: number) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="pa-step fp-reselect" aria-label="Chọn lại thành phần gói">
      <div className="fp-reselect-head">
        <h4>
          <PackagePlus className="ic" aria-hidden />
          Chọn lại thành phần gói
        </h4>
        <p className="sub">
          Bỏ chọn hết các mục để giữ gói chỉ đọc. Gói không đổi cấu hình và cùng phiên bản nội dung sẽ được giữ nguyên.
        </p>
      </div>

      {livePackages.map((pkg) => {
        const grant = grantOf(pkg.childProfileId);
        const value = drafts[pkg.childProfileId] ?? pkg.components;
        const isStaleOrOld =
          (STALE_PACKAGE_STATUSES as readonly string[]).includes(pkg.status) ||
          currentVersionId == null ||
          pkg.storyVersionId !== currentVersionId;
        const changed = !componentsEqual(value, pkg.components);

        return (
          <div className={`fp-kid${grant ? '' : ' on'}`} key={pkg.packageId}>
            <div className="row fp-card-h">
              <b className="grow">{kidName(pkg.childProfileId)}</b>
              {grant ? (
                <span className="pill ok">Đã giao — chỉ xem</span>
              ) : isStaleOrOld ? (
                <span className="pill wait">Tạo gói mới theo nội dung hiện tại</span>
              ) : changed ? (
                <span className="pill wait">Sẽ tạo bản gói mới</span>
              ) : (
                <span className="pill draft">Giữ nguyên gói hiện tại</span>
              )}
            </div>
            <PartPicker
              value={value}
              disabled={lock || !canWrite || !!grant}
              onChange={(next) => onDraftChange(pkg.childProfileId, next)}
            />
            {grant && (
              <>
                <p className="fp-reselect-note">
                  Gói đang giao cho bé nên chỉ xem cấu hình. Muốn sửa cấu hình, hãy thu hồi quyền đọc trước.
                </p>
                <div className="pa-actions">
                  <button
                    type="button"
                    className="btn btn-no"
                    disabled={lock || !canWrite}
                    onClick={() => onRevoke(pkg.childProfileId)}
                  >
                    <Undo2 className="ic" />
                    Thu hồi quyền đọc
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}

      {eligibleNewKids.length > 0 && canWrite && (
        <div className="fp-reselect-add">
          <h4>
            <PackagePlus className="ic" aria-hidden />
            Thêm bé nhận truyện
          </h4>
          {eligibleNewKids.map((k) => (
            <div className={`fp-kid${addedPicks[k.id] ? ' on' : ''}`} key={k.id}>
              <label className="row" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!addedPicks[k.id]}
                  disabled={lock}
                  onChange={(e) => onAddToggle(k.id, e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <b>{k.nickname}</b>
              </label>
              {addedPicks[k.id] && (
                <PartPicker
                  value={addedPicks[k.id]!}
                  disabled={lock}
                  onChange={(next) => onAddedPartsChange(k.id, next)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="notice err" role="alert" data-inline-notice>
          {error}
        </p>
      )}

      <div className="pa-actions">
        <button type="button" className="btn btn-g" disabled={busy} onClick={onCancel}>
          Huỷ
        </button>
        <button
          type="button"
          className="btn btn-p push"
          disabled={lock || !canWrite}
          onClick={onSubmit}
        >
          <Check className="ic" />
          Lưu cấu hình gói
        </button>
      </div>
    </div>
  );
}
