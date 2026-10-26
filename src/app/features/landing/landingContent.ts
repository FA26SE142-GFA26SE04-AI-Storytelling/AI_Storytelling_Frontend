import {
  BookOpen, Inbox, Lock, NotebookPen, Route, ShieldCheck, Sparkles, Star, Users,
  FileUp, PenLine, WandSparkles, type LucideIcon,
} from "lucide-react";

/** Nội dung trang giới thiệu. Chỉ ghi điều sản phẩm thật sự làm (xem PRODUCT.md), không số liệu hay lời khen bịa. */

export type Step = { id: string; label: string; title: string; text: string };

export const STEPS: Step[] = [
  { id: "idea", label: "Ý tưởng", title: "Bạn kể một ý tưởng", text: "Chủ đề, nhân vật và bài học muốn gửi tới con. Để trống phần nào thì AI tự nghĩ phần đó. Độ tuổi và mức đọc lấy từ hồ sơ của bé." },
  { id: "safety", label: "Kiểm tra an toàn", title: "Ý tưởng được kiểm tra trước khi viết", text: "Ý tưởng được đối chiếu với cài đặt an toàn của bé: chủ đề bị chặn, thông tin cá nhân, nhân vật có bản quyền. Có nghi ngờ thì hệ thống dừng lại và hỏi bạn." },
  { id: "outline", label: "Duyệt dàn ý", title: "Bạn duyệt dàn ý", text: "AI đề xuất mở đầu, diễn biến và kết thúc. Bạn sửa từng đoạn hoặc nhờ viết lại, rồi mới cho AI viết truyện." },
  { id: "story", label: "Duyệt truyện", title: "Bạn đọc và duyệt truyện", text: "Đọc bản thảo kèm từ vựng, câu đố và câu hỏi thảo luận. Sửa tay, hoặc nhờ AI sửa đúng đoạn bạn chọn." },
  { id: "media", label: "Tranh và giọng đọc", title: "Tranh, giọng đọc, rồi mới tới tay bé", text: "Bạn duyệt xong, hệ thống vẽ tranh và tạo giọng đọc. Lúc này truyện mới xuất hiện trong góc đọc của bé." },
];

export const BENEFITS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: "Cài đặt riêng cho từng bé", text: "Chủ đề cho phép, hạn chế hay chặn, độ dài tối đa và cách duyệt, đặt theo từng con." },
  { icon: Inbox, title: "Chưa duyệt thì chưa tới tay bé", text: "Bản nháp không bao giờ hiện trong góc đọc của bé. Bé chỉ thấy truyện bạn đã đồng ý." },
  { icon: Lock, title: "Cổng phụ huynh", text: "Bé không tự thoát khỏi góc đọc hay mở phần cài đặt. Không có trò chuyện tự do với AI." },
  { icon: Users, title: "Cả nhà cùng giám sát", text: "Mời ông bà, người thân cùng theo dõi, mỗi người một quyền phù hợp." },
];

export const KID: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BookOpen, title: "Đọc và nghe", text: "Nghe giọng đọc, chữ sáng lên theo từng từ." },
  { icon: Star, title: "Câu đố nhỏ", text: "Đúng được sao thưởng, sai thì ếch động viên thử lại." },
  { icon: NotebookPen, title: "Sổ từ vựng", text: "Chạm vào từ mới để xem nghĩa và lưu lại." },
  { icon: Route, title: "Bố mẹ chọn cho em", text: "Truyện mở lần lượt theo lộ trình bố mẹ sắp sẵn." },
  { icon: Sparkles, title: "Gửi điều ước", text: "Bé chọn thẻ nhân vật, nơi chốn; bố mẹ quyết định có viết không." },
];

export const WAYS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: WandSparkles, title: "Tạo bằng AI", text: "Từ một ý tưởng thành truyện có tranh, giọng đọc và học liệu, qua từng bước bạn duyệt." },
  { icon: FileUp, title: "Nhập truyện có sẵn", text: "Dán hoặc tải truyện bạn có. AI đánh giá độ khó và gợi ý chỉnh cho hợp với con." },
  { icon: PenLine, title: "Tự viết", text: "Viết kỷ niệm gia đình hay lời nhắn gửi con, có AI góp ý khi bạn cần." },
];

export const FAQ: { q: string; a: string }[] = [
  { q: "Taletale khác gì các ứng dụng tạo truyện bằng AI khác?", a: "Bạn đứng ở giữa mọi bước. Ý tưởng được kiểm tra an toàn trước khi viết, dàn ý và nội dung đều chờ bạn duyệt, và bé chỉ thấy truyện ở bước cuối cùng." },
  { q: "Truyện phù hợp với bé mấy tuổi?", a: "Bé từ 3 đến 10 tuổi. Độ dài, từ vựng và câu đố được điều chỉnh theo độ tuổi và mức đọc trong hồ sơ của từng bé." },
  { q: "Bé có trò chuyện với AI không?", a: "Không. Bé chỉ đọc, nghe và trả lời câu đố trong những truyện bạn đã duyệt. Góc đọc của bé không có ô trò chuyện." },
  { q: "Làm sao để bé không tự ra khỏi góc đọc?", a: "Khi bật cổng phụ huynh, muốn rời góc đọc phải nhập lại mật khẩu của người lớn." },
  { q: "Tôi có sửa được truyện AI viết không?", a: "Có. Bạn sửa dàn ý hoặc nhờ viết lại trước khi AI viết truyện, rồi sửa tay hoặc nhờ AI sửa đúng đoạn bạn chọn trong bản thảo." },
  { q: "Có giới hạn số truyện không?", a: "Mỗi tài khoản có số lượt tạo truyện theo kỳ. Mỗi truyện mới dùng một lượt và có 3 lần sửa bằng AI miễn phí." },
  { q: "Tôi dùng Taletale trên thiết bị nào?", a: "Ngay trên trình duyệt của điện thoại, máy tính bảng hoặc máy tính. Có giao diện tối dịu mắt cho buổi đọc trước giờ ngủ." },
];
