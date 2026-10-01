'use client';

import { AIProposalDto } from '../../../types/aiStory';

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;
}
function text(value: unknown): string { return typeof value === 'string' ? value : ''; }
function field(value: Record<string, unknown> | null, name: string): unknown {
  return value?.[name] ?? value?.[name[0].toUpperCase() + name.slice(1)];
}

export function AIStoryProposalPreview({ proposal }: { proposal: AIProposalDto }) {
  const suggested = object(proposal.suggestedContent);
  if (proposal.artifactType === 'story') return <p className="whitespace-pre-wrap text-sm">{text(field(suggested, 'content')) || 'Đề xuất chưa có nội dung để xem trước.'}</p>;
  const rawItems = field(suggested, 'items');
  const items = Array.isArray(rawItems) ? rawItems : [];
  return <div className="space-y-3">{items.length ? items.map((value, index) => {
    const item = object(value);
    const choices = field(item, 'choices');
    const definition = field(item, 'definition');
    const answer = field(item, 'correctAnswer');
    return <div key={index} className="dashboard-card p-3 text-sm">
      <p className="font-bold">{text(field(item, 'term')) || text(field(item, 'question'))}</p>
      {typeof definition === 'string' && <p>{definition}</p>}
      {Array.isArray(choices) && <ul>{choices.map((choice, i) => <li key={i}>{text(choice)}</li>)}</ul>}
      {typeof answer === 'string' && <p>Đáp án: {answer}</p>}
    </div>;
  }) : <p>Đề xuất chưa có học liệu để xem trước.</p>}</div>;
}
