'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { STAGES, CameraStage, TimeOfDay, getVietnamTimeOfDay } from './room/stages';
import { buildBackpack } from './room/builders/buildBackpack';
import { useAuth } from '../../context/AuthContext';
import { buildInteractiveNotebook } from './room/builders/buildInteractiveNotebook';
import { buildDeskAndChair } from './room/builders/buildDeskAndChair';
import { buildBookshelf } from './room/builders/buildBookshelf';
import { buildClosetAndWindow } from './room/builders/buildClosetAndWindow';
import { buildRoomShell } from './room/builders/buildRoomShell';
import { buildLightSwitch } from './room/builders/buildLightSwitch';

import {
  createTatamiTexture,
  createTatamiBumpMap,
  createWoodTexture,
  createFabricTexture,
  createShojiPaperTexture,
  createWallPlasterTexture,
  createGlobeTexture,
} from './room/textures/proceduralTextures';

export { STAGES };
export type { CameraStage, TimeOfDay };

/**
 * Hiệu ứng âm thanh cơ học click-clack chân thực khi bấm công tắc điện (Web Audio API)
 */
function playLightSwitchSound(isOn: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isOn ? 1400 : 900, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // Ignore audio error if not permitted
  }
}

/**
 * Hiệu ứng âm thanh lật mở/gấp sách vở tự nhiên (Web Audio API)
 */
function playBookPageSound(isOpen: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isOpen ? 1100 : 750, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch {
    // Ignore audio error
  }
}

/**
 * Hiệu ứng âm thanh mở/đóng nắp laptop & âm khởi động MagicOS nhẹ nhàng (Web Audio API)
 */
