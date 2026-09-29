'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Users, Calendar, Sparkles, Check, School, User, Loader2 } from 'lucide-react';
import { flow4Service } from '../../../services/flow4Service';
import { storyService } from '../../../services/storyService';
import { childProfileService } from '../../../services/childProfileService';
import { useAuth } from '../../../context/AuthContext';
import { WORKING_VOLUMES_BOOKS } from '../../three/room/textures/workingVolumesBooks';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StoryOption {
  id: number;
  title: string;
  subtitle: string;
  color?: string;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [stories, setStories] = useState<StoryOption[]>([]);
  const [classGroups, setClassGroups] = useState<{ id: number; name: string }[]>([]);
  const [childProfiles, setChildProfiles] = useState<{ id: number; nickname: string }[]>([]);

  const [selectedStoryId, setSelectedStoryId] = useState<number>(1);
  const [targetType, setTargetType] = useState<'class' | 'child'>('class');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [dueDays, setDueDays] = useState<number>(3);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        const [storiesRes, classesRes, childrenRes] = await Promise.allSettled([
          storyService.getStories({ pageSize: 50 }),
          childProfileService.getMyClassGroups(),
          childProfileService.getMyChildProfiles(),
        ]);

        if (!isMounted) return;

        // 1. Stories
        let loadedStories: StoryOption[] = [];
        if (storiesRes.status === 'fulfilled' && storiesRes.value.success && storiesRes.value.data?.items?.length) {
          loadedStories = storiesRes.value.data.items.map((s, idx) => ({
            id: s.id,
            title: s.title,
            subtitle: `${s.ageBand || 'Độ tuổi chuẩn'} · ${s.categoryName || 'Truyện thiếu nhi'}`,
            color: idx % 3 === 0 ? '#6366f1' : idx % 3 === 1 ? '#f59e0b' : '#10b981',
          }));
        }

        // Fallback to Working Volumes if backend has 0 stories
        if (loadedStories.length === 0) {
          loadedStories = WORKING_VOLUMES_BOOKS.slice(0, 5).map((b, idx) => ({
            id: idx + 1,
            title: b.title,
            subtitle: `Tập ${b.volume} · ${b.discipline}`,
            color: b.color,
          }));
        }

        setStories(loadedStories);
        if (loadedStories.length > 0) {
          setSelectedStoryId(loadedStories[0].id);
        }

        // 2. Class Groups
        if (classesRes.status === 'fulfilled' && classesRes.value.success && classesRes.value.data?.length) {
          const classes = classesRes.value.data.map((c) => ({ id: c.id, name: c.name }));
          setClassGroups(classes);
          setSelectedClassId(classes[0].id);
        } else {
          const fallbackClass = [{ id: 1, name: 'Lớp Mầm Non Họa Mi (Lá 1)' }];
          setClassGroups(fallbackClass);
          setSelectedClassId(fallbackClass[0].id);
        }

        // 3. Child Profiles
        if (childrenRes.status === 'fulfilled' && childrenRes.value.success && childrenRes.value.data?.length) {
          const kids = childrenRes.value.data.map((c) => ({ id: c.id, nickname: c.nickname }));
          setChildProfiles(kids);
          setSelectedChildId(kids[0].id);
        } else {
          const fallbackKid = [{ id: 1, nickname: 'Nobita (Bé)' }];
          setChildProfiles(fallbackKid);
          setSelectedChildId(fallbackKid[0].id);
        }
      } catch (err) {
        console.error('Error hydrating CreateAssignmentModal:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedStory = stories.find((s) => s.id === selectedStoryId) || stories[0];
    const selectedClass = classGroups.find((c) => c.id === selectedClassId) || classGroups[0];
    const selectedChild = childProfiles.find((c) => c.id === selectedChildId) || childProfiles[0];

    const dueAt = new Date(Date.now() + dueDays * 86400000).toISOString();
    const assignedByUserId = user?.id ? Number(user.id) : 12;
    const assignedByName = user?.fullName || user?.username || 'Giáo viên phụ trách';

    flow4Service.createAssignment({
      storyId: selectedStory.id,
      storyTitle: selectedStory.title,
      assignedByUserId,
      assignedByName,
      classGroupId: targetType === 'class' ? (selectedClass ? selectedClass.id : 1) : null,
      classGroupName: targetType === 'class' ? (selectedClass ? selectedClass.name : 'Lớp học') : null,
      childProfileId: targetType === 'child' ? (selectedChild ? selectedChild.id : 1) : null,
      childName: targetType === 'child' ? (selectedChild ? selectedChild.nickname : 'Bé') : null,
      dueAt,
    });

    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
      <div className="w-full max-w-lg p-6 rounded-3xl border border-tod-border bg-tod-surface/95 backdrop-blur-2xl shadow-2xl relative text-tod-text max-h-[90vh] overflow-y-auto dashboard-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-tod-text-muted hover:text-tod-text hover:bg-tod-card transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-tod-text">Giao Bài Đọc Mới</h3>
            <p className="text-xs text-tod-text-muted">
              Chọn truyện đã kiểm duyệt từ Backend để giao cho học sinh hoặc toàn lớp
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-2 text-tod-text-muted">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
            <p className="text-xs font-bold">Đang tải danh sách tác phẩm và lớp học...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Chọn Truyện */}
            <div>
              <label className="block text-xs font-extrabold text-tod-text mb-1.5">
                1. Chọn tác phẩm đã phê duyệt:
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto dashboard-scrollbar pr-1">
                {stories.map((story) => {
                  const isSelected = selectedStoryId === story.id;
                  return (
                    <div
                      key={story.id}
                      onClick={() => setSelectedStoryId(story.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500 text-tod-text shadow-sm'
                          : 'bg-tod-card/60 border-tod-border text-tod-text-muted hover:text-tod-text'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: story.color || '#6366f1' }} />
                        <div className="truncate">
                          <p className="font-extrabold text-xs truncate">{story.title}</p>
                          <p className="text-[10px] text-tod-text-muted truncate">{story.subtitle}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Đối tượng nhận */}
            <div>
              <label className="block text-xs font-extrabold text-tod-text mb-1.5">
                2. Giao bài tới:
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setTargetType('class')}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    targetType === 'class'
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
                      : 'bg-tod-card/60 border-tod-border text-tod-text-muted'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Toàn bộ lớp học</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('child')}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    targetType === 'child'
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
                      : 'bg-tod-card/60 border-tod-border text-tod-text-muted'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Cá nhân bé</span>
                </button>
              </div>

              {/* Sub-selection: Specific Class or Child */}
              {targetType === 'class' ? (
                <div className="space-y-1">
                  <label className="text-[11px] text-tod-text-muted flex items-center gap-1 font-bold">
                    <School className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Chọn lớp học:</span>
                  </label>
                  <select
                    value={selectedClassId || ''}
                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                    className="dashboard-input w-full p-2 rounded-xl text-xs"
                  >
                    {classGroups.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] text-tod-text-muted flex items-center gap-1 font-bold">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Chọn bé nhận bài:</span>
                  </label>
                  <select
                    value={selectedChildId || ''}
                    onChange={(e) => setSelectedChildId(Number(e.target.value))}
                    className="dashboard-input w-full p-2 rounded-xl text-xs"
                  >
                    {childProfiles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nickname}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 3. Hạn hoàn thành */}
            <div>
              <label className="block text-xs font-extrabold text-tod-text mb-1.5">
                3. Thời hạn đọc:
              </label>
              <div className="flex items-center gap-2">
                {[1, 3, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDueDays(days)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      dueDays === days
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-tod-card/60 border-tod-border text-tod-text-muted'
                    }`}
                  >
                    {days === 1 ? 'Trong 24 giờ' : `${days} ngày tới`}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-tod-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text hover:bg-tod-card transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-dashboard-primary px-5 py-2.5 rounded-xl text-xs font-extrabold text-zinc-950 flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Giao bài ngay</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
