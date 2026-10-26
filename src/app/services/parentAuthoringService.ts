import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';
export interface ParentMediaGenerateRequest extends B.CreatorVersionCommand { contentConfirmationId: number }
export interface ParentMediaGeneration { storyId:number; storyVersionId:number; jobId:number; packageRevision:number; progressUrl:string; packageUrl:string }
export const parentAuthoringService = {
  create: (body: B.CreateParentDraftRequest, signal?: AbortSignal) => apiRequest<B.ParentDraftDto>(`/parent/stories/manual`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
  mine: (pageIndex: number = 1, pageSize: number = 20, signal?: AbortSignal) => apiRequest<B.PagedResult<B.CreatorDraftDto>>(`/parent/stories${apiQuery({ pageIndex, pageSize })}`, 'Không thực hiện được thao tác.', { method: 'GET', signal }),
  get: (storyId: number, signal?: AbortSignal) => apiRequest<B.ParentDraftDto>(`/parent/stories/${storyId}`, 'Không thực hiện được thao tác.', { method: 'GET', signal }),
  workflow: (storyId: number, signal?: AbortSignal) => apiRequest<B.ParentOperationDto[]>(`/parent/stories/${storyId}/workflow`, 'Không thực hiện được thao tác.', { method: 'GET', signal }),
  setup: (storyId: number, body: B.ParentSetupRequest, signal?: AbortSignal) => apiRequest<B.ParentDraftDto>(`/parent/stories/${storyId}/setup`, 'Không thực hiện được thao tác.', { method: 'PATCH', signal, body }),
  save: (storyId: number, body: B.SaveCreatorContentRequest, signal?: AbortSignal) => apiRequest<B.CreatorContentSavedDto>(`/parent/stories/${storyId}/manual/versions`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
  versions: (storyId: number, signal?: AbortSignal) => apiRequest<B.CreatorVersionDto[]>(`/parent/stories/${storyId}/content/versions`, 'Không thực hiện được thao tác.', { method: 'GET', signal }),
  version: (storyId: number, versionId: number, signal?: AbortSignal) => apiRequest<B.CreatorVersionDto>(`/parent/stories/${storyId}/content/versions/${versionId}`, 'Không thực hiện được thao tác.', { method: 'GET', signal }),
  restore: (storyId: number, body: B.RestoreCreatorVersionRequest, signal?: AbortSignal) => apiRequest<B.CreatorContentSavedDto>(`/parent/stories/${storyId}/content/restore`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
  previewImport: (storyId: number, body: B.PreviewCreatorImportRequest, signal?: AbortSignal) => apiRequest<B.CreatorImportPreviewDto>(`/parent/stories/${storyId}/imports/preview`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
  previewFile: (storyId: number, body: FormData, signal?: AbortSignal) => apiRequest<B.CreatorImportPreviewDto>(`/parent/stories/${storyId}/imports/preview-file`, 'Không thực hiện được thao tác.', { method: 'POST', signal, form: body }),
  confirmImport: (storyId: number, body: B.ConfirmCreatorImportRequest, signal?: AbortSignal) => apiRequest<B.CreatorContentSavedDto>(`/parent/stories/${storyId}/imports/confirm`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
  check: (storyId: number, body: B.ParentCheckRequest, signal?: AbortSignal) => apiRequest<B.ParentCheckDto>(`/parent/stories/${storyId}/content/checks`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
  confirmContent: (storyId: number, body: B.ParentContentConfirmRequest, signal?: AbortSignal) => apiRequest<B.ParentContentConfirmationDto>(`/parent/stories/${storyId}/content/confirm`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
  prepare: (storyId: number, body: B.ParentPrepareRequest, signal?: AbortSignal) => apiRequest<B.ParentPreparationDto>(`/parent/stories/${storyId}/preparations`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
  generateMedia: (storyId: number, body: ParentMediaGenerateRequest, signal?: AbortSignal) => apiRequest<ParentMediaGeneration>(`/parent/stories/${storyId}/manual/media/generate`, 'Không tạo được media cho truyện gia đình.', { method:'POST', body, signal }),
  preview: (storyId: number, preparationId: number, signal?: AbortSignal) => apiRequest<B.ParentPreparationDto>(`/parent/stories/${storyId}/preparations/${preparationId}`, 'Không thực hiện được thao tác.', { method: 'GET', signal }),
  confirmFamily: (storyId: number, body: B.ParentFamilyConfirmRequest, signal?: AbortSignal) => apiRequest<B.ParentFamilyConfirmationDto>(`/parent/stories/${storyId}/family-confirmations`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
  revokeFamily: (storyId: number, body: B.ParentFamilyRevokeRequest, signal?: AbortSignal) => apiRequest<boolean>(`/parent/stories/${storyId}/family-confirmations/revoke`, 'Không thực hiện được thao tác.', { method: 'POST', signal, body }),
};
