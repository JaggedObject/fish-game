const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas size
function resize() {
  const maxW = 900, maxH = 560;
  const scaleW = window.innerWidth / maxW;
  const scaleH = window.innerHeight / maxH;
  const scale = Math.min(scaleW, scaleH, 1);
  canvas.width = maxW;
  canvas.height = maxH;
  canvas.style.width = Math.floor(maxW * scale) + 'px';
  canvas.style.height = Math.floor(maxH * scale) + 'px';
}
resize();
window.addEventListener('resize', resize);

// ─── Input ───────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
  if ((e.key === ' ' || e.key === 'Enter') && gameState !== 'playing') {
    startGame();
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Click / tap to start
canvas.addEventListener('click', () => {
  if (gameState !== 'playing') startGame();
});

// Touch movement: steer toward finger
let touchTarget = null;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (gameState !== 'playing') { startGame(); return; }
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  touchTarget = {
    x: (e.touches[0].clientX - r.left) * scaleX,
    y: (e.touches[0].clientY - r.top) * scaleY,
  };
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  touchTarget = {
    x: (e.touches[0].clientX - r.left) * scaleX,
    y: (e.touches[0].clientY - r.top) * scaleY,
  };
}, { passive: false });
canvas.addEventListener('touchend', () => { touchTarget = null; });

// ─── Drawing helpers ─────────────────────────────────────────────────────────
function drawFish(x, y, size, color, facingRight) {
  ctx.save();
  ctx.translate(x, y);
  if (!facingRight) ctx.scale(-1, 1);

  // Tail
  ctx.beginPath();
  ctx.moveTo(-size * 0.7, 0);
  ctx.lineTo(-size * 1.35, -size * 0.65);
  ctx.lineTo(-size * 1.35, size * 0.65);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.58, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Fin (dorsal)
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, -size * 0.55);
  ctx.quadraticCurveTo(size * 0.2, -size * 0.95, size * 0.4, -size * 0.55);
  ctx.closePath();
  ctx.fillStyle = shadeColor(color, -20);
  ctx.fill();

  // Eye white
  ctx.beginPath();
  ctx.arc(size * 0.45, -size * 0.1, size * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Pupil
  ctx.beginPath();
  ctx.arc(size * 0.48, -size * 0.1, size * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();

  // Mouth
  ctx.beginPath();
  ctx.arc(size * 0.88, size * 0.12, size * 0.14, 0.3, Math.PI - 0.3);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.stroke();

  ctx.restore();
}

function shadeColor(hex, pct) {
  // Slightly darken/lighten an hsl string or fallback
  return hex;
}

// ─── Player ──────────────────────────────────────────────────────────────────
class Player {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.size = 22;
    this.baseSpeed = 3.2;
    this.facingRight = true;
    this.color = '#4fc3f7';
    this.maxSize = 85;
  }

  get speed() {
    return Math.max(1.6, this.baseSpeed - (this.size - 22) * 0.018);
  }

  update() {
    if (touchTarget) {
      const dx = touchTarget.x - this.x;
      const dy = touchTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        this.facingRight = dx > 0;
      }
    } else {
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) { this.x -= this.speed; this.facingRight = false; }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) { this.x += this.speed; this.facingRight = true; }
      if (keys['ArrowUp'] || keys['w'] || keys['W']) this.y -= this.speed;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) this.y += this.speed;
    }

    this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
  }

  draw() {
    drawFish(this.x, this.y, this.size, this.color, this.facingRight);
  }

  eat(fishSize) {
    score += Math.ceil(fishSize * 2);
    this.size = Math.min(this.maxSize, this.size + fishSize * 0.12);
  }
}

// ─── Enemy Fish ──────────────────────────────────────────────────────────────
const FISH_COLORS = [
  '#ef5350', '#ab47bc', '#42a5f5', '#26a69a',
  '#ffca28', '#ff7043', '#66bb6a', '#ec407a',
];

class EnemyFish {
  constructor(playerSize) {
    this.spawn(playerSize);
  }

  spawn(playerSize) {
    // Size range: some smaller, some bigger than player
    const minSize = Math.max(8, playerSize * 0.3);
    const maxSize = Math.min(75, playerSize * 2.2);
    this.size = minSize + Math.random() * (maxSize - minSize);

    this.facingRight = Math.random() > 0.5;
    const margin = this.size * 1.5;
    this.x = this.facingRight ? -margin : canvas.width + margin;
    this.y = margin + Math.random() * (canvas.height - margin * 2);

    const speedBase = 1.0 + Math.random() * 1.4;
    this.vx = speedBase * (this.facingRight ? 1 : -1);
    this.vy = (Math.random() - 0.5) * 0.6;

    this.color = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Soft vertical bounce
    if (this.y < this.size || this.y > canvas.height - this.size) {
      this.vy *= -1;
    }

    if (this.x > canvas.width + 100 || this.x < -100) {
      this.active = false;
    }
  }

  draw() {
    drawFish(this.x, this.y, this.size, this.color, this.facingRight);
  }
}

// ─── Particles ───────────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.alpha = 1;
    this.radius = Math.random() * 5 + 2;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.04;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

