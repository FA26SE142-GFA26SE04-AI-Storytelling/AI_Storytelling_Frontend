export interface StoryFileFields { title?: string; content?: string; sourceDeclaration?: string; rightsDeclaration?: string }

type Key = keyof StoryFileFields;
/** Nhãn được nhận (không phân biệt hoa thường, bỏ dấu) → ô tương ứng trên biểu mẫu. */
const LABELS: Record<string, Key> = {
  'ten truyen': 'title', 'tieu de': 'title',
  'noi dung': 'content', 'truyen': 'content',
  'nguon noi dung': 'sourceDeclaration', 'nguon': 'sourceDeclaration',
  'cam ket quyen su dung': 'rightsDeclaration', 'cam ket ban quyen': 'rightsDeclaration', 'cam ket': 'rightsDeclaration', 'ban quyen': 'rightsDeclaration',
};
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

/** Nội dung tệp mẫu cho người dùng tải về: đủ bốn nhãn, giá trị để trống (tệp mẫu chưa điền thì không đưa gì vào các ô). */
export const STORY_FILE_TEMPLATE = 'Tên truyện: \nNguồn nội dung: \nCam kết quyền sử dụng: \nNội dung:\n';

/** Tệp mẫu cho Creator: máy chủ lấy toàn bộ chữ trong tệp làm nội dung, nên chỉ có phần hướng dẫn để xoá đi; nguồn và cam kết điền ở bước xác nhận nhập. */
export const CREATOR_FILE_TEMPLATE = '(Xoá dòng này rồi viết nội dung truyện. Mỗi đoạn cách nhau một dòng trống.)\n';

/** Tải tệp mẫu .txt về máy. */
export function downloadStoryTemplate(text: string = STORY_FILE_TEMPLATE) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'mau-truyen.txt'; a.click();
  URL.revokeObjectURL(url);
}

/**
 * Tách tệp truyện thành các ô của biểu mẫu. Phần đầu tệp là các dòng "Nhãn: giá trị";
 * từ nhãn "Nội dung:" trở đi (hoặc từ dòng đầu không phải nhãn) là nội dung truyện.
 * Tệp không có nhãn nào thì toàn bộ chữ là nội dung.
 */
export function parseStoryFile(raw: string): StoryFileFields {
  const lines = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  const out: StoryFileFields = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const m = /^\s*([^:：]{1,40})[:：]\s*(.*)$/.exec(line);
    const key = m ? LABELS[fold(m[1])] : undefined;
    if (!m || !key || (key !== 'content' && key in out)) break;
    if (key === 'content') { lines[i] = m[2]; break; }
    out[key] = m[2].trim();
  }
  const body = lines.slice(i).join('\n').trim();
  if (body) out.content = body;
  return out;
}
