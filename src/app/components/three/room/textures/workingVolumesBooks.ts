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
  canvas.width = 768;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d')!;

  const renderCover = () => {
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
      // Procedural fallback while atlas loads
      ctx.fillStyle = book.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = book.foil;
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.fillStyle = book.foil;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`WORKING VOLUMES / ${book.volume}`, canvas.width / 2, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px serif';
      ctx.fillText(book.title, canvas.width / 2, canvas.height / 2);

      ctx.fillStyle = book.foil;
      ctx.font = '20px sans-serif';
      ctx.fillText(book.discipline.toUpperCase(), canvas.width / 2, canvas.height / 2 + 50);
    }
  };

  renderCover();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;

  if (!atlasLoaded) {
    pendingTextureUpdates.push(() => {
      renderCover();
      texture.needsUpdate = true;
    });
  }

  return texture;
}

export function createWorkingVolumeSpineTexture(book: WorkingVolumeBook): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 1152;
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
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(book.roman, canvas.width / 2, 70);

  // Vertical Title rotated
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.font = 'bold 36px serif';
  ctx.fillText(book.title.toUpperCase(), 0, 0);
  ctx.restore();

  // Bottom Volume
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`VOL. ${book.volume}`, canvas.width / 2, canvas.height - 70);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}
