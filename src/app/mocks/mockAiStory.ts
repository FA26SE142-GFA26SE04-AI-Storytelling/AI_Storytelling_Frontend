import type * as D from '@/app/types/aiStory';
import type { ApiResponse } from '@/app/types/auth';
import { composeStory, db, makeOutlineVersion, persist, MOCK_CHILDREN, MOCK_INTERESTS, type MockStory } from './mockDb';
import { delay, fail, ok } from './config';

type R<T> = Promise<ApiResponse<T>>;

const BLOCKED = /ma quỷ|kinh dị|bạo lực|giết|máu/i;
const T_ACCEPT = 1200;      // kiểm tra an toàn ý tưởng
const T_OUTLINE = 2200;     // viết dàn ý
const T_REGEN = 2000;       // viết lại dàn ý
const T_CONTENT = 1800;     // nội dung ổn định
const T_LEARNING = 4000;    // học liệu xong
const T_REVIEW = 5000;      // chuyển sang chờ duyệt
const T_MEDIA = 6000;       // tranh + giọng đọc
const T_AI_EDIT = 1400;     // AI viết lại một đoạn / sinh lại học liệu

const now = () => Date.now();
const find = (id: number) => db().stories.find((s) => s.id === id) ?? null;
const missing = <T>() => fail<T>('Không tìm thấy truyện (dữ liệu mẫu).');

/** Áp dụng các thay đổi theo thời gian (ví dụ dàn ý viết lại xong). */
function tick(s: MockStory) {
  if (s.pendingRegenAt !== null && now() >= s.pendingRegenAt) {
    const prev = s.outlineVersions[s.outlineVersions.length - 1];
    s.outlineVersions.forEach((v) => { v.isCurrent = false; });
    s.outlineVersions.push(makeOutlineVersion(s.id, prev.versionNo + 1, s.topic, s.characters, s.lesson));
    s.pendingRegenAt = null;
    persist();
  }
}

export function storyStatus(s: MockStory): string {
  tick(s);
  if (s.archived) return 'archived';
  if (s.pendingDecision) return 'draft';
  if (s.mediaStartedAt !== null) return now() - s.mediaStartedAt >= T_MEDIA ? 'ready' : 'media_processing';
  if (s.outlineApprovedAt !== null) return now() - s.outlineApprovedAt >= T_REVIEW ? 'content_review' : 'outline_review';
  return now() - s.acceptedAt >= T_OUTLINE ? 'outline_review' : 'input_accepted';
}

function inputProgress(s: MockStory): D.AIStoryInputProgressDto {
  const elapsed = now() - s.acceptedAt;
  const inputStatus: D.AIStoryInputStatus = elapsed < T_ACCEPT ? 'checking_input' : s.blocked ? 'input_blocked' : 'input_accepted';
  return {
    requestId: s.requestId, storyId: s.id, inputStatus, handoffStatus: inputStatus === 'input_accepted' ? 'enqueued' : 'none', handoffJobId: null,
    attemptCount: 1, maxAttempts: 3,
    reasonCode: inputStatus === 'input_blocked' ? 'blocked_topic' : null,
    fallbackMessage: inputStatus === 'input_blocked' ? 'Chủ đề này chưa phù hợp để kể đâu nè. Mình cùng nghe chuyện về các bạn động vật hoặc chuyến phiêu lưu trên mây nhé!' : null,
    canRetry: false, createdAt: s.createdAt, updatedAt: null, guardrailCheckedAt: null, handoffCreatedAt: null,
  };
}

function outlineProgress(s: MockStory): D.OutlineProgressDto {
  const status = storyStatus(s);
  const regen = s.pendingRegenAt !== null;
  const ready = status !== 'input_accepted';
  return {
    storyId: s.id, storyStatus: status,
    currentVersion: ready ? s.outlineVersions[s.outlineVersions.length - 1] : null,
    activeOperation: regen ? 'regenerate' : null, activeJobStatus: regen ? 'running' : null, lastErrorCode: null,
  };
}

