"use client";

import type { ReactNode } from "react";
import {
  Bell, Calendar, Check, Clock, Droplets, Eye, Flame, Footprints, Monitor, Moon, Plus, ShieldCheck, Sparkles, Target, X,
} from "lucide-react";
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

function Card({
  title, hint, icon, tone = "primary", toggle, active = true, full = false, error, section, children,
}: {
  title: string;
  hint?: string;
  icon: ReactNode;
  tone?: "primary" | "night" | "sky" | "mint" | "gold";
  toggle?: { on: boolean; label: string; onToggle: () => void; disabled?: boolean };
  active?: boolean;
  full?: boolean;
  error: SectionError;
  section: ScheduleSection;
  children: ReactNode;
}) {
  return (
    <section
      className={`th-card${full ? " th-full" : ""}${!active ? " is-muted" : ""}`}
      aria-label={title}
    >
      <header className="th-card-head">
        <span className={`th-ic tone-${tone}`} aria-hidden>{icon}</span>
        <div className="grow">
          <div className="th-title-row">
            <h3 className="display">{title}</h3>
            {toggle && (
              <span className={`pill ${toggle.on ? "ok" : "draft"}`}>
                {toggle.on ? "Đang bật" : "Đang tắt"}
              </span>
            )}
          </div>
          {hint && <p className="sub">{hint}</p>}
        </div>
        {toggle && (
          <Toggle on={toggle.on} label={toggle.label} disabled={toggle.disabled} onClick={toggle.onToggle} />
        )}
      </header>
      <div className="th-card-body">
        {children}
      </div>
      {error?.section === section && <div className="notice err" role="alert" data-inline-notice>{error.text}</div>}
    </section>
  );
}

function TimeField({ label, value, onChange, disabled, min, max }: { label: string; value: string; onChange: (v: string) => void; disabled: boolean; min?: string; max?: string }) {
  return (
    <label className="field th-time">
      <span className="lbl">{label}</span>
      <span className="th-time-ctrl">
        <input className="inp" type="time" value={value} min={min} max={max} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        {value !== "" && !disabled && <IconButton icon={X} className="btn btn-g" label={`Bỏ ${label.toLowerCase()}`} onClick={() => onChange("")} />}
      </span>
    </label>
  );
}

function Slider({ label, value, unit, range, disabled, onChange }: {
  label: string; value: number; unit: string; range: { min: number; max: number; step: number }; disabled: boolean; onChange: (n: number) => void;
}) {
  const pct = Math.max(0, Math.min(100, ((value - range.min) / (range.max - range.min)) * 100));
  return (
    <label className="field th-slider-field">
      <span className="lbl th-slider-head">
        <span>{label}</span>
        <b className="th-val-pill">{value} {unit}</b>
      </span>
      <input
        type="range"
        className="range th-range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        disabled={disabled}
        aria-label={label}
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(+e.target.value)}
      />
      <span className="th-range-bounds" aria-hidden>
        <small>{range.min} {unit}</small>
        <small>{range.max} {unit}</small>
      </span>
    </label>
  );
}

function WindowEditor({ title, badge, ranges, disabled, onChange }: { title: string; badge: string; ranges: TimeRange[]; disabled: boolean; onChange: (r: TimeRange[]) => void }) {
  const set = (i: number, patch: Partial<TimeRange>) => onChange(ranges.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="th-subpanel th-windows">
      <div className="th-subpanel-head">
        <span className="lbl">{title}</span>
        <span className="pill draft">{badge}</span>
      </div>
      {ranges.length === 0 && (
        <p className="th-empty-slot">Chưa đặt khung: bé được đọc bất cứ lúc nào (vẫn theo giờ ngủ, nghỉ mắt & màn hình).</p>
      )}
      <div className="th-win-list">
        {ranges.map((r, i) => (
          <div key={i} className="th-win-row">
            <input className="inp" type="time" aria-label={`${title}, khung ${i + 1}: từ`} value={r.start} disabled={disabled} onChange={(e) => set(i, { start: e.target.value })} />
            <span className="th-dash" aria-hidden>→</span>
            <input className="inp" type="time" aria-label={`${title}, khung ${i + 1}: đến`} value={r.end} disabled={disabled} onChange={(e) => set(i, { end: e.target.value })} />
            {!disabled && <IconButton icon={X} className="btn btn-g" label={`Xoá khung ${i + 1} (${title})`} onClick={() => onChange(ranges.filter((_, j) => j !== i))} />}
          </div>
        ))}
      </div>
      {!disabled && (
        <button
          type="button"
          className="btn btn-s th-add-win"
          disabled={ranges.length >= MAX_WINDOWS}
          title={ranges.length >= MAX_WINDOWS ? `Tối đa ${MAX_WINDOWS} khung mỗi loại ngày` : undefined}
          onClick={() => onChange([...ranges, { start: "", end: "" }])}
        >
          <Plus className="ic" />Thêm khung giờ
        </button>
      )}
    </div>
  );
}

