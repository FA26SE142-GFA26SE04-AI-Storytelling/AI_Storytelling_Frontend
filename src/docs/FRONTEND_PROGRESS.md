# Tiến độ Frontend (web) so với đặc tả nghiệp vụ

Cập nhật: 15/10/2026 (sau khi làm Luồng 1–5; đối chiếu lại với code và sửa thể loại, độ dài theo mức đọc, kiểm quyền). Đối chiếu với bộ tài liệu đặc tả: Luồng 1 v35, Luồng 2 v25, Luồng 3 v27, Luồng 4 v28, Luồng 5 v30, Luồng 6 v21.

Chỉ tính các chức năng **Core**. Mục Optional ghi `(Optional)`.

Ký hiệu:
- `[x]` đã làm
- `[ ]` chưa làm
- `[ ]` có ghi **Một phần**: đã làm được một phần, ghi rõ phần còn thiếu

## Tổng quan

| Luồng | % hoàn thành |
|---|:-:|
| L1 — Hồ sơ trẻ & giám sát | ~85% (phần còn lại chờ backend) |
| L2 — Sinh truyện AI | ~65% (phần lớn còn lại chờ backend) |
| L3 — Trẻ đọc truyện | ~75% giao diện (dữ liệu đọc chờ backend) |
| L4 — Lộ trình, theo dõi, Hold Mode | ~80% giao diện (dữ liệu chờ backend) |
| L5 — Admin / Content Creator / Moderator | ~80% giao diện (phần lớn dữ liệu chờ backend) |
| L6 — Học tập thích ứng | Core xong giao diện (dữ liệu chờ backend); Optional chưa làm |
| **Tổng (có trọng số theo số chức năng)** | **~72%** trước khi làm L6 — chưa tính lại |

## Việc chặn cần sửa ngay

- [x] Gỡ xung đột merge trong `app/page.tsx`. Đã xong: type-check sạch, 143 test đều qua.

## Luồng 1 — Hồ sơ trẻ & giám sát (~85%)

Phần còn lại của Luồng 1 đều **chờ backend** (xem mục "Luồng 1 — cần backend bổ sung" ngay bên dưới).

**Tài khoản phụ huynh (Bước 1.1, 1.1b)** — màn `Tài khoản` và màn đăng nhập
- [x] Đăng nhập
- [x] Đăng ký, kiểm tra mật khẩu ≥ 8 ký tự, có chữ và số
- [x] Quên mật khẩu
- [x] Đặt lại mật khẩu từ link email
- [x] Đăng xuất
- [x] Màn nhập mã xác thực email, gửi lại mã (mở thẳng bằng `?auth=verify&email=…&token=…`)
- [x] Đổi mật khẩu
- [x] Xem và đăng xuất từng phiên đăng nhập
- [x] Đăng xuất khỏi mọi thiết bị
- [ ] Sửa họ tên, ảnh đại diện — **chờ backend**
- [ ] Đổi email bằng OTP gửi tới email mới — **chờ backend**

**Hồ sơ trẻ (Bước 1.2, 1.3, 1.8, 1.9)** — màn `Hồ sơ bé`
- [x] Trình tạo hồ sơ 4 bước: thông tin bé → hồ sơ học tập → an toàn & đồng ý → xác nhận
- [x] Không hỏi họ tên đầy đủ, ngày sinh, trường, địa chỉ (BR-1.1)
- [x] Sửa biệt danh, nhóm tuổi (chỉ Owner)
- [x] Hồ sơ học tập: mức đọc 1–5 ("Tương đương lớp X"), mục tiêu đọc hiểu, chủ đề yêu thích, kỹ năng ưu tiên
- [x] Chỉ Owner hoặc người có quyền "Sửa mức đọc" được sửa hồ sơ học tập
- [x] Kích hoạt hồ sơ, danh sách điều kiện còn thiếu kèm nút đi tới chỗ hoàn tất
- [x] Danh sách "Con của tôi", chọn bé ở thanh trên cùng
- [x] Trang Tổng quan khi chưa có bé: nút "Thêm hồ sơ bé"
- [x] Avatar của bé (chọn ở tab "Bé đăng nhập")
- [ ] Chế độ đọc "Nghe là chính" / "Tự đọc" — **chờ backend**
- [ ] Tab "Tất cả các con" trên Dashboard — để làm cùng Dashboard ở Luồng 4

**Cài đặt an toàn (Bước 1.4)** — màn `Cài đặt an toàn`
- [x] Chế độ duyệt: luôn duyệt tay / tự duyệt khi đạt ngưỡng
- [x] Chủ đề chỉ còn Cho phép / Chặn; dữ liệu cũ "Hạn chế" được coi là Chặn
- [x] Giải thích ý nghĩa danh sách Cho phép (rỗng = mọi chủ đề không bị chặn đều được phép)
- [x] Độ dài tối đa tính bằng "tiếng"
- [x] Bật/tắt cổng xác nhận người lớn
- [x] Nội dung đồng ý (a)–(d) kèm ô xác nhận, có phiên bản điều khoản (đổi phiên bản thì phải đồng ý lại)
- [x] Danh sách chặn mặc định theo nhóm tuổi khi tạo hồ sơ
- [x] Ngưỡng Hold Mode: % đọc hiểu và số bài liên tiếp
- [x] Chỉ Owner hoặc người có quyền "Sửa cài đặt an toàn" sửa được; người giám sát khác chỉ xem (BR-1.8)
- [ ] Bật/tắt "Bé ước một câu chuyện" (`story_wishes_enabled`) — **chờ backend**
- [ ] Bật/tắt truyện nhiều lựa chọn (`allow_interactive_stories`) — **chờ backend**

**Người giám sát (Bước 1.5–1.7b, Mục 3)** — tab "Người giám sát"
- [x] Mời người giám sát qua email, xem mã mời, trạng thái, ngày hết hạn, sao chép mã, hủy lời mời
- [x] Nhập mã mời để tham gia giám sát (nút "Nhập mã mời")
- [x] Gỡ người giám sát; người giám sát tự rời hồ sơ
- [x] Phân quyền 7 quyền giám sát (bật/tắt từng quyền)
- [x] Chuyển quyền Owner: Owner đề nghị, người nhận Nhận quyền / Từ chối
- [x] Xin thêm quyền: người giám sát xin, Owner Đồng ý / Từ chối, người xin Hủy được
- [ ] Nhập OTP gửi tới email được mời khi nhận lời mời (BR-1.4) — **chờ backend**
- [ ] Hiện tên/email của người giám sát (hiện chỉ có mã người dùng) — **chờ backend**

