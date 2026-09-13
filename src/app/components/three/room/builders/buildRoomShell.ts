import * as THREE from 'three';

export interface RoomShellBuildResult {
  roomW: number;
  roomL: number;
  roomH: number;
  wallT: number;
}

export function buildRoomShell(
  roomGroup: THREE.Group,
  matWoodDark: THREE.Material,
  matWoodAmber: THREE.Material,
  matTatami: THREE.Material,
  matTatamiBorder: THREE.Material,
  matWallBeige: THREE.Material,
  matShojiPaper: THREE.Material
): RoomShellBuildResult {
  const roomW = 4.8;
  const roomL = 4.8;
  const roomH = 2.8;
  const wallT = 0.15;

  // Floor Base (Dark wood baseboard under tatami)
  const floorBase = new THREE.Mesh(new THREE.BoxGeometry(roomW + 0.2, 0.2, roomL + 0.2), matWoodDark);
  floorBase.position.y = -0.1;
  floorBase.receiveShadow = true;
  roomGroup.add(floorBase);

  // Seamless Tatami Tiles Layout
  const mThickness = 0.035;
  const borderW = 0.045;

  const tatamiTiles = [
    { x: -1.2, z: -1.8, w: 2.4, d: 1.2, isHorizontal: true },
    { x: 1.2, z: -1.8, w: 2.4, d: 1.2, isHorizontal: true },
    { x: -1.8, z: 0.0, w: 1.2, d: 2.4, isHorizontal: false },
    { x: -0.6, z: 0.0, w: 1.2, d: 2.4, isHorizontal: false },
    { x: 0.6, z: 0.0, w: 1.2, d: 2.4, isHorizontal: false },
    { x: 1.8, z: 0.0, w: 1.2, d: 2.4, isHorizontal: false },
    { x: -1.2, z: 1.8, w: 2.4, d: 1.2, isHorizontal: true },
    { x: 1.2, z: 1.8, w: 2.4, d: 1.2, isHorizontal: true },
  ];

  tatamiTiles.forEach((tile) => {
    const tileGroup = new THREE.Group();
    tileGroup.position.set(tile.x, mThickness / 2, tile.z);

    const strawMesh = new THREE.Mesh(new THREE.BoxGeometry(tile.w, mThickness, tile.d), matTatami);
    strawMesh.receiveShadow = true;
    tileGroup.add(strawMesh);

    if (tile.isHorizontal) {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(tile.w, mThickness + 0.002, borderW), matTatamiBorder);
      b1.position.z = tile.d / 2 - borderW / 2;
      tileGroup.add(b1);

      const b2 = new THREE.Mesh(new THREE.BoxGeometry(tile.w, mThickness + 0.002, borderW), matTatamiBorder);
      b2.position.z = -tile.d / 2 + borderW / 2;
      tileGroup.add(b2);
    } else {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(borderW, mThickness + 0.002, tile.d), matTatamiBorder);
      b1.position.x = tile.w / 2 - borderW / 2;
      tileGroup.add(b1);

      const b2 = new THREE.Mesh(new THREE.BoxGeometry(borderW, mThickness + 0.002, tile.d), matTatamiBorder);
      b2.position.x = -tile.w / 2 + borderW / 2;
      tileGroup.add(b2);
    }

    roomGroup.add(tileGroup);
  });

  // Walls
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomW, roomH, wallT), matWallBeige);
  backWall.position.set(0, roomH / 2, -roomL / 2 - wallT / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  roomGroup.add(backWall);

  const leftWallBottom = new THREE.Mesh(new THREE.BoxGeometry(wallT, 0.8, 2.4), matWallBeige);
  leftWallBottom.position.set(-roomW / 2 - wallT / 2, 0.4, 0);
  leftWallBottom.castShadow = true;
  leftWallBottom.receiveShadow = true;
  roomGroup.add(leftWallBottom);

  const leftWallTop = new THREE.Mesh(new THREE.BoxGeometry(wallT, 0.4 + 6, 2.4), matWallBeige);
  leftWallTop.position.set(-roomW / 2 - wallT / 2, 2.6 + 6 / 2, 0);
  leftWallTop.castShadow = true;
  leftWallTop.receiveShadow = true;
  roomGroup.add(leftWallTop);

  const leftWallBack = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH + 6, 4.0), matWallBeige);
  leftWallBack.position.set(-roomW / 2 - wallT / 2, (roomH + 6) / 2, -3.2);
  leftWallBack.castShadow = true;
  leftWallBack.receiveShadow = true;
  roomGroup.add(leftWallBack);

  const leftWallFront = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH + 6, 3.6), matWallBeige);
  leftWallFront.position.set(-roomW / 2 - wallT / 2, (roomH + 6) / 2, 3.0);
  leftWallFront.castShadow = true;
  leftWallFront.receiveShadow = true;
  roomGroup.add(leftWallFront);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH, roomL), matWallBeige);
  rightWall.position.set(roomW / 2 + wallT / 2, roomH / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  roomGroup.add(rightWall);

  // Posts & Rails
  const postGeom = new THREE.BoxGeometry(0.12, roomH, 0.06);

  const postCorner1 = new THREE.Mesh(postGeom, matWoodAmber);
  postCorner1.position.set(-roomW / 2 + 0.06, roomH / 2, -roomL / 2 + 0.03);
  postCorner1.castShadow = true;
  postCorner1.receiveShadow = true;
  roomGroup.add(postCorner1);

  const postCorner2 = new THREE.Mesh(postGeom, matWoodAmber);
  postCorner2.position.set(roomW / 2 - 0.06, roomH / 2, -roomL / 2 + 0.03);
  postCorner2.castShadow = true;
  postCorner2.receiveShadow = true;
  roomGroup.add(postCorner2);

  const postMidBack = new THREE.Mesh(postGeom, matWoodAmber);
  postMidBack.position.set(-0.4, roomH / 2, -roomL / 2 + 0.03);
  postMidBack.castShadow = true;
  postMidBack.receiveShadow = true;
  roomGroup.add(postMidBack);

  const railBack = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.1, 0.04), matWoodAmber);
  railBack.position.set(0, 2.2, -roomL / 2 + 0.02);
  railBack.castShadow = true;
  railBack.receiveShadow = true;
  roomGroup.add(railBack);

  const railLeftBack = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 4.0), matWoodAmber);
  railLeftBack.position.set(-roomW / 2 + 0.02, 2.2, -3.2);
  railLeftBack.castShadow = true;
  railLeftBack.receiveShadow = true;
  roomGroup.add(railLeftBack);

  const railLeftFront = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 3.6), matWoodAmber);
  railLeftFront.position.set(-roomW / 2 + 0.02, 2.2, 3.0);
  railLeftFront.castShadow = true;
  railLeftFront.receiveShadow = true;
  roomGroup.add(railLeftFront);

  const railRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, roomL), matWoodAmber);
  railRight.position.set(roomW / 2 - 0.02, 2.2, 0);
  railRight.castShadow = true;
  railRight.receiveShadow = true;
  roomGroup.add(railRight);

  // Ceiling
  const ceilingThickness = 0.20;
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xb5a58a, roughness: 0.95 });
  const ceilingMesh = new THREE.Mesh(new THREE.BoxGeometry(roomW + 0.4, ceilingThickness, roomL + 0.4), ceilingMat);
  ceilingMesh.position.y = roomH + ceilingThickness / 2;
  ceilingMesh.castShadow = true;
  ceilingMesh.receiveShadow = true;
  roomGroup.add(ceilingMesh);

  const beamThickness = 0.12;
  const beamWidth = 0.10;
  for (let c = -1.6; c <= 1.6; c += 0.8) {
    const beamX = new THREE.Mesh(new THREE.BoxGeometry(roomW, beamThickness, beamWidth), matWoodAmber);
    beamX.position.set(0, roomH - beamThickness / 2, c);
    beamX.castShadow = true;
    beamX.receiveShadow = true;
    roomGroup.add(beamX);

    const beamZ = new THREE.Mesh(new THREE.BoxGeometry(beamWidth, beamThickness, roomL), matWoodAmber);
    beamZ.position.set(c, roomH - beamThickness / 2, 0);
    beamZ.castShadow = true;
    beamZ.receiveShadow = true;
    roomGroup.add(beamZ);
  }

  // Ceiling Lamp
  const lampGroup = new THREE.Group();
  lampGroup.position.set(0, roomH - 0.3, 0);

  const lampOuterFrame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.65), matWoodAmber);
  lampOuterFrame.castShadow = true;
  lampOuterFrame.receiveShadow = true;
  lampGroup.add(lampOuterFrame);

  const lampPaper = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.6), matShojiPaper);
  lampPaper.castShadow = true;
  lampPaper.receiveShadow = true;
  lampPaper.position.y = -0.02;
  lampGroup.add(lampPaper);

  roomGroup.add(lampGroup);

  return { roomW, roomL, roomH, wallT };
}
