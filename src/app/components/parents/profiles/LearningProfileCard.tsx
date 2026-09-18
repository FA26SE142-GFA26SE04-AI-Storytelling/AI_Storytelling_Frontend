'use client';

import React from 'react';
import {
  Brain,
  BookOpen,
  Edit3,
  Save,
  X,
  RefreshCw,
  Plus,
  CheckCheck,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { LearningProfile } from '../../../types/childProfile';

export interface LearningProfileCardProps {
  childId: number;
  childNickname: string;
  learningProfile: LearningProfile | null;
  isEditingLearningProfile: boolean;
  setIsEditingLearningProfile: (val: boolean) => void;
  learningReadingLevel: number;
  setLearningReadingLevel: (val: number) => void;
  learningComprehensionGoal: string;
  setLearningComprehensionGoal: (val: string) => void;
  learningTopics: Array<{ topic: string; relation: 'FavoriteTopic' | 'Interested' | 'Avoid' }>;
  setLearningTopics: React.Dispatch<
    React.SetStateAction<Array<{ topic: string; relation: 'FavoriteTopic' | 'Interested' | 'Avoid' }>>
  >;
  customTopicInput: string;
  setCustomTopicInput: (val: string) => void;
  isSavingLearningProfile: boolean;
  handleSaveLearningProfile: () => void;
  learningProfileSuccessMsg: string | null;
  learningProfileErrorMsg: string | null;
  isLoadingDetail: boolean;
  onRefresh: () => void;
}

export const LearningProfileCard: React.FC<LearningProfileCardProps> = ({
  childNickname,
  learningProfile,
  isEditingLearningProfile,
  setIsEditingLearningProfile,
  learningReadingLevel,
  setLearningReadingLevel,
  learningComprehensionGoal,
  setLearningComprehensionGoal,
  learningTopics,
  setLearningTopics,
  customTopicInput,
  setCustomTopicInput,
  isSavingLearningProfile,
  handleSaveLearningProfile,
  learningProfileSuccessMsg,
  learningProfileErrorMsg,
  isLoadingDetail,
  onRefresh,
}) => {
  const getReadingLevelDesc = (level: number) => {
    switch (level) {
      case 1:
        return 'Cấp 1 • Làm quen chữ cái, nhận biết âm thanh & hình ảnh trực quan.';
      case 2:
        return 'Cấp 2 • Đọc hiểu câu ngắn có hội thoại đơn giản và cốt truyện gần gũi.';
      case 3:
        return 'Cấp 3 • Tư duy phân tích, từ vựng phong phú, khám phá thế giới & khoa học.';
      case 4:
        return 'Cấp 4 • Phát triển tư duy phản biện, suy luận logic và thấu cảm xã hội.';
      case 5:
        return 'Cấp 5 • Tưởng tượng chuyên sâu, phân tích tình huống phức tạp & đồng tác giả AI.';
      default:
        return 'Cấp độ nhận thức phát triển tự nhiên phù hợp theo lứa tuổi của bé.';
    }
  };

  const handleAddTopic = (relation: 'FavoriteTopic' | 'Interested' | 'Avoid') => {
    if (!customTopicInput.trim()) return;
    const trimmed = customTopicInput.trim();
    if (learningTopics.some((t) => t.topic.toLowerCase() === trimmed.toLowerCase())) {
      alert('Chủ đề này đã có trong danh sách.');
      return;
    }
    setLearningTopics([...learningTopics, { topic: trimmed, relation }]);
    setCustomTopicInput('');
  };

  const handleRemoveTopic = (topicName: string) => {
    setLearningTopics(learningTopics.filter((t) => t.topic !== topicName));
  };

  return (
    <div className="laptop-tab-content-row p-4 rounded-2xl bg-tod-card border border-tod-border flex flex-col gap-3 text-tod-text transition-colors duration-500 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-tod-border">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-sky-500" />
          <h3 className="text-xs font-bold text-tod-text">
            Hồ Sơ Học Tập (Learning Profile)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {!isEditingLearningProfile ? (
            <button
              type="button"
              onClick={() => setIsEditingLearningProfile(true)}
              className="px-2.5 py-1 rounded-lg bg-tod-surface hover:bg-tod-card text-tod-text border border-tod-border font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3 text-tod-text-muted" />
              <span>Cập nhật hồ sơ</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isSavingLearningProfile}
                onClick={handleSaveLearningProfile}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingLearningProfile ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                <span>Lưu hồ sơ</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingLearningProfile(false)}
                className="p-1 rounded-lg bg-tod-surface hover:bg-tod-card text-tod-text-muted hover:text-tod-text border border-tod-border transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onRefresh}
            title="Làm mới hồ sơ học tập"
            className="p-1 rounded-lg bg-tod-surface hover:bg-tod-card text-tod-text-muted hover:text-tod-text border border-tod-border transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingDetail ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        </div>
      </div>

      {isLoadingDetail ? (
        <div className="py-6 flex items-center justify-center gap-2 text-tod-text-muted text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
          <span>Đang nạp hồ sơ học tập...</span>
        </div>
      ) : isEditingLearningProfile ? (
        /* EDIT MODE */
        <div className="space-y-3.5 pt-1">
          {/* Reading Level Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-tod-text flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Cấp độ đọc hiểu (Reading Level: 1 - 5)
              </label>
              <span className="text-xs font-black text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                Cấp độ {learningReadingLevel} / 5
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLearningReadingLevel(lvl)}
                  className={`py-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                    learningReadingLevel === lvl
                      ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-tod-surface border-tod-border text-tod-text-muted hover:text-tod-text hover:bg-tod-card'
                  }`}
                >
                  Cấp {lvl}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-tod-text-muted mt-1.5 italic bg-tod-surface p-2 rounded-lg border border-tod-border">
              {getReadingLevelDesc(learningReadingLevel)}
            </p>
          </div>

          {/* Comprehension Goal */}
          <div>
            <label className="text-xs font-bold text-tod-text block mb-1">
              Mục tiêu đọc hiểu & Phát triển tư duy
            </label>
            <input
              type="text"
              value={learningComprehensionGoal}
              onChange={(e) => setLearningComprehensionGoal(e.target.value)}
              className="dashboard-input"
              placeholder="VD: Mở rộng vốn từ vựng, phát triển lòng trắc ẩn và tư duy logic..."
            />
          </div>

          {/* Topics Management */}
          <div>
            <label className="text-xs font-bold text-tod-text block mb-1.5">
              Chủ đề sở thích & Quan tâm của bé
            </label>

            {/* Current Topics Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 rounded-xl bg-tod-surface border border-tod-border">
              {learningTopics.length === 0 ? (
                <span className="text-[11px] text-tod-text-muted italic">Chưa có chủ đề nào được thêm.</span>
              ) : (
                learningTopics.map((t, idx) => {
                  const isFav = t.relation === 'FavoriteTopic';
                  const isInterested = t.relation === 'Interested';

                  return (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 border ${
                        isFav
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                          : isInterested
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <span>{isFav ? '⭐' : isInterested ? '👍' : '🚫'}</span>
                      <span>{t.topic}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(t.topic)}
                        className="hover:opacity-75 cursor-pointer ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Add Topic Input */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic('FavoriteTopic');
                  }
                }}
                className="dashboard-input flex-1"
                placeholder="Nhập tên chủ đề (VD: Khủng long, Khoa học vũ trụ, Động vật...)"
              />
              <button
                type="button"
                onClick={() => handleAddTopic('FavoriteTopic')}
                className="px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yêu thích</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddTopic('Avoid')}
                className="px-2 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Tránh</span>
              </button>
            </div>
          </div>
        </div>
      ) : learningProfile ? (
        /* READ-ONLY VIEW */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Reading Level Box */}
            <div className="p-3 rounded-xl bg-tod-surface border border-tod-border flex flex-col gap-1">
              <span className="text-[10px] font-bold text-tod-text-muted flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                Cấp độ đọc hiểu AI (Reading Level)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-500 dark:text-amber-400">
                  Cấp độ {learningProfile.readingLevel} / 5
                </span>
              </div>
              <p className="text-[10px] text-tod-text-muted mt-0.5">
                {getReadingLevelDesc(learningProfile.readingLevel)}
              </p>
            </div>

            {/* Comprehension Goal Box */}
            <div className="p-3 rounded-xl bg-tod-surface border border-tod-border flex flex-col gap-1">
              <span className="text-[10px] font-bold text-tod-text-muted flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-sky-500" />
                Mục tiêu đọc hiểu
              </span>
              <p className="text-xs text-tod-text font-medium leading-relaxed">
                {learningProfile.comprehensionGoal || 'Phát triển từ vựng và tư duy qua truyện kể sinh động'}
              </p>
            </div>
          </div>

          {/* Topics Chips */}
          <div className="p-3 rounded-xl bg-tod-surface border border-tod-border flex flex-col gap-2">
            <span className="text-[10px] font-bold text-tod-text-muted">
              Chủ đề ưa thích & Lĩnh vực quan tâm ({learningProfile.topics?.length ?? 0} chủ đề)
            </span>
            {learningProfile.topics && learningProfile.topics.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {learningProfile.topics.map((t, idx) => {
                  const isFav = t.relation === 'FavoriteTopic';
                  const isInterested = t.relation === 'Interested';
                  return (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 border ${
                        isFav
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                          : isInterested
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <span>{isFav ? '⭐ Yêu thích:' : isInterested ? '👍 Quan tâm:' : '🚫 Tránh:'}</span>
                      <span>{t.topic}</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-tod-text-muted italic">
                Chưa chọn chủ đề riêng. AI sẽ đề xuất câu chuyện đa dạng theo độ tuổi của bé.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="py-3 px-3.5 rounded-xl bg-tod-surface border border-tod-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-tod-text">
              Chưa cấu hình Hồ Sơ Học Tập cho bé {childNickname}
            </span>
            <span className="text-[10px] text-tod-text-muted">
              Thiết lập cấp độ đọc và chủ đề yêu thích để AI tạo truyện đúng trình độ của bé.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingLearningProfile(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 cursor-pointer shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Thiết lập ngay</span>
          </button>
        </div>
      )}

      {/* Feedback Alerts */}
      {learningProfileSuccessMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCheck className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{learningProfileSuccessMsg}</span>
        </div>
      )}

      {learningProfileErrorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{learningProfileErrorMsg}</span>
        </div>
      )}
    </div>
  );
};
