'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface CameraStage {
  id: string;
  name: string;
  camPos: [number, number, number];
  targetPos: [number, number, number];
}

export const STAGES: CameraStage[] = [
  {
    id: 'overview',
    name: '1. Toàn Cảnh Căn Phòng (Perspective Model)',
    camPos: [0, 1, 4],
    targetPos: [0, 1, 0],
  },
  {
    id: 'desk',
    name: '2. Góc Bàn Học & Ghế Xoay (Right Wall)',
    camPos: [1, 2, -0.6],
    targetPos: [1.7, 0.9, -0.6],
  },
  {
    id: 'bookshelf',
    name: '3. Kệ Sách 3 Tầng (Clean Shelves)',
    camPos: [-0.6, 1.5, -0.4],
    targetPos: [-1.5, 1.2, -2.1],
  },
  {
    id: 'closet',
    name: '4. Tủ Trượt Âm Tường (Closet Panel B)',
    camPos: [0.2, 1.6, -0.4],
    targetPos: [0.9, 1.4, -2.1],
  },
  {
    id: 'window',
    name: '5. Cửa Sổ Trượt (Window Sill Detail A)',
    camPos: [-0.6, 1.5, 0.4],
    targetPos: [-2.4, 1.5, 0],
  },
];

export type TimeOfDay = 'morning' | 'afternoon' | 'night';

export interface NobitaRoomCanvasProps {
  currentStageIndex: number;
  onStageChange?: (index: number) => void;
  timeOfDay?: TimeOfDay;
  onTimeOfDayChange?: (mode: TimeOfDay) => void;
  className?: string;
}

