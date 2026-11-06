# Việc cần làm — Frontend

Cập nhật: 06/11/2026. Chỉ tính phần Frontend (`src/`); không sửa Backend.

Căn cứ:
- 5 tài liệu Luồng 1–5 (link trong `CLAUDE.md` ở thư mục gốc dự án).
- Quy tắc thiết kế trong `CLAUDE.md`.
- Kết quả chạy `node scripts/audit-core-api.mjs` (Backend hiện 335 endpoint, 29 chưa nối).

Ký hiệu: `[ ]` chưa làm · `[x]` đã làm. Ưu tiên: **P1** làm trước · **P2** làm sau · **P3** dọn dẹp.

---

## 1. Tương tác của trẻ khi đọc (Luồng 4b, 4c) — P1

Đã làm 6/7 mục (06/11/2026). Còn lại luyện đọc to, đang bị chặn bởi Backend.

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
- [x] **Phụ huynh nghe lại và xoá tóm tắt** (Luồng 4c) — `GET /ParentStorySummary/{childProfileId}`, `DELETE /ParentStorySummary/{childProfileId}/{summaryId}` ([StorySummaries.tsx](src/app/features/home/StorySummaries.tsx), hiện dưới bảng "đã đọc gì"; xoá có popup xác nhận).
- [ ] **Luyện đọc to** — `POST /child/reading/sessions/{sessionId}/segments/{segmentId}/read-aloud` (nhận dạng giọng nói so khớp với văn bản). **Bị chặn bởi Backend**: `ReadingSegmentDto` trong `GET .../content` chỉ có `segmentOrder`, không có `segmentId`, nên Frontend không biết gọi đoạn nào. Cần Backend thêm `segmentId` vào DTO. Khi có: ghi âm bằng `useRecorder` (tối đa 1 MB), gửi multipart trường `audio`, hiện kết quả từng chữ (`good` / `retry` / `skipped`).

Đã nối và có màn hình (trước đợt này): danh sách truyện, phiên đọc, tiến độ, hoàn thành, dấu trang, yêu thích, cảm xúc, quiz, sổ tay, nghĩa của từ, phần thưởng (chỉ xem), điều ước, lộ trình của trẻ, phản hồi đọc của phụ huynh.

## 2. Endpoint Backend chưa nối còn lại — P2

Lấy từ bản audit. Cần xác nhận từng cái còn dùng hay không rồi mới nối.

- [ ] **Giao máy kèm truyện (Luồng 1c)** — `GET /ChildAccessCredential/story-handover`, `POST /ChildAccessCredential/{childProfileId}/handover-story`.
- [ ] **Truyện có sẵn (Luồng 3b)** — `POST /stories/import`, `/stories/import-file`, `/stories/{id}/existing/{evaluate, adapt, keep-original}`, `GET .../existing/evaluation`, `PUT .../existing/content`. Có `existingStoryService.ts` nhưng audit vẫn báo thiếu, cần đối chiếu lại đường dẫn. Riêng `.../existing/archive` bỏ vì đã chốt không còn lưu trữ truyện.
- [ ] **Nhập file cho truyện viết tay** — `POST /parent/stories/{storyId}/imports/preview`, `.../imports/confirm`.
- [ ] **Điều ước của phụ huynh** — `GET /parent/wishes/{wishId}`, `GET /parent/wishes/{wishId}/generation`.
- [ ] **Duyệt truyện** — `PUT /stories/{id}/review/listening/{interactionId}` (sửa tương tác khi nghe), `POST /stories/{id}/review/confirm-package`.
- [ ] **Thẻ ước (Moderator)** — `GET /moderation/wish-cards/{id}`, `POST /moderation/stories/{id}/wish-cards/ai-match`.
- [ ] **Xoá Learning Profile và Safety Policy** — `DELETE /LearningProfile/{id}`, `DELETE /SafetyPolicy/{id}`. Quy tắc: không xoá Safety Policy khi hồ sơ đang Active.
- [ ] `GET /ChildProfile/{id}` — chỉ có hàm service, chưa có màn dùng.
- [ ] Chạy lại `node scripts/audit-core-api.mjs`, cập nhật `docs/core-api-coverage.json` và các số trong `tests/unit/services/coreCompletion.test.ts` (đang chờ 329, thực tế 335). Test "has source evidence for every browser endpoint" đang lỗi vì lý do này.

## 3. Quy tắc thiết kế trong CLAUDE.md còn sót — P2

