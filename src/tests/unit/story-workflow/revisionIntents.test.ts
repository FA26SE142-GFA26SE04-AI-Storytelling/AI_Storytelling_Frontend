import { describe, expect, it } from 'vitest';
import type { AIProposalDto } from '@/app/types/aiStory';
import { artifactProposalItems, buildRevisionInstruction, REVISION_INTENTS, storyProposalView } from '@/app/features/story-workflow/revisionIntents';

const proposal = (artifactType: string, originalContent: unknown, suggestedContent: unknown): AIProposalDto => ({
  proposalId: 'p1', requestedByUserId: 1, storyId: 2, storyVersionId: 3, artifactType, operationType: 'x',
  originalContent, suggestedContent, status: 'pending', createdAt: '', expiresAt: '',
});

describe('intent-based revision', () => {
  it('has a fixed list with an instruction for every intent except custom', () => {
    expect(REVISION_INTENTS.map((i) => i.id)).toContain('less_scary');
    for (const i of REVISION_INTENTS.filter((x) => x.id !== 'custom')) expect(buildRevisionInstruction(i.id)).toBeTruthy();
  });

  it('requires a note for custom and caps notes at 200 characters', () => {
    expect(buildRevisionInstruction('custom', '   ')).toBeNull();
    const long = buildRevisionInstruction('custom', 'a'.repeat(500))!;
    expect(long.startsWith('a'.repeat(200) + '.')).toBe(true);
    expect(long).not.toContain('a'.repeat(201));
  });

  it('appends an optional note to a fixed intent', () => {
    expect(buildRevisionInstruction('shorten', 'giữ câu cuối')).toContain('Ghi chú thêm: giữ câu cuối');
  });

  it('reads story partial-edit proposals', () => {
    const view = storyProposalView(proposal('story', { content: 'A B C', start: 2, endExclusive: 3, selectedText: 'B' }, { content: 'B mới' }));
    expect(view).toEqual({ selectedText: 'B', suggestedText: 'B mới' });
    expect(storyProposalView(proposal('vocabulary', {}, { items: [] }))).toBeNull();
  });

  it('reads artifact proposals with or without the previous items', () => {
    expect(artifactProposalItems(proposal('quiz', {}, { items: [1, 2] }))).toEqual({ before: null, after: [1, 2] });
    expect(artifactProposalItems(proposal('vocabulary', { items: [0] }, { items: [1] }))).toEqual({ before: [0], after: [1] });
  });
});
