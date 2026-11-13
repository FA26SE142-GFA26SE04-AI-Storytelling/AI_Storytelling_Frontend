---
version: alpha
name: Taletale
description: Design system for Taletale, an AI-assisted Vietnamese children's storytelling platform with a botanical pond aesthetic and calm editorial moderation surfaces.
omitted:
  - token: spacing
    reason: app/styles/tokens.css does not define global spacing custom properties; spacing is governed at layout and component levels rather than a :root token scale.
  - token: rounded
    reason: app/styles/tokens.css does not define global border-radius custom properties; shapes follow class conventions (.pane, .btn, .pill, .chip) without inventing custom-property aliases.
colors:
  on-primary: "#ffffff"
  on-gold: "#3d2a00"
  bg: "#f4fbf6"
  chrome: "#ffffff"
  panel: "#ffffff"
  surface: "#ebf7f0"
  surface-2: "#dcf0e5"
  paper: "#fcfffc"
  line: "#b3cfbf"
  line-2: "#8fb9a0"
  text: "#1f2f27"
  muted: "#547062"
  faint: "#8fa89b"
  ink-warm: "#1f3a2d"
  link: "#17754a"
  primary: "#2fa866"
  primary-strong: "#1f8a55"
  gold: "#ffd166"
  gold-deep: "#d97706"
  rose: "#ff8fa3"
  mint: "#14b8a6"
  sky: "#38b2f5"
  danger: "#b42318"
  ok-ink: "#0f766e"
  warn-ink: "#8f5200"
  lotus: "#f6a9c4"
  lotus-deep: "#ee86ab"
  lotus-light: "#fcd3e1"
  shadow: "#1f3a2d"
  tooltip: "#1f2f27"
typography:
  ui:
    fontFamily: "Nunito, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  display:
    fontFamily: "Baloo 2, Nunito, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 800
  story:
    fontFamily: "Andika, Nunito, system-ui, sans-serif"
    fontSize: 15px
    fontWeight: 400
  fs-xs:
    fontFamily: "Nunito, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: 12px
  fs-sm:
    fontFamily: "Nunito, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: 13px
  fs-md:
    fontFamily: "Nunito, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: 15px
  fs-lg:
    fontFamily: "Baloo 2, Nunito, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 800
  fs-xl:
    fontFamily: "Baloo 2, Nunito, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 800
  fs-2xl:
    fontFamily: "Baloo 2, Nunito, system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 800
components:
  pane:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    typography: "{typography.ui}"
  button-primary:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.on-primary}"
    typography: "{typography.fs-sm}"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.on-gold}"
    typography: "{typography.fs-sm}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.fs-sm}"
  moderation-manuscript:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    typography: "{typography.story}"
  moderation-audit-rail:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.fs-sm}"
  moderation-status-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.fs-sm}"
  moderation-queue-item:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    typography: "{typography.fs-sm}"
  moderation-callout-ok:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ok-ink}"
    typography: "{typography.fs-sm}"
  moderation-callout-warn:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.warn-ink}"
    typography: "{typography.fs-sm}"
  moderation-callout-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    typography: "{typography.fs-sm}"
  link-action:
    textColor: "{colors.link}"
    typography: "{typography.fs-sm}"
  unread-badge:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.on-primary}"
    typography: "{typography.fs-xs}"
  tooltip:
    backgroundColor: "{colors.tooltip}"
    textColor: "{colors.bg}"
    typography: "{typography.fs-xs}"
---

## Overview

Taletale uses a serene lotus-pond design language that balances friendly Vietnamese storytelling warmth with high-clarity inspection tools. Shared surfaces layer soft frosted panes over calm water backdrops, reserving crisp paper surfaces (`paper`) for reading Creator-authored manuscripts, safety evidence, and long-form moderation reviews without visual clutter.

## Colors

All feature stylesheets and components must resolve colors exclusively from CSS custom properties defined in `app/styles/tokens.css`, deriving translucent tints via `color-mix(in srgb, var(--token) <pct>%, transparent)`.

- **Surface hierarchy**: Anchor page backdrops to `bg`, top/side navigation chrome to `chrome`, primary card panes to `panel`, subtle resting containers to `surface`, active or nested controls to `surface-2`, and manuscript reading cards to `paper`.
- **Semantic states**: Pair `mint` / `ok-ink` for verified readiness and approval, `gold` / `warn-ink` for pending claims and non-blocking cautions, `danger` for blocking issues, rejections, and content removal actions, and `primary` / `primary-strong` for primary actions and active navigation emphasis.
- **Gold discipline**: Restrict `gold` and `.btn-gold` strictly to rare primary AI creation/invitation actions and active workspace pills so warning badges (`warn-ink`) remain unmistakable in moderation workflows.
- **Moderator evidence contrast**: Distinguish authored Creator text (`paper` bordered by `line`) from Moderator audit alerts (`warn-ink` or `danger` tinted callouts) so reviewers separate story prose from flags immediately.

## Themes

