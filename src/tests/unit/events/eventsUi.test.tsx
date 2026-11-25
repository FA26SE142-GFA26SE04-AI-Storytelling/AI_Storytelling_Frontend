import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/app/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, role: "User" } }),
}));

import CreateEventModal from "@/app/features/events/CreateEventModal";
import EventActivityParticipantView from "@/app/features/events/EventActivityParticipantView";
import EventActivityWizard, { normalizeAwardSources } from "@/app/features/events/EventActivityWizard";
import EventAwardsTable from "@/app/features/events/EventAwardsTable";
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
import EventsWorkspace from "@/app/features/events/EventsWorkspace";
import { notificationText } from "@/app/lib/notifications";
import { toVnEndIso, toVnStartIso } from "@/app/features/events/eventTime";
import { isNewEvent, SUBMISSION_STATUS_LABEL, type EventDetailDto, type EventMissionDashboardDto } from "@/app/types/event";

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

describe("Events UI components", () => {
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
      <EventHighlightBanner role="Parent" initialEvents={[SAMPLE_DETAIL]} onOpenEvents={() => {}} />,
    );
    expect(parentBanner).toContain("Tham gia cùng bé");
    expect(parentBanner).toContain("Lễ hội Truyện kể Mùa Thu");

    const creatorBanner = renderToStaticMarkup(
      <EventHighlightBanner role="ContentCreator" initialEvents={[SAMPLE_DETAIL]} onOpenEvents={() => {}} />,
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
      <EventHighlightBanner role="Parent" initialEvents={[recentEvent]} onOpenEvents={() => {}} />,
    );
    expect(bannerHtml).toContain('ev-new-badge">Mới<');

    const heroHtml = renderToStaticMarkup(<EventDetailHero detail={recentEvent} />);
    expect(heroHtml).toContain('ev-new-badge">Mới<');
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
      dashboard={{
        participation: { id: 13, eventId: 99, eventActivityId: 2, activityType: "ReadingMissions", trackType: "Parent",
          userId: 1, acceptedRuleVersionId: 1, status: "Registered" },
        completionMode: "AllMandatory", completedTasksCount: 0, earnedPoints: 0, allRequirementsMet: false,
        tasks: [], stories: [readingStory], votingStories: [votingStory],
      }} />);
    expect(votingHtml).toContain("Kho truyện đọc");
    expect(votingHtml).toContain("Truyện dự thi để bình chọn");
    expect(votingHtml).toContain("Truyện có sẵn");
    expect(votingHtml).toContain("Bài Creator đã duyệt");
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
    expect(renderParticipant(failedDetail)).toContain("Khiếu nại kết quả");
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
  });
});
