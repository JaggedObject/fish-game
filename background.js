// ─── Coral ────────────────────────────────────────────────────────────────────
function generateCoralLayer(count, yMin, yMax, brightness) {
  const hues = [0, 30, 270, 300];
  return Array.from({ length: count }, () => {
    const type = ['fan', 'tube', 'brain'][Math.floor(Math.random() * 3)];
    const size = (yMax > 500 ? 14 : 22) + Math.random() * (yMax > 500 ? 14 : 20);
    const extra = {};
    if (type === 'tube') {
      const n = 3 + Math.floor(Math.random() * 2);
      extra.tubes = Array.from({ length: n }, (_, i) => ({
        ox:     (i - (n - 1) / 2) * size * 0.38,
        height: size * (0.5 + Math.random() * 0.6),
      }));
    } else if (type === 'brain') {
      extra.grooves = Array.from({ length: 4 }, () => ({
        ox:  (Math.random() - 0.5) * size * 0.6,
        cpx: (Math.random() - 0.5) * size * 0.3,
      }));
    }
    return {
      x: 30 + Math.random() * (WORLD_W - 60),
      y: yMin + Math.random() * (yMax - yMin),
      type, size, brightness,
      hue: hues[Math.floor(Math.random() * hues.length)],
      ...extra,
    };
  });
}

const coralBack = generateCoralLayer(45, WORLD_H - 100, WORLD_H,       0.6);
const coralMid  = generateCoralLayer(30, WORLD_H - 160, WORLD_H - 40, 0.85);

function drawCoralFan(c) {
  ctx.strokeStyle = `hsl(${c.hue},60%,${Math.round(22 * c.brightness)}%)`;
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    const angle = (i / 3) * (Math.PI * 0.5);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.quadraticCurveTo(
      c.x + Math.sin(angle * 0.5) * c.size * 0.4, c.y - c.size * 0.5,
      c.x + Math.sin(angle) * c.size,              c.y - c.size
    );
    ctx.stroke();
  }
}

function drawCoralTube(c) {
  ctx.fillStyle = `hsl(${c.hue},50%,${Math.round(18 * c.brightness)}%)`;
  const tw = c.size * 0.16;
  c.tubes.forEach(t => {
    const tx = c.x + t.ox;
    ctx.fillRect(tx - tw / 2, c.y - t.height, tw, t.height);
    ctx.beginPath();
    ctx.arc(tx, c.y - t.height, tw / 2, Math.PI, 0);
    ctx.fill();
  });
}

function drawCoralBrain(c) {
  ctx.fillStyle = `hsl(${c.hue},45%,${Math.round(16 * c.brightness)}%)`;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.size * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `hsl(${c.hue},55%,${Math.round(26 * c.brightness)}%)`;
  ctx.lineWidth = 1.5;
  c.grooves.forEach(g => {
    ctx.beginPath();
    ctx.moveTo(c.x + g.ox, c.y - c.size * 0.4);
    ctx.quadraticCurveTo(c.x + g.ox + g.cpx, c.y, c.x + g.ox, c.y + c.size * 0.4);
    ctx.stroke();
  });
}

function drawCoralLayer(layer, drift = 0) {
  ctx.save();
  ctx.translate(drift, 0);
  layer.forEach(c => {
    if (c.x + c.size + 20 < camera.x - drift || c.x - c.size - 20 > camera.x + canvas.width - drift) return;
    if (c.y + c.size + 20 < camera.y          || c.y - c.size - 20 > camera.y + canvas.height)        return;
    ctx.save();
    if      (c.type === 'fan')  drawCoralFan(c);
    else if (c.type === 'tube') drawCoralTube(c);
    else                        drawCoralBrain(c);
    ctx.restore();
  });
  ctx.restore();
}

// ─── Light Rays ───────────────────────────────────────────────────────────────
const lightRays = Array.from({ length: 5 }, (_, i) => ({
  x:     100 + i * 160 + (Math.random() - 0.5) * 60,
  width: 45 + Math.random() * 55,
  phase: Math.random() * Math.PI * 2,
}));

