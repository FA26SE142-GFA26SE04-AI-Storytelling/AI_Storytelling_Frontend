# Giao diện gói, thanh toán, lượt và thống kê (phần Tuấn phụ trách) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nối toàn bộ API gói, thanh toán, lượt, suất đọc và thống kê của backend vào giao diện cho ba vai trò: phụ huynh, Content Creator và Administrator.

**Architecture:** Mỗi nhóm endpoint có một file service mỏng trong `app/services/`, kiểu dữ liệu chép đúng DTO backend vào `app/types/backendContracts.ts`. Phần tính toán hiển thị (nhãn, định dạng tiền, dòng quyền lợi, thông báo giới hạn) là hàm thuần trong `app/lib/billing.ts` để test được không cần DOM. Màn hình chỉ ghép service, hàm thuần và các thành phần sẵn có (`Dialog`, `confirmDialog`, `Page`, `Notice`, `useAction`).

**Tech Stack:** Next.js 16.4 (App Router, một route `/`), React, TypeScript, Vitest 4 (không có thư viện test DOM), ESLint, lucide-react.

**Spec:** `AI_Storytelling_Backend/docs/PARENT_PLANS_PAYMENT_API_GUIDE.md` (hợp đồng API, mục 1 đến 10). Chưa có design doc riêng cho frontend: người yêu cầu chọn lên kế hoạch thẳng, nên các quyết định giao diện trong kế hoạch này là đề xuất của người viết và cần người yêu cầu duyệt khi đọc.

**Thứ tự giao hàng:** ba giai đoạn, mỗi giai đoạn chạy được và kiểm được độc lập.

| Giai đoạn | Task | Vai trò | Kết quả nhìn thấy |
|---|---|---|---|
| 0. Nền | 1–2 | chung | Kiểu dữ liệu, service và hàm thuần cho mọi màn |
| A. Phụ huynh | 3–6 | phụ huynh | Xem gói và quyền lợi, mua và theo dõi thanh toán, lịch sử, suất đọc, thông báo khi chạm giới hạn |
| B. Creator | 7–8 | Content Creator | Lượt và Gói Creator, thống kê lượt đọc, nội dung, thu nhập dự kiến |
| C. Admin | 9–13 | Administrator | Giao dịch và đối soát, quản lý gói, cấu hình chung, cấp/trừ lượt, doanh thu và tài khoản, báo cáo kỳ |
| Kết | 14 | chung | Cập nhật `TASKS.md`, bảng phủ API, kiểm thử tay |

## Global Constraints

- Làm việc trong `AI_Storytelling_Frontend/src`, trên nhánh `feat/parent-plans-payment`. Nhánh đang có 11 file sửa dở và một file test mới chưa commit: xây tiếp trên đó, không làm lại, không hoàn tác.
- Chỉ sửa frontend. Không đổi backend, API hay database (`AGENTS.md`).
- Mọi dữ liệu lấy từ API backend. Không thêm mock, seed hay fallback local vào `app/`; dữ liệu giả chỉ nằm trong `tests/`.
- Gọi API qua `services/` bằng `apiRequest`/`apiQuery`; không `fetch` trực tiếp trong component.
- Import dùng alias `@/app/...` khi ra ngoài thư mục hiện tại, `./` cho file cùng thư mục, không dùng `../`.
- Toàn bộ chữ hiển thị bằng tiếng Việt. Không viết mã màu cứng; chỉ dùng biến trong `styles/tokens.css`. Cỡ chữ chỉ dùng thang `--fs-*`.
- Form điền thông tin dùng `components/Dialog`; xoá, xác nhận tiền, đổi cấu hình phải qua `confirmDialog`; nút Lưu chỉ hiện khi form có thay đổi; kết quả thao tác hiện dạng toast (`.notice`).
- Component quá khoảng 250 dòng thì tách theo vùng giao diện.
- Trước khi viết code Next.js, đọc hướng dẫn liên quan trong `node_modules/next/dist/docs/` (yêu cầu của `AGENTS.md`).
- Tiền hiển thị theo `vi-VN` kèm "đ". Ngày của kỳ thống kê gửi lên dạng `yyyy-MM-dd`, lấy từ ô `<input type="date">`, không chuyển múi giờ.
- Kế hoạch không có bước commit; người yêu cầu tự quyết định khi nào commit.
- Kiểm tra sau mỗi task: `npm run test`, `npm run lint`, `npx tsc --noEmit`.

## Review Focus

1. **Theo dõi thanh toán bị bỏ dở.** Người dùng đóng popup QR, chuyển tab, hoặc giao dịch quá 15 phút khi đang chờ. Mong đợi: dừng hẳn việc hỏi lại máy chủ, không rò timer, và hiện đúng trạng thái "Hết hạn". Test ở Task 2 (`paymentPollState`) và kiểm tay ở Task 4.
2. **Giá trị `null` có nghĩa.** `plan = null` là mức Miễn phí; `weeklyNewLibraryStories = null` là không giới hạn; `revenue = null` ở báo cáo cũ; `nextChangeAllowedAt = null` là đổi được ngay. Mong đợi: hiện chữ có nghĩa, không hiện "null", "0" hay để trống. Test ở Task 2 (`benefitLines`, `quotaLines`).
3. **Tạo giao dịch trùng.** Bấm mua khi đã có giao dịch chờ thanh toán thì backend trả 409. Mong đợi: mở lại giao dịch đang chờ từ lịch sử thay vì chỉ báo lỗi. Test ở Task 2 (`findPendingTransaction`) và kiểm tay ở Task 4.
4. **Kỳ thống kê sai.** Ngày kết thúc trước ngày bắt đầu, hoặc để trống. Mong đợi: chặn ngay ở giao diện, không gọi API. Test ở Task 2 (`validatePeriod`).
5. **Vai trò không có gói.** Admin và Moderator nhận danh sách gói rỗng; Creator chỉ thấy Gói Creator; lỗi 403 khi mua gói khác đối tượng. Mong đợi: hiện thông báo rõ ràng, không để màn trắng. Test ở Task 2 (`limitMessage`) và kiểm tay ở Task 7.

---

### Task 1: Kiểu dữ liệu và service

**Việc này làm gì (nói dễ hiểu):** Dạy cho frontend "nói chuyện" được với mọi API mà backend đã làm cho phần gói, thanh toán, lượt, suất đọc và thống kê. Sau task này chưa có màn hình mới nào, nhưng mọi màn ở các task sau chỉ cần gọi hàm có sẵn. Mỗi hàm có một bài test kiểm đúng đường dẫn, phương thức và dữ liệu gửi đi.

**Cần thêm / còn thiếu:**
- Đã có: `paymentService` (`plans`, `create`, `myTransactions`, `myQuota`), `staffService` (`mismatchedPayments`, `markPaid`, `latestReport`, `generateReport`, `publishReport`), `apiRequest`, `apiQuery`, mẫu test trong `tests/unit/services/paymentContracts.test.ts`.
- Cần thêm: các DTO còn thiếu; hàm lượt của Creator; suất đọc; toàn bộ API Admin; thống kê Creator.
- Còn thiếu / ngoài phạm vi: Admin cấp lượt cho Creator, Creator đối tác (backend chưa có).

**Files:**
- Modify: `app/types/backendContracts.ts`
- Modify: `app/services/paymentService.ts`
- Modify: `app/services/childProfileService.ts`
- Create: `app/services/adminBillingService.ts`
- Create: `app/services/creatorStatisticsService.ts`
- Test: `tests/unit/services/paymentContracts.test.ts` (thêm), `tests/unit/services/adminBillingContracts.test.ts` (mới), `tests/unit/services/creatorStatisticsContracts.test.ts` (mới)

