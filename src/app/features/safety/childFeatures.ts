/** Quyền của bé: 5 công tắc mới trong cài đặt an toàn (điều ước và giọng nói nằm ở chỗ cũ). */
export type ChildFeatureField = 'quizEnabled' | 'notebookEnabled' | 'libraryBrowseEnabled' | 'reflectionEnabled' | 'rewardsEnabled';

export type ChildFeatureFlags = Record<ChildFeatureField, boolean>;

export const CHILD_FEATURE_TOGGLES: { field: ChildFeatureField; label: string; hint: string; warning?: string }[] = [
  { field: 'quizEnabled', label: 'Câu đố sau truyện', hint: 'Bé trả lời vài câu hỏi ngắn sau khi đọc xong',
    warning: 'Tắt câu đố thì EXP và tiến độ lộ trình từ câu đố không được tính.' },
  { field: 'notebookEnabled', label: 'Sổ từ vựng', hint: 'Bé lưu từ mới vào sổ để xem lại' },
  { field: 'libraryBrowseEnabled', label: 'Tìm truyện trong thư viện', hint: 'Tắt thì bé chỉ đọc truyện trong lộ trình và truyện gia đình' },
  { field: 'reflectionEnabled', label: 'Cảm nhận sau truyện', hint: 'Bé chọn cảm xúc, cảnh thích nhất và ghi lại cảm nhận' },
  { field: 'rewardsEnabled', label: 'Phần thưởng và cây kiến thức', hint: 'Bé xem huy hiệu và tưới cây kiến thức' },
];

/** Thiếu trường (backend cũ hoặc bé chưa có cài đặt) = bật. */
export function readChildFeatures(policy: Partial<Record<ChildFeatureField, boolean>> | null | undefined): ChildFeatureFlags {
  return {
    quizEnabled: policy?.quizEnabled ?? true,
    notebookEnabled: policy?.notebookEnabled ?? true,
    libraryBrowseEnabled: policy?.libraryBrowseEnabled ?? true,
    reflectionEnabled: policy?.reflectionEnabled ?? true,
    rewardsEnabled: policy?.rewardsEnabled ?? true,
  };
}
