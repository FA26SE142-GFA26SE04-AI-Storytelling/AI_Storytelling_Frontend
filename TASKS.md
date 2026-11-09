# Việc cần làm — Frontend

Cập nhật: 09/11/2026. Chỉ tính phần Frontend (`src/`); không sửa Backend.

Căn cứ:
- 5 tài liệu Luồng 1–5 (link trong `CLAUDE.md` ở thư mục gốc dự án).
- Quy tắc thiết kế trong `CLAUDE.md`.
- Kết quả chạy `node scripts/audit-core-api.mjs` ngày 09/11: Backend hiện **354** endpoint, 313 đã nối, 2 loại trừ, **39** còn thiếu. "Còn thiếu" gồm cả endpoint chưa có hàm service và endpoint có hàm service nhưng chưa màn nào gọi (`SERVICE_ONLY`).

Ký hiệu: `[ ]` chưa làm · `[x]` đã làm. Ưu tiên: **P1** làm trước · **P2** làm sau · **P3** dọn dẹp.

---

## 1. Tương tác của trẻ khi đọc (Luồng 4b, 4c) — P1

Đã làm 5/7 mục. Còn lại luyện đọc to (bị chặn bởi Backend) và màn phụ huynh xem tóm tắt (có code nhưng chưa gắn vào trang nào).

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
- [ ] **Phụ huynh nghe lại và xoá tóm tắt** (Luồng 4c) — `GET /ParentStorySummary/{childProfileId}`, `DELETE /ParentStorySummary/{childProfileId}/{summaryId}`. Code đã có ([StorySummaries.tsx](src/app/features/home/StorySummaries.tsx) nằm trong [ReadingFeedback.tsx](src/app/features/home/ReadingFeedback.tsx), xoá có popup xác nhận) **nhưng không hiện ở đâu**: [HomeWorkspace.tsx](src/app/features/home/HomeWorkspace.tsx) không còn trong bảng `VIEWS` của `page.tsx` từ khi đổi sang điều hướng ngang. Cần quyết định gắn `ReadingFeedback` vào trang nào (gợi ý: tab của từng bé trong "Con của tôi"). Thông báo `StorySummarySent` hiện đã có chữ tiếng Việt nhưng chưa mở tới màn nào.
- [ ] **Luyện đọc to** — `POST /child/reading/sessions/{sessionId}/segments/{segmentId}/read-aloud` (nhận dạng giọng nói so khớp với văn bản). **Vẫn bị chặn bởi Backend** (kiểm lại 09/11): `ReadingSegmentDto` trong `GET .../content` chỉ có `SegmentOrder`, `Text`, `AudioUrl`, `WordTimingsJson`, không có `segmentId`, nên Frontend không biết gọi đoạn nào. Khi có: ghi âm bằng `useRecorder` (tối đa 1 MB), gửi multipart trường `audio`, hiện kết quả từng chữ (`good` / `retry` / `skipped`).

Đã nối và có màn hình (trước đợt này): danh sách truyện, phiên đọc, tiến độ, hoàn thành, dấu trang, yêu thích, cảm xúc, quiz, sổ tay, nghĩa của từ, phần thưởng (chỉ xem), điều ước, lộ trình của trẻ. Phản hồi đọc của phụ huynh (`ReadingFeedback`) có code nhưng đang không hiện, cùng lý do với mục tóm tắt ở trên.

## 1b. Lộ trình đọc (Luồng 4a) — P2

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
- [x] **P3 — Bỏ `DenyCover` "Bạn không đủ quyền hạn…"** (xong ở trang Lộ trình 09/11; LearningTab, ProfileTab còn) ở RoadmapWorkspace (và LearningTab, ProfileTab): đây là phần còn lại của bộ quyền giám sát. Mỗi bé chỉ còn chủ hồ sơ nên chỉ cần ẩn nút khi không phải chủ.
- [ ] **P3 — Nút "Lưu nháp và thứ tự"** ở RoadmapTemplates luôn hiện (đã ghi ở mục 3), làm cùng đợt này.

Ngoài phạm vi (theo mục "Còn thiếu" của tài liệu): Hold Mode, dashboard phụ huynh, báo cáo tuần, gợi ý học thích ứng, can thiệp O2O. Frontend đã gỡ phần giả lập của các mục này (mục 4).

## 2. Endpoint Backend chưa nối còn lại — P2

Lấy từ bản audit ngày 09/11 (39 endpoint). Cần xác nhận từng cái còn dùng hay không rồi mới nối.

