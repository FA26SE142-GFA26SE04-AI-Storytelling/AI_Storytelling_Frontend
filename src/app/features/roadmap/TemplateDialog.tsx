"use client";

import { Route } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import type * as B from "@/app/types/backendContracts";
import { ageLabel } from "@/app/lib/storyView";
import { useStoryCovers, useTemplateDetail } from "./roadmapData";

/** Popup của một album lộ trình mẫu: các truyện theo đúng thứ tự, nút thêm cả bộ cho bé. */
export default function TemplateDialog({ item, onClose, onAdd }: { item: B.RoadmapLibraryItemDto; onClose: () => void; onAdd: (detail: B.RoadmapLibraryDetailDto) => void }) {
  const { detail, loading } = useTemplateDetail(item.id);
  const stories = (detail?.stories ?? []).slice().sort((a, b) => a.position - b.position);
  const cover = useStoryCovers(stories.map((s) => s.storyId));
  const readable = stories.filter((s) => s.isAvailable).length;
  return (
    <Dialog title={item.name} onClose={onClose} wide>
      <div className="rm-tpl">
        <div className="rm-tags">
          <span className="pill draft">{ageLabel(item.ageBand)}</span>
          <span className="pill draft">Mức đọc {item.readingLevelMin}–{item.readingLevelMax}</span>
          {item.mainCategory && <span className="pill draft">{item.mainCategory.displayName}</span>}
          <span className="pill ok">{item.storyCount} truyện</span>
          {item.defaultDaysPerStory > 0 && <span className="pill draft">{item.defaultDaysPerStory} ngày mỗi truyện</span>}
        </div>
        {item.description && <p className="rm-tpl-desc">{item.description}</p>}
        {loading ? <p className="sub">Đang tải danh sách truyện…</p> : !detail ? <p className="notice err" role="alert" data-inline-notice>Không tải được danh sách truyện của lộ trình này.</p> : (
          <ol className="rm-steps">
            {stories.map((s, i) => (
              <li key={s.storyId} className={`rm-step${s.isAvailable ? "" : " off"}`}>
                <span className="rm-step-n">{i + 1}</span>
                <span className="rm-step-cover" style={{ background: cover(s.storyId) }} aria-hidden />
                <span className="grow"><b>{s.title ?? "Truyện không còn khả dụng"}</b></span>
                {!s.isAvailable && <span className="pill flag">Không còn đọc được</span>}
                {s.days ? <span className="pill draft">{s.days} ngày</span> : null}
              </li>
            ))}
          </ol>
        )}
        <div className="rm-tpl-foot">
          <button className="btn btn-p" disabled={!detail || readable === 0} onClick={() => detail && onAdd(detail)}><Route className="ic" />Thêm cho bé</button>
        </div>
      </div>
    </Dialog>
  );
}