**Truy cập của bé (Bước 1.10)** — tab "Bé đăng nhập"
- [x] "Cho bé đọc" mở phiên riêng của bé (`handover`), bé chưa kích hoạt thì không vào được
- [x] Rời chế độ của bé phải nhập lại mật khẩu người lớn nếu bật cổng xác nhận
- [x] Avatar + mã PIN 4 số cho bé
- [x] Tạo mã QR Easy Login, tạo mã mới (mã cũ hết hiệu lực), thu hồi
- [x] Bé quét QR → link `/?kid=<mã>` → mở phiên của bé, chào bé bằng biệt danh
- [ ] Mã QR dùng lâu dài (BR-1.15) — **Một phần:** backend hiện cấp mã 5 phút, dùng 1 lần
- [ ] Phiên của bé tự hết hạn sau 20 phút không hoạt động (không thao tác và không có telemetry; đang "Nghe cả truyện" vẫn tính là hoạt động) — chưa làm

### Luồng 1 — cần backend bổ sung

| Việc | Đặc tả | Backend hiện tại |
|---|---|---|
| Sửa họ tên, ảnh đại diện; đổi email bằng OTP | Bước 1.1b, BR-1.18 | Chưa có API |
| Chế độ đọc `reading_mode` | Bước 1.3 | `LearningProfile` chưa có trường này |
| `story_wishes_enabled`, `allow_interactive_stories` | Bước 1.4 | `SafetyPolicy` chưa có 2 trường này |
| Mức Restricted | Đã bỏ (v31) | Enum `PolicyRule` vẫn còn `Restricted` |
| OTP khi nhận lời mời | BR-1.4 | `AcceptInvitation` chỉ cần mã mời |
| Tên/email người giám sát | Mục 3 | `SupervisionRelationshipDto` chỉ có `supervisorUserId` |
| Additional Supervisor thấy hồ sơ bé | Bước 1.9 | `GET /ChildProfile/mine` chỉ trả hồ sơ mình là Owner |
| Easy Login lâu dài | BR-1.15 | Mã 5 phút, dùng 1 lần |
| Avatar thuộc hồ sơ bé, gán mặc định khi tạo | Bước 1.2 | Avatar nằm trong `ChildAccessCredential`, phải đặt kèm PIN |

## Luồng 2 — Sinh truyện AI (~65%)

Phần còn lại phần lớn **chờ backend** (xem mục "Luồng 2 — cần backend bổ sung" ở cuối phần này).

**Yêu cầu tạo truyện (mục 3.1)** — `Studio → Yêu cầu`
- [x] Ý tưởng, nhân vật (để trống = AI gợi ý, có nhân vật mẫu), bối cảnh (để trống = AI gợi ý, có gợi ý), bài học (có danh sách gợi ý hoặc tự nhập)
- [x] 6 thể loại theo đặc tả: Cổ tích, Phiêu lưu, Động vật, Khoa học vui, Đời sống hằng ngày, Ngụ ngôn (Studio và Content Creator dùng chung `GENRES` trong `lib/storyRules.ts`)
- [x] Độ dài Ngắn / Vừa / Dài = phần ba thấp / giữa / cao của khoảng độ dài theo mức đọc của bé (mục 5.3b), tính bằng tiếng, không vượt giới hạn của bé
- [x] Mức từ vựng: Quen thuộc / Theo trình độ / Mở rộng
- [x] Giới hạn 200 ký tự mỗi ô, có bộ đếm
- [x] Cảnh báo nhân vật / thương hiệu có bản quyền
- [x] Cảnh báo thông tin cá nhân trong yêu cầu (số điện thoại, email, địa chỉ, tên trường, biệt danh của bé)
- [x] Hiện số lượt tạo truyện còn lại, chặn khi hết lượt
- [x] Bé chưa kích hoạt thì không tạo truyện được
- [ ] Chọn truyện thường / nhiều lựa chọn — **chờ backend**

**Nhập truyện có sẵn (mục 3.2, 5.2–5.4)** — `Studio → Nhập truyện có sẵn`
- [x] Dán truyện có sẵn / tự viết
- [x] Tick "Tôi có quyền sử dụng nội dung này cho con tôi" (bắt buộc khi dán)
- [x] Cảnh báo thông tin cá nhân trong nội dung
- [x] Đánh giá: Phù hợp → tự chuyển sang tạo học liệu; Nên điều chỉnh / Bị chặn → hiện lý do
- [x] Lựa chọn: AI điều chỉnh (kèm ghi chú) / Tự sửa / Giữ bản gốc (bắt buộc lý do, khoá khi vượt độ dài) / Lưu trữ
- [ ] (Optional) Tải lên tệp .txt / .docx — backend đã có `import-file`, chưa làm giao diện
- [ ] Lưu cam kết bản quyền (`family_use` / `own_work`) — **chờ backend**

**Guardrail & kiểm duyệt (mục 3.3–3.4)**
- [x] Màn báo ý tưởng bị chặn, sửa ý tưởng hoặc thử lại
- [x] Trạng thái "Đang được kiểm duyệt an toàn (thường trong 24 giờ)" trong Studio và Thư viện
- [x] Trạng thái "Bị chặn"
- [ ] Tô sáng đoạn có thông tin cá nhân trong truyện AI viết, nút "Vẫn giữ" — **chờ backend** (cần `pii_flags`)

**Dàn ý (Phase 2)**
- [x] Xem, sửa, viết lại, duyệt dàn ý truyện thường
- [ ] Dàn ý đủ trường nhân vật, bối cảnh, bài học — **chờ backend** (`OutlineVersionDto` mới có mở đầu / diễn biến / kết thúc)
- [ ] Dàn ý dạng cây cho truyện nhiều lựa chọn — **chờ backend**

**Nội dung truyện (Phase 3, mục 5.8)**
- [x] Sửa tay nội dung truyện rồi lưu (sửa cả truyện trong một ô; chưa sửa riêng từng cảnh)
- [x] Chỉnh sửa theo chủ đích: 9 mục đích, phạm vi một đoạn bôi đen hoặc cả truyện, ghi chú ≤ 200 ký tự, xem trước đề xuất rồi Áp dụng / Bỏ qua
- [ ] Cảnh báo Context Fidelity ("Truyện có thể lệch dàn ý ở đoạn…") — **chờ backend**
- [ ] Phụ huynh sửa metadata (thể loại / chủ đề / bài học) ở bước duyệt — **chờ backend**
- [ ] Hiện nhãn nội dung — **chờ backend**

**Học liệu (Phase 4)** — nút "Sửa học liệu"
- [x] Xem từ vựng, câu đố, câu hỏi thảo luận; "Tạo học liệu còn thiếu"
- [x] Thêm / sửa / xoá từng mục, kiểm tra trống trước khi lưu
- [x] Đổi loại câu hỏi: trắc nghiệm / đúng-sai / tự luận ngắn (bé 6–8 tuổi không có tự luận)
- [x] AI tạo lại → xem trước → Áp dụng / Bỏ qua
- [ ] Điểm dừng tương tác (đoán / cảm xúc / cảm nhận) — **chờ backend**
- [ ] Thẻ "Hỏi nhân vật" — **chờ backend**
- [ ] Tóm tắt cho phụ huynh — **chờ backend**

