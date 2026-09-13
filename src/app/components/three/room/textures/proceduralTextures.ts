import * as THREE from 'three';

/**
 * Procedural Texture Generator Utility for Three.js
 * Generates ultra-lightweight, high-performance, seamless procedural textures
 * using HTML5 Canvas without any external image download overhead!
 */

// 1. Japanese Tatami Woven Grass Mat Texture (Soft, Subtle & Natural Detail)
export function createTatamiTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm natural igusa straw base
  ctx.fillStyle = '#dfb877';
  ctx.fillRect(0, 0, 512, 512);

  // Soft parallel woven straw rods (16px per rod)
  const rodHeight = 16;
  for (let y = 0; y < 512; y += rodHeight) {
    // Subtle shadow groove between straw rods
    ctx.fillStyle = '#c4944a';
    ctx.fillRect(0, y, 512, 2);

    // Warm golden straw body
    ctx.fillStyle = '#dfb877';
    ctx.fillRect(0, y + 2, 512, 10);

    // Soft specular highlight ridge on top of straw rod
    ctx.fillStyle = '#eed9aa';
    ctx.fillRect(0, y + 5, 512, 5);
  }

  // Soft vertical binding threads (subtle cross-stitches every 16px)
  for (let x = 0; x < 512; x += 16) {
    for (let y = 0; y < 512; y += rodHeight) {
      if ((x / 16 + y / rodHeight) % 2 === 0) {
        ctx.fillStyle = '#b3823b';
        ctx.fillRect(x, y + 2, 3, 10);
        ctx.fillStyle = '#f5e4bf';
        ctx.fillRect(x + 1, y + 4, 1, 6);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.0, 6.0);
  texture.anisotropy = 16;
  return texture;
}

// Tatami 3D Surface Relief Bump Map (Soft Relief)
export function createTatamiBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  const rodHeight = 16;
  for (let y = 0; y < 512; y += rodHeight) {
    ctx.fillStyle = '#606060'; // gentle groove
    ctx.fillRect(0, y, 512, 3);
    ctx.fillStyle = '#a0a0a0'; // gentle ridge
    ctx.fillRect(0, y + 5, 512, 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.0, 6.0);
  texture.anisotropy = 16;
  return texture;
}

// 2. Realistic Wood Grain Texture
export function createWoodTexture(
  baseHex: string = '#d97706',
  grainHex: string = '#92400e'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base wood color
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Linear wood grain streaks
  ctx.fillStyle = grainHex;
  for (let y = 0; y < 512; y++) {
    const alpha = Math.random() * 0.18 + 0.05;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, y, 512, Math.random() * 2 + 1);
  }
  ctx.globalAlpha = 1.0;

  // Subtle wood knots
  ctx.fillStyle = grainHex;
  ctx.globalAlpha = 0.12;
  for (let k = 0; k < 3; k++) {
    const kx = Math.random() * 512;
    const ky = Math.random() * 512;
    ctx.beginPath();
    ctx.ellipse(kx, ky, 35, 12, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 3. Padded Woven Fabric / Linen Texture (For cushions, chairs, futons, clothes)
export function createFabricTexture(
  baseHex: string = '#2563eb',
  threadHex: string = '#1d4ed8'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = threadHex;
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 256; i += 4) {
    ctx.fillRect(i, 0, 2, 256); // vertical threads
    ctx.fillRect(0, i, 256, 2); // horizontal threads
  }
  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// 4. Rice Paper Texture (For Japanese Shoji screen & Fusuma doors)
export function createShojiPaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(0, 0, 256, 256);

  // Soft fiber flecks
  ctx.fillStyle = '#e7e5e4';
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillRect(x, y, Math.random() * 4 + 1, Math.random() * 1 + 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 5. Plaster Wall Micro Texture
export function createWallPlasterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f5f5f4';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle noise speckles
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const alpha = Math.random() * 0.08;
    ctx.fillStyle = `rgba(120, 113, 108, ${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

// 6. World Map Equirectangular Texture for 3D Desktop Globe
export function createGlobeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep Ocean Blue Base
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 512, 256);

  // Shallow Coastal Water Glow
  ctx.fillStyle = '#38bdf8';
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, 0, 512, 256);
  ctx.globalAlpha = 1.0;

  // Lush Green & Gold Landmasses / Continents
  ctx.fillStyle = '#166534';

  const drawLand = (points: [number, number][]) => {
    ctx.beginPath();
    points.forEach(([x, y], idx) => {
      const cx = (x / 360) * 512;
      const cy = (y / 180) * 256;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.fill();
  };

  // North America
  drawLand([
    [30, 20], [80, 25], [110, 40], [130, 60], [115, 85], [90, 100], [70, 75], [40, 55], [20, 35]
  ]);

  // South America
  drawLand([
    [95, 105], [130, 115], [145, 140], [120, 170], [100, 150], [90, 125]
  ]);

  // Eurasia (Europe & Asia)
  drawLand([
    [160, 25], [230, 20], [310, 30], [330, 65], [290, 90], [240, 70], [190, 60], [165, 45]
  ]);

  // Africa
  drawLand([
    [165, 75], [215, 70], [235, 105], [205, 150], [175, 130], [155, 95]
  ]);

  // Australia
  drawLand([
    [280, 120], [325, 125], [320, 155], [275, 150]
  ]);

  // Antarctica
  ctx.fillStyle = '#f8fafc';
  drawLand([
    [0, 168], [512, 168], [512, 180], [0, 180]
  ]);

  // Latitude & Longitude Grid Lines (Equator & Meridians)
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)'; // Bright gold grid lines
  ctx.lineWidth = 1.5;

  // Latitude Lines
  for (let lat = 32; lat < 256; lat += 32) {
    ctx.beginPath();
    ctx.moveTo(0, lat);
    ctx.lineTo(512, lat);
    ctx.stroke();
  }

  // Longitude Lines
  for (let lon = 0; lon < 512; lon += 42) {
    ctx.beginPath();
    ctx.moveTo(lon, 0);
    ctx.lineTo(lon, 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Generates a Real-Time Wall Calendar Texture (Lịch Treo Tường / Lịch Blốc)
 * Displaying today's actual Date, Day of Week, Month, and Year (Vietnam UTC+7 timezone)
 */
export function createRealTimeCalendarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 704;
  const ctx = canvas.getContext('2d')!;

  const now = new Date();

  const dayNum = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric' }).format(now);
  const monthNum = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', month: 'numeric' }).format(now), 10);
  const yearNum = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(now);
  const weekDayName = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long' }).format(now);

  const monthNamesEn = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  const monthTitle = `${monthNamesEn[monthNum - 1] || 'JANUARY'} ${yearNum}`;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 704);

  // Red Header Bar
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 512, 170);

  // Gold accent stripe under header
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 164, 512, 6);

  // Header Text (Month & Year)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(monthTitle.toUpperCase(), 256, 85);

  // Giant Center Today Date Number
  const isSunday = weekDayName.toLowerCase().includes('sunday');
  ctx.fillStyle = isSunday ? '#dc2626' : '#1e293b';
  ctx.font = 'bold 220px sans-serif';
  ctx.fillText(dayNum, 256, 340);

  // Day of Week Subtitle
  ctx.fillStyle = isSunday ? '#dc2626' : '#2563eb';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(weekDayName.toUpperCase(), 256, 475);

  // Divider Line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 510);
  ctx.lineTo(472, 510);
  ctx.stroke();

  // Mini Month Calendar Grid at Bottom
  const daysInMonth = new Date(parseInt(yearNum, 10), monthNum, 0).getDate();
  const firstDayWeek = new Date(parseInt(yearNum, 10), monthNum - 1, 1).getDay();

  const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 16px sans-serif';
  dayHeaders.forEach((dh, idx) => {
    ctx.fillText(dh, 65 + idx * 64, 545);
  });

  ctx.font = '18px sans-serif';
  const startOffset = (firstDayWeek + 6) % 7;
  let currentDay = 1;

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const cellIdx = row * 7 + col;
      if (cellIdx >= startOffset && currentDay <= daysInMonth) {
        const cx = 65 + col * 64;
        const cy = 575 + row * 22;

        if (currentDay.toString() === dayNum) {
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(cx, cy - 1, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 17px sans-serif';
          ctx.fillText(currentDay.toString(), cx, cy);
          ctx.font = '17px sans-serif';
        } else {
          ctx.fillStyle = col === 6 ? '#dc2626' : '#334155';
          ctx.fillText(currentDay.toString(), cx, cy);
        }
        currentDay++;
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 16;
  return texture;
}

/**
 * Generates a Crisp 3D Alarm Clock Dial Face Texture with Hour Numbers & Ticks
 */
export function createClockFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Crisp White Dial Face
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);

  // Outer border accent ring
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(256, 256, 240, 0, Math.PI * 2);
  ctx.stroke();

  // Minute & Hour Tick Marks
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#0f172a';

  for (let i = 0; i < 60; i++) {
    const angle = (i * Math.PI * 2) / 60 - Math.PI / 2;
    const isHour = i % 5 === 0;
    const innerR = isHour ? 195 : 215;
    const outerR = 230;
    const x1 = 256 + Math.cos(angle) * innerR;
    const y1 = 256 + Math.sin(angle) * innerR;
    const x2 = 256 + Math.cos(angle) * outerR;
    const y2 = 256 + Math.sin(angle) * outerR;

    ctx.lineWidth = isHour ? 6 : 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Hour Numbers 1 to 12
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let num = 1; num <= 12; num++) {
    const angle = (num * Math.PI * 2) / 12 - Math.PI / 2;
    const nx = 256 + Math.cos(angle) * 158;
    const ny = 256 + Math.sin(angle) * 158;
    ctx.fillText(num.toString(), nx, ny);
  }

  // Subtle QUARTZ logo
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('QUARTZ', 256, 325);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}
