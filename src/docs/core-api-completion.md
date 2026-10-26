# Hoàn thiện kết nối toàn bộ API Core dành cho frontend

### Sân khấu kể chuyện cho bé — 26/10/2026

- Khi mở truyện, màn hình riêng ưu tiên tranh thật, lời kể, nút nghe/tạm dừng, nghe lại và cảnh trước/tiếp. Ẩn header quản lý, thư viện/lộ trình/sổ tay ngoài luồng và tháo nền ao chuyển động cho đến khi bé quay về danh sách.
- KidNarrator phát audio segment được API cấp quyền, nối các đoạn trong cùng cảnh sau thao tác nghe của bé, có chọn đoạn và tua theo duration thật. Không tự chuyển cảnh/hoàn thành truyện. Pause khi mở từ mới/cách đọc hoặc ghi tiến độ; pause và dọn player khi đổi cảnh, hết quyền hoặc unmount. Giữ TtsStarted/TtsCompleted, child bearer, progress, flags, notebook và signal hiện có.
- Đoạn đang nghe lấy từ segment text; chưa triển khai karaoke từng từ vì WordTimingsJson chưa có hợp đồng thống nhất. Không dùng giọng giả, thời lượng giả, ảnh demo hoặc dữ liệu sinh tại frontend.
- Thư viện có tab Truyện của em/Sổ tay của em. Trạng thái Hold dùng lời nhắn của backend, linh vật và một hành động đọc lại unlockStoryId; ẩn tìm kiếm/phân trang trong trạng thái đó. Các thư viện gia đình/cộng đồng và hành trình cũ vẫn truy cập qua mục mở rộng.
- Kiểm tra: 267 unit test, lint, TypeScript và production webpack build đạt; 6 browser smoke của luồng trẻ đạt với network doubles, có ảnh/audio WAV fixture, nối đoạn, pause khi tra từ, dọn audio cũ khi đổi cảnh, giao diện mobile tối, Hold, tiến độ/sổ tay, thu hồi quyền và thư viện gia đình. Chưa nghiệm thu signed URL/audio/provider trên backend thật; chưa commit/push.

### Hoàn tất và giao truyện ngay trong Studio — 25/10/2026

Thanh thao tác chính hiện checkbox đã xem/nghe gói media và nút **Xác nhận media và hoàn tất truyện**, dùng đúng storyVersionId/packageRevision đang xem. Chỉ sau khi cả package và progress từ backend xác nhận Ready/isConfirmed mới hiện **Giao truyện cho bé**, mở AddToRoadmapDialog sẵn có để chọn trẻ/vị trí rồi gọi ChildRoadmap API. Không coi nút về thư viện là hoàn tất, không tự giao truyện hay bỏ qua quyền AssignActivity. Lỗi 409 hoặc kết quả chưa rõ chặn ghi tiếp cho tới khi tải lại; không hiện giao truyện khi xác nhận thất bại. Browser fixtures ParentResumeCompletion và ParentResumeCompletionConflict kiểm tra luồng confirm → Ready → giao, và trường hợp conflict không cho giao; chưa gọi backend/database thật.

### Sửa xem trước media trong Studio — 25/10/2026

Vùng chính dùng gói media có URL từ backend, lấy cảnh theo segmentation thực tế thay vì tự chia đoạn truyện. Có chọn nhiều tranh trong cảnh, audio theo segment, báo lỗi tải package/ảnh/audio và tải lại URL đã ký. Không tiếp tục hiển thị hình nền trang trí như tranh thật khi URL thiếu/lỗi. Theo dõi cả tiến trình audio, revision và trạng thái xác nhận để tải lại preview; kiểm tra story/version/revision và hủy response cũ khi rời scope. Kiểm thử riêng ParentResumeMediaPreview và ParentResumeMediaError dùng fixture đạt; chưa xác nhận URL/storage thật của truyện trong ảnh chụp người dùng.

## Bổ sung ngày 25/10/2026 — đọc truyện, sổ tay và media replacement

Inventory trực tiếp Core Controllers hiện có **332 route: 330 CONNECTED_SOURCE, 2 excluded, missing: []**. Manifest `core-api-coverage.json` đã cập nhật theo source hiện tại; các số liệu ở các mục cũ phía dưới là lịch sử.