**Duyệt (mục 6.6)**
- [x] Duyệt truyện (khoá khi còn đề xuất AI chưa xử lý)
- [x] Lưu trữ bắt buộc chọn lý do: "Không muốn dùng nữa" / "Nội dung chưa an toàn"
- [ ] Từ chối kèm lý do — **chờ backend** (chưa có API reject)
- [ ] Truyện nhiều lựa chọn: phải xem mọi kết thúc trước khi duyệt — **chờ backend**

**Phiên bản & quản lý truyện (mục 6.8, 6.9)** — màn `Thư viện truyện`
- [x] "Truyện của bé": tìm theo tên, lọc theo nguồn / chủ đề / 10 nhóm trạng thái
- [x] Nút: Xem trước như bé thấy (không tính lượt đọc)
- [x] Nút: Mở để duyệt / Tiếp tục trong Studio / Lưu trữ (Lưu trữ chỉ hiện với người có quyền "Duyệt truyện")
- [ ] Lịch sử phiên bản, so sánh 2 bản, khôi phục bản cũ — **chờ backend**
- [ ] Số phiên bản, số lần con đã đọc — **chờ backend**
- [x] Nút: Thêm vào lộ trình
- [x] Nút: Nộp thư viện cộng đồng
- [x] Nút: Báo cáo nội dung

**Ảnh & giọng đọc (Phase 5)**
- [x] Theo dõi tiến độ tạo ảnh và giọng đọc
- [x] Thử lại khi lỗi
- [ ] (Optional) Vẽ lại một ảnh — đã có hàm `regenerateIllustration`, chưa làm giao diện

**Điều ước của bé — phía phụ huynh (mục 3.5)**
- [x] Dashboard → "Cần xử lý": xem thẻ bé chọn và truyện có sẵn phù hợp; Dùng truyện có sẵn (thêm vào lộ trình ở vị trí đọc tiếp theo, ghi chú "Từ điều ước của em") / Tạo truyện mới (điền sẵn form Studio) / Từ chối (lý do chỉ phụ huynh thấy)
- [ ] Lưu điều ước lên máy chủ — **chờ backend** (chưa có API `wishes`; hiện dùng bộ máy cục bộ chung với Luồng 3/4)

### Luồng 2 — cần backend bổ sung

| Việc | Đặc tả | Backend hiện tại |
|---|---|---|
| Truyện nhiều lựa chọn (dàn ý cây, node, lựa chọn, duyệt từng kết thúc) | Mục 4.1, 5.7, BR-2.28/29 | Chưa có |
| Bé ước một câu chuyện (thẻ ước, gợi ý truyện có sẵn, xử lý của phụ huynh) | Mục 3.5 | Chưa có API `wishes` |
| Điểm dừng tương tác, Hỏi nhân vật, Tóm tắt cho phụ huynh | Mục 6.4b–6.4d | Chưa có |
| Từ chối truyện ở bước duyệt kèm lý do | Mục 6.6, BR-2.41 | Review chỉ có `approve` / `archive` |
| Lịch sử phiên bản, so sánh, khôi phục | Mục 6.8 | Chưa có API `versions` |
| Chỉnh sửa theo chủ đích có `revision_intent` / `revision_scope` | Mục 5.8 | Frontend dùng tạm `story/ai/partial-edit` với chỉ dẫn soạn sẵn |
| Dàn ý có nhân vật, bối cảnh, bài học, `ending_summary` | Mục 4 | `OutlineVersionDto` chỉ có mở đầu / diễn biến / kết thúc |
| Metadata sửa được, nhãn nội dung, cảnh báo Context Fidelity, `pii_flags` | Mục 3.3b, 5.3c, 5.6 | Chưa trả về trong gói duyệt |
| Cam kết bản quyền khi nhập truyện | BR-2.39 | `ImportStoryRequestDto` chưa có trường |
| Nhập bằng trình soạn thảo | Mục 3.2 | `inputMethod` chỉ nhận `paste` / `txt` / `docx` (frontend gửi `paste`) |
| Lý do lưu trữ quyết định ngắt phiên đọc | Mục 6.6, BR-2.21 | `ArchiveRequestDto.reason` là chuỗi tự do; cần thống nhất mã `safety_concern` / `supervisor_preference` |

## Luồng 3 — Trẻ đọc truyện (~75% giao diện; dữ liệu đọc chưa lưu lên máy chủ)

> **Lưu ý quan trọng:** backend mới có bảng dữ liệu (`reading_sessions`, `reading_progress`, `achievements`, `badges`, `quiz_attempts`, `vocabulary_notebook_entries`, `telemetry_logs`) nhưng **chưa có API nào**. Frontend gọi theo hợp đồng API đề xuất trong `app/services/readingService.ts`; khi backend chưa có, tự chuyển sang bộ máy cục bộ (`app/services/readingLocal.ts`) để bé vẫn đọc được. Tiến độ, EXP, sổ tay, điều ước lúc này chỉ lưu trong trình duyệt và **không tới được Luồng 4/6**.

**Vào và thoát phiên của bé (Bước 3.0, 3.0b)**
- [x] Vào qua "Cho bé đọc" (ProfileSwitcher) hoặc quét mã QR (Easy Login), dùng chung một giao diện
- [x] Nút Thoát luôn hiện; thoát giữa chừng lưu trang đang đọc dở
- [x] Phiên QR thoát không cần cổng người lớn; phiên "Cho bé đọc" hỏi mật khẩu người lớn nếu bật cổng

**Trang chính — Journey Map (Bước 3.1)** — `features/kid/KidHome.tsx`
- [x] Mục "Đọc tiếp" (Continue Reading)
- [x] Tìm theo tên, lọc theo thể loại, độ dài, yêu thích
- [x] Nhãn "Đã đọc", "♥", "Thử thách" (truyện thử thách xếp sau)
- [x] Mục "Bố mẹ chọn cho em": truyện đang mở, truyện kế tiếp bị khoá "Chưa tới lượt", tiến độ X/Y, lời nhắn, "Mong con đọc xong trước…" (dữ liệu từ Luồng 4)
- [x] Hold Mode: khoá thư viện, chỉ mở truyện "Đọc lại để mở khoá", hết lượt hiện "Nghỉ một chút…" (dữ liệu từ Luồng 4)
- [ ] Thư viện chung (Public Library), thư viện cộng đồng — **chờ backend**
- [ ] Nhãn "Thử thách" tính theo mức đọc — **chờ backend** trả `readingLevel` của truyện

**Bé ước một câu chuyện (Bước 3.1b)** — `features/kid/KidWish.tsx`
- [x] 4 màn chọn thẻ hình: nhân vật, nơi chốn (bắt buộc), thử thách, bài học ("Để bố mẹ chọn"); bấm thẻ được đọc tên
- [x] Tối đa 2 điều ước đang chờ, 1 điều ước mỗi ngày
- [x] "Bố mẹ sẽ xem điều ước của em nhé!" + tối đa 3 truyện có sẵn gợi ý; không hiện gợi ý khi Hold Mode
- [x] Mục "Điều ước của em": "Bố mẹ đang xem" / "Điều ước của em đã thành truyện!" / "Bố mẹ đã tìm được truyện…" / "Lần này bố mẹ sẽ kể cho em truyện khác nhé" (không nêu lý do)
- [ ] Câu hỏi "Em muốn tự chọn hướng đi cho truyện không?" — **chờ backend** (truyện nhiều lựa chọn)

