# Việc cần làm — Frontend

Cập nhật: 09/11/2026. Chỉ tính phần Frontend (`src/`); không sửa Backend.

Căn cứ:
- 5 tài liệu Luồng 1–5 (link trong `CLAUDE.md` ở thư mục gốc dự án).
- Quy tắc thiết kế trong `CLAUDE.md`.
- Kết quả chạy `node scripts/audit-core-api.mjs` ngày 09/11: Backend hiện **354** endpoint, 314 đã nối, 2 loại trừ, **38** còn thiếu (17 `SERVICE_ONLY`, 21 `MISSING`; cập nhật 09/11 sau khi nối dán văn bản và giao máy kèm truyện). "Còn thiếu" gồm cả endpoint chưa có hàm service và endpoint có hàm service nhưng chưa màn nào gọi (`SERVICE_ONLY`).

Ký hiệu: `[ ]` chưa làm · `[x]` đã làm. Ưu tiên: **P1** làm trước · **P2** làm sau · **P3** dọn dẹp.

---

## 1. Tương tác của trẻ khi đọc (Luồng 4b, 4c) — P1

Đã làm 6/7 mục. Còn lại luyện đọc to (bị chặn bởi Backend).

- [x] **Tương tác khi nghe** — `POST /child/reading/sessions/{sessionId}/interactions/{interactionId}/attempts`
  - 5 loại: Checkpoint, RolePlay, FillBlank, EventOrdering, PicturePrediction ([KidInteraction.tsx](src/app/features/kid/KidInteraction.tsx)).
  - Hiện khi bé nghe hết cảnh (hoặc khi bé sang cảnh khác / bấm "Em đã đọc xong" mà cảnh còn tương tác chưa trả lời). Bé có thể "Để sau". Không hiện khi bật "Chỉ nghe" hoặc cảnh đã trả lời (`attemptedInSession`).
  - Câu điền chữ tối đa 100 ký tự. Phản hồi không có chữ "sai"; EventOrdering chưa khớp thì mời nghe lại cảnh hoặc xếp lại, từ lần sai thứ 3 hiện thứ tự đúng.
  - Chưa làm: với PicturePrediction, backend muốn nghe hết cảnh `revealSceneIndex` rồi mới phát phản hồi; hiện phản hồi hiện ngay sau khi chọn hình.
- [x] **Chế độ chỉ nghe** — `PUT /child/reading/sessions/{sessionId}/listen-only` (nút "Chỉ nghe" trên đầu màn đọc).
- [x] **Tưới cây tri thức** — `POST /child/rewards/knowledge-tree/water` (nút "Tưới cây" ở [KidRewards.tsx](src/app/features/kid/KidRewards.tsx), hiện giai đoạn cây, EXP chưa tưới và số cây đã ra hoa).
- [x] **Ghi âm tóm tắt cuối truyện** — `POST /child/reading/sessions/{sessionId}/summary/recording` ([KidSummary.tsx](src/app/features/kid/KidSummary.tsx), [useRecorder.ts](src/app/features/kid/useRecorder.ts))
  - Tối đa 3 MB mỗi bản (tự dừng khi gần chạm giới hạn hoặc sau 120 giây); cần quyền micro (`MediaRecorder`); nghe lại trước khi gửi.
- [x] **Đánh dấu chỗ còn thắc mắc** — `POST /child/reading/sessions/{sessionId}/summary/flags` (chọn tối đa 5 cảnh, cùng [KidSummary.tsx](src/app/features/kid/KidSummary.tsx)).
- [x] **Phụ huynh nghe lại và xoá tóm tắt** (Luồng 4c) — `GET /ParentStorySummary/{childProfileId}`, `DELETE /ParentStorySummary/{childProfileId}/{summaryId}`. Xong 09/11: tab "Kết quả đọc" của trang Học tập của bé ([ResultsTab.tsx](src/app/features/learning/ResultsTab.tsx)), xoá có popup xác nhận. Thông báo `StorySummarySent` mở trang Học tập của bé.
- [ ] **Luyện đọc to** — `POST /child/reading/sessions/{sessionId}/segments/{segmentId}/read-aloud` (nhận dạng giọng nói so khớp với văn bản). **Vẫn bị chặn bởi Backend** (kiểm lại 09/11): `ReadingSegmentDto` trong `GET .../content` chỉ có `SegmentOrder`, `Text`, `AudioUrl`, `WordTimingsJson`, không có `segmentId`, nên Frontend không biết gọi đoạn nào. Khi có: ghi âm bằng `useRecorder` (tối đa 1 MB), gửi multipart trường `audio`, hiện kết quả từng chữ (`good` / `retry` / `skipped`).

