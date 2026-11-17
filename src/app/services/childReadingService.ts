import { apiRequest } from './apiClient';
import type * as D from '@/app/types/childReading';
const message = 'Không thực hiện được thao tác đọc truyện.';
export const childReadingService = {
  stories: (token:string, query:{search?:string; source?:string; pageIndex:number}, signal?:AbortSignal) => apiRequest<D.ChildStoryPage>(`/child/reading/stories?${new URLSearchParams({search:query.search ?? '',source:query.source ?? '',pageIndex:String(query.pageIndex),pageSize:'20'})}`,message,{token,session:'child',signal}),
  start: (token:string, body:D.ReadingStart, signal?:AbortSignal) => apiRequest<D.ReadingStarted>('/child/reading/sessions',message,{method:'POST',body,token,session:'child',signal}),
  /** Backend ký sẵn mọi link media trong nội dung (link https có hạn), Frontend dùng thẳng. */
  content: async (token:string, id:number, signal?:AbortSignal) => { const r=await apiRequest<D.ReadingContent>(`/child/reading/sessions/${id}/content`,message,{token,session:'child',signal}); return r; },
  progress: (token:string, id:number, body:{page:number; readingMode:D.ReadingMode; addedSeconds:number}) => apiRequest<D.ReadingProgress>(`/child/reading/sessions/${id}/progress`,message,{method:'PUT',body,token,session:'child'}),
  complete: (token:string, id:number) => apiRequest<D.ReadingCompleted>(`/child/reading/sessions/${id}/complete`,message,{method:'POST',token,session:'child'}),
  bookmark: (token:string, id:number, value:boolean) => apiRequest<D.ReadingFlags>(`/child/reading/sessions/${id}/bookmark`,message,{method:'PUT',body:{value},token,session:'child'}),
  favorite: (token:string, id:number, value:boolean) => apiRequest<D.ReadingFlags>(`/child/reading/sessions/${id}/favorite`,message,{method:'PUT',body:{value},token,session:'child'}),
  signal: (token:string, id:number, signal?:AbortSignal) => apiRequest<D.ReadingSignal>(`/child/reading/sessions/${id}/signal`,message,{token,session:'child',signal}),
  event: (token:string, id:number, eventType:D.ReadingEvent, payload?:string) => apiRequest<null>(`/child/reading/sessions/${id}/events`,message,{method:'POST',body:{eventType,payload},token,session:'child'}),
  definition: (token:string, id:number, vocabularyId:number) => apiRequest<D.VocabularyDefinition>(`/child/reading/sessions/${id}/vocabulary/${vocabularyId}`,message,{token,session:'child'}),
  /** Bật/tắt "chỉ nghe truyện": bật thì app không dừng lại để hỏi tương tác. */
  listenOnly: (token:string, id:number, value:boolean) => apiRequest<D.ReadingFlags>(`/child/reading/sessions/${id}/listen-only`,message,{method:'PUT',body:{value},token,session:'child'}),
  /** Gửi câu trả lời cho một tương tác khi nghe. Backend không báo "sai", không cộng EXP. */
  attempt: (token:string, id:number, interactionId:number, body:D.ListeningAttemptRequest) => apiRequest<D.ListeningAttemptResult>(`/child/reading/sessions/${id}/interactions/${interactionId}/attempts`,'Chưa gửi được câu trả lời của em.',{method:'POST',body,token,session:'child'}),
  /** Ghi âm tóm tắt gửi bố mẹ (tối đa 3 MB, mỗi phiên một bản). */
  summaryRecording: (token:string, id:number, audio:Blob) => { const form=new FormData(); form.append('audio',audio,audio.type==='audio/wav'?'summary.wav':'summary'); return apiRequest<D.StorySummarySent>(`/child/reading/sessions/${id}/summary/recording`,'Chưa gửi được bản ghi âm.',{method:'POST',form,token,session:'child'}); },
  /** Bé đọc to một đoạn truyện để nhận dạng và chấm điểm từng chữ (F-13). */
  readAloud: (token:string, sessionId:number, segmentId:number, audio:Blob) => { const form=new FormData(); form.append('Audio',audio,audio.type==='audio/wav'?'read-aloud.wav':'read-aloud'); return apiRequest<D.ReadAloudResult>(`/child/reading/sessions/${sessionId}/segments/${segmentId}/read-aloud`,'Chưa chấm được giọng đọc của em.',{method:'POST',form,token,session:'child'}); },
  /** Hỏi bố mẹ về một tranh (beatOrder) của cảnh; cảnh không có tranh riêng thì beatOrder = null. Chữ/ghi âm không bắt buộc, tối đa 5 câu mỗi phiên. */
  summaryQuestion: (token:string, id:number, q:{sceneId:number; beatOrder:number|null; text?:string; audio?:Blob|null}) => { const form=new FormData(); form.append('SceneId',String(q.sceneId)); if(q.beatOrder!=null)form.append('BeatOrder',String(q.beatOrder)); if(q.text?.trim())form.append('Text',q.text.trim()); if(q.audio)form.append('Audio',q.audio,q.audio.type==='audio/wav'?'question.wav':'question'); return apiRequest<D.StorySummaryQuestionSent>(`/child/reading/sessions/${id}/summary/questions`,'Chưa gửi được câu hỏi của em.',{method:'POST',form,token,session:'child'}); },
  /** Chỉ sau khi phiên đọc đã hoàn thành. */
  feeling: (token:string, id:number, feeling:D.ReadingFeeling) => apiRequest<D.ReadingFeelingResult>(`/child/reading/sessions/${id}/feeling`,'Chưa lưu được cảm nhận của em.',{method:'PUT',body:{feeling},token,session:'child'}),
};
/** Quiz sau khi đọc; chỉ mở được khi phiên đọc đã hoàn thành. Bỏ qua câu = không gửi câu đó. */
export const childQuizService = {
  get: (token:string, sessionId:number, signal?:AbortSignal) => apiRequest<D.ChildQuiz>(`/child/quiz/sessions/${sessionId}`,'Chưa mở được câu đố.',{token,session:'child',signal}),
  answer: (token:string, sessionId:number, quizItemId:number, answer:string) => apiRequest<D.QuizAnswerResult>(`/child/quiz/sessions/${sessionId}/answers`,'Chưa gửi được câu trả lời.',{method:'POST',body:{quizItemId,answer},token,session:'child'}),
  result: (token:string, sessionId:number, signal?:AbortSignal) => apiRequest<D.ChildQuizResult>(`/child/quiz/sessions/${sessionId}/result`,'Chưa xem được kết quả.',{token,session:'child',signal}),
};
export const childRewardsService = {
  get: (token:string, signal?:AbortSignal) => apiRequest<D.ChildRewards>('/child/rewards','Chưa tải được phần thưởng.',{token,session:'child',signal}),
  /** Dùng hết EXP chưa tưới để nuôi cây tri thức. */
  water: (token:string) => apiRequest<D.WaterTreeResult>('/child/rewards/knowledge-tree/water','Chưa tưới được cây.',{method:'POST',token,session:'child'}),
};
/** Phụ huynh xem truyện con đã đọc xong, cảm nhận và điểm quiz tốt nhất. */
export const parentReadingFeedbackService = {
  list: (childProfileId:number, pageIndex=1, pageSize=20, query:{status?:'Completed'|'Unfinished'; from?:string|null; to?:string|null}={}, signal?:AbortSignal) => { const p=new URLSearchParams({pageIndex:String(pageIndex),pageSize:String(pageSize)}); if(query.status!=null)p.set('status',query.status); if(query.from!=null)p.set('from',query.from); if(query.to!=null)p.set('to',query.to); return apiRequest<D.PagedReadingFeedback>(`/ParentReadingFeedback/${childProfileId}?${p}`,'Không tải được truyện bé đã đọc.',{signal}); },
  quiz: (childId:number, sessionId:number, signal?:AbortSignal) => apiRequest<D.ParentQuizDetail>(`/ParentReadingFeedback/${childId}/sessions/${sessionId}/quiz`,'Không tải được chi tiết câu đố.',{signal}),
  overview: (childId:number, from:string|null, to:string|null, signal?:AbortSignal) => { const p=new URLSearchParams(); if(from!=null)p.set('from',from); if(to!=null)p.set('to',to); const qs=p.toString(); return apiRequest<D.ParentReadingOverview>(`/ParentReadingFeedback/${childId}/overview${qs?`?${qs}`:''}`,'Không tải được tổng quan việc đọc.',{signal}); },
};
export const childNotebookService = {
  list: (token:string, signal?:AbortSignal) => apiRequest<D.NotebookEntry[]>('/child/notebook','Không tải được sổ tay.',{token,session:'child',signal}),
  collect: (token:string, id:number, vocabularyId:number) => apiRequest<D.NotebookEntry>(`/child/notebook/sessions/${id}/words`,'Không lưu được từ.',{method:'POST',body:{vocabularyId},token,session:'child'}),
  remove: (token:string, id:number) => apiRequest<null>(`/child/notebook/${id}`,'Không xóa được từ.',{method:'DELETE',token,session:'child'}),
};

/** Phụ huynh nghe lại bản ghi âm tóm tắt và xem những chỗ con còn thắc mắc. */
export const parentStorySummaryService = {
  list: (childProfileId:number, pageIndex=1, pageSize=20, signal?:AbortSignal) => apiRequest<D.PagedParentSummaries>(`/ParentStorySummary/${childProfileId}?pageIndex=${pageIndex}&pageSize=${pageSize}`,'Không tải được phần con kể lại.',{signal}),
  /** Đánh dấu / bỏ đánh dấu đã trả lời một câu con hỏi. */
  answered: (childProfileId:number, summaryId:number, questionId:number, answered:boolean) => apiRequest<D.StorySummaryAnswered>(`/ParentStorySummary/${childProfileId}/${summaryId}/questions/${questionId}/answered`,'Không cập nhật được câu hỏi.',{method:'PUT',body:{answered}}),
  remove: (childProfileId:number, summaryId:number) => apiRequest<null>(`/ParentStorySummary/${childProfileId}/${summaryId}`,'Không xoá được bản tóm tắt.',{method:'DELETE'}),
};
