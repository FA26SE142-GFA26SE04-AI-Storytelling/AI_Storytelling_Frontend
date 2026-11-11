# Chức năng theo vai trò — đã làm / chưa làm

Cập nhật: 11/11/2026.

Căn cứ:

- **Tài liệu 6 (ưu tiên)**: `SEP420_R2_BM04_Commitment` — bản cam kết sau Review 2, gồm 22 chức năng bắt buộc F-01 → F-22. Đây là phạm vi chấm ở Defense 1.1 và Viva; sau Review 2 phạm vi không đổi.
- Tài liệu Luồng 1–5 (link trong `CLAUDE.md` ở thư mục gốc dự án).
- Code ngày 11/11: Backend nhánh `main` (`AI_Storytelling_Backend/src/Core`) và Frontend `main` (`src/`). Backend đang checkout `main`, không phải `feature/read-aloud-f13`; fix media của bé (commit 7ecf5fe) chỉ có trên `feature/read-aloud-f13`. Audit endpoint (`node scripts/audit-core-api.mjs`): Backend có **369** endpoint, Frontend đã nối **342**, 2 loại trừ, còn **25**. Trong 25 có 7 endpoint FE đã gọi qua hàm bọc mà audit không nhận (xem mục 7), nên thật sự thiếu **18**.

Ký hiệu:

- `[x]` đã làm, chạy được cả Backend và Frontend.
- `[ ]` **Một phần** — có một phần, ghi rõ còn thiếu gì và thiếu ở đâu (BE / FE).
- `[ ]` chưa làm.

---

## Tổng quan 22 chức năng bắt buộc (tài liệu 6)

| ID | Chức năng | Vai trò | Phụ trách | Trạng thái |
| :-: | :-- | :-- | :-- | :-- |
| F-01 | Hồ sơ bé, Learning Profile, Safety Policy | Phụ huynh | Duy | Đã làm |
| F-02 | Bé vào app (QR, giao máy) và cổng phụ huynh | Phụ huynh, Bé | Duy | Đã làm |
| F-03 | Gói dịch vụ và thanh toán QR SePay | Phụ huynh, Creator | Tuấn | **Một phần** — phụ huynh xong; BE đã có gói Creator, FE chưa có màn mua; còn quyền lợi theo gói |
| F-04 | Xác nhận thanh toán, hết hạn | SePay, Hệ thống, Admin | Tuấn | **Một phần** — phụ huynh xong; BE đã áp gói Creator, FE chưa có màn mua gói Creator |
| F-05 | Lượt tạo truyện AI: kiểm tra, trừ, lịch sử | Phụ huynh, Creator | Tuấn | **Một phần** — xem lượt, lịch sử xong; BE đã có hạn mức Creator và hoàn lượt gửi duyệt, FE chưa có màn lượt Creator; còn giữ/hoàn lượt AI, miễn phí tạo lại |
| F-06 | Tạo truyện bằng AI và duyệt nội dung | Phụ huynh, Creator | Minh | Đã làm |
| F-07 | Tự viết và nhập truyện có sẵn | Phụ huynh, Creator | Minh | Đã làm |
| F-08 | Điều ước của bé và phụ huynh đáp lại | Bé, Phụ huynh | Minh | Đã làm |
| F-09 | Tranh, giọng đọc và xác nhận gói media | Phụ huynh, Creator | Minh | Đã làm |
| F-10 | Gửi truyện công khai và kiểm duyệt | Phụ huynh, Creator, Moderator | Minh | Đã làm |
| F-11 | Cấu hình kiểm duyệt: tiêu chí, thẻ ước, hướng dẫn sáng tác | Moderator | Duy | Đã làm |
| F-12 | Lộ trình đọc và thư viện lộ trình mẫu | Phụ huynh, Moderator, Bé | Duy | Đã làm |
| F-13 | Phiên đọc: TTS, tương tác khi nghe, luyện đọc to | Bé | Duy | Đã làm |
| F-14 | Quiz, EXP, huy hiệu, cây tri thức, sổ tay | Bé | Duy | Đã làm |
| F-15 | Thống kê doanh thu | Admin | Tuấn | **Một phần** — BE đã có doanh thu và tài khoản, FE chưa hiện hai số liệu này |
| F-16 | Báo cáo tài khoản người dùng | Admin | Tuấn | **Một phần** — BE đã có `BusinessReport/admin/accounts`, FE chưa có màn |
| F-17 | Quản lý gói dịch vụ | Admin | Tuấn | **Một phần** — sửa / bật tắt gói xong; chưa tạo gói, chưa cấu hình quỹ Creator |
| F-18 | Đối soát thanh toán – lượt | Admin | Khánh | Đã làm |
| F-19 | Thống kê hàng đợi kiểm duyệt và SLA | Moderator | Khánh | Chưa làm |
| F-20 | Doanh thu của Creator | Creator | Tuấn | **Một phần** — BE đã có `CreatorStatistics/revenue`, FE chưa có màn |
| F-21 | Thống kê lượt đọc của Creator | Creator | Tuấn | **Một phần** — BE đã có `CreatorStatistics/reading`, FE chưa có màn |
| F-22 | Thống kê nội dung của Creator | Creator | Khánh | Chưa làm |

