import * as THREE from 'three';
import {
  WorkingVolumeBook,
  createWorkingVolumeCoverTexture,
  createWorkingVolumeInsideCoverTexture,
  createWorkingVolumePageTexture,
} from '../textures/workingVolumesBooks';

export interface InteractiveStoryBookBuildResult {
  storyBookGroup: THREE.Group;
  rightWing: THREE.Group;
  notebookClickMesh: THREE.Mesh;
  updateBook: (book: WorkingVolumeBook) => void;
}

export function buildInteractiveStoryBook(
  initialBook: WorkingVolumeBook
): InteractiveStoryBookBuildResult {
  const storyBookGroup = new THREE.Group();
  storyBookGroup.position.set(-0.05, 0.963, 0.02);
  storyBookGroup.scale.setScalar(1.4);
  storyBookGroup.rotation.y = -Math.PI / 2; // Xoay 180 độ đúng chiều góc nhìn học sinh và camera

  // Left Wing (Gáy & Bìa sau cố định trên mặt bàn: Trang Ex Libris)
  const leftWing = new THREE.Group();

  const matCoverSolid = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialBook.color),
    roughness: 0.38,
    metalness: 0.1,
  });

  const coverL = new THREE.Mesh(new THREE.BoxGeometry(0.138, 0.006, 0.21), matCoverSolid);
  coverL.position.set(-0.069, 0.003, 0);
  coverL.castShadow = true;
  coverL.receiveShadow = true;
  leftWing.add(coverL);

  const matInsideCover = new THREE.MeshStandardMaterial({
    map: createWorkingVolumeInsideCoverTexture(initialBook),
    roughness: 0.5,
  });
  const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.20), matInsideCover);
  pageL.position.set(-0.066, 0.006, 0);
  pageL.receiveShadow = true;
  leftWing.add(pageL);

  storyBookGroup.add(leftWing);

  // Right Wing (Bìa trước & Trang ruột truyện, bản lề mở tại X = 0)
  const rightWing = new THREE.Group();
  rightWing.position.set(0, 0.002, 0);

  const coverR = new THREE.Mesh(new THREE.BoxGeometry(0.138, 0.006, 0.21), matCoverSolid);
  coverR.position.set(0.069, 0.003, 0);
  coverR.castShadow = true;
  coverR.receiveShadow = true;
  rightWing.add(coverR);

  // Bìa trước nghệ thuật của truyện (Ngửa lên trên khi sách đang đóng)
  const matCoverArt = new THREE.MeshStandardMaterial({
    map: createWorkingVolumeCoverTexture(initialBook),
    roughness: 0.3,
    metalness: 0.2,
  });
  const frontCoverFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.136, 0.208),
    matCoverArt
  );
  frontCoverFace.position.set(0.069, -0.0006, 0);
  frontCoverFace.rotation.x = Math.PI / 2;
  frontCoverFace.rotation.z = Math.PI;
  rightWing.add(frontCoverFace);

  // Trang nội dung truyện bên trong (Ngửa lên trên khi sách lật mở ra)
  const matRightPage = new THREE.MeshStandardMaterial({
    map: createWorkingVolumePageTexture(initialBook),
    roughness: 0.5,
  });
  const pageR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.20), matRightPage);
  pageR.position.set(0.066, 0.006, 0);
  pageR.receiveShadow = true;
  rightWing.add(pageR);

  // Trạng thái ban đầu: Đóng (Cánh phải lật 180 độ qua cánh trái)
  rightWing.rotation.z = Math.PI;
  rightWing.position.y = 0.014;
  storyBookGroup.add(rightWing);

  // Click Raycaster collider
  const notebookClickMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.08, 0.24),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  notebookClickMesh.position.set(-0.069, 0.02, 0);
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

  return { storyBookGroup, rightWing, notebookClickMesh, updateBook };
}
