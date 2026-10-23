# Kế hoạch kết nối API backend với frontend

Ngày: 21/10/2026. Trạng thái: **Đã được yêu cầu triển khai; các hạng mục kết nối bên dưới đã được triển khai ở frontend**.

Kết quả và giới hạn nghiệm thu: [backend-api-integration-result.md](backend-api-integration-result.md). Các phần hiện trạng dưới đây giữ nguyên làm căn cứ trước triển khai; chưa nghiệm thu API thật có đăng nhập.

Mục tiêu là nối các luồng có backend thật vào giao diện Taletale hiện có, giữ kiến trúc frontend và phân biệt rõ dữ liệu backend với chức năng demo. Triển khai theo từng đợt có kiểm thử và nghiệm thu; không viết lại ứng dụng hoặc thay đổi backend để khớp DTO giả định của frontend.

## 1. Căn cứ và hiện trạng

- Frontend được khảo sát tại `main`, HEAD `93d00ef`; working tree sạch trước khi tạo kế hoạch này.
- Backend contract: [API_FRONTEND_ACTOR_FLOWS.md](../../../AI_Storytelling_Backend/docs/API_FRONTEND_ACTOR_FLOWS.md), snapshot `feat/cont_creator`, HEAD `e808851`, gồm **305 method + route / 48 controller**.
- Quy tắc bắt buộc: [AGENTS.md](../AGENTS.md). Kế hoạch AI cũ [ai-story-generation-api-integration-plan.md](ai-story-generation-api-integration-plan.md) chỉ dùng làm lịch sử; tên file/màn hình cũ và kết luận contract phải đối chiếu lại.
- Lần này khảo sát source để lập kế hoạch. Chưa thay code, chưa chạy lại test/build hoặc kiểm thử API có đăng nhập.

Các điểm ảnh hưởng trực tiếp đến cách triển khai:

1. `apiClient.ts` đang trả `ApiResponse<T>` nhưng không giữ HTTP status và chưa có AbortSignal trong options; `aiStoryCreationService.ts` và `creatorService.ts` có parser riêng. Hợp nhất hành vi dần qua adapter, không thay tất cả service cùng lúc.
2. `authService.authenticatedFetch` refresh khi nhận 401 kể cả với customToken. `childAccessService.getSessionProfile` đi qua nhánh này, trong khi checkSession đã có đường riêng tránh refresh người lớn. Cần thống nhất quy tắc theo ngữ cảnh phiên.
3. `guardianService`, `readingService` và `adaptiveService` dùng biến backendReady ở mức module và có thể chuyển sang local sau lỗi đầu. Một endpoint chưa có không được khiến roadmap/report đã có backend bị chuyển local.
4. Roadmap UI đã tồn tại nhưng gọi route giả định `/children/{id}/roadmap`, `/roadmap/items`, `/roadmap-templates`; backend hiện có ChildRoadmap/RoadmapLibrary/MyRoadmap và DTO khác.
5. `Moderation.tsx` gọi queue không truyền status, lọc tab ở client và dùng Story CRUD để xem truyện; chưa nối package/decision theo itemType.
6. `StaffApp.tsx` đặt CreatorTemplates trong ContentCreator; backend RoadmapTemplate cho Moderator tạo/sửa. Phải chỉnh cấu hình trang theo role trong shell hiện hữu trước khi nối API.
7. `CreatorStories.tsx` đang mở CreatorEditor theo storyId cho mọi truyện. Cần phân nhánh Manual/AI, dùng canConfirmContent và publication lock từ backend.
8. Community dialog có checkbox bản quyền/PII nhưng `submitCommunity` hiện chỉ gửi storyId/piiAttested tới route giả định. Report đang gửi enum snake_case tới `/content-reports`.
9. Permission frontend có 7 giá trị, thiếu GenerateStory. USE_MOCK mặc định bật; test được cấu hình mock=false nhưng điều đó không chứng minh ứng dụng triển khai đang dùng API thật.

## 2. Ranh giới kiến trúc phải giữ

