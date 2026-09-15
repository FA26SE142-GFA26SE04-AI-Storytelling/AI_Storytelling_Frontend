'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { STAGES, CameraStage, TimeOfDay, getVietnamTimeOfDay } from './room/stages';
import { buildBackpack } from './room/builders/buildBackpack';
import { useAuth } from '../../context/AuthContext';
import { buildInteractiveNotebook } from './room/builders/buildInteractiveNotebook';
import { buildDeskAndChair } from './room/builders/buildDeskAndChair';
import { buildBookshelf } from './room/builders/buildBookshelf';
import { buildClosetAndWindow } from './room/builders/buildClosetAndWindow';
import { buildRoomShell } from './room/builders/buildRoomShell';
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
  const controlsRef = useRef<OrbitControls | null>(null);
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
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent camera clipping below floor
    controls.minDistance = 0.5;
    controls.maxDistance = 12;
    controls.target.set(...STAGES[0].targetPos);
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfffbeb, 0.45);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x475569, 0.35);
    scene.add(hemiLight);

    // Sun directional light
    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
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
    dirLight.shadow.bias = -0.0005;
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
    nightDirLight.shadow.bias = -0.0005;
    scene.add(nightDirLight);

    // Soft warm room fill light
    const roomFillLight = new THREE.PointLight(0xffedd5, 0.6, 6);
    roomFillLight.position.set(0, 2.2, 0);
    scene.add(roomFillLight);

    // Window rim light
    const windowRimLight = new THREE.PointLight(0x38bdf8, 0.4, 4);
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
    const matTableMahogany = new THREE.MeshStandardMaterial({ map: texWoodDark, color: 0x6b2915, roughness: 0.28 });
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
    const { roomW, roomL } = buildRoomShell(
      roomGroup,
      matWoodDark,
      matWoodAmber,
      matTatami,
      matTatamiBorder,
      matWallBeige,
      matShojiPaper
    );

    const {
      closetGroup,
      fDoorLeft,
      fDoorRight,
      doorLeftClickMesh,
      doorRightClickMesh,
      winGroup,
      lowTableGroup,
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
    let targetDirLightIntensity = 1.5;
    let targetNightLightIntensity = 0.0;
    const targetAmbientColor = new THREE.Color(0xfef3c7);
    let targetAmbientIntensity = 0.52;
    let targetRoomFillIntensity = 0.60;
    const targetSkyColor = new THREE.Color(0x7dd3fc);
    const targetSunPos = new THREE.Vector3(-3.7, 1.4, -2.0);
    let targetSunOpacity = 1.0;
    let targetMoonOpacity = 0.0;
    let targetStarOpacity = 0.0;
    const targetCloudColor = new THREE.Color(0xffffff);
    let targetCloudOpacity = 0.92;
    let targetWindowRimIntensity = 0.25;

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

    let isNotebookOpen = false;
    let isLeftDoorOpen = false;
    let isRightDoorOpen = false;

    // 7. Animation Render Loop
    let animId: number;
    const animate = () => {
      // Smooth LERP Camera Transitions
      camera.position.lerp(targetCamPos.current, 0.05);
      controls.target.lerp(targetLookAtPos.current, 0.05);
      controls.update();

      // Time-of-Day lighting target updates
      const currentMode = timeModeRef.current;
      if (currentMode === 'morning') {
        // Fresh crisp morning daylight
        targetDirLightPos.set(-3.7, 2.5, 1.8);
        targetDirLightColor.setHex(0xfffbeb);
        targetDirLightIntensity = 1.5;
        targetNightLightIntensity = 0.0;

        targetAmbientColor.setHex(0xe0f2fe);
        targetAmbientIntensity = 0.60;
        targetRoomFillIntensity = 0.65;

        targetSkyColor.setHex(0x38bdf8); // Sky blue
        targetSunPos.set(-3.7, 2.5, 1.8);
        targetSunOpacity = 1.0;
        targetMoonOpacity = 0.0;
        targetStarOpacity = 0.0;
        targetCloudColor.setHex(0xffffff);
        targetCloudOpacity = 0.92;
        targetWindowRimIntensity = 0.35;
      } else if (currentMode === 'afternoon') {
        // Soft warm afternoon daylight (Nắng vàng dịu, bầu trời trong lành)
        targetDirLightPos.set(-3.7, 1.4, -2.0);
        targetDirLightColor.setHex(0xfde047); // Gentle golden yellow sunlight
        targetDirLightIntensity = 1.5;
        targetNightLightIntensity = 0.0;

        targetAmbientColor.setHex(0xfef3c7); // Gentle warm amber ambient
        targetAmbientIntensity = 0.52;
        targetRoomFillIntensity = 0.60;

        targetSkyColor.setHex(0x7dd3fc); // Soft warm sky blue (reduced orange tone)
        targetSunPos.set(-3.7, 1.4, -2.0);
        targetSunOpacity = 1.0;
        targetMoonOpacity = 0.0;
        targetStarOpacity = 0.0;
        targetCloudColor.setHex(0xffffff);
        targetCloudOpacity = 0.92;
        targetWindowRimIntensity = 0.25;
      } else { // 'night'
        // Cozy midnight blue
        targetDirLightPos.set(-3.7, 2.5, -0.6);
        targetDirLightColor.setHex(0x38bdf8);
        targetDirLightIntensity = 0.0;
        targetNightLightIntensity = 0.85;

        targetAmbientColor.setHex(0x1e1b4b);
        targetAmbientIntensity = 0.25;
        targetRoomFillIntensity = 0.25;

        targetSkyColor.setHex(0x090d16); // Midnight dark sky
        targetSunPos.set(-3.7, 0.4, -3.0);
        targetSunOpacity = 0.0;
        targetMoonOpacity = 1.0;
        targetStarOpacity = 1.0;
        targetCloudColor.setHex(0x334155); // Translucent dark night clouds
        targetCloudOpacity = 0.35;
        targetWindowRimIntensity = 0.0;
      }

      // Smooth LERP Lighting & Celestial Object Movements
      dirLight.position.lerp(targetDirLightPos, 0.04);
      dirLight.color.lerp(targetDirLightColor, 0.04);
      dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, targetDirLightIntensity, 0.04);

      nightDirLight.intensity = THREE.MathUtils.lerp(nightDirLight.intensity, targetNightLightIntensity, 0.04);

      ambientLight.color.lerp(targetAmbientColor, 0.04);
      ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, targetAmbientIntensity, 0.04);

      roomFillLight.intensity = THREE.MathUtils.lerp(roomFillLight.intensity, targetRoomFillIntensity, 0.04);
      windowRimLight.intensity = THREE.MathUtils.lerp(windowRimLight.intensity, targetWindowRimIntensity, 0.04);

      (skyMat as any).color.lerp(targetSkyColor, 0.04);
      sunGroup.position.lerp(targetSunPos, 0.04);

      sunCoreMat.opacity = THREE.MathUtils.lerp(sunCoreMat.opacity, targetSunOpacity, 0.04);
      sunGlowMat.opacity = THREE.MathUtils.lerp(sunGlowMat.opacity, targetSunOpacity * 0.35, 0.04);

      moonMat.opacity = THREE.MathUtils.lerp(moonMat.opacity, targetMoonOpacity, 0.04);
      moonMaskMat.opacity = THREE.MathUtils.lerp(moonMaskMat.opacity, targetMoonOpacity, 0.04);
      moonGlowMat.opacity = THREE.MathUtils.lerp(moonGlowMat.opacity, targetMoonOpacity * 0.4, 0.04);

      starMat.opacity = THREE.MathUtils.lerp(starMat.opacity, targetStarOpacity, 0.04);

      (cloudMat as any).color.lerp(targetCloudColor, 0.04);
      cloudMat.opacity = THREE.MathUtils.lerp(cloudMat.opacity, targetCloudOpacity, 0.04);

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

      // Interactive Notebook smooth flip animation
      const targetNotebookAngle = isNotebookOpen ? 0 : Math.PI;
      const targetNotebookPosY = isNotebookOpen ? 0.002 : 0.014;
      rightWing.rotation.z = THREE.MathUtils.lerp(rightWing.rotation.z, targetNotebookAngle, 0.08);
      rightWing.position.y = THREE.MathUtils.lerp(rightWing.position.y, targetNotebookPosY, 0.08);

      // Interactive Closet Doors independent smooth sliding animation
      const targetDoorLeftX = isLeftDoorOpen ? 0.46 : -0.51;
      const targetDoorRightX = isRightDoorOpen ? -0.46 : 0.51;
      fDoorLeft.position.x = THREE.MathUtils.lerp(fDoorLeft.position.x, targetDoorLeftX, 0.08);
      fDoorRight.position.x = THREE.MathUtils.lerp(fDoorRight.position.x, targetDoorRightX, 0.08);

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
        isNotebookOpen = !isNotebookOpen;
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
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersectsDoorLeft = raycaster.intersectObject(doorLeftClickMesh, true);
      const intersectsDoorRight = raycaster.intersectObject(doorRightClickMesh, true);
      const intersectsNotebook = raycaster.intersectObject(notebookClickMesh, true);
      const intersectsBag = raycaster.intersectObject(backpackClickMesh, true);
      const intersectsBookshelf = raycaster.intersectObject(bookshelfClickMesh, true);
      const intersectsDesk = raycaster.intersectObject(deskClickMesh, true);
      if (
        intersectsDoorLeft.length > 0 ||
        intersectsDoorRight.length > 0 ||
        intersectsNotebook.length > 0 ||
        intersectsBag.length > 0 ||
        intersectsBookshelf.length > 0 ||
        intersectsDesk.length > 0
      ) {
        domElem.style.cursor = 'pointer';
      } else {
        domElem.style.cursor = '';
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    domElem.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('pointermove', handlePointerMove);

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
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('pointermove', handlePointerMove);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
