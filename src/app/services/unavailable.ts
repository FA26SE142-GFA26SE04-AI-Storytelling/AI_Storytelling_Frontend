import type { ApiResponse } from '@/app/types/auth';
/** A missing backend capability must never produce fabricated records or a successful write. */
export function unavailable<T = never>(feature: string, context?: readonly unknown[]): Promise<ApiResponse<T>> {
  void context;
  return Promise.resolve({success:false,status:501,message:`Chức năng ${feature} chưa có kết nối API trong frontend.`,data:null});
}
