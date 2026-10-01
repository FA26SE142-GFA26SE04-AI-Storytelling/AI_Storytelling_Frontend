'use client';

import React from 'react';
import { ArrowRight, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { AIStoryInputContextDto } from '../../../types/aiStory';
import { AIStoryInputFormValues } from '../hooks/aiStoryInputFlowUtils';

interface AIStoryInputFormProps {
  context: AIStoryInputContextDto;
  values: AIStoryInputFormValues;
  isSubmitting: boolean;
  onChange: (updates: Partial<AIStoryInputFormValues>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const AIStoryInputForm: React.FC<AIStoryInputFormProps> = ({
  context,
  values,
  isSubmitting,
  onChange,
  onSubmit,
  onBack,
}) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-2xl bg-tod-card border border-tod-border shadow-sm transition-colors duration-500">
        <label className="text-sm font-black uppercase text-tod-text tracking-wider flex items-center gap-2 mb-2.5">
          <Sparkles className="w-4 h-4 text-sky-500" /> Ý tưởng hoặc chủ đề câu chuyện
        </label>
        <textarea
          value={values.topic}
          onChange={(event) => onChange({ topic: event.target.value })}
          rows={3}
          maxLength={200}
          className="w-full text-sm text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl p-3.5 focus:outline-none focus:border-sky-500 leading-relaxed placeholder:text-tod-text-muted/60 transition-colors"
          placeholder="Ví dụ: Chú Sóc Bông đi tìm hạt dẻ vàng và học cách sẻ chia cùng bạn bè..."
        />
        {context.interests.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-tod-text-muted font-bold">Gợi ý theo sở thích bé:</span>
            {context.interests.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => onChange({ topic: values.topic ? `${values.topic}, ${interest}` : interest })}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/30 hover:border-sky-500 transition-colors cursor-pointer"
              >
                + {interest}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-xl bg-tod-card border border-tod-border shadow-sm">
          <label className="text-xs font-bold text-tod-text-muted block mb-1.5">Thể loại</label>
          <input
            type="text"
            value={values.genre}
            maxLength={50}
            onChange={(event) => onChange({ genre: event.target.value })}
            className="w-full text-sm text-tod-text bg-tod-surface/90 border border-tod-border rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="p-4 rounded-xl bg-tod-card border border-tod-border shadow-sm">
          <label className="text-xs font-bold text-tod-text-muted block mb-1.5">Bài học đạo đức</label>
          <input
            type="text"
            value={values.lesson}
            maxLength={500}
            onChange={(event) => onChange({ lesson: event.target.value })}
            className="w-full text-sm text-tod-text bg-tod-surface/90 border border-tod-border rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="p-4 rounded-xl bg-tod-card border border-tod-border shadow-sm">
          <label className="text-xs font-bold text-tod-text-muted block mb-1.5">
            Nhân vật chính <span className="font-normal">(để trống nếu muốn AI gợi ý)</span>
          </label>
          <input
            type="text"
            value={values.charactersText}
            onChange={(event) => onChange({ charactersText: event.target.value })}
            className="w-full text-sm text-tod-text bg-tod-surface/90 border border-tod-border rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="p-4 rounded-xl bg-tod-card border border-tod-border shadow-sm">
          <label className="text-xs font-bold text-tod-text-muted block mb-1.5">
            Độ dài mục tiêu (tối đa {context.maximumLength.toLocaleString()} từ)
          </label>
          <input
            type="number"
            min={1}
            max={context.maximumLength}
            value={values.targetLength}
            onChange={(event) => onChange({ targetLength: Number(event.target.value) || 1 })}
            className="w-full text-sm text-tod-text bg-tod-surface/90 border border-tod-border rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
          />
          <p className="mt-1 text-[10px] text-tod-text-muted">
            Từ vựng {context.defaultVocabularyLevel.replace('level_', 'cấp ')} · Ngôn ngữ {context.defaultLanguage}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
        >
          Quay lại chọn hình thức
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !values.topic.trim() || !values.lesson.trim()}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-xl shadow-sky-950/20 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi ý tưởng...</>
          ) : (
            <><Wand2 className="w-4 h-4" /> Kiểm tra & phác thảo <ArrowRight className="w-3.5 h-3.5" /></>
          )}
        </button>
      </div>
    </form>
  );
};
