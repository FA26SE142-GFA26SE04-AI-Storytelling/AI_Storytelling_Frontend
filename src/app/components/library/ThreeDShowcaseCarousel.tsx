'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { WORKING_VOLUMES_BOOKS, WorkingVolumeBook } from '../three/room/textures/workingVolumesBooks';
import {
  BookMeshHolder,
  getShortestOffset,
  buildCarouselBookHolders,
  createBackdropDimmer,
} from './threeDCarouselFactory';

export interface ThreeDShowcaseCarouselProps {
  books?: WorkingVolumeBook[];
  activeIndex: number;
  isDetailOpen?: boolean;
  isExiting?: boolean;
  onSelectIndex: (index: number) => void;
  onToggleDetail?: () => void;
}

export const ThreeDShowcaseCarousel: React.FC<ThreeDShowcaseCarouselProps> = ({
  books,
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

    // 3. Build 3D Hardcover Book Models & Dimmer Backdrop
    const booksList = books && books.length > 0 ? books : WORKING_VOLUMES_BOOKS;
    const bookHolders: BookMeshHolder[] = buildCarouselBookHolders(scene, booksList);
    const { material: dimBackdropMat } = createBackdropDimmer(scene);

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

      if (curActive !== prevActiveIndex) {
        prevActiveIndex = curActive;
        targetRotY = isDetail ? -0.30 : -0.24;
        targetRotX = 0.04;
      }

      const total = booksList.length;
      const timeSec = (now - startTime) * 0.0015;

      rotY += (targetRotY - rotY) * 0.12;
      rotX += (targetRotX - rotX) * 0.12;

      const targetDimOpacity = isExiting ? 0.0 : (isDetail ? 0.55 : 0.0);
      dimBackdropMat.opacity += (targetDimOpacity - dimBackdropMat.opacity) * (isExiting ? 0.18 : 0.10);

      bookHolders.forEach((holder) => {
        const offset = getShortestOffset(holder.bookIndex, curActive, total);
        const isCenter = offset === 0;
        const isHovered = hoveredHolder === holder;

        let tx = 0;
        let ty = 0;
        let tz = 0;
        let ry = 0;
        let rx = 0;
        let rz = 0;
        let targetScale = restingScaleVec;

        if (isCenter) {
          if (isDetail) {
            tx = -0.92;
            ty = 0.06;
            tz = 1.35;
            ry = rotY;
            rx = rotX;
            rz = 0.01;
            targetScale = activeZoomedScaleVec;
          } else {
            const floatY = Math.sin(timeSec * 2.2) * 0.035;
            tx = 0;
            ty = -0.02 + floatY;
            tz = 0.95;
            ry = rotY;
            rx = rotX;
            rz = 0;
            targetScale = activeNormalScaleVec;
          }
        } else if (Math.abs(offset) === 1) {
          const side = Math.sign(offset);
          if (isDetail) {
            tx = side * 5.2;
            ty = -0.15;
            tz = -3.2;
            ry = -side * 0.75;
            targetScale = outerScaleVec;
          } else {
            tx = side * 2.85;
            ty = -0.08 + Math.sin(timeSec * 1.8 + offset) * 0.025;
            tz = -0.45;
            ry = -side * 0.42;
            targetScale = isHovered ? activeNormalScaleVec : restingScaleVec;
          }
        } else if (Math.abs(offset) === 2) {
          const side = Math.sign(offset);
          tx = side * 5.0;
          ty = -0.22;
          tz = -2.2;
          ry = -side * 0.70;
          targetScale = outerScaleVec;
        } else {
          const side = Math.sign(offset) || 1;
          tx = side * 9.0;
          ty = -0.5;
          tz = -6.0;
          targetScale = hiddenScaleVec;
        }

        const lerpFactor = 0.14;
        holder.group.position.x += (tx - holder.group.position.x) * lerpFactor;
        holder.group.position.y += (ty - holder.group.position.y) * lerpFactor;
        holder.group.position.z += (tz - holder.group.position.z) * lerpFactor;

        tempQuat.setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
        holder.group.quaternion.slerp(tempQuat, lerpFactor);
        holder.group.scale.lerp(targetScale, lerpFactor);
      });

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // 6. Interaction Handlers
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      hasMoved = false;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      dragStartX = clientX;
      dragStartY = clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const colliders = bookHolders.map((h) => h.clickCollider);
      const intersects = raycaster.intersectObjects(colliders);

      if (intersects.length > 0) {
        const hit = bookHolders.find((h) => h.clickCollider === intersects[0].object);
        hoveredHolder = hit || null;
        container.style.cursor = isDragging ? 'grabbing' : 'pointer';
      } else {
        hoveredHolder = null;
        container.style.cursor = isDragging ? 'grabbing' : 'default';
      }

      if (isDragging) {
        const dx = clientX - prevMouseX;
        const dy = clientY - prevMouseY;
        if (Math.hypot(clientX - dragStartX, clientY - dragStartY) > 6) {
          hasMoved = true;
        }

        targetRotY += dx * 0.007;
        targetRotX += dy * 0.007;
        targetRotX = Math.max(-0.45, Math.min(0.45, targetRotX));

        prevMouseX = clientX;
        prevMouseY = clientY;
      }
    };

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      if (!hasMoved) {
        const rect = container.getBoundingClientRect();
        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;

        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const colliders = bookHolders.map((h) => h.clickCollider);
        const intersects = raycaster.intersectObjects(colliders);

        if (intersects.length > 0) {
          const hit = bookHolders.find((h) => h.clickCollider === intersects[0].object);
          if (hit) {
            if (hit.bookIndex === activeIndexRef.current) {
              if (onToggleDetailRef.current) {
                onToggleDetailRef.current();
              }
            } else {
              onSelectIndexRef.current(hit.bookIndex);
            }
          }
        }
      } else {
        const total = WORKING_VOLUMES_BOOKS.length;
        const dragDistX = ('changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX) - dragStartX;
        if (Math.abs(dragDistX) > 65) {
          const step = dragDistX > 0 ? -1 : 1;
          const nextIndex = (activeIndexRef.current + step + total) % total;
          onSelectIndexRef.current(nextIndex);
        }
      }

      isDragging = false;
      hasMoved = false;
      container.style.cursor = 'default';
    };

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    container.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp, { passive: true });

    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);

      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);

      container.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
      renderer.dispose();
    };
  }, [books]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full flex items-center justify-center select-none overflow-hidden touch-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
