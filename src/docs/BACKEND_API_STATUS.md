# Trạng thái gắn API backend vào Frontend

Cập nhật: 17/10/2026. Đối chiếu controller của `AI_Storytelling_Backend` (commit `f36ff56`) với code trong `app/services` và màn hình trong `app/features`, xếp theo thứ tự luồng như [FRONTEND_PROGRESS.md](FRONTEND_PROGRESS.md).

Tất cả đường dẫn dưới đây đều có tiền tố `/api/v1` (Core API, `API_BASE_URL`).

Ký hiệu:
- ✅ **Đã gắn**: frontend gọi API thật và có màn hình dùng
- 🔌 **Có hàm, chưa dùng**: đã có hàm trong service nhưng chưa màn hình nào gọi
- ⚠️ **Lệch**: frontend có gọi nhưng không khớp backend (sai phương thức, sai đường dẫn hoặc sai hợp đồng)
- ⬜ **Chưa gắn**: backend đã có, frontend chưa gọi

## Tổng quan

| Luồng | Controller backend | Số API | ✅ | 🔌 | ⚠️ | ⬜ |
|---|---|:-:|:-:|:-:|:-:|:-:|
| L1 — Hồ sơ trẻ & giám sát | Auth (phần phụ huynh), ChildProfile, LearningProfile, SafetyPolicy, ChildAccessCredential (phần phụ huynh), Supervision, Permission | 71 | 58 | 1 | 0 | 12 |
| L2 — Sinh truyện AI | AIStoryInput, Outline, ContentGeneration, Review, MediaGeneration, ExistingStories, Story, TokenQuota (phần của bé) | 59 | 50 | 3 | 0 | 6 |
| L3 — Trẻ đọc truyện | ChildAccessCredential (phần của bé), ParentalGate | 3 | 3 | 0 | 0 | 0 |
| L4 — Lộ trình, theo dõi, Hold Mode | Notification | 5 | 3 | 0 | 0 | 2 |
| L5 — Admin / Content Creator / Moderator | Auth (phần vận hành), AdminAccount, ModeratorAccount, TokenQuota (cấu hình), ContentCategory, DataRequest, BusinessReport, Payment, ModerationQueue, CreatorAuthoring, CreatorAssistance | 55 | 17 | 0 | 4 | 33 (+ webhook) |
| L6 — Học tập thích ứng | (dùng `PUT /LearningProfile` của L1) | 0 | — | — | — | — |
| **Tổng Core API** | | **193** | **131** | **4** | **4** | **53 (+ webhook)** |

Luồng 1 và Luồng 2 đã gắn API thật và gỡ dữ liệu mẫu (17/10/2026). Các endpoint còn ⬜ của 2 luồng này là API trùng chức năng, API cũ không còn dùng, hoặc chưa có trong đặc tả.

L3, L4, L6 có rất ít API thật. Phần lớn chức năng của các luồng này đang gọi **API đề xuất** mà backend chưa làm, và tự chuyển sang dữ liệu cục bộ (xem bảng "API đề xuất" ở cuối mỗi luồng).

AI API (`api/ai/*`, port 5260) chỉ dùng nội bộ: Core API gọi sang, frontend **không** gọi trực tiếp. Xem mục cuối.

## Cần sửa ngay

1. ~~**(L1) `PUT /ChildAccessCredential/{childProfileId}` không còn tồn tại.**~~ Đã sửa: bỏ mã PIN, avatar lưu qua `PUT /ChildProfile/{id}` (`avatarId`) ở tab Hồ sơ.
2. **(L5) `staffService` có thể bị kẹt giữa API thật và dữ liệu cục bộ.** Hàm `call()` dùng một cờ `backendReady` chung cho cả service. Lần gọi đầu thành công thì mọi lời gọi sau đều đi API thật, không quay về `staffLocal` nữa. Backend hiện **có** `GET /creator/stories`, nên khi Creator mở màn này trước, các API đề xuất chưa có (`/admin/staff`, `/moderation/queue`, `/evaluation/...`) sẽ trả 404 thay vì dùng dữ liệu cục bộ. Ngoài ra dữ liệu trả về của `GET /creator/stories` chưa chắc khớp kiểu `PublicStory`.
3. **(L2) `GET /Story` chưa lọc được theo bé và lộ truyện của mọi phụ huynh** — xem ghi chú dưới bảng Story (Luồng 2). Cần backend sửa.
4. **Backend đã có nhiều API mà [FRONTEND_PROGRESS.md](FRONTEND_PROGRESS.md) vẫn ghi "chờ backend"** (các mục L1, L2 đã gắn xong):
   - L5 — Vai trò `Moderator`, `ContentCreator` đã có trong enum `UserRole` (enum chỉ còn `Parent`, `Moderator`, `Administrator`, `ContentCreator`; `Teacher` đã bỏ).
   - L5 — Trang kích hoạt tài khoản vận hành: `POST /Auth/staff-activation`.
   - L5 — Mời / vô hiệu hoá Moderator: `ModeratorAccount/*`.
   - L5 — Hàng đợi kiểm duyệt: `ModerationQueue/*` (mới có danh sách, nhận xử lý, mở mục, cấp quyền xem; **chưa có** trả lại và ra quyết định).
   - L5 — Truyện của Content Creator, kèm lịch sử phiên bản, khôi phục, nhập tệp: `creator/stories/*`.

---

## Luồng 1 — Hồ sơ trẻ & giám sát

### Auth (phần phụ huynh) — `/Auth`

