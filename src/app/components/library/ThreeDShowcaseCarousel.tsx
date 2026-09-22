'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import {
  WORKING_VOLUMES_BOOKS,
  WorkingVolumeBook,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeSpineTexture,
} from '../three/room/textures/workingVolumesBooks';

export interface ThreeDShowcaseCarouselProps {
  activeIndex: number;
  isInspectorOpen?: boolean;
  onSelectIndex: (index: number) => void;
  onOpenInspector: (bookId: string) => void;
}

interface BookMeshHolder {
  group: THREE.Group;
  book: WorkingVolumeBook;
  bookIndex: number;
  clickCollider: THREE.Mesh;
}

// Thuật toán smootherstep mượt mà theo chuẩn Meng To Bookshelf Renderer
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smootherstep(t: number): number {
  const c = clamp(t, 0, 1);
  return c * c * c * (c * (c * 6 - 15) + 10);
}

export const ThreeDShowcaseCarousel: React.FC<ThreeDShowcaseCarouselProps> = ({
  activeIndex,
  isInspectorOpen = false,
  onSelectIndex,
  onOpenInspector,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeIndexRef = useRef<number>(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const isInspectorOpenRef = useRef<boolean>(isInspectorOpen);
  useEffect(() => {
    isInspectorOpenRef.current = isInspectorOpen;
  }, [isInspectorOpen]);

  const onSelectIndexRef = useRef(onSelectIndex);
  useEffect(() => {
    onSelectIndexRef.current = onSelectIndex;
  }, [onSelectIndex]);

  const onOpenInspectorRef = useRef(onOpenInspector);
  useEffect(() => {
    onOpenInspectorRef.current = onOpenInspector;
  }, [onOpenInspector]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Scene, Camera & WebGLRenderer (Single Context!)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.2, 7.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    // 2. Studio Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.4);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.3);
    rimLight.position.set(-5, -2, 3);
    scene.add(rimLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.9);
    topLight.position.set(0, 6, 2);
    scene.add(topLight);

    // 3. Build 3D Hardcover Book Models for all 7 Working Volumes
    const bookHolders: BookMeshHolder[] = [];
    const bW = 1.75;
    const bH = 2.55;
    const bThickness = 0.26;
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

      const matFront = new THREE.MeshStandardMaterial({
        map: coverTex,
        roughness: 0.28,
        metalness: 0.22,
      });

      const frontMaterials = [
        matCoverSolid,
        matCoverSolid,
        matCoverSolid,
        matCoverSolid,
        matFront,
        matCoverSolid,
      ];

      const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, coverT), frontMaterials);
      frontMesh.position.set(0, 0, (bThickness - coverT) / 2);
      bGroup.add(frontMesh);

      // Back Cover
      const backMesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, coverT), matCoverSolid);
      backMesh.position.set(0, 0, -(bThickness - coverT) / 2);
      bGroup.add(backMesh);

      // Curved / Beveled Seamless Spine
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
        side: THREE.DoubleSide,
      });
      const spineMesh = new THREE.Mesh(spineGeo, matSpine);
      spineMesh.position.set(-bW / 2, 0, 0);
      spineMesh.scale.set(0.32, 1, 1);
      bGroup.add(spineMesh);

      // Pages Block
      const matPages = new THREE.MeshStandardMaterial({
        color: 0xfffcf5,
        roughness: 0.88,
        metalness: 0.0,
      });
      const pagesMesh = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.04, bH - 0.08, bThickness - coverT * 2 - 0.005), matPages);
      pagesMesh.position.set(0.02, 0, 0);
      bGroup.add(pagesMesh);

      // Hanging Silk Ribbon
      const matRibbon = new THREE.MeshStandardMaterial({
        color: new THREE.Color(book.foil),
        roughness: 0.25,
        metalness: 0.4,
      });
      const ribbonMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.01), matRibbon);
      ribbonMesh.position.set(0.22, -bH / 2 - 0.16, bThickness / 2);
      ribbonMesh.rotation.z = 0.08;
      bGroup.add(ribbonMesh);

      // Click Collider for Raycasting
      const clickCollider = new THREE.Mesh(
        new THREE.BoxGeometry(bW + 0.3, bH + 0.4, bThickness + 0.4),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      clickCollider.name = `carousel_book_${book.id}`;
      bGroup.add(clickCollider);

      bookHolders.push({
        group: bGroup,
        book,
        bookIndex: bIdx,
        clickCollider,
      });
    });

    // 4. Raycasting & Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let hoveredHolder: BookMeshHolder | null = null;

    const getShortestOffset = (idx: number, active: number, total: number) => {
      let diff = idx - active;
      while (diff > total / 2) diff -= total;
      while (diff < -total / 2) diff += total;
      return diff;
    };

    // 5. Kinematic Pose & Animation Render Loop (applyOpeningPose with smootherstep)
    let animId: number;
    let isDisposed = false;
    let startTime = Date.now();

    // Transition State Tracking
    let prevActiveIndex = activeIndexRef.current;
    let transitionProgress = 1.0;
    let transitionDuration = 700; // ms
    let transitionStartTime = Date.now();

    // Inspector Drag-to-Rotate 360 State
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let inspectorRotY = -0.32;
    let inspectorRotX = 0.06;
    let targetInspectorRotY = -0.32;
    let targetInspectorRotX = 0.06;

    // Temp 3D Math Vectors & Quaternions
    const tempEuler = new THREE.Euler();
    const tempQuat = new THREE.Quaternion();
    const inspectScaleVec = new THREE.Vector3(1.08, 1.08, 1.08);
    const restingScaleVec = new THREE.Vector3(0.92, 0.92, 0.92);
    const outerScaleVec = new THREE.Vector3(0.80, 0.80, 0.80);
    const hiddenScaleVec = new THREE.Vector3(0.001, 0.001, 0.001);
    const inspectorActiveScaleVec = new THREE.Vector3(1.05, 1.05, 1.05);

    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      const now = Date.now();
      const curActive = activeIndexRef.current;
      const inInspector = isInspectorOpenRef.current;

      // Kích hoạt transition mở/chuyển pose khi đổi active book
      if (curActive !== prevActiveIndex) {
        prevActiveIndex = curActive;
        transitionProgress = 0.0;
        transitionStartTime = now;
        targetInspectorRotY = -0.32;
        targetInspectorRotX = 0.06;
      }

      if (transitionProgress < 1.0) {
        transitionProgress = Math.min(1.0, (now - transitionStartTime) / transitionDuration);
      }

      const total = WORKING_VOLUMES_BOOKS.length;
      const timeSec = (now - startTime) * 0.0015;

      // Smooth damping cho góc xoay trong chế độ Inspector
      inspectorRotY += (targetInspectorRotY - inspectorRotY) * 0.12;
      inspectorRotX += (targetInspectorRotX - inspectorRotX) * 0.12;

      // Cập nhật Pose cho từng cuốn sách theo chuẩn smootherstep kinematic
      bookHolders.forEach((holder) => {
        const offset = getShortestOffset(holder.bookIndex, curActive, total);
        const isCenter = offset === 0;
        const isHovered = hoveredHolder === holder;

        const targetPos = new THREE.Vector3();
        let targetScale = restingScaleVec.clone();
        let rotEuler = new THREE.Euler(-0.30, 0.08, 0, 'YXZ');

        if (inInspector) {
          // CHẾ ĐỘ INSPECTOR: Cuốn sách active nằm hẳn về phía cột bên trái màn hình
          if (isCenter) {
            const idleBob = isDragging ? 0 : Math.sin(timeSec * 1.8) * 0.02;
            targetPos.set(-2.95, 0.14 + idleBob, 0.75);
            targetScale = inspectorActiveScaleVec.clone();
            rotEuler.set(inspectorRotX, inspectorRotY, 0, 'YXZ');
          } else {
            // Các cuốn sách khác lùi xa và ẩn đi hoàn toàn
            targetPos.set(offset > 0 ? 12.0 : -12.0, -1.8, -5.0);
            targetScale = hiddenScaleVec.clone();
            rotEuler.set(0, 0, 0, 'YXZ');
          }
        } else {
          // CHẾ ĐỘ CAROUSEL KỆ SÁCH
          if (offset === 0) {
            // ACTIVE BOOK: Nổi bổng nhẹ nhàng (+0.42), đưa lên phía trước tự nhiên (+0.45)
            const floatBobY = Math.sin(timeSec * 2.4) * 0.035;
            const floatTiltX = Math.cos(timeSec * 1.8) * 0.02;
            const floatTiltY = Math.sin(timeSec * 1.6) * 0.025;

            targetPos.set(0, 0.42 + floatBobY, 0.45);
            targetScale = inspectScaleVec.clone();
            rotEuler.set(0.05 + floatTiltX, -0.22 + floatTiltY, 0, 'YXZ');
          } else if (offset === -1) {
            targetPos.set(-2.25, -0.06, 0.0);
            targetScale = restingScaleVec.clone();
            rotEuler.set(0.06, -0.22, 0, 'YXZ');
          } else if (offset === -2) {
            targetPos.set(-4.35, -0.10, -0.48);
            targetScale = outerScaleVec.clone();
            rotEuler.set(0.04, -0.14, 0, 'YXZ');
          } else if (offset === 1) {
            targetPos.set(2.25, -0.06, 0.0);
            targetScale = restingScaleVec.clone();
            rotEuler.set(0.06, -0.38, 0, 'YXZ');
          } else if (offset === 2) {
            targetPos.set(4.35, -0.10, -0.48);
            targetScale = outerScaleVec.clone();
            rotEuler.set(0.04, -0.46, 0, 'YXZ');
          } else if (offset < -2) {
            targetPos.set(-6.2, -0.14, -1.5);
            targetScale = hiddenScaleVec.clone();
            rotEuler.set(0, 0, 0, 'YXZ');
          } else {
            targetPos.set(6.2, -0.14, -1.5);
            targetScale = hiddenScaleVec.clone();
            rotEuler.set(0, 0, 0, 'YXZ');
          }

          // Hover micro-elevation nhẹ nhàng trong carousel
          if (isHovered && targetScale.x > 0.1) {
            targetPos.y += isCenter ? 0.06 : 0.14;
            targetPos.z += 0.08;
            rotEuler.y += mouse.x * 0.10;
            rotEuler.x -= mouse.y * 0.08;
          }
        }

        tempQuat.setFromEuler(rotEuler);

        // Interpolation với smootherstep LERP & SLERP mượt mà
        const lerpFactor = inInspector ? 0.12 : 0.10;
        holder.group.position.lerp(targetPos, lerpFactor);
        holder.group.quaternion.slerp(tempQuat, lerpFactor);
        holder.group.scale.lerp(targetScale, lerpFactor);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 6. Pointer & Drag Events
    const handlePointerDown = (e: PointerEvent) => {
      if (isInspectorOpenRef.current) {
        // Drag active anywhere on left 60% of viewport
        if (e.clientX < window.innerWidth * 0.60) {
          isDragging = true;
          prevMouseX = e.clientX;
          prevMouseY = e.clientY;
          canvas.style.cursor = 'grabbing';
        }
      }
    };

    const handlePointerUp = () => {
      if (isDragging) {
        isDragging = false;
        canvas.style.cursor = isInspectorOpenRef.current ? 'grab' : 'default';
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging && isInspectorOpenRef.current) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetInspectorRotY += deltaX * 0.012;
        targetInspectorRotX += deltaY * 0.009;
        targetInspectorRotX = Math.max(-0.75, Math.min(0.75, targetInspectorRotX));
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const colliders = bookHolders.map((h) => h.clickCollider);
      const intersects = raycaster.intersectObjects(colliders, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const found = bookHolders.find((h) => h.clickCollider === hit || h.group.children.includes(hit));
        hoveredHolder = found || null;
        canvas.style.cursor = isInspectorOpenRef.current ? 'grab' : 'pointer';
      } else {
        hoveredHolder = null;
        canvas.style.cursor = isInspectorOpenRef.current ? 'grab' : 'default';
      }
    };

    const handlePointerLeave = () => {
      mouse.set(-999, -999);
      hoveredHolder = null;
      isDragging = false;
      canvas.style.cursor = 'default';
    };

    const handleClick = (e: MouseEvent) => {
      if (isInspectorOpenRef.current) return; // Đang ở chế độ Inspector, click dùng kéo xoay

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
          if (found.bookIndex === activeIndexRef.current) {
            onOpenInspectorRef.current(found.book.id);
          } else {
            onSelectIndexRef.current(found.bookIndex);
          }
        }
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('click', handleClick);

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('click', handleClick);

      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[460px] sm:h-[520px] md:h-[580px] lg:h-[620px] flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