Đã nối và có màn hình (trước đợt này): danh sách truyện, phiên đọc, tiến độ, hoàn thành, dấu trang, yêu thích, cảm xúc, quiz, sổ tay, nghĩa của từ, phần thưởng (chỉ xem), điều ước, lộ trình của trẻ. Phản hồi đọc của phụ huynh (`/ParentReadingFeedback`, kèm câu bé trả lời ở các điểm dừng) hiện ở tab "Kết quả đọc".

## 1b. Lộ trình đọc (Luồng 4a) — P2

Từ 09/11 trang "Lộ trình của con" đổi thành **"Học tập của bé"** ([LearningWorkspace.tsx](src/app/features/learning/LearningWorkspace.tsx)): cột các bé bên trái, 4 tab Tổng quan / Lộ trình / Kết quả đọc / Điều ước. Lộ trình là một tab (không còn popup), lộ trình mẫu nằm ngay dưới, mặc định lọc theo tuổi của bé. Mã trang vẫn là `roadmap` (`#roadmap`) để link và thông báo cũ mở đúng. Không bỏ hẳn lộ trình được vì Backend dùng lộ trình để quyết định bé được đọc truyện nào (`ChildStoryBrowseService`).

Đối chiếu tài liệu "Luồng 4 – Lộ trình và trải nghiệm đọc của trẻ" (mục 4a và bảng quy tắc) với code ngày 09/11. Cả 25 endpoint của 5 controller lộ trình (`ChildRoadmap`, `MyRoadmap`, `RoadmapLibrary`, `RoadmapTemplate`, `RoadmapReview`) đều đã có hàm service và màn gọi; phần còn lại là quy tắc nghiệp vụ, hiệu năng và quy tắc thiết kế.

Đã có:
- [x] Phụ huynh xem lộ trình từng bé: bước đang đọc (Open), các bước tiếp theo (Waiting), lịch sử đã đọc / bỏ qua / đã gỡ kèm lý do bỏ qua ([RoadmapWorkspace.tsx](src/app/features/roadmap/RoadmapWorkspace.tsx)).
- [x] Thêm truyện với vị trí "Đọc tiếp theo" (NextUp) hoặc "Thêm vào cuối" (End), số ngày mong đọc xong, lời nhắn; thêm được từ trang Lộ trình và từ Thư viện ([AddToRoadmapDialog.tsx](src/app/features/roadmap/AddToRoadmapDialog.tsx)).
- [x] Đổi thứ tự (kéo thả và nút lên/xuống), gỡ một bước, làm trống lộ trình; gỡ và làm trống có popup xác nhận. Bước đã đọc / bỏ qua / đã gỡ không có nút gỡ.
- [x] Nguồn của từng bước hiện rõ: bố mẹ chọn, lộ trình mẫu, từ điều ước của bé.
- [x] Thư viện lộ trình mẫu: xem danh sách (ưu tiên đúng nhóm tuổi của bé), xem trước kế hoạch sao chép rồi mới sao chép.
- [x] Moderator soạn lộ trình mẫu: tạo, sửa, chọn truyện, gửi duyệt, rút lại, nhân bản, lưu trữ ([RoadmapTemplates.tsx](src/app/features/staff/RoadmapTemplates.tsx)); duyệt / yêu cầu sửa / từ chối kèm checklist ở [ReviewPanel.tsx](src/app/features/staff/ReviewPanel.tsx).
- [x] Bé xem "Hành trình của em": truyện đang mở, truyện sắp tới (khoá), số đã đọc / tổng ([ConnectedKidHome.tsx](src/app/features/kid/ConnectedKidHome.tsx)).
- [x] Thông báo `roadmap_story_added`, `roadmap_story_removed`, `roadmap_completed` mở thẳng trang Lộ trình.

