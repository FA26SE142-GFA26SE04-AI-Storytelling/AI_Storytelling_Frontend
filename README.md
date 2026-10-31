# Taletale Frontend

[![Live](https://img.shields.io/badge/Live-taletale.site-1f8a55?style=for-the-badge)](https://www.taletale.site/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-20232a?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Giao diện web của **Taletale**, nền tảng kể chuyện bằng AI cho trẻ 3–10 tuổi, có phụ huynh đồng hành. Phụ huynh nhập ý tưởng, AI kiểm tra an toàn rồi viết dàn ý và truyện. Phụ huynh duyệt từng bước, sau đó hệ thống mới tạo tranh và giọng đọc. Bé chỉ thấy truyện đã được duyệt, trong một góc đọc riêng có chú ếch đồng hành trên đầm sen.

Trang chạy thật: <https://www.taletale.site/> · Backend: `https://api.taletale.site/api/v1`

---

## Mục lục

- [Người dùng và các khu](#người-dùng-và-các-khu)
- [Công nghệ](#công-nghệ)
- [Chạy trên máy](#chạy-trên-máy)
- [Dữ liệu mẫu và backend thật](#dữ-liệu-mẫu-và-backend-thật)
- [Cấu trúc mã nguồn](#cấu-trúc-mã-nguồn)
- [Style thiết kế](#style-thiết-kế)
- [Kiểm thử](#kiểm-thử)
- [Tài liệu liên quan](#tài-liệu-liên-quan)

---

## Người dùng và các khu

Ứng dụng chỉ có một route `/`. Sau khi đăng nhập, giao diện đổi theo vai trò.

### Phụ huynh

Khung `AppShell` có thanh bên với các không gian làm việc (khai báo trong `app/components/shell/nav.ts`):

| Không gian | Thư mục | Nội dung |
| :--- | :--- | :--- |
| Tổng quan | `features/home` | Tiến độ đọc, việc cần làm, điều ước của bé, Hold Mode |
| Hồ sơ bé | `features/children` | Tạo hồ sơ, hồ sơ học tập, người cùng giám sát, quyền truy cập, yêu cầu dữ liệu |
| Studio tạo truyện | `features/studio` | Nhập ý tưởng, theo dõi tiến trình AI, duyệt dàn ý, tranh và giọng đọc, nhập truyện có sẵn |
| Thư viện truyện | `features/library` | Lọc, xem trước như bé thấy, lưu trữ, báo cáo nội dung, nộp thư viện cộng đồng |
| Lộ trình của con | `features/roadmap` | Danh sách truyện bé đọc lần lượt, kho bộ truyện mẫu |
| Duyệt nội dung | `features/review` | Duyệt bản thảo, từ vựng, câu đố, câu hỏi thảo luận, đề xuất sửa của AI |
| Báo cáo | `features/report` | KPI, biểu đồ, nhật ký |
| Cài đặt an toàn | `features/safety` | Chủ đề cho phép / hạn chế / chặn, độ dài tối đa, chế độ duyệt |
| Tài khoản | `features/account` | Hồ sơ, đổi mật khẩu, xoá tài khoản |

### Bé (Chế độ của bé)

`features/kid`. Bé vào bằng nút "Cho bé đọc" của phụ huynh hoặc quét mã QR (`/?kid=<mã>`), không cần đăng nhập. Bé đọc truyện, nghe giọng đọc, làm câu đố, ghi sổ từ vựng và gửi điều ước. Muốn thoát phải qua **cổng phụ huynh** (`ParentalGate`).

### Nhân viên vận hành

`features/staff/StaffApp.tsx`. Đăng nhập có xác thực hai lớp (TOTP).

| Vai trò | Màn chính |
| :--- | :--- |
| Administrator | Chất lượng AI, ca kiểm duyệt chuyển lên, tài khoản vận hành và phụ huynh, danh mục và Prompt Catalog, nhật ký sinh truyện, Token Quota, yêu cầu dữ liệu, báo cáo nghiệp vụ, đối soát thanh toán |
| Moderator | Hàng đợi kiểm duyệt (nhận xử lý rồi ra quyết định theo từng loại mục), chấm điểm AI |
| Content Creator | Truyện mẫu tự soạn hoặc nhập, bộ truyện mẫu, bộ test prompt |

---

## Công nghệ

| Thư viện | Phiên bản | Dùng cho |
| :--- | :--- | :--- |
| Next.js (App Router, Turbopack) | 16.3.4 | Khung ứng dụng |
| React | 19.2.8 | Giao diện |
| TypeScript | 5 | Kiểu dữ liệu, bám theo DTO của backend |
| Tailwind CSS | 4 | Chỉ nạp nền; giao diện chủ yếu viết bằng CSS thuần dùng design token |
| animejs | 4.5 | Chuyển động (bọc trong `app/lib/motion.ts`) |
| lucide-react | 1.44 | Icon |
| qrcode-generator | 2.0.4 | Mã QR cho bé vào đọc |
| Vitest | 3.2 | Test đơn vị |

---

## Chạy trên máy

Cần **Node.js `^20.19.0 || ^22.12.0 || >=24.0.0`** (Next 16 và Vitest 4 không chạy trên Node 18; CI dùng Node 22) và npm. Toàn bộ mã nằm trong thư mục `src/`.

```bash
cd src
npm install
npm run dev          # http://localhost:3000
```

| Lệnh | Việc |
| :--- | :--- |
| `npm run dev` | Chạy môi trường phát triển |
| `npm run build` / `npm run start` | Build và chạy bản production |
| `npm run lint` | ESLint |
| `npm test` | Vitest (`tests/unit`) |
| `npx tsc --noEmit` | Kiểm tra kiểu |

---

## Kết nối backend

Ứng dụng luôn lấy dữ liệu từ API backend. Cấu hình địa chỉ trong `src/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5259     # bỏ trống thì dùng https://api.taletale.site/api/v1
```

`NEXT_PUBLIC_API_URL` được tự chuẩn hoá: bỏ `/swagger`, `/index.html`, dấu `/` thừa và thêm `/api/v1` nếu thiếu (`app/services/apiConfig.ts`).

Quy tắc dữ liệu:

- API backend **đã có** thì luôn gọi thật.
- Chức năng chưa có API hiển thị trạng thái chưa hỗ trợ; không mô phỏng dữ liệu hoặc chuyển sang fallback local khi gọi API thất bại.
- Fixture và network doubles chỉ dùng trong `tests/`. Xem kết quả đối chiếu và giới hạn kiểm chứng tại [`src/docs/core-api-completion.md`](src/docs/core-api-completion.md).
- Tình trạng từng API ghi ở [`src/docs/FRONTEND_PROGRESS.md`](src/docs/FRONTEND_PROGRESS.md) và [`src/docs/BACKEND_API_STATUS.md`](src/docs/BACKEND_API_STATUS.md).

Link trong email (`/reset-password`, `/forgot-password`) được `next.config.ts` chuyển về `/?auth=...` để màn đăng nhập xử lý.

---

## Cấu trúc mã nguồn

```
src/
├── app/
│   ├── page.tsx, layout.tsx, not-found.tsx   # Route duy nhất "/"; page.tsx chọn khu theo vai trò
│   ├── styles/        tokens.css (màu, theme) · base.css (thành phần) · shell.css (khung) · mobile.css
│   ├── components/
│   │   ├── brand/     Frog, Lotus, PondBackdrop, LilyStepper, HeroPond
│   │   └── shell/     AppShell, LoginScreen, AsidePane, NotificationBell, nav.ts
│   ├── features/      Mỗi màn một thư mục, CSS riêng đặt cạnh component
│   │   └── story-workflow/   Logic tạo / duyệt truyện AI (hook và hàm thuần, không JSX)
│   ├── context/       AuthContext, ThemeContext, WorkspaceDataContext (hồ sơ bé + truyện)
│   ├── services/      Gọi API, mỗi nhóm endpoint một file
│   ├── lib/           motion.ts, storyView.ts, quy tắc nghiệp vụ (storyRules, readingRules…)
│   └── types/         Kiểu dữ liệu theo DTO backend
├── docs/              Tiến độ frontend, trạng thái API backend, kế hoạch tích hợp
└── tests/unit/        Vitest, cấu trúc giống app/
```

Quy ước chính (chi tiết ở [`src/AGENTS.md`](src/AGENTS.md)):

- Import ra ngoài thư mục hiện tại dùng alias `@/app/...`, không dùng `../`.
- Component không gọi `fetch` trực tiếp. Mọi lời gọi API đi qua `services/` và trả về `ApiResponse<T>` (`success`, `message`, `data`).
- Thêm một không gian mới: khai báo trong `components/shell/nav.ts`, tạo `features/<tên>/`, thêm vào `VIEWS` trong `page.tsx`.
- Component dài quá khoảng 250 dòng thì tách theo vùng giao diện.
- Toàn bộ chữ hiển thị bằng tiếng Việt.

---

## Style thiết kế

Chủ đề **"Đầm Sen Kể Chuyện"**: một đầm sen yên ả, chú ếch xanh ngồi trên lá sen dẫn bé vào từng câu chuyện, mỗi bước tạo truyện là một chiếc lá sen để ếch nhảy qua. Đặc tả đầy đủ ở [`DESIGN.md`](../DESIGN.md) (thư mục gốc dự án). Nguồn chuẩn của màu là [`src/app/styles/tokens.css`](src/app/styles/tokens.css).

Giao diện phục vụ hai nhóm với hai cảm xúc khác nhau:

- **Phụ huynh:** gọn, rõ, đáng tin. Nền mặt nước nhạt, thẻ trắng. Trạng thái nhận ra ngay qua màu và nhãn.
- **Bé:** to, ấm, nhiều không khí. Nền trời và mặt nước, chữ lớn, nút to như đồ chơi, ếch phản ứng theo từng thao tác.

**Theme tối** là chế độ **đọc trước giờ ngủ**, không chỉ đảo màu: tương phản dịu, nền xanh đêm, đom đóm vàng. Theme bật bằng `data-theme="dark"` trên `<html>` (`ThemeContext`), chuyển theme có hiệu ứng vòng tròn loang.

### Màu

Chỉ dùng biến CSS (`var(--primary)`…), không viết mã màu cứng trong component. Cần tông nhạt thì dùng `color-mix(in srgb, var(--primary) 14%, transparent)`.

| Token | Sáng | Tối | Vai trò |
| :--- | :--- | :--- | :--- |
| `--primary` | `#2fa866` | `#3dd68c` | Lá sen: hành động chính, tab đang chọn, viền focus |
| `--primary-strong` | `#1f8a55` | `#1f8a55` | Nền nút chính (chữ trắng đạt AA) |
| `--mint` / `--ok-ink` | `#14b8a6` / `#0f766e` | `#2dd4bf` / `#5eead4` | An toàn, đã duyệt, kiểm tra đạt |
| `--gold` / `--warn-ink` | `#ffd166` / `#8f5200` | `#ffd166` / `#ffc857` | Chờ duyệt, cảnh báo nhẹ, sao thưởng |
| `--danger` | `#b42318` | `#ff8a80` | Lỗi, chủ đề bị chặn, lưu trữ (luôn trên nền nhạt 10–12%) |
| `--lotus` | `#f6a9c4` | `#e98aaf` | Hoa sen, **chỉ để trang trí**, không dùng cho trạng thái |
| `--rose` | `#ff8fa3` | `#ff8fa3` | Đáp án sai trong câu đố của bé (mềm, không gây sợ) |
| `--bg` / `--text` | `#f4fbf6` / `#1f2f27` | `#0f1713` / `#e8f4ec` | Nền và chữ chính |
| `--surface`, `--line` | `#ebf7f0`, `#dcebe1` | `#1d2b24`, `#26372e` | Ô nhập, lớp bề mặt, viền |
| `--paper` / `--ink-warm` | `#fcfffc` / `#1f3a2d` | `#1a271f` / `#e3f2e9` | Trang sách của bé, bản thảo |

Nhãn trạng thái `.pill`:

| Class | Dùng cho |
| :--- | :--- |
| `.pill.ok` | Đã duyệt, sẵn sàng đọc |
| `.pill.wait` | Chờ duyệt |
| `.pill.draft` | Nháp, lưu trữ, từ chối |
| `.pill.flag` | Lỗi tạo media, bị chặn |
| `.pill.ai` | Do AI tạo, số cảnh, số câu |

### Chữ

- **Baloo 2** (`.display`, độ đậm 600–800): logo, tiêu đề màn, tên truyện, chữ truyện của bé, con số KPI.
- **Nunito** (400–800): nhãn, form, bản thảo, mô tả. Web desktop dùng body 13px vì mật độ thông tin cao.
- Không dùng chữ gradient, không viết HOA toàn bộ câu tiếng Việt. Ô nhập trên điện thoại tối thiểu 16px.

### Hình khối và bề mặt

- **Bo góc mềm**, không có phần tử tương tác góc vuông: ô nhập 12px, chip 14px hoặc tròn hẳn, thẻ 18–24px, sách của bé 44px.
- **Nút chính hình lá** (`border-radius: 18px 7px 18px 7px`) kèm **vân lá** chìm (`--vein`). Đây là dấu hiệu nhận diện của Taletale.
- Nền màn hình là lớp **mặt nước** (`--water`). Thẻ là `--panel` có viền `--line` và bóng rất nhẹ. Thanh trên và thanh bên dùng kính mờ (blur 18px).
- Ảnh bìa tạm khi chưa có tranh là gradient theo id truyện, có mặt trăng và mặt nước.

### Thành phần dùng chung (`base.css`, `shell.css`)

| Class | Ý nghĩa |
| :--- | :--- |
| `.pane` › `.ph` (tiêu đề) + `.pb` (nội dung cuộn) | Khung một cột trong không gian làm việc |
| `.btn` + `.btn-p` / `.btn-s` / `.btn-g` / `.btn-ok` / `.btn-no` / `.btn-kid` | Nút chính / phụ / chỉ chữ hoặc icon / duyệt / lưu trữ, xoá / mở Chế độ của bé. `.btn-c` kéo hết chiều ngang |
| `.inp`, `.field` + `.lbl` | Ô nhập và nhãn |
| `.chip` trong `.chips`, `.seg` | Bộ lọc hoặc lựa chọn nhiều; nhóm 2–4 lựa chọn ngang |
| `.tog` | Công tắc |
| `.notice.ok` / `.notice.warn` / `.notice.err`, `.err-banner`, `.toast` | Thông báo trong khung, banner lỗi, thông báo nổi |
| `.empty` | Trạng thái rỗng: ếch, tiêu đề, một dòng giải thích, tối đa 2 nút |
| `.kv` | Lưới cặp nhãn – giá trị |

Thành phần thương hiệu trong `components/brand`:

- `<Frog mood="idle|happy|think" />`: linh vật SVG, biết chớp mắt và thở nhẹ. `happy` khi bé làm đúng, `think` khi sai hoặc khi có lỗi, không bao giờ buồn hay giận.
- `PondBackdrop`: nền ao có lá sen, đom đóm, lau sậy, chuồn chuồn.
- `HeroPond`: ếch trên lá sen ở đầu Trang chủ, ẩn khi màn hẹp hơn 900px.
- `LilyStepper`: các bước tạo truyện là lá sen (`done`, `run`, `todo`), ếch nhảy sang lá đang chạy.

Icon dùng `lucide-react`.

### Chuyển động

Mượt và giảm tốc tự nhiên như mặt nước, không nảy liên tục. Dùng các hook trong `app/lib/motion.ts`:

| Hook / hàm | Hiệu ứng | Dùng ở |
| :--- | :--- | :--- |
| `useRiseIn` | Mờ dần vào, nhích lên 10–12px, lần lượt cách nhau 28–70ms | Danh sách, lưới, thẻ |
| `useSwap` | Mờ và trượt nhẹ khi nội dung đổi | Lật trang, đổi cảnh |
| `usePop` | Phóng từ 0.96 lên 1 | Toast, thẻ đổi trạng thái |
| `useClickRipple` | Vòng nước loang tại điểm chạm | Mọi lần bấm ở khu người lớn |
| `circleReveal` | Vòng tròn loang từ nút đổi theme | Chuyển sáng / tối |
| `useGrowBars`, `useDrawDonut` | Cột mọc lên, donut vẽ dần | Trang chủ, báo cáo |
| `bounce`, `shake` | Nhún hoặc lắc một lần | Ếch phản ứng trong Chế độ của bé |

Luôn tôn trọng `prefersReducedMotion()` và dọn animation trong cleanup (`anim.revert()`).

### Nên và không nên

- **Nên:** dùng màu theo vai trò; bo tròn mọi phần tử tương tác; cho ếch phản ứng đúng lúc; dùng giọng gia đình ấm áp ("Cho bé đọc", "Giỏi quá! +5 sao"); hiển thị rõ AI đang làm gì, có cách thử lại và dừng; kiểm tra cả hai theme khi thêm giao diện.
- **Không nên:** gradient tím, chàm kiểu "AI" hay chữ gradient; animation nảy vô hạn; quá 4 lựa chọn cạnh tranh nhau trên một màn; thu nhỏ bố cục desktop nhiều cột lên điện thoại; cho bé thoát Chế độ của bé, mở cài đặt hay xem bản nháp khi chưa qua cổng phụ huynh.

---

## Kiểm thử

```bash
cd src
npm test             # Vitest, chạy với service thật (không bật dữ liệu mẫu)
npm run lint
npx tsc --noEmit
```

Test nằm trong `tests/unit/`, chia theo nhóm: `story-workflow`, `studio`, `services`, `guardian`, `reading`, `adaptive`, `staff`.

---

## Tài liệu liên quan

| Tài liệu | Nội dung |
| :--- | :--- |
| [`src/AGENTS.md`](src/AGENTS.md) | Quy tắc kiến trúc và giao diện frontend |
| [`src/docs/FRONTEND_PROGRESS.md`](src/docs/FRONTEND_PROGRESS.md) | Tiến độ theo từng luồng nghiệp vụ, phần còn chờ backend |
| [`src/docs/BACKEND_API_STATUS.md`](src/docs/BACKEND_API_STATUS.md) | Trạng thái các API backend |
| `../DESIGN.md`, `../PRODUCT.md` (thư mục gốc dự án) | Hệ thống thiết kế và định hướng sản phẩm |
