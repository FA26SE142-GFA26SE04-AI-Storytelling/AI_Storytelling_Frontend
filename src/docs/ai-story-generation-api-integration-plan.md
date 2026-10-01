# Kế hoạch kết nối API luồng AI Story Generation – Phase 1–5

Ngày cập nhật: 01/10/2026.

Trạng thái: đã bắt đầu triển khai contract và luồng điều phối Phase 1–5; chưa xác nhận chạy end-to-end có đăng nhập.

## Tiến độ triển khai ngày 01/10/2026

### Đã triển khai

- Đồng bộ DTO outline, generation, review và media theo backend; chuẩn hóa lỗi API và kiểm tra shape progress trước khi chuyển bước.
- Outline dùng versionNo, các trường ba hồi và key đúng contract; regenerate theo dõi version mới thay vì nhận version cũ.
- Lịch sử dàn ý trong bước Cốt truyện và các bước sau: mở để gọi GET danh sách phiên bản, chọn để gọi GET chi tiết, tải lại và xem ba hồi ở chế độ chỉ đọc. Không thay đổi phiên bản hiện hành hoặc enqueue job; hủy request khi đóng lịch sử, đổi story hay unmount.
- Content/media bỏ hoàn tất theo tick và phần trăm giả; content xử lý nhánh auto-publish, media chỉ mở đọc sau xác minh isReady và version của package.
- Giao diện tiến trình tách hai giai đoạn: viết/kiểm tra nội dung truyện trước, sau đó tạo học liệu. Chỉ hiện các thẻ từ vựng/câu đố/trò chuyện khi backend trả `content = stable` và `stableStoryVersionId` hợp lệ; chuyển giao tự động theo backend, không thêm request hay bước duyệt mới. Khi content lỗi, chưa hiển thị nút xem học liệu.
- Review tải riêng từng artifact, lưu chỉnh sửa với versionId, tạo/xem/apply/discard proposal thật, complete và validation trước approve; approve lỗi không chuyển bước.
- Sau khi lưu nội dung thành version mới, hiển thị học liệu còn thiếu và chặn approve; người dùng có thể tạo phần còn thiếu cho đúng storyVersionId rồi xem lại. Preview đề xuất đọc cả camelCase/PascalCase. CreativeControls tách hook và hủy context/submit/outline request khi đổi hồ sơ trẻ.
- Poll tuần tự có AbortSignal, timeout và kiểm tra lại; khôi phục từ storyId/requestId theo tài khoản và child trong sessionStorage, sau đó xác định bước từ backend. Không lưu creative input; nếu khôi phục request failed thì người dùng cần nhập lại ý tưởng để submit mới trên draft, thay vì retry bằng payload không đầy đủ.
- Xóa workflow snapshot khi đăng xuất; cho phép người dùng chủ động bắt đầu câu chuyện khác mà không tự hủy job backend.

### Còn cần xác minh/hoàn thiện

- Smoke test có đăng nhập và kiểm tra Network/log worker trên luồng thật, gồm double-click, đóng/mở overlay, regenerate, proposal, approve và auto-publish.
- Test vòng đời component/hook trên trình duyệt: các test hiện có chủ yếu kiểm tra contract, điều kiện chuyển bước và session isolation, chưa thay thế kiểm thử UI.
- Phần reader đa phương tiện: đã nối readiness/package gate trước mở sách; chưa tích hợp toàn bộ illustration beats vào trang đọc. Contract media package hiện có URL tranh nhưng không có URL audio; StoryDto cũng không cung cấp danh sách audio segments. Cần đối chiếu endpoint đọc/audio sẵn có hoặc ghi nhận yêu cầu backend riêng, không tự tạo URL hay sửa backend trong phạm vi này.
- Hạn chế retry Vocabulary/Quiz/Discussion sau stable content vẫn tồn tại ở backend; frontend hiển thị không thể thử lại tại bước đó thay vì tạo truyện khác để né giới hạn.

### Xác minh đã thực hiện trong lượt triển khai

- 65 test frontend pass (contract, chuyển bước, input utilities, session isolation, render giao diện content trước/learning sau, lịch sử dàn ý, casing proposal, học liệu version mới và cancellation context theo child).
- TypeScript check, lint và build frontend đạt; production build đọc cấu hình `.env.local` của môi trường local hiện tại, không phải xác minh cấu hình deployment production.
- Backend local cổng 5259 phản hồi HTTP 401 cho GET generation progress không có token: xác nhận máy chủ có phản hồi, không phải smoke test generation có đăng nhập.
- 118 backend unit test liên quan pass bằng `dotnet test --no-build --no-restore`, sử dụng assembly đã build sẵn; không build hoặc sửa backend.
- Không chạy migration/database update hoặc commit.