**Đã làm 12/22 · Một phần 8/22 · Chưa làm 2/22** (cập nhật 11/11). Chưa làm: F-19, F-22 (chưa có cả Backend lẫn Frontend). Một phần: F-03, F-04, F-05 (BE có gói Creator, FE chưa có màn), F-15, F-16, F-17, F-20, F-21 (BE có API, FE chưa nối đủ). Phần còn thiếu dồn ở **gói Creator** (WF-02) và **thống kê** (WF-05); WF-01, WF-03, WF-04 gần xong.

---

## 1. Phụ huynh

### Tài khoản (F-01, Luồng 1a)

- [x] Đăng ký, xác thực email, đăng nhập, quên / đổi mật khẩu, đổi email, quản lý phiên đăng nhập, xoá tài khoản (xem trước dữ liệu sẽ mất). Auth 20/20 endpoint đã nối.
- [x] Lịch sử hoạt động của tài khoản, hiện tiếng Việt cho mọi mã hành động ([auditLabels.ts](src/app/lib/auditLabels.ts)).

### Hồ sơ bé (F-01)

- [x] Tạo hồ sơ Draft (tên, ảnh đại diện, nhóm tuổi 6–8 / 9–10, tiếng Việt), sửa hồ sơ.
- [x] Learning Profile: mức đọc 1–5, chế độ đọc, mục tiêu đọc hiểu, chủ đề yêu thích / cần chú ý.
- [x] Safety Policy: chủ đề Cho phép / Chặn, chế độ duyệt, độ dài truyện, cổng phụ huynh, điều ước, tương tác khi nghe, trả lời bằng giọng nói (kèm đồng ý mục e), ngưỡng an toàn / độ dễ đọc khi tự duyệt, mức đọc hiểu mục tiêu; đồng ý điều khoản đúng phiên bản.
- [x] Kích hoạt, tạm dừng, tiếp tục, lưu trữ, khôi phục; lịch sử hoạt động của từng bé.
- [x] Nút xoá hồ sơ học tập và cài đặt an toàn của bé (`DELETE /LearningProfile/{id}`, `DELETE /SafetyPolicy/{id}`), có popup xác nhận; nút xoá cài đặt an toàn bị khoá khi hồ sơ bé đang Active.

### Cho bé vào app (F-02)

- [x] Tạo / tạo lại / thu hồi mã EasyLogin (QR).
- [x] Giao máy cho bé ("Vào trang bé") và giao máy kèm truyện ("Cho bé đọc ngay").
- [x] Cổng phụ huynh khi bé muốn thoát (nhập lại email + mật khẩu); tải lại trang vẫn ở chế độ của bé.

### Gói dịch vụ và lượt AI (F-03, F-04, F-05)