Cần làm:
- [x] **P1 — Chặn thêm truyện khi hồ sơ bé không Active** (xong 09/11). Quy tắc Luồng 4: "hồ sơ không Active thì không thêm truyện được". Hiện nút "Thêm truyện" và nút thêm từ Thư viện vẫn bấm được với bé Draft / Suspended / Archived, chỉ biết bị từ chối sau khi gọi API. Cần tắt nút và nói rõ lý do (ví dụ "Hồ sơ của bé đang tạm dừng"), trong popup chọn nhiều bé thì bỏ chọn được bé không Active.
- [x] **P2 — Tải lộ trình mẫu chậm (N+1)** (xong 09/11: `useRoadmapTemplates` chỉ tải danh sách, chi tiết tải theo album và được nhớ lại). `guardianService.templates()` tải hết mọi trang của `/RoadmapLibrary` rồi gọi `/RoadmapLibrary/{id}` cho từng mẫu trước khi hiện. Đổi thành: hiện danh sách từ `/RoadmapLibrary` (có phân trang), chỉ gọi chi tiết khi bấm "Xem và thêm".
- [x] **P2 — Hai popup tự viết markup `dlg-backdrop`** (xong 09/11): popup "Thêm truyện cho bé" trong RoadmapWorkspace và [AddToRoadmapDialog.tsx](src/app/features/roadmap/AddToRoadmapDialog.tsx). Chuyển sang `components/Dialog` để đồng bộ (đóng bằng Esc, focus, animation).
- [x] **P2 — Gọn trang Lộ trình theo quy tắc thiết kế** (xong 09/11: trang làm lại thành thư viện album + cột các bé, nguồn và hạn đọc thành nhãn): khoảng 16 dòng chữ nhỏ (`<small>`, `sub`) trong RoadmapWorkspace. Gộp nguồn, ngày mở, hạn đọc thành nhãn (pill) thay vì một dòng chữ nhỏ dài; bỏ câu giải thích dưới khung khi có thể.
- [x] **P3 — Bỏ `DenyCover` "Bạn không đủ quyền hạn…"** (xong hết 09/11: đã gỡ ở LearningTab, ProfileTab và xoá component; các ô nhập vẫn khoá khi không phải chủ hồ sơ) ở RoadmapWorkspace (và LearningTab, ProfileTab): đây là phần còn lại của bộ quyền giám sát. Mỗi bé chỉ còn chủ hồ sơ nên chỉ cần ẩn nút khi không phải chủ.
- [x] **P3 — Nút "Lưu nháp và thứ tự"** ở RoadmapTemplates chỉ hiện khi sửa thông tin chung hoặc danh sách truyện (xong 09/11; bộ mới chưa lưu thì luôn hiện).

Ngoài phạm vi (theo mục "Còn thiếu" của tài liệu): Hold Mode, dashboard phụ huynh, báo cáo tuần, gợi ý học thích ứng, can thiệp O2O. Frontend đã gỡ phần giả lập của các mục này (mục 4).

## 2. Endpoint Backend chưa nối còn lại — P2

Lấy từ bản audit ngày 09/11 (39 endpoint). Cần xác nhận từng cái còn dùng hay không rồi mới nối.

