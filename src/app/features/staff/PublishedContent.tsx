"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Flag } from "lucide-react";
import { staffService } from "@/app/services/staffService";
import type { PublishedContentItem, PublishedRoadmap, PublishedSource, PublishedStoryContent } from "@/app/types/staff";
import { ageLabel } from "@/app/lib/storyView";
import { Notice, Page, fmt, useAction } from "./ui";
import { StoryContent, StoryHeader } from "./ReviewPanels";

const REASONS: [string, string][] = [
  ["SafetyConcern", "Không an toàn"], ["Inappropriate", "Không phù hợp"], ["WrongAgeBand", "Sai nhóm tuổi"],
  ["Copyright", "Bản quyền"], ["Cultural", "Văn hoá"], ["Other", "Khác"],
];
const AGE: Record<string, string> = { "6-8": "6–8 tuổi", "9-10": "9–10 tuổi" };
const age = (a: string) => AGE[a] ?? ageLabel(a);

type Open = { kind: "story"; id: number; roadmapId?: number; data: PublishedStoryContent | null } | { kind: "roadmap"; id: number; data: PublishedRoadmap | null };

/**
 * Luồng 5 — Moderator rà soát nội dung đã công khai (Thư viện chung, bộ truyện mẫu).
 * Mở nội dung là "Xem để rà soát": cấp quyền đọc 2 giờ và ghi audit. Thấy vấn đề thì đưa vào hàng đợi như một báo cáo.
 */
