# Chức năng theo vai trò — đã làm / chưa làm

Cập nhật: 14/11/2026 — đối chiếu Backend `4fb6afa`, Frontend `2065533`. Bản tổng hợp BE/FE: [TASK.md](../TASK.md). Các trạng thái cũ bên dưới là lịch sử triển khai, không phải kết quả kiểm thử lại ngày 14/11.

### Đối chiếu code ngày 14/11

- [x] QR EasyLogin: BE trả lại secret đang hoạt động nếu giải mã được bản bảo vệ; FE `AccessTab.tsx` đọc `cred.secret`, hiện lại mã và tải PNG (`qrImage.ts`). Đã có luồng bé quét QR trên web; chưa thử camera thiết bị thật trong lần rà soát này.
- [x] BE có đánh giá truyện Creator (1–5 sao, nhận xét, báo cáo; Moderator duyệt/ẩn).
- [ ] FE chưa nối 8 endpoint đánh giá: xem/tạo/sửa/xoá/báo cáo của phụ huynh, Creator xem/báo cáo, Moderator xem/duyệt/ẩn. Đây là phần mới chưa nằm trong các trạng thái hoàn tất F-10 bên dưới.
- [ ] F-05 vẫn thiếu giữ/hoàn lượt AI: `ITokenQuotaService` chưa có hợp đồng này; `AIStoryInputService` vẫn gọi trừ khi nhận yêu cầu. Hoàn lượt gửi duyệt Creator không phải hoàn lượt AI.
- Audit mới: **373 endpoint, 347 CONNECTED_SOURCE, 2 webhook/alias, 24 MISSING hoặc SERVICE_ONLY; frontendOnly = 0**. Chạy `node scripts/audit-core-api.mjs`; chi tiết tại `src/out/core-api-audit.json`. 24 mục gồm 8 API đánh giá mới và 16 mục cần phân loại tiếp (hàm bọc, service dư, route cũ hoặc luồng duyệt chưa nối). Số liệu 364 endpoint bên dưới là lịch sử, đã được thay thế bởi kết quả này.
- Chỉ xác minh bằng đọc code và audit tĩnh; chưa build/test/E2E hoặc xác nhận lại các lỗi runtime trước đây.

Căn cứ:

