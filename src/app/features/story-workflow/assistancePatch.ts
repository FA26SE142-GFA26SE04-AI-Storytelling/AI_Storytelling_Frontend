import type { AssistancePatch, EditorSnapshot } from '@/app/types/backendContracts';
export function applyAssistancePatch(snapshot: EditorSnapshot, current: EditorSnapshot, patch: AssistancePatch): EditorSnapshot | null {
  if (current.title !== snapshot.title || current.content !== snapshot.content || !['insert','replace'].includes(patch.kind)) return null;
  const { start, length } = patch;
  const boundary = (index: number) => index >= 0 && index <= current.content.length && !(index > 0 && index < current.content.length && /[\uD800-\uDBFF]/.test(current.content[index - 1]) && /[\uDC00-\uDFFF]/.test(current.content[index]));
  if (!Number.isInteger(start) || !Number.isInteger(length) || length < 0 || !boundary(start) || !boundary(start + length) || (patch.kind === 'insert' && length !== 0) || current.content.slice(start, start + length) !== patch.quote) return null;
  return { ...current, content: current.content.slice(0,start) + patch.text + current.content.slice(start + length) };
}
