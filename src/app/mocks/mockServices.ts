import type { ApiResponse, AuthResponseData, LoginRequest, UserProfile } from '@/app/types/auth';
import type { ContentCategory, SafetyPolicy, SetSafetyPolicyRequest } from '@/app/types/childProfile';
import type { PagedResult, StoryDto, StoryFilterRequest } from '@/app/types/story';
import { delay, fail, ok } from './config';
import { db, MOCK_CATEGORIES, MOCK_CHILDREN, MOCK_USER, persist, type MockStory } from './mockDb';
import { mockStoryStatus } from './mockAiStory';
import { childProfileL1MockOverrides } from './mockSupervision';

// ---------- Auth ----------
const LOGOUT_KEY = 'taletale-mock-logged-out';
const loggedOut = () => { try { return sessionStorage.getItem(LOGOUT_KEY) === '1'; } catch { return false; } };
const setLoggedOut = (v: boolean) => { try { sessionStorage.setItem(LOGOUT_KEY, v ? '1' : '0'); } catch { /* bỏ qua */ } };

/** Tài khoản vận hành mẫu (Luồng 5): đăng nhập bằng tên có chữ admin / mod / creator. */
const STAFF: Record<string, UserProfile> = {
  admin: { id: 900, username: 'admin', email: 'admin@taletale.site', fullName: 'Quản trị viên Taletale', role: 'Administrator', status: 'Active' },
  mod: { id: 901, username: 'moderator', email: 'mod@taletale.site', fullName: 'Lê Kiểm Duyệt', role: 'Moderator', status: 'Active' },
  creator: { id: 902, username: 'creator', email: 'creator@taletale.site', fullName: 'Phạm Sáng Tác', role: 'ContentCreator', status: 'Active' },
};
const USER_KEY = 'taletale-mock-user';
const currentUser = (): UserProfile => { try { const raw = sessionStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : MOCK_USER; } catch { return MOCK_USER; } };
const setCurrentUser = (u: UserProfile) => { try { sessionStorage.setItem(USER_KEY, JSON.stringify(u)); } catch { /* bỏ qua */ } };
const staffFor = (identifier: string): UserProfile | null => {
  const id = identifier.toLowerCase();
  if (id.includes('admin')) return STAFF.admin;
  if (id.includes('creator')) return STAFF.creator;
  if (id.includes('mod')) return STAFF.mod;
  return null;
};
const SETUP_KEY = 'taletale-mock-mfa-setup';
let pendingStaff: UserProfile | null = null;

