import { storyService } from '@/app/services/storyService';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { ApiResponse } from '@/app/types/auth';
import { isMediaStage } from './storyGenerationFlow';
import { loadSnapshot, type StatusSnapshot } from './generationSnapshot';

/** Resume only with authorized server state; failure never means create another story. */
export async function loadResumeSnapshot(id:number, requestId:number | null, signal:AbortSignal):Promise<ApiResponse<StatusSnapshot>> {
  const [detail, progress] = await Promise.all([storyService.getStoryById(id,signal),loadSnapshot(id,signal)]);
  if (!detail.success || !detail.data || detail.data.id !== id) return {success:false,status:detail.status,data:null,message:detail.message || 'Không mở được truyện đã chọn.'};
  const story = detail.data;
  if (!/^ai$/i.test(story.source ?? '')) return {success:false,data:null,message:'Truyện này không thuộc luồng tạo truyện AI. Hãy mở trong khu soạn truyện tương ứng.'};
  if (requestId && (!progress.data || /^draft$/i.test(story.status))) {
    const input = await api.getInputProgress(id,requestId,signal);
    if (input.success && input.data?.storyId === id && input.data.inputStatus !== 'input_accepted') return {success:true,message:'',data:{story,outline:null,generation:null,input:input.data}};
  }
  if (progress.success && progress.data) return {...progress,data:{...progress.data,story}};
  if (isMediaStage(story.status)) {
    const media = await api.getMediaProgress(id,signal);
    if (media.success && media.data?.storyId === id && isMediaStage(media.data.storyStatus)) return {success:true,message:'',data:{story,outline:null,generation:null,media:media.data}};
    return {success:false,status:media.status,data:null,message:media.message || 'Chưa tải được trạng thái media của truyện.'};
  }
  return {success:false,status:progress.status,data:null,message:progress.message || 'Chưa tải được bước đang xử lý. Hãy kiểm tra lại trạng thái của truyện này.'};
}
