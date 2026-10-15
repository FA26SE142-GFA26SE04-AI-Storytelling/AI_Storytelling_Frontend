import type { ApiResponse, ChangePasswordRequest } from '@/app/types/auth';
import type { ChildProfile, CreateChildProfileRequest, LearningProfile, SetLearningProfileRequest, UpdateChildProfileRequest } from '@/app/types/childProfile';
import type {
  ChildAccessCredential, ChildSession, ChildSessionProfile, EasyLoginCode, Invitation, LoginSession,
  OwnershipTransfer, Permission, PermissionRequest, SupervisionRelationship,
} from '@/app/types/supervision';
import { delay, fail, ok } from './config';
import { db, MOCK_USER, persist } from './mockDb';

/** Dữ liệu mẫu cho Luồng 1 — mô phỏng các quy tắc chính của backend. */

const DEFAULT_PRESET: Permission[] = ['ViewProgress', 'ViewResults', 'ReceiveReport', 'ApproveStory'];
const nextId = () => { const s = db(); s.nextId += 1; return s.nextId; };
const save = <T>(value: T, message = ''): ApiResponse<T> => { persist(); return ok(value, message); };
const myRel = (childId: number) => db().relationships.find((r) => r.childProfileId === childId && r.supervisorUserId === MOCK_USER.id);
const isOwner = (childId: number) => myRel(childId)?.supervisorRole === 'Owner';

// ---------- Hồ sơ trẻ ----------
export const childProfileL1MockOverrides = {
  async getMyChildProfiles(): Promise<ApiResponse<ChildProfile[]>> {
    await delay();
    const mine = new Set(db().relationships.filter((r) => r.supervisorUserId === MOCK_USER.id).map((r) => r.childProfileId));
    return ok(db().children.filter((c) => mine.has(c.id) && c.status !== 'Archived'));
  },
  async createChildProfile(data: CreateChildProfileRequest): Promise<ApiResponse<ChildProfile>> {
    await delay();
    const child: ChildProfile = {
      id: nextId(), ownerUserId: MOCK_USER.id, nickname: data.nickname.trim(), ageBand: data.ageBand,
      language: 'vi', status: 'Draft', scope: 'Personal', createdAt: new Date().toISOString(),
    };
    db().children.push(child);
    // Bước 1.2b: tạo quan hệ Owner trong cùng thao tác.
    db().relationships.push({ id: nextId(), childProfileId: child.id, supervisorUserId: MOCK_USER.id, supervisorRole: 'Owner' });
    return save(child, 'Đã tạo hồ sơ bé.');
  },
  async updateChildProfile(id: number, data: UpdateChildProfileRequest): Promise<ApiResponse<ChildProfile>> {
    await delay();
    const child = db().children.find((c) => c.id === id);
    if (!child) return fail('Không tìm thấy hồ sơ bé.');
    Object.assign(child, { nickname: data.nickname.trim(), ageBand: data.ageBand });
    return save({ ...child }, 'Đã lưu hồ sơ bé.');
  },
  async activateChildProfile(id: number): Promise<ApiResponse<ChildProfile>> {
    await delay();
    const child = db().children.find((c) => c.id === id);
    if (!child) return fail('Không tìm thấy hồ sơ bé.');
    if (!db().learning[id]) return fail('Hồ sơ trẻ chưa có Learning Profile không thể kích hoạt.');
    const policy = db().policies[id];
    if (!policy) return fail('Hồ sơ trẻ chưa có Safety Policy — không thể kích hoạt.');
    child.status = policy.consentRecorded ? 'Active' : 'PendingParentConsent';
    return save({ ...child }, child.status === 'Active' ? 'Đã kích hoạt hồ sơ.' : 'Cần phụ huynh đồng ý trước khi kích hoạt.');
  },
  async getLearningProfile(childId: number): Promise<ApiResponse<LearningProfile>> {
    await delay();
    const lp = db().learning[childId];
    return lp ? ok(lp) : fail('Bé chưa có hồ sơ học tập.');
  },
  async setLearningProfile(childId: number, data?: Partial<SetLearningProfileRequest>): Promise<ApiResponse<unknown>> {
    await delay();
    db().learning[childId] = { id: childId, childProfileId: childId, readingLevel: data?.readingLevel ?? 2, comprehensionGoal: data?.comprehensionGoal ?? null, topics: data?.topics ?? [] };
    return save(db().learning[childId], 'Đã lưu hồ sơ học tập.');
  },
};

