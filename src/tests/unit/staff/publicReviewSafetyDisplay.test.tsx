import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type * as B from '@/app/types/backendContracts';
import { SafetyScanSection, criterionEvidence } from '@/app/features/staff/PublicReviewEvidence';

const storyContent = 'Mở đầu. Cậu mang cháo lên bàn và thắp sáng ngọn đèn dầu nhỏ. Kết thúc.';

function makePkg(patch: Partial<B.PublicReviewPackageDto> = {}): B.PublicReviewPackageDto {
  return {
    itemId: 19,
    storyId: 44,
    storyVersionId: 100,
    versionNo: 4,
    isResubmission: false,
    createdByUserId: 13,
    createdByName: 'Le Thi Mai',
    submittedAt: '2026-11-10T06:46:54Z',
    proposedLabels: [],
    story: {
      title: 'Mái Nhà Ấm Áp Sau Cơn Mưa',
      description: null,
      genre: 'Gia đình',
      ageBand: '9-10',
      readingLevel: 1,
      vocabularyLevel: 'Cơ bản',
      language: 'vi',
      moralLesson: null,
      coverImageUrl: null,
      labels: [],
    },
    version: {
      title: 'Mái Nhà Ấm Áp Sau Cơn Mưa',
      outlineOpening: null,
      outlineDevelopment: null,
      outlineEnding: null,
      content: storyContent,
      lesson: null,
    },
    scenes: [],
    vocabulary: [],
    quizzes: [],
    listeningInteractions: [],
    discussionQuestions: [],
    flags: [],
    allFlagsResolved: true,
    progress: {
      totalScenes: 1,
      missingSceneIds: [],
      audioHeardCount: 1,
      missingWarningSegmentIds: [],
      needsAtLeastOneAudio: false,
      requiredViewsComplete: true,
    },
    checklist: {
      safety: null,
      ageFit: null,
      education: null,
      language: null,
      copyright: null,
      image: null,
      audio: null,
      interaction: null,
    },
    approveBlockers: [],
    canApprove: true,
    previousModeratorName: null,
    reviewHistory: [],
    ...patch,
  };
}

