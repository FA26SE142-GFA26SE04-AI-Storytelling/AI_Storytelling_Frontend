/**
 * Smoke test các luồng chính của giao diện hiện tại (thay bộ backend-api-integration cũ đã lỗi thời).
 * Chạy trên trình duyệt thật (Edge) với Frontend đang chạy; mọi API đều giả lập ngay trong file này, không cần Backend.
 *
 *   FRONTEND_SMOKE_URL=http://localhost:3000 node tests/smoke/core-flows.mjs
 *   SMOKE_CASES=KidHome,ParentHandover node tests/smoke/core-flows.mjs   (chỉ chạy vài trường hợp)
 *
 * Mỗi trường hợp hỏng được ghi lại (kèm nút / chữ đang chờ) rồi chạy tiếp; ảnh chụp nằm ở out/core-flows-smoke/.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.FRONTEND_SMOKE_URL || 'http://localhost:3107';
const output = new URL('../../out/core-flows-smoke/', import.meta.url);
await mkdir(output, { recursive: true });

const now = '2026-11-09T00:00:00Z';
/** Ảnh SVG một màu nhúng sẵn (không tải từ mạng). */
const pictureUrl = (color) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="${color}"/></svg>`)}`;
/** File WAV im lặng dài vài giây (8 kHz, 8 bit) để thử giọng đọc mà không cần âm thanh thật. */
const silentWav = (seconds) => {
  const rate = 8000, n = rate * seconds, b = Buffer.alloc(44 + n);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44);
  return `data:audio/wav;base64,${b.toString('base64')}`;
};
const sceneText = 'Thỏ ra vườn. Thỏ thấy cà rốt. Thỏ chia cho bạn.';
/** Mốc thời gian từng chữ, mỗi chữ cách nhau 0,25 giây. */
const timingsOf = (text) => JSON.stringify(text.split(' ').map((word, i) => ({ word: word.replace(/[.,]$/, ''), start: i * 0.25, end: (i + 1) * 0.25 })));
/** Hai đoạn âm thanh: đoạn 1 (vị trí 0–29) có chữ "Thỏ" thứ hai ở vị trí 13 lúc 0,75 giây (tranh 2); đoạn 2 bắt đầu ở vị trí 30 (tranh 3). */
const part1 = 'Thỏ ra vườn. Thỏ thấy cà rốt.', part2 = 'Thỏ chia cho bạn.';
const paged = (items) => ({ items, pageIndex: 1, pageSize: 20, totalCount: items.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
const sen = { id: 10, ownerUserId: 1, nickname: 'Bé Sen', ageBand: 'Age_6_8', language: 'vi', avatarId: 'frog', status: 'Active', createdAt: now };
const lan = { id: 11, ownerUserId: 1, nickname: 'Bé Lan', ageBand: 'Age_9_10', language: 'vi', avatarId: 'frog', status: 'Active', createdAt: now };
const story = { id: 7, title: 'Ếch con khám phá', content: 'Ếch con đọc truyện.', ageBand: '6-8', status: 'Ready', isPublished: true, source: 'Ai', genre: 'Khám phá', createdAt: now, authorUserId: 1, language: 'vi', description: 'Một câu chuyện mẫu', moralLesson: null, coverImageUrl: null };
const waiting = { ...story, id: 8, title: 'Truyện chờ duyệt', status: 'ContentReview', isPublished: false };
const draft = { storyId: 7, authorUserId: 1, title: story.title, description: '', language: 'vi', ageBand: '6-8', genre: 'Khám phá', experienceMode: 'reading', audienceRevision: 1, revisionToken: 'r1', selectedVersionId: 12, lastVersionNo: 1, createdAt: now, updatedAt: null, source: 'Manual', status: 'Draft' };

/** Chi tiết bộ lộ trình mẫu giả, dựng từ những gì Moderator đã gửi lên. */
const roadmapDetail = (state) => ({ id: 40, name: state.rtCreated?.name ?? '', description: state.rtCreated?.description ?? null, ageBand: '6-8', mainCategory: { id: 1, code: 'nature', displayName: 'Thiên nhiên' },
  readingLevelMin: state.rtCreated?.readingLevelMin ?? 1, readingLevelMax: state.rtCreated?.readingLevelMax ?? 3, defaultDaysPerStory: state.rtCreated?.defaultDaysPerStory ?? 3,
  status: state.rtSubmitted ? 'PendingReview' : 'Draft', createdByUserId: 1, createdByName: null, isMine: true, submittedAt: null, publishedAt: null, clonedFromId: null,
  stories: (state.rtItems ?? []).map((i, k) => ({ storyId: i.storyId, position: k + 1, days: i.days, title: i.storyId === 7 ? story.title : 'Truyện thứ hai', ageBand: '6-8', readingLevel: 2, isEligible: true })),
  checks: [{ code: 'has_stories', passed: !!state.rtItems?.length, message: 'Có ít nhất 2 truyện', relatedRoadmapId: null }],
  canSubmit: (state.rtItems?.length ?? 0) >= 2, lastReview: null, needsUpdate: false, retiredStoryIds: [] });

/** Điều ước bố mẹ đã chọn "Tạo truyện mới": truyện 50 đang được tạo. */
const makingWish = { wishId: 6, childProfileId: 10, kind: 'Wish', status: 'Accepted', cards: [{ id: 2, group: 'Place', label: 'Khu rừng', imageUrl: '', audioUrl: null }], lessonLeftToParent: false, submittedAt: now, expiresAt: null, declineReason: null, resolutionNote: null, generatedStoryId: 50, fulfilledStoryId: null, fulfilledWithExistingStory: false, resolvedAt: null };

/** Cảnh 2 không có tranh riêng (chỉ illustrationUrl), cảnh 3 có ảnh hỏng để thử ảnh mặc định. */
const extraScenes = [2, 3].map((n) => ({ sceneId: n, sceneIndex: n - 1, text: `Cảnh ${n}.`, illustrationUrl: n === 2 ? pictureUrl('#9c6') : 'http://broken.invalid/x.png', illustrations: [], interaction: null, attemptedInSession: false,
  segments: [{ segmentOrder: 1, startOffset: 0, endOffset: 7, text: `Cảnh ${n}.`, audioUrl: silentWav(1), wordTimingsJson: timingsOf(`Cảnh ${n}.`) }] }));
/** Hai câu bé hỏi: một câu về tranh 1 (chữ + ghi âm), một câu về cả cảnh 2 có ảnh hỏng. */
const questions = [
  { questionId: 1, beatOrder: 1, pictureText: 'Thỏ ra vườn.', questionText: 'Sao thỏ lại ra vườn?', questionAudioUrl: silentWav(1), askedAt: now, answeredAt: null, sceneId: 1, sceneIndex: 0, sceneText, illustrationUrl: pictureUrl('#7cc') },
  { questionId: 2, beatOrder: null, pictureText: null, questionText: null, questionAudioUrl: null, askedAt: now, answeredAt: null, sceneId: 2, sceneIndex: 1, sceneText: 'Thỏ về nhà.', illustrationUrl: 'http://broken.invalid/x.png' },
];
const creatorApps = [
  { id: 1, applicantUserId: 21, applicantUsername: 'sangtac', applicantFullName: 'Lê Sáng Tác', applicantEmail: 'sangtac@example.invalid', applicantStatus: 'AwaitingApproval', introduction: 'Tôi viết truyện thiếu nhi về thiên nhiên và tình bạn đã 5 năm.', portfolioUrl: 'https://example.invalid/portfolio', status: 'Pending', createdAt: now, reviewedAt: null, reviewedByName: null, rejectionReason: null },
  { id: 2, applicantUserId: 22, applicantUsername: 'chuaxacthuc', applicantFullName: 'Trần Chưa Xác Thực', applicantEmail: 'chua@example.invalid', applicantStatus: 'Registered', introduction: 'Tôi là giáo viên tiểu học, thích kể chuyện cho học sinh.', portfolioUrl: null, status: 'Pending', createdAt: now, reviewedAt: null, reviewedByName: null, rejectionReason: null },
];
const creatorAccounts = [
  { id: 21, username: 'nguyencreator', fullName: 'Nguyễn Creator', email: 'nc@example.invalid', status: 'Active', publishedStoryCount: 4, createdAt: now, lastLoginAt: now },
  { id: 23, username: 'tamkhoa', fullName: 'Phạm Tạm Khoá', email: 'tk@example.invalid', status: 'Suspended', publishedStoryCount: 0, createdAt: now, lastLoginAt: null },
];

/** Chụp ở 3 độ rộng và báo nếu nội dung trong vùng `scope` tràn ra ngoài màn hình. */
async function shots(page, name, scope = 'body') {
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(300);
    if (scope !== 'body') await page.locator(scope).first().scrollIntoViewIfNeeded();
    // Bỏ qua lớp trang trí (aria-hidden, ví dụ lá sen nền) và phần nằm trong khung cuộn ngang vừa màn hình (bảng .st-scroll):
    // chỉ nội dung thật lòi ra ngoài màn hình mới tính là tràn.
    const culprits = await page.evaluate((scope) => {
      const W = window.innerWidth + 1;
      const contained = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).overflowX !== 'visible' && p.getBoundingClientRect().right <= W) return true; return false; };
      return [...document.querySelectorAll(`${scope} *`)].filter((el) => !el.closest('[aria-hidden="true"]') && el.getBoundingClientRect().right > W && !contained(el))
        .slice(0, 6).map((el) => `${el.tagName.toLowerCase()}.${String(el.getAttribute('class') ?? '').split(' ')[0]}`);
    }, scope);
    assert(!culprits.length, `${name} @${width}px có nội dung tràn ngang: ${culprits.join(', ')}`);
    await page.screenshot({ path: new URL(`${name}-${width}.png`, output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

/** API giả cho mọi trường hợp. Trả `undefined` thì rơi xuống 404 "chức năng không nằm trong smoke test". */
function api({ path, method, body, url, state }) {
  switch (true) {
    case path === '/Auth/me': return state.user;
    case path === '/Auth/sessions': return state.manySessions ? Array.from({ length: 12 }, (_, i) => ({ id: i + 1, issuedAt: now, expiresAt: '2026-11-16T00:00:00Z' })).filter((s) => s.id !== state.revoked) : [];
    case path.startsWith('/Auth/sessions/') && method === 'DELETE': state.revoked = Number(path.split('/').pop()); return null;
    case path === '/Notification/unread-count': return 0;
    case path === '/Notification': return [];
    case path === '/ChildProfile/mine': return [sen, lan];
    case path.startsWith('/SafetyPolicy/'): return { childProfileId: 10, maxStoryLength: 2000, parentalGateEnabled: false, categories: [] };
    case path.startsWith('/LearningProfile/'): return { childProfileId: 10, readingLevel: 2, readingMode: 'ReadFirst', topics: [] };
    case path === '/ContentCategory': return [{ id: 1, code: 'nature', displayName: 'Thiên nhiên', isActive: true }];
    case path === '/Story': return paged([story, waiting]);
    // Truyện cộng đồng (của Creator) mã 9: GET /Story/9 không tìm thấy, ảnh bìa chỉ có ở danh sách cộng đồng.
    case path === '/Story/community': return paged([{ ...story, id: 9, title: 'Truyện thứ hai', source: 'Creator', coverImageUrl: pictureUrl('#e96') }]);
    case path === '/Story/7': return story;
    case path === '/parent/stories': return paged([]);
    // Học tập của bé
    case path === '/ChildRoadmap/10' && method === 'GET': return { childProfileId: 10, openItems: [{ id: 55, storyId: 7, title: 'Ếch con trong lộ trình', position: 0, status: 'Open', source: 'Manual', skipReason: null, note: 'Đọc cùng mẹ', expectedDays: 7, expectedCompletionAt: null, openedAt: now, completedAt: null, addedByUserId: 1, isStoryAvailable: true }], currentStage: 0, waiting: [], history: [], completedCount: 2, totalCount: 3 };
    case path.startsWith('/ChildRoadmap/') && method === 'GET': return { childProfileId: 11, openItems: [], currentStage: null, waiting: [], history: [], completedCount: 0, totalCount: 0 };
    case path === '/ChildRoadmap/stories': state.added = body; return { results: [{ childProfileId: 10, outcome: 'Added', itemId: 90, warnings: [], skipCode: null, message: null }] };
    case path === '/RoadmapLibrary': return paged([{ id: 2, name: 'Bộ khám phá', description: 'Bộ truyện mẫu', ageBand: '6-8', mainCategory: { id: 1, code: 'nature', displayName: 'Thiên nhiên' }, readingLevelMin: 1, readingLevelMax: 3, defaultDaysPerStory: 3, storyCount: 1, needsUpdate: false, publishedAt: now }]);
    case path === '/RoadmapLibrary/2': return { id: 2, name: 'Bộ khám phá', description: 'Bộ truyện mẫu', ageBand: '6-8', mainCategory: { id: 1, code: 'nature', displayName: 'Thiên nhiên' }, readingLevelMin: 1, readingLevelMax: 3, defaultDaysPerStory: 3, storyCount: 1, needsUpdate: false, publishedAt: now, stories: [{ storyId: 7, position: 1, days: 3, title: story.title, ageBand: '6-8', readingLevel: 2, isAvailable: true }] };
    case path === '/RoadmapLibrary/2/preview' || path === '/RoadmapLibrary/2/copy':
      if (path.endsWith('copy')) state.copied = body;
      return { roadmapId: 2, roadmapName: 'Bộ khám phá', children: [{ childProfileId: 10, outcome: path.endsWith('preview') ? 'Copy' : 'Copied', skipCode: null, message: null, steps: [{ storyId: 7, title: story.title, position: 1, days: 3, action: 'Copy', skipCode: null, message: null }], warnings: ['reading_level_outside_range'] }] };
    // Ba lần đọc truyện 7 và một lần truyện 8: danh sách phải gộp thành 2 thẻ.
    case path === '/ParentReadingFeedback/10' && state.grouped: return paged([3, 2, 1].map((n) => ({ sessionId: 100 + n, storyId: 7, title: 'Sóc Bông và Thỏ Trắng', completedAt: now, startedAt: now, feeling: 'Like', feelingLabel: 'Thích', quizTotalQuestions: 5, quizBestPercent: 54, timeSpentSeconds: 60 * n, pagesCompleted: 3, totalPages: 4, readCount: 3, readOrdinal: n, status: 'Completed', expEarned: 0 }))
      .concat([{ sessionId: 200, storyId: 8, title: 'Rùa và thỏ', completedAt: now, startedAt: now, feeling: null, feelingLabel: null, quizTotalQuestions: 0, quizBestPercent: null, timeSpentSeconds: 180, pagesCompleted: 2, totalPages: 3, readCount: 1, readOrdinal: 1, status: 'Completed', expEarned: 10 }]));
    case path === '/ParentReadingFeedback/10': return paged([{ sessionId: 1, storyId: 7, title: 'Truyện đã đọc xong', completedAt: now, feeling: 'VeryLike', feelingLabel: 'Rất thích', quizTotalQuestions: 5, quizBestPercent: 90, conversationAnswers: [{ question: 'Em thấy thế nào?', kind: 'Emotion', answerText: 'Vui lắm', sceneIndex: 0, answeredAt: now }],
      retell: { summaryId: 3, createdAt: now, hasRecording: false, flagCount: state.withQuestions ? 2 : 0, unansweredCount: state.withQuestions ? 2 : 0 }, quizRunCount: 1, quizLatestPercent: 80,
      ...(state.withReflection ? { emotions: [{ code: 'Happy', label: 'Vui' }, { code: 'Touched', label: 'Cảm động' }], reflection: state.noteRemoved ? { favoriteSceneId: 1, favoriteSceneIndex: 0, hasNoteText: false, hasNoteRecording: false } : { favoriteSceneId: 1, favoriteSceneIndex: 0, hasNoteText: true, hasNoteRecording: true },
        readAloudRecordingCount: 2, readAloudPractice: { attempts: 2, totalWords: 5, latestGoodWords: 4, latestGoodPercent: 80, bestGoodPercent: 100 } } : {}) }]);
    // Nghe bé đọc và cảm nhận sau khi đọc (phiên 1).
    case path === '/ParentReadingFeedback/10/overview' && state.withReflection: return { from: null, to: null, completedSessions: 1, distinctStoriesCompleted: 1, unfinishedStories: 0, totalTimeSpentSeconds: 300, quizStoriesTaken: 1, averageQuizBestPercent: 90, feelingCounts: { VeryLike: 1, Like: 0, Neutral: 0, Dislike: 0, None: 0 }, emotionCounts: { Happy: 1, Funny: 0, Surprised: 0, Excited: 0, Touched: 1, Sad: 0, Scared: 0 }, expEarned: 10, wordsCollected: 0, readAloudGoodPercent: 80, retellCount: 1 };
    case path === '/ParentReadingFeedback/10/sessions/1/read-aloud': return { sessionId: 1, recordings: [
      { recordingId: 5, kind: 'Segment', segmentId: 41, interactionId: null, sceneIndex: 0, segmentOrder: 1, text: part1, goodCount: 5, retryCount: 1, skippedCount: 0, totalCount: 6, goodPercent: 83, audioUrl: silentWav(1), recordedAt: now },
      { recordingId: 6, kind: 'Practice', segmentId: null, interactionId: 9, sceneIndex: null, segmentOrder: null, text: part2, goodCount: 4, retryCount: 0, skippedCount: 0, totalCount: 4, goodPercent: 100, audioUrl: silentWav(1), recordedAt: now }].filter((r) => r.recordingId !== state.removedRec) };
    case path === '/ParentReadingFeedback/10/sessions/1/read-aloud/5': state.removedRec = 5; return null;
    case path === '/ParentReadingFeedback/10/sessions/1/reflection' && method === 'GET': return { sessionId: 1, emotions: [{ code: 'Happy', label: 'Vui' }, { code: 'Touched', label: 'Cảm động' }], favoriteScene: { sceneId: 1, sceneIndex: 0, sceneText, illustrationUrl: pictureUrl('#7cc') },
      noteText: state.noteRemoved ? null : 'Con thích lúc thỏ chia cà rốt', noteAudioUrl: state.noteRemoved ? null : silentWav(1), noteSentAt: state.noteRemoved ? null : now };
    case path === '/ParentReadingFeedback/10/sessions/1/reflection/note': state.noteRemoved = true; return null;
    case path === '/ParentStorySummary/10': return paged(state.summaryDeleted ? [] : [{ summaryId: 3, sessionId: 1, storyId: 7, title: 'Truyện bé kể lại', createdAt: now, recordingUrl: null, recordingSentAt: null, flagsSentAt: now, unansweredCount: state.withQuestions ? 2 : 0, flags: state.withQuestions ? questions : [] }]);
    case /^\/ParentStorySummary\/10\/3\/questions\/\d+\/answered$/.test(path): state.answered = body; return { questionId: Number(path.split('/')[5]), answeredAt: body.answered ? now : null };
    case path === '/ParentStorySummary/10/3' && method === 'DELETE': state.summaryDeleted = true; return null;
    case path === '/parent/wishes' && url.searchParams.get('childProfileId') === '10': return [...(state.declined ? [] : [{ wishId: 5, childProfileId: 10, kind: 'Story', status: 'Pending', cards: [{ id: 1, group: 'Character', label: 'Thỏ con', imageUrl: '', audioUrl: null }], lessonLeftToParent: false, submittedAt: now, expiresAt: '2099-01-01T00:00:00Z', declineReason: null, resolutionNote: null, generatedStoryId: null, fulfilledStoryId: null, fulfilledWithExistingStory: false, resolvedAt: null }]), makingWish];
    case path === '/parent/wishes/6': return { wish: makingWish, suggestions: { wishId: 6, items: [], emptyMessage: null } };
    case path === '/parent/wishes/6/generation': return { storyId: 50, outputMode: 'learning', requestId: 3, inputStatus: 'input_accepted', handoffStatus: 'Completed', handoffJobId: null, attemptCount: 1, maxAttempts: 3, reasonCode: null, fallbackMessage: null, canRetry: false, createdAt: now, updatedAt: now };
    case path === '/parent/wishes': return [];
    case path === '/parent/wishes/5/suggestions': return { wishId: 5, items: [{ rank: 1, storyId: 7, communitySubmissionId: null, title: story.title, coverImageUrl: null, matchedCards: [], opened: false, completed: true, feeling: 'Like', feelingLabel: 'Thích', hint: null }], emptyMessage: null };
    case path === '/parent/wishes/5/decline': state.declined = body; return null;
    // Cho bé đọc truyện này (Luồng 1c)
    case path === '/ChildAccessCredential/story-handover': return { storyId: Number(url.searchParams.get('storyId')), suggestedChildProfileId: 10, children: [{ childProfileId: 10, nickname: 'Bé Sen', canRead: true, skipCode: null, message: null }, { childProfileId: 11, nickname: 'Bé Lan', canRead: false, skipCode: 'wrong_age', message: 'Truyện không hợp nhóm tuổi của bé.' }] };
    case path === '/ChildAccessCredential/10/handover-story': state.handover = body; return { childProfileId: 10, avatarId: 'frog', accessToken: 'child-fixture', expiresInSeconds: 3600, storyId: body.storyId };
    // Phía bé
    case path === '/ChildAccessCredential/easylogin/login': return { childProfileId: 10, avatarId: 'frog', accessToken: 'child-fixture', expiresInSeconds: 3600 };
    case path === '/ChildAccessCredential/me': return { childProfileId: 10, nickname: 'Bé Sen', ageBand: 'Age_6_8', avatarId: 'frog', language: 'vi' };
    case path === '/MyRoadmap': return { openStories: [{ stage: 2, storyId: 7, title: 'Ếch con hôm nay', coverImageUrl: null, note: 'Mẹ chọn cho con', expectedBy: null, isLocked: false }], upcoming: [{ order: 2, storyId: 9, title: 'Truyện tiếp theo', coverImageUrl: null, isLocked: true }], done: [{ stage: 1, storyId: 6, title: 'Truyện đã đọc', coverImageUrl: null, completedAt: now }], completedCount: 1, totalCount: 3, isFinished: false };
    case path === '/child/manual-stories': return [];
    case path === '/child/reading/stories': return { isLocked: false, unlockStoryId: null, message: null, items: [{ storyId: 7, title: story.title, coverImageUrl: null, description: null, source: 'roadmap' }], totalCount: 1, pageIndex: 1, pageSize: 20 };
    case path === '/child/notebook': return [];
    case path === '/child/reading/sessions' && method === 'POST': state.reading = body; return { sessionId: 31, storyId: body.storyId, resumed: false, lastPage: 1, lastReadingMode: 'ListenFirst', isBookmarked: false, isFavorited: false };
    // Cảnh đầu có 3 tranh (mỗi tranh một đoạn chữ); ảnh là SVG nhúng để không cần tải từ ngoài.
    case path === '/child/reading/sessions/31/content': return { sessionId: 31, storyId: 7, title: story.title, lesson: null, listenOnly: false, vocabulary: [],
      readAloudPractice: state.withPractice ? { interactionId: 9, text: part2, audioUrl: silentWav(1), praiseFeedback: null, praiseAudioUrl: null } : null,
      scenes: [{ sceneId: 1, sceneIndex: 0, text: 'Thỏ ra vườn. Thỏ thấy cà rốt. Thỏ chia cho bạn.', illustrationUrl: pictureUrl('#7cc'), interaction: null, attemptedInSession: false,
        illustrations: [{ beatOrder: 1, startOffset: 0, endOffset: 12, url: pictureUrl('#7cc') }, { beatOrder: 2, startOffset: 13, endOffset: 29, url: pictureUrl('#fc7') }, { beatOrder: 3, startOffset: 30, endOffset: 48, url: pictureUrl('#c7f') }],
        segments: [{ segmentOrder: 1, startOffset: 0, endOffset: 29, text: part1, audioUrl: silentWav(2), wordTimingsJson: timingsOf(part1) },
          { segmentOrder: 2, startOffset: 30, endOffset: 48, text: part2, audioUrl: silentWav(1), wordTimingsJson: timingsOf(part2) }] }, ...(state.multiScene ? extraScenes : [])]
        // Nhiều cảnh: bỏ giọng kể để lật trang không bị giọng đọc kéo tranh về.
        .map((s) => (state.multiScene ? { ...s, segments: s.segments.map((g) => ({ ...g, audioUrl: null })) } : s)) };
    case path === '/child/reading/sessions/31/progress': return { sessionId: 31, page: body.page, readingMode: body.readingMode, timeSpentSeconds: 0 };
    case path === '/child/reading/sessions/31/complete': return { sessionId: 31, storyId: 7, isRetake: false, roadmapStepCompleted: false, expGained: 10, newBadges: [] };
    case path === '/child/reading/sessions/31/summary/questions': state.asked = (state.asked ?? 0) + 1; return { summaryId: 3, questionId: state.asked, message: 'Đã gửi cho bố mẹ' };
    // Cảm nhận sau khi đọc: lưu lại những gì bé gửi để kiểm tra.
    case path === '/child/reading/sessions/31/feeling': state.feeling = body; return { sessionId: 31, feeling: body.feeling, label: 'Thích' };
    case path === '/child/reading/sessions/31/reflection': return { sessionId: 31, emotions: [], favoriteSceneId: null, noteText: null, hasNoteRecording: false, canRecord: true, message: null };
    case path === '/child/reading/sessions/31/reflection/emotions': state.emotions = body; return { sessionId: 31, emotions: body.emotions.map((code) => ({ code, label: code })), favoriteSceneId: null, noteText: null, hasNoteRecording: false, canRecord: true, message: null };
    case path === '/child/reading/sessions/31/reflection/favorite-scene': state.favorite = body; return { sessionId: 31, emotions: [], favoriteSceneId: body.sceneId, noteText: null, hasNoteRecording: false, canRecord: true, message: null };
    case path === '/child/reading/sessions/31/reflection/note': state.noteSent = true; return { sessionId: 31, emotions: [], favoriteSceneId: 2, noteText: 'x', hasNoteRecording: false, canRecord: true, message: 'Đã gửi cho bố mẹ' };
    case path === '/child/reading/sessions/31/signal': return { shouldExit: false, returnTo: null, message: null, sessionStatus: 'Active' };
    case path === '/child/reading/sessions/31/events': return null;
    // Moderator: lộ trình mẫu
    case path === '/RoadmapTemplate' && method === 'GET': return paged(state.rtCreated ? [{ id: 40, name: state.rtCreated.name, ageBand: '6-8', mainCategory: null, storyCount: state.rtItems?.length ?? 0, status: state.rtSubmitted ? 'PendingReview' : 'Draft', createdByUserId: 1, createdByName: null, isMine: true, submittedAt: null, publishedAt: null, openCloneId: null, needsUpdate: false, retiredStoryCount: 0 }] : []);
    case path === '/RoadmapTemplate/candidates': return paged([{ storyId: 7, title: story.title, ageBand: '6-8', readingLevel: 2, labels: [], publishedAt: now }, { storyId: 9, title: 'Truyện thứ hai', ageBand: '6-8', readingLevel: 3, labels: [], publishedAt: now }]);
    case path === '/RoadmapTemplate' && method === 'POST': state.rtCreated = body; return roadmapDetail(state);
    case path === '/RoadmapTemplate/40/items': state.rtItems = body.items; return roadmapDetail(state);
    case path === '/RoadmapTemplate/40/submit': state.rtSubmitted = true; return { roadmapId: 40, status: 'PendingReview' };
    case path === '/RoadmapTemplate/40': return roadmapDetail(state);
    // Creator tự đăng ký: đơn bị từ chối, nộp lại thì thành chờ duyệt.
    case path === '/Auth/register-creator': state.registered = body; return null;
    case path === '/creator-applications/me': return state.resubmitted ? { ...creatorApps[0], ...state.resubmitted, id: 3 } : { ...creatorApps[0], status: 'Rejected', reviewedAt: now, rejectionReason: 'Giới thiệu còn quá chung, hãy nêu rõ truyện đã viết.' };
    case path === '/creator-applications/me/resubmit': state.resubmitted = body; return { ...creatorApps[0], ...body, id: 3 };
    // Admin: đơn đăng ký và tài khoản Content Creator (đơn 2 của người chưa xác thực email nên chưa duyệt được)
    case path === '/admin/creator-applications': return paged(url.searchParams.get('status') === 'Pending' ? creatorApps.filter((a) => a.id !== state.approvedApp) : []);
    case path === '/admin/creator-applications/1/approve': state.approvedApp = 1; return { ...creatorApps[0], status: 'Approved' };
    case path === '/admin/creators': return paged(creatorAccounts.map((c) => (c.id === state.deactivated?.id ? { ...c, status: 'Suspended' } : c)));
    case path === '/admin/creators/21/deactivate': state.deactivated = { id: 21, ...body }; return { creator: { ...creatorAccounts[0], status: 'Suspended' }, withdrawnSubmissions: 1, closedSubmissions: 0 };
    // Creator
    case path === '/creator/stories': return paged([draft]);
    case path === '/creator/stories/7': return draft;
    case path === '/creator/stories/7/content/versions/12': return { versionId: 12, storyId: 7, versionNo: 1, title: story.title, content: story.content, sourceDeclaration: 'Tự sáng tác', rightsDeclaration: 'Có quyền dùng', origin: 'Write', createdAt: now };
    case path === '/creator/stories/7/content/versions': return [];
    case path === '/creator/stories/7/publication': return { storyId: 7, versionId: 12, isPublished: false, reviewStatus: 'None', openItemId: null, openItemType: null, openItemStatus: null };
    default: return undefined;
  }
}

const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
const results = [];

async function smoke(label, role, run) {
  if (process.env.SMOKE_CASES && !process.env.SMOKE_CASES.split(',').includes(label)) return;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const state = { user: { id: 1, username: 'fixture', email: 'fixture@example.invalid', fullName: 'Người dùng kiểm thử', role, status: 'Active' } };
  const requests = []; const errors = [];
  const jwt = `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: '1', role })).toString('base64url')}.fixture`;
  await page.addInitScript(({ user, jwt }) => { localStorage.setItem('taletale_user_profile', JSON.stringify(user)); localStorage.setItem('taletale_access_token', jwt); localStorage.setItem('taletale_refresh_token', 'fixture-refresh'); }, { user: state.user, jwt });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.route('**/*', (r) => (new URL(r.request().url()).origin === new URL(base).origin ? r.continue() : r.abort()));
  await page.route((u) => u.pathname.startsWith('/api/v1/') || /^\/(health|healthz|hubs\/notifications\/negotiate)$/.test(u.pathname), async (route) => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', ''); const method = req.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204 });
    let body = null; try { body = req.postDataJSON(); } catch { /* form-data */ }
    requests.push({ path, method, body, raw: body ? null : req.postData() });
    const data = api({ path, method, body, url, state });
    if (data === undefined && process.env.SMOKE_DEBUG) console.log('  404 fixture:', method, path);
    if (data === undefined) return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Fixture: chức năng không nằm trong smoke test.', data: null }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'OK', data }) });
  });
  try {
    console.log('Smoke', label);
    await run({ page, state, requests });
    assert.deepEqual(errors, [], `Lỗi JavaScript trên trang: ${errors.join('; ')}`);
    results.push({ case: label, status: 'passed' });
  } catch (e) {
    const lines = String(e?.message ?? e).split(/\r?\n/);
    const waitingFor = lines.find((l) => l.includes('waiting for'));
    const first = lines[0] + (waitingFor ? ` | ${waitingFor.replace(/\x1b\[[0-9;]*m/g, '').trim()}` : '');
    console.log('FAILED', label, '-', first);
    results.push({ case: label, status: 'failed', error: first });
    process.exitCode = 1;
  } finally {
    await page.screenshot({ path: new URL(`${label}.png`, output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true }).catch(() => {});
    await context.close();
  }
}

const parent = (hash = '') => `${base}/${hash}`;
/** Kết quả đọc: sổ xuống các lần đọc của một ô truyện, bấm lần mới nhất và trả về popup chi tiết. */
async function openRun(page, title) {
  const tile = page.locator('.lr-story', { hasText: title });
  await tile.getByRole('button', { name: /lần đọc$/ }).click();
  await tile.locator('.lr-run').first().click();
  const dlg = page.getByRole('dialog', { name: new RegExp(title) });
  await dlg.waitFor();
  return dlg;
}
const nav = (page, name) => page.getByRole('button', { name, exact: true }).first().click();

try {
  await smoke('HeaderLayout', 'Parent', async ({ page }) => {
    await page.goto(parent('#library'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Thư viện truyện', exact: true }).waitFor();
    // Header không được đè lên khung nội dung (lỗi trùng tên lớp Tailwind "top-3" từng đẩy header xuống 12px).
    const header = await page.locator('header.top').boundingBox();
    const stage = await page.locator('main.stage').boundingBox();
    assert(header && stage && stage.y - (header.y + header.height) >= 6, `Header cách khung nội dung quá ít: header ${JSON.stringify(header)}, stage ${JSON.stringify(stage)}`);
    // Thanh điều hướng nằm giữa trang (lệch tối đa 40px).
    const bar = await page.locator('nav.topnav').boundingBox();
    assert(bar && Math.abs(bar.x + bar.width / 2 - 720) <= 40, `Thanh điều hướng lệch tâm: ${JSON.stringify(bar)}`);
  });

  await smoke('ParentLibrary', 'Parent', async ({ page }) => {
    await page.goto(parent('#library'), { waitUntil: 'domcontentloaded' });
    await page.locator('button.bk').filter({ hasText: story.title }).first().click();
    for (const name of ['Cho bé đọc ngay', 'Thêm vào lộ trình', 'Xem trước như bé thấy']) await page.getByRole('button', { name, exact: true }).waitFor();
  });

  await smoke('ParentHandover', 'Parent', async ({ page, state, requests }) => {
    await page.goto(parent('#library'), { waitUntil: 'domcontentloaded' });
    await page.locator('button.bk').filter({ hasText: story.title }).first().click();
    await page.getByRole('button', { name: 'Cho bé đọc ngay', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: `Cho bé đọc “${story.title}”` });
    await dialog.getByText('Truyện không hợp nhóm tuổi của bé.', { exact: true }).waitFor();
    assert(await dialog.getByRole('button', { name: /Bé Lan/ }).isDisabled(), 'Bé không đọc được truyện phải bị khoá');
    await dialog.getByRole('button', { name: /Bé Sen/ }).click();
    await page.waitForFunction(() => document.querySelector('.kid') !== null);
    await page.waitForTimeout(1500);
    assert.equal(state.handover?.storyId, 7, 'Phải giao máy kèm đúng truyện');
    assert(requests.some((r) => r.path === '/child/reading/sessions' && r.body?.storyId === 7), 'Trang của bé phải mở thẳng truyện đã chọn');
  });

  await smoke('LearningOverview', 'Parent', async ({ page }) => {
    await page.goto(parent('#roadmap'), { waitUntil: 'domcontentloaded' });
    await page.getByText('Ếch con trong lộ trình', { exact: true }).first().waitFor();
    // Ô "Lộ trình" đếm theo danh sách truyện của bé: dữ liệu giả có 1 truyện đang đọc, chưa đọc xong truyện nào.
    await page.locator('.lr-tile').filter({ hasText: 'Lộ trình' }).getByText('0/1', { exact: true }).waitFor();
    await page.getByRole('tab', { name: /Điều ước/ }).getByText('1', { exact: true }).waitFor();
  });

  await smoke('LearningTemplate', 'Parent', async ({ page, state }) => {
    await page.goto(parent('#roadmap'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Lộ trình', exact: true }).click();
    await page.getByRole('button', { name: 'Bộ khám phá, 1 truyện', exact: true }).click();
    await page.getByRole('button', { name: 'Thêm cho bé', exact: true }).click();
    await page.getByText('Truyện sẽ được thêm', { exact: true }).waitFor();
    await page.getByText('Mức đọc của bé nằm ngoài khoảng mức đọc của lộ trình này.', { exact: true }).first().waitFor();
    await page.getByRole('button', { name: 'Thêm 1 truyện', exact: true }).click();
    await page.getByRole('button', { name: 'Xong', exact: true }).waitFor();
    assert.deepEqual(state.copied, { childProfileIds: [10], position: 'NextUp', daysPerStory: 3 });
  });

  await smoke('LearningAddFromLibrary', 'Parent', async ({ page, state }) => {
    await page.goto(parent('#roadmap'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Lộ trình', exact: true }).click();
    await page.getByRole('button', { name: 'Thêm truyện', exact: true }).click();
    await page.getByText('Đang chọn truyện cho Bé Sen', { exact: true }).waitFor();
    await page.locator('button.bk').filter({ hasText: story.title }).first().click();
    await page.getByRole('button', { name: 'Thêm vào lộ trình', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Thêm vào lộ trình cho Bé Sen' });
    await dialog.getByRole('button', { name: 'Thêm', exact: true }).click();
    await page.getByRole('tab', { name: 'Lộ trình', exact: true, selected: true }).waitFor();
    assert.deepEqual(state.added?.childProfileIds, [10]);
    assert.equal(state.added?.storyId, 7);
  });

  await smoke('LearningResults', 'Parent', async ({ page, state }) => {
    await page.goto(parent('#roadmap'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Kết quả đọc', exact: true }).click();
    // Lưới truyện: mỗi truyện một ô có bìa; sổ xuống các lần đọc, bấm một lần thì mở popup chi tiết.
    await page.locator('.lr-story').getByText('⭐ Câu đố 90%', { exact: true }).waitFor();
    await shots(page, 'LearningResults-grid', '.lr-grid');
    const dlg = await openRun(page, 'Truyện đã đọc xong');
    await dlg.getByText('“Vui lắm”', { exact: true }).waitFor();
    await dlg.getByText('Gần nhất 80%', { exact: true }).waitFor();
    await shots(page, 'LearningResults-dialog', '[role="dialog"]');
    // Phần kể lại nằm trong popup: xoá được, xoá xong thì phần đó biến mất.
    await dlg.getByRole('button', { name: 'Xoá phần kể lại về Truyện bé kể lại', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await dlg.getByRole('button', { name: 'Xoá phần kể lại về Truyện bé kể lại', exact: true }).waitFor({ state: 'detached' });
    assert(state.summaryDeleted, 'Phải gọi API xoá phần kể lại');
    assert.equal(await page.getByText('Chưa có phần kể lại nào', { exact: true }).count(), 0, 'Không còn khung kể lại riêng');
  });

  await smoke('LearningQuestions', 'Parent', async ({ page, state }) => {
    state.withQuestions = true;
    await page.goto(parent('#roadmap'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Kết quả đọc', exact: true }).click();
    // Ẩn toast (API tổng quan không có trong fixture) để ảnh thấy rõ cả thanh trên.
    await page.locator('.lr-story').first().waitFor();
    await page.locator('.app-toast').evaluateAll((els) => els.forEach((e) => e.remove()));
    await shots(page, 'ParentHeader', 'header.top');
    const dlg = await openRun(page, 'Truyện đã đọc xong');
    await dlg.getByText('2 chưa trả lời', { exact: true }).first().waitFor();
    await dlg.getByText('“Sao thỏ lại ra vườn?”', { exact: true }).waitFor();
    await shots(page, 'LearningQuestions', '.lr-flags');
    await dlg.getByRole('button', { name: 'Đánh dấu đã trả lời' }).first().click();
    await dlg.getByText('1 chưa trả lời', { exact: true }).first().waitFor();
    assert.deepEqual(state.answered, { answered: true });
    await dlg.getByRole('button', { name: 'Bỏ đánh dấu đã trả lời' }).click();
    await dlg.getByText('2 chưa trả lời', { exact: true }).first().waitFor();
    assert.deepEqual(state.answered, { answered: false });
  });

  await smoke('LearningReflection', 'Parent', async ({ page, state }) => {
    state.withReflection = true;
    await page.goto(parent('#roadmap'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Kết quả đọc', exact: true }).click();
    await page.locator('.lr-story').getByText('Cảm động').waitFor();
    // Popup chi tiết lần đọc gồm cả nghe bé đọc và cảm nhận.
    const refl = await openRun(page, 'Truyện đã đọc xong');
    // Nghe bé đọc: 2 bản ghi (trang 1 và luyện đọc), xoá bản của trang 1.
    await refl.locator('li.is-practice').waitFor();
    await shots(page, 'LearningReflection-recordings', '.lr-recs');
    await refl.getByRole('button', { name: 'Xoá bản ghi Trang 1' }).click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await refl.getByRole('button', { name: 'Xoá bản ghi Trang 1' }).waitFor({ state: 'detached' });
    assert.equal(state.removedRec, 5);
    // Cảm nhận: xoá lời bé gửi, cảm xúc và cảnh vẫn còn.
    await refl.getByText('Con thích lúc thỏ chia cà rốt', { exact: false }).waitFor();
    await shots(page, 'LearningReflection-dialog', '[role="dialog"]');
    await refl.getByRole('button', { name: 'Xoá lời bé gửi' }).click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await refl.getByText('Con thích lúc thỏ chia cà rốt', { exact: false }).waitFor({ state: 'detached' });
    assert(state.noteRemoved, 'Phải gọi API xoá lời bé');
    await refl.getByText('Cảm động').first().waitFor();
  });

  await smoke('LearningGrouped', 'Parent', async ({ page, state }) => {
    state.grouped = true;
    await page.goto(parent('#roadmap'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Kết quả đọc', exact: true }).click();
    await page.getByText('4 lần đọc', { exact: true }).waitFor();
    assert.equal(await page.locator('.lr-story').count(), 2, 'Ba lần đọc cùng truyện gộp thành một ô');
    const tile = page.locator('.lr-story', { hasText: 'Sóc Bông và Thỏ Trắng' });
    await tile.getByRole('button', { name: '3 lần đọc' }).click();
    assert.equal(await tile.locator('.lr-run').count(), 3, 'Sổ xuống thì thấy đủ 3 lần đọc');
    await shots(page, 'LearningGrouped', '.lr-grid');
  });

  await smoke('KidLobbyThemeFrog', 'Parent', async ({ page }) => {
    await page.goto(`${base}/?kid=fixture`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Chạm vào bạn ếch' }).click();
    await page.getByRole('button', { name: 'Chuyển sang giao diện tối' }).click();
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark'));
    await page.getByRole('button', { name: 'Chuyển sang giao diện sáng' }).waitFor();
    await shots(page, 'KidLobbyDark', '.kid-hud');
  });

  await smoke('AccountSessionsPaged', 'Parent', async ({ page, state }) => {
    state.manySessions = true;
    await page.goto(parent('#account'), { waitUntil: 'domcontentloaded' });
    const card = page.locator('.acc-card', { has: page.getByRole('heading', { name: 'Phiên đăng nhập' }) });
    await card.getByText('12', { exact: true }).waitFor();
    assert.equal(await card.locator('.session-row').count(), 5, 'Mỗi trang 5 phiên');
    await card.scrollIntoViewIfNeeded();
    await shots(page, 'AccountSessions', '.acc-card');
    for (let i = 0; i < 2; i++) await card.locator('.pager').getByRole('button', { name: 'Trang sau' }).click();
    await card.getByText('3/3', { exact: true }).waitFor();
    assert.equal(await card.locator('.session-row').count(), 2, 'Trang cuối còn 2 phiên');
    await card.locator('.session-row').first().getByRole('button', { name: 'Đăng xuất' }).click();
    await card.getByText('11', { exact: true }).waitFor();
    assert.equal(await card.locator('.session-row').count(), 1);
  });

  await smoke('LearningWishes', 'Parent', async ({ page, state }) => {
    await page.goto(parent('#roadmap'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: /Điều ước/ }).click();
    await page.getByText('Bé Sen đã đọc · thích', { exact: true }).waitFor();
    // Điều ước đang được làm thành truyện mới: có tiến độ và nút mở Studio đúng truyện.
    const making = page.locator('.lr-card', { hasText: 'Đang tạo truyện' });
    await making.getByText('AI đang viết truyện', { exact: true }).waitFor();
    await making.getByText('Nơi chốn: Khu rừng', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Từ chối điều ước' });
    await dialog.getByRole('textbox').fill('Để tuần sau');
    await dialog.getByRole('button', { name: 'Từ chối', exact: true }).click();
    await page.getByText('Bé Sen chưa có điều ước nào đang chờ', { exact: true }).waitFor();
    await making.getByRole('button', { name: 'Mở trong Studio', exact: true }).click();
    await page.waitForURL(/storyId=50/);
    assert.deepEqual(state.declined, { reason: 'Để tuần sau' });
  });

  await smoke('CreatedShelves', 'Parent', async ({ page }) => {
    await page.goto(parent('#created'), { waitUntil: 'domcontentloaded' });
    const titles = page.locator('.shelf-h h3');
    await titles.first().waitFor();
    const order = await titles.allTextContents();
    assert.deepEqual(order.map((t) => t.trim()), ['Đã xong', 'Chờ bạn duyệt'], `Thứ tự kệ: ${order.join(', ')}`);
    await page.locator('.shelf.accent').getByText('Truyện chờ duyệt', { exact: true }).first().waitFor();
  });

  await smoke('CreatorPaste', 'ContentCreator', async ({ page }) => {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await nav(page, 'Truyện của tôi');
    await page.getByRole('button', { name: `Xem chi tiết truyện ${story.title}`, exact: true }).first().click();
    await page.getByRole('button', { name: 'Mở để soạn tiếp', exact: true }).click();
    await page.getByRole('button', { name: 'Nhập từ tệp', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Dán văn bản', exact: true }).click();
    await page.getByRole('dialog', { name: 'Nhập nội dung' }).getByPlaceholder('Dán nội dung truyện').waitFor();
  });

  await smoke('KidHome', 'Parent', async ({ page, state }) => {
    await page.goto(`${base}/?kid=fixture`, { waitUntil: 'domcontentloaded' });
    await page.getByText('Chào Bé Sen!', { exact: true }).waitFor();
    await page.getByText('Đọc ngay', { exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Ếch con hôm nay', exact: true }).waitFor();
    for (const tab of ['Sảnh', 'Kho truyện', 'Hành trình', 'Sổ tay', 'Điều ước']) await page.getByRole('button', { name: tab, exact: true }).waitFor();
    await page.getByRole('button', { name: 'Đọc ngay', exact: true }).click();
    await page.waitForTimeout(1000);
    assert.equal(state.reading?.storyId, 7, 'Bấm "Đọc ngay" phải mở truyện hôm nay');
  });

  await smoke('KidScenePictures', 'Parent', async ({ page }) => {
    await page.goto(`${base}/?kid=fixture`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Đọc ngay', exact: true }).click();
    const dots = page.getByRole('group', { name: 'Chọn tranh' }).getByRole('button');
    await dots.first().waitFor();
    assert.equal(await dots.count(), 3, 'Cảnh có 3 tranh thì phải có 3 chấm');
    const layers = page.locator('.kid-pic-layer');
    assert.equal(await layers.count(), 3, 'Cả 3 tranh được tải sẵn');
    const isOn = async (i) => (await layers.nth(i).getAttribute('class')).split(' ').includes('on');
    assert(await isOn(0), 'Mới vào cảnh thì hiện tranh đầu');
    const caption = page.locator('.kid-story-caption p');
    const bold = page.locator('.kid-pic-part');
    assert.equal((await caption.textContent()).trim(), sceneText, 'Khung chữ vẫn hiện cả cảnh');
    assert.equal((await bold.textContent()).trim(), 'Thỏ ra vườn.', 'In đậm đoạn của tranh 1');
    await dots.nth(1).click();
    assert(await isOn(1), 'Bấm chấm 2 thì hiện tranh 2');
    assert(!(await isOn(0)), 'Tranh trước mờ đi');
    await page.locator('.kid-pic-part', { hasText: 'Thỏ thấy cà rốt.' }).waitFor();
    assert.equal((await caption.textContent()).trim(), sceneText, 'Đổi tranh vẫn hiện cả cảnh');
    assert.equal(await bold.count(), 1, 'Chỉ in đậm đoạn của tranh đang hiện');
    assert.equal(await dots.nth(1).getAttribute('aria-pressed'), 'true');
  });

  await smoke('KidPicturesFollowNarration', 'Parent', async ({ page }) => {
    await page.goto(`${base}/?kid=fixture`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Đọc ngay', exact: true }).click();
    const layers = page.locator('.kid-pic-layer');
    await layers.first().waitFor();
    await page.getByRole('button', { name: 'Nghe truyện', exact: true }).click();
    // Giọng đọc tới chữ của tranh 2 (0,75 giây) thì tranh đổi và highlight chuyển sang đoạn của tranh 2.
    await page.locator('.kid-pic-layer.on').nth(0).and(layers.nth(1)).waitFor({ timeout: 5000 });
    await page.locator('.kid-pic-part', { hasText: 'Thỏ thấy cà rốt.' }).waitFor({ timeout: 5000 });
    // Sang đoạn âm thanh 2 (đầu câu của tranh 3): tranh 3 hiện, highlight chuyển theo.
    await page.locator('.kid-pic-layer.on').nth(0).and(layers.nth(2)).waitFor({ timeout: 6000 });
    await page.locator('.kid-pic-part', { hasText: part2 }).waitFor({ timeout: 5000 });
  });

  await smoke('KidSummaryQuestions', 'Parent', async ({ page, state, requests }) => {
    state.multiScene = true;
    await page.goto(`${base}/?kid=fixture`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Đọc ngay', exact: true }).click();
    // Màn "Câu chuyện đã khép lại" là popup (không tính trang): số trang chỉ gồm tranh.
    await page.getByText('Trang 1/5').waitFor();
    assert.equal(await page.getByRole('switch').count(), 0, 'Không còn công tắc Tự đọc / Nghe đọc');
    await shots(page, 'KidReader-top', 'body');
    const finish = page.getByRole('button', { name: 'Em đã đọc xong', exact: true });
    for (let i = 0; i < 10 && !(await finish.isVisible()); i++) {
      await page.getByRole('button', { name: 'Trang sau', exact: true }).click(); await page.waitForTimeout(600);
      if (process.env.SMOKE_DEBUG) console.log('  ', await page.locator('.kid-scene-count').textContent());
    }
    await finish.click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    const popup = page.getByRole('dialog', { name: 'Em đã đọc xong' });
    // 7 trang, mỗi trang một việc, một thanh điều hướng: trang 1 là mức thích.
    await popup.getByRole('heading', { name: 'Em thấy truyện này thế nào?' }).waitFor();
    assert.equal(await popup.getByText('Câu chuyện đã khép lại!').count(), 0, 'Popup không còn tiêu đề và ếch phía trên');
    await popup.getByRole('list', { name: 'Bước 1 trên 7' }).waitFor();
    await shots(page, 'KidFinish-popup', 'body');
    // › bỏ qua từng trang tới trang 6: chỗ còn thắc mắc.
    for (let i = 0; i < 5; i++) await popup.getByRole('button', { name: 'Phần sau', exact: true }).click();
    await popup.getByRole('list', { name: 'Bước 6 trên 7' }).waitFor();
    assert.equal(state.feeling, undefined, 'Bỏ qua thì không gửi gì');
    const grid = page.getByRole('group', { name: 'Chọn tranh em muốn hỏi bố mẹ' });
    const tiles = grid.getByRole('button');
    await tiles.first().waitFor();
    assert.equal(await tiles.count(), 5, 'Cảnh 1 có 3 tranh, cảnh 2 và 3 mỗi cảnh một ô');
    assert.deepEqual(await tiles.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label'))), ['Tranh 1', 'Tranh 2', 'Tranh 3', 'Tranh 4', 'Tranh 5'], 'Ô ghi Tranh N liên tục như lúc lật trang');
    await grid.scrollIntoViewIfNeeded();
    await shots(page, 'KidSummaryQuestions-grid', '.kid-finish-dialog');
    // Hỏi về tranh 2 của cảnh 1, có gõ chữ.
    await tiles.nth(1).click();
    await page.getByRole('textbox', { name: 'Câu hỏi của em' }).fill('Sao thỏ lại ra vườn?');
    await shots(page, 'KidSummaryQuestions-panel', '.kid-finish-dialog');
    await page.locator('.kid-ask-panel').getByRole('button', { name: 'Gửi bố mẹ' }).click();
    await page.getByText('(1/5)').waitFor();
    // Hỏi về cả cảnh 2 (không có tranh riêng), không gõ chữ.
    await tiles.nth(3).click();
    await page.locator('.kid-ask-panel').getByRole('button', { name: 'Gửi bố mẹ' }).click();
    await page.getByText('(2/5)').waitFor();
    const sent = requests.filter((r) => r.path === '/child/reading/sessions/31/summary/questions').map((r) => r.raw ?? '');
    assert.equal(sent.length, 2);
    assert(/name="SceneId"\r?\n\r?\n1\r?\n/.test(sent[0]) && /name="BeatOrder"\r?\n\r?\n2\r?\n/.test(sent[0]) && sent[0].includes('Sao thỏ lại ra vườn?'), 'Câu 1 gửi đúng cảnh, tranh và chữ');
    assert(/name="SceneId"\r?\n\r?\n2\r?\n/.test(sent[1]) && !sent[1].includes('BeatOrder'), 'Câu 2 hỏi cả cảnh, không gửi BeatOrder');
    assert(await tiles.nth(1).isDisabled(), 'Tranh đã hỏi bị khoá');
    await shots(page, 'KidSummaryQuestions-sent', '.kid-finish-dialog');
  });

  await smoke('CreatorRegister', 'ContentCreator', async ({ page, state }) => {
    await page.addInitScript(() => { localStorage.removeItem('taletale_user_profile'); localStorage.removeItem('taletale_access_token'); localStorage.removeItem('taletale_refresh_token'); });
    await page.goto(`${base}/?auth=creator`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Đăng ký làm Content Creator' }).waitFor();
    await page.getByLabel('Họ và tên').fill('Lê Sáng Tác');
    await page.getByLabel('Tên đăng nhập').fill('sangtac');
    await page.getByLabel('Email', { exact: true }).fill('sangtac@example.invalid');
    await page.getByLabel(/Giới thiệu bản thân/).fill('Tôi viết truyện thiếu nhi về thiên nhiên và tình bạn đã 5 năm.');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('Matkhau123');
    await page.getByLabel('Nhập lại mật khẩu').fill('Matkhau123');
    await page.getByRole('checkbox').check();
    await shots(page, 'CreatorRegister', '.login-card');
    await page.getByRole('button', { name: 'Nộp đơn' }).click();
    await page.getByLabel('Mã xác thực trong email').waitFor();
    assert.equal(state.registered?.username, 'sangtac');
    assert.equal(state.registered?.introduction, 'Tôi viết truyện thiếu nhi về thiên nhiên và tình bạn đã 5 năm.');
  });

  await smoke('CreatorApplicant', 'ContentCreator', async ({ page, state, requests }) => {
    state.user.status = 'AwaitingApproval';
    await page.addInitScript(() => { const u = JSON.parse(localStorage.getItem('taletale_user_profile')); localStorage.setItem('taletale_user_profile', JSON.stringify({ ...u, status: 'AwaitingApproval' })); });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Đơn chưa được duyệt' }).waitFor();
    await page.getByText('Giới thiệu còn quá chung, hãy nêu rõ truyện đã viết.').waitFor();
    await shots(page, 'CreatorApplicant-rejected', '.login-card');
    await page.getByRole('button', { name: 'Nộp lại đơn' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nộp lại đơn' });
    await dialog.getByRole('textbox').first().fill('Tôi đã viết 12 truyện tranh thiếu nhi về rừng xanh, đăng trên báo Nhi Đồng.');
    await dialog.getByRole('button', { name: 'Gửi' }).click();
    await page.getByRole('heading', { name: 'Đơn của bạn đang chờ duyệt' }).waitFor();
    assert.match(state.resubmitted?.introduction ?? '', /12 truyện/);
    await shots(page, 'CreatorApplicant-pending', '.login-card');
    assert.deepEqual(requests.filter((r) => r.path.startsWith('/creator/')).map((r) => r.path), [], 'Người chờ duyệt không được gọi API Creator');
  });

  await smoke('AdminCreators', 'Administrator', async ({ page, state }) => {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Người dùng', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Content Creator', exact: true }).click();
    await page.getByLabel('2 đơn chờ duyệt').waitFor();
    await page.getByText('Lê Sáng Tác', { exact: true }).waitFor();
    await shots(page, 'AdminCreators-apps', 'table');
    // Đơn của người chưa xác thực email: không có nút Duyệt.
    await page.getByRole('button', { name: 'Xem đơn của Trần Chưa Xác Thực' }).click();
    await page.getByText('Creator chưa xác thực email nên chưa duyệt được đơn.').waitFor();
    assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Duyệt', exact: true }).count(), 0);
    await page.getByRole('dialog').getByRole('button', { name: 'Đóng' }).click();
    await page.getByRole('button', { name: 'Xem đơn của Lê Sáng Tác' }).click();
    await shots(page, 'AdminCreators-dialog', '.st-dlg');
    await page.getByRole('dialog').getByRole('button', { name: 'Duyệt', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await page.getByLabel('1 đơn chờ duyệt').waitFor();
    assert.equal(state.approvedApp, 1, 'Phải gọi API duyệt đơn 1');
    await page.getByRole('tab', { name: 'Tài khoản', exact: true }).click();
    await page.getByText('Nguyễn Creator', { exact: true }).waitFor();
    await shots(page, 'AdminCreators-accounts', 'table');
    await page.getByRole('row', { name: /Nguyễn Creator/ }).getByRole('button', { name: 'Vô hiệu hoá' }).click();
    await page.getByRole('dialog').getByRole('textbox').fill('Đăng nội dung sai quy định');
    await page.getByRole('dialog').getByRole('button', { name: 'Vô hiệu hoá' }).click();
    const confirm = page.getByRole('button', { name: 'Xác nhận', exact: true });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await page.getByRole('row', { name: /Nguyễn Creator/ }).getByRole('button', { name: 'Kích hoạt lại' }).waitFor();
    assert.deepEqual(state.deactivated, { id: 21, reason: 'Đăng nội dung sai quy định' });
  });

  await smoke('KidPracticeReflection', 'Parent', async ({ page, state, requests }) => {
    state.multiScene = true; state.withPractice = true;
    await page.goto(`${base}/?kid=fixture`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Đọc ngay', exact: true }).click();
    // Trang luyện đọc to là trang cuối: "Em đã đọc xong" chỉ hiện ở đó, không hiện ở trang cuối truyện.
    const practice = page.getByRole('heading', { name: 'Luyện đọc to' });
    const finish = page.getByRole('button', { name: 'Em đã đọc xong', exact: true });
    for (let i = 0; i < 10 && !(await practice.isVisible()); i++) {
      assert(!(await finish.isVisible()), 'Chưa tới trang luyện thì chưa hiện "Em đã đọc xong"');
      await page.getByRole('button', { name: 'Trang sau', exact: true }).click(); await page.waitForTimeout(600);
    }
    await page.getByText('Trang 6/6').waitFor();
    await page.getByRole('button', { name: 'Nghe mẫu' }).waitFor();
    await page.getByRole('button', { name: 'Đọc to' }).waitFor();
    await shots(page, 'KidPractice', '.kid-practice');
    assert(!requests.some((r) => r.path.endsWith('/progress') && r.body?.page > 3), 'Không lưu vị trí đọc với trang luyện');
    await finish.click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    // Popup 7 trang: mức thích → 2 cảm xúc → tranh 4 (cảnh 2) → viết lời, mỗi bước gửi xong tự sang trang sau.
    const card = page.getByRole('dialog', { name: 'Em đã đọc xong' });
    await card.getByRole('list', { name: 'Bước 1 trên 7' }).waitFor();
    // Bước 1 là mức thích: chọn xong tự sang bước cảm xúc.
    await card.getByRole('heading', { name: 'Em thấy truyện này thế nào?' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Em thấy truyện này thế nào?' }).count(), 1, 'Chỉ còn một chỗ hỏi cảm nhận');
    await card.getByRole('button', { name: 'Thích', exact: true }).click();
    await card.getByRole('heading', { name: 'Truyện làm em cảm thấy gì?' }).waitFor();
    assert.deepEqual(state.feeling, { feeling: 'Like' });
    // Không còn nút "Tiếp": chọn là lưu, đủ 2 cảm xúc thì tự sang trang tranh.
    assert.equal(await card.getByRole('button', { name: 'Tiếp' }).count(), 0, 'Đã bỏ nút Tiếp');
    await card.getByRole('button', { name: 'Vui', exact: true }).click();
    await card.getByRole('button', { name: 'Cảm động', exact: true }).click();
    await shots(page, 'KidReflection-emotions', '.kid-finish-dialog');
    await card.getByRole('heading', { name: 'Tranh em thích nhất' }).waitFor();
    assert.deepEqual(state.emotions, { emotions: ['Happy', 'Touched'] });
    // Chạm tranh là lưu và sang trang lời gửi.
    await card.getByRole('group', { name: 'Chọn tranh em thích nhất' }).getByRole('button', { name: 'Tranh 4' }).click();
    await card.getByRole('heading', { name: 'Điều gì em thích ở tranh này?' }).waitFor();
    assert.deepEqual(state.favorite, { sceneId: 2 });
    await card.getByRole('textbox', { name: 'Điều em thích ở tranh này' }).fill('Con thích thỏ về nhà');
    await shots(page, 'KidReflection-note', '.kid-finish-dialog');
    await card.getByRole('button', { name: 'Gửi bố mẹ' }).click();
    // Gửi xong tự sang trang 5: kể lại cho bố mẹ.
    await card.getByRole('heading', { name: 'Em kể lại cho bố mẹ nghe nhé' }).waitFor();
    await card.getByRole('list', { name: 'Bước 5 trên 7' }).waitFor();
    assert(state.noteSent, 'Phải gửi lời của bé');
    const note = requests.find((r) => r.path.endsWith('/reflection/note'))?.raw ?? '';
    assert(/name="Text"\r?\n\r?\nCon thích thỏ về nhà/.test(note), 'Lời bé gửi dạng multipart Text');
    await shots(page, 'KidReflection-done', '.kid-finish-dialog');
  });

  await smoke('ModeratorRoadmap', 'Moderator', async ({ page, state }) => {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await nav(page, 'Lộ trình mẫu');
    await page.getByRole('button', { name: 'Tạo lộ trình mới', exact: true }).first().click();
    // Bước 1: thông tin chung. Thiếu tên / chủ đề thì nút Lưu nháp bị khoá và nói rõ thiếu gì.
    await page.getByText('Còn thiếu: tên lộ trình, chủ đề chính', { exact: true }).waitFor();
    assert(await page.getByRole('button', { name: 'Lưu nháp', exact: true }).isDisabled());
    await page.getByPlaceholder('Ví dụ: Khám phá thiên nhiên cho bé 6–8 tuổi').fill('Khám phá rừng xanh');
    await page.getByRole('combobox').filter({ hasText: 'Chọn chủ đề' }).selectOption({ label: 'Thiên nhiên' });
    // Số ngày theo Backend là 1–30: chọn mức ngoài các nút bằng ô "Khác", rồi quay lại nút 5 ngày.
    await page.getByRole('combobox', { name: 'Số ngày khác' }).selectOption({ label: '10 ngày' });
    assert.equal(await page.getByRole('radio', { checked: true }).count(), 1, 'Chỉ còn nút độ tuổi được chọn khi dùng ô Khác');
    await page.getByRole('radio', { name: '5 ngày', exact: true }).click();
    // Bước 2: chọn 2 truyện trong popup rồi đổi thứ tự.
    await page.getByRole('button', { name: 'Thêm truyện', exact: true }).click();
    const picker = page.getByRole('dialog', { name: 'Chọn truyện (6–8 tuổi)' });
    // Ô tìm trong popup phải gọn (từng bị phình cao vì mượn CSS .lsearch của Thư viện).
    const searchBox = await picker.locator('.rt-search').boundingBox();
    assert(searchBox && searchBox.height < 70, `Ô tìm kiếm cao bất thường: ${searchBox?.height}px`);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await picker.getByRole('button', { name: /Ếch con khám phá/ }).waitFor();
    await page.screenshot({ path: new URL('ModeratorRoadmap-picker.png', output).pathname.replace(/^\/(\w:)/, '$1') });
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await picker.getByRole('button', { name: /Ếch con khám phá/ }).click();
    await picker.getByRole('button', { name: /Truyện thứ hai/ }).click();
    await picker.getByText('Đã chọn 2 truyện', { exact: true }).waitFor();
    // Ảnh bìa của truyện cộng đồng lấy từ /Story/community khi GET /Story/{id} không có.
    const communityCover = picker.locator('.rt-pick-item', { hasText: 'Truyện thứ hai' }).locator('.rt-pick-cover');
    await page.waitForFunction((el) => el && getComputedStyle(el).backgroundImage.includes('svg'), await communityCover.elementHandle(), { timeout: 5000 });
    await picker.getByRole('button', { name: 'Xong', exact: true }).click();
    await page.getByRole('button', { name: 'Lên', exact: true }).nth(1).click();
    await page.getByRole('combobox', { name: 'Số ngày đọc truyện 1' }).selectOption({ label: '20 ngày' });
    await page.screenshot({ path: new URL('ModeratorRoadmap-edit.png', output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
    await page.getByRole('button', { name: 'Lưu nháp', exact: true }).click();
    await page.getByRole('button', { name: 'Gửi duyệt', exact: true }).waitFor();
    assert.deepEqual(state.rtCreated, { name: 'Khám phá rừng xanh', description: null, ageBand: '6-8', mainCategoryId: 1, readingLevelMin: 1, readingLevelMax: 3, defaultDaysPerStory: 5 });
    assert.deepEqual(state.rtItems, [{ storyId: 9, days: 20 }, { storyId: 7, days: null }], 'Lưu đúng thứ tự và số ngày riêng (tới 30 ngày)');
    // Bước 3: lưu xong thì nút Lưu nháp ẩn, gửi duyệt được.
    assert.equal(await page.getByRole('button', { name: 'Lưu nháp', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Gửi duyệt', exact: true }).click();
    // Gửi xong thì chuyển sang nhóm "Chờ duyệt" và mở lại đúng bộ vừa gửi.
    await page.getByRole('tab', { name: 'Chờ duyệt', selected: true }).waitFor();
    await page.locator('.rt-head').getByText('Đang chờ duyệt', { exact: true }).waitFor();
    assert(state.rtSubmitted, 'Phải gọi API gửi duyệt');
  });

  await writeFile(new URL('results.json', output), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => r.status === 'failed').length;
  console.log(`\n${results.length - failed}/${results.length} trường hợp qua.`);
} finally {
  await browser.close();
}