**Có hàm service, chỉ thiếu màn gọi:**
- [ ] **Truyện có sẵn (Luồng 3b)** — `POST /stories/import`, `/stories/import-file`, `/stories/{id}/existing/{evaluate, adapt, keep-original}`, `GET .../existing/evaluation`, `PUT .../existing/content`. Đủ hàm trong [existingStoryService.ts](src/app/services/existingStoryService.ts) nhưng không màn nào import service này. Riêng `.../existing/archive` bỏ vì đã chốt không còn lưu trữ truyện.
- [ ] **Nhập văn bản cho truyện của phụ huynh** — `POST /parent/stories/{storyId}/imports/preview`, `.../imports/confirm`. Có hàm `previewImport`, `confirmImport` trong `parentAuthoringService.ts`; trang soạn của phụ huynh đang dùng `imports/preview-file` rồi tự tách tệp, chưa dùng hai endpoint này.
- [ ] **Xoá Learning Profile và Safety Policy** — `DELETE /LearningProfile/{id}`, `DELETE /SafetyPolicy/{id}`. Có `removeLearning`, `removeSafety` trong `profileLifecycleService.ts`, chưa có nút. Quy tắc: không xoá Safety Policy khi hồ sơ đang Active.
- [ ] **Điều ước của phụ huynh** — `GET /parent/wishes/{wishId}` (có `parentWishService.detail`), `GET /parent/wishes/{wishId}/generation` (chưa có hàm; service đang gọi `generation-form`, cần đối chiếu với Backend).
- [ ] **Thẻ ước (Moderator)** — `GET /moderation/wish-cards/{id}` (có hàm trong `wishCardService.ts`), `POST /moderation/stories/{id}/wish-cards/ai-match` (chưa có hàm).
- [ ] `GET /ChildProfile/{id}` — chỉ có hàm service, chưa có màn dùng.

**Chưa có hàm service:**
- [ ] **Giao máy kèm truyện (Luồng 1c)** — `GET /ChildAccessCredential/story-handover`, `POST /ChildAccessCredential/{childProfileId}/handover-story`.
- [ ] **Duyệt truyện** — `PUT /stories/{id}/review/listening/{interactionId}` (sửa tương tác khi nghe), `POST /stories/{id}/review/confirm-package`.
- [ ] **Media từng đoạn của Creator (mới)** — `POST /creator/stories/{id}/media/illustration-beats/{beatId}/{upload, generate}`, `POST /creator/stories/{id}/media/segments/{segmentId}/{upload, generate}`.
- [ ] **Gói truyện của phụ huynh (mới)** — `POST /parent/stories/{id}/content/{finalize, reopen}`, `GET|POST /parent/stories/{id}/packages`, `GET .../packages/{packageId}`, `POST .../packages/{packageId}/{generate, retry, revise, confirm}`, `GET .../packages/{packageId}/preview`, `GET .../packages/{packageId}/assets/{assetId}`, `POST /parent/stories/{id}/family-confirmations/batch`. Đây là luồng mới của Backend, cần đọc lại tài liệu Luồng 3 trước khi làm.
- [ ] **Tranh truyện tự soạn phía bé (mới)** — `GET /child/manual-stories/{confirmationId}/assets/{assetId}`.

**Test:**
- [ ] Cập nhật `docs/core-api-coverage.json` và các số trong `tests/unit/services/coreCompletion.test.ts` (đang chờ 329, thực tế 354). Test "has source evidence for every browser endpoint" là test duy nhất đang lỗi (334/335 test qua ngày 09/11).

## 3. Quy tắc thiết kế trong CLAUDE.md còn sót — P2