**Interfaces:**
- Consumes: `apiRequest<T>(path, fallback, opts)`, `apiQuery(values)` từ `app/services/apiClient.ts`.
- Produces (tên trường chép đúng mục tương ứng của spec, camelCase):

```ts
// backendContracts.ts
export type PlanType = 'Reading' | 'Creative' | 'AddOn' | 'CreatorPack' | 'Legacy';
export type PlanAudience = 'User' | 'Creator';
export interface PlanBenefitsDto { maxChildProfiles: number; weeklyNewLibraryStories: number | null; canCopyRoadmapTemplates: boolean; readAloudPerMonth: number | null; writingAssistPerDay: number }
// SubscriptionPlanDto: thêm submitCredits: number; benefits: PlanBenefitsDto | null
export interface QuotaBenefitsDto extends PlanBenefitsDto { tier: string; planId: number | null }
// MyQuotaDto: thêm benefits: QuotaBenefitsDto | null; newLibraryStoriesThisWeek: number; writingAssistsToday: number
export interface CreatorCreditBucketDto { monthlyAllowance: number; monthlyRemaining: number; purchasedRemaining: number; otherRemaining: number; totalRemaining: number }
export interface CreatorQuotaDto { aiCredits: CreatorCreditBucketDto; submitCredits: CreatorCreditBucketDto; monthlyAllowanceResetsAt: string }
export interface ReadingSlotProfileDto { childProfileId: number; nickname: string; canRead: boolean; isSelected: boolean }
export interface ReadingSlotsDto { slots: number; isOverLimit: boolean; nextChangeAllowedAt: string | null; profiles: ReadingSlotProfileDto[] }
export interface AdminPaymentTransactionDto extends PaymentTransactionDto { payerUserId: number; payerEmail: string; payerName: string }
export interface CreditAdjustmentDto { id: number; userId: number; amount: number; reason: string; adminId: number; adminName: string; createdAt: string; totalRemainingAfter: number | null }
export interface ReconciliationExceptionDto { id: number; status: 'Open' | 'Resolved'; reason: string; createdAt: string; resolvedAt: string | null; resolvedByName: string | null; transaction: AdminPaymentTransactionDto }
export interface AdminPlanDto { id: number; name: string; planType: PlanType; audience: PlanAudience; priceVnd: number; aiCredits: number; submitCredits: number; isActive: boolean; benefits: PlanBenefitsDto | null }
export interface SavePlanRequest { name: string; priceVnd: number; aiCredits: number; submitCredits?: number; isActive: boolean; benefits?: PlanBenefitsDto }
export interface CreatePlanRequest extends SavePlanRequest { audience: PlanAudience; planType: PlanType }
export interface PlanSettingsDto { /* 15 trường của mục 10.2, đúng tên */ }
export interface RevenueStatisticsDto { /* các trường của mục 6.1 và 8.6 */ }
export interface AccountStatisticsDto { totalParentAccounts: number; newAccounts: number; activeAccounts: number; lockedOrDisabledAccounts: number; childProfiles: number }
export interface AdminBusinessReportDto extends BusinessReportDto { revenue: RevenueStatisticsDto | null; accounts: AccountStatisticsDto | null }
export interface CreatorReadingStatisticsDto { /* mục 7.1 */ }
export interface CreatorRevenueStatisticsDto { /* mục 7.2 */ }
export interface CreatorContentStatisticsDto { periodStart: string; periodEnd: string; draft: number; ready: number; pendingReview: number; published: number; submissionsApproved: number; submissionsRejected: number; submissionsChangesRequested: number; submissionsWithdrawn: number; remainingAiCredits: number; remainingSubmitCredits: number; tier: string; partnerProgress: { windowStart: string; windowEnd: string; isEligible: boolean; criteria: { key: string }[] } }

// paymentService.ts
creatorQuota(signal?): Promise<ApiResponse<CreatorQuotaDto>>            // GET /TokenQuota/creator/me

// childProfileService.ts
getReadingSlots(signal?): Promise<ApiResponse<ReadingSlotsDto>>          // GET /ChildProfile/reading-slots
selectReadingSlots(childProfileIds: number[]): Promise<ApiResponse<ReadingSlotsDto>>  // PUT, body { childProfileIds }

// adminBillingService.ts
export type Period = { periodStart: string; periodEnd: string };
export const adminBillingService = {
  transactions(q: { pageIndex?: number; pageSize?: number; status?: string; search?: string }, signal?),  // GET /Payment/admin/transactions
  plans(signal?), createPlan(body: CreatePlanRequest), updatePlan(id: number, body: SavePlanRequest),     // /Payment/admin/plans
  settings(signal?), saveSettings(body: PlanSettingsDto),                                                  // /Payment/admin/settings
  reconciliation(q: { status?: 'Open' | 'Resolved'; pageIndex?: number; pageSize?: number }, signal?),   // GET /Payment/admin/reconciliation
  resolveException(id: number),                                                                            // POST .../reconciliation/{id}/resolve
  adjustCredits(body: { userId: number; amount: number; reason: string }),                                 // POST /TokenQuota/admin/adjustments
  adjustments(q: { userId?: number; pageIndex?: number; pageSize?: number }, signal?),                     // GET /TokenQuota/admin/adjustments
  userQuota(userId: number, signal?),                                                                      // GET /TokenQuota/admin/users/{userId}
  revenue(p: Period, signal?), accounts(p: Period, signal?),                                               // GET /BusinessReport/admin/revenue|accounts
  reports(pageIndex?: number, pageSize?: number, signal?), report(id: number, signal?),                    // GET /BusinessReport/admin, /admin/{id}
};

// creatorStatisticsService.ts
export const creatorStatisticsService = {
  reading(p: Period, storyId?: number, signal?), revenue(p: Period, storyId?: number, signal?), content(p: Period, signal?),
};
```

- [ ] **Step 1: Viết test hợp đồng cho từng hàm mới** theo đúng mẫu của `paymentContracts.test.ts` (`vi.spyOn(authService, 'authenticatedFetch')`). Mỗi hàm một `it`, khẳng định: `pathname` kết thúc bằng đúng đường dẫn; phương thức; query (ví dụ `transactions({ status: 'Pending', search: 'abc' })` gửi `status=Pending&search=abc&pageIndex=1&pageSize=20`); body (ví dụ `adjustCredits` gửi `{ userId: 12, amount: 3, reason: 'Bù lỗi sinh truyện' }`; `selectReadingSlots([12])` gửi `{ childProfileIds: [12] }`; `saveSettings` gửi đủ 15 trường). Tham số tuỳ chọn bỏ trống thì không xuất hiện trong query.
- [ ] **Step 2: Chạy test, xác nhận đỏ.** Run: `npm run test -- tests/unit/services`. Expected: FAIL vì hàm chưa tồn tại.
- [ ] **Step 3: Thêm DTO và hàm service** đúng khối Interfaces. Câu `fallback` bằng tiếng Việt, ví dụ `'Không tải được danh sách giao dịch.'`.
- [ ] **Step 4: Chạy lại.** Run: `npm run test -- tests/unit/services && npx tsc --noEmit`. Expected: PASS, không lỗi kiểu.

---

### Task 2: Hàm thuần cho hiển thị (`app/lib/billing.ts`)

**Việc này làm gì (nói dễ hiểu):** Gom mọi quy tắc "con số này hiện ra thành chữ gì" vào một chỗ: tên loại gói, trạng thái giao dịch, dòng quyền lợi, số lượt còn lại, câu thông báo khi chạm giới hạn, kiểm tra kỳ thống kê. Nhờ đó mọi màn hiện cùng một cách, và các trường hợp dễ sai (giá trị rỗng, không giới hạn, kỳ sai) được test kỹ mà không cần mở trình duyệt.

