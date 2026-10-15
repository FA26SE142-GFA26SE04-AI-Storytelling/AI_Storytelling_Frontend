import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/mocks/config', async (orig) => ({ ...(await orig<typeof import('@/app/mocks/config')>()), delay: () => Promise.resolve() }));

import { resetMockDb } from '@/app/mocks/mockDb';
import { childProfileL1MockOverrides as profiles, supervisionMockOverrides as sup } from '@/app/mocks/mockSupervision';
import { childProfileMockOverrides } from '@/app/mocks/mockServices';

describe('mock Luồng 1', () => {
  beforeEach(() => resetMockDb());

  it('tạo hồ sơ bé ở trạng thái Nháp và tự tạo quan hệ Owner', async () => {
    const created = await profiles.createChildProfile({ nickname: 'Mít', ageBand: 'Age_6_8' });
    expect(created.data?.status).toBe('Draft');
    const rels = await sup.listSupervisors(created.data!.id);
    expect(rels.data).toEqual([expect.objectContaining({ supervisorRole: 'Owner' })]);
  });

  it('chỉ kích hoạt khi có hồ sơ học tập, cài đặt an toàn và đồng ý', async () => {
    const { data: child } = await profiles.createChildProfile({ nickname: 'Mít', ageBand: 'Age_6_8' });
    const id = child!.id;
    expect((await profiles.activateChildProfile(id)).success).toBe(false);

    await profiles.setLearningProfile(id, { readingLevel: 1, topics: [] });
    expect((await profiles.activateChildProfile(id)).success).toBe(false);

    await childProfileMockOverrides.setSafetyPolicy(id, { maxStoryLength: 800, requiredApprovalMode: 'AlwaysManual', parentalGateEnabled: true, consentRecorded: false });
    expect((await profiles.activateChildProfile(id)).data?.status).toBe('PendingParentConsent');

    await childProfileMockOverrides.setSafetyPolicy(id, { consentRecorded: true });
    expect((await profiles.activateChildProfile(id)).data?.status).toBe('Active');
  });

  it('lời mời đã hủy không dùng được nữa', async () => {
    const { data: child } = await profiles.createChildProfile({ nickname: 'Mít', ageBand: 'Age_6_8' });
    const inv = await sup.createInvitation(child!.id, 'ba@example.com');
    // Người dùng mẫu đã là Owner nên không nhận được lời mời của chính bé này.
    expect((await sup.acceptInvitation(inv.data!.invitationCode)).success).toBe(false);
    await sup.cancelInvitation(inv.data!.id);
    expect((await sup.acceptInvitation(inv.data!.invitationCode)).message).toMatch(/không hợp lệ/);
  });

  it('Owner không thể tự rời hồ sơ', async () => {
    const rels = await sup.listSupervisors(1);
    const owner = rels.data!.find((r) => r.supervisorRole === 'Owner')!;
    expect((await sup.revokeSupervisor(owner.id)).success).toBe(false);
  });

  it('chấp nhận yêu cầu cấp quyền thì quyền được thêm vào', async () => {
    const before = await sup.listPermissions(3);
    expect(before.data).not.toContain('AssignActivity');
    await sup.answerPermissionRequest(1, 'accept');
    expect((await sup.listPermissions(3)).data).toContain('AssignActivity');
  });
});
