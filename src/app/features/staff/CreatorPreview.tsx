"use client";

import { useCallback, useMemo } from "react";
import { Preview } from "@/app/features/library/LibraryWorkspace";
import { creatorService } from "@/app/services/creatorService";
import { gradientFor } from "@/app/lib/storyView";
import type { CreatorDraft } from "@/app/types/creator";

/**
 * "Đọc thử như bé thấy" cho Content Creator: dùng chung hộp xem trước của phụ huynh (tranh, chữ, giọng đọc từ gói media),
 * nhưng chữ lấy qua API /creator/stories của chính creator.
 */
export default function CreatorPreview({ story, onClose }: { story: CreatorDraft; onClose: () => void }) {
  const preview = useMemo(() => ({ id: story.storyId, title: story.title || "Truyện chưa đặt tên", gradient: gradientFor(story.storyId) }), [story.storyId, story.title]);
  const loadContent = useCallback(async () => {
    const draft = await creatorService.get(story.storyId);
    const versionId = draft.ok ? draft.data?.selectedVersionId : null;
    const version = versionId ? await creatorService.version(story.storyId, versionId) : null;
    return version?.ok ? version.data?.content ?? "" : "";
  }, [story.storyId]);
  return <Preview story={preview} loadContent={loadContent} onClose={onClose} />;
}
