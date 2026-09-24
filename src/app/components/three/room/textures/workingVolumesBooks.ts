import * as THREE from 'three';
import { COVER_ATLAS_DATA } from './coverAtlasData';

export interface WorkingVolumeBook {
  id: string;
  title: string;
  roman: string;
  volume: string;
  discipline: string;
  note: string;
  deck: string;
  binding: string;
  format: string;
  theme: string;
  motif: string;
  motifKey: string;
  paletteLabel: string;
  color: string;
  foil: string;
  cropIndex: number;
  isEmptyPlaceholder?: boolean;
  isCustomStory?: boolean;
}

export const WORKING_VOLUMES_BOOKS: WorkingVolumeBook[] = [
  {
    id: 'figma',
    title: 'Figma',
    roman: 'V',
    volume: '05',
    discipline: 'Collaborative form',
    note: 'Components, conversations, and systems in common.',
    deck: 'A modular reader on designing in Figma: move from loose frames to shared components, invite critique into the canvas, and leave behind a system others can extend.',
    binding: 'Vermilion cloth · rose-gold foil',
    format: '150 × 220 mm · imagined edition',
    theme: 'Figma · a shared visual language',
    motif: 'Connected modules',
    motifKey: 'modules',
    paletteLabel: 'Vermilion · plum · blush',
    color: '#c83222',
    foil: '#efb0aa',
    cropIndex: 4,
  },
  {
    id: 'framer',
    title: 'Framer',
    roman: 'VI',
    volume: '06',
    discipline: 'Interactive composition',
    note: 'Structure becomes rhythm when the page begins to move.',
    deck: 'A studio notebook for Framer: compose responsive pages directly in the medium, then tune type, layout, and interaction until motion feels native to the structure.',
    binding: 'Coral cloth · copper foil',
    format: '146 × 224 mm · imagined edition',
    theme: 'Framer · composition through motion',
    motif: 'Folded frames (3D stepped portal)',
    motifKey: 'frames',
    paletteLabel: 'Coral · pink · oxblood',
    color: '#da3b2f',
    foil: '#ff8eab',
    cropIndex: 5,
  },
  {
    id: 'xcode',
    title: 'Xcode',
    roman: 'VII',
    volume: '07',
    discipline: 'Native making',
    note: 'A measured path from blueprint to living device.',
    deck: 'A technical folio for making with Xcode: shape the Swift interface, compile against the platform, inspect the runtime, and refine until the result feels native.',
    binding: 'Icy-cyan cloth · aluminum foil',
    format: '158 × 232 mm · imagined edition',
    theme: 'Xcode · blueprint into native form',
    motif: 'Drafting compass',
    motifKey: 'compass',
    paletteLabel: 'Icy cyan · navy · aluminum',
    color: '#78a7bd',
    foil: '#e4e7e5',
    cropIndex: 6,
  },
  {
    id: 'codex',
    title: 'Codex',
    roman: 'I',
    volume: '01',
    discipline: 'Agentic craft',
    note: 'Precise intent, translated into tested systems.',
    deck: 'A field manual for delegating repository work to Codex: state the intent, let the agent trace the system, and treat tests and browser proof as part of the craft.',
    binding: 'Ultramarine cloth · copper foil',
    format: '148 × 216 mm · imagined edition',
    theme: 'Codex · intent into implementation',
    motif: 'Nested brackets (Stepped aperture)',
    motifKey: 'brackets',
    paletteLabel: 'Ultramarine · bone · copper',
    color: '#182a43',
    foil: '#c87046',
    cropIndex: 0,
  },
  {
    id: 'claude-code',
    title: 'Claude Code',
    roman: 'II',
    volume: '02',
    discipline: 'Contextual reasoning',
    note: 'Long context, held with deliberation and care.',
    deck: 'An annotated volume on Claude Code’s context-first practice: read the project, reason across files, preserve the surrounding work, and make every intervention explainable.',
    binding: 'Burnt-orange cloth · antique-gold foil',
    format: '156 × 228 mm · imagined edition',
    theme: 'Claude Code · context before intervention',
    motif: 'Interlaced paths (Contour labyrinth)',
    motifKey: 'paths',
    paletteLabel: 'Burnt orange · cream · burgundy',
    color: '#c24d24',
    foil: '#efc16d',
    cropIndex: 1,
  },
  {
    id: 'cursor',
    title: 'Cursor',
    roman: 'III',
    volume: '03',
    discipline: 'Directed editing',
    note: 'A fast line between the thought and the file.',
    deck: 'A compact handbook for editing with Cursor: navigate living codebases quickly, keep the active context close, and change the right surface without disturbing the rest.',
    binding: 'Citron cloth · black gloss foil',
    format: '140 × 210 mm · imagined edition',
    theme: 'Cursor · navigation with momentum',
    motif: 'Directional caret',
    motifKey: 'caret',
    paletteLabel: 'Citron · ink · off-white',
    color: '#afc400',
    foil: '#171a16',
    cropIndex: 2,
  },
  {
    id: 'antigravity',
    title: 'Antigravity',
    roman: 'IV',
    volume: '04',
    discipline: 'Spatial systems',
    note: 'Ideas released from the flatness of the page.',
    deck: 'A speculative atlas for Antigravity’s spatial way of working: let agents move across tools, make complex structures visible, and understand the system through motion.',
    binding: 'Cobalt cloth · cool-silver foil',
    format: '162 × 240 mm · imagined edition',
    theme: 'Antigravity · structure in motion',
    motif: 'Suspended orbits',
    motifKey: 'orbits',
    paletteLabel: 'Cobalt · sky · silver',
    color: '#1537a1',
    foil: '#dbe8f1',
    cropIndex: 3,
  },
];

