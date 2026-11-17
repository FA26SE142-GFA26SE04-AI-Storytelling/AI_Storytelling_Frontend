# Giảm mật độ đường viền (De-bordering) và làm dịu giao diện Tự soạn truyện (Manual Authoring)

Written against: `01b6085`

## Evidence chain
- **Ảnh chụp màn hình thực tế**: `media_1794626391492_1ed233c4.jpg` (chế độ tối — Dark Mode của màn hình `Tự viết` / `ParentAuthoringWorkspace`).
- **Tài liệu thiết kế quản trị**:
  - `src/DESIGN.md` (`Elevation & Depth`: *"rely on background surface shifts (`surface` vs `paper` vs `panel`)... so reading remains sharp in both light and dark modes"*; `Layout & Spacing`: *"Top-Bar Stepper & Split Writing Desk (`.pa-flow` / `.pa-write-split`)"*).
  - `src/AGENTS.md` (quy ước hệ thống thiết kế và giới hạn hiển thị).
- **Hệ thống Token & Primitive**:
  - `src/app/styles/tokens.css:5-68` (`--bg`, `--panel`, `--surface`, `--surface-2`, `--paper`, `--line`, `--line-2`, `--primary`, `--shadow`).
  - `src/app/styles/base.css:39-105` (`.btn`, `.btn-s` dòng 68 có `border: 1px solid var(--line-2)`, `.btn-g` dòng 70–72 không viền, `.inp` dòng 97 có `border: 1px solid var(--line)`).
  - `src/app/styles/shell.css:101-106` (`.pane.st-page`, `.st-card`).
- **Tệp nguồn được kiểm toán**:
  - `src/app/features/authoring/authoring.css:14-172`
  - `src/app/features/story-workflow/StepRail.tsx:29-48`
  - `src/app/features/authoring/ParentAuthoringWorkspace.tsx:253-387`
  - `src/app/features/staff/CreatorEditor.tsx:177-250`
  - `src/app/features/authoring/StoryFields.tsx:18-39`
  - `src/app/features/authoring/AuthoringGuides.tsx:38-96`
  - `src/app/features/authoring/ParentSetupPanel.tsx:15-41`

## Design decision
Giao diện Tự soạn truyện hiện tại đang có **hơn 37 đường viền hình chữ nhật và viên thuốc (pill) lồng nhau từ 3 đến 5 lớp** trên cùng một màn hình (khung ngoài `.pane` → khung `.pa-steps` → nhãn `CÁC BƯỚC` có viền + 4 thẻ bước `.pa-stepbtn` có viền + vòng tròn số `.pa-num` có viền; khung `.pa-manuscript-card` viền dày `1.5px` → hộp nét đứt `.pa-import-bar` + 3 nút `.btn-s` có viền + ô tiêu đề có viền + ô nội dung viền dày `1.5px` + 2 ô nguồn/cam kết có viền; cột phải xếp chồng 4 khung `.pa-rail-card` có viền + 10 nút mẫu hướng dẫn `.btn-s` có viền). Sự chồng chéo này tạo cảm giác "khung lồng trong khung" (wireframe box-in-box) nặng nề, làm phân tán sự tập trung vào trang viết.

Phương án điều chỉnh chuyển sang **phân cấp bằng độ chênh màu nền (`--bg` → `--surface` → `--paper`), khoảng trắng và đường phân cách mảnh (hairline divider)** thay cho các hộp viền 4 cạnh:
1. **Thanh tiến trình 4 bước phẳng, liền mạch (Flat Connected Stepper)**: Bỏ khung viền bao ngoài `.pa-steps`, bỏ nhãn đóng khung `CÁC BƯỚC`, và bỏ 4 viền thẻ rời trên `.pa-stepbtn` cùng viền vòng tròn `.pa-num`. Toàn bộ 4 bước nằm trên một dải nền mềm (`--surface`), chỉ bước đang mở (`.pa-stepbtn.on`) nổi lên bằng nền `--panel` và đổ bóng nhẹ.
2. **Trang bản thảo `--paper` liền mạch, không lồng hộp (Borderless Editorial Sheet)**:
   - Bỏ viền dày `1.5px` trên `.pa-manuscript-card`, biến cột trái thành một tờ giấy `--paper` dịu mắt với bóng đổ mềm.
   - Xóa hộp viền nét đứt `.pa-import-bar` và bỏ viền `.btn-s` của 3 nút nhập (`Nhập từ tệp`, `Dán văn bản`, `Tải tệp mẫu`); chuyển thành thanh công cụ gọn nhẹ dùng nút phẳng không viền (`.btn-g`) ngăn cách bằng một đường kẻ mảnh phía dưới.
   - Bỏ viền hộp 4 cạnh của ô `Tên truyện` (`.pa-title-inp` chỉ giữ gạch chân mảnh kiểu tiêu đề trang viết) và bỏ viền hộp `1.5px` của `Nội dung` (`.pa-story-textarea` dùng nền giấy dịu, chỉ hiện viền mảnh khi `:focus`). Hai ô `Nguồn nội dung` và `Cam kết quyền sử dụng` dùng nền `--surface` không viền khi nghỉ.
