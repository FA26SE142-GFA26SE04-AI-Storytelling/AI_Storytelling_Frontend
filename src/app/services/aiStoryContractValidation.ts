/** Reject malformed success envelopes before a workflow can advance. */
export function validStoryPayload(path: string, value: unknown): boolean {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : null;
  const positiveId = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
  if (path.startsWith('/ai-story-input/')) {
    if (path.endsWith('/context')) return !!data && positiveId(data.childProfileId) && typeof data.maximumLength === 'number' && Array.isArray(data.interests);
    return !!data && positiveId(data.storyId) && positiveId(data.requestId) &&
      ['pending_input', 'checking_input', 'input_accepted', 'input_blocked', 'input_check_failed'].includes(String(data.inputStatus));
  }
  if (path.endsWith('/generation/progress') || path.endsWith('/generation/retry')) {
    return !!data && positiveId(data.storyId) && typeof data.storyStatus === 'string' && typeof data.currentStep === 'string' && typeof data.isComplete === 'boolean';
  }
  if (/\/media\/(progress|retry)$/.test(path)) return !!data && positiveId(data.storyId) && typeof data.storyStatus === 'string' && typeof data.isReady === 'boolean';
  if (path.endsWith('/review/listening')) return !!data && positiveId(data.storyId) && positiveId(data.versionId) &&
    typeof data.required === 'boolean' && typeof data.reviewed === 'boolean' &&
    Array.isArray(data.plan) && data.plan.every(item => item && typeof item.type === 'string' && Number.isInteger(item.count) && item.count >= 0) &&
    Array.isArray(data.items) && data.items.every(item => item && positiveId(item.id) && typeof item.type === 'string' &&
      typeof item.isStale === 'boolean' && Array.isArray(item.options)) && Array.isArray(data.issues);
  if (path.endsWith('/review/confirm-package')) return !!data && positiveId(data.storyId) &&
    (positiveId(data.versionId) && ['Approved', 'MediaProcessing'].includes(String(data.status)) && typeof data.confirmedAt === 'string' ||
      data.storyStatus === 'OutlineReview' && typeof data.currentStep === 'string' && typeof data.isComplete === 'boolean');
  if (path.endsWith('/media/package')) return !!data && positiveId(data.storyId) && positiveId(data.storyVersionId) && Array.isArray(data.scenes);
  if (/\/outline$/.test(path) || /\/outline\/.*\/(regenerate|approve|reject)$/.test(path) || path.endsWith('/outline/retry')) {
    if (!data || !positiveId(data.storyId) || typeof data.storyStatus !== 'string') return false;
    const version = data.currentVersion;
    if (version === null) return true;
    if (!version || typeof version !== 'object') return false;
    const v = version as Record<string, unknown>;
    return positiveId(v.versionNo) && ['title', 'opening', 'development', 'ending'].every(k => typeof v[k] === 'string');
  }
  return value !== null && value !== undefined;
}