**Cần thêm / còn thiếu:**
- Đã có: `fmt`, `fmtDay` trong `features/staff/ui.tsx`.
- Cần thêm: file `app/lib/billing.ts` và test.
- Còn thiếu / ngoài phạm vi: không có.

**Files:**
- Create: `app/lib/billing.ts`
- Test: `tests/unit/lib/billing.test.ts`

**Interfaces:**
- Consumes: DTO của Task 1.
- Produces:

```ts
export const vnd = (n: number): string;                              // 99000 -> "99.000đ"
export const planTypeLabel = (t: string): string;                    // Reading "Gói Đọc", Creative "Gói Sáng tạo", AddOn "Add-on", CreatorPack "Gói Creator", Legacy "Gói cũ"; khác -> chính nó
export const transactionStatusLabel = (s: string): string;           // Pending "Chờ thanh toán", Paid "Đã thanh toán", Expired "Hết hạn", MismatchAmount "Chờ quản trị viên xử lý"
export const benefitLines = (b: PlanBenefitsDto): string[];
export const quotaLines = (q: MyQuotaDto): { label: string; value: number }[];
export const tierLabel = (q: MyQuotaDto): string;                    // plan null -> "Miễn phí", ngược lại plan.planName
export const findPendingTransaction = (items: PaymentTransactionDto[], planType: string, now: Date): PaymentTransactionDto | null;
export type PollState = 'waiting' | 'paid' | 'expired' | 'mismatch';
export const paymentPollState = (t: PaymentTransactionDto, now: Date): PollState;
export const validatePeriod = (start: string, end: string): string | null;   // null = hợp lệ
export const currentMonthPeriod = (now: Date): { periodStart: string; periodEnd: string };
export type LimitNotice = { text: string; upgrade: boolean };
export const limitMessage = (r: { status?: number; message: string; errors?: string[] | null }, context: 'child-profile' | 'roadmap-copy' | 'assistance' | 'purchase' | 'submit' | 'ai-credits'): LimitNotice | null;
```

- [ ] **Step 1: Viết test đỏ** trong `tests/unit/lib/billing.test.ts`:

```ts
expect(vnd(99000)).toBe('99.000đ');
expect(planTypeLabel('CreatorPack')).toBe('Gói Creator');
expect(transactionStatusLabel('MismatchAmount')).toBe('Chờ quản trị viên xử lý');
expect(benefitLines({ maxChildProfiles: 4, weeklyNewLibraryStories: null, canCopyRoadmapTemplates: true, readAloudPerMonth: 60, writingAssistPerDay: 5 }))
  .toEqual(['Tối đa 4 hồ sơ bé', 'Truyện thư viện không giới hạn', 'Sao chép bộ truyện mẫu', 'Đọc to 60 lần mỗi tháng', 'Trợ lý viết 5 lần mỗi ngày']);
expect(benefitLines({ maxChildProfiles: 1, weeklyNewLibraryStories: 3, canCopyRoadmapTemplates: false, readAloudPerMonth: null, writingAssistPerDay: 5 }))
  .toEqual(['Tối đa 1 hồ sơ bé', '3 truyện thư viện mới mỗi tuần', 'Trợ lý viết 5 lần mỗi ngày']);
// quotaLines chỉ trả các nguồn có lượt > 0, theo thứ tự: dùng thử, theo gói, Add-on, khác
expect(quotaLines({ ...q, trialCredits: 0, cycleCredits: 4, addOnCredits: 2, otherCredits: 0 }))
  .toEqual([{ label: 'Lượt theo gói', value: 4 }, { label: 'Lượt Add-on', value: 2 }]);
expect(tierLabel({ ...q, plan: null })).toBe('Miễn phí');
// giao dịch chờ còn hạn cùng nhóm: Reading và Creative là một nhóm "gói", AddOn và CreatorPack mỗi loại một nhóm
expect(findPendingTransaction([pendingCreative], 'Reading', beforeExpiry)?.id).toBe(pendingCreative.id);
expect(findPendingTransaction([pendingCreative], 'AddOn', beforeExpiry)).toBeNull();
expect(findPendingTransaction([pendingCreative], 'Reading', afterExpiry)).toBeNull();
expect(paymentPollState({ ...t, status: 'Pending' }, beforeExpiry)).toBe('waiting');
expect(paymentPollState({ ...t, status: 'Pending' }, afterExpiry)).toBe('expired');
expect(paymentPollState({ ...t, status: 'Paid' }, afterExpiry)).toBe('paid');
expect(paymentPollState({ ...t, status: 'MismatchAmount' }, beforeExpiry)).toBe('mismatch');
expect(validatePeriod('2026-11-01', '2026-11-30')).toBeNull();
expect(validatePeriod('2026-11-30', '2026-11-01')).toBe('Ngày kết thúc phải từ ngày bắt đầu trở đi.');
expect(validatePeriod('', '2026-11-30')).toBe('Hãy chọn đủ ngày bắt đầu và ngày kết thúc.');
expect(currentMonthPeriod(new Date(2026, 10, 13))).toEqual({ periodStart: '2026-11-01', periodEnd: '2026-11-30' });
expect(limitMessage({ status: 409, message: 'x' }, 'child-profile')).toEqual({ text: 'Gói hiện tại đã đủ số hồ sơ bé. Nâng cấp gói để thêm hồ sơ.', upgrade: true });
expect(limitMessage({ status: 403, message: 'x' }, 'roadmap-copy')).toEqual({ text: 'Gói hiện tại chưa gồm sao chép bộ truyện mẫu.', upgrade: true });
expect(limitMessage({ status: 429, message: 'x', errors: ['ASSISTANCE_DAILY_LIMIT'] }, 'assistance')).toEqual({ text: 'Bạn đã dùng hết số lần trợ lý viết của hôm nay.', upgrade: true });
expect(limitMessage({ status: 403, message: 'x' }, 'purchase')).toEqual({ text: 'Gói này không dành cho loại tài khoản của bạn.', upgrade: false });
expect(limitMessage({ status: 409, message: 'Bạn đã hết lượt gửi duyệt…' }, 'submit')?.upgrade).toBe(true);
// hết lượt tạo truyện AI: giữ nguyên câu của backend, kèm nút nâng cấp
expect(limitMessage({ status: 409, message: 'Bạn đã hết lượt tạo truyện AI…' }, 'ai-credits')).toEqual({ text: 'Bạn đã hết lượt tạo truyện AI…', upgrade: true });
expect(limitMessage({ status: 500, message: 'x' }, 'child-profile')).toBeNull();
```

- [ ] **Step 2: Chạy, xác nhận đỏ.** Run: `npm run test -- tests/unit/lib/billing.test.ts`. Expected: FAIL.
- [ ] **Step 3: Viết `app/lib/billing.ts`.** `limitMessage` với ngữ cảnh `submit` và `ai-credits` giữ nguyên câu của backend làm `text`. Trước khi viết, đọc `apiClient.ts` để biết mã lỗi của backend (`ASSISTANCE_DAILY_LIMIT`) nằm ở trường nào của `ApiResponse`; nếu không phải `errors` thì sửa cả test lẫn chữ ký cho khớp thực tế.
- [ ] **Step 4: Chạy lại.** Expected: PASS.

---

### Task 3: Trang "Gói của tôi" cho phụ huynh — gói đang dùng và thẻ gói