describe('Public review AI safety scan & evidence visibility', () => {
  it('shows Safe AI scan status explicitly instead of hiding the section when flags is empty', () => {
    const pkg = makePkg({
      safetyScan: {
        status: 'Safe',
        zone: 'Safe',
        riskScore: 0,
        phase: 'phase3',
        provider: 'Vertex',
        model: 'gemini-3.8-flash',
        advisoryFindings: [],
      },
    });

    expect(criterionEvidence(pkg, 'safety')).toContain('Đã quét AI: An toàn (Safe)');
    expect(criterionEvidence(pkg, 'safety')).toContain('0');

    const html = renderToStaticMarkup(
      <SafetyScanSection packageData={pkg} content={storyContent} busy={false} onResolveFlag={() => {}} />,
    );
    expect(html).toContain('Cờ cần xử lý');
    expect(html).toContain('Đã quét AI: An toàn (Safe)');
    expect(html).toContain('0/100');
    expect(html).toContain('gemini-3.8-flash');
    expect(html).toContain('AI không gắn cờ vùng xám nào');
  });

  it('shows low-risk Safe advisory findings with evidence quote and highlight without requiring flag resolution', () => {
    const pkg = makePkg({
      safetyScan: {
        status: 'Safe',
        zone: 'Safe',
        riskScore: 25,
        phase: 'phase1',
        provider: 'Vertex',
        model: 'gemini-3.8-flash',
        advisoryFindings: [
          {
            flagId: 'advisory:0',
            kind: 'paragraph',
            name: 'paragraph:5',
            criterionCode: 'GZ02',
            reason: 'Nhân vật tự thắp đèn dầu trong nhà.',
            evidenceQuote: 'Cậu mang cháo lên bàn và thắp sáng ngọn đèn dầu nhỏ.',
            contextNote: 'Bà nội đang ngồi ngay gần đó.',
            startOffset: 8,
            endOffset: 61,
            resolved: true,
            resolvedReason: null,
          },
        ],
      },
    });

    expect(criterionEvidence(pkg, 'safety')).toContain('1 lưu ý nhẹ');
    const html = renderToStaticMarkup(
      <SafetyScanSection packageData={pkg} content={storyContent} busy={false} onResolveFlag={() => {}} />,
    );
    expect(html).toContain('Đã quét AI: An toàn (Safe)');
    expect(html).toContain('25/100');
    expect(html).toContain('Đoạn 6');
    expect(html).toContain('Đoạn văn');
    expect(html).toContain('GZ02 · Hành vi nguy hiểm dễ bắt chước');
    expect(html).not.toContain('paragraph:5');
    expect(html).toContain('Nhân vật tự thắp đèn dầu trong nhà.');
    expect(html).toContain('Bà nội đang ngồi ngay gần đó.');
    expect(html).toContain('Đối chiếu trong bản nộp');
    expect(html).toContain('<mark');
    expect(html).not.toContain('<button');
  });

  it('distinguishes NotChecked stories clearly when AI assessment is missing', () => {
    const pkg = makePkg({
      safetyScan: {
        status: 'NotChecked',
        zone: null,
        riskScore: null,
        phase: null,
        provider: null,
        model: null,
        advisoryFindings: [],
      },
    });

    expect(criterionEvidence(pkg, 'safety')).toContain('Chưa có kết quả quét AI');
    const html = renderToStaticMarkup(
      <SafetyScanSection packageData={pkg} content={storyContent} busy={false} onResolveFlag={() => {}} />,
    );
    expect(html).toContain('Cờ cần xử lý');
    expect(html).toContain('Chưa có kết quả quét AI');
  });

  it('renders GrayZone blocking flags with evidence, highlight and resolve button', () => {
    const pkg = makePkg({
      allFlagsResolved: false,
      canApprove: false,
      flags: [
        {
          flagId: 'abc:0',
          kind: 'paragraph',
          name: 'paragraph:5',
          criterionCode: 'GZ02',
          reason: 'Cần kiểm tra ngữ cảnh dùng lửa.',
          evidenceQuote: 'Cậu mang cháo lên bàn và thắp sáng ngọn đèn dầu nhỏ.',
          contextNote: 'Bà nội ngồi gần đó.',
          startOffset: 8,
          endOffset: 61,
          resolved: false,
          resolvedReason: null,
        },
      ],
      safetyScan: {
        status: 'GrayZone',
        zone: 'GrayZone',
        riskScore: 55,
        phase: 'phase3',
        provider: 'Vertex',
        model: 'gemini-3.8-flash',
        advisoryFindings: [],
      },
    });

    const html = renderToStaticMarkup(
      <SafetyScanSection packageData={pkg} content={storyContent} busy={false} onResolveFlag={() => {}} />,
    );
    expect(html).toContain('Đã quét AI: Vùng xám (GrayZone)');
    expect(html).toContain('55/100');
    expect(html).toContain('Cần kiểm tra ngữ cảnh dùng lửa.');
    expect(html).toContain('Đối chiếu trong bản nộp');
    expect(html).toContain('<mark');
    expect(html).toContain('An toàn');
  });

  it('localizes raw backend section, artifact, kind, criterion and reason codes without leaking English evidence jargon', () => {
    const resolvedNames: string[] = [];
    const pkg = makePkg({
      allFlagsResolved: false,
      canApprove: false,
      flags: [
        {
          flagId: 'section:development',
          kind: 'section',
          name: 'development',
          criterionCode: null,
          reason: 'age_band_review',
          evidenceQuote: null,
          contextNote: null,
          startOffset: null,
          endOffset: null,
          resolved: false,
          resolvedReason: null,
        },
        {
          flagId: 'artifact:quiz',
          kind: 'artifact',
          name: 'quiz',
          criterionCode: 'GZ03',
          reason: 'Hard rule matched',
          evidenceQuote: null,
          contextNote: null,
          startOffset: null,
          endOffset: null,
          resolved: false,
          resolvedReason: null,
        },
      ],
    });

    const html = renderToStaticMarkup(
      <SafetyScanSection
        packageData={pkg}
        content={storyContent}
        busy={false}
        onResolveFlag={(_, name) => resolvedNames.push(name)}
      />,
    );
    expect(html).toContain('Diễn biến');
    expect(html).toContain('Phần nội dung');
    expect(html).toContain('Cần rà soát mức độ phù hợp với nhóm tuổi mục tiêu.');
    expect(html).toContain('Không có đoạn trích dẫn cụ thể cho cờ này.');
    expect(html).toContain('Câu hỏi trắc nghiệm');
    expect(html).toContain('Học liệu');
    expect(html).toContain('GZ03 · Phù hợp độ tuổi');
    expect(html).toContain('Khớp quy tắc chặn cứng của hệ thống');
    expect(html).not.toContain('>development<');
    expect(html).not.toContain('>section<');
    expect(html).not.toContain('age_band_review');
    expect(html).not.toContain('Hard rule matched');
    expect(html).not.toContain('đoạn trích evidence');
    expect(resolvedNames).toEqual([]);
  });
});
