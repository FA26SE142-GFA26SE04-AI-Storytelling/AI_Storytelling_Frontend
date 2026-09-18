<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quy Tắc Kiến Trúc & Phát Triển Ứng Dụng (MagicTales AI Storytelling)

Tài liệu này tổng hợp các quy tắc kiến trúc, quy chuẩn giao diện và kinh nghiệm thực tế của dự án để đảm bảo codebase luôn sạch sẽ, có tính mở rộng cao và trải nghiệm người dùng đồng nhất.

---

## 1. Triết Lý Trải Nghiệm Không Gian 3D (3D Room First)
- **Tất cả tính năng tương tác người dùng đều tích hợp trực tiếp vào Phòng 3D**:
  - Đăng nhập / Đăng ký / Xác thực Email / Quên & Đặt lại mật khẩu &rarr; Tương tác qua **Cặp Sách Nobita (Stage 5)**.
  - Quản lý Hồ sơ trẻ / An toàn nội dung / Phân quyền giám sát / Học tập &rarr; Tương tác qua **Laptop Phụ Huynh (Stage 6)**.
  - Đọc truyện / Thư viện sách thiếu nhi &rarr; Tương tác qua **Kệ Sách Thần Kỳ (Stage 2)**.
  - Sáng tạo câu chuyện / Bàn học &rarr; Tương tác qua **Bàn Học (Stage 1)**.
- **KHÔNG tạo route trang phẳng độc lập bên ngoài**:
  - Không tạo các trang như `/forgot-password`, `/reset-password`, `/invitations` hay `/login` dưới dạng route HTML tĩnh riêng rẽ.
  - Thư mục `src/app/` chỉ giữ duy nhất `page.tsx` (view phòng 3D), `layout.tsx` và `not-found.tsx`.
  - **Liên kết từ bên ngoài (Email, link mời)**: Định cấu hình chuyển hướng thông minh trong `next.config.ts` về trang chủ `/` kèm query params (ví dụ: `?auth=forgot`, `?auth=reset&token=...`, `?code=...`). Khi `Room3DView.tsx` khởi chạy, nó sẽ tự động nhận diện query params và zoom camera thẳng đến vật thể 3D tương ứng.

---

## 2. Quy Chuẩn Tổ Chức Component Overlay (Stage Overlay Architecture)
- **`Room3DView.tsx` chỉ đóng vai trò điều phối (Orchestrator)**:
  - Chỉ chứa logic khởi tạo Three.js canvas, quản lý camera transitions, ánh sáng ngày/đêm và kích hoạt các Overlay khi người dùng click vào vật thể.
  - Tuyệt đối không nhúng hàng trăm dòng JSX giao diện trực tiếp vào `Room3DView.tsx`. Giữ kích thước file này luôn tinh gọn (< 250 dòng).
- **Mỗi vật thể 3D sở hữu một Overlay component riêng**:
  - `src/app/components/backpack/BackpackAuthZoomOverlay.tsx` (Stage 5)
  - `src/app/components/parents/ParentLaptopDashboardOverlay.tsx` (Stage 6)
  - `src/app/components/parents/ParentDeskZoomOverlay.tsx` (Stage 1)
  - `src/app/components/library/LibraryBookshelfZoomOverlay.tsx` (Stage 2)

---

## 3. Nguyên Tắc Phân Rã Component & Kiểm Soát Kích Thước File
- **Quy tắc độ dài file**:
  - Bất kỳ file component nào vượt quá **350 - 400 dòng** đều phải chủ động phân rã thành các subcomponent chuyên biệt theo nghiệp vụ.
- **Mô hình Orchestrator & Self-Contained Subcomponents**:
  - **Component cha (Overlay)**: Chỉ quản lý điều hướng giữa các tab, animation chuyển cảnh toàn cục và hiển thị thanh trạng thái/thông báo chung (`apiFeedback`).
  - **Component con (Forms, Cards, Modals)**: Phải tự quản lý `useState` nội bộ (input, hiển thị mật khẩu, loading submit), trực tiếp gọi hook nghiệp vụ (`useAuth()`, `childProfileService`, `supervisionService`), và chỉ trả về callback kết quả (`onSuccess`, `setFeedback`) cho component cha.