**Có hàm service, chỉ thiếu màn gọi:**
- [ ] **Truyện có sẵn (Luồng 3b)** — `POST /stories/import`, `/stories/import-file`, `/stories/{id}/existing/{evaluate, adapt, keep-original}`, `GET .../existing/evaluation`, `PUT .../existing/content`. Đủ hàm trong [existingStoryService.ts](src/app/services/existingStoryService.ts) nhưng không màn nào import service này. Riêng `.../existing/archive` bỏ vì đã chốt không còn lưu trữ truyện.
- [x] **Dán văn bản cho truyện của phụ huynh** (09/11) — nút "Dán văn bản" ở trang Tự viết mở popup, gọi `POST /parent/stories/{id}/imports/preview` rồi điền vào các ô (tách "Tên truyện:", "Nguồn nội dung:"… như khi nhập tệp); chỉ lưu khi bấm "Lưu và tiếp tục". `.../imports/confirm` cố ý chưa dùng vì sẽ lưu thẳng mà phụ huynh chưa xem lại.
- [ ] **Xoá Learning Profile và Safety Policy** — `DELETE /LearningProfile/{id}`, `DELETE /SafetyPolicy/{id}`. Có `removeLearning`, `removeSafety` trong `profileLifecycleService.ts`, chưa có nút. Quy tắc: không xoá Safety Policy khi hồ sơ đang Active.
- [ ] **Điều ước của phụ huynh** — `GET /parent/wishes/{wishId}` (có `parentWishService.detail`), `GET /parent/wishes/{wishId}/generation` (chưa có hàm; service đang gọi `generation-form`, cần đối chiếu với Backend).
- [ ] **Thẻ ước (Moderator)** — `GET /moderation/wish-cards/{id}` (có hàm trong `wishCardService.ts`), `POST /moderation/stories/{id}/wish-cards/ai-match` (chưa có hàm).
- [ ] `GET /ChildProfile/{id}` — chỉ có hàm service, chưa có màn dùng.

**Chưa có hàm service:**
- [x] **Giao máy kèm truyện (Luồng 1c)** (09/11) — nút "Cho bé đọc ngay" ở khung chi tiết của truyện đã xong (Thư viện, Truyện của tôi) mở popup [StoryHandoverButton.tsx](src/app/features/kid/StoryHandoverButton.tsx): `GET /ChildAccessCredential/story-handover` cho biết bé nào đọc được (bé gợi ý viền vàng, bé không đọc được mờ kèm lý do); chọn bé thì `POST .../{childId}/handover-story` và `KidMode` mở thẳng truyện (vẫn qua cổng xác nhận người lớn khi thoát).
- [ ] **Duyệt truyện** — `POST /stories/{id}/review/confirm-package` (chưa có hàm). `PUT /stories/{id}/review/listening/{interactionId}` (sửa tương tác khi nghe) đã có hàm nhưng chưa màn nào gọi.
- [ ] **Media từng đoạn của Creator (mới)** — `POST /creator/stories/{id}/media/illustration-beats/{beatId}/{upload, generate}`, `POST /creator/stories/{id}/media/segments/{segmentId}/{upload, generate}`.
- [ ] **Gói truyện của phụ huynh (mới)** — `POST /parent/stories/{id}/content/{finalize, reopen}`, `GET|POST /parent/stories/{id}/packages`, `GET .../packages/{packageId}`, `POST .../packages/{packageId}/{generate, retry, revise, confirm}`, `GET .../packages/{packageId}/preview`, `GET .../packages/{packageId}/assets/{assetId}`, `POST /parent/stories/{id}/family-confirmations/batch`. Đây là luồng mới của Backend, cần đọc lại tài liệu Luồng 3 trước khi làm.
- [ ] **Tranh truyện tự soạn phía bé (mới)** — `GET /child/manual-stories/{confirmationId}/assets/{assetId}`.

**Test:**
- [x] Cập nhật `docs/core-api-coverage.json` (chạy `node scripts/audit-core-api.mjs --write`) và `tests/unit/services/coreCompletion.test.ts` theo 354 endpoint: 311 đã nối, 2 loại trừ, 18 `SERVICE_ONLY`, 23 `MISSING` (09/11, 335/335 test qua).

## 3. Quy tắc thiết kế trong CLAUDE.md còn sót — P2

