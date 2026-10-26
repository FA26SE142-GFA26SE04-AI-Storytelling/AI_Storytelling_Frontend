# Kết quả kết nối API frontend

> Đối chiếu mới nhất 25/10/2026 từ Core Controllers: **332 route, 330 route có đường nối service → màn hình/hook, 1 compatibility alias và 1 webhook server-to-server; missing: []**. Đã bổ sung 13 API đọc truyện/sổ tay trẻ và API giữ media cũ; regeneration gửi operationId theo contract mới. Chi tiết hiện hành: [core-api-completion.md](core-api-completion.md); bằng chứng từng route: [core-api-coverage.json](core-api-coverage.json). Các phần dưới ghi lại những đợt triển khai trước. Source coverage không thay thế live E2E.

Ngày hoàn tất kiểm tra frontend: 22/10/2026. Căn cứ: `AI_Storytelling_Backend/docs/API_FRONTEND_ACTOR_FLOWS.md`, backend baseline `e808851` cùng phần bổ sung Creator Manual trong working tree, frontend gốc `93d00ef`.

Đã triển khai các nhóm kết nối trong kế hoạch vào kiến trúc hiện hữu. Đợt hoàn thiện tiếp theo đã đối chiếu đủ 306 endpoint (305 baseline và 1 Creator Manual mới): 304 endpoint có service và nơi dùng trong frontend, 1 alias dùng route chuẩn tương đương, 1 webhook server-to-server. Chi tiết và bằng chứng từng endpoint: [core-api-completion.md](core-api-completion.md), [core-api-coverage.json](core-api-coverage.json). Đây là kết quả đối chiếu source, unit test và browser fixture; chưa phải nghiệm thu với backend/database thật.

## Kiến trúc và transport

- Giữ route `/`, AppShell, StaffApp, các context và cơ chế điều hướng workspace.
- HTTP ở `app/services`; luồng nhiều bước ở hook nghiệp vụ. Không thêm thư viện quản lý state hay framework mới.
- DTO theo schema tài liệu ở `app/types/backendContracts.ts`; adapter roadmap giữ mô hình hiển thị cũ nhưng bảo toàn cảnh báo và kết quả từng trẻ.
- `apiClient.ts` giữ HTTP status, AbortSignal, FormData, lỗi có dữ liệu progress, response không có data và trường hợp body rỗng được khai báo riêng. Không coi HTTP lỗi là thành công vì envelope sai.
- Tách phiên adult/child/anonymous. Token trẻ không được refresh bằng token người lớn. Thiếu token trẻ không được thay bằng token người lớn.
- Mất kết nối/refresh tạm lỗi không tự xóa phiên adult; lỗi xác thực thực sự vẫn hủy phiên.
- Bỏ cơ chế tự chuyển cả service sang local khi một endpoint thất bại. API thật trả lỗi ra giao diện; notification không trộn dữ liệu local trong chế độ thật.

## Parent

- `roadmapService.ts`, `roadmapAdapters.ts` qua `guardianService.ts` nối ChildRoadmap/RoadmapLibrary; `RoadmapWorkspace` và `AddToRoadmapDialog` sử dụng.
- Sao chép bộ truyện bắt buộc xem trước rồi xác nhận; gửi đúng NextUp/End, daysPerStory, xử lý partial success, cảnh báo và bước bị bỏ qua. Không tự sinh itemId khi response copy không trả ID. Chuẩn hóa ageBand cho so sánh UI.
- `communityService.ts`, `LibraryWorkspace`, `ModerationDialogs`: kiểm tra điều kiện gửi, xác nhận PII và quyền nội dung; gửi/rút/gỡ riêng; báo cáo qua `/ContentReport` với enum backend.
- `parentAuthoringService.ts`, `useParentAuthoring`, `ParentAuthoringWorkspace`: tạo bản nháp gia đình, cấu hình, lưu version, lịch sử/restore, nhập text/file có preview, kiểm tra, xác nhận nội dung, chuẩn bị, xem trước rồi giao đúng bản cho trẻ; thu hồi quyền đọc.
- `ParentImport` ghim revision và nội dung preview; lệnh chưa rõ kết quả có thể gửi lại cùng operationId. Màn hình không dùng kết quả kiểm tra cũ cho version mới hoặc nội dung đang sửa.
- `GenerateStory` bổ sung trong permission; khả năng soạn thủ công và giao truyện theo quyền hiện có của người giám sát.

