// Dữ liệu mẫu cho giao diện Mây Studio. Thay bằng service/hook thật khi nối API.

export type Story = {
  id: string;
  title: string;
  kind: "ai" | "manual" | "sample";
  topic: "animal" | "adv" | "sci" | "fairy" | "life";
  age: string;
  level: number;
  words: number;
  status: "ok" | "wait" | "draft";
  by: string;
  gradient: string;
};

export const STORIES: Story[] = [
  { id: "s1", title: "Rùa Bông và chiếc đèn lồng trăng", kind: "ai", topic: "fairy", age: "6–7", level: 2, words: 320, status: "wait", by: "Chị Thu Hà", gradient: "linear-gradient(170deg,#5A4BD1,#9B6FE0 60%,#F6A9C9)" },
  { id: "s2", title: "Robot nhỏ dọn biển", kind: "ai", topic: "sci", age: "8–9", level: 3, words: 410, status: "draft", by: "Chị Thu Hà", gradient: "linear-gradient(170deg,#2D6CDF,#4FA3E0 60%,#9BE3D6)" },
  { id: "s3", title: "Chú gấu và tổ ong ngọt", kind: "sample", topic: "animal", age: "6–7", level: 1, words: 260, status: "ok", by: "Mây Studio", gradient: "linear-gradient(170deg,#F59E0B,#FDBA74 60%,#FDE68A)" },
  { id: "s4", title: "Con đường lên đỉnh mây", kind: "ai", topic: "adv", age: "8–9", level: 3, words: 520, status: "ok", by: "Cô Lan Anh", gradient: "linear-gradient(170deg,#0EA5A4,#5EEAD4 60%,#CFFAFE)" },
  { id: "s5", title: "Bạn Thỏ nói lời thật lòng", kind: "manual", topic: "life", age: "6–7", level: 2, words: 300, status: "ok", by: "Cô Lan Anh", gradient: "linear-gradient(170deg,#EC4899,#F9A8D4 60%,#FCE7F3)" },
  { id: "s6", title: "Hệ Mặt Trời có mấy anh em?", kind: "sample", topic: "sci", age: "10–12", level: 4, words: 640, status: "ok", by: "Mây Studio", gradient: "linear-gradient(170deg,#1E1B4B,#4338CA 60%,#A78BFA)" },
  { id: "s7", title: "Đom Đóm Lém đi lạc", kind: "ai", topic: "animal", age: "6–7", level: 2, words: 340, status: "wait", by: "Anh Minh Quân", gradient: "linear-gradient(170deg,#365314,#84CC16 60%,#FEF9C3)" },
  { id: "s8", title: "Chiếc thuyền giấy của Bin", kind: "ai", topic: "adv", age: "8–9", level: 3, words: 450, status: "wait", by: "Chị Thu Hà", gradient: "linear-gradient(170deg,#1D4ED8,#60A5FA 60%,#E0F2FE)" },
];

export const KIDS = [
  { name: "Bé Na", sub: "7 tuổi", color: "#F9A8D4", initial: "N" },
  { name: "Bin", sub: "9 tuổi", color: "#5CC8FF", initial: "B" },
  { name: "Lớp 3A", sub: "28 học sinh", color: "#FFD89A", initial: "3" },
] as const;

export const WEEK_MINUTES = [
  { d: "T2", v: 14 }, { d: "T3", v: 22 }, { d: "T4", v: 18 }, { d: "T5", v: 31 },
  { d: "T6", v: 12 }, { d: "T7", v: 26 }, { d: "CN", v: 20 },
];

export const SCENES = [
  { n: 1, name: "Vườn đèn", sec: 50, gradient: "linear-gradient(170deg,#5A4BD1,#9B6FE0 60%,#F6A9C9)" },
  { n: 2, name: "Đường ra hồ", sec: 45, gradient: "linear-gradient(170deg,#2D6CDF,#4FA3E0 60%,#9BE3D6)" },
  { n: 3, name: "Hội rước đèn", sec: 45, gradient: "linear-gradient(170deg,#F59E0B,#FB923C 60%,#FDE68A)" },
];

export const SCENE_TEXT = [
  "Đêm Trung thu, Rùa Bông cầm chiếc đèn lồng trăng đi tới hội. Chân Rùa Bông bước rất chậm.",
  "Đom Đóm Lém bay vòng quanh trêu: “Bạn đi chậm quá!” Gió thổi, Rùa Bông che tay giữ ngọn nến.",
  "Cuối cùng chỉ có đèn của Rùa Bông còn sáng. Cả khu rừng đi theo ánh đèn nhỏ ấy.",
];

export const SAFETY_CHECKS = [
  { label: "Bạo lực", note: "Không có", ok: true },
  { label: "Gây sợ hãi", note: "Rất thấp", ok: true },
  { label: "Ngôn từ thù ghét", note: "Không có", ok: true },
  { label: "Nội dung người lớn", note: "Không có", ok: true },
  { label: "Dữ liệu cá nhân", note: "Không có", ok: true },
  { label: "Hành vi không an toàn", note: "1 chỗ", ok: false },
];

export const FLAG_REASONS = [
  { label: "Hành vi không an toàn", v: 42, color: "#FFB020" },
  { label: "Gây sợ hãi", v: 27, color: "#FF6F91" },
  { label: "Từ vựng quá khó", v: 18, color: "#38B2F5" },
  { label: "Khác", v: 13, color: "#A39DBB" },
];

export const GEN_LOG = [
  { t: "10:42", q: "Cổ tích, 6–7 tuổi, “kiên nhẫn”", by: "Chị Thu Hà", check: "wait", checkL: "1 cảnh báo", act: "Sửa tự động, chờ duyệt" },
  { t: "09:15", q: "Khoa học, 10–12 tuổi, “hệ mặt trời”", by: "Cô Lan Anh", check: "ok", checkL: "An toàn", act: "Đã duyệt, giao lớp 5B" },
  { t: "Hôm qua", q: "Chủ đề “ma quỷ”, 8–9 tuổi", by: "Anh Minh Quân", check: "flag", checkL: "Bị chặn", act: "Hiện thông báo thay thế" },
  { t: "Hôm qua", q: "Đời sống, 8–9 tuổi, “trung thực”", by: "Cô Lan Anh", check: "ok", checkL: "An toàn", act: "Tạo lại “đơn giản hơn”, đã duyệt" },
] as const;

export const TOPICS_ALLOW = ["Động vật", "Phiêu lưu", "Khoa học", "Cổ tích", "Đời sống", "Tình bạn"];
export const TOPICS_BLOCK = ["Ma quỷ", "Bạo lực", "Rượu bia"];
