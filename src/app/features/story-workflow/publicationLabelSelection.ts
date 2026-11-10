import type { ContentCategory } from '@/app/types/childProfile';

export type PublicationLabelSelection = { scope: string; ids: number[] } | null;

/** Server labels are defaults only; an explicit local choice (including empty) wins across refreshes. */
export function publicationLabelIds(selection: PublicationLabelSelection, scope: string, suggestedIds: number[], categories: ContentCategory[] | null) {
  const ids = selection?.scope === scope ? selection.ids : suggestedIds;
  return [...new Set(ids)].filter(id => !categories || categories.some(category => category.id === id && category.isActive));
}

export function togglePublicationLabel(selection: PublicationLabelSelection, scope: string, suggestedIds: number[], categories: ContentCategory[] | null, id: number): PublicationLabelSelection {
  const ids = publicationLabelIds(selection, scope, suggestedIds, categories);
  return { scope, ids: ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id] };
}
