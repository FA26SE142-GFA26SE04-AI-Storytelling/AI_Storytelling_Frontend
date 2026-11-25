"use client";

import type { ReactNode } from "react";
import { Plus, X } from "lucide-react";
import IconButton from "@/app/components/IconButton";
import type { ReadingHabitProgress } from "@/app/types/readingSchedule";
import {
  BEDTIME_RANGE, BREAK_AFTER_RANGE, BREAK_DURATION_RANGE, MAX_WINDOWS, REMINDER_MIN, SCREEN_LIMIT_RANGE, WEEKLY_GOALS,
  type ScheduleSection, type ScheduleValue, type TimeRange,
} from "./readingScheduleForm";

export type SectionError = { section: ScheduleSection; text: string } | null;

type Props = {
  value: ScheduleValue;
  onChange: (v: ScheduleValue) => void;
  disabled: boolean;
  /** Tiến độ thói quen của lần lưu gần nhất; null khi bé chưa có cấu hình đã lưu. */
  habit: ReadingHabitProgress | null;
  /** Mục tiêu tuần đã lưu (để tính còn thiếu bao nhiêu ngày). */
  savedGoalDays: number | null;
  error: SectionError;
};

function Toggle({ on, label, disabled, onClick }: { on: boolean; label: string; disabled?: boolean; onClick: () => void }) {
  return <button type="button" className={`tog${on ? " on" : ""}`} role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={onClick} />;
}

function Card({ title, hint, error, section, children }: { title: string; hint?: string; error: SectionError; section: ScheduleSection; children: ReactNode }) {
  return (
    <section className="th-card" aria-label={title}>
      <div><h3 className="display" style={{ margin: 0 }}>{title}</h3>{hint && <p className="sub" style={{ marginTop: 2 }}>{hint}</p>}</div>
      {children}
      {error?.section === section && <div className="notice err" role="alert" data-inline-notice>{error.text}</div>}
    </section>
  );
}

function TimeField({ label, value, onChange, disabled, min, max }: { label: string; value: string; onChange: (v: string) => void; disabled: boolean; min?: string; max?: string }) {
  return (
    <label className="field th-time"><span className="lbl">{label}</span>
      <span className="row" style={{ gap: 6 }}>
        <input className="inp" type="time" value={value} min={min} max={max} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        {value !== "" && !disabled && <IconButton icon={X} className="btn btn-g" label={`Bỏ ${label.toLowerCase()}`} onClick={() => onChange("")} />}
      </span>
    </label>
  );
}

function Slider({ label, value, unit, range, disabled, onChange }: {
  label: string; value: number; unit: string; range: { min: number; max: number; step: number }; disabled: boolean; onChange: (n: number) => void;
}) {
  return (
    <label className="field"><span className="lbl row" style={{ justifyContent: "space-between" }}>{label}<b style={{ color: "var(--text)" }}>{value} {unit}</b></span>
      <input type="range" className="range" min={range.min} max={range.max} step={range.step} value={value} disabled={disabled} aria-label={label} onChange={(e) => onChange(+e.target.value)} /></label>
  );
}

function WindowEditor({ title, ranges, disabled, onChange }: { title: string; ranges: TimeRange[]; disabled: boolean; onChange: (r: TimeRange[]) => void }) {
  const set = (i: number, patch: Partial<TimeRange>) => onChange(ranges.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="field th-windows">
      <span className="lbl">{title}</span>
      {ranges.length === 0 && <p className="sub">Chưa đặt khung nào: ngày này bé được đọc bất cứ lúc nào (vẫn theo giờ ngủ, giới hạn màn hình và nghỉ mắt).</p>}
      {ranges.map((r, i) => (
        <div key={i} className="row th-win-row">
          <input className="inp" type="time" aria-label={`${title}, khung ${i + 1}: từ`} value={r.start} disabled={disabled} onChange={(e) => set(i, { start: e.target.value })} />
          <span aria-hidden>–</span>
          <input className="inp" type="time" aria-label={`${title}, khung ${i + 1}: đến`} value={r.end} disabled={disabled} onChange={(e) => set(i, { end: e.target.value })} />
          {!disabled && <IconButton icon={X} className="btn btn-g" label={`Xoá khung ${i + 1} (${title})`} onClick={() => onChange(ranges.filter((_, j) => j !== i))} />}
        </div>
      ))}
      {!disabled && (
        <button type="button" className="btn btn-s" style={{ width: "fit-content" }} disabled={ranges.length >= MAX_WINDOWS} title={ranges.length >= MAX_WINDOWS ? `Tối đa ${MAX_WINDOWS} khung mỗi loại ngày` : undefined}
          onClick={() => onChange([...ranges, { start: "", end: "" }])}><Plus className="ic" />Thêm khung giờ</button>
      )}
    </div>
  );
}

