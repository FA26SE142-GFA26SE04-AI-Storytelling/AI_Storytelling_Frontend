import { apiRequest } from './apiClient';
import type * as D from '@/app/types/childReading';
const message = 'Không thực hiện được thao tác đọc truyện.';
export const childReadingService = {
  stories: (token:string, query:{search?:string; source?:string; pageIndex:number}, signal?:AbortSignal) => apiRequest<D.ChildStoryPage>(`/child/reading/stories?${new URLSearchParams({search:query.search ?? '',source:query.source ?? '',pageIndex:String(query.pageIndex),pageSize:'20'})}`,message,{token,session:'child',signal}),
  start: (token:string, body:D.ReadingStart, signal?:AbortSignal) => apiRequest<D.ReadingStarted>('/child/reading/sessions',message,{method:'POST',body,token,session:'child',signal}),
  content: (token:string, id:number, signal?:AbortSignal) => apiRequest<D.ReadingContent>(`/child/reading/sessions/${id}/content`,message,{token,session:'child',signal}),
  progress: (token:string, id:number, body:{page:number; readingMode:D.ReadingMode; addedSeconds:number}) => apiRequest<D.ReadingProgress>(`/child/reading/sessions/${id}/progress`,message,{method:'PUT',body,token,session:'child'}),
  complete: (token:string, id:number) => apiRequest<D.ReadingCompleted>(`/child/reading/sessions/${id}/complete`,message,{method:'POST',token,session:'child'}),
  bookmark: (token:string, id:number, value:boolean) => apiRequest<D.ReadingFlags>(`/child/reading/sessions/${id}/bookmark`,message,{method:'PUT',body:{value},token,session:'child'}),
  favorite: (token:string, id:number, value:boolean) => apiRequest<D.ReadingFlags>(`/child/reading/sessions/${id}/favorite`,message,{method:'PUT',body:{value},token,session:'child'}),
  signal: (token:string, id:number, signal?:AbortSignal) => apiRequest<D.ReadingSignal>(`/child/reading/sessions/${id}/signal`,message,{token,session:'child',signal}),
  event: (token:string, id:number, eventType:D.ReadingEvent, payload?:string) => apiRequest<null>(`/child/reading/sessions/${id}/events`,message,{method:'POST',body:{eventType,payload},token,session:'child'}),
  definition: (token:string, id:number, vocabularyId:number) => apiRequest<D.VocabularyDefinition>(`/child/reading/sessions/${id}/vocabulary/${vocabularyId}`,message,{token,session:'child'}),
};
export const childNotebookService = {
  list: (token:string, signal?:AbortSignal) => apiRequest<D.NotebookEntry[]>('/child/notebook','Không tải được sổ tay.',{token,session:'child',signal}),
  collect: (token:string, id:number, vocabularyId:number) => apiRequest<D.NotebookEntry>(`/child/notebook/sessions/${id}/words`,'Không lưu được từ.',{method:'POST',body:{vocabularyId},token,session:'child'}),
  remove: (token:string, id:number) => apiRequest<null>(`/child/notebook/${id}`,'Không xóa được từ.',{method:'DELETE',token,session:'child'}),
};