function drawLightRays() {
  lightRays.forEach(ray => {
    const alpha = 0.7 + 0.3 * Math.sin(frameCount * 0.008 + ray.phase);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, `rgba(255,255,255,${(0.06 * alpha).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ray.x - ray.width / 2, 0);
    ctx.lineTo(ray.x + ray.width / 2, 0);
    ctx.lineTo(ray.x + ray.width * 0.1, canvas.height);
    ctx.lineTo(ray.x - ray.width * 0.1, canvas.height);
    ctx.closePath();
    ctx.fill();
  });
}

// ─── Seaweed ──────────────────────────────────────────────────────────────────
const seaweedPlants = Array.from({ length: 60 }, () => ({
  x:          30 + Math.random() * (WORLD_W - 60),
  baseY:      WORLD_H,
  height:     40 + Math.random() * 80,
  segments:   4 + Math.floor(Math.random() * 4),
  swayOffset: Math.random() * Math.PI * 2,
  swaySpeed:  0.025 + Math.random() * 0.02,
  width:      3 + Math.random() * 3,
  color:      `hsl(${130 + Math.random() * 30},55%,${18 + Math.random() * 12}%)`,
}));

function drawSeaweed() {
  seaweedPlants.forEach(plant => {
    if (plant.x + 40 < camera.x || plant.x - 40 > camera.x + canvas.width) return;
    if (plant.baseY - plant.height > camera.y + canvas.height || plant.baseY < camera.y) return;
    const segH = plant.height / plant.segments;
    ctx.beginPath();
    ctx.strokeStyle = plant.color;
    ctx.lineWidth = plant.width;
    ctx.lineCap = 'round';
    let px = plant.x;
    let py = plant.baseY;
    ctx.moveTo(px, py);
    for (let i = 0; i < plant.segments; i++) {
      const sway = Math.sin(frameCount * plant.swaySpeed + plant.swayOffset + i * 0.8) * (i + 1) * 5;
      const cpx = px + sway * 1.5;
      const cpy = py - segH * 0.5;
      const nx = plant.x + sway;
      const ny = py - segH;
      ctx.quadraticCurveTo(cpx, cpy, nx, ny);
      px = nx;
      py = ny;
    }
    ctx.stroke();
  });
}

// ─── Bubbles ──────────────────────────────────────────────────────────────────
const bubbles = Array.from({ length: 22 }, () => ({
  x: Math.random() * 900, y: Math.random() * 560,
  r: Math.random() * 4 + 1, speed: Math.random() * 0.4 + 0.1,
}));

function updateBubbles() {
  bubbles.forEach(b => {
    b.y -= b.speed;
    if (b.y < -10) { b.y = canvas.height + 10; b.x = Math.random() * canvas.width; }
  });
}

function drawBubbles() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.17)';
  ctx.lineWidth = 1;
  bubbles.forEach(b => {
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.restore();
}

// ─── Fishing Hooks ────────────────────────────────────────────────────────────
const fishingHooks = Array.from({ length: 14 }, () => ({
  x:       80 + Math.random() * (WORLD_W - 160),
  lineTop: 0,
  hookY:   500 + Math.random() * 1200,
  size:    10  + Math.random() * 8,
}));

function drawFishingHooks() {
  fishingHooks.forEach(h => {
    if (h.x    + 40 < camera.x               || h.x    - 40 > camera.x + canvas.width)  return;
    if (h.hookY     < camera.y               || h.lineTop   > camera.y + canvas.height)  return;
    ctx.save();

    // Line from visible top to hook shank
    const visTop = Math.max(h.lineTop, camera.y);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(210,200,170,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(h.x, visTop);
    ctx.lineTo(h.x, h.hookY - h.size * 1.4);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hook metal (steel grey)
    ctx.strokeStyle = '#9e9eb0';
    ctx.lineWidth   = Math.max(2, h.size * 0.2);
    ctx.lineCap     = 'round';

    // Eye loop at top of hook
    ctx.beginPath();
    ctx.arc(h.x, h.hookY - h.size * 1.4, h.size * 0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Shank + J-curve
    ctx.beginPath();
    ctx.moveTo(h.x, h.hookY - h.size * 1.15);
    ctx.lineTo(h.x, h.hookY);
    ctx.quadraticCurveTo(h.x, h.hookY + h.size * 0.85, h.x - h.size * 0.75, h.hookY + h.size * 0.55);
    ctx.stroke();

    // Barb
    ctx.beginPath();
    ctx.moveTo(h.x - h.size * 0.55, h.hookY + h.size * 0.35);
    ctx.lineTo(h.x - h.size * 0.12, h.hookY + h.size * 0.55);
    ctx.stroke();

    ctx.restore();
  });
}

// ─── Ship Anchors ─────────────────────────────────────────────────────────────
const shipAnchors = Array.from({ length: 10 }, () => ({
  x:    100 + Math.random() * (WORLD_W - 200),
  y:    WORLD_H - 100 - Math.random() * 350,
  size: 24  + Math.random() * 14,
}));

function drawAnchors() {
  shipAnchors.forEach(a => {
    if (a.x + a.size * 2 < camera.x || a.x - a.size * 2 > camera.x + canvas.width)  return;
    if (a.y - a.size * 2 > camera.y + canvas.height || a.y + a.size < camera.y)      return;
    ctx.save();
    const x = a.x, y = a.y, s = a.size;
    ctx.strokeStyle = '#546e7a';
    ctx.fillStyle   = '#37474f';
    ctx.lineWidth   = Math.max(2, s * 0.13);
    ctx.lineCap     = 'round';

    // Ring at top
    ctx.beginPath();
    ctx.arc(x, y - s * 0.85, s * 0.18, 0, Math.PI * 2);
    ctx.stroke();

    // Shaft
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.67);
    ctx.lineTo(x, y + s * 0.45);
    ctx.stroke();

    // Crossbar
    ctx.beginPath();
    ctx.moveTo(x - s * 0.52, y - s * 0.36);
    ctx.lineTo(x + s * 0.52, y - s * 0.36);
    ctx.stroke();

    // Left arm
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.45);
    ctx.quadraticCurveTo(x - s * 0.65, y + s * 0.5, x - s * 0.65, y + s * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - s * 0.65, y + s * 0.1, s * 0.13, 0, Math.PI * 2);
    ctx.fill();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.45);
    ctx.quadraticCurveTo(x + s * 0.65, y + s * 0.5, x + s * 0.65, y + s * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + s * 0.65, y + s * 0.1, s * 0.13, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}
