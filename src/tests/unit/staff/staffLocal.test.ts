import { describe, expect, it } from 'vitest';
import { staffLocal, PUBLIC_STORY_BASE } from '@/app/services/staffLocal';
import { guardianLocal } from '@/app/services/guardianLocal';

const ADMIN = 900;
const MOD = 901;

describe('Tài khoản vận hành', () => {
  it('không mời trùng email đã dùng', () => {
    expect(staffLocal.invite('Moderator', 'mod@taletale.site', 'A', '').success).toBe(false);
    expect(staffLocal.invite('Moderator', 'moi.mod@taletale.site', 'Mod Mới', 'Giáo viên').data?.status).toBe('invited');
  });

  it('không tự vô hiệu hoá mình, luôn còn ít nhất 1 Administrator', () => {
    expect(staffLocal.setStatus(ADMIN, false, ADMIN).message).toMatch(/tự vô hiệu/);
    expect(staffLocal.setStatus(ADMIN, false, 12345).message).toMatch(/ít nhất một Administrator/);
  });

  it('đơn Content Creator: duyệt cần nhận xét, sau đó có tài khoản Content Creator', () => {
    const app = staffLocal.apply({ fullName: 'Tác Giả', email: 'tacgia@gmail.com', password: 'abc12345', expertise: 'Tác giả', yearsExperience: 3, experienceNote: 'Viết truyện', portfolioUrl: '' }).data!;
    expect(staffLocal.apply({ fullName: 'Tác Giả', email: 'tacgia@gmail.com', password: 'abc12345', expertise: 'x', yearsExperience: 1, experienceNote: 'x', portfolioUrl: '' }).success).toBe(false);
    expect(staffLocal.reviewApplication(app.id, true, '').success).toBe(false);
    expect(staffLocal.reviewApplication(app.id, true, 'Hồ sơ tốt').success).toBe(true);
    expect(staffLocal.staff().data!.some((s) => s.email === 'tacgia@gmail.com' && s.role === 'ContentCreator')).toBe(true);
  });
});

describe('Hàng đợi kiểm duyệt', () => {
  it('phải nhận xử lý trước; từ chối bắt buộc lý do', () => {
    const item = staffLocal.queue().data!.find((i) => i.itemType === 'gray_zone_story')!;
    expect(staffLocal.decide(item.id, MOD, 'blocked', 'Không an toàn').success).toBe(false);
    expect(staffLocal.claim(item.id, MOD).success).toBe(true);
    expect(staffLocal.claim(item.id, 999).success).toBe(false);
    expect(staffLocal.decide(item.id, MOD, 'blocked', '').success).toBe(false);
    expect(staffLocal.decide(item.id, MOD, 'blocked', 'Cổ vũ đi theo người lạ').success).toBe(true);
  });

  it('truyện mẫu được Moderator duyệt thì xuất hiện trong Thư viện chung', () => {
    const id = PUBLIC_STORY_BASE + 2;
    expect(staffLocal.publicStories().some((s) => s.id === id)).toBe(false);
    const item = staffLocal.queue().data!.find((i) => i.itemType === 'public_story_review' && i.refId === id)!;
    staffLocal.claim(item.id, MOD);
    staffLocal.decide(item.id, MOD, 'approved', '', ['Thiên nhiên'], [16]);
    expect(staffLocal.publicStories().some((s) => s.id === id)).toBe(true);
  });

  it('báo cáo nội dung của phụ huynh vào hàng đợi; lưu trữ thì cập nhật trạng thái báo cáo', () => {
    const report = guardianLocal.reportStory(3, 'safety_concern', 'Có cảnh đáng sợ').data!;
    const item = staffLocal.queue().data!.find((i) => i.itemType === 'content_report' && i.refId === report.id)!;
    expect(item.priority).toBe('high');
    staffLocal.claim(item.id, MOD);
    staffLocal.decide(item.id, MOD, 'archived', 'Vi phạm an toàn');
    expect(guardianLocal.storyModeration(3).data!.reports[0].status).toBe('reviewed_archived');
  });

  it('bài nộp thư viện cộng đồng: Moderator duyệt thì trạng thái chuyển "approved"', () => {
    const sub = guardianLocal.submitCommunity(5).data!;
    const item = staffLocal.queue().data!.find((i) => i.itemType === 'community_submission' && i.refId === sub.id)!;
    staffLocal.claim(item.id, MOD);
    staffLocal.decide(item.id, MOD, 'approved', '');
    expect(guardianLocal.storyModeration(5).data!.submission?.status).toBe('approved');
  });
});

describe('Content Creator', () => {
  it('chặn gửi duyệt khi còn thông tin cá nhân', () => {
    const st = staffLocal.saveStory({ title: 'Bé Lan', targetAgeBand: 'Age_6_8', readingLevel: 1, genre: 'Đời sống hằng ngày', topic: 'Gia đình', moralLesson: 'Yêu thương', content: 'Bé Lan học Trường Tiểu học Kim Đồng, gọi mẹ qua số 0912 345 678 mỗi chiều đi học về nhà.' }).data!;
    expect(staffLocal.submitStory(st.id).message).toMatch(/thông tin cá nhân/);
  });

  it('bộ truyện mẫu chỉ gồm truyện đang công khai; bản đã công khai không sửa trực tiếp', () => {
    expect(staffLocal.saveTemplate({ title: 'Bộ thử', description: '', targetAgeBand: 'Age_6_8', readingLevelMin: 1, readingLevelMax: 2, topic: 'x', storyIds: [PUBLIC_STORY_BASE + 3], defaultDaysPerStep: 3 }).success).toBe(false);
    const published = staffLocal.myTemplates().data!.find((t) => t.status === 'published')!;
    expect(staffLocal.saveTemplate({ ...published, title: 'Đổi tên' }).message).toMatch(/Nhân bản/);
  });
});

describe('Prompt Catalog (BR-5.E1)', () => {
  it('không publish khi chưa chạy đánh giá hoặc còn case tấn công lọt qua', () => {
    const draft = staffLocal.draftVersion('Ngưỡng lỏng', 0.5, 0.9, '2026-11-01').data!;
    expect(staffLocal.publishVersion(draft.id).message).toMatch(/Chưa có lượt đánh giá/);
    staffLocal.runEvaluation(draft.id);
    expect(staffLocal.publishVersion(draft.id).message).toMatch(/case adversarial/);
  });

  it('bản ngưỡng chặt chạy đánh giá đạt thì publish được', () => {
    const v2 = staffLocal.versions().data!.find((v) => v.version === 'v2')!;
    staffLocal.runEvaluation(v2.id);
    expect(staffLocal.publishVersion(v2.id).success).toBe(true);
  });
});