**Việc này làm gì (nói dễ hiểu):** Trang "Nâng cấp gói" hiện đang viết theo mô hình cũ ("mua một lần", "không tự gia hạn"). Task này sửa cho đúng mô hình mới: phía trên cho phụ huynh thấy mình đang ở gói nào, hết hạn ngày nào, còn bao nhiêu lượt tạo truyện AI và các quyền lợi đang có; phía dưới là các thẻ gói, mỗi thẻ ghi đúng giá, số lượt và quyền lợi do Admin cấu hình. Gói chưa mua được (ví dụ Add-on khi chưa có gói) hiện lý do thay vì nút mua.

**Cần thêm / còn thiếu:**
- Đã có: `PaymentSection.tsx` (thẻ gói, popup chuyển khoản), lớp CSS `plan-grid`, `plan-card` trong `styles/base.css`; thông báo nhắc gói sắp hết hạn (`subscription_expiring` trong `app/lib/notifications.ts`, đang sửa dở trên nhánh và đã có test).
- Cần thêm: khối tóm tắt gói đang dùng; thẻ gói đọc `benefits`, `isPurchasable`, `lockedReason`.
- Còn thiếu / ngoài phạm vi: số lần đọc to còn lại (backend chỉ lưu hạn mức, chưa đếm).

**Files:**
- Modify: `app/features/account/PaymentSection.tsx` (chỉ còn ghép các phần)
- Create: `app/features/account/MyPlanSummary.tsx`, `app/features/account/PlanCards.tsx`
- Modify: `app/components/shell/nav.ts` (nhãn `account-payment` đổi thành "Gói của tôi")

**Interfaces:**
- Consumes: `paymentService.plans`, `paymentService.myQuota`; `benefitLines`, `quotaLines`, `tierLabel`, `vnd`, `planTypeLabel` (Task 2).
- Produces: `MyPlanSummary({ quota }: { quota: MyQuotaDto | null })`; `PlanCards({ plans, disabled, onBuy }: { plans: SubscriptionPlanDto[]; disabled: boolean; onBuy: (plan: SubscriptionPlanDto) => void })`.

- [ ] **Step 1: `MyPlanSummary`.** Hiện: tên mức (`tierLabel`); nếu có `plan` thì "Hiệu lực đến {ngày endAt}"; nếu có `nextPlan` thì "Đã gia hạn: {planName} từ {ngày startAt}"; tổng lượt `totalRemaining` kèm các dòng `quotaLines`; danh sách `benefitLines(quota.benefits)`; "Đã mở {newLibraryStoriesThisWeek}/{weeklyNewLibraryStories} truyện thư viện mới tuần này" (bỏ dòng này khi không giới hạn); "Đã dùng trợ lý viết {writingAssistsToday}/{writingAssistPerDay} lần hôm nay".
- [ ] **Step 2: `PlanCards`.** Mỗi thẻ: tên gói, `vnd(priceVnd)` kèm "/ tháng" cho `Reading` và `Creative`, "mua thêm" cho `AddOn`; "{aiCredits} lượt tạo truyện AI mỗi chu kỳ" (bỏ dòng khi bằng 0); `benefitLines(plan.benefits)` khi có. Thẻ có `isPurchasable = false` hiện `lockedReason` và không có nút. Xoá các câu cố định cũ.
- [ ] **Step 3: `PaymentSection`** tải `plans` và `myQuota` song song, ghép hai thành phần, giữ popup hiện có. Danh sách gói rỗng thì hiện "Tài khoản này không có gói để mua."
- [ ] **Step 4: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Expected: PASS. Kiểm tay với backend local (`http://localhost:5259`, đăng nhập `parent1@example.com`): thấy mức Miễn phí, 3 thẻ gói, Add-on bị khoá kèm lý do.

---

### Task 4: Thanh toán có theo dõi và lịch sử giao dịch

**Việc này làm gì (nói dễ hiểu):** Hiện phụ huynh bấm mua xong chỉ thấy mã chuyển khoản, phải tự tải lại trang mới biết tiền đã về chưa. Task này làm popup thanh toán tự hỏi lại máy chủ cho tới khi giao dịch được xác nhận, hết hạn hoặc lệch số tiền, rồi cập nhật ngay gói và lượt trên trang. Thêm bảng lịch sử giao dịch; giao dịch còn chờ có nút mở lại mã QR. Nếu bấm mua khi đang có giao dịch chờ, mở lại đúng giao dịch đó thay vì báo lỗi.

**Cần thêm / còn thiếu:**
- Đã có: popup trong `PaymentSection`, `paymentService.myTransactions`.
- Cần thêm: `PaymentDialog` có theo dõi; `TransactionHistory` có phân trang; xử lý 409.
- Còn thiếu / ngoài phạm vi: huỷ giao dịch (backend không có).

**Files:**
- Create: `app/features/account/PaymentDialog.tsx`, `app/features/account/TransactionHistory.tsx`
- Modify: `app/features/account/PaymentSection.tsx`

**Interfaces:**
- Consumes: `paymentService.myTransactions`, `paymentPollState`, `findPendingTransaction`, `transactionStatusLabel`, `limitMessage`, `components/Dialog`.
- Produces: `PaymentDialog({ transaction, onClose, onSettled }: { transaction: PaymentTransactionDto; onClose: () => void; onSettled: (state: PollState) => void })`; `TransactionHistory({ reloadKey, onOpen }: { reloadKey: number; onOpen: (t: PaymentTransactionDto) => void })`. Hai thành phần này được Task 7 dùng lại nguyên vẹn.

- [ ] **Step 1: `PaymentDialog`.** Dùng `Dialog`. Hiện số tiền, nội dung chuyển khoản (có nút sao chép), hạn, ảnh hoặc liên kết QR. Cứ 5 giây gọi `myTransactions(1, 20)` và tìm giao dịch theo `id`; dừng khi `paymentPollState` khác `waiting`, khi popup đóng, hoặc khi component bị gỡ (dọn timer và `AbortController` trong cleanup). Trạng thái cuối: `paid` "Đã nhận thanh toán. Gói của bạn đã được cập nhật."; `expired` "Giao dịch đã hết hạn. Hãy tạo giao dịch mới."; `mismatch` "Số tiền chưa khớp. Giao dịch đang chờ quản trị viên xử lý, bạn không cần chuyển lại."
- [ ] **Step 2: `TransactionHistory`.** Bảng: ngày tạo, gói, số tiền, trạng thái (`transactionStatusLabel`, giao dịch Pending quá hạn hiện "Hết hạn"), nút "Mở mã QR" cho giao dịch còn chờ. Phân trang 20 dòng bằng `hasPreviousPage`, `hasNextPage`. Rỗng: "Chưa có giao dịch nào."
- [ ] **Step 3: `PaymentSection`.** Khi `create` trả 409: tải lịch sử, `findPendingTransaction` theo `planType` của gói vừa bấm; có thì mở `PaymentDialog` với giao dịch đó, không thì hiện câu của backend. Lỗi 403 hiện `limitMessage(r, 'purchase')`. Khi `onSettled('paid')`: tải lại `myQuota`, `plans` và tăng `reloadKey`.
- [ ] **Step 4: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay: tạo giao dịch Gói Sáng tạo; bấm mua lần nữa thì mở lại giao dịch cũ; dùng tài khoản Admin xác nhận tay giao dịch, popup tự chuyển sang "Đã nhận thanh toán" trong vòng 5 giây và khối gói đang dùng đổi theo; đóng popup rồi xem tab Network không còn yêu cầu lặp.

---

### Task 5: Chọn hồ sơ được đọc khi vượt số hồ sơ của gói