3. **Cột công cụ đồng hành bên phải gộp thành một bề mặt duy nhất (Single Unified Companion Surface)**:
   - Thay vì 4 thẻ `.pa-rail-card` đóng khung viền riêng biệt xếp chồng lên nhau, gộp `.pa-write-rail` thành **một khối nền `--surface` duy nhất không viền**; các mục bên trong (`Mục đích và cách đọc`, `Mẫu hướng dẫn từ catalog`, `AI gợi ý theo bản nháp`, `Lịch sử phiên bản`) phân tách nhẹ nhàng bằng đường kẻ ngang mảnh (`border-top: 1px solid var(--line)`).
   - Trong `Mẫu hướng dẫn từ catalog` (`AuthoringGuides.tsx`), thay 10 nút `.btn-s` có viền bằng các thẻ chip nền mềm không viền (`.pa-guide-chip`), giảm ngay 10 khung viền rối mắt ở cột phải.

## Reuse
- Tái sử dụng hệ màu bề mặt trong `src/app/styles/tokens.css` (`--paper`, `--panel`, `--surface`, `--surface-2`, `--line`, `--primary`, `--shadow`).
- Tái sử dụng lớp nút không viền `.btn-g` trong `src/app/styles/base.css:70-72` cho các thao tác phụ (`Bản nháp mới`, `Nhập từ tệp`, `Dán văn bản`, `Tải tệp mẫu`).
- Giữ nguyên cấu trúc component `StepRail`, `StoryFields`, `AuthoringGuides`, `ParentSetupPanel`, `ParentAuthoringWorkspace`, `CreatorEditor` và toàn bộ nhãn tiếng Việt / `aria-label` để không ảnh hưởng bất kỳ API hay bài kiểm thử nào.

## Changes

### 1. Thanh tiến trình 4 bước không viền & Thanh đầu trang gọn nhẹ
- **File**: `src/app/features/story-workflow/StepRail.tsx` (dòng 29–48)
- **File**: `src/app/features/authoring/ParentAuthoringWorkspace.tsx` (dòng 253–291)
- **File**: `src/app/features/authoring/authoring.css` (dòng 62–97)
- **Current**:
  - `.pa-steps` có `border: 1px solid var(--line); border-radius: 20px; padding: 12px 16px`.
  - `<b className="pa-steps-title">Các bước</b>` có `border: 1px solid var(--line); border-radius: 999px`.
  - Mỗi `.pa-stepbtn` có `border: 1px solid var(--line); border-radius: 14px`, và `.pa-num` có `border: 1px solid var(--line-2)`.
  - `.pa-kid` có `border: 1px solid ...` và nút `Bản nháp mới` dùng `.btn-s` có viền.
- **Target**:
  - Trong `StepRail.tsx`: Bỏ phần tử `<b className="pa-steps-title">Các bước</b>` dư thừa (vì `<nav aria-label="Các bước soạn truyện">` và các số thứ tự `1..4` đã tự giải thích rõ ràng).
  - Trong `ParentAuthoringWorkspace.tsx`: Đổi nút `Bản nháp mới` từ `btn btn-s` sang `btn btn-g pa-new-draft-btn` để nhẹ nhàng trên thanh đầu trang.
  - Trong `authoring.css`:
    - `.pa-kid`: `border: 0; background: color-mix(in srgb, var(--primary) 12%, var(--surface));`
    - `.pa-steps`: `padding: 4px; border: 0; border-radius: 16px; background: var(--surface);`
    - `.pa-steps ol`: `gap: 6px;`
    - `.pa-stepbtn`: `border: 0; border-radius: 12px; background: transparent; padding: 9px 12px;`
    - `.pa-stepbtn:not(:disabled):hover`: `background: color-mix(in srgb, var(--surface-2) 70%, transparent);`
    - `.pa-stepbtn.on`: `background: var(--panel); box-shadow: 0 4px 14px -6px color-mix(in srgb, var(--shadow) 24%, transparent);`
    - `.pa-stepbtn.done:not(.on)`: `background: transparent;`
    - `.pa-stepbtn .pa-num`: `border: 0; background: var(--surface-2);`

