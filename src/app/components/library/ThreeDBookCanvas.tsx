'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import {
  WorkingVolumeBook,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeSpineTexture,
} from '../three/room/textures/workingVolumesBooks';

export interface ThreeDBookCanvasProps {
  book: WorkingVolumeBook;
  isCenter: boolean;
  offset: number;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export const ThreeDBookCanvas: React.FC<ThreeDBookCanvasProps> = ({
  book,
  isCenter,
  offset,
  width = 240,
  height = 340,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, isHovered: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // 2. Studio Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    rimLight.position.set(-3, -2, 2);
    scene.add(rimLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(0, 5, 1);
    scene.add(topLight);

    // 3. 3D Hardcover Book Geometry
    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    const bW = 1.85;
    const bH = 2.65;
    const bThickness = 0.28;
    const coverT = 0.035;

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

    const frontMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bW, bH, coverT),
      frontMaterials
    );
    frontMesh.position.set(0, 0, (bThickness - coverT) / 2);
    bookGroup.add(frontMesh);

    // Back Cover
    const backMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bW, bH, coverT),
      matCoverSolid
    );
    backMesh.position.set(0, 0, -(bThickness - coverT) / 2);
    bookGroup.add(backMesh);

    // Spine Mesh (Left curved/beveled spine)
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
    bookGroup.add(spineMesh);

    // Paper Pages Block
    const matPages = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      roughness: 0.88,
      metalness: 0.0,
    });
    const pagesMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bW - 0.04, bH - 0.08, bThickness - coverT * 2 - 0.005),
      matPages
    );
    pagesMesh.position.set(0.02, 0, 0);
    bookGroup.add(pagesMesh);

    // Hanging Ribbon Bookmark
    const matRibbon = new THREE.MeshStandardMaterial({
      color: new THREE.Color(book.foil),
      roughness: 0.25,
      metalness: 0.4,
    });
    const ribbonMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.50, 0.01),
      matRibbon
    );
    ribbonMesh.position.set(0.25, -bH / 2 - 0.18, bThickness / 2);
    ribbonMesh.rotation.z = 0.08;
    bookGroup.add(ribbonMesh);

    // Initial 3D Orientations
    let targetRotY = -0.32; // Default slight isometric 3D angle (~ -18 deg)
    let targetRotX = 0.08;  // Slight pitch (~ 5 deg)
    let targetScale = isCenter ? 1.05 : 0.88;

    if (offset === -2) {
      targetRotY = -0.15;
      targetRotX = 0.04;
    } else if (offset === -1) {
      targetRotY = -0.24;
      targetRotX = 0.06;
    } else if (offset === 0) {
      targetRotY = -0.30;
      targetRotX = 0.10;
    } else if (offset === 1) {
      targetRotY = -0.38;
      targetRotX = 0.08;
    } else if (offset === 2) {
      targetRotY = -0.46;
      targetRotX = 0.06;
    }

    bookGroup.rotation.set(targetRotX, targetRotY, 0);
    bookGroup.scale.setScalar(targetScale);

    // 4. Animation Loop with Interactive Tilt
    let animId: number;
    let isDisposed = false;

    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      // Interactive mouse tilt
      const mouse = mouseRef.current;
      const hoverTiltX = mouse.isHovered ? -mouse.y * 0.25 : 0;
      const hoverTiltY = mouse.isHovered ? mouse.x * 0.35 : 0;
      const hoverScale = mouse.isHovered ? targetScale * 1.06 : targetScale;

      bookGroup.rotation.y = THREE.MathUtils.lerp(
        bookGroup.rotation.y,
        targetRotY + hoverTiltY,
        0.08
      );
      bookGroup.rotation.x = THREE.MathUtils.lerp(
        bookGroup.rotation.x,
        targetRotX + hoverTiltX,
        0.08
      );
      bookGroup.scale.lerp(
        new THREE.Vector3(hoverScale, hoverScale, hoverScale),
        0.08
      );

      renderer.render(scene, camera);
    };

    animate();

    // 5. Pointer Listeners
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      mouseRef.current.isHovered = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current.isHovered = false;
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);

      renderer.dispose();
      matCoverSolid.dispose();
      matFront.dispose();
      matSpine.dispose();
      matPages.dispose();
      matRibbon.dispose();
    };
  }, [book, isCenter, offset, width, height]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className="relative flex flex-col items-center justify-center cursor-pointer select-none transition-transform duration-300 active:scale-95"
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
      />
    </div>
  );
};
