import type { StoryEmotion } from './childReading';

// ---------- Cảm nhận sau khi đọc, phía bé (/child/reading/sessions/{id}/reflection) ----------
/** Lời bé về cảnh: chữ tối đa 200 ký tự; ghi âm tối đa 3 MB (giống "Bé kể lại"). */
export const REFLECTION_NOTE_MAX_CHARS = 200;
export const REFLECTION_MAX_EMOTIONS = 2;
/** canRecord = false khi bố mẹ chưa bật giọng nói: ẩn micro, bé vẫn viết được. message chỉ có khi vừa gửi lời. */
export interface ChildStoryReflection { sessionId:number; emotions:StoryEmotion[]; favoriteSceneId:number|null; noteText:string|null; hasNoteRecording:boolean; canRecord:boolean; message:string|null }

// ---------- Luyện đọc to sau truyện (readAloudPractice trong nội dung truyện) ----------
/** Câu trích nguyên văn để bé đọc to; interactionId dùng khi gửi giọng đọc. */
export interface ReadAloudPractice { interactionId:number; text:string; audioUrl:string|null; praiseFeedback:string|null; praiseAudioUrl:string|null }
