'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { flow4Service } from '../../../services/flow4Service';
import {
  AssignmentItem,
  AssignmentStatus,
  AssignmentRecipientItem,
} from '../../../types/flow4Types';
import { AssignmentCard } from './AssignmentCard';
import { CreateAssignmentModal } from './CreateAssignmentModal';
import { O2OScoringModal } from './O2OScoringModal';

import { useAuth } from '../../../context/AuthContext';

export interface AssignmentManagerTabProps {
  onLogin?: () => void;
}

export const AssignmentManagerTab: React.FC<AssignmentManagerTabProps> = ({ onLogin: _onLogin }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'completed' | 'cancelled'>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [scoringTarget, setScoringTarget] = useState<{
    assignment: AssignmentItem;
    recipient: AssignmentRecipientItem;
  } | null>(null);

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadAssignments = () => {
    const list = flow4Service.getAssignments();
    setAssignments(list);
  };

  useEffect(() => {
    loadAssignments();
    flow4Service.fetchAssignmentsFromApi().then((data) => {
      if (data && data.length > 0) {
        setAssignments(data);
      }
    });
  }, []);

  const handleCancelAssignment = (assignmentId: number, recipientId?: number) => {
    const cancelledByUserId = user?.id ? Number(user.id) : 12;
    const cancelledByName = user?.fullName || user?.username || 'Giáo viên phụ trách';

    const success = flow4Service.cancelAssignment(
      assignmentId,
      cancelledByUserId,
      cancelledByName,
      recipientId
    );
    if (success) {
      loadAssignments();
      setActionFeedback('Đã rút lại bài tập thành công và gửi thông báo tới phụ huynh.');
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.storyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.classGroupName && a.classGroupName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'assigned') return a.status === AssignmentStatus.Assigned || a.status === AssignmentStatus.InProgress;
    if (statusFilter === 'completed') return a.status === AssignmentStatus.Completed;
    if (statusFilter === 'cancelled') return a.status === AssignmentStatus.Cancelled;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner and Actions */}
      <div className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-tod-border bg-tod-card/90 backdrop-blur-xl text-tod-text shadow-sm transition-colors duration-500">
        <div>
          <h3 className="text-base font-extrabold text-tod-text flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Kế Hoạch Đọc Sách & Giao Bài (Assignment)</span>
          </h3>
          <p className="text-xs text-tod-text-muted mt-0.5">
            Phân phối tác phẩm tới học sinh, theo dõi tiến độ đọc và đánh giá tương tác O2O
          </p>
        </div>

        {user && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-dashboard-primary px-4 py-2.5 rounded-xl text-xs font-extrabold text-zinc-950 flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Giao bài mới</span>
          </button>
        )}
      </div>

      {/* Action Feedback Notification */}
      {actionFeedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-tod-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên truyện hoặc lớp..."
            className="dashboard-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-tod-card border border-tod-border w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả', count: assignments.length },
            {
              id: 'assigned',
              label: 'Đang làm',
              count: assignments.filter((a) => a.status === AssignmentStatus.Assigned).length,
            },
            {
              id: 'completed',
              label: 'Hoàn thành',
              count: assignments.filter((a) => a.status === AssignmentStatus.Completed).length,
            },
            {
              id: 'cancelled',
              label: 'Đã hủy',
              count: assignments.filter((a) => a.status === AssignmentStatus.Cancelled).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as 'all' | 'assigned' | 'completed' | 'cancelled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-tod-text-muted hover:text-tod-text'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="p-10 rounded-2xl text-center border border-tod-border bg-tod-card/90 backdrop-blur-xl text-tod-text-muted">
          <BookOpen className="w-8 h-8 text-tod-text-muted mx-auto mb-2 opacity-50" />
          <p className="font-extrabold text-sm text-tod-text">Không tìm thấy bài tập nào</p>
          <p className="text-xs text-tod-text-muted mt-1">
            Bấm vào nút "Giao bài mới" để chọn truyện cho học sinh đọc
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onCancelAssignment={handleCancelAssignment}
              onOpenO2OModal={(a, r) => setScoringTarget({ assignment: a, recipient: r })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadAssignments();
          setActionFeedback('Giao bài đọc mới thành công!');
          setTimeout(() => setActionFeedback(null), 3000);
        }}
      />

      <O2OScoringModal
        isOpen={scoringTarget !== null}
        onClose={() => setScoringTarget(null)}
        assignment={scoringTarget?.assignment || null}
        recipient={scoringTarget?.recipient || null}
        onSuccess={() => {
          loadAssignments();
          setActionFeedback('Đã chấm điểm O2O và gửi thông báo tặng sao thành công!');
          setTimeout(() => setActionFeedback(null), 3000);
        }}
      />
    </div>
  );
};
