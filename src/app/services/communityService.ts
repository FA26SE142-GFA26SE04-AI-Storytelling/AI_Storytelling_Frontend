import type * as B from '@/app/types/backendContracts';
import { apiQuery, apiRequest } from './apiClient';
const send = <T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown, signal?: AbortSignal) => apiRequest<T>(path, 'Không thực hiện được thao tác cộng đồng.', { method, body, signal });
export const communityService = {
  check: (body: B.CommunitySubmitRequestDto, signal?: AbortSignal) => send<B.CommunityEligibilityDto>('/CommunitySubmission/check', 'POST', body, signal),
  submit: (body: B.CommunitySubmitRequestDto) => send<B.CommunitySubmitResultDto>('/CommunitySubmission', 'POST', body),
  mine: (signal?: AbortSignal) => send<B.CommunitySubmissionDto[]>('/CommunitySubmission/mine', 'GET', undefined, signal),
  withdraw: (itemId: number) => send<B.CommunitySubmissionDto>(`/CommunitySubmission/${itemId}/withdraw`, 'POST'),
  remove: (itemId: number) => send<B.CommunitySubmissionDto>(`/CommunitySubmission/${itemId}/remove`, 'POST'),
  library: (token: string, pageIndex = 1, pageSize = 20, signal?: AbortSignal) => apiRequest<B.PagedResult<B.CommunityStoryDto>>(`/CommunityLibrary${apiQuery({ pageIndex, pageSize })}`, 'Không tải được thư viện cộng đồng.', { token, session: 'child', signal }),
  detail: (token: string, submissionId: number, signal?: AbortSignal) => apiRequest<B.CommunityStoryDto>(`/CommunityLibrary/${submissionId}`, 'Truyện không còn khả dụng.', { token, session: 'child', signal }),
};
