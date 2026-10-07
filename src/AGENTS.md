<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quy tắc kiến trúc frontend Taletale

Ứng dụng kể chuyện AI cho trẻ em, chủ đề "đầm sen" với linh vật ếch. Chỉ sửa frontend: **không thay đổi backend, API hay database**.

## 1. Cấu trúc thư mục

```
app/
├── page.tsx, layout.tsx, not-found.tsx   # Next.js App Router, chỉ một route "/"
├── icon.svg                              # Favicon (mặt ếch)
├── globals.css                           # Chỉ nạp Tailwind; xem styles/
├── styles/        tokens.css (màu, theme sáng/tối) · base.css (thành phần nhỏ) · shell.css (khung, panel)
├── components/
│   ├── brand/     Linh vật và trang trí đầm sen (Frog, Lotus, PondBackdrop, LilyStepper, HeroPond) + brand.css
│   └── shell/     Khung ứng dụng (AppShell, LoginScreen, nav.ts)
├── features/      Mỗi màn một thư mục, CSS riêng đặt cạnh và import ngay trong component
│   ├── home/ library/ review/ report/ safety/ kid/
│   ├── studio/          Studio tạo truyện (giao diện + useStoryPipeline)
│   └── story-workflow/  Logic nghiệp vụ tạo/duyệt truyện AI (hook + hàm thuần), không có JSX
├── context/       Auth, Theme, WorkspaceData (hồ sơ bé + danh sách truyện)
├── services/      Gọi API backend, mỗi nhóm endpoint một file
├── mocks/         Dữ liệu mẫu thay cho API khi NEXT_PUBLIC_USE_MOCK khác "false"
├── lib/           Hàm tiện ích: motion.ts (animejs), storyView.ts (định dạng truyện)
└── types/         Kiểu dữ liệu theo DTO backend
tests/unit/        Vitest, cấu trúc thư mục giống app/
```

## 2. Quy ước

- **Import**: dùng alias `@/app/...` khi đi ra ngoài thư mục hiện tại, `./` cho file cùng thư mục. Không dùng `../`.
- **Thêm một màn (không gian)**: khai báo id, nhãn, icon trong `components/shell/nav.ts`, tạo `features/<tên>/`, rồi thêm vào bảng `VIEWS` trong `page.tsx`. Component nhận `WorkspaceProps` (`go`, `onKid`).
- **Dữ liệu**: lấy hồ sơ bé và truyện qua `useWorkspaceData()`. Gọi API qua `services/`, không `fetch` trực tiếp trong component. Logic nhiều bước (polling, duyệt) đặt trong hook ở `features/story-workflow/`.
- **Dữ liệu mẫu**: mỗi service có dòng `if (USE_MOCK) Object.assign(service, mock...)` ở cuối file. Thêm endpoint mới thì thêm bản mock tương ứng trong `mocks/`. Test luôn chạy với service thật (`vitest.config.ts`).
- **Link từ email**: `next.config.ts` chuyển `/reset-password`, `/forgot-password` về `/?auth=...`; `LoginScreen` đọc các tham số này (`auth`, `token`, `email`).
- **Kích thước file**: component quá ~250 dòng thì tách theo vùng giao diện (xem `features/studio/`).

## 3. Giao diện

- **Màu**: chỉ dùng biến trong `styles/tokens.css` (`--primary`, `--surface`, `--line`…). Không viết mã màu cứng trong component; cần tông nhạt thì dùng `color-mix(in srgb, var(--primary) 14%, transparent)`.
- **Theme tối**: tự có khi dùng biến. Kiểm tra cả hai theme khi thêm giao diện.
- **Khung**: vùng lớn dùng `.pane` (có `.ph` tiêu đề, `.pb` nội dung cuộn). Nút dùng `.btn` + `.btn-p|s|g|ok|no|k`, đã có sẵn vân lá.
- **Chữ**: tiêu đề `.display` (Baloo 2), nội dung Nunito. Toàn bộ chữ hiển thị bằng tiếng Việt.
- **Icon**: `lucide-react`. Linh vật: `<Frog mood="idle|happy|think" />`.

## 4. Chuyển động

- Dùng animejs qua các hook trong `lib/motion.ts` (`useRiseIn`, `useGrowBars`, `useDrawDonut`, `usePop`, `useSwap`, `shake`, `bounce`, `circleReveal`, `useClickRipple`).
- Luôn tôn trọng `prefersReducedMotion()` và dọn animation trong cleanup (`anim.revert()`).
- Khi animation ghi đè style mà React cũng quản lý (chiều cao, thuộc tính SVG), lưu giá trị đích trong `data-*` để không đọc nhầm giá trị cũ.
