import type * as B from '@/app/types/backendContracts';
import type { ChildRef } from '@/app/types/progress';
import type { RoadmapAddResult, RoadmapItem, RoadmapTemplate } from '@/app/types/progress';

const ageBand = (value: string) => value === '6-8' ? 'Age_6_8' : value === '9-10' ? 'Age_9_10' : value;

export function roadmapItems(dto: B.ChildRoadmapDto): RoadmapItem[] {
  const statuses: Record<string, RoadmapItem['status']> = { Waiting: 'queued', Open: 'open', Completed: 'completed', Skipped: 'skipped', Removed: 'removed' };
  return [dto.open, ...dto.waiting, ...dto.history].filter((i): i is B.ChildRoadmapItemDto => !!i).map(i => ({
    id: i.id, childProfileId: dto.childProfileId, storyId: i.storyId, title: i.title ?? 'Truyện không còn khả dụng',
    position: i.position, status: statuses[i.status] ?? 'skipped', source: i.source === 'TemplateCopy' ? 'template' : i.source === 'Wish' ? 'wish' : 'parent',
    sourceTemplateId: null, note: i.note, dueDays: i.expectedDays, dueAt: i.expectedCompletionAt,
    openedAt: i.openedAt, completedAt: i.completedAt, skipReason: i.skipReason as RoadmapItem['skipReason'], isStoryAvailable: i.isStoryAvailable,
  }));
}
export function roadmapAddResult(dto: B.AddRoadmapStoryResultDto, children: ChildRef[]): RoadmapAddResult {
  return {
    added: dto.results.filter(i => i.itemId !== null && ['Added', 'MovedToNext'].includes(i.outcome)).map(i => ({ childProfileId: i.childProfileId, itemId: i.itemId!, moved: i.outcome === 'MovedToNext' })),
    skipped: dto.results.filter(i => !['Added', 'MovedToNext'].includes(i.outcome)).map(i => ({ childProfileId: i.childProfileId, nickname: children.find(c => c.id === i.childProfileId)?.nickname ?? `#${i.childProfileId}`, reason: i.message ?? i.skipCode ?? i.outcome })),
    warnings: dto.results.flatMap(i => i.warnings.map(w => `${children.find(c => c.id === i.childProfileId)?.nickname ?? i.childProfileId}: ${w}`)),
  };
}
export function roadmapTemplate(dto: B.RoadmapLibraryDetailDto): RoadmapTemplate {
  return { id: dto.id, title: dto.name, description: dto.description ?? '', targetAgeBand: ageBand(dto.ageBand),
    readingLevelMin: dto.readingLevelMin, readingLevelMax: dto.readingLevelMax, topic: dto.mainCategory?.displayName ?? '', defaultDaysPerStep: dto.defaultDaysPerStory,
    stories: dto.stories.map(s => ({ storyId: s.storyId, title: s.title ?? 'Truyện không còn khả dụng', ageBand: ageBand(s.ageBand), length: null, isAvailable: s.isAvailable })) };
}

export function roadmapCopyResult(dto: B.RoadmapCopyPlanDto, children: ChildRef[]): RoadmapAddResult {
  return {
    added: dto.children.flatMap(c => c.outcome === 'Copied' ? c.steps.filter(s => s.action === 'Copy').map(() => ({ childProfileId: c.childProfileId, itemId: null, moved: false })) : []),
    skipped: dto.children.flatMap(c => c.outcome !== 'Copied' ? [{ childProfileId: c.childProfileId, nickname: children.find(k => k.id === c.childProfileId)?.nickname ?? `#${c.childProfileId}`, reason: c.message ?? c.skipCode ?? c.outcome }] : c.steps.filter(s => s.action === 'Skip').map(s => ({ childProfileId: c.childProfileId, nickname: children.find(k => k.id === c.childProfileId)?.nickname ?? `#${c.childProfileId}`, reason: `${s.title ?? s.storyId}: ${s.message ?? s.skipCode ?? s.action}` }))),
    warnings: dto.children.flatMap(c => c.warnings.map(w => `${children.find(k => k.id === c.childProfileId)?.nickname ?? c.childProfileId}: ${w}`)),
  };
}