- [x] **Form chuyển sang popup** (xong 09/11): soạn hướng dẫn ([GuideItemEditor.tsx](src/app/features/staff/GuideItemEditor.tsx), mở khi bấm "Thêm hướng dẫn" hoặc tên hướng dẫn, lưu xong tự đóng) và nhập nội dung của Creator ([CreatorImport.tsx](src/app/features/staff/CreatorImport.tsx)).
- [x] **Nút Lưu chỉ hiện khi có thay đổi** (xong 09/11): "Lưu nháp và thứ tự" (RoadmapTemplates), "Lưu tập nhãn" ([ReviewPanel.tsx](src/app/features/staff/ReviewPanel.tsx)).
- [x] **Xoá `PersonalStoryEditor.tsx`** (09/11): form tạo truyện riêng cũ, không trang nào hiển thị; việc tự viết truyện đã có trang "Tự viết". `POST /Story` và `PATCH /Story/{id}/publish` chuyển sang `SERVICE_ONLY` (hàm vẫn còn trong `storyManagementService`).
- [x] **Rút bớt chữ nhỏ dưới component** (09/11): WishItem, BriefForm, ReviewPanel, CreatorImport, Thư viện, CreateChildWizard, trang Tự viết, màn duyệt Studio, Studio, Cài đặt an toàn, đề xuất sửa (ProposalCard), Tài khoản. Trạng thái thành nhãn, hướng dẫn thành khung thông báo, giải thích phụ vào ⓘ (`components/InfoTip`), "chưa có gì" thành khung viền đứt (`.empty-line`). Nhãn tên trường trong ô số liệu / checklist giữ nguyên.
- [x] **Rà nhãn nút dài** (09/11): rút gọn 6 nhãn trên 24 ký tự ("Tải lại trạng thái truyện / hoàn tất" → "Tải lại", "Thử lại kiểm tra ý tưởng" → "Kiểm tra lại", "Chèn gợi ý vào bản đang sửa" → "Chèn gợi ý", "Đồng bộ bộ hướng dẫn" → "Đồng bộ", "Tạo bản nháp từ phiên bản này" → "Tạo nháp từ bản này"). Giữ "Duyệt dàn ý và viết truyện" (nút chính của Studio). Chưa kiểm tra bằng mắt ở khung hẹp / điện thoại.
- [ ] **Kiểm tra bằng mắt**: chạy app, chụp từng trang, xem bố cục, khoảng cách, tiêu đề nổi bật, đồng bộ giữa các trang, cả theme sáng và tối. Đặc biệt kiểm tra lại: viền mới đậm hơn, tiêu đề mục `.sec-h`, ảnh bìa mẫu `default-cover.svg`, popup mới.

## 4. Dọn code cũ — P3

Đã dọn ngày 09/11 (Backend đã xoá giám sát, Hold Mode và yêu cầu dữ liệu bằng migration `RemoveSupervisionAndRenameParentRole`, `DropRecommendationHoldModeAndIntervention`, `RemoveDataRequests`):