export function PublishedContent() {
  const [source, setSource] = useState<PublishedSource>("PublicLibrary");
  const [ageBand, setAgeBand] = useState("");
  const [list, setList] = useState<PublishedContentItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const [flagging, setFlagging] = useState<{ storyId: number; roadmapId?: number; reason: string; description: string } | null>(null);
  const p = staffService.published;

  const load = useCallback(async () => {
    const r = await p.list(source, ageBand || undefined);
    setList(r.data?.items ?? []);
    setLoadError(r.success ? null : r.message);
  }, [source, ageBand, p]);
  useEffect(() => { void load(); }, [load]);
  const { note, setNote, busy, run } = useAction(load);

  const view = async (kind: "story" | "roadmap", id: number, roadmapId?: number) => {
    setFlagging(null);
    const g = await p.grantView(kind === "story" ? { storyId: id } : { readingRoadmapId: id });
    if (!g.success) { setNote({ ok: false, text: g.message }); return; }
    if (kind === "story") {
      setOpen({ kind, id, roadmapId, data: null });
      const r = await p.story(id);
      if (r.success) setOpen({ kind, id, roadmapId, data: r.data }); else setNote({ ok: false, text: r.message });
    } else {
      setOpen({ kind, id, data: null });
      const r = await p.roadmap(id);
      if (r.success) setOpen({ kind, id, data: r.data }); else setNote({ ok: false, text: r.message });
    }
  };

  return (
    <Page title="Nội dung đã công khai" sub="Rà soát truyện trong Thư viện chung và bộ truyện mẫu. Mở để xem là có ghi nhận (quyền xem 2 giờ). Thấy vấn đề thì đưa vào hàng đợi kiểm duyệt."
      actions={<div className="row" style={{ gap: 8 }}>
        <div className="seg">{([["PublicLibrary", "Thư viện chung"], ["RoadmapTemplate", "Bộ truyện mẫu"]] as const).map(([s, l]) => <button key={s} className={source === s ? "on" : ""} onClick={() => { setSource(s); setOpen(null); }}>{l}</button>)}</div>
        <select className="inp" style={{ width: "auto" }} value={ageBand} onChange={(e) => setAgeBand(e.target.value)} aria-label="Nhóm tuổi"><option value="">Mọi độ tuổi</option><option value="6-8">6–8 tuổi</option><option value="9-10">9–10 tuổi</option></select>
      </div>}>
      <Notice note={note} />
      {loadError && <div className="notice err">{loadError}</div>}
      <div className="st-split">
        <div className="st-list">
          {list.length === 0 && !loadError && <p className="sub">Không có nội dung nào.</p>}
          {list.map((i) => (
            <button key={i.id} className={`st-item${open?.id === i.id ? " on" : ""}`} onClick={() => void view(source === "PublicLibrary" ? "story" : "roadmap", i.id)}>
              <span className="row"><b className="grow">{i.title}</b>{i.needsUpdate && <span className="pill flag">Cần cập nhật</span>}</span>
              <small>{age(i.ageBand)}{i.storyCount != null ? ` · ${i.storyCount} truyện` : ""} · công khai {fmt(i.publishedAt)}</small>
              {i.labels.length > 0 && <small>{i.labels.map((l) => l.displayName).join(", ")}</small>}
            </button>
          ))}
        </div>

        <div className="st-card">
          {!open && <p className="sub"><Eye className="ic" /> Chọn một mục để xem.</p>}
          {open && !open.data && <p className="sub">Đang mở…</p>}

          {open?.kind === "story" && open.data && (
            <>
              <h4 style={{ margin: 0 }}>{open.data.version?.title ?? open.data.story.title}{open.data.story.isArchived && <span className="pill draft" style={{ marginLeft: 6 }}>Đã lưu trữ</span>}</h4>
              <StoryHeader story={open.data.story} />
              <StoryContent version={open.data.version} scenes={open.data.scenes} vocabulary={open.data.vocabulary} quizzes={open.data.quizzes} discussion={open.data.discussionQuestions} />
              <button className="btn btn-no" style={{ width: "fit-content" }} onClick={() => setFlagging({ storyId: open.id, roadmapId: open.roadmapId, reason: "SafetyConcern", description: "" })}><Flag className="ic" />Đưa vào hàng đợi rà soát</button>
            </>
          )}

          {open?.kind === "roadmap" && open.data && (
            <>
              <h4 style={{ margin: 0 }}>{open.data.name}</h4>
              <small className="sub">{age(open.data.ageBand)} · mức {open.data.readingLevelMin}–{open.data.readingLevelMax}{open.data.mainCategory ? ` · ${open.data.mainCategory.displayName}` : ""} · {open.data.defaultDaysPerStory} ngày mỗi truyện</small>
              {open.data.description && <p className="sub" style={{ margin: 0 }}>{open.data.description}</p>}
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {open.data.stories.map((s) => (
                  <li key={s.storyId}>
                    {s.title ?? `Truyện #${s.storyId}`} <small className="sub">· {age(s.ageBand)}</small>
                    {s.isArchived && <span className="pill draft" style={{ marginLeft: 6 }}>Đã lưu trữ</span>}
                    <button className="btn btn-g" onClick={() => void view("story", s.storyId, open.id)}>Xem</button>
                  </li>
                ))}
              </ol>
            </>
          )}

          {flagging && (
            <div className="sec" style={{ gap: 8, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <div className="seg">{REASONS.map(([id, l]) => <button key={id} type="button" className={flagging.reason === id ? "on" : ""} onClick={() => setFlagging({ ...flagging, reason: id })}>{l}</button>)}</div>
              <label className="field"><span className="lbl">Ghi chú (không bắt buộc)</span>
                <textarea className="inp" rows={2} maxLength={2000} value={flagging.description} onChange={(e) => setFlagging({ ...flagging, description: e.target.value })} /></label>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button className="btn btn-g" onClick={() => setFlagging(null)}>Hủy</button>
                <button className="btn btn-no" disabled={busy} onClick={() => void run(() => p.createReviewItem(flagging.storyId, flagging.reason, flagging.description.trim(), flagging.roadmapId), "Đã đưa vào hàng đợi kiểm duyệt.").then((ok) => ok && setFlagging(null))}>Xác nhận</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