// Atlas image singleton
let atlasImage: HTMLImageElement | null = null;
let atlasLoaded = false;
const pendingTextureUpdates: (() => void)[] = [];

function getAtlasImage(): HTMLImageElement | null {
  if (typeof window === 'undefined') return null;
  if (!atlasImage) {
    atlasImage = new Image();
    atlasImage.decoding = 'async';
    atlasImage.onload = () => {
      atlasLoaded = true;
      pendingTextureUpdates.forEach((fn) => fn());
      pendingTextureUpdates.length = 0;
    };
    atlasImage.src = COVER_ATLAS_DATA;
  }
  return atlasImage;
}

const COVER_CROPS: [number, number, number, number][] = [
  [0, 0, 768, 1152], // Codex
  [768, 0, 768, 1152], // Claude Code
  [1536, 0, 768, 1152], // Cursor
  [2304, 0, 768, 1152], // Antigravity
  [3072, 0, 768, 1152], // Figma
  [3840, 0, 768, 1152], // Framer
  [4608, 0, 768, 1152], // Xcode
];

export function createWorkingVolumeCoverTexture(book: WorkingVolumeBook): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 860;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d')!;

  const renderCover = () => {
    // 1. EMPTY PLACEHOLDER BOOK (Chưa có truyện: Sách trống không có tiêu đề)
    if (book.isEmptyPlaceholder) {
      ctx.fillStyle = book.color || '#27272a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = book.foil || '#71717a';
      ctx.lineWidth = 3;
      ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
      ctx.strokeRect(65, 65, canvas.width - 130, canvas.height - 130);

      // Subtle center blank insignia
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // 2. CUSTOM STORY FROM BACKEND API
    if (book.isCustomStory) {
      ctx.fillStyle = book.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Double decorative foil frame
      ctx.strokeStyle = book.foil;
      ctx.lineWidth = 4;
      ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

      // Header
      ctx.fillStyle = book.foil;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`MAGICTALES · TẬP ${book.volume}`, canvas.width / 2, 110);

      // Star flourish top
      ctx.fillText('✦   ✦   ✦', canvas.width / 2, 155);

      // Title (Multi-line centered with word wrap)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      const words = book.title.split(' ');
      let line = '';
      let y = canvas.height / 2 - 80;
      const maxW = canvas.width - 180;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        if (ctx.measureText(testLine).width > maxW && i > 0) {
          ctx.fillText(line.trim(), canvas.width / 2, y);
          line = words[i] + ' ';
          y += 65;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), canvas.width / 2, y);

      // Category / Discipline
      ctx.fillStyle = book.foil;
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(book.discipline.toUpperCase(), canvas.width / 2, y + 80);

      // Bottom footer badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('THƯ VIỆN KỆ SÁCH 3D', canvas.width / 2, canvas.height - 90);
      return;
    }

    // 3. DEFAULT WORKING VOLUMES (Nếu atlas sẵn sàng)
    const img = getAtlasImage();
    if (atlasLoaded && img && img.width > 0 && img.height > 0) {
      const sliceW = img.width / 7;
      const sliceH = img.height;
      const sourceX = book.cropIndex * sliceW;
      const sourceY = 0;
      ctx.drawImage(img, sourceX, sourceY, sliceW, sliceH, 0, 0, canvas.width, canvas.height);

      // Subtle edge depth lighting gradient
      const edgeShade = ctx.createLinearGradient(0, 0, canvas.width, 0);
      edgeShade.addColorStop(0, 'rgba(0,0,0,0.18)');
      edgeShade.addColorStop(0.06, 'rgba(255,255,255,0.02)');
      edgeShade.addColorStop(0.92, 'rgba(255,255,255,0)');
      edgeShade.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = edgeShade;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = book.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = book.foil;
      ctx.lineWidth = 4;
      ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

      ctx.fillStyle = book.foil;
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`MAGICTALES / ${book.volume}`, canvas.width / 2, 95);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 60px sans-serif';
      ctx.fillText(book.title, canvas.width / 2, canvas.height / 2);

      ctx.fillStyle = book.foil;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(book.discipline.toUpperCase(), canvas.width / 2, canvas.height / 2 + 60);
    }
  };

  renderCover();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;

  if (!atlasLoaded && !book.isCustomStory && !book.isEmptyPlaceholder) {
    pendingTextureUpdates.push(() => {
      renderCover();
      texture.needsUpdate = true;
    });
  }

  return texture;
}

