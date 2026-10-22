# Hoàn thiện kết nối toàn bộ API Core dành cho frontend

Ngày 22/10/2026. Giữ kiến trúc Next.js một route, AppShell/StaffApp và tầng service/hook hiện có. Không sửa backend hoặc database.

## Phạm vi đã đối chiếu

Nguồn: `AI_Storytelling_Backend/docs/API_FRONTEND_ACTOR_FLOWS.md` và controller hiện tại. Có 306 method + route: 305 trong catalog baseline cùng endpoint Creator Manual bổ sung ở cuối tài liệu. Số attribute HTTP của controller được kiểm tra lại khi chạy audit.

- **304 endpoint dành cho browser đã có service và nơi dùng trong màn hình/hook**, gồm những endpoint đi qua guardian facade hoặc được chọn theo actor trong hook assistance.
- **1 alias tương thích** `POST /stories/{storyId}/artifacts/generate`: frontend dùng route chuẩn `POST /stories/{storyId}/review/artifacts/generate`, cùng nghiệp vụ. Không thêm thao tác trùng chỉ để gọi hai đường dẫn.
- **1 webhook** `POST /Payment/webhook/sepay`: SePay gọi Core, không đưa khóa webhook hoặc khả năng giả xác nhận thanh toán vào browser.
- Ngoài inventory trên, đã nối GET `/health`, GET `/healthz` và nhận event `ReceiveNotification` ở `/hubs/notifications`. Không gọi trực tiếp AI API nội bộ từ frontend.

Bằng chứng từng endpoint nằm trong [core-api-coverage.json](core-api-coverage.json): method, route, authorization theo tài liệu, disposition, service/operation, file/dòng HTTP và file màn hình/hook sử dụng. `CONNECTED_SOURCE` chỉ xác nhận source có đường nối; không đồng nghĩa đã PASS trên server thật.

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

Audit cần backend sibling và tài liệu để đối chiếu source mới nhất. Lệnh `--write` cập nhật manifest. Unit test vẫn đọc manifest khi chỉ checkout frontend; nếu backend sibling hiện diện thì đồng thời chạy audit mới.

Backend local đang thay đổi và số attribute HTTP không còn khớp catalog **306** route đã rà. Audit mặc định tiếp tục báo lỗi inventory drift; không coi các route mới ngoài catalog là đã kết nối. `--catalog-only` chỉ kiểm tra 306 route được tài liệu mô tả, vẫn báo độ lệch source. Unit test frontend sử dụng phạm vi catalog này để không phụ thuộc thay đổi backend đang làm dở.

Kết quả đợt tích hợp trước khi dọn mock:

- Inventory: total 306, connected 304, excluded 2, missing 0.
- 252/252 test, 28 file; lint, TypeScript và production build đạt.
- 7 browser smoke scenarios trên Edge đạt, bao gồm payment/audit/health, CRUD Story, roadmap/report, moderation, Creator AI, Creator Manual và ChildSession.
- Smoke có mock WebSocket handshake và invocation ReceiveNotification, xác nhận chuông nhận thay đổi từ REST. Unit test kiểm tra retry lần kết nối đầu, reconnect, token mới và cleanup sau logout/unmount.
- Browser fixture chặn kết nối ngoài frontend cục bộ và API/WebSocket fixture; không gọi backend/database/provider hoặc chuyển tiền thật. Ảnh/kết quả nằm trong `out/api-integration-smoke/` (Git ignore).

## Giới hạn nghiệm thu

Chưa kiểm thử đăng nhập/quyền, dữ liệu, schema, CORS, thanh toán, concurrency, worker AI/media và URL lưu trữ trên backend thật. API mới ở working tree backend cần được triển khai lên server frontend đang trỏ đến. Test với fixture và audit source không thay thế live E2E.

Không có API HTTP ghi hoàn thành đọc/quiz trẻ hoặc package đọc CommunityLibrary đầy đủ trong snapshot này, nên frontend không tự tạo progress hoặc giả hoàn thành. Payment chưa có endpoint tra cứu kết quả giao dịch trong catalog; chỉ server/webhook và thông báo xác nhận thanh toán. Không thêm API giả để che các giới hạn này.

Thay đổi chưa commit/push. Backend và các thay đổi đang có của công việc khác được giữ nguyên.

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
