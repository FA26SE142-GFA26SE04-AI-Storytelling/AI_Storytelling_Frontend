import { WorkingVolumeBook } from '../three/room/textures/workingVolumesBooks';

export interface PageSpread {
  title: string;
  subtitle: string;
  dataUrl: string;
}

/**
 * Tạo canvas 2 trang đôi toàn màn hình chuẩn 16:9 (Spread 1920x1080)
 */
export function generateSpreads(book: WorkingVolumeBook): PageSpread[] {
  const W = 1920;
  const H = 1080;
  const halfW = W / 2;

  const spreads: PageSpread[] = [];

  // Nếu là sách trống
  if (book.isEmptyPlaceholder) {
    const canvas0 = document.createElement('canvas');
    canvas0.width = W;
    canvas0.height = H;
    const ctx0 = canvas0.getContext('2d')!;
    ctx0.fillStyle = book.color || '#27272a';
    ctx0.fillRect(halfW, 0, halfW, H);
    ctx0.strokeStyle = book.foil || '#71717a';
    ctx0.lineWidth = 4;
    ctx0.strokeRect(halfW + 60, 50, halfW - 120, H - 100);
    ctx0.fillStyle = '#ffffff';
    ctx0.font = 'bold 56px sans-serif';
    ctx0.textAlign = 'center';
    ctx0.fillText('KỆ SÁCH TRỐNG', halfW + halfW / 2, H / 2 - 20);
    ctx0.fillStyle = book.foil || '#a1a1aa';
    ctx0.font = 'bold 24px sans-serif';
    ctx0.fillText('Chưa có truyện nào được phát hành', halfW + halfW / 2, H / 2 + 40);

    spreads.push({
      title: 'Kệ Sách Trống — Bìa',
      subtitle: 'Chưa có truyện',
      dataUrl: canvas0.toDataURL('image/png'),
    });

    const canvas1 = document.createElement('canvas');
    canvas1.width = W;
    canvas1.height = H;
    const ctx1 = canvas1.getContext('2d')!;
    ctx1.fillStyle = '#fbf7ee';
    ctx1.fillRect(0, 0, W, H);
    ctx1.fillStyle = '#09090b';
    ctx1.font = 'bold 42px sans-serif';
    ctx1.textAlign = 'center';
    ctx1.fillText('Thư Viện Chưa Có Câu Chuyện Nào', W / 2, H / 2 - 30);
    ctx1.fillStyle = '#71717a';
    ctx1.font = '24px sans-serif';
    ctx1.fillText('Hãy chuyển sang Laptop phụ huynh để sáng tạo câu chuyện AI cho bé!', W / 2, H / 2 + 30);

    spreads.push({
      title: 'Thông Báo',
      subtitle: 'Thư viện trống',
      dataUrl: canvas1.toDataURL('image/jpeg', 0.92),
    });

    return spreads;
  }

  // --- Spread 0: Bìa trước đơn (Chỉ hiển thị nửa bên phải, sách đang đóng) ---
  {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Nửa bên trái hoàn toàn trong suốt (Sách đang gập lại)
    ctx.clearRect(0, 0, W, H);

    // Nửa bên phải: Bìa trước của sách
    ctx.fillStyle = book.color;
    ctx.beginPath();
    ctx.roundRect(halfW, 0, halfW, H, [0, 20, 20, 0]);
    ctx.fill();

    // Gáy sách ở mép trái của bìa trước (tại halfW)
    const spineGrad = ctx.createLinearGradient(halfW, 0, halfW + 60, 0);
    spineGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
    spineGrad.addColorStop(0.25, 'rgba(255,255,255,0.2)');
    spineGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(halfW, 0, 60, H);

    // Bìa trước (Right)
    ctx.strokeStyle = book.foil;
    ctx.lineWidth = 3;
    ctx.strokeRect(halfW + 60, 50, halfW - 120, H - 100);
    ctx.strokeRect(halfW + 80, 70, halfW - 160, H - 140);

    ctx.fillStyle = book.foil;
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`TẬP ${book.volume} · ${book.roman}`, halfW + halfW / 2, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 92px sans-serif';
    ctx.fillText(book.title, halfW + halfW / 2, H / 2 - 40);

    ctx.fillStyle = book.foil;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`✦  ${book.discipline.toUpperCase()}  ✦`, halfW + halfW / 2, H / 2 + 50);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('MAGICTALES 3D EDITION', halfW + halfW / 2, H - 110);

    spreads.push({
      title: `${book.title} — Bìa Trước`,
      subtitle: `Tập ${book.volume} · ${book.discipline}`,
      dataUrl: canvas.toDataURL('image/png'),
    });
  }

  // --- Spread 1: Trang Ex Libris & Trang Tiêu Đề (Trang 01) ---
  {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Trang giấy ấm áp
    ctx.fillStyle = '#fbf7ee';
    ctx.fillRect(0, 0, W, H);

    // Bóng râm gáy ở giữa
    const spineShadow = ctx.createLinearGradient(halfW - 80, 0, halfW + 80, 0);
    spineShadow.addColorStop(0, 'rgba(0,0,0,0)');
    spineShadow.addColorStop(0.5, 'rgba(0,0,0,0.22)');
    spineShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spineShadow;
    ctx.fillRect(halfW - 80, 0, 160, H);

    // Left Page: Ex Libris
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(100, 110, halfW - 200, H - 220, 20);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = book.color;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = book.foil;
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 130, halfW - 240, H - 260);

    ctx.fillStyle = book.color;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EX LIBRIS', halfW / 2, 210);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(book.title, halfW / 2, 310);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`ẤN BẢN NOBITA · TẬP ${book.volume}`, halfW / 2, 390);
    ctx.fillText('✦ MagicTales Storytelling ✦', halfW / 2, 450);

    // Right Page: Mở đầu câu chuyện
    ctx.textAlign = 'left';
    ctx.fillStyle = book.color;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`TẬP ${book.volume} · ${book.discipline.toUpperCase()}`, halfW + 90, 140);

    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(book.title, halfW + 90, 220);

    // Deck synopsis
    ctx.fillStyle = '#1e293b';
    ctx.font = '28px sans-serif';
    const words = book.deck.split(' ');
    let line = '';
    let y = 300;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > halfW - 180 && i > 0) {
        ctx.fillText(line, halfW + 90, y);
        line = words[i] + ' ';
        y += 44;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, halfW + 90, y);

    // Quote box
    y += 45;
    ctx.fillStyle = `${book.color}15`;
    ctx.beginPath();
    ctx.roundRect(halfW + 80, y, halfW - 160, 110, 14);
    ctx.fill();
    ctx.strokeStyle = book.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(halfW + 80, y + 10);
    ctx.lineTo(halfW + 80, y + 100);
    ctx.stroke();

    ctx.fillStyle = '#09090b';
    ctx.font = 'italic bold 22px sans-serif';
    ctx.fillText(`"${book.note}"`, halfW + 110, y + 62);

    // Page numbers
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('— Trang 01 —', halfW + halfW / 2, H - 55);

    spreads.push({
      title: `${book.title} — Mở Đầu Câu Chuyện`,
      subtitle: `Tập ${book.volume} · Trang 01`,
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    });
  }

  // --- Spread 2: Nội dung chương 1 & Thử thách khám phá ---
  {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#fbf7ee';
    ctx.fillRect(0, 0, W, H);

    const spineShadow = ctx.createLinearGradient(halfW - 80, 0, halfW + 80, 0);
    spineShadow.addColorStop(0, 'rgba(0,0,0,0)');
    spineShadow.addColorStop(0.5, 'rgba(0,0,0,0.22)');
    spineShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spineShadow;
    ctx.fillRect(halfW - 80, 0, 160, H);

    // Left Page: Minh họa & Bối cảnh
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Chương I: Khởi Nguồn Sáng Tạo', 90, 140);

    ctx.fillStyle = '#334155';
    ctx.font = '24px sans-serif';
    ctx.fillText('Mỗi câu chuyện đều bắt đầu từ một ý niệm nhỏ bé.', 90, 200);
    ctx.fillText('Khi bàn tay chạm vào trang giấy, trí tưởng tượng', 90, 245);
    ctx.fillText('mở ra vô vàn những thế giới diệu kỳ đang chờ đón.', 90, 290);

    // Minh họa thẻ màu
    ctx.fillStyle = book.color;
    ctx.beginPath();
    ctx.roundRect(90, 350, halfW - 180, 220, 20);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(book.motif, 90 + (halfW - 180) / 2, 450);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Chủ đề: ${book.theme}`, 90 + (halfW - 180) / 2, 500);

    // Right Page: Thử thách & Câu hỏi tương tác
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Câu Hỏi Suy Ngẫm Cho Bé', halfW + 90, 140);

    const questions = [
      '1. Bé thích chi tiết nào nhất trong hành trình vừa qua?',
      '2. Nếu là nhân vật chính, bé sẽ lựa chọn giải pháp nào?',
      '3. Cùng chia sẻ cảm xúc của bé với ba mẹ nhé!',
    ];

    let y = 210;
    ctx.fillStyle = '#1e293b';
    ctx.font = '24px sans-serif';
    questions.forEach((q) => {
      ctx.fillText(q, halfW + 90, y);
      y += 65;
    });

    // Box bài học
    y += 35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(halfW + 80, y, halfW - 160, 140, 16);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = book.color;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('✦ BÀI HỌC Ý NGHĨA ✦', halfW + 110, y + 40);
    ctx.fillStyle = '#334155';
    ctx.font = 'italic 20px sans-serif';
    ctx.fillText('Kiên trì và sáng tạo sẽ mở ra những cánh cửa bất ngờ.', halfW + 110, y + 80);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('— Trang 02 —', halfW + halfW / 2, H - 55);

    spreads.push({
      title: `${book.title} — Chương I & Bài Học`,
      subtitle: `Tập ${book.volume} · Trang 02`,
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    });
  }

  return spreads;
}