/** Các phần của form "Thời gian & thói quen": khung giờ, giờ ngủ, nghỉ mắt, giới hạn màn hình, thói quen đọc. */
export default function TimeHabitsSections({ value, onChange, disabled, habit, savedGoalDays, error }: Props) {
  const set = (patch: Partial<ScheduleValue>) => onChange({ ...value, ...patch });
  const goalLeft = savedGoalDays !== null && habit ? Math.max(0, savedGoalDays - habit.daysReadThisWeek) : null;

  return (
    <div className="sec" style={{ gap: 14 }}>
      <div className="trow strong">
        <span>Giới hạn thời gian đọc<small>Bật để áp dụng khung giờ, giờ ngủ, nghỉ mắt và giới hạn màn hình bên dưới. Tắt thì bé đọc không bị chặn.</small></span>
        <Toggle on={value.enabled} label="Giới hạn thời gian đọc" disabled={disabled} onClick={() => set({ enabled: !value.enabled })} />
      </div>

      <Card title="Khung giờ được đọc" hint={`Tối đa ${MAX_WINDOWS} khung mỗi loại ngày, không chồng nhau. Ngoài khung, bé không mở được truyện.`} error={error} section="windows">
        <WindowEditor title="Ngày thường (Thứ 2 – Thứ 6)" ranges={value.weekday} disabled={disabled} onChange={(weekday) => set({ weekday })} />
        <WindowEditor title="Cuối tuần (Thứ 7, Chủ nhật)" ranges={value.weekend} disabled={disabled} onChange={(weekend) => set({ weekend })} />
      </Card>

      <Card title="Giờ đi ngủ" hint="Từ 18:00 đến 23:30. Sau giờ này bé không đọc được nữa; để trống nếu không đặt." error={error} section="bedtime">
        <div className="th-pair">
          <TimeField label="Ngày thường" value={value.bedtimeWeekday} disabled={disabled} min={BEDTIME_RANGE.min} max={BEDTIME_RANGE.max} onChange={(bedtimeWeekday) => set({ bedtimeWeekday })} />
          <TimeField label="Cuối tuần" value={value.bedtimeWeekend} disabled={disabled} min={BEDTIME_RANGE.min} max={BEDTIME_RANGE.max} onChange={(bedtimeWeekend) => set({ bedtimeWeekend })} />
        </div>
      </Card>

      <Card title="Nghỉ giữa các phiên đọc" hint="Sau một lúc đọc liên tục, bé phải nghỉ ngắn trước khi đọc tiếp." error={error} section="break">
        <div className="trow"><span>Bật nghỉ mắt</span><Toggle on={value.breakEnabled} label="Bật nghỉ mắt" disabled={disabled} onClick={() => set({ breakEnabled: !value.breakEnabled })} /></div>
        <div className="th-pair">
          <Slider label="Nghỉ sau mỗi" value={value.breakAfterMinutes} unit="phút đọc" range={BREAK_AFTER_RANGE} disabled={disabled} onChange={(breakAfterMinutes) => set({ breakAfterMinutes })} />
          <Slider label="Mỗi lần nghỉ" value={value.breakDurationMinutes} unit="phút" range={BREAK_DURATION_RANGE} disabled={disabled} onChange={(breakDurationMinutes) => set({ breakDurationMinutes })} />
        </div>
        <div className="field"><span className="lbl">Lời nhắc trên màn nghỉ (chọn ít nhất một)</span>
          <div className="chips">
            {([["breakRemindEyes", "Thư giãn mắt"], ["breakRemindWater", "Uống nước"], ["breakRemindMove", "Đứng dậy vận động"]] as const).map(([key, label]) => (
              <button key={key} type="button" className={`chip${value[key] ? " on" : ""}`} aria-pressed={value[key]} disabled={disabled} onClick={() => set({ [key]: !value[key] })}>{label}</button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Thời gian nhìn màn hình" hint="Tổng số phút bé dùng ứng dụng mỗi ngày. Hết phút thì bé không đọc được cho đến hôm sau." error={error} section="screen">
        <div className="trow"><span>Bật giới hạn màn hình</span><Toggle on={value.screenLimitEnabled} label="Bật giới hạn màn hình" disabled={disabled} onClick={() => set({ screenLimitEnabled: !value.screenLimitEnabled })} /></div>
        <div className="th-pair">
          <Slider label="Ngày thường" value={value.screenLimitWeekdayMinutes} unit="phút" range={SCREEN_LIMIT_RANGE} disabled={disabled} onChange={(screenLimitWeekdayMinutes) => set({ screenLimitWeekdayMinutes })} />
          <Slider label="Cuối tuần" value={value.screenLimitWeekendMinutes} unit="phút" range={SCREEN_LIMIT_RANGE} disabled={disabled} onChange={(screenLimitWeekendMinutes) => set({ screenLimitWeekendMinutes })} />
        </div>
      </Card>

      <Card title="Thói quen đọc" hint="Giờ nhắc đọc và mục tiêu số ngày đọc mỗi tuần. Một ngày được tính là bé đã đọc khi bé hoàn thành ít nhất một truyện." error={error} section="habit">
        <div className="trow"><span>Bật thói quen đọc<small>Hoạt động độc lập với giới hạn thời gian ở trên.</small></span>
          <Toggle on={value.habitEnabled} label="Bật thói quen đọc" disabled={disabled} onClick={() => set({ habitEnabled: !value.habitEnabled })} /></div>
        <div className="th-pair">
          <TimeField label="Giờ nhắc ngày thường" value={value.readingReminderWeekday} disabled={disabled} min={REMINDER_MIN} onChange={(readingReminderWeekday) => set({ readingReminderWeekday })} />
          <TimeField label="Giờ nhắc cuối tuần" value={value.readingReminderWeekend} disabled={disabled} min={REMINDER_MIN} onChange={(readingReminderWeekend) => set({ readingReminderWeekend })} />
        </div>
        <p className="sub">Giờ nhắc phải từ 06:00, trước giờ đi ngủ và nằm trong một khung giờ được đọc (nếu ngày đó có đặt khung). Các giá trị này luôn được kiểm khi lưu, kể cả khi thói quen đang tắt.</p>
        <div className="field"><span className="lbl">Mục tiêu mỗi tuần</span>
          <div className="seg th-goal" role="radiogroup" aria-label="Mục tiêu số ngày đọc mỗi tuần">
            <button type="button" role="radio" aria-checked={value.weeklyGoalDays === null} className={value.weeklyGoalDays === null ? "on" : ""} disabled={disabled} onClick={() => set({ weeklyGoalDays: null })}>Không đặt</button>
            {WEEKLY_GOALS.map((d) => (
              <button key={d} type="button" role="radio" aria-checked={value.weeklyGoalDays === d} className={value.weeklyGoalDays === d ? "on" : ""} disabled={disabled} onClick={() => set({ weeklyGoalDays: d })}>{d} ngày</button>
            ))}
          </div>
        </div>
        {habit && (
          <div className="kv" aria-label="Tiến độ thói quen">
            <div><small>Chuỗi ngày đọc</small><b>{habit.streakDays} ngày</b></div>
            <div><small>Tuần này (từ Thứ 2)</small><b>{habit.daysReadThisWeek}{savedGoalDays !== null ? ` / ${savedGoalDays}` : ""} ngày</b></div>
            {savedGoalDays !== null && (
              <div style={{ gridColumn: "1 / -1" }}><small>Mục tiêu tuần</small><b>{habit.goalMetThisWeek ? "Đã đạt mục tiêu" : `Còn ${goalLeft} ngày nữa`}</b></div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
