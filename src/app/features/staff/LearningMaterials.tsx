type Quiz = { question: string; correctAnswer?: string | null; choices?: string | string[] | null };
type Props = {
  vocabulary: { term: string; definition: string }[];
  quizzes: Quiz[];
  discussionQuestions: { question: string; isMoralLesson?: boolean }[];
};

/** Lựa chọn của câu đố có thể là mảng hoặc chuỗi JSON; không đọc được thì bỏ qua. */
function choiceList(choices: Quiz['choices']): string[] {
  if (!choices) return [];
  if (Array.isArray(choices)) return choices;
  try { const v = JSON.parse(choices); if (Array.isArray(v)) return v.map(String); } catch { /* chuỗi thường */ }
  return choices.split('|').map(x => x.trim()).filter(Boolean);
}

/** Học liệu của truyện, luôn đủ ba mục có tiêu đề (từ vựng, câu đố, câu hỏi thảo luận); mục trống ghi rõ "Chưa có". */
export default function LearningMaterials({ vocabulary, quizzes, discussionQuestions }: Props) {
  return <div className="st-learn">
    <section><b className="st-learn-title">Từ vựng ({vocabulary.length})</b>
      {vocabulary.length ? vocabulary.map((v, i) => <p key={i}><b>{v.term}</b> — {v.definition}</p>) : <p className="sub">Chưa có từ vựng.</p>}
    </section>
    <section><b className="st-learn-title">Câu đố ({quizzes.length})</b>
      {quizzes.length ? quizzes.map((q, i) => { const choices = choiceList(q.choices); return <div className="st-learn-item" key={i}>
        <p><b>{i + 1}. {q.question}</b></p>
        {choices.length > 0 && <ul>{choices.map((c, j) => <li key={j} className={c === q.correctAnswer ? 'ok' : ''}>{c}</li>)}</ul>}
        {q.correctAnswer && <small>Đáp án đúng: <b>{q.correctAnswer}</b></small>}
      </div>; }) : <p className="sub">Chưa có câu đố.</p>}
    </section>
    <section><b className="st-learn-title">Câu hỏi thảo luận ({discussionQuestions.length})</b>
      {discussionQuestions.length ? discussionQuestions.map((d, i) => <p key={i}>{i + 1}. {d.question}{d.isMoralLesson && <span className="st-learn-tag">Bài học đạo đức</span>}</p>) : <p className="sub">Chưa có câu hỏi thảo luận.</p>}
    </section>
  </div>;
}