function generationProgress(s: MockStory): D.ContentGenerationProgressDto {
  const status = storyStatus(s);
  const e = s.outlineApprovedAt === null ? -1 : now() - s.outlineApprovedAt;
  const done = ['content_review', 'approved', 'media_processing', 'ready'].includes(status);
  const stable = done || e >= T_CONTENT;
  const art = (at: number) => (done || e >= at ? 'completed' : e >= T_CONTENT ? 'running' : 'pending');
  return {
    storyId: s.id, storyStatus: status,
    currentStep: e < 0 ? 'not_started' : done ? 'completed' : stable ? 'learning_materials' : 'content',
    content: e < 0 ? 'pending' : stable ? 'stable' : 'running',
    vocabulary: e < 0 ? 'pending' : art(T_CONTENT + 800), quiz: e < 0 ? 'pending' : art(T_CONTENT + 1600), discussion: e < 0 ? 'pending' : art(T_LEARNING),
    isComplete: done, lastErrorCode: null, qualityFailure: null, stableStoryVersionId: stable ? s.reviewVersionId : null,
  };
}

function mediaProgress(s: MockStory): D.MediaProgressDto {
  const required = Math.max(3, s.content.split(/\n\s*\n/).length);
  const e = s.mediaStartedAt === null ? 0 : now() - s.mediaStartedAt;
  const ready = e >= T_MEDIA;
  const step = Math.min(required, Math.floor((e / T_MEDIA) * required));
  return {
    storyId: s.id, approvedStoryVersionId: s.reviewVersionId, storyStatus: storyStatus(s), jobStatus: ready ? 'completed' : 'running',
    sceneCount: required, readyIllustrations: ready ? required : step, readyAudio: ready ? required : step, isReady: ready, errorCode: null,
    requiredIllustrations: required, missingIllustrationBeatIds: null, missingAudioSegmentIds: null, manualReviewAssetIds: null, scenesWithoutValidBeats: null,
  };
}

const reviewable = (s: MockStory) => storyStatus(s) === 'content_review';

/** Đề xuất AI chỉ sống trong bộ nhớ, giống cache 1 giờ của backend. */
const proposals = new Map<string, D.AIProposalDto>();

function createProposal(s: MockStory, artifactType: string, operationType: string, originalContent: unknown, suggestedContent: unknown): D.CreateProposalResponseDto {
  const proposalId = `mock-${s.id}-${proposals.size + 1}-${now()}`;
  proposals.set(proposalId, {
    proposalId, requestedByUserId: 1, storyId: s.id, storyVersionId: s.reviewVersionId, artifactType, operationType,
    originalContent, suggestedContent, status: 'pending', createdAt: new Date().toISOString(), expiresAt: new Date(now() + 3_600_000).toISOString(),
  });
  return { proposalId, message: 'Đề xuất đã sẵn sàng.' };
}

/** "AI" giả: rút gọn khi được yêu cầu ngắn/đơn giản, còn lại thêm một câu thoại nhỏ. */
function mockRewrite(text: string, instruction: string): string {
  if (/rút ngắn|đơn giản|bớt/i.test(instruction)) {
    const words = text.trim().split(/\s+/);
    return words.slice(0, Math.max(3, Math.ceil(words.length * 0.7))).join(' ').replace(/[,;:]?$/, '.');
  }
  return `${text.trim()} “Mình cùng cố gắng nhé!”, cả nhóm bạn nói.`;
}

