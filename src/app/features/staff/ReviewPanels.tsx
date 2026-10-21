"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, CircleAlert, Eye, Plus, Send, Trash2, X } from "lucide-react";
import { staffService } from "@/app/services/staffService";
import type { ContentCategory } from "@/app/types/childProfile";
import type { ApiResponse } from "@/app/types/auth";
import type {
  ChangePart, ChecklistEntry, CommunityReviewPackage, PublicReviewChecklist, QueueItem, QueueItemDetail,
  ReportArchiveReason, ReportReviewPackage, ReviewBlocker, ReviewScene, ReviewStory, ReviewVersion, RoadmapReviewPackage, VersionComparison,
} from "@/app/types/staff";
import { ageLabel } from "@/app/lib/storyView";
import { Notice, fmt, useAction } from "./ui";

/**
 * Luồng 5 — Moderator ra quyết định cho mục đang nhận xử lý. Mỗi loại mục có gói duyệt và API riêng;
 * backend tự kiểm tra điều kiện duyệt và trả danh sách lý do còn chặn (`blockers`).
 */
export function ReviewPanel({ item, detail, onDecided }: { item: QueueItem; detail: QueueItemDetail | null; onDecided: () => void }) {
  switch (item.itemType) {
    case "PublicStoryReview": return <PublicStoryPanel itemId={item.id} onDecided={onDecided} />;
    case "CommunitySubmission": return <CommunityPanel itemId={item.id} onDecided={onDecided} />;
    case "RoadmapTemplateReview": return <RoadmapPanel itemId={item.id} onDecided={onDecided} />;
    case "ContentReport": return <ReportPanel itemId={item.id} onDecided={onDecided} />;
    case "PublicStoryRemoval": return <RemovalPanel itemId={item.id} rowVersion={detail?.rowVersion} onDecided={onDecided} />;
    default: return null;
  }
}

/** Các loại mục đã có API ra quyết định. */
export const DECIDABLE = ["PublicStoryReview", "CommunitySubmission", "RoadmapTemplateReview", "ContentReport", "PublicStoryRemoval"];

// ---------- Phần dùng chung ----------

function usePackage<T>(fetch: () => Promise<ApiResponse<T>>) {
  const [pkg, setPkg] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    const r = await fetch();
    setPkg(r.success ? r.data : null);
    setError(r.success ? null : r.message);
  }, [fetch]);
  useEffect(() => { void reload(); }, [reload]);
  return { pkg, error, reload };
}

function Blockers({ list }: { list: ReviewBlocker[] }) {
  if (!list.length) return null;
  return (
    <div className="notice warn">
      <b>Chưa duyệt được:</b>
      <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{list.map((b) => <li key={b.code + b.message}>{b.message}</li>)}</ul>
    </div>
  );
}

export function StoryHeader({ story, extra }: { story: ReviewStory; extra?: React.ReactNode }) {
  return (
    <div className="sec" style={{ gap: 4 }}>
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        {story.ageBand && <span className="pill draft">{ageLabel(story.ageBand)}</span>}
        {story.readingLevel != null && <span className="pill draft">Mức đọc {story.readingLevel}</span>}
        {story.labels.map((l) => <span key={l.code} className="pill ai">{l.displayName}</span>)}
        {extra}
      </div>
      {story.description && <p className="sub" style={{ margin: 0 }}>{story.description}</p>}
      {story.moralLesson && <small className="sub">Bài học: {story.moralLesson}</small>}
    </div>
  );
}