- Nối 10 API `ChildReadingController` và 3 API `ChildNotebookController` bằng service/DTO riêng. Chế độ bé có tìm kiếm, lọc nguồn, phân trang, mở/tiếp tục phiên đọc, đọc cảnh/nghe audio, lưu vị trí và chế độ đọc, hoàn thành đọc, bookmark/favorite, tra từ, lưu/xóa sổ tay, mở lại cảnh có từ đã lưu. Truyện cộng đồng mở bằng communitySubmissionId, không dùng StoryId gốc.
- Mọi request đọc/sổ tay dùng token child session; không dùng token hoặc refresh người lớn. Signal đọc kiểm tra mỗi 8 giây, không chồng request, dọn khi rời phiên. Khi backend yêu cầu thoát hoặc trả 401/403/404, xóa nội dung đang đọc; không nhận kết quả cũ sau khi đổi phiên/unmount.
- Tiến độ chỉ thay đổi theo response thành công. Thời gian đọc đếm khi tab hiển thị và có focus, tối đa 600 giây mỗi lần lưu; không đoán thời gian khi tab ẩn. Lỗi ghi không rõ kết quả/409 chặn lệnh mới cho tới khi mở lại từ backend. Hoàn thành đọc chỉ gửi khi trẻ chủ động xác nhận ở cảnh cuối; không tự ghi hoàn thành, thưởng hoặc tiến độ roadmap.
- Từ vựng và định nghĩa lấy từ backend. Event TTS gắn vào sự kiện audio play/ended; không phát sinh sự kiện ASR, quiz, thưởng giả.
- Nối `POST /stories/{storyId}/media/replacements/{candidateAssetId}/keep-current` trong MediaAssets dùng chung Parent/Creator. Chỉ hiện cho candidate Failed/ManualReview do API trả, gửi đúng candidate/version/revision và operationId, xóa preview cũ sau lệnh để tải lại và xác nhận. 409/lỗi mạng không giả thành công.
- Cập nhật contract tạo lại illustration/audio: thêm operationId bắt buộc, tạo một ID cho mỗi lệnh; không tự retry mutation khi chưa rõ kết quả. Không sửa backend, database hoặc thêm mock runtime.

Kiểm thử contract có child bearer isolation, không refresh adult khi child trả 401, route/body đủ 13 API và giữ nguyên 409 của keep-current. Browser smoke dùng network doubles, không gọi backend/database/provider thật. Thay đổi trong working tree, chưa commit/push trong đợt này.

Kết quả: **267/267 unit test (29 file), lint không cảnh báo, TypeScript và production webpack build đạt; 19/19 browser smoke đạt**. Các ca mới gồm ChildReading, ChildReadingExit, ChildReadingForbidden và MediaKeepCurrent. Kết quả/ảnh smoke nằm trong `out/api-integration-smoke/` (Git ignore).

Ngày 22/10/2026. Giữ kiến trúc Next.js một route, AppShell/StaffApp và tầng service/hook hiện có. Không sửa backend hoặc database.

## Kiểm tra khi merge main — 23/10/2026

- Merge `origin/main` tại `02e9929`, giữ trang giới thiệu/giao diện đăng nhập mới và các luồng API, tiếp tục truyện hiện có. Conflict ở `LoginScreen.tsx` được kết hợp: giữ nút về trang giới thiệu và thông báo đăng ký Creator chưa được backend hỗ trợ.
- Lint và production build (`npm run build -- --webpack`) đạt. Unit test đạt 251/252: ca audit thất bại vì controller backend hiện đã tăng lên **319 route**, trong đó **316 connected, 2 excluded, 1 missing**.
- 15/15 browser smoke dùng network doubles đạt, gồm mở lại truyện từ Thư viện/URL và các luồng Parent, Creator, Moderator, Administrator, Child. Đây không phải kiểm thử backend thật.
- Route chưa kết nối mới phát hiện: `POST /api/v1/stories/{storyId}/media/replacements/{candidateAssetId}/keep-current`. Không bỏ qua hoặc đổi kỳ vọng test để che route thiếu. Các số 318/316 và manifest phía dưới ghi nhận đợt tích hợp trước đó.

## Phạm vi đã đối chiếu