### Sửa backend theo yêu cầu riêng sau review

- Lỗi retry content: job mới không dùng lại StoryVersionId của candidate thất bại; giữ lịch sử và idempotency key.
- Lỗi áp dụng đề xuất học liệu: đề xuất mới serialize camelCase; ProposalService chuẩn hóa casing khi đọc đề xuất cũ trong cache trước khi apply. Không đổi endpoint hay schema.
- Build và chạy 72 test backend liên quan (review, validation, content generation và workflow Phase 1–4) đạt, bao gồm hồi quy apply vocabulary/quiz/discussion cũ và mới. Dùng output build riêng để không dừng API đang chạy.
- Cần restart/rebuild backend local để nạp code mới và smoke test có đăng nhập; chưa apply proposal hoặc gửi retry trên dữ liệu thật. Không chạy migration/database update.

## 1. Mục tiêu và phạm vi

Kết nối đầy đủ luồng tạo truyện AI từ ý tưởng đến đọc truyện trong overlay hiện có của frontend.

- Lấy DTO, controller và luồng xử lý backend làm nguồn chuẩn.
- Chỉ sửa frontend; không thay đổi backend, API, database hoặc tạo/chạy migration.
- Chỉ triển khai nhánh tạo truyện AI từ ý tưởng. Giữ tương thích các thành phần dùng chung với nhánh nhập truyện có sẵn.
- Không tạo route trang phẳng mới ngoài kiến trúc phòng 3D.
- Frontend chỉ chuyển bước dựa trên trạng thái backend; không dùng timer, phần trăm giả hoặc HTTP thành công đơn thuần để kết luận hoàn tất.

## 2. Căn cứ đối chiếu backend

Các đường dẫn dưới đây tính từ repository `AI_Storytelling_Backend` bên cạnh frontend:

- `src/Core/StoryPlatform.Application/Features/AIStoryInput/Services/AIStoryInputService.cs`
- `src/Core/StoryPlatform.Application/Features/Outline/Services/OutlineService.cs`
- `src/Core/StoryPlatform.Application/Features/ContentGeneration/Services/ContentGenerationService.cs`
- `src/Core/StoryPlatform.Application/Features/ExistingStories/Services/StableVersionArtifactHandoffService.cs`
- `src/Core/StoryPlatform.Application/Features/StoryReview/Services/StoryReviewService.cs`
- `src/Core/StoryPlatform.Application/Features/MediaGeneration/Services/MediaGenerationService.cs`
- `src/Core/StoryPlatform.Application/Features/MediaGeneration/Services/MediaReadinessService.cs`
- Các DTO/controller tương ứng và worker trong `src/Core/StoryPlatform.Infrastructure/BackgroundServices/`.

### Chuỗi enqueue → worker → cập nhật trạng thái

1. Input guardrail được xử lý trong request submit. Khi cho phép, backend lưu `input_accepted` và enqueue `GenerateOutline`; chưa có nghĩa outline đã hoàn tất.
2. Outline worker nhận job, sinh và lưu version, chuyển story sang `outline_review`.
3. Approve outline enqueue `GenerateContent`. Story vẫn ở `outline_review` trong lúc sinh nội dung và học liệu.
4. Content worker lưu/promote nội dung ổn định, handoff sang Vocabulary → Quiz → Discussion. Sau discussion, story chuyển sang `content_review`.
5. Backend có thể tự duyệt theo policy. Khi đó story chuyển tiếp sang `Approved` mà frontend có thể không quan sát được thời điểm `content_review`.
6. Approve nội dung enqueue media và đặt story thành `Approved`. Media worker nhận job mới đặt `MediaProcessing`.
7. Backend kiểm tra readiness của illustration beats, audio và asset cần kiểm duyệt; chỉ khi đạt mới đặt `Ready`.

## 3. Đồng bộ contract Phase 1–5

### Phase 1 – AI Story Input & Safety Guardrail

Đồng bộ `AIStoryInputContextDto`, `SubmitAIStoryInputRequestDto`, `RetryAIStoryInputRequestDto`, `AIStoryInputProgressDto`.

