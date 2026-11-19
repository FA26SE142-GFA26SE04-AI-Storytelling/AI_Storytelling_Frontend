import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import StoryFields from '@/app/features/authoring/StoryFields';
import ParentImportPreview, {
  buildParentImportConfirmPayload,
  type ParentImportPending,
} from '@/app/features/authoring/ParentImportPreview';

function makePending(content: string): ParentImportPending {
  return {
    preview: {
      previewToken: 'prev-tok-9',
      content,
      fileName: 'truyen-cua-be.txt',
    },
    revisionToken: 'rev-tok-42',
    baseVersionId: 7,
    fallbackTitle: 'Truyện dự phòng',
  };
}

describe('Hide Parent source and rights declarations', () => {
  it('hides declaration inputs and empty pa-fields row when StoryFields uses Parent presentation (showDeclarations=false)', () => {
    const html = renderToStaticMarkup(
      <StoryFields
        form={{
          title: 'Ếch con qua suối',
          content: 'Sáng sớm ếch con ra bờ suối.',
          sourceDeclaration: 'Tài liệu cũ',
          rightsDeclaration: 'Quyền cũ',
        }}
        onChange={vi.fn()}
        onSelect={vi.fn()}
        showDeclarations={false}
        rightsLabel="Cam kết quyền sử dụng"
      />,
    );

    expect(html).toContain('Tên truyện');
    expect(html).toContain('Ếch con qua suối');
    expect(html).toContain('Sáng sớm ếch con ra bờ suối.');
    expect(html).not.toContain('pa-fields');
    expect(html).not.toContain('Nguồn nội dung');
    expect(html).not.toContain('Cam kết quyền sử dụng');
    expect(html).not.toContain('Cam kết bản quyền');
  });

  it('keeps declaration inputs visible in default Creator presentation', () => {
    const html = renderToStaticMarkup(
      <StoryFields
        form={{
          title: 'Ếch con đi học',
          content: 'Ếch con cắp sách tới trường.',
          sourceDeclaration: 'Tự sáng tác',
          rightsDeclaration: 'Tôi có quyền phát hành',
        }}
        onChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(html).toContain('Tên truyện');
    expect(html).toContain('pa-fields');
    expect(html).toContain('Nguồn nội dung');
    expect(html).toContain('Cam kết bản quyền');
    expect(html).toContain('Tự sáng tác');
    expect(html).toContain('Tôi có quyền phát hành');
  });

  it('allows ParentImportPreview confirm when body is valid and declarations are empty, without rendering declaration inputs', () => {
    const html = renderToStaticMarkup(
      <ParentImportPreview
        storyId={10}
        pending={makePending('Tên truyện: Chú ếch nhỏ\nNội dung:\nNgày xửa ngày xưa.')}
        defaults={{ title: '', sourceDeclaration: '', rightsDeclaration: '' }}
        onFill={vi.fn()}
        onSaved={vi.fn()}
        onConflict={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(html).toContain('Tên truyện');
    expect(html).toContain('Chú ếch nhỏ');
    expect(html).toContain('Ngày xửa ngày xưa.');
    expect(html).not.toContain('Nguồn nội dung');
    expect(html).not.toContain('Cam kết quyền sử dụng');
    expect(html).toContain('title="Lưu nội dung này thành phiên bản mới"');
    expect(html).not.toContain('Điền nguồn nội dung và cam kết quyền sử dụng');
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>.*Xác nhận nhập/);
  });

  it('disables ParentImportPreview confirm when story body is empty', () => {
    const html = renderToStaticMarkup(
      <ParentImportPreview
        storyId={10}
        pending={makePending('Tên truyện: Chỉ có tiêu đề\nNội dung:\n')}
        defaults={{ title: '', sourceDeclaration: '', rightsDeclaration: '' }}
        onFill={vi.fn()}
        onSaved={vi.fn()}
        onConflict={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(html).toContain('title="Chưa có nội dung truyện để nhập"');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*title="Chưa có nội dung truyện để nhập"/);
  });

  it('retains revision/preview tokens and preserves empty or existing metadata in import confirm payload', () => {
    const pending = makePending('Nội dung truyện');
    const emptyPayload = buildParentImportConfirmPayload(
      pending,
      pending.preview,
      { title: '  Ếch con  ', sourceDeclaration: '', rightsDeclaration: '' },
      'op-1',
    );
    expect(emptyPayload).toEqual({
      operationId: 'op-1',
      revisionToken: 'rev-tok-42',
      baseVersionId: 7,
      previewToken: 'prev-tok-9',
      content: 'Nội dung truyện',
      title: 'Ếch con',
      sourceDeclaration: '',
      rightsDeclaration: '',
    });

    const preservedPayload = buildParentImportConfirmPayload(
      pending,
      pending.preview,
      {
        title: 'Ếch con',
        sourceDeclaration: '  Sách gia đình  ',
        rightsDeclaration: '  Đã xác nhận trước  ',
      },
      'op-2',
    );
    expect(preservedPayload.sourceDeclaration).toBe('Sách gia đình');
    expect(preservedPayload.rightsDeclaration).toBe('Đã xác nhận trước');
    expect(preservedPayload.revisionToken).toBe('rev-tok-42');
    expect(preservedPayload.baseVersionId).toBe(7);
    expect(preservedPayload.previewToken).toBe('prev-tok-9');
  });
});
