import type {EditorSnapshot,AssistanceTarget} from '@/app/types/backendContracts';
export type AssistanceSelection={snapshot:EditorSnapshot;start:number;length:number};
export function assistanceTarget(entry:string,snapshot:EditorSnapshot,selection?:AssistanceSelection|null):AssistanceTarget|null {
  if(entry==='ContinueWriting')return {kind:'cursor',start:snapshot.content.length,length:0};
  if(entry==='ReviewDraft')return snapshot.content.trim()?{kind:'wholeDraft',start:0,length:snapshot.content.length}:null;
  if(!selection||selection.snapshot.title!==snapshot.title||selection.snapshot.content!==snapshot.content)return null;
  const {start,length}=selection;
  const boundary=(at:number)=>at>=0&&at<=snapshot.content.length&&!(at>0&&at<snapshot.content.length&&/[\uD800-\uDBFF]/.test(snapshot.content[at-1])&&/[\uDC00-\uDFFF]/.test(snapshot.content[at]));
  if(!Number.isInteger(start)||!Number.isInteger(length)||length<=0||length>=snapshot.content.length||!boundary(start)||!boundary(start+length))return null;
  return {kind:'selection',start,length};
}