- Dùng `childNickname`, `interests`, `maximumLength`, `defaultLanguage`.
- Bao gồm vocabulary level, category codes, approval mode, handoff status, `attemptCount`, `maxAttempts`, `canRetry`.
- Submit gồm đúng các trường: `topic`, `genre`, `characterMode`, `characters`, `settingMode`, `setting`, `lesson`, `vocabularyLevel`, `language`, `targetLength`, `childProfileId`, `existingStoryId`, `idempotencyKey`.
- Retry gửi đầy đủ creative input cùng `retryKey`, không chỉ gửi `newPrompt`.
- Ánh xạ `topicPrompt` sang `topic`; lấy mặc định từ context; giới hạn độ dài không vượt `maximumLength`.
- Có nhân vật: `characterMode = "specified"`; không có: `"ai_suggested"`.
- Chưa có trường bối cảnh trên UI: `settingMode = "ai_suggested"`.

### Phase 2 – Outline

- Dùng `versionNo`, `title`, `opening`, `development`, `ending`; bỏ contract `versionNumber`, `nodes`, `synopsis` cũ.
- Edit gửi `title`, `opening`, `development`, `ending`.
- Regenerate/retry gửi `operationKey`; approve gửi `approvalKey`.
- Progress sử dụng `storyStatus`, `currentVersion`, `activeOperation`, `activeJobStatus`, `lastErrorCode`.

### Phase 3 – Content và học liệu

- Dùng `currentStep`, `content`, `vocabulary`, `quiz`, `discussion`, `isComplete`, `stableStoryVersionId`, `qualityFailure`, `lastErrorCode`.
- Không dùng contract giả `progressPercentage` hoặc `status = Completed` thay cho DTO thực.
- Retry gửi `retryKey` và tuân thủ điều kiện backend.

### Phase 4 – Review

- Package tổng quan là dữ liệu phẳng; không giả định có nested story/artifact đầy đủ.
- Tải và cập nhật từng phần qua API story, vocabulary, quiz, discussion.
- Sửa đổi gắn đúng `versionId`; dùng cấu trúc `items` đúng từng artifact.
- Tích hợp complete, validation, approve, archive và proposal apply/discard.

### Phase 5 – Media

- Dùng `jobStatus`, `storyStatus`, `approvedStoryVersionId`, `isReady`, số lượng thực và danh sách asset thiếu/cần kiểm duyệt.
- Lấy package media thật; không tạo scene, URL hoặc số lượng fallback giả.
- Không đồng nhất số scene với số illustration beats hoặc audio segments.

Chuẩn hóa trạng thái tại adapter: outline/content trả snake_case, còn review/media có PascalCase. Không thay đổi format backend.

## 4. Hoàn thiện lớp API service

Các file chính: `src/app/types/aiStory.ts`, `src/app/services/aiStoryCreationService.ts`.

- Ánh xạ đúng route, method, request và response theo controller.
- Chuẩn hóa `ProblemDetails`, lỗi `400`, `401`, `403`, `404`, `409` và lỗi mạng.
- Không trả mock khi API thất bại; không che lỗi xác thực/phân quyền.
- Response rỗng chỉ được chấp nhận ở endpoint chủ động trả `202` không body, ví dụ regenerate illustration beat. Endpoint yêu cầu DTO phải xác minh dữ liệu trả về.
- Dùng `crypto.randomUUID()` cho key. Giữ key ổn định khi gửi lại cùng thao tác; tạo key mới khi người dùng thực sự tạo thao tác mới.
- Khóa thao tác ngay khi bắt đầu request để chống double-click.
- Hỗ trợ `AbortSignal` và loại bỏ response cũ khi đổi child/story, tạo request mới hoặc đóng overlay.
- Khi kết quả mutation chưa rõ do mất mạng, kiểm tra progress trước khi tạo thao tác mới để tránh enqueue trùng.

## 5. Quy tắc điều phối chuyển bước

1. `input_accepted`: chuyển sang chờ outline, chưa cho duyệt.
2. Outline sẵn sàng: hiển thị review outline; xác minh trạng thái story/version và không còn outline job đang hoạt động.
3. Approve outline thành công: chuyển sang màn chờ content và học liệu; chưa coi nội dung đã hoàn tất.
4. `content_review` cùng `isComplete = true`: chuyển sang review nội dung.
5. `approved` hoặc `media_processing`: chuyển sang media, kể cả khi content progress trả `isComplete = false` do auto-publish.
6. `ready`: xác minh media progress có `isReady = true`, sau đó mới cho mở đọc.
7. `rejected` hoặc `archived`: dừng luồng và thông báo.

Khi khôi phục phiên, trạng thái backend ưu tiên hơn bước lưu ở frontend. Không dùng `handoffStatus = pending_dispatch` của Phase 1 để suy ra worker đã hoàn tất.

## 6. Sửa riêng luồng outline

File chính: `src/app/components/closet/steps/Step2A_AiPromptAndOutline.tsx` và `subcomponents/ThreeActsOutlineView.tsx`.