export const NobitaRoomCanvas: React.FC<NobitaRoomCanvasProps> = ({
  currentStageIndex = 0,
  timeOfDay = 'afternoon',
  onTimeOfDayChange,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Time of Day atmosphere state ('morning': Fresh daylight, 'afternoon': Golden sunset, 'night': Cozy evening)
  const [timeMode, setTimeMode] = React.useState<TimeOfDay>(timeOfDay);
  const timeModeRef = useRef<TimeOfDay>(timeOfDay);

  useEffect(() => {
    setTimeMode(timeOfDay);
    timeModeRef.current = timeOfDay;
  }, [timeOfDay]);

  const handleTimeModeChange = (mode: TimeOfDay) => {
    setTimeMode(mode);
    timeModeRef.current = mode;
    if (onTimeOfDayChange) {
      onTimeOfDayChange(mode);
    }
  };

  // Live debug state for current camera coordinates
  const [debugCam, setDebugCam] = React.useState<{ cam: string; target: string }>({
    cam: '4.2, 3.2, 4.8',
    target: '-0.3, 0.9, -0.5',
  });
  const [copied, setCopied] = React.useState(false);

  // Camera LERP target vectors
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(...STAGES[0].camPos));
  const targetLookAtPos = useRef<THREE.Vector3>(new THREE.Vector3(...STAGES[0].targetPos));

  useEffect(() => {
    const stage = STAGES[currentStageIndex] || STAGES[0];
    targetCamPos.current.set(...stage.camPos);
    targetLookAtPos.current.set(...stage.targetPos);
  }, [currentStageIndex]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. SCENE & BACKGROUND
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5e6d3);

    // 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(...STAGES[0].camPos);

    // 3. RENDERER SETUP WITH ACES FILMIC TONE MAPPING & GEOMETRIC WINDOW SHADOWS
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // Sharp architectural window cutout shadows
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.30; // High contrast dynamic exposure

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. ORBIT CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.minDistance = 1.0;
    controls.maxDistance = 18;
    controls.target.set(...STAGES[0].targetPos);
    controlsRef.current = controls;

    // Atmospheric Fog for Depth Perspective
    scene.fog = new THREE.FogExp2(0xf7e8d0, 0.015);

    // 5. HIGH-CONTRAST GOLDEN HOUR AFTERNOON LIGHTING SYSTEM
    // Direct Head-On Sunlight with Wide Aperture Angle (Chiếu chính diện với góc phủ rộng)
    const sunLight = new THREE.DirectionalLight(0xff9e2e, 5.8);
    sunLight.position.set(-5.5, 3.8, 0.0);
    sunLight.target.position.set(1.5, 0.2, 0.0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096; // 4K resolution for crisp sharp window cutouts
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -8;
    sunLight.shadow.camera.right = 8;
    sunLight.shadow.camera.top = 8;
    sunLight.shadow.camera.bottom = -8;
    sunLight.shadow.bias = -0.0001;
    sunLight.shadow.radius = 0.5; // Sharp clean architectural window shadow edges
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Controlled Hemisphere Light for Deep Contrast Shadows
    const hemiLight = new THREE.HemisphereLight(0xffd8ab, 0x544333, 0.55);
    scene.add(hemiLight);

    // Soft Low-Intensity Ambient Light for Rich Dark Shadows
    const ambLight = new THREE.AmbientLight(0xffedd8, 0.15);
    scene.add(ambLight);

    // Wide Window Diffuse Fill Light
    const windowFillLight = new THREE.DirectionalLight(0xffd4a1, 0.45);
    windowFillLight.position.set(-4.5, 3.5, 0.0);
    windowFillLight.target.position.set(1.5, 0.5, 0.0);
    scene.add(windowFillLight);
    scene.add(windowFillLight.target);

    // Ceiling Lamp Glow (Wide 14m coverage for room illumination)
    const ceilingLight = new THREE.PointLight(0xffecc2, 0.12, 14.0, 1.0);
    ceilingLight.position.set(0, 2.3, 0);
    scene.add(ceilingLight);

    // --- PROCEDURAL CANVAS TEXTURE GENERATOR SYSTEM ---
    // 1. Woven Tatami Straw Texture Generator
    const createTatamiTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#d8c492';
      ctx.fillRect(0, 0, 512, 512);

      // Horizontal woven straw strands
      for (let y = 0; y < 512; y += 4) {
        ctx.fillStyle = y % 8 === 0 ? '#c7b07c' : '#e6d5aa';
        ctx.fillRect(0, y, 512, 2);
      }

      // Vertical weave thread stitches
      ctx.fillStyle = '#9e844e';
      for (let x = 16; x < 512; x += 32) {
        for (let y = 0; y < 512; y += 8) {
          ctx.fillRect(x, y, 3, 4);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 4);
      return texture;
    };

    // 2. Ultra High-Contrast Natural Wood Grain & Knot Texture Generator
    const createWoodTexture = (baseHex: string, grainHex: string, highlightHex: string, ringCount = 85, repeatX = 3, repeatY = 3) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Base wood tone
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, 1024, 1024);

      // Fine wood fiber micro-strands
      ctx.fillStyle = grainHex;
      for (let i = 0; i < 35000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        ctx.globalAlpha = 0.08;
        ctx.fillRect(x, y, 1.8, 8);
      }

      // High-contrast wavy organic growth rings (Dark Grain Lines)
      ctx.strokeStyle = grainHex;
      ctx.globalAlpha = 0.70;

      for (let i = 0; i < ringCount; i++) {
        ctx.lineWidth = 1.5 + Math.random() * 3.5;
        ctx.beginPath();
        const startX = (i * 14) % 1024;
        ctx.moveTo(startX, 0);
        ctx.bezierCurveTo(
          startX + Math.sin(i * 0.45) * 90, 340,
          startX - Math.sin(i * 0.45) * 90, 680,
          startX + Math.sin(i * 0.45) * 60, 1024
        );
        ctx.stroke();
      }

      // Golden Wood Fiber Highlights (Light Grain Lines)
      ctx.strokeStyle = highlightHex;
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < ringCount / 2; i++) {
        ctx.lineWidth = 1.2 + Math.random() * 2.0;
        ctx.beginPath();
        const startX = (i * 28 + 6) % 1024;
        ctx.moveTo(startX, 0);
        ctx.bezierCurveTo(
          startX + Math.sin(i * 0.45) * 70, 340,
          startX - Math.sin(i * 0.45) * 70, 680,
          startX + Math.sin(i * 0.45) * 40, 1024
        );
        ctx.stroke();
      }

      // Prominent Concentric Wood Knots (Mắt gỗ tự nhiên rõ nét)
      ctx.strokeStyle = grainHex;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.55;

      const knots = [
        { x: 280, y: 320 },
        { x: 720, y: 750 },
        { x: 500, y: 180 },
      ];

      knots.forEach((k) => {
        for (let r = 6; r < 140; r += 12) {
          ctx.beginPath();
          ctx.ellipse(k.x, k.y, r * 1.6, r * 0.55, Math.PI / 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      return texture;
    };

    // 3. Stippled Japanese Plaster Wall Texture Generator
    const createPlasterTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#e5d8be';
      ctx.fillRect(0, 0, 256, 256);

      const imgData = ctx.getImageData(0, 0, 256, 256);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 10;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
      return texture;
    };

    // 4. Woven Fabric / Upholstery Cloth Texture Generator for Swivel Chair (1024x1024 High-Resolution Canvas)
    const createChairFabricTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Base vibrant royal blue upholstery fabric color
      ctx.fillStyle = '#2152ce';
      ctx.fillRect(0, 0, 1024, 1024);

      // Deep dark weave grid lines for honeycomb / twill mesh upholstery look
      ctx.strokeStyle = '#12389e';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.65;

      const step = 8;
      for (let i = 0; i < 1024; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1024);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1024, i);
        ctx.stroke();
      }

      // Diagonal weave threads for high-end upholstery mesh pattern
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.40;
      for (let i = -1024; i < 1024; i += step * 2) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 1024, 1024);
        ctx.stroke();
      }

      // Micro fabric fiber noise for realistic tactile surface feeling
      for (let i = 0; i < 65000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const isLight = Math.random() > 0.4;
        ctx.fillStyle = isLight ? '#93c5fd' : '#1d4ed8';
        ctx.globalAlpha = isLight ? 0.25 : 0.35;
        ctx.fillRect(x, y, 2.2, 2.2);
      }

      // Subtle seam / grid quilting cushion lines
      ctx.strokeStyle = '#0f2b7a';
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.35;
      for (let q = 128; q < 1024; q += 128) {
        ctx.beginPath();
        ctx.moveTo(q, 0);
        ctx.lineTo(q, 1024);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, q);
        ctx.lineTo(1024, q);
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3);
      return texture;
    };

    // 5. Brushed Metal Texture Generator for Chair Legs & Frame
    const createBrushedMetalTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 512, 512);

      // Fine directional brushed streaks
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const w = 15 + Math.random() * 40;
        const isBright = Math.random() > 0.5;
        ctx.fillStyle = isBright ? '#64748b' : '#1e293b';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(x, y, w, 1.5);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
      return texture;
    };

    // 6. Rubber Wheel Texture Generator for Caster Wheels
    const createRubberWheelTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 256, 256);

      const imgData = ctx.getImageData(0, 0, 256, 256);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 10;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 128);
      ctx.lineTo(256, 128);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const tatamiTexture = createTatamiTexture();
    const cedarWoodTexture = createWoodTexture('#ad6536', '#3b1c07', '#fcd292', 80, 3, 3);
    const darkWoodTexture = createWoodTexture('#4f2d17', '#1c0e05', '#8f5630', 70, 3, 3);
    const mahoganyWoodTexture = createWoodTexture('#732b16', '#330f05', '#bf5a37', 75, 3, 3);
    const wallPlasterTexture = createPlasterTexture();
    const chairFabricTexture = createChairFabricTexture();
    const brushedMetalTexture = createBrushedMetalTexture();
    const rubberWheelTexture = createRubberWheelTexture();

    // --- ENHANCED PBR MATERIALS SYSTEM WITH ULTRA-PROMINENT TEXTURES & BUMP MAPPING ---
    const matTatami = new THREE.MeshStandardMaterial({
      color: 0xd6c08d,
      map: tatamiTexture || undefined,
      roughness: 0.8,
      metalness: 0.02
    });
    const matTatamiBorder = new THREE.MeshStandardMaterial({ color: 0x2b3846, roughness: 0.6, metalness: 0.05 });
    const matWoodAmber = new THREE.MeshStandardMaterial({
      color: 0xaa6333,
      map: cedarWoodTexture || undefined,
      bumpMap: cedarWoodTexture || undefined,
      bumpScale: 0.12,
      roughness: 0.40,
      metalness: 0.02
    });
    const matWoodDark = new THREE.MeshStandardMaterial({
      color: 0x543219,
      map: darkWoodTexture || undefined,
      bumpMap: darkWoodTexture || undefined,
      bumpScale: 0.14,
      roughness: 0.45,
      metalness: 0.02
    });
    const matWallBeige = new THREE.MeshStandardMaterial({
      color: 0xe5d8be,
      map: wallPlasterTexture || undefined,
      roughness: 0.9
    });
    const matShojiPaper = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      emissive: new THREE.Color(0x000000),
      roughness: 0.85,
      transparent: true,
      opacity: 0.92
    });
    const matClosetWhite = new THREE.MeshStandardMaterial({ color: 0xf5eedc, roughness: 0.55 });
    const matClosetBlue = new THREE.MeshStandardMaterial({ color: 0x1d5a8a, roughness: 0.35, metalness: 0.05 });
    const matBlueChair = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      map: chairFabricTexture || undefined,
      bumpMap: chairFabricTexture || undefined,
      bumpScale: 0.18,
      roughness: 0.50,
      metalness: 0.04
    });
    const matChairPiping = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      map: chairFabricTexture || undefined,
      roughness: 0.45,
      metalness: 0.05
    });
    const matChairShell = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.40,
      metalness: 0.10
    });
    const matMetalLegs = new THREE.MeshStandardMaterial({
      color: 0x334155,
      map: brushedMetalTexture || undefined,
      bumpMap: brushedMetalTexture || undefined,
      bumpScale: 0.05,
      roughness: 0.28,
      metalness: 0.85
    });
    const matChairWheel = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      map: rubberWheelTexture || undefined,
      bumpMap: rubberWheelTexture || undefined,
      bumpScale: 0.08,
      roughness: 0.75,
      metalness: 0.10
    });
    const matGlobeOcean = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.1 });
    const matAlarmRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, metalness: 0.15 });
    const matTableMahogany = new THREE.MeshStandardMaterial({
      color: 0x6b2915,
      map: mahoganyWoodTexture || undefined,
      bumpMap: mahoganyWoodTexture || undefined,
      bumpScale: 0.12,
      roughness: 0.28,
      metalness: 0.05
    });

    // Decorative Accessories Materials
    const matGlassWater = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      transmission: 0.9,
    });
    const matWaterLiquid = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.10,
      transmission: 0.75,
    });
    const matCeramicWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const matTerracotta = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.65 });
    const matRandoseruRed = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.35, metalness: 0.05 });
    const matLeafDark = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const matLeafLight = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
    const matPaperWhite = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.9 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.85 });
    const matLampGreen = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.20, metalness: 0.15 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.15, metalness: 0.90 });
    const matSwitchRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
    const matCupYellow = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const matPencilYellow = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // ==========================================
    // 1. PERFECT SEAMLESS TATAMI FLOOR GRID (NO OVERLAPS, NO GAPS)
    // ==========================================
    const roomW = 4.8; // Total Room Width (X)
    const roomL = 4.8; // Total Room Length (Z)
    const roomH = 2.8; // Room Height (Y)
    const wallT = 0.15; // Substantial architectural wall thickness

    // Floor Base (Dark wood baseboard under tatami)
    const floorBase = new THREE.Mesh(new THREE.BoxGeometry(roomW + 0.2, 0.2, roomL + 0.2), matWoodDark);
    floorBase.position.y = -0.1;
    floorBase.receiveShadow = true;
    roomGroup.add(floorBase);

    // Seamless Tatami Tiles Layout (8 mats of 2.4m x 1.2m covering 4.8m x 4.8m area perfectly)
    const mThickness = 0.035;
    const borderW = 0.045;

    const tatamiTiles = [
      // Row 1 (Back Horizontal Pair: Z = -1.8)
      { x: -1.2, z: -1.8, w: 2.4, d: 1.2, isHorizontal: true },
      { x: 1.2, z: -1.8, w: 2.4, d: 1.2, isHorizontal: true },
      // Row 2 (Middle Vertical Quad: Z = 0)
      { x: -1.8, z: 0.0, w: 1.2, d: 2.4, isHorizontal: false },
      { x: -0.6, z: 0.0, w: 1.2, d: 2.4, isHorizontal: false },
      { x: 0.6, z: 0.0, w: 1.2, d: 2.4, isHorizontal: false },
      { x: 1.8, z: 0.0, w: 1.2, d: 2.4, isHorizontal: false },
      // Row 3 (Front Horizontal Pair: Z = 1.8)
      { x: -1.2, z: 1.8, w: 2.4, d: 1.2, isHorizontal: true },
      { x: 1.2, z: 1.8, w: 2.4, d: 1.2, isHorizontal: true },
    ];

    tatamiTiles.forEach((tile) => {
      const tileGroup = new THREE.Group();
      tileGroup.position.set(tile.x, mThickness / 2, tile.z);

      // Main Tatami Straw Mesh
      const strawMesh = new THREE.Mesh(new THREE.BoxGeometry(tile.w, mThickness, tile.d), matTatami);
      strawMesh.receiveShadow = true;
      tileGroup.add(strawMesh);

      // Fabric Border Wraps along long edges
      if (tile.isHorizontal) {
        // Border strips along top and bottom long edges (along X)
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(tile.w, mThickness + 0.002, borderW), matTatamiBorder);
        b1.position.z = tile.d / 2 - borderW / 2;
        tileGroup.add(b1);

        const b2 = new THREE.Mesh(new THREE.BoxGeometry(tile.w, mThickness + 0.002, borderW), matTatamiBorder);
        b2.position.z = -tile.d / 2 + borderW / 2;
        tileGroup.add(b2);
      } else {
        // Border strips along left and right long edges (along Z)
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(borderW, mThickness + 0.002, tile.d), matTatamiBorder);
        b1.position.x = tile.w / 2 - borderW / 2;
        tileGroup.add(b1);

        const b2 = new THREE.Mesh(new THREE.BoxGeometry(borderW, mThickness + 0.002, tile.d), matTatamiBorder);
        b2.position.x = -tile.w / 2 + borderW / 2;
        tileGroup.add(b2);
      }

      roomGroup.add(tileGroup);
    });

    // ==========================================
    // 2. WALLS & WOODEN POST SYSTEM (BLUEPRINT M-001)
    // ==========================================
    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomW, roomH, wallT), matWallBeige);
    backWall.position.set(0, roomH / 2, -roomL / 2 - wallT / 2);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    // Left Wall with Centered Window Cutout (Extended front wall section for full camera coverage)
    const leftWallBottom = new THREE.Mesh(new THREE.BoxGeometry(wallT, 0.8, 2.4), matWallBeige);
    leftWallBottom.position.set(-roomW / 2 - wallT / 2, 0.4, 0);
    leftWallBottom.castShadow = true;
    leftWallBottom.receiveShadow = true;
    roomGroup.add(leftWallBottom);

    const leftWallTop = new THREE.Mesh(new THREE.BoxGeometry(wallT, 0.4 + 6, 2.4), matWallBeige);
    leftWallTop.position.set(-roomW / 2 - wallT / 2, 2.6 + 6 / 2, 0);
    leftWallTop.castShadow = true;
    leftWallTop.receiveShadow = true;
    roomGroup.add(leftWallTop);

    // Extended back wall section so the window wall extends far back, closing background gaps
    const leftWallBack = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH + 6, 4.0), matWallBeige);
    leftWallBack.position.set(-roomW / 2 - wallT / 2, (roomH + 6) / 2, -3.2);
    leftWallBack.castShadow = true;
    leftWallBack.receiveShadow = true;
    roomGroup.add(leftWallBack);

    // Extended front wall section so the window wall fills the left side of the scene fully
    const leftWallFront = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH + 6, 3.6), matWallBeige);
    leftWallFront.position.set(-roomW / 2 - wallT / 2, (roomH + 6) / 2, 3.0);
    leftWallFront.castShadow = true;
    leftWallFront.receiveShadow = true;
    roomGroup.add(leftWallFront);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH, roomL), matWallBeige);
    rightWall.position.set(roomW / 2 + wallT / 2, roomH / 2, 0);
    rightWall.receiveShadow = true;
    roomGroup.add(rightWall);

    // Posts & Rails
    const postGeom = new THREE.BoxGeometry(0.12, roomH, 0.06);

    const postCorner1 = new THREE.Mesh(postGeom, matWoodAmber);
    postCorner1.position.set(-roomW / 2 + 0.06, roomH / 2, -roomL / 2 + 0.03);
    postCorner1.castShadow = true;
    postCorner1.receiveShadow = true;
    roomGroup.add(postCorner1);

    const postCorner2 = new THREE.Mesh(postGeom, matWoodAmber);
    postCorner2.position.set(roomW / 2 - 0.06, roomH / 2, -roomL / 2 + 0.03);
    postCorner2.castShadow = true;
    postCorner2.receiveShadow = true;
    roomGroup.add(postCorner2);

    const postMidBack = new THREE.Mesh(postGeom, matWoodAmber);
    postMidBack.position.set(-0.4, roomH / 2, -roomL / 2 + 0.03);
    postMidBack.castShadow = true;
    postMidBack.receiveShadow = true;
    roomGroup.add(postMidBack);

    const railBack = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.1, 0.04), matWoodAmber);
    railBack.position.set(0, 2.2, -roomL / 2 + 0.02);
    railBack.castShadow = true;
    railBack.receiveShadow = true;
    roomGroup.add(railBack);

    const railLeftBack = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 4.0), matWoodAmber);
    railLeftBack.position.set(-roomW / 2 + 0.02, 2.2, -3.2);
    railLeftBack.castShadow = true;
    railLeftBack.receiveShadow = true;
    roomGroup.add(railLeftBack);

    const railLeftFront = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 3.6), matWoodAmber);
    railLeftFront.position.set(-roomW / 2 + 0.02, 2.2, 3.0);
    railLeftFront.castShadow = true;
    railLeftFront.receiveShadow = true;
    roomGroup.add(railLeftFront);

    const railRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, roomL), matWoodAmber);
    railRight.position.set(roomW / 2 - 0.02, 2.2, 0);
    railRight.castShadow = true;
    railRight.receiveShadow = true;
    roomGroup.add(railRight);

    // Grid Ceiling with Substantial Architectural Thickness
    const ceilingThickness = 0.20; // 20cm solid ceiling slab
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xb5a58a, roughness: 0.95 });
    const ceilingMesh = new THREE.Mesh(new THREE.BoxGeometry(roomW + 0.4, ceilingThickness, roomL + 0.4), ceilingMat);
    ceilingMesh.position.y = roomH + ceilingThickness / 2;
    ceilingMesh.receiveShadow = true;
    roomGroup.add(ceilingMesh);

    // Thick Japanese Wooden Grid Beams (Cast and Receive Dynamic Sunlight Shadows)
    const beamThickness = 0.12;
    const beamWidth = 0.10;
    for (let c = -1.6; c <= 1.6; c += 0.8) {
      const beamX = new THREE.Mesh(new THREE.BoxGeometry(roomW, beamThickness, beamWidth), matWoodAmber);
      beamX.position.set(0, roomH - beamThickness / 2, c);
      beamX.castShadow = true;
      beamX.receiveShadow = true;
      roomGroup.add(beamX);

      const beamZ = new THREE.Mesh(new THREE.BoxGeometry(beamWidth, beamThickness, roomL), matWoodAmber);
      beamZ.position.set(c, roomH - beamThickness / 2, 0);
      beamZ.castShadow = true;
      beamZ.receiveShadow = true;
      roomGroup.add(beamZ);
    }

    // Japanese Paper Lamp
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, roomH - 0.3, 0);

    const lampOuterFrame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.65), matWoodAmber);
    lampOuterFrame.castShadow = true;
    lampOuterFrame.receiveShadow = true;
    lampGroup.add(lampOuterFrame);

    const lampPaper = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.6), matShojiPaper);
    lampPaper.castShadow = true;
    lampPaper.receiveShadow = true;
    lampPaper.position.y = -0.02;
    lampGroup.add(lampPaper);

    roomGroup.add(lampGroup);

    // ==========================================
    // 3. FRONT ELEVATION: CLEAN SHELVES & CLOSET FRAME A
    // ==========================================

    // --- LEFT BACK WALL: OPEN MULTI-COMPARTMENT BOOKCASE WITH BOOKS ---
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(-1.4, 0, -roomL / 2 + 0.35);

    // Bookcase Outer Frame & Back Panel
    const shelfMat = matWoodAmber;
    const shelfBackMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.7 });

    // Outer Frame (Top, Bottom, Left, Right)
    const topPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.35), shelfMat);
    topPanel.position.set(0, 1.28, 0);
    shelfGroup.add(topPanel);

    const bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.35), shelfMat);
    bottomPanel.position.set(0, 0.02, 0);
    bottomPanel.castShadow = true;
    shelfGroup.add(bottomPanel);

    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.22, 0.35), shelfMat);
    leftPanel.position.set(-0.53, 0.65, 0);
    shelfGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.22, 0.35), shelfMat);
    rightPanel.position.set(0.53, 0.65, 0);
    shelfGroup.add(rightPanel);

    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.22, 0.02), shelfBackMat);
    backPanel.position.set(0, 0.65, -0.165);
    shelfGroup.add(backPanel);

    // Inner Horizontal Shelves (3 tiers)
    const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.33), shelfMat);
    shelf1.position.set(0, 0.34, 0.01);
    shelfGroup.add(shelf1);

    const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.33), shelfMat);
    shelf2.position.set(0, 0.66, 0.01);
    shelfGroup.add(shelf2);

    const shelf3 = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.33), shelfMat);
    shelf3.position.set(0, 0.98, 0.01);
    shelfGroup.add(shelf3);

    // Vertical Compartment Dividers
    const div1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.31), shelfMat);
    div1.position.set(-0.1, 0.185, 0.01);
    shelfGroup.add(div1);

    const div2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.31), shelfMat);
    div2.position.set(0.15, 0.50, 0.01);
    shelfGroup.add(div2);

    const div3 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.31), shelfMat);
    div3.position.set(-0.15, 0.82, 0.01);
    shelfGroup.add(div3);

    // --- COLORFUL 3D BOOKS INSIDE COMPARTMENTS ---
    const bookColors = [
      0xdc2626, 0x2563eb, 0x16a34a, 0xca8a04, 0x9333ea,
      0x0d9488, 0xea580c, 0xf8fafc, 0x0284c7, 0xec4899,
    ];
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.9 });

    const createBook = (w: number, h: number, d: number, colorHex: number) => {
      const bGroup = new THREE.Group();
      const coverMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
      const cover = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), coverMat);
      bGroup.add(cover);
      // Paper block inside
      const pages = new THREE.Mesh(new THREE.BoxGeometry(w - 0.006, h - 0.01, d - 0.01), paperMat);
      pages.position.set(0, 0, 0.004);
      bGroup.add(pages);
      return bGroup;
    };

    // TIER 1 (Bottom shelf): Standing manga volumes (Left) + Horizontal stack (Right)
    const t1LeftX = [-0.46, -0.42, -0.38, -0.34, -0.30, -0.26, -0.22, -0.18, -0.14];
    t1LeftX.forEach((xPos, idx) => {
      const bHeight = 0.21 + (idx % 3) * 0.015;
      const bk = createBook(0.032, bHeight, 0.22, bookColors[idx % bookColors.length]);
      bk.position.set(xPos, 0.045 + bHeight / 2, 0.02);
      shelfGroup.add(bk);
    });

    // Tier 1 Right: Stacked Horizontal Textbooks
    let stackY = 0.045;
    [
      { w: 0.24, h: 0.045, d: 0.22, c: 0x1e3a8a },
      { w: 0.22, h: 0.04, d: 0.20, c: 0xb91c1c },
      { w: 0.20, h: 0.04, d: 0.19, c: 0x047857 },
      { w: 0.18, h: 0.035, d: 0.18, c: 0x7c2d12 },
    ].forEach((stk) => {
      const bk = createBook(stk.w, stk.h, stk.d, stk.c);
      bk.position.set(0.32, stackY + stk.h / 2, 0.02);
      shelfGroup.add(bk);
      stackY += stk.h;
    });

    // TIER 2 (Middle shelf): Doraemon Manga Collection (Left) + Leaning Books (Right)
    const t2LeftX = [-0.47, -0.43, -0.39, -0.35, -0.31, -0.27, -0.23, -0.19, -0.15, -0.11, -0.07, -0.03, 0.01, 0.05, 0.09];
    t2LeftX.forEach((xPos, idx) => {
      const cHex = idx % 2 === 0 ? 0x0284c7 : (idx % 3 === 0 ? 0xdc2626 : 0xf8fafc);
      const bk = createBook(0.032, 0.22, 0.21, cHex);
      bk.position.set(xPos, 0.365 + 0.11, 0.02);
      shelfGroup.add(bk);
    });

    // Tier 2 Right: Leaning books
    [
      { x: 0.22, c: 0x4338ca, rot: 0 },
      { x: 0.26, c: 0x059669, rot: 0 },
      { x: 0.30, c: 0xd97706, rot: 0 },
      { x: 0.36, c: 0xdc2626, rot: -0.22 },
      { x: 0.43, c: 0x7e22ce, rot: -0.25 },
    ].forEach((bInfo) => {
      const bk = createBook(0.032, 0.23, 0.21, bInfo.c);
      bk.position.set(bInfo.x, 0.365 + 0.115, 0.02);
      bk.rotation.z = bInfo.rot;
      shelfGroup.add(bk);
    });

    // TIER 3 (Upper shelf): Storybooks & Notebook Binders
    const t3X = [-0.46, -0.42, -0.38, -0.34, -0.30, -0.26, -0.22, -0.18];
    t3X.forEach((xPos, idx) => {
      const bk = createBook(0.034, 0.23, 0.22, bookColors[(idx * 3) % bookColors.length]);
      bk.position.set(xPos, 0.685 + 0.115, 0.02);
      shelfGroup.add(bk);
    });

    // Tier 3 Right: Binders
    [-0.10, -0.06, -0.02, 0.02, 0.06, 0.10, 0.14, 0.18, 0.22, 0.26, 0.30].forEach((xPos, idx) => {
      const bk = createBook(0.035, 0.24, 0.23, idx % 2 === 0 ? 0xf8fafc : 0xe2e8f0);
      bk.position.set(xPos, 0.685 + 0.12, 0.02);
      shelfGroup.add(bk);
    });

    // Globe on top surface (Sitting flat at y = 1.30)
    const globeGroup = new THREE.Group();
    globeGroup.position.set(-0.25, 1.30, 0);

    const globeStandBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 16), matMetalLegs);
    globeStandBase.position.y = 0.01;
    globeGroup.add(globeStandBase);

    const globeRod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12), matMetalLegs);
    globeRod.position.y = 0.07;
    globeGroup.add(globeRod);

    const globeArc = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.01, 8, 24, Math.PI), matMetalLegs);
    globeArc.position.y = 0.20;
    globeArc.rotation.z = -Math.PI / 4;
    globeGroup.add(globeArc);

    const globeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), matGlobeOcean);
    globeSphere.position.set(0, 0.20, 0);
    globeGroup.add(globeSphere);
    shelfGroup.add(globeGroup);

    // Red Twin-Bell Alarm Clock on top surface (Sitting flat at y = 1.30)
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0.28, 1.30, 0.05);

    // Clock Body (Radius = 0.065, sits at y = 0.075 so bottom touches y=0)
    const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.035, 24), matAlarmRed);
    clockBody.rotation.x = Math.PI / 2;
    clockBody.position.y = 0.075;
    clockGroup.add(clockBody);

    const clockFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.058, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    clockFace.position.set(0, 0.075, 0.018);
    clockGroup.add(clockFace);

    // Clock Hands (Hour & Minute)
    const handMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.025, 0.002), handMat);
    hourHand.position.set(0.008, 0.082, 0.020);
    hourHand.rotation.z = -Math.PI / 4;
    clockGroup.add(hourHand);

    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.038, 0.002), handMat);
    minuteHand.position.set(0, 0.088, 0.020);
    minuteHand.rotation.z = Math.PI / 6;
    clockGroup.add(minuteHand);

    // Twin Bells on top
    const bellMat = matMetalLegs;
    const bellLeft = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), bellMat);
    bellLeft.position.set(-0.045, 0.14, 0);
    clockGroup.add(bellLeft);

    const bellRight = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), bellMat);
    bellRight.position.set(0.045, 0.14, 0);
    clockGroup.add(bellRight);

    // Clock Legs sitting on table
    const legLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03), bellMat);
    legLeft.position.set(-0.035, 0.012, 0);
    legLeft.rotation.z = Math.PI / 6;
    clockGroup.add(legLeft);

    const legRight = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03), bellMat);
    legRight.position.set(0.035, 0.012, 0);
    legRight.rotation.z = -Math.PI / 6;
    clockGroup.add(legRight);

    shelfGroup.add(clockGroup);

    roomGroup.add(shelfGroup);

    // --- RIGHT BACK WALL: CLOSET DOOR FRAME A & PANEL B ---
    const closetGroup = new THREE.Group();
    closetGroup.position.set(0.9, 0, -roomL / 2 + 0.15);

    // Closet Outer Frame (Hollowed frame)
    const closetFrameMat = matWoodAmber;
    const closetTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.55), closetFrameMat);
    closetTop.position.set(0, 2.36, 0.275);
    closetGroup.add(closetTop);

    const closetBottom = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.55), closetFrameMat);
    closetBottom.position.set(0, 0.04, 0.275);
    closetGroup.add(closetBottom);

    const closetLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.55), closetFrameMat);
    closetLeft.position.set(-1.06, 1.2, 0.275);
    closetGroup.add(closetLeft);

    const closetRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.55), closetFrameMat);
    closetRight.position.set(1.06, 1.2, 0.275);
    closetGroup.add(closetRight);

    // Inner Dark Cavity & Middle Shelf
    const closetCavity = new THREE.Mesh(
      new THREE.BoxGeometry(2.08, 2.24, 0.48),
      new THREE.MeshStandardMaterial({ color: 0x3d200e, roughness: 0.9 })
    );
    closetCavity.position.set(0, 1.2, 0.24);
    closetGroup.add(closetCavity);

    const cShelf = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.05, 0.48), closetFrameMat);
    cShelf.position.set(0, 1.15, 0.24);
    closetGroup.add(cShelf);

    // Helper to create a complete Japanese Fusuma Sliding Door
    const createFusumaDoor = (handleXOffset: number) => {
      const doorGroup = new THREE.Group();

      // White paper main panel
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.06, 2.24, 0.025), matClosetWhite);
      doorGroup.add(panel);

      // Blue horizontal accent stripe (Panel B)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.062, 0.42, 0.028), matClosetBlue);
      stripe.position.set(0, 0, 0.002);
      doorGroup.add(stripe);

      // Dark Wood outer trim border around Fusuma door
      const borderMat = matWoodDark;
      const bTop = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.03, 0.03), borderMat);
      bTop.position.set(0, 1.105, 0);
      doorGroup.add(bTop);

      const bBottom = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.03, 0.03), borderMat);
      bBottom.position.set(0, -1.105, 0);
      doorGroup.add(bBottom);

      const bL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.24, 0.03), borderMat);
      bL.position.set(-0.515, 0, 0);
      doorGroup.add(bL);

      const bR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.24, 0.03), borderMat);
      bR.position.set(0.515, 0, 0);
      doorGroup.add(bR);

      // Recessed Black Circular Handle (Hikite)
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.01, 20),
        new THREE.MeshBasicMaterial({ color: 0x1e1e1e })
      );
      handle.rotation.x = Math.PI / 2;
      handle.position.set(handleXOffset, 0, 0.018);
      doorGroup.add(handle);

      return doorGroup;
    };

    // Left Fusuma Door (Closed on rear sliding track)
    const fDoorLeft = createFusumaDoor(0.38);
    fDoorLeft.position.set(-0.51, 1.2, 0.50);
    closetGroup.add(fDoorLeft);

    // Right Fusuma Door (Closed on front sliding track)
    const fDoorRight = createFusumaDoor(-0.38);
    fDoorRight.position.set(0.51, 1.2, 0.53);
    closetGroup.add(fDoorRight);

    roomGroup.add(closetGroup);

    // ==========================================
    // 4. SIDE ELEVATION: CLEAN JAPANESE 2-PANEL SLIDING WINDOW & LOW TABLE
    // ==========================================
    const winGroup = new THREE.Group();
    winGroup.position.set(-roomW / 2 + 0.04, 1.6, 0);

    // Outer Hollow Window Sill Frame
    const sillDepth = 0.14;
    const sillThickness = 0.06;
    const winH = 1.6;
    const winW = 2.4;

    const sillTop = new THREE.Mesh(new THREE.BoxGeometry(sillDepth, sillThickness, winW), matWoodAmber);
    sillTop.position.y = winH / 2 - sillThickness / 2;
    winGroup.add(sillTop);

    const sillBottom = new THREE.Mesh(new THREE.BoxGeometry(sillDepth, sillThickness, winW), matWoodAmber);
    sillBottom.position.y = -winH / 2 + sillThickness / 2;
    winGroup.add(sillBottom);

    const sillLeft = new THREE.Mesh(new THREE.BoxGeometry(sillDepth, winH, sillThickness), matWoodAmber);
    sillLeft.position.z = -winW / 2 + sillThickness / 2;
    winGroup.add(sillLeft);

    const sillRight = new THREE.Mesh(new THREE.BoxGeometry(sillDepth, winH, sillThickness), matWoodAmber);
    sillRight.position.z = winW / 2 - sillThickness / 2;
    winGroup.add(sillRight);

    // Glass Material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      roughness: 0.05,
      transmission: 0.9,
    });

    // Outdoor Sky Backdrop (Pushed back further)
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x7ec8f2 });
    const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), skyMat);
    skyPlane.position.set(-4.0, 0, 0);
    skyPlane.rotation.y = Math.PI / 2;
    winGroup.add(skyPlane);

    // Celestial Objects: Sun, Crescent Moon, and Twinkling Night Stars
    const sunGroup = new THREE.Group();
    sunGroup.position.set(-3.7, 2.4, -1.6);

    const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff066, transparent: true, opacity: 1 });
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), sunCoreMat);
    sunGroup.add(sunCore);

    const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.35 });
    const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), sunGlowMat);
    sunGroup.add(sunGlow);

    winGroup.add(sunGroup);

    // Crescent Moon Group (Night Sky)
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-3.7, 2.5, -0.6);

    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const moonCore = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), moonMat);
    moonGroup.add(moonCore);

    const moonMaskMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0 });
    const moonMask = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 24), moonMaskMat);
    moonMask.position.set(-0.09, 0.04, 0.09);
    moonGroup.add(moonMask);

    const moonGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
    const moonGlow = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), moonGlowMat);
    moonGroup.add(moonGlow);

    winGroup.add(moonGroup);

    // Twinkling Stars (Night Sky Field)
    const starsGroup = new THREE.Group();
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });

    const starParticles: Array<{ mesh: THREE.Mesh; phase: number; baseRadius: number }> = [];
    for (let i = 0; i < 45; i++) {
      const sRadius = 0.014 + Math.random() * 0.018;
      const starMesh = new THREE.Mesh(new THREE.SphereGeometry(sRadius, 8, 8), starMat);
      const sy = 0.4 + Math.random() * 3.4;
      const sz = -3.8 + Math.random() * 7.6;
      starMesh.position.set(-3.68, sy, sz);
      starsGroup.add(starMesh);
      starParticles.push({
        mesh: starMesh,
        phase: Math.random() * Math.PI * 2,
        baseRadius: sRadius,
      });
    }

    winGroup.add(starsGroup);

    // 1. Rich Dense Fluffy Anime Cloudscape covering the entire sky backdrop plane
    const cloudGroup = new THREE.Group();
    cloudGroup.position.set(-3.2, 0, 0);

    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });

    const cloudClusters = [
      // Upper Sky Row (Y = 3.2 to 4.2) - High altitude fluffy clouds
      { x: 0.1, y: 3.8, z: -5.5, s: 0.95 },
      { x: -0.1, y: 3.5, z: -3.2, s: 0.85 },
      { x: 0.2, y: 3.9, z: -0.8, s: 1.05 },
      { x: -0.05, y: 3.6, z: 1.8, s: 0.90 },
      { x: 0.15, y: 3.7, z: 4.2, s: 0.85 },
      { x: -0.1, y: 4.1, z: 6.0, s: 0.95 },

      // Mid-Upper Sky Row (Y = 2.2 to 2.9) - Main clouds visible through window
      { x: 0.05, y: 2.6, z: -6.2, s: 0.80 },
      { x: -0.15, y: 2.3, z: -4.4, s: 0.90 },
      { x: 0.25, y: 2.7, z: -2.6, s: 1.05 },
      { x: 0, y: 2.4, z: -0.5, s: 0.98 },
      { x: -0.2, y: 2.8, z: 1.2, s: 0.88 },
      { x: 0.1, y: 2.3, z: 3.1, s: 0.92 },
      { x: -0.05, y: 2.5, z: 5.2, s: 0.85 },

      // Mid Sky Row (Y = 1.3 to 2.1) - Center & Lower window view
      { x: 0.2, y: 1.8, z: -5.0, s: 0.85 },
      { x: -0.1, y: 1.5, z: -3.0, s: 0.78 },
      { x: 0.15, y: 1.9, z: -1.2, s: 0.92 },
      { x: -0.2, y: 1.4, z: 0.6, s: 0.85 },
      { x: 0.05, y: 1.7, z: 2.4, s: 0.90 },
      { x: -0.15, y: 1.5, z: 4.5, s: 0.82 },

      // Horizon Low Sky Row (Y = 0.6 to 1.2) - Low sky clouds
      { x: 0.1, y: 0.9, z: -4.0, s: 0.70 },
      { x: -0.05, y: 1.1, z: -1.8, s: 0.75 },
      { x: 0.2, y: 0.8, z: 1.5, s: 0.72 },
      { x: -0.1, y: 1.0, z: 3.8, s: 0.68 },
    ];

    const cloudDriftObjects: Array<{ group: THREE.Group; baseZ: number; speed: number }> = [];

    cloudClusters.forEach((cData, idx) => {
      const cGrp = new THREE.Group();
      cGrp.position.set(cData.x, cData.y, cData.z);
      cGrp.scale.setScalar(cData.s);

      // Core central sphere
      cGrp.add(new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), cloudMat));

      // Surrounding overlapping spheres to create fluffy cumulus cloud shape
      const bumps = [
        { x: 0.30, y: 0.08, z: 0.05, r: 0.28 },
        { x: -0.32, y: -0.05, z: -0.05, r: 0.26 },
        { x: 0.15, y: 0.18, z: -0.10, r: 0.24 },
        { x: -0.15, y: 0.16, z: 0.08, r: 0.25 },
        { x: 0.45, y: -0.08, z: 0, r: 0.20 },
        { x: -0.48, y: -0.09, z: 0, r: 0.19 },
      ];

      bumps.forEach((b) => {
        const bMesh = new THREE.Mesh(new THREE.SphereGeometry(b.r, 14, 14), cloudMat);
        bMesh.position.set(b.x, b.y, b.z);
        cGrp.add(bMesh);
      });

      cloudGroup.add(cGrp);
      cloudDriftObjects.push({
        group: cGrp,
        baseZ: cData.z,
        speed: 0.0004 + (idx % 3) * 0.0002,
      });
    });

    winGroup.add(cloudGroup);

    // 2. Lush Green Tree Foliage (Pushed further out from window)
    const treeGroup = new THREE.Group();
    treeGroup.position.set(-2.0, -3, 1.0);
    treeGroup.scale.setScalar(1.3);

    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x54361e, roughness: 0.9 });

    // Trunk top ends at y=1.3 inside the foliage so it never pokes out the top into the sky
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.0), trunkMat);
    trunk.position.y = -0.7;
    treeGroup.add(trunk);

    [
      { x: 0, y: 1.3, z: 0, s: 0.6, m: leafMat1 },
      { x: 0.2, y: 1.45, z: 0.2, s: 0.48, m: leafMat2 },
      { x: -0.2, y: 1.25, z: -0.12, s: 0.5, m: leafMat1 },
      { x: 0.12, y: 1.6, z: -0.12, s: 0.42, m: leafMat2 },
    ].forEach((f) => {
      const fMesh = new THREE.Mesh(new THREE.SphereGeometry(f.s, 16, 16), f.m);
      fMesh.position.set(f.x, f.y, f.z);
      treeGroup.add(fMesh);
    });

    winGroup.add(treeGroup);

    // 3. Utility Pole & Power Wires (Pushed further out from window)
    const poleGroup = new THREE.Group();
    poleGroup.position.set(-1.8, -3, -1.2);
    poleGroup.scale.setScalar(1.2);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const poleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.5), poleMat);
    poleBody.position.y = 1.0;
    poleGroup.add(poleBody);

    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), poleMat);
    crossArm.position.set(0, 1.4, 0);
    poleGroup.add(crossArm);

    // Power Wires (Shortened horizontal wire span)
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 2.2), wireMat);
    wire1.position.set(0, 1.4, 0.2);
    wire1.rotation.x = Math.PI / 2;
    poleGroup.add(wire1);

    const wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 2.2), wireMat);
    wire2.position.set(0, 1.4, -0.2);
    wire2.rotation.x = Math.PI / 2;
    poleGroup.add(wire2);

    winGroup.add(poleGroup);

    roomGroup.add(winGroup);

    // Low Table underneath window
    const lowTableGroup = new THREE.Group();
    lowTableGroup.position.set(-1.8, 0, 0.4);

    const lowTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.65), matTableMahogany);
    lowTop.position.y = 0.36;
    lowTop.castShadow = true;
    lowTableGroup.add(lowTop);

    [
      { x: -0.43, z: -0.26 },
      { x: 0.43, z: -0.26 },
      { x: -0.43, z: 0.26 },
      { x: 0.43, z: 0.26 },
    ].forEach((lp) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.34), matMetalLegs);
      leg.position.set(lp.x, 0.17, lp.z);
      lowTableGroup.add(leg);
    });

    // Low Table Items: Glass of Iced Water, Japanese Teapot, and Potted Plant
    const glassCupGroup = new THREE.Group();
    glassCupGroup.position.set(-0.25, 0.385, -0.12);

    const glassBody = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.11, 20), matGlassWater);
    glassBody.position.y = 0.055;
    glassCupGroup.add(glassBody);

    const waterLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.034, 0.08, 20), matWaterLiquid);
    waterLiquid.position.y = 0.045;
    glassCupGroup.add(waterLiquid);

    const ice1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.015), matGlassWater);
    ice1.position.set(0.01, 0.075, 0.008);
    ice1.rotation.set(0.2, 0.4, 0.1);
    glassCupGroup.add(ice1);

    const ice2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.014), matGlassWater);
    ice2.position.set(-0.012, 0.070, -0.006);
    ice2.rotation.set(0.5, 0.1, 0.3);
    glassCupGroup.add(ice2);

    const strawMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.15, 12), strawMat);
    straw.position.set(0.012, 0.075, 0);
    straw.rotation.z = -Math.PI / 8;
    glassCupGroup.add(straw);

    lowTableGroup.add(glassCupGroup);

    // Japanese Terracotta Teapot (Kyusu) on Low Table
    const teapotGroup = new THREE.Group();
    teapotGroup.position.set(0.20, 0.385, 0.10);

    const teapotBody = new THREE.Mesh(new THREE.SphereGeometry(0.065, 20, 16), matTerracotta);
    teapotBody.scale.set(1.1, 0.75, 1.1);
    teapotBody.position.y = 0.045;
    teapotGroup.add(teapotBody);

    const teapotLid = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 20), matTerracotta);
    teapotLid.position.y = 0.092;
    teapotGroup.add(teapotLid);

    const teapotKnob = new THREE.Mesh(new THREE.SphereGeometry(0.01, 12, 12), matWoodDark);
    teapotKnob.position.y = 0.104;
    teapotGroup.add(teapotKnob);

    const teapotSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.016, 0.06, 16), matTerracotta);
    teapotSpout.position.set(-0.07, 0.06, 0);
    teapotSpout.rotation.z = Math.PI / 3;
    teapotGroup.add(teapotSpout);

    const teapotHandle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 16, 24, Math.PI * 1.1), matTerracotta);
    teapotHandle.position.set(0.062, 0.045, 0);
    teapotHandle.rotation.z = -Math.PI * 0.55;
    teapotGroup.add(teapotHandle);

    lowTableGroup.add(teapotGroup);

    // Potted Succulent Plant on Low Table
    const tablePlantGroup = new THREE.Group();
    tablePlantGroup.position.set(-0.25, 0.385, 0.15);

    const tablePot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 16), matCeramicWhite);
    tablePot.position.y = 0.035;
    tablePlantGroup.add(tablePot);

    const tableSoil = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.008, 16), matWoodDark);
    tableSoil.position.y = 0.062;
    tablePlantGroup.add(tableSoil);

    [
      { x: 0, y: 0.09, z: 0, r: 0.028, m: matLeafDark },
      { x: 0.018, y: 0.10, z: 0.012, r: 0.022, m: matLeafLight },
      { x: -0.018, y: 0.095, z: -0.01, r: 0.024, m: matLeafDark },
      { x: -0.01, y: 0.11, z: 0.015, r: 0.02, m: matLeafLight },
    ].forEach((p) => {
      const leafBall = new THREE.Mesh(new THREE.SphereGeometry(p.r, 12, 12), p.m);
      leafBall.position.set(p.x, p.y, p.z);
      tablePlantGroup.add(leafBall);
    });

    lowTableGroup.add(tablePlantGroup);

    roomGroup.add(lowTableGroup);

    // Large Potted Houseplant (Placed in center gap between Bookcase and Closet on Back Wall)
    const cornerPlantGroup = new THREE.Group();
    cornerPlantGroup.position.set(-0.52, 0, -roomL / 2 + 0.35);

    const planterPot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.38, 24), matCeramicWhite);
    planterPot.position.y = 0.19;
    planterPot.castShadow = true;
    cornerPlantGroup.add(planterPot);

    // Soil is placed slightly inset inside the pot rim (y=0.355, top face=0.365) to prevent Z-fighting flickering
    const potSoil = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.155, 0.02, 24), matWoodDark);
    potSoil.position.y = 0.355;
    cornerPlantGroup.add(potSoil);

    [
      { leafX: 0.12, leafY: 0.72, leafZ: -0.06, sizeX: 0.22, sizeZ: 0.30, rotX: 0.3, rotZ: -0.4, m: matLeafDark },
      { leafX: -0.15, leafY: 0.78, leafZ: 0.08, sizeX: 0.24, sizeZ: 0.34, rotX: -0.2, rotZ: 0.45, m: matLeafLight },
      { leafX: 0.06, leafY: 0.62, leafZ: 0.16, sizeX: 0.20, sizeZ: 0.26, rotX: 0.4, rotZ: -0.2, m: matLeafLight },
      { leafX: -0.10, leafY: 0.66, leafZ: -0.14, sizeX: 0.20, sizeZ: 0.28, rotX: -0.35, rotZ: 0.3, m: matLeafDark },
      { leafX: 0.0, leafY: 0.84, leafZ: 0.0, sizeX: 0.22, sizeZ: 0.32, rotX: 0.1, rotZ: -0.1, m: matLeafLight },
    ].forEach((st) => {
      // Connect stem from soil (0, 0.365, 0) to leaf base (underneath leaf, so it never pokes through)
      const attachY = st.leafY - 0.025;
      const startVec = new THREE.Vector3(0, 0.365, 0);
      const endVec = new THREE.Vector3(st.leafX, attachY, st.leafZ);
      const midVec = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
      const stemLen = startVec.distanceTo(endVec);

      const pStem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, stemLen, 12), matLeafDark);
      pStem.position.copy(midVec);
      pStem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endVec.clone().sub(startVec).normalize());
      pStem.castShadow = true;
      cornerPlantGroup.add(pStem);

      // Organic curved leaf (Extruded/scaled hemisphere dome shape)
      const leafMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), st.m);
      leafMesh.scale.set(st.sizeX, 0.06, st.sizeZ);
      leafMesh.position.set(st.leafX, st.leafY, st.leafZ);
      leafMesh.rotation.set(st.rotX, 0, st.rotZ);
      leafMesh.castShadow = true;
      cornerPlantGroup.add(leafMesh);
    });

    roomGroup.add(cornerPlantGroup);

    // Japanese Wall Calendar (Hanging on Back Wall between Bookcase & Closet)
    const wallPosterGroup = new THREE.Group();
    wallPosterGroup.position.set(-0.8, 1.85, -roomL / 2 + 0.08);

    const posterBack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.48, 0.006), matPaperWhite);
    posterBack.castShadow = true;
    wallPosterGroup.add(posterBack);

    const posterHeader = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.008), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 }));
    posterHeader.position.set(0, 0.15, 0.002);
    wallPosterGroup.add(posterHeader);

    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(0.05, 20), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    sunDisc.position.set(0, 0.15, 0.007);
    wallPosterGroup.add(sunDisc);

    const gridLineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    for (let gy = -0.02; gy >= -0.18; gy -= 0.04) {
      const gLine = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.002, 0.008), gridLineMat);
      gLine.position.set(0, gy, 0.004);
      wallPosterGroup.add(gLine);
    }

    roomGroup.add(wallPosterGroup);

    // Nobita's Japanese Red Randoseru Backpack (Resting on Tatami floor beside desk)
    const backpackGroup = new THREE.Group();
    backpackGroup.position.set(roomW / 2 - 0.50, 0.15, 0.45);
    backpackGroup.rotation.y = -Math.PI / 6;

    const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.30, 0.16), matRandoseruRed);
    packBody.castShadow = true;
    backpackGroup.add(packBody);

    const packFlap = new THREE.Mesh(new THREE.BoxGeometry(0.246, 0.31, 0.02), matRandoseruRed);
    packFlap.position.set(0, 0.005, 0.075);
    backpackGroup.add(packFlap);

    const buckleL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.035, 0.015), matBrass);
    buckleL.position.set(-0.06, -0.11, 0.086);
    backpackGroup.add(buckleL);

    const buckleR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.035, 0.015), matBrass);
    buckleR.position.set(0.06, -0.11, 0.086);
    backpackGroup.add(buckleR);

    roomGroup.add(backpackGroup);

    // ==========================================
    // 5. RIGHT WALL: NOBITA'S DESK & CHAIR
    // ==========================================
    const deskGroup = new THREE.Group();
    deskGroup.position.set(roomW / 2 - 0.65, 0, -0.6);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.6), matWoodAmber);
    deskTop.position.y = 0.92;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    const drawerBlock = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.84, 0.52), matWoodAmber);
    drawerBlock.position.set(0, 0.46, 0.5);
    drawerBlock.castShadow = true;
    deskGroup.add(drawerBlock);

    for (let dr = 0.2; dr <= 0.72; dr += 0.25) {
      const dHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.15), matWoodDark);
      dHandle.position.set(-0.46, dr, 0.5);
      deskGroup.add(dHandle);
    }

    const legLeft1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.08), matWoodDark);
    legLeft1.position.set(0.4, 0.46, -0.7);
    deskGroup.add(legLeft1);

    const legLeft2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.08), matWoodDark);
    legLeft2.position.set(-0.4, 0.46, -0.7);
    deskGroup.add(legLeft2);

    // Ceramic Tea/Coffee Mug on Desk
    const deskMug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.09, 16), matCeramicWhite);
    deskMug.position.set(0.18, 0.96 + 0.045, 0.28);
    deskMug.castShadow = true;
    deskGroup.add(deskMug);

    const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 12, 16, Math.PI), matCeramicWhite);
    mugHandle.position.set(0.22, 0.96 + 0.045, 0.28);
    mugHandle.rotation.y = Math.PI / 2;
    deskGroup.add(mugHandle);

    // MONO Eraser Block on Desk
    const eraser = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.06), matClosetBlue);
    eraser.position.set(-0.15, 0.963 + 0.006, -0.22);
    eraser.rotation.y = 0.3;
    deskGroup.add(eraser);

    // ==========================================
    // STUDY DESK ACCESSORIES (BÀN HỌC NOBITA)
    // ==========================================

    // 1. Classic Japanese Anime Desk Lamp (Hierarchical Kinematic Chain - 100% Seamless Joints)
    const deskLamp = new THREE.Group();
    deskLamp.position.set(0.28, 0.96, -0.45);
    deskLamp.scale.setScalar(1.3);

    // Round Base (Glossy Emerald Green & Brass Trim)
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.085, 0.02, 32), matLampGreen);
    lampBase.position.y = 0.01;
    deskLamp.add(lampBase);

    const baseBrassRing = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.005, 16, 32), matBrass);
    baseBrassRing.position.y = 0.018;
    baseBrassRing.rotation.x = Math.PI / 2;
    deskLamp.add(baseBrassRing);

    // Red Push Button Toggle Switch on Base
    const switchBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.014, 16), matSwitchRed);
    switchBtn.position.set(0.04, 0.025, 0.03);
    deskLamp.add(switchBtn);

    // Base Brass Socket
    const baseSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.03, 16), matBrass);
    baseSocket.position.y = 0.035;
    deskLamp.add(baseSocket);

    // --- KINEMATIC CHAIN SEGMENT 1: LOWER STEM ---
    const lowerStemGroup = new THREE.Group();
    lowerStemGroup.position.set(0, 0.045, 0);
    lowerStemGroup.rotation.z = Math.PI / 16; // Slight 11 deg tilt to left (-X)

    const lowerStemLength = 0.36;
    const lowerStemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, lowerStemLength, 16), matChrome);
    lowerStemMesh.position.set(0, lowerStemLength / 2, 0);
    lowerStemGroup.add(lowerStemMesh);

    // --- KINEMATIC CHAIN SEGMENT 2: MIDDLE ELBOW JOINT ---
    const elbowGroup = new THREE.Group();
    elbowGroup.position.set(0, lowerStemLength, 0); // Positioned EXACTLY at top of lower stem!

    const elbowJointMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.028, 16), matBrass);
    elbowJointMesh.rotation.x = Math.PI / 2;
    elbowGroup.add(elbowJointMesh);

    const elbowKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.015, 16), matBrass);
    elbowKnob.position.set(0, 0, 0.02);
    elbowKnob.rotation.x = Math.PI / 2;
    elbowGroup.add(elbowKnob);

    // --- KINEMATIC CHAIN SEGMENT 3: UPPER ARM ---
    const upperArmGroup = new THREE.Group();
    // Rotate upper arm down & forward towards desktop (-70 degrees relative to lower stem)
    upperArmGroup.rotation.z = -Math.PI / 2.6;

    const upperArmLength = 0.22;
    const upperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, upperArmLength, 16), matChrome);
    upperArmMesh.position.set(0, upperArmLength / 2, 0); // Origin sits EXACTLY at the elbow joint!
    upperArmGroup.add(upperArmMesh);

    // --- KINEMATIC CHAIN SEGMENT 4: HEAD SHADE GROUP ---
    const shadeGroup = new THREE.Group();
    shadeGroup.position.set(0, upperArmLength, 0); // Positioned EXACTLY at tip of upper arm!
    // Counter-rotate shade group so shade opening points STRAIGHT DOWN to desktop!
    shadeGroup.rotation.z = -(lowerStemGroup.rotation.z + upperArmGroup.rotation.z);

    // Brass Shade Neck Cap
    const shadeNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.014, 0.025, 16), matBrass);
    shadeNeck.position.set(0, 0.01, 0);
    shadeGroup.add(shadeNeck);

    // Classic Dome Lamp Shade (Glossy Emerald Green, pointing straight DOWN)
    const lampHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.085, 0.11, 28, 1, true),
      matLampGreen
    );
    lampHead.position.set(0, -0.045, 0);
    shadeGroup.add(lampHead);

    // Chrome Rim Border around bottom opening
    const shadeRim = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.004, 16, 32), matChrome);
    shadeRim.position.set(0, -0.10, 0);
    shadeRim.rotation.x = Math.PI / 2;
    shadeGroup.add(shadeRim);

    // Frosted Light Bulb Inside (Off state - Tắt đèn)
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xdedede,
      emissive: new THREE.Color(0x000000),
      roughness: 0.4,
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), bulbMat);
    bulb.position.set(0, -0.06, 0);
    shadeGroup.add(bulb);

    // Desk Lamp Spotlight (Intensity = 0.0: Tắt hoàn toàn ánh sáng đèn bàn)
    const deskSpotLight = new THREE.SpotLight(0xffc864, 0.0, 1.8, Math.PI / 4.2, 0.4, 1.0);
    deskSpotLight.position.set(0, -0.06, 0);
    deskSpotLight.target.position.set(0, -0.5, 0);
    deskSpotLight.castShadow = true;
    shadeGroup.add(deskSpotLight);
    shadeGroup.add(deskSpotLight.target);

    upperArmGroup.add(shadeGroup);
    elbowGroup.add(upperArmGroup);
    lowerStemGroup.add(elbowGroup);
    deskLamp.add(lowerStemGroup);

    deskGroup.add(deskLamp);

    // 2. Open Homework Notebook & Pencil (Rotated 90 deg, Scaled 1.4x)
    const openNotebook = new THREE.Group();
    openNotebook.position.set(-0.05, 0.963, 0.02);
    openNotebook.scale.setScalar(1.4);
    openNotebook.rotation.y = Math.PI / 2; // Rotated 90 degrees for student view

    const nbCover = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.006, 0.22), matClosetBlue);
    openNotebook.add(nbCover);

    const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.20), matPaperWhite);
    pageL.position.set(-0.066, 0.004, 0);
    openNotebook.add(pageL);

    const pageR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.20), matPaperWhite);
    pageR.position.set(0.066, 0.004, 0);
    openNotebook.add(pageR);

    // Notebook printed horizontal rule lines inside page boundaries
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    for (let zPos = -0.07; zPos <= 0.07; zPos += 0.02) {
      const lineL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.001, 0.0015), lineMat);
      lineL.position.set(-0.066, 0.007, zPos);
      openNotebook.add(lineL);

      const lineR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.001, 0.0015), lineMat);
      lineR.position.set(0.066, 0.007, zPos);
      openNotebook.add(lineR);
    }

    // Real Hexagonal Japanese Yellow Pencil lying flat on notebook page
    const pencilGroup = new THREE.Group();
    pencilGroup.position.set(-0.03, 0.008, 0.02);
    pencilGroup.rotation.x = Math.PI / 2; // Lie flat horizontal on notebook page
    pencilGroup.rotation.y = Math.PI / 6; // Angled naturally on notebook page

    // Hexagonal Yellow Body
    const pencilBody = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.11, 6), matPencilYellow);
    pencilGroup.add(pencilBody);

    // Wood Sharpened Tip
    const woodTipMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.8 });
    const woodTip = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.016, 6), woodTipMat);
    woodTip.position.y = 0.063;
    pencilGroup.add(woodTip);

    // Black Graphite Lead Tip
    const leadMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const leadTip = new THREE.Mesh(new THREE.ConeGeometry(0.0015, 0.005, 6), leadMat);
    leadTip.position.y = 0.0705;
    pencilGroup.add(leadTip);

    // Silver Ferrule Ring
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.008, 12), matChrome);
    ferrule.position.y = -0.059;
    pencilGroup.add(ferrule);

    // Pink Eraser Top
    const pinkEraserMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 });
    const pinkEraser = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.010, 12), pinkEraserMat);
    pinkEraser.position.y = -0.066;
    pencilGroup.add(pinkEraser);

    openNotebook.add(pencilGroup);

    deskGroup.add(openNotebook);

    // 3. Pencil Holder Cup & Stationeries (Scaled 1.4x)
    const penCupGroup = new THREE.Group();
    penCupGroup.position.set(0.32, 0.96, 0.25);
    penCupGroup.scale.setScalar(1.4);

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.11, 16), matCupYellow);
    cup.position.y = 0.055;
    penCupGroup.add(cup);

    // Pens & Pencils standing straight inside cup
    const pen1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16), matGlobeOcean);
    pen1.position.set(-0.012, 0.11, -0.01);
    penCupGroup.add(pen1);

    const pen2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16), matAlarmRed);
    pen2.position.set(0.012, 0.11, 0.01);
    penCupGroup.add(pen2);

    const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.18, 0.025), new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));
    ruler.position.set(0, 0.12, 0);
    penCupGroup.add(ruler);

    deskGroup.add(penCupGroup);

    // 4. Stack of Textbooks on Desk Corner (Rotated 90 deg, Scaled 1.4x)
    const deskBookStack = new THREE.Group();
    deskBookStack.position.set(-0.25, 0.96, 0.45);
    deskBookStack.scale.setScalar(1.4);
    deskBookStack.rotation.y = Math.PI / 2;

    let dStackY = 0;
    [
      { w: 0.24, h: 0.035, d: 0.18, c: 0x1e40af }, // Mathematics (Blue)
      { w: 0.22, h: 0.03, d: 0.17, c: 0x15803d },  // Japanese/Kokugo (Green)
      { w: 0.20, h: 0.028, d: 0.16, c: 0xca8a04 }, // Science (Yellow)
    ].forEach((tb) => {
      const bCover = new THREE.Mesh(new THREE.BoxGeometry(tb.w, tb.h, tb.d), new THREE.MeshStandardMaterial({ color: tb.c, roughness: 0.5 }));
      bCover.position.y = dStackY + tb.h / 2;
      deskBookStack.add(bCover);

      const bPages = new THREE.Mesh(new THREE.BoxGeometry(tb.w - 0.008, tb.h - 0.008, tb.d - 0.01), matPaperWhite);
      bPages.position.set(0, dStackY + tb.h / 2, 0.004);
      deskBookStack.add(bPages);

      dStackY += tb.h;
    });

    deskGroup.add(deskBookStack);

    roomGroup.add(deskGroup);

    // Swivel Chair (Soft Round Anime Cushion & Connected Ergonomic Backrest)
    const chairGroup = new THREE.Group();
    chairGroup.position.set(roomW / 2 - 1.35, 0, -0.5);
    chairGroup.rotation.y = Math.PI / 4;

    // 1. 5-Star Base Hub & Wheels
    const baseCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 24), matMetalLegs);
    baseCenter.position.y = 0.06;
    chairGroup.add(baseCenter);

    for (let w = 0; w < 5; w++) {
      const angle = (w * Math.PI * 2) / 5;
      const legArm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.025, 0.035), matMetalLegs);
      legArm.position.set(Math.cos(angle) * 0.13, 0.06, Math.sin(angle) * 0.13);
      legArm.rotation.y = -angle;
      chairGroup.add(legArm);

      const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), matChairWheel);
      wheel.position.set(Math.cos(angle) * 0.26, 0.024, Math.sin(angle) * 0.26);
      chairGroup.add(wheel);
    }

    // 2. Central Brushed Metal Gas Lift Stem & Control Mechanism Box
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 20), matMetalLegs);
    stem.position.y = 0.23;
    chairGroup.add(stem);

    const mechBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), matMetalLegs);
    mechBox.position.set(0, 0.39, 0);
    chairGroup.add(mechBox);

    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14), matMetalLegs);
    lever.position.set(0.10, 0.38, 0.06);
    lever.rotation.z = Math.PI / 3;
    chairGroup.add(lever);

    // 3. Soft Round Seat Cushion & Fabric Seam Piping Trim Ring
    const seatCushion = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.24, 0.07, 32), matBlueChair);
    seatCushion.position.y = 0.44;
    chairGroup.add(seatCushion);

    const seatPiping = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.012, 16, 32), matChairPiping);
    seatPiping.position.y = 0.44;
    seatPiping.rotation.x = Math.PI / 2;
    chairGroup.add(seatPiping);

    // 4. Backrest Support Rod (L-shaped metal frame)
    const backSupportBar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.16), matMetalLegs);
    backSupportBar.position.set(-0.14, 0.44, 0);
    chairGroup.add(backSupportBar);

    const backUprightBar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.30, 0.035), matMetalLegs);
    backUprightBar.position.set(-0.20, 0.58, 0);
    chairGroup.add(backUprightBar);

    // 5. Backrest Molded Protective Rear Shell
    const backShell = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.39), matChairShell);
    backShell.position.set(-0.245, 0.72, 0);
    chairGroup.add(backShell);

    // Soft Ergonomic Backrest Cushion with Textured Fabric
    const backrestCushion = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.38), matBlueChair);
    backrestCushion.position.set(-0.21, 0.72, 0);
    chairGroup.add(backrestCushion);

    // Soft Rounded Top Cap on Backrest
    const backrestTopCap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 32), matBlueChair);
    backrestTopCap.position.set(-0.21, 0.89, 0);
    backrestTopCap.rotation.z = Math.PI / 2;
    chairGroup.add(backrestTopCap);

    // 6. Padded Ergonomic Armrests (Soft Blue Fabric Top Pads & Metal Brackets)
    [-0.18, 0.18].forEach((zSide) => {
      const armBracket = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.025), matMetalLegs);
      armBracket.position.set(-0.02, 0.51, zSide);
      chairGroup.add(armBracket);

      const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.05), matBlueChair);
      armPad.position.set(-0.02, 0.60, zSide);
      chairGroup.add(armPad);
    });

    roomGroup.add(chairGroup);

    // ==========================================
    // ENABLE CAST & RECEIVE SHADOWS ON ROOM OBJECTS (EXCLUDING OUTDOOR SCENERY)
    // ==========================================
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Turn off shadow casting on outdoor scenery and desk lamp hardware
    // so tabletop blocks light penetration while lamp bulb/shade cast no unwanted shadows
    deskLamp.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
      }
    });

    skyPlane.castShadow = false;
    skyPlane.receiveShadow = false;

    cloudGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    treeGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    poleGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    // ==========================================
    // ==========================================
    // ATMOSPHERE LIGHTING CONFIGURATIONS (MORNING, AFTERNOON, NIGHT)
    // ==========================================
    const morningConfig = {
      sunColor: new THREE.Color(0xfff8ed), // Bright crisp clear morning white sunlight
      sunIntensity: 6.2,
      hemiSky: new THREE.Color(0xbae6fd), // Fresh morning blue sky
      hemiGround: new THREE.Color(0x78716c), // Clean tatami bounce
      hemiIntensity: 0.65,
      ambColor: new THREE.Color(0xfffaed), // Crisp bright morning ambient
      ambIntensity: 0.35,
      windowFillColor: new THREE.Color(0xbae6fd),
      windowFillIntensity: 0.55,
      ceilingColor: new THREE.Color(0xffecc2),
      ceilingIntensity: 0.0,
      deskSpotIntensity: 0.0,
      sceneBg: new THREE.Color(0xe0f2fe), // Bright morning sky background
      fogColor: new THREE.Color(0xeff6ff), // Crisp morning air fog
      skyColor: new THREE.Color(0x38bdf8), // Clear morning blue sky plane
      cloudColor: new THREE.Color(0xffffff), // Pure crisp white morning clouds
      cloudOpacity: 0.95,
      sunOpacity: 1.0,
      sunPos: new THREE.Vector3(-3.7, 2.4, -1.6),
      sunColorHex: new THREE.Color(0xfff066),
      moonOpacity: 0.0,
      starOpacity: 0.0,
      lampEmissive: new THREE.Color(0x000000),
      bulbEmissive: new THREE.Color(0x000000),
      exposure: 1.25,
    };

    const afternoonConfig = {
      sunColor: new THREE.Color(0xff9e2e), // High-contrast Golden Afternoon sunlight
      sunIntensity: 5.8,
      hemiSky: new THREE.Color(0xffd8ab),
      hemiGround: new THREE.Color(0x544333),
      hemiIntensity: 0.55,
      ambColor: new THREE.Color(0xffedd8),
      ambIntensity: 0.15,
      windowFillColor: new THREE.Color(0xffd4a1),
      windowFillIntensity: 0.45,
      ceilingColor: new THREE.Color(0xffecc2),
      ceilingIntensity: 0.12,
      deskSpotIntensity: 0.0,
      sceneBg: new THREE.Color(0xf5e6d3), // Warm afternoon background
      fogColor: new THREE.Color(0xf7e8d0),
      skyColor: new THREE.Color(0x7ec8f2), // Afternoon sky plane
      cloudColor: new THREE.Color(0xfed7aa), // Warm golden peach sunset clouds
      cloudOpacity: 0.90,
      sunOpacity: 1.0,
      sunPos: new THREE.Vector3(-3.7, 1.2, 0.8), // Sunset Sun lower on horizon along exact straight line
      sunColorHex: new THREE.Color(0xf97316),
      moonOpacity: 0.0,
      starOpacity: 0.0,
      lampEmissive: new THREE.Color(0x000000),
      bulbEmissive: new THREE.Color(0x000000),
      exposure: 1.30,
    };

    const nightConfig = {
      sunColor: new THREE.Color(0x38bdf8), // Soft Moonlight Cyan-Blue streaming in window
      sunIntensity: 1.2,
      hemiSky: new THREE.Color(0x6366f1), // Soft indigo sky fill
      hemiGround: new THREE.Color(0x78350f), // Warm wood ground bounce reflection
      hemiIntensity: 0.45,
      ambColor: new THREE.Color(0x6b442b), // Warm cozy ambient room fill
      ambIntensity: 0.45,
      windowFillColor: new THREE.Color(0x1e3a8a),
      windowFillIntensity: 0.25,
      ceilingColor: new THREE.Color(0xffb84d), // Bright vibrant warm golden ceiling lamp illumination
      ceilingIntensity: 8.5, // Brightly illuminates tatami, bookshelf, closet & room
      deskSpotIntensity: 0.0, // Desk lamp off
      sceneBg: new THREE.Color(0x0a0e1a), // Deep midnight sky
      fogColor: new THREE.Color(0x131929),
      skyColor: new THREE.Color(0x0f172a), // Deep twilight sky plane
      cloudColor: new THREE.Color(0x334155), // Deep slate-indigo night clouds under moonlight
      cloudOpacity: 0.70,
      sunOpacity: 0.0,
      sunPos: new THREE.Vector3(-3.7, -0.6, 3.2), // Sun continues down below horizon along exact straight line
      sunColorHex: new THREE.Color(0xf97316),
      moonOpacity: 1.0,
      starOpacity: 1.0,
      lampEmissive: new THREE.Color(0xffb84d), // Brightly glowing paper ceiling lantern
      bulbEmissive: new THREE.Color(0x000000), // Desk lamp bulb off
      exposure: 1.28,
    };

    // ==========================================
    // ANIMATION LOOP WITH SMOOTH LERP
    // ==========================================
    let animId: number;

    const animate = () => {
      // Smooth Camera LERP towards target position and target lookAt
      camera.position.lerp(targetCamPos.current, 0.05);
      controls.target.lerp(targetLookAtPos.current, 0.05);
      controls.update();

      // Smooth Morning / Afternoon / Night Lighting LERP Transition
      const targetCfg =
        timeModeRef.current === 'morning'
          ? morningConfig
          : timeModeRef.current === 'afternoon'
            ? afternoonConfig
            : nightConfig;
      const lerpSpeed = 0.04;

      sunLight.color.lerp(targetCfg.sunColor, lerpSpeed);
      sunLight.intensity = THREE.MathUtils.lerp(sunLight.intensity, targetCfg.sunIntensity, lerpSpeed);

      hemiLight.color.lerp(targetCfg.hemiSky, lerpSpeed);
      hemiLight.groundColor.lerp(targetCfg.hemiGround, lerpSpeed);
      hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, targetCfg.hemiIntensity, lerpSpeed);

      ambLight.color.lerp(targetCfg.ambColor, lerpSpeed);
      ambLight.intensity = THREE.MathUtils.lerp(ambLight.intensity, targetCfg.ambIntensity, lerpSpeed);

      windowFillLight.color.lerp(targetCfg.windowFillColor, lerpSpeed);
      windowFillLight.intensity = THREE.MathUtils.lerp(windowFillLight.intensity, targetCfg.windowFillIntensity, lerpSpeed);

      ceilingLight.color.lerp(targetCfg.ceilingColor, lerpSpeed);
      ceilingLight.intensity = THREE.MathUtils.lerp(ceilingLight.intensity, targetCfg.ceilingIntensity, lerpSpeed);

      deskSpotLight.intensity = THREE.MathUtils.lerp(deskSpotLight.intensity, targetCfg.deskSpotIntensity, lerpSpeed);

      if (scene.background && scene.background instanceof THREE.Color) {
        scene.background.lerp(targetCfg.sceneBg, lerpSpeed);
      }
      if (scene.fog && scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(targetCfg.fogColor, lerpSpeed);
      }
      skyMat.color.lerp(targetCfg.skyColor, lerpSpeed);
      cloudMat.color.lerp(targetCfg.cloudColor, lerpSpeed);
      cloudMat.opacity = THREE.MathUtils.lerp(cloudMat.opacity, targetCfg.cloudOpacity, lerpSpeed);

      // Gentle cloud drift motion across the full sky plane
      const timeSec = Date.now() * 0.001;
      cloudDriftObjects.forEach((cd) => {
        const driftOffset = (timeSec * cd.speed * 20) % 14.0;
        let newZ = cd.baseZ + driftOffset;
        if (newZ > 7.0) newZ -= 14.0;
        cd.group.position.z = newZ;
      });

      // Celestial Sun, Moon, and Stars Smooth LERP Transitions
      sunCoreMat.opacity = THREE.MathUtils.lerp(sunCoreMat.opacity, targetCfg.sunOpacity, lerpSpeed);
      sunGlowMat.opacity = THREE.MathUtils.lerp(sunGlowMat.opacity, targetCfg.sunOpacity * 0.35, lerpSpeed);
      sunCoreMat.color.lerp(targetCfg.sunColorHex, lerpSpeed);
      sunGlowMat.color.lerp(targetCfg.sunColorHex, lerpSpeed);
      sunGroup.position.lerp(targetCfg.sunPos, lerpSpeed);

      moonMat.opacity = THREE.MathUtils.lerp(moonMat.opacity, targetCfg.moonOpacity, lerpSpeed);
      moonMaskMat.opacity = THREE.MathUtils.lerp(moonMaskMat.opacity, targetCfg.moonOpacity, lerpSpeed);
      moonMaskMat.color.copy(skyMat.color);
      moonGlowMat.opacity = THREE.MathUtils.lerp(moonGlowMat.opacity, targetCfg.moonOpacity * 0.35, lerpSpeed);

      starMat.opacity = THREE.MathUtils.lerp(starMat.opacity, targetCfg.starOpacity, lerpSpeed);

      if (targetCfg.starOpacity > 0.3) {
        const time = Date.now() * 0.003;
        starParticles.forEach((sp) => {
          const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + sp.phase);
          sp.mesh.scale.setScalar(twinkle);
        });
      }

      matShojiPaper.emissive.lerp(targetCfg.lampEmissive, lerpSpeed);
      bulbMat.emissive.lerp(targetCfg.bulbEmissive, lerpSpeed);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, targetCfg.exposure, lerpSpeed);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Controls change listener to update debug coordinates live
    let frameId: number;
    const handleControlsChange = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (!camera || !controls) return;
        const cX = camera.position.x.toFixed(2);
        const cY = camera.position.y.toFixed(2);
        const cZ = camera.position.z.toFixed(2);

        const tX = controls.target.x.toFixed(2);
        const tY = controls.target.y.toFixed(2);
        const tZ = controls.target.z.toFixed(2);

        setDebugCam({
          cam: `${cX}, ${cY}, ${cZ}`,
          target: `${tX}, ${tY}, ${tZ}`,
        });
      });
    };

    // RESIZE HANDLER
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    controls.addEventListener('change', handleControlsChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', handleControlsChange);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleCopyCode = () => {
    const codeSnippet = `camPos: [${debugCam.cam}],\ntargetPos: [${debugCam.target}],`;
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        ref={mountRef}
        className={`fixed inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing ${className}`}
      />

      {/* Live Camera & Atmosphere Debug Inspector HUD */}
      <div className="fixed top-20 right-6 z-30 p-4 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/80 shadow-2xl text-xs font-mono text-zinc-200 space-y-3 max-w-xs">
        <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
          <span className="font-extrabold text-amber-400 font-sans flex items-center gap-1.5">
            📷 Thước Đo & Ánh Sáng
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-sans font-bold">
            Realtime
          </span>
        </div>

        {/* Morning / Afternoon / Night Atmosphere Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="text-zinc-400 font-bold">Thời Gian:</span>
            <span className="text-amber-300 font-extrabold">
              {timeMode === 'morning'
                ? '🌅 Buổi Sáng'
                : timeMode === 'afternoon'
                  ? '☀️ Buổi Chiều'
                  : '🌙 Buổi Tối'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[10px]">
            <button
              onClick={() => handleTimeModeChange('morning')}
              className={`py-1.5 px-1 rounded-lg font-sans font-extrabold flex items-center justify-center gap-1 transition-all ${timeMode === 'morning'
                ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-zinc-950 shadow-md scale-[1.02]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
            >
              🌅 Sáng
            </button>
            <button
              onClick={() => handleTimeModeChange('afternoon')}
              className={`py-1.5 px-1 rounded-lg font-sans font-extrabold flex items-center justify-center gap-1 transition-all ${timeMode === 'afternoon'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-md scale-[1.02]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
            >
              ☀️ Chiều
            </button>
            <button
              onClick={() => handleTimeModeChange('night')}
              className={`py-1.5 px-1 rounded-lg font-sans font-extrabold flex items-center justify-center gap-1 transition-all ${timeMode === 'night'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md scale-[1.02]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
            >
              🌙 Tối
            </button>
          </div>
        </div>

        <div className="space-y-1 text-[11px] border-t border-zinc-800 pt-2">
          <p>
            <span className="text-zinc-400 font-bold">camPos:</span> <span className="text-cyan-300">[{debugCam.cam}]</span>
          </p>
          <p>
            <span className="text-zinc-400 font-bold">targetPos:</span> <span className="text-emerald-300">[{debugCam.target}]</span>
          </p>
        </div>

        <button
          onClick={handleCopyCode}
          className={`w-full py-1.5 px-3 rounded-xl font-bold font-sans transition-all text-xs flex items-center justify-center gap-1.5 ${copied
            ? 'bg-emerald-500 text-white'
            : 'bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold shadow-md'
            }`}
        >
          {copied ? '✅ Đã Copy Tọa Độ!' : '📋 Copy Tọa Độ Này'}
        </button>
      </div>
    </>
  );
};