export const mockAiStory = {
  async getCreationContext(childId: number): R<D.AIStoryInputContextDto> {
    await delay();
    const c = db().children.find((x) => x.id === childId) ?? MOCK_CHILDREN.find((x) => x.id === childId);
    if (!c) return fail('Không tìm thấy hồ sơ bé.');
    if (c.status !== 'Active') return fail(`Hồ sơ của ${c.nickname} chưa được kích hoạt. Hãy hoàn tất ở mục Hồ sơ bé.`);
    const older = c.ageBand === 'Age_9_12';
    const lp = db().learning[c.id];
    const level = lp?.readingLevel ?? (older ? 3 : 2);
    const favorites = lp?.topics.filter((t) => t.relation === 'FavoriteTopic').map((t) => t.topic);
    return ok({
      childProfileId: c.id, childNickname: c.nickname, ageBand: c.ageBand, readingLevel: level,
      defaultVocabularyLevel: `level_${level}` as D.VocabularyLevel, availableVocabularyLevels: ['level_1', 'level_2', 'level_3', 'level_4', 'level_5'],
      defaultLanguage: 'vi', availableLanguages: ['vi'], maximumLength: db().policies[c.id]?.maxStoryLength ?? (older ? 1200 : 800), requiredApprovalMode: 'AlwaysManual',
      parentalGateEnabled: true, safetyScoreThreshold: 0.8, readabilityScoreThreshold: null, comprehensionGoal: lp?.comprehensionGoal ?? null,
      comprehensionThresholdPercent: null, comprehensionWindowSize: 5, interests: favorites?.length ? favorites : MOCK_INTERESTS[c.id] ?? [],
      allowedCategoryCodes: ['animals', 'adventure', 'science', 'fairytale'], restrictedCategoryCodes: [], blockedCategoryCodes: ['horror', 'violence'],
      characterModes: ['specified', 'ai_suggested'], settingModes: ['specified', 'ai_suggested'],
    });
  },

  async submitInput(input: D.SubmitAIStoryInputRequestDto): R<D.AIStoryInputProgressDto> {
    await delay();
    const d = db();
    const existing = d.stories.find((s) => s.id === input.existingStoryId);
    if (existing) return ok(inputProgress(existing));
    const id = d.nextStoryId++;
    const c = composeStory(input.topic, input.characters, input.lesson);
    const s: MockStory = {
      id, childId: input.childProfileId, requestId: id, topic: input.topic, genre: input.genre ?? 'Phiêu lưu', lesson: input.lesson, characters: input.characters,
      createdAt: new Date().toISOString(), acceptedAt: now(), blocked: BLOCKED.test(`${input.topic} ${input.lesson}`),
      outlineVersions: [makeOutlineVersion(id, 1, input.topic, input.characters, input.lesson)], pendingRegenAt: null, outlineApprovedAt: null,
      reviewVersionId: id * 10 + 1, title: c.title, content: c.content, vocabulary: c.vocabulary, quiz: c.quiz, discussion: c.discussion, mediaStartedAt: null, archived: false,
    };
    d.stories.unshift(s);
    persist();
    return ok(inputProgress(s));
  },

  async getInputProgress(id: number): R<D.AIStoryInputProgressDto> {
    await delay(120);
    const s = find(id);
    return s ? ok(inputProgress(s)) : missing();
  },

  async retryInput(id: number): R<D.AIStoryInputProgressDto> {
    await delay();
    const s = find(id);
    if (!s) return missing();
    s.acceptedAt = now();
    s.blocked = false;
    persist();
    return ok(inputProgress(s));
  },

  async getOutline(id: number): R<D.OutlineProgressDto> {
    await delay(120);
    const s = find(id);
    return s ? ok(outlineProgress(s)) : missing();
  },

  async getOutlineVersions(id: number): R<D.OutlineVersionDto[]> {
    const s = find(id);
    return s ? ok(s.outlineVersions) : missing();
  },

  async getOutlineVersion(id: number, version: number): R<D.OutlineVersionDto> {
    const v = find(id)?.outlineVersions.find((x) => x.versionNo === version);
    return v ? ok(v) : missing();
  },

  async editOutline(id: number, _version: number, input: D.EditOutlineRequestDto): R<D.OutlineVersionDto> {
    await delay();
    const s = find(id);
    if (!s) return missing();
    const prev = s.outlineVersions[s.outlineVersions.length - 1];
    s.outlineVersions.forEach((v) => { v.isCurrent = false; });
    const next: D.OutlineVersionDto = { ...prev, ...input, id: id * 100 + prev.versionNo + 1, versionNo: prev.versionNo + 1, editType: 'manual', isCurrent: true, outlineApprovedAt: null, createdAt: new Date().toISOString() };
    s.outlineVersions.push(next);
    s.title = input.title;
    persist();
    return ok(next);
  },

  async regenerateOutline(id: number): R<D.OutlineProgressDto> {
    await delay();
    const s = find(id);
    if (!s) return missing();
    s.pendingRegenAt = now() + T_REGEN;
    persist();
    return ok(outlineProgress(s));
  },

  async retryOutline(id: number): R<D.OutlineProgressDto> {
    const s = find(id);
    return s ? ok(outlineProgress(s)) : missing();
  },

  async approveOutline(id: number): R<D.OutlineProgressDto> {
    await delay();
    const s = find(id);
    if (!s) return missing();
    s.outlineApprovedAt = now();
    s.outlineVersions[s.outlineVersions.length - 1].outlineApprovedAt = new Date().toISOString();
    persist();
    return ok(outlineProgress(s));
  },

  async rejectOutline(id: number): R<D.OutlineProgressDto> {
    const s = find(id);
    if (!s) return missing();
    s.archived = true;
    persist();
    return ok(outlineProgress(s));
  },

  async getGenerationProgress(id: number): R<D.ContentGenerationProgressDto> {
    await delay(120);
    const s = find(id);
    return s ? ok(generationProgress(s)) : missing();
  },

  async retryGeneration(id: number): R<D.ContentGenerationProgressDto> {
    const s = find(id);
    return s ? ok(generationProgress(s)) : missing();
  },

  async getReviewPackage(id: number): R<D.ReviewPackageDto> {
    await delay();
    const s = find(id);
    if (!s) return missing();
    const can = reviewable(s);
    const art = (n: number): D.ArtifactStatusDto => ({ state: 'ready', itemCount: n });
    return ok({
      storyId: s.id, storyVersionId: s.reviewVersionId, storyStatus: storyStatus(s), title: s.title, content: s.content, lesson: s.lesson,
      readabilityAlgorithm: 'FKGL', readabilityFkgl: 2.4, readabilityFre: 88, vocabulary: art(s.vocabulary.length), quiz: art(s.quiz.length), discussion: art(s.discussion.length),
      canEdit: can, canApprove: can, canArchive: !s.archived,
    });
  },

  async generateArtifacts(id: number): R<D.ArtifactGenerationResultDto> {
    await delay();
    const s = find(id);
    return s ? ok({ storyId: s.id, storyVersionId: s.reviewVersionId, vocabularyCount: s.vocabulary.length, quizCount: s.quiz.length, discussionCount: s.discussion.length, success: true, message: 'Đã tạo học liệu.' }) : missing();
  },

  async getStoryReview(id: number): R<D.StoryReviewDto> {
    const s = find(id);
    return s ? ok({ storyId: s.id, versionId: s.reviewVersionId, title: s.title, content: s.content, lesson: s.lesson, readabilityAlgorithm: 'FKGL', readabilityFkgl: 2.4, readabilityFre: 88 }) : missing();
  },

  async updateStoryReview(id: number, input: D.UpdateStoryReviewRequestDto): R<D.StoryReviewDto> {
    await delay();
    const s = find(id);
    if (!s) return missing();
    s.title = input.title;
    s.content = input.content;
    s.lesson = input.lesson;
    s.reviewVersionId += 1;
    persist();
    return ok({ storyId: s.id, versionId: s.reviewVersionId, title: s.title, content: s.content, lesson: s.lesson, readabilityAlgorithm: 'FKGL', readabilityFkgl: 2.4, readabilityFre: 88 });
  },

  async getVocabularyReview(id: number): R<D.VocabularyReviewDto> {
    const s = find(id);
    return s ? ok({ storyId: s.id, versionId: s.reviewVersionId, items: s.vocabulary }) : missing();
  },
  async updateVocabularyReview(id: number, input: D.UpdateVocabularyRequestDto): R<D.VocabularyReviewDto> {
    const s = find(id);
    if (!s) return missing();
    s.vocabulary = input.items;
    persist();
    return ok({ storyId: s.id, versionId: s.reviewVersionId, items: s.vocabulary });
  },
  async getQuizReview(id: number): R<D.QuizReviewDto> {
    const s = find(id);
    return s ? ok({ storyId: s.id, versionId: s.reviewVersionId, items: s.quiz }) : missing();
  },
  async updateQuizReview(id: number, input: D.UpdateQuizRequestDto): R<D.QuizReviewDto> {
    const s = find(id);
    if (!s) return missing();
    s.quiz = input.items;
    persist();
    return ok({ storyId: s.id, versionId: s.reviewVersionId, items: s.quiz });
  },
  async getDiscussionReview(id: number): R<D.DiscussionReviewDto> {
    const s = find(id);
    return s ? ok({ storyId: s.id, versionId: s.reviewVersionId, items: s.discussion }) : missing();
  },
  async updateDiscussionReview(id: number, input: D.UpdateDiscussionRequestDto): R<D.DiscussionReviewDto> {
    const s = find(id);
    if (!s) return missing();
    s.discussion = input.items;
    persist();
    return ok({ storyId: s.id, versionId: s.reviewVersionId, items: s.discussion });
  },

  async completeStoryReview(): R<boolean> { return ok(true); },
  async completeReview(): R<boolean> { await delay(80); return ok(true); },

  async validateReview(id: number): R<D.ValidationResultDto> {
    await delay();
    return find(id) ? ok({ canApprove: true, checks: [
      { name: 'An toàn nội dung', passed: true, message: 'Đạt' },
      { name: 'Độ khó phù hợp', passed: true, message: 'Mức 2' },
      { name: 'Đủ học liệu', passed: true, message: 'Đủ' },
    ], issues: [] }) : missing();
  },

  async approveStory(id: number): R<D.ApproveResponseDto> {
    await delay();
    const s = find(id);
    if (!s) return missing();
    s.mediaStartedAt = now();
    persist();
    return ok({ success: true, storyId: s.id, status: 'Approved', approvedAt: new Date().toISOString() });
  },

  async archiveStory(id: number): R<D.ArchiveResponseDto> {
    await delay();
    const s = find(id);
    if (!s) return missing();
    s.archived = true;
    persist();
    return ok({ success: true, storyId: s.id, status: 'Archived' });
  },

  async partialEditStory(id: number, input: D.PartialEditRequestDto): R<D.CreateProposalResponseDto> {
    await delay(T_AI_EDIT);
    const s = find(id);
    if (!s) return missing();
    const { start, endExclusive } = input.selection;
    if (!reviewable(s) || start < 0 || endExclusive <= start || endExclusive > s.content.length) return fail('Đoạn đã chọn không còn khớp với bản thảo.');
    const selectedText = s.content.slice(start, endExclusive);
    return ok(createProposal(s, 'story', 'partial_edit', { content: s.content, start, endExclusive, selectedText }, { content: mockRewrite(selectedText, input.instruction) }));
  },

  async regenerateReviewArtifact(id: number, artifact: Exclude<D.ReviewArtifact, 'story'>): R<D.CreateProposalResponseDto> {
    await delay(T_AI_EDIT);
    const s = find(id);
    if (!s || !reviewable(s)) return missing();
    const items = s[artifact] as unknown[];
    // Như backend: chỉ đề xuất từ vựng mới gửi kèm danh sách cũ.
    return ok(createProposal(s, artifact, 'regenerate', artifact === 'vocabulary' ? { items } : {}, { items: [...items].reverse() }));
  },

  async getProposal(id: number, proposalId: string): R<D.AIProposalDto> {
    const p = proposals.get(proposalId);
    return p && p.storyId === id ? ok(p) : fail('Đề xuất đã hết hạn.');
  },

  async applyProposal(id: number, proposalId: string): R<D.ApplyDiscardResponseDto> {
    await delay();
    const s = find(id);
    const p = proposals.get(proposalId);
    if (!s || !p || p.storyId !== id) return fail('Đề xuất đã hết hạn.');
    const original = p.originalContent as { start?: number; endExclusive?: number };
    const suggested = p.suggestedContent as { content?: string; items?: unknown[] };
    if (p.artifactType === 'story' && original.start !== undefined && original.endExclusive !== undefined) {
      s.content = s.content.slice(0, original.start) + (suggested.content ?? '') + s.content.slice(original.endExclusive);
    } else if (p.artifactType === 'vocabulary') s.vocabulary = suggested.items as D.VocabularyItemDto[];
    else if (p.artifactType === 'quiz') s.quiz = suggested.items as D.QuizQuestionDto[];
    else if (p.artifactType === 'discussion') s.discussion = suggested.items as D.DiscussionPromptDto[];
    proposals.delete(proposalId);
    persist();
    return ok({ success: true, message: 'Đã áp dụng đề xuất.' });
  },

  async discardProposal(_id: number, proposalId: string): R<D.ApplyDiscardResponseDto> {
    proposals.delete(proposalId);
    return ok({ success: true, message: '' });
  },

  async getMediaProgress(id: number): R<D.MediaProgressDto> {
    await delay(120);
    const s = find(id);
    return s ? ok(mediaProgress(s)) : missing();
  },

  async getMediaPackage(id: number): R<D.StoryMediaPackage> {
    const s = find(id);
    return s ? ok({ storyId: s.id, storyVersionId: s.reviewVersionId, scenes: [] }) : missing();
  },

  async retryMedia(id: number): R<D.MediaProgressDto> {
    const s = find(id);
    if (!s) return missing();
    s.mediaStartedAt = now();
    persist();
    return ok(mediaProgress(s));
  },

  async regenerateIllustration(): R<null> { return { success: true, message: '', data: null }; },
};

export { storyStatus as mockStoryStatus };