- [ ] **Form chuyển sang popup**: soạn hướng dẫn ([GuideItemEditor.tsx](src/app/features/staff/GuideItemEditor.tsx)), bộ truyện mẫu ([RoadmapTemplates.tsx](src/app/features/staff/RoadmapTemplates.tsx)), tiêu chí ([RubricWorkspace.tsx](src/app/features/staff/RubricWorkspace.tsx)), nhập truyện ([CreatorImport.tsx](src/app/features/staff/CreatorImport.tsx)). Dùng `components/Dialog`.
- [ ] **Nút Lưu chỉ hiện khi có thay đổi**: RoadmapTemplates, "Lưu tập nhãn" ([ReviewPanel.tsx](src/app/features/staff/ReviewPanel.tsx)), [PersonalStoryEditor.tsx](src/app/features/library/PersonalStoryEditor.tsx). Mẫu đúng: [ProfileSection.tsx](src/app/features/account/ProfileSection.tsx), [LearningTab.tsx](src/app/features/children/LearningTab.tsx).
- [ ] **Rút bớt chữ nhỏ dưới component** (khoảng 350 dòng `sub`, `hint`, `<small>`). Nhiều nhất: [HomeWorkspace.tsx](src/app/features/home/HomeWorkspace.tsx) (~38), RoadmapWorkspace (~16), ReviewPanel (~15), WishItem (~14), BriefForm (~13).
- [ ] **Rà tiếp nhãn nút dài** còn lại (đã rút gọn 14 nhãn); kiểm tra nút không tràn chữ ở khung hẹp và điện thoại.
- [ ] **Kiểm tra bằng mắt**: chạy app, chụp từng trang, xem bố cục, khoảng cách, tiêu đề nổi bật, đồng bộ giữa các trang, cả theme sáng và tối. Đặc biệt kiểm tra lại: viền mới đậm hơn, tiêu đề mục `.sec-h`, ảnh bìa mẫu `default-cover.svg`, popup mới.

## 4. Dọn code cũ — P3

- [ ] Bộ quyền giám sát cũ: [guardian.ts](src/app/lib/guardian.ts) (`PERMISSIONS`, `DEFAULT_PRESET`), [types/supervision.ts](src/app/types/supervision.ts), [notifications.ts](src/app/lib/notifications.ts) (`supervision_*`), [useMyRole.ts](src/app/features/children/useMyRole.ts). Hiện chỉ còn chủ hồ sơ.
- [ ] Hold Mode chưa làm: [HoldPanel.tsx](src/app/features/roadmap/HoldPanel.tsx), `holdCase`, `unlockHold` trong [guardianService.ts](src/app/services/guardianService.ts). Gỡ hoặc giữ ẩn cho tới khi có API.
- [ ] Báo cáo tuần và dashboard (`guardianService.dashboard`, `reports`, `completions`) đang trả `unavailable`; gỡ hoặc nối khi có API.
- [ ] Chú thích `ProfileSwitcher` ở [KidMode.tsx](src/app/features/kid/KidMode.tsx) (code dùng handover).
- [ ] Bộ lọc "Dữ liệu" và nhãn `DataRequest` ở [ActivitySection.tsx](src/app/features/account/ActivitySection.tsx); nhãn `DataRequestCompleted` ở `notifications.ts`. Hỏi lại Backend còn ghi loại nhật ký này không.
- [ ] Lỗi ESLint có sẵn: `react-hooks/refs` ở [SafetyWorkspace.tsx](src/app/features/safety/SafetyWorkspace.tsx) và [CreatorEditor.tsx](src/app/features/staff/CreatorEditor.tsx); import `Lock` thừa ở [ChildReadingLibrary.tsx](src/app/features/kid/ChildReadingLibrary.tsx).
- [ ] Xoá các lớp CSS không còn dùng sau khi bỏ `StoryBookDemo` (phần cuốn sách trong `landing.css`).

## 5. Chờ Backend hoặc cần quyết định — để sau

- [ ] **Gói tháng và gói bổ sung** (Luồng 2): chờ Backend có `PlanType`, chu kỳ, tách lượt cơ bản/bổ sung. Khi có: sửa [PaymentSection.tsx](src/app/features/account/PaymentSection.tsx) (khoá gói bổ sung khi chưa có gói tháng), thêm màn lịch sử giao dịch (mục 2e), quota Creator (mục 2f).
- [x] **Backend trả link media đầy đủ cho trẻ** (06/11/2026, sửa ở Backend, chưa commit): thêm `ChildMediaUrlSigner` ký link (hạn 2 giờ) cho nội dung đọc, tương tác, phản hồi, âm thanh từ vựng và tranh trong tóm tắt của phụ huynh. Cần build lại container `core-api` để có hiệu lực. Sau đó có thể bỏ `NEXT_PUBLIC_MEDIA_BASE_URL` và [mediaUrl.ts](src/app/lib/mediaUrl.ts) (hiện giữ nguyên link https nên không ảnh hưởng).
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

## 7. Đã làm (06/11/2026)

Phần 1 (tương tác của trẻ): 6/7 mục xong, có test hợp đồng trong `tests/unit/services/childReadingContracts.test.ts`. Audit: 311/335 endpoint đã nối.

Commit `c42db5c`: thang cỡ chữ, viền đậm hơn, bỏ thanh `.ph`, `SafeImage` + ảnh mặc định, ảnh bìa mẫu dùng chung (`coverFor`), toast cho lỗi, popup xác nhận, popup mời nhân sự, vô hiệu hoá, hạn mức, danh mục, nội dung theo Luồng 1–5, xoá trang chưa có API, dọn test gọi service đã xoá.
