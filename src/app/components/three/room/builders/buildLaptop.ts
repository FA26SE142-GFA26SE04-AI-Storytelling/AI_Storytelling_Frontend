import * as THREE from 'three';

export interface LaptopBuildResult {
  laptopGroup: THREE.Group;
  screenMat: THREE.MeshStandardMaterial;
  laptopClickMesh: THREE.Mesh;
  laptopLidGroup: THREE.Group;
}

/**
 * Tạo texture giao diện màn hình hệ điều hành MagicOS Studio sắc nét, rực rỡ, chuẩn hướng nhìn
 */
function createLaptopScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  // 1. Nền không gian vũ trụ / cực quang hoàng hôn (Cyberpunk Nebula Gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, 768, 480);
  bgGrad.addColorStop(0, '#0a0f1d');
  bgGrad.addColorStop(0.3, '#1e1b4b');
  bgGrad.addColorStop(0.65, '#2e1065');
  bgGrad.addColorStop(1, '#0369a1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 768, 480);

  // Vầng sáng cực quang lung linh
  ctx.save();
  ctx.globalAlpha = 0.45;
  const radial1 = ctx.createRadialGradient(580, 120, 15, 580, 120, 240);
  radial1.addColorStop(0, '#38bdf8');
  radial1.addColorStop(0.5, '#a855f7');
  radial1.addColorStop(1, 'transparent');
  ctx.fillStyle = radial1;
  ctx.beginPath();
  ctx.arc(580, 120, 240, 0, Math.PI * 2);
  ctx.fill();

  const radial2 = ctx.createRadialGradient(180, 320, 15, 180, 320, 220);
  radial2.addColorStop(0, '#ec4899');
  radial2.addColorStop(0.6, '#6366f1');
  radial2.addColorStop(1, 'transparent');
  ctx.fillStyle = radial2;
  ctx.beginPath();
  ctx.arc(180, 320, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Thanh Menu Bar trên cùng phong cách macOS (Y = 0 đến 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, 0, 768, 24);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('✦ MagicOS 3D', 14, 17);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '11px sans-serif';
  ctx.fillText('File', 115, 17);
  ctx.fillText('Story Studio', 155, 17);
  ctx.fillText('Characters', 240, 17);
  ctx.fillText('Voice AI', 320, 17);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('14:55', 665, 17);
  ctx.fillText('🔋 100%', 710, 17);

  // 3. Cửa sổ ứng dụng trung tâm: "MagicTales Storyteller Studio"
  const winX = 48;
  const winY = 40;
  const winW = 672;
  const winH = 370;

  // Đổ bóng cửa sổ
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.roundRect(winX + 6, winY + 6, winW, winH, 14);
  ctx.fill();

  // Thân cửa sổ kính mờ (Frosted glass dark card)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
  ctx.beginPath();
  ctx.roundRect(winX, winY, winW, winH, 14);
  ctx.fill();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Titlebar cửa sổ
  ctx.fillStyle = 'rgba(10, 15, 29, 0.98)';
  ctx.beginPath();
  ctx.roundRect(winX, winY, winW, 36, [14, 14, 0, 0]);
  ctx.fill();

  // Nút điều khiển cửa sổ (Đỏ, Vàng, Xanh)
  const dots = [
    { x: winX + 22, c: '#ef4444' },
    { x: winX + 40, c: '#f59e0b' },
    { x: winX + 58, c: '#10b981' },
  ];
  dots.forEach((d) => {
    ctx.fillStyle = d.c;
    ctx.beginPath();
    ctx.arc(d.x, winY + 18, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Tiêu đề ứng dụng
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('📊 MagicTales AI - Bảng Điều Khiển Của Phụ Huynh (Parent Dashboard)', winX + 115, winY + 23);

  // Cột Menu Sidebar
  ctx.fillStyle = 'rgba(24, 33, 52, 0.65)';
  ctx.fillRect(winX, winY + 36, 150, winH - 36);

  const sidebarItems = [
    '📊 Tổng Quan Cha Mẹ',
    '⏱ Giới Hạn Màn Hình',
    '🛡️ An Toàn & Mã PIN',
    '📖 Nhật Ký Đọc Của Bé',
    '💡 Gợi Ý Trò Chuyện AI',
  ];
  sidebarItems.forEach((item, idx) => {
    if (idx === 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(winX + 8, winY + 44 + idx * 34, 134, 28);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.strokeRect(winX + 8, winY + 44 + idx * 34, 134, 28);
      ctx.fillStyle = '#38bdf8';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    }
    ctx.font = '11px sans-serif';
    ctx.fillText(item, winX + 16, winY + 62 + idx * 34);
  });

  // Khối nội dung chính của Parent Dashboard
  const contentX = winX + 168;
  const contentY = winY + 46;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Báo Cáo Học Tập & Tiến Trình EQ Tuần Của Bé An', contentX, contentY + 16);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText('Cập nhật trực tuyến từ MagicOS • Giới hạn đọc: 30 phút/ngày • Mã PIN đã bật', contentX, contentY + 34);

  // 4 Thẻ chỉ số nhanh (Metrics Cards)
  const metricBoxes = [
    { label: '⏱ Thời gian đọc tuần', val: '145 Phút', sub: '+18% so với tuần trước', col: '#0284c7' },
    { label: '📚 Truyện đã đọc', val: '12 Truyện', sub: '5 truyện tự tạo AI', col: '#7c3aed' },
    { label: '🧠 Chỉ số EQ & Nhân ái', val: '94 / 100', sub: 'Rất xuất sắc bài học chia sẻ', col: '#059669' },
  ];
  metricBoxes.forEach((m, i) => {
    const bx = contentX + i * 150;
    const by = contentY + 46;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(bx, by, 142, 64, 8);
    ctx.fill();
    ctx.strokeStyle = m.col;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText(m.label, bx + 10, by + 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(m.val, bx + 10, by + 38);

    ctx.fillStyle = m.col;
    ctx.font = '9px sans-serif';
    ctx.fillText(m.sub, bx + 10, by + 54);
  });

  // Khối Banner Gợi ý Trò chuyện AI
  const cardGrad = ctx.createLinearGradient(contentX, contentY + 120, contentX + 440, contentY + 195);
  cardGrad.addColorStop(0, '#1e1b4b');
  cardGrad.addColorStop(0.5, '#312e81');
  cardGrad.addColorStop(1, '#4c1d95');
  ctx.fillStyle = cardGrad;
  ctx.beginPath();
  ctx.roundRect(contentX, contentY + 120, 440, 68, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('💡 Gợi ý câu hỏi kết nối tối nay với bé:', contentX + 16, contentY + 142);

  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('"Hôm nay khi chú thỏ chia sẻ bánh quy, con thấy thế nào nếu mình tặng quà cho bạn?"', contentX + 16, contentY + 162);

  // Các nút bấm hành động trên thanh Dashboard
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(contentX, contentY + 200, 135, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('📊 Xem Chi Tiết', contentX + 28, contentY + 218);

  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.roundRect(contentX + 145, contentY + 200, 145, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🛡️ Cấu Hình Giờ Ngủ', contentX + 162, contentY + 218);

  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.roundRect(contentX + 300, contentY + 200, 140, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('📄 Xuất Báo Cáo PDF', contentX + 318, contentY + 218);

  // 4. Thanh Dock ứng dụng đáy màn hình (macOS Style Dock)
  const dockW = 200;
  const dockH = 28;
  const dockX = (768 - dockW) / 2;
  const dockY = 432;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const dockIcons = ['#38bdf8', '#818cf8', '#c084fc', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
  dockIcons.forEach((c, idx) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(dockX + 12 + idx * 26, dockY + 5, 18, 18, 5);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/**
 * Xây dựng mô hình 3D Laptop hiện đại với màn hình chuẩn góc nhìn, không bị ngược
 */
export function buildLaptop(): LaptopBuildResult {
  const laptopGroup = new THREE.Group();

  // Vật liệu nhôm mờ nhám cao cấp (Matte Anodized Aluminum)
  // roughness cao (0.72) và metalness thấp (0.08) tạo bề mặt nhám mịn, chống lóa, không bóng bẩy
  const matAluminum = new THREE.MeshStandardMaterial({
    color: 0xc4c7cc, // Màu nhôm xám bạc mờ tự nhiên
    roughness: 0.72,
    metalness: 0.08,
  });

  const matDarkTrim = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.75,
    metalness: 0.05,
  });

  // Phím bấm đen nhám mờ, không phát sáng
  const matKeys = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.70,
    metalness: 0.02,
  });

  // Kích thước laptop 14-inch (31cm x 22cm)
  const laptopW = 0.31;
  const laptopD = 0.22;
  const baseH = 0.007;

  // --- 1. THÂN DƯỚI (BASE CHASSIS) ---
  const baseGroup = new THREE.Group();

  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(laptopW, baseH, laptopD),
    matAluminum
  );
  baseMesh.position.y = baseH / 2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  baseGroup.add(baseMesh);

  // 4 núm đệm cao su chân đế
  const footGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.0015, 12);
  const matRubber = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
  [
    [-laptopW / 2 + 0.02, -laptopD / 2 + 0.02],
    [laptopW / 2 - 0.02, -laptopD / 2 + 0.02],
    [-laptopW / 2 + 0.02, laptopD / 2 - 0.02],
    [laptopW / 2 - 0.02, laptopD / 2 - 0.02],
  ].forEach(([fx, fz]) => {
    const foot = new THREE.Mesh(footGeo, matRubber);
    foot.position.set(fx, 0, fz);
    baseGroup.add(foot);
  });

  // Khay bàn phím dập chìm
  const kbTrayW = 0.27;
  const kbTrayD = 0.11;
  const kbTrayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(kbTrayW, 0.001, kbTrayD),
    matDarkTrim
  );
  kbTrayMesh.position.set(0, baseH + 0.0005, -0.025);
  baseGroup.add(kbTrayMesh);

  // Các hàng phím bấm
  const rows = [
    { z: -0.068, h: 0.012, count: 14 },
    { z: -0.052, h: 0.015, count: 14 },
    { z: -0.035, h: 0.015, count: 14 },
    { z: -0.018, h: 0.015, count: 13 },
    { z: -0.001, h: 0.015, count: 12 },
  ];

  rows.forEach((row) => {
    const keyW = (kbTrayW - 0.02) / row.count;
    for (let k = 0; k < row.count; k++) {
      const keyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(keyW - 0.002, 0.0016, row.h - 0.002),
        matKeys
      );
      keyMesh.position.set(
        -kbTrayW / 2 + 0.01 + k * keyW + keyW / 2,
        baseH + 0.0016,
        row.z
      );
      baseGroup.add(keyMesh);
    }
  });

  // Phím Spacebar
  const spaceW = 0.10;
  const spaceMesh = new THREE.Mesh(
    new THREE.BoxGeometry(spaceW, 0.0016, 0.014),
    matKeys
  );
  spaceMesh.position.set(0, baseH + 0.0016, 0.016);
  baseGroup.add(spaceMesh);

  // Các phím bổ trợ quanh Spacebar
  const sideKeyW = (kbTrayW - spaceW - 0.03) / 6;
  for (let sk = 0; sk < 3; sk++) {
    const lKey = new THREE.Mesh(
      new THREE.BoxGeometry(sideKeyW - 0.002, 0.0016, 0.014),
      matKeys
    );
    lKey.position.set(-kbTrayW / 2 + 0.015 + sk * sideKeyW, baseH + 0.0016, 0.016);
    baseGroup.add(lKey);

    const rKey = new THREE.Mesh(
      new THREE.BoxGeometry(sideKeyW - 0.002, 0.0016, 0.014),
      matKeys
    );
    rKey.position.set(spaceW / 2 + 0.01 + sk * sideKeyW, baseH + 0.0016, 0.016);
    baseGroup.add(rKey);
  }

  // Bàn di chuột mờ nhám (Matte Touchpad)
  const padW = 0.105;
  const padD = 0.068;
  const matTrackpad = new THREE.MeshStandardMaterial({
    color: 0xbfc4cb,
    roughness: 0.70,
    metalness: 0.04,
  });
  const trackpad = new THREE.Mesh(
    new THREE.BoxGeometry(padW, 0.0008, padD),
    matTrackpad
  );
  trackpad.position.set(0, baseH + 0.0005, 0.064);
  baseGroup.add(trackpad);

  // Viền touchpad
  const padRim = new THREE.Mesh(
    new THREE.BoxGeometry(padW + 0.002, 0.0006, padD + 0.002),
    matDarkTrim
  );
  padRim.position.set(0, baseH + 0.0002, 0.064);
  baseGroup.add(padRim);

  // Cổng Thunderbolt / Type-C bên hông
  const portGeo = new THREE.BoxGeometry(0.001, 0.0018, 0.005);
  [-0.03, -0.015].forEach((pz) => {
    const port = new THREE.Mesh(portGeo, matDarkTrim);
    port.position.set(-laptopW / 2 - 0.0004, baseH / 2, pz);
    baseGroup.add(port);
  });

  laptopGroup.add(baseGroup);

  // --- 2. NẮP MÀN HÌNH (DISPLAY SCREEN LID) ---
  // Thiết kế bản lề tại mép sau thân máy
  const lidGroup = new THREE.Group();
  const hingeZ = -laptopD / 2 + 0.006;
  const hingeY = baseH + 0.0035; // Nâng nhẹ trục bản lề để khi gập nắp máy nằm phẳng khít không cọ phím
  lidGroup.position.set(0, hingeY, hingeZ);

  // Trạng thái mặc định: Gập đóng nằm ngang (Math.PI / 2 rad = 90 độ), khi zoom vào sẽ xoay mở ra (-0.31 rad = ngửa 18 độ)
  lidGroup.rotation.x = Math.PI / 2;

  const lidThickness = 0.0045;
  const screenH = 0.21; // Chiều cao nắp màn hình

  // 1. Lưng nhôm nắp máy (Aluminum Back Shell)
  const lidBackMesh = new THREE.Mesh(
    new THREE.BoxGeometry(laptopW, screenH, lidThickness),
    matAluminum
  );
  lidBackMesh.position.set(0, screenH / 2, -lidThickness / 2);
  lidBackMesh.castShadow = true;
  lidGroup.add(lidBackMesh);

  // 2. Logo mặt lưng máy (khắc laser nhôm mờ nhám, không phát sáng)
  const logoMat = new THREE.MeshStandardMaterial({
    color: 0xd8dee9,
    roughness: 0.65,
    metalness: 0.12,
  });
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.014, 20), logoMat);
  logo.position.set(0, screenH / 2, -lidThickness - 0.0002);
  logo.rotation.y = Math.PI; // Quay mặt ra sau lưng máy
  lidGroup.add(logo);

  // 3. Khung viền màn hình mặt trước nhám mờ (Inner Front Bezel)
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.75,
    metalness: 0.05,
  });
  const bezelMesh = new THREE.Mesh(
    new THREE.BoxGeometry(laptopW - 0.004, screenH - 0.004, 0.001),
    bezelMat
  );
  bezelMesh.position.set(0, screenH / 2, 0.0005);
  lidGroup.add(bezelMesh);

  // 4. Mắt camera webcam ở viền trên
  const camLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.0022, 16),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4, metalness: 0.2 })
  );
  camLens.position.set(0, screenH - 0.007, 0.0012);
  lidGroup.add(camLens);

  // 5. TẤM NỀN HIỂN THỊ MÀN HÌNH (Matte Anti-glare Display Screen)
  // Loại bỏ hoàn toàn phát sáng emissive, dùng độ nhám roughness 0.65 chống chói tự nhiên
  const screenW = laptopW - 0.020;
  const displayH = screenH - 0.024;
  const texScreen = createLaptopScreenTexture();
  const screenMat = new THREE.MeshStandardMaterial({
    map: texScreen,
    roughness: 0.65,
    metalness: 0.02,
  });

  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(screenW, displayH),
    screenMat
  );
  screenMesh.position.set(0, screenH / 2 - 0.002, 0.0013);
  lidGroup.add(screenMesh);

  // 6. Trục bản lề (Hinge Cylinder)
  const hingeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0045, 0.0045, laptopW - 0.05, 20),
    matDarkTrim
  );
  hingeMesh.rotation.z = Math.PI / 2;
  hingeMesh.position.set(0, 0, 0);
  lidGroup.add(hingeMesh);

  laptopGroup.add(lidGroup);

  // Vùng cảm ứng click vô hình để chọn góc nhìn Laptop từ xa
  const laptopClickMesh = new THREE.Mesh(
    new THREE.BoxGeometry(laptopW + 0.05, 0.25, laptopD + 0.05),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  laptopClickMesh.position.set(0, 0.10, 0);
  laptopGroup.add(laptopClickMesh);

  return { laptopGroup, screenMat, laptopClickMesh, laptopLidGroup: lidGroup };
}