Luồng dữ liệu tiếp tục là: **màn hình → hook nghiệp vụ khi có nhiều bước → service/adapter → API client → backend**. Response đi ngược qua adapter trước khi vào state giao diện.

- Giữ Next.js App Router với route ứng dụng `/`, `page.tsx`, bảng VIEWS và điều hướng workspace. Không tạo hệ route thay thế hoặc đổi sang framework khác.
- Giữ `components/shell`, `StaffApp`, `WorkspaceProps`, AuthContext, ThemeContext và WorkspaceDataContext. WorkspaceDataContext tiếp tục quản lý hồ sơ/truyện dùng chung, không trở thành kho state cho mọi chức năng.
- Gọi HTTP ở `app/services/`; không thêm fetch trong JSX/component hoặc hooks giao diện. Các luồng tạo/duyệt truyện dùng `features/story-workflow/`; hook lộ trình/kiểm duyệt đặt cạnh feature liên quan.
- DTO backend đặt trong `app/types/`. View model phục vụ UI có thể giữ hình dạng hiện tại nếu chuyển đổi không làm mất quyền, cảnh báo, trạng thái hoặc ID quan trọng.
- Adapter nằm trong service tương ứng hoặc file nhỏ cùng `services/`; không dựng thêm tầng repository/use-case cho toàn ứng dụng, không thêm Redux/Zustand/React Query để hoàn thành đợt này.
- Giữ CSS cạnh feature, token màu, theme sáng/tối, tiếng Việt, lucide-react và motion hiện có. Component quá khoảng 250 dòng cần tách theo vùng giao diện.
- Giữ alias import `@/app/...` ngoài cùng thư mục. Trước khi viết code Next/React, đọc hướng dẫn liên quan trong `node_modules/next/dist/docs/` theo AGENTS.md.
- Chỉ sửa frontend. Backend, database, migrations, seed và cấu hình triển khai không thuộc thay đổi này.

Giữ kiến trúc không có nghĩa giữ nguyên menu sai role hoặc ép mọi DTO mới vào type cũ. Điều chỉnh nhỏ được phép khi cần phản ánh đúng contract; ghi rõ ảnh hưởng tại từng đợt.

## 3. Quy tắc kết nối và chuyển đổi dữ liệu

### 3.1 Transport và phiên

Mở rộng apiClient theo cách tương thích ngược: giữ các field hiện dùng, bổ sung HTTP status khi có response, ngữ cảnh `adult/child/anonymous`, AbortSignal và cách nhận JSON/body rỗng/binary theo endpoint. Không đưa các chính sách riêng của truyện hoặc moderation vào transport.

- Adult refresh dùng cơ chế refreshPromise hiện có, tối đa một lần retry cho request; không refresh với 403/409.
- Child 401 kết thúc/xử lý phiên trẻ, không refresh bằng token adult và không xóa phiên adult đang tồn tại.
- Không có token trẻ hợp lệ thì không ngầm gửi token adult thay thế. Anonymous không tự gắn token đã lưu.
- Phân biệt lỗi mạng, HTTP và business success; HTTP lỗi không thành công chỉ vì envelope có success=true. Không loại bỏ data progress trên response lỗi.
- Chấp nhận data=null/bool/0 khi endpoint cho phép; 202 body rỗng chỉ ở endpoint quy định. File/ZIP không đi qua parser JSON.
- Giữ creatorService trả CreatorResult trong giai đoạn chuyển đổi; giữ public API đang được các màn hình sử dụng. Chỉ dùng parser chung khi đã có test hồi quy cho khác biệt hiện tại.

### 3.2 DTO và adapter

Tách DTO nhận qua mạng khỏi dữ liệu UI giả định. Ví dụ roadmap:

- `next/end` của UI → `NextUp/End` khi gửi backend.
- `dueDays` → `expectedDays`; copy bộ dùng `daysPerStory` thay `daysPerStep`.
- ChildRoadmapDto.open/waiting/history → danh sách UI với `Waiting → queued`, `Open → open`, `Completed → completed`; giữ isStoryAvailable, skipCode, warnings và số đếm backend.
- Không bịa createdAt/sourceTemplateId/length nếu backend không trả. Cho phép nullable/optional hoặc chỉnh vùng UI cần dữ liệu đó.
- `results[]` và `children[].steps[]` phải giữ từng kết quả, cảnh báo và thao tác thực. Không biến một response 200 thành thông báo mọi trẻ đã được thêm thành công.
- Phân biệt storyId, versionId, versionNo, itemId và submissionId. Không dùng ID giả để lấp dữ liệu còn thiếu.

### 3.3 Mock và chức năng chưa có backend

USE_MOCK chỉ chọn demo một cách chủ động. Khi mock=false, lỗi backend phải đi ra trạng thái lỗi của màn hình; không tự gọi local để giả thành công. Loại bỏ cơ chế backendReady quyết định cho toàn module ở các luồng được nối.

Các service mới có mock tương ứng trong `mocks/` theo AGENTS.md. Local engine hiện tại chỉ còn phục vụ demo hoặc chức năng đã được ghi rõ chưa đồng bộ; API thật không ghép thêm bản ghi/notification local như thể cùng nguồn server.

### 3.4 Trạng thái bất đồng bộ và thay đổi phiên

Giữ key của cùng thao tác khi replay; giữ operationId/revisionToken/baseVersionId/taskRevision theo đúng họ contract. Sau timeout mutation, tải trạng thái/receipt trước khi gửi lệnh mới. 409 giữ nội dung đang sửa và tải lại phiên bản để đối chiếu.

Tái sử dụng polling tuần tự hiện tại, bổ sung guard tài khoản/role/child/story/version và AbortSignal. Đổi context, logout, đóng màn hình hoặc unmount phải loại response cũ. WaitingForModeration là chờ quyết định, không tự coi job lỗi hoặc tự retry; 202 không đồng nghĩa Ready/Published.

## 4. Các đợt triển khai

### Đợt 0 Chốt baseline và danh mục kết nối

Phạm vi: tài liệu và kiểm tra kiến trúc, trước mọi thay đổi chức năng.

- Đối chiếu lại 60 endpoint mới bổ sung, từ service đến hook/màn hình. Cập nhật phân loại CHƯA_RÀ_FRONTEND trong tài liệu tích hợp phía frontend.
- Lập checklist theo method/route/actor: service, DTO, adapter, call site, mock, test, trạng thái nghiệm thu. Route đã có service vẫn phải có đường đi UI được kiểm tra.
- Đánh dấu rõ API đang dùng, cần nối, trùng phương án, legacy, alias và server-to-server; không tạo 305 nút hoặc 305 hàm service chỉ để đủ số.
- Chạy baseline test, typecheck, lint và build bằng cấu hình frontend hiện có; ghi riêng lỗi có sẵn. Không mở/hiển thị nội dung file chứa secrets.

Đầu ra: baseline có thể so sánh, danh sách file cần sửa và checklist không có route mất dấu.

### Đợt 1 Củng cố API client và cách chọn nguồn dữ liệu

File chính: [apiClient.ts](../app/services/apiClient.ts), [authService.ts](../app/services/authService.ts), [childAccessService.ts](../app/services/childAccessService.ts), [apiConfig.ts](../app/services/apiConfig.ts), các wrapper guardian/reading/adaptive và kiểu response liên quan.

- Thực hiện quy tắc ở mục 3.1; không đổi chữ ký tất cả consumer trong một commit.
- Bổ sung test thực tế cho refresh đồng thời, child 401 khi adult đang đăng nhập, anonymous, abort và error payload có progress.
- Tách trạng thái khả dụng theo chức năng; chức năng chưa có API không vô hiệu hóa chức năng đã nối.
- Kiểm tra hồi quy auth, upload FormData, tải file và generation trước khi chuyển đợt.

Nghiệm thu: lỗi 401/403/409/500/offline của API thật không tạo ghi local hoặc thông báo thành công; phiên trẻ không được gửi lại bằng adult token.

### Đợt 2 Hoàn thiện tài khoản và quyền Parent

