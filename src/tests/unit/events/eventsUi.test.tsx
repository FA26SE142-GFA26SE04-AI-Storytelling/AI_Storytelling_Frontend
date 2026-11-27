import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/app/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, role: "User" } }),
}));

import CreateEventModal, { eventCategoryOptions } from "@/app/features/events/CreateEventModal";
import type { ContentCategory } from "@/app/types/childProfile";
import EventActivityParticipantView, { submittableStories } from "@/app/features/events/EventActivityParticipantView";
import EventActivityWizard, { buildVotingActivityPayload, normalizeAwardSources } from "@/app/features/events/EventActivityWizard";
import EventAwardsTable, { RevokeAwardDialog } from "@/app/features/events/EventAwardsTable";
import EventDetailInfoCard, { awardValueText } from "@/app/features/events/EventDetailInfoCard";
import EventRewardPlanField from "@/app/features/events/EventRewardPlanField";
import EventConfigurationSummary from "@/app/features/events/EventConfigurationSummary";
import EventTaskFilterEditor from "@/app/features/events/EventTaskFilterEditor";
import { readTaskFilterConfig, writeTaskFilterConfig } from "@/app/features/events/eventTaskFilterConfig";
import EventCreatorView from "@/app/features/events/EventCreatorView";
import EventHighlightBanner from "@/app/features/events/EventHighlightBanner";
import EventListView, { groupOf } from "@/app/features/events/EventListView";
import EventTaskBuilder from "@/app/features/events/EventTaskBuilder";
import EventMissionView from "@/app/features/events/EventMissionView";
import EventDetailHero from "@/app/features/events/EventDetailHero";
import EventModeratorPanel from "@/app/features/events/EventModeratorPanel";
import EventResultsView from "@/app/features/events/EventResultsView";
import EventsWorkspace from "@/app/features/events/EventsWorkspace";
import { notificationText } from "@/app/lib/notifications";
import { toVnEndIso, toVnStartIso } from "@/app/features/events/eventTime";
import { AWARD_STATUS_LABEL, isNewEvent, SUBMISSION_STATUS_LABEL, type EventDetailDto, type EventMissionDashboardDto } from "@/app/types/event";

const SAMPLE_DETAIL: EventDetailDto = {
  id: 1,
  title: "Lễ hội Truyện kể Mùa Thu",
  slug: "le-hoi-mua-thu",
  description: "Khuyến khích sáng tác và đọc truyện cùng con.",
  mainCategoryId: 1,
  targetAgeBands: "6-8,9-10",
  status: "Published",
  budgetVnd: 2_000_000,
  tracks: [],
  awards: [],
  eventStoriesCount: 4,
};

const activeBannerSchedule = () => ({
  opensAt: new Date(Date.now() - 86_400_000).toISOString(),
  closesAt: new Date(Date.now() + 86_400_000).toISOString(),
});