Nguồn hiện hành: trực tiếp `AI_Storytelling_Backend/src/Core/StoryPlatform.Api/Controllers`, kiểm tra ngày 22/10/2026. Có **318 method + route**. Tài liệu actor flow cũ chỉ là nguồn tham khảo, không còn giới hạn phạm vi audit.

- **316 endpoint dành cho browser đã có service và nơi dùng trong màn hình/hook**, gồm những endpoint đi qua guardian facade hoặc được chọn theo actor trong hook assistance.
- **1 alias tương thích** `POST /stories/{storyId}/artifacts/generate`: frontend dùng route chuẩn `POST /stories/{storyId}/review/artifacts/generate`, cùng nghiệp vụ. Không thêm thao tác trùng chỉ để gọi hai đường dẫn.
- **1 webhook** `POST /Payment/webhook/sepay`: SePay gọi Core, không đưa khóa webhook hoặc khả năng giả xác nhận thanh toán vào browser.
- Ngoài inventory trên, đã nối GET `/health`, GET `/healthz` và nhận event `ReceiveNotification` ở `/hubs/notifications`. Không gọi trực tiếp AI API nội bộ từ frontend.

Bằng chứng từng endpoint nằm trong [core-api-coverage.json](core-api-coverage.json): method, route, authorization theo controller, controller/action/dòng khai báo, disposition, service/operation, file/dòng HTTP và file màn hình/hook sử dụng. `CONNECTED_SOURCE` chỉ xác nhận source có đường nối; không đồng nghĩa đã PASS trên server thật.

## Bổ sung theo controller hiện tại

- Quản lý hướng dẫn sáng tác: nối cả 9 action của `AuthoringGuideManagementController` cho Moderator và Administrator. Có tổng quan, lịch sử phân trang, chi tiết phiên bản, tạo nháp từ bản Published, thêm/sửa/xóa mục, hủy nháp, xem trước danh sách/điền mẫu và phát hành. Lệnh ghi dùng revisionToken; 409/lỗi mạng/5xx chặn thao tác mới để đồng bộ, giữ phần đang soạn. Phát hành chỉ bật sau xem trước đúng revision.
- Media: thêm `POST /stories/{storyId}/media/confirm` và `POST /stories/{storyId}/media/segments/{segmentId}/regenerate`; cập nhật tạo lại illustration để gửi body bắt buộc `storyVersionId`, `packageRevision`, `expectedConfirmed`. Không suy đoán metadata nếu server trả thiếu hoặc gói khác version.
- Parent/Creator AI và Creator Manual nhận `MediaReview`. Tạo xong chưa phải Ready: dừng polling, hiển thị ảnh/âm thanh, người lớn xác nhận rồi tải lại tiến trình. Tạo lại một mục phải xác nhận gói mới. Chưa Ready thì chưa gửi Moderator duyệt công khai.
- Parent Manual: nối `POST /parent/stories/{storyId}/manual/media/generate` sau xác nhận nội dung với operationId/revision/baseVersion/contentConfirmationId. 202 chỉ là hàng đợi; kiểm tra consent/ngữ cảnh theo canUseAiAssistance rồi tiếp tục progress/package/confirm. Chuẩn bị truyện chỉ có văn bản vẫn không tự gọi provider.
- Handoff gia đình: lấy operation mới nhất còn hợp lệ, xóa preview khi đổi media, chuẩn bị lại và xem trước rồi giao. Parent và bé hiển thị media từ preparation được backend cấp quyền khi version/package revision khớp và đã xác nhận.
- HTTP layer của pipeline giữ status thực, kể cả bodyless 202, 409 và lỗi mạng status 0. Logic điều phối ở hook, HTTP ở service và UI ở feature; không đổi kiến trúc hoặc đưa mock vào ứng dụng.

Kiểm chứng hiện tại: **252 unit test / 28 file**, TypeScript, lint, production build và **15 browser smoke** dùng network doubles. Có ca 409 giữ bản hướng dẫn đang soạn, yêu cầu tải lại gói media và mở lại truyện theo storyId sau khi mất phiên tab. Chưa chạy backend/database/provider thật.

### Mở lại truyện đang tạo

