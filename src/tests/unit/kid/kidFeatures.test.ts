import { describe, expect, it } from 'vitest';
import { disabledSet, isFeatureDisabledError, KID_FEATURE, tabEnabled } from '@/app/features/kid/kidFeatures';

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
