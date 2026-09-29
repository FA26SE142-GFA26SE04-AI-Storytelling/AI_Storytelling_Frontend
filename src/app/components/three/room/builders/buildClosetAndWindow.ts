import * as THREE from 'three';
import { buildLaptop } from './buildLaptop';

export interface ClosetAndWindowBuildResult {
  closetGroup: THREE.Group;
  fDoorLeft: THREE.Group;
  fDoorRight: THREE.Group;
  doorLeftClickMesh: THREE.Mesh;
  doorRightClickMesh: THREE.Mesh;
  winGroup: THREE.Group;
  lowTableGroup: THREE.Group;
  laptopClickMesh: THREE.Mesh;
  laptopLidGroup: THREE.Group;
  cornerPlantGroup: THREE.Group;
  sunGroup: THREE.Group;
  moonGroup: THREE.Group;
  starsGroup: THREE.Group;
  skyMat: THREE.Material;
  sunCoreMat: THREE.Material;
  sunGlowMat: THREE.Material;
  moonMat: THREE.Material;
  moonMaskMat: THREE.Material;
  moonGlowMat: THREE.Material;
  starMat: THREE.Material;
  cloudMat: THREE.Material;
  starParticles: Array<{ mesh: THREE.Mesh; phase: number; baseRadius: number }>;
  cloudDriftObjects: Array<{ group: THREE.Group; baseZ: number; speed: number }>;
  robotMeterMat: THREE.Material;
  robotBtnRedMat: THREE.Material;
  robotBtnYellowMat: THREE.Material;
  robotHeadGroup: THREE.Group;
}

