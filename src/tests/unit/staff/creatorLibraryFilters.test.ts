import { describe, expect, it } from 'vitest';
import type { CreatorDraft } from '@/app/types/creator';
import { EMPTY_FILTERS, facets, filterCreatorStories, isFiltering, shelfOf, topicFacets, topicOf } from '@/app/features/staff/creatorLibraryFilters';

const draft = (over: Partial<CreatorDraft>): CreatorDraft => ({
  storyId: 1, authorUserId: 7, title: 'Truyện', description: '', language: 'vi', ageBand: '6-8', genre: 'Thiên nhiên',
  experienceMode: 'reading', audienceRevision: 1, revisionToken: 't', selectedVersionId: 1, lastVersionNo: 1,
  createdAt: '2026-11-01T00:00:00Z', updatedAt: null, source: 'Manual', status: 'Ready', ...over,
});

const stories = [
  draft({ storyId: 1, title: 'Bé Na và cây xoài', createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-20T00:00:00Z' }),
  draft({ storyId: 2, title: 'Ánh trăng', ageBand: '9-10', genre: '', source: 'Ai', createdAt: '2026-11-10T00:00:00Z' }),
  draft({ storyId: 3, title: 'Chú ếch xanh', status: 'ContentReview', createdAt: '2026-11-05T00:00:00Z' }),
];

describe('creator library filters', () => {
  it('sorts by last update by default, then by created date or title', () => {
    expect(filterCreatorStories(stories, EMPTY_FILTERS).map((s) => s.storyId)).toEqual([1, 2, 3]);
    expect(filterCreatorStories(stories, { ...EMPTY_FILTERS, sort: 'created' }).map((s) => s.storyId)).toEqual([2, 3, 1]);
    expect(filterCreatorStories(stories, { ...EMPTY_FILTERS, sort: 'title' }).map((s) => s.storyId)).toEqual([2, 1, 3]);
  });

  it('combines query, age, topic, source and status filters', () => {
    expect(filterCreatorStories(stories, { ...EMPTY_FILTERS, query: 'ẾCH' }).map((s) => s.storyId)).toEqual([3]);
    expect(filterCreatorStories(stories, { ...EMPTY_FILTERS, genre: 'Khác', source: 'ai', age: '9-10' }).map((s) => s.storyId)).toEqual([2]);
    expect(filterCreatorStories(stories, { ...EMPTY_FILTERS, status: 'review' }).map((s) => s.storyId)).toEqual([3]);
    expect(shelfOf(stories[2])).toBe('review');
  });

  it('reports filtering state and facet counts', () => {
    expect(isFiltering(EMPTY_FILTERS)).toBe(false);
    expect(isFiltering({ ...EMPTY_FILTERS, sort: 'title' })).toBe(false);
    expect(isFiltering({ ...EMPTY_FILTERS, query: ' a ' })).toBe(true);
    expect(facets(stories, topicOf)).toEqual([{ key: 'Khác', label: 'Khác', count: 1 }, { key: 'Thiên nhiên', label: 'Thiên nhiên', count: 2 }]);
    expect(topicFacets(stories).map((t) => t.key)).toEqual(['Thiên nhiên', 'Khác']);
  });
});
