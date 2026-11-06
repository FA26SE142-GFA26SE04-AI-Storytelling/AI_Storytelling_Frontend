import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

const load = async (base: string) => { vi.stubEnv('NEXT_PUBLIC_MEDIA_BASE_URL', base); vi.resetModules(); return import('@/app/lib/mediaUrl'); };

it('joins a relative storage path with the media base URL', async () => {
  const { resolveMediaUrl } = await load('https://cdn.example/storage/public/story-media/');
  expect(resolveMediaUrl('908/versions/911/v1/a.png')).toBe('https://cdn.example/storage/public/story-media/908/versions/911/v1/a.png');
});
it('keeps full URLs and empty values untouched', async () => {
  const { resolveMediaUrl } = await load('https://cdn.example/media');
  expect(resolveMediaUrl('https://other.example/a.png')).toBe('https://other.example/a.png');
  expect(resolveMediaUrl('blob:abc')).toBe('blob:abc');
  expect(resolveMediaUrl('/default-image.svg')).toBe('/default-image.svg');
  expect(resolveMediaUrl(null)).toBeNull();
  expect(resolveMediaUrl('')).toBeNull();
});
it('leaves paths unchanged when no base URL is configured', async () => {
  const { resolveMediaUrl } = await load('');
  expect(resolveMediaUrl('908/a.png')).toBe('908/a.png');
});
it('resolves illustration, segment audio and interaction media in reading content', async () => {
  const { resolveContentMedia } = await load('https://cdn.example/m');
  const out = resolveContentMedia({
    sessionId: 1, storyId: 2, title: 't', lesson: null, listenOnly: false, vocabulary: [],
    scenes: [{ sceneId: 3, sceneIndex: 0, text: 'x', illustrationUrl: 'a/b.png', attemptedInSession: false,
      segments: [{ segmentOrder: 0, text: 'x', audioUrl: 'a/c.wav', wordTimingsJson: null }],
      interaction: { id: 9, type: 'Checkpoint', kind: null, prompt: null, characterName: null, modelSentence: null, modelAudioUrl: 'a/m.wav',
        maskedSentence: null, hint: null, waitFeedback: null, revealSceneIndex: null, audioUrls: { prompt: 'a/p.wav' },
        options: [{ id: 1, text: 'o', imageUrl: 'a/i.png', audioUrl: null, feedback: null, feedbackAudioUrl: 'a/f.wav' }] } }],
  });
  const s = out.scenes[0];
  expect(s.illustrationUrl).toBe('https://cdn.example/m/a/b.png');
  expect(s.segments[0].audioUrl).toBe('https://cdn.example/m/a/c.wav');
  expect(s.interaction?.audioUrls.prompt).toBe('https://cdn.example/m/a/p.wav');
  expect(s.interaction?.options[0].imageUrl).toBe('https://cdn.example/m/a/i.png');
  expect(s.interaction?.options[0].feedbackAudioUrl).toBe('https://cdn.example/m/a/f.wav');
});