- [x] Bộ quyền giám sát cũ: bỏ `PERMISSIONS`, `DEFAULT_PRESET` khỏi [guardian.ts](src/app/lib/guardian.ts); bỏ các kiểu lời mời, chuyển quyền, yêu cầu quyền khỏi [types/supervision.ts](src/app/types/supervision.ts) (giữ `Permission` và các kiểu truy cập của bé đang dùng); [useMyRole.ts](src/app/features/children/useMyRole.ts) chỉ còn kiểm tra chủ hồ sơ (bỏ `perms`, `loadMyRole`). Chữ thông báo `supervision_*` giữ lại vì Backend vẫn giữ các loại này để đọc thông báo cũ.
- [x] Hold Mode: xoá `HoldPanel.tsx`, `holdCase`, `unlockHold`, `addHoldNotes`; bỏ khỏi trang lộ trình.
- [x] Dashboard và báo cáo tuần: xoá `guardianService.dashboard`, `reports`, `completions`, `markCompletionSeen`, `CompletionCard.tsx` và các kiểu `Dashboard`, `ProgressReport`, `ReadCompletion`, `InterventionCase` trong `types/progress.ts`; bỏ các khối Tiến độ, Kết quả học tập, Sở thích, Báo cáo tuần và khối "Xin quyền" trong HomeWorkspace.
- [x] Chú thích `ProfileSwitcher` ở [KidMode.tsx](src/app/features/kid/KidMode.tsx) sửa thành mã giao máy (handover).
- [x] Bộ lọc "Dữ liệu" và nhãn `DataRequest` ở [ActivitySection.tsx](src/app/features/account/ActivitySection.tsx) đã gỡ.
- [x] [notifications.ts](src/app/lib/notifications.ts) đối chiếu với enum `NotificationType` của Backend: bỏ chữ cho các loại Backend không còn (`hold_mode_*`, `progress_report_ready`, `data_request_*`, `totp_reset`, `story_awaiting_approval`, `story_shared`, `assignment_cancelled`, `recommendation_awaiting_review`); thêm `story_summary_sent`.
- [x] Lỗi ESLint có sẵn ở SafetyWorkspace, CreatorEditor, ChildReadingLibrary: chạy lại eslint không còn lỗi.
- [x] CSS cuốn sách trong `landing.css` (`ld-book*`, `ld-rain`, `ld-pad`, `ld-frog`, `ld-leaf`, `ld-listen`, `ld-dots`, `ld-stamp`) đã xoá; mọi lớp `ld-` còn lại đều có component dùng.

Còn lại:
- [x] **Trang Tổng quan (`features/home`)** đã xoá (09/11). `WishItem` chuyển sang `features/learning`, phản hồi đọc và tóm tắt viết lại trong tab Kết quả đọc.
- [x] CSS dashboard (`dashboard.css`, `home.css`) xoá cùng thư mục `features/home`.

## 5. Chờ Backend hoặc cần quyết định — để sau

- [ ] **Gói tháng và gói bổ sung** (Luồng 2): chờ Backend có `PlanType`, chu kỳ, tách lượt cơ bản/bổ sung. Khi có: sửa [PaymentSection.tsx](src/app/features/account/PaymentSection.tsx) (khoá gói bổ sung khi chưa có gói tháng), thêm màn lịch sử giao dịch (mục 2e), quota Creator (mục 2f).
- [x] **Backend trả link media đầy đủ cho trẻ** (06/11/2026, sửa ở Backend): thêm `ChildMediaUrlSigner` ký link (hạn 2 giờ) cho nội dung đọc, tương tác, phản hồi, âm thanh từ vựng và tranh trong tóm tắt của phụ huynh. Container `core-api` đã build lại ngày 09/11.
- [ ] Sau khi kiểm tra màn đọc của bé chạy đúng với link ký sẵn: bỏ `NEXT_PUBLIC_MEDIA_BASE_URL` và [mediaUrl.ts](src/app/lib/mediaUrl.ts) (hiện giữ nguyên link https nên không ảnh hưởng).
- [ ] **Lỗi AI phía Backend** (ghi nhận 09/11, Frontend chỉ đổi câu báo lỗi): "Nhận xét bản thảo" hay trả `AI_OUTPUT_INVALID` với bài dài (AI tính sai vị trí ký tự); kiểm tra nội dung của phụ huynh luôn báo `SEMANTIC_SAFETY_REVIEW_REQUIRED` khi chính sách của bé có ngưỡng điểm an toàn; Vertex thỉnh thoảng trả 429 hoặc hết thời gian. Kiểm tra nội dung của Creator chỉ trả An toàn / Vùng xám / Bị chặn, không có lý do hay vị trí.
- [ ] **Doanh thu của Creator**: chờ Backend có API; sau đó làm lại trang thống kê.
- [ ] **Trang giới thiệu hiển thị truyện đã phát hành**: chờ API công khai (hiện thư viện cộng đồng cần token).
- [ ] **Ảnh bìa truyện cộng đồng**: chờ DTO trả ảnh bìa (hiện dùng ảnh mẫu chung). Lộ trình của trẻ (`/MyRoadmap`) đã có `coverImageUrl` và đang dùng ở khung "Hôm nay em đọc".
- [ ] **Quản lý prompt, chất lượng AI, tài khoản phụ huynh (Admin)**: chờ tài liệu và API; đã gỡ khỏi menu.
- [ ] **Creator tự đăng ký**: chờ chốt cách có tài khoản Creator (Luồng 5, mục 5g).