## ContentCreator

- `CreatorStories` phân nhánh AI/Manual; editor thủ công giữ kiến trúc cũ, thêm hỗ trợ sáng tác và trạng thái phát hành.
- `CreatorManualMedia` nối `POST /creator/stories/{id}/manual/confirm-content` với versionId/revisionToken đã lưu, theo dõi Phase 5 qua media progress, retry khi job Failed và tải package để xem ảnh/nghe thử. Ghim version của package, khóa sửa khi công việc đang chạy hoặc chưa rõ kết quả; 202 không được coi là media đã xong.
- `creatorInputService`, `useCreatorGeneration`, `CreatorGeneration` nối input/context/progress/retry. Dùng chung snapshot, polling, OutlinePanel và ReviewGate với Studio.
- Xác nhận nội dung dùng `/creator/stories/{id}/generation/confirm-content` với versionId và canConfirmContent. Không gọi approve/archive dành cho Parent.
- Poll media đến trạng thái sẵn sàng. `CreatorPublication` gửi đúng storyVersionId cho PublicStorySubmission, đọc trạng thái, rút yêu cầu, yêu cầu gỡ và tạo revision.
- Bản đã nộp được khóa; sửa bằng revision mới. Status chưa thể hiện đầy đủ lịch sử rút yêu cầu, nên bản Ready được khóa sửa theo hướng thận trọng.

## Assistance cho Parent và Creator

- `parentAssistanceService.ts`, `creatorAssistanceService.ts`, `useAssistance`, `AssistancePanel`: task/context, bước đề xuất, clarification, lựa chọn hướng, trial, đọc lịch sử, cancel/close.
- Không tự gọi AI khi chỉ mở trang. Người dùng chủ động tạo yêu cầu và áp dụng trial.
- `assistancePatch.ts` kiểm tra snapshot, quote, offset UTF-16 và ranh giới surrogate trước khi áp dụng. Bản áp dụng chưa tự lưu; lần lưu version gửi assistanceReferences để backend ghi provenance.
- `authoringGuideService.ts` và `AuthoringGuides` đọc hướng dẫn/render placeholder; không chèn HTML chưa kiểm soát.

## Moderator và Administrator

- `ConnectedModerationQueue` lấy trang theo status/type từ server; claim rồi mở package chuyên biệt bằng `moderationService.ts`, không dùng Story CRUD để thay cho gói kiểm duyệt.
- `ReviewPanel`: PublicStoryReview, CommunitySubmission, RoadmapReview, GrayZoneStory, ContentReport, PublicStoryRemoval; đọc checklist/flags/labels/compare/media khi contract có hỗ trợ; gửi quyết định và rowVersion đúng gói.
- Xung đột 409 tải lại gói; thao tác kết thúc làm mới hàng đợi. Báo cáo escalated có nhánh Administrator; quyền nút theo actor.
- `RoadmapTemplates` và `roadmapTemplateService.ts`: Moderator soạn/sắp thứ tự/lưu/gửi/rút/clone/archive bộ truyện. Administrator xem theo quyền backend. Không đặt công cụ soạn bộ trong menu Creator.
- `RubricWorkspace` và `rubricService.ts`: đọc/tạo/sửa/clone/validate/evaluate/audit; activate theo quyền Administrator, gửi revision.
- `PublishedReviewWorkspace`: xem nguồn PublicLibrary/RoadmapTemplate và chủ động tạo review item. ID báo cáo không được dùng như ID moderation item.

## ChildSession

- `ConnectedKidHome` dùng hồ sơ phiên trẻ, `/MyRoadmap`, thư viện cộng đồng và danh sách truyện gia đình được cấp quyền.
- Đọc truyện thủ công bằng confirmationId; kiểm tra childProfileId, storyVersionId và isReady trước khi mở package. Không dùng storyId để vượt qua quyền đọc.
- Hiển thị văn bản package đã giao. Không giả lập reading session, điểm đọc, quiz hoặc tiến độ từ việc bấm mở truyện.
- KidApp chỉ dùng ConnectedKidHome; nhánh demo và bộ máy local đã được xóa. Các chức năng chưa nối API không tạo dữ liệu giả.

