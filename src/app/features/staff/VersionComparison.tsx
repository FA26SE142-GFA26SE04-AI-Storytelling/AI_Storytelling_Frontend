import type * as B from '@/app/types/backendContracts';

const AGAINST: Record<string, string> = { previous: 'bản trước', public: 'bản công khai' };
const CHANGE: Record<string, string> = { added: 'Thêm mới', removed: 'Đã bỏ', modified: 'Đã sửa' };
const KIND: Record<string, string> = { quiz: 'Câu đố', vocabulary: 'Từ vựng' };
const FIELD: Record<string, string> = {
  lesson: 'Bài học', title: 'Tiêu đề', content: 'Nội dung', outlineOpening: 'Dàn ý: mở đầu', outlineDevelopment: 'Dàn ý: diễn biến', outlineEnding: 'Dàn ý: kết thúc',
};

/** Một chỉ số của hai phiên bản: giá trị cũ → mới, tô màu khi có đổi. */
function Metric({ label, base, current }: { label: string; base: number | null; current: number | null }) {
  const changed = base !== current;
  return <div className="st-metric"><small>{label}</small><b>{base ?? '—'}<span aria-hidden> → </span><span className={changed ? 'st-metric-new' : ''}>{current ?? '—'}</span></b></div>;
}

/** Kết quả so sánh phiên bản dạng đọc được (thay cho JSON thô): tóm tắt, chỉ số, đổi văn bản, đổi từng cảnh và học liệu. */
export default function VersionComparison({ data }: { data: B.PublicVersionComparisonDto }) {
  return <div className="st-compare">
    <p className="st-compare-head"><b>Bản {data.currentVersionNo}</b> so với <b>{AGAINST[data.against] ?? data.against} (bản {data.baseVersionNo})</b></p>
    {data.isIdentical && <p className="notice">Hai phiên bản giống hệt nhau.</p>}
    {!data.isIdentical && <>
      <div className="st-metrics">
        <Metric label="Số từ" base={data.baseMetrics.wordCount} current={data.currentMetrics.wordCount} />
        <Metric label="Số câu" base={data.baseMetrics.sentenceCount} current={data.currentMetrics.sentenceCount} />
        <Metric label="Độ dài câu TB" base={data.baseMetrics.averageSentenceLength} current={data.currentMetrics.averageSentenceLength} />
        <Metric label="Độ dễ đọc (FRE)" base={data.baseMetrics.readabilityFre} current={data.currentMetrics.readabilityFre} />
      </div>
      {data.changedFields.length > 0 && <div className="st-compare-sec"><b>Trường đã thay đổi</b><div className="chips">{data.changedFields.map(f => <span className="chip" key={f}>{FIELD[f] ?? f}</span>)}</div></div>}
      {data.textDiff.length > 0 && <div className="st-compare-sec"><b>Thay đổi văn bản</b>{data.textDiff.map((d, i) => <div className="st-diff" key={i}>
        <span className={`st-diff-tag ${d.type}`}>{CHANGE[d.type] ?? d.type}</span>
        {d.before && <p className="st-diff-before">{d.before}</p>}
        {d.after && <p className="st-diff-after">{d.after}</p>}
      </div>)}</div>}
      {data.sceneChanges.length > 0 && <div className="st-compare-sec"><b>Thay đổi theo cảnh</b>{data.sceneChanges.map(s => <p key={s.sceneIndex}>Cảnh {s.sceneIndex + 1}: {CHANGE[s.change] ?? s.change}
        {[s.textChanged && 'chữ', s.imageChanged && 'tranh', s.audioChanged && 'âm thanh'].filter(Boolean).length > 0 && <> ({[s.textChanged && 'chữ', s.imageChanged && 'tranh', s.audioChanged && 'âm thanh'].filter(Boolean).join(', ')})</>}</p>)}</div>}
      {data.artifactChanges.length > 0 && <div className="st-compare-sec"><b>Thay đổi học liệu</b>{data.artifactChanges.map((a, i) => <p key={i}><span className={`st-diff-tag ${a.change}`}>{CHANGE[a.change] ?? a.change}</span> {KIND[a.kind] ?? a.kind}: {a.key}</p>)}</div>}
    </>}
  </div>;
}