- Thư viện → chọn truyện AI → **Tiếp tục trong Studio**, áp dụng cả khi đang tạo/chờ xác nhận media. Nút **Mở để duyệt** cũng truyền đúng storyId truyện AI đang chọn.
- URL `/?storyId=<id>#studio` mở lại được sau reload hoặc khi không còn sessionStorage. ID từ Thư viện/URL ưu tiên hơn phiên lưu của một truyện khác; session chỉ ghi nhớ điều hướng, không suy đoán tiến trình.
- Studio đọc chi tiết và tiến trình được backend cấp quyền để mở đúng dàn ý, duyệt nội dung, media hoặc trạng thái chờ kiểm duyệt. Khi dữ liệu outline/generation cũ không còn nhưng truyện đang ở bước media, dùng media/progress được backend cấp quyền.
- Không yêu cầu lại creation-context/POST ý tưởng để mở một truyện đang tồn tại. Metadata nhóm tuổi lấy từ truyện; thao tác vẫn theo quyền backend của storyId.
- Nếu không đọc được truyện/tiến trình, hiện lỗi và nút tải lại, không tự quay về form tạo mới. Truyện đang kiểm tra input chỉ khôi phục đúng request khi còn requestId; không tự tạo request mới nếu backend chưa trả được tiến trình.
- Target được chụp cố định khi vào Studio để thao tác ghi session của một truyện vừa gửi không khởi động lại input flow. Chỉ nút tạo mới/làm lại do người dùng chọn mới xóa target.
- Kiểm tra build đợt sửa resume dùng `npm run build -- --webpack`: cache Turbopack đang bận bởi dev server có sẵn. Giữ nguyên dev server của người dùng; browser smoke chạy trong browser context riêng và chặn toàn bộ API bằng network doubles.

Bổ sung theo controller hiện tại đã được lưu trong commit `b266309` trên nhánh `feat/frontend-core-api-integration`.

## Phần bổ sung trong đợt hoàn thiện

- Tài khoản: nhật ký có phân trang; chọn gói → tạo giao dịch → hiển thị số tiền, nội dung chuyển khoản, QR và hạn từ response. Không tự coi giao dịch Pending là đã thanh toán. Lỗi chưa rõ kết quả chặn tạo lặp.
- Hồ sơ trẻ: nhật ký, đọc lại chi tiết, khôi phục theo mã hồ sơ lưu trữ; tạo LearningProfile/SafetyPolicy bằng POST khi chưa có, cập nhật bằng PUT khi đã có. Thêm thao tác xóa cấu hình theo quyền; xem preset theo tuổi trước khi xác nhận áp dụng.
- Người giám sát: lấy danh mục quyền hiện hành; đọc/cấp/thu hồi qua Permission API, giữ các thao tác Supervision hiện có. Backend tiếp tục kiểm tra Owner và scope.
- Truyện: thêm quản lý Story riêng với create/update/delete/publish. Truyện riêng không tự được giao cho trẻ; luồng soạn truyện gia đình có version/grant tiếp tục riêng. GET evaluation đọc lại đánh giá đúng storyVersionId sau khi backend đã đánh giá bản mới.
- Studio/review: lịch sử danh sách và chi tiết dàn ý; đọc media package thật, nghe audio và yêu cầu tạo lại đúng illustration beat; thao tác auto-publish-check theo chính sách là hành động chủ động vì có thể chuyển sang tạo media.
- Parent Manual: sửa mục đích/ngôn ngữ/cách đọc với revision/operationId; đọc chi tiết version trước khi xem lịch sử.
- Vận hành: GET/DELETE từng ContentCategory; ghi nhận review view đúng sourceTab, story/version hoặc roadmap. Không dùng quyền rà soát để giả một quyết định kiểm duyệt.
- Thông báo: thêm `@microsoft/signalr` 10.0.11, bearer adult lấy mới từ storage; ReceiveNotification và reconnect đồng bộ REST. Dọn connection/timer khi logout/unmount. REST polling vẫn là đường dự phòng. Cách kết nối theo [tài liệu SignalR chính thức](https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-10.0).
- Health: đọc riêng response text/status của liveness/readiness, giữ 503 và lỗi mạng; không dùng trạng thái health để đăng xuất tài khoản.

Các màn demo chưa có endpoint tương ứng trong Core không được tính như một endpoint đã kết nối; chế độ API thật không chuyển sang local để báo thành công sau lỗi.