export function authMockOverrides(notify: (user: UserProfile | null, token: string | null) => void) {
  return {
    async checkBackendHealth() { return { isOnline: true, message: 'Đang dùng dữ liệu mẫu.' }; },
    getStoredAccessToken: () => (loggedOut() ? null : 'mock-access-token'),
    getStoredRefreshToken: () => (loggedOut() ? null : 'mock-refresh-token'),
    getStoredUser: () => (loggedOut() ? null : currentUser()),
    isTokenExpired: () => false,
    async getProfile(): Promise<ApiResponse<UserProfile>> {
      return loggedOut() ? fail<UserProfile>('Chưa đăng nhập.') : ok(currentUser());
    },
    async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponseData>> {
      await delay();
      const staff = staffFor(credentials.identifier);
      if (staff) {
        // Tài khoản vận hành bắt buộc TOTP; lần đầu phải thiết lập bằng mã QR.
        pendingStaff = staff;
        let setupDone = false;
        try { setupDone = sessionStorage.getItem(SETUP_KEY + staff.id) === '1'; } catch { /* bỏ qua */ }
        return ok({ accessToken: '', refreshToken: '', tokenType: 'Bearer', expiresInSeconds: 0, user: staff, mfaRequired: setupDone, mfaSetupRequired: !setupDone, mfaChallengeToken: 'mock-challenge',
          mfaProvisioningUri: setupDone ? null : `otpauth://totp/Taletale:${staff.email}?secret=JBSWY3DPEHPK3PXP&issuer=Taletale` });
      }
      setLoggedOut(false);
      setCurrentUser(MOCK_USER);
      const data: AuthResponseData = { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', tokenType: 'Bearer', expiresInSeconds: 3600, user: MOCK_USER };
      notify(MOCK_USER, data.accessToken);
      return ok(data);
    },
    async verifyMfa(_challenge: string, code: string): Promise<ApiResponse<AuthResponseData>> {
      await delay();
      if (!pendingStaff || !/^d{6}$/.test(code)) return fail('Mã xác thực gồm 6 chữ số.');
      const u = pendingStaff;
      try { sessionStorage.setItem(SETUP_KEY + u.id, '1'); } catch { /* bỏ qua */ }
      setLoggedOut(false);
      setCurrentUser(u);
      const data: AuthResponseData = { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', tokenType: 'Bearer', expiresInSeconds: 3600, user: u };
      notify(u, data.accessToken);
      return ok(data);
    },
    async register() { await delay(); return ok(null, 'Đăng ký thành công (dữ liệu mẫu).'); },
    async forgotPassword() { await delay(); return ok(null, 'Đã gửi (dữ liệu mẫu).'); },
    async resetPassword() { await delay(); return ok(null, 'Đã đổi mật khẩu (dữ liệu mẫu).'); },
    async logout(): Promise<ApiResponse<object | null>> {
      setLoggedOut(true);
      notify(null, null);
      return ok(null, 'Đã đăng xuất.');
    },
  };
}

// ---------- Child profiles / safety ----------
function defaultPolicy(childId: number): SafetyPolicy {
  return {
    id: childId, childProfileId: childId, maxStoryLength: childId === 2 ? 1200 : 800, requiredApprovalMode: 'AlwaysManual',
    parentalGateEnabled: true, consentRecorded: true, consentPolicyVersion: 1,
    comprehensionThresholdPercent: 70, comprehensionWindowSize: 3,
    categories: [{ contentCategoryId: 5, rule: 'Blocked' }, { contentCategoryId: 6, rule: 'Blocked' }],
  };
}

export const childProfileMockOverrides = {
  ...childProfileL1MockOverrides,
  async getContentCategories(): Promise<ApiResponse<ContentCategory[]>> { await delay(); return ok(MOCK_CATEGORIES); },
  async getSafetyPolicy(childId: number): Promise<ApiResponse<SafetyPolicy>> {
    await delay();
    const policy = db().policies[childId] ?? (MOCK_CHILDREN.some((c) => c.id === childId) ? defaultPolicy(childId) : null);
    return policy ? ok(policy) : fail<SafetyPolicy>('Bé chưa có cài đặt an toàn.');
  },
  async setSafetyPolicy(childId: number, data?: Partial<SetSafetyPolicyRequest>): Promise<ApiResponse<unknown>> {
    await delay();
    const base = db().policies[childId] ?? defaultPolicy(childId);
    db().policies[childId] = {
      ...base, ...data, categories: data?.categories?.map((c) => ({ contentCategoryId: c.contentCategoryId, rule: c.rule })) ?? base.categories,
    } as SafetyPolicy;
    persist();
    return ok(null, 'Đã lưu quy tắc an toàn (dữ liệu mẫu).');
  },
};

// ---------- Stories ----------
function toDto(s: MockStory): StoryDto {
  const status = mockStoryStatus(s);
  const paragraphs = s.content.split(/\n\s*\n/);
  return {
    id: s.id, title: s.title, synopsis: paragraphs[0], content: s.content, genre: s.genre, moralLesson: s.lesson,
    ageBand: db().children.find((c) => c.id === s.childId)?.ageBand ?? MOCK_CHILDREN.find((c) => c.id === s.childId)?.ageBand ?? 'Age_6_8', language: 'vi', source: s.source === 'manual' ? 'Manual' : 'AI', status,
    isPublished: status === 'ready', authorUserId: 1, authorName: MOCK_USER.fullName, createdAt: s.createdAt, childProfileId: s.childId,
    categoryName: s.genre, pages: paragraphs.map((content, i) => ({ id: s.id * 100 + i, pageNumber: i + 1, content })),
  };
}

const emptyPage = (items: StoryDto[], f?: StoryFilterRequest): PagedResult<StoryDto> => ({
  items, totalCount: items.length, pageNumber: f?.pageNumber ?? 1, pageSize: f?.pageSize ?? items.length, totalPages: 1, hasPreviousPage: false, hasNextPage: false,
});

export const storyMockOverrides = {
  async getStories(filter?: StoryFilterRequest): Promise<ApiResponse<PagedResult<StoryDto>>> {
    await delay();
    const q = filter?.search?.toLowerCase();
    const items = db().stories
      .filter((s) => !s.archived && mockStoryStatus(s) !== 'input_accepted')
      .filter((s) => (filter?.childProfileId ? s.childId === filter.childProfileId : true))
      .map(toDto)
      .filter((s) => (filter?.status ? s.status === filter.status : true) && (q ? s.title.toLowerCase().includes(q) : true));
    return ok(emptyPage(items, filter));
  },
  async getStoryById(id: number): Promise<ApiResponse<StoryDto | null>> {
    await delay();
    const s = db().stories.find((x) => x.id === id);
    return s ? ok<StoryDto | null>(toDto(s)) : { success: false, message: 'Không tìm thấy truyện.', data: null };
  },
};