File chính: service account/childProfile/supervision/childAccess hiện có; `types/supervision.ts`, `features/children/useMyRole.ts`, `features/children/`, `features/account/`, `features/studio/` và context liên quan.

- Giữ các API đã map, bổ sung khoảng trống phát hiện ở đợt 0: profile lifecycle, learning/safety, invitation/ownership/permission và các màn tài khoản đang dùng.
- Bổ sung GenerateStory trong type, màn quyền và điều kiện tạo truyện; đọc lại quyền hiện hành khi đổi trẻ hoặc quyền bị thu hồi.
- Xử lý Owner/AdditionalSupervisor bằng quan hệ/quyền; không suy chỉ từ JWT Parent hoặc trạng thái menu.
- Không thay selection hồ sơ và dữ liệu dùng chung bằng state mới cạnh tranh WorkspaceDataContext.

Nghiệm thu: Owner và supervisor có/thiếu quyền đi đúng nhánh, 403 từ backend hiển thị đúng, không mất hồ sơ/luồng đăng nhập hiện có.

### Đợt 3 Kết nối lộ trình và bộ truyện mẫu

Bổ sung `types/roadmap.ts`, `services/roadmapService.ts`, `services/roadmapTemplateService.ts` và mock tương ứng. guardianService giữ vai trò facade cho màn hiện tại; delegate sang service chuyên biệt thay vì tiếp tục mở rộng file quá lớn.

- RoadmapWorkspace/AddToRoadmapDialog: nối ChildRoadmap list/add/remove/order/clear; thêm phản hồi partial success và warnings, trạng thái không khả dụng, loading/error đúng nguồn.
- RoadmapLibrary list/detail → preview → copy; giữ phân trang và mọi bước bị bỏ qua. Preview không phải giữ chỗ; copy có thể trả kết quả khác.
- KidHome lấy MyRoadmap bằng ChildSession, giữ isLocked và hạn đọc từ backend; không dựng childProfileId tùy ý trong request.
- Tách phần soạn bộ mẫu khỏi menu Creator và đăng ký cho Moderator trong StaffApp. Administrator được xem theo quyền; không hiện nút ghi chỉ dành Moderator.
- Moderator dùng RoadmapTemplate list/candidates/create/update/items/submit/withdraw/clone/archive. Không gọi API tạo bộ bằng phiên Creator để né thay đổi menu.
- Reviewer dùng RoadmapReview package/checklist/approve/request-changes/reject; nối vào dispatch moderation ở đợt 4. Clone có thể thay thế bộ Published nguồn.

Nghiệm thu: thêm cho nhiều trẻ có thể thành công một phần; reorder chỉ Waiting; clear giữ history; thiếu AssignActivity không ghi được; bộ nguồn bị thay thế và copy/preview được tải lại đúng trạng thái. Soạn/duyệt bộ chỉ hoàn tất sau khi package moderation đợt 4 sẵn sàng.

### Đợt 4 Kết nối kiểm duyệt và rubric

File chính: [Moderation.tsx](../app/features/staff/Moderation.tsx), [staffService.ts](../app/services/staffService.ts), StaffApp; bổ sung types/service theo nhóm và panel nhỏ trong `features/staff/`. Hook claim/decision đặt cạnh feature, không gộp vào shell.

- Tách query cho tab Pending/Claimed/đã xử lý/Escalated theo status backend hỗ trợ, có phân trang; không lọc từ một trang Pending để dựng mọi tab.
- Dispatch đủ 6 itemType: PublicStoryReview, RoadmapTemplateReview, CommunitySubmission, GrayZoneStory, ContentReport, PublicStoryRemoval.
- Sau claim, đọc package chuyên biệt; không dùng Story CRUD làm nguồn thay thế package đã mask hoặc bỏ qua claim/checklist.
- PublicStoryReview nối view/audio/checklist/flags/labels/compare và quyết định; chỉ mở approve theo gates từ backend.
- Roadmap/Community dùng blockers; PublicStoryReview dùng approveBlockers. GrayZone decision xử lý body success/message không có data và giữ rowVersion/fingerprint conflict.
- ContentReport dismiss/archive/escalate; Escalated chỉ Administrator quyết định. Removal Creator dùng endpoint riêng và rowVersion, không thay bằng report/archive.
- Rubric service/panel riêng: list/detail/active/create/update/delete/clone/validate/evaluate/audit; activate chỉ Administrator. Đặt trong StaffApp theo role, không biến prompt catalog/test run local thành rubric backend bằng cách đổi nhãn.
- Evaluate là thao tác AI có chủ đích; không tự chạy trong effect hoặc khi mở màn hình. Dùng revision và snapshot/hash thực.

