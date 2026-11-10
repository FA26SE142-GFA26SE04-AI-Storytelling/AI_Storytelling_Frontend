import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type * as B from '@/app/types/backendContracts';
import {
  buildChangeRequestPayload,
  changeDialogReducer,
  changePartConfigs,
  changeTargetOptions,
  createChangeDialogState,
  submitChangeRequest,
  type ChangeReviewItem,
} from '@/app/features/staff/changeRequestOptions';
import ChangeRequestDialog from '@/app/features/staff/ChangeRequestDialog';

const publicStoryItem: ChangeReviewItem = {
  kind: 'PublicStoryReview',
  data: {
    itemId: 19,
    storyId: 44,
    storyVersionId: 100,
    versionNo: 4,
    isResubmission: false,
    proposedLabels: [],
    story: {
      title: 'Mái Nhà Ấm Áp',
      description: null,
      genre: 'Gia đình',
      ageBand: '9-10',
      readingLevel: 2,
      vocabularyLevel: 'Trung bình',
      language: 'vi',
      moralLesson: null,
      coverImageUrl: null,
      labels: [],
    },
    version: {
      title: 'Mái Nhà Ấm Áp',
      outlineOpening: null,
      outlineDevelopment: null,
      outlineEnding: null,
      content: 'Nội dung',
      lesson: null,
    },
    scenes: [
      {
        sceneId: 702,
        sceneIndex: 1,
        sceneText: 'Cảnh hai rất dài '.repeat(12),
        visualDescription: null,
        viewed: true,
        illustrations: [{ beatOrder: 1, visualFocus: 'Bà cháu', assetId: 8802, url: null }],
        segments: [{ segmentId: 9902, segmentOrder: 1, text: 'Cảnh hai', audioAssetId: 8902, audioUrl: null, hasPronunciationWarning: false, heard: true }],
      },
      {
        sceneId: 701,
        sceneIndex: 0,
        sceneText: '   ',
        visualDescription: 'Mưa rơi trước hiên nhà',
        viewed: true,
        illustrations: [{ beatOrder: 1, visualFocus: 'Mái hiên', assetId: 8801, url: null }],
        segments: [{ segmentId: 9901, segmentOrder: 1, text: 'Đoạn một', audioAssetId: 8901, audioUrl: null, hasPronunciationWarning: false, heard: true }],
      },
    ],
    vocabulary: [
      { id: 301, term: 'ấm áp', definition: 'Mang lại cảm giác dễ chịu' },
      { id: 302, term: 'ấm áp', definition: 'Mang lại cảm giác dễ chịu' },
    ],
    quizzes: [
      { id: 401, type: 'MultipleChoice', question: 'Ai đang nấu cháo?', correctAnswer: 'Minh', choices: '["Minh","Lan"]' },
      { id: 402, type: 'MultipleChoice', question: 'Ai đang nấu cháo?', correctAnswer: 'Bà nội', choices: '["Bà nội","Ông"]' },
    ],
    listeningInteractions: [
      {
        id: 501,
        type: 'Checkpoint',
        kind: null,
        storySceneId: 701,
        anchorOffset: 10,
        prompt: 'Bạn nhỏ cảm thấy thế nào khi trời mưa?',
        sourceQuote: 'Trời đổ cơn mưa rào.',
        characterName: 'Minh',
        hiddenWord: null,
        hint: null,
        revealOffset: null,
        explanation: null,
        matchFeedback: null,
        noMatchFeedback: null,
        waitFeedback: null,
        options: [],
      },
      {
        id: 502,
        type: 'FillBlank',
        kind: null,
        storySceneId: 702,
        anchorOffset: 20,
        prompt: '   ',
        sourceQuote: 'Cậu mang cháo lên bàn cho bà.',
        characterName: null,
        hiddenWord: 'cháo',
        hint: null,
        revealOffset: null,
        explanation: null,
        matchFeedback: null,
        noMatchFeedback: null,
        waitFeedback: null,
        options: [],
      },
      {
        id: 503,
        type: 'PicturePrediction',
        kind: null,
        storySceneId: 702,
        anchorOffset: 30,
        prompt: null,
        sourceQuote: '',
        characterName: null,
        hiddenWord: null,
        hint: null,
        revealOffset: null,
        explanation: null,
        matchFeedback: null,
        noMatchFeedback: null,
        waitFeedback: null,
        options: [],
      },
    ],
    discussionQuestions: [],
    flags: [],
    allFlagsResolved: true,
    progress: { totalScenes: 2, missingSceneIds: [], audioHeardCount: 2, missingWarningSegmentIds: [], needsAtLeastOneAudio: false, requiredViewsComplete: true },
    checklist: { safety: true, ageFit: true, education: true, language: true, copyright: true, image: true, audio: true, interaction: true },
    approveBlockers: [],
    canApprove: true,
    previousModeratorName: null,
    reviewHistory: [],
  },
};

