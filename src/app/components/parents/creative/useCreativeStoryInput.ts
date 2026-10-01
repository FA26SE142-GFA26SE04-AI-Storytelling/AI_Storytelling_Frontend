'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import { AIStoryInputContextDto, OutlineProgressDto } from '../../../types/aiStory';
import { loadCreativeContext } from './creativeStoryContext';

export function useCreativeStoryInput(childId: number | null) {
  const [context, setContext] = useState<AIStoryInputContextDto | null>(null);
  const [promptInput, setPrompt] = useState('');
  const [genreInput, setGenre] = useState('Thám hiểm & Phép thuật');
  const [lessonInput, setLesson] = useState('Lòng dũng cảm & Tinh thần sẻ chia');
  const [isSubmittingPrompt, setBusy] = useState(false);
  const [outlineProgress, setOutline] = useState<OutlineProgressDto | null>(null);
  const [creationFeedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const key = useRef<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    request.current?.abort(); lock.current = false; key.current = null;
    setContext(null); setOutline(null); setFeedback(null); setBusy(false);
    if (childId !== null) void loadCreativeContext(childId, controller.signal, setContext,
      message => setFeedback({ type: 'error', message }));
    return () => { controller.abort(); request.current?.abort(); };
  }, [childId]);

  const creationContext = context?.childProfileId === childId ? context : null;
  const handleSubmitPrompt = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current || childId === null || !creationContext) return;
    if (!promptInput.trim() || !lessonInput.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập ý tưởng và bài học của câu chuyện.' }); return;
    }
    const controller = new AbortController(); request.current = controller;
    lock.current = true; setBusy(true); setFeedback(null);
    key.current ??= crypto.randomUUID();
    try {
      const result = await api.submitInput({ childProfileId: childId, topic: promptInput.trim(), genre: genreInput.trim() || undefined,
        characterMode: 'ai_suggested', characters: [], settingMode: 'ai_suggested', lesson: lessonInput.trim(),
        vocabularyLevel: creationContext.defaultVocabularyLevel, language: creationContext.defaultLanguage,
        targetLength: Math.min(800, creationContext.maximumLength), idempotencyKey: key.current }, controller.signal);
      if (controller.signal.aborted) return;
      if (!result.success || !result.data) { setFeedback({ type: 'error', message: result.message }); return; }
      const accepted = result.data.inputStatus === 'input_accepted';
      setFeedback({ type: accepted ? 'success' : 'error', message: accepted
        ? 'Ý tưởng đã được kiểm duyệt an toàn. AI đang chuẩn bị dàn ý!'
        : result.data.fallbackMessage || result.message });
      if (accepted) {
        const outline = await api.getOutline(result.data.storyId, controller.signal);
        if (!controller.signal.aborted && outline.success && outline.data) setOutline(outline.data);
      }
    } catch {
      if (!controller.signal.aborted) setFeedback({ type: 'error', message: 'Lỗi kết nối khi gửi ý tưởng truyện.' });
    } finally {
      if (!controller.signal.aborted) { lock.current = false; setBusy(false); }
    }
  };

  return { creationContext, promptInput, genreInput, lessonInput, isSubmittingPrompt, outlineProgress, creationFeedback, handleSubmitPrompt,
    setPromptInput: (value: string) => { setPrompt(value); key.current = null; },
    setGenreInput: (value: string) => { setGenre(value); key.current = null; },
    setLessonInput: (value: string) => { setLesson(value); key.current = null; } };
}
