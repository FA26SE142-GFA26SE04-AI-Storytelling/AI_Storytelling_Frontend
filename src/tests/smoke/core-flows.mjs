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

/** API giả cho mọi trường hợp. Trả `undefined` thì rơi xuống 404 "chức năng không nằm trong smoke test". */
function api({ path, method, body, url, state }) {
  switch (true) {
    case path === '/Auth/me': return state.user;
    case path === '/Auth/sessions': return [];
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
    case path === '/ChildRoadmap/10' && method === 'GET': return { childProfileId: 10, open: { id: 55, storyId: 7, title: 'Ếch con trong lộ trình', position: 0, status: 'Open', source: 'Manual', skipReason: null, note: 'Đọc cùng mẹ', expectedDays: 7, expectedCompletionAt: null, openedAt: now, completedAt: null, addedByUserId: 1, isStoryAvailable: true }, waiting: [], history: [], completedCount: 2, totalCount: 3 };
    case path.startsWith('/ChildRoadmap/') && method === 'GET': return { childProfileId: 11, open: null, waiting: [], history: [], completedCount: 0, totalCount: 0 };
    case path === '/ChildRoadmap/stories': state.added = body; return { results: [{ childProfileId: 10, outcome: 'Added', itemId: 90, warnings: [], skipCode: null, message: null }] };
    case path === '/RoadmapLibrary': return paged([{ id: 2, name: 'Bộ khám phá', description: 'Bộ truyện mẫu', ageBand: '6-8', mainCategory: { id: 1, code: 'nature', displayName: 'Thiên nhiên' }, readingLevelMin: 1, readingLevelMax: 3, defaultDaysPerStory: 3, storyCount: 1, needsUpdate: false, publishedAt: now }]);
    case path === '/RoadmapLibrary/2': return { id: 2, name: 'Bộ khám phá', description: 'Bộ truyện mẫu', ageBand: '6-8', mainCategory: { id: 1, code: 'nature', displayName: 'Thiên nhiên' }, readingLevelMin: 1, readingLevelMax: 3, defaultDaysPerStory: 3, storyCount: 1, needsUpdate: false, publishedAt: now, stories: [{ storyId: 7, position: 1, days: 3, title: story.title, ageBand: '6-8', readingLevel: 2, isAvailable: true }] };
    case path === '/RoadmapLibrary/2/preview' || path === '/RoadmapLibrary/2/copy':
      if (path.endsWith('copy')) state.copied = body;
      return { roadmapId: 2, roadmapName: 'Bộ khám phá', children: [{ childProfileId: 10, outcome: path.endsWith('preview') ? 'Copy' : 'Copied', skipCode: null, message: null, steps: [{ storyId: 7, title: story.title, position: 1, days: 3, action: 'Copy', skipCode: null, message: null }], warnings: ['reading_level_outside_range'] }] };
    case path === '/ParentReadingFeedback/10': return paged([{ sessionId: 1, storyId: 7, title: 'Truyện đã đọc xong', completedAt: now, feeling: 'VeryLike', feelingLabel: 'Rất thích', quizTotalQuestions: 5, quizBestPercent: 90, conversationAnswers: [{ question: 'Em thấy thế nào?', kind: 'Emotion', answerText: 'Vui lắm', sceneIndex: 0, answeredAt: now }] }]);
    case path === '/ParentStorySummary/10': return paged(state.summaryDeleted ? [] : [{ summaryId: 3, sessionId: 1, storyId: 7, title: 'Truyện bé kể lại', createdAt: now, recordingUrl: null, recordingSentAt: null, flagsSentAt: now, flags: [] }]);
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
    case path === '/MyRoadmap': return { open: { storyId: 7, title: 'Ếch con hôm nay', coverImageUrl: null, note: 'Mẹ chọn cho con', expectedBy: null, isLocked: false }, upcoming: [{ order: 2, storyId: 9, title: 'Truyện tiếp theo', coverImageUrl: null, isLocked: true }], done: [{ storyId: 6, title: 'Truyện đã đọc', coverImageUrl: null, completedAt: now }], completedCount: 1, totalCount: 3, isFinished: false };
    case path === '/child/manual-stories': return [];
    case path === '/CommunityLibrary': return paged([]);
    case path === '/child/reading/stories': return { isLocked: false, unlockStoryId: null, message: null, items: [{ storyId: 7, title: story.title, coverImageUrl: null, description: null, source: 'roadmap' }], totalCount: 1, pageIndex: 1, pageSize: 20 };
    case path === '/child/notebook': return [];
    case path === '/child/reading/sessions' && method === 'POST': state.reading = body; return { sessionId: 31, storyId: body.storyId, resumed: false, lastPage: 1, lastReadingMode: 'ListenFirst', isBookmarked: false, isFavorited: false };
    // Cảnh đầu có 3 tranh (mỗi tranh một đoạn chữ); ảnh là SVG nhúng để không cần tải từ ngoài.
    case path === '/child/reading/sessions/31/content': return { sessionId: 31, storyId: 7, title: story.title, lesson: null, listenOnly: false, vocabulary: [],
      scenes: [{ sceneId: 1, sceneIndex: 0, text: 'Thỏ ra vườn. Thỏ thấy cà rốt. Thỏ chia cho bạn.', illustrationUrl: pictureUrl('#7cc'), interaction: null, attemptedInSession: false,
        illustrations: [{ beatOrder: 1, startOffset: 0, endOffset: 12, url: pictureUrl('#7cc') }, { beatOrder: 2, startOffset: 13, endOffset: 29, url: pictureUrl('#fc7') }, { beatOrder: 3, startOffset: 30, endOffset: 48, url: pictureUrl('#c7f') }],
        segments: [{ segmentOrder: 1, startOffset: 0, endOffset: 29, text: part1, audioUrl: silentWav(2), wordTimingsJson: timingsOf(part1) },
          { segmentOrder: 2, startOffset: 30, endOffset: 48, text: part2, audioUrl: silentWav(1), wordTimingsJson: timingsOf(part2) }] }] };
    case path === '/child/reading/sessions/31/signal': return { shouldExit: false, returnTo: null, message: null, sessionStatus: 'Active' };
    case path === '/child/reading/sessions/31/events': return null;
    // Moderator: lộ trình mẫu
    case path === '/RoadmapTemplate' && method === 'GET': return paged(state.rtCreated ? [{ id: 40, name: state.rtCreated.name, ageBand: '6-8', mainCategory: null, storyCount: state.rtItems?.length ?? 0, status: state.rtSubmitted ? 'PendingReview' : 'Draft', createdByUserId: 1, createdByName: null, isMine: true, submittedAt: null, publishedAt: null, openCloneId: null, needsUpdate: false, retiredStoryCount: 0 }] : []);
    case path === '/RoadmapTemplate/candidates': return paged([{ storyId: 7, title: story.title, ageBand: '6-8', readingLevel: 2, labels: [], publishedAt: now }, { storyId: 9, title: 'Truyện thứ hai', ageBand: '6-8', readingLevel: 3, labels: [], publishedAt: now }]);
    case path === '/RoadmapTemplate' && method === 'POST': state.rtCreated = body; return roadmapDetail(state);
    case path === '/RoadmapTemplate/40/items': state.rtItems = body.items; return roadmapDetail(state);
    case path === '/RoadmapTemplate/40/submit': state.rtSubmitted = true; return { roadmapId: 40, status: 'PendingReview' };
    case path === '/RoadmapTemplate/40': return roadmapDetail(state);
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
    requests.push({ path, method, body });
    const data = api({ path, method, body, url, state });
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
    await page.getByText('⭐ Câu đố 90%', { exact: true }).waitFor();
    await page.getByRole('button', { name: /Bé trả lời \(1\)/ }).click();
    await page.getByText('“Vui lắm”', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Xoá phần kể lại về Truyện bé kể lại', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await page.getByText('Chưa có phần kể lại nào', { exact: true }).waitFor();
    assert(state.summaryDeleted, 'Phải gọi API xoá phần kể lại');
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
    await page.getByText('Hôm nay em đọc', { exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Ếch con hôm nay', exact: true }).waitFor();
    for (const tab of ['Truyện', 'Sổ tay', 'Điều ước', 'Phần thưởng']) await page.getByRole('button', { name: tab, exact: true }).waitFor();
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
