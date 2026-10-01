import { WorkingVolumeBook } from '../three/room/textures/workingVolumesBooks';

export interface PageSpread {
  title: string;
  subtitle: string;
  dataUrl: string;
}

/**
 * Hàm hỗ trợ ngắt dòng và vẽ văn bản trên Canvas chuẩn xác
 */
function renderWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxW: number,
  lineH: number,
  maxLines: number = 16
): number {
  if (!text) return startY;
  const words = text.split(/\s+/);
  let line = '';
  let curY = startY;
  let count = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxW && line) {
      ctx.fillText(line, x, curY);
      line = words[i];
      curY += lineH;
      count++;
      if (count >= maxLines - 1 && i < words.length - 1) {
        line = line + '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
    curY += lineH;
  }
  return curY;
}

/**
 * Tách nội dung toàn văn câu chuyện thành 3 hồi (Mở đầu, Diễn biến, Kết thúc)
 */
function splitStoryContent(fullText: string): { act1: string; act2: string; act3: string } {
  const clean = fullText.replace(/\r\n/g, '\n').trim();
  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);

  if (paragraphs.length >= 3) {
    const act1 = paragraphs[0];
    const act2 = paragraphs.slice(1, paragraphs.length - 1).join('\n\n');
    const act3 = paragraphs[paragraphs.length - 1];
    return { act1, act2, act3 };
  } else if (paragraphs.length === 2) {
    return { act1: paragraphs[0], act2: paragraphs[1], act3: '' };
  }

  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) || [clean];
  if (sentences.length >= 3) {
    const third = Math.ceil(sentences.length / 3);
    const act1 = sentences.slice(0, third).join('').trim();
    const act2 = sentences.slice(third, third * 2).join('').trim();
    const act3 = sentences.slice(third * 2).join('').trim();
    return { act1, act2, act3 };
  } else if (sentences.length === 2) {
    return { act1: sentences[0].trim(), act2: sentences[1].trim(), act3: '' };
  }

  return { act1: clean, act2: '', act3: '' };
}

/**
 * Tạo canvas 2 trang đôi toàn màn hình chuẩn 16:9 (Spread 1920x1080)
 */