// ─── Floating score text ──────────────────────────────────────────────────────
class FloatText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1;
    this.vy = -1.2;
    this.life = 50;
  }

  update() {
    this.y += this.vy;
    this.life--;
    this.alpha = this.life / 50;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// ─── Bubbles (background decoration) ─────────────────────────────────────────
const bubbles = Array.from({ length: 18 }, () => ({
  x: Math.random() * 900,
  y: Math.random() * 560,
  r: Math.random() * 4 + 1,
  speed: Math.random() * 0.4 + 0.1,
}));

function updateBubbles() {
  bubbles.forEach(b => {
    b.y -= b.speed;
    if (b.y < -10) { b.y = canvas.height + 10; b.x = Math.random() * canvas.width; }
  });
}

function drawBubbles() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  bubbles.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

// ─── Game state ───────────────────────────────────────────────────────────────
let gameState = 'start'; // 'start' | 'playing' | 'dead'
let score = 0;
let highScore = 0;
let player = null;
let enemies = [];
let particles = [];
let floatTexts = [];
let frameCount = 0;
let animId = null;
let spawnInterval = 90; // frames between spawns

function startGame() {
  score = 0;
  player = new Player();
  enemies = [];
  particles = [];
  floatTexts = [];
  frameCount = 0;
  spawnInterval = 90;
  gameState = 'playing';
}

// ─── Main loop ────────────────────────────────────────────────────────────────
function loop() {
  animId = requestAnimationFrame(loop);
  frameCount++;

  // ── Background ──
  ctx.fillStyle = '#071425';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gradient depth overlay
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, 'rgba(30, 100, 160, 0.12)');
  grad.addColorStop(1, 'rgba(5, 20, 50, 0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  updateBubbles();
  drawBubbles();

  if (gameState === 'playing') {
    // Spawn enemies (faster over time)
    spawnInterval = Math.max(35, 90 - Math.floor(frameCount / 300) * 5);
    if (frameCount % spawnInterval === 0) {
      enemies.push(new EnemyFish(player.size));
    }

    player.update();

    // Update enemies & check collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.update();

      if (!e.active) { enemies.splice(i, 1); continue; }

      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      const threshold = e.size * 0.75 + player.size * 0.75;

      if (dist < threshold) {
        if (player.size > e.size * 1.1) {
          // Eat the fish
          for (let p = 0; p < 8; p++) particles.push(new Particle(e.x, e.y, e.color));
          floatTexts.push(new FloatText(e.x, e.y - e.size, `+${Math.ceil(e.size * 2)}`, '#fff'));
          player.eat(e.size);
          enemies.splice(i, 1);
        } else if (e.size > player.size * 1.1) {
          // Eaten by enemy
          for (let p = 0; p < 15; p++) particles.push(new Particle(player.x, player.y, player.color));
          highScore = Math.max(highScore, score);
          gameState = 'dead';
        }
      }
    }

    // Draw everything
    enemies.forEach(e => e.draw());
    player.draw();

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // Float texts
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      floatTexts[i].update();
      floatTexts[i].draw();
      if (floatTexts[i].life <= 0) floatTexts.splice(i, 1);
    }

    drawHUD();

  } else if (gameState === 'start') {
    // Animate some fish in background
    if (frameCount % 120 === 0) enemies.push(new EnemyFish(22));
    enemies = enemies.filter(e => e.active);
    enemies.forEach(e => { e.update(); e.draw(); });
    drawStartScreen();

  } else if (gameState === 'dead') {
    enemies.forEach(e => { e.update(); e.draw(); });
    particles.forEach(p => { p.update(); p.draw(); });
    particles = particles.filter(p => p.alpha > 0);
    drawDeadScreen();
  }
}

// ─── UI screens ───────────────────────────────────────────────────────────────
function drawHUD() {
  // Score
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(10, 10, 200, 55);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 18, 32);

  // Size bar
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(18, 40, 160, 8);
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(18, 40, (player.size / player.maxSize) * 160, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '11px Arial';
  ctx.fillText('SIZE', 185, 49);
}

function drawStartScreen() {
  ctx.fillStyle = 'rgba(0, 10, 25, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#4fc3f7';
  ctx.font = 'bold 58px Arial';
  ctx.fillText('FISH GAME', canvas.width / 2, canvas.height / 2 - 70);

  ctx.fillStyle = 'rgba(79, 195, 247, 0.3)';
  ctx.font = 'bold 58px Arial';
  ctx.fillText('FISH GAME', canvas.width / 2 + 2, canvas.height / 2 - 68);

  ctx.fillStyle = '#e0f7fa';
  ctx.font = '22px Arial';
  ctx.fillText('Eat smaller fish to grow.', canvas.width / 2, canvas.height / 2);
  ctx.fillText('Avoid bigger fish!', canvas.width / 2, canvas.height / 2 + 32);

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '16px Arial';
  ctx.fillText('Arrow Keys / WASD to move  •  Touch to play on mobile', canvas.width / 2, canvas.height / 2 + 78);

  ctx.fillStyle = '#4fc3f7';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('Click or press SPACE / ENTER to start', canvas.width / 2, canvas.height / 2 + 120);
}

function drawDeadScreen() {
  ctx.fillStyle = 'rgba(0, 5, 15, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff5252';
  ctx.font = 'bold 52px Arial';
  ctx.fillText('YOU WERE EATEN!', canvas.width / 2, canvas.height / 2 - 55);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 5);

  if (highScore > 0) {
    ctx.fillStyle = '#ffd740';
    ctx.font = '20px Arial';
    ctx.fillText(`Best: ${highScore}`, canvas.width / 2, canvas.height / 2 + 38);
  }

  ctx.fillStyle = '#4fc3f7';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('Click or press SPACE / ENTER to play again', canvas.width / 2, canvas.height / 2 + 90);
}

// ─── Start ────────────────────────────────────────────────────────────────────
loop();
