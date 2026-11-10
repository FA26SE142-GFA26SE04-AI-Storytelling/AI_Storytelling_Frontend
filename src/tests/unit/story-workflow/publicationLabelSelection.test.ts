import { expect, it } from 'vitest';
import { publicationLabelIds, togglePublicationLabel, type PublicationLabelSelection } from '@/app/features/story-workflow/publicationLabelSelection';

const categories = [
  { id: 1, code: 'ANIMALS', displayName: 'Động vật', isActive: true },
  { id: 2, code: 'FAMILY', displayName: 'Gia đình', isActive: true },
  { id: 3, code: 'OLD', displayName: 'Đã ngừng', isActive: false },
];
const scope = '13:48:97';

it('keeps edited labels through loading and repeated status or safety refreshes', () => {
  let selection: PublicationLabelSelection = null;
  expect(publicationLabelIds(selection, scope, [1], categories)).toEqual([1]);
  selection = togglePublicationLabel(selection, scope, [1], categories, 1);
  selection = togglePublicationLabel(selection, scope, [1], categories, 2);
  // status=null while refreshing, then the backend returns the original proposed labels again.
  for (const suggestions of [[], [1], [], [1], [1, 2]]) {
    expect(publicationLabelIds(selection, scope, suggestions, categories)).toEqual([2]);
  }
});

it('does not restore defaults when the user intentionally clears every label', () => {
  const selection = togglePublicationLabel(null, scope, [1], categories, 1);
  expect(publicationLabelIds(selection, scope, [], categories)).toEqual([]);
  expect(publicationLabelIds(selection, scope, [1], categories)).toEqual([]);
});

it('accepts asynchronous server defaults and catalog loading until the user makes a choice', () => {
  expect(publicationLabelIds(null, scope, [], null)).toEqual([]);
  expect(publicationLabelIds(null, scope, [1, 3, 99], null)).toEqual([1, 3, 99]);
  expect(publicationLabelIds(null, scope, [1, 3, 99], categories)).toEqual([1]);
  const selection = togglePublicationLabel(null, scope, [1], null, 2);
  expect(publicationLabelIds(selection, scope, [1], categories)).toEqual([1, 2]);
});

it.each(['14:48:97', '13:49:97', '13:48:98'])('does not carry local edits into another account/story/version: %s', nextScope => {
  const selection = { scope, ids: [2] };
  expect(publicationLabelIds(selection, nextScope, [1], categories)).toEqual([1]);
  const next = togglePublicationLabel(selection, nextScope, [1], categories, 1);
  expect(publicationLabelIds(next, nextScope, [1], categories)).toEqual([]);
});

it('does not submit labels retired by a catalog reload or mutate the saved local choice', () => {
  const selection = { scope, ids: [1, 2] };
  const refreshed = categories.map(category => category.id === 2 ? { ...category, isActive: false } : category);
  expect(publicationLabelIds(selection, scope, [1], refreshed)).toEqual([1]);
  expect(selection.ids).toEqual([1, 2]);
});
