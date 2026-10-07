import type { ChildProfile, ContentCategory, SafetyPolicy } from '@/app/types/childProfile';
import type { DiscussionPromptDto, OutlineVersionDto, QuizQuestionDto, VocabularyItemDto } from '@/app/types/aiStory';
import type { UserProfile } from '@/app/types/auth';

export const MOCK_USER: UserProfile = {
  id: 1, username: 'thuha', email: 'thuha@taletale.site', fullName: 'Nguyễn Thu Hà', role: 'Parent', status: 'Active',
};

export const MOCK_CHILDREN: ChildProfile[] = [
  { id: 1, ownerUserId: 1, nickname: 'Bé Na', ageBand: 'Age_6_8', language: 'vi', status: 'Active', scope: 'Personal', createdAt: '2026-08-01T08:00:00Z' },
  { id: 2, ownerUserId: 1, nickname: 'Bin', ageBand: 'Age_9_12', language: 'vi', status: 'Active', scope: 'Personal', createdAt: '2026-08-05T08:00:00Z' },
];

export const MOCK_CATEGORIES: ContentCategory[] = [
  { id: 1, code: 'animals', displayName: 'Động vật', isActive: true },
  { id: 2, code: 'adventure', displayName: 'Phiêu lưu', isActive: true },
  { id: 3, code: 'science', displayName: 'Khoa học', isActive: true },
  { id: 4, code: 'fairytale', displayName: 'Cổ tích', isActive: true },
  { id: 5, code: 'horror', displayName: 'Ma quỷ, kinh dị', isActive: true },
  { id: 6, code: 'violence', displayName: 'Bạo lực', isActive: true },
];

export const MOCK_INTERESTS: Record<number, string[]> = { 1: ['động vật', 'rừng xanh'], 2: ['robot', 'vũ trụ'] };

export interface MockStory {
  id: number;
  childId: number;
  requestId: number;
  topic: string;
  genre: string;
  lesson: string;
  characters: string[];
  createdAt: string;
  acceptedAt: number;
  blocked: boolean;
  outlineVersions: OutlineVersionDto[];
  pendingRegenAt: number | null;
  outlineApprovedAt: number | null;
  reviewVersionId: number;
  title: string;
  content: string;
  vocabulary: VocabularyItemDto[];
  quiz: QuizQuestionDto[];
  discussion: DiscussionPromptDto[];
  mediaStartedAt: number | null;
  archived: boolean;
}

export interface MockState {
  nextStoryId: number;
  stories: MockStory[];
  policies: Record<number, SafetyPolicy>;
}

const DB_KEY = 'taletale-mock-db:v1';
const OLD = 1; // mốc thời gian rất cũ, coi như đã hoàn tất mọi bước

export function composeStory(topic: string, characters: string[], lesson: string) {
  const [hero, friend] = [characters[0] ?? 'Sóc Bông', characters[1] ?? 'Thỏ Trắng'];
  const title = topic.length > 48 ? `${topic.slice(0, 45).trim()}…` : topic;
  const outline = {
    opening: `${hero} bắt đầu một ngày mới với một điều muốn làm: ${topic.toLowerCase()}.`,
    development: `${hero} gặp ${friend} và cùng nhau vượt qua một khó khăn nhỏ trên đường đi.`,
    ending: `Cuối cùng, cả hai hiểu ra: ${lesson.toLowerCase()}.`,
  };
  const content = [
    `Sáng nay, ${hero} thức dậy thật sớm. Trời trong xanh, gió nhẹ nhàng thổi qua tán lá. ${hero} nghĩ về điều mình muốn làm hôm nay: ${topic.toLowerCase()}.`,
    `${hero} chuẩn bị mọi thứ thật cẩn thận rồi lên đường cùng mẹ. Trên đường đi, ${hero} nhìn thấy những bông hoa nở rực rỡ ven lối nhỏ.`,
    `Bỗng ${friend} chạy tới, vẻ mặt lo lắng. “Mình bị lạc mất đường rồi!” ${friend} nói. ${hero} mỉm cười và rủ ${friend} đi cùng.`,
    `Con đường không dễ đi. Có lúc ${hero} thấy mệt, có lúc ${friend} muốn bỏ cuộc. Nhưng hai bạn động viên nhau, từng bước từng bước tiến lên.`,
    `Khi mặt trời lên cao, hai bạn đã đến nơi. Mọi người vui mừng chào đón. ${hero} và ${friend} ôm nhau thật chặt.`,
    `Tối đó, ${hero} kể lại cho mẹ nghe và nói: “Con hiểu rồi, ${lesson.toLowerCase()}.” Mẹ xoa đầu ${hero} và cười thật hiền.`,
  ].join('\n\n');
  const vocabulary: VocabularyItemDto[] = [
    { id: 1, term: 'cẩn thận', definition: 'Làm việc chậm rãi, chú ý để không sai sót hay gặp nguy hiểm.' },
    { id: 2, term: 'động viên', definition: 'Nói lời tốt đẹp để bạn thêm sức mạnh và niềm tin.' },
    { id: 3, term: 'tán lá', definition: 'Phần lá xanh xoè rộng phía trên của cây.' },
  ];
  const quiz: QuizQuestionDto[] = [
    { id: 1, type: 'multiple_choice', question: `Ai đã chạy tới gặp ${hero} với vẻ lo lắng?`, correctAnswer: friend, choices: [friend, 'Bác Cú', 'Cô Gió'] },
    { id: 2, type: 'multiple_choice', question: `Hai bạn đã làm gì khi thấy mệt?`, correctAnswer: 'Động viên nhau', choices: ['Bỏ cuộc', 'Động viên nhau', 'Ngủ một giấc'] },
  ];
  const discussion: DiscussionPromptDto[] = [
    { id: 1, question: 'Con đã bao giờ giúp một người bạn đang gặp khó khăn chưa? Con cảm thấy thế nào?', isMoralLesson: true },
    { id: 2, question: `Nếu là ${hero}, con sẽ chuẩn bị gì trước khi lên đường?`, isMoralLesson: false },
  ];
  return { title, outline, content, vocabulary, quiz, discussion };
}

