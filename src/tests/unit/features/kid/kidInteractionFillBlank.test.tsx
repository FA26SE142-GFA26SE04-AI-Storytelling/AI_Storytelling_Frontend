import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import KidInteraction from "@/app/features/kid/KidInteraction";
import type { ReadingInteraction } from "@/app/types/childReading";

const fillBlank = (audioUrls: Record<string, string>): ReadingInteraction => ({
  id: 905, type: "FillBlank", kind: null, prompt: "Điền chữ còn thiếu", characterName: null, modelSentence: null,
  modelAudioUrl: null, maskedSentence: "Phúc đứng ngắm bộ xương ___ rất lớn.", hint: "Một loài vật rất to",
  waitFeedback: null, revealSceneIndex: null, audioUrls, options: [],
});

const render = (q: ReadingInteraction) =>
  renderToStaticMarkup(<KidInteraction interaction={q} busy={false} onSubmit={async () => null} onContinue={() => {}} onReplay={() => {}} />);

/** Nút "Nghe câu" của FillBlank: backend đọc nguyên câu nguồn vào audioUrls.text. */
describe("KidInteraction FillBlank sentence audio", () => {
  const listenButton = (html: string) => html.match(/<button[^>]*>(?:(?!<\/button>).)*Nghe câu<\/button>/)?.[0] ?? "";

  it("enables 'Nghe câu' when the sentence audio exists", () => {
    const button = listenButton(render(fillBlank({ text: "https://cdn.test/sentence.mp3" })));
    expect(button).not.toBe("");
    expect(button).not.toContain("disabled");
  });

  it("disables 'Nghe câu' when the sentence audio is missing", () => {
    const button = listenButton(render(fillBlank({ hint: "https://cdn.test/hint.mp3" })));
    expect(button).toContain("disabled");
  });
});
