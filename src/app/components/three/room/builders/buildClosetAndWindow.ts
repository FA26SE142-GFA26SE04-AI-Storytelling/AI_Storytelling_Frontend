import * as THREE from 'three';
import { TimeOfDay } from '../stages';
import { buildLaptop } from './buildLaptop';

export interface ClosetAndWindowBuildResult {
  closetGroup: THREE.Group;
  fDoorLeft: THREE.Group;
  fDoorRight: THREE.Group;
  doorLeftClickMesh: THREE.Mesh;
  doorRightClickMesh: THREE.Mesh;
  winGroup: THREE.Group;
  lowTableGroup: THREE.Group;
  laptopClickMesh: THREE.Mesh;
  laptopLidGroup: THREE.Group;
  cornerPlantGroup: THREE.Group;
  sunGroup: THREE.Group;
  moonGroup: THREE.Group;
  starsGroup: THREE.Group;
  skyMat: THREE.Material;
  sunCoreMat: THREE.Material;
  sunGlowMat: THREE.Material;
  moonMat: THREE.Material;
  moonMaskMat: THREE.Material;
  moonGlowMat: THREE.Material;
  starMat: THREE.Material;
  cloudMat: THREE.Material;
  starParticles: Array<{ mesh: THREE.Mesh; phase: number; baseRadius: number }>;
  cloudDriftObjects: Array<{ group: THREE.Group; baseZ: number; speed: number }>;
}