- Sau regenerate, ghi nhận version trước thao tác và theo dõi job/version mới; không dừng polling chỉ vì `currentVersion` tồn tại.
- Chặn sửa/duyệt trong lúc outline job hoạt động.
- Khi job thất bại, hiển thị lỗi và retry outline đúng endpoint; không tiếp tục polling vô hạn.
- Không hiển thị văn bản outline giả khi trường backend thiếu hoặc rỗng.
- Giữ Step2A là component điều phối; tách form/status/hook chuyên biệt.

## 7. Bỏ tiến độ giả ở content và media

### Content

File chính: `src/app/components/closet/steps/Step3_MaterialGenProgress.tsx`.

- Bỏ đánh dấu vocabulary/quiz/discussion hoàn tất theo số tick.
- Hiển thị trạng thái tác vụ từ response: chờ, đang sinh, thất bại, hoàn tất.
- Xử lý trạng thái downstream của auto-publish trước điều kiện `isComplete`.
- Nội dung ổn định chưa đồng nghĩa học liệu đã hoàn tất.

### Media

File chính: `src/app/components/closet/steps/Step5_MediaProductionProgress.tsx`.

- Bỏ điều kiện phần trăm đạt 100 hoặc đủ số tick để mở đọc.
- Chỉ mở đọc khi `isReady = true`.
- Hiển thị asset thiếu và trường hợp cần kiểm duyệt bằng thông điệp thân thiện.
- Nếu có phần trăm, chỉ phục vụ hiển thị, không quyết định chuyển bước. Không suy ra tổng audio từ tổng scene.
- Khi mở đọc, dùng story/media thật tương ứng với story và version đã được backend xác nhận.

## 8. Hoàn thiện review và retry

File chính: `src/app/components/closet/steps/Step4_ReviewAndFineTune.tsx`.

- Tải nội dung/artifact thật; lưu sửa đổi qua API tương ứng.
- Thực hiện complete và validation trước approve; hiển thị các vấn đề chưa đạt.
- Partial edit dùng proposal thật: lấy kết quả, xem trước, apply hoặc discard; không dùng snippet/timer giả.
- Approve lỗi giữ nguyên màn review, không gọi chuyển sang media trong nhánh lỗi hoặc catch.
- Tôn trọng `canEdit`, `canApprove`, `canArchive` và kiểm tra version sau sửa đổi.

### Quy tắc retry theo phase

- Input: chỉ retry khi `input_check_failed && canRetry = true`.
- Input bị blocked: cho sửa và submit request mới trên draft hiện tại; không gọi retry endpoint.
- Outline: dùng endpoint retry và `operationKey` đúng điều kiện backend.
- Content: dùng generation retry với `retryKey`, không tự tạo story mới.
- Media: worker có retry tự động; frontend không gọi retry liên tục. Thao tác retry thủ công phải xử lý xung đột với job đang chạy.

### Hạn chế backend cần giữ rõ trong bàn giao

Generation retry hiện yêu cầu current version là outline đã duyệt và chưa có content. Sau khi nội dung ổn định đã được promote, lỗi Vocabulary/Quiz/Discussion có thể bị retry trả `409`.

- Không cam kết frontend retry được mọi lỗi Phase 3.
- Hiển thị lỗi/khả năng phục hồi trung thực, không tự sinh lại hoặc tạo story khác để né giới hạn.
- Nếu cần phục hồi đầy đủ các artifact ở trạng thái này, ghi nhận thành yêu cầu backend riêng và xin phạm vi mới; không sửa backend trong kế hoạch này.

## 9. Polling và khôi phục phiên

Tách hook điều phối cùng hook polling dùng chung, giữ component dưới giới hạn kiến trúc dự án.

- Poll tuần tự khoảng 1,5–2 giây, không để request chồng nhau.
- Phase 1 chỉ poll khi `pending_input` hoặc `checking_input`.
- Các phase worker chỉ tiếp tục theo dõi khi còn đang chờ/xử lý, hoặc đang xác minh handoff sau mutation.
- Dừng khi unmount, đổi child/story hoặc đạt trạng thái cuối.
- Có giới hạn thời gian phù hợp từng phase; timeout chỉ dừng theo dõi ở frontend, không coi backend job đã bị hủy.
- Có nút “Kiểm tra lại trạng thái”; lỗi mạng không tự chuyển bước.
- Lưu `storyId`, `requestId` và bước tham chiếu trong `sessionStorage`; phân vùng theo tài khoản và child, xóa khi đăng xuất.
- Không lưu token hoặc toàn bộ creative input/nội dung trẻ vào workflow snapshot nếu không cần thiết.
- Khi mở lại overlay, đọc progress backend để xác định bước thực tế; không submit lại chỉ vì component được mount lại.