## 6. Đã chốt (không cần làm)

- Cài đặt an toàn giữ cách tự lưu.
- Bỏ thao tác "Lưu trữ truyện" của phụ huynh.
- Trang giới thiệu không dùng dữ liệu mẫu.
- Trang Nâng cấp gói giữ nguyên cho tới khi Backend làm gói tháng.

## 7. Đã làm

### 09/11/2026

Commit `a11f770`: trang soạn thủ công của Creator và phụ huynh dùng chung ô soạn (`StoryFields`), Creator có nút Tải tệp mẫu, dịch mã lỗi kiểm tra nội dung của phụ huynh, gợi ý các câu dài nhất khi chưa đủ dễ đọc, dịch `AI_OUTPUT_INVALID`, vòng xoay ở nút "Lấy gợi ý", nút "Lưu cách đọc" chỉ hiện khi có thay đổi, ghi chú trạng thái của Creator không bật thành toast khi mở trang.

Dọn code cũ ở mục 4 (chưa commit).

Commit `8bfd3ba`: trang "Học tập của bé" thay trang "Lộ trình của con" (xem mục 1b); xoá `RoadmapWorkspace.tsx`, `ChildRoadmapDialog.tsx` và thư mục `features/home`.

Commit `1faaa8c`: popup thêm vào lộ trình làm lại (tự tải kế hoạch, dịch mã cảnh báo, kết quả theo từng bé); nút "Thêm truyện" mở Thư viện với bé chọn sẵn rồi quay về; Thư viện và lộ trình mẫu nhớ dữ liệu trong phiên; "Truyện của tôi" chia kệ theo trạng thái; bỏ trang "Xem và duyệt" (kệ "Chờ bạn duyệt" thay thế); chỉ truyện đã xong mới đọc thử; tách nút "Viết bằng AI" / "Tự viết", căn giữa thanh điều hướng; thanh cuộn màu xanh.

Commit `af6f1cd`: trang chính của bé có khung "Hôm nay em đọc", nút tab có chữ; điểm nhấn vàng cho việc cần làm.

Bỏ `DenyCover`, nút Lưu chỉ hiện khi có thay đổi ở RoadmapTemplates và ReviewPanel, cập nhật audit và test (335/335 qua).

Rút chữ nhỏ (WishItem, BriefForm, ReviewPanel, Thư viện, CreateChildWizard; thêm `components/InfoTip`), form soạn hướng dẫn và nhập nội dung Creator thành popup, rút gọn 6 nhãn nút dài, xoá `PersonalStoryEditor`, "Truyện của tôi" của Creator chia kệ theo trạng thái, đổi tên nút Creator thành "Viết bằng AI" / "Tự viết". Test `coreCompletion` tăng thời gian chờ lên 30 giây (chạy script audit vài giây, trước đây thỉnh thoảng quá 5 giây khi cả bộ chạy song song). Smoke test (`tests/smoke`) cập nhật theo giao diện mới (nút tạo truyện, luồng lộ trình mẫu ở trang Học tập, bỏ fixture `PersonalStoryEditor`) nhưng **chưa chạy được** vì máy chưa cài Playwright.

### 06/11/2026

Phần 1 (tương tác của trẻ): 6/7 mục xong, có test hợp đồng trong `tests/unit/services/childReadingContracts.test.ts`. Audit: 311/335 endpoint đã nối.

Commit `c42db5c`: thang cỡ chữ, viền đậm hơn, bỏ thanh `.ph`, `SafeImage` + ảnh mặc định, ảnh bìa mẫu dùng chung (`coverFor`), toast cho lỗi, popup xác nhận, popup mời nhân sự, vô hiệu hoá, hạn mức, danh mục, nội dung theo Luồng 1–5, xoá trang chưa có API, dọn test gọi service đã xoá.
