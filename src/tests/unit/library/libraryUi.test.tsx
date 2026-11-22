import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { StoryCard } from "@/app/lib/storyView";
import { coverFor } from "@/app/lib/storyView";

vi.mock("@/app/context/WorkspaceDataContext", () => ({
  useWorkspaceData: () => ({ children: [], childrenLoading: false }),
}));

import { LibraryBookCard, LibrarySkeletonGrid } from "@/app/features/library/LibraryCards";
import LibraryDetailDialog from "@/app/features/library/LibraryDetailDialog";

function makeStory(overrides: Partial<StoryCard> & { raw?: Partial<StoryCard["raw"]> } = {}): StoryCard {
  const { raw: rawOverrides, ...rest } = overrides;
  return {
    id: 7,
    title: "Ếch con khám phá",
    ageBand: "6-8",
    topic: "Khám phá",
    fromAi: true,
    words: 1250,
    tone: "ok",
    statusLabel: "Đã xuất bản",
    by: "Tác giả Sen",
    cover: coverFor("https://example.invalid/cover.jpg#crop=0.1,0.05,0.6,0.8"),
    createdAt: "2020-01-01T00:00:00Z",
    ...rest,
    raw: {
      id: rest.id ?? 7,
      title: rest.title ?? "Ếch con khám phá",
      content: "Nội dung mẫu.",
      ageBand: rest.ageBand ?? "6-8",
      status: "Ready",
      isPublished: true,
      source: "Ai",
      genre: rest.topic ?? "Khám phá",
      createdAt: rest.createdAt ?? "2020-01-01T00:00:00Z",
      authorUserId: 1,
      language: "vi",
      description: "Một chuyến phiêu lưu quanh đầm sen.",
      moralLesson: "Luôn tò mò và sẻ chia cùng bạn bè.",
      coverImageUrl: "https://example.invalid/cover.jpg#crop=0.1,0.05,0.6,0.8",
      ...rawOverrides,
    },
  };
}

describe("Library UI components", () => {
  it("LibraryBookCard keeps .bk smoke selector, preserves crop cover, and stacks stats below left badge", () => {
    const rankedHtml = renderToStaticMarkup(
      <LibraryBookCard story={makeStory({ creator: true, viewCount: 42, favoriteCount: 11 })} rank={1} onPick={() => {}} />,
    );
    expect(rankedHtml).toContain('class="bk lib-card"');
    expect(rankedHtml).toContain("#1");
    expect(rankedHtml).toContain("below-pill");
    expect(rankedHtml).toContain("Ếch con khám phá");
    expect(rankedHtml).toContain("1.250 tiếng");
    expect(rankedHtml).toContain("166.67% 125%");

    const plainReadyHtml = renderToStaticMarkup(
      <LibraryBookCard story={makeStory({ creator: true, viewCount: 8, favoriteCount: 2 })} onPick={() => {}} />,
    );
    expect(plainReadyHtml).toContain("story-stats-badge");
    expect(plainReadyHtml).not.toContain("below-pill");

    const mediaHtml = renderToStaticMarkup(
      <LibraryBookCard
        story={makeStory({ tone: "wait", statusLabel: "Đang tạo minh hoạ", raw: { status: "MediaProcessing", isPublished: false } })}
        onPick={() => {}}
      />,
    );
    expect(mediaHtml).toContain("Đang tạo minh hoạ");
  });

  it("LibraryDetailDialog renders ready story actions, synopsis, moral lesson, and community stats", () => {
    const html = renderToStaticMarkup(
      <LibraryDetailDialog
        story={makeStory({ creator: true, viewCount: 99, favoriteCount: 17 })}
        go={() => {}}
        onKid={() => {}}
        onClose={() => {}}
        onPreview={() => {}}
        onAddRoadmap={() => {}}
        onReport={() => {}}
      />,
    );

    expect(html).toContain("Ếch con khám phá");
    expect(html).toContain("Một chuyến phiêu lưu quanh đầm sen.");
    expect(html).toContain("Bài học");
    expect(html).toContain("Luôn tò mò và sẻ chia cùng bạn bè.");
    expect(html).toContain("99");
    expect(html).toContain("17");
    expect(html).toContain("Cho bé đọc ngay");
    expect(html).toContain("Thêm vào lộ trình");
    expect(html).toContain("Xem trước như bé thấy");
    expect(html).toContain("Báo cáo nội dung");
  });

  it("LibraryDetailDialog switches actions cleanly for family drafts and moderation stories", () => {
    const familyHtml = renderToStaticMarkup(
      <LibraryDetailDialog
        story={makeStory({ family: true, fromAi: false })}
        go={() => {}}
        onClose={() => {}}
        onPreview={() => {}}
        onAddRoadmap={() => {}}
        onReport={() => {}}
      />,
    );
    expect(familyHtml).toContain("Mở trong trang Thủ công");
    expect(familyHtml).not.toContain("Thêm vào lộ trình");

    const modHtml = renderToStaticMarkup(
      <LibraryDetailDialog
        story={makeStory({ fromAi: true, raw: { status: "ModerationReview", isPublished: false } })}
        go={() => {}}
        onClose={() => {}}
        onPreview={() => {}}
        onAddRoadmap={() => {}}
        onReport={() => {}}
      />,
    );
    expect(modHtml).toContain("Đang chờ kiểm duyệt");
    expect(modHtml).toContain("Tiếp tục trong Studio");
    expect(modHtml).not.toContain("Xem trước như bé thấy");
  });

  it("LibrarySkeletonGrid exposes accessible loading state and requested skeleton count", () => {
    const html = renderToStaticMarkup(<LibrarySkeletonGrid count={4} label="Đang tải truyện mẫu…" />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Đang tải truyện mẫu…");
    expect(html.match(/lib-skel-card/g)).toHaveLength(4);
  });

  it("Parent library catalog CSS uses only design tokens, font-size variables, and preserves cover cropping", () => {
    const css = readFileSync(path.resolve(process.cwd(), "app/styles/features/library/library.css"), "utf8");
    const marker = "/* ===== Parent library catalog (Thư viện phụ huynh) ===== */";
    const start = css.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const catalogCss = css.slice(start);

    expect(catalogCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(catalogCss).not.toMatch(/rgba?\s*\(/i);
    expect(catalogCss).not.toMatch(/font-size\s*:\s*\d+(?:\.\d+)?px/i);
    expect(catalogCss).not.toMatch(/background-(?:size|position)\s*:[^;]*!important/i);
  });
});