Nghiệm thu: claim hết hạn/cấm tự duyệt/stale revision giữ an toàn nội dung; mỗi item mở đúng package và đúng decision endpoint; Admin/Moderator không nhận quyền chỉ dựa trên nhãn UI. Triển khai queue/dispatch trước, hoàn thiện từng panel theo luồng phụ thuộc.

### Đợt 5 Kết nối báo cáo và thư viện cộng đồng

Bổ sung community/report types và service; guardianService giữ facade. Tái sử dụng [ModerationDialogs.tsx](../app/features/library/ModerationDialogs.tsx) và panel kiểm duyệt đợt 4.

- Report: đổi sang `/ContentReport`, map enum snake_case UI sang enum wire backend và giữ reportId/status thật. Không giả tạo danh sách báo cáo cá nhân từ response tạo một report.
- Community: check eligibility/PII → gửi confirmNoPersonalInfo và copyrightDeclaration thật → submit → mine/withdraw/remove. Checkbox OwnWork của UI phải được chuyển vào request; dùng số enum đúng contract.
- Hiển thị blockers/canWithdraw/canRemove, giữ pinned version và itemId; không thay bằng PublicStorySubmission dành Creator.
- ChildSession đọc CommunityLibrary list/detail theo submissionId. Response hiện chỉ có metadata; không mở full reader bằng cách lấy Story hoặc gói Parent dưới phiên khác.
- Moderator/Administrator dùng PublishedContentReview để xem nội dung public; tạo review-item chỉ Moderator, sau đó xử lý qua queue/report.

Nghiệm thu: check không tự nộp, PII/copyright chặn đúng, withdraw sau claim không báo thành công, bản bị remove không còn hiển thị cho trẻ. Full reader cộng đồng là phụ thuộc contract riêng, không cam kết hoàn tất trong đợt metadata.

### Đợt 6 Hoàn thiện Creator và pipeline AI dùng chung

File chính: creatorService, aiStoryCreationService, `types/creator.ts`, `types/aiStory.ts`, CreatorStories/CreatorEditor/CreatorImport, `features/studio/`, `features/review/`, các hook `features/story-workflow/`.

- Phân nhánh Creator Manual/AI từ DTO backend, không đoán theo màn đang mở hoặc dựa trên việc có childProfileId.
- Bổ sung Creator AI context/input/progress/retry; dùng tham số actor rõ ràng trong hook dùng chung. Không copy toàn bộ pipeline hoặc tạo child giả để tái sử dụng Parent input.
- Parent giữ review/approve/archive theo quyền; Creator dùng generation/confirm-content với versionId, canConfirmContent. Không thêm ContentCreator vào endpoint Parent ở backend.
- Bổ sung waitingForModeration, xử lý progress trong response lỗi, history và media readiness/version; sau Ready mới cho gửi duyệt khi eligibility đạt.
- Nối PublicStorySubmission submit/withdraw và Creator publication/status/removal/revisions/content-check; khóa editor/assistance khi bản đã nộp bất biến. Sau revision tải versionId/revisionToken mới và chuẩn bị lại media.
- Nối Creator assistance vào editor bằng hook, command/revision/task riêng; mutation không nhận response cũ sau đổi story/version.
- Giữ kiểm thử luồng Parent generation/ExistingStories; dùng alias artifacts chỉ khi đã chọn rõ một route canonical.

Nghiệm thu: Creator có thể hoàn thành luồng được backend hỗ trợ đến gửi duyệt, reviewer duyệt rồi mới public; không sửa phiên bản đã nộp, không coi confirm-content là publish. Chênh lệch role gate manual/assistance ghi thành issue backend riêng; frontend vẫn chọn đúng actor, không sửa backend trong đợt này.

