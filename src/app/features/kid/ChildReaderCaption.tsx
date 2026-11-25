'use client';
import {Fragment,useEffect,useRef,type ReactNode} from 'react';
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

export type VocabRange = {start:number; end:number; id:number};
const isLetter = (ch:string|undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);

/**
 * Vị trí các từ mới trong chữ của cảnh: không phân biệt hoa thường, chỉ khớp nguyên từ, ưu tiên từ dài, không chồng nhau.
 * API chỉ trả chữ của từ (term) nên phải tự dò trong văn bản, giống bản Mobile.
 */
export function vocabRanges(text:string, vocabulary:{id:number; term:string}[]): VocabRange[] {
  const lower=text.toLowerCase(), taken=new Array<boolean>(text.length).fill(false), out:VocabRange[]=[];
  const list=vocabulary.map(v=>({id:v.id,term:v.term.trim().toLowerCase()})).filter(v=>v.term).sort((a,b)=>b.term.length-a.term.length);
  for(const v of list){
    for(let at=lower.indexOf(v.term);at>=0;at=lower.indexOf(v.term,at+1)){
      const end=at+v.term.length;
      if(isLetter(text[at-1])||isLetter(text[end])||taken.slice(at,end).some(Boolean))continue;
      taken.fill(true,at,end); out.push({start:at,end,id:v.id});
    }
  }
  return out.sort((a,b)=>a.start-b.start);
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
 * reading: chữ giọng kể đang đọc (vị trí trong chữ của cảnh), được tô sáng theo lời kể.
 */
export function Caption({text,part,result,segment,segmentStart,reading,vocab=[],renderVocab}:{text:string;part:{start:number;end:number}|null;result:ReadAloudResult|null;segment:ReadingSegment|null;segmentStart:number;reading?:{start:number;end:number}|null;
  /** Từ mới cần đánh dấu và cách vẽ từng từ (ô giải thích khi rê chuột / chạm). */
  vocab?:VocabRange[];renderVocab?:(id:number,children:ReactNode,key:number)=>ReactNode}) {
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
  // Tô sáng chữ giọng kể đang đọc trong khoảng [a,b).
  const lit=(a:number,b:number)=>{
    const from=reading?Math.max(reading.start,a):b, to=reading?Math.min(reading.end,b):b;
    return to>from?<>{text.slice(a,from)}<span className="kid-reading-word">{text.slice(from,to)}</span>{text.slice(to,b)}</>:text.slice(a,b);
  };
  const nodes:ReactNode[]=[]; let at=ps;
  for(const v of renderVocab?vocab:[]){
    if(v.start<ps||v.end>pe)continue;
    nodes.push(<Fragment key={`t${at}`}>{lit(at,v.start)}</Fragment>,renderVocab!(v.id,lit(v.start,v.end),v.start)); at=v.end;
  }
  nodes.push(<Fragment key={`t${at}`}>{lit(at,pe)}</Fragment>);
  return <p>{nodes}</p>;
}
