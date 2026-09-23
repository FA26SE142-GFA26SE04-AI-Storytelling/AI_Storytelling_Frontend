'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import {
  WORKING_VOLUMES_BOOKS,
  WorkingVolumeBook,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeSpineTexture,
  createWorkingVolumeInsideCoverTexture,
  createWorkingVolumePageTexture,
} from '../three/room/textures/workingVolumesBooks';

export interface ThreeDShowcaseCarouselProps {
  activeIndex: number;
  isDetailOpen?: boolean;
  isExiting?: boolean;
  onSelectIndex: (index: number) => void;
  onToggleDetail?: () => void;
}

interface BookMeshHolder {
  group: THREE.Group;
  book: WorkingVolumeBook;
  bookIndex: number;
  clickCollider: THREE.Mesh;
}

// Thuật toán tính khoảng cách vòng tròn ngắn nhất
function getShortestOffset(index: number, activeIndex: number, total: number): number {
  let diff = (index - activeIndex) % total;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

export const ThreeDShowcaseCarousel: React.FC<ThreeDShowcaseCarouselProps> = ({
  activeIndex,
  isDetailOpen = false,
  isExiting = false,
  onSelectIndex,
  onToggleDetail,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeIndexRef = useRef<number>(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const isDetailOpenRef = useRef<boolean>(isDetailOpen);
  useEffect(() => {
    isDetailOpenRef.current = isDetailOpen;
  }, [isDetailOpen]);

  const isExitingRef = useRef<boolean>(isExiting);
  useEffect(() => {
    isExitingRef.current = isExiting;
  }, [isExiting]);

  const onSelectIndexRef = useRef(onSelectIndex);
  useEffect(() => {
    onSelectIndexRef.current = onSelectIndex;
  }, [onSelectIndex]);

  const onToggleDetailRef = useRef(onToggleDetail);
  useEffect(() => {
    onToggleDetailRef.current = onToggleDetail;
  }, [onToggleDetail]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Scene, Camera & WebGLRenderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.12, 7.6);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 2. Studio Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.7);
    keyLight.position.set(3.5, 5.0, 5.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 2.2);
    fillLight.position.set(-3.5, 3.5, 5.0);
    scene.add(fillLight);

    const centerFrontLight = new THREE.DirectionalLight(0xffffff, 1.8);
    centerFrontLight.position.set(0, 2.0, 6.0);
    scene.add(centerFrontLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.4);
    rimLight.position.set(-5, -2, 3);
    scene.add(rimLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.2);
    topLight.position.set(0, 6, 2);
    scene.add(topLight);

    // 3. Build 3D Hardcover Book Models
    const bookHolders: BookMeshHolder[] = [];
    const bW = 2.05;
    const bH = 2.68;
    const bThickness = 0.28;
    const coverT = 0.035;

    WORKING_VOLUMES_BOOKS.forEach((book, bIdx) => {
      const bGroup = new THREE.Group();
      scene.add(bGroup);

      const coverTex = createWorkingVolumeCoverTexture(book);
      const spineTex = createWorkingVolumeSpineTexture(book);

      const matCoverSolid = new THREE.MeshStandardMaterial({
        color: new THREE.Color(book.color),
        roughness: 0.38,
        metalness: 0.08,
      });

      const matFrontOutside = new THREE.MeshStandardMaterial({
        map: coverTex,
        roughness: 0.28,
        metalness: 0.22,
      });

      // A. Front Cover
      const frontMaterials = [
        matCoverSolid,   // +X
        matCoverSolid,   // -X
        matCoverSolid,   // +Y
        matCoverSolid,   // -Y
        matFrontOutside, // +Z (Bìa trước)
        matCoverSolid,   // -Z
      ];
      const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, coverT), frontMaterials);
      frontMesh.position.set(0, 0, (bThickness - coverT) / 2);
      bGroup.add(frontMesh);

      // B. Back Cover
      const backMesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, coverT), matCoverSolid);
      backMesh.position.set(0, 0, -(bThickness - coverT) / 2);
      bGroup.add(backMesh);

      // C. Curved Spine
      const spineGeo = new THREE.CylinderGeometry(
        bThickness / 2,
        bThickness / 2,
        bH,
        24,
        1,
        true,
        Math.PI,
        Math.PI
      );
      const matSpine = new THREE.MeshStandardMaterial({
        map: spineTex,
        roughness: 0.35,
        metalness: 0.18,
      });
      const spineMesh = new THREE.Mesh(spineGeo, matSpine);
      spineMesh.position.set(-bW / 2, 0, 0);
      spineMesh.rotation.y = 0;
      bGroup.add(spineMesh);

      // D. Book Block (Paper Pages)
      const paperW = bW - 0.06;
      const paperH = bH - 0.08;
      const paperT = bThickness - coverT * 2 - 0.005;

      const paperCanvas = document.createElement('canvas');
      paperCanvas.width = 256;
      paperCanvas.height = 256;
      const pCtx = paperCanvas.getContext('2d')!;
      pCtx.fillStyle = '#f8f4eb';
      pCtx.fillRect(0, 0, 256, 256);
      pCtx.fillStyle = '#dfd8c8';
      for (let i = 0; i < 256; i += 3) {
        pCtx.fillRect(0, i, 256, 1);
      }
      const paperTex = new THREE.CanvasTexture(paperCanvas);

      const matPaperSides = new THREE.MeshStandardMaterial({
        map: paperTex,
        roughness: 0.85,
        metalness: 0.02,
      });

      const paperMesh = new THREE.Mesh(
        new THREE.BoxGeometry(paperW, paperH, paperT),
        matPaperSides
      );
      paperMesh.position.set(0.02, 0, 0);
      bGroup.add(paperMesh);

      // E. Click Collider
      const colliderGeo = new THREE.BoxGeometry(bW + 0.4, bH + 0.4, bThickness + 0.6);
      const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
      const clickCollider = new THREE.Mesh(colliderGeo, colliderMat);
      bGroup.add(clickCollider);

      bookHolders.push({
        group: bGroup,
        book,
        bookIndex: bIdx,
        clickCollider,
      });
    });

    // Dark Backdrop Dimmer Plane (Lớp nền tối mờ tràn toàn màn hình làm nổi bật cuốn sách khi mở popup)
    const dimBackdropGeo = new THREE.PlaneGeometry(240, 160);
    const dimBackdropMat = new THREE.MeshBasicMaterial({
      color: 0x05070c,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const dimBackdropMesh = new THREE.Mesh(dimBackdropGeo, dimBackdropMat);
    dimBackdropMesh.position.set(0, 0, -4.5);
    dimBackdropMesh.renderOrder = -1;
    scene.add(dimBackdropMesh);

    // 4. State & Drag Variables
    let isDisposed = false;
    let animId: number;
    const startTime = Date.now();

    const mouse = new THREE.Vector2(-999, -999);
    const raycaster = new THREE.Raycaster();
    let hoveredHolder: BookMeshHolder | null = null;

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let hasMoved = false;

    let rotY = -0.22;
    let rotX = 0.05;
    let targetRotY = -0.22;
    let targetRotX = 0.05;

    let prevActiveIndex = activeIndex;

    const tempQuat = new THREE.Quaternion();
    const activeZoomedScaleVec = new THREE.Vector3(1.06, 1.06, 1.06);
    const activeNormalScaleVec = new THREE.Vector3(1.04, 1.04, 1.04);
    const restingScaleVec = new THREE.Vector3(0.84, 0.84, 0.84);
    const outerScaleVec = new THREE.Vector3(0.70, 0.70, 0.70);
    const hiddenScaleVec = new THREE.Vector3(0.001, 0.001, 0.001);

    // 5. Render Loop
    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      const now = Date.now();
      const curActive = activeIndexRef.current;
      const isDetail = isDetailOpenRef.current;
      const isExiting = isExitingRef.current;

      // Khi chuyển sang cuốn sách khác, reset nhẹ góc xoay
      if (curActive !== prevActiveIndex) {
        prevActiveIndex = curActive;
        targetRotY = isDetail ? -0.30 : -0.24;
        targetRotX = 0.04;
      }

      const total = WORKING_VOLUMES_BOOKS.length;
      const timeSec = (now - startTime) * 0.0015;

      // Smooth damping góc xoay 3D
      rotY += (targetRotY - rotY) * 0.12;
      rotX += (targetRotX - rotX) * 0.12;

      // Hiệu ứng làm tối mờ nền xung quanh khi mở popup chi tiết (fade out khi exit)
      const targetDimOpacity = isExiting ? 0.0 : (isDetail ? 0.55 : 0.0);
      dimBackdropMat.opacity += (targetDimOpacity - dimBackdropMat.opacity) * (isExiting ? 0.18 : 0.10);

      bookHolders.forEach((holder) => {
        const offset = getShortestOffset(holder.bookIndex, curActive, total);
        const isCenter = offset === 0;
        const isHovered = hoveredHolder === holder;

        const targetPos = new THREE.Vector3();
        let targetScale = restingScaleVec.clone();
        const rotEuler = new THREE.Euler(0, 0, 0, 'YXZ');

        const floatBobY = isDragging || isExiting ? 0 : Math.sin(timeSec * 2.2) * 0.03;
        const floatTiltX = isDragging || isExiting ? 0 : Math.cos(timeSec * 1.8) * 0.012;
        const floatTiltY = isDragging || isExiting ? 0 : Math.sin(timeSec * 1.6) * 0.015;

        if (isCenter) {
          if (isDetail) {
            // TRẠNG THÁI MỞ POPUP CHI TIẾT: Căn vừa vặn nửa bên trái gần trung tâm màn hình
            targetPos.set(-1.15, 0.05 + floatBobY, 0.85);
            targetScale = activeZoomedScaleVec.clone();
            rotEuler.set(rotX + floatTiltX, rotY + floatTiltY, 0, 'YXZ');
          } else {
            // TRẠNG THÁI CAROUSEL TRUNG TÂM
            targetPos.set(0, 0.08 + floatBobY, 0.35);
            targetScale = activeNormalScaleVec.clone();
            rotEuler.set(rotX + floatTiltX, rotY + floatTiltY, 0, 'YXZ');
          }
        } else if (offset === -1) {
          targetPos.set(isDetail ? -7.20 : -2.30, -0.04, isDetail ? -2.2 : -0.15);
          targetScale = isDetail ? outerScaleVec.clone() : restingScaleVec.clone();
          rotEuler.set(0.06, isDetail ? 0.35 : 0.28, 0, 'YXZ');
        } else if (offset === -2) {
          targetPos.set(isDetail ? -10.50 : -4.60, -0.08, isDetail ? -3.2 : -0.60);
          targetScale = outerScaleVec.clone();
          rotEuler.set(0.04, isDetail ? 0.25 : 0.18, 0, 'YXZ');
        } else if (offset === 1) {
          targetPos.set(isDetail ? 7.20 : 2.30, -0.04, isDetail ? -2.2 : -0.15);
          targetScale = isDetail ? outerScaleVec.clone() : restingScaleVec.clone();
          rotEuler.set(0.06, isDetail ? -0.35 : -0.28, 0, 'YXZ');
        } else if (offset === 2) {
          targetPos.set(isDetail ? 10.50 : 4.60, -0.08, isDetail ? -3.2 : -0.60);
          targetScale = outerScaleVec.clone();
          rotEuler.set(0.04, isDetail ? -0.25 : -0.18, 0, 'YXZ');
        } else if (offset < -2) {
          targetPos.set(isDetail ? -14.0 : -7.50, -0.16, -3.5);
          targetScale = hiddenScaleVec.clone();
          rotEuler.set(0, 0, 0, 'YXZ');
        } else {
          targetPos.set(isDetail ? 14.0 : 7.50, -0.16, -3.5);
          targetScale = hiddenScaleVec.clone();
          rotEuler.set(0, 0, 0, 'YXZ');
        }

        // Hover micro-elevation cho các cuốn 2 bên
        if (isHovered && !isCenter && targetScale.x > 0.1 && !isExiting) {
          targetPos.y += 0.12;
          targetPos.z += 0.10;
        }

        // KHI THOÁT RA TOÀN CẢNH: Quyển sách di chuyển bay lên trên và mờ dần
        if (isExiting) {
          targetPos.set(targetPos.x, targetPos.y + 8.5, targetPos.z - 0.5);
          targetScale = hiddenScaleVec.clone();
          rotEuler.x -= 0.35;
        }

        tempQuat.setFromEuler(rotEuler);

        // Kinematic interpolation
        const lerpSpeed = isExiting ? 0.15 : 0.10;
        holder.group.position.lerp(targetPos, lerpSpeed);
        holder.group.quaternion.slerp(tempQuat, lerpSpeed);
        holder.group.scale.lerp(targetScale, lerpSpeed);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 6. Pointer & Drag Events
    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const inCanvas = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );

      if (inCanvas) {
        isDragging = true;
        hasMoved = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDragging) {
        isDragging = false;
        canvas.style.cursor = hoveredHolder ? 'pointer' : 'default';

        // Nếu chỉ là một cú click nhẹ (không kéo di chuyển), xử lý mở popup / chọn sách
        if (!hasMoved) {
          const rect = canvas.getBoundingClientRect();
          const clickMouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
          );

          raycaster.setFromCamera(clickMouse, camera);
          const colliders = bookHolders.map((h) => h.clickCollider);
          const intersects = raycaster.intersectObjects(colliders, true);

          if (intersects.length > 0) {
            const hit = intersects[0].object;
            const found = bookHolders.find((h) => h.clickCollider === hit || h.group.children.includes(hit));
            if (found) {
              if (found.bookIndex !== activeIndexRef.current) {
                onSelectIndexRef.current(found.bookIndex);
              } else if (onToggleDetailRef.current) {
                // Nhấn vào cuốn sách ở giữa -> Hiện UI Popup chi tiết bên cạnh!
                onToggleDetailRef.current();
              }
            }
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        const distMoved = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
        if (distMoved > 4) {
          hasMoved = true;
        }

        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetRotY += deltaX * 0.012;
        targetRotX += deltaY * 0.009;
        targetRotX = Math.max(-0.75, Math.min(0.75, targetRotX));
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const colliders = bookHolders.map((h) => h.clickCollider);
      const intersects = raycaster.intersectObjects(colliders, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const found = bookHolders.find((h) => h.clickCollider === hit || h.group.children.includes(hit));
        hoveredHolder = found || null;
        canvas.style.cursor = 'pointer';
      } else {
        hoveredHolder = null;
        canvas.style.cursor = 'default';
      }
    };

    const handlePointerLeave = () => {
      mouse.set(-999, -999);
      hoveredHolder = null;
      isDragging = false;
      canvas.style.cursor = 'default';
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    // 7. Resize Handler
    const handleResize = () => {
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-full flex items-center justify-center select-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-default touch-none"
      />
    </div>
  );
};
