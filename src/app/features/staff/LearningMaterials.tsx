type Quiz = { question: string; correctAnswer?: string | null; choices?: string | string[] | null };
type Props = {
  vocabulary: { term: string; definition: string }[];
  quizzes: Quiz[];
};

/** Lựa chọn của câu đố có thể là mảng hoặc chuỗi JSON; không đọc được thì bỏ qua. */
function choiceList(choices: Quiz['choices']): string[] {
  if (!choices) return [];
  if (Array.isArray(choices)) return choices;
  try { const v = JSON.parse(choices); if (Array.isArray(v)) return v.map(String); } catch { /* chuỗi thường */ }
  return choices.split('|').map(x => x.trim()).filter(Boolean);
}

/** Học liệu của truyện, luôn đủ hai mục có tiêu đề (từ vựng, câu đố); mục trống ghi rõ "Chưa có". */
export default function LearningMaterials({ vocabulary, quizzes }: Props) {
  return <div className="st-learn">
    <section><b className="st-learn-title">Từ vựng ({vocabulary.length})</b>
      {vocabulary.length ? <div className="st-learn-vocab">{vocabulary.map((v, i) => <div className="st-learn-vitem" key={i}><b>{v.term}</b><span>{v.definition}</span></div>)}</div> : <p className="sub">Chưa có từ vựng.</p>}
    </section>
    <section><b className="st-learn-title">Câu đố ({quizzes.length})</b>
      {quizzes.length ? quizzes.map((q, i) => { const choices = choiceList(q.choices); return <div className="st-learn-item" key={i}>
        <p><b>{i + 1}. {q.question}</b></p>
        {choices.length > 0 && <ul>{choices.map((c, j) => <li key={j} className={c === q.correctAnswer ? 'ok' : ''}>{c}</li>)}</ul>}
        {q.correctAnswer && <small>Đáp án đúng: <b>{q.correctAnswer}</b></small>}
      </div>; }) : <p className="sub">Chưa có câu đố.</p>}
    </section>
  </div>;
}