### 2. Trang viết `--paper` liền mạch, bỏ hộp nét đứt `.pa-import-bar` và bỏ viền hộp ô nhập
- **File**: `src/app/features/authoring/ParentAuthoringWorkspace.tsx` (dòng 313–338)
- **File**: `src/app/features/staff/CreatorEditor.tsx` (dòng 177–218)
- **File**: `src/app/features/authoring/StoryFields.tsx` (dòng 18–39)
- **File**: `src/app/features/authoring/authoring.css` (dòng 14, 23, 117–125)
- **Current**:
  - `.pa-manuscript-card` có `border: 1.5px solid var(--line-2); background: var(--panel)`.
  - `.pa-import-bar` có `border: 1px dashed var(--line-2)` bọc 3 nút `.btn-s` có viền.
  - `.pa-title-inp` và `.pa-story-textarea` đều có viền hộp 4 cạnh dày (`border: 1.5px solid var(--line-2)`).
  - `.pa-fields .inp` (`Nguồn nội dung`, `Cam kết quyền sử dụng`) có viền hộp 4 cạnh (`border: 1px solid var(--line)`).
- **Target**:
  - Trong `ParentAuthoringWorkspace.tsx` và `CreatorEditor.tsx`:
    - Đổi 3 nút trong `.pa-import-bar` (`Nhập từ tệp`, `Dán văn bản`, `Tải tệp mẫu`) từ `className="btn btn-s"` sang `className="btn btn-g pa-import-btn"` để hiển thị như một hàng công cụ văn bản nhẹ nhàng, không còn 3 khung viền lồng trong hộp nét đứt.
    - Trong `CreatorEditor.tsx`, bỏ viền của `.st-card.ce-head` bằng lớp `.ce-head` phẳng (`border: 0; background: transparent; padding: 0 0 8px; border-bottom: 1px solid var(--line); border-radius: 0`).
  - Trong `authoring.css`:
    - `.pa-card`: `border: 0; border-radius: 20px; background: var(--surface);`
    - `.pa-manuscript-card`: `background: var(--paper); border: 0; box-shadow: 0 12px 32px -18px color-mix(in srgb, var(--shadow) 28%, transparent); padding: 24px 26px; gap: 18px;`
    - `.pa-import-bar`: `padding: 0 0 12px; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; background: transparent;`
    - `.pa-import-btn`: `padding: 5px 10px; border-radius: 10px; background: color-mix(in srgb, var(--surface) 75%, transparent); font-size: var(--fs-xs); color: var(--text);`
    - `.pa-title-inp`: `font-size: var(--fs-xl) !important; font-weight: 800 !important; background: transparent !important; border: 0 !important; border-bottom: 1px solid var(--line) !important; border-radius: 0 !important; padding: 8px 2px 10px !important; transition: border-color .15s;` và khi `:focus` chỉ đổi màu gạch chân `border-bottom-color: var(--primary) !important; outline: none;`.
    - `.pa-story-textarea`: `background: color-mix(in srgb, var(--surface) 50%, var(--paper)) !important; border: 1px solid transparent !important; border-radius: 16px; padding: 16px 18px; min-height: 320px;` và khi `:focus` mới hiện `border-color: color-mix(in srgb, var(--primary) 55%, transparent) !important; background: var(--paper) !important;`.
    - `.pa-manuscript-card .pa-fields .inp`: `background: color-mix(in srgb, var(--surface) 65%, var(--paper)); border-color: transparent;` (khi `:focus` hiện `border-color: var(--primary)`).

