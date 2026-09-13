import * as THREE from 'three';
import { createRealTimeCalendarTexture, createClockFaceTexture } from '../textures/proceduralTextures';

export interface BookshelfBuildResult {
  shelfGroup: THREE.Group;
  wallPosterGroup: THREE.Group;
  globeSphere: THREE.Mesh;
  hourHandGroup: THREE.Group;
  minuteHandGroup: THREE.Group;
}

export function buildBookshelf(
  roomL: number,
  shelfMat: THREE.Material,
  shelfBackMat: THREE.Material,
  matMetalLegs: THREE.Material,
  matGlobeOcean: THREE.Material,
  matAlarmRed: THREE.Material,
  matPaperWhite: THREE.Material
): BookshelfBuildResult {
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(-1.5, 0.05, -roomL / 2 + 0.20);

  // Outer Frame (Top, Bottom, Left, Right)
  const topPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.35), shelfMat);
  topPanel.position.set(0, 1.28, 0);
  shelfGroup.add(topPanel);

  const bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.35), shelfMat);
  bottomPanel.position.set(0, 0.02, 0);
  bottomPanel.castShadow = true;
  shelfGroup.add(bottomPanel);

  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.22, 0.35), shelfMat);
  leftPanel.position.set(-0.53, 0.65, 0);
  shelfGroup.add(leftPanel);

  const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.22, 0.35), shelfMat);
  rightPanel.position.set(0.53, 0.65, 0);
  shelfGroup.add(rightPanel);

  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.22, 0.02), shelfBackMat);
  backPanel.position.set(0, 0.65, -0.165);
  shelfGroup.add(backPanel);

  // Inner Horizontal Shelves (3 tiers)
  const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.33), shelfMat);
  shelf1.position.set(0, 0.34, 0.01);
  shelfGroup.add(shelf1);

  const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.33), shelfMat);
  shelf2.position.set(0, 0.66, 0.01);
  shelfGroup.add(shelf2);

  const shelf3 = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.33), shelfMat);
  shelf3.position.set(0, 0.98, 0.01);
  shelfGroup.add(shelf3);

  // Vertical Compartment Dividers
  const div1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.31), shelfMat);
  div1.position.set(-0.1, 0.185, 0.01);
  shelfGroup.add(div1);

  const div2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.31), shelfMat);
  div2.position.set(0.15, 0.50, 0.01);
  shelfGroup.add(div2);

  const div3 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.31), shelfMat);
  div3.position.set(-0.15, 0.82, 0.01);
  shelfGroup.add(div3);

  // Colorful 3D Books Inside Compartments
  const bookColors = [
    0xdc2626, 0x2563eb, 0x16a34a, 0xca8a04, 0x9333ea,
    0x0d9488, 0xea580c, 0xf8fafc, 0x0284c7, 0xec4899,
  ];

  const createBook = (w: number, h: number, d: number, colorHex: number) => {
    const bGroup = new THREE.Group();
    const coverMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    const cover = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), coverMat);
    bGroup.add(cover);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(w - 0.006, h - 0.01, d - 0.01), matPaperWhite);
    pages.position.set(0, 0, 0.004);
    bGroup.add(pages);
    return bGroup;
  };

  // Tier 1 (Bottom shelf)
  const t1LeftX = [-0.46, -0.42, -0.38, -0.34, -0.30, -0.26, -0.22, -0.18, -0.14];
  t1LeftX.forEach((xPos, idx) => {
    const bHeight = 0.21 + (idx % 3) * 0.015;
    const bk = createBook(0.032, bHeight, 0.22, bookColors[idx % bookColors.length]);
    bk.position.set(xPos, 0.045 + bHeight / 2, 0.02);
    shelfGroup.add(bk);
  });

  let stackY = 0.045;
  [
    { w: 0.24, h: 0.045, d: 0.22, c: 0x1e3a8a },
    { w: 0.22, h: 0.04, d: 0.20, c: 0xb91c1c },
    { w: 0.20, h: 0.04, d: 0.19, c: 0x047857 },
    { w: 0.18, h: 0.035, d: 0.18, c: 0x7c2d12 },
  ].forEach((stk) => {
    const bk = createBook(stk.w, stk.h, stk.d, stk.c);
    bk.position.set(0.32, stackY + stk.h / 2, 0.02);
    shelfGroup.add(bk);
    stackY += stk.h;
  });

  // Tier 2 (Middle shelf)
  const t2LeftX = [-0.47, -0.43, -0.39, -0.35, -0.31, -0.27, -0.23, -0.19, -0.15, -0.11, -0.07, -0.03, 0.01, 0.05, 0.09];
  t2LeftX.forEach((xPos, idx) => {
    const cHex = idx % 2 === 0 ? 0x0284c7 : (idx % 3 === 0 ? 0xdc2626 : 0xf8fafc);
    const bk = createBook(0.032, 0.22, 0.21, cHex);
    bk.position.set(xPos, 0.365 + 0.11, 0.02);
    shelfGroup.add(bk);
  });

  [
    { x: 0.22, c: 0x4338ca, rot: 0 },
    { x: 0.26, c: 0x059669, rot: 0 },
    { x: 0.30, c: 0xd97706, rot: 0 },
    { x: 0.36, c: 0xdc2626, rot: -0.22 },
    { x: 0.43, c: 0x7e22ce, rot: -0.25 },
  ].forEach((bInfo) => {
    const bk = createBook(0.032, 0.23, 0.21, bInfo.c);
    bk.position.set(bInfo.x, 0.365 + 0.115, 0.02);
    bk.rotation.z = bInfo.rot;
    shelfGroup.add(bk);
  });

  // Tier 3 (Upper shelf)
  const t3X = [-0.46, -0.42, -0.38, -0.34, -0.30, -0.26, -0.22, -0.18];
  t3X.forEach((xPos, idx) => {
    const bk = createBook(0.034, 0.23, 0.22, bookColors[(idx * 3) % bookColors.length]);
    bk.position.set(xPos, 0.685 + 0.115, 0.02);
    shelfGroup.add(bk);
  });

  [-0.10, -0.06, -0.02, 0.02, 0.06, 0.10, 0.14, 0.18, 0.22, 0.26, 0.30].forEach((xPos, idx) => {
    const bk = createBook(0.035, 0.24, 0.23, idx % 2 === 0 ? 0xf8fafc : 0xe2e8f0);
    bk.position.set(xPos, 0.685 + 0.12, 0.02);
    shelfGroup.add(bk);
  });

  // Globe on top surface
  const globeGroup = new THREE.Group();
  globeGroup.position.set(-0.25, 1.30, 0);

  const globeStandBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 16), matMetalLegs);
  globeStandBase.position.y = 0.01;
  globeGroup.add(globeStandBase);

  const globeRod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12), matMetalLegs);
  globeRod.position.y = 0.07;
  globeGroup.add(globeRod);

  const globeArc = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.01, 8, 24, Math.PI), matMetalLegs);
  globeArc.position.y = 0.20;
  globeArc.rotation.z = -Math.PI / 4;
  globeGroup.add(globeArc);

  const globeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), matGlobeOcean);
  globeSphere.position.set(0, 0.20, 0);
  globeGroup.add(globeSphere);
  shelfGroup.add(globeGroup);

  // Red Twin-Bell Alarm Clock on top surface
  const clockGroup = new THREE.Group();
  clockGroup.position.set(0.28, 1.30, 0.05);

  const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.035, 32), matAlarmRed);
  clockBody.rotation.x = Math.PI / 2;
  clockBody.position.y = 0.075;
  clockGroup.add(clockBody);

  const texClockFace = createClockFaceTexture();
  const matClockFace = new THREE.MeshStandardMaterial({ map: texClockFace, roughness: 0.25 });

  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.058, 32), matClockFace);
  clockFace.position.set(0, 0.075, 0.018);
  clockGroup.add(clockFace);

  // 3D Pivot-Anchored Clock Hands
  const hourHandGroup = new THREE.Group();
  hourHandGroup.position.set(0, 0.075, 0.019);

  const hourHandMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.028, 0.002),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  hourHandMesh.position.y = 0.014;
  hourHandGroup.add(hourHandMesh);
  clockGroup.add(hourHandGroup);

  const minuteHandGroup = new THREE.Group();
  minuteHandGroup.position.set(0, 0.075, 0.020);

  const minuteHandMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.0035, 0.040, 0.002),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  minuteHandMesh.position.y = 0.020;
  minuteHandGroup.add(minuteHandMesh);
  clockGroup.add(minuteHandGroup);

  // Center Pin Cap
  const centerPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.003, 16),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  centerPin.rotation.x = Math.PI / 2;
  centerPin.position.set(0, 0.075, 0.021);
  clockGroup.add(centerPin);

  // Initialize hands to current Vietnam time
  const now = new Date();
  const vTimeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  let initH = 0, initM = 0, initS = 0;
  vTimeParts.forEach((p) => {
    if (p.type === 'hour') initH = parseInt(p.value, 10);
    if (p.type === 'minute') initM = parseInt(p.value, 10);
    if (p.type === 'second') initS = parseInt(p.value, 10);
  });

  const initH12 = initH % 12;
  hourHandGroup.rotation.z = -((initH12 + initM / 60) / 12) * Math.PI * 2;
  minuteHandGroup.rotation.z = -((initM + initS / 60) / 60) * Math.PI * 2;

  const bellMat = matMetalLegs;
  const bellLeft = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), bellMat);
  bellLeft.position.set(-0.045, 0.14, 0);
  clockGroup.add(bellLeft);

  const bellRight = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), bellMat);
  bellRight.position.set(0.045, 0.14, 0);
  clockGroup.add(bellRight);

  const legLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03), bellMat);
  legLeft.position.set(-0.035, 0.012, 0);
  legLeft.rotation.z = Math.PI / 6;
  clockGroup.add(legLeft);

  const legRight = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03), bellMat);
  legRight.position.set(0.035, 0.012, 0);
  legRight.rotation.z = -Math.PI / 6;
  clockGroup.add(legRight);

  shelfGroup.add(clockGroup);

  // Wall Poster / Real-Time Calendar
  const wallPosterGroup = new THREE.Group();
  wallPosterGroup.position.set(-0.8, 1.85, -roomL / 2 + 0.08);

  const texCalendar = createRealTimeCalendarTexture();
  const matCalendar = new THREE.MeshStandardMaterial({ map: texCalendar, roughness: 0.5 });

  const posterBack = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.51, 0.006), matPaperWhite);
  posterBack.castShadow = true;
  wallPosterGroup.add(posterBack);

  const posterHeader = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.04, 0.012),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 })
  );
  posterHeader.position.set(0, 0.245, 0.003);
  wallPosterGroup.add(posterHeader);

  const hangRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.02, 0.003, 8, 16),
    matMetalLegs
  );
  hangRing.position.set(0, 0.275, 0.003);
  wallPosterGroup.add(hangRing);

  const posterFace = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.48), matCalendar);
  posterFace.position.set(0, -0.01, 0.004);
  wallPosterGroup.add(posterFace);

  return { shelfGroup, wallPosterGroup, globeSphere, hourHandGroup, minuteHandGroup };
}
