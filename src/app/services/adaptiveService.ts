import type { ApiResponse } from '@/app/types/auth';
import type { ProfileVersion, Recommendation, ReviewInput, ReviewResult } from '@/app/types/adaptive';
import { unavailable } from './unavailable';
export type Reviewer = { userId:number; name:string; hasFinalAuthority:boolean };
export const adaptiveService = {
  recommendations:(childId:number):Promise<ApiResponse<Recommendation[]>>=>unavailable('đề xuất học tập thích ứng',[childId]),
  review:(childId:number,recId:number,reviewer:Reviewer,input:ReviewInput):Promise<ApiResponse<ReviewResult>>=>unavailable('xử lý đề xuất học tập',[childId,recId,reviewer,input]),
  versions:(childId:number):Promise<ApiResponse<ProfileVersion[]>>=>unavailable('lịch sử cấu hình học tập',[childId]),
};
