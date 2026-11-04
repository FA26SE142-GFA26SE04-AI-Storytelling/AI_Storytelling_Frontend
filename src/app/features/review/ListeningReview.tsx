import type { ListeningReviewDto } from '@/app/types/aiStory';

const NAMES: Record<string, string> = {
  Checkpoint: 'Câu hỏi trong truyện', RolePlay: 'Đóng vai', FillBlank: 'Điền từ',
  PicturePrediction: 'Dự đoán qua tranh', EventOrdering: 'Sắp xếp sự kiện',
};

export default function ListeningReview({ data }: { data: ListeningReviewDto }) {
  if (!data.required) return <p className="sub">Truyện này không yêu cầu tương tác lúc nghe.</p>;
  return <>
    <h3 className="display">Tương tác lúc nghe ({data.items.length})</h3>
    <p className="sub">Xem câu hỏi, phương án và phản hồi dành cho bé. Khi xác nhận gói nội dung, bạn xác nhận cả các tương tác này.</p>
    {data.issues.length > 0 && <div className="notice err" role="alert">Tương tác cần được kiểm tra hoặc tạo lại: {data.issues.map(issue => issue.code).join(' · ')}</div>}
    <div className="art-list">{data.items.map((item, index) => <section className="sec" key={item.id}>
      <div className="row"><b>{index + 1}. {NAMES[item.type] ?? item.type}</b><span className="pill draft">Đoạn {item.anchorBlockId}</span>{item.isStale && <span className="pill wait">Nội dung đã thay đổi</span>}</div>
      {item.prompt && <p>{item.prompt}</p>}
      {item.sourceQuote && <blockquote>{item.sourceQuote}</blockquote>}
      {item.characterName && <p>Nhân vật: {item.characterName}</p>}
      {item.hiddenWord && <p>Từ cần điền: <b>{item.hiddenWord}</b></p>}
      {item.hint && <p>Gợi ý: {item.hint}</p>}
      {item.options.length > 0 && <ol>{[...item.options].sort((a, b) => a.sortOrder - b.sortOrder).map(option => <li key={option.id}>
        <b>{option.text}</b>{option.isMatch && <span className="pill draft">Phương án phù hợp</span>}
        {option.correctOrder !== null && <span className="pill draft">Thứ tự {option.correctOrder}</span>}
        {option.sourceQuote && <blockquote>{option.sourceQuote}</blockquote>}
        {option.imageDescription && <p className="sub">Mô tả tranh: {option.imageDescription}</p>}
        {option.feedback && <p className="sub">Phản hồi: {option.feedback}</p>}
      </li>)}</ol>}
      {item.matchFeedback && <p>Phản hồi khi phù hợp: {item.matchFeedback}</p>}
      {item.noMatchFeedback && <p>Gợi mở: {item.noMatchFeedback}</p>}
      {item.waitFeedback && <p>Trong lúc chờ: {item.waitFeedback}</p>}
      {item.revealBlockId && <p className="sub">Phản hồi kết quả sau đoạn {item.revealBlockId}.</p>}
      {item.explanation && <p className="sub">Giải thích dành cho người duyệt: {item.explanation}</p>}
    </section>)}</div>
  </>;
}
