import type * as B from '@/app/types/backendContracts';
import { apiRequest } from './apiClient';
export const childManualService = {
  library: (token: string, signal?: AbortSignal) => apiRequest<B.ParentFamilyConfirmationDto[]>('/child/manual-stories', 'Không tải được thư viện gia đình.', { token, session: 'child', signal }),
  package: (token: string, confirmationId: number, signal?: AbortSignal) => apiRequest<B.ParentPreparationDto>(`/child/manual-stories/${confirmationId}/package`, 'Truyện không còn được cấp quyền đọc.', { token, session: 'child', signal }),
};