Light mode is defined in `:root` (above in YAML frontmatter); dark mode activates via `[data-theme="dark"]` on `<html>` with semantic polarity automatically inverted through CSS custom properties. Non-single-color backdrop gradients (`--water`, `--kid-bg`, `--login-bg`) and the leaf-vein mask (`--vein`) are omitted from YAML `colors` and maintained exclusively in `app/styles/tokens.css`.

| Token | Light (`:root`) | Dark (`[data-theme="dark"]`) | Role |
| :--- | :--- | :--- | :--- |
| `bg` | `#f4fbf6` | `#0f1713` | Base document canvas |
| `chrome` | `#ffffff` | `#141e19` | Header and navigation chrome base |
| `panel` | `#ffffff` | `#17231d` | Floating pane and modal surface |
| `surface` | `#ebf7f0` | `#1d2b24` | Soft nested surface and inputs |
| `surface-2` | `#dcf0e5` | `#263830` | Active chip, secondary button, hover fill |
| `paper` | `#fcfffc` | `#1a271f` | Story manuscript and inspection reading surface |
| `line` | `#b3cfbf` | `#3b5548` | Default structural hairline border |
| `line-2` | `#8fb9a0` | `#54775f` | Emphasized divider and interactive border |
| `text` | `#1f2f27` | `#e8f4ec` | Primary ink |
| `muted` | `#547062` | `#a3bdb0` | Secondary labels and metadata |
| `faint` | `#8fa89b` | `#6f8a7c` | Placeholder, timestamp, and subtle counters |
| `ink-warm` | `#1f3a2d` | `#e3f2e9` | Deep botanical ink accent |
| `link` | `#17754a` | `#6ee7a8` | Interactive hyperlink text |
| `primary` | `#2fa866` | `#3dd68c` | Primary brand accent and focus ring |
| `primary-strong` | `#1f8a55` | `#1f8a55` | Primary CTA background |
| `gold` | `#ffd166` | `#ffd166` | Active nav pill and rare AI highlight |
| `gold-deep` | `#d97706` | `#f59e0b` | Active indicator border and amber accent |
| `rose` | `#ff8fa3` | `#ff8fa3` | Unread badge counter |
| `mint` | `#14b8a6` | `#2dd4bf` | Completion dot and soft ok tint |
| `danger` | `#b42318` | `#ff8a80` | Errors, blockers, reject and remove actions |
| `ok-ink` | `#0f766e` | `#5eead4` | High-contrast verified text on subtle mint tint |
| `warn-ink` | `#8f5200` | `#ffc857` | High-contrast warning text on subtle gold tint |
| `lotus` | `#f6a9c4` | `#e98aaf` | Mascot/lotus accent |
| `lotus-deep` | `#ee86ab` | `#c96a92` | Deep lotus petal accent |
| `lotus-light` | `#fcd3e1` | `#f5b7cf` | Soft lotus highlight |
| `shadow` | `#1f3a2d` | `#000000` | Tint base for diffused elevation shadows |
| `tooltip` | `#1f2f27` | `#e8f4ec` | Tooltip surface ink |

## Typography

Use only the three loaded Vietnamese-capable Google font families (`ui`, `display`, `story`) and the six typographic size variables (`fs-xs` through `fs-2xl`). Never declare raw pixel `font-size` literals inside feature CSS or JSX.

- **UI controls & metadata (`ui`)**: Use `Nunito` for queue lists, metadata key-value pairs, checklist labels, form fields, and action buttons.
- **Section headers (`display`)**: Use `.display` / `.sec-h` (`Baloo 2`, weight `800`) sparingly for workspace headers and panel headings (`fs-lg` to `fs-2xl`).
- **Story manuscripts & excerpts (`story`)**: Use `Andika` for Creator-submitted story text, scene paragraphs, descriptions, moral lessons, and quoted safety excerpts inside Moderation panels so single-story glyphs (`a`, `g`) and look-alikes (`I`, `l`, `1`) remain effortless to audit.

## Layout

- **Shared shell**: Workspaces run inside `.shell.no-status.top-nav` with a frosted `.top` header and full-bleed `.stage` grid holding `.pane` containers with scrollable `.pb` regions.
- **Two-tier status tabs & collapsible queue desk (`.mod-nav`, `.mod-grid`)**: Above `.mod-grid`, split workflow status navigation inside `.mod-nav` into two clear horizontal tiers instead of merging active and completed statuses on one line: a top tier switches between **`Xử lý hồ sơ`** (active operational work) and **`Kết quả xử lý`** (completed/archived outcomes), and a dedicated second tier underneath renders only the selected group's secondary status sub-tabs. Pair a collapsible `.mod-list-col` queue drawer (toggled cleanly via `.list-collapsed` when focused reading is desired) with an expansive `.mod-detail-col` inspection desk on desktop while falling back to list-or-detail toggling via `.has-detail` on narrow screens.
- **Split editorial review workbench (`.mod-desk-split`)**: Place the title header and `InspectionSnapshotBar` readiness strip spanning the top, then split claimed review panels side-by-side into a **Left Reading Canvas (`.mod-desk-main`, ~60%)** dedicated to Creator/family text, outlines, scenes, and learning materials with view-filter pills, paired beside a **Right Sticky Audit & Decision Rail (`.mod-desk-rail`, ~40%)** holding AI evidence, inline checklist criteria, labels, and the final decision dock so reviewers can read story prose and complete audit decisions simultaneously without long vertical scrolling.