### Đợt 7 Kết nối Parent soạn thủ công và reader được cấp quyền

Bổ sung `types/parentAuthoring.ts`, `services/parentAuthoringService.ts`, `services/assistanceService.ts`, `services/authoringGuideService.ts` và mock. Dùng Studio/Library/Review/KidReader hiện hữu; phần authoring có thể tách feature con khi vượt kích thước file.

- Parent draft/save/import-preview/confirm → check → content-confirm → prepare/progress → family-confirm; revoke và đọc lại trạng thái khi thay version.
- Parent/Creator assistance dùng chung DTO/transport khi giống contract, giữ access context và tiền tố actor riêng.
- Reader ChildManualStories lấy đúng gói đã cấp quyền cho phiên trẻ; không gọi review artifacts bằng token adult hoặc tự suy version từ storyId.
- AuthoringGuides tải/render qua service; không đưa HTML/nội dung không tin cậy vào UI ngoài cơ chế render được rà soát.

Nghiệm thu: stale revision giữ draft, replay đúng operation, family grant/revoke có hiệu lực; gói của trẻ gắn đúng confirmation/version và media backend cung cấp. Phần hoàn thành bài đọc/quiz không được ghi giả lên backend chưa có API.

### Đợt 8 Rà soát vận hành và hoàn tất tích hợp

Giữ các service/account/catalog/quota/data-request/report/payment/notification hiện hữu; hoàn thiện khoảng trống có UI thật và regression.

- Tải export xlsx/ZIP đúng header; permission/state của account/quota/report/payment theo backend.
- Notification thật không trộn local trong API mode; kiểm REST trước, SignalR theo cơ chế hiện có/hợp đồng kết nối thực. Nếu cần dependency mới, đề xuất riêng thay vì tự thêm nền tảng dữ liệu mới.
- Rubric không đại diện cho toàn bộ màn metrics/job/prompt/evaluation đang local; các API chưa có vẫn nằm mục 6.
- Webhook SePay là server-to-server, không gọi từ browser. Story CRUD legacy/route alias ghi lựa chọn sử dụng hoặc không sử dụng, không dựng màn hình thừa để tăng coverage.
- Cập nhật tài liệu tiến độ/mapping frontend theo source và kết quả chạy thật; giữ riêng contract test, UI test và live smoke test.

Nghiệm thu: các luồng có backend và nằm trong phạm vi sản phẩm có service, call site, mock chủ động, xử lý lỗi và bằng chứng kiểm thử; endpoint không dùng có lý do rõ ràng.

## 5. Phân công phạm vi endpoint để không bỏ sót

Các nhóm dưới đây là phạm vi rà soát, **không phải số endpoint chưa tích hợp**. Mỗi controller chỉ được tính một lần; endpoint dùng chung có thể được nhiều đợt sử dụng nhưng không nhân số.

- Tài khoản và hồ sơ Parent, đợt 2: **76 route** — Auth (21), ChildAccessCredential (6), ParentalGate (1), ChildProfile (10), LearningProfile (4), SafetyPolicy (7), Supervision (18), Permission (9).
- Lộ trình, đợt 3: **25 route** — ChildRoadmap (5), MyRoadmap (1), RoadmapLibrary (4), RoadmapTemplate (10), RoadmapReview (5).
- Kiểm duyệt nền tảng và rubric, đợt 4: **26 route** — ModerationQueue (4), PublicStoryReview (9), GrayZoneReview (2), ModerationRubrics (11).
- Cộng đồng và report, đợt 5: **21 route** — CommunitySubmission (5), CommunityLibrary (2), CommunityReview (5), ContentReport (1), ContentReportReview (4), PublishedContentReview (4).
- Creator và pipeline dùng chung, đợt 6: **84 route** — AIStoryInput (4), CreatorAIStoryInput (4), Outline (8), ContentGeneration (2), Review (27), MediaGeneration (4), ExistingStories (8), CreatorAuthoring (10), CreatorAssistance (10), CreatorModerationCheck (1), CreatorPublication (4), PublicStorySubmission (2).
- Parent manual, đợt 7: **32 route** — ParentAuthoring (18), ParentAssistance (10), AuthoringGuides (2), ChildManualStories (2).
- Vận hành và legacy, đợt 8: **41 route** — AdminAccount (2), ModeratorAccount (5), ContentCategory (5), TokenQuota (3), DataRequest (7), BusinessReport (3), Payment (5), Notification (5), Story (6).

