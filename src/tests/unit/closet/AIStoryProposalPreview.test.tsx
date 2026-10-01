import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AIStoryProposalPreview } from '../../../app/components/closet/subcomponents/AIStoryProposalPreview';
import type { AIProposalDto } from '../../../app/types/aiStory';

describe('proposal preview casing compatibility', () => {
  it.each([
    ['vocabulary', { items: [{ term: 'bạn', definition: 'Cùng chơi' }] }, 'Cùng chơi'],
    ['vocabulary', { items: [{ Term: 'bạn', Definition: 'Cùng chơi' }] }, 'Cùng chơi'],
    ['quiz', { items: [{ question: 'Ai?', choices: ['Lan', 'Minh'], correctAnswer: 'Lan' }] }, 'Đáp án: Lan'],
    ['quiz', { items: [{ Question: 'Ai?', Choices: ['Lan', 'Minh'], CorrectAnswer: 'Lan' }] }, 'Đáp án: Lan'],
    ['discussion', { items: [{ question: 'Bạn giúp ai?' }] }, 'Bạn giúp ai?'],
    ['discussion', { Items: [{ Question: 'Bạn giúp ai?' }] }, 'Bạn giúp ai?'],
  ])('renders %s proposals without blank cards', (artifactType, suggestedContent, expected) => {
    const proposal = { artifactType, suggestedContent } as AIProposalDto;
    const html = renderToStaticMarkup(<AIStoryProposalPreview proposal={proposal} />);
    expect(html).toContain(expected);
    expect(html).not.toContain('chưa có học liệu');
  });
});