- **Cấu trúc thư mục chuẩn**:
  - `components/backpack/forms/`: Các form xác thực (`LoginForm`, `RegisterForm`, `VerifyEmailForm`, `ForgotPasswordForm`, `ResetPasswordForm`).
  - `components/backpack/profile/`: Màn hình thông tin tài khoản VIP (`UserProfileView`).
  - `components/parents/profiles/`: Thẻ hồ sơ bé, danh sách bé (`ChildProfilesSidebar`, `ChildProfileDetailCard`, `LearningProfileCard`, `TokenQuotaCard`).
  - `components/parents/safety/`: Bộ điều khiển quy tắc an toàn (`SafetyPolicyControls`).
  - `components/parents/supervision/`: Quản lý người giám sát (`SupervisionManager`).
  - `components/parents/modals/`: Các modal nghiệp vụ (`AddChildModal`, `SupervisionPermissionsModal`, `TransferOwnershipModal`, `AcceptInvitationModal`).

---

## 4. Hệ Thống Giao Diện Chuẩn (Design System trong `globals.css`)
- Luôn ưu tiên tái sử dụng các lớp CSS utility trong `src/app/globals.css`:
  - `.dashboard-glass-panel`: Khung bảng kính mờ tối màu với `backdrop-blur-2xl` và hiệu ứng đổ bóng viền phát sáng.
  - `.dashboard-card` / `.dashboard-card-interactive`: Thẻ thông tin và thẻ có hiệu ứng hover border gradient.
  - `.dashboard-input`: Ô nhập liệu tối màu chuẩn, viền zinc-800, focus outline tím/xanh ngọc.
  - `.dashboard-scrollbar`: Thanh cuộn siêu mỏng đồng nhất trên Chrome/Safari/Firefox.
  - `.btn-dashboard-primary`: Nút hành động chính gradient mượt mà.
  - `.badge-safety-configured`: Huy hiệu trạng thái tiêu chuẩn cho Safety và Learning profiles.
- **Màu sắc & Thẩm mỹ**:
  - Dark glassmorphism cao cấp, viền neon tương phản tinh tế (Sky Blue cho Auth/Cặp Sách, Indigo/Purple cho Laptop Phụ Huynh, Amber cho Cảnh báo/Mã token, Emerald cho Hoàn thành/An toàn).
  - Sử dụng biểu tượng từ `lucide-react`.

---

## 5. Hoạt Họa GSAP (GSAP Animations)
- **Scope selector**: Luôn đặt `{ scope: containerRef }` khi gọi `useGSAP` để tránh selector bị va chạm hoặc tìm kiếm sai phạm vi ngoài DOM.
- **An toàn mục tiêu (Target Safety)**:
  - Khi tạo animation mới, luôn sử dụng các hàm tiện ích trong `src/app/utils/gsapAnimations.ts` (`animateModalPop`, `animateStaggerList`, v.v.).
  - Giữ guard check `hasValidTarget` và `gsap.config({ nullTargetWarn: false })` để ngăn chặn console browser cảnh báo khi các phần tử đổi tab hoặc chưa gắn vào DOM.

---

## 6. Trải Nghiệm Người Dùng & Bản Địa Hóa (UX & Copywriting)
- **Tuyệt đối KHÔNG hiển thị thuật ngữ kỹ thuật hay đặc tả nội bộ**:
  - Cấm hiển thị các cụm từ như: `Luồng 7 Bước 7.3`, `Scope Cá nhân Nhánh A/B`, `API: GET /Organization/mine`, `ChildProfile (Draft)`, `NULL lúc tạo`.
  - Thay thế bằng ngôn ngữ thân thiện, ấm áp: *Hồ sơ cá nhân của bé*, *Trường mầm non*, *Lớp học*, *Quy tắc an toàn*, *Cấp độ đọc hiểu*, *Sở thích của bé*.
- **Thông điệp minh bạch về an toàn trẻ em**:
  - Luôn thể hiện cam kết bảo vệ dữ liệu trẻ em (chỉ lưu biệt danh, độ tuổi nhận thức và sở thích học tập để cá nhân hóa nội dung câu chuyện).

---

## 7. Quy Trình Kiểm Tra & Commit (Build & Verification Standard)
1. **Kiểm tra tự động trước khi bàn giao**:
   - Chạy `npm run build` trong thư mục `src` trước khi kết thúc tác vụ để đảm bảo Turbopack và TypeScript check đạt **Exit code 0**, không có cảnh báo nghiêm trọng.
2. **Quy chuẩn ghi commit Git** (chỉ commit khi user yêu cầu ghi commit) :
   - Sử dụng Conventional Commits: `feat(...)`, `refactor(...)`, `fix(...)`, `style(...)`.
   - Mô tả ngắn gọn bằng tiếng Anh rõ ràng, đính kèm gạch đầu dòng các thành phần cụ thể đã thay đổi.