// ---------- Người giám sát ----------
export const supervisionMockOverrides = {
  async listSupervisors(childId: number): Promise<ApiResponse<SupervisionRelationship[]>> {
    await delay();
    return ok(db().relationships.filter((r) => r.childProfileId === childId));
  },
  async revokeSupervisor(relationshipId: number): Promise<ApiResponse<null>> {
    await delay();
    const rel = db().relationships.find((r) => r.id === relationshipId);
    if (!rel) return fail('Không tìm thấy người giám sát.');
    if (rel.supervisorRole === 'Owner') return fail('Owner không thể rời hồ sơ khi chưa chuyển quyền Owner.');
    db().relationships = db().relationships.filter((r) => r.id !== relationshipId);
    return save(null, 'Đã gỡ người giám sát.');
  },
  async listInvitations(childId: number): Promise<ApiResponse<Invitation[]>> {
    await delay();
    const now = Date.now();
    for (const i of db().invitations) if (i.status === 'Pending' && i.expiresAt && Date.parse(i.expiresAt) < now) i.status = 'Expired';
    return ok(db().invitations.filter((i) => i.childProfileId === childId));
  },
  async createInvitation(childId: number, inviteeEmail: string, expiresInDays = 7): Promise<ApiResponse<Invitation>> {
    await delay();
    if (!isOwner(childId)) return fail('Chỉ Owner mới được mời người giám sát.');
    const code = Math.random().toString(36).slice(2, 8).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const inv = { id: nextId(), childProfileId: childId, invitationCode: code, status: 'Pending', expiresAt: new Date(Date.now() + expiresInDays * 86_400_000).toISOString(), inviteeEmail };
    db().invitations.push(inv);
    return save(inv, `Đã gửi lời mời tới ${inviteeEmail}.`);
  },
  async cancelInvitation(invitationId: number): Promise<ApiResponse<null>> {
    await delay();
    const inv = db().invitations.find((i) => i.id === invitationId);
    if (inv) inv.status = 'Revoked';
    return save(null, 'Đã hủy lời mời.');
  },
  async acceptInvitation(code: string): Promise<ApiResponse<SupervisionRelationship>> {
    await delay();
    const inv = db().invitations.find((i) => i.invitationCode === code.trim().toUpperCase() && i.status === 'Pending');
    if (!inv || (inv.expiresAt && Date.parse(inv.expiresAt) < Date.now())) return fail('Mã mời không hợp lệ hoặc đã hết hạn.');
    if (myRel(inv.childProfileId)) return fail('Bạn đã là người giám sát của bé này.');
    inv.status = 'Accepted';
    const rel: SupervisionRelationship = { id: nextId(), childProfileId: inv.childProfileId, supervisorUserId: MOCK_USER.id, supervisorRole: 'AdditionalSupervisor' };
    db().relationships.push(rel);
    db().permissions[rel.id] = [...DEFAULT_PRESET];
    return save(rel, 'Đã tham gia giám sát.');
  },
  async listPermissions(relationshipId: number): Promise<ApiResponse<string[]>> {
    await delay();
    return ok(db().permissions[relationshipId] ?? []);
  },
  async grantPermission(relationshipId: number, permission: Permission): Promise<ApiResponse<null>> {
    await delay();
    const list = db().permissions[relationshipId] ?? [];
    if (!list.includes(permission)) list.push(permission);
    db().permissions[relationshipId] = list;
    return save(null, 'Đã cấp quyền.');
  },
  async revokePermission(relationshipId: number, permission: Permission): Promise<ApiResponse<null>> {
    await delay();
    db().permissions[relationshipId] = (db().permissions[relationshipId] ?? []).filter((p) => p !== permission);
    return save(null, 'Đã thu hồi quyền.');
  },
  async requestPermission(relationshipId: number, permission: Permission): Promise<ApiResponse<PermissionRequest>> {
    await delay();
    const req: PermissionRequest = { id: nextId(), supervisionRelationshipId: relationshipId, requesterUserId: MOCK_USER.id, status: 'Pending', permissions: [permission], createdAt: new Date().toISOString() };
    db().permissionRequests.push(req);
    return save(req, 'Đã gửi yêu cầu tới Owner.');
  },
  async listPermissionRequests(relationshipId: number): Promise<ApiResponse<PermissionRequest[]>> {
    await delay();
    return ok(db().permissionRequests.filter((r) => r.supervisionRelationshipId === relationshipId));
  },
  async answerPermissionRequest(requestId: number, action: 'accept' | 'reject' | 'cancel'): Promise<ApiResponse<PermissionRequest>> {
    await delay();
    const req = db().permissionRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'Pending') return fail('Yêu cầu không còn chờ xử lý.');
    req.status = action === 'accept' ? 'Accepted' : action === 'reject' ? 'Rejected' : 'Cancelled';
    req.respondedAt = new Date().toISOString();
    if (action === 'accept') {
      const list = db().permissions[req.supervisionRelationshipId] ?? [];
      db().permissions[req.supervisionRelationshipId] = [...new Set([...list, ...req.permissions])];
    }
    return save({ ...req }, 'Đã xử lý yêu cầu.');
  },
  async requestOwnershipTransfer(childId: number, targetSupervisorUserId: number): Promise<ApiResponse<OwnershipTransfer>> {
    await delay();
    const t: OwnershipTransfer = { id: nextId(), childProfileId: childId, currentOwnerUserId: MOCK_USER.id, targetSupervisorUserId, requesterUserId: MOCK_USER.id, responderUserId: targetSupervisorUserId, status: 'Pending', createdAt: new Date().toISOString() };
    db().transfers.push(t);
    return save(t, 'Đã gửi đề nghị chuyển quyền Owner.');
  },
  async listOwnershipTransfers(childId: number): Promise<ApiResponse<OwnershipTransfer[]>> {
    await delay();
    return ok(db().transfers.filter((t) => t.childProfileId === childId));
  },
  async answerOwnershipTransfer(transferId: number, accept: boolean): Promise<ApiResponse<unknown>> {
    await delay();
    const t = db().transfers.find((x) => x.id === transferId);
    if (!t || t.status !== 'Pending') return fail('Đề nghị không còn chờ xử lý.');
    t.status = accept ? 'Accepted' : 'Rejected';
    t.respondedAt = new Date().toISOString();
    if (accept) {
      for (const r of db().relationships.filter((x) => x.childProfileId === t.childProfileId)) {
        if (r.supervisorUserId === t.targetSupervisorUserId) { r.supervisorRole = 'Owner'; delete db().permissions[r.id]; }
        else if (r.supervisorUserId === t.currentOwnerUserId) { r.supervisorRole = 'AdditionalSupervisor'; db().permissions[r.id] = [...DEFAULT_PRESET]; }
      }
    }
    return save(null, accept ? 'Đã nhận quyền Owner.' : 'Đã từ chối.');
  },
};