Tổng: **76 + 25 + 26 + 21 + 84 + 32 + 41 = 305 route / 48 controller**. Health/SignalR không nằm trong inventory controller HTTP này. Các thao tác queue quyết định của Roadmap/Community/Removal được triển khai ở đợt 4 nhưng controller nghiệp vụ vẫn tính ở nhóm tương ứng.

## 6. Phụ thuộc backend và chức năng chưa cam kết

- Chưa có contract đầy đủ cho reading session/completion, nộp kết quả quiz trẻ, bookmark/notebook/achievement, wish workflow, adaptive/Hold/dashboard thống kê theo các route frontend tự đề xuất.
- MyRoadmap là API đọc lộ trình, không thay POST hoàn thành truyện. Không dùng thao tác local hoàn thành để giả backend đã mở bước tiếp theo.
- CommunityLibrary hiện chỉ metadata, chưa đủ full text/audio reader. Không lấy nội dung bằng API quản trị để lấp thiếu quyền trẻ.
- Những field UI cần nhưng DTO không trả phải được bỏ/để trống/điều chỉnh rõ nghĩa; không lấy số đo/ID/timestamps giả.
- Creator manual/assistance còn chênh lệch role gate như tài liệu backend. Ghi issue và giới hạn UI đúng role; kiểm soát backend cần xử lý trong yêu cầu khác.
- API có source chưa chứng minh môi trường triển khai có schema/provider/worker phù hợp. Live smoke chỉ chạy trên môi trường và tài khoản test được chỉ định, dữ liệu có thể tạo/xóa theo phạm vi được cho phép; không tự chạy migration, seed, thanh toán hoặc gọi AI hàng loạt.

Chức năng thiếu API được hiển thị là chưa hỗ trợ đồng bộ, hoặc chỉ nằm trong demo chủ động. Từng phần còn phụ thuộc phải có nhãn riêng, không khóa cả module đã có API.

## 7. Chia thay đổi để dễ review và khôi phục

Mỗi phần dưới đây là một đơn vị thay đổi gợi ý; phần lớn có thể chia thêm theo endpoint/actor. Không gộp sửa transport, menu role, editor và toàn bộ moderation trong một PR.

1. Baseline và checklist contract; không đổi hành vi ứng dụng.
2. Phiên adult/child và parser/abort; giữ chữ ký consumer, test hồi quy.
3. Quyền GenerateStory và các khoảng trống account/profile đã xác định.
4. ChildRoadmap/MyRoadmap; adapter + màn hiện có + mock + test.
5. RoadmapLibrary preview/copy, sau đó RoadmapTemplate đúng role.
6. Queue query/dispatch và từng panel PublicStory/Roadmap/GrayZone riêng.
7. Report + CommunitySubmission; CommunityReview và metadata library; PublishedContentReview/escalation.
8. Creator AI/confirm-content; publication lock/submit/removal/revision; assistance là phần riêng.
9. Parent manual/grant/reader; assistance và guides.
10. Rubric/audit/activate, rà vận hành, cập nhật mapping và smoke test.

Chỉ chuyển module khỏi local khi đường UI tương ứng đã nối xong; API mode không tự fallback trong thời gian chuyển đổi. Khôi phục bằng revert đơn vị thay đổi, không sửa dữ liệu backend. Dependency quan trọng: transport trước mọi luồng; queue trước quyết định moderation; metadata library có thể nghiệm thu riêng full reader; publication quyết định cần panel removal; parent family grant trước child manual reader.

## 8. Kiểm thử và điều kiện nghiệm thu

