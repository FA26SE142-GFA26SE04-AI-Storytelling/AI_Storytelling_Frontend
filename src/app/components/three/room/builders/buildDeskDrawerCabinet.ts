import * as THREE from 'three';

export interface DeskDrawerCabinetBuildResult {
  drawerCarcassGroup: THREE.Group;
  bottomDrawerGroup: THREE.Group;
  drawerClickMesh: THREE.Mesh;
  drawerLight: THREE.PointLight;
  drawerPortalRing: THREE.Mesh;
}

/**
 * Procedural texture for study papers, exam sheets, and handwritten documents.
 */
function createPaperDocumentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Crisp study document paper
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle paper margin border
  ctx.strokeStyle = '#e2e0d8';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, 480, 480);

  // Red left margin line (classic student exercise & test paper)
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(82, 24);
  ctx.lineTo(82, 488);
  ctx.stroke();

  // Document Title / Exam Header bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(98, 42, 230, 10);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(98, 58, 140, 6);

  // Red grade score stamp / checkmark circle on top right (Điểm 100 đỏ)
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(430, 58, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('100', 412, 65);

  // Ruled horizontal lines & simulated handwritten paragraphs
  let y = 84;
  while (y < 470) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(88, y + 12);
    ctx.lineTo(470, y + 12);
    ctx.stroke();

    const lineW = 160 + (y % 70) * 3;
    ctx.fillStyle = '#475569';
    ctx.fillRect(98, y + 4, Math.min(360, lineW), 4);

    y += 20;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Procedural texture for layered stack of paper edges.
 */
function createPaperEdgesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 128, 128);

  // Horizontal paper sheet edge lines
  ctx.fillStyle = '#e2e8f0';
  for (let y = 0; y < 128; y += 4) {
    ctx.fillRect(0, y, 128, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Procedural texture for Japanese Campus-style study notebook cover.
 */
function createNotebookCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep Navy blue cover
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, 256, 256);

  // Dark spine binding tape
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 36, 256);

  // Gold spine accent line
  ctx.fillStyle = '#d97706';
  ctx.fillRect(36, 0, 3, 256);

  // White label box in center
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(60, 60, 160, 75);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 160, 75);

  // Ruled lines inside label for subject & name
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(72, 85, 136, 3);
  ctx.fillRect(72, 108, 136, 3);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Builds the realistic 3-drawer cabinet under Nobita's study desk.
 * Inside the bottom drawer is an authentic arrangement of:
 * - Stack of study documents, exam papers with red grading marks and paperclips
 * - Manila kraft folders with documents slipping out
 * - Student study exercise notebooks and sticky note pads
 * - Pencils, ruler, and stationery
 * - Natural warm fill light illuminating the papers when pulled out
 */