Màn hình: [LoginScreen.tsx](../app/components/shell/LoginScreen.tsx), [AccountWorkspace.tsx](../app/features/account/AccountWorkspace.tsx) (+ [ProfileSection.tsx](../app/features/account/ProfileSection.tsx), [DeleteAccountSection.tsx](../app/features/account/DeleteAccountSection.tsx)), [AuthContext.tsx](../app/context/AuthContext.tsx). Theo L1 "Tài khoản phụ huynh (Bước 1.1, 1.1b)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `POST register` | ✅ | `authService.register` | Đăng ký (màn đăng nhập) |
| `POST login` | ✅ | `authService.login` | Đăng nhập (dùng chung với L5) |
| `POST verify-email` | ✅ | `accountService.verifyEmail` | Nhập mã xác thực email (`?auth=verify`); body `{ email, otp }` |
| `POST resend-verification-email` | ✅ | `accountService.resendVerificationEmail` | Gửi lại mã |
| `POST forgot-password` | ✅ | `authService.forgotPassword` | Quên mật khẩu |
| `POST reset-password` | ✅ | `authService.resetPassword` | Đặt lại mật khẩu từ link email |
| `POST change-password` | ✅ | `accountService.changePassword` | Tài khoản → Đổi mật khẩu (gửi kèm `currentRefreshToken` để giữ phiên đang dùng) |
| `POST refresh-token` | ✅ | `authService.refreshToken` | Tự làm mới token |
| `GET me` | ✅ | `authService.getProfile` | Nạp thông tin người dùng |
| `PUT me` | ✅ | `accountService.updateProfile` | Tài khoản → Thông tin: họ tên, ảnh đại diện |
| `POST change-email` | ✅ | `accountService.requestEmailChange` | Tài khoản → Đổi email: gửi OTP tới email mới |
| `POST change-email/confirm` | ✅ | `accountService.confirmEmailChange` | Nhập OTP để đổi email |
| `GET me/delete-preview` | ✅ | `accountService.getDeleteAccountPreview` | Tài khoản → Xoá tài khoản: hồ sơ bé đang chặn / hồ sơ nháp |
| `DELETE me` | ✅ | `accountService.deleteAccount` | Xoá tài khoản (mật khẩu + xác nhận xoá hồ sơ nháp) |
| `POST logout` | ✅ | `authService.logout` | Đăng xuất |
| `POST logout-all-devices` | ✅ | `accountService.logoutAllDevices` | Đăng xuất khỏi mọi thiết bị |
| `GET sessions` | ✅ | `accountService.listSessions` | Tài khoản → danh sách phiên |
| `DELETE sessions/{id}` | ✅ | `accountService.revokeSession` | Đăng xuất một phiên |
| `GET me/audit-log` | ⬜ | — | Nhật ký hoạt động của tài khoản |

### ChildProfile — `/ChildProfile`

Màn hình: `Hồ sơ bé` — [CreateChildWizard.tsx](../app/features/children/CreateChildWizard.tsx), [ProfileTab.tsx](../app/features/children/ProfileTab.tsx), [WorkspaceDataContext.tsx](../app/context/WorkspaceDataContext.tsx). Theo L1 "Hồ sơ trẻ (Bước 1.2, 1.3, 1.8, 1.9)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `POST /` | ✅ | `createChildProfile` | Trình tạo hồ sơ 4 bước |
| `GET mine` | ✅ | `getMyChildProfiles` | "Con của tôi", chọn bé ở thanh trên |
| `GET {id}` | 🔌 | `getChildProfileById` | Có hàm, chưa màn nào gọi |
| `GET {id}/audit-log` | ⬜ | — | Nhật ký thay đổi hồ sơ bé |
| `PUT {id}` | ✅ | `updateChildProfile` | Sửa biệt danh, nhóm tuổi, avatar (Owner); đổi nhóm tuổi thì nhắc áp lại danh sách chặn và chế độ đọc |
| `PATCH {id}/activate` | ✅ | `activateChildProfile` | Kích hoạt hồ sơ |
| `PATCH {id}/suspend` | ✅ | `suspendChildProfile` | Tab Hồ sơ → Tạm dừng hồ sơ |
| `PATCH {id}/resume` | ✅ | `resumeChildProfile` | Tiếp tục hồ sơ (`acceptCurrentConsent` khi điều khoản đã đổi) |
| `PATCH {id}/restore` | ⬜ | — | Khôi phục hồ sơ đã lưu trữ — `GET mine` không trả hồ sơ đã lưu trữ nên chưa có chỗ chọn |
| `DELETE {id}` | ✅ | `archiveChildProfile` | Tab Hồ sơ → Lưu trữ hồ sơ |

> Đã xoá các hàm gọi `GET /Organization/mine`, `GET /ClassGroup/mine` (backend không còn 2 controller này).

### LearningProfile — `/LearningProfile`

Màn hình: [LearningTab.tsx](../app/features/children/LearningTab.tsx), [CreateChildWizard.tsx](../app/features/children/CreateChildWizard.tsx). Theo L1 Bước 1.3; L6 cũng dùng `PUT` để áp dụng mức đọc mới.

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET {childProfileId}` | ✅ | `getLearningProfile` | Hồ sơ bé → Học tập |
| `PUT {childProfileId}` | ✅ | `setLearningProfile` | Sửa hồ sơ học tập, kể cả chế độ đọc (`readingMode`); L6 áp dụng đề xuất mức đọc |
| `POST {childProfileId}` | ⬜ | — | Frontend dùng `PUT` để tạo luôn |
| `DELETE {childProfileId}` | ⬜ | — | — |

### SafetyPolicy — `/SafetyPolicy`

Màn hình: `Cài đặt an toàn` — [SafetyWorkspace.tsx](../app/features/safety/SafetyWorkspace.tsx); còn được đọc ở [AddToRoadmapDialog.tsx](../app/features/roadmap/AddToRoadmapDialog.tsx) và [KidMode.tsx](../app/features/kid/KidMode.tsx). Theo L1 "Cài đặt an toàn (Bước 1.4)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET {childProfileId}` | ✅ | `getSafetyPolicy` | Cài đặt an toàn; kiểm tra khi thêm lộ trình, khi vào chế độ của bé |
| `PUT {childProfileId}` | ✅ | `setSafetyPolicy` | Lưu cài đặt an toàn, gồm "Bé ước một câu chuyện", "Truyện nhiều lựa chọn"; gửi lại nguyên các trường giao diện chưa sửa (`keptPolicyFields`) vì backend ghi đè mọi trường |
| `POST {childProfileId}` | ⬜ | — | Frontend dùng `PUT` để tạo luôn |
| `POST {childProfileId}/reconsent` | ✅ | `reconsent` | Owner đồng ý lại khi `consentOutdated` |
| `GET {childProfileId}/age-preset` | ⬜ | — | Không cần: tính từ `defaultBlockedAgeBands` của `GET /ContentCategory` (cần trước khi hồ sơ được tạo) |
| `POST {childProfileId}/age-preset/apply` | ✅ | `applyAgePreset` | Nút "Áp dụng" sau khi đổi nhóm tuổi (`shouldReapplyBlockedPreset`) |
| `DELETE {childProfileId}` | ⬜ | — | — |