export function createWorkingVolumeSpineTexture(book: WorkingVolumeBook): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = book.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Spine edge shadow
  const shade = ctx.createLinearGradient(0, 0, canvas.width, 0);
  shade.addColorStop(0, 'rgba(0,0,0,0.25)');
  shade.addColorStop(0.18, 'rgba(255,255,255,0.06)');
  shade.addColorStop(0.82, 'rgba(255,255,255,0.01)');
  shade.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Foil border
  ctx.strokeStyle = book.foil;
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 24, canvas.width - 32, canvas.height - 48);

  // Roman Numeral Top
  ctx.fillStyle = book.foil;
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(book.roman, canvas.width / 2, 70);

  // Vertical Title rotated
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(book.title.toUpperCase(), 0, 0);
  ctx.restore();

  // Bottom Volume
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`VOL. ${book.volume}`, canvas.width / 2, canvas.height - 70);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

export function createWorkingVolumeInsideCoverTexture(book: WorkingVolumeBook): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d')!;

  // Endpaper warm cream textured background
  ctx.fillStyle = '#f6f1e8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle decorative geometric dot pattern
  ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
  const step = 38;
  for (let x = 25; x < canvas.width; x += step) {
    for (let y = 25; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Right-side inner shadow where the page joins the spine
  const innerSpineShade = ctx.createLinearGradient(canvas.width - 90, 0, canvas.width, 0);
  innerSpineShade.addColorStop(0, 'rgba(0,0,0,0)');
  innerSpineShade.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = innerSpineShade;
  ctx.fillRect(canvas.width - 90, 0, 90, canvas.height);

  // Elegant decorative double border
  ctx.strokeStyle = book.color;
  ctx.lineWidth = 5;
  ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

  ctx.strokeStyle = book.foil;
  ctx.lineWidth = 2;
  ctx.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);

  // Center Ex Libris Plate Card
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 330, canvas.height / 2 - 380, 660, 760, 24);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = book.color;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.strokeStyle = book.foil;
  ctx.lineWidth = 2;
  ctx.strokeRect(canvas.width / 2 - 305, canvas.height / 2 - 355, 610, 710);

  // Ex Libris Header
  ctx.fillStyle = book.color;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EX LIBRIS', canvas.width / 2, canvas.height / 2 - 240);

  // Book Title in Ex Libris (Super bold and large)
  ctx.fillStyle = '#09090b';
  ctx.font = 'bold 76px sans-serif';
  ctx.fillText(book.title, canvas.width / 2, canvas.height / 2 - 120);

  // Edition details
  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`ẤN BẢN TẬP ${book.volume}`, canvas.width / 2, canvas.height / 2 - 20);

  ctx.fillStyle = '#52525b';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('THƯ VIỆN KỆ SÁCH NOBITA', canvas.width / 2, canvas.height / 2 + 50);

  ctx.fillStyle = book.color;
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('✦ MagicTales 3D ✦', canvas.width / 2, canvas.height / 2 + 180);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  return texture;
}

export function createWorkingVolumePageTexture(book: WorkingVolumeBook): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d')!;

  // Warm book paper background
  ctx.fillStyle = '#faf7f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft spine gradient shadow on left margin
  const spineShade = ctx.createLinearGradient(0, 0, 110, 0);
  spineShade.addColorStop(0, 'rgba(0,0,0,0.22)');
  spineShade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = spineShade;
  ctx.fillRect(0, 0, 110, canvas.height);

  // Top header rule
  ctx.fillStyle = '#52525b';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MAGICTALES 3D STORYTELLING', canvas.width / 2, 75);

  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 100);
  ctx.lineTo(canvas.width - 80, 100);
  ctx.stroke();

  // Volume badge (Large & vibrant)
  ctx.fillStyle = book.color;
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(`TẬP ${book.volume} · ${book.discipline.toUpperCase()}`, canvas.width / 2, 175);

  // Story Title (HUGE & Jet-Black)
  ctx.fillStyle = '#09090b';
  ctx.font = 'bold 88px sans-serif';
  ctx.fillText(book.title, canvas.width / 2, 280);

  // Star flourish
  ctx.fillStyle = book.color;
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('✦   ✦   ✦', canvas.width / 2, 350);

  // Deck / Story Excerpt (Large 40px text with wide layout)
  ctx.fillStyle = '#09090b';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'left';
  const words = book.deck.split(' ');
  let line = '';
  let y = 460;
  const maxWidth = 900;
  const x = 100;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i] + ' ';
      y += 62;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);

  // Quote Box with high contrast
  y += 65;
  ctx.fillStyle = '#f0ebd8';
  ctx.beginPath();
  ctx.roundRect(80, y, canvas.width - 160, 160, 20);
  ctx.fill();

  ctx.strokeStyle = book.color;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(80, y + 20);
  ctx.lineTo(80, y + 140);
  ctx.stroke();

  ctx.fillStyle = '#18181b';
  ctx.font = 'italic bold 32px sans-serif';
  ctx.fillText(`"${book.note}"`, 115, y + 85);

  // Footer page number
  ctx.fillStyle = '#52525b';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— Trang 01 —', canvas.width / 2, canvas.height - 60);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  return texture;
}

