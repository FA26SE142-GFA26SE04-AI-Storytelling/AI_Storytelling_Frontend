import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CreatorBrief from '@/app/features/staff/CreatorBrief';
import {
  READING_LEVELS,
  levelAboveAge,
  readingLevelBadgeText,
  readingLevelInfo,
  storyLengthFor,
} from '@/app/lib/guardian';
import type * as B from '@/app/types/backendContracts';

const baseContext: B.CreatorAIStoryInputContextDto = {
  ageBand: '6-8',
  readingLevel: 2,
  defaultLanguage: 'vi',
  availableLanguages: ['vi'],
  availableVocabularyLevels: ['level_1', 'level_2', 'level_3'],
  maximumLength: 2000,
  recommendedTargetLength: 550,
  requiredApprovalMode: 'manual',
  safetyScoreThreshold: 70,
  blockedCategoryCodes: [],
};

const baseValues = {
  topic: 'Chú mèo nhỏ đi tìm quả bóng',
  lesson: 'Biết chia sẻ với bạn',
  genre: 'Động vật',
  charactersText: 'Mèo Mướp',
  setting: 'Khu vườn xanh',
  targetLength: 550,
  vocabularyLevel: 'level_2',
  outputMode: 'learning',
};

describe('Reading level display labels & hints', () => {
  it('provides descriptive option labels, short labels, badge text, and normalized age-band checks', () => {
    expect(READING_LEVELS).toHaveLength(5);
    expect(READING_LEVELS[0].shortLabel).toBe('Mức 1 · Lớp 1 (Mới tập đọc)');
    expect(READING_LEVELS[1].optionLabel).toBe(
      'Mức 2 · Lớp 2 — Đọc câu đơn (câu ~9 từ, tối đa 14 từ/câu)',
    );
    expect(readingLevelBadgeText(3)).toBe('Mức đọc 3 · Lớp 3');
    expect(readingLevelBadgeText(null)).toBe('Chưa gắn');
    expect(readingLevelInfo(99)).toBeNull();

    expect(levelAboveAge('6-8', 4)).toBe(true);
    expect(levelAboveAge('9-10', 4)).toBe(false);
    expect(levelAboveAge('Age_9_10', 4)).toBe(false);
    expect(storyLengthFor('6-8', 4).target).toBe(1500);
    expect(storyLengthFor('9-10', 1).target).toBe(1500);
    expect(storyLengthFor('6-8', 2).target).toBe(900);
  });

  it('renders descriptive reading-level options, sample sentence, vocabulary explanations, and age-mismatch warning in CreatorBrief', () => {
    const htmlLevel2 = renderToStaticMarkup(
      <CreatorBrief
        values={baseValues}
        context={baseContext}
        contextError=""
        busy={false}
        ageBand="6-8"
        readingLevel={2}
        onAudience={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(htmlLevel2).toContain('Mức đọc 2 · Lớp 2');
    expect(htmlLevel2).toContain('Mức 1 · Lớp 1 — Mới tập đọc (câu ~7 từ, tối đa 10 từ/câu)');
    expect(htmlLevel2).toContain('Mức 2 · Lớp 2 — Đọc câu đơn (câu ~9 từ, tối đa 14 từ/câu)');
    expect(htmlLevel2).toContain('Sáng nay, Na dắt mèo con ra vườn chơi.');
    expect(htmlLevel2).toContain('Mức 1: Quen thuộc');
    expect(htmlLevel2).toContain('Mức 2: Theo trình độ (khớp mức đọc 2)');
    expect(htmlLevel2).toContain('Mức 3: Mở rộng');
    expect(htmlLevel2).not.toContain('dành cho bé 6–8 tuổi đã tự đọc tốt');

    const htmlLevel4Young = renderToStaticMarkup(
      <CreatorBrief
        values={{ ...baseValues, vocabularyLevel: 'level_4' }}
        context={{ ...baseContext, readingLevel: 4, availableVocabularyLevels: ['level_3', 'level_4', 'level_5'] }}
        contextError=""
        busy={false}
        ageBand="6-8"
        readingLevel={4}
        onAudience={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(htmlLevel4Young).toContain('Mức 4 tương đương lớp 4');
    expect(htmlLevel4Young).toContain('1.500 từ');

    const htmlLevel4Older = renderToStaticMarkup(
      <CreatorBrief
        values={{ ...baseValues, vocabularyLevel: 'level_4' }}
        context={{ ...baseContext, ageBand: '9-10', readingLevel: 4, availableVocabularyLevels: ['level_3', 'level_4', 'level_5'] }}
        contextError=""
        busy={false}
        ageBand="9-10"
        readingLevel={4}
        onAudience={vi.fn()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(htmlLevel4Older).not.toContain('dành cho bé 6–8 tuổi đã tự đọc tốt');

    const roadmapSrc = readFileSync(
      path.resolve(process.cwd(), 'app/features/staff/RoadmapAuthoringWorkspace.tsx'),
      'utf8',
    );
    expect(roadmapSrc).toContain('readingLevelInfo(l)?.shortLabel');
  });
});