## Cấu hình và kiểm tra

Đợt dọn mock ngày 22/10/2026 đã xóa hoàn toàn cơ chế `NEXT_PUBLIC_USE_MOCK` và flag local này. Ứng dụng luôn dùng API thật, giữ nguyên NEXT_PUBLIC_API_URL và credential. Không cần đặt flag để tắt demo nữa.

Chạy từ `AI_Storytelling_Frontend/src`:

```sh
npm run audit:api
node scripts/audit-core-api.mjs --write --check
npm run lint
npx tsc --noEmit --incremental false
npm test -- --run
npm run build
```

Audit đọc controller từ backend sibling nếu có; `controller-inventory.mjs` xử lý route kế thừa, route tuyệt đối, constraint và nhiều HTTP attribute trên cùng action. Lệnh `--write` cập nhật manifest. Khi chỉ checkout frontend, audit dùng inventory đã lưu, không tuyên bố đã đọc backend mới.

Audit không dùng catalog-only để bỏ qua route mới. `npm run audit:api` kiểm tra toàn bộ controller và thất bại nếu còn MISSING/SERVICE_ONLY. Unit test so sánh inventory 318 route với manifest; backend thêm route sẽ làm kiểm tra thất bại cho tới khi được rà và cập nhật.

Kết quả đợt tích hợp trước khi dọn mock:

- Inventory: total 306, connected 304, excluded 2, missing 0.
- 252/252 test, 28 file; lint, TypeScript và production build đạt.
- 7 browser smoke scenarios trên Edge đạt, bao gồm payment/audit/health, CRUD Story, roadmap/report, moderation, Creator AI, Creator Manual và ChildSession.
- Smoke có mock WebSocket handshake và invocation ReceiveNotification, xác nhận chuông nhận thay đổi từ REST. Unit test kiểm tra retry lần kết nối đầu, reconnect, token mới và cleanup sau logout/unmount.
- Browser fixture chặn kết nối ngoài frontend cục bộ và API/WebSocket fixture; không gọi backend/database/provider hoặc chuyển tiền thật. Ảnh/kết quả nằm trong `out/api-integration-smoke/` (Git ignore).

## Giới hạn nghiệm thu

Chưa kiểm thử đăng nhập/quyền, dữ liệu, schema, CORS, thanh toán, concurrency, worker AI/media và URL lưu trữ trên backend thật. API mới ở working tree backend cần được triển khai lên server frontend đang trỏ đến. Test với fixture và audit source không thay thế live E2E.

Không có API HTTP ghi hoàn thành đọc/quiz trẻ hoặc package đọc CommunityLibrary đầy đủ trong snapshot này, nên frontend không tự tạo progress hoặc giả hoàn thành. Payment chưa có endpoint tra cứu kết quả giao dịch trong catalog; chỉ server/webhook và thông báo xác nhận thanh toán. Không thêm API giả để che các giới hạn này.

Phần tích hợp trước đợt đối chiếu controller đã commit và push lên nhánh frontend `feat/frontend-core-api-integration`. Backend và các thay đổi đang có của công việc khác được giữ nguyên.

## Dọn mock khỏi mã nguồn ứng dụng — 22/10/2026

- Xóa `app/mocks`, `staffLocal`, `guardianLocal`, `readingLocal`, `adaptiveLocal`, `notificationLocal` và reading service mô phỏng chưa có HTTP backend.
- Xóa màn đọc/quiz/sổ tay/điều ước chỉ dùng cho KidApp demo; KidApp giữ entry point và chỉ mở ConnectedKidHome. Native narrator dùng cho tóm tắt nội dung thật được giữ.
- Bỏ seed tài khoản, đơn Creator, chỉ số AI, catalog/prompt/evaluation và bộ truyện giả. Các menu chưa có API hiện thông báo chưa hỗ trợ. Danh mục nội dung, quản lý nhân sự và các luồng có API vẫn được giữ.
- Bỏ danh sách nhân vật, bối cảnh, bài học mẫu hardcode và liên kết từ wish card giả; giữ enum, nhãn giao diện, quy tắc nghiệp vụ, avatar và cấu hình form.
- Không còn fallback ghi tiến độ, điểm thưởng, moderation hoặc notification vào local/session storage. Storage cho phiên đăng nhập, theme và bản nháp/điều hướng thật vẫn được giữ.
- Các thao tác chưa có API trả lỗi 501 với data=null; không gửi request đến endpoint giả định hoặc báo ghi thành công.
- Xóa 4 file test dành riêng cho bộ máy local đã loại bỏ (35 test); thêm 3 regression test về frontend chỉ dùng backend. Bộ kiểm tra hiện có 220 test, 25 file.
- Fixture/network doubles ở `tests/` tiếp tục phục vụ kiểm thử độc lập, không được import vào `app/`. Không xóa dữ liệu backend hoặc dữ liệu người dùng trong trình duyệt.