- [ ] **Form chuyển sang popup**: còn soạn hướng dẫn ([GuideItemEditor.tsx](src/app/features/staff/GuideItemEditor.tsx)) và nhập truyện của Creator ([CreatorImport.tsx](src/app/features/staff/CreatorImport.tsx), đang là khung nằm trong trang). Dùng `components/Dialog`. Bộ truyện mẫu (RoadmapTemplates) và tiêu chí (RubricWorkspace) đã dùng `Dialog`.
- [ ] **Nút Lưu chỉ hiện khi có thay đổi**: RoadmapTemplates ("Lưu nháp và thứ tự"), "Lưu tập nhãn" ([ReviewPanel.tsx](src/app/features/staff/ReviewPanel.tsx)), [PersonalStoryEditor.tsx](src/app/features/library/PersonalStoryEditor.tsx). Mẫu đúng: [ProfileSection.tsx](src/app/features/account/ProfileSection.tsx), [LearningTab.tsx](src/app/features/children/LearningTab.tsx), [ParentSetupPanel.tsx](src/app/features/authoring/ParentSetupPanel.tsx) ("Lưu cách đọc", sửa 09/11).
- [ ] **Rút bớt chữ nhỏ dưới component** (khoảng 300 dòng `sub`, `hint`, `<small>` ngày 09/11). Nhiều nhất: RoadmapWorkspace (~16), ReviewPanel (~15), WishItem, BriefForm (~8). HomeWorkspace đã bớt nhiều sau khi gỡ các khối dashboard (09/11) và hiện không được gắn vào trang nào.
- [ ] **Rà tiếp nhãn nút dài** còn lại (đã rút gọn 14 nhãn); kiểm tra nút không tràn chữ ở khung hẹp và điện thoại.
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
- [ ] **Trang Tổng quan (`features/home`) không được gắn vào trang nào.** Trước khi xoá cần quyết định chuyển `ReadingFeedback` (kèm tóm tắt của bé, xem mục 1) và `WishItem` sang đâu. `BriefForm` vẫn import hằng `STUDIO_PREFILL_KEY` từ `WishItem.tsx`.
- [ ] CSS của các khối dashboard đã gỡ (`stats3`, `bars`, `trend`, `report-row`, `done-grid`, `dash-block.locked`… trong `dashboard.css`) còn lại; xoá cùng lúc với quyết định ở trên.

## 5. Chờ Backend hoặc cần quyết định — để sau

- [ ] **Gói tháng và gói bổ sung** (Luồng 2): chờ Backend có `PlanType`, chu kỳ, tách lượt cơ bản/bổ sung. Khi có: sửa [PaymentSection.tsx](src/app/features/account/PaymentSection.tsx) (khoá gói bổ sung khi chưa có gói tháng), thêm màn lịch sử giao dịch (mục 2e), quota Creator (mục 2f).
- [x] **Backend trả link media đầy đủ cho trẻ** (06/11/2026, sửa ở Backend): thêm `ChildMediaUrlSigner` ký link (hạn 2 giờ) cho nội dung đọc, tương tác, phản hồi, âm thanh từ vựng và tranh trong tóm tắt của phụ huynh. Container `core-api` đã build lại ngày 09/11.
- [ ] Sau khi kiểm tra màn đọc của bé chạy đúng với link ký sẵn: bỏ `NEXT_PUBLIC_MEDIA_BASE_URL` và [mediaUrl.ts](src/app/lib/mediaUrl.ts) (hiện giữ nguyên link https nên không ảnh hưởng).
- [ ] **Lỗi AI phía Backend** (ghi nhận 09/11, Frontend chỉ đổi câu báo lỗi): "Nhận xét bản thảo" hay trả `AI_OUTPUT_INVALID` với bài dài (AI tính sai vị trí ký tự); kiểm tra nội dung của phụ huynh luôn báo `SEMANTIC_SAFETY_REVIEW_REQUIRED` khi chính sách của bé có ngưỡng điểm an toàn; Vertex thỉnh thoảng trả 429 hoặc hết thời gian. Kiểm tra nội dung của Creator chỉ trả An toàn / Vùng xám / Bị chặn, không có lý do hay vị trí.
- [ ] **Doanh thu của Creator**: chờ Backend có API; sau đó làm lại trang thống kê.
- [ ] **Trang giới thiệu hiển thị truyện đã phát hành**: chờ API công khai (hiện thư viện cộng đồng cần token).
- [ ] **Ảnh bìa truyện cộng đồng và lộ trình của trẻ**: chờ DTO trả ảnh bìa (hiện dùng ảnh mẫu chung).
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

### 06/11/2026

Phần 1 (tương tác của trẻ): 6/7 mục xong, có test hợp đồng trong `tests/unit/services/childReadingContracts.test.ts`. Audit: 311/335 endpoint đã nối.

Commit `c42db5c`: thang cỡ chữ, viền đậm hơn, bỏ thanh `.ph`, `SafeImage` + ảnh mặc định, ảnh bìa mẫu dùng chung (`coverFor`), toast cho lỗi, popup xác nhận, popup mời nhân sự, vô hiệu hoá, hạn mức, danh mục, nội dung theo Luồng 1–5, xoá trang chưa có API, dọn test gọi service đã xoá.
