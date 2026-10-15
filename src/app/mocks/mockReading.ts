import type { ContentLoaders } from '@/app/services/readingLocal';
import type { LibraryStory, ReadingPackage } from '@/app/types/reading';
import { PUBLIC_STORY_BASE, staffLocal } from '@/app/services/staffLocal';
import { db, MOCK_CHILDREN } from './mockDb';
import { mockStoryStatus } from './mockAiStory';

const childOf = (childId: number) => db().children.find((x) => x.id === childId) ?? MOCK_CHILDREN.find((x) => x.id === childId);
const pagesOf = (content: string) => content.split(/\n\s*\n/).map((text, i) => ({ pageNumber: i + 1, text: text.trim() }));

/** Nguồn nội dung cho bộ máy đọc ở chế độ dữ liệu mẫu. */
export const mockReadingLoaders: ContentLoaders = {
  async child(childId) {
    const c = childOf(childId);
    if (!c) return null;
    const policy = db().policies[childId];
    return {
      nickname: c.nickname, ageBand: c.ageBand, readingLevel: db().learning[childId]?.readingLevel ?? (c.ageBand === 'Age_9_12' ? 3 : 1),
      holdThreshold: policy?.comprehensionThresholdPercent ?? 70, holdWindow: policy?.comprehensionWindowSize ?? 3,
    };
  },

  async library(childId) {
    const ageBand = childOf(childId)?.ageBand;
    // Thư viện chung (Public Library): Content Creator tạo, Moderator duyệt; không hiện truyện cho nhóm tuổi lớn hơn.
    const publicStories = staffLocal.publicStories()
      .filter((p) => ageBand === 'Age_9_12' || p.targetAgeBand === 'Age_6_8')
      .map((p): LibraryStory => ({ storyId: p.id, title: p.title, genre: p.genre, lesson: p.moralLesson, coverImageUrl: null, source: 'public_library', lengthCategory: 'short', readingLevel: p.readingLevel, isChallenge: false, createdAt: p.updatedAt }));
    const own = db().stories
      .filter((s) => s.childId === childId && !s.archived && mockStoryStatus(s) === 'ready')
      .map((s): LibraryStory => {
        const words = s.content.split(/\s+/).length;
        return { storyId: s.id, title: s.title, genre: s.genre, lesson: s.lesson, coverImageUrl: null, source: 'own', lengthCategory: words < 150 ? 'short' : words < 400 ? 'medium' : 'long', readingLevel: null, isChallenge: false, createdAt: s.createdAt };
      });
    return [...own, ...publicStories];
  },

  async pack(storyId): Promise<ReadingPackage | null> {
    if (storyId > PUBLIC_STORY_BASE) {
      const p = staffLocal.publicStories().find((x) => x.id === storyId);
      return p ? { storyId, storyVersionId: storyId, title: p.title, lesson: p.moralLesson, pages: pagesOf(p.content), vocabulary: [], quiz: [] } : null;
    }
    const s = db().stories.find((x) => x.id === storyId);
    if (!s) return null;
    return {
      storyId, storyVersionId: s.reviewVersionId, title: s.title, lesson: s.lesson, pages: pagesOf(s.content),
      vocabulary: s.vocabulary.map((v, i) => ({ id: v.id ?? i + 1, term: v.term, definition: v.definition })),
      quiz: s.quiz.filter((q) => q.correctAnswer).map((q, i) => ({ id: q.id ?? i + 1, type: q.type, question: q.question, choices: q.choices ?? null, acceptedAnswers: [q.correctAnswer!] })),
    };
  },
};