export function generateSpreads(book: WorkingVolumeBook, coverImage?: HTMLImageElement | null): PageSpread[] {
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

  // --- Spread 0: Bìa trước đơn (Chỉ hiển thị nửa bên phải, khớp 100% với bìa sách 3D bên ngoài) ---
  {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Nửa bên trái hoàn toàn trong suốt (Sách đang gập lại)
    ctx.clearRect(0, 0, W, H);

    const startX = halfW;
    const width = halfW;
    const height = H;
    const centerX = startX + width / 2;

    // Nửa bên phải: Bìa trước của sách
    ctx.fillStyle = book.color;
    ctx.beginPath();
    ctx.roundRect(startX, 0, width, height, [0, 24, 24, 0]);
    ctx.fill();

    // Gáy sách ở mép trái của bìa trước (tại startX)
    const spineGrad = ctx.createLinearGradient(startX, 0, startX + 70, 0);
    spineGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
    spineGrad.addColorStop(0.25, 'rgba(255,255,255,0.15)');
    spineGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(startX, 0, 70, height);

    // Edge shading for realistic 3D book curvature
    const edgeShade = ctx.createLinearGradient(startX, 0, W, 0);
    edgeShade.addColorStop(0, 'rgba(0,0,0,0.32)');
    edgeShade.addColorStop(0.04, 'rgba(255,255,255,0.08)');
    edgeShade.addColorStop(0.96, 'rgba(255,255,255,0.02)');
    edgeShade.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = edgeShade;
    ctx.fillRect(startX, 0, width, height);

    // Outer Decorative Foil Border
    ctx.strokeStyle = book.foil;
    ctx.lineWidth = 4;
    ctx.strokeRect(startX + 40, 40, width - 80, height - 80);
    ctx.lineWidth = 2;
    ctx.strokeRect(startX + 52, 52, width - 104, height - 104);

    // Top Header: Series / Volume & Flourish
    ctx.fillStyle = book.foil;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`✦   MAGICTALES · TẬP ${book.volume}   ✦`, centerX, 92);

    // Illustration Artwork Window
    const imgX = startX + 72;
    const imgY = 125;
    const imgW = width - 144;
    const imgH = 520;
    const cornerR = 24;

    if (coverImage && coverImage.complete && coverImage.naturalWidth > 0) {
      // Draw real cover image inside rounded clipping frame (object-fit: cover)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, cornerR);
      ctx.clip();

      const imgRatio = coverImage.naturalWidth / coverImage.naturalHeight;
      const targetRatio = imgW / imgH;
      let sWidth = coverImage.naturalWidth;
      let sHeight = coverImage.naturalHeight;
      let sx = 0;
      let sy = 0;

      if (imgRatio > targetRatio) {
        sWidth = coverImage.naturalHeight * targetRatio;
        sx = (coverImage.naturalWidth - sWidth) / 2;
      } else {
        sHeight = coverImage.naturalWidth / targetRatio;
        sy = (coverImage.naturalHeight - sHeight) / 2;
      }

      ctx.drawImage(coverImage, sx, sy, sWidth, sHeight, imgX, imgY, imgW, imgH);

      const imgVignette = ctx.createLinearGradient(imgX, imgY + imgH - 120, imgX, imgY + imgH);
      imgVignette.addColorStop(0, 'rgba(0,0,0,0)');
      imgVignette.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = imgVignette;
      ctx.fillRect(imgX, imgY, imgW, imgH);

      ctx.restore();
    } else {
      // Procedural magical illustration placeholder (identical to 3D room cover)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, cornerR);
      ctx.clip();

      const skyGrad = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH);
      skyGrad.addColorStop(0, '#111827');
      skyGrad.addColorStop(0.5, '#1e1b4b');
      skyGrad.addColorStop(1, '#311042');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(imgX, imgY, imgW, imgH);

      // Glowing stars & crescent
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(centerX, imgY + imgH / 2 - 40, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(centerX + 18, imgY + imgH / 2 - 50, 44, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ Sáng Tạo Phép Màu ✨', centerX, imgY + imgH / 2 + 80);

      ctx.restore();
    }

    // Artwork Window Embossed Foil Border
    ctx.strokeStyle = book.foil;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgW, imgH, cornerR);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(imgX + 6, imgY + 6, imgW - 12, imgH - 12, cornerR - 4);
    ctx.stroke();

    // Title Section (Below artwork window)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    const words = book.title.split(' ');
    let line = '';
    let y = imgY + imgH + 58;
    const maxW = width - 160;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > maxW && i > 0) {
        ctx.fillText(line.trim(), centerX, y);
        line = words[i] + ' ';
        y += 50;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), centerX, y);

    // Genre Capsule Badge
    const genreY = Math.min(y + 52, height - 110);
    const genreText = (book.genre || book.discipline || 'TRUYỆN THIẾU NHI').toUpperCase();
    ctx.font = 'bold 22px sans-serif';
    const textMetrics = ctx.measureText(genreText);
    const badgeW = Math.max(textMetrics.width + 48, 180);
    const badgeH = 38;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(centerX - badgeW / 2, genreY - 26, badgeW, badgeH, 19);
    ctx.fill();

    ctx.strokeStyle = book.foil;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = book.foil;
    ctx.fillText(genreText, centerX, genreY);

    // Bottom Inscription
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(book.authorName ? `Tác giả: ${book.authorName}` : 'THƯ VIỆN KỆ SÁCH 3D', centerX, height - 60);

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
    ctx.fillStyle = book.color || '#2563eb';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`TẬP ${book.volume} · ${(book.discipline || book.genre || 'TRUYỆN THIẾU NHI').toUpperCase()}`, halfW + 90, 135);

    // Tiêu đề truyện tự động xuống dòng nếu dài
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 50px sans-serif';
    const titleWords = book.title.split(' ');
    let titleLine = '';
    let titleY = 205;
    for (let i = 0; i < titleWords.length; i++) {
      const test = titleLine ? `${titleLine} ${titleWords[i]}` : titleWords[i];
      if (ctx.measureText(test).width > halfW - 180 && titleLine) {
        ctx.fillText(titleLine, halfW + 90, titleY);
        titleLine = titleWords[i];
        titleY += 56;
      } else {
        titleLine = test;
      }
    }
    if (titleLine) {
      ctx.fillText(titleLine, halfW + 90, titleY);
      titleY += 56;
    }

    const fullStoryText = book.content || book.deck || '';
    const acts = splitStoryContent(fullStoryText);

    if (book.isCustomStory || book.content) {
      ctx.fillStyle = book.color || '#2563eb';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('✦ HỒI 1 · MỞ ĐẦU HÀNH TRÌNH ✦', halfW + 90, titleY + 15);
      titleY += 45;

      ctx.fillStyle = '#1e293b';
      ctx.font = '23px sans-serif';
      const act1EndY = renderWrappedText(ctx, acts.act1, halfW + 90, titleY, halfW - 180, 38, 9);

      // Quote box trích dẫn bài học / cảm xúc
      if (book.note) {
        const quoteY = Math.min(Math.max(act1EndY + 25, H - 230), H - 170);
        ctx.fillStyle = `${book.color}15`;
        ctx.beginPath();
        ctx.roundRect(halfW + 80, quoteY, halfW - 160, 95, 14);
        ctx.fill();
        ctx.strokeStyle = book.color || '#f59e0b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(halfW + 80, quoteY + 10);
        ctx.lineTo(halfW + 80, quoteY + 85);
        ctx.stroke();

        ctx.fillStyle = '#09090b';
        ctx.font = 'italic bold 20px sans-serif';
        renderWrappedText(ctx, `"${book.note}"`, halfW + 105, quoteY + 40, halfW - 210, 28, 2);
      }
    } else {
      // Preset volumes logic
      ctx.fillStyle = '#1e293b';
      ctx.font = '28px sans-serif';
      renderWrappedText(ctx, book.deck, halfW + 90, titleY + 20, halfW - 180, 44, 6);

      // Quote box
      const quoteY = H - 240;
      ctx.fillStyle = `${book.color}15`;
      ctx.beginPath();
      ctx.roundRect(halfW + 80, quoteY, halfW - 160, 110, 14);
      ctx.fill();
      ctx.strokeStyle = book.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(halfW + 80, quoteY + 10);
      ctx.lineTo(halfW + 80, quoteY + 100);
      ctx.stroke();

      ctx.fillStyle = '#09090b';
      ctx.font = 'italic bold 22px sans-serif';
      ctx.fillText(`"${book.note}"`, halfW + 110, quoteY + 62);
    }

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

  // --- Spread 2: Nội dung diễn biến & Kết thúc + Bài học ---
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

    const fullStoryText = book.content || book.deck || '';
    const acts = splitStoryContent(fullStoryText);

    if (book.isCustomStory || book.content) {
      // === CUSTOM AI STORY SPREAD 2 ===
      // Left Page: Hồi 2 - Diễn Biến & Thử Thách
      ctx.textAlign = 'left';
      ctx.fillStyle = book.color || '#2563eb';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('✦ HỒI 2 · THỬ THÁCH & PHIÊU LƯU ✦', 90, 130);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Diễn Biến Câu Chuyện', 90, 185);

      ctx.fillStyle = '#334155';
      ctx.font = '23px sans-serif';
      const devText = acts.act2 || acts.act1;
      const act2EndY = renderWrappedText(ctx, devText, 90, 240, halfW - 180, 38, 9);

      // Thẻ chủ đề / bối cảnh phía dưới
      const badgeCardY = Math.max(act2EndY + 30, H - 350);
      ctx.fillStyle = book.color || '#2563eb';
      ctx.beginPath();
      ctx.roundRect(90, badgeCardY, halfW - 180, 180, 20);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✦ ${book.motif || book.discipline || 'Phiêu Lưu'} ✦`, 90 + (halfW - 180) / 2, badgeCardY + 68);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`Chủ đề: ${book.theme || 'Khám phá thế giới diệu kỳ'}`, 90 + (halfW - 180) / 2, badgeCardY + 115);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('— Trang 02 —', halfW / 2, H - 55);

      // Right Page: Hồi 3 - Cái Kết & Bài Học Ý Nghĩa
      ctx.textAlign = 'left';
      ctx.fillStyle = book.color || '#2563eb';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('✦ HỒI 3 · KẾT THÚC CÂU CHUYỆN ✦', halfW + 90, 130);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('Cái Kết & Lắng Nghe', halfW + 90, 185);

      ctx.fillStyle = '#1e293b';
      ctx.font = '23px sans-serif';
      const endText = acts.act3 || 'Hành trình khép lại trong niềm vui và nụ cười rạng rỡ của những người bạn nhỏ.';
      const act3EndY = renderWrappedText(ctx, endText, halfW + 90, 240, halfW - 180, 38, 7);

      // Khung Bài Học Đạo Đức Ý Nghĩa (Lấy chính xác moralLesson của AI)
      const moralText = book.moralLesson || book.note || 'Biết yêu thương, sẻ chia và giúp đỡ bạn bè xung quanh.';
      const boxY = Math.max(act3EndY + 30, H - 350);
      const boxH = Math.min(230, H - 100 - boxY);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(halfW + 80, boxY, halfW - 160, boxH, 18);
      ctx.fill();
      ctx.strokeStyle = book.color || '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = book.color || '#d97706';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('✦ BÀI HỌC ĐẠO ĐỨC Ý NGHĨA ✦', halfW + 110, boxY + 45);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'italic bold 21px sans-serif';
      renderWrappedText(ctx, `"${moralText}"`, halfW + 110, boxY + 90, halfW - 220, 34, 4);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('— Trang 03 —', halfW + halfW / 2, H - 55);
    } else {
      // === PRESET VOLUMES SPREAD 2 (giữ nguyên cho các quyển sách mẫu mặc định) ===
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Chương I: Khởi Nguồn Sáng Tạo', 90, 140);

      ctx.fillStyle = '#334155';
      ctx.font = '24px sans-serif';
      ctx.fillText('Mỗi câu chuyện đều bắt đầu từ một ý niệm nhỏ bé.', 90, 200);
      ctx.fillText('Khi bàn tay chạm vào trang giấy, trí tưởng tượng', 90, 245);
      ctx.fillText('mở ra vô vàn những thế giới diệu kỳ đang chờ đón.', 90, 290);

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
    }

    spreads.push({
      title: `${book.title} — Diễn Biến & Bài Học`,
      subtitle: `Tập ${book.volume} · Trang 02 & 03`,
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    });
  }

  return spreads;
}