- **Tài liệu 6 (ưu tiên)**: `SEP420_R2_BM04_Commitment` — bản cam kết sau Review 2, gồm 22 chức năng bắt buộc F-01 → F-22. Đây là phạm vi chấm ở Defense 1.1 và Viva; sau Review 2 phạm vi không đổi.
- Tài liệu Luồng 1–5 (link trong `CLAUDE.md` ở thư mục gốc dự án).
- Code ngày 12/11: Backend `main` = `origin/main` (commit cac1271, gồm PR #134 fix media bé, #135 quyền lợi / cài đặt gói, #138 thống kê Moderator và Creator). Frontend `src/docs/core-api-coverage.json` (364 endpoint): 342 đã nối, 12 có hàm nhưng không màn nào gọi (SERVICE_ONLY), 8 MISSING, 1 webhook SePay (server-to-server), 1 alias. Đối chiếu từng dòng (mục 7): 3 nhóm endpoint FE còn thiếu (`reading-slots` F-03, `POST admin/plans` và `GET/PUT admin/settings` F-17) **đã gắn xong 12/11**; audit chạy lại: 346/364 đã nối.

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
| F-03 | Gói dịch vụ và thanh toán QR SePay | Phụ huynh, Creator | Tuấn | **Đã làm** — phụ huynh và Gói Creator (BE + FE) xong; BE chặn quyền lợi theo gói; FE có banner + popup chọn bé được đọc khi vượt số chỗ (`reading-slots`, 12/11) |
| F-04 | Xác nhận thanh toán, hết hạn | SePay, Hệ thống, Admin | Tuấn | Đã làm |
| F-05 | Lượt tạo truyện AI: kiểm tra, trừ, lịch sử | Phụ huynh, Creator | Tuấn | **Một phần** — xem lượt, lịch sử và lượt Creator (BE + FE) xong; còn giữ/hoàn lượt AI, miễn phí tạo lại (BE). **Chờ Backend** (ghi chú 12/11): FE chưa cần làm thêm cho tới khi BE có API giữ/hoàn lượt |
| F-06 | Tạo truyện bằng AI và duyệt nội dung | Phụ huynh, Creator | Minh | Đã làm |
| F-07 | Tự viết và nhập truyện có sẵn | Phụ huynh, Creator | Minh | Đã làm |
| F-08 | Điều ước của bé và phụ huynh đáp lại | Bé, Phụ huynh | Minh | Đã làm |
| F-09 | Tranh, giọng đọc và xác nhận gói media | Phụ huynh, Creator | Minh | Đã làm |
| F-10 | Gửi truyện công khai và kiểm duyệt | Phụ huynh, Creator, Moderator | Minh | Đã làm |
| F-11 | Cấu hình kiểm duyệt: tiêu chí, thẻ ước, hướng dẫn sáng tác | Moderator | Duy | Đã làm |
| F-12 | Lộ trình đọc và thư viện lộ trình mẫu | Phụ huynh, Moderator, Bé | Duy | Đã làm |
| F-13 | Phiên đọc: TTS, tương tác khi nghe, luyện đọc to | Bé | Duy | Đã làm |
| F-14 | Quiz, EXP, huy hiệu, cây tri thức, sổ tay | Bé | Duy | Đã làm |
| F-15 | Thống kê doanh thu | Admin | Tuấn | Đã làm |
| F-16 | Báo cáo tài khoản người dùng | Admin | Tuấn | Đã làm |
| F-17 | Quản lý gói dịch vụ | Admin | Tuấn | **Đã làm** — sửa / bật tắt gói; tạo gói mới và cài đặt gói (quỹ Creator, hạn mức Creator/đối tác, gói Miễn phí, thời gian đọc tối thiểu, lượt dùng thử) xong BE + FE (12/11) |
| F-18 | Đối soát thanh toán – lượt | Admin | Khánh | Đã làm |
| F-19 | Thống kê hàng đợi kiểm duyệt và SLA | Moderator | Khánh | Đã làm |
| F-20 | Doanh thu của Creator | Creator | Tuấn | Đã làm |
| F-21 | Thống kê lượt đọc của Creator | Creator | Tuấn | Đã làm |
| F-22 | Thống kê nội dung của Creator | Creator | Khánh | Đã làm |

**Đã làm 21/22 · Một phần 1/22 · Chưa làm 0/22** (cập nhật 12/11). F-19 (trang "Thống kê" của Moderator) và F-22 (tab "Nội dung" trong Thống kê Creator) xong BE + FE. F-03 (chọn bé được đọc) và F-17 (tạo gói, cài đặt gói) xong FE ngày 12/11. Một phần: F-05 (còn giữ/hoàn lượt AI, miễn phí tạo lại — **chờ Backend**). Thống kê F-15, F-16, F-19 → F-22 đã nối đủ BE và FE; gói Creator đã có màn mua và xem lượt. Phần còn thiếu dồn ở **lượt AI** (BE).

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
- [x] **Quyền lợi theo gói** (F-03): Free chỉ 1 hồ sơ bé, 3 truyện mới của thư viện công khai mỗi tuần, không sao chép lộ trình mẫu; Gói Đọc / Sáng tạo tối đa 4 hồ sơ bé. BE đã chặn (`PlanBenefitService`, `main` cac1271). FE (12/11): khi số hồ sơ Active vượt số chỗ, trang Hồ sơ bé hiện banner vàng + nút "Chọn bé được đọc" mở popup ([ReadingSlotsDialog.tsx](src/app/features/children/ReadingSlotsDialog.tsx)): tích chọn tối đa N bé, khoá khi chưa tới lần đổi tiếp (1 lần/tuần, hiện giờ đổi lại), Lưu chỉ hiện khi đổi, xác nhận trước khi lưu; bé chỉ xem có nhãn "Chỉ xem" kèm khoá (`GET/PUT /ChildProfile/reading-slots`).
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

- [x] Xem thư viện cộng đồng (`GET /Story/community`): kệ "Đọc nhiều nhất" và "Được yêu thích" (`orderBy=views|favorites`, 13/11), bìa truyện Creator có lượt xem / yêu thích ([StoryStatsBadge.tsx](src/app/components/StoryStatsBadge.tsx)). Phụ huynh không còn gửi truyện lên cộng đồng (BE gỡ `CommunitySubmission` 11/11; FE gỡ hàm gọi 13/11).
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
- [x] Kệ "Khám phá truyện cộng đồng" ở trang chủ bé **đã gỡ** (13/11): BE xoá `/CommunityLibrary`, API mới `/Story/community` không cho phiên bé. Bé đọc truyện Creator qua lộ trình phụ huynh thêm.
- [ ] **Một phần — Tranh / âm thanh của truyện gia đình tự soạn** (`GET /child/manual-stories/{confirmationId}/assets/{assetId}`): FE tải file kèm token phiên của bé rồi hiện bằng blob URL (`src/app/lib/useAuthedMediaUrl.ts`, dùng ở tranh cảnh, giọng đọc và xem trước truyện gia đình). BE fix signer bỏ qua URL /api/ (commit 7ecf5fe, `ChildMediaUrlSigner.cs`) đã có trong `main` (cac1271); còn kiểm tra thực tế rồi chuyển thành `[x]`.

---

## 3. Content Creator

- [x] Tạo truyện bằng AI (F-06) và tự viết (F-07): soạn, nhập, lưu phiên bản, trợ lý AI, tự kiểm tra nội dung (An toàn / Vùng xám / Bị chặn), xác nhận nội dung, tranh và giọng đọc, xác nhận gói (F-09).
- [x] Gửi duyệt công khai: chọn ảnh bìa và nhãn nội dung, rút yêu cầu, gửi lại khi chỉ bị trả về vì nhãn, tạo bản chỉnh sửa, yêu cầu gỡ truyện đã công khai (F-10).
- [x] Thư viện truyện mẫu, Truyện của tôi (thẻ truyện đã công khai có lượt xem / yêu thích từ `GET /creator/stories/published`, 13/11).
- [x] **Media từng đoạn của Creator**: bước "Kiểm tra và chốt" chọn "AI tạo hết" hoặc "Tự chọn từng phần"; ở bước Tranh và giọng đọc, mỗi tranh / đoạn đang chờ có nút Tải lên (khai báo nguồn và quyền, ảnh JPEG/PNG/WebP ≤ 10 MB, âm thanh MP3/WAV ≤ 25 MB) và AI tạo. Đã thử thật (truyện #919).
- [x] **Mua gói Creator, xem lượt tạo truyện và lượt gửi duyệt** (F-03, F-04, F-05): BE có gói Creator 99.000 đ (+6 lượt AI, +20 lượt gửi), hạn mức tháng (2 lượt AI + 5 lượt gửi), trừ / hoàn lượt gửi duyệt (`TokenQuotaService.Creator.cs`); FE có màn mua và xem lượt ([PaymentSection.tsx](src/app/features/account/PaymentSection.tsx) audience creator, [CreatorQuotaPanel.tsx](src/app/features/account/CreatorQuotaPanel.tsx), `GET /TokenQuota/creator/me`), chip lượt ở Viết bằng AI và nút gửi duyệt. Hạn mức đối tác (6 + 10) BE ghi là hoãn, cần xác nhận.
- [x] **Doanh thu ước tính** (F-20): quỹ Creator theo tháng (30% Gói Đọc + 10% Gói Sáng tạo), chia theo lượt đọc hợp lệ. BE `GET /CreatorStatistics/revenue`; FE [CreatorIncomeTab.tsx](src/app/features/staff/CreatorIncomeTab.tsx) trong [CreatorStatistics.tsx](src/app/features/staff/CreatorStatistics.tsx) (nút "Thống kê").
- [x] **Thống kê lượt đọc** (F-21): lượt xem, yêu thích, đọc xong, lượt đọc hợp lệ, tỉ lệ hoàn thành theo truyện và theo kỳ. BE `GET /CreatorStatistics/reading`; FE [CreatorReadingTab.tsx](src/app/features/staff/CreatorReadingTab.tsx).
- [x] **Thống kê nội dung** (F-22): số truyện theo trạng thái, kết quả gửi duyệt trong kỳ, lượt còn lại, hạng Creator / đối tác và tiến độ 90 ngày. BE `GET /CreatorStatistics/content` (chỉ hiện tiến độ đối tác, chưa nâng hạng); FE [CreatorContentTab.tsx](src/app/features/staff/CreatorContentTab.tsx).
- [ ] Creator tự đăng ký — chưa chốt cách tạo tài khoản Creator (hiện chỉ có tài khoản seed).

---

## 4. Moderator

- [x] Hàng đợi kiểm duyệt: lọc trạng thái / loại mục, nhận xử lý, hạn xử lý (quá hạn), phân trang (F-10).
- [x] Duyệt truyện công khai của Creator: hồ sơ duyệt, checklist, so sánh phiên bản, gắn nhãn, duyệt / yêu cầu sửa / từ chối, trả về chỉ vì nhãn (F-10).
- [x] Duyệt vùng xám, báo cáo nội dung, yêu cầu gỡ của Creator (F-10). Report chỉ Moderator xử lý (bỏ escalate lên Admin, 13/11); chi tiết report hiện người yêu cầu rà soát / tác giả Creator khi BE trả; hàng đợi hiện tên Creator ở mục xin gỡ.
- [x] Rà soát truyện và lộ trình đã công khai.
- [x] Tiêu chí vùng xám: Draft → kiểm tra → chấm thử → Active → Retired, có nhật ký (F-11).
- [x] Ví dụ của tiêu chí vùng xám: form thêm / sửa / xoá ví dụ (nội dung, mức 0–4, lý do), không còn gõ JSON ([RubricExamplesEditor.tsx](src/app/features/staff/RubricExamplesEditor.tsx)).
- [x] Thẻ ước: tạo, sửa, bật / tắt, gắn với truyện bằng tay hoặc AI gợi ý (F-11). Banner vàng khi truyện thiếu thẻ Nhân vật / Nơi chốn (`GET .../wish-cards/coverage`, tải lại sau mỗi lần gắn / gỡ / AI gợi ý, 13/11).
- [x] Hướng dẫn sáng tác: soạn nháp, xem trước, phát hành phiên bản mới (F-11).
- [x] Lộ trình mẫu: tạo, sửa, chọn truyện, gửi duyệt, rút, nhân bản, lưu trữ; duyệt lộ trình mẫu (F-12).
- [x] **Thống kê hàng đợi và SLA** (F-19): số mục Pending / Claimed / quá hạn theo kỳ, quyết định theo kết quả và loại mục, số lần gửi lại, số vùng xám; không trả nội dung hay dữ liệu bé; gọi thống kê của Admin thì 403. BE `GET /ModerationQueue/statistics` (chỉ Moderator); FE mục "Thống kê" trên menu Moderator, [ModeratorStatistics.tsx](src/app/features/staff/ModeratorStatistics.tsx).

---

## 5. Administrator

- [x] Tài khoản vận hành (mời, kích hoạt, khoá Moderator / Creator).
- [x] Danh mục nội dung.
- [x] Rà soát thư viện; tiêu chí, hướng dẫn, thẻ ước, lộ trình mẫu (xem). Admin không xử lý report nội dung (BE 403, 13/11): đã gỡ menu "ca chuyển lên" và nút nhận mục ContentReport.
- [x] **Thanh toán → Giao dịch** (F-04): mọi giao dịch, lọc trạng thái, tìm theo mã / email / tên, phân trang; "Xác nhận đã trả" cho mọi giao dịch chưa Paid (kể cả Hết hạn, Sai số tiền), gói được áp như webhook.
- [x] **Báo cáo nghiệp vụ** (F-15, [AdminBusinessReport.tsx](src/app/features/staff/AdminBusinessReport.tsx), [AdminRevenueTab.tsx](src/app/features/staff/AdminRevenueTab.tsx)): tạo báo cáo theo kỳ (BE chặn kỳ trùng / chồng lên báo cáo đã có), Compiling → Published, xem báo cáo mới nhất; hiện doanh thu, quỹ Creator, số giao dịch theo trạng thái, doanh thu theo gói và theo loại gói. BE `GET /BusinessReport/admin/revenue`.
- [x] **Báo cáo tài khoản người dùng** (F-16, [AdminAccountsTab.tsx](src/app/features/staff/AdminAccountsTab.tsx)): tổng phụ huynh cuối kỳ, đăng ký mới, đang hoạt động, bị khoá, số hồ sơ bé. BE `GET /BusinessReport/admin/accounts`.
- [x] **Quản lý gói dịch vụ** (F-17, xong FE 12/11: nút icon "Tạo gói" → [CreatePlanDialog.tsx](src/app/features/staff/CreatePlanDialog.tsx), nút icon "Cài đặt gói" → [PlanSettingsDialog.tsx](src/app/features/staff/PlanSettingsDialog.tsx) chia 5 khối, khối con ở `features/staff/plan-settings/`; trang "Gói dịch vụ"): xem mọi gói, sửa tên / giá / lượt AI, bật tắt bán (gói cũ không bật lại được), nút Lưu chỉ hiện khi có thay đổi; đổi giá chỉ áp cho giao dịch mới; BE ghi nhật ký. BE đã có (`main` cac1271): tạo gói (`POST /Payment/admin/plans`), quyền lợi theo gói, cài đặt (`GET/PUT /Payment/admin/settings`: tỉ lệ quỹ Creator, hạn mức Creator và đối tác, thời gian đọc tối thiểu). FE đã gắn `createPlan`, `settings`, `updateSettings` trong `adminPaymentService`.
- [x] **Đối soát thanh toán – lượt** (F-18, trang "Thanh toán → Chờ áp gói"): job tìm giao dịch Paid chưa có chu kỳ / lô lượt, Admin bấm "Áp lại gói" (idempotent, không cộng hai lần, ngoại lệ đã xử lý không xử lý lại), có tab Đã xử lý.
- [x] **Lượt tạo truyện** (UC-L2-08, thay trang "Token Quota" cũ): xem gói và lượt của một tài khoản phụ huynh theo mã, cấp / trừ lượt kèm lý do bắt buộc (trừ có popup xác nhận), lịch sử điều chỉnh.

---

## 6. Hệ thống, SePay và AI

- [x] Tạo giao dịch mã `SEPAY…` kèm QR, Pending 15 phút, chốt giá và số lượt lúc tạo; giao dịch gói và giao dịch Add-on tính riêng, không tạo giao dịch Pending thứ hai cùng loại; chỉ role User mua được (F-03).
- [x] Webhook SePay có xác thực; khớp số tiền thì Paid, sai thì MismatchAmount; job hết hạn giao dịch Pending sau 15 phút; ghi nhật ký `PaymentCreditFailed` khi áp gói lỗi (F-04).
- [x] **Áp gói theo loại khi Paid** (F-04): Gói Đọc / Sáng tạo mở chu kỳ 1 tháng hoặc nối tiếp chu kỳ đang chạy, Gói Sáng tạo cấp 4 lượt mỗi chu kỳ, Add-on +2 lượt cho chu kỳ hiện tại; mỗi giao dịch chỉ áp một lần (webhook gửi lại hoặc mark-paid sau đó không cộng thêm).
- [x] Lượt AI là sổ lô lượt (`credit_lots`): lô gần hết hạn dùng trước; lượt dùng thử 1 lần cho phụ huynh có hồ sơ bé Active; hết lượt trả 409 (F-05).
- [ ] **Một phần — Lượt tạo truyện AI theo tài liệu 6** (F-05, BE ngoài phạm vi đợt 1). **Chờ Backend** (ghi chú 12/11): `TokenQuotaService` chưa có Hold/Release. Khi BE xong, FE cần hiện trạng thái lượt trong Studio (đang giữ / đã trừ / đã hoàn) và số lần làm lại miễn phí còn lại. Thiếu:
  - Giữ lượt khi gửi, chỉ trừ khi AI viết xong nội dung / chuyển thể xong, hoàn lượt khi lỗi, bị chặn hoặc huỷ (hiện trừ ngay khi gửi yêu cầu).
  - Miễn phí trong một truyện: viết lại dàn ý 3 lần, viết lại nội dung 2 lần, tạo lại 3 tranh.
  - Tạo media cho truyện tự viết cũng tốn 1 lượt.
- [x] **Gói Creator** (F-03, F-04, F-05): BE cấp lượt khi Paid (`SubscriptionService.cs`), hạn mức tháng của Creator, trừ / hoàn lượt gửi duyệt; FE có màn mua và màn lượt (mục 3). Hạn mức đối tác (6 + 10) BE ghi là hoãn, cần xác nhận.
- [x] Sinh dàn ý, nội dung, học liệu, tranh, giọng đọc bằng worker; thử lại khi lỗi tạm thời; vùng xám chuyển Moderator (F-06, F-09).

---

## 7. Việc kỹ thuật còn lại

**Kết quả kiểm tra lại 14/11/2026:** danh sách cũ bên dưới chưa hoàn toàn chính xác. Các đính chính sau được ưu tiên khi đọc các ghi nhận lịch sử:

| Mục | Kết luận theo code hiện tại | Việc thực sự còn lại |
| --- | --- | --- |
| Endpoint chưa nối | Không thể đánh dấu hoàn tất toàn bộ: có 8 API StoryRating/StoryRatingModeration mới chưa có FE | Nối đánh giá cho phụ huynh, Creator và Moderator; sửa audit nhận hàm bọc |
| Service/duyệt chưa gọi | Còn đúng: `getChildProfileById`, `completeReview`, `completeStoryReview`, `validateReview`, `updateListeningInteraction` chưa có caller từ màn hình; `validation` chỉ được reset null | Chốt luồng rồi nối hoặc bỏ; không suy rằng mọi API không gọi đều làm hỏng luồng chính |
| API Story cũ | Cần phân biệt service dư và route đang dùng: `storyService.updateStoryInfo` vẫn gọi `PUT /Story/{id}` để sửa metadata | Có thể dọn hàm trùng trong `storyManagementService`, không xoá route cập nhật BE theo nhận định cũ |
| Trang giới thiệu có truyện thật | API cộng đồng vẫn cần role đăng nhập | Là đề xuất thêm chức năng/API anonymous, không phải lỗi hiện tại |
| Ảnh bìa cộng đồng | **Mục cũ sai:** `CommunityStoryDto` kế thừa `StoryDto.CoverImageUrl`; `StoryService.Fill` gán bìa; FE `storyView.toCard` dùng bìa | Không chờ DTO nữa; chỉ kiểm tra dữ liệu và URL thực tế nếu ảnh lỗi |
| Khoá thư viện bé | Còn lệch hợp đồng: `ChildStoryPageDto` thiếu IsLocked/UnlockStoryId mà FE đọc | Chốt nghiệp vụ để thêm BE hoặc bỏ nhánh FE; không tự quy toàn bộ cho BE |
| Khôi phục và đồng ý điều khoản | BE nhận request, FE restore không gửi acceptCurrentConsent | **Sửa FE**, thêm bước đồng ý khi cần; không phải chờ BE |
| Admin clone/archive lộ trình | BE chỉ cho Moderator; FE `RoadmapPublishedView` đã bọc nút bằng isModerator, workspace soạn cũng có kiểm tra role | Không coi 403 khi Admin gọi trực tiếp là lỗi; chỉ đổi nếu nghiệp vụ yêu cầu |
| Mã lỗi 319/325 | **Chưa có căn cứ hiện tại cho con số này.** `issueText.ts` ở features/authoring chỉ dịch một nhóm mã bản thảo, không đại diện mọi xử lý lỗi FE | Rà mã thực sự tới UI cùng các lớp xử lý lỗi khác rồi đo lại |
| LibraryWorkspace | Đúng: hiện 554 dòng | Việc bảo trì, không phải thiếu chức năng |
| API options lộ trình | Chưa có; FE khai báo nhóm tuổi và giá trị mặc định | Đề xuất giảm hardcode, không tự coi là yêu cầu bắt buộc |
| Hướng dẫn sáng tác 500 | Còn truy vấn ids.Contains trong AuthoringGuideItemStore; **không đủ chứng minh API hiện vẫn 500 hoặc do .NET 10** | Gộp hai ghi nhận cũ; tái hiện với database/provider thật và log/SQL |
| Lỗi AI | Là ghi nhận 09/11, chưa tái hiện lại | Không khẳng định “luôn lỗi”; cần đầu vào/cấu hình/log để phân biệt lỗi và guardrail |
| MIME âm thanh | Có lệch tập MIME nhưng câu “storage chỉ WAV/MP3” sai: SupabaseMediaStorage nhận cả audio/ogg | ChildStorySummaryService dùng ReadAloudPolicy rộng hơn storage; thử webm/mp4 khi lưu kể lại. Luyện đọc to gửi nhận dạng là luồng khác |
| Bé tự sáng tác | Các trường được lưu/đọc ở SafetyPolicy; chưa thấy luồng sáng tác bé sử dụng, FE chưa có công tắc | Cần chốt phạm vi trước khi triển khai |
| Test và CI | **Đã có** dotnet-ci.yml chạy build/test solution trên PR; có test phân quyền, quota, thanh toán, đối soát, subscription idempotency | Còn chứng minh nghiệm thu 20 request lặp/đồng thời, chéo tài khoản E2E, chịu lỗi AI, khớp báo cáo và tỷ lệ test theo tài liệu 6 |

Các mục sửa hợp đồng/loại discussionQuestions đã được ghi nhận trước đây; chưa kiểm thử runtime lại trong lần rà soát này. Sửa tay tương tác khi nghe chưa nối `updateListeningInteraction`, nên cần điều chỉnh cả nhận định “sửa tay” đã hoàn tất ở mục chức năng nếu bao gồm loại học liệu này.

**Danh sách dưới đây giữ làm lịch sử 10–13/11; các phát biểu mâu thuẫn với bảng trên đã lỗi thời.**

- [x] Endpoint BE có mà FE chưa gắn (đối chiếu 12/11). **Đã gắn 12/11**: `GET/PUT /ChildProfile/reading-slots` (F-03), `POST /Payment/admin/plans` và `GET/PUT /Payment/admin/settings` (F-17; audit vẫn báo `GET admin/settings` thiếu vì lệnh gọi xuống dòng, thực tế có gọi ở `PlanSettingsDialog.tsx`). **Không cần gắn**: `GET /Payment/mismatched` (Admin lọc giao dịch theo "Sai số tiền" ở trang Giao dịch, `AdminSystem.tsx`; xử lý bằng "Xác nhận đã trả"); `GET /child/manual-stories/.../assets/...` và `GET /parent/stories/.../assets/...` (đã nối qua `useAuthedMediaUrl.ts` và `parentPackageService.asset`, audit không nhận hàm bọc); `GET /ModerationQueue/statistics` và `GET /CreatorStatistics/content` (đã có `ModeratorStatistics.tsx` và `CreatorContentTab.tsx`, audit báo SERVICE_ONLY sai); `POST /Story`, `PUT /Story/{id}`, `PATCH /Story/{id}/publish` (API cũ, chỉ còn hàm `storyManagementService.ts` không ai gọi: xoá hàm, không gắn lại). Cần sửa `scripts/audit-core-api.mjs` để nhận diện hàm bọc và các hàm gọi qua service.
- [ ] Hàm đã có nhưng không màn nào gọi (cần quyết định nối hoặc bỏ): `GET /ChildProfile/{id}` (`childProfileService.getChildProfileById`, dư). Duyệt: Parent và Creator đang dùng `review/confirm-package` (BE cho cả ContentCreator), còn `review/approve`, `creator/.../generation/confirm-content` (BE: Creator xác nhận nội dung trước khi tạo media, DS-03b) và `review/*/complete` (`completeReview`, `completeStoryReview`) chưa có ai gọi; cần chốt một luồng Creator rồi bỏ hàm thừa. `GET review/validation`: state `validation` trong `useStoryReview.ts` không bao giờ được nạp, kiểm tra nội dung đang lấy từ đâu cần xác minh. `PUT review/listening/{id}` (`updateListeningInteraction`): không màn nào gọi, nên mục "sửa tay tương tác khi nghe" (mục 1, F-06/F-07) cần kiểm tra lại.
- [ ] Trang giới thiệu hiển thị truyện đã phát hành — chờ API công khai (thư viện cộng đồng đang cần token).
- [ ] Ảnh bìa truyện cộng đồng — chờ DTO trả ảnh bìa.
- [x] Rà hợp đồng API BE ↔ FE (13/11), đã sửa: xoá tài khoản (preview `childProfiles`, gửi `deleteChildProfiles`, tick xác nhận khi còn hồ sơ bé); placeholder hướng dẫn sáng tác dạng `{key,label,hint}` (form Moderator/Admin có ô Nhãn bắt buộc, xem trước và màn phụ huynh đọc theo key); gỡ luồng `CommunityReview` / `CommunitySubmission` không còn ở BE; xoá hàm `labels` không dùng; `audit-core-api.mjs` kiểm thêm chiều FE → BE (`frontendOnly`, ghi `out/core-api-frontend-only.json`).
- [ ] **Chờ Backend** (ghi nhận 13/11): thư viện đọc của bé đọc `isLocked` / `unlockStoryId` mà `GET /child/reading/stories` không trả (phần khoá truyện không hiện); `PATCH /ChildProfile/{id}/restore` nhận `acceptCurrentConsent` nhưng FE chưa gửi (khôi phục khi điều khoản đổi); `RoadmapTemplate` clone / archive chỉ cho Moderator (Admin 403). Form placeholder hướng dẫn sáng tác chưa kiểm tra UI được vì `GET /moderation/authoring-guides` vẫn 500 (lỗi `.Contains` ở `AuthoringGuideItemStore.cs:15`, xem dưới).
- [ ] Mã lỗi BE chưa dịch: ~319/325 mã `throw new ...Exception("MÃ")` chưa có trong `issueText.ts` — việc riêng.
- [ ] Tách [LibraryWorkspace.tsx](src/app/features/library/LibraryWorkspace.tsx) (~554 dòng, quy ước ~250) theo vùng giao diện — việc riêng (13/11).
- [x] Panel report crash khi BE không còn `discussionQuestions` (BE thay bằng listening từ commit 7874b1b0): đã gỡ khối câu hỏi thảo luận ở report, chặn null ở panel cộng đồng (13/11).
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
