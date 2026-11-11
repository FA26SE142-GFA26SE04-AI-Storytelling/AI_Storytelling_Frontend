'use client';
import {useEffect,useRef} from 'react';
import type {ReadAloudHint,ReadAloudResult,ReadAloudWord,ReadingSegment} from '@/app/types/childReading';

function wordHintTitle(hint: ReadAloudHint | null): string | undefined {
  if (hint === 'tone') return 'Sai dấu, em thử lại nhé';
  if (hint === 'unclear') return 'Chưa nghe rõ';
  if (hint === 'different') return 'Em đọc thành chữ khác';
  return undefined;
}

/** Số chữ trong đoạn, bỏ các mảnh chỉ có dấu câu (giống cách chấm tách chữ). */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

function renderWords(words: ReadAloudWord[]) {
  return words.map((w, i) => (
    <span key={w.index ?? i}>
      {i > 0 ? ' ' : ''}
      <span className={`kid-word--${w.status}`} title={wordHintTitle(w.hint)} style={{animationDelay:`${i*70}ms`}}>
        {w.text}
      </span>
    </span>
  ));
}

/**
 * Chữ của tranh đang hiện; khi có kết quả luyện đọc thì thay vùng segment tương ứng.
 */
export function Caption({text,part,result,segment,segmentStart}:{text:string;part:{start:number;end:number}|null;result:ReadAloudResult|null;segment:ReadingSegment|null;segmentStart:number}) {
  const mark=useRef<HTMLElement>(null);
  useEffect(()=>{mark.current?.scrollIntoView({block:'nearest',behavior:'smooth'});},[part?.start]);
  const ps=part?part.start:0, pe=part?part.end:text.length;
  if(result){
    // Kết quả chấm là chữ của cả đoạn đã đọc (segment): hiện phần trước và sau vùng đó trong trang, không lặp chữ.
    if(segment){
      const s=Math.min(segmentStart,text.length), e=Math.min(text.length,s+segment.text.length);
      // Đoạn chấm có thể dài hơn trang (một đoạn âm thanh cho cả cảnh): chỉ giữ các chữ nằm trong trang đang xem.
      const from=Math.max(s,ps), to=Math.min(e,pe);
      let words=result.words;
      if(to>from&&countWords(text.slice(s,e))===words.length){
        const skip=countWords(text.slice(s,from));
        words=words.slice(skip,skip+countWords(text.slice(from,to)));
      }
      return <p>{s>ps?text.slice(ps,s):null}<mark ref={mark} key={s} className="kid-pic-part">{renderWords(words)}</mark>{e<pe?text.slice(e,pe):null}</p>;
    }
    return <p>{renderWords(result.words)}</p>;
  }
  return <p>{text.slice(ps,pe)}</p>;
}
