'use client';
import type { ReactNode } from 'react';
import { ArrowLeft, Check, Eye, PenLine } from 'lucide-react';

export type RailStep<T extends string> = { id: T; label: string; note: string; done: boolean; locked: boolean };

/**
 * Bước đang làm và bước đang xem lại của cột "Các bước".
 * - Chỉ mở được các bước đã đi qua (tới bước xa nhất đã làm xong + 1, hoặc bước đang làm).
 * - Bấm vào bước khác bước đang làm thì chỉ xem; muốn sửa phải bấm "Quay lại".
 * `stepId` null nghĩa là theo tiến độ (mở truyện ở bước đang dở). `viewId` là bước đang xem lại (trang tự giữ state).
 * Không dùng hook để gọi được sau lệnh return sớm của trang.
 */
export function stepRail<T extends string>(steps: RailStep<T>[], stepId: T | null, viewId: T | null, setViewId: (id: T | null) => void) {
  const lastDone = steps.reduce((m, s, i) => (s.done && !s.locked ? i : m), -1);
  let progressIdx = Math.min(lastDone + 1, steps.length - 1);
  while (progressIdx > 0 && steps[progressIdx].locked) progressIdx--;
  const work = steps.find((s) => s.id === stepId && !s.locked) ?? steps[progressIdx];
  const workIdx = steps.indexOf(work);
  const reach = Math.max(workIdx, progressIdx);
  const viewed = viewId ? steps.find((s) => s.id === viewId && !s.locked) : undefined;
  const reviewing = !!viewed && viewed.id !== work.id && steps.indexOf(viewed) <= reach;
  return { active: reviewing ? viewed! : work, work, reviewing, reach, view: setViewId };
}

type Rail<T extends string> = ReturnType<typeof stepRail<T>>;

/** Cột "Các bước": bước chưa tới thì khoá, bước đã qua bấm vào để xem lại. */
export function StepRail<T extends string>({ steps, rail, frozen = false }: { steps: RailStep<T>[]; rail: Rail<T>; /** Đang chạy tác vụ: chỉ giữ bước đang làm. */ frozen?: boolean }) {
  return <nav className="pa-steps" aria-label="Các bước soạn truyện">
    <b className="pa-steps-title">Các bước</b>
    <ol>
      {steps.map((s, i) => {
        const on = rail.active.id === s.id;
        const working = rail.work.id === s.id;
        return <li key={s.id}>
          <button className={`pa-stepbtn${on ? ' on' : ''}${s.done ? ' done' : ''}${working && rail.reviewing ? ' working' : ''}`}
            disabled={s.locked || i > rail.reach || (frozen && !on)} aria-current={on ? 'step' : undefined}
            title={frozen && !on ? 'Đang tạo học liệu, chờ xong để chuyển bước' : working ? 'Bước đang làm' : i > rail.reach ? 'Làm xong bước trước để mở' : 'Xem lại bước này (chỉ xem)'}
            onClick={() => rail.view(working ? null : s.id)}>
            <span className="pa-num">{s.done ? <Check className="ic" aria-hidden /> : i + 1}</span>
            <span className="pa-steptxt"><b>{s.label}</b><small>{s.note}</small></span>
          </button>
        </li>;
      })}
    </ol>
  </nav>;
}

/**
 * Bọc nội dung bước: khi đang xem lại thì khoá mọi thao tác và hiện khung báo
 * với hai lựa chọn — quay lại sửa bước này, hoặc về bước đang làm.
 */
export function StepReview<T extends string>({ rail, onEdit, children }: { rail: Rail<T>; onEdit: (id: T) => void; children: ReactNode }) {
  return <>
    {rail.reviewing && <div className="pa-review-bar" data-inline-notice>
      <Eye className="ic" aria-hidden />
      <span className="grow"><b>Đang xem lại: {rail.active.label}</b>Các thao tác đã khoá để tránh sửa nhầm.</span>
      <button type="button" className="btn btn-s" onClick={() => { onEdit(rail.active.id); rail.view(null); }}><PenLine className="ic" />Quay lại sửa bước này</button>
      <button type="button" className="btn btn-p" onClick={() => rail.view(null)}><ArrowLeft className="ic" />Về bước đang làm</button>
    </div>}
    <fieldset className="pa-review" disabled={rail.reviewing}>{children}</fieldset>
  </>;
}