export function buildDeskDrawerCabinet(
  matWoodAmber: THREE.Material,
  matWoodDark: THREE.Material,
  matBrass: THREE.Material,
  matChrome: THREE.Material
): DeskDrawerCabinetBuildResult {
  const drawerCarcassGroup = new THREE.Group();

  // 1. Chân đế tủ (Plinth Base)
  const basePlinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.90, 0.04, 0.52),
    matWoodDark
  );
  basePlinth.position.set(0, 0.02, 0.5);
  basePlinth.castShadow = true;
  basePlinth.receiveShadow = true;
  drawerCarcassGroup.add(basePlinth);

  // 2. Vách hông ngoài (+Z, giáp tường bên phải)
  const sidePanelOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.90, 0.84, 0.022),
    matWoodAmber
  );
  sidePanelOuter.position.set(0, 0.46, 0.75);
  sidePanelOuter.castShadow = true;
  sidePanelOuter.receiveShadow = true;
  drawerCarcassGroup.add(sidePanelOuter);

  // 3. Vách hông trong (-Z, giáp khoang để chân người ngồi)
  const sidePanelInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.90, 0.84, 0.022),
    matWoodAmber
  );
  sidePanelInner.position.set(0, 0.46, 0.25);
  sidePanelInner.castShadow = true;
  sidePanelInner.receiveShadow = true;
  drawerCarcassGroup.add(sidePanelInner);

  // 4. Vách sau tủ (+X)
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.84, 0.48),
    matWoodAmber
  );
  backPanel.position.set(0.44, 0.46, 0.5);
  backPanel.castShadow = true;
  drawerCarcassGroup.add(backPanel);

  // 5. Thanh giằng đỉnh tủ (Top Apron/Frame dưới mặt bàn)
  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.90, 0.02, 0.48),
    matWoodDark
  );
  topFrame.position.set(0, 0.87, 0.5);
  drawerCarcassGroup.add(topFrame);

  // 6. Đáy buồng ngăn kéo dưới cùng
  const bottomShelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.016, 0.48),
    matWoodAmber
  );
  bottomShelf.position.set(0, 0.048, 0.5);
  drawerCarcassGroup.add(bottomShelf);

  // 7. Đợt chia ngăn 1 (giữa ngăn kéo dưới và ngăn kéo giữa)
  const divider1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.018, 0.48),
    matWoodDark
  );
  divider1.position.set(0, 0.31, 0.5);
  drawerCarcassGroup.add(divider1);

  // 8. Đợt chia ngăn 2 (giữa ngăn kéo giữa và ngăn kéo trên)
  const divider2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.018, 0.48),
    matWoodDark
  );
  divider2.position.set(0, 0.58, 0.5);
  drawerCarcassGroup.add(divider2);

  // 9. Thanh ray dẫn hướng kim loại bên trong các khoang ngăn kéo
  [0.16, 0.44, 0.72].forEach((guideY) => {
    [0.738, 0.262].forEach((guideZ) => {
      const runnerGuide = new THREE.Mesh(
        new THREE.BoxGeometry(0.70, 0.012, 0.008),
        matChrome
      );
      runnerGuide.position.set(0, guideY, guideZ);
      drawerCarcassGroup.add(runnerGuide);
    });
  });

  // --- NGĂN KÉO TRÊN CÙNG (TOP DRAWER) ---
  const topDrawerGroup = new THREE.Group();
  const topFrontPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.25, 0.47),
    matWoodAmber
  );
  topFrontPanel.position.set(-0.442, 0.725, 0.5);
  topFrontPanel.castShadow = true;
  topDrawerGroup.add(topFrontPanel);

  const topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.21, 0.43),
    matWoodDark
  );
  topTrim.position.set(-0.454, 0.725, 0.5);
  topDrawerGroup.add(topTrim);

  const topHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.028, 0.15),
    matWoodDark
  );
  topHandle.position.set(-0.468, 0.725, 0.5);
  topHandle.castShadow = true;
  topDrawerGroup.add(topHandle);

  [-0.05, 0.05].forEach((offsetZ) => {
    const standoff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.014, 12),
      matBrass
    );
    standoff.rotation.z = Math.PI / 2;
    standoff.position.set(-0.455, 0.725, 0.5 + offsetZ);
    topDrawerGroup.add(standoff);
  });

  const keyhole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.005, 16),
    matBrass
  );
  keyhole.rotation.z = Math.PI / 2;
  keyhole.position.set(-0.455, 0.81, 0.5);
  topDrawerGroup.add(keyhole);
  drawerCarcassGroup.add(topDrawerGroup);

  // --- NGĂN KÉO GIỮA (MIDDLE DRAWER) ---
  const midDrawerGroup = new THREE.Group();
  const midFrontPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.23, 0.47),
    matWoodAmber
  );
  midFrontPanel.position.set(-0.442, 0.445, 0.5);
  midFrontPanel.castShadow = true;
  midDrawerGroup.add(midFrontPanel);

  const midTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.19, 0.43),
    matWoodDark
  );
  midTrim.position.set(-0.454, 0.445, 0.5);
  midDrawerGroup.add(midTrim);

  const midHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.028, 0.15),
    matWoodDark
  );
  midHandle.position.set(-0.468, 0.445, 0.5);
  midHandle.castShadow = true;
  midDrawerGroup.add(midHandle);

  [-0.05, 0.05].forEach((offsetZ) => {
    const standoff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.014, 12),
      matBrass
    );
    standoff.rotation.z = Math.PI / 2;
    standoff.position.set(-0.455, 0.445, 0.5 + offsetZ);
    midDrawerGroup.add(standoff);
  });
  drawerCarcassGroup.add(midDrawerGroup);

  // --- NGĂN KÉO DƯỚI CÙNG (BOTTOM DRAWER - CÓ KHẢ NĂNG KÉO RA/VÀO) ---
  const bottomDrawerGroup = new THREE.Group();

  // Mặt trước ngăn kéo dưới
  const bottomFrontPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.23, 0.47),
    matWoodAmber
  );
  bottomFrontPanel.position.set(-0.442, 0.175, 0.5);
  bottomFrontPanel.castShadow = true;
  bottomDrawerGroup.add(bottomFrontPanel);

  const bottomTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.19, 0.43),
    matWoodDark
  );
  bottomTrim.position.set(-0.454, 0.175, 0.5);
  bottomDrawerGroup.add(bottomTrim);

  const bottomHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.028, 0.15),
    matWoodDark
  );
  bottomHandle.position.set(-0.468, 0.175, 0.5);
  bottomHandle.castShadow = true;
  bottomDrawerGroup.add(bottomHandle);

  [-0.05, 0.05].forEach((offsetZ) => {
    const standoff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.014, 12),
      matBrass
    );
    standoff.rotation.z = Math.PI / 2;
    standoff.position.set(-0.455, 0.175, 0.5 + offsetZ);
    bottomDrawerGroup.add(standoff);
  });

  // Hộp ngăn kéo rỗng thực thụ (Drawer Container Box)
  const boxFloor = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.014, 0.44),
    matWoodAmber
  );
  boxFloor.position.set(-0.06, 0.065, 0.5);
  bottomDrawerGroup.add(boxFloor);

  const boxInnerFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.17, 0.44),
    matWoodAmber
  );
  boxInnerFront.position.set(-0.425, 0.155, 0.5);
  bottomDrawerGroup.add(boxInnerFront);

  const boxBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.17, 0.44),
    matWoodAmber
  );
  boxBack.position.set(0.30, 0.155, 0.5);
  bottomDrawerGroup.add(boxBack);

  const boxSideOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.17, 0.014),
    matWoodAmber
  );
  boxSideOuter.position.set(-0.06, 0.155, 0.713);
  bottomDrawerGroup.add(boxSideOuter);

  const boxSideInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.17, 0.014),
    matWoodAmber
  );
  boxSideInner.position.set(-0.06, 0.155, 0.287);
  bottomDrawerGroup.add(boxSideInner);

  // Thanh ray kim loại gắn bên ngoài hông ngăn kéo
  [0.723, 0.277].forEach((sideZ) => {
    const sideRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.012, 0.006),
      matChrome
    );
    sideRail.position.set(-0.06, 0.15, sideZ);
    bottomDrawerGroup.add(sideRail);
  });

  // ==========================================
  // GIẤY TỜ, TÀI LIỆU & VỞ BÀI TẬP BÊN TRONG NGĂN KÉO
  // ==========================================
  const docTex = createPaperDocumentTexture();
  const docTex2 = createPaperDocumentTexture();
  const paperEdgesTex = createPaperEdgesTexture();
  const notebookCoverTex = createNotebookCoverTexture();

  const matPaperEdge = new THREE.MeshStandardMaterial({
    map: paperEdgesTex,
    roughness: 0.85,
  });
  const matDocTop = new THREE.MeshStandardMaterial({
    map: docTex,
    roughness: 0.65,
  });
  const matDocTop2 = new THREE.MeshStandardMaterial({
    map: docTex2,
    roughness: 0.65,
  });

  // 1. Chồng Giấy Tờ & Bài Kiểm Tra Học Tập (Thick Stack of A4 Documents / Exam Papers)
  const docStackMats = [
    matPaperEdge, // right
    matPaperEdge, // left
    matDocTop,    // top (+Y)
    matPaperEdge, // bottom
    matPaperEdge, // front
    matPaperEdge, // back
  ];
  const paperStack = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.038, 0.20),
    docStackMats
  );
  paperStack.position.set(-0.16, 0.088, 0.52);
  paperStack.castShadow = true;
  paperStack.receiveShadow = true;
  bottomDrawerGroup.add(paperStack);

  // Tờ giấy rời đặt so le nhẹ trên đỉnh xấp tài liệu
  const looseSheetMats = [
    matPaperEdge,
    matPaperEdge,
    matDocTop2,
    matPaperEdge,
    matPaperEdge,
    matPaperEdge,
  ];
  const looseSheet = new THREE.Mesh(
    new THREE.BoxGeometry(0.275, 0.002, 0.195),
    looseSheetMats
  );
  looseSheet.position.set(-0.155, 0.108, 0.515);
  looseSheet.rotation.y = -0.05;
  looseSheet.castShadow = true;
  bottomDrawerGroup.add(looseSheet);

  // Kẹp ghim tài liệu kim loại ở góc tờ giấy
  const paperClip = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.004, 0.024),
    matChrome
  );
  paperClip.position.set(-0.28, 0.111, 0.58);
  bottomDrawerGroup.add(paperClip);

  // 2. Bìa Kẹp Hồ Sơ Giấy Kraft (Manila Document Folder with Papers Slipping Out)
  const matManilaFolder = new THREE.MeshStandardMaterial({
    color: 0xd99b50,
    roughness: 0.65,
  });
  const manilaFolder = new THREE.Mesh(
    new THREE.BoxGeometry(0.31, 0.014, 0.22),
    matManilaFolder
  );
  manilaFolder.position.set(-0.06, 0.075, 0.38);
  manilaFolder.castShadow = true;
  manilaFolder.receiveShadow = true;
  bottomDrawerGroup.add(manilaFolder);

  // Giấy trắng thò ra mép bìa hồ sơ
  const folderPapers = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.004, 0.19),
    matDocTop
  );
  folderPapers.position.set(-0.04, 0.084, 0.38);
  bottomDrawerGroup.add(folderPapers);

  // Mấu nhãn chỉ mục của bìa hồ sơ (Folder Index Tab)
  const folderTab = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.003, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.5 })
  );
  folderTab.position.set(0.09, 0.083, 0.27);
  bottomDrawerGroup.add(folderTab);

  // 3. Tập Vở Bài Tập & Sổ Tay Học Sinh (Student Study Notebooks)
  const notebookMats = [
    matPaperEdge,
    matPaperEdge,
    new THREE.MeshStandardMaterial({ map: notebookCoverTex, roughness: 0.45 }),
    matPaperEdge,
    matPaperEdge,
    matPaperEdge,
  ];
  const notebookBlue = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.016, 0.17),
    notebookMats
  );
  notebookBlue.position.set(0.12, 0.078, 0.56);
  notebookBlue.rotation.y = 0.04;
  notebookBlue.castShadow = true;
  bottomDrawerGroup.add(notebookBlue);

  // Vở bài tập mỏng bìa cam đặt chéo bên trên
  const notebookOrange = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.014, 0.15),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.55 })
  );
  notebookOrange.position.set(0.13, 0.093, 0.55);
  notebookOrange.rotation.y = -0.07;
  notebookOrange.castShadow = true;
  bottomDrawerGroup.add(notebookOrange);

  const notebookLabel = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.002, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xfffcf5, roughness: 0.7 })
  );
  notebookLabel.position.set(0.13, 0.101, 0.55);
  notebookLabel.rotation.y = -0.07;
  bottomDrawerGroup.add(notebookLabel);

  // 4. Tập Giấy Note Vàng & Hồng (Sticky Note Pads)
  const postItYellow = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.010, 0.065),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.75 })
  );
  postItYellow.position.set(-0.31, 0.076, 0.35);
  bottomDrawerGroup.add(postItYellow);

  const postItPink = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.008, 0.065),
    new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.75 })
  );
  postItPink.position.set(-0.235, 0.075, 0.35);
  bottomDrawerGroup.add(postItPink);

  // 5. Phong Bì Thư / Giấy Kiểm Tra Gấp Gọn (Document Envelope)
  const envelope = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.008, 0.11),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
  );
  envelope.position.set(0.11, 0.074, 0.37);
  envelope.castShadow = true;
  bottomDrawerGroup.add(envelope);

  // Tem thư đỏ trên phong bì
  const postalStamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.002, 0.022),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
  );
  postalStamp.position.set(0.18, 0.079, 0.33);
  bottomDrawerGroup.add(postalStamp);

  // 6. Bút Chì Học Sinh & Thước Kẻ Nhựa (Pencil & Ruler)
  const pencilYellow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0035, 0.0035, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 })
  );
  pencilYellow.rotation.z = Math.PI / 2;
  pencilYellow.rotation.y = 0.18;
  pencilYellow.position.set(-0.05, 0.112, 0.64);
  bottomDrawerGroup.add(pencilYellow);

  const pencilEraser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0035, 0.0035, 0.015, 12),
    new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 })
  );
  pencilEraser.rotation.z = Math.PI / 2;
  pencilEraser.rotation.y = 0.18;
  pencilEraser.position.set(0.03, 0.112, 0.655);
  bottomDrawerGroup.add(pencilEraser);

  const ruler = new THREE.Mesh(
    new THREE.BoxGeometry(0.002, 0.003, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
    })
  );
  ruler.position.set(-0.01, 0.075, 0.66);
  bottomDrawerGroup.add(ruler);

  // 7. Ánh Sáng Tự Nhiên Ấm Dịu Rọi Vào Giấy Tờ Khi Kéo Ngăn Ra
  const drawerLight = new THREE.PointLight(0xfffbeb, 0.0, 1.8, 1.3);
  drawerLight.position.set(-0.10, 0.28, 0.5);
  bottomDrawerGroup.add(drawerLight);

  // Mesh ảo cho drawerPortalRing để tương thích với loop animation
  const drawerPortalRing = new THREE.Mesh();
  bottomDrawerGroup.add(drawerPortalRing);

  drawerCarcassGroup.add(bottomDrawerGroup);

  // Lưới bấm tương tác (Click Mesh) riêng biệt cho Tủ Ngăn Kéo
  const drawerClickMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.88, 0.58),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  drawerClickMesh.position.set(-0.45, 0.46, 0.5);
  drawerCarcassGroup.add(drawerClickMesh);

  return {
    drawerCarcassGroup,
    bottomDrawerGroup,
    drawerClickMesh,
    drawerLight,
    drawerPortalRing,
  };
}
