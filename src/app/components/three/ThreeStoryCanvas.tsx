'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type SceneMode = 'cosmos' | 'portal' | 'orbs';
export type ThemeColor = 'coral' | 'gold' | 'mint' | 'purple';

interface ThreeStoryCanvasProps {
  sceneMode?: SceneMode;
  speed?: number;
  themeColor?: ThemeColor;
  wireframe?: boolean;
  particleCount?: number;
  className?: string;
}

const COLOR_MAP: Record<ThemeColor, { primary: number; secondary: number; accent: number }> = {
  coral: { primary: 0xe63946, secondary: 0xff5a5a, accent: 0xffc736 },
  gold: { primary: 0xd97706, secondary: 0xffc736, accent: 0xf59e0b },
  mint: { primary: 0x059669, secondary: 0x00d696, accent: 0x34d399 },
  purple: { primary: 0x8b5cf6, secondary: 0xc084fc, accent: 0xf472b6 },
};

export const ThreeStoryCanvas: React.FC<ThreeStoryCanvasProps> = ({
  sceneMode = 'portal',
  speed = 1.0,
  themeColor = 'coral',
  wireframe = false,
  particleCount = 2000,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Mouse interaction state
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    // 1. Scene creation
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 8;
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Clear previous children and attach canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const colors = COLOR_MAP[themeColor];

    const pointLight1 = new THREE.PointLight(colors.primary, 3, 20);
    pointLight1.position.set(4, 4, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(colors.accent, 2.5, 20);
    pointLight2.position.set(-4, -4, 2);
    scene.add(pointLight2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(0, 8, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Group for holding main meshes
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Group for background particles
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    // --- CREATE PARTICLES ---
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(colors.primary);
    const color2 = new THREE.Color(colors.secondary);
    const color3 = new THREE.Color(colors.accent);
    const tempColor = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 20;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 20;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const rand = Math.random();
      if (rand < 0.33) tempColor.copy(color1);
      else if (rand < 0.66) tempColor.copy(color2);
      else tempColor.copy(color3);

      colorArray[i * 3] = tempColor.r;
      colorArray[i * 3 + 1] = tempColor.g;
      colorArray[i * 3 + 2] = tempColor.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
    particleGroup.add(particlesMesh);

    // --- SCENE MODES ---
    let centralMesh: THREE.Mesh | null = null;
    let ringMesh: THREE.Mesh | null = null;
    const orbMeshes: THREE.Mesh[] = [];

    if (sceneMode === 'portal') {
      // 3D Crystal / Portal Core
      const coreGeometry = new THREE.IcosahedronGeometry(2.2, 1);
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: colors.primary,
        metalness: 0.3,
        roughness: 0.2,
        wireframe: wireframe,
        emissive: colors.primary,
        emissiveIntensity: 0.25,
      });
      centralMesh = new THREE.Mesh(coreGeometry, coreMaterial);
      mainGroup.add(centralMesh);

      // Outer Torus Knot Ring
      const ringGeometry = new THREE.TorusKnotGeometry(3.4, 0.18, 128, 16);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: colors.secondary,
        metalness: 0.8,
        roughness: 0.1,
        wireframe: wireframe,
      });
      ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      mainGroup.add(ringMesh);

    } else if (sceneMode === 'cosmos') {
      // Floating Torus & Diamond particles
      const torusGeometry = new THREE.TorusGeometry(3, 0.4, 16, 100);
      const torusMaterial = new THREE.MeshStandardMaterial({
        color: colors.secondary,
        metalness: 0.5,
        roughness: 0.3,
        wireframe: wireframe,
      });
      centralMesh = new THREE.Mesh(torusGeometry, torusMaterial);
      centralMesh.rotation.x = Math.PI / 3;
      mainGroup.add(centralMesh);

      const centerCoreGeom = new THREE.OctahedronGeometry(1.5, 2);
      const centerCoreMat = new THREE.MeshStandardMaterial({
        color: colors.accent,
        roughness: 0.1,
        wireframe: wireframe,
      });
      const core = new THREE.Mesh(centerCoreGeom, centerCoreMat);
      mainGroup.add(core);

    } else if (sceneMode === 'orbs') {
      // Multiple orbiting spheres representing story realms
      const orbGeom = new THREE.SphereGeometry(0.8, 32, 32);
      const orbPositions = [
        { x: 0, y: 0, z: 0, scale: 1.8, color: colors.primary },
        { x: -3, y: 1.5, z: -1, scale: 1.1, color: colors.secondary },
        { x: 3, y: -1.2, z: -0.5, scale: 1.2, color: colors.accent },
        { x: 1.8, y: 2.2, z: 1, scale: 0.7, color: colors.primary },
        { x: -2.2, y: -2, z: 0.8, scale: 0.8, color: colors.secondary },
      ];

      orbPositions.forEach((pos) => {
        const mat = new THREE.MeshStandardMaterial({
          color: pos.color,
          metalness: 0.4,
          roughness: 0.2,
          wireframe: wireframe,
        });
        const orb = new THREE.Mesh(orbGeom, mat);
        orb.position.set(pos.x, pos.y, pos.z);
        orb.scale.setScalar(pos.scale);
        mainGroup.add(orb);
        orbMeshes.push(orb);
      });
    }

    // --- MOUSE LISTENER ---
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      mouseRef.current.targetX = (x / rect.width - 0.5) * 2;
      mouseRef.current.targetY = (y / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- RESIZE LISTENER ---
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const baseSpeed = 0.005 * speed;

      // Rotate Main Group based on time & mouse
      mainGroup.rotation.y += baseSpeed * 1.5;
      mainGroup.rotation.x = mouseRef.current.y * 0.4;
      mainGroup.rotation.z = mouseRef.current.x * 0.2;

      // Rotate background particles
      particleGroup.rotation.y -= baseSpeed * 0.5;
      particleGroup.rotation.x = -mouseRef.current.y * 0.2;

      if (centralMesh) {
        centralMesh.rotation.y += baseSpeed * 2;
        centralMesh.rotation.x += baseSpeed;
      }

      if (ringMesh) {
        ringMesh.rotation.z -= baseSpeed * 2.5;
        ringMesh.rotation.y += baseSpeed * 1.2;
      }

      // Animate Orbs float wave
      orbMeshes.forEach((orb, idx) => {
        orb.position.y += Math.sin(elapsedTime * 2 + idx) * 0.005;
        orb.rotation.y += baseSpeed * 2;
      });

      // Animate Light orbits
      pointLight1.position.x = Math.sin(elapsedTime * 1.2) * 5;
      pointLight1.position.z = Math.cos(elapsedTime * 1.2) * 5;
      pointLight2.position.x = Math.cos(elapsedTime * 1.5) * -5;
      pointLight2.position.z = Math.sin(elapsedTime * 1.5) * 5;

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // --- CLEANUP ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      // Dispose Three.js objects
      particlesGeometry.dispose();
      particleMaterial.dispose();

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [sceneMode, speed, themeColor, wireframe, particleCount]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-[500px] sm:h-[600px] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing ${className}`}
    />
  );
};