**Việc này làm gì (nói dễ hiểu):** Khi gói hết hạn, tài khoản về mức Miễn phí chỉ được 1 hồ sơ bé vào đọc, các hồ sơ còn lại chuyển sang "chỉ xem". Task này cho phụ huynh thấy rõ bé nào đang được đọc và tự chọn lại, kèm lời nhắc mỗi tuần chỉ đổi được một lần. Khi tài khoản không vượt giới hạn thì khối này không hiện.

**Cần thêm / còn thiếu:**
- Đã có: màn Hồ sơ bé (`features/children/ChildrenWorkspace.tsx`), trang gói (Task 3).
- Cần thêm: thẻ chọn suất đọc; nhãn "Chỉ xem" trên thẻ hồ sơ.
- Còn thiếu / ngoài phạm vi: thông báo cho trẻ (backend đã trả thông điệp chung; giao diện của trẻ không nêu lý do gói).

**Files:**
- Create: `app/features/children/ReadingSlotsCard.tsx`
- Modify: `app/features/children/ChildrenWorkspace.tsx`, `app/features/account/PaymentSection.tsx`

**Interfaces:**
- Consumes: `childProfileService.getReadingSlots`, `selectReadingSlots` (Task 1); `confirmDialog`.
- Produces: `ReadingSlotsCard({ onChanged }: { onChanged?: () => void })`: tự tải dữ liệu, trả `null` khi `isOverLimit = false`.

- [ ] **Step 1: `ReadingSlotsCard`.** Tiêu đề "Hồ sơ được đọc"; câu "Gói hiện tại cho {slots} hồ sơ vào đọc. Các hồ sơ khác chỉ xem được, không bị xoá." Danh sách hồ sơ dạng ô chọn, đánh dấu sẵn các hồ sơ `canRead`; không cho chọn quá `slots`. Nút "Lưu lựa chọn" chỉ hiện khi lựa chọn khác ban đầu. Trước khi lưu: `confirmDialog("Mỗi tuần chỉ đổi được một lần. Bé ở hồ sơ chuyển sang chỉ xem sẽ bị đăng xuất. Lưu lựa chọn này?")`. Khi `nextChangeAllowedAt` khác `null`: khoá ô chọn và hiện "Bạn đổi lại được từ {ngày giờ}." Lỗi 409 hiện câu của backend.
- [ ] **Step 2: Gắn vào hai nơi:** đầu màn Hồ sơ bé và dưới khối gói đang dùng. Sau khi lưu gọi `onChanged` để tải lại danh sách hồ sơ.
- [ ] **Step 3: Nhãn "Chỉ xem"** trên thẻ hồ sơ có `canRead = false` (lấy từ cùng dữ liệu `getReadingSlots`).
- [ ] **Step 4: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay với tài khoản có 2 hồ sơ Active ở mức Miễn phí: thẻ hiện, chọn 1 hồ sơ, lưu; lần đổi thứ hai trong tuần bị khoá kèm ngày.

---

### Task 6: Thông báo khi chạm giới hạn của gói

**Việc này làm gì (nói dễ hiểu):** Khi phụ huynh làm một việc gói hiện tại không cho (thêm hồ sơ bé thứ hai, sao chép bộ truyện mẫu, dùng trợ lý viết quá số lần trong ngày), backend từ chối. Hiện frontend chỉ hiện câu lỗi chung. Task này đổi thành một thông báo nói rõ lý do và có nút "Xem các gói" dẫn thẳng tới trang gói.

**Cần thêm / còn thiếu:**
- Đã có: các lời gọi ở `CreateChildWizard.tsx:54`, `ChildrenWorkspace.tsx:53`, `roadmapService.copy`, `parentAssistanceService.create`; hàm điều hướng `go` trong `WorkspaceProps`.
- Cần thêm: thành phần `UpgradeNotice`; dùng `limitMessage` ở bốn nơi.
- Còn thiếu / ngoài phạm vi: giới hạn truyện thư viện mỗi tuần hiện với trẻ (backend trả thông điệp chung cho trẻ; phụ huynh xem con số ở Task 3).

**Files:**
- Create: `app/components/UpgradeNotice.tsx`
- Modify: `app/features/children/CreateChildWizard.tsx`, `app/features/children/ChildrenWorkspace.tsx`, màn sao chép bộ truyện mẫu trong `app/features/roadmap/` (tìm nơi gọi `roadmapService.copy`), màn trợ lý viết của phụ huynh trong `app/features/authoring/` (tìm nơi gọi `parentAssistanceService.create`)

**Interfaces:**
- Consumes: `limitMessage`, `LimitNotice` (Task 2).
- Produces: `UpgradeNotice({ notice, onUpgrade }: { notice: LimitNotice; onUpgrade: () => void })`: hiện `notice.text`; khi `notice.upgrade` thì thêm nút "Xem các gói" gọi `onUpgrade`. Có `data-inline-notice` để ToastHost không chuyển thành toast.

- [ ] **Step 1: `UpgradeNotice`.**
- [ ] **Step 2: Năm nơi gọi:** khi phản hồi thất bại, gọi `limitMessage(r, <ngữ cảnh>)`; khác `null` thì hiện `UpgradeNotice` với `onUpgrade={() => go('account-payment')}`, ngược lại giữ cách báo lỗi cũ. Ngữ cảnh: tạo và khôi phục hồ sơ `child-profile`; sao chép bộ truyện mẫu `roadmap-copy`; tạo yêu cầu trợ lý `assistance`; gửi yêu cầu tạo truyện AI trong Studio (nơi gọi `aiStoryCreationService` tạo request, lỗi 409) `ai-credits`.
- [ ] **Step 3: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay ở mức Miễn phí: tạo hồ sơ thứ hai thấy thông báo và nút; bấm nút sang đúng trang gói.

---

### Task 7: Lượt và Gói Creator

**Việc này làm gì (nói dễ hiểu):** Content Creator hiện không biết mình còn bao nhiêu lượt tạo truyện AI và lượt gửi duyệt, và không có chỗ mua thêm. Task này thêm trang "Lượt của tôi" trong menu tài khoản của Creator: hạn mức tháng còn lại, ngày cấp lại, lượt đã mua, nút mua Gói Creator (cùng popup thanh toán với phụ huynh) và lịch sử mua. Khi gửi duyệt mà hết lượt, thông báo có nút dẫn tới trang này.

**Cần thêm / còn thiếu:**
- Đã có: `PaymentDialog`, `TransactionHistory` (Task 4); `CREATOR_ACCOUNT_PAGES` trong `StaffApp.tsx`; `creatorPublicationService.submit`.
- Cần thêm: `CreatorBilling.tsx`; mục menu; xử lý 409 khi gửi duyệt.
- Còn thiếu / ngoài phạm vi: Creator đối tác (backend chưa áp dụng).

**Files:**
- Create: `app/features/staff/CreatorBilling.tsx`
- Modify: `app/features/staff/StaffApp.tsx`, `app/features/staff/CreatorPublication.tsx`

**Interfaces:**
- Consumes: `paymentService.creatorQuota`, `plans`, `create`; `PaymentDialog`, `TransactionHistory`; `limitMessage`, `vnd`.
- Produces: `CreatorBilling()`; trang mới `{ id: "creator-billing", label: "Lượt của tôi", icon: Coins, view: CreatorBilling }` trong `CREATOR_ACCOUNT_PAGES`.

