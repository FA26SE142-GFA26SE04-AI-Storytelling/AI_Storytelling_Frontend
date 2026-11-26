import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import "@/app/styles/features/policy/policy.css";

export const metadata: Metadata = {
  title: "Chính sách và bản quyền | Taletale",
  description: "Quy tắc sử dụng AI dành cho người lớn, quyền riêng tư của trẻ em và cách báo cáo vi phạm bản quyền trên Taletale.",
};

const sections = [
  { id: "du-lieu", title: "Quyền riêng tư và dữ liệu của bé" },
  { id: "noi-dung-ai", title: "Quy tắc sử dụng AI dành cho người lớn" },
  { id: "ban-quyen", title: "Bản quyền và chia sẻ truyện" },
  { id: "bao-cao", title: "Báo cáo vi phạm" },
] as const;

export default function PolicyPage() {
  return (
    <div className="policy-page">
      <header className="policy-top">
        <Link className="policy-brand" href="/" aria-label="Taletale, trang chủ">
          <Frog size={36} variant="face" animated={false} />
          <span className="display">Taletale</span>
        </Link>
        <Link className="policy-back" href="/">
          <ArrowLeft className="ic" aria-hidden="true" /> Trang chủ
        </Link>
      </header>

      <article className="policy-document" aria-labelledby="policy-title">
        <header className="policy-intro">
          <h1 id="policy-title" className="display">Chính sách và bản quyền</h1>
          <p>Cách Taletale sử dụng dữ liệu để phục vụ việc đọc và sáng tác, cùng các quy tắc dành cho nội dung tự viết và nội dung có AI hỗ trợ.</p>
          <p className="policy-ai-rule">
            <strong>Trẻ em không được trực tiếp sử dụng AI trên Taletale.</strong>{" "}
            Khu vực của bé dành cho việc đọc, nghe truyện và làm hoạt động học tập do người lớn lựa chọn.{" "}
            <a href="#noi-dung-ai">Xem quy tắc sử dụng AI</a>
          </p>
        </header>

        <div className="policy-layout">
          <nav className="policy-contents" aria-label="Mục lục chính sách">
            <h2 className="display">Nội dung</h2>
            <ul>
              {sections.map(({ id, title }) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}
            </ul>
          </nav>

          <div className="policy-copy">
            <section id={sections[0].id} aria-labelledby="policy-data-title">
              <h2 id="policy-data-title" className="display">{sections[0].title}</h2>
              <p>Taletale xử lý thông tin tài khoản để đăng nhập và quản lý dịch vụ. Hồ sơ bé, cài đặt an toàn, lịch sử đọc và kết quả hoạt động giúp phụ huynh chọn truyện và theo dõi tiến độ. Nếu sử dụng tính năng thu âm đọc to, bản ghi cũng được xử lý để phục vụ tính năng đó.</p>
              <p>Phụ huynh hoặc người giám hộ quản lý hồ sơ, quyền truy cập và cài đặt an toàn của bé trong mục <strong>Hồ sơ bé</strong>. Hãy cung cấp thông tin cần thiết cho việc đọc và hạn chế đưa tên thật, địa chỉ, trường học hoặc thông tin nhận diện của trẻ vào truyện, lời nhắc AI và nội dung công khai.</p>
              <p>Khi dùng các tính năng tạo nội dung, phần dữ liệu cần thiết cho yêu cầu có thể được chuyển đến dịch vụ AI, tạo hình ảnh hoặc tổng hợp giọng đọc. Taletale cũng sử dụng dịch vụ lưu trữ để phục vụ truyện và media, dịch vụ email để gửi thông báo tài khoản và dịch vụ thanh toán khi người dùng mua gói.</p>
            </section>

            <section id={sections[1].id} aria-labelledby="policy-ai-title">
              <h2 id="policy-ai-title" className="display">{sections[1].title}</h2>
              <p>Chỉ cha mẹ, người giám hộ hoặc người lớn có kinh nghiệm phụ trách nội dung cho trẻ em và được cấp quyền mới được sử dụng công cụ AI. Người lớn phải trực tiếp nhập yêu cầu, chọn kết quả và kiểm tra nội dung. Hãy giữ thông tin đăng nhập của người lớn riêng và tránh để bé tự thao tác trên tài khoản đó.</p>
              <p>AI có thể hỗ trợ viết dàn ý, soạn truyện, tạo học liệu, minh họa và giọng đọc. Người lớn sử dụng AI chịu trách nhiệm kiểm tra độ chính xác, mức độ phù hợp với độ tuổi và quyền sử dụng nội dung trước khi giao cho bé, gửi dự thi hoặc đề nghị xuất bản.</p>
              <p>Khi ghi nguồn hoặc khai báo quyền sử dụng, hãy nêu rõ phần được AI hỗ trợ và nguồn tư liệu đã dùng. Việc tạo nội dung bằng AI không tự xác lập quyền tác giả hoặc quyền sử dụng đối với tác phẩm, hình ảnh hay nhân vật của người khác.</p>
            </section>

            <section id={sections[2].id} aria-labelledby="policy-rights-title">
              <h2 id="policy-rights-title" className="display">{sections[2].title}</h2>
              <p>Chỉ tải lên, gửi dự thi hoặc đề nghị xuất bản nội dung do bạn sáng tác, được chủ thể quyền cho phép hoặc có căn cứ hợp pháp để sử dụng. Yêu cầu này áp dụng cho văn bản, hình ảnh, âm thanh và nội dung có AI hỗ trợ. Ghi tên tác giả và nguồn nếu giấy phép yêu cầu.</p>
              <p>Quyền đối với tác phẩm thuộc về chủ thể quyền theo pháp luật hoặc thỏa thuận áp dụng. Khi chọn chia sẻ công khai, bạn cần có quyền cho phép Taletale lưu trữ và hiển thị nội dung trong phạm vi bạn đã chọn. Việc truyện xuất hiện trong thư viện không đồng nghĩa với quyền sao chép, đăng lại hoặc khai thác thương mại.</p>
            </section>

            <section id={sections[3].id} aria-labelledby="policy-report-title">
              <h2 id="policy-report-title" className="display">{sections[3].title}</h2>
              <ol>
                <li>Đăng nhập bằng tài khoản phụ huynh và mở truyện trong <strong>Thư viện</strong>.</li>
                <li>Chọn <strong>Báo cáo nội dung</strong> rồi chọn <strong>Vi phạm bản quyền</strong>.</li>
                <li>Mô tả phần nội dung bị báo cáo và cung cấp nguồn hoặc đường dẫn đối chiếu nếu có. Hạn chế gửi dữ liệu cá nhân trong phần mô tả.</li>
              </ol>
              <p>Kiểm duyệt viên tiếp nhận và xem xét báo cáo. Việc gửi báo cáo không tự động ẩn truyện.</p>
              <Link href="/app/library" className="btn btn-p">Mở thư viện truyện</Link>
            </section>

            <section className="policy-references" aria-labelledby="policy-references-title">
              <h2 id="policy-references-title" className="display">Văn bản tham khảo</h2>
              <ul>
                <li><a href="https://vanban.chinhphu.vn/?docid=214590&amp;pageid=27160">Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15</a></li>
                <li><a href="https://vanban.chinhphu.vn/?docid=216511&amp;pageid=27160">Luật sửa đổi, bổ sung Luật Sở hữu trí tuệ 131/2025/QH15</a></li>
                <li><a href="https://vanban.chinhphu.vn/?docid=216334&amp;pageid=27160">Luật Trí tuệ nhân tạo 134/2025/QH15</a></li>
              </ul>
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}
