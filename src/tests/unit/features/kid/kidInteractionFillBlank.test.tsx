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

/** Bé chưa biết chữ: câu hỏi hoặc câu hướng dẫn có nút nghe; truyện cũ chưa có audio hướng dẫn thì chỉ hiện chữ. */
describe("KidInteraction question and instruction audio", () => {
  const roleplay = (audioUrls: Record<string, string>): ReadingInteraction => ({
    ...fillBlank(audioUrls), type: "RolePlay", prompt: null, maskedSentence: null, hint: null,
    instruction: "Em hãy đóng vai Thỏ, nghe mẫu rồi nói theo câu này nhé!", characterName: "Thỏ", modelSentence: "Có ai không?",
  });

  it("shows the instruction as the heading with a listen button when its audio exists", () => {
    const html = render(roleplay({ instruction: "https://cdn.test/instruction.mp3", match: "https://cdn.test/match.mp3" }));
    expect(html).toContain("Em hãy đóng vai Thỏ, nghe mẫu rồi nói theo câu này nhé!");
    expect(html).toContain("Nghe câu hỏi");
  });

  it("shows the instruction text without a listen button when its audio is missing", () => {
    const html = render(roleplay({ match: "https://cdn.test/match.mp3" }));
    expect(html).toContain("Em hãy đóng vai Thỏ");
    expect(html).not.toContain("Nghe câu hỏi");
  });

  it("prefers the prompt and its audio for question types", () => {
    const html = render({ ...fillBlank({ prompt: "https://cdn.test/prompt.mp3" }), type: "Checkpoint", prompt: "Thỏ thấy sao?",
      instruction: null, maskedSentence: null, hint: null });
    expect(html).toContain("Thỏ thấy sao?");
    expect(html).toContain("Nghe câu hỏi");
  });

  it("gives each answer card its own listen button that is not the answer button", () => {
    const option = (id: number, text: string, audioUrl: string | null) =>
      ({ id, text, imageUrl: null, audioUrl, feedback: null, feedbackAudioUrl: null });
    const html = render({ ...fillBlank({ prompt: "https://cdn.test/prompt.mp3" }), type: "Checkpoint", prompt: "Thỏ thấy sao?",
      instruction: null, maskedSentence: null, hint: null,
      options: [option(1, "Vui", "https://cdn.test/o1.mp3"), option(2, "Buồn", "https://cdn.test/o2.mp3"), option(3, "Sợ", null)] });
    expect(html.match(/class="kid-answer-listen"/g)).toHaveLength(2);
    expect(html).toMatch(/aria-label="Nghe đáp án [ABC]"/);
    expect(html).not.toMatch(/<button[^>]*class="kid-answer"(?:(?!<\/button>).)*kid-answer-listen/);
  });

  it("shows the scene picture on event ordering cards when the backend sends one", () => {
    const card = (id: number, text: string, imageUrl: string | null) =>
      ({ id, text, imageUrl, audioUrl: `https://cdn.test/o${id}.mp3`, feedback: null, feedbackAudioUrl: null });
    const ordering = (imageUrls: (string | null)[]) => render({ ...fillBlank({}), type: "EventOrdering", prompt: null, maskedSentence: null,
      hint: null, instruction: "Em hãy chạm vào các thẻ theo đúng thứ tự chuyện xảy ra trong truyện nhé!",
      options: imageUrls.map((url, i) => card(i + 1, `Sự kiện ${i + 1}`, url)) });
    const withPics = ordering(["https://cdn.test/scene-1.png", null]);
    expect(withPics).toContain("kid-answer-grid pics");
    expect(withPics.match(/class="kid-answer pic"/g)).toHaveLength(2);
    expect(withPics).toContain("https://cdn.test/scene-1.png");
    expect(withPics.match(/class="kid-answer-listen"/g)).toHaveLength(2);
    expect(ordering([null, null])).not.toContain("kid-answer pic");
  });

  it("offers the hint audio for FillBlank when it exists", () => {
    expect(render(fillBlank({ text: "https://cdn.test/s.mp3", hint: "https://cdn.test/hint.mp3" }))).toContain("Nghe gợi ý");
    expect(render(fillBlank({ text: "https://cdn.test/s.mp3" }))).not.toContain("Nghe gợi ý");
  });
});