export function makeOutlineVersion(storyId: number, versionNo: number, topic: string, characters: string[], lesson: string, editType = 'ai_generated'): OutlineVersionDto {
  const { title, outline } = composeStory(topic, characters, lesson);
  return { id: storyId * 100 + versionNo, versionNo, editType, title, ...outline, isCurrent: true, editorUserId: null, outlineApprovedByUserId: null, outlineApprovedAt: null, createdAt: new Date().toISOString() };
}

function seedStory(id: number, childId: number, topic: string, lesson: string, characters: string[], stage: 'review' | 'ready'): MockStory {
  const c = composeStory(topic, characters, lesson);
  const v = makeOutlineVersion(id, 1, topic, characters, lesson);
  v.outlineApprovedAt = new Date(2026, 8, 20).toISOString();
  return {
    id, childId, requestId: id, topic, genre: 'Cổ tích', lesson, characters,
    createdAt: new Date(Date.now() - (id % 7) * 86_400_000).toISOString(),
    acceptedAt: OLD, blocked: false, outlineVersions: [v], pendingRegenAt: null, outlineApprovedAt: OLD,
    reviewVersionId: id * 10 + 1, title: c.title, content: c.content, vocabulary: c.vocabulary, quiz: c.quiz, discussion: c.discussion,
    mediaStartedAt: stage === 'ready' ? OLD : null, archived: false,
  };
}

function seedState(): MockState {
  return {
    nextStoryId: 101,
    stories: [
      seedStory(1, 1, 'Rùa Bông và chiếc đèn lồng trăng', 'kiên nhẫn và cẩn thận', ['Rùa Bông', 'Đom Đóm Lém'], 'review'),
      seedStory(2, 1, 'Chú gấu và tổ ong ngọt', 'biết chia sẻ', ['Gấu Nâu', 'Ong Vàng'], 'ready'),
      seedStory(3, 1, 'Con đường lên đỉnh mây', 'lòng dũng cảm', ['Sóc Bông', 'Thỏ Trắng'], 'ready'),
      seedStory(4, 2, 'Robot nhỏ dọn biển', 'bảo vệ môi trường', ['Robo', 'Rùa Biển'], 'review'),
      seedStory(5, 2, 'Hệ Mặt Trời có mấy anh em', 'tò mò khám phá', ['Tiến Sĩ Sao', 'Bé Mai'], 'ready'),
    ],
    policies: {},
  };
}

let state: MockState | null = null;

export function db(): MockState {
  if (state) return state;
  state = seedState();
  try {
    const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(DB_KEY) : null;
    if (raw) state = JSON.parse(raw) as MockState;
  } catch { /* dùng dữ liệu khởi tạo */ }
  return state;
}

export function persist() {
  try { sessionStorage.setItem(DB_KEY, JSON.stringify(state)); } catch { /* bỏ qua */ }
}

export function resetMockDb() {
  state = seedState();
  persist();
}
