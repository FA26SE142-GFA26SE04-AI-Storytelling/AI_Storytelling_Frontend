import * as THREE from 'three';
import {
  WorkingVolumeBook,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeInsideCoverTexture,
  createWorkingVolumePageTexture,
} from '../textures/workingVolumesBooks';

export interface InteractiveStoryBookBuildResult {
  storyBookGroup: THREE.Group;
  leftWing: THREE.Group;
  notebookClickMesh: THREE.Mesh;
  updateBook: (book: WorkingVolumeBook) => void;
}

export function buildInteractiveStoryBook(
  initialBook: WorkingVolumeBook
): InteractiveStoryBookBuildResult {
  const storyBookGroup = new THREE.Group();
  storyBookGroup.position.set(-0.05, 0.963, -0.12);
  storyBookGroup.scale.setScalar(1.4);
  storyBookGroup.rotation.y = -Math.PI / 2; // Xoay đúng chiều góc nhìn học sinh và camera

  // Right Wing (Gáy & Bìa sau cố định trên mặt bàn bên phải: Trang nội dung truyện bên phải)
  const rightWing = new THREE.Group();

  const matCoverSolid = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialBook.color),
    roughness: 0.38,
    metalness: 0.1,
  });

  const coverR = new THREE.Mesh(new THREE.BoxGeometry(0.138, 0.006, 0.21), matCoverSolid);
  coverR.position.set(0.069, 0.003, 0);
  coverR.castShadow = true;
  coverR.receiveShadow = true;
  rightWing.add(coverR);

  // Trang nội dung truyện bên phải (Ngửa lên trên khi sách lật mở ra)
  const matRightPage = new THREE.MeshStandardMaterial({
    map: createWorkingVolumePageTexture(initialBook),
    roughness: 0.5,
  });
  const pageR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.20), matRightPage);
  pageR.position.set(0.066, 0.006, 0);
  pageR.receiveShadow = true;
  rightWing.add(pageR);

  storyBookGroup.add(rightWing);

  // Left Wing (Bìa trước & Trang Ex Libris lót bìa bên trái, bản lề gáy sách tại X = 0)
  const leftWing = new THREE.Group();
  leftWing.position.set(0, 0.002, 0);

  const coverL = new THREE.Mesh(new THREE.BoxGeometry(0.138, 0.006, 0.21), matCoverSolid);
  coverL.position.set(-0.069, 0.003, 0);
  coverL.castShadow = true;
  coverL.receiveShadow = true;
  leftWing.add(coverL);

  // Bìa trước nghệ thuật của truyện (Ngửa lên trên rõ nét khi sách đang đóng)
  const matCoverArt = new THREE.MeshStandardMaterial({
    map: createWorkingVolumeCoverTexture(initialBook),
    roughness: 0.3,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });
  const frontCoverFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.136, 0.208),
    matCoverArt
  );
  frontCoverFace.position.set(-0.069, -0.0032, 0);
  frontCoverFace.rotation.x = Math.PI / 2;
  frontCoverFace.rotation.z = Math.PI;
  leftWing.add(frontCoverFace);

  // Trang lót trong bìa trái Ex Libris (Ngửa lên trên khi mở sách sang trái)
  const matInsideCover = new THREE.MeshStandardMaterial({
    map: createWorkingVolumeInsideCoverTexture(initialBook),
    roughness: 0.5,
  });
  const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.20), matInsideCover);
  pageL.position.set(-0.066, 0.006, 0);
  pageL.receiveShadow = true;
  leftWing.add(pageL);

  // Trạng thái ban đầu: Đóng (Cánh trái lật -180 độ qua cánh phải)
  leftWing.rotation.z = -Math.PI;
  leftWing.position.y = 0.014;
  storyBookGroup.add(leftWing);

  // Click Raycaster collider
  const notebookClickMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.08, 0.24),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  notebookClickMesh.position.set(0.069, 0.02, 0);
  storyBookGroup.add(notebookClickMesh);

  const updateBook = (book: WorkingVolumeBook) => {
    matCoverSolid.color.set(book.color);
    matCoverArt.map = createWorkingVolumeCoverTexture(book);
    matCoverArt.needsUpdate = true;
    matInsideCover.map = createWorkingVolumeInsideCoverTexture(book);
    matInsideCover.needsUpdate = true;
    matRightPage.map = createWorkingVolumePageTexture(book);
    matRightPage.needsUpdate = true;
  };

  return { storyBookGroup, leftWing, notebookClickMesh, updateBook };
}