/** Nội dung truyện, cảnh, từ vựng, câu đố và câu hỏi thảo luận. `sceneActions` thêm nút cho từng cảnh (đánh dấu đã xem…). */
export function StoryContent({ version, scenes, vocabulary, quizzes, discussion, sceneActions, onAudioPlay }: {
  version: ReviewVersion | null;
  scenes: ReviewScene[];
  vocabulary: { term: string; definition: string }[];
  quizzes: { question: string; correctAnswer: string | null }[];
  discussion: { question: string }[];
  sceneActions?: (s: ReviewScene) => React.ReactNode;
  onAudioPlay?: (segmentId: number, heard: boolean) => void;
}) {
  return (
    <>
      {version?.content && <div className="st-content">{version.content}</div>}
      {version?.lesson && <small className="sub">Bài học của phiên bản: {version.lesson}</small>}
      {scenes.length > 0 && (
        <details open>
          <summary><b>Cảnh ({scenes.length})</b></summary>
          <div className="sec" style={{ gap: 10, marginTop: 8 }}>
            {scenes.map((s) => {
              const images = s.illustrations?.map((i) => i.url).filter((u): u is string => !!u) ?? s.imageUrls ?? [];
              return (
                <div key={s.sceneId ?? s.sceneIndex} className="st-card" style={{ gap: 6 }}>
                  <div className="row"><b className="grow">Cảnh {s.sceneIndex}</b>{sceneActions?.(s)}</div>
                  <p style={{ margin: 0 }}>{s.sceneText ?? s.text}</p>
                  {images.length > 0 && <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>{images.map((u) => <img key={u} src={u} alt={`Tranh cảnh ${s.sceneIndex}`} style={{ width: 140, borderRadius: 8 }} />)}</div>}
                  {s.segments?.filter((g) => g.audioUrl).map((g) => (
                    <div key={g.segmentId} className="row" style={{ gap: 6 }}>
                      <audio controls preload="none" src={g.audioUrl!} onPlay={() => onAudioPlay?.(g.segmentId, g.heard)} style={{ height: 32 }} />
                      {g.hasPronunciationWarning && <span className="pill flag">Cần nghe kỹ</span>}
                      {g.heard && <span className="pill ok">Đã nghe</span>}
                    </div>
                  ))}
                  {!s.segments && s.audioUrls?.map((u) => <audio key={u} controls preload="none" src={u} style={{ height: 32 }} />)}
                </div>
              );
            })}
          </div>
        </details>
      )}
      {vocabulary.length > 0 && (
        <details><summary><b>Từ vựng ({vocabulary.length})</b></summary>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{vocabulary.map((v) => <li key={v.term}><b>{v.term}</b>: {v.definition}</li>)}</ul>
        </details>
      )}
      {quizzes.length > 0 && (
        <details><summary><b>Câu đố ({quizzes.length})</b></summary>
          <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>{quizzes.map((q, i) => <li key={i}>{q.question}{q.correctAnswer ? <small className="sub"> — đáp án: {q.correctAnswer}</small> : null}</li>)}</ol>
        </details>
      )}
      {discussion.length > 0 && (
        <details><summary><b>Câu hỏi thảo luận ({discussion.length})</b></summary>
          <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>{discussion.map((d, i) => <li key={i}>{d.question}</li>)}</ol>
        </details>
      )}
    </>
  );
}