const roadmapItem: ChangeReviewItem = {
  kind: 'RoadmapTemplateReview',
  data: {
    itemId: 88,
    roadmap: {
      id: 12,
      name: 'Lộ trình yêu thương',
      description: null,
      ageBand: '6-8',
      mainCategory: null,
      readingLevelMin: 1,
      readingLevelMax: 3,
      defaultDaysPerStory: 3,
      createdByUserId: 2,
      createdByName: 'Mod A',
      submittedAt: '2026-11-10T07:00:00Z',
      clonedFromId: null,
    },
    stories: [
      { storyId: 202, position: 2, days: 4, title: null, ageBand: '6-8', readingLevel: 2, isEligible: false },
      { storyId: 201, position: 1, days: 3, title: 'Chiếc Lá Đầu Tiên', ageBand: '6-8', readingLevel: 1, isEligible: true },
    ],
    checks: [],
    checklist: [],
    blockers: [],
    canApprove: false,
    claimExpiresAt: '2026-11-10T18:00:00Z',
  },
};

describe('ChangeRequestDialog target selection & contract mapping', () => {
  it('maps scene_text, scene_image, and scene_audio to sceneId instead of assetId or segmentId', () => {
    for (const partType of ['scene_text', 'scene_image', 'scene_audio'] as const) {
      const opts = changeTargetOptions(publicStoryItem, partType);
      expect(opts.map(o => o.id)).toEqual([701, 702]);
      expect(opts[0].label).toContain('Cảnh 1');
      expect(opts[0].label).not.toContain('701');
      expect(opts[0].label).not.toContain('8801');
      expect(opts[0].label).not.toContain('9901');
      expect(opts[1].label).toContain('Cảnh 2');

      const payload = buildChangeRequestPayload(publicStoryItem, partType, String(opts[0].id), 'Cần chỉnh lại cảnh');
      expect(payload).toEqual({
        ok: true,
        kind: 'PublicStoryReview',
        body: {
          generalNote: 'Cần chỉnh lại cảnh',
          parts: [{ partType, partId: 701, note: 'Cần chỉnh lại cảnh' }],
        },
      });
    }
  });

  it('maps quizzes, duplicate vocabulary, and listening fallbacks cleanly with full previews', () => {
    const quizOpts = changeTargetOptions(publicStoryItem, 'quiz');
    expect(quizOpts.map(o => o.id)).toEqual([401, 402]);
    expect(quizOpts[0].label).not.toBe(quizOpts[1].label);
    expect(quizOpts[0].previewMeta).toContain('Minh');
    expect(quizOpts[1].previewMeta).toContain('Bà nội');
    expect(buildChangeRequestPayload(publicStoryItem, 'quiz', '402', 'Sửa đáp án')).toEqual({
      ok: true,
      kind: 'PublicStoryReview',
      body: { generalNote: 'Sửa đáp án', parts: [{ partType: 'quiz', partId: 402, note: 'Sửa đáp án' }] },
    });

    const vocabOpts = changeTargetOptions(publicStoryItem, 'vocabulary');
    expect(vocabOpts.map(o => o.id)).toEqual([301, 302]);
    expect(vocabOpts[0].label).toContain('ấm áp');
    expect(vocabOpts[0].label).not.toBe(vocabOpts[1].label);

    const listeningOpts = changeTargetOptions(publicStoryItem, 'listening');
    expect(listeningOpts.map(o => o.id)).toEqual([501, 502, 503]);
    expect(listeningOpts[0].label).toContain('Câu hỏi giữa truyện');
    expect(listeningOpts[0].label).toContain('Bạn nhỏ cảm thấy thế nào');
    expect(listeningOpts[1].label).toContain('Điền từ');
    expect(listeningOpts[1].label).toContain('Cậu mang cháo lên bàn cho bà.');
    expect(listeningOpts[2].label).toBe('Đoán tranh #3');

    expect(buildChangeRequestPayload(publicStoryItem, 'listening', '502', 'Sửa từ ẩn')).toEqual({
      ok: true,
      kind: 'PublicStoryReview',
      body: { generalNote: 'Sửa từ ẩn', parts: [{ partType: 'listening', partId: 502, note: 'Sửa từ ẩn' }] },
    });
  });

  it('maps roadmap stories sorted by position with action=replace and general parts with null IDs/action', () => {
    const storyOpts = changeTargetOptions(roadmapItem, 'story');
    expect(storyOpts.map(o => o.id)).toEqual([201, 202]);
    expect(storyOpts[0].label).toContain('Vị trí 1');
    expect(storyOpts[0].label).toContain('Chiếc Lá Đầu Tiên');
    expect(storyOpts[0].label).not.toContain('201');
    expect(storyOpts[1].label).toContain('Vị trí 2');
    expect(storyOpts[1].previewMeta).toContain('Không còn đủ điều kiện');

    expect(buildChangeRequestPayload(roadmapItem, 'story', '202', 'Thay truyện phù hợp hơn')).toEqual({
      ok: true,
      kind: 'RoadmapTemplateReview',
      body: {
        generalNote: 'Thay truyện phù hợp hơn',
        parts: [{ partType: 'story', storyId: 202, action: 'replace', note: 'Thay truyện phù hợp hơn' }],
      },
    });

    for (const generalType of ['name_description', 'order', 'age_level']) {
      expect(buildChangeRequestPayload(roadmapItem, generalType, '202', 'Sửa chung')).toEqual({
        ok: true,
        kind: 'RoadmapTemplateReview',
        body: {
          generalNote: 'Sửa chung',
          parts: [{ partType: generalType, storyId: null, action: null, note: 'Sửa chung' }],
        },
      });
    }

    expect(buildChangeRequestPayload(publicStoryItem, 'metadata', '701', 'Sửa mô tả')).toEqual({
      ok: true,
      kind: 'PublicStoryReview',
      body: { generalNote: 'Sửa mô tả', parts: [{ partType: 'metadata', partId: null, note: 'Sửa mô tả' }] },
    });
  });

  it('clears selection on partType change, never auto-picks first item, and resets when switching items', () => {
    let state = createChangeDialogState(publicStoryItem, 'Ghi chú ban đầu');
    expect(state.partType).toBe('metadata');
    expect(state.targetId).toBe('');

    state = changeDialogReducer(state, { type: 'setPartType', partType: 'quiz' });
    expect(state.partType).toBe('quiz');
    expect(state.targetId).toBe('');

    state = changeDialogReducer(state, { type: 'setTargetId', targetId: '401' });
    expect(state.targetId).toBe('401');

    state = changeDialogReducer(state, { type: 'setPartType', partType: 'listening' });
    expect(state.partType).toBe('listening');
    expect(state.targetId).toBe('');

    state = changeDialogReducer(state, { type: 'setPartType', partType: 'metadata' });
    expect(changePartConfigs('PublicStoryReview').find(c => c.value === state.partType)?.requiresTarget).toBe(false);

    state = changeDialogReducer(state, { type: 'reset', item: roadmapItem, initialNote: '' });
    expect(state.partType).toBe('name_description');
    expect(state.targetId).toBe('');
    expect(state.note).toBe('');
  });

  it('handles empty lists, stale target IDs, failure preservation, success closing, and double-submit guard', async () => {
    const emptyQuizStory: ChangeReviewItem = {
      kind: 'PublicStoryReview',
      data: { ...publicStoryItem.data as B.PublicReviewPackageDto, quizzes: [] },
    };
    const emptyPayload = buildChangeRequestPayload(emptyQuizStory, 'quiz', '', 'Cần thêm câu đố');
    expect(emptyPayload.ok).toBe(false);

    const stalePayload = buildChangeRequestPayload(publicStoryItem, 'quiz', '999999', 'Không còn tồn tại');
    expect(stalePayload.ok).toBe(false);

    // Thất bại API -> giữ lựa chọn & ghi chú, không gọi onSuccessClose.
    let release!: (ok: boolean) => void;
    const send = vi.fn(() => new Promise<boolean>(r => { release = r; }));
    const onSuccessClose = vi.fn();
    let busyState = false;
    const p1 = submitChangeRequest(send, () => busyState, b => { busyState = b; }, onSuccessClose);
    const p2 = submitChangeRequest(send, () => busyState, b => { busyState = b; }, onSuccessClose);
    expect(send).toHaveBeenCalledTimes(1);
    expect(busyState).toBe(true);
    release(false);
    expect(await p1).toBe(false);
    expect(await p2).toBe(false);
    expect(busyState).toBe(false);
    expect(onSuccessClose).not.toHaveBeenCalled();

    // Thành công API -> đóng hộp thoại.
    const sendOk = vi.fn().mockResolvedValue(true);
    expect(await submitChangeRequest(sendOk, () => busyState, b => { busyState = b; }, onSuccessClose)).toBe(true);
    expect(onSuccessClose).toHaveBeenCalledTimes(1);
  });

  it('renders ChangeRequestDialog cleanly with hidden target select for general parts, empty notice, and full preview for targets', () => {
    const htmlGeneral = renderToStaticMarkup(
      <ChangeRequestDialog
        open
        item={publicStoryItem}
        initialNote="Ghi chú"
        busy={false}
        onClose={() => {}}
        onSubmit={async () => true}
      />,
    );
    expect(htmlGeneral).toContain('Yêu cầu chỉnh sửa');
    expect(htmlGeneral).toContain('Thông tin chung');
    expect(htmlGeneral).not.toContain('Chọn nội dung cần sửa');
    expect(htmlGeneral).not.toContain('type="number"');

    const emptyRoadmap: ChangeReviewItem = {
      kind: 'RoadmapTemplateReview',
      data: { ...(roadmapItem.data as B.RoadmapReviewPackageDto), stories: [] },
    };
    const htmlEmptyRoadmap = renderToStaticMarkup(
      <ChangeRequestDialog
        open
        item={emptyRoadmap}
        initialNote="Cần thêm truyện"
        initialPartType="story"
        busy={false}
        onClose={() => {}}
        onSubmit={async () => true}
      />,
    );
    expect(htmlEmptyRoadmap).toContain('Lộ trình này chưa có truyện nào để yêu cầu sửa.');
    expect(htmlEmptyRoadmap).toContain('disabled');

    const htmlPreview = renderToStaticMarkup(
      <ChangeRequestDialog
        open
        item={publicStoryItem}
        initialNote="Sửa cảnh này"
        initialPartType="scene_text"
        initialTargetId="702"
        busy={false}
        errorMessage="Lỗi từ backend"
        onClose={() => {}}
        onSubmit={async () => true}
      />,
    );
    expect(htmlPreview).toContain('Cảnh 2');
    expect(htmlPreview).toContain('Cảnh hai rất dài');
    expect(htmlPreview).toContain('Lỗi từ backend');
    expect(htmlPreview).toContain('maxLength="1000"');
  });
});
