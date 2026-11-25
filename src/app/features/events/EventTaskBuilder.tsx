"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  COMPLETION_MODE_LABEL,
  VERIFIER_TYPE_LABEL,
  type TaskVerifierType,
  type TrackCompletionMode,
  type UpsertEventTaskDto,
} from "@/app/types/event";
import EventTaskFilterEditor, { useTaskFilterOptions } from "./EventTaskFilterEditor";

export type EventTaskBuilderProps = {
  rulesText: string;
  completionMode: TrackCompletionMode;
  requiredTaskCount: number;
  requiredPoints: number;
  tasks: UpsertEventTaskDto[];
  onRulesTextChange: (value: string) => void;
  onCompletionModeChange: (mode: TrackCompletionMode) => void;
  onRequiredTaskCountChange: (count: number) => void;
  onRequiredPointsChange: (points: number) => void;
  onTasksChange: (tasks: UpsertEventTaskDto[]) => void;
  onSave?: () => void;
  hideSaveButton?: boolean;
  votingEnabled?: boolean;
  busy?: boolean;
  eventId?: number;
  eventStoriesCount?: number;
  readingSource?: string;
};

/** Trình cấu hình nhiệm vụ động (1..N nhiệm vụ không giới hạn) và quy tắc xét đạt cho sự kiện. */
export default function EventTaskBuilder({
  rulesText,
  completionMode,
  requiredTaskCount,
  requiredPoints,
  tasks,
  onRulesTextChange,
  onCompletionModeChange,
  onRequiredTaskCountChange,
  onRequiredPointsChange,
  onTasksChange,
  onSave,
  hideSaveButton = false,
  votingEnabled = true,
  busy = false,
  eventId,
  eventStoriesCount = 0,
  readingSource,
}: EventTaskBuilderProps) {
  const [filtersOpened, setFiltersOpened] = useState(false);
  const filterOptions = useTaskFilterOptions(eventId, eventStoriesCount, filtersOpened, readingSource);

  const addTask = () => {
    const idx = tasks.length + 1;
    let codeNumber = idx;
    const usedCodes = new Set(tasks.map((task) => task.taskCode));
    while (usedCodes.has(`T${String(codeNumber).padStart(2, "0")}`)) codeNumber++;
    onTasksChange([
      ...tasks,
      {
        taskCode: `T${String(codeNumber).padStart(2, "0")}`,
        title: `Nhiệm vụ ${idx}`,
        description: "",
        sortOrder: idx,
        verifierType: "GuidedDiscussionCheckin",
        targetValue: 1,
        isMandatory: true,
        points: 10,
        allowMultiplePerStory: false,
      },
    ]);
  };

  const updateTask = (index: number, patch: Partial<UpsertEventTaskDto>) => {
    onTasksChange(tasks.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const removeTask = (index: number) => {
    onTasksChange(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="ev-card">
      <div className="ev-card-head">
        <h3 className="display">Thể lệ &amp; Bộ nhiệm vụ động ({tasks.length} nhiệm vụ)</h3>
        <button type="button" className="btn btn-s" onClick={addTask}>
          <Plus className="ic" aria-hidden="true" />
          Thêm nhiệm vụ
        </button>
      </div>

      <label className="ev-field">
        <span className="sub">Thể lệ sự kiện</span>
        <textarea
          className="inp"
          rows={2}
          value={rulesText}
          onChange={(e) => onRulesTextChange(e.target.value)}
          placeholder="Nhập thể lệ tham gia, điều kiện hợp lệ và quy tắc nhận giải..."
        />
      </label>

      <div className="ev-grid-2">
        <label className="ev-field">
          <span className="sub">Chế độ xét hoàn thành</span>
          <select
            className="inp"
            value={completionMode}
            onChange={(e) => onCompletionModeChange(e.target.value as TrackCompletionMode)}
          >
            {(Object.entries(COMPLETION_MODE_LABEL) as [TrackCompletionMode, string][]).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {completionMode === "MinimumTasksCount" && (
          <label className="ev-field">
            <span className="sub">Số nhiệm vụ tối thiểu cần đạt</span>
            <input
              type="number"
              className="inp"
              min={1}
              value={requiredTaskCount}
              onChange={(e) => onRequiredTaskCountChange(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        )}

        {completionMode === "MinimumPointsThreshold" && (
          <label className="ev-field">
            <span className="sub">Tổng điểm mục tiêu tối thiểu</span>
            <input
              type="number"
              className="inp"
              min={1}
              value={requiredPoints}
              onChange={(e) => onRequiredPointsChange(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        )}
      </div>

      <div className="ev-task-list">
        <div className="ev-builder-head" aria-hidden="true">
          <span>Nhiệm vụ</span><span>Đối tượng</span><span>Cách xác minh</span><span>Chỉ tiêu</span><span>Yêu cầu</span>
        </div>
        {tasks.map((task, idx) => (
          <div key={task.taskCode || idx} className="ev-builder-item">
            <div className="ev-builder-row">
              <input
                type="text"
                className="inp"
                value={task.title}
                aria-label={`Tên nhiệm vụ ${idx + 1}`}
                onChange={(e) => updateTask(idx, { title: e.target.value })}
                placeholder="Tên nhiệm vụ"
              />
              <select
                className="inp"
                aria-label={`Vai trò nhiệm vụ ${idx + 1}`}
                value={task.targetTrackType ?? ""}
                onChange={(e) => updateTask(idx, { targetTrackType: (e.target.value || null) as "Creator" | "Parent" | null })}
              >
                <option value="">Chung</option>
                <option value="Creator">Creator</option>
                <option value="Parent">Parent</option>
              </select>
              <select
                className="inp"
                value={task.verifierType}
                aria-label={`Loại kiểm chứng ${idx + 1}`}
                onChange={(e) => updateTask(idx, { verifierType: e.target.value as TaskVerifierType })}
              >
                {(Object.entries(VERIFIER_TYPE_LABEL) as [TaskVerifierType, string][]).map(([key, label]) => (
                  <option key={key} value={key} disabled={key === "VoteEventStories" && !votingEnabled}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="inp"
                min={1}
                value={task.targetValue}
                aria-label={`Chỉ tiêu ${idx + 1}`}
                onChange={(e) => updateTask(idx, { targetValue: Math.max(1, Number(e.target.value) || 1) })}
                title="Chỉ tiêu cần đạt"
              />
              <div className="row" style={{ gap: 6 }}>
                <label className="row" style={{ gap: 4, fontSize: "var(--fs-xs)", whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    checked={task.isMandatory}
                    onChange={(e) => updateTask(idx, { isMandatory: e.target.checked })}
                  />
                  Bắt buộc
                </label>
                <button
                  type="button"
                  className="btn btn-g icon-only"
                  aria-label={`Xóa nhiệm vụ ${idx + 1}`}
                  disabled={tasks.length <= 1}
                  onClick={() => removeTask(idx)}
                >
                  <Trash2 className="ic" aria-hidden="true" />
                </button>
              </div>
            </div>
            {completionMode === "MinimumPointsThreshold" && (
              <label className="ev-field" style={{ maxWidth: 200 }}>
                <span className="sub">Điểm nhiệm vụ</span>
                <input className="inp" type="number" min={0} value={task.points}
                  onChange={(event) => updateTask(idx, { points: Math.max(0, Math.trunc(Number(event.target.value) || 0)) })} />
              </label>
            )}
            {(task.verifierType !== "SubmitApprovedStory" || !!task.configJson) && (
              <EventTaskFilterEditor value={task.configJson} verifierType={task.verifierType} options={filterOptions}
                onOpen={() => setFiltersOpened(true)} onChange={(configJson) => updateTask(idx, { configJson })} />
            )}
          </div>
        ))}
      </div>

      {!hideSaveButton && onSave && (
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-p" disabled={busy || tasks.length === 0} onClick={onSave}>
            Lưu phiên bản thể lệ &amp; nhiệm vụ
          </button>
        </div>
      )}
    </div>
  );
}