// ---------- Truy cập của bé ----------
const fakeSession = (childId: number): ChildSession => ({ childProfileId: childId, avatarId: db().credentials[childId]?.avatarId ?? 'frog', accessToken: `mock-child-${childId}`, expiresInSeconds: 20 * 60 });
const easyCodes = new Map<string, { childId: number; expiresAt: number }>();

export const childAccessMockOverrides = {
  async getCredential(childId: number): Promise<ApiResponse<ChildAccessCredential>> {
    await delay();
    const c = db().credentials[childId];
    return c ? ok({ childProfileId: childId, avatarId: c.avatarId, hasPin: true, isLocked: false }) : fail('Chưa thiết lập truy cập cho bé.');
  },
  async setCredential(childId: number, avatarId: string, pin: string): Promise<ApiResponse<null>> {
    await delay();
    if (!/^\d{4}$/.test(pin)) return fail('PIN phải gồm đúng 4 chữ số.');
    db().credentials[childId] = { avatarId, pin };
    return save(null, 'Đã lưu avatar và mã PIN.');
  },
  async revokeCredential(childId: number): Promise<ApiResponse<null>> {
    await delay();
    delete db().credentials[childId];
    for (const [k, v] of easyCodes) if (v.childId === childId) easyCodes.delete(k);
    return save(null, 'Đã thu hồi truy cập của bé.');
  },
  async generateEasyLogin(childId: number): Promise<ApiResponse<EasyLoginCode>> {
    await delay();
    if (!db().credentials[childId]) return fail('Hãy đặt avatar và mã PIN cho bé trước.');
    for (const [k, v] of easyCodes) if (v.childId === childId) easyCodes.delete(k);
    const code = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = Date.now() + 5 * 60_000;
    easyCodes.set(code, { childId, expiresAt });
    return ok({ code, expiresAt: new Date(expiresAt).toISOString() });
  },
  async startSupervisedSession(childId: number): Promise<ApiResponse<ChildSession>> {
    await delay();
    const child = db().children.find((c) => c.id === childId);
    return child?.status === 'Active' ? ok(fakeSession(childId)) : fail('Bạn chưa vào đọc truyện được lúc này. Hãy nhờ bố mẹ giúp nhé!');
  },
  async loginWithEasyLogin(code: string): Promise<ApiResponse<ChildSession>> {
    await delay();
    const hit = easyCodes.get(code);
    if (!hit || hit.expiresAt < Date.now()) return fail('Mã không đúng hoặc đã hết hạn. Hãy nhờ bố mẹ tạo mã mới nhé!');
    easyCodes.delete(code);
    return ok(fakeSession(hit.childId));
  },
  async getSessionProfile(token: string): Promise<ApiResponse<ChildSessionProfile>> {
    await delay();
    const child = db().children.find((c) => token === `mock-child-${c.id}`);
    return child ? ok({ childProfileId: child.id, nickname: child.nickname, ageBand: child.ageBand }) : fail('Phiên của bé đã hết hạn.');
  },
  async verifyParentalGate(_email: string, password: string): Promise<ApiResponse<null>> {
    await delay();
    return password.length >= 1 ? ok(null) : fail('Mật khẩu chưa đúng.');
  },
};

