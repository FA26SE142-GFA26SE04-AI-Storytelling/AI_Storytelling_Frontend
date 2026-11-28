"use client";

import { Check, CircleAlert, Headphones, WandSparkles } from "lucide-react";
import type { ListeningInteractionDto, ListeningReviewDto } from "@/app/types/aiStory";

const TYPE_LABEL: Record<string, string> = {
  Checkpoint: "Điểm dừng hỏi bé",
  RolePlay: "Nhập vai",
  FillBlank: "Điền từ còn thiếu",
  EventOrdering: "Sắp xếp sự kiện",
  PicturePrediction: "Đoán tranh",
  ReadAloud: "Luyện đọc to",
  CharacterLetter: "Chữ cái trong tên nhân vật",
  WhoSaidIt: "Ai đã nói câu này",
  PictureSearch: "Tìm vật trong tranh",
  TrueFalse: "Đúng hay sai",
  FollowAction: "Làm theo lời kể",
  SentenceBuilder: "Ghép câu",
  AlternateReading: "Đọc luân phiên",
  InferenceQuestion: "Câu hỏi suy luận",
  CauseEffect: "Nguyên nhân và kết quả",
  SceneTitle: "Đặt tên cho đoạn truyện",
  ThoughtBubble: "Bong bóng suy nghĩ",
  CharacterTrial: "Phiên tòa nhân vật",
  FindWrongDetail: "Tìm chi tiết sai",
  RelationshipMap: "Sơ đồ quan hệ nhân vật",
  StoryEditor: "Biên tập truyện",
  WhatIf: "Nếu như…",
};

function Interaction({ item }: { item: ListeningInteractionDto }) {
  const ordered = item.type === "EventOrdering";
  const options = [...item.options].sort((a, b) => (ordered ? (a.correctOrder ?? 99) - (b.correctOrder ?? 99) : a.sortOrder - b.sortOrder));
  return (
    <li>
      <div className="row">
        <b className="grow">{item.prompt || (item.characterName ? `Nhập vai: ${item.characterName}` : TYPE_LABEL[item.type] ?? item.type)}</b>
        <span className="pill draft">{TYPE_LABEL[item.type] ?? item.type}</span>
        {item.isStale && <span className="pill wait">Lỗi thời</span>}
      </div>
      {item.sourceQuote && <p className="sub">“{item.sourceQuote}”</p>}
      {item.hiddenWord && <p className="sub">Từ cần điền: <b>{item.hiddenWord}</b>{item.hint ? ` · Gợi ý: ${item.hint}` : ""}</p>}
      {options.length > 0 && (
        <ul className="choices">
          {options.map((o, i) => (
            <li key={o.id} className={o.isMatch ? "right" : ""}>
              {o.isMatch && <Check />}
              {ordered && o.correctOrder !== null ? `${o.correctOrder}. ` : ""}{o.text || o.imageDescription || `Lựa chọn ${i + 1}`}
            </li>
          ))}
        </ul>
      )}
      {item.explanation && <p className="sub">Giải thích: {item.explanation}</p>}
    </li>
  );
}

/** Tab "Khi nghe": xem các tương tác trong lúc nghe truyện, rồi xác nhận (backend yêu cầu bước này trước khi duyệt). */
export default function ListeningPanel({ listening, busy, canConfirm, onConfirm, onRegenerate }: {
  listening: ListeningReviewDto; busy: boolean; canConfirm: boolean; onConfirm: () => void; onRegenerate: (type: string) => void;
}) {
  // Loại có vấn đề (lỗi thời, thiếu, sai luật): backend chỉ cho xác nhận sau khi sinh lại từng loại này.
  const badTypes = [...new Set(listening.issues.map((x) => x.type).filter((t): t is string => !!t))];
  // Mỗi tuổi là một bộ độc lập: nhóm theo tuổi để người duyệt không thấy các bộ lẫn vào nhau.
  const groups: { targetAge: number | null; items: ListeningInteractionDto[] }[] = listening.ageSets?.length
    ? listening.ageSets : [{ targetAge: null, items: listening.items }];
  return (
    <article className="sheet">
      <div className="row">
        <h3 className="display grow" style={{ margin: 0 }}>Tương tác khi nghe</h3>
        {listening.reviewed
          ? <span className="pill ai"><Check className="ic" />Đã xác nhận</span>
          : <button className="btn btn-ok" disabled={busy || !canConfirm || listening.issues.length > 0} onClick={onConfirm}>
              <Headphones className="ic" />Xác nhận tương tác khi nghe
            </button>}
      </div>
      {listening.issues.length > 0 && (
        <div className="notice err" role="status">
          <CircleAlert className="ic" /> Chưa thể xác nhận: nội dung truyện đã đổi hoặc tương tác chưa đạt luật. Hãy sinh lại các loại bên dưới rồi xác nhận.
          <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
            {badTypes.map((t) => (
              <button key={t} className="btn btn-s" disabled={busy} onClick={() => onRegenerate(t)}>
                <WandSparkles className="ic" />Sinh lại: {TYPE_LABEL[t] ?? t}
              </button>
            ))}
          </div>
        </div>
      )}
      {listening.shortfallReason && (
        <div className="notice" role="status">
          <CircleAlert className="ic" /> Bộ tương tác chưa đủ 5. {listening.shortfallReason}
        </div>
      )}
      {listening.items.length === 0
        ? <p className="sub">Chưa có tương tác nào.</p>
        : groups.map((g) => (
          <section key={g.targetAge ?? "all"}>
            {g.targetAge != null && <h4 className="display" style={{ margin: "12px 0 6px" }}>Tuổi {g.targetAge} · {g.items.length} tương tác</h4>}
            <ol className="art-list quiz-list">{g.items.map((it) => <Interaction key={it.id} item={it} />)}</ol>
          </section>
        ))}
    </article>
  );
}