Danh sách chủ đề dùng `GET /ContentCategory` (xem L5).

### Supervision — `/Supervision`

Màn hình: tab "Người giám sát" — [SupervisorsTab.tsx](../app/features/children/SupervisorsTab.tsx); nút "Nhập mã mời" — [JoinInvitation.tsx](../app/features/children/JoinInvitation.tsx); kiểm quyền ở [useMyRole.ts](../app/features/children/useMyRole.ts). Theo L1 "Người giám sát (Bước 1.5–1.7b, Mục 3)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `POST {childProfileId}/invitations` | ✅ | `createInvitation` | Mời người giám sát qua email |
| `GET {childProfileId}/invitations` | ✅ | `listInvitations` | Danh sách lời mời |
| `POST invitations/claim` | ✅ | `claimInvitation` | Bước 1: nhập mã mời (giữ nguyên chữ hoa / thường), backend gửi OTP; gọi lại để gửi lại mã |
| `POST invitations/verify-otp` | ✅ | `verifyInvitationOtp` | Bước 2: nhập OTP, xem người mời và hồ sơ bé |
| `POST invitations/reject` | ✅ | `rejectInvitation` | Người được mời từ chối |
| `POST invitations/accept` | ✅ | `acceptInvitation` | Bước 3: nhận lời mời (backend bắt buộc đã xác thực OTP) |
| `DELETE invitations/{invitationId}` | ✅ | `cancelInvitation` | Huỷ lời mời |
| `POST invitations/{invitationId}/regenerate` | ✅ | `regenerateInvitation` | "Cấp lại mã" cho lời mời đang chờ / hết hạn (gửi lại email) |
| `GET {childProfileId}/relationships` | ✅ | `listSupervisors` | Danh sách người giám sát (cũng dùng ở Dashboard) |
| `DELETE relationships/{relationshipId}` | ✅ | `revokeSupervisor` | Gỡ người giám sát / tự rời |
| `POST {childProfileId}/transfer-ownership` | ✅ | `requestOwnershipTransfer` | Owner đề nghị chuyển quyền |
| `GET {childProfileId}/ownership-transfers` | ✅ | `listOwnershipTransfers` | Danh sách đề nghị chuyển quyền |
| `POST ownership-transfers/{id}/accept` | ✅ | `answerOwnershipTransfer` | Nhận quyền |
| `POST ownership-transfers/{id}/reject` | ✅ | `answerOwnershipTransfer` | Từ chối |
| `POST ownership-transfers/{id}/cancel` | ✅ | `cancelOwnershipTransfer` | Owner huỷ đề nghị đang chờ |
| `GET relationships/{id}/permissions` | ✅ | `listPermissions` | 7 quyền giám sát |
| `POST relationships/{id}/permissions/{permission}` | ✅ | `grantPermission` | Bật quyền |
| `DELETE relationships/{id}/permissions/{permission}` | ✅ | `revokePermission` | Tắt quyền |

### Permission — `/Permission`

Màn hình: [SupervisorsTab.tsx](../app/features/children/SupervisorsTab.tsx), khối "Cần xử lý" ở [HomeWorkspace.tsx](../app/features/home/HomeWorkspace.tsx). Theo L1 "Xin thêm quyền".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET /` | ⬜ | — | Danh sách quyền của hệ thống (frontend đang cố định 7 quyền) |
| `GET relationships/{id}` | ⬜ | — | Trùng chức năng `Supervision/.../permissions` |
| `POST relationships/{id}/{permission}` | ⬜ | — | Trùng chức năng `Supervision/.../permissions/{permission}` |
| `DELETE relationships/{id}/{permission}` | ⬜ | — | Như trên |
| `POST relationships/{id}/requests` | ✅ | `requestPermission` | Người giám sát xin thêm quyền |
| `GET relationships/{id}/requests` | ✅ | `listPermissionRequests` | Danh sách yêu cầu (tab giám sát + Dashboard) |
| `POST requests/{id}/accept` | ✅ | `answerPermissionRequest` | Owner đồng ý |
| `POST requests/{id}/reject` | ✅ | `answerPermissionRequest` | Owner từ chối |
| `POST requests/{id}/cancel` | ✅ | `answerPermissionRequest` | Người xin huỷ |

### ChildAccessCredential (phần phụ huynh) — `/ChildAccessCredential`

Màn hình: tab "Bé đăng nhập" — [AccessTab.tsx](../app/features/children/AccessTab.tsx); nút "Cho bé đọc" — [KidMode.tsx](../app/features/kid/KidMode.tsx). Theo L1 "Truy cập của bé (Bước 1.10)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET {childProfileId}` | ✅ | `getCredential` | Đã có mã QR chưa, tạo lúc nào (`hasEasyLogin`, `easyLoginCreatedAt`) |
| `DELETE {childProfileId}` | ✅ | `revokeCredential` | Thu hồi mã QR |
| `POST {childProfileId}/easylogin` | ✅ | `generateEasyLogin` | Tạo / tạo lại mã QR dùng lâu dài; `secret` chỉ trả về một lần |
| `POST {childProfileId}/handover` | ✅ | `startSupervisedSession` | Nút "Cho bé đọc" |

Backend đã bỏ mã PIN và `PUT {childProfileId}`; avatar lưu trong hồ sơ bé (`PUT /ChildProfile/{id}`).

---

## Luồng 2 — Sinh truyện AI

### AIStoryInput — `/ai-story-input`

