'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Bookmark,Check,Sparkles} from 'lucide-react';
import type {VocabularyDefinition} from '@/app/types/childReading';

const POP_WIDTH=300;

/**
 * Một từ mới trong chữ truyện: gạch chân chấm vàng; rê chuột, chạm hoặc Tab tới thì hiện ô giải thích kèm nút Lưu vào sổ tay.
 * Ô nổi vẽ ra body (khung chữ có thanh cuộn sẽ cắt mất), cuộn trang thì đóng lại.
 */
export default function KidVocabWord({id,children,definition,busy,disabled,onLookup,onSave}:{
  id:number; children:ReactNode; definition:VocabularyDefinition|null; busy:boolean; disabled:boolean;
  onLookup:(id:number)=>void; onSave:()=>void;
}) {
  const ref=useRef<HTMLButtonElement>(null);
  const saveRef=useRef<HTMLButtonElement>(null);
  const hideTimer=useRef<number|undefined>(undefined);
  // Mở bằng bàn phím (Enter/Space) thì chuyển focus vào nút Lưu khi có nghĩa: ô nổi nằm cuối trang nên Tab không tới được.
  const [keyboard,setKeyboard]=useState(false);
  const [pos,setPos]=useState<{left:number;top?:number;bottom?:number}|null>(null);
  const def=definition?.vocabularyId===id?definition:null;

  /** Vị trí ô nổi theo từ; từ đã ra khỏi màn hình thì null (đóng). Đủ chỗ phía dưới thì hiện dưới từ, không thì phía trên. */
  const place=()=>{
    const r=ref.current?.getBoundingClientRect();
    if(!r||r.bottom<0||r.top>window.innerHeight)return null;
    const left=Math.min(Math.max(8,r.left+r.width/2-POP_WIDTH/2),window.innerWidth-POP_WIDTH-8);
    return window.innerHeight-r.bottom>200?{left,top:r.bottom+8}:{left,bottom:window.innerHeight-r.top+8};
  };
  const open=!!pos;
  const show=()=>{
    window.clearTimeout(hideTimer.current);
    if(open)return;
    setPos(place());
    if(!def&&!disabled)onLookup(id);
  };
  const hide=()=>{window.clearTimeout(hideTimer.current);hideTimer.current=window.setTimeout(()=>setPos(null),180);};

  useEffect(()=>{
    if(!open)return;
    // Khung chữ tự cuộn theo giọng kể: ô nổi đi theo từ thay vì đóng.
    const follow=()=>setPos(place());
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setPos(null);};
    window.addEventListener('scroll',follow,true); window.addEventListener('resize',follow); window.addEventListener('keydown',onKey);
    return()=>{window.removeEventListener('scroll',follow,true);window.removeEventListener('resize',follow);window.removeEventListener('keydown',onKey);};
  },[open]);
  useEffect(()=>()=>window.clearTimeout(hideTimer.current),[]);
  useEffect(()=>{if(keyboard&&pos&&def){saveRef.current?.focus();setKeyboard(false);}},[keyboard,pos,def]);

  const pop=pos&&(
    <span role="tooltip" id={`kid-vocab-${id}`} className="kid-vocab-pop" style={{...pos,width:POP_WIDTH}} onMouseEnter={show} onMouseLeave={hide}
      onMouseDown={(e)=>e.preventDefault()/* bấm Lưu không làm từ mất focus nên ô không tự đóng */}>
      <b className="kid-vocab-term"><Sparkles aria-hidden="true"/>{def?.term??children}</b>
      <span className="kid-vocab-def">{def?def.definition:busy?'Đang tìm nghĩa…':'Chưa tìm được nghĩa của từ này.'}</span>
      {def&&<button ref={saveRef} type="button" className="kid-btn3d is-gold kid-vocab-save" disabled={busy||disabled||def.isCollected} onClick={onSave} onBlur={hide}>
        {def.isCollected?<Check aria-hidden="true"/>:<Bookmark aria-hidden="true"/>}{def.isCollected?'Đã lưu':'Lưu'}
      </button>}
    </span>
  );

  return <>
    <button ref={ref} type="button" className="kid-vocab" aria-describedby={pos?`kid-vocab-${id}`:undefined} aria-expanded={!!pos}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show} onClick={(e)=>{show();if(e.detail===0)setKeyboard(true);}}
      onBlur={(e)=>{if(!(e.relatedTarget instanceof Node&&document.getElementById(`kid-vocab-${id}`)?.contains(e.relatedTarget)))hide();}}>
      {children}
    </button>
    {pop&&createPortal(pop,document.body)}
  </>;
}
