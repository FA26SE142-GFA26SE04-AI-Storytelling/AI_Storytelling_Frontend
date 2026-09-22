import * as THREE from 'three';
import {
  createRealTimeCalendarTexture,
  createClockFaceTexture,
} from '../textures/proceduralTextures';
import {
  WORKING_VOLUMES_BOOKS,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeSpineTexture,
} from '../textures/workingVolumesBooks';

export interface ShowcaseBookItem {
  group: THREE.Group;
  clickMesh: THREE.Mesh;
  storyId: string;
  title: string;
  baseY: number;
  baseZ: number;
}

export interface BookshelfBuildResult {
  shelfGroup: THREE.Group;
  bookshelfClickMesh: THREE.Mesh;
  wallPosterGroup: THREE.Group;
  globeSphere: THREE.Mesh;
  hourHandGroup: THREE.Group;
  minuteHandGroup: THREE.Group;
  showcaseBooks: ShowcaseBookItem[];
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

  // Vertical Compartment Dividers (Bottom & Upper tiers only)
  const div1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.31), shelfMat);
  div1.position.set(-0.1, 0.185, 0.01);
  shelfGroup.add(div1);

  const div3 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.31), shelfMat);
  div3.position.set(-0.15, 1.13, 0.01);
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

  // Tier 2 (Lower-Middle shelf, y = 0.36 to 0.66)
  const t2LeftX = [-0.46, -0.42, -0.38, -0.34, -0.30, -0.26, -0.22, -0.18, -0.14];
  t2LeftX.forEach((xPos, idx) => {
    const bHeight = 0.20 + (idx % 4) * 0.012;
    const bk = createBook(0.030, bHeight, 0.20, bookColors[(idx + 2) % bookColors.length]);
    bk.position.set(xPos, 0.365 + bHeight / 2, 0.02);
    shelfGroup.add(bk);
  });

  const t2RightX = [-0.04, 0.00, 0.04, 0.08, 0.12, 0.16, 0.20, 0.24, 0.28];
  t2RightX.forEach((xPos, idx) => {
    const bHeight = 0.21 + (idx % 3) * 0.015;
    const bk = createBook(0.032, bHeight, 0.21, bookColors[(idx + 5) % bookColors.length]);
    bk.position.set(xPos, 0.365 + bHeight / 2, 0.02);
    shelfGroup.add(bk);
  });

  // Leaning books at right end of Tier 2
  const lean1 = createBook(0.032, 0.22, 0.21, bookColors[1]);
  lean1.position.set(0.36, 0.365 + 0.11, 0.02);
  lean1.rotation.z = -0.22;
  shelfGroup.add(lean1);

  const lean2 = createBook(0.030, 0.21, 0.20, bookColors[6]);
  lean2.position.set(0.41, 0.365 + 0.10, 0.02);
  lean2.rotation.z = -0.24;
  shelfGroup.add(lean2);

  // Tier 3 (Upper-Middle shelf, y = 0.68 to 0.98 - Normal Books)
  const t3LeftX = [-0.46, -0.42, -0.38, -0.34, -0.30, -0.26, -0.22, -0.18, -0.14, -0.10, -0.06];
  t3LeftX.forEach((xPos, idx) => {
    const bHeight = 0.22 + (idx % 3) * 0.015;
    const bk = createBook(0.034, bHeight, 0.22, bookColors[(idx * 2) % bookColors.length]);
    bk.position.set(xPos, 0.685 + bHeight / 2, 0.02);
    shelfGroup.add(bk);
  });

  const t3RightX = [0.04, 0.08, 0.12, 0.16, 0.20, 0.24, 0.28, 0.32, 0.36, 0.40, 0.44];
  t3RightX.forEach((xPos, idx) => {
    const bHeight = 0.21 + (idx % 4) * 0.012;
    const bk = createBook(0.033, bHeight, 0.21, bookColors[(idx * 3 + 1) % bookColors.length]);
    bk.position.set(xPos, 0.685 + bHeight / 2, 0.02);
    shelfGroup.add(bk);
  });

  const showcaseBooks: ShowcaseBookItem[] = [];

  // Tier 4 (Top shelf, y = 1.00 to 1.28)
  const t4X = [-0.46, -0.42, -0.38, -0.34, -0.30, -0.26, -0.22, -0.18];
  t4X.forEach((xPos, idx) => {
    const bk = createBook(0.034, 0.23, 0.22, bookColors[(idx * 3) % bookColors.length]);
    bk.position.set(xPos, 1.00 + 0.115, 0.02);
    shelfGroup.add(bk);
  });

  [-0.10, -0.06, -0.02, 0.02, 0.06, 0.10, 0.14, 0.18, 0.22, 0.26, 0.30, 0.34, 0.38].forEach((xPos, idx) => {
    const bk = createBook(0.035, 0.24, 0.23, idx % 2 === 0 ? 0xf8fafc : 0xe2e8f0);
    bk.position.set(xPos, 1.00 + 0.12, 0.02);
    shelfGroup.add(bk);
  });

  // Globe on top surface (positioned to the left side)
  const globeGroup = new THREE.Group();
  globeGroup.position.set(-0.36, 1.30, 0);

  const globeStandBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 16), matMetalLegs);
  globeStandBase.position.y = 0.01;
  globeGroup.add(globeStandBase);

  const globeRod = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.11), matMetalLegs);
  globeRod.position.y = 0.065;
  globeGroup.add(globeRod);

  const globeArc = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.009, 8, 24, Math.PI), matMetalLegs);
  globeArc.position.set(0, 0.145, 0);
  globeArc.rotation.z = Math.PI / 6;
  globeGroup.add(globeArc);

  const globeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 24), matGlobeOcean);
  globeSphere.position.set(0, 0.145, 0);
  globeSphere.rotation.z = -0.41;
  globeGroup.add(globeSphere);

  shelfGroup.add(globeGroup);

  // Red Vintage Alarm Clock (positioned to the right side)
  const clockGroup = new THREE.Group();
  clockGroup.position.set(0.36, 1.30, 0);

  const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.055, 24), matAlarmRed);
  clockBody.rotation.x = Math.PI / 2;
  clockBody.position.y = 0.09;
  clockGroup.add(clockBody);

  const texClockFace = createClockFaceTexture();
  const matClockFace = new THREE.MeshStandardMaterial({ map: texClockFace, roughness: 0.2 });
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.08, 24), matClockFace);
  clockFace.position.set(0, 0.09, 0.028);
  clockGroup.add(clockFace);

  const matClockHand = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });

  const hourHandGroup = new THREE.Group();
  hourHandGroup.position.set(0, 0.09, 0.030);
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.045, 0.001), matClockHand);
  hourHand.position.y = 0.022;
  hourHandGroup.add(hourHand);
  clockGroup.add(hourHandGroup);

  const minuteHandGroup = new THREE.Group();
  minuteHandGroup.position.set(0, 0.09, 0.031);
  const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.0035, 0.06, 0.001), matClockHand);
  minHand.position.y = 0.030;
  minuteHandGroup.add(minHand);
  clockGroup.add(minuteHandGroup);

  // Clock Bells
  const bellGeo = new THREE.SphereGeometry(0.03, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const bellLeft = new THREE.Mesh(bellGeo, matMetalLegs);
  bellLeft.position.set(-0.06, 0.18, 0);
  bellLeft.rotation.z = Math.PI / 4;
  clockGroup.add(bellLeft);

  const bellRight = new THREE.Mesh(bellGeo, matMetalLegs);
  bellRight.position.set(0.06, 0.18, 0);
  bellRight.rotation.z = -Math.PI / 4;
  clockGroup.add(bellRight);

  shelfGroup.add(clockGroup);

  // Wall Calendar Above Bookshelf (Adjusted Position & Proportions - Fits perfectly under wall beam)
  const wallPosterGroup = new THREE.Group();
  wallPosterGroup.position.set(-1.5, 1.80, -roomL / 2 + 0.025);

  const texCalendar = createRealTimeCalendarTexture();
  const matPoster = new THREE.MeshStandardMaterial({
    map: texCalendar,
    roughness: 0.65,
    metalness: 0.05,
  });

  const posterMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.58), matPoster);
  wallPosterGroup.add(posterMesh);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3e1d08, roughness: 0.4 });
  const frameBorder = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.61, 0.018), frameMat);
  frameBorder.position.z = -0.010;
  wallPosterGroup.add(frameBorder);

  // Top Hanging Metal Clip
  const clipMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.2 });
  const clipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.01), clipMat);
  clipMesh.position.set(0, 0.30, 0.005);
  wallPosterGroup.add(clipMesh);

  // Raycast Click Mesh for the overall bookshelf
  const bookshelfClickMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.4, 0.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  bookshelfClickMesh.position.set(-1.5, 0.70, -roomL / 2 + 0.20);

  return {
    shelfGroup,
    bookshelfClickMesh,
    wallPosterGroup,
    globeSphere,
    hourHandGroup,
    minuteHandGroup,
    showcaseBooks,
  };
}