const BREAK_REMINDERS = [
  ["breakRemindEyes", "Thư giãn mắt", Eye],
  ["breakRemindWater", "Uống nước", Droplets],
  ["breakRemindMove", "Đứng dậy vận động", Footprints],
] as const;

/**
 * Các phần của form "Thời gian & thói quen", mỗi phần bật tắt độc lập:
 * giới hạn thời gian đọc (khung giờ + giờ ngủ), màn hình, nghỉ giữa giờ, thói quen đọc.
 */
export default function TimeHabitsSections({ value, onChange, disabled, habit, savedGoalDays, error }: Props) {
  const set = (patch: Partial<ScheduleValue>) => onChange({ ...value, ...patch });
  // Công tắc của từng nhóm tắt thì các ô trong nhóm đó bị khóa (giá trị đã đặt vẫn giữ nguyên).
  // Công tắc tổng chỉ lo khung giờ + giờ ngủ; màn hình, nghỉ giữa giờ và thói quen có công tắc riêng.
  const timeLocked = disabled || !value.enabled;
  const screenLocked = disabled || !value.screenLimitEnabled;
  const breakLocked = disabled || !value.breakEnabled;
  const habitLocked = disabled || !value.habitEnabled;
  const goalLeft = savedGoalDays !== null && habit ? Math.max(0, savedGoalDays - habit.daysReadThisWeek) : null;
  const goalPct = savedGoalDays && habit ? Math.min(100, Math.round((habit.daysReadThisWeek / savedGoalDays) * 100)) : 0;

  return (
    <div className="th-root">
      {/* Ba nhóm bọc trong .th-col: ở tab là display: contents (xếp dọc như cũ), ở form tạo bé thành 3 cột. */}
      <div className="th-col">
      {/* Nhóm "Giới hạn thời gian đọc": công tắc tổng + khung giờ + giờ đi ngủ */}
      <div className={`th-master${value.enabled ? " on" : ""}`}>
        <span className="th-master-ic" aria-hidden><ShieldCheck className="ic" /></span>
        <div className="grow">
          <div className="th-title-row">
            <b className="display">Giới hạn thời gian đọc</b>
            <span className={`pill ${value.enabled ? "ok" : "draft"}`}>
              {value.enabled ? "Đang áp dụng" : "Đang tắt"}
            </span>
          </div>
          <p className="sub">
            Bật để áp dụng khung giờ được đọc và giờ đi ngủ bên dưới. Tắt thì bé đọc không bị chặn theo giờ và hai mục này bị khóa.
          </p>
        </div>
        <Toggle on={value.enabled} label="Giới hạn thời gian đọc" disabled={disabled} onClick={() => set({ enabled: !value.enabled })} />
      </div>

      <div className={`th-grid${!value.enabled ? " th-limits-off" : ""}`}>
        <Card
          title="Khung giờ được đọc"
          hint={`Tối đa ${MAX_WINDOWS} khung mỗi loại ngày, không chồng nhau. Ngoài khung, bé không mở được truyện.`}
          icon={<Clock className="ic" />}
          tone="primary"
          full
          active={value.enabled}
          error={error}
          section="windows"
        >
          <div className="th-pair">
            <WindowEditor title="Ngày thường" badge="Thứ 2 – Thứ 6" ranges={value.weekday} disabled={timeLocked} onChange={(weekday) => set({ weekday })} />
            <WindowEditor title="Cuối tuần" badge="Thứ 7, Chủ nhật" ranges={value.weekend} disabled={timeLocked} onChange={(weekend) => set({ weekend })} />
          </div>
        </Card>

        <Card
          title="Giờ đi ngủ"
          hint="Từ 18:00 đến 23:30. Sau giờ này bé không đọc được nữa; để trống nếu không đặt."
          icon={<Moon className="ic" />}
          tone="night"
          full
          active={value.enabled}
          error={error}
          section="bedtime"
        >
          <div className="th-pair-tight">
            <TimeField label="Ngày thường" value={value.bedtimeWeekday} disabled={timeLocked} min={BEDTIME_RANGE.min} max={BEDTIME_RANGE.max} onChange={(bedtimeWeekday) => set({ bedtimeWeekday })} />
            <TimeField label="Cuối tuần" value={value.bedtimeWeekend} disabled={timeLocked} min={BEDTIME_RANGE.min} max={BEDTIME_RANGE.max} onChange={(bedtimeWeekend) => set({ bedtimeWeekend })} />
          </div>
        </Card>
      </div>
      </div>

      {/* Hai phần có công tắc riêng, không phụ thuộc "Giới hạn thời gian đọc" */}
      <div className="th-col">
      <div className="th-divider">
        <span>Màn hình &amp; nghỉ giữa giờ</span>
      </div>

      <div className="th-grid">
        <Card
          title="Thời gian nhìn màn hình"
          hint="Tổng số phút mỗi ngày. Hết phút thì bé không đọc được cho đến hôm sau."
          icon={<Monitor className="ic" />}
          tone="sky"
          full
          active={value.screenLimitEnabled}
          toggle={{
            on: value.screenLimitEnabled,
            label: "Bật giới hạn màn hình",
            disabled,
            onToggle: () => set({ screenLimitEnabled: !value.screenLimitEnabled }),
          }}
          error={error}
          section="screen"
        >
          <div className="th-pair">
            <div className="th-subpanel">
              <Slider label="Ngày thường" value={value.screenLimitWeekdayMinutes} unit="phút" range={SCREEN_LIMIT_RANGE} disabled={screenLocked} onChange={(screenLimitWeekdayMinutes) => set({ screenLimitWeekdayMinutes })} />
            </div>
            <div className="th-subpanel">
              <Slider label="Cuối tuần" value={value.screenLimitWeekendMinutes} unit="phút" range={SCREEN_LIMIT_RANGE} disabled={screenLocked} onChange={(screenLimitWeekendMinutes) => set({ screenLimitWeekendMinutes })} />
            </div>
          </div>
        </Card>

        <Card
          title="Nghỉ giữa các phiên đọc"
          hint="Sau một lúc đọc liên tục, bé phải nghỉ ngắn trước khi đọc tiếp."
          icon={<Eye className="ic" />}
          tone="mint"
          full
          active={value.breakEnabled}
          toggle={{
            on: value.breakEnabled,
            label: "Bật nghỉ giữa giờ",
            disabled,
            onToggle: () => set({ breakEnabled: !value.breakEnabled }),
          }}
          error={error}
          section="break"
        >
          <div className="th-pair">
            <div className="th-subpanel">
              <Slider label="Nghỉ sau mỗi" value={value.breakAfterMinutes} unit="phút đọc" range={BREAK_AFTER_RANGE} disabled={breakLocked} onChange={(breakAfterMinutes) => set({ breakAfterMinutes })} />
            </div>
            <div className="th-subpanel">
              <Slider label="Mỗi lần nghỉ" value={value.breakDurationMinutes} unit="phút" range={BREAK_DURATION_RANGE} disabled={breakLocked} onChange={(breakDurationMinutes) => set({ breakDurationMinutes })} />
            </div>
          </div>
          <div className="th-subpanel">
            <span className="lbl">Lời nhắc trên màn nghỉ (chọn ít nhất một)</span>
            <div className="chips th-remind th-remind-chips">
              {BREAK_REMINDERS.map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  className={`chip${value[key] ? " on" : ""}`}
                  aria-pressed={value[key]}
                  disabled={breakLocked}
                  onClick={() => set({ [key]: !value[key] })}
                >
                  <Icon className="ic" aria-hidden />
                  {label}
                  {value[key] && <Check className="ic th-remind-check" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
      </div>

      <div className="th-col">
      <div className="th-divider">
        <span>Thói quen đọc</span>
      </div>

      <Card
        title="Thói quen & mục tiêu đọc"
        hint="Giờ nhắc đọc và mục tiêu số ngày đọc mỗi tuần. Một ngày được tính khi bé hoàn thành ít nhất một truyện."
        icon={<Sparkles className="ic" />}
        tone="gold"
        full
        active={value.habitEnabled}
        toggle={{
          on: value.habitEnabled,
          label: "Bật thói quen đọc",
          disabled,
          onToggle: () => set({ habitEnabled: !value.habitEnabled }),
        }}
        error={error}
        section="habit"
      >
        <div className={`th-habit-layout${habit ? "" : " single"}`}>
          <div className="th-habit-controls">
            <div className="th-subpanel">
              <div className="th-subpanel-head">
                <span className="lbl row" style={{ gap: 6 }}><Bell className="ic" aria-hidden />Giờ nhắc đọc mỗi ngày</span>
              </div>
              <div className="th-pair-tight">
                <TimeField label="Ngày thường" value={value.readingReminderWeekday} disabled={habitLocked} min={REMINDER_MIN} onChange={(readingReminderWeekday) => set({ readingReminderWeekday })} />
                <TimeField label="Cuối tuần" value={value.readingReminderWeekend} disabled={habitLocked} min={REMINDER_MIN} onChange={(readingReminderWeekend) => set({ readingReminderWeekend })} />
              </div>
              <p className="sub">Từ 06:00, trước giờ đi ngủ và nằm trong khung giờ được đọc (nếu có đặt khung). Luôn được kiểm khi lưu.</p>
            </div>

            <div className="field">
              <span className="lbl row" style={{ gap: 6 }}><Target className="ic" aria-hidden />Mục tiêu mỗi tuần</span>
              <div className="seg th-goal" role="radiogroup" aria-label="Mục tiêu số ngày đọc mỗi tuần">
                <button type="button" role="radio" aria-checked={value.weeklyGoalDays === null} className={value.weeklyGoalDays === null ? "on" : ""} disabled={habitLocked} onClick={() => set({ weeklyGoalDays: null })}>Không đặt</button>
                {WEEKLY_GOALS.map((d) => (
                  <button key={d} type="button" role="radio" aria-checked={value.weeklyGoalDays === d} className={value.weeklyGoalDays === d ? "on" : ""} disabled={habitLocked} onClick={() => set({ weeklyGoalDays: d })}>{d} ngày</button>
                ))}
              </div>
              <p className="sub">
                {value.weeklyGoalDays === null
                  ? "Chưa đặt mục tiêu: vẫn đếm số ngày bé đọc trong tuần, nhưng không so với chỉ tiêu nào."
                  : `Bé cần đọc xong ít nhất 1 truyện vào ${value.weeklyGoalDays} ngày bất kỳ trong tuần (Thứ 2 – Chủ nhật), không cần liền nhau. Đọc nhiều truyện trong một ngày vẫn tính 1 ngày.`}
              </p>
              <p className="sub">
                Mục tiêu giữ nguyên qua các tuần, chỉ có tiến độ đếm lại từ 0 vào mỗi Thứ 2. Đạt mục tiêu: bé thấy cúp và lời khen trong app. Chưa đạt: bé không bị khóa hay trừ điểm, chỉ hiện "Còn N ngày", sang tuần mới bắt đầu lại.
              </p>
            </div>
          </div>

          {habit && (
            <div className="th-progress-box" aria-label="Tiến độ thói quen">
              <div className="th-progress-head">
                <span className="lbl row" style={{ gap: 6 }}><Calendar className="ic" aria-hidden />Tiến độ tuần này</span>
                {savedGoalDays !== null && (
                  <span className={`pill ${habit.goalMetThisWeek ? "ok" : "wait"}`}>
                    {habit.goalMetThisWeek ? "Đã đạt mục tiêu" : `Còn ${goalLeft} ngày`}
                  </span>
                )}
              </div>

              <div className="th-stats-row">
                <div className="th-stat">
                  <span className="th-stat-ic streak" aria-hidden><Flame className="ic" /></span>
                  <div>
                    <small>Chuỗi ngày đọc</small>
                    <b>{habit.streakDays} ngày</b>
                  </div>
                </div>
                <div className="th-stat">
                  <span className="th-stat-ic week" aria-hidden><Target className="ic" /></span>
                  <div>
                    <small>Từ Thứ 2</small>
                    <b>{habit.daysReadThisWeek}{savedGoalDays !== null ? ` / ${savedGoalDays}` : ""} ngày</b>
                  </div>
                </div>
              </div>

              {savedGoalDays !== null && (
                <div className="th-bar-wrap" aria-hidden>
                  <div className="th-bar-track">
                    <div className="th-bar-fill" style={{ width: `${goalPct}%` }} />
                  </div>
                  <small>{goalPct}% mục tiêu tuần</small>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
}
