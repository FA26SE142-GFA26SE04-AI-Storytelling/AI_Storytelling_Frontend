'use client';
import { useEffect, useState } from 'react';
import { childProfileService } from '@/app/services/childProfileService';
import type { ContentCategory } from '@/app/types/childProfile';
import type { CreatorPublicationStatus } from '@/app/types/backendContracts';

export function creatorLabelSubmission(status: CreatorPublicationStatus | null, ready: boolean, ids: number[]) {
  const labelsOnly = status?.reviewStatus === 'ChangesRequested' && status.canResubmitLabels === true;
  const canSubmit = ready && !!status && !status.isPublished && !status.openItemId && (status.reviewStatus === 'None' || labelsOnly);
  const normalize = (values: number[]) => [...new Set(values)].sort((a, b) => a - b).join(',');
  const labelsChanged = normalize(ids) !== normalize((status?.lastProposedLabels ?? []).map(label => label.contentCategoryId));
  return { labelsOnly, canSubmit, labelsChanged };
}

export function activePublicationLabelIds(ids: number[], categories: ContentCategory[]) {
  const active = new Set(categories.filter(c => c.isActive).map(c => c.id));
  return [...new Set(ids)].filter(id => Number.isSafeInteger(id) && id > 0 && active.has(id));
}

export function useCreatorPublicationLabels(storyId: number, versionId: number | null, userId: number | undefined, enabled: boolean, suggestedIds: number[]) {
  const key = `${userId}:${storyId}:${versionId}`;
  const [result, setResult] = useState<{ key: string; categories: ContentCategory[]; error: string; loading: boolean } | null>(null);
  const [selection, setSelection] = useState<{ key: string; ids: number[] } | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled || !versionId || !userId) return;
    const controller = new AbortController();
    setResult({ key, categories: [], error: '', loading: true });
    void childProfileService.getContentCategories(controller.signal).then(response => {
      if (controller.signal.aborted) return;
      const valid = response.success && Array.isArray(response.data);
      setResult({ key, categories: valid ? response.data!.filter(c => c.isActive) : [], loading: false,
        error: valid ? '' : response.message || 'Không tải được nhãn nội dung.' });
    });
    return () => controller.abort();
  }, [key, enabled, versionId, userId, revision]);
  const current = result?.key === key && enabled ? result : null;
  const categories = current?.categories ?? [];
  const selectedIds = activePublicationLabelIds(selection?.key === key ? selection.ids : suggestedIds, categories);
  return { categories, selectedIds, loading: !current || current.loading, error: current?.error ?? '',
    canSubmit: !!current && !current.loading && !current.error && selectedIds.length > 0,
    setSelected: (ids: number[]) => setSelection({ key, ids }), reload: () => setRevision(n => n + 1) };
}