## Cấu hình sử dụng

Ứng dụng sau đợt dọn mock luôn dùng API thật. Trong môi trường chạy/build frontend đặt địa chỉ backend:

```dotenv
NEXT_PUBLIC_API_URL=https://<backend-host>/api/v1
```

`NEXT_PUBLIC_*` được dùng lúc build, cần build lại khi đổi môi trường. Đã xóa cờ và nhánh mock khỏi ứng dụng; giữ nguyên địa chỉ backend, không sửa credential. Backend cần cho phép CORS origin frontend; người kiểm thử dùng tài khoản thật có đúng actor/quyền và dữ liệu sẵn sàng. Chi tiết dọn mock và inventory drift backend tại [core-api-completion.md](core-api-completion.md).

## Kiểm chứng

- `npm run lint`: đạt.
- `npx tsc --noEmit --incremental false`: đạt.
- `npm test -- --run`: 252/252 test, 28 file; có kiểm tra inventory/call site, transport, token trẻ, refresh tạm lỗi, route/payload, roadmap partial success, version/revision, Creator Manual confirm, import FormData, assistance patch, lifecycle SignalR và health.
- `npm run build`: đạt Next.js production build, TypeScript và static page generation.
- `tests/smoke/backend-api-integration.mjs`: Edge headless, API thật bị thay bằng fixture; chặn URL ngoài frontend cục bộ và API fixture. Không gọi backend/database thật.
- Browser smoke đạt 7 kịch bản: Parent (preview/copy roadmap và report), Parent Account (audit, tạo payment, health và SignalR handshake/event → đồng bộ REST), Parent Personal Story (create/update/publish/delete), Moderator (claim/gray-zone decision với rowVersion), ContentCreator AI, ContentCreator Manual, ChildSession (đọc đúng family package với child bearer; viewport mobile/dark).
- Các màn soạn thủ công, assistance, rubric, roadmap authoring và các package moderation còn lại đã typecheck/build và có service/logic test liên quan; chưa có browser smoke đầy đủ từng nhánh hoặc live E2E.
- Kết quả và ảnh của smoke nằm trong `out/api-integration-smoke/` (output bỏ qua bởi Git). Cần Playwright runtime và Edge để chạy script; biến PLAYWRIGHT_MODULE cho phép chỉ định module ngoài project.

## Giới hạn và phụ thuộc backend

1. Phần bổ sung Creator Manual trong source local đã thay thế giới hạn Draft → Ready trước đây và đã được nối frontend. Backend cần triển khai endpoint mới, worker media và provider moderation/media tương ứng; chưa xác nhận môi trường server đã có thay đổi này. Con số 305 endpoint là inventory baseline, chưa bao gồm endpoint Manual bổ sung.
2. Contract hiện tại chưa cung cấp đầy đủ HTTP cho reading session, quiz submission, sổ tay, thành tích, wish, adaptive/Hold Mode/dashboard tương ứng UI demo cũ. Không gửi thành công giả hoặc lấy dữ liệu local để che lỗi ở chế độ thật. CommunityLibrary đang hỗ trợ metadata, chưa có đủ package reader để coi là luồng đọc hoàn chỉnh.
3. Endpoint dành cho webhook/callback AI/hạ tầng không phải thao tác frontend; có DTO không đồng nghĩa phải tạo nút gọi từ browser.
4. Chưa xác nhận live CORS, tài khoản/quyền, dữ liệu, media URL, hàng đợi AI, token rotation hoặc tác vụ bất đồng bộ thật. 202 Accepted chỉ là đã nhận công việc, cần tiếp tục đọc progress.
5. Không sửa backend, migration hoặc database; không chạy seed, không tạo nội dung/tài khoản thật. Chưa commit/push thay đổi.

Nghiệm thu tiếp theo: chạy backend trong môi trường kiểm thử, dùng tài khoản từng actor; thực hiện lần lượt tạo/lưu/check/confirm/prepare/family grant, đọc bằng phiên trẻ, assistance trial/apply, gửi duyệt/claim/decision, media và publication/revision; kiểm tra 401/403/409, operation replay, withdrawal và thu hồi quyền đọc với dữ liệu thật.