Kiểm tra lại: TypeScript, lint, production build và 220 test đạt; 7 browser smoke với fixture đạt; audit catalog không mất đường nối nào trong 304 route frontend đã tích hợp. Source coverage vẫn không phải bằng chứng live API/database.

## Hợp nhất main — 22/10/2026

- Hợp nhất `origin/main` tại `d02ee70` vào nhánh tích hợp; các luồng được hai nhánh triển khai song song dùng chung bộ service có DTO và hook hiện tại. Các component/service trùng chức năng không được đưa vào ứng dụng lần thứ hai.
- Giữ tài liệu từ main, API bổ sung cho tài khoản/hồ sơ, cách nhận diện nguồn và trạng thái truyện. Loại các khai báo trùng sau auto-merge.
- Giữ danh sách hồ sơ vừa lưu trữ từ main cùng cách khôi phục bằng mã hồ sơ. Danh sách chỉ nhớ thao tác lưu trữ thật trên trình duyệt; khôi phục vẫn phải gọi backend thành công trước khi cập nhật giao diện.
- Giữ xem tranh theo cảnh từ main, công cụ media hiện có và nút duyệt dàn ý khi không có thanh tiến trình. Creator AI, phát hành, trợ giúp soạn, đối chiếu phiên bản, kiểm duyệt và viết truyện gia đình tiếp tục qua các module đã kết nối.
- Giữ việc xóa KidHome/readingService cũ và toàn bộ runtime mock. README hiện mô tả chế độ chỉ dùng backend; ghi chép tiến độ cũ được đánh dấu là lịch sử.
- Sau hợp nhất: 220/220 unit test, TypeScript, lint, production build và 7/7 browser smoke với network doubles đều đạt. Chưa chạy kiểm thử với backend/database thật.

## Assistance theo bản nháp — 26/10/2026

Parent và ContentCreator có “AI gợi ý theo bản nháp” ngay tại trình soạn thủ công và màn **Tự sửa bản thảo** của truyện AI ở bước duyệt nội dung. Gợi ý gửi snapshot title/content đang chỉnh, gồm cả nội dung chưa lưu; không dùng catalog Moderator làm kết quả AI. Catalog được ghi nhãn “Mẫu hướng dẫn từ catalog”.

- Ba kiểu hỗ trợ: viết tiếp ở cuối, gợi ý cho đoạn bôi đen, nhận xét toàn bản nháp. Bôi đen được lấy trực tiếp từ textarea; không phải nhập offset số. Giữ UTF-16, không cắt đôi emoji hoặc áp dụng lựa chọn từ snapshot cũ.
- Tạo task rồi yêu cầu suggestions; theo dõi 202 qua GET task. Có trả lời clarification/chọn để AI đề xuất, xác nhận hướng, trials, xem trước và áp dụng vào editor, lịch sử, hủy và đóng tác vụ. Nhận xét có thể mở task con với tham chiếu finding do server trả.
- Chỉ hành động lưu của người dùng mới tạo phiên bản. Truyện thủ công lưu qua API manual; truyện AI lưu qua review/story với assistanceReferences. Backend xác thực provenance và đổi revision, không chuyển truyện AI sang manual.
- Task/revision và operationId được giữ riêng; 409 giữ editor, lỗi chưa rõ kết quả giữ nguyên lệnh để retry. Snapshot/revision/audience stale chặn dùng bản thử cũ. Không tự tạo kết quả hoặc dữ liệu fallback.
- Backend mở rộng Parent assistance cho AI ContentReview với quyền ApproveStory, consent và context trẻ; Creator giữ scope/ownership và khóa phát hành. Không mở sửa qua assistance khi generation còn chạy hoặc truyện đã Ready/phát hành/lưu trữ. Dùng metadata hiện có, không thêm migration.