Màn hình: `Studio → Yêu cầu` — [BriefForm.tsx](../app/features/studio/BriefForm.tsx), hook [useAIStoryInputFlow.ts](../app/features/story-workflow/useAIStoryInputFlow.ts). Theo L2 "Yêu cầu tạo truyện (mục 3.1)" và "Guardrail & kiểm duyệt".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET children/{childProfileId}/context` | ✅ | `getCreationContext` | Nạp giới hạn độ dài, sở thích, lượt còn lại |
| `POST requests` | ✅ | `submitInput` | Gửi yêu cầu tạo truyện, kèm kiểu truyện `outputMode` (`learning` / `reading_media_only`) |
| `GET stories/{storyId}/requests/{requestId}` | ✅ | `getInputProgress` | Theo dõi guardrail / trạng thái |
| `POST stories/{storyId}/requests/{requestId}/retry` | ✅ | `retryInput` | Sửa ý tưởng / thử lại khi bị chặn |

### TokenQuota (phần của bé) — `/TokenQuota`

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET child/{childProfileId}` | ✅ | `childProfileService.getTokenQuotaForChild` | Số lượt tạo truyện còn lại — [BriefForm.tsx](../app/features/studio/BriefForm.tsx), [HomeWorkspace.tsx](../app/features/home/HomeWorkspace.tsx) |

### ExistingStories — `/stories`

Màn hình: `Studio → Nhập truyện có sẵn` — [ImportStoryPanel.tsx](../app/features/studio/ImportStoryPanel.tsx). Theo L2 "Nhập truyện có sẵn (mục 3.2, 5.2–5.4)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `POST import` | ✅ | `existingStoryService.importStory` | Dán truyện |
| `POST import-file` | ✅ | `existingStoryService.importFile` | Tải tệp .txt / .docx (multipart, tối đa 5 MB) |
| `POST {storyId}/existing/evaluate` | ✅ | `evaluate` | Đánh giá Phù hợp / Nên điều chỉnh / Bị chặn |
| `GET {storyId}/existing/evaluation` | ⬜ | — | Lấy lại kết quả đánh giá gần nhất (khi mở lại truyện) |
| `POST {storyId}/existing/adapt` | ✅ | `adapt` | AI điều chỉnh |
| `PUT {storyId}/existing/content` | ✅ | `manualEdit` | Tự sửa |
| `POST {storyId}/existing/keep-original` | ✅ | `keepOriginal` | Giữ bản gốc (bắt buộc lý do) |
| `POST {storyId}/existing/archive` | ✅ | `archive` | Lưu trữ |

### Outline — `/stories/{storyId}/outline`

Màn hình: [OutlinePanel.tsx](../app/features/studio/OutlinePanel.tsx), [useStoryPipeline.ts](../app/features/studio/useStoryPipeline.ts). Theo L2 "Dàn ý (Phase 2)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET /` | ✅ | `getOutline` | Xem dàn ý hiện tại (polling) |
| `GET versions` | 🔌 | `getOutlineVersions` | Có hàm, chưa màn nào gọi (lịch sử dàn ý) |
| `GET versions/{versionNo}` | 🔌 | `getOutlineVersion` | Có hàm, chưa màn nào gọi |
| `PUT versions/{versionNo}` | ✅ | `editOutline` | Sửa dàn ý |
| `POST versions/{versionNo}/regenerate` | ✅ | `regenerateOutline` | Viết lại dàn ý |
| `POST retry` | ✅ | `retryOutline` | Nút "Thử lại" khi tạo dàn ý lần đầu bị lỗi ([StageProgress.tsx](../app/features/studio/StageProgress.tsx)) |
| `POST versions/{versionNo}/approve` | ✅ | `approveOutline` | Duyệt dàn ý |
| `POST versions/{versionNo}/reject` | ✅ | `rejectOutline` | Từ chối dàn ý |

### ContentGeneration — `/stories/{storyId}/generation`

Theo L2 "Nội dung truyện (Phase 3)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET progress` | ✅ | `getGenerationProgress` | Tiến độ viết truyện — [useStoryPipeline.ts](../app/features/studio/useStoryPipeline.ts) |
| `POST retry` | ✅ | `retryGeneration` | Nút "Thử lại" khi viết truyện / học liệu bị lỗi |

### Review — `/stories/{storyId}/review`

Màn hình: `Duyệt nội dung` — [ReviewWorkspace.tsx](../app/features/review/ReviewWorkspace.tsx), [ReviewTools.tsx](../app/features/review/ReviewTools.tsx), hook [useStoryReview.ts](../app/features/story-workflow/useStoryReview.ts). Theo L2 "Nội dung truyện (Phase 3)", "Học liệu (Phase 4)", "Duyệt (mục 6.6)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET /` | ✅ | `getReviewPackage` | Gói duyệt |
| `POST artifacts/generate` (hoặc `/stories/{id}/artifacts/generate`) | ✅ | `generateArtifacts` | "Tạo học liệu còn thiếu" |
| `GET story` | ✅ | `getStoryReview` | Xem nội dung truyện |
| `PUT story` | ✅ | `updateStoryReview` | Sửa tay nội dung |
| `POST story/ai/partial-edit` | ✅ | `partialEditStory` | Chỉnh sửa theo chủ đích (9 mục đích) |
| `POST story/complete` | ✅ | `completeReview(…, 'story')` | Đánh dấu xong phần truyện |
| `GET vocabulary` | ✅ | `getVocabularyReview` | Từ vựng |
| `PUT vocabulary` | ✅ | `updateVocabularyReview` | Sửa từ vựng |
| `POST vocabulary/ai/regenerate` | ✅ | `regenerateReviewArtifact` | AI tạo lại từ vựng |
| `POST vocabulary/complete` | ✅ | `completeReview` | Xong từ vựng |
| `GET quiz` | ✅ | `getQuizReview` | Câu đố |
| `PUT quiz` | ✅ | `updateQuizReview` | Sửa câu đố |
| `POST quiz/ai/regenerate` | ✅ | `regenerateReviewArtifact` | AI tạo lại câu đố |
| `POST quiz/complete` | ✅ | `completeReview` | Xong câu đố |
| `GET discussion` | ✅ | `getDiscussionReview` | Câu hỏi thảo luận (cũng dùng ở [CompletionCard.tsx](../app/features/home/CompletionCard.tsx) của L4) |
| `PUT discussion` | ✅ | `updateDiscussionReview` | Sửa câu hỏi thảo luận |
| `POST discussion/ai/regenerate` | ✅ | `regenerateReviewArtifact` | AI tạo lại |
| `POST discussion/complete` | ✅ | `completeReview` | Xong thảo luận |
| `GET validation` | ✅ | `validateReview` | Kiểm tra trước khi duyệt |
| `POST auto-publish-check` | ⬜ | — | Kiểm tra tự duyệt khi đạt ngưỡng (Cài đặt an toàn → "tự duyệt") |
| `POST approve` | ✅ | `approveStory` | Duyệt truyện |
| `POST archive` | ✅ | `archiveStory` | Lưu trữ kèm lý do |
| `GET proposals/{proposalId}` | ✅ | `getProposal` | Xem đề xuất AI |
| `POST proposals/{proposalId}/apply` | ✅ | `applyProposal` | Áp dụng |
| `POST proposals/{proposalId}/discard` | ✅ | `discardProposal` | Bỏ qua |
| *(chưa có)* `reject` | — | — | Từ chối kèm lý do — vẫn **chờ backend** |