const STORY_PALETTES = [
  { color: '#c83222', foil: '#efb0aa', binding: 'Vermilion cloth · rose-gold foil', paletteLabel: 'Vermilion · plum · blush', cropIndex: 4 },
  { color: '#da3b2f', foil: '#ff8eab', binding: 'Coral cloth · copper foil', paletteLabel: 'Coral · pink · oxblood', cropIndex: 5 },
  { color: '#78a7bd', foil: '#e4e7e5', binding: 'Icy-cyan cloth · aluminum foil', paletteLabel: 'Icy cyan · navy · aluminum', cropIndex: 6 },
  { color: '#182a43', foil: '#c87046', binding: 'Ultramarine cloth · copper foil', paletteLabel: 'Ultramarine · bone · copper', cropIndex: 0 },
  { color: '#c24d24', foil: '#efc16d', binding: 'Burnt-orange cloth · antique-gold foil', paletteLabel: 'Burnt orange · cream · burgundy', cropIndex: 1 },
  { color: '#afc400', foil: '#171a16', binding: 'Citron cloth · black gloss foil', paletteLabel: 'Citron · ink · off-white', cropIndex: 2 },
  { color: '#1537a1', foil: '#dbe8f1', binding: 'Cobalt cloth · cool-silver foil', paletteLabel: 'Cobalt · sky · silver', cropIndex: 3 },
];

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export const EMPTY_BLANK_BOOK: WorkingVolumeBook = {
  id: 'empty-bookshelf',
  title: 'Chưa Có Truyện Nào',
  roman: '—',
  volume: '00',
  discipline: 'Kệ Sách Đang Trống',
  note: 'Hiện chưa có câu chuyện nào được phát hành trong thư viện.',
  deck: 'Kệ sách hiện chưa có ấn bản nào. Bạn có thể mở Laptop Phụ Huynh để sáng tạo câu chuyện AI đầu tiên cho bé!',
  binding: 'Vải mộc xám mờ',
  format: '150 × 220 mm · Chưa xuất bản',
  theme: 'Thư viện Nobita · Trống',
  motif: 'Kệ sách chưa có truyện',
  motifKey: 'empty',
  paletteLabel: 'Xám khói · Bạc mờ',
  color: '#27272a',
  foil: '#71717a',
  cropIndex: 0,
  isEmptyPlaceholder: true,
};

export function mapStoryDtoToWorkingVolumeBook(story: any, index: number = 0): WorkingVolumeBook {
  const p = STORY_PALETTES[index % STORY_PALETTES.length];
  const volNum = String(index + 1).padStart(2, '0');
  const roman = ROMAN_NUMERALS[index % ROMAN_NUMERALS.length] || 'I';

  const ageText = story.ageBand ? String(story.ageBand).replace(/Age_/i, 'Độ tuổi ').replace(/_/g, ' - ') : '';
  const categoryOrGenre = story.categoryName || story.genre || (ageText ? ageText : 'Truyện AI Thiếu Nhi');
  const synopsisOrDesc = story.description || story.synopsis || story.moralLesson || 'Một hành trình khám phá diệu kỳ cùng những bài học ý nghĩa.';
  const fullContent = story.content || synopsisOrDesc;

  return {
    id: `story-${story.id}`,
    title: story.title || 'Câu Chuyện Phép Màu',
    roman,
    volume: volNum,
    discipline: categoryOrGenre,
    note: story.moralLesson || synopsisOrDesc,
    deck: fullContent,
    binding: p.binding,
    format: '150 × 220 mm · Ấn bản phép màu',
    theme: `${categoryOrGenre} · ${ageText || 'Dành cho bé'}`,
    motif: story.genre || 'Cánh cửa thần kỳ',
    motifKey: 'portal',
    paletteLabel: p.paletteLabel,
    color: p.color,
    foil: p.foil,
    cropIndex: p.cropIndex,
    isCustomStory: true,
  };
}


