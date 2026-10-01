import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import type { AIStoryInputContextDto } from '../../../types/aiStory';

export async function loadCreativeContext(childId: number, signal: AbortSignal, onContext: (context: AIStoryInputContextDto) => void, onError: (message: string) => void) {
  const result = await api.getCreationContext(childId, signal);
  if (signal.aborted) return;
  if (result.success && result.data?.childProfileId === childId) onContext(result.data);
  else onError(result.message || 'Không thể tải cấu hình sáng tác của bé.');
}