describe("Events UI components", () => {
  it("labels registrations, submissions and both return counts separately in staff reports", () => {
    const html = renderToStaticMarkup(
      <EventModeratorPanel
        detail={SAMPLE_DETAIL}
        isAdmin={false}
        appeals={[]}
        summary={{
          eventId: SAMPLE_DETAIL.id, status: "Published",
          creatorRegistrations: 5, creatorSubmissions: 8, publishedEventStories: 6,
          parentRegistrations: 11, parentVerifiedCount: 4,
          awardsProposedOrApproved: 3, awardsFulfilled: 1, approvedBudgetVnd: 0, fulfilledValueVnd: 0,
          retention7DayActiveUsers: 2, retention30DayActiveUsers: 9,
        }}
        onRefresh={() => {}}
      />,
    );

    expect(html).toContain("<dt>Lượt đăng ký sáng tác</dt><dd><strong>5</strong></dd>");
    expect(html).toContain("<dt>Bài dự thi của nhà sáng tạo</dt><dd><strong>8</strong></dd>");
    expect(html).toContain("<dt>Tài khoản quay lại trong 7 ngày đầu</dt><dd><strong>2</strong></dd>");
    expect(html).toContain("<dt>Tài khoản quay lại trong 30 ngày đầu</dt><dd><strong>9</strong></dd>");
  });

  it("only enables legacy family registration inside the registration window", () => {
    const start = toVnStartIso("2026-11-25");
    const end = toVnEndIso("2026-11-26");
    const detail: EventDetailDto = { ...SAMPLE_DETAIL, tracks: [{
      id: 2, trackType: "Parent", registrationStartAt: start, registrationEndAt: end,
      executionStartAt: start, executionEndAt: end, maxSubmissionsPerUser: 0,
      grantAiCredits: 0, grantSubmitCredits: 0, waiveWeeklyLibraryLimit: false, claimWindowHours: 72, maxReallocationRounds: 1,
    }] };
    const render = () => renderToStaticMarkup(
      <EventMissionView detail={detail} dashboard={null} myRewards={[]} onRefresh={() => {}} />,
    );
    const clock = vi.spyOn(Date, "now");
    try {
      clock.mockReturnValue(Date.parse(start) - 1);
      expect(render()).toContain("Đăng ký gia đình mở lúc");
      expect(render()).toContain('disabled=""');
      clock.mockReturnValue(Date.parse(start));
      expect(render()).not.toContain('disabled=""');
      clock.mockReturnValue(Date.parse(end) + 1);
      expect(render()).toContain("Đăng ký gia đình đã đóng lúc");
      expect(render()).toContain('disabled=""');
    } finally {
      clock.mockRestore();
    }
  });

  it("loads a saved filter as story and category choices without a JSON field", () => {
    const value = '{"StoryIds":[21],"categoryIds":[4],"minReadSeconds":60}';
    const html = renderToStaticMarkup(<EventTaskFilterEditor value={value} verifierType="ReadEventStories"
      onChange={() => {}} onOpen={() => {}} options={{
        stories: { success: true, data: [
          { id: 21, title: "Chiếc Đèn Lồng", source: "ModeratorSeed", canUseForReading: true, hasLearningContent: true },
          { id: 22, title: "Ngoài nguồn đọc", source: "CreatorSubmission", canUseForReading: false, hasLearningContent: true },
        ] },
        categories: { success: true, data: [{ id: 4, label: "Truyện gia đình" }] },
      }} />);
    expect(html).toContain("Chiếc Đèn Lồng");
    expect(html).toContain("Truyện gia đình");
    expect(html).toContain('value="60"');
    expect(html.match(/checked=""/g)).toHaveLength(2);
    expect(html).not.toContain("Ngoài nguồn đọc");
    expect(html).not.toContain("<textarea");

    expect(writeTaskFilterConfig({ ...readTaskFilterConfig(value), storyIds: undefined }))
      .toBe('{"categoryIds":[4],"minReadSeconds":60}');
    expect(writeTaskFilterConfig(readTaskFilterConfig('{"storyIds":[]}')!)).toBe('{"storyIds":[]}');
  });

  it("EventTaskBuilder renders arbitrary N > 5 dynamic tasks and completion modes", () => {
    const sixTasks = Array.from({ length: 6 }, (_, idx) => ({
      taskCode: `T0${idx + 1}`,
      title: `Nhiệm vụ động ${idx + 1}`,
      description: "",
      sortOrder: idx + 1,
      verifierType: "GuidedDiscussionCheckin" as const,
      targetValue: 1,
      isMandatory: idx < 4,
      points: 15,
      allowMultiplePerStory: false,
    }));

    const html = renderToStaticMarkup(
      <EventTaskBuilder
        rulesText="Thể lệ mẫu"
        completionMode="MinimumTasksCount"
        requiredTaskCount={4}
        requiredPoints={60}
        tasks={sixTasks}
        onRulesTextChange={() => {}}
        onCompletionModeChange={() => {}}
        onRequiredTaskCountChange={() => {}}
        onRequiredPointsChange={() => {}}
        onTasksChange={() => {}}
        onSave={() => {}}
      />,
    );

    expect(html).toContain("(6 nhiệm vụ)");
    expect(html).toContain("Nhiệm vụ động 6");
    expect(html).toContain("Số nhiệm vụ tối thiểu cần đạt");
  });

  it("EventMissionView renders N tasks progress, appeal action on VerificationFailed, and reward claim", () => {
    const dashboard: EventMissionDashboardDto = {
      participation: {
        id: 11,
        eventId: 1,
        trackId: 2,
        trackType: "Parent",
        userId: 5,
        acceptedRuleVersionId: 1,
        status: "VerificationFailed",
      },
      completionMode: "AllMandatory",
      completedTasksCount: 1,
      earnedPoints: 20,
      allRequirementsMet: false,
      tasks: [
        {
          taskDefinitionId: 1,
          taskCode: "T01",
          title: "Đọc 3 truyện sự kiện",
          description: "",
          verifierType: "ReadEventStories",
          targetValue: 3,
          currentValue: 3,
          isCompleted: true,
          isMandatory: true,
          points: 20,
        },
        {
          taskDefinitionId: 2,
          taskCode: "T02",
          title: "Thảo luận cùng bé",
          description: "",
          verifierType: "GuidedDiscussionCheckin",
          targetValue: 1,
          currentValue: 0,
          isCompleted: false,
          isMandatory: true,
          points: 10,
        },
      ],
        stories: [
          {
            storyId: 42,
            title: "Chú Rùa Bông",
            genre: "Cổ tích",
            ageBand: "6-8",
            description: "Câu chuyện ấm áp.",
          },
        ],
      };

    const missionAward = {
      id: 99,
      trackId: 2,
      rankOrTier: "Quà Gia đình",
      slotIndex: 1,
      rewardType: "PhysicalGift" as const,
      rewardName: "Bộ sách thiếu nhi",
      unitValueVnd: 150_000,
      creditGrantAmount: 0,
      status: "AwaitingClaim" as const,
    };
    const otherAward = { ...missionAward, id: 999, rewardName: "Giải sự kiện khác" };

    const html = renderToStaticMarkup(
      <EventMissionView
        detail={{ ...SAMPLE_DETAIL, awards: [missionAward] }}
        dashboard={dashboard}
        myRewards={[missionAward, otherAward]}
        onOpenStory={() => {}}
        onRefresh={() => {}}
      />,
    );

    expect(html).toContain("Nhiệm vụ &amp; Phần thưởng");
    expect(html).toContain("Khiếu nại kết quả");
    expect(html).toContain("[T01] Đọc 3 truyện sự kiện");
    expect(html).toContain("Xác nhận hoàn thành");
    expect(html).toContain("Nhận thưởng");
    expect(html).not.toContain("Giải sự kiện khác");
    expect(html).toContain("Đọc truyện");
  });

  it("offers only active categories outside the safety warning group as event topics", () => {
    const category = (id: number, group: ContentCategory["group"], isActive = true) =>
      ({ id, group, isActive, code: `C${id}`, displayName: `C${id}` }) as ContentCategory;
    const options = eventCategoryOptions([
      category(1, "Genre"), category(2, "Genre", false), category(7, "SafetyWarning"), category(9, "LifeValue"),
    ]);
    expect(options.map((c) => c.id)).toEqual([1, 9]);
  });

  it("hides the value of awards without money or credits", () => {
    expect(awardValueText({ unitValueVnd: 0, creditGrantAmount: 0 })).toBe("");
    expect(awardValueText({ unitValueVnd: 0, creditGrantAmount: 3 })).toBe("3 lượt AI / suất");
    expect(awardValueText({ unitValueVnd: 500000, creditGrantAmount: 0 })).toBe("500.000 đ / suất");
  });

  it("offers only stories that can still be submitted", () => {
    const submission = (storyId: number, status: string, lockedStoryVersionId: number | null = null) =>
      ({ id: storyId, eventId: 1, storyId, currentStoryVersionId: 1, status, lockedStoryVersionId });
    const stories = [1, 2, 3, 4, 5].map((id) => ({ id }));
    expect(submittableStories(stories, [
      submission(1, "PendingReview"), submission(2, "Approved"), submission(3, "ChangesRequested"), submission(4, "Rejected", 9),
    ])).toEqual([{ id: 3 }, { id: 5 }]);
  });

  it("shows the empty message without the wide table", () => {
    const html = renderToStaticMarkup(<EventListView events={[]} loading={false} onSelect={() => {}} />);
    expect(html).toContain("Chưa có sự kiện nào được công bố.");
    expect(html).not.toContain("<table");
  });

  it("EventModeratorPanel, EventCreatorView, CreateEventModal (Create & Edit) and events.css are complete", () => {
    expect(typeof EventsWorkspace).toBe("function");
    const modHtml = renderToStaticMarkup(
      <EventModeratorPanel
        detail={SAMPLE_DETAIL}
        isAdmin={false}
        appeals={[]}
        summary={null}
        onEditDraft={() => {}}
        onRefresh={() => {}}
      />,
    );
    expect(modHtml).toContain("Tiến trình vòng đời sự kiện");
    expect(modHtml).not.toContain("Bổ sung truyện sự kiện (Seed Stories)");
    expect(modHtml).toContain("Chấm điểm bài dự thi Creator");

    const missionOnlyHtml = renderToStaticMarkup(
      <EventModeratorPanel detail={{ ...SAMPLE_DETAIL, scoringMode: "MissionCompletion" }}
        isAdmin={false} appeals={[]} summary={null} onRefresh={() => {}} />,
    );
    expect(missionOnlyHtml).not.toContain("Chấm điểm bài dự thi Creator");
    expect(missionOnlyHtml).not.toContain("Quản lý phiếu bình chọn");

    const draftHtml = renderToStaticMarkup(
      <EventModeratorPanel
        detail={{ ...SAMPLE_DETAIL, status: "Draft" }}
        isAdmin={false}
        appeals={[]}
        summary={null}
        onEditDraft={() => {}}
        onRefresh={() => {}}
      />,
    );
    expect(draftHtml).toContain("Chỉnh sửa thông tin");
    expect(draftHtml).toMatch(/<button[^>]+disabled=""[^>]*>(?:(?!<\/button>)[\s\S])*Gửi Admin duyệt/);
    expect(draftHtml).toContain('href="#event-rules-1"');

    const createHtml = renderToStaticMarkup(<CreateEventModal open onClose={() => {}} onCreated={() => {}} />);
    expect(createHtml).toContain("Tạo sự kiện");
    expect(createHtml).toContain("Thông tin chung");
    expect(createHtml).toContain("Hoạt động");
    expect(createHtml).toContain("Giải thưởng");
    expect(createHtml).toContain("Xem lại");

    const editHtml = renderToStaticMarkup(
      <CreateEventModal open initialDetail={SAMPLE_DETAIL} onClose={() => {}} onCreated={() => {}} />,
    );
    expect(editHtml).toContain("Chỉnh sửa bản nháp sự kiện");
    expect(editHtml).toContain("Cho phép Creator tham gia");
    expect(editHtml).toContain("Cho phép Parent tham gia");
    expect(editHtml).toContain("Lễ hội Truyện kể Mùa Thu");

    const creatorUnregisteredHtml = renderToStaticMarkup(
      <EventCreatorView detail={SAMPLE_DETAIL} myRewards={[]} onRefresh={() => {}} />,
    );
    expect(creatorUnregisteredHtml).toContain("Đăng ký dự thi");
    expect(creatorUnregisteredHtml).not.toContain("Nộp truyện dự thi");

    const creatorAward = {
      id: 55,
      trackId: 1,
      rankOrTier: "Giải Nhất",
      slotIndex: 1,
      rewardType: "CashTransfer" as const,
      rewardName: "Giải Nhất Sáng tác",
      unitValueVnd: 500_000,
      creditGrantAmount: 0,
      status: "AwaitingClaim" as const,
    };
    const otherCreatorAward = { ...creatorAward, id: 555, rewardName: "GiảiCreatorSựKiệnKhác" };
    const creatorHtml = renderToStaticMarkup(
      <EventCreatorView
        detail={{ ...SAMPLE_DETAIL, awards: [creatorAward] }}
        initialParticipation={{
          id: 7,
          eventId: 1,
          trackId: 1,
          trackType: "Creator",
          userId: 9,
          acceptedRuleVersionId: 1,
          status: "Registered",
        }}
        myRewards={[creatorAward, otherCreatorAward]}
        onRefresh={() => {}}
      />,
    );
    expect(creatorHtml).toContain("Thông tin sự kiện");
    expect(creatorHtml).toContain("Nộp bài &amp; Mục tiêu thưởng");
    expect(creatorHtml).toContain("Trang nộp bài");
    expect(creatorHtml).toContain("Nộp truyện dự thi");
    expect(creatorHtml).toContain("Mục tiêu đạt phần thưởng Creator");
    expect(creatorHtml).toContain("Giải Nhất Sáng tác");
    expect(creatorHtml).not.toContain("GiảiCreatorSựKiệnKhác");

    const parentBanner = renderToStaticMarkup(
      <EventHighlightBanner role="Parent" initialEvents={[{ ...SAMPLE_DETAIL, ...activeBannerSchedule() }]} onOpenEvents={() => {}} />,
    );
    expect(parentBanner).toContain("Tham gia cùng bé");
    expect(parentBanner).toContain("Lễ hội Truyện kể Mùa Thu");

    const creatorBanner = renderToStaticMarkup(
      <EventHighlightBanner role="ContentCreator" initialEvents={[{ ...SAMPLE_DETAIL, ...activeBannerSchedule() }]} onOpenEvents={() => {}} />,
    );
    expect(creatorBanner).toContain("Gửi truyện dự thi");

    const listHtml = renderToStaticMarkup(
      <EventListView
        events={[SAMPLE_DETAIL]}
        loading={false}
        participations={[
          {
            id: 1,
            eventId: SAMPLE_DETAIL.id,
            trackId: 1,
            trackType: "Creator",
            userId: 9,
            acceptedRuleVersionId: 1,
            status: "Registered",
          },
        ]}
        onSelect={() => {}}
      />,
    );
    expect(listHtml).toContain("Đã tham gia (1)");
    expect(listHtml).toContain("Đã đăng ký");
    expect(modHtml).toContain("Xác minh kết quả");
    expect(modHtml).toContain("Đề xuất giải");
    expect(modHtml).toContain("Đóng sự kiện");

    const css = readFileSync(path.resolve(process.cwd(), "app/styles/features/events/events.css"), "utf8");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
  });

  it("only the lead sees publish while an assistant sees the assigned role and an admin can manage assignments", () => {
    const approved = { ...SAMPLE_DETAIL, status: "Approved" as const, canOperateEvent: true, leadModeratorId: 42 };
    const panel = (detail: EventDetailDto, isAdmin: boolean) => renderToStaticMarkup(
      <EventModeratorPanel detail={detail} isAdmin={isAdmin} appeals={[]} summary={null} onRefresh={() => {}} />,
    );
    expect(panel({ ...approved, canManageEvent: true }, false)).toContain("Phát hành sự kiện");
    const assistant = panel({ ...approved, canManageEvent: false }, false);
    expect(assistant).toContain("Moderator hỗ trợ");
    expect(assistant).not.toContain("Phát hành sự kiện");
    expect(panel({ ...approved, canManageEvent: false, canOperateEvent: false }, false)).toContain("chưa được phân công");
    expect(panel(approved, true)).toContain("Phân công Moderator");
  });

  it("displays 'Mới' badge for newly created/published events and hides it for old or closed events", () => {
    const now = Date.parse("2026-11-24T12:00:00Z");
    const freshDraft = { ...SAMPLE_DETAIL, id: 10, status: "Draft" as const, createdAt: "2026-11-24T11:30:00Z" };
    const freshPublished = { ...SAMPLE_DETAIL, id: 11, status: "Published" as const, createdAt: "2026-11-10T00:00:00Z", publishedAt: "2026-11-23T08:00:00Z" };
    const oldPublished = { ...SAMPLE_DETAIL, id: 12, status: "Published" as const, createdAt: "2026-11-01T00:00:00Z", publishedAt: "2026-11-02T00:00:00Z" };
    const closedRecent = { ...SAMPLE_DETAIL, id: 13, status: "Closed" as const, createdAt: "2026-11-24T10:00:00Z", publishedAt: "2026-11-24T10:00:00Z" };

    expect(isNewEvent(freshDraft, now)).toBe(true);
    expect(isNewEvent(freshPublished, now)).toBe(true);
    expect(isNewEvent(oldPublished, now)).toBe(false);
    expect(isNewEvent(closedRecent, now)).toBe(false);

    const recentIso = new Date().toISOString();
    const recentEvent = { ...SAMPLE_DETAIL, id: 20, title: "Sự kiện Mới Tạo", createdAt: recentIso, publishedAt: recentIso };
    const staleIso = new Date(Date.now() - 15 * 86_400_000).toISOString();
    const staleEvent = { ...SAMPLE_DETAIL, id: 21, title: "Sự kiện Cũ", createdAt: staleIso, publishedAt: staleIso };

    const listHtml = renderToStaticMarkup(
      <EventListView events={[recentEvent, staleEvent]} loading={false} onSelect={() => {}} />,
    );
    expect((listHtml.match(/ev-new-badge">Mới</g) ?? []).length).toBe(1);

    const bannerHtml = renderToStaticMarkup(
      <EventHighlightBanner role="Parent" initialEvents={[{ ...recentEvent, ...activeBannerSchedule() }]} onOpenEvents={() => {}} />,
    );
    expect(bannerHtml).toContain('ev-new-badge">Mới<');

    const heroHtml = renderToStaticMarkup(<EventDetailHero detail={recentEvent} />);
    expect(heroHtml).toContain('ev-new-badge">Mới<');
  });

  it("highlights the most recently published active event and hides the banner when none are active", () => {
    const schedule = activeBannerSchedule();
    const older = { ...SAMPLE_DETAIL, ...schedule, publishedAt: schedule.opensAt };
    const recent = {
      ...older, id: 2, title: "Sự kiện nổi bật", publishedAt: new Date().toISOString(),
      bannerUrl: "/event-cover.png",
    };
    const inactive: EventDetailDto[] = [
      { ...recent, id: 3, title: "Chưa bắt đầu", opensAt: schedule.closesAt },
      { ...recent, id: 4, title: "Đã quá hạn", closesAt: schedule.opensAt },
      { ...recent, id: 5, title: "Đã đóng", status: "Closed" },
      { ...recent, id: 6, title: "Chưa phát hành", status: "Draft" },
    ];
    const html = renderToStaticMarkup(
      <EventHighlightBanner role="Parent" initialEvents={[older, ...inactive, recent]} onOpenEvents={() => {}} />,
    );
    expect(html).toContain(recent.title);
    expect(html).toContain(recent.bannerUrl);
    expect(html).toContain("+1 sự kiện khác");
    expect(renderToStaticMarkup(
      <EventHighlightBanner role="Parent" initialEvents={inactive} onOpenEvents={() => {}} />,
    )).toBe("");
  });

  it("shows the catalog package and its non-editable benefits", () => {
    const html = renderToStaticMarkup(<EventRewardPlanField
      catalog={{ plans: [{ id: 1, name: "Creator Plus", aiCredits: 7, submitCredits: 3 }], error: "" }}
      name="Creator Plus"
      onChange={() => {}}
    />);
    expect(html).toContain("Creator Plus");
    expect(html).toContain("7 lượt AI · 3 lượt gửi duyệt mỗi suất");
    expect(html).not.toContain("<input");
  });

  it("supports Vietnam time boundaries and ActivityBased wizard, participant flow, and moderator summary/clone", () => {
    expect(toVnStartIso("2026-11-24")).toBe("2026-11-23T17:00:00.000Z");
    expect(toVnEndIso("2026-11-24")).toBe("2026-11-24T16:59:59.000Z");

    const wizardHtml = renderToStaticMarkup(
      <EventActivityWizard
        categories={[{ id: 1, code: "story", displayName: "Cổ tích", isActive: true }]}
        onClose={() => {}}
        onSaved={() => {}}
      />,
    );
    expect(wizardHtml).toContain("Thông tin chung");
    expect(wizardHtml).toContain("Hoạt động");
    expect(wizardHtml).toContain("Giải thưởng");
    expect(wizardHtml).toContain("Xem lại");
    expect(wizardHtml).toContain("Tiếp theo");
    expect(wizardHtml).not.toContain("Tạo bản nháp");

    const v2Detail: EventDetailDto = {
      ...SAMPLE_DETAIL,
      id: 99,
      configVersion: "ActivityBased",
      activities: [
        {
          id: 1,
          activityType: "Submission",
          allowedAudience: "Both",
          registrationStartAt: "2026-11-01T00:00:00Z",
          registrationEndAt: "2026-11-30T16:59:59Z",
          startAt: "2026-11-01T00:00:00Z",
          endAt: "2026-11-30T16:59:59Z",
          grantAiCredits: 2,
          maxSubmissionsPerUser: 3,
          waiveWeeklyLibraryLimit: false,
          minVotesPerSubmission: 1,
          claimWindowHours: 72,
          maxReallocationRounds: 1,
          awardAllMissionCompleters: false,
        },
        {
          id: 2,
          activityType: "ReadingMissions",
          allowedAudience: "Parent",
          registrationStartAt: "2026-12-01T00:00:00Z",
          registrationEndAt: "2026-12-10T16:59:59Z",
          startAt: "2026-12-01T00:00:00Z",
          endAt: "2026-12-10T16:59:59Z",
          grantAiCredits: 0,
          waiveWeeklyLibraryLimit: true,
          storySource: "Both",
          minVotesPerSubmission: 1,
          claimWindowHours: 72,
          maxReallocationRounds: 1,
          awardAllMissionCompleters: false,
        },
        {
          id: 3,
          activityType: "Voting",
          allowedAudience: "Parent",
          registrationStartAt: "2026-10-01T00:00:00Z",
          registrationEndAt: "2026-10-10T16:59:59Z",
          startAt: "2026-10-01T00:00:00Z",
          endAt: "2026-10-10T16:59:59Z",
          grantAiCredits: 0,
          waiveWeeklyLibraryLimit: false,
          minVotesPerSubmission: 1,
          claimWindowHours: 72,
          maxReallocationRounds: 1,
          awardAllMissionCompleters: false,
        },
      ],
      myActivityStates: [
        {
          activityId: 1,
          activityType: "Submission",
          allowedAudience: "Both",
          lifecycleStatus: "Open",
          isEligible: true,
          isRegistered: true,
          participationStatus: "Registered",
          canRegister: false,
          canSubmit: true,
          canVote: false,
          submissionsCount: 1,
          maxSubmissionsPerUser: 3,
        },
        {
          activityId: 2,
          activityType: "ReadingMissions",
          allowedAudience: "Parent",
          lifecycleStatus: "NotOpen",
          isEligible: true,
          isRegistered: false,
          canRegister: false,
          canSubmit: false,
          canVote: false,
          submissionsCount: 0,
        },
        {
          activityId: 3,
          activityType: "Voting",
          allowedAudience: "Parent",
          lifecycleStatus: "Ended",
          isEligible: true,
          isRegistered: false,
          canRegister: false,
          canSubmit: false,
          canVote: false,
          submissionsCount: 0,
        },
      ],
    };

    const participantHtml = renderToStaticMarkup(
      <EventActivityParticipantView detail={v2Detail} dashboard={null} myRewards={[]} onRefresh={() => {}} />,
    );
    expect(participantHtml).toContain("Hoạt động bạn đủ điều kiện tham gia (3)");
    expect(participantHtml).toContain("Đang mở");
    expect(participantHtml).toContain("Chưa mở");
    expect(participantHtml).toContain("Đã kết thúc");
    expect(participantHtml).toContain("Đã nộp 1 / 3 bài");
    expect(participantHtml).toContain("Bài của tôi (0)");
    expect(participantHtml).not.toContain("Khiếu nại kết quả");
    expect(participantHtml).toMatch(/<input[^>]+type="checkbox"(?![^>]*checked)[^>]*>/);

    const readingStory = { storyId: 21, title: "Truyện có sẵn", description: "", genre: "", ageBand: "6-8",
      source: "ModeratorSeed", hasFamilyRead: true };
    const votingStory = { ...readingStory, storyId: 22, title: "Bài Creator đã duyệt", source: "CreatorSubmission" };
    const readingAndVoting = {
      ...v2Detail,
      myActivityStates: v2Detail.myActivityStates?.map((state) => ({
        ...state, isRegistered: true, canVote: state.activityType === "Voting",
      })),
    };
    const votingHtml = renderToStaticMarkup(<EventActivityParticipantView detail={readingAndVoting} myRewards={[]} onRefresh={() => {}}
      onOpenStory={() => {}}
      dashboard={{
        participation: { id: 13, eventId: 99, eventActivityId: 2, activityType: "ReadingMissions", trackType: "Parent",
          userId: 1, acceptedRuleVersionId: 1, status: "Registered" },
        completionMode: "AllMandatory", completedTasksCount: 0, earnedPoints: 0, allRequirementsMet: false,
        tasks: [], stories: [readingStory], votingStories: [
          votingStory,
          { ...readingStory, source: "CreatorSubmission", hasFamilyRead: false },
        ],
      }} />);
    expect(votingHtml).toContain("Kho truyện đọc");
    expect(votingHtml).toContain("Truyện dự thi để bình chọn");
    expect(votingHtml).toContain("Truyện có sẵn");
    expect(votingHtml).toContain("Bài Creator đã duyệt");
    expect(votingHtml).toContain("Mở đọc");
    expect(votingHtml).toContain("Chưa có lượt đọc hợp lệ");
    expect(votingHtml).toContain("đúng phiên bản bài dự thi trong thời gian bình chọn");
    expect(votingHtml.match(/Gửi bình chọn/g)).toHaveLength(1);

    const failedDetail = {
      ...v2Detail,
      myActivityStates: v2Detail.myActivityStates?.map((state) => state.activityType === "Voting"
        ? { ...state, isRegistered: true, participationId: 41, participationStatus: "VerificationFailed" as const }
        : state),
    };
    const renderParticipant = (detail: EventDetailDto) => renderToStaticMarkup(
      <EventActivityParticipantView detail={detail} dashboard={null} myRewards={[]} onRefresh={() => {}} />,
    );
    // Khiếu nại sự kiện theo hoạt động chỉ gửi ở trang kết quả sau khi công bố, không còn nút trong danh sách hoạt động.
    expect(renderParticipant(failedDetail)).not.toContain("Khiếu nại kết quả");
    const withDeadline = (appealDeadlineAt: string) => ({
      ...failedDetail,
      myActivityStates: failedDetail.myActivityStates?.map((state) => ({ ...state, appealDeadlineAt })),
    });
    expect(renderParticipant(withDeadline(new Date(Date.now() - 60_000).toISOString())))
      .not.toContain("Khiếu nại kết quả");
    expect(renderParticipant(withDeadline(new Date(Date.now() + 60_000).toISOString())))
      .toContain("Hạn khiếu nại");
    expect(renderParticipant({ ...failedDetail, resultsFinalizedAt: "2026-12-11T00:00:00Z" }))
      .not.toContain("Khiếu nại kết quả");

    const v2ModHtml = renderToStaticMarkup(
      <EventModeratorPanel detail={v2Detail} isAdmin appeals={[]} summary={null} onRefresh={() => {}} />,
    );
    expect(v2ModHtml).toContain("Tóm tắt cấu hình hoạt động");
    expect(v2ModHtml).toContain("Thời gian ghi danh");
    expect(v2ModHtml).toContain("Thời gian nhận bài");
    expect(v2ModHtml).toContain("Thời gian đọc và làm nhiệm vụ");
    expect(v2ModHtml).toContain("Thời gian bình chọn");

    const prize = {
      id: 1, eventActivityId: 2, rankOrTier: "Giải Gia đình Năng xuất", slotIndex: 1,
      resultSource: "MissionCompletion", targetAudience: "Parent", rewardType: "PhysicalGift",
      rewardName: "Bộ sách", unitValueVnd: 0, creditGrantAmount: 0, status: "AwardProposed",
    } as const;
    const summaryHtml = renderToStaticMarkup(<EventConfigurationSummary detail={{
      ...v2Detail,
      awards: [prize, { ...prize, id: 2, slotIndex: 2 }, { ...prize, id: 3, status: "Expired" }],
    }} />);
    expect(summaryHtml.match(/Giải Gia đình Năng xuất/g)).toHaveLength(1);
    expect(summaryHtml).toContain("2 suất");

    const legacyDraftCloneHtml = renderToStaticMarkup(
      <EventModeratorPanel
        detail={{ ...SAMPLE_DETAIL, status: "Draft", configVersion: "LegacyRoleBased" }}
        isAdmin={false}
        appeals={[]}
        summary={null}
        onRefresh={() => {}}
      />,
    );
    expect(legacyDraftCloneHtml).toContain("Sao chép sang bản nháp theo hoạt động");
  });

  it("handles ReviewExpired label, EventAwardApproved notification, voting source gating, wizard source sync, award retry, and event list status", () => {
    expect(SUBMISSION_STATUS_LABEL.ReviewExpired).toBe("Quá hạn duyệt");
    expect(notificationText({
      id: 1,
      type: "EventAwardApproved",
      isRead: false,
      createdAt: "2026-11-25T00:00:00Z",
    })).toBe("Bạn đã trúng giải sự kiện");

    // Task 10: normalizeAwardSources aligns stale resultSource and targetAudience
    const normalized = normalizeAwardSources(
      [{
        rankOrTier: "Giải Nhất",
        rewardName: "Gói Creator",
        resultSource: "VotingAverage",
        targetAudience: "Creator",
        rewardType: "CreatorPackage",
      }],
      ["MissionCompletion"],
      "Both",
    );
    expect(normalized[0].resultSource).toBe("MissionCompletion");
    expect(normalized[0].targetAudience).toBe("Parent");

    // Task 11: EventAwardsTable keeps distinct sources separate and shows "Trao lại" on Failed
    const failedAward = {
      id: 11, eventActivityId: 2, resultSource: "VotingAverage" as const,
      rankOrTier: "Giải Nhất", slotIndex: 1, rewardType: "PhysicalGift" as const,
      rewardName: "Bộ sách", unitValueVnd: 100_000, creditGrantAmount: 0, status: "Failed" as const,
    };
    const subAward = {
      ...failedAward, id: 12, eventActivityId: 1, resultSource: "SubmissionScore" as const,
      status: "FulfillmentProcessing" as const,
    };
    const collapsedTable = renderToStaticMarkup(
      <EventAwardsTable awards={[failedAward, subAward]} expanded={false} busy={false} txCodes={{}} onCodeChange={() => {}} onFulfill={() => {}} />,
    );
    expect(collapsedTable.match(/Giải Nhất/g)).toHaveLength(2);
    const expandedTable = renderToStaticMarkup(
      <EventAwardsTable awards={[failedAward, subAward]} expanded busy={false} txCodes={{}} onCodeChange={() => {}} onFulfill={() => {}} />,
    );
    expect(expandedTable).toContain("Trao lại");
    expect(expandedTable).toContain("Xác nhận đã trao");

    // Task 11: groupOf ends past events even without closesAt, and EventListView shows multiple participations
    const endedSummary = {
      ...SAMPLE_DETAIL,
      id: 99,
      status: "Published" as const,
      opensAt: null,
      closesAt: null,
      activities: [{
        id: 1, activityType: "Submission" as const, allowedAudience: "Both" as const,
        registrationStartAt: "2020-01-01T00:00:00Z", registrationEndAt: "2020-01-02T00:00:00Z",
        startAt: "2020-01-01T00:00:00Z", endAt: "2020-01-05T00:00:00Z",
        grantAiCredits: 0, waiveWeeklyLibraryLimit: false, storySource: "Both" as const,
        minVotesPerSubmission: 1, claimWindowHours: 72, maxReallocationRounds: 1, awardAllMissionCompleters: false,
      }],
    };
    expect(groupOf(endedSummary, endedSummary)).toBe("ended");

    const listHtml = renderToStaticMarkup(
      <EventListView
        events={[SAMPLE_DETAIL]}
        loading={false}
        participations={[
          { id: 1, eventId: 1, trackType: "Parent", activityType: "Submission", userId: 5, acceptedRuleVersionId: 1, status: "Registered" },
          { id: 2, eventId: 1, trackType: "Parent", activityType: "ReadingMissions", userId: 5, acceptedRuleVersionId: 1, status: "Verified" },
        ]}
        onSelect={() => {}}
      />,
    );
    expect(listHtml).toContain("Đã đăng ký");
    expect(listHtml).toContain("Đã xác minh đạt");

    // Task 8: EventActivityParticipantView hides vote form for Library stories and shows for CreatorSubmission
    const participantVoteHtml = renderToStaticMarkup(
      <EventActivityParticipantView
        detail={{
          ...SAMPLE_DETAIL,
          configVersion: "ActivityBased",
          activities: [{
            id: 3, activityType: "Voting", allowedAudience: "Parent",
            registrationStartAt: "2026-11-01T00:00:00Z", registrationEndAt: "2026-11-30T00:00:00Z",
            startAt: "2026-11-01T00:00:00Z", endAt: "2026-11-30T00:00:00Z",
            grantAiCredits: 0, waiveWeeklyLibraryLimit: true, storySource: "ApprovedSubmissionsOnly",
            minVotesPerSubmission: 1, claimWindowHours: 72, maxReallocationRounds: 1, awardAllMissionCompleters: false,
          }],
          myActivityStates: [{
            activityId: 3, activityType: "Voting", allowedAudience: "Parent",
            lifecycleStatus: "Open", isEligible: true, isRegistered: true,
            canRegister: false, canSubmit: false, canDoMissions: false, canVote: true, submissionsCount: 0,
          }],
        }}
        dashboard={{
          participation: { id: 9, eventId: 1, trackType: "Parent", userId: 1, acceptedRuleVersionId: 1, status: "Registered" },
          completionMode: "AllMandatory",
          completedTasksCount: 0,
          earnedPoints: 0,
          allRequirementsMet: false,
          tasks: [],
          stories: [
            { storyId: 10, title: "Truyện thư viện", description: "", ageBand: "6-8", genre: "Cổ tích", source: "Library", hasFamilyRead: true },
            { storyId: 11, title: "Truyện dự thi", description: "", ageBand: "6-8", genre: "Cổ tích", source: "CreatorSubmission", hasFamilyRead: true },
          ],
        }}
        myRewards={[]}
        onRefresh={() => {}}
      />,
    );
    expect(participantVoteHtml.match(/Gửi bình chọn/g)).toHaveLength(1);
  });

  it("hiển thị chủ đề chính của sự kiện ở danh sách và trang chi tiết", () => {
    const withCategory: EventDetailDto = { ...SAMPLE_DETAIL, mainCategoryName: "Phiêu lưu" };
    const listHtml = renderToStaticMarkup(
      <EventListView events={[withCategory]} loading={false} participations={[]} onSelect={() => {}} />,
    );
    expect(listHtml).toContain("Phiêu lưu");

    const heroHtml = renderToStaticMarkup(<EventDetailHero detail={withCategory} />);
    expect(heroHtml).toContain("Chủ đề Phiêu lưu");

    const bannerHtml = renderToStaticMarkup(
      <EventHighlightBanner
        role="Parent"
        initialEvents={[{ ...withCategory, ...activeBannerSchedule() }]}
        onOpenEvents={() => {}}
      />,
    );
    expect(bannerHtml).toContain("ev-home-date-card");
    expect(bannerHtml).toContain("Phiêu lưu");
    expect(bannerHtml).toContain("Nhóm tuổi 6-8,9-10");
    expect(bannerHtml).toContain("Tham gia cùng bé");
    expect(bannerHtml).toContain("Tìm hiểu thêm");
    expect(bannerHtml).toContain("ev-home-popover");
  });

  it("hiển thị tối đa 3 sự kiện trên một hàng, chia lưới 3 + 1.5 + 1.5 ô khi có sự kiện mới và có popover xem nhanh", () => {
    const schedule = activeBannerSchedule();
    const recentIso = new Date().toISOString();
    const stale1 = new Date(Date.now() - 10 * 86_400_000).toISOString();
    const stale2 = new Date(Date.now() - 15 * 86_400_000).toISOString();
    const stale3 = new Date(Date.now() - 20 * 86_400_000).toISOString();
    const events: EventDetailDto[] = [
      { ...SAMPLE_DETAIL, ...schedule, id: 101, title: "Sự kiện Mới Nhất", mainCategoryName: "Phiêu lưu", publishedAt: recentIso, createdAt: recentIso, budgetVnd: 500_000 },
      { ...SAMPLE_DETAIL, ...schedule, id: 102, title: "Sự kiện Thứ Hai", mainCategoryName: "Cổ tích", publishedAt: stale1, createdAt: stale1, budgetVnd: 0 },
      { ...SAMPLE_DETAIL, ...schedule, id: 103, title: "Sự kiện Thứ Ba", mainCategoryName: "Khoa học", publishedAt: stale2, createdAt: stale2, budgetVnd: 200_000 },
      { ...SAMPLE_DETAIL, ...schedule, id: 104, title: "Sự kiện Thứ Tư Bị Ẩn", mainCategoryName: "Thiên nhiên", publishedAt: stale3, createdAt: stale3 },
    ];

    const withNewHtml = renderToStaticMarkup(
      <EventHighlightBanner role="Parent" initialEvents={events} onOpenEvents={() => {}} />,
    );
    expect(withNewHtml).toContain("Sự kiện Mới Nhất");
    expect(withNewHtml).toContain("Sự kiện Thứ Hai");
    expect(withNewHtml).toContain("Sự kiện Thứ Ba");
    expect(withNewHtml).not.toContain("Sự kiện Thứ Tư Bị Ẩn");
    expect(withNewHtml).toContain("+3 sự kiện khác");
    expect((withNewHtml.match(/ev-home-card--featured/g) ?? []).length).toBe(1);
    expect((withNewHtml.match(/ev-home-card--compact/g) ?? []).length).toBe(2);
    expect((withNewHtml.match(/ev-home-popover /g) ?? []).length).toBe(3);
    expect(withNewHtml).toContain("Ngân sách 500.000 đ");
    expect(withNewHtml).toContain("Thưởng quà &amp; Lượt AI");

    const withoutNewHtml = renderToStaticMarkup(
      <EventHighlightBanner role="Parent" initialEvents={events.slice(1)} onOpenEvents={() => {}} />,
    );
    expect((withoutNewHtml.match(/ev-home-card--equal/g) ?? []).length).toBe(3);
  });

  it("hiển thị danh sách tạm, cột Người nhận, chỉnh tay, nút Tính lại / Xác nhận và khoá Duyệt trao giải trước khi chốt", () => {
    const endedActivityEvent: EventDetailDto = {
      ...SAMPLE_DETAIL,
      id: 200,
      status: "Published",
      configVersion: "ActivityBased",
      canManageEvent: true,
      canOperateEvent: true,
      closesAt: "2026-11-01T16:59:59Z",
      appealWindowEndsAt: "2026-11-03T16:59:59Z",
      activities: [
        {
          id: 10,
          activityType: "Submission",
          allowedAudience: "Creator",
          registrationStartAt: "2026-10-01T00:00:00Z",
          registrationEndAt: "2026-10-15T16:59:59Z",
          startAt: "2026-10-01T00:00:00Z",
          endAt: "2026-11-01T16:59:59Z",
          reviewCutoffAt: "2026-11-01T16:59:59Z",
          grantAiCredits: 0,
          waiveWeeklyLibraryLimit: false,
          storySource: "Both",
          minVotesPerSubmission: 1,
          claimWindowHours: 72,
          maxReallocationRounds: 1,
          awardAllMissionCompleters: false,
        },
      ],
      awards: [
        {
          id: 301,
          eventActivityId: 10,
          resultSource: "SubmissionScore",
          targetAudience: "Creator",
          rankOrTier: "Giải Nhất",
          slotIndex: 1,
          rewardType: "PhysicalGift",
          rewardName: "Bộ sách đặc biệt",
          unitValueVnd: 500_000,
          creditGrantAmount: 0,
          participationId: 501,
          winnerName: "Nguyễn Minh Anh",
          winnerStoryTitle: "Hành trình nắng mai",
          isManualAssignment: true,
          manualAssignmentNote: "Điều chỉnh theo biên bản hội đồng.",
          status: "AwardProposed",
        },
      ],
    };

    const modProvisional = renderToStaticMarkup(
      <EventModeratorPanel detail={endedActivityEvent} isAdmin={false} appeals={[]} summary={null} onRefresh={() => {}} />,
    );
    expect(modProvisional).toContain("Tính lại danh sách");
    expect(modProvisional).toContain("Xác nhận danh sách");
    expect(modProvisional).toContain("Danh sách tạm · hạn khiếu nại đến");
    expect(modProvisional).toContain("Người nhận");
    expect(modProvisional).toContain("Nguyễn Minh Anh");
    expect(modProvisional).toContain("Hành trình nắng mai");
    expect(modProvisional).toContain("Chỉnh tay");
    expect(modProvisional).toContain("Điều chỉnh theo biên bản hội đồng.");
    expect(modProvisional).toContain(">Sửa</button>");

    const adminBeforeConfirm = renderToStaticMarkup(
      <EventModeratorPanel detail={endedActivityEvent} isAdmin appeals={[]} summary={null} onRefresh={() => {}} />,
    );
    expect(adminBeforeConfirm).toMatch(/<button[^>]+disabled=""[^>]*>(?:(?!<\/button>)[\s\S])*Duyệt trao giải/);
    expect(adminBeforeConfirm).toContain("Chờ Moderator phụ trách xác nhận danh sách nhận giải.");
    expect(adminBeforeConfirm).not.toContain(">Sửa</button>");

    const confirmedEvent: EventDetailDto = {
      ...endedActivityEvent,
      resultsFinalizedAt: "2026-11-04T00:00:00Z",
      appealWindowEndsAt: null,
    };
    const modConfirmed = renderToStaticMarkup(
      <EventModeratorPanel detail={confirmedEvent} isAdmin={false} appeals={[]} summary={null} onRefresh={() => {}} />,
    );
    expect(modConfirmed).toContain("Đã xác nhận, chờ Admin duyệt");
    expect(modConfirmed).not.toContain("Xác nhận danh sách");
    expect(modConfirmed).not.toContain(">Sửa</button>");
    expect(modConfirmed).toMatch(/<button[^>]+disabled=""[^>]*>(?:(?!<\/button>)[\s\S])*Tính lại danh sách/);

    const adminConfirmed = renderToStaticMarkup(
      <EventModeratorPanel detail={confirmedEvent} isAdmin appeals={[]} summary={null} onRefresh={() => {}} />,
    );
    expect(adminConfirmed).not.toMatch(/<button[^>]+disabled=""[^>]*>(?:(?!<\/button>)[\s\S])*Duyệt trao giải/);

    const approvedEvent: EventDetailDto = {
      ...confirmedEvent,
      awards: [{ ...endedActivityEvent.awards[0], status: "AwaitingClaim" }],
    };
    const approvedHtml = renderToStaticMarkup(
      <EventModeratorPanel detail={approvedEvent} isAdmin appeals={[]} summary={null} onRefresh={() => {}} />,
    );
    expect(approvedHtml).toContain("Đã duyệt trao giải");

    // Suất bỏ trống vẫn ở AwardProposed sau khi Admin duyệt: không được hiện lại "chờ Admin duyệt".
    const approvedWithEmptySlot: EventDetailDto = {
      ...confirmedEvent,
      awards: [
        { ...endedActivityEvent.awards[0], status: "AwaitingClaim" },
        { ...endedActivityEvent.awards[0], id: endedActivityEvent.awards[0].id + 1000, slotIndex: 2, participationId: null, status: "AwardProposed" },
      ],
    };
    const approvedEmptyHtml = renderToStaticMarkup(
      <EventModeratorPanel detail={approvedWithEmptySlot} isAdmin appeals={[]} summary={null} onRefresh={() => {}} />,
    );
    expect(approvedEmptyHtml).toContain("Đã duyệt trao giải");
    expect(approvedEmptyHtml).not.toContain("Đã xác nhận, chờ Admin duyệt");
  });

  it("hỗ trợ nhãn thông báo mới, trang kết quả sự kiện và màn Moderator giữ giải / thu hồi / loại khiếu nại", () => {
    // Task 6: labels & notificationText
    expect(AWARD_STATUS_LABEL.AppealHold).toBe("Chờ hết hạn khiếu nại");
    expect(AWARD_STATUS_LABEL.Revoked).toBe("Đã thu hồi");
    const revokedText = notificationText({
      id: 1, type: "EventAwardRevoked", status: "Unread", readAt: null, createdAt: "2026-11-26T00:00:00Z",
      payload: JSON.stringify({ eventTitle: "Test 2", reason: "Sai điểm" }),
    });
    expect(revokedText).toContain("Test 2");
    expect(revokedText).toContain("Sai điểm");
    expect(notificationText({
      id: 2, type: "EventEnded", status: "Unread", readAt: null, createdAt: "2026-11-26T00:00:00Z",
      payload: JSON.stringify({ eventTitle: "Lễ hội Thu" }),
    })).toContain("Lễ hội Thu");

    // Task 8: EventResultsView — before publication, AppealHold winner, non-winner with canAppeal, public results
    const pendingHtml = renderToStaticMarkup(
      <EventResultsView
        detail={{ ...SAMPLE_DETAIL, configVersion: "ActivityBased", resultsPublishedAt: null }}
        myResult={{
          eventId: 1, eventTitle: "Lễ hội", canAppeal: false,
          recap: { storiesRead: 3, submissions: 0, votes: 1, tasksCompleted: 2, tasksTotal: 2 },
          activities: [], awards: [],
        }}
        publicResults={null}
        onRefresh={() => {}}
      />,
    );
    expect(pendingHtml).toContain("Ban tổ chức đang xét kết quả");
    expect(pendingHtml).toContain("<strong>3</strong>");

    const winnerHoldHtml = renderToStaticMarkup(
      <EventResultsView
        detail={{ ...SAMPLE_DETAIL, configVersion: "ActivityBased", resultsPublishedAt: "2026-11-25T00:00:00Z" }}
        myResult={{
          eventId: 1, eventTitle: "Lễ hội", resultsPublishedAt: "2026-11-25T00:00:00Z",
          appealDeadlineAt: "2026-11-27T00:00:00Z", canAppeal: false,
          recap: { storiesRead: 1, submissions: 1, votes: 0, tasksCompleted: 0, tasksTotal: 0 },
          activities: [],
          awards: [{
            awardId: 10, rankOrTier: "Giải Nhất", slotIndex: 1, rewardName: "Cúp", rewardType: "PhysicalGift",
            creditGrantAmount: 0, submitCreditGrantAmount: 0, unitValueVnd: 0, status: "AppealHold",
            claimOpensAt: "2026-11-27T00:00:00Z", asksChildNameConsent: false,
          }],
        }}
        publicResults={{
          eventId: 1, eventTitle: "Lễ hội", resultsPublishedAt: "2026-11-25T00:00:00Z",
          participantCount: 10, storyCount: 4,
          awards: [
            { rankOrTier: "Giải Nhất", slotIndex: 1, rewardName: "Cúp", resultSource: "SubmissionScore", storyTitle: "Hành trình gió", winnerName: "Tác giả Hoa", childNicknames: [], childCount: 0 },
            { rankOrTier: "Hoàn thành", slotIndex: 1, rewardName: "Lượt AI", resultSource: "MissionCompletion", winnerName: "Mẹ Lan", childNicknames: [], childCount: 2 },
          ],
        }}
        onRefresh={() => {}}
      />,
    );
    expect(winnerHoldHtml).toContain("Chờ hết hạn khiếu nại");
    expect(winnerHoldHtml).not.toContain(">Nhận thưởng</button>");
    expect(winnerHoldHtml).not.toContain(">Khiếu nại</button>");
    expect(winnerHoldHtml).toContain("Hành trình gió");
    expect(winnerHoldHtml).toContain("Tác giả Hoa");
    expect(winnerHoldHtml).toContain("cùng 2 bé");

    const nonWinnerHtml = renderToStaticMarkup(
      <EventResultsView
        detail={{ ...SAMPLE_DETAIL, configVersion: "ActivityBased", resultsPublishedAt: "2026-11-25T00:00:00Z" }}
        myResult={{
          eventId: 1, eventTitle: "Lễ hội", resultsPublishedAt: "2026-11-25T00:00:00Z",
          appealDeadlineAt: "2026-11-27T00:00:00Z", canAppeal: true,
          recap: { storiesRead: 0, submissions: 0, votes: 0, tasksCompleted: 0, tasksTotal: 0 },
          activities: [{ activityType: "ReadingMissions", status: "VerificationFailed", reason: "Chưa xong nhiệm vụ: T02" }],
          awards: [],
        }}
        publicResults={null}
        onRefresh={() => {}}
      />,
    );
    expect(nonWinnerHtml).toContain("Khiếu nại");
    expect(nonWinnerHtml).toContain("Chưa xong nhiệm vụ: T02");

    // Task 9: Moderator panel — AppealHold with Thu hồi, Revoked with reason, Ranking appeal kind & label, Đã công bố status bar
    const publishedDetail: EventDetailDto = {
      ...SAMPLE_DETAIL,
      id: 300,
      status: "Published",
      configVersion: "ActivityBased",
      canManageEvent: true,
      canOperateEvent: true,
      closesAt: "2026-11-20T16:59:59Z",
      resultsFinalizedAt: "2026-11-21T00:00:00Z",
      resultsPublishedAt: "2026-11-26T00:00:00Z",
      appealWindowEndsAt: new Date(Date.now() + 24 * 3_600_000).toISOString(),
      activities: [{
        id: 10, activityType: "Submission", allowedAudience: "Creator",
        registrationStartAt: "2026-11-01T00:00:00Z", registrationEndAt: "2026-11-10T00:00:00Z",
        startAt: "2026-11-01T00:00:00Z", endAt: "2026-11-20T00:00:00Z", reviewCutoffAt: "2026-11-20T00:00:00Z",
        grantAiCredits: 0, waiveWeeklyLibraryLimit: false, storySource: "Both", minVotesPerSubmission: 1,
        claimWindowHours: 72, maxReallocationRounds: 1, awardAllMissionCompleters: false,
      }],
      awards: [
        {
          id: 401, eventActivityId: 10, resultSource: "SubmissionScore", targetAudience: "Creator",
          rankOrTier: "Giải Nhất", slotIndex: 1, rewardType: "PhysicalGift", rewardName: "Cúp",
          unitValueVnd: 0, creditGrantAmount: 0, participationId: 1, winnerName: "Tác giả A",
          status: "AppealHold",
        },
        {
          id: 402, eventActivityId: 10, resultSource: "SubmissionScore", targetAudience: "Creator",
          rankOrTier: "Giải Nhì", slotIndex: 1, rewardType: "PhysicalGift", rewardName: "Sách",
          unitValueVnd: 0, creditGrantAmount: 0, participationId: 2, winnerName: "Tác giả B",
          status: "Revoked", revokedReason: "Vi phạm quy chế",
        },
      ],
    };
    const modPublished = renderToStaticMarkup(
      <EventModeratorPanel
        detail={publishedDetail}
        isAdmin={false}
        appeals={[{
          id: 1, eventId: 300, participationId: 9, appellantUserId: 99,
          reasonText: "Đề nghị chấm lại", kind: "Ranking", targetAwardId: 401, targetAwardLabel: "Giải Nhất · Suất #1",
          status: "Open", createdAt: "2026-11-26T01:00:00Z",
        }]}
        summary={null}
        onRefresh={() => {}}
      />,
    );
    expect(modPublished).toContain("Đã công bố · hạn khiếu nại đến");
    expect(modPublished).toContain(">Thu hồi</button>");
    expect(modPublished).toContain("Đã thu hồi");
    expect(modPublished).toContain("Vi phạm quy chế");
    expect(modPublished).toContain("Thứ hạng / người nhận giải");
    expect(modPublished).toContain("Giải Nhất · Suất #1");

    // Thu hồi kèm đơn khiếu nại: đơn nhắm đúng suất được chọn sẵn để chấp nhận cùng lúc (dùng được cả sau hạn).
    const revokeHtml = renderToStaticMarkup(
      <RevokeAwardDialog
        award={publishedDetail.awards![0]}
        openAppeals={[{
          id: 7, eventId: 300, participationId: 9, appellantUserId: 99,
          reasonText: "Đề nghị chấm lại", kind: "Ranking", targetAwardId: 401, targetAwardLabel: "Giải Nhất · Suất #1",
          status: "Open", createdAt: "2026-11-26T01:00:00Z",
        }]}
        onClose={() => {}}
        onSaved={() => {}}
      />,
    );
    expect(revokeHtml).toContain("Chấp nhận đơn khiếu nại cùng lúc");
    expect(revokeHtml).toMatch(/<option value="7" selected="">Đơn #7 · Giải Nhất · Suất #1<\/option>/);

    const popupCss = readFileSync(path.resolve(process.cwd(), "app/styles/features/events/event-popup.css"), "utf8");
    expect(popupCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(popupCss).not.toMatch(/rgba?\(/);
  });

  it("bình chọn không cần đăng ký: ẩn nút đăng ký, hiện truyện bình chọn, khoá nút tới khi đồng ý thể lệ và ẩn lịch đăng ký Voting", () => {
    const votingOnlyDetail: EventDetailDto = {
      ...SAMPLE_DETAIL,
      id: 201,
      configVersion: "ActivityBased",
      activities: [
        {
          id: 30,
          activityType: "Voting",
          allowedAudience: "Parent",
          registrationStartAt: "2026-11-20T00:00:00Z",
          registrationEndAt: "2026-11-30T16:59:59Z",
          startAt: "2026-11-20T00:00:00Z",
          endAt: "2026-11-30T16:59:59Z",
          grantAiCredits: 0,
          waiveWeeklyLibraryLimit: true,
          minVotesPerSubmission: 3,
          claimWindowHours: 72,
          maxReallocationRounds: 1,
          awardAllMissionCompleters: false,
        },
      ],
      myActivityStates: [
        {
          activityId: 30,
          activityType: "Voting",
          allowedAudience: "Parent",
          lifecycleStatus: "Open",
          isEligible: true,
          isRegistered: false,
          canRegister: false,
          canSubmit: false,
          canVote: true,
          submissionsCount: 0,
        },
      ],
    };

    const story = {
      storyId: 501,
      title: "Truyện Dự Thi Hay Nhất",
      description: "",
      genre: "Cổ tích",
      ageBand: "6-8",
      source: "CreatorSubmission",
      hasFamilyRead: true,
    };

    // 1. Chưa tham gia + canVote = true + dashboard = null: hiện truyện, không cần đồng ý thể lệ, nút gửi bấm được ngay.
    const unregisteredHtml = renderToStaticMarkup(
      <EventActivityParticipantView
        detail={votingOnlyDetail}
        dashboard={null}
        votingStories={[story]}
        myRewards={[]}
        onRefresh={() => {}}
      />,
    );
    expect(unregisteredHtml).not.toContain("Chấp nhận thể lệ &amp; Đăng ký");
    expect(unregisteredHtml).toContain("Không cần đăng ký · Mở khi đến giờ bình chọn");
    expect(unregisteredHtml).not.toContain("Đăng ký:");
    expect(unregisteredHtml).toContain("Truyện dự thi để bình chọn");
    expect(unregisteredHtml).toContain("Truyện Dự Thi Hay Nhất");
    expect(unregisteredHtml).not.toContain("Tôi đã đọc và đồng ý thể lệ sự kiện");
    expect(unregisteredHtml).not.toMatch(/<button[^>]*disabled=""[^>]*>Gửi bình chọn<\/button>/);
    expect(unregisteredHtml).toContain(">Gửi bình chọn</button>");

    // 2. Guard dashboard === null ngay cả khi readState.isRegistered = true (không throw TypeError đọc dashboard.stories).
    const readRegisteredNoDashDetail: EventDetailDto = {
      ...votingOnlyDetail,
      myActivityStates: [
        {
          activityId: 29,
          activityType: "ReadingMissions",
          allowedAudience: "Parent",
          lifecycleStatus: "Open",
          isEligible: true,
          isRegistered: true,
          canRegister: false,
          canSubmit: false,
          canVote: false,
          submissionsCount: 0,
        },
        ...votingOnlyDetail.myActivityStates!,
      ],
    };
    const safeHtml = renderToStaticMarkup(
      <EventActivityParticipantView
        detail={readRegisteredNoDashDetail}
        dashboard={null}
        votingStories={[story]}
        myRewards={[]}
        onRefresh={() => {}}
      />,
    );
    expect(safeHtml).not.toContain("Kho truyện đọc");
    expect(safeHtml).toContain("Truyện dự thi để bình chọn");

    // 3. Đã tham gia (isRegistered: true): nút gửi không bị disabled.
    const registeredDetail: EventDetailDto = {
      ...votingOnlyDetail,
      myActivityStates: votingOnlyDetail.myActivityStates!.map((s) => ({ ...s, isRegistered: true })),
    };
    const registeredHtml = renderToStaticMarkup(
      <EventActivityParticipantView
        detail={registeredDetail}
        dashboard={null}
        votingStories={[story]}
        myRewards={[]}
        onRefresh={() => {}}
      />,
    );
    expect(registeredHtml).not.toContain("Tôi đã đọc và đồng ý thể lệ sự kiện");
    expect(registeredHtml).not.toMatch(/<button[^>]*disabled=""[^>]*>Gửi bình chọn<\/button>/);
    expect(registeredHtml).toContain(">Gửi bình chọn</button>");

    // 4. Không thể bình chọn (canVote: false): ẩn nút bình chọn, vẫn hiện danh sách truyện.
    const closedVoteDetail: EventDetailDto = {
      ...votingOnlyDetail,
      myActivityStates: votingOnlyDetail.myActivityStates!.map((s) => ({ ...s, canVote: false, lifecycleStatus: "Ended" as const })),
    };
    const closedHtml = renderToStaticMarkup(
      <EventActivityParticipantView
        detail={closedVoteDetail}
        dashboard={null}
        votingStories={[story]}
        myRewards={[]}
        onRefresh={() => {}}
      />,
    );
    expect(closedHtml).not.toContain("Tôi đã đọc và đồng ý thể lệ sự kiện");
    expect(closedHtml).not.toContain("Gửi bình chọn");
    expect(closedHtml).toContain("Truyện Dự Thi Hay Nhất");

    // 5. Ẩn lịch đăng ký / ghi danh của Voting ở EventDetailInfoCard và EventConfigurationSummary.
    const infoHtml = renderToStaticMarkup(<EventDetailInfoCard detail={votingOnlyDetail} />);
    expect(infoHtml).toContain("Không cần đăng ký · Bình chọn");
    expect(infoHtml).not.toContain("Đăng ký 20/11/2026");

    const summaryHtml = renderToStaticMarkup(<EventConfigurationSummary detail={votingOnlyDetail} />);
    expect(summaryHtml).not.toContain("Thời gian ghi danh");
    expect(summaryHtml).toContain("Không cần đăng ký trước");
  });

  it("wizard bình chọn không có ô đăng ký và gửi lịch đăng ký bằng khung bình chọn", () => {
    const step2Html = renderToStaticMarkup(
      <EventActivityWizard
        categories={[{ id: 1, code: "story", displayName: "Cổ tích", isActive: true }]}
        initialStep={1}
        onClose={() => {}}
        onSaved={() => {}}
      />,
    );
    const votingSection = step2Html.slice(step2Html.indexOf("3. Bình chọn"));
    expect(votingSection).not.toContain("Mở đăng ký (VN)");
    expect(votingSection).not.toContain("Đóng đăng ký (VN)");
    expect(votingSection).toContain("Mở bình chọn (sau hạn duyệt bài)");
    expect(votingSection).toContain("Đóng bình chọn (VN)");

    const votingPayload = buildVotingActivityPayload("2026-12-01", "2026-12-05", "3");
    expect(votingPayload.registrationStartAt).toBe(votingPayload.startAt);
    expect(votingPayload.registrationEndAt).toBe(votingPayload.endAt);
    expect(votingPayload.maxRegistrations).toBeNull();
    expect(votingPayload.minVotesPerSubmission).toBe(3);
  });
});