**Màn đọc — Immersive Mode (Bước 3.2)** — `features/kid/KidReader.tsx`
- [x] Ẩn thanh điều hướng, chữ lớn, thanh tiến độ, số trang
- [x] Ảnh minh hoạ (khi backend trả `imageUrl`; chưa có thì dùng nền màu)
- [x] Chế độ theo tuổi: 6–8 "Nghe là chính" (tự đọc, chữ to, tranh lớn), 9–12 "Tự đọc" (bấm loa khi cần)
- [x] Giọng đọc + tô sáng chữ đang đọc; "Nghe cả truyện" tự lật trang sau 1,5 giây, dừng ở trang cuối
- [x] Từ trong danh sách từ vựng gạch chân chấm → nghĩa, câu trong truyện, nghe, "Lưu vào sổ tay"
- [x] Bấm chữ bất kỳ → nghe chữ đó
- [x] Đánh dấu trang (1 trang mỗi truyện, bấm lại để bỏ), yêu thích, tự lưu trang đang đọc
- [x] Hỏi máy chủ mỗi 15 giây có yêu cầu buộc thoát không → đưa bé về thư viện với thông điệp thân thiện
- [ ] File âm thanh TTS + mốc thời gian từng chữ của nhà cung cấp — **chờ backend** (hiện dùng giọng tiếng Việt của trình duyệt làm dự phòng)
- [ ] Truyện nhiều lựa chọn (Bước 3.2.6), điểm dừng tương tác (3.2.7), Hỏi nhân vật (3.2.8) — **chờ backend** (Luồng 2 chưa sinh nội dung này)
- [ ] (Optional) Luyện đọc ASR

**Sau khi đọc (Bước 3.3, 3.3.1)** — `features/kid/KidAfter.tsx`
- [x] "Em thấy truyện thế nào?" — 4 biểu tượng, không cộng EXP
- [x] Câu đố: trắc nghiệm, đúng/sai, tự luận ngắn (chỉ 9–12); không có nút bỏ qua; nhóm 6–8 được đọc to câu hỏi
- [x] Chấm tự luận không dùng AI: không phân biệt dấu, cho sai 1 ký tự với đáp án ≥ 4 ký tự
- [x] Phản hồi ngay: đúng → khen; sai → nói đáp án nhẹ nhàng, không trừ điểm
- [x] Mini-game sắp xếp thứ tự câu chuyện (bỏ qua được)
- [x] Phiên đọc lại để mở khoá: xáo trộn câu hỏi và phương án
- [ ] (Optional) Mini-game "Two Truths and One Fib"

**Phần thưởng (Bước 3.3.1, 3.4)** — `features/kid/KidNotebook.tsx`
- [x] EXP: đọc xong lần đầu +10, câu đúng lần đầu +2, lưu từ mới +1; đọc lại không nhận lại; phiên đọc lại để mở khoá không cộng
- [x] Chuỗi ngày đọc theo giờ Việt Nam
- [x] Huy hiệu: Truyện đầu tiên, 7 ngày chăm chỉ, Nhà sưu tầm từ, Đọc hết lộ trình, Điều ước thành thật (+ 2 huy hiệu chờ nội dung tương tác)
- [x] Cây tri thức 5 mốc (hạt → mầm → cây non → cây lớn → cây ra hoa); "Tưới cây" đầu tư EXP, tổng EXP không giảm
- [x] Sổ tay từ vựng, nghe lại từng từ
- [ ] Telemetry chạy nền — **Một phần:** giao diện đã gọi đủ 16 loại sự kiện trong phiên đọc (bắt đầu/xong phiên, xem/xong trang, TTS, tra/lưu từ, câu đố, phần thưởng, huy hiệu, đánh dấu, yêu thích, buộc thoát, cảm nhận), nhưng khi backend chưa có API thì `readingService.log` bỏ qua, **chưa sự kiện nào được lưu** (kể cả trên trình duyệt) — **chờ backend**
- [ ] Telemetry ngoài phiên đọc (`library_searched`, `story_wish_submitted`, `wish_suggestion_opened`) — **chờ backend** có endpoint telemetry theo hồ sơ bé
- [ ] Telemetry ASR, lựa chọn, dự đoán, hỏi nhân vật — chờ các tính năng tương ứng

### Luồng 3 — cần backend bổ sung

| Việc | Hợp đồng đề xuất (xem đầu file `readingService.ts`) |
|---|---|
| Trang chính của bé: thư viện đã lọc theo an toàn/tuổi/độ dài, tiến độ, EXP, lộ trình, Hold Mode, điều ước | `GET /children/{id}/reading/home` |
| Gói đọc theo `published_version_id`: trang, ảnh, audio, `word_timings`, từ vựng, câu đố có `accepted_answers` | `GET /reading/stories/{id}/package` |
| Phiên đọc: bắt đầu (ghim version, `opened_from`, `is_retake`), hoàn thành, thoát (`abandoned`), buộc thoát | `POST /reading/sessions`, `/complete`, `/exit`, `GET /force-exit` |
| Tiến độ: trang đọc dở, đánh dấu trang, yêu thích | `PUT /children/{id}/reading/progress/{storyId}` |
| Cảm nhận, câu đố (chấm + EXP), telemetry | `POST /reading/sessions/{id}/reaction`, `/quiz`, `/telemetry` |
| Sổ tay từ vựng, đầu tư EXP vào cây | `GET/POST /children/{id}/vocabulary-notebook`, `POST /children/{id}/achievements/invest` |
| Thẻ ước, gửi điều ước kèm gợi ý | `GET /children/{id}/wish-cards`, `POST /children/{id}/wishes` |
| Các API trên chấp nhận token phiên của bé (policy `ChildSession`) | Hiện chỉ `GET /ChildAccessCredential/me` nhận token này; bé vào bằng QR chưa đọc được truyện thật |
| Bảng thiếu trường so với đặc tả | `reading_progress` thiếu `bookmark_page`, `bookmark_node_id`, `current_node_id`; `achievements` thiếu `knowledge_tree_exp`, `last_streak_date`, `activities_completed`; `reading_sessions` thiếu `opened_from`, `is_retake`, `quiz_completed_at`, `selected_by_supervisor`, `entry_method`; `ReadingSession` còn `AssignmentRecipientId` (đặc tả v26 đổi thành `child_roadmap_item_id`) |

## Luồng 4 — Lộ trình, theo dõi, Hold Mode (~80% giao diện; dữ liệu chờ backend)

