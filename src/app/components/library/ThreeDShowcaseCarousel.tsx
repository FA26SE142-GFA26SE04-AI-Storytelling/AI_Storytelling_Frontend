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
  isBookOpened?: boolean;
  onSelectIndex: (index: number) => void;
  onToggleBookOpen?: () => void;
}

interface BookMeshHolder {
  group: THREE.Group;
  frontCoverPivot: THREE.Group;
  book: WorkingVolumeBook;
  bookIndex: number;
  clickCollider: THREE.Mesh;
  currentCoverAngle: number;
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
  isBookOpened = false,
  onSelectIndex,
  onToggleBookOpen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeIndexRef = useRef<number>(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const isBookOpenedRef = useRef<boolean>(isBookOpened);
  useEffect(() => {
    isBookOpenedRef.current = isBookOpened;
  }, [isBookOpened]);

  const onSelectIndexRef = useRef(onSelectIndex);
  useEffect(() => {
    onSelectIndexRef.current = onSelectIndex;
  }, [onSelectIndex]);

  const onToggleBookOpenRef = useRef(onToggleBookOpen);
  useEffect(() => {
    onToggleBookOpenRef.current = onToggleBookOpen;
  }, [onToggleBookOpen]);

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

    // 3. Build 3D Hardcover Book Models with Interactive Hinged Cover
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
      const insideCoverTex = createWorkingVolumeInsideCoverTexture(book);
      const firstPageTex = createWorkingVolumePageTexture(book);

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

      const matFrontInside = new THREE.MeshStandardMaterial({
        map: insideCoverTex,
        roughness: 0.50,
        metalness: 0.05,
      });

      // A. Front Cover with Pivot Hinge at Left Spine Edge
      const frontCoverPivot = new THREE.Group();
      frontCoverPivot.position.set(-bW / 2, 0, (bThickness - coverT) / 2);
      bGroup.add(frontCoverPivot);

      const frontMaterials = [
        matCoverSolid,   // +X
        matCoverSolid,   // -X
        matCoverSolid,   // +Y
        matCoverSolid,   // -Y
        matFrontOutside, // +Z (Bìa ngoài trước)
        matFrontInside,  // -Z (Mặt trong bìa khi lật mở)
      ];

      const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, coverT), frontMaterials);
      frontMesh.position.set(bW / 2, 0, 0);
      frontCoverPivot.add(frontMesh);

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
      spineMesh.rotation.y = 0; // Bản lề chuẩn ôm trọn mép trái từ bìa sau sang bìa trước
      bGroup.add(spineMesh);

      // D. Book Block (Paper Pages) with First Page on Front
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

      const matFirstPage = new THREE.MeshStandardMaterial({
        map: firstPageTex,
        roughness: 0.55,
        metalness: 0.04,
      });

      const paperMaterials = [
        matPaperSides, // +X (Mép trang phải)
        matPaperSides, // -X (Gáy trang trái)
        matPaperSides, // +Y (Mép trên)
        matPaperSides, // -Y (Mép dưới)
        matFirstPage,  // +Z (Trang đầu tiên lộ ra khi mở bìa!)
        matPaperSides, // -Z (Mặt sau gắn bìa sau)
      ];

      const paperMesh = new THREE.Mesh(
        new THREE.BoxGeometry(paperW, paperH, paperT),
        paperMaterials
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
        frontCoverPivot,
        book,
        bookIndex: bIdx,
        clickCollider,
        currentCoverAngle: 0,
      });
    });

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
    let prevOpenedState = isBookOpened;

    const tempQuat = new THREE.Quaternion();
    const activeZoomedScaleVec = new THREE.Vector3(1.14, 1.14, 1.14);
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
      const isOpened = isBookOpenedRef.current;

      // Khi chuyển sang cuốn sách khác hoặc đóng/mở sách, đồng bộ lại góc xoay
      if (curActive !== prevActiveIndex || isOpened !== prevOpenedState) {
        prevActiveIndex = curActive;
        prevOpenedState = isOpened;
        targetRotY = isOpened ? 0.0 : -0.24;
        targetRotX = isOpened ? 0.0 : 0.03;
      }

      const total = WORKING_VOLUMES_BOOKS.length;
      const timeSec = (now - startTime) * 0.0015;

      // Smooth damping góc xoay 3D
      if (isOpened) {
        targetRotY = 0.0;
        targetRotX = 0.0;
      }
      rotY += (targetRotY - rotY) * 0.12;
      rotX += (targetRotX - rotX) * 0.12;

      bookHolders.forEach((holder) => {
        const offset = getShortestOffset(holder.bookIndex, curActive, total);
        const isCenter = offset === 0;
        const isHovered = hoveredHolder === holder;

        const targetPos = new THREE.Vector3();
        let targetScale = restingScaleVec.clone();
        const rotEuler = new THREE.Euler(0, 0, 0, 'YXZ');

        // Góc mở bìa (0 khi đóng, -Math.PI khi mở thẳng hoàn toàn)
        const targetCoverAngle = isCenter && isOpened ? -Math.PI : 0;
        holder.currentCoverAngle += (targetCoverAngle - holder.currentCoverAngle) * 0.12;
        holder.frontCoverPivot.rotation.y = holder.currentCoverAngle;

        if (isCenter) {
          if (isOpened) {
            // TRẠNG THÁI ZOOM VÀO & MỞ BÌA: Khóa góc thẳng chính diện 100% hướng về người dùng
            targetPos.set((bW / 2) * activeZoomedScaleVec.x, -0.04, 1.65);
            targetScale = activeZoomedScaleVec.clone();
            rotEuler.set(0, 0, 0, 'YXZ');
          } else {
            // TRẠNG THÁI CAROUSEL TRUNG TÂM BÌA ĐÓNG
            const floatBobY = isDragging ? 0 : Math.sin(timeSec * 2.2) * 0.03;
            const floatTiltX = isDragging ? 0 : Math.cos(timeSec * 1.8) * 0.012;
            const floatTiltY = isDragging ? 0 : Math.sin(timeSec * 1.6) * 0.015;

            targetPos.set(0, 0.08 + floatBobY, 0.35);
            targetScale = activeNormalScaleVec.clone();
            rotEuler.set(rotX + floatTiltX, rotY + floatTiltY, 0, 'YXZ');
          }
        } else if (offset === -1) {
          targetPos.set(isOpened ? -5.2 : -2.35, -0.04, isOpened ? -1.6 : -0.12);
          targetScale = isOpened ? outerScaleVec.clone() : restingScaleVec.clone();
          rotEuler.set(0.06, -0.28, 0, 'YXZ');
        } else if (offset === -2) {
          targetPos.set(isOpened ? -8.2 : -4.50, -0.08, isOpened ? -2.6 : -0.55);
          targetScale = outerScaleVec.clone();
          rotEuler.set(0.04, -0.18, 0, 'YXZ');
        } else if (offset === 1) {
          targetPos.set(isOpened ? 5.2 : 2.35, -0.04, isOpened ? -1.6 : -0.12);
          targetScale = isOpened ? outerScaleVec.clone() : restingScaleVec.clone();
          rotEuler.set(0.06, -0.42, 0, 'YXZ');
        } else if (offset === 2) {
          targetPos.set(isOpened ? 8.2 : 4.50, -0.08, isOpened ? -2.6 : -0.55);
          targetScale = outerScaleVec.clone();
          rotEuler.set(0.04, -0.52, 0, 'YXZ');
        } else if (offset < -2) {
          targetPos.set(-9.5, -0.16, -3.0);
          targetScale = hiddenScaleVec.clone();
          rotEuler.set(0, 0, 0, 'YXZ');
        } else {
          targetPos.set(9.5, -0.16, -3.0);
          targetScale = hiddenScaleVec.clone();
          rotEuler.set(0, 0, 0, 'YXZ');
        }

        // Hover micro-elevation cho các cuốn 2 bên
        if (isHovered && !isCenter && targetScale.x > 0.1) {
          targetPos.y += 0.12;
          targetPos.z += 0.10;
        }

        tempQuat.setFromEuler(rotEuler);

        // Kinematic interpolation
        holder.group.position.lerp(targetPos, 0.10);
        holder.group.quaternion.slerp(tempQuat, 0.10);
        holder.group.scale.lerp(targetScale, 0.10);
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
        if (!isBookOpenedRef.current) {
          canvas.style.cursor = 'grabbing';
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDragging) {
        isDragging = false;
        canvas.style.cursor = hoveredHolder ? 'pointer' : 'default';

        // Nếu chỉ là một cú click nhẹ (không kéo di chuyển), xử lý mở sách / chọn sách
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
              } else if (onToggleBookOpenRef.current) {
                // Nhấn vào cuốn sách ở giữa -> Zoom vào và mở ra!
                onToggleBookOpenRef.current();
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
        // Khi sách đang mở, không cho phép kéo xoay 3D
        if (isBookOpenedRef.current) {
          const distMoved = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
          if (distMoved > 4) {
            hasMoved = true;
          }
          return;
        }

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
      className="relative w-full h-[440px] sm:h-[540px] lg:h-[620px] flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-default touch-none"
      />
    </div>
  );
};
