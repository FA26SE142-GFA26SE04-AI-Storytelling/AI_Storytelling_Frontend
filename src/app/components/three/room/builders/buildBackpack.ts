import * as THREE from 'three';

export interface BackpackBuildResult {
  backpackGroup: THREE.Group;
  backpackClickMesh: THREE.Mesh;
}

export function buildBackpack(roomW: number, matBrass: THREE.Material): BackpackBuildResult {
  // Nobita's Japanese Red Randoseru Backpack (High-Detail 3D Model with Name Tag)
  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(roomW / 2 - 0.50, 0.16, 0.45);
  backpackGroup.rotation.y = -Math.PI / 5;

  // Materials for Randoseru
  const matLeatherRed = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.3,
    metalness: 0.1,
  });
  const matLeatherDarkRed = new THREE.MeshStandardMaterial({
    color: 0x681212,
    roughness: 0.4,
    metalness: 0.05,
  });
  const matReflector = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
    metalness: 0.3,
    emissive: 0x854d0e,
    emissiveIntensity: 0.2,
  });

  // 1. Main Hard Box Body
  const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.15), matLeatherRed);
  packBody.castShadow = true;
  packBody.receiveShadow = true;
  backpackGroup.add(packBody);

  // Side Gusset Cushions (Left & Right Padded Sides)
  const sideGussetL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.30, 0.14), matLeatherDarkRed);
  sideGussetL.position.set(-0.122, 0, 0);
  backpackGroup.add(sideGussetL);

  const sideGussetR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.30, 0.14), matLeatherDarkRed);
  sideGussetR.position.set(0.122, 0, 0);
  backpackGroup.add(sideGussetR);

  // 2. Curved Main Top Cover Flap (Runs over top and down front)
  const packFlapTop = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.16), matLeatherRed);
  packFlapTop.position.set(0, 0.165, 0.005);
  backpackGroup.add(packFlapTop);

  const packFlapFront = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.33, 0.018), matLeatherRed);
  packFlapFront.position.set(0, 0.005, 0.082);
  packFlapFront.castShadow = true;
  backpackGroup.add(packFlapFront);

  // 3. Front Lower Pouch (Ngăn phụ phía trước)
  const frontPouch = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.14, 0.04), matLeatherDarkRed);
  frontPouch.position.set(0, -0.06, 0.085);
  backpackGroup.add(frontPouch);

  // Zipper Slider on Front Pouch
  const zipperSlider = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.01), matBrass);
  zipperSlider.position.set(0.07, 0.005, 0.106);
  backpackGroup.add(zipperSlider);

  // 4. Student Name Tag Label (Nhãn tên: NAME: ___________ - CLASS: ___________)
  const nameTagCanvas = document.createElement('canvas');
  nameTagCanvas.width = 256;
  nameTagCanvas.height = 128;
  const ctxTag = nameTagCanvas.getContext('2d');
  if (ctxTag) {
    // Cream background
    ctxTag.fillStyle = '#fefcf3';
    ctxTag.fillRect(0, 0, 256, 128);
    // Outer border
    ctxTag.strokeStyle = '#881337';
    ctxTag.lineWidth = 10;
    ctxTag.strokeRect(5, 5, 246, 118);
    // Inner line
    ctxTag.strokeStyle = '#b45309';
    ctxTag.lineWidth = 3;
    ctxTag.strokeRect(14, 14, 228, 100);
    // Blank Name Label Field (No specific name, just blank underlines _________)
    ctxTag.fillStyle = '#0f172a';
    ctxTag.font = 'bold 30px "Segoe UI", sans-serif';
    ctxTag.textAlign = 'center';
    ctxTag.textBaseline = 'middle';
    ctxTag.fillText('NAME: ___________', 128, 48);

    ctxTag.fillStyle = '#991b1b';
    ctxTag.font = 'bold 20px "Segoe UI", sans-serif';
    ctxTag.fillText('CLASS: ___________', 128, 90);
  }
  const nameTagTex = new THREE.CanvasTexture(nameTagCanvas);
  const matNameTag = new THREE.MeshStandardMaterial({
    map: nameTagTex,
    roughness: 0.3,
    metalness: 0.1,
  });

  // Name Tag Frame (Brass border)
  const nameTagFrame = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.006), matBrass);
  nameTagFrame.position.set(0, -0.05, 0.108);
  backpackGroup.add(nameTagFrame);

  // Name Tag Plate Mesh
  const nameTagPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), matNameTag);
  nameTagPlate.position.set(0, -0.05, 0.112);
  backpackGroup.add(nameTagPlate);

  // 5. Classic Turn-Lock Mechanism at bottom of flap
  const lockBase = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.015), matBrass);
  lockBase.position.set(0, -0.14, 0.093);
  backpackGroup.add(lockBase);

  const lockDial = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.015, 12), matBrass);
  lockDial.rotation.x = Math.PI / 2;
  lockDial.position.set(0, -0.14, 0.102);
  backpackGroup.add(lockDial);

  // 6. Leather Shoulder Straps (Quai đeo)
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.01), matLeatherDarkRed);
  strapL.position.set(-0.07, -0.02, -0.08);
  strapL.rotation.x = Math.PI / 16;
  backpackGroup.add(strapL);

  const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.01), matLeatherDarkRed);
  strapR.position.set(0.07, -0.02, -0.08);
  strapR.rotation.x = Math.PI / 16;
  backpackGroup.add(strapR);

  // Strap Metal Buckles
  const strapBuckleL = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.025, 0.015), matBrass);
  strapBuckleL.position.set(-0.07, -0.13, -0.075);
  backpackGroup.add(strapBuckleL);

  const strapBuckleR = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.025, 0.015), matBrass);
  strapBuckleR.position.set(0.07, -0.13, -0.075);
  backpackGroup.add(strapBuckleR);

  // 7. Top Carry Handle (Quai xách tay)
  const handleTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.025), matLeatherDarkRed);
  handleTop.position.set(0, 0.18, -0.02);
  backpackGroup.add(handleTop);

  // 8. Safety Reflector Strips on Sides (Dải phản quang an toàn)
  const reflectorL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.025, 0.10), matReflector);
  reflectorL.position.set(-0.126, 0.05, 0);
  backpackGroup.add(reflectorL);

  const reflectorR = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.025, 0.10), matReflector);
  reflectorR.position.set(0.126, 0.05, 0);
  backpackGroup.add(reflectorR);

  // Invisible Click Target Mesh for Backpack Raycasting
  const backpackClickMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.45, 0.35),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  backpackClickMesh.position.set(roomW / 2 - 0.50, 0.20, 0.45);

  return { backpackGroup, backpackClickMesh };
}