Backend đợt 1 của Tuấn (10/11, PR #127, hướng dẫn `docs/PARENT_PLANS_PAYMENT_API_GUIDE.md` trong repo Backend) + Frontend 10/11.

- [x] **Mua gói** ([PaymentSection.tsx](src/app/features/account/PaymentSection.tsx), trang "Nâng cấp gói"): Gói Đọc 49.000 đ, Gói Sáng tạo 99.000 đ (4 lượt AI mỗi chu kỳ), Add-on 29.000 đ (+2 lượt, khoá kèm lý do khi chưa có gói). Nút đổi theo gói đang dùng: Đăng ký / Gia hạn / Nâng cấp / Chuyển gói / Mua thêm lượt, hỏi xác nhận kèm hệ quả (ngày bắt đầu, lượt giữ hay mất).
- [x] **Thanh toán QR**: popup hiện mã QR, số tiền, nội dung chuyển khoản (nút chép), đếm ngược 15 phút; tự hỏi lại mỗi 5 giây và báo "Thanh toán thành công" khi Paid. QR không tải được thì báo rõ thay vì hiện hình mặc định.
- [x] **Gói của bạn và lượt còn lại** (`GET /TokenQuota/me`): tên gói, ngày hết hạn, gói đã gia hạn sẵn, tổng lượt AI tách theo gói tháng / Add-on / dùng thử / lượt khác.
- [x] **Lịch sử giao dịch** (`GET /Payment/transactions/me`, phân trang): trạng thái, ngày trả; giao dịch chờ còn hạn có nút "Tiếp tục thanh toán"; sai số tiền ghi "Đang chờ quản trị viên xử lý".
- [x] **Chu kỳ 1 tháng, gia hạn sớm nối tiếp, nâng Gói Đọc → Sáng tạo có hiệu lực ngay, nhắc gia hạn 3 ngày trước khi hết, hết hạn về Miễn phí** (BE `SubscriptionCycleWorker`). Thông báo "Thanh toán thành công" và "Gói sắp hết hạn" mở thẳng trang Nâng cấp gói.
- [x] Studio hết lượt: báo "Bạn đã hết lượt tạo truyện AI" kèm nút "Nâng cấp gói"; nhãn "Còn N lượt AI".
- [ ] **Quyền lợi theo gói** (BE chưa có, ngoài phạm vi đợt 1): Free chỉ 1 hồ sơ bé, 3 truyện mới của thư viện công khai mỗi tuần, không sao chép lộ trình mẫu; Gói Đọc / Sáng tạo tối đa 4 hồ sơ bé. Trang Nâng cấp gói đã ghi các quyền lợi này nhưng Backend chưa chặn.
- [ ] Cảnh báo khi xoá tài khoản còn gói đang chạy — BE chưa có.

### Tạo truyện (F-06, F-07, F-08, F-09)

- [x] Tạo truyện bằng AI (Studio): ý tưởng → dàn ý (sửa, viết lại, duyệt, từ chối) → nội dung, từ vựng, quiz, tương tác khi nghe (duyệt từng phần, sửa tay, nhờ AI sửa đoạn) → tranh và giọng đọc (tạo lại từng tranh / đoạn, thử lại) → xác nhận gói media → Ready.
- [x] Nhập truyện tự viết từ tệp / dán văn bản có bước xác nhận (popup xem trước → `POST /parent/stories/{id}/imports/confirm`); tranh / âm thanh của gói học liệu tải qua `GET /parent/stories/{id}/packages/{pid}/assets/{aid}`.
- [x] Truyện có sẵn của phụ huynh: nhớ truyện đang đánh giá trong tab, mở lại thì lấy đánh giá đã lưu (`GET /stories/{id}/existing/evaluation`), nút "Đánh giá lại", nút "Lưu trữ" có popup lý do (`POST /stories/{id}/existing/archive`) ([ImportStoryPanel.tsx](src/app/features/studio/ImportStoryPanel.tsx)).
- [x] Tự viết truyện: soạn, nhập từ tệp, dán văn bản, lưu nhiều phiên bản, trợ lý AI gợi ý, kiểm tra nội dung, xác nhận nội dung, chuẩn bị media, xác nhận cho gia đình.
- [x] Ảnh bìa truyện; Truyện của tôi theo kệ (Đã xong / Chờ bạn duyệt / Đang soạn).
- [x] Điều ước của bé: xem điều ước và gợi ý truyện có sẵn, dùng truyện có sẵn, tạo truyện mới bằng AI (xem tiến độ, mở trong Studio), từ chối.
- [x] **Nhập truyện có sẵn** (Luồng 3b, [ImportStoryPanel.tsx](src/app/features/studio/ImportStoryPanel.tsx)): trong Viết bằng AI chọn "Nhập truyện có sẵn" → dán văn bản hoặc tải .txt/.docx → AI đánh giá (Phù hợp / Nên chỉnh lại / Chưa phù hợp, điểm an toàn, số chữ, độ dễ đọc, các vấn đề) → Tiếp tục, Nhờ AI chỉnh, Tự sửa hoặc Giữ nguyên (ghi lý do) → Studio mở truyện, tạo học liệu và đi tiếp các bước duyệt, tranh, giọng đọc. Chưa dùng: xem lại đánh giá đã lưu (`GET .../existing/evaluation`), lưu trữ (đã chốt bỏ).
- [x] **Giao cho nhiều bé (gói riêng từng bé)** ([FamilyPackages.tsx](src/app/features/authoring/FamilyPackages.tsx), bước 2 của Tự viết, nút "Giao cho nhiều bé"): chọn bé và thành phần gói (từ vựng, câu đố, tương tác khi nghe, tranh, giọng đọc) → chốt nội dung → Backend kiểm tra theo hồ sơ từng bé → Tạo học liệu → Xem trước (nội dung, tranh / giọng đọc tải kèm token, từ vựng, câu đố có đáp án) → Chốt gói → Giao nhiều bé một lần; thu hồi riêng từng bé; Thử lại phần lỗi; Đổi thành phần (bản gói mới); Mở lại để sửa nội dung. Đã thử thật với 2 bé (truyện #920). Truyện đã có gói thì không trộn với cách giao một bé.
- [ ] Lượt tạo truyện theo tài liệu 6 — xem mục Hệ thống bên dưới.

### Cộng đồng (F-10)

- [x] Kiểm tra điều kiện rồi gửi truyện Ready lên thư viện cộng đồng; rút lại; xem truyện cộng đồng.
- [x] Báo cáo nội dung không phù hợp.

### Lộ trình và theo dõi bé (F-12, Luồng 4a, 4c)

- [x] Thêm truyện vào lộ trình (Đọc tiếp theo / Cuối lộ trình), đổi thứ tự, gỡ một bước, làm trống; chặn khi hồ sơ không Active.
- [x] Thư viện lộ trình mẫu: xem, xem trước, sao chép cho bé.
- [x] Trang "Học tập của bé": Tổng quan, Lộ trình, Kết quả đọc (phản hồi đọc, câu bé trả lời, bản ghi âm kể lại, chỗ bé còn thắc mắc, xoá bản kể lại), Điều ước.
- [x] Thông báo (đọc, đánh dấu đã đọc, xoá).

---

## 2. Bé (Child Session)

- [x] Vào app bằng QR EasyLogin (khoá thiết bị 5 phút khi quét sai nhiều lần) hoặc do phụ huynh giao máy (F-02).
- [x] Trang chính của bé: truyện hôm nay, hành trình (lộ trình), Truyện, Sổ tay, Điều ước, Phần thưởng.
- [x] Phiên đọc ListenFirst / ReadFirst, chỉ nghe, đoạn chữ, đọc theo trang (mỗi tranh là một trang, có nút lật trước / sau; giọng kể dừng cuối trang), giọng đọc TTS, từ vựng, lưu tiến độ, dấu trang, yêu thích (F-13) (`src/app/features/kid/ChildReader.tsx`).
- [x] 5 loại tương tác khi nghe: Checkpoint, RolePlay, FillBlank, EventOrdering, PicturePrediction (F-13).
- [x] **Luyện đọc to bằng nhận dạng giọng nói** (F-13) — bé bấm icon micro ở đoạn đang đọc để ghi âm, bấm lại để gửi; chấm từng chữ: xanh (đúng), vàng (sai dấu, chưa rõ hoặc đọc thành chữ khác, có gợi ý), xám (bỏ qua); có nút đọc lại, thông báo bằng toast. BE: `POST /child/reading/sessions/{id}/segments/{id}/read-aloud` (`ChildReadingController.cs`, trên `main`); FE: `childReadingService.ts`, `ChildReader.tsx`, `ChildReaderCaption.tsx`.
- [ ] Karaoke: tô đậm từng chữ theo giọng đọc — chưa làm, không thuộc 22 chức năng bắt buộc. BE dùng Gemini TTS, `EnableWordTimings=false` nên không có mốc thời gian từng chữ; FE có `parseWordTimings` và `useNarrator.ts` xử lý mốc nhưng chưa gắn vào màn đọc.
- [x] Hoàn thành truyện, chọn cảm xúc, làm quiz (trắc nghiệm, đúng/sai, trả lời ngắn ≤ 200 ký tự) (F-14).
- [x] EXP, 7 huy hiệu, cây tri thức 5 giai đoạn (tưới cây), sổ tay từ vựng, nghĩa của từ; đọc xong mở bước lộ trình tiếp theo (F-14).
- [x] Cuối truyện ghi âm kể lại (đổi sang WAV trước khi gửi) và đánh dấu tối đa 5 cảnh còn thắc mắc.
- [x] Gửi điều ước bằng thẻ (F-08).
- [x] Đọc truyện cộng đồng đã duyệt.
<<<<<<< Updated upstream
- [ ] **Tranh / âm thanh của truyện gia đình tự soạn** (`GET /child/manual-stories/{confirmationId}/assets/{assetId}`) — **bị chặn bởi BE**: link dựng với mã xác nhận 0 và bị ký nhầm như đường dẫn kho. Khi BE sửa: FE tải file kèm token phiên của bé rồi hiện bằng blob URL.
=======
- [ ] **Một phần — Tranh / âm thanh của truyện gia đình tự soạn** (`GET /child/manual-stories/{confirmationId}/assets/{assetId}`): FE tải file kèm token phiên của bé rồi hiện bằng blob URL (`src/app/lib/useAuthedMediaUrl.ts`, dùng ở tranh cảnh, giọng đọc và xem trước truyện gia đình). BE còn thiếu trên `main`: fix signer bỏ qua URL /api/ (commit 7ecf5fe, `ChildMediaUrlSigner.cs`) mới nằm ở nhánh `feature/read-aloud-f13`, chưa merge vào `main`.
>>>>>>> Stashed changes

---

## 3. Content Creator

- [x] Tạo truyện bằng AI (F-06) và tự viết (F-07): soạn, nhập, lưu phiên bản, trợ lý AI, tự kiểm tra nội dung (An toàn / Vùng xám / Bị chặn), xác nhận nội dung, tranh và giọng đọc, xác nhận gói (F-09).
- [x] Gửi duyệt công khai: chọn ảnh bìa và nhãn nội dung, rút yêu cầu, gửi lại khi chỉ bị trả về vì nhãn, tạo bản chỉnh sửa, yêu cầu gỡ truyện đã công khai (F-10).
- [x] Thư viện truyện mẫu, Truyện của tôi.
- [x] **Media từng đoạn của Creator**: bước "Kiểm tra và chốt" chọn "AI tạo hết" hoặc "Tự chọn từng phần"; ở bước Tranh và giọng đọc, mỗi tranh / đoạn đang chờ có nút Tải lên (khai báo nguồn và quyền, ảnh JPEG/PNG/WebP ≤ 10 MB, âm thanh MP3/WAV ≤ 25 MB) và AI tạo. Đã thử thật (truyện #919).
- [ ] **Một phần — Mua gói Creator, xem lượt tạo truyện và lượt gửi duyệt** (F-03, F-05): BE đã có gói Creator 99.000 đ (+6 lượt AI, +20 lượt gửi), hạn mức tháng (2 lượt AI + 5 lượt gửi), trừ / hoàn lượt gửi duyệt (`TokenQuotaService.Creator.cs`). FE chưa có màn mua gói Creator và màn xem lượt Creator. Hạn mức đối tác (6 + 10) BE ghi là hoãn, cần xác nhận.
- [ ] **Một phần — Doanh thu ước tính** (F-20): quỹ Creator theo tháng (30% Gói Đọc + 10% Gói Sáng tạo), chia theo lượt đọc hợp lệ. BE có `GET /CreatorStatistics/revenue`; FE chưa có màn.
- [ ] **Một phần — Thống kê lượt đọc** (F-21): lượt xem, yêu thích, đọc xong, lượt đọc hợp lệ, tỉ lệ hoàn thành theo truyện và theo kỳ. BE có `GET /CreatorStatistics/reading`; FE chưa có màn.
- [ ] **Thống kê nội dung** (F-22): số truyện theo trạng thái, kết quả gửi duyệt trong kỳ, lượt còn lại, hạng Creator / đối tác và tiến độ 90 ngày — chưa có BE và FE.
- [ ] Creator tự đăng ký — chưa chốt cách tạo tài khoản Creator (hiện chỉ có tài khoản seed).

---

## 4. Moderator

- [x] Hàng đợi kiểm duyệt: lọc trạng thái / loại mục, nhận xử lý, hạn xử lý (quá hạn), phân trang (F-10).
- [x] Duyệt truyện công khai của Creator: hồ sơ duyệt, checklist, so sánh phiên bản, gắn nhãn, duyệt / yêu cầu sửa / từ chối, trả về chỉ vì nhãn (F-10).
- [x] Duyệt truyện cộng đồng, vùng xám, báo cáo nội dung (chuyển lên Admin), yêu cầu gỡ của Creator (F-10).
- [x] Rà soát truyện và lộ trình đã công khai.
- [x] Tiêu chí vùng xám: Draft → kiểm tra → chấm thử → Active → Retired, có nhật ký (F-11).
- [x] Ví dụ của tiêu chí vùng xám: form thêm / sửa / xoá ví dụ (nội dung, mức 0–4, lý do), không còn gõ JSON ([RubricExamplesEditor.tsx](src/app/features/staff/RubricExamplesEditor.tsx)).
- [x] Thẻ ước: tạo, sửa, bật / tắt, gắn với truyện bằng tay hoặc AI gợi ý (F-11).
- [x] Hướng dẫn sáng tác: soạn nháp, xem trước, phát hành phiên bản mới (F-11).
- [x] Lộ trình mẫu: tạo, sửa, chọn truyện, gửi duyệt, rút, nhân bản, lưu trữ; duyệt lộ trình mẫu (F-12).
- [ ] **Thống kê hàng đợi và SLA** (F-19): số mục Pending / Claimed / quá hạn theo kỳ, quyết định theo kết quả và loại mục, số lần gửi lại, số vùng xám; không trả nội dung hay dữ liệu bé; gọi thống kê của Admin thì 403 — chưa có BE và FE. BE hiện chỉ có danh sách hàng đợi (`ModerationQueueController.cs`), chưa có thống kê.

---

## 5. Administrator

- [x] Tài khoản vận hành (mời, kích hoạt, khoá Moderator / Creator).
- [x] Danh mục nội dung.
- [x] Ca kiểm duyệt chuyển lên Admin; rà soát thư viện; tiêu chí, hướng dẫn, thẻ ước, lộ trình mẫu (xem).
- [x] **Thanh toán → Giao dịch** (F-04): mọi giao dịch, lọc trạng thái, tìm theo mã / email / tên, phân trang; "Xác nhận đã trả" cho mọi giao dịch chưa Paid (kể cả Hết hạn, Sai số tiền), gói được áp như webhook.
- [ ] **Một phần — Báo cáo nghiệp vụ** (F-15): tạo báo cáo theo kỳ, Compiling → Published, xem báo cáo mới nhất (FE nối tại `AdminSystem.tsx`). BE đã có doanh thu (`GET /BusinessReport/admin/revenue`) và báo cáo tài khoản (`GET /BusinessReport/admin/accounts`), FE chưa hiện hai số liệu này. Cần kiểm lại BE: số giao dịch theo trạng thái, doanh thu theo gói và loại gói, quỹ Creator, chặn kỳ chồng nhau.
- [ ] **Một phần — Báo cáo tài khoản người dùng** (F-16): tổng phụ huynh cuối kỳ, đăng ký mới, đang hoạt động, bị khoá, số hồ sơ bé. BE có `GET /BusinessReport/admin/accounts`; FE chưa có màn.
- [ ] **Một phần — Quản lý gói dịch vụ** (F-17, trang "Gói dịch vụ"): xem mọi gói, sửa tên / giá / lượt AI, bật tắt bán (gói cũ không bật lại được), nút Lưu chỉ hiện khi có thay đổi; đổi giá chỉ áp cho giao dịch mới; BE ghi nhật ký. Thiếu (BE): tạo gói mới, quyền lợi theo gói, cấu hình tỉ lệ quỹ Creator, hạn mức Creator và đối tác, thời gian đọc tối thiểu.
- [x] **Đối soát thanh toán – lượt** (F-18, trang "Thanh toán → Chờ áp gói"): job tìm giao dịch Paid chưa có chu kỳ / lô lượt, Admin bấm "Áp lại gói" (idempotent, không cộng hai lần, ngoại lệ đã xử lý không xử lý lại), có tab Đã xử lý.
- [x] **Lượt tạo truyện** (UC-L2-08, thay trang "Token Quota" cũ): xem gói và lượt của một tài khoản phụ huynh theo mã, cấp / trừ lượt kèm lý do bắt buộc (trừ có popup xác nhận), lịch sử điều chỉnh.

---

## 6. Hệ thống, SePay và AI

- [x] Tạo giao dịch mã `SEPAY…` kèm QR, Pending 15 phút, chốt giá và số lượt lúc tạo; giao dịch gói và giao dịch Add-on tính riêng, không tạo giao dịch Pending thứ hai cùng loại; chỉ role User mua được (F-03).
- [x] Webhook SePay có xác thực; khớp số tiền thì Paid, sai thì MismatchAmount; job hết hạn giao dịch Pending sau 15 phút; ghi nhật ký `PaymentCreditFailed` khi áp gói lỗi (F-04).
- [x] **Áp gói theo loại khi Paid** (F-04): Gói Đọc / Sáng tạo mở chu kỳ 1 tháng hoặc nối tiếp chu kỳ đang chạy, Gói Sáng tạo cấp 4 lượt mỗi chu kỳ, Add-on +2 lượt cho chu kỳ hiện tại; mỗi giao dịch chỉ áp một lần (webhook gửi lại hoặc mark-paid sau đó không cộng thêm).
- [x] Lượt AI là sổ lô lượt (`credit_lots`): lô gần hết hạn dùng trước; lượt dùng thử 1 lần cho phụ huynh có hồ sơ bé Active; hết lượt trả 409 (F-05).
- [ ] **Một phần — Lượt tạo truyện AI theo tài liệu 6** (F-05, BE ngoài phạm vi đợt 1). Thiếu:
  - Giữ lượt khi gửi, chỉ trừ khi AI viết xong nội dung / chuyển thể xong, hoàn lượt khi lỗi, bị chặn hoặc huỷ (hiện trừ ngay khi gửi yêu cầu).
  - Miễn phí trong một truyện: viết lại dàn ý 3 lần, viết lại nội dung 2 lần, tạo lại 3 tranh.
  - Tạo media cho truyện tự viết cũng tốn 1 lượt.
- [ ] **Một phần — Gói Creator** (F-03, F-04, F-05): BE đã có gói Creator (cấp lượt khi Paid, `SubscriptionService.cs`), hạn mức tháng của Creator, trừ / hoàn lượt gửi duyệt. FE chưa có màn mua gói Creator và màn lượt Creator. Hạn mức đối tác (6 + 10) BE ghi là hoãn, cần xác nhận.
- [x] Sinh dàn ý, nội dung, học liệu, tranh, giọng đọc bằng worker; thử lại khi lỗi tạm thời; vùng xám chuyển Moderator (F-06, F-09).

---

## 7. Việc kỹ thuật còn lại

- [ ] Endpoint BE đã có nhưng FE chưa nối: `GET /BusinessReport/admin/revenue`, `/admin/accounts`, `/admin`, `/admin/{reportId}`; `GET /CreatorStatistics/reading`, `/revenue`; `GET /TokenQuota/creator/me`; `GET /Payment/mismatched`. Audit (`scripts/audit-core-api.mjs`) báo sai 7 endpoint đã nối qua hàm bọc (`CommunitySubmission` ×5 qua `guardianService.ts`, `parent/.../assets/...` qua `parentPackageService.ts`, `child/manual-stories/.../assets/...` qua `useAuthedMediaUrl.ts`); cần sửa audit để nhận diện hàm bọc.
- [ ] Endpoint đã có hàm nhưng chưa màn nào gọi: `GET /ChildProfile/{id}`, `POST /Story`, `PATCH /Story/{id}/publish`, các endpoint duyệt cũ trong `ReviewController` (`review/*/complete`, `review/validation`, `review/approve`, `generation/confirm-content`, `PUT review/listening/{id}`). Xác nhận còn dùng không rồi nối hoặc bỏ.
- [ ] Trang giới thiệu hiển thị truyện đã phát hành — chờ API công khai (thư viện cộng đồng đang cần token).
- [ ] Ảnh bìa truyện cộng đồng — chờ DTO trả ảnh bìa.
- [ ] API lựa chọn cho form lộ trình mẫu (độ tuổi, khoảng mức đọc, số ngày) — đề xuất BE thêm `GET /RoadmapTemplate/options`; FE đang để cố định cho khớp.
- [ ] **Lỗi 500 ở hướng dẫn sáng tác** (`GET /authoring-guides`, ghi nhận 10/11): cùng lỗi .NET 10 `.Contains` trên mảng trong truy vấn EF như lỗi Lịch sử hoạt động, tại `AuthoringGuideItemStore.cs` dòng 15 (Backend). Trang Tự viết vẫn chạy nhưng không hiện gợi ý hướng dẫn.
- [ ] Lỗi AI phía BE (ghi nhận 09/11): "Nhận xét bản thảo" trả `AI_OUTPUT_INVALID` với bài dài; kiểm tra nội dung của phụ huynh luôn báo `SEMANTIC_SAFETY_REVIEW_REQUIRED` khi có ngưỡng an toàn; Vertex thỉnh thoảng 429 / hết thời gian.
- [ ] BE không thống nhất định dạng âm thanh: API ghi âm nhận webm / ogg / mp4 nhưng kho media chỉ lưu WAV / MP3 (FE đang đổi sang WAV trước khi gửi).
- [ ] Bé tự sáng tác truyện (`ChildCreationEnabled` / `ChildCreationMode` trong Safety Policy) — BE chưa có logic dùng, FE chưa có công tắc; chờ chốt.
- [ ] Yêu cầu phi chức năng của tài liệu 6 (mục 4): test phân quyền giữa các tài khoản, idempotency thanh toán / lượt (20 request lặp), chịu lỗi AI, khớp số liệu báo cáo; ≥ 50% test chạy trong CI.

## 8. Đã chốt (không làm)

- Ngoài phạm vi (tài liệu 6 mục 5): đa ngôn ngữ, nhân bản giọng nói, đọc offline, chi trả / thuế / hoàn tiền cho Creator.
- Đã bỏ: truyện rẽ nhánh, Hỏi nhân vật, câu thảo luận, Additional Supervisor và bộ 7 quyền, Assignment/Teacher, Hold Mode, dashboard và báo cáo tuần của phụ huynh, gợi ý học thích ứng, can thiệp O2O.
- Cài đặt an toàn tự lưu; bỏ thao tác "Lưu trữ truyện" của phụ huynh; trang giới thiệu không dùng dữ liệu mẫu.

Lịch sử các việc đã làm trước 10/11 xem trong git log và bản TASKS.md cũ (`git show 10ec335:TASKS.md`).