> Bảng có 25 dòng nhưng tổng quan tính 26, vì `artifacts/generate` có 2 route.
>
> Truyện `reading_media_only`: backend trả 409 `LEARNING_ARTIFACT_NOT_ENABLED` cho mọi API học liệu, nên frontend không gọi `vocabulary` / `quiz` / `discussion` và chỉ `story/complete` trước khi duyệt.

### MediaGeneration — `/stories/{storyId}/media`

Màn hình: [StudioMedia.tsx](../app/features/studio/StudioMedia.tsx), [useStoryPipeline.ts](../app/features/studio/useStoryPipeline.ts). Theo L2 "Ảnh & giọng đọc (Phase 5)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET progress` | ✅ | `getMediaProgress` | Tiến độ tạo ảnh và giọng đọc |
| `GET package` | ✅ | `getMediaPackage` | Màn đọc của bé (L3) lấy ảnh minh hoạ từng cảnh |
| `POST illustration-beats/{beatId}/regenerate` | 🔌 | `regenerateIllustration` | (Optional) Vẽ lại một ảnh — chưa có giao diện |
| `POST retry` | ✅ | `retryMedia` | Thử lại khi lỗi |

### Story — `/Story`

Màn hình: [WorkspaceDataContext.tsx](../app/context/WorkspaceDataContext.tsx) (danh sách truyện), [LibraryWorkspace.tsx](../app/features/library/LibraryWorkspace.tsx), [ModerationDialogs.tsx](../app/features/library/ModerationDialogs.tsx). Theo L2 "Phiên bản & quản lý truyện (mục 6.8, 6.9)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET /` | ✅ | `storyService.getStories` | Thư viện truyện; gửi `authorUserId`, `pageIndex`, `pageSize`, `searchTerm`, `isDescending`. **Chưa lọc được theo bé** — xem ghi chú dưới bảng |
| `GET {id}` | ✅ | `getStoryById` | Chi tiết truyện, xem trước, báo cáo / nộp cộng đồng |
| `POST /` | ⬜ | — | API cũ, đã xoá hàm — truyện mới đi qua `ai-story-input` / `stories/import` |
| `PUT {id}` | ⬜ | — | API cũ, đã xoá hàm |
| `DELETE {id}` | ⬜ | — | API cũ, đã xoá hàm |
| `PATCH {id}/publish` | ⬜ | — | API cũ, đã xoá hàm — duyệt đi qua `review/approve` |

> **Chặn — cần backend sửa:** `GET /Story` đang `[AllowAnonymous]` và trả truyện phạm vi phụ huynh của **mọi tài khoản** (ai cũng xem được truyện riêng của trẻ khác). `StoryFilterRequestDto` không có `childProfileId`, `StoryDto` không trả `childProfileId` dù entity `Story` có. Frontend tạm lọc `authorUserId` = mình (màn đọc của bé dùng Owner của bé), nên chưa tách được truyện theo từng bé và người giám sát thêm không thấy truyện do Owner tạo. `StoryDto` cũng không có `pages`: màn xem trước / màn đọc tách trang từ `content`.

### L2 — API đề xuất backend chưa có

| Chức năng | Đường dẫn đề xuất (service) |
|---|---|
| Điều ước của bé — phía phụ huynh (mục 3.5) | `/children/{id}/wishes`, `/wishes/{id}/fulfill-with-existing` · `/accept` · `/decline` (`guardianService`) |
| Từ chối truyện ở bước duyệt, lịch sử phiên bản, truyện nhiều lựa chọn | Chưa có hàm — xem bảng "Luồng 2 — cần backend bổ sung" trong FRONTEND_PROGRESS |

---

## Luồng 3 — Trẻ đọc truyện

### ChildAccessCredential (phần của bé) & ParentalGate

Màn hình: [KidEntry.tsx](../app/features/kid/KidEntry.tsx), [KidMode.tsx](../app/features/kid/KidMode.tsx), [ParentalGate.tsx](../app/features/kid/ParentalGate.tsx). Theo L3 "Vào và thoát phiên của bé (Bước 3.0, 3.0b)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `POST /ChildAccessCredential/easylogin/login` | ✅ | `loginWithEasyLogin` | Bé quét QR (`/?kid=<mã>`); body `{ secret }` |
| `GET /ChildAccessCredential/me` | ✅ | `getSessionProfile` | Lấy hồ sơ của phiên bé (policy `ChildSession`) |
| `POST /ParentalGate/verify` | ✅ | `childAccessService.verifyParentalGate` | Hộp "Dành cho bố mẹ" khi rời chế độ của bé |

### L3 — API đề xuất backend chưa có

Mọi chức năng đọc khác của bé đều gọi `readingService` và tự chuyển sang `readingLocal`, nên tiến độ, câu đố, sổ tay chỉ lưu trong trình duyệt. Nội dung truyện thì lấy thật: `GET /Story`, `review/quiz`, `review/vocabulary`, `media/package` (đã bỏ `mockReading`).