### 3. Gộp cột đồng hành bên phải thành một bề mặt duy nhất & Bỏ 10 viền nút mẫu hướng dẫn
- **File**: `src/app/features/authoring/AuthoringGuides.tsx` (dòng 45–59)
- **File**: `src/app/features/authoring/authoring.css` (dòng 110, 126–164)
- **Current**:
  - `.pa-write-rail` xếp 4 thẻ `.pa-rail-card` / `.pa-fold` rời nhau, mỗi thẻ có `border: 1px solid var(--line); border-radius: 18px; background: var(--surface)`.
  - `AuthoringGuides.tsx` dùng `className="btn btn-s"` cho cả 10 mẫu hướng dẫn trong catalog, tạo 10 viền viên thuốc dày đặc; khung chi tiết `.pa-guide-detail` lại có thêm `border: 1px solid var(--line-2)`.
- **Target**:
  - Trong `AuthoringGuides.tsx`:
    - Đổi lớp của các nút mẫu hướng dẫn từ `btn ${selected?.id === g.id ? 'btn-ok' : 'btn-s'}` sang `btn pa-guide-chip ${selected?.id === g.id ? 'on' : ''}`.
  - Trong `authoring.css`:
    - `.pa-write-rail`: `background: var(--surface); border-radius: 20px; padding: 6px 18px; gap: 0; border: 0;` (một bề mặt duy nhất cho toàn bộ cột phải).
    - `.pa-rail-card, .pa-write-rail > .pa-fold`: `padding: 16px 0; border: 0; border-radius: 0; background: transparent; border-top: 1px solid var(--line);` và phần tử đầu tiên `:first-child { border-top: 0; }`.
    - `.pa-rail-card .inp`: `background: var(--panel); border-color: transparent;` (khi `:focus` hiện `border-color: var(--primary)`).
    - `.pa-guide-chip`: `background: var(--panel); border: 0; border-radius: 12px; padding: 7px 12px; font-size: var(--fs-xs); font-weight: 700; color: var(--text); text-align: left;`
    - `.pa-guide-chip:hover`: `background: var(--surface-2);`
    - `.pa-guide-chip.on`: `background: color-mix(in srgb, var(--primary) 18%, var(--panel)); color: var(--primary); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 45%, transparent);`
    - `.pa-guide-detail`: `border: 0; background: var(--panel); border-radius: 14px; padding: 14px;`

## Scope
- **Tổng số tệp sửa đổi khi triển khai**: 5 tệp nguồn (`StepRail.tsx`, `ParentAuthoringWorkspace.tsx`, `CreatorEditor.tsx`, `AuthoringGuides.tsx`, `authoring.css`) + cập nhật `src/DESIGN.md` nếu cần đồng bộ mô tả.
- **Độ tin cậy (Confidence)**: **High** — Đã đối chiếu trực tiếp từng lớp CSS trong ảnh chụp màn hình `media_1794626391492_1ed233c4.jpg` với mã nguồn thực tế và kiểm tra toàn bộ bài test hiện hành.

## Validation
- Chạy kiểm thử đơn vị và tích hợp:
  - `npx vitest run tests/unit/features tests/unit/services/authoringIntegration.test.ts`
- Chạy kiểm tra tĩnh và đóng gói:
  - `npx eslint app/features/authoring/ParentAuthoringWorkspace.tsx app/features/staff/CreatorEditor.tsx app/features/authoring/StoryFields.tsx app/features/authoring/AuthoringGuides.tsx app/features/story-workflow/StepRail.tsx`
  - `npm run build`
- Kiểm tra trực quan trên cả **Dark Mode** và **Light Mode**:
  - Đảm bảo màn hình Bước 1 chỉ còn **2 vùng bề mặt chính** (Trang giấy `--paper` bên trái và Bảng đồng hành `--surface` bên phải) cùng **1 dải bước phẳng** phía trên, không còn hiện tượng hộp viền lồng trong hộp viền.
  - Kiểm tra trạng thái `:focus-visible` bằng bàn phím (`Tab`) vẫn hiển thị rõ ràng trên mọi nút và ô nhập.

## Stop conditions
- Dừng và báo lại nếu bất kỳ bài kiểm thử nào trong `tests/unit/features` hoặc `authoringIntegration.test.ts` thất bại.
- Không thay đổi bất kỳ chữ ký hàm (function signature), payload API, hay thuộc tính `aria-label` / tên nút mà test đang truy vấn.

## Design documentation
- Sau khi triển khai mã nguồn, cập nhật mục **Layout & Spacing → Top-Bar Stepper & Split Writing Desk** trong `src/DESIGN.md` để ghi nhận quy tắc ưu tiên phân tách bằng bề mặt (`--paper` / `--surface` + hairline divider) thay vì viền hộp lồng nhau.
