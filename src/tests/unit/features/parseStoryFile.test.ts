import { expect, it } from 'vitest';
import { parseStoryFile, STORY_FILE_TEMPLATE } from '@/app/features/authoring/parseStoryFile';

it('tệp mẫu chưa điền thì không đưa gì vào các ô', () => {
  expect(parseStoryFile(STORY_FILE_TEMPLATE)).toEqual({ title: '', sourceDeclaration: '', rightsDeclaration: '' });
});

it('tệp mẫu đã điền thì tách đủ', () => {
  expect(parseStoryFile(STORY_FILE_TEMPLATE.replace('Tên truyện: ', 'Tên truyện: A').replace('Nội dung:\n', 'Nội dung:\nXin chào'))).toMatchObject({ title: 'A', content: 'Xin chào' });
});

it('tách đủ bốn ô từ tệp có nhãn', () => {
  const r = parseStoryFile('Tên truyện: Chú ếch dũng cảm\r\nNguồn nội dung: Tự sáng tác\nCam kết quyền sử dụng: Tôi có quyền\nNội dung:\nNgày xửa ngày xưa.\n\nHết.');
  expect(r).toEqual({ title: 'Chú ếch dũng cảm', sourceDeclaration: 'Tự sáng tác', rightsDeclaration: 'Tôi có quyền', content: 'Ngày xửa ngày xưa.\n\nHết.' });
});

it('nhận nhãn không dấu, viết hoa và nội dung viết liền sau nhãn', () => {
  const r = parseStoryFile('TIEU DE: A\nnoi dung: Một hai ba\nbốn năm');
  expect(r).toEqual({ title: 'A', content: 'Một hai ba\nbốn năm' });
});

it('thiếu một số nhãn thì chỉ điền ô có nhãn', () => {
  expect(parseStoryFile('Nguồn: Sách cũ\nNgày xửa ngày xưa.')).toEqual({ sourceDeclaration: 'Sách cũ', content: 'Ngày xửa ngày xưa.' });
});

it('tệp không có nhãn thì toàn bộ là nội dung', () => {
  expect(parseStoryFile('Ngày xưa: có một chú ếch.\nChú đi chơi.')).toEqual({ content: 'Ngày xưa: có một chú ếch.\nChú đi chơi.' });
});

it('dòng giống nhãn nằm trong truyện không bị tách nhầm', () => {
  const r = parseStoryFile('Tên truyện: A\nNội dung: Mở đầu\nNguồn: không phải nhãn vì đã ở trong nội dung');
  expect(r.sourceDeclaration).toBeUndefined();
  expect(r.content).toContain('Nguồn: không phải nhãn');
});