### 8.1 Kiểm thử tự động

- Service contract test: exact method/path/query/body/token; enum/casing; pagination; body rỗng/nullable/bool/binary; HTTP error có progress; adapter bảo toàn partial results và ID.
- Transport regression: child/adult/anonymous, single-flight refresh, retry một lần, lỗi không chuyển local và abort không hiện như lỗi thao tác mới.
- Workflow/hook: đổi account/child/story/version loại response cũ, double-click/replay, 409 giữ draft, claim hết hạn, waiting-for-moderation và readiness đúng version.
- UI có tương tác: đổi tab queue gọi query mới, controls đúng role/quyền, checkbox vào request community, partial-success hiển thị đúng, editor bị khóa khi nộp. Dùng runner/browser sẵn có trước; nếu cần thêm công cụ UI test thì trình bày phạm vi thay vì đổi test stack mặc định.
- Mock test: endpoint mới có mock được chọn chủ động; mock=false không lẫn bản ghi local.

Lệnh kiểm tra trong thư mục `AI_Storytelling_Frontend/src`: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Khi triển khai từng phần, chạy test liên quan trước; cuối đợt chạy bộ hồi quy phù hợp và ghi rõ lỗi nền nếu có.

### 8.2 Kiểm thử luồng trên trình duyệt và môi trường thật

1. Owner/supervisor có và thiếu GenerateStory/AssignActivity/ApproveStory; đổi trẻ và quyền bị thu hồi.
2. Child EasyLogin riêng, adult vẫn đăng nhập ở cùng trình duyệt; child 401 không đổi Authorization sang adult.
3. Roadmap nhiều trẻ, reorder Waiting, remove Open, copy khi eligibility đổi sau preview.
4. Community check/PII/copyright, pinned version, withdraw sau claim, remove và child 404.
5. Creator Manual/AI đi đúng màn, confirm-content → Ready → submit → Moderator approve; khóa nội dung và tạo revision sau quyết định gỡ.
6. Queue đầy đủ status/itemType, cấm tự duyệt, stale rowVersion/claim, report escalate → Admin quyết định.
7. Rubric revision conflict, clone Draft, validate và activate đúng role; evaluate chỉ khi chủ động.
8. Parent manual replay/conflict/grant/revoke; child chỉ mở đúng bản đã cấp quyền.
9. Notification/file export và UI loading/error/responsive/theme sáng tối.

Live smoke cần môi trường/schema/worker đã sẵn sàng và tài khoản test theo role. Không xem việc Vitest pass hoặc HTTP 200 không token là chứng minh các bước trên hoàn tất.

### 8.3 Điều kiện hoàn tất từng luồng

Một luồng chỉ được đánh dấu hoàn tất khi có đủ service/DTO đúng contract, call site UI thật, hook/state và quyền đúng actor, lỗi/retry không giả thành công, mock tách rõ, test hồi quy đạt và kết quả smoke có phạm vi cụ thể. Khi chưa có môi trường live, ghi **hoàn tất ở mức source/automated tests, chờ live smoke**.

## 9. Các quyết định đề xuất để duyệt

- Giữ kiến trúc, shell, điều hướng, context và giao diện Taletale; thay contract tại service/adapter và tách hook/panel khi cần.
- Bắt đầu bằng baseline/transport/phiên, sau đó lộ trình và queue; các luồng còn lại triển khai theo dependency ở mục 7.
- Chuyển soạn bộ mẫu sang Moderator; Creator giữ sáng tác/phát hành truyện. Admin chỉ có thao tác phù hợp action/service backend.
- API mode không fallback giả thành công; demo vẫn hoạt động khi được chọn rõ ràng.
- Chỉ cam kết luồng có backend hiện hành; chức năng thiếu API và full reader cộng đồng theo dõi riêng.

Sau khi kế hoạch được duyệt, bắt đầu đợt 0 và 1. Tạo/cập nhật PR chỉ khi người dùng yêu cầu; việc chia đơn vị thay đổi ở trên không tự cấp quyền push, publish hoặc triển khai môi trường.