| Chức năng | Đường dẫn đề xuất | Màn hình |
|---|---|---|
| Trang chính, Journey Map | `GET /children/{id}/reading/home` | [KidApp.tsx](../app/features/kid/KidApp.tsx), [KidHome.tsx](../app/features/kid/KidHome.tsx) |
| Gói đọc (trang, ảnh, audio, từ vựng, câu đố) | `GET /reading/stories/{id}/package` | [KidReader.tsx](../app/features/kid/KidReader.tsx) |
| Phiên đọc: bắt đầu, hoàn thành, thoát, buộc thoát | `POST /reading/sessions`, `/complete`, `/exit`, `GET /force-exit` | [KidReader.tsx](../app/features/kid/KidReader.tsx), [KidApp.tsx](../app/features/kid/KidApp.tsx) |
| Tiến độ, đánh dấu trang, yêu thích | `PUT /children/{id}/reading/progress/{storyId}` | [KidReader.tsx](../app/features/kid/KidReader.tsx) |
| Cảm nhận, câu đố, telemetry | `POST /reading/sessions/{id}/reaction`, `/quiz`, `/telemetry` | [KidAfter.tsx](../app/features/kid/KidAfter.tsx) |
| Sổ tay từ vựng, tưới cây | `GET/POST /children/{id}/vocabulary-notebook`, `POST /children/{id}/achievements/invest` | [KidNotebook.tsx](../app/features/kid/KidNotebook.tsx), [KidAfter.tsx](../app/features/kid/KidAfter.tsx) |
| Bé ước một câu chuyện | `GET /children/{id}/wish-cards`, `POST /children/{id}/wishes` | [KidWish.tsx](../app/features/kid/KidWish.tsx) |

---

## Luồng 4 — Lộ trình, theo dõi, Hold Mode

### Notification — `/Notification`