function playLaptopSound(isOpen: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (isOpen) {
      // 1. Tiếng mở bản lề cơ học êm ái
      const bufferSize = Math.floor(ctx.sampleRate * 0.16);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(2.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // 2. Âm thanh khởi động MagicOS nhẹ nhàng (soft futuristic chime)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const chimeGain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now + 0.20); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.60); // C6
      osc2.frequency.setValueAtTime(659.25, now + 0.20); // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.5, now + 0.60); // E6

      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.setValueAtTime(0.0001, now + 0.20);
      chimeGain.gain.linearRampToValueAtTime(0.07, now + 0.30);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc1.connect(chimeGain);
      osc2.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      osc1.start(now + 0.20);
      osc2.start(now + 0.20);
      osc1.stop(now + 0.90);
      osc2.stop(now + 0.90);
    } else {
      // Tiếng gập nắp máy êm ái
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  } catch {
    // Ignore audio error
  }
}


export interface RoomCanvasProps {
  currentStageIndex: number;
  onStageChange?: (index: number) => void;
  timeOfDay?: TimeOfDay;
  onTimeOfDayChange?: (mode: TimeOfDay) => void;
  className?: string;
}

export const RoomCanvas: React.FC<RoomCanvasProps> = ({
  currentStageIndex = 0,
  onStageChange,
  timeOfDay = getVietnamTimeOfDay(),
  onTimeOfDayChange,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const { user } = useAuth();
  const updateNameTagRef = useRef<((name?: string, role?: string) => void) | null>(null);

  useEffect(() => {
    if (updateNameTagRef.current) {
      const name = user ? (user.fullName || user.username) : '';
      const role = user?.role || '';
      updateNameTagRef.current(name, role);
    }
  }, [user]);

  const onStageChangeRef = useRef(onStageChange);
  useEffect(() => {
    onStageChangeRef.current = onStageChange;
  }, [onStageChange]);

  // Atmosphere mode state
  const [timeMode, setTimeMode] = useState<TimeOfDay>(timeOfDay);
  const timeModeRef = useRef<TimeOfDay>(timeOfDay);

  useEffect(() => {
    setTimeMode(timeOfDay);
    timeModeRef.current = timeOfDay;
  }, [timeOfDay]);

  // Live debug state for current camera coordinates
  const [debugCam, setDebugCam] = useState<{ cam: string; target: string }>({
    cam: '4.2, 3.2, 4.8',
    target: '-0.3, 0.9, -0.5',
  });
  const [copied, setCopied] = useState(false);

  // Ceiling light switch states
  const [isCeilingLightOn, setIsCeilingLightOn] = useState<boolean>(true);
  const [switchHint, setSwitchHint] = useState<string | null>(null);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Camera LERP target vectors
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(...STAGES[0].camPos));
  const targetLookAtPos = useRef<THREE.Vector3>(new THREE.Vector3(...STAGES[0].targetPos));
  const currentStageIndexRef = useRef<number>(currentStageIndex);
  const prevStageRef = useRef<number>(currentStageIndex);

  useEffect(() => {
    const prevStage = prevStageRef.current;
    if (prevStage !== currentStageIndex) {
      if (currentStageIndex === 1) {
        // Tự động lật mở quyển vở khi zoom vào góc Bàn học (chờ camera bắt đầu lướt tới)
        setTimeout(() => playBookPageSound(true), 180);
      } else if (prevStage === 1) {
        // Tự động gập quyển vở lại khi rời khỏi Bàn học
        playBookPageSound(false);
      } else if (currentStageIndex === 6) {
        // Tự động mở nắp laptop khi zoom vào góc Laptop
        setTimeout(() => playLaptopSound(true), 150);
      } else if (prevStage === 6) {
        // Tự động gập nắp laptop lại khi rời khỏi góc Laptop
        playLaptopSound(false);
      }
      prevStageRef.current = currentStageIndex;
    }

    currentStageIndexRef.current = currentStageIndex;
    const stage = STAGES[currentStageIndex] || STAGES[0];
    targetCamPos.current.set(...stage.camPos);
    targetLookAtPos.current.set(...stage.targetPos);
  }, [currentStageIndex]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    // 2. Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(...STAGES[0].camPos);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 4. LookAt Target Vector (Khóa cố định camera, hoàn toàn không xoay tự do)
    const currentLookAt = new THREE.Vector3(...STAGES[0].targetPos);
    camera.lookAt(currentLookAt);

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfffbeb, 0.36);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.24);
    scene.add(hemiLight);

    // Sun directional light (Nguồn sáng chính chiếu qua cửa sổ)
    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.35);

    dirLight.position.set(-3.7, 2.4, -1.6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.top = 5;
    dirLight.shadow.camera.bottom = -5;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);

    // Moon directional light
    const nightDirLight = new THREE.DirectionalLight(0x93c5fd, 0.0);
    nightDirLight.position.set(-3.7, 2.5, -0.6);
    nightDirLight.castShadow = true;
    nightDirLight.shadow.mapSize.width = 2048;
    nightDirLight.shadow.mapSize.height = 2048;
    nightDirLight.shadow.camera.left = -5;
    nightDirLight.shadow.camera.right = 5;
    nightDirLight.shadow.camera.top = 5;
    nightDirLight.shadow.camera.bottom = -5;
    nightDirLight.shadow.camera.near = 0.1;
    nightDirLight.shadow.camera.far = 15;
    nightDirLight.shadow.bias = -0.0003;
    scene.add(nightDirLight);

    // Soft warm room fill light from ceiling lamp (tỏa sáng ấm áp khắp phòng)
    const roomFillLight = new THREE.PointLight(0xfff3db, 0.85, 12, 1.2);
    roomFillLight.position.set(0, 2.22, 0);
    scene.add(roomFillLight);

    // Downward soft spotlight directly from ceiling lamp onto tatami floor
    const ceilingDownLight = new THREE.SpotLight(0xffedd5, 0.75, 10, Math.PI / 2.6, 0.5, 1.2);
    ceilingDownLight.position.set(0, 2.24, 0);
    ceilingDownLight.target.position.set(0, 0, 0);
    scene.add(ceilingDownLight);
    scene.add(ceilingDownLight.target);

    // Window rim light
    const windowRimLight = new THREE.PointLight(0x38bdf8, 0.25, 4);
    windowRimLight.position.set(-2.0, 1.6, 0);
    scene.add(windowRimLight);

    // Shared Procedural Textures
    const texTatami = createTatamiTexture();
    const texTatamiBump = createTatamiBumpMap();
    const texWoodDark = createWoodTexture('#3a1e0d', '#210f05');
    const texWoodAmber = createWoodTexture('#753f1a', '#47240c');
    const texWall = createWallPlasterTexture();
    const texPaper = createShojiPaperTexture();
    const texChairFabric = createFabricTexture('#2563eb', '#1d4ed8');
    const texGlobe = createGlobeTexture();

    // Shared PBR Materials with Procedural Textures
    const matWoodDark = new THREE.MeshStandardMaterial({ map: texWoodDark, roughness: 0.45 });
    const matWoodAmber = new THREE.MeshStandardMaterial({ map: texWoodAmber, roughness: 0.40 });
    const matTatami = new THREE.MeshStandardMaterial({
      map: texTatami,
      bumpMap: texTatamiBump,
      bumpScale: 0.005,
      roughness: 0.80,
    });
    const matTatamiBorder = new THREE.MeshStandardMaterial({ color: 0x2b3846, roughness: 0.6 });
    const matWallBeige = new THREE.MeshStandardMaterial({ map: texWall, color: 0xe5d8be, roughness: 0.9 });
    const matShojiPaper = new THREE.MeshStandardMaterial({ map: texPaper, color: 0xfffcf5, roughness: 0.85, transparent: true, opacity: 0.92 });
    const matClosetWhite = new THREE.MeshStandardMaterial({ map: texPaper, color: 0xf5eedc, roughness: 0.55 });
    const matClosetBlue = new THREE.MeshStandardMaterial({ color: 0x1d5a8a, roughness: 0.35 });
    const matTableMahogany = new THREE.MeshStandardMaterial({
      map: texWoodAmber,
      color: 0x9a4a25, // Gỗ Teak/dẻ Nhật Bản ấm áp, vân gỗ rõ nét, không bị tối đen
      roughness: 0.38,
      metalness: 0.05,
    });
    const matGlassWater = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05, transmission: 0.9 });
    const matWaterLiquid = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, roughness: 0.10, transmission: 0.75 });
    const matTerracotta = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.65 });
    const matCeramicWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const matLeafDark = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const matLeafLight = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
    const matMetalLegs = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.28, metalness: 0.85 });
    const matPaperWhite = new THREE.MeshStandardMaterial({ map: texPaper, color: 0xfffbeb, roughness: 0.9 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.85 });
    const matLampGreen = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.20, metalness: 0.15 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.15, metalness: 0.90 });
    const matSwitchRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
    const matCupYellow = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const matPencilYellow = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });
    const matGlobeOcean = new THREE.MeshStandardMaterial({ map: texGlobe, roughness: 0.25, metalness: 0.1 });
    const matAlarmRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, metalness: 0.15 });
    const matChairWheel = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
    const matBlueChair = new THREE.MeshStandardMaterial({ map: texChairFabric, roughness: 0.50 });
    const matChairPiping = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 });
    const matChairShell = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.40 });

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // 6. Build Modular 3D Components
    const { roomW, roomL, lampPaperMat } = buildRoomShell(
      roomGroup,
      matWoodDark,
      matWoodAmber,
      matTatami,
      matTatamiBorder,
      matWallBeige,
      matShojiPaper
    );

    // Xây dựng công tắc điện trên tường bên phải
    const { switchGroup, switchClickMesh, setSwitchVisualState } = buildLightSwitch(roomW);
    roomGroup.add(switchGroup);

    let isCeilingLightActive = true;


    const {
      closetGroup,
      fDoorLeft,
      fDoorRight,
      doorLeftClickMesh,
      doorRightClickMesh,
      winGroup,
      lowTableGroup,
      laptopClickMesh,
      laptopLidGroup,
      cornerPlantGroup,
      sunGroup,
      moonGroup,
      starsGroup,
      skyMat,
      sunCoreMat,
      sunGlowMat,
      moonMat,
      moonMaskMat,
      moonGlowMat,
      starMat,
      cloudMat,
      starParticles,
      cloudDriftObjects,
    } = buildClosetAndWindow(
      roomW,
      roomL,
      matWoodAmber,
      matWoodDark,
      matClosetWhite,
      matClosetBlue,
      matTableMahogany,
      matGlassWater,
      matWaterLiquid,
      matTerracotta,
      matCeramicWhite,
      matLeafDark,
      matLeafLight,
      matMetalLegs
    );

    // LERP Target States for Smooth Atmosphere Lighting Transitions
    const targetDirLightPos = new THREE.Vector3(-3.7, 1.4, -2.0);
    const targetDirLightColor = new THREE.Color(0xfde047);
    let targetDirLightIntensity = 1.6;
    let targetNightLightIntensity = 0.0;
    const targetAmbientColor = new THREE.Color(0xfef3c7);
    let targetAmbientIntensity = 0.26;
    let targetRoomFillIntensity = 0.28;
    const targetSkyColor = new THREE.Color(0x7dd3fc);
    const targetSunPos = new THREE.Vector3(-3.7, 1.4, -2.0);
    let targetSunOpacity = 1.0;
    let targetMoonOpacity = 0.0;
    let targetStarOpacity = 0.0;
    const targetCloudColor = new THREE.Color(0xffffff);
    let targetCloudOpacity = 0.92;
    let targetWindowRimIntensity = 0.20;

    roomGroup.add(closetGroup);
    roomGroup.add(winGroup);
    roomGroup.add(lowTableGroup);
    roomGroup.add(cornerPlantGroup);

    const { shelfGroup, bookshelfClickMesh, wallPosterGroup, globeSphere, hourHandGroup, minuteHandGroup } = buildBookshelf(
      roomL,
      matWoodAmber,
      matWoodAmber,
      matMetalLegs,
      matGlobeOcean,
      matAlarmRed,
      matPaperWhite
    );
    roomGroup.add(shelfGroup);
    roomGroup.add(bookshelfClickMesh);
    roomGroup.add(wallPosterGroup);

    const { deskGroup, chairGroup, deskClickMesh } = buildDeskAndChair(
      roomW,
      matWoodAmber,
      matWoodDark,
      matCeramicWhite,
      matClosetBlue,
      matLampGreen,
      matBrass,
      matSwitchRed,
      matChrome,
      matCupYellow,
      matGlobeOcean,
      matAlarmRed,
      matPaperWhite,
      matMetalLegs,
      matChairWheel,
      matBlueChair,
      matChairPiping,
      matChairShell
    );
    roomGroup.add(deskGroup);
    roomGroup.add(chairGroup);
    roomGroup.add(deskClickMesh);

    const { notebookGroup, notebookClickMesh, rightWing } = buildInteractiveNotebook(
      matClosetBlue,
      matPaperWhite,
      matPencilYellow,
      matChrome
    );
    deskGroup.add(notebookGroup);

    const initialName = user ? (user.fullName || user.username) : '';
    const initialRole = user?.role || '';
    const { backpackGroup, backpackClickMesh, updateNameTag } = buildBackpack(
      roomW,
      matBrass,
      initialName,
      initialRole
    );
    updateNameTagRef.current = updateNameTag;
    roomGroup.add(backpackGroup);
    roomGroup.add(backpackClickMesh);

    // Enable castShadow & receiveShadow on all room 3D objects
    roomGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Disable cast & receive shadows on celestial light & atmosphere meshes
    sunGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    moonGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    starsGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    let isLeftDoorOpen = false;
    let isRightDoorOpen = false;

    // 7. Animation Render Loop
    let animId: number;
    const parallaxTarget = new THREE.Vector2(0, 0);
    const currentParallax = new THREE.Vector2(0, 0);

    const animate = () => {
      // Smooth Parallax LERP (Nghiêng nhẹ camera theo hướng hover chuột)
      currentParallax.x = THREE.MathUtils.lerp(currentParallax.x, parallaxTarget.x, 0.05);
      currentParallax.y = THREE.MathUtils.lerp(currentParallax.y, parallaxTarget.y, 0.05);

      const isZoomed = currentStageIndexRef.current !== 0;
      const factor = isZoomed ? 0.35 : 1.0;
      const parallaxLookX = currentParallax.x * 0.24 * factor;
      const parallaxLookY = currentParallax.y * 0.16 * factor;
      const parallaxLookZ = -currentParallax.x * 0.24 * factor;

      const dynamicTargetLookAt = new THREE.Vector3(
        targetLookAtPos.current.x + parallaxLookX,
        targetLookAtPos.current.y + parallaxLookY,
        targetLookAtPos.current.z + parallaxLookZ
      );

      // Smooth LERP Camera Transitions (lướt camera chậm rãi, êm ái hơn)
      camera.position.lerp(targetCamPos.current, 0.022);
      currentLookAt.lerp(dynamicTargetLookAt, 0.022);
      camera.lookAt(currentLookAt);

      // Time-of-Day lighting target updates
      const currentMode = timeModeRef.current;
      if (currentMode === 'morning') {
        // Fresh soft morning daylight (giảm tương phản, ánh sáng ban mai dịu mát chan hòa khắp phòng)
        targetDirLightPos.set(-3.7, 2.5, 1.8);
        targetDirLightColor.setHex(0xfffbeb);
        targetDirLightIntensity = 1.25; // Nắng sáng dịu nhẹ, không quá gắt
        targetNightLightIntensity = 0.0;

        targetAmbientColor.setHex(0xe0f2fe);
        targetAmbientIntensity = 0.46; // Nâng sáng vùng tối, làm dịu bóng đổ
        targetRoomFillIntensity = 0.85; // Đèn trần chiếu sáng rõ ràng, ấm áp và lan tỏa đều

        targetSkyColor.setHex(0x38bdf8); // Sky blue
        targetSunPos.set(-3.7, 2.5, 1.8);
        targetSunOpacity = 1.0;
        targetMoonOpacity = 0.0;
        targetStarOpacity = 0.0;
        targetCloudColor.setHex(0xffffff);
        targetCloudOpacity = 0.92;
        targetWindowRimIntensity = 0.35;
      } else if (currentMode === 'afternoon') {
        // Soft warm afternoon daylight (Nắng vàng chiều có chiều sâu, bóng đổ ấm và rõ)
        targetDirLightPos.set(-3.7, 1.4, -2.0);
        targetDirLightColor.setHex(0xfde047); // Gentle golden yellow sunlight
        targetDirLightIntensity = 1.60;
        targetNightLightIntensity = 0.0;

        targetAmbientColor.setHex(0xfef3c7); // Gentle warm amber ambient
        targetAmbientIntensity = 0.26;
        targetRoomFillIntensity = 0.80; // Sáng ấm hài hòa với nắng chiều

        targetSkyColor.setHex(0x7dd3fc); // Soft warm sky blue
        targetSunPos.set(-3.7, 1.4, -2.0);
        targetSunOpacity = 1.0;
        targetMoonOpacity = 0.0;
        targetStarOpacity = 0.0;
        targetCloudColor.setHex(0xffffff);
        targetCloudOpacity = 0.92;
        targetWindowRimIntensity = 0.20;
      } else { // 'night'
        // Cozy midnight blue
        targetDirLightPos.set(-3.7, 2.5, -0.6);
        targetDirLightColor.setHex(0x38bdf8);
        targetDirLightIntensity = 0.0;
        targetNightLightIntensity = 0.90;

        targetAmbientColor.setHex(0x1e1b4b);
        targetAmbientIntensity = 0.12;
        targetRoomFillIntensity = 1.25; // Khi bật đèn trần vào ban đêm, phòng sáng rực rỡ, ấm cúng

        targetSkyColor.setHex(0x090d16); // Midnight dark sky
        targetSunPos.set(-3.7, 0.4, -3.0);
        targetSunOpacity = 0.0;
        targetMoonOpacity = 1.0;
        targetStarOpacity = 1.0;
        targetCloudColor.setHex(0x334155); // Translucent dark night clouds
        targetCloudOpacity = 0.35;
        targetWindowRimIntensity = 0.0;
      }

      // Smooth LERP Lighting & Celestial Object Movements (chuyển đổi buổi chậm rãi, điện ảnh)
      dirLight.position.lerp(targetDirLightPos, 0.014);
      dirLight.color.lerp(targetDirLightColor, 0.014);
      dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, targetDirLightIntensity, 0.014);

      nightDirLight.intensity = THREE.MathUtils.lerp(nightDirLight.intensity, targetNightLightIntensity, 0.014);

      ambientLight.color.lerp(targetAmbientColor, 0.014);
      ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, targetAmbientIntensity, 0.014);

      // Cập nhật cường độ đèn trần và độ phát sáng chụp đèn theo công tắc
      const targetActiveFill = isCeilingLightActive ? targetRoomFillIntensity : 0.0;
      const targetActiveDownLight = isCeilingLightActive ? (currentMode === 'night' ? 1.05 : 0.75) : 0.0;
      const targetActiveLampEmissive = isCeilingLightActive ? 2.0 : 0.0;
      roomFillLight.intensity = THREE.MathUtils.lerp(roomFillLight.intensity, targetActiveFill, 0.022);
      ceilingDownLight.intensity = THREE.MathUtils.lerp(ceilingDownLight.intensity, targetActiveDownLight, 0.022);
      lampPaperMat.emissiveIntensity = THREE.MathUtils.lerp(lampPaperMat.emissiveIntensity, targetActiveLampEmissive, 0.022);

      windowRimLight.intensity = THREE.MathUtils.lerp(windowRimLight.intensity, targetWindowRimIntensity, 0.014);

      (skyMat as any).color.lerp(targetSkyColor, 0.014);
      sunGroup.position.lerp(targetSunPos, 0.014);

      sunCoreMat.opacity = THREE.MathUtils.lerp(sunCoreMat.opacity, targetSunOpacity, 0.014);
      sunGlowMat.opacity = THREE.MathUtils.lerp(sunGlowMat.opacity, targetSunOpacity * 0.35, 0.014);

      moonMat.opacity = THREE.MathUtils.lerp(moonMat.opacity, targetMoonOpacity, 0.014);
      moonMaskMat.opacity = THREE.MathUtils.lerp(moonMaskMat.opacity, targetMoonOpacity, 0.014);
      moonGlowMat.opacity = THREE.MathUtils.lerp(moonGlowMat.opacity, targetMoonOpacity * 0.4, 0.014);

      starMat.opacity = THREE.MathUtils.lerp(starMat.opacity, targetStarOpacity, 0.014);

      (cloudMat as any).color.lerp(targetCloudColor, 0.014);
      cloudMat.opacity = THREE.MathUtils.lerp(cloudMat.opacity, targetCloudOpacity, 0.014);

      // Smooth 3D Globe Rotation
      if (globeSphere) {
        globeSphere.rotation.y += 0.005;
      }

      // Real-Time Alarm Clock Hands Tick Animation (Vietnam UTC+7)
      if (hourHandGroup && minuteHandGroup) {
        const clockNow = new Date();
        const vParts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false,
        }).formatToParts(clockNow);

        let hVal = 0, mVal = 0, sVal = 0;
        vParts.forEach((p) => {
          if (p.type === 'hour') hVal = parseInt(p.value, 10);
          if (p.type === 'minute') mVal = parseInt(p.value, 10);
          if (p.type === 'second') sVal = parseInt(p.value, 10);
        });

        const h12Val = hVal % 12;
        hourHandGroup.rotation.z = -((h12Val + mVal / 60) / 12) * Math.PI * 2;
        minuteHandGroup.rotation.z = -((mVal + sVal / 60) / 60) * Math.PI * 2;
      }

      // Cloud drift movement animation
      cloudDriftObjects.forEach((cObj) => {
        cObj.group.position.z += cObj.speed;
        if (cObj.group.position.z > 7.0) {
          cObj.group.position.z = -7.0;
        }
      });

      // Twinkling stars animation
      if (currentMode === 'night') {
        const timeSec = Date.now() * 0.002;
        starParticles.forEach((sp) => {
          const scale = 0.6 + 0.5 * Math.sin(timeSec * 2.5 + sp.phase);
          sp.mesh.scale.setScalar(scale);
        });
      }

      // Quyển vở tự động mở chậm rãi, êm dịu khi zoom vào bàn học (Stage 1) và gập lại khi rời đi
      const isNotebookOpen = currentStageIndexRef.current === 1;
      const targetNotebookAngle = isNotebookOpen ? 0 : Math.PI;
      const targetNotebookPosY = isNotebookOpen ? 0.002 : 0.014;
      rightWing.rotation.z = THREE.MathUtils.lerp(rightWing.rotation.z, targetNotebookAngle, 0.018);
      rightWing.position.y = THREE.MathUtils.lerp(rightWing.position.y, targetNotebookPosY, 0.018);

      // Laptop tự động mở nắp nghiêng chuẩn khi zoom vào góc Laptop (Stage 6) và gập đóng phẳng khi rời đi
      const isLaptopOpen = currentStageIndexRef.current === 6;
      const targetLidAngle = isLaptopOpen ? -0.31 : Math.PI / 2;
      laptopLidGroup.rotation.x = THREE.MathUtils.lerp(laptopLidGroup.rotation.x, targetLidAngle, 0.022);

      // Interactive Closet Doors independent smooth sliding animation
      const targetDoorLeftX = isLeftDoorOpen ? 0.46 : -0.51;
      const targetDoorRightX = isRightDoorOpen ? -0.46 : 0.51;
      fDoorLeft.position.x = THREE.MathUtils.lerp(fDoorLeft.position.x, targetDoorLeftX, 0.04);
      fDoorRight.position.x = THREE.MathUtils.lerp(fDoorRight.position.x, targetDoorRightX, 0.04);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // 8. Raycaster Pointer Click & Hover Detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownTime = 0;
    let pointerDownCoords = { x: 0, y: 0 };

    const handlePointerDown = (e: MouseEvent) => {
      pointerDownTime = Date.now();
      pointerDownCoords = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      const duration = Date.now() - pointerDownTime;
      const distance = Math.hypot(e.clientX - pointerDownCoords.x, e.clientY - pointerDownCoords.y);
      if (duration > 350 || distance > 6) return; // Ignore camera dragging

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // 1. Tương tác Công tắc điện bật/tắt đèn trần (Tường bên phải)
      const intersectsSwitch = raycaster.intersectObject(switchClickMesh, true);
      if (intersectsSwitch.length > 0) {
        isCeilingLightActive = !isCeilingLightActive;
        setIsCeilingLightOn(isCeilingLightActive);
        setSwitchVisualState(isCeilingLightActive);
        playLightSwitchSound(isCeilingLightActive);
        setSwitchHint(isCeilingLightActive ? '💡 Đã BẬT đèn trần' : '🌙 Đã TẮT đèn trần');
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        hintTimerRef.current = setTimeout(() => setSwitchHint(null), 2000);
        return;
      }

      const intersectsDoorLeft = raycaster.intersectObject(doorLeftClickMesh, true);

      if (intersectsDoorLeft.length > 0) {
        isLeftDoorOpen = !isLeftDoorOpen;
        return;
      }

      const intersectsDoorRight = raycaster.intersectObject(doorRightClickMesh, true);
      if (intersectsDoorRight.length > 0) {
        isRightDoorOpen = !isRightDoorOpen;
        return;
      }

      const intersectsNotebook = raycaster.intersectObject(notebookClickMesh, true);
      if (intersectsNotebook.length > 0) {
        // Quyển vở không còn nhấn mở/đóng thủ công; click vào vở khi chưa zoom sẽ zoom vào bàn học
        if (currentStageIndexRef.current !== 1 && onStageChangeRef.current) {
          onStageChangeRef.current(1);
        }
        return;
      }

      const intersectsBag = raycaster.intersectObject(backpackClickMesh, true);
      if (intersectsBag.length > 0) {
        if (onStageChangeRef.current) {
          onStageChangeRef.current(5);
        }
        return;
      }

      const intersectsBookshelf = raycaster.intersectObject(bookshelfClickMesh, true);
      if (intersectsBookshelf.length > 0) {
        if (onStageChangeRef.current) {
          onStageChangeRef.current(2);
        }
        return;
      }

      const intersectsDesk = raycaster.intersectObject(deskClickMesh, true);
      if (intersectsDesk.length > 0) {
        if (onStageChangeRef.current) {
          onStageChangeRef.current(1);
        }
        return;
      }

      const intersectsLaptop = raycaster.intersectObject(laptopClickMesh, true);
      if (intersectsLaptop.length > 0) {
        if (onStageChangeRef.current) {
          onStageChangeRef.current(6); // Zoom góc chính diện vào laptop
        }
        return;
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = normX;
      mouse.y = normY;

      // Cập nhật tọa độ góc hover nhẹ (Parallax Target)
      parallaxTarget.x = Math.max(-1, Math.min(1, normX));
      parallaxTarget.y = Math.max(-1, Math.min(1, normY));

      raycaster.setFromCamera(mouse, camera);
      const intersectsSwitch = raycaster.intersectObject(switchClickMesh, true);
      const intersectsDoorLeft = raycaster.intersectObject(doorLeftClickMesh, true);
      const intersectsDoorRight = raycaster.intersectObject(doorRightClickMesh, true);
      const intersectsNotebook = raycaster.intersectObject(notebookClickMesh, true);
      const intersectsBag = raycaster.intersectObject(backpackClickMesh, true);
      const intersectsBookshelf = raycaster.intersectObject(bookshelfClickMesh, true);
      const intersectsDesk = raycaster.intersectObject(deskClickMesh, true);
      const intersectsLaptop = raycaster.intersectObject(laptopClickMesh, true);

      const isNotebookHoverable = currentStageIndexRef.current !== 1 && intersectsNotebook.length > 0;
      const isDeskHoverable = currentStageIndexRef.current !== 1 && intersectsDesk.length > 0;
      const isLaptopHoverable = currentStageIndexRef.current !== 6 && intersectsLaptop.length > 0;

      if (
        intersectsSwitch.length > 0 ||
        intersectsDoorLeft.length > 0 ||
        intersectsDoorRight.length > 0 ||
        isNotebookHoverable ||
        isDeskHoverable ||
        isLaptopHoverable ||
        intersectsBag.length > 0 ||
        intersectsBookshelf.length > 0
      ) {
        domElem.style.cursor = 'pointer';
      } else {
        domElem.style.cursor = '';
      }
    };

    const handlePointerLeave = () => {
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
    };

    const domElem = renderer.domElement;
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    domElem.addEventListener('contextmenu', handleContextMenu);
    domElem.addEventListener('pointerdown', handlePointerDown);
    domElem.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('pointermove', handlePointerMove);
    domElem.addEventListener('pointerleave', handlePointerLeave);

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('contextmenu', handleContextMenu);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('pointermove', handlePointerMove);
      domElem.removeEventListener('pointerleave', handlePointerLeave);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-default" />
      {switchHint && (
        <div className="fixed bottom-6 right-6 z-30 pointer-events-none px-4 py-2 rounded-2xl bg-tod-card backdrop-blur-xl border border-tod-border shadow-2xl text-xs font-black text-tod-text flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <span>{switchHint}</span>
        </div>
      )}
    </div>
  );
};

