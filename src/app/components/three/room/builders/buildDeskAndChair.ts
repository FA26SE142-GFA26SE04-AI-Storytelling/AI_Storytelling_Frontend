import * as THREE from 'three';

export interface DeskAndChairBuildResult {
  deskGroup: THREE.Group;
  chairGroup: THREE.Group;
  deskClickMesh: THREE.Mesh;
}

export function buildDeskAndChair(
  roomW: number,
  matWoodAmber: THREE.Material,
  matWoodDark: THREE.Material,
  matCeramicWhite: THREE.Material,
  matClosetBlue: THREE.Material,
  matLampGreen: THREE.Material,
  matBrass: THREE.Material,
  matSwitchRed: THREE.Material,
  matChrome: THREE.Material,
  matCupYellow: THREE.Material,
  matGlobeOcean: THREE.Material,
  matAlarmRed: THREE.Material,
  matPaperWhite: THREE.Material,
  matMetalLegs: THREE.Material,
  matChairWheel: THREE.Material,
  matBlueChair: THREE.Material,
  matChairPiping: THREE.Material,
  matChairShell: THREE.Material
): DeskAndChairBuildResult {
  const deskGroup = new THREE.Group();
  deskGroup.position.set(roomW / 2 - 0.65, 0, -0.6);

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.6), matWoodAmber);
  deskTop.position.y = 0.92;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  const drawerBlock = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.84, 0.52), matWoodAmber);
  drawerBlock.position.set(0, 0.46, 0.5);
  drawerBlock.castShadow = true;
  deskGroup.add(drawerBlock);

  for (let dr = 0.2; dr <= 0.72; dr += 0.25) {
    const dHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.15), matWoodDark);
    dHandle.position.set(-0.46, dr, 0.5);
    deskGroup.add(dHandle);
  }

  const legLeft1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.08), matWoodDark);
  legLeft1.position.set(0.4, 0.46, -0.7);
  deskGroup.add(legLeft1);

  const legLeft2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.08), matWoodDark);
  legLeft2.position.set(-0.4, 0.46, -0.7);
  deskGroup.add(legLeft2);

  // Ceramic Tea/Coffee Mug on Desk
  const deskMug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.09, 16), matCeramicWhite);
  deskMug.position.set(0.18, 0.96 + 0.045, 0.28);
  deskMug.castShadow = true;
  deskGroup.add(deskMug);

  const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 12, 16, Math.PI), matCeramicWhite);
  mugHandle.position.set(0.22, 0.96 + 0.045, 0.28);
  mugHandle.rotation.y = Math.PI / 2;
  deskGroup.add(mugHandle);

  // MONO Eraser Block on Desk
  const eraser = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.06), matClosetBlue);
  eraser.position.set(-0.15, 0.963 + 0.006, -0.22);
  eraser.rotation.y = 0.3;
  deskGroup.add(eraser);

  // 1. Classic Japanese Anime Desk Lamp
  const deskLamp = new THREE.Group();
  deskLamp.position.set(0.28, 0.96, -0.45);
  deskLamp.scale.setScalar(1.3);

  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.085, 0.02, 32), matLampGreen);
  lampBase.position.y = 0.01;
  deskLamp.add(lampBase);

  const baseBrassRing = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.005, 16, 32), matBrass);
  baseBrassRing.position.y = 0.018;
  baseBrassRing.rotation.x = Math.PI / 2;
  deskLamp.add(baseBrassRing);

  const switchBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.014, 16), matSwitchRed);
  switchBtn.position.set(0.04, 0.025, 0.03);
  deskLamp.add(switchBtn);

  const baseSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.03, 16), matBrass);
  baseSocket.position.y = 0.035;
  deskLamp.add(baseSocket);

  const lowerStemGroup = new THREE.Group();
  lowerStemGroup.position.set(0, 0.045, 0);
  lowerStemGroup.rotation.z = Math.PI / 16;

  const lowerStemLength = 0.36;
  const lowerStemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, lowerStemLength, 16), matChrome);
  lowerStemMesh.position.set(0, lowerStemLength / 2, 0);
  lowerStemGroup.add(lowerStemMesh);

  const elbowGroup = new THREE.Group();
  elbowGroup.position.set(0, lowerStemLength, 0);

  const elbowJointMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.028, 16), matBrass);
  elbowJointMesh.rotation.x = Math.PI / 2;
  elbowGroup.add(elbowJointMesh);

  const elbowKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.015, 16), matBrass);
  elbowKnob.position.set(0, 0, 0.02);
  elbowKnob.rotation.x = Math.PI / 2;
  elbowGroup.add(elbowKnob);

  const upperArmGroup = new THREE.Group();
  upperArmGroup.rotation.z = -Math.PI / 2.6;

  const upperArmLength = 0.22;
  const upperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, upperArmLength, 16), matChrome);
  upperArmMesh.position.set(0, upperArmLength / 2, 0);
  upperArmGroup.add(upperArmMesh);

  const shadeGroup = new THREE.Group();
  shadeGroup.position.set(0, upperArmLength, 0);
  shadeGroup.rotation.z = -(lowerStemGroup.rotation.z + upperArmGroup.rotation.z);

  const shadeNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.014, 0.025, 16), matBrass);
  shadeNeck.position.set(0, 0.01, 0);
  shadeGroup.add(shadeNeck);

  const lampHead = new THREE.Mesh(
    new THREE.ConeGeometry(0.085, 0.11, 28, 1, true),
    matLampGreen
  );
  lampHead.position.set(0, -0.045, 0);
  shadeGroup.add(lampHead);

  const shadeRim = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.004, 16, 32), matChrome);
  shadeRim.position.set(0, -0.10, 0);
  shadeRim.rotation.x = Math.PI / 2;
  shadeGroup.add(shadeRim);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xdedede,
    emissive: new THREE.Color(0x000000),
    roughness: 0.4,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), bulbMat);
  bulb.position.set(0, -0.06, 0);
  shadeGroup.add(bulb);

  const deskSpotLight = new THREE.SpotLight(0xffc864, 0.0, 1.8, Math.PI / 4.2, 0.4, 1.0);
  deskSpotLight.position.set(0, -0.06, 0);
  deskSpotLight.target.position.set(0, -0.5, 0);
  deskSpotLight.castShadow = true;
  shadeGroup.add(deskSpotLight);
  shadeGroup.add(deskSpotLight.target);

  upperArmGroup.add(shadeGroup);
  elbowGroup.add(upperArmGroup);
  lowerStemGroup.add(elbowGroup);
  deskLamp.add(lowerStemGroup);
  deskGroup.add(deskLamp);

  // Pencil Holder Cup & Stationeries
  const penCupGroup = new THREE.Group();
  penCupGroup.position.set(0.32, 0.96, 0.25);
  penCupGroup.scale.setScalar(1.4);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.11, 16), matCupYellow);
  cup.position.y = 0.055;
  penCupGroup.add(cup);

  const pen1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16), matGlobeOcean);
  pen1.position.set(-0.012, 0.11, -0.01);
  penCupGroup.add(pen1);

  const pen2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16), matAlarmRed);
  pen2.position.set(0.012, 0.11, 0.01);
  penCupGroup.add(pen2);

  const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.18, 0.025), new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));
  ruler.position.set(0, 0.12, 0);
  penCupGroup.add(ruler);

  deskGroup.add(penCupGroup);

  // Stack of Textbooks on Desk Corner
  const deskBookStack = new THREE.Group();
  deskBookStack.position.set(-0.25, 0.96, 0.45);
  deskBookStack.scale.setScalar(1.4);
  deskBookStack.rotation.y = Math.PI / 2;

  let dStackY = 0;
  [
    { w: 0.24, h: 0.035, d: 0.18, c: 0x1e40af },
    { w: 0.22, h: 0.03, d: 0.17, c: 0x15803d },
    { w: 0.20, h: 0.028, d: 0.16, c: 0xca8a04 },
  ].forEach((tb) => {
    const bCover = new THREE.Mesh(new THREE.BoxGeometry(tb.w, tb.h, tb.d), new THREE.MeshStandardMaterial({ color: tb.c, roughness: 0.5 }));
    bCover.position.y = dStackY + tb.h / 2;
    deskBookStack.add(bCover);

    const bPages = new THREE.Mesh(new THREE.BoxGeometry(tb.w - 0.008, tb.h - 0.008, tb.d - 0.01), matPaperWhite);
    bPages.position.set(0, dStackY + tb.h / 2, 0.004);
    deskBookStack.add(bPages);

    dStackY += tb.h;
  });

  deskGroup.add(deskBookStack);

  // Swivel Chair - Seat Front Facing Into Desk Without Clipping
  const chairGroup = new THREE.Group();
  chairGroup.position.set(roomW / 2 - 1.2, 0, -0.85);
  chairGroup.rotation.y = 0;

  const baseCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 24), matMetalLegs);
  baseCenter.position.y = 0.06;
  chairGroup.add(baseCenter);

  for (let w = 0; w < 5; w++) {
    const angle = (w * Math.PI * 2) / 5;
    const legArm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.025, 0.035), matMetalLegs);
    legArm.position.set(Math.cos(angle) * 0.13, 0.06, Math.sin(angle) * 0.13);
    legArm.rotation.y = -angle;
    chairGroup.add(legArm);

    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), matChairWheel);
    wheel.position.set(Math.cos(angle) * 0.26, 0.024, Math.sin(angle) * 0.26);
    chairGroup.add(wheel);
  }

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 20), matMetalLegs);
  stem.position.y = 0.23;
  chairGroup.add(stem);

  const mechBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), matMetalLegs);
  mechBox.position.set(0, 0.39, 0);
  chairGroup.add(mechBox);

  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14), matMetalLegs);
  lever.position.set(0.10, 0.38, 0.06);
  lever.rotation.z = Math.PI / 3;
  chairGroup.add(lever);

  const seatCushion = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.24, 0.07, 32), matBlueChair);
  seatCushion.position.y = 0.44;
  chairGroup.add(seatCushion);

  const seatPiping = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.012, 16, 32), matChairPiping);
  seatPiping.position.y = 0.44;
  seatPiping.rotation.x = Math.PI / 2;
  chairGroup.add(seatPiping);

  // --- Sleek Ergonomic Chair Backrest (Reclined ~12.5 degrees) ---
  const backGroup = new THREE.Group();
  backGroup.rotation.z = 0;

  // Helper function to create smooth rounded/contoured backrest shape
  const createErgonomicBackShape = (w: number, h: number, r: number) => {
    const shape = new THREE.Shape();
    const halfW = w / 2;
    const lumbarW = halfW * 0.92; // Ergonomic waist curve

    shape.moveTo(-halfW + r, 0);
    shape.lineTo(halfW - r, 0);
    shape.quadraticCurveTo(halfW, 0, halfW, r);
    shape.quadraticCurveTo(lumbarW, h * 0.38, halfW, h - r);
    shape.quadraticCurveTo(halfW, h, halfW - r, h);
    shape.quadraticCurveTo(0, h + 0.035, -halfW + r, h); // Curved top arch
    shape.quadraticCurveTo(-halfW, h, -halfW, h - r);
    shape.quadraticCurveTo(-lumbarW, h * 0.38, -halfW, r);
    shape.quadraticCurveTo(-halfW, 0, -halfW + r, 0);
    return shape;
  };

  const extrudeSettingsShell = {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 4,
  };

  const extrudeSettingsCushion = {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 5,
  };

  // 1. Back Outer Frame / Shell (matChairShell - Dark Charcoal)
  const shellShape = createErgonomicBackShape(0.40, 0.47, 0.08);
  const shellGeo = new THREE.ExtrudeGeometry(shellShape, extrudeSettingsShell);
  const backShellMesh = new THREE.Mesh(shellGeo, matChairShell);
  backShellMesh.rotation.y = Math.PI / 2;
  backShellMesh.position.set(-0.23, 0.52, 0);
  backShellMesh.castShadow = true;
  backGroup.add(backShellMesh);

  // 2. Inner Padded Cushion (matBlueChair - Vibrant Blue)
  const cushionShape = createErgonomicBackShape(0.36, 0.44, 0.07);
  const cushionGeo = new THREE.ExtrudeGeometry(cushionShape, extrudeSettingsCushion);
  const backCushionMesh = new THREE.Mesh(cushionGeo, matBlueChair);
  backCushionMesh.rotation.y = Math.PI / 2;
  backCushionMesh.position.set(-0.218, 0.535, 0);
  backCushionMesh.castShadow = true;
  backGroup.add(backCushionMesh);

  // 3. Central Vertical Stitching Line / Spine Accent (matChairPiping)
  const pipingStitching = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.38, 0.012),
    matChairPiping
  );
  pipingStitching.position.set(-0.168, 0.74, 0);
  backGroup.add(pipingStitching);

  // 4. Ergonomic Lumbar Support Band (Horizontal accent across lower back)
  const lumbarBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.045, 0.34),
    matChairShell
  );
  lumbarBand.position.set(-0.17, 0.65, 0);
  backGroup.add(lumbarBand);

  // 5. Executive Headrest Cushion on Top (matBlueChair)
  const headrestShape = new THREE.Shape();
  const hrW = 0.24 / 2;
  const hrH = 0.12;
  const hrR = 0.04;
  headrestShape.moveTo(-hrW + hrR, 0);
  headrestShape.lineTo(hrW - hrR, 0);
  headrestShape.quadraticCurveTo(hrW, 0, hrW, hrR);
  headrestShape.lineTo(hrW, hrH - hrR);
  headrestShape.quadraticCurveTo(hrW, hrH, hrW - hrR, hrH);
  headrestShape.lineTo(-hrW + hrR, hrH);
  headrestShape.quadraticCurveTo(-hrW, hrH, -hrW, hrH - hrR);
  headrestShape.lineTo(-hrW, hrR);
  headrestShape.quadraticCurveTo(-hrW, 0, -hrW + hrR, 0);

  const headrestGeo = new THREE.ExtrudeGeometry(headrestShape, {
    depth: 0.038,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 4,
  });
  const headrestMesh = new THREE.Mesh(headrestGeo, matBlueChair);
  headrestMesh.rotation.y = Math.PI / 2;
  headrestMesh.position.set(-0.21, 0.98, 0);
  headrestMesh.castShadow = true;
  backGroup.add(headrestMesh);

  // Headrest Metallic Connector Bracket behind headrest
  const headrestBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.08, 0.04),
    matMetalLegs
  );
  headrestBracket.position.set(-0.23, 0.98, 0);
  backGroup.add(headrestBracket);

  // 6. Sleek Ergonomic Metal Spine & Support Bars Behind
  const backSupportBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.025, 0.16),
    matMetalLegs
  );
  backSupportBar.position.set(-0.13, 0.44, 0);
  backGroup.add(backSupportBar);

  const spineBar1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.018, 0.32, 16),
    matMetalLegs
  );
  spineBar1.position.set(-0.23, 0.62, 0);
  backGroup.add(spineBar1);

  // Lumbar adjustment dial behind spine
  const lumbarKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.02, 24),
    matMetalLegs
  );
  lumbarKnob.position.set(-0.25, 0.64, 0);
  lumbarKnob.rotation.z = Math.PI / 2;
  backGroup.add(lumbarKnob);

  chairGroup.add(backGroup);

  [-0.18, 0.18].forEach((zSide) => {
    const armBracket = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.025), matMetalLegs);
    armBracket.position.set(-0.02, 0.51, zSide);
    chairGroup.add(armBracket);

    const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.05), matBlueChair);
    armPad.position.set(-0.02, 0.60, zSide);
    chairGroup.add(armPad);
  });

  const deskClickMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  deskClickMesh.position.set(roomW / 2 - 0.65, 0.6, -0.6);

  return { deskGroup, chairGroup, deskClickMesh };
}
