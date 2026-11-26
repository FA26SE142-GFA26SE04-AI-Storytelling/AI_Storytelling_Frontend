import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { disabledSet, isFeatureDisabledError, KID_FEATURE, lobbyStorySources, tabEnabled } from '@/app/features/kid/kidFeatures';

describe('kid lobby', () => {
  it('loads only the child own stories when library browse is off', () => {
    expect(lobbyStorySources(disabledSet([]))).toEqual(['mine', 'library']);
    expect(lobbyStorySources(disabledSet(['child.library.browse']))).toEqual(['mine']);
  });

  // Request thừa source=library (403) khi sảnh tải trước lúc biết chức năng bị tắt — thấy khi test prod 23/11/2026.
  it('loads nothing until the disabled features are known', () => {
    expect(lobbyStorySources(disabledSet([]), false)).toEqual([]);
    expect(lobbyStorySources(disabledSet([]), true)).toEqual(['mine', 'library']);
  });

  it('kid home marks features ready only after the session profile answers', () => {
    const home = readFileSync(path.resolve(process.cwd(), 'app/features/kid/ConnectedKidHome.tsx'), 'utf8');
    const stories = readFileSync(path.resolve(process.cwd(), 'app/features/kid/KidLobbyStories.tsx'), 'utf8');
    expect(home).toMatch(/<KidFeaturesProvider disabled=\{disabledFeatures\} ready=\{featuresReady\}>/);
    expect(home).toMatch(/setFeaturesReady\(true\)/);
    expect(stories).toMatch(/lobbyStorySources\(disabled, ready\)/);
  });

  // Lỗi tìm thấy khi test prod 23/11/2026: sảnh vẫn mở được chức năng bố mẹ đã tắt.
  // 26/11: theo yêu cầu, nút vẫn hiện nhưng mờ (`off`), bấm thì báo thay vì mở (như mobile).
  it('gates every lobby shortcut of a switchable feature', () => {
    const read = (f: string) => readFileSync(path.resolve(process.cwd(), `app/features/kid/${f}`), 'utf8');
    const lobby = read('KidLobby.tsx');
    const stage = read('KidLobbyStage.tsx');
    expect(lobby).toMatch(/<StageButton icon=\{NotebookPen\}[^>]*off=\{!notebookOn\}/);
    expect(lobby).toMatch(/<StageButton icon=\{Sparkles\}[^>]*off=\{!wishesOn\}/);
    expect(lobby).toMatch(/<StageButton icon=\{Award\}[^>]*off=\{!rewardsOn\}/);
    expect(stage).toMatch(/<StageButton icon=\{Library\}[^>]*off=\{!libraryOn\}/);
    expect(stage).toMatch(/<StageButton icon=\{Sprout\}[^>]*off=\{!rewardsOn\}/);
    expect(stage).toMatch(/onClick=\{off \? notifyFeatureOff : onClick\}/);
  });

  // Lỗi 26/11: sổ từ bị tắt mà khung "Từ vựng của em" vẫn gọi API, toast lỗi ngay khi bé vào sảnh.
  it('does not load the notebook panel when the notebook is off', () => {
    const side = readFileSync(path.resolve(process.cwd(), 'app/features/kid/KidLobbySide.tsx'), 'utf8');
    expect(side).toMatch(/!ready \|\| !notebookOn\) return;/);
  });
});

describe('kid features', () => {
  it('treats a missing list (old backend) as nothing disabled', () => {
    expect(disabledSet(undefined).size).toBe(0);
    expect(disabledSet(null).size).toBe(0);
    expect(disabledSet(['child.quiz']).has(KID_FEATURE.quiz)).toBe(true);
  });

  it('recognises the backend error for a feature the parent turned off', () => {
    expect(isFeatureDisabledError({ status: 403, errors: ['CHILD_FEATURE_DISABLED'] })).toBe(true);
    expect(isFeatureDisabledError({ status: 403, errors: null })).toBe(false);
    expect(isFeatureDisabledError({ status: 401, errors: ['CHILD_FEATURE_DISABLED'] })).toBe(false);
  });

  it('hides dock tabs whose feature is off and keeps core tabs', () => {
    const off = disabledSet(['child.library.browse', 'child.notebook', 'child.wishes', 'child.rewards']);
    expect(['lobby', 'journey'].every((t) => tabEnabled(t, off))).toBe(true);
    expect(['library', 'notebook', 'wishes', 'rewards'].some((t) => tabEnabled(t, off))).toBe(false);
    expect(tabEnabled('library', disabledSet([]))).toBe(true);
  });
});
