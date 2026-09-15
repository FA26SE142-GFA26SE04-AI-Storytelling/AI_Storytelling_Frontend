import * as THREE from 'three';

export interface LightSwitchBuildResult {
  switchGroup: THREE.Group;
  switchClickMesh: THREE.Mesh;
  rockerGroup: THREE.Group;
  ledMat: THREE.MeshStandardMaterial;
  setSwitchVisualState: (isOn: boolean) => void;
}

/**
 * Xây dựng mô hình 3D Công Tắc Điện trên tường bên phải phong cách phòng Doraemon / Nhật Bản
 * Vị trí: Tường bên phải (x ~ 2.39), độ cao vừa tầm tay (y ~ 1.35), ở khoảng trống trước bàn học (z ~ 0.85)
 */
export function buildLightSwitch(roomW: number): LightSwitchBuildResult {
  const switchGroup = new THREE.Group();
  // Đặt sát mặt trong tường bên phải
  switchGroup.position.set(roomW / 2 - 0.005, 1.35, 0.85);
  // Xoay mặt công tắc hướng vào lòng phòng (hướng -X)
  switchGroup.rotation.y = -Math.PI / 2;

  // 1. Khung viền gắn tường (Wall Faceplate Base)
  const plateBaseMat = new THREE.MeshStandardMaterial({
    color: 0xf3f4f6,
    roughness: 0.35,
    metalness: 0.05,
  });
  const plateBase = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.20, 0.014), plateBaseMat);
  plateBase.position.set(0, 0, 0.007);
  plateBase.castShadow = true;
  plateBase.receiveShadow = true;
  switchGroup.add(plateBase);

  // Viền vát trang trí (Bevel Accent)
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.3,
    metalness: 0.15,
  });
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.165, 0.016), bezelMat);
  bezel.position.set(0, 0, 0.008);
  switchGroup.add(bezel);

  // Vùng lõm chứa phím bấm
  const innerRecessMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.5,
  });
  const innerRecess = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.135, 0.018), innerRecessMat);
  innerRecess.position.set(0, 0, 0.009);
  switchGroup.add(innerRecess);

  // 2. Phím bấm công tắc kiểu Rocker Switch (có khớp gập khi bật/tắt)
  const rockerGroup = new THREE.Group();
  rockerGroup.position.set(0, 0, 0.016);
  switchGroup.add(rockerGroup);

  const rockerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.05,
  });
  const rockerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.12, 0.014), rockerMat);
  rockerMesh.position.set(0, 0, 0.007);
  rockerMesh.castShadow = true;
  rockerGroup.add(rockerMesh);

  // Gờ vạch nổi chia nửa phím bấm
  const divideLineMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.4,
  });
  const divideLine = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.004, 0.016), divideLineMat);
  divideLine.position.set(0, 0, 0.013);
  rockerGroup.add(divideLine);

  // 3. Đèn LED báo hiệu trạng thái (LED Indicator Dot)
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });
  const ledMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.004, 16), ledMat);
  ledMesh.rotation.x = Math.PI / 2;
  ledMesh.position.set(0, 0.035, 0.015);
  rockerGroup.add(ledMesh);

  // Nhãn ký hiệu tinh tế trên công tắc
  const markMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
  const onMark = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.003, 0.001), markMat);
  onMark.position.set(0, -0.035, 0.015);
  rockerGroup.add(onMark);

  // 4. Mesh vô hình mở rộng vùng bắt tia click chuột (Click Hitbox)
  const clickMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const switchClickMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.10), clickMat);
  switchClickMesh.position.set(0, 0, 0.04);
  switchGroup.add(switchClickMesh);

  // Hàm cập nhật trạng thái trực quan của công tắc
  const setSwitchVisualState = (isOn: boolean) => {
    if (isOn) {
      // Khi Bật: Nửa trên ấn vào, nửa dưới nhô ra, LED sáng màu xanh lục tươi
      rockerGroup.rotation.x = -0.15;
      ledMat.color.setHex(0x22c55e);
      ledMat.emissive.setHex(0x22c55e);
      ledMat.emissiveIntensity = 1.4;
    } else {
      // Khi Tắt: Nửa dưới ấn vào, nửa trên nhô ra, LED chuyển sang màu cam hổ phách ấm áp
      rockerGroup.rotation.x = 0.15;
      ledMat.color.setHex(0xf97316);
      ledMat.emissive.setHex(0xf97316);
      ledMat.emissiveIntensity = 0.6;
    }
  };

  // Khởi tạo trạng thái mặc định: Bật (ON)
  setSwitchVisualState(true);

  return {
    switchGroup,
    switchClickMesh,
    rockerGroup,
    ledMat,
    setSwitchVisualState,
  };
}
