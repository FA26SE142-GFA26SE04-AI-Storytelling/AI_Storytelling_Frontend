import type { ApiResponse, AuthResponseData, LoginRequest, UserProfile } from '../types/auth';
import type { ChildProfile, ContentCategory, SafetyPolicy, SetSafetyPolicyRequest } from '../types/childProfile';
import type { PagedResult, StoryDto, StoryFilterRequest } from '../types/story';
import { delay, fail, ok } from './config';
import { db, MOCK_CATEGORIES, MOCK_CHILDREN, MOCK_USER, persist, type MockStory } from './mockDb';
import { mockStoryStatus } from './mockAiStory';

// ---------- Auth ----------
const LOGOUT_KEY = 'taletale-mock-logged-out';
const loggedOut = () => { try { return sessionStorage.getItem(LOGOUT_KEY) === '1'; } catch { return false; } };
const setLoggedOut = (v: boolean) => { try { sessionStorage.setItem(LOGOUT_KEY, v ? '1' : '0'); } catch { /* bỏ qua */ } };

export function authMockOverrides(notify: (user: UserProfile | null, token: string | null) => void) {
  return {
    async checkBackendHealth() { return { isOnline: true, message: 'Đang dùng dữ liệu mẫu.' }; },
    getStoredAccessToken: () => (loggedOut() ? null : 'mock-access-token'),
    getStoredRefreshToken: () => (loggedOut() ? null : 'mock-refresh-token'),
    getStoredUser: () => (loggedOut() ? null : MOCK_USER),
    isTokenExpired: () => false,
    async getProfile(): Promise<ApiResponse<UserProfile>> {
      return loggedOut() ? fail<UserProfile>('Chưa đăng nhập.') : ok(MOCK_USER);
    },
    async login(_credentials: LoginRequest): Promise<ApiResponse<AuthResponseData>> {
      await delay();
      setLoggedOut(false);
      const data: AuthResponseData = { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', tokenType: 'Bearer', expiresInSeconds: 3600, user: MOCK_USER };
      notify(MOCK_USER, data.accessToken);
      return ok(data);
    },
    async register() { await delay(); return ok(null, 'Đăng ký thành công (dữ liệu mẫu).'); },
    async forgotPassword() { await delay(); return ok(null, 'Đã gửi (dữ liệu mẫu).'); },
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
    parentalGateEnabled: true, consentRecorded: true,
    categories: [{ contentCategoryId: 5, rule: 'Blocked' }, { contentCategoryId: 6, rule: 'Blocked' }],
  };
}

export const childProfileMockOverrides = {
  async getMyChildProfiles(): Promise<ApiResponse<ChildProfile[]>> { await delay(); return ok(MOCK_CHILDREN); },
  async getContentCategories(): Promise<ApiResponse<ContentCategory[]>> { await delay(); return ok(MOCK_CATEGORIES); },
  async getSafetyPolicy(childId: number): Promise<ApiResponse<SafetyPolicy>> {
    await delay();
    return ok(db().policies[childId] ?? defaultPolicy(childId));
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
    ageBand: MOCK_CHILDREN.find((c) => c.id === s.childId)?.ageBand ?? 'Age_6_8', language: 'vi', source: 'AI', status,
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