> **Lưu ý:** backend chưa có API cho lộ trình, Hold Mode, dashboard, báo cáo tuần, report và thư viện cộng đồng (bảng lộ trình vẫn là `assignments` cũ). Frontend gọi theo hợp đồng đề xuất trong `app/services/guardianService.ts`; khi backend chưa có thì dùng `app/services/guardianLocal.ts`. Bộ máy này dùng chung dữ liệu với phần đọc của bé (Luồng 3), nên trên cùng trình duyệt: bé đọc xong → lộ trình tự mở truyện kế; điểm câu đố thấp → Hold Mode; dashboard lấy số liệu thật từ các lần bé đọc. Dữ liệu chưa lưu lên máy chủ.

**Lộ trình của con (Bước 4.1–4.1d)** — màn `Lộ trình của con`
- [x] Thêm truyện cho một hoặc nhiều con; kiểm tra từng bé (hồ sơ hoạt động, nhóm tuổi, độ dài tối đa), bé không đạt bị bỏ qua và liệt kê lý do
- [x] Vị trí "Đọc tiếp theo" / "Thêm vào cuối"; số ngày mong đọc xong; lời nhắn cho con
- [x] Không thêm trùng; "Đọc tiếp theo" với truyện đã có thì chuyển truyện đó lên
- [x] Gỡ truyện (kể cả truyện đang mở → mở truyện kế), kéo thả hoặc nút lên/xuống để sắp xếp, làm trống lộ trình
- [x] Tự mở truyện kế khi bé đọc xong (đọc xong là xong, điểm câu đố không quyết định); dừng khi đang Hold Mode
- [x] Lịch sử: đã đọc / bị bỏ qua (kèm lý do) / đã gỡ; nhắc nhẹ khi quá ngày mong đọc xong
- [x] Kho bộ truyện mẫu: xem trước, cảnh báo khác nhóm tuổi, thêm cả bộ cho một hoặc nhiều con
- [x] Lối vào từ Thư viện ("Thêm vào lộ trình của con"), Dashboard, xử lý điều ước
- [x] Chỉ người có quyền "Quản lý lộ trình của con" mới sửa được
- [x] Thông báo `roadmap_story_added`, `roadmap_story_removed`, `roadmap_completed`
- [ ] Kiểm tra chủ đề bị chặn của từng bé khi thêm — **chờ backend** trả nhãn nội dung của truyện
- [ ] Thêm truyện của anh chị em (BR-4.A2) — giao diện mới chọn được truyện của bé đang xem
- [ ] Bộ truyện mẫu thật (từ Content Creator) — **chờ Luồng 5**; hiện dùng 2 bộ mẫu

**Theo dõi & trò chuyện sau đọc (Bước 4.3b, 4.3c)** — màn `Tổng quan` (Dashboard)
- [x] Tab "Tất cả các con" (tóm tắt mỗi con 1 dòng) và tab riêng từng con
- [x] Khối "Cần xử lý": truyện chờ duyệt, điều ước chờ xác nhận, Hold Mode cần chú ý, yêu cầu cấp quyền, thẻ chưa xem
- [ ] Khối "Cần xử lý" hiện thêm lời mời giám sát và đề nghị chuyển quyền Owner (Bước 4.3c) — hiện chỉ xử lý ở Hồ sơ bé → Người giám sát
- [ ] Màn "Báo cáo" trên thanh bên vẫn là thống kê trạng thái truyện kiểu cũ — nên bỏ hoặc gộp vào báo cáo tuần trên Dashboard
- [x] "Con vừa đọc xong": bài học, cảm nhận của con, điểm câu đố (khi có quyền xem kết quả), câu hỏi thảo luận, "Nghe tóm tắt", "Đã trò chuyện với con"
- [x] Tiến độ: phút đọc 7 ngày, truyện tuần này, chuỗi ngày đọc, số hoạt động, huy hiệu mới, tóm tắt lộ trình
- [x] Kết quả học tập: điểm câu đố 5 lần gần nhất, số từ đã lưu
- [x] Sở thích (chỉ tính truyện bé tự chọn), điều ước gần đây, 10 hoạt động gần đây
- [x] Tài khoản: số lượt tạo truyện đã dùng / còn lại
- [x] Khối thiếu quyền bị ẩn, hiện "Bạn chưa có quyền xem mục này" + "Xin quyền"
- [ ] Số kết thúc đã khám phá, tỷ lệ dự đoán khớp — **chờ** truyện nhiều lựa chọn / điểm dừng tương tác
- [ ] Tóm tắt cho phụ huynh do AI viết + audio — **chờ backend** (đang đọc bằng giọng trình duyệt một câu ghép từ tên truyện và bài học)

**Hold Mode (Bước 4.5.1–4.5.3c)**
- [x] Tự kích hoạt khi N bài gần nhất liên tiếp dưới ngưỡng (mặc định 70% / 3 bài, chỉnh ở Cài đặt an toàn); không tính bài đọc lại và truyện Thử thách
- [x] Bé chỉ mở được truyện gây khoá, tối đa 3 lượt / 24 giờ; đạt ngưỡng thì tự mở khoá
- [x] Khung Hold Mode cho phụ huynh: lý do, số lượt đọc lại, cảnh báo cần chú ý (hết lượt hoặc quá 7 ngày)
- [x] Mở khoá thủ công (quyền "Quản lý lộ trình") kèm ghi chú "Bố mẹ đã cùng con làm gì?"; bổ sung ghi chú sau khi đã mở (quyền "Xem kết quả")
- [x] Thông báo `hold_mode_alert`, `hold_mode_unlocked`
- [ ] Thông báo `hold_mode_needs_attention` — **chờ backend** (cần job chạy nền)

**Báo cáo định kỳ (Bước 4.5.4)**
- [x] Báo cáo tuần trên Dashboard (quyền "Nhận báo cáo"): số truyện, phút đọc, điểm câu đố trung bình, chủ đề, chuỗi ngày, huy hiệu, Hold Mode, truyện con thích nhất, điều ước, câu hỏi chưa xem
- [ ] Job tổng hợp thứ Hai + thông báo `progress_report_ready` — **chờ backend**

**Report nội dung (Bước 4.6)** — Thư viện → "Báo cáo nội dung"
- [x] 6 lý do + mô tả; không tự ẩn truyện; hiện trạng thái "đang chờ xử lý"

**Nộp thư viện cộng đồng (Bước 4.7)** — Thư viện → "Nộp thư viện cộng đồng"
- [x] Chỉ truyện sẵn sàng, không có báo cáo đang chờ, chưa nộp
- [x] Chặn khi còn thông tin cá nhân (số điện thoại, địa chỉ, trường, biệt danh của bé…); bắt buộc xác nhận không có thông tin định danh
- [x] Truyện nhập sẵn phải xác nhận "Đây là tác phẩm do tôi sáng tác"
- [x] Rút khi đang chờ / gỡ khi đã duyệt

**Thông báo trong app (Luồng 1 Phụ lục A)**
- [x] Chuông thông báo: danh sách, số chưa đọc, đọc một / đọc hết (chế độ thật dùng API `Notification` đã có)

