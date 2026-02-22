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
const seaweedPlants = Array.from({ length: 12 }, () => ({
  x:          30 + Math.random() * (canvas.width - 60),
  height:     40 + Math.random() * 70,
  segments:   4 + Math.floor(Math.random() * 4),
  swayOffset: Math.random() * Math.PI * 2,
  swaySpeed:  0.025 + Math.random() * 0.02,
  width:      3 + Math.random() * 3,
  color:      `hsl(${130 + Math.random() * 30},55%,${18 + Math.random() * 12}%)`,
}));

function drawSeaweed() {
  seaweedPlants.forEach(plant => {
    const segH = plant.height / plant.segments;
    ctx.beginPath();
    ctx.strokeStyle = plant.color;
    ctx.lineWidth = plant.width;
    ctx.lineCap = 'round';
    let px = plant.x;
    let py = canvas.height;
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
