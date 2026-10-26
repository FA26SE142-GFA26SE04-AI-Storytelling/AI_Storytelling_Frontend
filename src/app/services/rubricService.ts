import type * as B from '@/app/types/backendContracts';
import { apiRequest, apiQuery } from './apiClient';
export interface RubricPage<T> { items: T[]; totalCount: number; pageIndex: number; pageSize: number }
export interface RubricAudit { id: number; actorUserId: number; action: string; createdAt: string; beforeJson: string | null; afterJson: string | null }
export interface RubricEvaluation { rubricId: number; version: string; contentHash: string; revision: number; provider: string; model: string; riskScore: number; scores: B.GrayZoneCriterionScore[]; findings: B.GrayZoneFinding[] }
const root = '/moderation/rubrics';
const send = <T>(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: unknown, signal?: AbortSignal) => apiRequest<T>(root + path, 'Không thực hiện được thao tác bộ tiêu chí.', { method, body, signal });
export const rubricService = {
  list: (status?: string, pageIndex = 1, signal?: AbortSignal) => send<RubricPage<B.RubricDto>>(apiQuery({ status, pageIndex, pageSize: 20 }), 'GET', undefined, signal),
  get: (id: number, signal?: AbortSignal) => send<B.RubricDto>(`/${id}`, 'GET', undefined, signal),
  active: () => send<B.RubricSnapshot>('/active'),
  create: (body: B.RubricWriteRequest) => send<B.RubricDto>('', 'POST', body),
  update: (id: number, body: B.RubricWriteRequest) => send<B.RubricDto>(`/${id}`, 'PUT', body),
  clone: (id: number, body: B.RubricCloneRequest) => send<B.RubricDto>(`/${id}/clone`, 'POST', body),
  remove: (id: number, revision: number) => send<boolean>(`/${id}${apiQuery({ revision })}`, 'DELETE'),
  validate: (id: number, revision: number) => send<{ valid: boolean; id: number; revision: number; contentHash: string; schemaVersion: string }>(`/${id}/validate`, 'POST', { revision }),
  evaluate: (id: number, body: B.RubricEvaluationRequest) => send<RubricEvaluation>(`/${id}/evaluations`, 'POST', body),
  activate: (id: number, revision: number) => send<B.RubricDto>(`/${id}/activate`, 'POST', { revision }),
  audit: (id: number, pageIndex = 1) => send<RubricPage<RubricAudit>>(`/${id}/audit-logs${apiQuery({ pageIndex, pageSize: 20 })}`),
};