- [ ] **Step 1: `CreatorBilling`.** Hai thẻ "Lượt tạo truyện AI" và "Lượt gửi duyệt", mỗi thẻ: tổng còn lại; "Hạn mức tháng: còn {monthlyRemaining}/{monthlyAllowance}"; "Đã mua: {purchasedRemaining}"; dòng "Khác: {otherRemaining}" chỉ khi lớn hơn 0. Dòng "Hạn mức tháng được cấp lại vào {ngày giờ monthlyAllowanceResetsAt}." Thẻ Gói Creator từ `plans()`: `vnd(priceVnd)`, "+{aiCredits} lượt AI, +{submitCredits} lượt gửi duyệt, không hết hạn", nút "Mua Gói Creator" đi cùng luồng tạo giao dịch và xử lý 409 như Task 4. Bên dưới là `TransactionHistory`. Thanh toán xong thì tải lại lượt.
- [ ] **Step 2: Đăng ký trang** trong `StaffApp.tsx`.
- [ ] **Step 3: Hết lượt.** Trong `CreatorPublication.tsx`, khi `submit` trả 409 và `limitMessage(r, 'submit')` khác `null`: hiện câu đó kèm nút "Mua Gói Creator" chuyển sang trang `creator-billing`. Làm tương tự cho yêu cầu tạo truyện AI của Creator (`CreatorBrief.tsx` hoặc nơi gọi `POST /creator/ai-story-input/requests`, lỗi 409) với ngữ cảnh `ai-credits`.
- [ ] **Step 4: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay với `creator@example.com`: thấy 2 và 5 lượt tháng; chỉ thấy Gói Creator; tạo giao dịch, Admin xác nhận tay, lượt tăng 6 và 20.

---

### Task 8: Thống kê và thu nhập dự kiến của Creator

**Việc này làm gì (nói dễ hiểu):** Creator cần biết truyện của mình được đọc bao nhiêu và dự kiến được chia bao nhiêu tiền. Task này thêm trang "Thống kê" với bộ chọn kỳ và ba phần: tình hình nội dung (số truyện theo trạng thái, kết quả gửi duyệt), lượt đọc theo từng truyện, và thu nhập dự kiến kèm cách tính. Trang ghi rõ đây là số dự kiến và việc chi trả thực hiện ngoài hệ thống.

**Cần thêm / còn thiếu:**
- Đã có: `creatorStatisticsService` (Task 1); `validatePeriod`, `currentMonthPeriod`, `vnd` (Task 2).
- Cần thêm: `CreatorStatistics.tsx` và các phần con; `PeriodPicker` dùng chung với Admin.
- Còn thiếu / ngoài phạm vi: biểu đồ theo thời gian (API chỉ trả tổng của kỳ); rút tiền.

**Files:**
- Create: `app/components/PeriodPicker.tsx`, `app/features/staff/CreatorStatistics.tsx`, `app/features/staff/CreatorStatisticsTables.tsx`
- Modify: `app/features/staff/StaffApp.tsx`

**Interfaces:**
- Consumes: Task 1, Task 2.
- Produces: `PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void })`: hai ô ngày, nút "Tháng này", hiện lỗi của `validatePeriod` và chỉ gọi `onChange` khi hợp lệ. Trang mới `{ id: "creator-stats", label: "Thống kê", icon: ChartColumn, view: CreatorStatistics }`.

- [ ] **Step 1: `PeriodPicker`.** Mặc định `currentMonthPeriod(new Date())`.
- [ ] **Step 2: `CreatorStatistics`.** Đổi kỳ thì gọi song song `content`, `reading`, `revenue`, huỷ lời gọi cũ bằng `AbortController`. Mỗi phần có trạng thái đang tải, lỗi và rỗng riêng.
- [ ] **Step 3: `CreatorStatisticsTables`.** Phần nội dung: Bản nháp, Sẵn sàng, Chờ duyệt, Đã xuất bản; Được duyệt, Bị từ chối, Yêu cầu sửa, Đã rút. Phần lượt đọc: tổng và bảng theo truyện (Lượt xem, Yêu thích, Đọc hết, Lượt đọc hợp lệ, Tỷ lệ đọc hết dạng phần trăm làm tròn một chữ số). Phần thu nhập: "Thu nhập dự kiến: {vnd(estimatedEarningsVnd)}"; câu giải thích "Quỹ Creator kỳ này {vnd(creatorFundVnd)} = {readingFundRate×100}% doanh thu Gói Đọc + {creativeFundRate×100}% doanh thu Gói Sáng tạo. Bạn có {myValidReads}/{totalValidReadsAllCreators} lượt đọc hợp lệ (đọc từ {minimumReadSeconds} giây)."; bảng theo truyện; ghi chú "Đây là số dự kiến. Việc chi trả thực hiện ngoài hệ thống." Không có lượt đọc: "Chưa có lượt đọc hợp lệ trong kỳ này."
- [ ] **Step 4: Đăng ký trang và kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay: đổi kỳ sai thì thấy lỗi và không có yêu cầu mạng; kỳ đúng hiện ba phần.

---

### Task 9: Admin — giao dịch và đối soát

**Việc này làm gì (nói dễ hiểu):** Màn "Đối soát thanh toán" hiện chỉ liệt kê giao dịch lệch số tiền. Admin cần tìm được mọi giao dịch (theo trạng thái, mã, email người mua), xác nhận tay khi ngân hàng chưa báo về, và xử lý các trường hợp "đã trả tiền nhưng chưa được cộng gói". Task này thay màn cũ bằng một màn có hai thẻ: "Giao dịch" và "Cần xử lý".

**Cần thêm / còn thiếu:**
- Đã có: `AdminPayments` trong `AdminSystem.tsx`, `staffService.markPaid`, `Page`, `Notice`, `useAction`.
- Cần thêm: `AdminTransactions.tsx` thay cho `AdminPayments`.
- Còn thiếu / ngoài phạm vi: hoàn tiền (backend không có).

**Files:**
- Create: `app/features/staff/AdminTransactions.tsx`, `app/features/staff/AdminReconciliation.tsx`
- Modify: `app/features/staff/AdminSystem.tsx` (gỡ `AdminPayments`), `app/features/staff/StaffApp.tsx`

**Interfaces:**
- Consumes: `adminBillingService.transactions`, `reconciliation`, `resolveException`; `staffService.markPaid`; `transactionStatusLabel`, `vnd`.
- Produces: `AdminTransactions()`, giữ id trang `payments`, nhãn đổi thành "Giao dịch".

- [ ] **Step 1: `AdminTransactions`.** Bộ lọc trạng thái (Tất cả, Chờ thanh toán, Đã thanh toán, Hết hạn, Lệch số tiền), ô tìm (gọi sau khi ngừng gõ 400 ms), phân trang 20 dòng. Cột: mã giao dịch, người mua (tên và email), gói, số tiền, trạng thái, tạo lúc, thanh toán lúc. Giao dịch chưa `Paid` có nút "Xác nhận đã nhận tiền" với `confirmDialog("Xác nhận đã nhận đủ {số tiền} từ {email} và áp gói {tên gói}?")`.
- [ ] **Step 2: `AdminReconciliation`** (thẻ "Cần xử lý"). Lọc `Open`/`Resolved`. Cột: giao dịch, người mua, lý do, tạo lúc, người xử lý. Dòng `Open` có nút "Áp lại gói" (qua `confirmDialog`). Lỗi 409 hiện câu của backend và tải lại danh sách vì `reason` đã đổi.
- [ ] **Step 3: Gỡ `AdminPayments`** và `staffService.mismatchedPayments` nếu không còn nơi dùng (kiểm bằng tìm kiếm trong `app/` và `tests/`; sửa test liên quan).
- [ ] **Step 4: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay với `admin@example.com`: lọc Pending, tìm theo email, xác nhận tay một giao dịch.

---

### Task 10: Admin — quản lý gói