### Luồng 4 — cần backend bổ sung

| Việc | Hợp đồng đề xuất (xem đầu file `guardianService.ts`) |
|---|---|
| Bảng `child_roadmap_items` theo đặc tả v27 (thay `assignments`, `assignment_recipients`) và các API lộ trình | `GET /children/{id}/roadmap`, `POST /roadmap/items`, `DELETE /roadmap/items/{id}`, `PUT /children/{id}/roadmap/order`, `POST /children/{id}/roadmap/clear` |
| Bộ truyện mẫu đã Published | `GET /roadmap-templates`, `POST /roadmap-templates/{id}/apply` |
| Hold Mode tự động + mở khoá | `GET /children/{id}/intervention`, `POST /intervention-cases/{id}/unlock`, `PUT /intervention-cases/{id}/notes` (bảng `intervention_cases` cần `triggering_story_id`, `resolution_type`, `skill_gap_notes`…) |
| Dashboard tổng hợp theo quyền LIVE, `child_daily_stats` | `GET /children/{id}/dashboard` |
| Thẻ "Con vừa đọc xong" | `GET /children/{id}/read-completions`, `PUT /read-completions/{id}/seen` |
| Báo cáo tuần (job thứ Hai, bảng `progress_reports`) | `GET /children/{id}/progress-reports` |
| Điều ước phía phụ huynh (Luồng 2 mục 3.5) | `GET /children/{id}/wishes`, `POST /wishes/{id}/fulfill-with-existing` · `/accept` · `/decline` |
| Report nội dung | `POST /content-reports`, `GET /stories/{id}/moderation-status` |
| Thư viện cộng đồng | `POST /community-submissions`, `POST /community-submissions/{id}/withdraw` |

## Luồng 5 — Admin / Content Creator / Moderator (~80% giao diện)

> **Lưu ý:** backend chỉ có 3 vai trò `Parent`, `Teacher`, `Administrator` — **chưa có Moderator và Content Creator**. Phần dùng **API thật**: đăng nhập MFA (TOTP), danh mục nội dung, Token Quota, Data Request, báo cáo nghiệp vụ, đối soát thanh toán, cấp/thu hồi Administrator. Phần còn lại gọi hợp đồng đề xuất trong `app/services/staffService.ts`, khi backend chưa có thì dùng `app/services/staffLocal.ts`. Bộ máy này nối với Luồng 3/4: báo cáo nội dung và bài nộp cộng đồng của phụ huynh vào hàng đợi Moderator; truyện mẫu được duyệt hiện trong thư viện của bé; bộ truyện mẫu đã công khai hiện trong kho của phụ huynh.
>
> Thử ở chế độ dữ liệu mẫu: đăng nhập bằng tên có chữ `admin`, `mod` hoặc `creator` (mật khẩu bất kỳ, mã TOTP bất kỳ 6 số).

**Đăng nhập & tài khoản (Bước 5.1, 5.1b, 5.1d)**
- [x] Bước nhập mã TOTP sau mật khẩu; lần đầu hiện mã QR để thiết lập (API thật `Auth/mfa/verify`)
- [x] Ba khu tách biệt theo vai trò: Admin Portal, Moderation view, Creator view; Parent không vào được
- [x] Mời Administrator / Moderator qua email (họ tên, email, chuyên môn); không trùng email với tài khoản khác; huỷ lời mời
- [x] Vô hiệu hoá / kích hoạt lại; không tự vô hiệu hoá mình; luôn còn ít nhất 1 Administrator; mục kiểm duyệt đang nhận trả về hàng đợi
- [x] Form "Đăng ký làm Content Creator" ở màn đăng nhập (chuyên môn, số năm, mô tả ≤ 1000 ký tự, portfolio, cam kết)
- [x] Duyệt / từ chối đơn Content Creator (bắt buộc nhận xét / lý do); cảnh báo đơn chờ quá 7 ngày; mỗi email 1 đơn đang chờ, nộp lại sau 30 ngày
- [x] Cấp / thu hồi Administrator bằng API hiện có
- [ ] Trang kích hoạt tài khoản từ link mời (đặt mật khẩu, cam kết, thiết lập TOTP) — **chờ backend**
- [ ] Administrator khác reset TOTP khi mất thiết bị — **chờ backend**

**Tài khoản phụ huynh (Bước 5.1e)**
- [x] Tìm theo email / họ tên, lọc trạng thái; xem số liệu đếm (không xem dữ liệu của bé)
- [x] Tạm khoá (bắt buộc lý do), mở khoá (bắt buộc ghi chú), mở khoá đăng nhập sớm

**Token Quota (Bước 5.1c)** — API thật
- [x] Xem các cấu hình, đặt hạn mức mặc định hoặc ghi đè cho một tài khoản theo kỳ
- [ ] Quota vận hành riêng cho Content Creator — **chờ backend**

**Giám sát AI (Bước 5.2, 5.2b)**
- [x] Chỉ số chất lượng AI: thành công, chặn, vùng xám, tỷ lệ cho qua, refine, Adapt, duyệt, từ chối, sửa nhãn, Context Fidelity F1–F5, mục đích chỉnh sửa, token, thời gian, kiểm duyệt quá hạn
- [x] Nhật ký sinh truyện: lọc theo nguồn / kết quả kiểm duyệt, chi tiết từng lời gọi AI, xuất CSV, "Điều tra sự cố" bắt buộc lý do
- [ ] Số liệu thật — **chờ backend** (`ai_governance_metrics`, `llm_call_logs`)

**Danh mục & Prompt Catalog (Bước 5.3)**
- [x] Danh mục nội dung: thêm, đổi tên, ẩn / hiện (API thật)
- [x] Thẻ ước, bài học gợi ý, nhân vật mẫu: thêm, ẩn / hiện
- [x] Phiên bản Prompt Catalog: tạo bản nháp (ngưỡng vùng xám / chặn, ngày hiệu lực, ghi chú), publish, quay lại bản trước
- [x] Chặn publish khi chưa chạy đánh giá, còn case tấn công lọt qua, hoặc điểm an toàn thấp hơn bản đang dùng (BR-5.E1)
- [ ] Soạn nội dung prompt template, bảng mức đọc, khung truyện, rubric, blocklist trong giao diện — **chờ backend**
- [ ] (Optional) Nhập hàng loạt CSV / JSON

**Data Request (Bước 5.4)** — API thật
- [x] Phụ huynh (Owner) gửi yêu cầu xuất / xoá dữ liệu ở Hồ sơ bé → tab Hồ sơ
- [x] Administrator xem yêu cầu đang chờ, SLA 72 giờ (cảnh báo từ 48 giờ), xuất file Excel / CSV, xoá dữ liệu (xác nhận)

**Báo cáo nghiệp vụ (Bước 5.5)** — API thật
- [x] Tổng hợp theo kỳ, công bố, xem báo cáo công bố gần nhất
- [ ] Danh sách các báo cáo cũ — **chờ backend** (mới có `latest-published`)