Kiểm chứng source và kiểm thử: 274/274 frontend unit tests; 184/184 backend assistance/review tests; TypeScript, lint và production build đạt. Sáu browser cases dùng network doubles gồm Parent/Creator × manual/AI, đoạn bôi đen bị sửa sau khi tạo tác vụ, và retry sau 503 giữ nguyên payload/operationId. Audit controller: 332 route, 330 kết nối, 2 loại trừ, không có route thiếu.

Đây là bằng chứng fixture/source. Chưa gọi provider AI thật hay xác nhận môi trường triển khai. Backend đang chạy cần nạp bản build mới để trả assistanceRevisionToken và nhận provenance khi sửa truyện AI. Không restart tiến trình hoặc chạy migration tự động trong đợt này.

## Đồng bộ giao diện với job tạo truyện — 26/10/2026

- Backend là nguồn trạng thái: Pending/Processing giữ giao diện ở bước đang xử lý; chỉ mở bước tiếp theo khi nhận kết quả/quyền tương ứng. HTTP 202 của retry là xác nhận đã tiếp nhận tác vụ, không phải đã tạo truyện xong.
- Outline progress chỉ đọc job GenerateOutline/RegenerateOutline. Không trả lỗi lần trước khi retry đang chạy hoặc khi dàn ý đã bàn giao sang content. Ưu tiên thứ tự ID tác vụ thay vì thời gian hoàn tất của job cũ.
- Content progress không dùng lỗi của lần chạy đã được thay thế, lỗi artifact của phiên bản cũ hoặc lỗi nội dung đã được thay bằng stable content. Khi có job đang hoạt động, currentStep vẫn pending/generating và isComplete=false.
- Parent và Creator dùng chung cách chọn bước/lỗi theo snapshot. Lỗi outline cũ không còn được dùng làm lỗi bước viết truyện. Tác vụ regenerate outline đang chạy được ưu tiên hơn cờ duyệt cục bộ.
- Parent dùng response retry để cập nhật trạng thái ngay trong lúc tải lại GET, giữ idempotency key nếu kết quả lệnh chưa rõ. Polling job tạo truyện không tự kết luận thất bại sau giới hạn 180 giây; dừng khi backend báo hoàn tất, thất bại, bước chờ người dùng hoặc component được rời đi.
- Lỗi đọc tiến trình 0/408/429/5xx giữ dữ liệu gần nhất và kiểm tra lại với backoff tối đa 15 giây. 401/403 và lỗi request không tự retry. Lỗi mạng/thời gian theo dõi được trình bày riêng, không biến thành lỗi tạo truyện. Hủy polling khi rời trang không hủy background job.
- Kiểm chứng: 288 unit test frontend, 41 test backend outline/content; 5 browser fixture kiểm tra chạy content có lỗi outline cũ, outline đang chạy, retry outline trả 202, mất kết nối rồi phục hồi, và content thất bại thật rồi retry. TypeScript/lint/production build đạt.

Chưa khởi động lại backend hoặc gọi AI provider thật. Cần chạy bản backend đã cập nhật để nhận đầy đủ logic progress mới; không có thay đổi schema/migration trong bản sửa này.

## Kiểm tra trước push — 27/10/2026

Đã hợp nhất origin/main, giữ bố cục form một cột và độ dài đề xuất từ backend. Production build và lint đạt; unit tests 304/305 qua. Test còn lỗi là kiểm tra độ phủ API khi đối chiếu với backend local hiện có 358 route: 330 connected, 2 excluded, 26 missing. Các route mới thuộc quiz session, cảm xúc/tưởng thưởng/điều ước của trẻ, phản hồi đọc của phụ huynh và quản lý wish cards. Snapshot `core-api-coverage.json` vẫn là 332 route của lần tích hợp trước; không thêm exclusion hoặc sửa test để che 26 route còn thiếu. Kết quả này không xác nhận đã tích hợp toàn bộ API của backend local mới, không phải lỗi build hay conflict chưa xử lý.
