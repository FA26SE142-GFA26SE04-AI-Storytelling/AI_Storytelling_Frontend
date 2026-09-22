'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import {
  WorkingVolumeBook,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeSpineTexture,
} from '../three/room/textures/workingVolumesBooks';

export interface ThreeDInspectorBookCanvasProps {
  book: WorkingVolumeBook;
  onOpenReader?: (book: WorkingVolumeBook) => void;
}

export const ThreeDInspectorBookCanvas: React.FC<ThreeDInspectorBookCanvasProps> = ({
  book,
  onOpenReader,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const rotTarget = useRef({ x: 0.06, y: -0.36 });
  const currentRot = useRef({ x: 0.06, y: -0.36 });

  useEffect(() => {
    // Reset rotation on book change
    rotTarget.current = { x: 0.06, y: -0.36 };
    currentRot.current = { x: 0.06, y: -0.36 };
  }, [book.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 2. Studio Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.6);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.4);
    rimLight.position.set(-5, -2, 3);
    scene.add(rimLight);

    const goldAccentLight = new THREE.PointLight(0xfde047, 1.2, 8);
    goldAccentLight.position.set(1.5, 2, 2.5);
    scene.add(goldAccentLight);

    // 3. 3D Hardcover Book Construction (Flawless Multi-Material & Curved Spine)
    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    const bW = 2.1;
    const bH = 3.0;
    const bThickness = 0.32;
    const coverT = 0.035;

    const coverTex = createWorkingVolumeCoverTexture(book);
    const spineTex = createWorkingVolumeSpineTexture(book);

    // Vật liệu cạnh và mặt trong bìa sách
    const matCoverSolid = new THREE.MeshStandardMaterial({
      color: new THREE.Color(book.color),
      roughness: 0.38,
      metalness: 0.08,
    });

    // Vật liệu mặt bìa trước (Cover Artwork with Gold Foil)
    const matCoverFrontFace = new THREE.MeshStandardMaterial({
      map: coverTex,
      roughness: 0.28,
      metalness: 0.22,
    });

    // Multi-Material Array cho Bìa trước (chỉ map texture lên mặt trước +Z)
    const frontMaterials = [
      matCoverSolid,     // +X (Cạnh phải)
      matCoverSolid,     // -X (Cạnh gáy)
      matCoverSolid,     // +Y (Mép trên)
      matCoverSolid,     // -Y (Mép dưới)
      matCoverFrontFace, // +Z (Mặt trước chính)
      matCoverSolid,     // -Z (Mặt trong bìa)
    ];

    const frontMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bW, bH, coverT),
      frontMaterials
    );
    frontMesh.position.set(0, 0, (bThickness - coverT) / 2);
    bookGroup.add(frontMesh);

    // Bìa sau (Back Cover)
    const backMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bW, bH, coverT),
      matCoverSolid
    );
    backMesh.position.set(0, 0, -(bThickness - coverT) / 2);
    bookGroup.add(backMesh);

    // Gáy sách cong nhẹ thanh thoát, chuẩn bìa cứng hiện đại (Gentle Sleek Spine Curve)
    const spineRadius = bThickness / 2;
    const spineGeo = new THREE.CylinderGeometry(
      spineRadius, // radiusTop
      spineRadius, // radiusBottom
      bH,          // height
      32,          // radialSegments
      1,           // heightSegments
      true,        // openEnded
      Math.PI,     // thetaStart (ôm khít mép gáy từ bìa sau sang bìa trước)
      Math.PI      // thetaLength (bán nguyệt 180 độ)
    );

    const matSpine = new THREE.MeshStandardMaterial({
      map: spineTex,
      roughness: 0.32,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });

    const spineMesh = new THREE.Mesh(spineGeo, matSpine);
    spineMesh.position.set(-bW / 2, 0, 0);
    spineMesh.scale.set(0.32, 1, 1); // Giảm độ lồi xuống 0.32 giúp gáy phẳng nhẹ, thanh thoát
    bookGroup.add(spineMesh);

    // Khối ruột giấy (Cream Paper Pages Block)
    const matPages = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      roughness: 0.85,
      metalness: 0.0,
    });
    const pagesW = bW - 0.05;
    const pagesH = bH - 0.08;
    const pagesThickness = bThickness - coverT * 2 - 0.005;
    const pagesMesh = new THREE.Mesh(
      new THREE.BoxGeometry(pagesW, pagesH, pagesThickness),
      matPages
    );
    pagesMesh.position.set(0.025, 0, 0);
    bookGroup.add(pagesMesh);

    // Ruy-băng lụa đánh dấu trang (Silk Ribbon Bookmark)
    const matRibbon = new THREE.MeshStandardMaterial({
      color: new THREE.Color(book.foil),
      roughness: 0.2,
      metalness: 0.5,
    });
    const ribbonMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.012), matRibbon);
    ribbonMesh.position.set(0.32, -bH / 2 - 0.2, bThickness / 2);
    ribbonMesh.rotation.z = 0.08;
    bookGroup.add(ribbonMesh);

    // Đệm vải bọc đầu gáy (Headband Cloth Strip)
    const matHeadband = new THREE.MeshStandardMaterial({
      color: new THREE.Color(book.foil),
      roughness: 0.4,
    });
    const headbandTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, bThickness - 0.05, 12),
      matHeadband
    );
    headbandTop.rotation.x = Math.PI / 2;
    headbandTop.position.set(-bW / 2 + 0.008, bH / 2 - 0.038, 0);
    bookGroup.add(headbandTop);

    const headbandBottom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, bThickness - 0.05, 12),
      matHeadband
    );
    headbandBottom.rotation.x = Math.PI / 2;
    headbandBottom.position.set(-bW / 2 + 0.008, -bH / 2 + 0.038, 0);
    bookGroup.add(headbandBottom);

    // 4. Animation Loop (Smooth 3D Drag Orbit & Gentle Floating)
    let animId: number;
    let isDisposed = false;
    let startTime = Date.now();

    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      const elapsed = (Date.now() - startTime) * 0.0015;

      // Gentle floating sine wave when not dragging
      const idleFloatY = isDraggingRef.current ? 0 : Math.sin(elapsed * 1.5) * 0.05;
      const idleTiltY = isDraggingRef.current ? 0 : Math.cos(elapsed * 1.2) * 0.04;

      currentRot.current.x = THREE.MathUtils.lerp(currentRot.current.x, rotTarget.current.x, 0.08);
      currentRot.current.y = THREE.MathUtils.lerp(currentRot.current.y, rotTarget.current.y, 0.08);

      bookGroup.rotation.x = currentRot.current.x;
      bookGroup.rotation.y = currentRot.current.y + idleTiltY;
      bookGroup.position.y = idleFloatY;

      renderer.render(scene, camera);
    };

    animate();

    // 5. Interactive Drag Orbit
    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      rotTarget.current.y += dx * 0.008;
      rotTarget.current.x = Math.max(-0.6, Math.min(0.6, rotTarget.current.x + dy * 0.008));
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    // 6. Resize Observer
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
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);

      renderer.dispose();
      matCoverFrontFace.dispose();
      matCoverSolid.dispose();
      matSpine.dispose();
      matPages.dispose();
      matRibbon.dispose();
      matHeadband.dispose();
    };
  }, [book.id]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[360px] sm:h-[460px] lg:h-[520px] flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