export function buildClosetAndWindow(
  roomW: number,
  roomL: number,
  matWoodAmber: THREE.Material,
  matWoodDark: THREE.Material,
  matClosetWhite: THREE.Material,
  matClosetBlue: THREE.Material,
  matTableMahogany: THREE.Material,
  matGlassWater: THREE.Material,
  matWaterLiquid: THREE.Material,
  matTerracotta: THREE.Material,
  matCeramicWhite: THREE.Material,
  matLeafDark: THREE.Material,
  matLeafLight: THREE.Material,
  matMetalLegs: THREE.Material
): ClosetAndWindowBuildResult {
  // Closet Door Frame A & Panel B
  const closetGroup = new THREE.Group();
  closetGroup.position.set(0.9, 0, -roomL / 2 + 0.15);

  const closetFrameMat = matWoodAmber;
  const closetTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.55), closetFrameMat);
  closetTop.position.set(0, 2.36, 0.275);
  closetGroup.add(closetTop);

  const closetBottom = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.55), closetFrameMat);
  closetBottom.position.set(0, 0.04, 0.275);
  closetGroup.add(closetBottom);

  const closetLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.55), closetFrameMat);
  closetLeft.position.set(-1.06, 1.2, 0.275);
  closetGroup.add(closetLeft);

  const closetRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.55), closetFrameMat);
  closetRight.position.set(1.06, 1.2, 0.275);
  closetGroup.add(closetRight);

  // 1. Hollow Light Wood Back Wall Panel (Allows interior items to be clearly visible)
  const closetBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(2.08, 2.24, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 }) // Warm light cedar/beige interior
  );
  closetBackWall.position.set(0, 1.2, 0.01);
  closetGroup.add(closetBackWall);

  // 2. Interior Middle Shelf
  const cShelf = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.04, 0.48), closetFrameMat);
  cShelf.position.set(0, 1.15, 0.24);
  closetGroup.add(cShelf);

  // --- Detailed 2-Tier Closet Interior Items (Tủ 2 ngăn: Ngăn trên tấm nệm, ngăn dưới hộp đồ đạc) ---
  const closetInteriorGroup = new THREE.Group();

  // ==========================================
  // 1. NGĂN TRÊN: TẤM NỆM ĐƯỢC TRẢI RA & CHÚ ROBOT ĐỒ CHƠI CHIBI ĐÁNG YÊU
  // ==========================================
  const futonTierGroup = new THREE.Group();

  // A. Tấm nệm chính trải phẳng rộng khắp mặt sàn ngăn trên (Laid-out Futon Mattress - Blue Indigo)
  const futonMattress = new THREE.Mesh(
    new THREE.BoxGeometry(1.94, 0.07, 0.46),
    new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.70 })
  );
  futonMattress.position.set(0, 1.185, 0.24);
  futonMattress.castShadow = true;
  futonMattress.receiveShadow = true;
  futonTierGroup.add(futonMattress);

  // Lớp ga nệm mềm mại (Soft Bed Sheet Layer - Light Powder Blue)
  const futonSheet = new THREE.Mesh(
    new THREE.BoxGeometry(1.92, 0.015, 0.44),
    new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.60 })
  );
  futonSheet.position.set(0, 1.225, 0.24);
  futonSheet.castShadow = true;
  futonSheet.receiveShadow = true;
  futonTierGroup.add(futonSheet);

  // B. Tấm chăn bông ấm áp được gấp phẳng gọn gàng ở nửa bên phải (Folded Comforter - Cream White)
  const foldedQuiltRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.08, 0.42),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.75 })
  );
  foldedQuiltRight.position.set(0.50, 1.27, 0.24);
  foldedQuiltRight.castShadow = true;
  foldedQuiltRight.receiveShadow = true;
  futonTierGroup.add(foldedQuiltRight);

  // C. Cuộn chăn phụ / gối ôm đặt trên chăn bên phải (Accent Pillow - Cyan)
  const accentPillowRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.08, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 })
  );
  accentPillowRight.position.set(0.50, 1.345, 0.24);
  accentPillowRight.castShadow = true;
  accentPillowRight.receiveShadow = true;
  futonTierGroup.add(accentPillowRight);

  // ==========================================
  // D. CHÚ ROBOT ĐỒ CHƠI HÌNH VUÔNG RETRO VỚI CÁC KHỚP ĐỒNG BỘ (COHESIVE CUBIC BOX ROBOT)
  // ==========================================
  const robotGroup = new THREE.Group();
  robotGroup.position.set(-0.38, 1.23, 0.24);
  robotGroup.rotation.y = 0.15; // Hướng mặt ngộ nghĩnh về phía trước

  // Bảng màu & Vật liệu tươi sáng cao cấp
  const matBoxMain = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Xanh Cyan/Sky Blue tươi sáng rõ nét
    roughness: 0.28,
    metalness: 0.15,
  });
  const matBoxAccent = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Vàng hổ phách sáng tươi tắn (đồng bộ bàn tay, bàn chân, núm tai và viền)
    roughness: 0.25,
    metalness: 0.25,
  });
  const matJointMetal = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Bạc sáng bóng cho các khớp cơ học
    roughness: 0.18,
    metalness: 0.85,
  });
  const matScreenDark = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Kính màn hình đen bóng
    roughness: 0.15,
    metalness: 0.35,
  });
  const matGlowEye = new THREE.MeshBasicMaterial({
    color: 0xfef08a, // Mắt vàng sáng ấm áp
  });
  const matAntennaGlow = new THREE.MeshBasicMaterial({
    color: 0xf43f5e, // Đèn ăng-ten đỏ hồng tươi
  });

  // Vật liệu đèn ngực nhấp nháy (Dynamic Blinking Chest Light Materials)
  const robotMeterMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const robotBtnRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const robotBtnYellowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

  // ----------------------------------------------------
  // 1. THÂN HÌNH HỘP & BẢNG ĐIỀU KHIỂN (CUBIC TORSO)
  // ----------------------------------------------------
  const torsoGroup = new THREE.Group();

  // Khối thân hộp vuông chính
  const torsoMain = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.18, 0.14),
    matBoxMain
  );
  torsoMain.position.set(0, 0.14, 0);
  torsoMain.castShadow = true;
  torsoMain.receiveShadow = true;
  torsoGroup.add(torsoMain);

  // Đế thắt lưng kim loại ở đáy thân
  const pelvisBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.185, 0.025, 0.145),
    matJointMetal
  );
  pelvisBase.position.set(0, 0.038, 0);
  torsoGroup.add(pelvisBase);

  // Màn hình bảng điều khiển trước ngực
  const chestBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.09, 0.01),
    matScreenDark
  );
  chestBezel.position.set(0, 0.15, 0.071);
  torsoGroup.add(chestBezel);

  // Vạch đo năng lượng xanh ngọc nhấp nháy trên màn hình
  const meterBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.016, 0.005),
    robotMeterMat
  );
  meterBar.position.set(0, 0.17, 0.077);
  torsoGroup.add(meterBar);

  // 2 Nút bấm hình vuông nhỏ nhấp nháy
  const btnRedSquare = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.022, 0.01),
    robotBtnRedMat
  );
  btnRedSquare.position.set(-0.03, 0.13, 0.076);
  torsoGroup.add(btnRedSquare);

  const btnYellowSquare = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.022, 0.01),
    robotBtnYellowMat
  );
  btnYellowSquare.position.set(0.03, 0.13, 0.076);
  torsoGroup.add(btnYellowSquare);

  robotGroup.add(torsoGroup);

  // ----------------------------------------------------
  // 2. KHỚP CỔ & ĐẦU HÌNH HỘP (CUBIC HEAD & NECK JOINT)
  // ----------------------------------------------------
  // Khớp cổ kim loại nối liền thân và đầu
  const neckJoint = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.035, 16),
    matJointMetal
  );
  neckJoint.position.set(0, 0.245, 0);
  robotGroup.add(neckJoint);

  const neckCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.01, 16),
    matBoxAccent
  );
  neckCollar.position.set(0, 0.235, 0);
  robotGroup.add(neckCollar);

  // Khối đầu hình hộp
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.335, 0);

  const headBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.14, 0.14),
    matBoxMain
  );
  headBox.castShadow = true;
  headBox.receiveShadow = true;
  headGroup.add(headBox);

  // Màn hình mặt trước
  const faceVisor = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.09, 0.01),
    matScreenDark
  );
  faceVisor.position.set(0, 0, 0.071);
  headGroup.add(faceVisor);

  // Đôi mắt tròn phát sáng gắn trên màn hình
  const eyeL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.020, 0.020, 0.005, 20),
    matGlowEye
  );
  eyeL.rotation.x = Math.PI / 2;
  eyeL.position.set(-0.038, 0.012, 0.077);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.020, 0.020, 0.005, 20),
    matGlowEye
  );
  eyeR.rotation.x = Math.PI / 2;
  eyeR.position.set(0.038, 0.012, 0.077);
  headGroup.add(eyeR);

  // Miệng robot dạng rãnh tản nhiệt
  const mouthGrill = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.012, 0.005),
    matJointMetal
  );
  mouthGrill.position.set(0, -0.026, 0.077);
  headGroup.add(mouthGrill);

  // Tai ốc xoay cơ học 2 bên đầu gắn liền lạc
  const earPinL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.015, 16),
    matJointMetal
  );
  earPinL.rotation.z = Math.PI / 2;
  earPinL.position.set(-0.09, 0, 0);
  headGroup.add(earPinL);

  const earDialL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.015, 16),
    matBoxAccent
  );
  earDialL.rotation.z = Math.PI / 2;
  earDialL.position.set(-0.098, 0, 0);
  headGroup.add(earDialL);

  const earPinR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.015, 16),
    matJointMetal
  );
  earPinR.rotation.z = Math.PI / 2;
  earPinR.position.set(0.09, 0, 0);
  headGroup.add(earPinR);

  const earDialR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.015, 16),
    matBoxAccent
  );
  earDialR.rotation.z = Math.PI / 2;
  earDialR.position.set(0.098, 0, 0);
  headGroup.add(earDialR);

  // Ăng-ten trên đỉnh đầu có đế gắn chắc chắn
  const antBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.01, 16),
    matJointMetal
  );
  antBase.position.set(0, 0.075, 0);
  headGroup.add(antBase);

  const antStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.055, 8),
    matJointMetal
  );
  antStem.position.set(0, 0.105, 0);
  headGroup.add(antStem);

  const antBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 16, 16),
    matAntennaGlow
  );
  antBall.position.set(0, 0.138, 0);
  headGroup.add(antBall);

  robotGroup.add(headGroup);

  // ----------------------------------------------------
  // 3. KHỚP VAI, CÁNH TAY & BÀN TAY KẸP (SHOULDER & ARM JOINTS)
  // ----------------------------------------------------
  // --- TAY TRÁI (Thả chống nhẹ bên cạnh hông) ---
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.09, 0.19, 0);

  // Khớp vai kim loại
  const shoulderJointL = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 16, 16),
    matJointMetal
  );
  leftArmGroup.add(shoulderJointL);

  // Cánh tay hình hộp
  const armMeshL = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.11, 0.044),
    matBoxMain
  );
  armMeshL.position.set(-0.025, -0.065, 0.01);
  armMeshL.rotation.z = 0.14;
  armMeshL.castShadow = true;
  leftArmGroup.add(armMeshL);

  // Khớp cổ tay kim loại gắn liền cánh tay
  const wristJointL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.018, 14),
    matJointMetal
  );
  wristJointL.position.set(-0.038, -0.125, 0.01);
  wristJointL.rotation.z = 0.14;
  leftArmGroup.add(wristJointL);

  // Bàn tay kẹp chữ C gắn liền vào cổ tay
  const handBaseL = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.032, 0.032),
    matBoxAccent
  );
  handBaseL.position.set(-0.044, -0.145, 0.015);
  leftArmGroup.add(handBaseL);

  robotGroup.add(leftArmGroup);

  // --- TAY PHẢI (Hạ xuống xuôi theo bên hông đồng bộ) ---
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.09, 0.19, 0);

  // Khớp vai kim loại phải
  const shoulderJointR = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 16, 16),
    matJointMetal
  );
  rightArmGroup.add(shoulderJointR);

  // Cánh tay hình hộp hạ xuống tự nhiên
  const armMeshR = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.11, 0.044),
    matBoxMain
  );
  armMeshR.position.set(0.025, -0.065, 0.01);
  armMeshR.rotation.z = -0.14;
  armMeshR.castShadow = true;
  rightArmGroup.add(armMeshR);

  // Khớp cổ tay kim loại
  const wristJointR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.018, 14),
    matJointMetal
  );
  wristJointR.position.set(0.038, -0.125, 0.01);
  wristJointR.rotation.z = -0.14;
  rightArmGroup.add(wristJointR);

  // Bàn tay kẹp chữ C gắn chắc chắn
  const handBaseR = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.032, 0.032),
    matBoxAccent
  );
  handBaseR.position.set(0.044, -0.145, 0.015);
  rightArmGroup.add(handBaseR);

  robotGroup.add(rightArmGroup);

  // ----------------------------------------------------
  // 4. KHỚP HÔNG, CHÂN & BÀN CHÂN HÌNH HỘP (HIPS, LEGS & FEET)
  // ----------------------------------------------------
  // Trục hông kim loại kết nối ngang
  const hipAxle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.14, 16),
    matJointMetal
  );
  hipAxle.rotation.z = Math.PI / 2;
  hipAxle.position.set(0, 0.025, 0.03);
  robotGroup.add(hipAxle);

  // --- CHÂN TRÁI ---
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.052, 0.025, 0.03);

  // Khớp hông xoay
  const hipJointL = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 14, 14),
    matJointMetal
  );
  leftLegGroup.add(hipJointL);

  // Chân hình hộp duỗi thẳng ra phía trước
  const legMeshL = new THREE.Mesh(
    new THREE.BoxGeometry(0.050, 0.050, 0.12),
    matBoxMain
  );
  legMeshL.position.set(0, 0.003, 0.065);
  legMeshL.castShadow = true;
  leftLegGroup.add(legMeshL);

  // Khớp cổ chân kim loại
  const ankleJointL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.016, 14),
    matJointMetal
  );
  ankleJointL.rotation.x = Math.PI / 2;
  ankleJointL.position.set(0, 0.003, 0.13);
  leftLegGroup.add(ankleJointL);

  // Bàn chân hình hộp vuông vức ăn khớp
  const footMeshL = new THREE.Mesh(
    new THREE.BoxGeometry(0.054, 0.052, 0.045),
    matBoxAccent
  );
  footMeshL.position.set(0, 0.005, 0.158);
  footMeshL.castShadow = true;
  leftLegGroup.add(footMeshL);

  // Đế giày kim loại mỏng dưới đáy
  const soleMeshL = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.006, 0.047),
    matJointMetal
  );
  soleMeshL.position.set(0, -0.021, 0.158);
  leftLegGroup.add(soleMeshL);

  robotGroup.add(leftLegGroup);

  // --- CHÂN PHẢI ---
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.052, 0.025, 0.03);

  // Khớp hông xoay phải
  const hipJointR = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 14, 14),
    matJointMetal
  );
  rightLegGroup.add(hipJointR);

  // Chân hình hộp duỗi thẳng ra trước
  const legMeshR = new THREE.Mesh(
    new THREE.BoxGeometry(0.050, 0.050, 0.12),
    matBoxMain
  );
  legMeshR.position.set(0, 0.003, 0.065);
  legMeshR.castShadow = true;
  rightLegGroup.add(legMeshR);

  // Khớp cổ chân kim loại
  const ankleJointR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.016, 14),
    matJointMetal
  );
  ankleJointR.rotation.x = Math.PI / 2;
  ankleJointR.position.set(0, 0.003, 0.13);
  rightLegGroup.add(ankleJointR);

  // Bàn chân hình hộp vuông vức
  const footMeshR = new THREE.Mesh(
    new THREE.BoxGeometry(0.054, 0.052, 0.045),
    matBoxAccent
  );
  footMeshR.position.set(0, 0.005, 0.158);
  footMeshR.castShadow = true;
  rightLegGroup.add(footMeshR);

  // Đế giày kim loại
  const soleMeshR = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.006, 0.047),
    matJointMetal
  );
  soleMeshR.position.set(0, -0.021, 0.158);
  rightLegGroup.add(soleMeshR);

  robotGroup.add(rightLegGroup);

  futonTierGroup.add(robotGroup);

  closetInteriorGroup.add(futonTierGroup);

  // ==========================================
  // 2. NGĂN DƯỚI: CÁC HỘP ĐỒ ĐẠC (STORAGE BOXES & CONTAINERS)
  // ==========================================
  const boxesTierGroup = new THREE.Group();

  // A. Hộp lưu trữ đồ đạc lớn bên trái có nắp & quai xách (Teal Fabric Storage Box)
  const boxLeftLarge = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.42, 0.40),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.45 })
  );
  boxLeftLarge.position.set(-0.62, 0.27, 0.24);
  boxLeftLarge.castShadow = true;
  boxLeftLarge.receiveShadow = true;
  boxesTierGroup.add(boxLeftLarge);

  // Nắp hộp lớn bên trái
  const boxLeftLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.60, 0.04, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.4 })
  );
  boxLeftLid.position.set(-0.62, 0.50, 0.24);
  boxesTierGroup.add(boxLeftLid);

  // Tay cầm quai da hộp trái
  const boxLeftHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.03, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4 })
  );
  boxLeftHandle.position.set(-0.62, 0.30, 0.45);
  boxesTierGroup.add(boxLeftHandle);

  // Hộp đồ phụ dẹt đặt trên hộp lớn bên trái (Beige Organizer Box)
  const boxLeftTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.20, 0.36),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 })
  );
  boxLeftTop.position.set(-0.62, 0.62, 0.24);
  boxLeftTop.castShadow = true;
  boxLeftTop.receiveShadow = true;
  boxesTierGroup.add(boxLeftTop);

  // B. Hộp đồ đạc gỗ vintage ở giữa có nhãn (Wooden Storage Box with Label)
  const boxCenterWood = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.46, 0.40),
    matWoodAmber
  );
  boxCenterWood.position.set(0.02, 0.29, 0.24);
  boxCenterWood.castShadow = true;
  boxCenterWood.receiveShadow = true;
  boxesTierGroup.add(boxCenterWood);

  // Nhãn ghi chú màu trắng trên hộp giữa
  const centerBoxLabel = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.09, 0.01),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  centerBoxLabel.position.set(0.02, 0.32, 0.445);
  boxesTierGroup.add(centerBoxLabel);

  // Hộp nhỏ màu xanh đặt trên hộp gỗ giữa (Navy Accent Box)
  const boxCenterTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.18, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 })
  );
  boxCenterTop.position.set(0.02, 0.61, 0.24);
  boxCenterTop.castShadow = true;
  boxCenterTop.receiveShadow = true;
  boxesTierGroup.add(boxCenterTop);

  // C. Chồng 2 hộp đồ đạc gọn gàng bên phải (Stacked Right Boxes - Terracotta & Gold)
  // Hộp dưới bên phải
  const boxRightBottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.36, 0.38),
    new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.45 })
  );
  boxRightBottom.position.set(0.64, 0.24, 0.24);
  boxRightBottom.castShadow = true;
  boxRightBottom.receiveShadow = true;
  boxesTierGroup.add(boxRightBottom);

  const boxRightBottomLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.50, 0.035, 0.40),
    new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.4 })
  );
  boxRightBottomLid.position.set(0.64, 0.435, 0.24);
  boxesTierGroup.add(boxRightBottomLid);

  // Hộp trên bên phải
  const boxRightTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.26, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45 })
  );
  boxRightTop.position.set(0.64, 0.58, 0.24);
  boxRightTop.castShadow = true;
  boxRightTop.receiveShadow = true;
  boxesTierGroup.add(boxRightTop);

  const boxRightTopLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.03, 0.36),
    new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.4 })
  );
  boxRightTopLid.position.set(0.64, 0.725, 0.24);
  boxesTierGroup.add(boxRightTopLid);

  closetInteriorGroup.add(boxesTierGroup);

  closetGroup.add(closetInteriorGroup);

  const createFusumaDoor = (handleXOffset: number) => {
    const doorGroup = new THREE.Group();

    // White Inner Fusuma Paper Panel (Fits inside side borders x = -0.50 to +0.50)
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.00, 2.18, 0.024), matClosetWhite);
    doorGroup.add(panel);

    // Decorative Blue Horizontal Stripe (Fits inside side borders x = -0.50 to +0.50)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.00, 0.42, 0.026), matClosetBlue);
    stripe.position.set(0, 0, 0.001);
    doorGroup.add(stripe);

    const borderMat = matWoodDark;
    const bTop = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.03, 0.03), borderMat);
    bTop.position.set(0, 1.105, 0);
    doorGroup.add(bTop);

    const bBottom = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.03, 0.03), borderMat);
    bBottom.position.set(0, -1.105, 0);
    doorGroup.add(bBottom);

    const bL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.24, 0.03), borderMat);
    bL.position.set(-0.515, 0, 0);
    doorGroup.add(bL);

    const bR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.24, 0.03), borderMat);
    bR.position.set(0.515, 0, 0);
    doorGroup.add(bR);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.01, 20),
      new THREE.MeshBasicMaterial({ color: 0x1e1e1e })
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(handleXOffset, 0, 0.018);
    doorGroup.add(handle);

    const doorClickMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.06, 2.24, 0.12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    doorClickMesh.position.set(0, 0, 0.02);
    doorGroup.add(doorClickMesh);

    return { doorGroup, doorClickMesh };
  };

  const { doorGroup: fDoorLeft, doorClickMesh: doorLeftClickMesh } = createFusumaDoor(0.38);
  fDoorLeft.position.set(-0.51, 1.2, 0.50);
  closetGroup.add(fDoorLeft);

  const { doorGroup: fDoorRight, doorClickMesh: doorRightClickMesh } = createFusumaDoor(-0.38);
  fDoorRight.position.set(0.51, 1.2, 0.53);
  closetGroup.add(fDoorRight);

  // Sliding Window & Scenery
  const winGroup = new THREE.Group();
  winGroup.position.set(-roomW / 2 + 0.04, 1.6, 0);

  const sillDepth = 0.14;
  const sillThickness = 0.06;
  const winH = 1.6;
  const winW = 2.4;

  const sillTop = new THREE.Mesh(new THREE.BoxGeometry(sillDepth, sillThickness, winW), matWoodAmber);
  sillTop.position.y = winH / 2 - sillThickness / 2;
  winGroup.add(sillTop);

  const sillBottom = new THREE.Mesh(new THREE.BoxGeometry(sillDepth, sillThickness, winW), matWoodAmber);
  sillBottom.position.y = -winH / 2 + sillThickness / 2;
  winGroup.add(sillBottom);

  const sillLeft = new THREE.Mesh(new THREE.BoxGeometry(sillDepth, winH, sillThickness), matWoodAmber);
  sillLeft.position.z = -winW / 2 + sillThickness / 2;
  winGroup.add(sillLeft);

  const sillRight = new THREE.Mesh(new THREE.BoxGeometry(sillDepth, winH, sillThickness), matWoodAmber);
  sillRight.position.z = winW / 2 - sillThickness / 2;
  winGroup.add(sillRight);

  // Outdoor Sky Backdrop
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x7ec8f2 });
  const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), skyMat);
  skyPlane.position.set(-4.0, 0, 0);
  skyPlane.rotation.y = Math.PI / 2;
  winGroup.add(skyPlane);

  // Celestial Objects
  const sunGroup = new THREE.Group();
  sunGroup.position.set(-3.7, 2.4, -1.6);

  const sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff066, transparent: true, opacity: 1 });
  const sunCore = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), sunCoreMat);
  sunGroup.add(sunCore);

  const sunGlowMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.35 });
  const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), sunGlowMat);
  sunGroup.add(sunGlow);
  winGroup.add(sunGroup);

  const moonGroup = new THREE.Group();
  moonGroup.position.set(-3.7, 2.5, -0.6);

  const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const moonCore = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), moonMat);
  moonGroup.add(moonCore);

  const moonMaskMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0 });
  const moonMask = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 24), moonMaskMat);
  moonMask.position.set(-0.09, 0.04, 0.09);
  moonGroup.add(moonMask);

  const moonGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
  const moonGlow = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), moonGlowMat);
  moonGlow.position.set(0, 0, 0);
  moonGroup.add(moonGlow);
  winGroup.add(moonGroup);

  const starsGroup = new THREE.Group();
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const starParticles: Array<{ mesh: THREE.Mesh; phase: number; baseRadius: number }> = [];

  // 300 Twinkling Night Stars filling the entire sky hemisphere
  for (let i = 0; i < 300; i++) {
    const sRadius = 0.012 + Math.random() * 0.028;
    const starMesh = new THREE.Mesh(new THREE.SphereGeometry(sRadius, 8, 8), starMat);
    const sx = -3.65 + (Math.random() - 0.5) * 0.5;
    const sy = 0.2 + Math.random() * 5.0;
    const sz = -10.0 + Math.random() * 20.0;
    starMesh.position.set(sx, sy, sz);
    starsGroup.add(starMesh);
    starParticles.push({
      mesh: starMesh,
      phase: Math.random() * Math.PI * 2,
      baseRadius: sRadius,
    });
  }
  winGroup.add(starsGroup);

  // Clouds
  const cloudGroup = new THREE.Group();
  cloudGroup.position.set(-3.2, 0, 0);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  const cloudClusters = [
    { x: 0.1, y: 3.8, z: -5.5, s: 0.95 },
    { x: -0.1, y: 3.5, z: -3.2, s: 0.85 },
    { x: 0.2, y: 3.9, z: -0.8, s: 1.05 },
    { x: -0.05, y: 3.6, z: 1.8, s: 0.90 },
    { x: 0.15, y: 3.7, z: 4.2, s: 0.85 },
    { x: -0.1, y: 4.1, z: 6.0, s: 0.95 },
    { x: 0.05, y: 2.6, z: -6.2, s: 0.80 },
    { x: -0.15, y: 2.3, z: -4.4, s: 0.90 },
    { x: 0.25, y: 2.7, z: -2.6, s: 1.05 },
    { x: 0, y: 2.4, z: -0.5, s: 0.98 },
    { x: -0.2, y: 2.8, z: 1.2, s: 0.88 },
    { x: 0.1, y: 2.3, z: 3.1, s: 0.92 },
    { x: -0.05, y: 2.5, z: 5.2, s: 0.85 },
    { x: 0.2, y: 1.8, z: -5.0, s: 0.85 },
    { x: -0.1, y: 1.5, z: -3.0, s: 0.78 },
    { x: 0.15, y: 1.9, z: -1.2, s: 0.92 },
    { x: -0.2, y: 1.4, z: 0.6, s: 0.85 },
    { x: 0.05, y: 1.7, z: 2.4, s: 0.90 },
    { x: -0.15, y: 1.5, z: 4.5, s: 0.82 },
    { x: 0.1, y: 0.9, z: -4.0, s: 0.70 },
    { x: -0.05, y: 1.1, z: -1.8, s: 0.75 },
    { x: 0.2, y: 0.8, z: 1.5, s: 0.72 },
    { x: -0.1, y: 1.0, z: 3.8, s: 0.68 },
  ];

  const cloudDriftObjects: Array<{ group: THREE.Group; baseZ: number; speed: number }> = [];
  cloudClusters.forEach((cData, idx) => {
    const cGrp = new THREE.Group();
    cGrp.position.set(cData.x, cData.y, cData.z);
    cGrp.scale.setScalar(cData.s);
    cGrp.add(new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), cloudMat));
    [
      { x: 0.30, y: 0.08, z: 0.05, r: 0.28 },
      { x: -0.32, y: -0.05, z: -0.05, r: 0.26 },
      { x: 0.15, y: 0.18, z: -0.10, r: 0.24 },
      { x: -0.15, y: 0.16, z: 0.08, r: 0.25 },
      { x: 0.45, y: -0.08, z: 0, r: 0.20 },
      { x: -0.48, y: -0.09, z: 0, r: 0.19 },
    ].forEach((b) => {
      const bMesh = new THREE.Mesh(new THREE.SphereGeometry(b.r, 14, 14), cloudMat);
      bMesh.position.set(b.x, b.y, b.z);
      cGrp.add(bMesh);
    });
    cloudGroup.add(cGrp);
    cloudDriftObjects.push({
      group: cGrp,
      baseZ: cData.z,
      speed: 0.0004 + (idx % 3) * 0.0002,
    });
  });
  winGroup.add(cloudGroup);

  // Trees & Utility Pole
  const treeGroup = new THREE.Group();
  treeGroup.position.set(-2.0, -3, 1.0);
  treeGroup.scale.setScalar(1.3);
  const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x54361e, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.0), trunkMat);
  trunk.position.y = -0.7;
  treeGroup.add(trunk);
  [
    { x: 0, y: 1.3, z: 0, s: 0.6, m: leafMat1 },
    { x: 0.2, y: 1.45, z: 0.2, s: 0.48, m: leafMat2 },
    { x: -0.2, y: 1.25, z: -0.12, s: 0.5, m: leafMat1 },
    { x: 0.12, y: 1.6, z: -0.12, s: 0.42, m: leafMat2 },
  ].forEach((f) => {
    const fMesh = new THREE.Mesh(new THREE.SphereGeometry(f.s, 16, 16), f.m);
    fMesh.position.set(f.x, f.y, f.z);
    treeGroup.add(fMesh);
  });
  winGroup.add(treeGroup);

  const poleGroup = new THREE.Group();
  poleGroup.position.set(-1.8, -3, -1.2);
  poleGroup.scale.setScalar(1.2);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
  const poleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.5), poleMat);
  poleBody.position.y = 1.0;
  poleGroup.add(poleBody);
  const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), poleMat);
  crossArm.position.set(0, 1.4, 0);
  poleGroup.add(crossArm);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 2.2), wireMat);
  wire1.position.set(0, 1.4, 0.2);
  wire1.rotation.x = Math.PI / 2;
  poleGroup.add(wire1);
  const wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 2.2), wireMat);
  wire2.position.set(0, 1.4, -0.2);
  wire2.rotation.x = Math.PI / 2;
  poleGroup.add(wire2);
  winGroup.add(poleGroup);

  // Low Table
  const lowTableGroup = new THREE.Group();
  lowTableGroup.position.set(-1.8, 0, 0.4);

  const lowTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.65), matTableMahogany);
  lowTop.position.y = 0.36;
  lowTop.castShadow = true;
  lowTableGroup.add(lowTop);

  [
    { x: -0.43, z: -0.26 },
    { x: 0.43, z: -0.26 },
    { x: -0.43, z: 0.26 },
    { x: 0.43, z: 0.26 },
  ].forEach((lp) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.34), matMetalLegs);
    leg.position.set(lp.x, 0.17, lp.z);
    lowTableGroup.add(leg);
  });

  const glassCupGroup = new THREE.Group();
  glassCupGroup.position.set(-0.25, 0.385, -0.12);
  const glassBody = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.11, 20), matGlassWater);
  glassBody.position.y = 0.055;
  glassCupGroup.add(glassBody);
  const waterLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.034, 0.08, 20), matWaterLiquid);
  waterLiquid.position.y = 0.045;
  glassCupGroup.add(waterLiquid);
  const ice1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.015), matGlassWater);
  ice1.position.set(0.01, 0.075, 0.008);
  ice1.rotation.set(0.2, 0.4, 0.1);
  glassCupGroup.add(ice1);
  const ice2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.014), matGlassWater);
  ice2.position.set(-0.012, 0.070, -0.006);
  ice2.rotation.set(0.5, 0.1, 0.3);
  glassCupGroup.add(ice2);
  const strawMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.15, 12), strawMat);
  straw.position.set(0.012, 0.075, 0);
  straw.rotation.z = -Math.PI / 8;
  glassCupGroup.add(straw);
  lowTableGroup.add(glassCupGroup);

  // Modern 3D Laptop on Low Table (Thay thế bình trà cũ theo yêu cầu người dùng)
  const { laptopGroup, laptopClickMesh, laptopLidGroup } = buildLaptop();
  laptopGroup.position.set(0.10, 0.385, 0.0);
  laptopGroup.rotation.y = 0; // Đặt vuông góc trục Z để góc camera nhìn thẳng chính diện vào màn hình
  lowTableGroup.add(laptopGroup);

  const tablePlantGroup = new THREE.Group();
  tablePlantGroup.position.set(-0.25, 0.385, 0.15);
  const tablePotMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, side: THREE.DoubleSide });
  const tablePot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 24, 1, true), tablePotMat);
  tablePot.position.y = 0.035;
  tablePot.castShadow = true;
  tablePlantGroup.add(tablePot);

  const tablePotRim = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.005, 12, 24), matCeramicWhite);
  tablePotRim.position.y = 0.07;
  tablePotRim.rotation.x = Math.PI / 2;
  tablePlantGroup.add(tablePotRim);

  const tableSoil = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.042, 0.015, 24), matWoodDark);
  tableSoil.position.y = 0.06;
  tablePlantGroup.add(tableSoil);

  // Succulent rosette arrangement
  for (let r = 0; r < 12; r++) {
    const angle = (r * Math.PI * 2) / 7 + (r > 6 ? 0.3 : 0);
    const radius = r < 7 ? 0.032 : 0.018;
    const leafHeight = r < 7 ? 0.075 : 0.09;
    const sLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 12), r % 2 === 0 ? matLeafDark : matLeafLight);
    sLeaf.position.set(Math.sin(angle) * radius, leafHeight, Math.cos(angle) * radius);
    sLeaf.rotation.x = Math.cos(angle) * 0.45;
    sLeaf.rotation.z = Math.sin(angle) * -0.45;
    sLeaf.castShadow = true;
    tablePlantGroup.add(sLeaf);
  }
  lowTableGroup.add(tablePlantGroup);

  // Large Potted Houseplant (Monstera / Tropical Foliage with Wooden Stand)
  const cornerPlantGroup = new THREE.Group();
  cornerPlantGroup.position.set(-0.52, 0, -roomL / 2 + 0.35);

  // 1. Elegant Wooden Tripod Stand
  const standRadius = 0.145;
  const standHeight = 0.22;
  const standLegsGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, standHeight, 16), matWoodAmber);
    leg.position.set(Math.sin(angle) * standRadius * 0.9, standHeight / 2, Math.cos(angle) * standRadius * 0.9);
    leg.rotation.z = Math.sin(angle) * -0.12;
    leg.rotation.x = Math.cos(angle) * 0.12;
    leg.castShadow = true;
    standLegsGroup.add(leg);
  }
  const crossRing = new THREE.Mesh(new THREE.TorusGeometry(standRadius * 0.82, 0.008, 12, 24), matWoodAmber);
  crossRing.position.y = 0.15;
  crossRing.rotation.x = Math.PI / 2;
  standLegsGroup.add(crossRing);
  cornerPlantGroup.add(standLegsGroup);

  // 2. Hollow Ceramic Planter Pot & Rim (openEnded to eliminate z-fighting)
  const potDoubleSideMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, side: THREE.DoubleSide });
  const planterPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.125, 0.34, 32, 1, true),
    potDoubleSideMat
  );
  planterPot.position.y = 0.25;
  planterPot.castShadow = true;
  cornerPlantGroup.add(planterPot);

  const potBottom = new THREE.Mesh(
    new THREE.CircleGeometry(0.125, 32),
    matCeramicWhite
  );
  potBottom.position.y = 0.08;
  potBottom.rotation.x = Math.PI / 2;
  cornerPlantGroup.add(potBottom);

  const potRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.168, 0.012, 16, 32),
    matCeramicWhite
  );
  potRim.position.y = 0.418;
  potRim.rotation.x = Math.PI / 2;
  cornerPlantGroup.add(potRim);

  const potSoil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.164, 0.155, 0.04, 32),
    matWoodDark
  );
  potSoil.position.y = 0.385;
  cornerPlantGroup.add(potSoil);

  // 3. Helper to create realistic curved 3D leaf geometry
  const createRealisticLeafGeo = (width: number, length: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(width * 0.65, length * 0.2, width * 0.75, length * 0.65, 0, length);
    shape.bezierCurveTo(-width * 0.75, length * 0.65, -width * 0.65, length * 0.2, 0, 0);

    const extrudeSettings = {
      depth: 0.003,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 3,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const ratio = Math.max(0, Math.min(1, y / length));
      const droop = -Math.pow(ratio, 1.8) * (length * 0.22);
      const fold = -Math.abs(x) * 0.28;
      pos.setZ(i, pos.getZ(i) + droop + fold);
    }
    geo.computeVertexNormals();
    return geo;
  };

  // 4. Lush Foliage Arrangement with Arched Tube Stems
  const leavesData = [
    { endX: 0.03, endY: 0.88, endZ: 0.02, width: 0.18, length: 0.32, rotX: -0.4, rotY: 0.2, rotZ: 0.1, m: matLeafLight },
    { endX: 0.22, endY: 0.78, endZ: -0.08, width: 0.22, length: 0.36, rotX: -0.6, rotY: 1.1, rotZ: -0.3, m: matLeafDark },
    { endX: -0.24, endY: 0.80, endZ: 0.10, width: 0.23, length: 0.38, rotX: -0.5, rotY: -1.2, rotZ: 0.3, m: matLeafLight },
    { endX: 0.10, endY: 0.72, endZ: 0.24, width: 0.21, length: 0.35, rotX: -0.7, rotY: 0.4, rotZ: -0.2, m: matLeafLight },
    { endX: -0.16, endY: 0.70, endZ: -0.20, width: 0.22, length: 0.36, rotX: -0.6, rotY: -2.3, rotZ: 0.2, m: matLeafDark },
    { endX: 0.28, endY: 0.58, endZ: 0.12, width: 0.25, length: 0.40, rotX: -0.9, rotY: 1.5, rotZ: -0.4, m: matLeafDark },
    { endX: -0.26, endY: 0.56, endZ: -0.10, width: 0.24, length: 0.39, rotX: -0.85, rotY: -1.6, rotZ: 0.4, m: matLeafDark },
    { endX: -0.02, endY: 0.54, endZ: 0.28, width: 0.23, length: 0.37, rotX: -1.0, rotY: 0.1, rotZ: 0.0, m: matLeafLight },
  ];

  const soilCenter = new THREE.Vector3(0, 0.41, 0);

  leavesData.forEach((leaf) => {
    const leafEnd = new THREE.Vector3(leaf.endX, leaf.endY, leaf.endZ);
    const midPoint = new THREE.Vector3()
      .addVectors(soilCenter, leafEnd)
      .multiplyScalar(0.5);
    midPoint.x += (leaf.endX - soilCenter.x) * 0.35;
    midPoint.z += (leaf.endZ - soilCenter.z) * 0.35;
    midPoint.y += 0.06;

    const stemCurve = new THREE.CatmullRomCurve3([soilCenter, midPoint, leafEnd]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 16, 0.007, 8, false);
    const pStem = new THREE.Mesh(stemGeo, matLeafDark);
    pStem.castShadow = true;
    cornerPlantGroup.add(pStem);

    const leafGeo = createRealisticLeafGeo(leaf.width, leaf.length);
    const leafMesh = new THREE.Mesh(leafGeo, leaf.m);
    leafMesh.position.copy(leafEnd);
    leafMesh.rotation.set(leaf.rotX, leaf.rotY, leaf.rotZ);
    leafMesh.castShadow = true;
    cornerPlantGroup.add(leafMesh);

    const veinCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, leaf.length * 0.5, -leaf.length * 0.08),
      new THREE.Vector3(0, leaf.length * 0.95, -leaf.length * 0.20),
    ]);
    const veinGeo = new THREE.TubeGeometry(veinCurve, 10, 0.003, 6, false);
    const veinMesh = new THREE.Mesh(veinGeo, leaf.m === matLeafLight ? matLeafDark : matLeafLight);
    veinMesh.position.copy(leafEnd);
    veinMesh.rotation.set(leaf.rotX, leaf.rotY, leaf.rotZ);
    cornerPlantGroup.add(veinMesh);
  });

  return {
    closetGroup,
    fDoorLeft,
    fDoorRight,
    doorLeftClickMesh,
    doorRightClickMesh,
    winGroup,
    lowTableGroup,
    laptopClickMesh,
    laptopLidGroup,
    cornerPlantGroup,
    sunGroup,
    moonGroup,
    starsGroup,
    skyMat,
    sunCoreMat,
    sunGlowMat,
    moonMat,
    moonMaskMat,
    moonGlowMat,
    starMat,
    cloudMat,
    starParticles,
    cloudDriftObjects,
    robotMeterMat,
    robotBtnRedMat,
    robotBtnYellowMat,
    robotHeadGroup: headGroup,
  };
}
