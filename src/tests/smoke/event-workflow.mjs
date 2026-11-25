// Browser regression checks using isolated API fixtures. No real AI, registrations or awards are mutated.
// FRONTEND_SMOKE_URL=http://localhost:3000 node tests/smoke/event-workflow.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.FRONTEND_SMOKE_URL || 'http://localhost:3000';
const event = { id: 7, title: 'Event fixture', description: 'Family stories', slug: 'fixture', mainCategoryId: 1,
  targetAgeBands: '6-8', status: 'Published', budgetVnd: 1000000, tracks: [], awards: [], eventStoriesCount: 2 };
const participation = { id: 9, eventId: 7, trackId: 8, userId: 1, status: 'Registered', trackType: 'Parent' };
const dashboard = { participation, completionMode: 'AllMandatory', completedTasksCount: 0, earnedPoints: 0,
  allRequirementsMet: false, tasks: [{ taskDefinitionId: 10, title: 'Practice', taskCode: 'T1',
    verifierType: 'RealLifePracticeCheckin', targetValue: 2, currentValue: 0, points: 10, isMandatory: true, isCompleted: false }],
  stories: [{ storyId: 21, title: 'First story', ageBand: '6-8' }, { storyId: 22, title: 'Second story', ageBand: '6-8' }] };
const browser = await chromium.launch({ channel: 'msedge' });
try {
  for (const role of ['User', 'ContentCreator']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const user = { id: 1, username: 'fixture', role, status: 'Active' };
    await context.addInitScript((u) => {
      localStorage.setItem('taletale_user_profile', JSON.stringify(u));
      localStorage.setItem('taletale_access_token', 'e30.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600, role: u.role, sub: '1' })) + '.fixture');
    }, user);
    const page = await context.newPage();
    const errors = [], posted = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/v1/**', async (route) => {
      const request = route.request(), path = new URL(request.url()).pathname;
      let data = [];
      if (request.method() === 'POST') posted.push({ path, body: request.postDataJSON() });
      if (/auth\/me/i.test(path)) data = user;
      else if (path.endsWith('/events')) data = [event];
      else if (path.endsWith('/events/7')) data = event;
      else if (path.endsWith('/my-participation')) data = { ...participation, trackType: 'Creator' };
      else if (path.endsWith('/my-submission')) data = null;
      else if (path.endsWith('/mission-dashboard') || path.endsWith('/tasks/10/complete')) data = dashboard;
      else if (path.endsWith('/creator/ai-story-input/context')) data = { ageBand: '6-8', readingLevel: 2, maximumLength: 1500,
        availableVocabularyLevels: ['level_2'], availableOutputModes: ['reading_media_only'], blockedCategoryCodes: [] };
      else if (path.endsWith('/creator/ai-story-input/requests')) {
        await route.fulfill({ json: { success: false, data: null, message: 'Fixture: request captured', errors: null } });
        return;
      } else if (path.includes('capacity')) data = { canStartNewStory: true, activeCount: 0, limit: 2, activeStories: [] };
      else if (path.includes('unread-count')) data = 0;
      else if (path.includes('/stories')) data = { items: [], totalCount: 0 };
      else if (path.includes('quota')) data = { aiCredits: { totalRemaining: 0 }, submitCredits: { totalRemaining: 0 } };
      await route.fulfill({ json: { success: true, data, message: 'ok', errors: null } });
    });
    await page.goto(`${base}/${role === 'User' ? 'app' : 'staff'}/events`);
    await page.locator('.ev-event-view').first().click();
    if (role === 'User') {
      const select = page.locator('select[aria-label^="Truyện cho nhiệm vụ"]');
      await select.waitFor();
      const confirm = page.getByRole('button', { name: 'Xác nhận hoàn thành', exact: true });
      assert.equal(await confirm.isDisabled(), true);
      await select.selectOption('22');
      await Promise.all([page.waitForResponse((r) => r.url().includes('/tasks/10/complete')), confirm.click()]);
      assert.equal(posted.find((p) => p.path.endsWith('/tasks/10/complete'))?.body.storyId, 22);
    } else {
      await page.locator('a[href="/staff/create-ai?eventId=7"]').click();
      await page.locator('#cbrief-topic').fill('A frog shares an umbrella with friends');
      await page.locator('#cbrief-lesson').fill('Sharing with friends');
      await Promise.all([page.waitForResponse((r) => r.url().includes('/creator/ai-story-input/requests')),
        page.locator('form.brief button[type="submit"]').click()]);
      assert.equal(posted.find((p) => p.path.endsWith('/creator/ai-story-input/requests'))?.body.eventId, 7);
    }
    assert.deepEqual(errors, []);
    console.log(`${role}: event workflow regression passed`);
    await context.close();
  }
} finally { await browser.close(); }