**Việc này làm gì (nói dễ hiểu):** Cho Admin xem mọi gói (kể cả gói đã tắt bán), sửa tên, giá, số lượt, bật/tắt bán, sửa quyền lợi của Gói Đọc và Gói Sáng tạo, và tạo gói mới. Form nhắc rõ hai điều dễ nhầm: đổi giá và số lượt chỉ áp dụng cho giao dịch tạo sau, còn đổi quyền lợi thì người đang dùng gói nhận ngay.

**Cần thêm / còn thiếu:**
- Đã có: `adminBillingService.plans`, `createPlan`, `updatePlan`; `Dialog`.
- Cần thêm: `AdminPlans.tsx`, `AdminPlanForm.tsx`.
- Còn thiếu / ngoài phạm vi: xoá gói (backend không có; chỉ tắt bán).

**Files:**
- Create: `app/features/staff/AdminPlans.tsx`, `app/features/staff/AdminPlanForm.tsx`
- Modify: `app/features/staff/StaffApp.tsx`
- Test: `tests/unit/lib/billing.test.ts` (thêm)

**Interfaces:**
- Consumes: Task 1, Task 2.
- Produces: trang `{ id: "plans", label: "Gói dịch vụ", icon: Package, view: AdminPlans }`; hàm thuần trong `app/lib/billing.ts`: `validatePlanForm(input: CreatePlanRequest): string | null`.

- [ ] **Step 1: Test đỏ cho `validatePlanForm`:** tên rỗng trả "Hãy nhập tên gói."; tên dài hơn 150 ký tự trả "Tên gói tối đa 150 ký tự."; `priceVnd <= 0` trả "Giá phải lớn hơn 0."; lượt âm trả "Số lượt không được âm."; `Reading`/`Creative` thiếu `benefits` hoặc `maxChildProfiles < 1` trả "Gói Đọc và Gói Sáng tạo cần ít nhất 1 hồ sơ bé."; `audience = 'Creator'` với `planType` khác `CreatorPack` trả "Gói cho Creator phải là Gói Creator."; dữ liệu hợp lệ trả `null`.
- [ ] **Step 2: Viết `validatePlanForm`, chạy test xanh.**
- [ ] **Step 3: `AdminPlans`.** Bảng: tên, loại (`planTypeLabel`), đối tượng (Phụ huynh / Creator), giá, lượt AI, lượt gửi duyệt, đang bán. Nút "Thêm gói" và "Sửa" mở `AdminPlanForm`. Gói `Legacy` không có nút bật bán.
- [ ] **Step 4: `AdminPlanForm`** trong `Dialog`. Khi tạo: chọn đối tượng rồi loại gói (chỉ các cặp hợp lệ). Khi sửa: loại và đối tượng chỉ đọc. Trường quyền lợi chỉ hiện cho `Reading`/`Creative`; "Truyện thư viện mới mỗi tuần" có ô "Không giới hạn" (gửi `null`). `submitCredits` chỉ hiện cho `CreatorPack`. Nút Lưu chỉ hiện khi có thay đổi và `validatePlanForm` trả `null`. Dưới form: "Giá và số lượt chỉ áp dụng cho giao dịch tạo sau. Quyền lợi áp dụng ngay cho người đang dùng gói." Lưu qua `confirmDialog`.
- [ ] **Step 5: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay: sửa giá Gói Sáng tạo, tắt bán Add-on rồi xem trang phụ huynh không còn thẻ Add-on; bật lại.

---

### Task 11: Admin — cấu hình chung

**Việc này làm gì (nói dễ hiểu):** Một form cho Admin chỉnh các con số chung của hệ thống: tỷ lệ quỹ Creator, hạn mức tháng của Creator, thời gian đọc tối thiểu để tính một lượt đọc hợp lệ, số lượt dùng thử và các giới hạn của mức Miễn phí. Các trường backend mới chỉ lưu mà chưa áp dụng được ghi chú rõ để Admin không hiểu lầm.

**Cần thêm / còn thiếu:**
- Đã có: `adminBillingService.settings`, `saveSettings`.
- Cần thêm: `AdminPlanSettings.tsx`.
- Còn thiếu / ngoài phạm vi: lịch sử thay đổi cấu hình (backend ghi audit nhưng chưa có API đọc).

**Files:**
- Create: `app/features/staff/AdminPlanSettings.tsx`
- Modify: `app/features/staff/StaffApp.tsx`
- Test: `tests/unit/lib/billing.test.ts` (thêm)

**Interfaces:**
- Produces: trang `{ id: "plan-settings", label: "Cấu hình gói", icon: SlidersHorizontal, view: AdminPlanSettings }`; `validatePlanSettings(s: PlanSettingsDto): string | null` trong `app/lib/billing.ts`.

- [ ] **Step 1: Test đỏ cho `validatePlanSettings`:** `readingFundPercent` hoặc `creativeFundPercent` ngoài 0–100 trả "Tỷ lệ quỹ phải từ 0 đến 100."; `minimumReadSeconds` ngoài 1–3600 trả "Thời gian đọc tối thiểu phải từ 1 đến 3600 giây."; `freeMaxChildProfiles < 1` trả "Mức Miễn phí cần ít nhất 1 hồ sơ bé."; số âm ở các trường còn lại trả "Giá trị không được âm."; hợp lệ trả `null`.
- [ ] **Step 2: Viết hàm, test xanh.**
- [ ] **Step 3: `AdminPlanSettings`.** Bốn nhóm: "Quỹ Creator", "Hạn mức Creator" (thường và đối tác), "Lượt đọc hợp lệ và dùng thử", "Mức Miễn phí". Các trường `partnerMonthlyAiCredits`, `partnerMonthlySubmitCredits`, `partnerWritingAssistPerDay`, `freeReadAloudPerMonth` có ghi chú "Chỉ lưu, chưa áp dụng." Nút Lưu chỉ hiện khi có thay đổi và hợp lệ; lưu qua `confirmDialog("Thay đổi áp dụng ngay cho toàn hệ thống. Lưu?")`; gửi đủ 15 trường.
- [ ] **Step 4: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay: đổi `freeMaxChildProfiles` thành 2 rồi trả lại 1.

---

### Task 12: Admin — cấp và trừ lượt

**Việc này làm gì (nói dễ hiểu):** Khi phụ huynh gặp lỗi và cần được bù lượt tạo truyện, Admin vào màn này: nhập mã tài khoản để xem gói và lượt của người đó, cấp hoặc trừ lượt kèm lý do bắt buộc, và xem lịch sử các lần điều chỉnh.

**Cần thêm / còn thiếu:**
- Đã có: `adminBillingService.userQuota`, `adjustCredits`, `adjustments`; `MyPlanSummary` (Task 3) dùng lại để hiện gói của tài khoản.
- Cần thêm: `AdminCredits.tsx`.
- Còn thiếu / ngoài phạm vi: tìm tài khoản theo email (backend chỉ nhận `userId`; mã lấy từ cột "Người mua" ở Task 9, nên Task 9 hiện kèm `payerUserId`); cấp lượt cho Creator (backend chưa có).

**Files:**
- Create: `app/features/staff/AdminCredits.tsx`
- Modify: `app/features/staff/AdminTransactions.tsx` (hiện mã tài khoản cạnh email), `app/features/staff/StaffApp.tsx`

**Interfaces:**
- Produces: trang `{ id: "credits", label: "Cấp lượt", icon: Coins, view: AdminCredits }`.