export function buildClosetAndWindow(
  roomW: number,
  roomL: number,
  matWoodAmber: THREE.Material,
  matWoodDark: THREE.Material,
  matClosetWhite: THREE.Material,
  matClosetBlue: THREE.Material,
  matTableMahogany: THREE.Material,
  matGlassWater: THREE.Material,
  matWaterLiquid: THREE.Material,
  matTerracotta: THREE.Material,
  matCeramicWhite: THREE.Material,
  matLeafDark: THREE.Material,
  matLeafLight: THREE.Material,
  matMetalLegs: THREE.Material
): ClosetAndWindowBuildResult {
  // Closet Door Frame A & Panel B
  const closetGroup = new THREE.Group();
  closetGroup.position.set(0.9, 0, -roomL / 2 + 0.15);

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

  // 1. Hollow Light Wood Back Wall Panel (Allows interior items to be clearly visible)
  const closetBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(2.08, 2.24, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 }) // Warm light cedar/beige interior
  );
  closetBackWall.position.set(0, 1.2, 0.01);
  closetGroup.add(closetBackWall);

  // 2. Interior Middle Shelf
  const cShelf = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.04, 0.48), closetFrameMat);
  cShelf.position.set(0, 1.15, 0.24);
  closetGroup.add(cShelf);

  // --- Detailed Closet Interior Items ---
  const closetInteriorGroup = new THREE.Group();

  // A. Hanging Clothes Rod (Chrome metal rod across upper section)
  const clothesRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 2.04, 16),
    matMetalLegs
  );
  clothesRod.rotation.z = Math.PI / 2;
  clothesRod.position.set(0, 1.95, 0.24);
  closetInteriorGroup.add(clothesRod);

  // B. Hanging Garments (Shirts & Jackets on wooden hangers)
  const clothesData = [
    { x: -0.82, color: 0x2563eb, width: 0.14, height: 0.58 }, // Left Side - Blue Navy Jacket
    { x: -0.62, color: 0xdc2626, width: 0.12, height: 0.52 }, // Left Side - Red Shirt
    { x: -0.42, color: 0xeab308, width: 0.13, height: 0.50 }, // Left Side - Yellow Hoodie
    { x: 0.35, color: 0x166534, width: 0.14, height: 0.54 },  // Right Side - Green Coat
    { x: 0.58, color: 0x475569, width: 0.13, height: 0.50 },  // Right Side - Grey Jacket
    { x: 0.78, color: 0x9333ea, width: 0.12, height: 0.46 },  // Right Side - Purple Shirt
  ];

  clothesData.forEach((item) => {
    // Wooden Hanger
    const hanger = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.005, 8, 16, Math.PI),
      matWoodAmber
    );
    hanger.position.set(item.x, 1.88, 0.24);
    hanger.rotation.z = Math.PI;
    closetInteriorGroup.add(hanger);

    // Clothes Garment Box
    const garment = new THREE.Mesh(
      new THREE.BoxGeometry(item.width, item.height, 0.22),
      new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.5 })
    );
    garment.position.set(item.x, 1.88 - item.height / 2 - 0.02, 0.24);
    garment.castShadow = true;
    garment.receiveShadow = true;
    closetInteriorGroup.add(garment);
  });

  // C. Folded Futon & Bedding Stack on Left Middle Shelf
  const futonStackGroup = new THREE.Group();
  futonStackGroup.position.set(-0.62, 1.17, 0.24);

  // Bottom Futon Mattress (Blue)
  const futon1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.12, 0.40),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 })
  );
  futon1.position.y = 0.06;
  futon1.castShadow = true;
  futonStackGroup.add(futon1);

  // Middle Folded Quilt (White/Cream)
  const futon2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.10, 0.38),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
  );
  futon2.position.y = 0.17;
  futon2.castShadow = true;
  futonStackGroup.add(futon2);

  // Soft Pillow on top (Yellow/Gold)
  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.09, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 })
  );
  pillow.position.set(0, 0.265, 0);
  pillow.castShadow = true;
  futonStackGroup.add(pillow);
  closetInteriorGroup.add(futonStackGroup);

  // D. Memory Storage Boxes on Right Middle Shelf
  const box1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.22, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4 })
  );
  box1.position.set(0.55, 1.28, 0.24);
  box1.castShadow = true;
  closetInteriorGroup.add(box1);

  const box2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.18, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  box2.position.set(0.55, 1.48, 0.24);
  box2.castShadow = true;
  closetInteriorGroup.add(box2);

  // E. Lower Storage Section (Dividers & Drawers)
  const bottomShelf = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.04, 0.48), closetFrameMat);
  bottomShelf.position.set(0, 0.58, 0.24);
  closetInteriorGroup.add(bottomShelf);

  const centerDivider = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.54, 0.48), closetFrameMat);
  centerDivider.position.set(0, 0.30, 0.24);
  closetInteriorGroup.add(centerDivider);

  // Left Drawer Block with Chrome Handle
  const drawerLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.44, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  drawerLeft.position.set(-0.50, 0.28, 0.24);
  drawerLeft.castShadow = true;
  closetInteriorGroup.add(drawerLeft);

  const drawerLeftHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.03, 0.025),
    matWoodDark
  );
  drawerLeftHandle.position.set(-0.50, 0.28, 0.46);
  closetInteriorGroup.add(drawerLeftHandle);

  // Right Drawer Block with Chrome Handle
  const drawerRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.44, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  drawerRight.position.set(0.50, 0.28, 0.24);
  drawerRight.castShadow = true;
  closetInteriorGroup.add(drawerRight);

  const drawerRightHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.03, 0.025),
    matWoodDark
  );
  drawerRightHandle.position.set(0.50, 0.28, 0.46);
  closetInteriorGroup.add(drawerRightHandle);

  closetGroup.add(closetInteriorGroup);

  const createFusumaDoor = (handleXOffset: number) => {
    const doorGroup = new THREE.Group();

    // White Inner Fusuma Paper Panel (Fits inside side borders x = -0.50 to +0.50)
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.00, 2.18, 0.024), matClosetWhite);
    doorGroup.add(panel);

    // Decorative Blue Horizontal Stripe (Fits inside side borders x = -0.50 to +0.50)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.00, 0.42, 0.026), matClosetBlue);
    stripe.position.set(0, 0, 0.001);
    doorGroup.add(stripe);

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

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.01, 20),
      new THREE.MeshBasicMaterial({ color: 0x1e1e1e })
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(handleXOffset, 0, 0.018);
    doorGroup.add(handle);

    const doorClickMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.06, 2.24, 0.12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    doorClickMesh.position.set(0, 0, 0.02);
    doorGroup.add(doorClickMesh);

    return { doorGroup, doorClickMesh };
  };

  const { doorGroup: fDoorLeft, doorClickMesh: doorLeftClickMesh } = createFusumaDoor(0.38);
  fDoorLeft.position.set(-0.51, 1.2, 0.50);
  closetGroup.add(fDoorLeft);

  const { doorGroup: fDoorRight, doorClickMesh: doorRightClickMesh } = createFusumaDoor(-0.38);
  fDoorRight.position.set(0.51, 1.2, 0.53);
  closetGroup.add(fDoorRight);

  // Sliding Window & Scenery
  const winGroup = new THREE.Group();
  winGroup.position.set(-roomW / 2 + 0.04, 1.6, 0);

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

  // Outdoor Sky Backdrop
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x7ec8f2 });
  const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), skyMat);
  skyPlane.position.set(-4.0, 0, 0);
  skyPlane.rotation.y = Math.PI / 2;
  winGroup.add(skyPlane);

  // Celestial Objects
  const sunGroup = new THREE.Group();
  sunGroup.position.set(-3.7, 2.4, -1.6);

  const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff066, transparent: true, opacity: 1 });
  const sunCore = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), sunCoreMat);
  sunGroup.add(sunCore);

  const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.35 });
  const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), sunGlowMat);
  sunGroup.add(sunGlow);
  winGroup.add(sunGroup);

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
  moonGlow.position.set(0, 0, 0);
  moonGroup.add(moonGlow);
  winGroup.add(moonGroup);

  const starsGroup = new THREE.Group();
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const starParticles: Array<{ mesh: THREE.Mesh; phase: number; baseRadius: number }> = [];

  // 300 Twinkling Night Stars filling the entire sky hemisphere
  for (let i = 0; i < 300; i++) {
    const sRadius = 0.012 + Math.random() * 0.028;
    const starMesh = new THREE.Mesh(new THREE.SphereGeometry(sRadius, 8, 8), starMat);
    const sx = -3.65 + (Math.random() - 0.5) * 0.5;
    const sy = 0.2 + Math.random() * 5.0;
    const sz = -10.0 + Math.random() * 20.0;
    starMesh.position.set(sx, sy, sz);
    starsGroup.add(starMesh);
    starParticles.push({
      mesh: starMesh,
      phase: Math.random() * Math.PI * 2,
      baseRadius: sRadius,
    });
  }
  winGroup.add(starsGroup);

  // Clouds
  const cloudGroup = new THREE.Group();
  cloudGroup.position.set(-3.2, 0, 0);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  const cloudClusters = [
    { x: 0.1, y: 3.8, z: -5.5, s: 0.95 },
    { x: -0.1, y: 3.5, z: -3.2, s: 0.85 },
    { x: 0.2, y: 3.9, z: -0.8, s: 1.05 },
    { x: -0.05, y: 3.6, z: 1.8, s: 0.90 },
    { x: 0.15, y: 3.7, z: 4.2, s: 0.85 },
    { x: -0.1, y: 4.1, z: 6.0, s: 0.95 },
    { x: 0.05, y: 2.6, z: -6.2, s: 0.80 },
    { x: -0.15, y: 2.3, z: -4.4, s: 0.90 },
    { x: 0.25, y: 2.7, z: -2.6, s: 1.05 },
    { x: 0, y: 2.4, z: -0.5, s: 0.98 },
    { x: -0.2, y: 2.8, z: 1.2, s: 0.88 },
    { x: 0.1, y: 2.3, z: 3.1, s: 0.92 },
    { x: -0.05, y: 2.5, z: 5.2, s: 0.85 },
    { x: 0.2, y: 1.8, z: -5.0, s: 0.85 },
    { x: -0.1, y: 1.5, z: -3.0, s: 0.78 },
    { x: 0.15, y: 1.9, z: -1.2, s: 0.92 },
    { x: -0.2, y: 1.4, z: 0.6, s: 0.85 },
    { x: 0.05, y: 1.7, z: 2.4, s: 0.90 },
    { x: -0.15, y: 1.5, z: 4.5, s: 0.82 },
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
    cGrp.add(new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), cloudMat));
    [
      { x: 0.30, y: 0.08, z: 0.05, r: 0.28 },
      { x: -0.32, y: -0.05, z: -0.05, r: 0.26 },
      { x: 0.15, y: 0.18, z: -0.10, r: 0.24 },
      { x: -0.15, y: 0.16, z: 0.08, r: 0.25 },
      { x: 0.45, y: -0.08, z: 0, r: 0.20 },
      { x: -0.48, y: -0.09, z: 0, r: 0.19 },
    ].forEach((b) => {
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

  // Trees & Utility Pole
  const treeGroup = new THREE.Group();
  treeGroup.position.set(-2.0, -3, 1.0);
  treeGroup.scale.setScalar(1.3);
  const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x54361e, roughness: 0.9 });
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

  // Low Table
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

  // Modern 3D Laptop on Low Table (Thay thế bình trà cũ theo yêu cầu người dùng)
  const { laptopGroup, laptopClickMesh, laptopLidGroup } = buildLaptop();
  laptopGroup.position.set(0.10, 0.385, 0.0);
  laptopGroup.rotation.y = 0; // Đặt vuông góc trục Z để góc camera nhìn thẳng chính diện vào màn hình
  lowTableGroup.add(laptopGroup);

  const tablePlantGroup = new THREE.Group();
  tablePlantGroup.position.set(-0.25, 0.385, 0.15);
  const tablePotMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, side: THREE.DoubleSide });
  const tablePot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 24, 1, true), tablePotMat);
  tablePot.position.y = 0.035;
  tablePot.castShadow = true;
  tablePlantGroup.add(tablePot);

  const tablePotRim = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.005, 12, 24), matCeramicWhite);
  tablePotRim.position.y = 0.07;
  tablePotRim.rotation.x = Math.PI / 2;
  tablePlantGroup.add(tablePotRim);

  const tableSoil = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.042, 0.015, 24), matWoodDark);
  tableSoil.position.y = 0.06;
  tablePlantGroup.add(tableSoil);

  // Succulent rosette arrangement
  for (let r = 0; r < 12; r++) {
    const angle = (r * Math.PI * 2) / 7 + (r > 6 ? 0.3 : 0);
    const radius = r < 7 ? 0.032 : 0.018;
    const leafHeight = r < 7 ? 0.075 : 0.09;
    const sLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 12), r % 2 === 0 ? matLeafDark : matLeafLight);
    sLeaf.position.set(Math.sin(angle) * radius, leafHeight, Math.cos(angle) * radius);
    sLeaf.rotation.x = Math.cos(angle) * 0.45;
    sLeaf.rotation.z = Math.sin(angle) * -0.45;
    sLeaf.castShadow = true;
    tablePlantGroup.add(sLeaf);
  }
  lowTableGroup.add(tablePlantGroup);

  // Large Potted Houseplant (Monstera / Tropical Foliage with Wooden Stand)
  const cornerPlantGroup = new THREE.Group();
  cornerPlantGroup.position.set(-0.52, 0, -roomL / 2 + 0.35);

  // 1. Elegant Wooden Tripod Stand
  const standRadius = 0.145;
  const standHeight = 0.22;
  const standLegsGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, standHeight, 16), matWoodAmber);
    leg.position.set(Math.sin(angle) * standRadius * 0.9, standHeight / 2, Math.cos(angle) * standRadius * 0.9);
    leg.rotation.z = Math.sin(angle) * -0.12;
    leg.rotation.x = Math.cos(angle) * 0.12;
    leg.castShadow = true;
    standLegsGroup.add(leg);
  }
  const crossRing = new THREE.Mesh(new THREE.TorusGeometry(standRadius * 0.82, 0.008, 12, 24), matWoodAmber);
  crossRing.position.y = 0.15;
  crossRing.rotation.x = Math.PI / 2;
  standLegsGroup.add(crossRing);
  cornerPlantGroup.add(standLegsGroup);

  // 2. Hollow Ceramic Planter Pot & Rim (openEnded to eliminate z-fighting)
  const potDoubleSideMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, side: THREE.DoubleSide });
  const planterPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.125, 0.34, 32, 1, true),
    potDoubleSideMat
  );
  planterPot.position.y = 0.25;
  planterPot.castShadow = true;
  cornerPlantGroup.add(planterPot);

  const potBottom = new THREE.Mesh(
    new THREE.CircleGeometry(0.125, 32),
    matCeramicWhite
  );
  potBottom.position.y = 0.08;
  potBottom.rotation.x = Math.PI / 2;
  cornerPlantGroup.add(potBottom);

  const potRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.168, 0.012, 16, 32),
    matCeramicWhite
  );
  potRim.position.y = 0.418;
  potRim.rotation.x = Math.PI / 2;
  cornerPlantGroup.add(potRim);

  const potSoil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.164, 0.155, 0.04, 32),
    matWoodDark
  );
  potSoil.position.y = 0.385;
  cornerPlantGroup.add(potSoil);

  // 3. Helper to create realistic curved 3D leaf geometry
  const createRealisticLeafGeo = (width: number, length: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(width * 0.65, length * 0.2, width * 0.75, length * 0.65, 0, length);
    shape.bezierCurveTo(-width * 0.75, length * 0.65, -width * 0.65, length * 0.2, 0, 0);

    const extrudeSettings = {
      depth: 0.003,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 3,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const ratio = Math.max(0, Math.min(1, y / length));
      const droop = -Math.pow(ratio, 1.8) * (length * 0.22);
      const fold = -Math.abs(x) * 0.28;
      pos.setZ(i, pos.getZ(i) + droop + fold);
    }
    geo.computeVertexNormals();
    return geo;
  };

  // 4. Lush Foliage Arrangement with Arched Tube Stems
  const leavesData = [
    { endX: 0.03, endY: 0.88, endZ: 0.02, width: 0.18, length: 0.32, rotX: -0.4, rotY: 0.2, rotZ: 0.1, m: matLeafLight },
    { endX: 0.22, endY: 0.78, endZ: -0.08, width: 0.22, length: 0.36, rotX: -0.6, rotY: 1.1, rotZ: -0.3, m: matLeafDark },
    { endX: -0.24, endY: 0.80, endZ: 0.10, width: 0.23, length: 0.38, rotX: -0.5, rotY: -1.2, rotZ: 0.3, m: matLeafLight },
    { endX: 0.10, endY: 0.72, endZ: 0.24, width: 0.21, length: 0.35, rotX: -0.7, rotY: 0.4, rotZ: -0.2, m: matLeafLight },
    { endX: -0.16, endY: 0.70, endZ: -0.20, width: 0.22, length: 0.36, rotX: -0.6, rotY: -2.3, rotZ: 0.2, m: matLeafDark },
    { endX: 0.28, endY: 0.58, endZ: 0.12, width: 0.25, length: 0.40, rotX: -0.9, rotY: 1.5, rotZ: -0.4, m: matLeafDark },
    { endX: -0.26, endY: 0.56, endZ: -0.10, width: 0.24, length: 0.39, rotX: -0.85, rotY: -1.6, rotZ: 0.4, m: matLeafDark },
    { endX: -0.02, endY: 0.54, endZ: 0.28, width: 0.23, length: 0.37, rotX: -1.0, rotY: 0.1, rotZ: 0.0, m: matLeafLight },
  ];

  const soilCenter = new THREE.Vector3(0, 0.41, 0);

  leavesData.forEach((leaf) => {
    const leafEnd = new THREE.Vector3(leaf.endX, leaf.endY, leaf.endZ);
    const midPoint = new THREE.Vector3()
      .addVectors(soilCenter, leafEnd)
      .multiplyScalar(0.5);
    midPoint.x += (leaf.endX - soilCenter.x) * 0.35;
    midPoint.z += (leaf.endZ - soilCenter.z) * 0.35;
    midPoint.y += 0.06;

    const stemCurve = new THREE.CatmullRomCurve3([soilCenter, midPoint, leafEnd]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 16, 0.007, 8, false);
    const pStem = new THREE.Mesh(stemGeo, matLeafDark);
    pStem.castShadow = true;
    cornerPlantGroup.add(pStem);

    const leafGeo = createRealisticLeafGeo(leaf.width, leaf.length);
    const leafMesh = new THREE.Mesh(leafGeo, leaf.m);
    leafMesh.position.copy(leafEnd);
    leafMesh.rotation.set(leaf.rotX, leaf.rotY, leaf.rotZ);
    leafMesh.castShadow = true;
    cornerPlantGroup.add(leafMesh);

    const veinCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, leaf.length * 0.5, -leaf.length * 0.08),
      new THREE.Vector3(0, leaf.length * 0.95, -leaf.length * 0.20),
    ]);
    const veinGeo = new THREE.TubeGeometry(veinCurve, 10, 0.003, 6, false);
    const veinMesh = new THREE.Mesh(veinGeo, leaf.m === matLeafLight ? matLeafDark : matLeafLight);
    veinMesh.position.copy(leafEnd);
    veinMesh.rotation.set(leaf.rotX, leaf.rotY, leaf.rotZ);
    cornerPlantGroup.add(veinMesh);
  });

  return {
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
  };
}