**Đối soát thanh toán (Bước 5.6, Optional)** — API thật
- [x] Danh sách giao dịch lệch số tiền, xác nhận đã thanh toán
- [ ] Phụ huynh mua gói, mã QR SePay — chưa làm

**Hàng đợi kiểm duyệt (Bước 5.7)**
- [x] Một hàng đợi cho 5 loại mục, sắp theo ưu tiên và hạn SLA; báo quá hạn
- [x] "Nhận xử lý" (khoá lạc quan), tự trả về sau 2 giờ, "Trả lại"
- [x] Duyệt truyện / bộ truyện mẫu của Creator: Duyệt / Yêu cầu sửa / Từ chối
- [x] Rà truyện vùng xám: Cho qua / Chặn (thông tin cá nhân hiện dạng che)
- [x] Xử lý báo cáo: Lưu trữ truyện / Bỏ qua / Chuyển lên Administrator; truyện Public Library bị lưu trữ → báo Creator, bộ truyện mẫu chứa truyện → cần sửa
- [x] Duyệt thư viện cộng đồng: Duyệt / Từ chối
- [x] Sửa nhãn nội dung; sửa ánh xạ thẻ ước cho truyện công khai
- [x] Bắt buộc lý do khi từ chối / chặn / lưu trữ / yêu cầu sửa / chuyển lên
- [x] Administrator: chỉ xử lý ca được chuyển lên; xử lý cả hàng đợi khi không còn Moderator hoạt động
- [ ] Truyện nhiều lựa chọn: bắt buộc mở mọi kết thúc trước khi duyệt — **chờ** truyện nhiều lựa chọn
- [ ] So sánh với bản đã gửi trước khi duyệt lại — **chờ backend** (lịch sử phiên bản)

**Content Creator (Bước 5.8, 5.9)**
- [x] Truyện mẫu: soạn (tuổi, mức đọc, thể loại, chủ đề, bài học bắt buộc), lưu nháp, cam kết bản quyền, gửi duyệt, rút yêu cầu, xem phản hồi, gỡ khỏi thư viện
- [x] Chặn gửi duyệt khi còn thông tin cá nhân
- [x] Sửa truyện đã công khai tạo bản mới; bản cũ vẫn hiện tới khi bản mới được duyệt
- [x] Bộ truyện mẫu: chỉ chứa truyện đang công khai; lưu nháp, gửi duyệt, nhân bản bản đã công khai, lưu trữ; cảnh báo cần sửa
- [ ] Tạo truyện mẫu bằng pipeline AI của Luồng 2 (dàn ý, học liệu, ảnh, giọng đọc) — **chờ backend** cho truyện không gắn hồ sơ bé

**Bộ dữ liệu & đánh giá AI (Bước 5.10)**
- [x] Content Creator thêm test prompt (thông thường / biên / tấn công, kết quả kỳ vọng); Administrator duyệt vào bộ chính thức
- [x] Administrator chạy bộ đánh giá trên một phiên bản; kết quả theo loại case, độ khó, token, điểm chấm
- [x] Moderator chấm điểm 1–5 cho 4 tiêu chí
- [ ] Chạy pipeline sandbox thật — **chờ backend** (hiện mô phỏng)
- [ ] (Optional) So sánh 2 lượt đánh giá

### Luồng 5 — cần backend bổ sung

| Việc | Đặc tả | Backend hiện tại |
|---|---|---|
| Vai trò `Moderator`, `ContentCreator` và session scope tương ứng | Mục 1.2, BR-5.7a | Enum `UserRole` chỉ có `Parent`, `Teacher`, `Administrator` |
| Mời Administrator / Moderator qua email, trang kích hoạt, đơn Content Creator | Bước 5.1b, 5.1d | `AdminAccount/grant` chỉ cấp quyền cho email có sẵn |
| Quản lý tài khoản Parent (tạm khoá, mở khoá) | Bước 5.1e | Chưa có API |
| Chỉ số AI, nhật ký sinh truyện | Bước 5.2, 5.2b | Chưa có API |
| Thẻ ước, bài học, nhân vật mẫu, Prompt Catalog có phiên bản | Bước 5.3 | Chỉ có `ContentCategory` |
| Hàng đợi kiểm duyệt (`moderation_items`) và quyết định | Bước 5.7 | Chưa có API |
| Truyện Public Library, Roadmap Template của Content Creator | Bước 5.8, 5.9 | Chưa có API |
| Bộ đánh giá AI (prompt, lượt chạy sandbox, điểm chấm) | Bước 5.10 | Chưa có API |
| Danh sách báo cáo nghiệp vụ cũ | Bước 5.5 | Chỉ có `latest-published` |
| Hợp đồng đề xuất cho toàn bộ phần trên | — | Xem đầu file `staffService.ts` |

## Luồng 6 — Học tập thích ứng (Core xong giao diện; dữ liệu chờ backend)

> **Lưu ý:** backend chưa có API cho Luồng 6. Frontend gọi theo hợp đồng đề xuất trong `app/services/adaptiveService.ts`; khi backend chưa có thì dùng `app/services/adaptiveLocal.ts`, phân tích dữ liệu đọc của bộ máy cục bộ Luồng 3/4 (chỉ có trên cùng trình duyệt). Quy tắc rule-based v1 nằm ở `app/lib/adaptiveRules.ts` (có test). Riêng việc **áp dụng mức đọc mới gọi API thật** `PUT /LearningProfile/{id}`.

**Phân tích & tạo đề xuất (Bước 6.1–6.4)**
- [x] Ngưỡng 5 phiên đọc xong / 14 ngày; không tính phiên đọc lại để mở khoá; phiên bé tự bỏ ngang tính vào tỷ lệ hoàn thành (`readingLocal` ghi thêm `abandonLog`)
- [x] Nhánh A — tăng mức đọc: 5 câu đố gần nhất ≥ 85% và hoàn thành ≥ 90% (truyện Thử thách điểm cao được tính là bằng chứng)
- [x] Nhánh A — giảm mức đọc: ≥ 4/5 câu đố vừa sức dưới ngưỡng Hold Mode và hoàn thành < 80% (điểm thấp ở truyện Thử thách không dùng để giảm)
- [x] Luôn cần ≥ 2 tín hiệu (BR-6.2, BR-6.3); không tạo đề xuất mức đọc khi đang Hold Mode (BR-6.10)
- [x] Nhánh B — gợi ý chủ đề: thể loại bé tự chọn ≥ 3/5 phiên gần nhất (không tính phiên bố mẹ chọn), thẻ ước lặp lại; trẻ mới chưa đủ 5 phiên dùng chủ đề yêu thích hoặc thẻ ước, tối đa 1 lần / 7 ngày
- [x] Không gợi ý chủ đề thuộc danh mục bị chặn; có danh sách Cho phép thì chỉ gợi ý trong đó; không gợi ý lặp chủ đề vừa gợi ý hoặc bị từ chối
- [x] Mỗi đề xuất có quan sát, trạng thái hiện tại → đề xuất, danh sách bằng chứng
- [ ] Đối chiếu chủ đề với danh mục nội dung đang so khớp theo tên — **chờ backend** gắn nhãn nội dung cho thể loại / chủ đề