## 10. Kết nối môi trường và điều kiện runtime

- Next.js project nằm trong `src`; dùng `src/.env.local` cho local: `NEXT_PUBLIC_API_URL=http://localhost:5259/api/v1`.
- Production dùng biến môi trường deployment riêng; không đóng gói URL localhost vào production build.
- URL public được đưa vào build frontend; khởi động/build lại khi thay đổi cấu hình.
- Kiểm tra backend local, token, CORS và các provider AI/media thực sự hoạt động trước smoke test.
- Source cấu hình đã đối chiếu bật media worker, nhưng cấu hình runtime có thể bị override. Không coi cấu hình source là bằng chứng worker đang chạy.
- Phân biệt API đã nhận request với worker đã xử lý xong. Frontend không được tự chuyển bước khi worker/provider không hoạt động.

## 11. Thứ tự triển khai

1. DTO, adapter và API service Phase 1–5.
2. Hoàn thiện Phase 1, outline và chống enqueue trùng.
3. Content/artifact progress thật, nhánh auto-publish và lỗi/retry.
4. Review, persistence của chỉnh sửa, proposal, complete và validation.
5. Media progress/package/readiness và mở đọc dữ liệu thật.
6. Khôi phục phiên, cleanup polling và xử lý đổi hồ sơ/tài khoản.
7. Kiểm thử tự động, lint, build và smoke test local.

## 12. Kiểm thử và xác minh trước bàn giao

### Các trường hợp bắt buộc

- Context ánh xạ đúng; submit hợp lệ trả `storyId` và `requestId`.
- Payload đúng DTO; không phát sinh HTTP 400 do tên trường hoặc cấu trúc frontend sai.
- Double-click không tạo hai story/job; gửi lại cùng thao tác giữ key.
- Accepted chỉ chuyển sang chờ outline; blocked/failed không chuyển bước sai.
- Regenerate vẫn trả version cũ trong lúc worker chạy: frontend tiếp tục chờ kết quả mới.
- Content và học liệu không hoàn tất theo thời gian giả.
- Auto-publish đi thẳng sang media, không kẹt do `isComplete = false`.
- Retry hợp lệ, retry bị `409`, lỗi mạng, hết quyền và dữ liệu response thiếu.
- Review chỉnh sửa được lưu thật; proposal apply/discard đúng version.
- Approve thất bại không chuyển bước.
- Media có tiến độ hiển thị cao nhưng `isReady = false`: không mở đọc.
- Thiếu beats/audio hoặc có manual-review asset: hiển thị đúng, không fake ready.
- Đóng/mở overlay, đổi child/story hoặc đăng xuất không nhận response cũ và không enqueue lại ngoài ý muốn.
- Khôi phục phiên xác định đúng bước từ backend, kể cả khi worker đã chạy tiếp lúc overlay đóng.

### Lệnh và smoke test

- Chạy test frontend theo script trong `src/package.json`.
- Chạy `npm run lint` và `npm run build` trong `src`.
- Chạy backend unit test liên quan nếu môi trường/quyền cho phép: `AIStoryInputServiceTests`, `Phase1To4SequentialWorkflowTests`, `ContentGenerationServiceTests` và các test review/media hiện có.
- Smoke test frontend với backend local qua `NEXT_PUBLIC_API_URL`, bằng tài khoản và child có quyền phù hợp.
- Kiểm tra Network tab: context, submit, progress, outline mutations, generation retry, review và media đúng payload/status.
- Đối chiếu log worker theo story/job với response progress để xác nhận handoff thực tế.
- Không chạy migration hoặc database update. Không commit khi chưa được yêu cầu.

## 13. Definition of Done

- Luồng AI từ ý tưởng đến đọc truyện sử dụng API và dữ liệu thật.
- Request/response khớp backend DTO/controller.
- Frontend chuyển bước theo trạng thái backend, xử lý cả nhánh manual review và auto-publish.
- Không còn timer/fallback giả để kết luận thành công hoặc che lỗi.
- Polling, idempotency, hủy theo dõi và khôi phục phiên không gây enqueue trùng hoặc cập nhật sai story/child.
- Test frontend, lint và build đạt; ghi rõ kết quả và giới hạn smoke test/backend test nếu chưa thực hiện được.
- Hạn chế retry artifact của backend được ghi rõ trong bàn giao; không thay đổi ngoài phạm vi frontend.