## Elevation & Depth

Use translucent frosted depth sparingly on outer shell chrome (`.top`, `.pane`) and crisp hairline borders (`line`, `line-2`) with restrained tinted drop shadows (`shadow`) on floating menus, dialogs, and toast notifications. Never nest heavy backdrop blurs on dense reading cards inside `.pb`; rely on background surface shifts (`surface` vs `paper` vs `panel`) and borders for visual separation so reading remains sharp in both light and dark modes.

## Shapes

Preserve organic botanical geometry across Taletale controls: outer workspace `.pane` frames use large soft corners, primary and gold CTA buttons (`.btn-p`, `.btn-gold`) carry asymmetric leaf-petal corners with subtle SVG leaf veins (`--vein`), inputs and dialog cards use clean rounded corners, and status `.pill` / filter `.chip` indicators use full pill capsules.

## Components

- **Workspace containers (`.pane`, `.pb`, `.sec-h`, `.pane-tools`)**: Never add opaque colored title bars at the top of `.pane`; render headers with `.sec-h` and keep secondary tools compact in `.pane-tools`.
- **Queue list cards (`.st-item`)**: Surface story title, source identity badge, SLA deadline or overdue pill, priority/resubmission tag, and claim ownership (`Bạn đang giữ` vs `Người khác đang giữ`) in a compact two-line scan layout.
- **Two-tier status tabs & queue drawer toggle**: Render the primary `.mod-nav` switcher as two visually distinct framed tabs — **`Xử lý hồ sơ`** (`panel` surface with `primary-strong` active emphasis) and **`Kết quả xử lý`** (calm `surface` outcome framing) — controlling a secondary sub-tab pill strip with active count chips underneath: `Xử lý hồ sơ` reveals active workflow states (`Chờ tiếp nhận`, `Đang xử lý`, `Chờ sửa`, or the workspace's equivalent active/waiting queues), while `Kết quả xử lý` reveals terminal outcome states (`Đã duyệt`, `Từ chối`, `Đã rút`, `Đã đóng`, or equivalent terminal queues). Keep single-group views (such as source filters in removal records) framed in one clean strip, and pair navigation with the header drawer toggle in `.mod-head-actions` (`Ẩn danh sách` / `Hiện danh sách`) to expand the split inspection workbench across full desktop width.
- **Inspection progress strip**: Render computed counts from loaded review DTOs (scenes viewed, audio played, unresolved AI flags, checklist completion, and clickable approve blockers mapped to DOM section anchors) across the top of the split desk so Moderators immediately gauge review completeness.
- **Left reading canvas & view filters**: Render metadata chips, three-part Creator outlines, `paper`-grounded `story` manuscripts, side-by-side scene cards (`SafeImage` via `ReviewPicture` + audio), learning materials, and version diffs inside `.mod-desk-main`, topped by non-destructive reading filter pills (`Tất cả`, `Văn bản & Dàn ý`, `Cảnh & Media`, `Học liệu & So sánh`).
- **Right sticky audit rail & decision dock**: Keep AI safety scans/flags, inline criterion-evidence checklist cards, label pickers, and final action controls (`Duyệt`, `Yêu cầu sửa`, `Từ chối`) docked visibly in `.mod-desk-rail` beside the reading canvas.
- **Dialogs, pickers & alerts**: Use custom `Select`, modal `Dialog` for structured inputs, `confirmDialog` for destructive or irreversible moderation decisions, and `.notice` (auto-promoted to toast unless marked `data-inline-notice`).

## Do's and Don'ts

- **Do** read every color and text size exclusively from `app/styles/tokens.css` variables and `color-mix(...)`, verifying contrast in both light mode and `[data-theme="dark"]`.
- **Do** use `SafeImage`, `Dialog`, `Select`, `confirmDialog`, `lucide-react` icons, and existing motion hooks (`useRiseIn`, respecting `prefers-reduced-motion`).
- **Do** preserve strict anonymity rules on family-shared `CommunitySubmission` (`Gia đình chia sẻ`, no creator identity or `versionNo`) and `ContentReport` panels, and sanitize user-submitted links via `safeHttpUrl`.
- **Don't** write hardcoded hex colors, `rgba()` literals, nonexistent tokens, or raw pixel `font-size` values in CSS or JSX `style` attributes.
- **Don't** invent mock data, fallback local records, uncontracted API parameters, or alter existing moderation endpoints, DTOs, anchor IDs, confirmation messages, or hook logic while restyling surfaces.
- **Don't** use raw `<img>`, `window.confirm`, unstyled native popups, or non-Vietnamese UI text.