/** Checklist dạng danh sách mục (cộng đồng, bộ truyện mẫu): mỗi lần bấm lưu ngay mục đó. */
function EntryChecklist({ entries, busy, onSave }: { entries: ChecklistEntry[]; busy: boolean; onSave: (e: ChecklistEntry, passed: boolean) => void }) {
  return (
    <div className="sec" style={{ gap: 6 }}>
      <b>Checklist</b>
      {entries.map((e) => (
        <div key={e.code} className="row" style={{ gap: 8 }}>
          <span className="grow">{e.label || e.code}</span>
          <div className="seg">
            <button type="button" disabled={busy} className={e.passed ? "on" : ""} onClick={() => onSave(e, true)}>Đạt</button>
            <button type="button" disabled={busy} className={!e.passed ? "on" : ""} onClick={() => onSave(e, false)}>Chưa đạt</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Chọn nhãn nội dung (ít nhất một). */
function LabelPicker({ current, busy, onSave }: { current: number[]; busy: boolean; onSave: (ids: number[]) => void }) {
  const [all, setAll] = useState<ContentCategory[]>([]);
  const [picked, setPicked] = useState<number[]>(current);
  useEffect(() => { void staffService.categories().then((r) => setAll((r.data ?? []).filter((c) => c.isActive))); }, []);
  useEffect(() => { setPicked(current); }, [current]);
  const dirty = picked.length !== current.length || picked.some((x) => !current.includes(x));
  return (
    <div className="sec" style={{ gap: 6 }}>
      <b>Nhãn nội dung</b>
      <div className="chips">
        {all.map((c) => (
          <button key={c.id} type="button" className={`chip${picked.includes(c.id) ? " on" : ""}`}
            onClick={() => setPicked(picked.includes(c.id) ? picked.filter((x) => x !== c.id) : [...picked, c.id])}>{c.displayName}</button>
        ))}
      </div>
      {dirty && <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy || !picked.length} onClick={() => onSave(picked)}>Lưu nhãn</button>}
    </div>
  );
}

type Mode = null | "changes" | "reject";

/** Thanh quyết định: Duyệt / Yêu cầu sửa / Từ chối, kèm ô nhập lý do. */
function DecisionBar({ canApprove, busy, partTargets, partsRequired, onApprove, onRequestChanges, onReject }: {
  canApprove: boolean;
  busy: boolean;
  /** Các phần có thể đánh dấu cần sửa; bỏ trống thì không có nút "Yêu cầu sửa". */
  partTargets?: { key: string; label: string; part: Omit<ChangePart, "note"> }[];
  partsRequired?: boolean;
  onApprove: () => void;
  onRequestChanges?: (note: string, parts: ChangePart[]) => void;
  onReject: (reason: string) => void;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [text, setText] = useState("");
  const [parts, setParts] = useState<{ key: string; note: string }[]>([]);
  const valid = text.trim().length > 0 && (mode !== "changes" || !partsRequired || parts.length > 0) && parts.every((p) => p.note.trim());

  const submit = () => {
    if (mode === "reject") onReject(text.trim());
    if (mode === "changes" && onRequestChanges) {
      onRequestChanges(text.trim(), parts.map((p) => ({ ...partTargets!.find((t) => t.key === p.key)!.part, note: p.note.trim() })));
    }
  };

  return (
    <div className="sec" style={{ gap: 8, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
      {mode === null ? (
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <button className="btn btn-p" disabled={busy || !canApprove} onClick={onApprove}><Check className="ic" />Duyệt</button>
          {onRequestChanges && <button className="btn btn-s" disabled={busy} onClick={() => setMode("changes")}><Send className="ic" />Yêu cầu sửa</button>}
          <button className="btn btn-no" disabled={busy} onClick={() => setMode("reject")}><X className="ic" />Từ chối</button>
        </div>
      ) : (
        <>
          <label className="field">
            <span className="lbl">{mode === "reject" ? "Lý do từ chối" : "Nhận xét chung"} (bắt buộc)</span>
            <textarea className="inp" rows={3} maxLength={mode === "reject" ? 1000 : 2000} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          {mode === "changes" && partTargets && partTargets.length > 0 && (
            <div className="sec" style={{ gap: 6 }}>
              <span className="lbl">Phần cần sửa{partsRequired ? " (ít nhất một)" : " (không bắt buộc)"}</span>
              {parts.map((p, i) => (
                <div key={i} className="row" style={{ gap: 6 }}>
                  <select className="inp" style={{ width: "auto" }} value={p.key} onChange={(e) => setParts(parts.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}>
                    {partTargets.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                  <input className="inp grow" maxLength={1000} placeholder="Cần sửa gì" value={p.note} onChange={(e) => setParts(parts.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                  <button className="btn btn-g" aria-label="Bỏ phần này" onClick={() => setParts(parts.filter((_, j) => j !== i))}><Trash2 className="ic" /></button>
                </div>
              ))}
              <button className="btn btn-g" style={{ width: "fit-content" }} onClick={() => setParts([...parts, { key: partTargets[0].key, note: "" }])}><Plus className="ic" />Thêm phần</button>
            </div>
          )}
          <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn-g" onClick={() => { setMode(null); setText(""); setParts([]); }}>Hủy</button>
            <button className={`btn ${mode === "reject" ? "btn-no" : "btn-p"}`} disabled={busy || !valid} onClick={submit}>{mode === "reject" ? "Xác nhận từ chối" : "Gửi yêu cầu sửa"}</button>
          </div>
        </>
      )}
    </div>
  );
}

/** Gói chạy hành động: thành công thì tải lại gói; quyết định cuối thì báo hàng đợi tải lại. */
function useReviewAction(reload: () => Promise<void>, onDecided: () => void) {
  const { note, busy, run } = useAction(reload);
  const decide = async (fn: () => Promise<{ success: boolean; message: string }>, okText: string) => {
    if (await run(fn, okText)) onDecided();
  };
  return { note, busy, run, decide };
}

/** So sánh bản gửi lại với bản trước / bản đang công khai: trường đổi, độ dài, cảnh đổi, đoạn chữ đổi. */
function VersionCompare({ itemId }: { itemId: number }) {
  const [against, setAgainst] = useState<"previous" | "public" | null>(null);
  const [data, setData] = useState<VersionComparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = async (a: "previous" | "public") => {
    setAgainst(a);
    setData(null);
    const r = await staffService.compareVersions(itemId, a);
    setData(r.data);
    setError(r.success ? null : r.message);
  };
  return (
    <details>
      <summary><b>So sánh phiên bản</b></summary>
      <div className="sec" style={{ gap: 6, marginTop: 6 }}>
        <div className="seg" style={{ width: "fit-content" }}>
          <button type="button" className={against === "previous" ? "on" : ""} onClick={() => void load("previous")}>Với bản gửi trước</button>
          <button type="button" className={against === "public" ? "on" : ""} onClick={() => void load("public")}>Với bản đang công khai</button>
        </div>
        {error && <div className="notice err">{error}</div>}
        {data && (data.isIdentical ? <p className="sub" style={{ margin: 0 }}>Hai bản giống nhau.</p> : (
          <>
            <small className="sub">V{data.baseVersionNo} → V{data.currentVersionNo} · {data.baseMetrics.wordCount} → {data.currentMetrics.wordCount} từ
              {data.changedFields.length ? ` · đổi: ${data.changedFields.join(", ")}` : ""}</small>
            {data.sceneChanges.filter((c) => c.change !== "unchanged").map((c) => (
              <small key={c.sceneIndex}>Cảnh {c.sceneIndex}: {c.change === "added" ? "thêm mới" : c.change === "removed" ? "bị bỏ" : [c.textChanged && "lời", c.imageChanged && "tranh", c.audioChanged && "giọng đọc"].filter(Boolean).join(", ") + " thay đổi"}</small>
            ))}
            {data.artifactChanges.length > 0 && <small className="sub">Học liệu đổi: {data.artifactChanges.map((a) => `${a.kind} (${a.change})`).join(", ")}</small>}
            {data.textDiff.filter((d) => d.before !== d.after).map((d, i) => (
              <div key={i} className="st-content" style={{ whiteSpace: "pre-wrap" }}>
                {d.before && <div style={{ textDecoration: "line-through", color: "var(--danger)" }}>{d.before}</div>}
                {d.after && <div style={{ color: "var(--ok-ink)" }}>{d.after}</div>}
              </div>
            ))}
          </>
        ))}
      </div>
    </details>
  );
}

// ---------- Truyện Public Library ----------

const PUBLIC_CHECKLIST: [keyof PublicReviewChecklist, string][] = [
  ["safety", "An toàn"], ["ageFit", "Phù hợp tuổi"], ["education", "Giá trị giáo dục"], ["language", "Ngôn ngữ"],
  ["copyright", "Bản quyền"], ["image", "Tranh minh hoạ"], ["audio", "Giọng đọc"], ["interaction", "Câu đố, tương tác"],
];

function PublicStoryPanel({ itemId, onDecided }: { itemId: number; onDecided: () => void }) {
  const fetch = useCallback(() => staffService.publicReview.get(itemId), [itemId]);
  const { pkg, error, reload } = usePackage(fetch);
  const { note, busy, run, decide } = useReviewAction(reload, onDecided);
  const [flagReason, setFlagReason] = useState<Record<string, string>>({});

  if (error) return <div className="notice err">{error}</div>;
  if (!pkg) return <p className="sub">Đang tải gói duyệt…</p>;

  const r = staffService.publicReview;
  const missing = new Set(pkg.progress.missingSceneIds);
  const setCheck = (key: keyof PublicReviewChecklist, v: boolean) => void run(() => r.checklist(itemId, { ...pkg.checklist, [key]: v }), "Đã lưu checklist.");
  const targets = [
    { key: "metadata", label: "Thông tin truyện (tên, mô tả, nhãn)", part: { partType: "metadata" } },
    ...pkg.scenes.flatMap((s) => [
      { key: `t${s.sceneId}`, label: `Cảnh ${s.sceneIndex} — lời`, part: { partType: "scene_text", partId: s.sceneId } },
      { key: `i${s.sceneId}`, label: `Cảnh ${s.sceneIndex} — tranh`, part: { partType: "scene_image", partId: s.sceneId } },
      { key: `a${s.sceneId}`, label: `Cảnh ${s.sceneIndex} — giọng đọc`, part: { partType: "scene_audio", partId: s.sceneId } },
    ]),
    ...pkg.quizzes.map((q, i) => ({ key: `q${q.id}`, label: `Câu đố ${i + 1}`, part: { partType: "quiz", partId: q.id } })),
    ...pkg.vocabulary.map((v) => ({ key: `v${v.id}`, label: `Từ vựng “${v.term}”`, part: { partType: "vocabulary", partId: v.id } })),
    ...pkg.discussionQuestions.map((d, i) => ({ key: `d${d.id}`, label: `Câu hỏi thảo luận ${i + 1}`, part: { partType: "discussion", partId: d.id } })),
  ];

  return (
    <div className="sec" style={{ gap: 10 }}>
      <Notice note={note} />
      <h4 style={{ margin: 0 }}>{pkg.version.title || pkg.story.title} <small className="sub">phiên bản {pkg.versionNo}{pkg.isResubmission ? " · gửi lại" : ""}</small></h4>
      <StoryHeader story={pkg.story} />
      {pkg.isResubmission && <VersionCompare itemId={itemId} />}
      <small className="sub">
        Đã xem {pkg.progress.totalScenes - missing.size}/{pkg.progress.totalScenes} cảnh · đã nghe {pkg.progress.audioHeardCount} đoạn
        {pkg.progress.missingWarningSegmentIds.length > 0 ? ` · còn ${pkg.progress.missingWarningSegmentIds.length} đoạn cần nghe kỹ` : ""}
      </small>
      <StoryContent version={pkg.version} scenes={pkg.scenes} vocabulary={pkg.vocabulary} quizzes={pkg.quizzes} discussion={pkg.discussionQuestions}
        sceneActions={(s) => (s.sceneId && missing.has(s.sceneId)
          ? <button className="btn btn-g" disabled={busy} onClick={() => void run(() => r.markViewed(itemId, "scene", s.sceneId!), "Đã đánh dấu đã xem.")}><Eye className="ic" />Đã xem cảnh này</button>
          : <span className="pill ok">Đã xem</span>)}
        onAudioPlay={(segmentId, heard) => { if (!heard) void r.markViewed(itemId, "audio", segmentId).then(() => reload()); }} />

      {pkg.flags.length > 0 && (
        <div className="sec" style={{ gap: 6 }}>
          <b>Cờ cảnh báo</b>
          {pkg.flags.map((f) => (
            <div key={f.flagId} className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              <span className={`pill ${f.resolved ? "ok" : "flag"}`}>{f.resolved ? "Đã xử lý" : "Chưa xử lý"}</span>
              <span className="grow">{f.name}{f.reason ? ` — ${f.reason}` : ""}</span>
              {!f.resolved && <>
                <input className="inp" style={{ width: 200 }} placeholder="Vì sao cho qua" value={flagReason[f.flagId] ?? ""} onChange={(e) => setFlagReason({ ...flagReason, [f.flagId]: e.target.value })} />
                <button className="btn btn-s" disabled={busy || !flagReason[f.flagId]?.trim()} onClick={() => void run(() => r.resolveFlag(itemId, f.flagId, flagReason[f.flagId].trim()), "Đã xử lý cờ.")}>Cho qua</button>
              </>}
            </div>
          ))}
        </div>
      )}

      <div className="sec" style={{ gap: 6 }}>
        <b>Checklist 8 tiêu chí</b>
        {PUBLIC_CHECKLIST.map(([key, label]) => (
          <div key={key} className="row" style={{ gap: 8 }}>
            <span className="grow">{label}</span>
            <div className="seg">
              <button type="button" disabled={busy} className={pkg.checklist[key] === true ? "on" : ""} onClick={() => setCheck(key, true)}>Đạt</button>
              <button type="button" disabled={busy} className={pkg.checklist[key] === false ? "on" : ""} onClick={() => setCheck(key, false)}>Chưa đạt</button>
            </div>
          </div>
        ))}
      </div>

      <LabelPicker current={pkg.story.labels.map((l) => l.contentCategoryId ?? 0).filter(Boolean)} busy={busy}
        onSave={(ids) => void run(() => r.labels(itemId, ids), "Đã lưu nhãn.")} />

      {pkg.reviewHistory.length > 0 && (
        <details><summary><b>Các lần duyệt trước ({pkg.reviewHistory.length})</b></summary>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {pkg.reviewHistory.map((h) => <li key={h.itemId}>{fmt(h.decidedAt)} · {h.decision}{h.decidedByName ? ` · ${h.decidedByName}` : ""}{h.reason || h.feedback ? ` — ${h.reason ?? h.feedback}` : ""}</li>)}
          </ul>
        </details>
      )}

      <Blockers list={pkg.approveBlockers} />
      <DecisionBar canApprove={pkg.canApprove} busy={busy} partTargets={targets} partsRequired
        onApprove={() => void decide(() => r.approve(itemId), "Đã duyệt, truyện được xuất bản.")}
        onRequestChanges={(n, parts) => void decide(() => r.requestChanges(itemId, n, parts), "Đã gửi yêu cầu sửa.")}
        onReject={(reason) => void decide(() => r.reject(itemId, reason), "Đã từ chối.")} />
    </div>
  );
}

// ---------- Thư viện cộng đồng ----------

function CommunityPanel({ itemId, onDecided }: { itemId: number; onDecided: () => void }) {
  const fetch = useCallback(() => staffService.communityReview.get(itemId), [itemId]);
  const { pkg, error, reload } = usePackage<CommunityReviewPackage>(fetch);
  const { note, busy, run, decide } = useReviewAction(reload, onDecided);

  if (error) return <div className="notice err">{error}</div>;
  if (!pkg) return <p className="sub">Đang tải gói duyệt…</p>;
  const r = staffService.communityReview;

  return (
    <div className="sec" style={{ gap: 10 }}>
      <Notice note={note} />
      <h4 style={{ margin: 0 }}>{pkg.version.title || pkg.story.title}{pkg.isResubmission ? <small className="sub"> · gửi lại</small> : null}</h4>
      <StoryHeader story={pkg.story} extra={<span className="pill draft">{pkg.copyrightDeclaration === "OwnWork" ? "Phụ huynh tự sáng tác" : "Truyện do AI tạo"}</span>} />
      {pkg.piiRescan.length > 0 && (
        <div className="notice err"><CircleAlert className="ic" /> Nghi còn thông tin cá nhân: {pkg.piiRescan.map((p) => `${p.kind} (${p.location})`).join(", ")}</div>
      )}
      <StoryContent version={pkg.version} scenes={pkg.scenes} vocabulary={pkg.vocabulary} quizzes={pkg.quizzes} discussion={pkg.discussionQuestions} />
      <EntryChecklist entries={pkg.checklist} busy={busy}
        onSave={(e, passed) => void run(() => r.checklist(itemId, [{ code: e.code, passed, note: e.note }]), "Đã lưu checklist.")} />
      <LabelPicker current={pkg.labels.map((l) => l.id ?? 0).filter(Boolean)} busy={busy} onSave={(ids) => void run(() => r.labels(itemId, ids), "Đã lưu nhãn.")} />
      <Blockers list={pkg.blockers} />
      <DecisionBar canApprove={pkg.canApprove} busy={busy}
        onApprove={() => void decide(() => r.approve(itemId), "Đã duyệt, truyện có trong thư viện cộng đồng.")}
        onReject={(reason) => void decide(() => r.reject(itemId, reason), "Đã từ chối.")} />
    </div>
  );
}

// ---------- Bộ truyện mẫu ----------

function RoadmapPanel({ itemId, onDecided }: { itemId: number; onDecided: () => void }) {
  const fetch = useCallback(() => staffService.roadmapReview.get(itemId), [itemId]);
  const { pkg, error, reload } = usePackage<RoadmapReviewPackage>(fetch);
  const { note, busy, run, decide } = useReviewAction(reload, onDecided);

  if (error) return <div className="notice err">{error}</div>;
  if (!pkg) return <p className="sub">Đang tải gói duyệt…</p>;
  const r = staffService.roadmapReview;
  const m = pkg.roadmap;
  const targets = [
    { key: "name_description", label: "Tên và mô tả", part: { partType: "name_description" } },
    { key: "age_level", label: "Độ tuổi, mức đọc", part: { partType: "age_level" } },
    { key: "order", label: "Thứ tự truyện", part: { partType: "order" } },
    ...pkg.stories.flatMap((s) => [
      { key: `r${s.storyId}`, label: `Bỏ “${s.title ?? `#${s.storyId}`}”`, part: { partType: "story", storyId: s.storyId, action: "remove" } },
      { key: `p${s.storyId}`, label: `Thay “${s.title ?? `#${s.storyId}`}”`, part: { partType: "story", storyId: s.storyId, action: "replace" } },
    ]),
  ];

  return (
    <div className="sec" style={{ gap: 10 }}>
      <Notice note={note} />
      <h4 style={{ margin: 0 }}>{m.name}</h4>
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        <span className="pill draft">{ageLabel(m.ageBand)}</span>
        <span className="pill draft">Mức {m.readingLevelMin}–{m.readingLevelMax}</span>
        {m.mainCategory && <span className="pill ai">{m.mainCategory.displayName}</span>}
        <span className="pill draft">{m.defaultDaysPerStory} ngày mỗi truyện</span>
      </div>
      {m.description && <p className="sub" style={{ margin: 0 }}>{m.description}</p>}
      {m.createdByName && <small className="sub">Người tạo: {m.createdByName}</small>}
      <ol style={{ margin: 0, paddingLeft: 18 }}>
        {pkg.stories.map((s) => <li key={s.storyId}>{s.title ?? `Truyện #${s.storyId}`} <small className="sub">· {ageLabel(s.ageBand)}{s.days ? ` · ${s.days} ngày` : ""}</small>{!s.isEligible && <span className="pill flag" style={{ marginLeft: 6 }}>Không hợp lệ</span>}</li>)}
      </ol>
      {pkg.checks.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18 }}>{pkg.checks.map((c) => <li key={c.code} className={c.passed ? "" : "warn"}>{c.passed ? "✓" : "✗"} {c.message}</li>)}</ul>
      )}
      <EntryChecklist entries={pkg.checklist} busy={busy}
        onSave={(e, passed) => void run(() => r.checklist(itemId, [{ code: e.code, passed, note: e.note }]), "Đã lưu checklist.")} />
      <Blockers list={pkg.blockers} />
      <DecisionBar canApprove={pkg.canApprove} busy={busy} partTargets={targets}
        onApprove={() => void decide(() => r.approve(itemId), "Đã duyệt bộ truyện mẫu.")}
        onRequestChanges={(n, parts) => void decide(() => r.requestChanges(itemId, n, parts), "Đã gửi yêu cầu sửa.")}
        onReject={(reason) => void decide(() => r.reject(itemId, reason), "Đã từ chối.")} />
    </div>
  );
}

// ---------- Báo cáo nội dung ----------

const REPORT_REASON: Record<string, string> = {
  SafetyConcern: "Không an toàn cho trẻ", Inappropriate: "Nội dung không phù hợp", WrongAgeBand: "Không hợp lứa tuổi",
  Copyright: "Vi phạm bản quyền", Cultural: "Không phù hợp văn hoá", Other: "Lý do khác",
};
const ARCHIVE_REASON: [ReportArchiveReason, string][] = [["SafetyConcern", "Không an toàn"], ["Inappropriate", "Không phù hợp"], ["Copyright", "Bản quyền"]];

function ReportPanel({ itemId, onDecided }: { itemId: number; onDecided: () => void }) {
  const fetch = useCallback(() => staffService.reportReview.get(itemId), [itemId]);
  const { pkg, error, reload } = usePackage<ReportReviewPackage>(fetch);
  const { note, busy, decide } = useReviewAction(reload, onDecided);
  const [mode, setMode] = useState<null | "dismiss" | "archive" | "escalate">(null);
  const [reason, setReason] = useState("");
  const [archiveReason, setArchiveReason] = useState<ReportArchiveReason>("SafetyConcern");

  if (error) return <div className="notice err">{error}</div>;
  if (!pkg) return <p className="sub">Đang tải báo cáo…</p>;
  const r = staffService.reportReview;
  const submit = () => {
    const text = reason.trim();
    if (mode === "dismiss") void decide(() => r.dismiss(itemId, text), "Đã bỏ qua báo cáo.");
    if (mode === "archive") void decide(() => r.archive(itemId, archiveReason, text), "Đã gỡ truyện.");
    if (mode === "escalate") void decide(() => r.escalate(itemId, text), "Đã chuyển lên Administrator.");
  };

  return (
    <div className="sec" style={{ gap: 10 }}>
      <Notice note={note} />
      <div className="notice warn">
        <b>Lý do báo cáo:</b> {REPORT_REASON[pkg.reason] ?? pkg.reason} · {fmt(pkg.createdAt)}
        {pkg.description && <p style={{ margin: "4px 0 0" }}>{pkg.description}</p>}
        {pkg.attachmentUrl && <p style={{ margin: "4px 0 0" }}><a href={pkg.attachmentUrl} target="_blank" rel="noreferrer noopener">Nguồn đính kèm</a></p>}
      </div>
      {pkg.escalationReason && <div className="notice err"><b>Đã chuyển lên:</b> {pkg.escalationReason}</div>}
      <h4 style={{ margin: 0 }}>{pkg.version?.title ?? pkg.story.title}{pkg.story.isArchived ? <span className="pill draft" style={{ marginLeft: 6 }}>Đã lưu trữ</span> : null}</h4>
      <StoryHeader story={pkg.story} />
      <StoryContent version={pkg.version} scenes={pkg.scenes} vocabulary={pkg.vocabulary} quizzes={pkg.quizzes} discussion={pkg.discussionQuestions} />

      <div className="sec" style={{ gap: 8, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
        {mode === null ? (
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <button className="btn btn-s" disabled={busy} onClick={() => setMode("dismiss")}>Không vi phạm</button>
            <button className="btn btn-no" disabled={busy || pkg.story.isArchived} onClick={() => setMode("archive")}><Trash2 className="ic" />Gỡ truyện</button>
            {pkg.itemStatus !== "Escalated" && <button className="btn btn-g" disabled={busy} onClick={() => setMode("escalate")}>Chuyển lên Administrator</button>}
          </div>
        ) : (
          <>
            {mode === "archive" && (
              <div className="seg">{ARCHIVE_REASON.map(([id, label]) => <button key={id} type="button" className={archiveReason === id ? "on" : ""} onClick={() => setArchiveReason(id)}>{label}</button>)}</div>
            )}
            <label className="field">
              <span className="lbl">{mode === "dismiss" ? "Vì sao không vi phạm" : mode === "archive" ? "Ghi chú nội bộ" : "Lý do chuyển lên"} (bắt buộc)</span>
              <textarea className="inp" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-g" onClick={() => { setMode(null); setReason(""); }}>Hủy</button>
              <button className={`btn ${mode === "archive" ? "btn-no" : "btn-p"}`} disabled={busy || !reason.trim()} onClick={submit}>Xác nhận</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Yêu cầu gỡ truyện của Content Creator ----------

function RemovalPanel({ itemId, rowVersion, onDecided }: { itemId: number; rowVersion?: number; onDecided: () => void }) {
  const { note, busy, run } = useAction(async () => {});
  const [reason, setReason] = useState("");
  const decide = async (approve: boolean) => {
    if (await run(() => staffService.decideRemoval(itemId, approve, reason.trim(), rowVersion ?? 0), approve ? "Đã đồng ý gỡ truyện." : "Đã giữ truyện lại.")) onDecided();
  };
  return (
    <div className="sec" style={{ gap: 8 }}>
      <Notice note={note} />
      <p className="sub" style={{ margin: 0 }}>Content Creator xin gỡ truyện đã xuất bản. Đồng ý thì truyện bị gỡ khỏi thư viện; từ chối thì truyện giữ nguyên.</p>
      <label className="field">
        <span className="lbl">Lý do quyết định (bắt buộc)</span>
        <textarea className="inp" rows={3} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {rowVersion === undefined && <div className="notice warn">Chưa đọc được phiên bản của mục, hãy tải lại hàng đợi.</div>}
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-no" disabled={busy || !reason.trim() || rowVersion === undefined} onClick={() => void decide(true)}><Trash2 className="ic" />Đồng ý gỡ</button>
        <button className="btn btn-s" disabled={busy || !reason.trim() || rowVersion === undefined} onClick={() => void decide(false)}>Giữ truyện</button>
      </div>
    </div>
  );
}