Màn hình: chuông thông báo — [NotificationBell.tsx](../app/components/shell/NotificationBell.tsx). Theo L4 "Thông báo trong app".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET /` | ✅ | `guardianService.notifications` | Danh sách thông báo |
| `GET unread-count` | ⬜ | — | Frontend đang tự đếm từ danh sách |
| `PUT {notificationId}/read` | ✅ | `markNotificationRead` | Đọc một |
| `PUT read-all` | ✅ | `markAllNotificationsRead` | Đọc hết |
| `DELETE {notificationId}` | ⬜ | — | Xoá thông báo |

### L4 — API đề xuất backend chưa có

Gọi qua `guardianService` và tự chuyển sang `guardianLocal`. Backend đã có bảng `reading_roadmaps`, `reading_roadmap_items` (có dữ liệu seed) nhưng chưa có controller.

| Chức năng | Đường dẫn đề xuất | Màn hình |
|---|---|---|
| Lộ trình của con | `GET /children/{id}/roadmap`, `POST /roadmap/items`, `DELETE /roadmap/items/{id}`, `PUT /children/{id}/roadmap/order`, `POST /children/{id}/roadmap/clear` | [RoadmapWorkspace.tsx](../app/features/roadmap/RoadmapWorkspace.tsx), [AddToRoadmapDialog.tsx](../app/features/roadmap/AddToRoadmapDialog.tsx) |
| Bộ truyện mẫu | `GET /roadmap-templates`, `POST /roadmap-templates/{id}/apply` | [RoadmapWorkspace.tsx](../app/features/roadmap/RoadmapWorkspace.tsx), [AddToRoadmapDialog.tsx](../app/features/roadmap/AddToRoadmapDialog.tsx) |
| Hold Mode | `GET /children/{id}/intervention`, `POST /intervention-cases/{id}/unlock`, `PUT /intervention-cases/{id}/notes` | [HoldPanel.tsx](../app/features/roadmap/HoldPanel.tsx) |
| Dashboard, "Con vừa đọc xong", báo cáo tuần | `GET /children/{id}/dashboard`, `/read-completions`, `PUT /read-completions/{id}/seen`, `GET /children/{id}/progress-reports` | [HomeWorkspace.tsx](../app/features/home/HomeWorkspace.tsx) |
| Report nội dung | `POST /content-reports`, `GET /stories/{id}/moderation-status` | [ModerationDialogs.tsx](../app/features/library/ModerationDialogs.tsx), [LibraryWorkspace.tsx](../app/features/library/LibraryWorkspace.tsx) |
| Thư viện cộng đồng | `POST /community-submissions`, `POST /community-submissions/{id}/withdraw` | [ModerationDialogs.tsx](../app/features/library/ModerationDialogs.tsx), [LibraryWorkspace.tsx](../app/features/library/LibraryWorkspace.tsx) |

---

## Luồng 5 — Admin / Content Creator / Moderator

### Auth (phần vận hành) — `/Auth`

Theo L5 "Đăng nhập & tài khoản (Bước 5.1, 5.1b, 5.1d)". Đăng nhập dùng chung `POST login` với L1.

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `POST mfa/verify` | ✅ | `authService.verifyMfa` | Bước nhập mã TOTP sau mật khẩu — [LoginScreen.tsx](../app/components/shell/LoginScreen.tsx) |
| `POST staff-activation` | ⬜ | — | Trang kích hoạt từ link mời (đặt mật khẩu, cam kết) — đang ghi "chờ backend" |

### AdminAccount — `/AdminAccount` (chỉ Administrator)

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `POST grant` | ✅ | `staffService.grantAdmin` | Cấp Administrator — [AdminSystem.tsx](../app/features/staff/AdminSystem.tsx) |
| `POST {targetUserId}/revoke` | ✅ | `staffService.revokeAdmin` | Thu hồi Administrator |

### ModeratorAccount — `/ModeratorAccount` (chỉ Administrator)

Frontend đang gọi API đề xuất `/admin/staff/*` ([AdminPeople.tsx](../app/features/staff/AdminPeople.tsx)); backend đã có controller này nhưng dùng đường dẫn khác. Theo L5 Bước 5.1b.

| Endpoint | Trạng thái | Nên thay cho | Chức năng / màn hình |
|---|:-:|---|---|
| `GET /` | ⬜ | `staffService.staff` → `/admin/staff` | Danh sách tài khoản vận hành |
| `POST invite` | ⬜ | `staffService.invite` → `/admin/staff/invitations` | Mời Moderator |
| `POST {userId}/resend-invite` | ⬜ | — | Gửi lại lời mời |
| `POST {userId}/deactivate` | ⬜ | `setStaffActive(false)` → `/admin/staff/{id}/deactivate` | Vô hiệu hoá |
| `POST {userId}/reactivate` | ⬜ | `setStaffActive(true)` → `/admin/staff/{id}/reactivate` | Kích hoạt lại |

### TokenQuota (cấu hình) — `/TokenQuota`

Màn hình: [AdminSystem.tsx](../app/features/staff/AdminSystem.tsx). Theo L5 "Token Quota (Bước 5.1c)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET config` | ✅ | `staffService.quotaConfigs` | Xem các cấu hình |
| `POST config` | ✅ | `staffService.setQuota` | Đặt hạn mức mặc định / ghi đè |

### ContentCategory — `/ContentCategory`

Màn hình: Admin → Danh mục ([AdminCatalog.tsx](../app/features/staff/AdminCatalog.tsx)). Theo L5 "Danh mục & Prompt Catalog (Bước 5.3)". L1 cũng đọc danh sách này khi tạo hồ sơ và ở Cài đặt an toàn.

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET /` | ✅ | `staffService.categories`, `getContentCategories` | Danh mục nội dung; chọn chủ đề ở L1 |
| `GET {id}` | ⬜ | — | — |
| `POST /` | ✅ | `staffService.createCategory` | Thêm danh mục |
| `PUT {id}` | ✅ | `staffService.updateCategory` | Đổi tên, ẩn / hiện |
| `DELETE {id}` | ⬜ | — | Frontend dùng ẩn (`isActive=false`) thay cho xoá |

### DataRequest — `/DataRequest`

Màn hình: Hồ sơ bé → tab Hồ sơ ([ProfileTab.tsx](../app/features/children/ProfileTab.tsx)); Admin → Hệ thống ([AdminSystem.tsx](../app/features/staff/AdminSystem.tsx)). Theo L5 "Data Request (Bước 5.4)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `POST /` | ✅ | `createDataRequest` | Phụ huynh gửi yêu cầu xuất / xoá dữ liệu |
| `GET pending` | ✅ | `pendingDataRequests` | Admin xem yêu cầu đang chờ |
| `GET mine` | ⬜ | — | Phụ huynh xem trạng thái yêu cầu đã gửi |
| `POST {id}/cancel` | ⬜ | — | Phụ huynh huỷ yêu cầu |
| `POST {id}/resolve-export` | ✅ | `resolveExport` | Admin xuất Excel / CSV |
| `POST {id}/resolve-delete` | ✅ | `resolveDelete` | Admin xoá dữ liệu |
| `POST {id}/reject` | ⬜ | — | Admin từ chối yêu cầu |

### BusinessReport — `/BusinessReport`

Màn hình: [AdminSystem.tsx](../app/features/staff/AdminSystem.tsx). Theo L5 "Báo cáo nghiệp vụ (Bước 5.5)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `POST generate` | ✅ | `generateReport` | Tổng hợp theo kỳ |
| `POST {reportId}/publish` | ✅ | `publishReport` | Công bố |
| `GET latest-published` | ✅ | `latestReport` | Báo cáo công bố gần nhất |

### Payment — `/Payment`

Màn hình: [AdminSystem.tsx](../app/features/staff/AdminSystem.tsx). Theo L5 "Đối soát thanh toán (Bước 5.6, Optional)".

| Endpoint | Trạng thái | Hàm frontend | Chức năng / màn hình |
|---|:-:|---|---|
| `GET plans` | ⬜ | — | (Optional) Phụ huynh xem gói |
| `POST transactions` | ⬜ | — | (Optional) Phụ huynh mua gói, mã QR SePay |
| `POST webhook/sepay` | — | — | SePay gọi vào backend, frontend không dùng |
| `GET mismatched` | ✅ | `mismatchedPayments` | Giao dịch lệch số tiền |
| `POST transactions/{id}/mark-paid` | ✅ | `markPaid` | Xác nhận đã thanh toán |

### ModerationQueue — `/ModerationQueue` (Moderator, Administrator)

Frontend đang gọi API đề xuất `/moderation/*` ([Moderation.tsx](../app/features/staff/Moderation.tsx)). Theo L5 "Hàng đợi kiểm duyệt (Bước 5.7)".

| Endpoint | Trạng thái | Nên thay cho | Chức năng / màn hình |
|---|:-:|---|---|
| `GET /` | ⚠️ | `staffService.queue` → `/moderation/queue` | Hàng đợi kiểm duyệt — khác đường dẫn |
| `POST {itemId}/claim` | ⚠️ | `staffService.claim` → `/moderation/items/{id}/claim` | "Nhận xử lý" — khác đường dẫn |
| `GET {itemId}` | ⬜ | — | Mở chi tiết mục |
| `POST review-views` | ⬜ | — | Cấp quyền xem nội dung để duyệt |
| *(chưa có)* release, decision | — | `release`, `decide` | "Trả lại", ra quyết định — **chờ backend** |

### CreatorAuthoring — `/creator/stories` (Content Creator)

Frontend đang gọi API đề xuất `/creator/stories*` ([Creator.tsx](../app/features/staff/Creator.tsx)), nhưng hợp đồng khác backend. Theo L5 "Content Creator (Bước 5.8, 5.9)".

| Endpoint | Trạng thái | Hàm frontend hiện tại | Chức năng / màn hình |
|---|:-:|---|---|
| `GET /` | ⚠️ | `staffService.myStories` | **Trùng đường dẫn** nên đang gọi tới backend thật, nhưng chưa kiểm dữ liệu trả về có khớp `PublicStory` không (xem "Cần sửa ngay" mục 2) |
| `POST manual` | ⚠️ | `saveStory` gọi `POST /creator/stories` | Backend tạo bằng `POST /creator/stories/manual` |
| `GET {storyId}` | ⬜ | — | Chi tiết truyện của Creator |
| `POST {storyId}/manual/versions` | ⬜ | (`saveStory` đang gọi `PUT /creator/stories/{id}`) | Lưu bản mới |
| `GET {storyId}/content/versions` | ⬜ | — | Lịch sử phiên bản |
| `GET {storyId}/content/versions/{versionId}` | ⬜ | — | Xem một phiên bản |
| `POST {storyId}/content/restore` | ⬜ | — | Khôi phục bản cũ |
| `POST {storyId}/imports/preview` | ⬜ | — | Xem trước khi nhập nội dung dán |
| `POST {storyId}/imports/preview-file` | ⬜ | — | Xem trước khi nhập tệp |
| `POST {storyId}/imports/confirm` | ⬜ | — | Xác nhận nhập |
| *(chưa có)* submit, withdraw, archive, templates | — | `submitStory`, `withdrawStory`, `archiveStory`, `*Template` | Gửi duyệt, rút, gỡ, bộ truyện mẫu — **chờ backend** |

### CreatorAssistance — `/creator/stories/{storyId}/assistance-tasks` (Content Creator)

Frontend **chưa có** hàm và màn hình nào. Đây là trợ lý AI cho Creator ("Tạo truyện mẫu bằng pipeline AI" — L5 Bước 5.8, đang ghi "chờ backend").

| Endpoint | Trạng thái | Chức năng |
|---|:-:|---|
| `POST /` | ⬜ | Tạo phiên trợ lý |
| `GET /` | ⬜ | Danh sách phiên |
| `GET {taskId}` | ⬜ | Chi tiết phiên |
| `GET {taskId}/steps` | ⬜ | Các bước đã chạy |
| `POST {taskId}/suggestions` | ⬜ | Xin gợi ý |
| `POST {taskId}/clarification-answer` | ⬜ | Trả lời câu hỏi làm rõ của AI |
| `POST {taskId}/direction` | ⬜ | Chọn hướng |
| `POST {taskId}/trials` | ⬜ | Chạy thử |
| `POST {taskId}/cancel` | ⬜ | Huỷ |
| `POST {taskId}/close` | ⬜ | Đóng phiên |

### L5 — API đề xuất backend chưa có

Gọi qua `staffService.call()` và tự chuyển sang `staffLocal` (lưu ý "Cần sửa ngay" mục 2).

| Chức năng | Đường dẫn đề xuất | Màn hình |
|---|---|---|
| Đơn Content Creator | `POST /creator-applications`, `/admin/creator-applications/*` | [LoginScreen.tsx](../app/components/shell/LoginScreen.tsx), [AdminPeople.tsx](../app/features/staff/AdminPeople.tsx) |
| Tài khoản phụ huynh (Bước 5.1e) | `/admin/parents/*` (tìm, tạm khoá, mở khoá, mở khoá đăng nhập) | [AdminPeople.tsx](../app/features/staff/AdminPeople.tsx) |
| Giám sát AI (Bước 5.2) | `/admin/ai-metrics`, `/admin/generation-jobs` | [AdminAi.tsx](../app/features/staff/AdminAi.tsx) |
| Thẻ ước, bài học, nhân vật mẫu, Prompt Catalog (Bước 5.3) | `/admin/catalog/*`, `/admin/prompt-catalog/versions/*` | [AdminCatalog.tsx](../app/features/staff/AdminCatalog.tsx) |
| Bộ dữ liệu & đánh giá AI (Bước 5.10) | `/evaluation/prompts/*`, `/evaluation/runs/*` | [AdminAi.tsx](../app/features/staff/AdminAi.tsx), [Creator.tsx](../app/features/staff/Creator.tsx), [Moderation.tsx](../app/features/staff/Moderation.tsx) |
| Trả lại / ra quyết định kiểm duyệt | `/moderation/items/{id}/release`, `/decision` | [Moderation.tsx](../app/features/staff/Moderation.tsx) |
| Gửi duyệt, rút, gỡ truyện mẫu; bộ truyện mẫu | `/creator/stories/{id}/submit` · `/withdraw` · `/archive`, `/creator/templates/*` | [Creator.tsx](../app/features/staff/Creator.tsx) |

---

## Luồng 6 — Học tập thích ứng

Backend chưa có controller riêng cho L6. API thật duy nhất là `PUT /LearningProfile/{childProfileId}` (xem L1), dùng khi áp dụng đề xuất mức đọc.

### L6 — API đề xuất backend chưa có

Gọi qua `adaptiveService` và tự chuyển sang `adaptiveLocal`.

| Chức năng | Đường dẫn đề xuất | Màn hình |
|---|---|---|
| Danh sách đề xuất | `GET /children/{id}/recommendations` | [HomeWorkspace.tsx](../app/features/home/HomeWorkspace.tsx), [LearningHistory.tsx](../app/features/adaptive/LearningHistory.tsx) |
| Review / quyết định đề xuất | `POST /recommendations/{id}/reviews` | [RecommendationCard.tsx](../app/features/adaptive/RecommendationCard.tsx) |
| Lịch sử phiên bản hồ sơ học tập | `GET /children/{id}/learning-profile/versions` | [LearningHistory.tsx](../app/features/adaptive/LearningHistory.tsx) |

---

## AI API (nội bộ, port 5260)

Chỉ Core API gọi các API này, kèm `AI__InternalApiKey`. Frontend **không gắn và không nên gắn**.

| Controller | Endpoint | Phục vụ |
|---|---|---|
| StoryGeneration | `POST api/ai/story` | L2 |
| OutlineGeneration | `POST api/ai/outline` | L2 |
| StoryContentGeneration | `POST api/ai/story-content/content` · `content/refine` · `vocabulary` · `quiz` · `discussion` · `content/safety` | L2 |
| Evaluation | `POST api/ai/evaluate` | L2 |
| Refinement | `POST api/ai/refine` | L2 |
| CreatorAssistance | `POST api/ai/creator-assistance` | L5 |
| DevVertex | `POST api/dev/ai/vertex-test` (chỉ để thử) | — |
