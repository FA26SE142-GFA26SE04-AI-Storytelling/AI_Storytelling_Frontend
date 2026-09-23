import * as THREE from 'three';
import {
  WORKING_VOLUMES_BOOKS,
  WorkingVolumeBook,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeSpineTexture,
} from '../three/room/textures/workingVolumesBooks';

export interface BookMeshHolder {
  group: THREE.Group;
  book: WorkingVolumeBook;
  bookIndex: number;
  clickCollider: THREE.Mesh;
}

// Thuật toán tính khoảng cách vòng tròn ngắn nhất
export function getShortestOffset(index: number, activeIndex: number, total: number): number {
  let diff = (index - activeIndex) % total;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

export function buildCarouselBookHolders(scene: THREE.Scene): BookMeshHolder[] {
  const bookHolders: BookMeshHolder[] = [];
  const bW = 2.05;
  const bH = 2.68;
  const bThickness = 0.28;
  const coverT = 0.035;

  WORKING_VOLUMES_BOOKS.forEach((book, bIdx) => {
    const bGroup = new THREE.Group();
    scene.add(bGroup);

    const coverTex = createWorkingVolumeCoverTexture(book);
    const spineTex = createWorkingVolumeSpineTexture(book);

    const matCoverSolid = new THREE.MeshStandardMaterial({
      color: new THREE.Color(book.color),
      roughness: 0.38,
      metalness: 0.08,
    });

    const matFrontOutside = new THREE.MeshStandardMaterial({
      map: coverTex,
      roughness: 0.28,
      metalness: 0.22,
    });

    // A. Front Cover
    const frontMaterials = [
      matCoverSolid,   // +X
      matCoverSolid,   // -X
      matCoverSolid,   // +Y
      matCoverSolid,   // -Y
      matFrontOutside, // +Z (Bìa trước)
      matCoverSolid,   // -Z
    ];
    const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, coverT), frontMaterials);
    frontMesh.position.set(0, 0, (bThickness - coverT) / 2);
    bGroup.add(frontMesh);

    // B. Back Cover
    const backMesh = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, coverT), matCoverSolid);
    backMesh.position.set(0, 0, -(bThickness - coverT) / 2);
    bGroup.add(backMesh);

    // C. Curved Spine
    const spineGeo = new THREE.CylinderGeometry(
      bThickness / 2,
      bThickness / 2,
      bH,
      24,
      1,
      true,
      Math.PI,
      Math.PI
    );
    const matSpine = new THREE.MeshStandardMaterial({
      map: spineTex,
      roughness: 0.35,
      metalness: 0.18,
    });
    const spineMesh = new THREE.Mesh(spineGeo, matSpine);
    spineMesh.position.set(-bW / 2, 0, 0);
    spineMesh.rotation.y = 0;
    bGroup.add(spineMesh);

    // D. Book Block (Paper Pages)
    const paperW = bW - 0.06;
    const paperH = bH - 0.08;
    const paperT = bThickness - coverT * 2 - 0.005;

    const paperCanvas = document.createElement('canvas');
    paperCanvas.width = 256;
    paperCanvas.height = 256;
    const pCtx = paperCanvas.getContext('2d')!;
    pCtx.fillStyle = '#f8f4eb';
    pCtx.fillRect(0, 0, 256, 256);
    pCtx.fillStyle = '#dfd8c8';
    for (let i = 0; i < 256; i += 3) {
      pCtx.fillRect(0, i, 256, 1);
    }
    const paperTex = new THREE.CanvasTexture(paperCanvas);

    const matPaperSides = new THREE.MeshStandardMaterial({
      map: paperTex,
      roughness: 0.85,
      metalness: 0.02,
    });

    const paperMesh = new THREE.Mesh(
      new THREE.BoxGeometry(paperW, paperH, paperT),
      matPaperSides
    );
    paperMesh.position.set(0.02, 0, 0);
    bGroup.add(paperMesh);

    // E. Click Collider
    const colliderGeo = new THREE.BoxGeometry(bW + 0.4, bH + 0.4, bThickness + 0.6);
    const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
    const clickCollider = new THREE.Mesh(colliderGeo, colliderMat);
    bGroup.add(clickCollider);

    bookHolders.push({
      group: bGroup,
      book,
      bookIndex: bIdx,
      clickCollider,
    });
  });

  return bookHolders;
}

export function createBackdropDimmer(scene: THREE.Scene): { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial } {
  const dimBackdropGeo = new THREE.PlaneGeometry(240, 160);
  const dimBackdropMat = new THREE.MeshBasicMaterial({
    color: 0x05070c,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const dimBackdropMesh = new THREE.Mesh(dimBackdropGeo, dimBackdropMat);
  dimBackdropMesh.position.set(0, 0, -4.5);
  dimBackdropMesh.renderOrder = -1;
  scene.add(dimBackdropMesh);
  return { mesh: dimBackdropMesh, material: dimBackdropMat };
}