// ---------- Tài khoản ----------
let sessions: LoginSession[] = [
  { id: 1, issuedAt: new Date(Date.now() - 3_600_000).toISOString(), expiresAt: new Date(Date.now() + 6 * 86_400_000).toISOString() },
  { id: 2, issuedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(), expiresAt: new Date(Date.now() + 5 * 86_400_000).toISOString() },
];

export const accountMockOverrides = {
  async verifyEmail(_email: string, token: string): Promise<ApiResponse<null>> {
    await delay();
    return token.trim() ? ok(null, 'Đã xác thực email.') : fail('Mã xác thực không đúng.');
  },
  async resendVerificationEmail(): Promise<ApiResponse<null>> { await delay(); return ok(null, 'Đã gửi lại mã xác thực (dữ liệu mẫu).'); },
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
    await delay();
    if (data.currentPassword === data.newPassword) return fail('Mật khẩu mới phải khác mật khẩu hiện tại.');
    sessions = sessions.slice(0, 1);
    return ok(null, 'Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.');
  },
  async listSessions(): Promise<ApiResponse<LoginSession[]>> { await delay(); return ok(sessions); },
  async revokeSession(id: number): Promise<ApiResponse<null>> { await delay(); sessions = sessions.filter((s) => s.id !== id); return ok(null, 'Đã đăng xuất phiên này.'); },
  async logoutAllDevices(): Promise<ApiResponse<null>> { await delay(); sessions = []; return ok(null); },
};
