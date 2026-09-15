import * as THREE from 'three';

export interface RoomShellBuildResult {
  roomW: number;
  roomL: number;
  roomH: number;
  wallT: number;
  lampPaperMat: THREE.MeshStandardMaterial;
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

  // --- Ceiling Lamp (Đèn trần phong cách Washitsu Nhật Bản) ---
  const lampGroup = new THREE.Group();
  lampGroup.position.set(0, roomH - 0.22, 0);

  // 1. Đế gắn trần và dây treo
  const lampCeilingMount = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.025, 0.38), matWoodDark);
  lampCeilingMount.position.y = 0.10;
  lampGroup.add(lampCeilingMount);

  const lampCord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.05, 12), matWoodDark);
  lampCord.position.y = 0.07;
  lampGroup.add(lampCord);

  // 2. Chao đèn giấy Shoji phát sáng (Luminous Shoji Paper Shade)
  const lampPaperMat = new THREE.MeshStandardMaterial({
    color: 0xfffef7,
    roughness: 0.25,
    metalness: 0.0,
    emissive: 0xffe6b0, // Vàng kem sáng ấm tự nhiên
    emissiveIntensity: 2.0,
    transparent: false,
  });

  const shadeW = 0.62;
  const shadeH = 0.17;
  const shadeL = 0.62;

  // Khối chao đèn chính
  const lampPaper = new THREE.Mesh(new THREE.BoxGeometry(shadeW, shadeH, shadeL), lampPaperMat);
  lampPaper.position.y = -0.01;
  lampGroup.add(lampPaper);

  // Tấm khuếch tán đáy (Bottom diffuser - phát sáng mạnh chiếu thẳng xuống phòng)
  const bottomDiffuser = new THREE.Mesh(new THREE.BoxGeometry(shadeW - 0.03, 0.006, shadeL - 0.03), lampPaperMat);
  bottomDiffuser.position.y = -0.01 - shadeH / 2 - 0.002;
  lampGroup.add(bottomDiffuser);

  // 3. Khung gỗ nan Kumiko thanh mảnh bao quanh (để lộ toàn bộ mặt giấy phát sáng)
  const frameGroup = new THREE.Group();
  const fThick = 0.022;

  // Viền gỗ trên cùng
  const topRimGeoX = new THREE.BoxGeometry(shadeW + 0.02, fThick, fThick);
  const topRimGeoZ = new THREE.BoxGeometry(fThick, fThick, shadeL + 0.02);
  const topY = -0.01 + shadeH / 2;

  const topRimN = new THREE.Mesh(topRimGeoX, matWoodAmber);
  topRimN.position.set(0, topY, -shadeL / 2);
  const topRimS = new THREE.Mesh(topRimGeoX, matWoodAmber);
  topRimS.position.set(0, topY, shadeL / 2);
  const topRimW = new THREE.Mesh(topRimGeoZ, matWoodAmber);
  topRimW.position.set(-shadeW / 2, topY, 0);
  const topRimE = new THREE.Mesh(topRimGeoZ, matWoodAmber);
  topRimE.position.set(shadeW / 2, topY, 0);
  frameGroup.add(topRimN, topRimS, topRimW, topRimE);

  // Viền gỗ dưới cùng
  const botY = -0.01 - shadeH / 2;
  const botRimN = new THREE.Mesh(topRimGeoX, matWoodAmber);
  botRimN.position.set(0, botY, -shadeL / 2);
  const botRimS = new THREE.Mesh(topRimGeoX, matWoodAmber);
  botRimS.position.set(0, botY, shadeL / 2);
  const botRimW = new THREE.Mesh(topRimGeoZ, matWoodAmber);
  botRimW.position.set(-shadeW / 2, botY, 0);
  const botRimE = new THREE.Mesh(topRimGeoZ, matWoodAmber);
  botRimE.position.set(shadeW / 2, botY, 0);
  frameGroup.add(botRimN, botRimS, botRimW, botRimE);

  // 4 cột góc đứng
  const cornerPostGeo = new THREE.BoxGeometry(fThick, shadeH, fThick);
  const cornerOffsets = [
    [-shadeW / 2, -shadeL / 2],
    [shadeW / 2, -shadeL / 2],
    [-shadeW / 2, shadeL / 2],
    [shadeW / 2, shadeL / 2],
  ];
  cornerOffsets.forEach(([cx, cz]) => {
    const post = new THREE.Mesh(cornerPostGeo, matWoodAmber);
    post.position.set(cx, -0.01, cz);
    frameGroup.add(post);
  });

  // Nan gỗ trang trí ngang trên 4 mặt
  const gridThick = 0.010;
  const gridBarGeoX = new THREE.BoxGeometry(shadeW, gridThick, 0.012);
  const gridBarGeoZ = new THREE.BoxGeometry(0.012, gridThick, shadeL);
  const barN = new THREE.Mesh(gridBarGeoX, matWoodAmber);
  barN.position.set(0, -0.01, -shadeL / 2 - 0.002);
  const barS = new THREE.Mesh(gridBarGeoX, matWoodAmber);
  barS.position.set(0, -0.01, shadeL / 2 + 0.002);
  const barW = new THREE.Mesh(gridBarGeoZ, matWoodAmber);
  barW.position.set(-shadeW / 2 - 0.002, -0.01, 0);
  const barE = new THREE.Mesh(gridBarGeoZ, matWoodAmber);
  barE.position.set(shadeW / 2 + 0.002, -0.01, 0);
  frameGroup.add(barN, barS, barW, barE);

  lampGroup.add(frameGroup);
  roomGroup.add(lampGroup);

  return { roomW, roomL, roomH, wallT, lampPaperMat };
}