**Hiển thị & quyết định (Bước 6.5–6.6)** — Dashboard → "Cần xử lý"
- [x] Hàng đợi chung theo bé, hiện cho mọi người giám sát hợp lệ, tải lại mỗi lần mở Dashboard; đếm vào số việc cần xử lý
- [x] Nhãn "Bạn có thể quyết định cuối" / "Bạn chỉ có thể góp ý" (Nhánh A cần Owner hoặc quyền "Sửa mức đọc"; Nhánh B ai cũng quyết định được)
- [x] Đồng ý / Sửa (chỉ cùng hướng đề xuất) / Từ chối / Theo dõi thêm, kèm lý do không bắt buộc
- [x] Kiểm tra lại quyền ngay lúc bấm; quyền đổi thì báo "Quyền của bạn đã thay đổi, vui lòng tải lại"
- [x] Quyết định cuối đầu tiên khoá đề xuất; review sau đó lưu làm góp ý và báo "Đề xuất đã được [tên] quyết định"; hiện danh sách góp ý trên thẻ
- [x] Thông báo `recommendation_awaiting_review`; ngày 7 nhắc lại 1 lần; quá 14 ngày → "Đã hết hạn" (stale)
- [x] Đề xuất vừa quyết định hiện thêm 3 ngày để xem kết quả

**Áp dụng & theo dõi (Bước 6.7–6.8)**
- [x] Nhánh A: cập nhật mức đọc trên hồ sơ học tập thật, ghi lịch sử phiên bản (bản mới "Đang dùng", bản trước superseded)
- [x] Nhánh B: chỉ ghi nhận, không đổi hồ sơ; nút "Tạo truyện với chủ đề này" mở sẵn form Studio
- [x] Theo dõi sau điều chỉnh (mức đơn giản): sau 5 câu đố so với trước → "Đã phù hợp" hoặc "Cần xem lại"
- [x] Hồ sơ bé → Học tập: lịch sử thay đổi mức đọc (theo đề xuất / sửa thủ công) và các đề xuất đã xử lý
- [x] Sửa mức đọc thủ công sau khi hồ sơ Active ghi lịch sử nguồn "thủ công" (Luồng 1 Bước 1.3) — cũng là cách hoàn tác đề xuất
- [ ] Cảnh báo truyện đang chờ trong lộ trình lệch nhiều so với mức đọc mới — **chờ backend** trả `readingLevel` của truyện trong lộ trình
- [ ] Ghi lịch sử khi đổi chế độ đọc — **chờ backend** (`reading_mode`, xem Luồng 1)

**Optional (chưa làm)**
- [ ] Nhánh A cho `learning_focus` (trọng tâm kỹ năng)
- [ ] Nhánh C — đề xuất Hold Mode (`learning_intervention`); Hold Mode tự động của Luồng 4 vẫn chạy
- [ ] Tín hiệu phát âm (phụ thuộc ASR ở Luồng 3)

### Luồng 6 — cần backend bổ sung

| Việc | Hợp đồng đề xuất (xem đầu file `adaptiveService.ts`) |
|---|---|
| Job phân tích định kỳ tạo `learning_insights` / `recommendations`; chuyển stale sau 14 ngày; nhắc ngày 7 | `GET /children/{id}/recommendations` |
| Review nhiều người: kiểm tra quyền LIVE, `had_final_authority`, khoá lạc quan cho quyết định cuối; áp dụng Nhánh A trong cùng transaction với `child_profile_version_history` | `POST /recommendations/{id}/reviews` |
| Lịch sử phiên bản hồ sơ học tập; `PUT /LearningProfile` đổi mức đọc thì tự ghi dòng `source='manual'` | `GET /children/{id}/learning-profile/versions` |
| Dữ liệu đầu vào: telemetry, `reading_sessions` (`is_retake`, `selected_by_supervisor`, `status` abandoned / force_exited), `quiz_attempts`, `story_reactions`, thẻ ước | Phụ thuộc các API Luồng 3 / 4 ở trên |

## Chung cho mọi luồng

- [x] Giao diện sáng / tối
- [x] Báo trạng thái kết nối backend
- [x] Chế độ dữ liệu mẫu (mock)
- [x] Trung tâm thông báo trong app (đã đọc / chưa đọc)
- [x] Hiển thị Token Quota đã dùng / còn lại (Studio, Dashboard)
- [ ] (Optional) Mua thêm gói qua SePay
- [x] Kiểm tra quyền giám sát ở giao diện (ẩn hoặc vô hiệu nút theo quyền, kiểm tra lại mỗi lần đổi bé): Hồ sơ bé, Cài đặt an toàn, Thư viện (lộ trình, nộp cộng đồng, lưu trữ), Lộ trình, các khối Dashboard, Hold Mode. Studio không cần quyền riêng; nút Duyệt dựa vào `canApprove` backend trả về
- [ ] Dọn các hàm gọi API Organization và ClassGroup (dành cho vai trò Teacher, đặc tả đã bỏ)
- [ ] Dọn code không dùng: `RevisePanel` và `ProposalCard` trong `features/review/ReviewTools.tsx` (màn duyệt dùng `RevisionPanel.tsx` và `ProposalCard.tsx`)

## Thứ tự nên làm

1. ~~Gỡ xung đột merge trong `app/page.tsx`.~~ Xong.
2. ~~L1: tạo hồ sơ bé, hồ sơ học tập, kích hoạt, sửa Cài đặt an toàn cho đúng đặc tả.~~ Xong phần frontend; gửi bảng "Luồng 1 — cần backend bổ sung" cho nhóm backend.
3. ~~L3: màn đọc có ảnh, giọng đọc, lưu tiến độ, gửi kết quả câu đố, EXP.~~ Xong giao diện; backend cần làm API theo bảng "Luồng 3 — cần backend bổ sung".
4. ~~L4: Lộ trình của con và Dashboard.~~ Xong giao diện; backend cần làm API theo bảng "Luồng 4 — cần backend bổ sung".
5. ~~Các phần còn lại của L2~~ Xong phần frontend; gửi bảng "Luồng 2 — cần backend bổ sung" cho nhóm backend.
6. ~~L5~~ Xong giao diện; backend cần thêm vai trò Moderator / Content Creator và các API theo bảng "Luồng 5 — cần backend bổ sung".
7. ~~L6~~ Xong phần Core ở giao diện; backend cần làm API theo bảng "Luồng 6 — cần backend bổ sung".
8. Tiếp theo: các mục còn `[ ]` không ghi "chờ backend" (phiên của bé hết hạn sau 20 phút, khối "Cần xử lý" thêm lời mời / chuyển quyền Owner, màn "Báo cáo" cũ, dọn code thừa).
