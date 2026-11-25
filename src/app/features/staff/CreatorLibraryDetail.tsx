"use client";

import { BookOpen, Eye, Headphones, PencilLine, Tag, Users, WandSparkles } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { coverFor } from "@/app/lib/storyView";
import type { CreatorDraft } from "@/app/types/creator";
import { ageText, isAi, MODE, shelfTitle, SOURCE, sourceOf, topicOf } from "./creatorLibraryFilters";
import { fmt } from "./ui";

/** Popup chi tiết truyện của Thư viện Creator, cùng bố cục hộp chi tiết của Thư viện phụ huynh. */
export default function CreatorLibraryDetail({ story, onClose, onPreview, onOpen }: { story: CreatorDraft; onClose: () => void; onPreview: () => void; onOpen: () => void }) {
  return (
    <Dialog title={story.title || "Truyện chưa đặt tên"} onClose={onClose} wide className="lib-detail">
      <div className="lib-detail-layout">
        <div className="lib-detail-aside">
          <div className="lib-detail-cover" style={{ background: coverFor(story.coverImageUrl) }} aria-hidden="true" />
          <div className="lib-detail-aside-meta">
            <span className="pill ok lib-detail-status" title="Trạng thái">{shelfTitle(story)}</span>
          </div>
        </div>
        <div className="lib-detail-main">
          <div className="lib-detail-tags" aria-label="Thông tin truyện">
            <span className="lib-tag" title="Độ tuổi"><Users className="ic" aria-hidden="true" />{ageText(story.ageBand)}</span>
            <span className="lib-tag" title="Thể loại"><Tag className="ic" aria-hidden="true" />{topicOf(story)}</span>
            <span className="lib-tag" title="Cách tạo">{isAi(story) ? <WandSparkles className="ic" aria-hidden="true" /> : <PencilLine className="ic" aria-hidden="true" />}{SOURCE[sourceOf(story)]}</span>
            <span className="lib-tag" title="Chế độ">{story.experienceMode === "reading" ? <BookOpen className="ic" aria-hidden="true" /> : <Headphones className="ic" aria-hidden="true" />}{MODE[story.experienceMode] ?? story.experienceMode}</span>
          </div>
          {story.description?.trim() && <div className="lib-detail-prose"><p className="lib-detail-desc">{story.description}</p></div>}
          <div className="meta lib-detail-meta">
            <span>Phiên bản</span><b>{story.lastVersionNo ? `V${story.lastVersionNo}` : "Chưa lưu"}</b>
            <span>Cập nhật</span><b>{fmt(story.updatedAt ?? story.createdAt)}</b>
          </div>
          <div className="lib-detail-actions">
            <div className="lib-detail-primary">
              <button type="button" className="btn btn-p btn-c" onClick={onOpen} autoFocus>
                {isAi(story) ? <WandSparkles className="ic" aria-hidden="true" /> : <PencilLine className="ic" aria-hidden="true" />}Mở để soạn tiếp
              </button>
              <button type="button" className="btn btn-s btn-c" onClick={onPreview}><Eye className="ic" aria-hidden="true" />Đọc thử như bé thấy</button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