- [ ] **Step 1: `AdminCredits`.** Ô "Mã tài khoản" và nút "Xem". Có dữ liệu thì hiện `MyPlanSummary` của tài khoản, form "Số lượt" (số nguyên khác 0, dương là cấp, âm là trừ) và "Lý do" (bắt buộc, tối đa 500 ký tự, có bộ đếm). Nút gửi qua `confirmDialog("Cấp {n} lượt cho tài khoản {id}?")` hoặc "Trừ {n} lượt…". Thành công hiện "Tài khoản còn {totalRemainingAfter} lượt." và tải lại. Lỗi 400 và 404 hiện câu của backend.
- [ ] **Step 2: Lịch sử.** Bảng phân trang: thời gian, tài khoản, số lượt (có dấu), lý do, người thực hiện. Ô chọn "Chỉ tài khoản đang xem".
- [ ] **Step 3: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay: cấp 3 lượt cho tài khoản `parent1`, đăng nhập phụ huynh thấy "Lượt khác: 3"; trừ quá số còn lại bị từ chối.

---

### Task 13: Admin — doanh thu, tài khoản và báo cáo kỳ

**Việc này làm gì (nói dễ hiểu):** Admin xem được tình hình kinh doanh của một kỳ bất kỳ: tổng doanh thu, doanh thu theo gói, số người mua, số lượt đã cấp và đã dùng, quỹ chia cho Creator, cùng số liệu tài khoản phụ huynh. Màn "Báo cáo nghiệp vụ" sẵn có được bổ sung danh sách các báo cáo kỳ đã tạo và phần doanh thu, tài khoản đã chụp lại trong từng báo cáo.

**Cần thêm / còn thiếu:**
- Đã có: `AdminBusinessReport` (tạo và công bố báo cáo, xem báo cáo mới nhất); `PeriodPicker` (Task 8).
- Cần thêm: `AdminRevenue.tsx`, `RevenuePanel.tsx` (dùng chung cho xem trực tiếp và báo cáo đã chụp), danh sách báo cáo.
- Còn thiếu / ngoài phạm vi: biểu đồ theo ngày (API chỉ trả tổng của kỳ); xuất file.

**Files:**
- Create: `app/features/staff/AdminRevenue.tsx`, `app/features/staff/RevenuePanel.tsx`
- Modify: `app/features/staff/AdminSystem.tsx`, `app/features/staff/StaffApp.tsx`

**Interfaces:**
- Consumes: `adminBillingService.revenue`, `accounts`, `reports`, `report`; `PeriodPicker`; `vnd`, `planTypeLabel`.
- Produces: `RevenuePanel({ revenue, accounts }: { revenue: RevenueStatisticsDto | null; accounts: AccountStatisticsDto | null })`; trang `{ id: "revenue", label: "Doanh thu", icon: ChartColumn, view: AdminRevenue }`. Nhóm "Kinh doanh" trong `NAV.Administrator` thành `["revenue", "business", "payments", "plans", "plan-settings", "credits"]`.

- [ ] **Step 1: `RevenuePanel`.** Các ô số: Tổng doanh thu, Giao dịch đã thanh toán, Phụ huynh mua gói, Mua lại, Xác nhận tay (số lượng và số tiền), Quỹ Creator. Bảng "Theo loại gói" (`revenueByPlanType`) và "Theo gói" (`revenueByPlan`). Bảng "Giao dịch theo trạng thái". Bảng lượt: đã cấp theo nguồn (Dùng thử, Theo gói, Add-on, Admin cấp, Gói cũ) và đã dùng. Khối tài khoản: Tổng tài khoản phụ huynh, Đăng ký mới, Có hoạt động, Đang bị khoá, Hồ sơ bé. `revenue = null` hiện "Báo cáo này được tạo trước khi có số liệu doanh thu."; `accounts = null` tương tự.
- [ ] **Step 2: `AdminRevenue`.** `PeriodPicker` và `RevenuePanel` với dữ liệu gọi song song `revenue` và `accounts`. Ghi chú: "Số liệu tính trực tiếp, kỳ tính trọn ngày theo giờ UTC."
- [ ] **Step 3: `AdminBusinessReport`.** Thêm bảng "Các báo cáo kỳ" (`reports`, phân trang): kỳ, trạng thái, ngày công bố, nút "Xem" mở `Dialog` rộng chứa `RevenuePanel` của báo cáo đó. Lỗi 409 khi tạo kỳ trùng hiện câu của backend. File vượt khoảng 250 dòng thì tách phần danh sách ra `AdminReportList.tsx`.
- [ ] **Step 4: Kiểm.** Run: `npm run lint && npx tsc --noEmit && npm run test`. Kiểm tay: xem doanh thu tháng này sau các giao dịch đã xác nhận ở Task 4, 7 và 9; tạo báo cáo kỳ rồi mở xem.

---

### Task 14: Cập nhật tài liệu và kiểm thử cuối

**Việc này làm gì (nói dễ hiểu):** Đóng việc: ghi lại trong danh sách việc của frontend những gì đã xong, cập nhật bảng theo dõi API nào đã được nối, và chạy một lượt kiểm tay cả ba vai trò ở hai giao diện sáng và tối.

**Cần thêm / còn thiếu:**
- Đã có: `TASKS.md`, `core-api-coverage.json`, lệnh `npm run audit:api`, test `controllerInventory.test.ts`.
- Cần thêm: không có code mới.
- Còn thiếu / ngoài phạm vi: test tự động cho giao diện (repo không có thư viện test DOM; thêm phụ thuộc cần người yêu cầu duyệt riêng).

**Files:**
- Modify: `../TASKS.md` (mục 5: bỏ "Gói tháng và gói bổ sung" và "Doanh thu của Creator" khỏi danh sách chờ backend; mục 6: bỏ dòng "Trang Nâng cấp gói giữ nguyên…"; mục 7: thêm phần ngày hoàn thành)
- Modify: `docs/core-api-coverage.json` (qua lệnh, không sửa tay)

- [ ] **Step 1: Bảng phủ API.** Run: `npm run audit:api`. Expected: các endpoint `Payment/admin/*`, `TokenQuota/creator/me`, `TokenQuota/admin/*`, `BusinessReport/admin/*`, `CreatorStatistics/*`, `ChildProfile/reading-slots` được ghi nhận là đã nối. Nếu lệnh chỉ kiểm mà không ghi, đọc `scripts/audit-core-api.mjs` để biết cách cập nhật file.
- [ ] **Step 2: Toàn bộ kiểm tra tự động.** Run: `npm run test && npm run lint && npx tsc --noEmit && npm run build`. Expected: tất cả PASS.
- [ ] **Step 3: Kiểm tay** theo các bước "Kiểm tay" của Task 3 đến 13, mỗi màn ở cả theme sáng và tối, và ở bề rộng điện thoại (các bảng dùng `stack-table`).
- [ ] **Step 4: Cập nhật `TASKS.md`.**

---

## Ghi chú cho người duyệt kế hoạch

Các quyết định dưới đây do người viết kế hoạch đề xuất, chưa được người yêu cầu xác nhận:

1. Đổi nhãn trang "Nâng cấp gói" thành "Gói của tôi", vì trang nay hiện cả gói đang dùng và lịch sử.
2. Popup thanh toán hỏi lại máy chủ mỗi 5 giây.
3. Thẻ chọn hồ sơ được đọc xuất hiện ở cả màn Hồ sơ bé và trang gói.
4. Creator có hai trang mới trong menu tài khoản: "Lượt của tôi" và "Thống kê".
5. Nhóm "Kinh doanh" của Admin thành sáu trang: Doanh thu, Báo cáo nghiệp vụ, Giao dịch, Gói dịch vụ, Cấu hình gói, Cấp lượt.
6. Không thêm thư viện biểu đồ hay thư viện test giao diện; số liệu hiện dạng ô số và bảng.
