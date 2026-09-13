import * as THREE from 'three';

export interface InteractiveNotebookBuildResult {
  notebookGroup: THREE.Group;
  pencilGroup: THREE.Group;
  notebookClickMesh: THREE.Mesh;
  rightWing: THREE.Group;
}

export function buildInteractiveNotebook(
  matClosetBlue: THREE.Material,
  matPaperWhite: THREE.Material,
  matPencilYellow: THREE.Material,
  matChrome: THREE.Material
): InteractiveNotebookBuildResult {
  // 2. Interactive Foldable Homework Notebook & Pencil (Starts Closed on Left, Opens to Right)
  const notebookGroup = new THREE.Group();
  notebookGroup.position.set(-0.05, 0.963, 0.02);
  notebookGroup.scale.setScalar(1.4);
  notebookGroup.rotation.y = Math.PI / 2; // Rotated 90 degrees for student view

  // Left Wing (Fixed base page on desk)
  const leftWing = new THREE.Group();

  const coverL = new THREE.Mesh(new THREE.BoxGeometry(0.138, 0.006, 0.21), matClosetBlue);
  coverL.position.set(-0.069, 0.003, 0);
  coverL.castShadow = true;
  coverL.receiveShadow = true;
  leftWing.add(coverL);

  const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.20), matPaperWhite);
  pageL.position.set(-0.066, 0.006, 0);
  pageL.receiveShadow = true;
  leftWing.add(pageL);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  for (let zPos = -0.07; zPos <= 0.07; zPos += 0.02) {
    const lineL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.001, 0.0015), lineMat);
    lineL.position.set(-0.066, 0.0082, zPos);
    leftWing.add(lineL);
  }
  notebookGroup.add(leftWing);

  // Right Wing Cover & Pencil (Hinge Pivot at X = 0, Folds -180 degrees over Left Wing when CLOSED)
  const rightWing = new THREE.Group();
  rightWing.position.set(0, 0.002, 0);

  const coverR = new THREE.Mesh(new THREE.BoxGeometry(0.138, 0.006, 0.21), matClosetBlue);
  coverR.position.set(0.069, 0.003, 0);
  coverR.castShadow = true;
  coverR.receiveShadow = true;
  rightWing.add(coverR);

  // Cover White Label Sticker (Faces UP on left side when closed)
  const stickerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const coverSticker = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.001, 0.08), stickerMat);
  coverSticker.position.set(0.069, -0.0005, 0);
  rightWing.add(coverSticker);

  const pageR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.20), matPaperWhite);
  pageR.position.set(0.066, 0.006, 0);
  pageR.receiveShadow = true;
  rightWing.add(pageR);

  for (let zPos = -0.07; zPos <= 0.07; zPos += 0.02) {
    const lineR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.001, 0.0015), lineMat);
    lineR.position.set(0.066, 0.0082, zPos);
    rightWing.add(lineR);
  }

  // Real Hexagonal Japanese Yellow Pencil resting outside on wooden desk beside Notebook
  const pencilGroup = new THREE.Group();
  pencilGroup.position.set(0.20, 0.964, 0.05); // Resting flat on desk surface
  pencilGroup.scale.setScalar(1.4);
  pencilGroup.rotation.x = Math.PI / 2;
  pencilGroup.rotation.y = Math.PI / 8;

  const pencilBody = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.11, 6), matPencilYellow);
  pencilGroup.add(pencilBody);

  const woodTipMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.8 });
  const woodTip = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.016, 6), woodTipMat);
  woodTip.position.y = 0.063;
  pencilGroup.add(woodTip);

  const leadMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const leadTip = new THREE.Mesh(new THREE.ConeGeometry(0.0015, 0.005, 6), leadMat);
  leadTip.position.y = 0.0705;
  pencilGroup.add(leadTip);

  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.008, 12), matChrome);
  ferrule.position.y = -0.059;
  pencilGroup.add(ferrule);

  const pinkEraserMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 });
  const pinkEraser = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.010, 12), pinkEraserMat);
  pinkEraser.position.y = -0.066;
  pencilGroup.add(pinkEraser);

  // Initial Closed State: Right Cover Wing is folded 180 deg (Math.PI) over Left Wing
  rightWing.rotation.z = Math.PI;
  rightWing.position.y = 0.014;
  notebookGroup.add(rightWing);

  // Invisible Bounding Box Mesh for Click Raycaster Detection (Positioned over left side when closed)
  const notebookClickMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.08, 0.24),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  notebookClickMesh.position.set(-0.069, 0.02, 0);
  notebookGroup.add(notebookClickMesh);

  return { notebookGroup, pencilGroup, notebookClickMesh, rightWing };
}
