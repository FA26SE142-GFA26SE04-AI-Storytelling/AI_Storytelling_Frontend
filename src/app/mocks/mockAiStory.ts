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

export const mockAiStory = {
  async getCreationContext(childId: number): R<D.AIStoryInputContextDto> {
    await delay();
    const c = MOCK_CHILDREN.find((x) => x.id === childId);
    if (!c) return fail('Không tìm thấy hồ sơ bé.');
    const older = c.ageBand === 'Age_9_12';
    return ok({
      childProfileId: c.id, childNickname: c.nickname, ageBand: c.ageBand, readingLevel: older ? 3 : 2,
      defaultVocabularyLevel: older ? 'level_3' : 'level_2', availableVocabularyLevels: ['level_1', 'level_2', 'level_3', 'level_4', 'level_5'],
      defaultLanguage: 'vi', availableLanguages: ['vi', 'en'], maximumLength: older ? 1200 : 800, requiredApprovalMode: 'AlwaysManual',
      parentalGateEnabled: true, safetyScoreThreshold: 0.8, readabilityScoreThreshold: null, comprehensionGoal: null,
      comprehensionThresholdPercent: null, comprehensionWindowSize: 5, interests: MOCK_INTERESTS[c.id] ?? [],
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

  async partialEditStory(): R<D.CreateProposalResponseDto> { return fail('Chế độ dữ liệu mẫu chưa hỗ trợ chỉnh sửa bằng AI.'); },
  async regenerateReviewArtifact(): R<D.CreateProposalResponseDto> { return fail('Chế độ dữ liệu mẫu chưa hỗ trợ tạo lại bằng AI.'); },
  async getProposal(): R<D.AIProposalDto> { return fail('Không có đề xuất nào.'); },
  async applyProposal(): R<D.ApplyDiscardResponseDto> { return fail('Không có đề xuất nào.'); },
  async discardProposal(): R<D.ApplyDiscardResponseDto> { return ok({ success: true, message: '' }); },

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
