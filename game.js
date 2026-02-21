const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ─── Resize ───────────────────────────────────────────────────────────────────
function resize() {
  const maxW = 900, maxH = 560;
  const scale = Math.min(window.innerWidth / maxW, window.innerHeight / maxH, 1);
  canvas.width = maxW;
  canvas.height = maxH;
  canvas.style.width = Math.floor(maxW * scale) + 'px';
  canvas.style.height = Math.floor(maxH * scale) + 'px';
}
resize();
window.addEventListener('resize', resize);

// ─── Audio Engine ─────────────────────────────────────────────────────────────
let audioCtx = null;
let musicMaster = null;
let musicStarted = false;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function startBackgroundMusic() {
  if (musicStarted) return;
  musicStarted = true;
  const ac = getAudio();

  musicMaster = ac.createGain();
  musicMaster.gain.value = 0.1;
  musicMaster.connect(ac.destination);

  // Deep underwater drones
  [55, 82.41, 110].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = (i - 1) * 8;
    g.gain.value = 0.28;
    osc.connect(g);
    g.connect(musicMaster);
    osc.start();
  });

  // Gentle ambient melody
  const scale = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
  let idx = 0;
  function plink() {
    const ac2 = getAudio();
    const osc = ac2.createOscillator();
    const env = ac2.createGain();
    osc.type = 'sine';
    osc.frequency.value = scale[idx % scale.length] * (Math.random() > 0.7 ? 2 : 1);
    idx += Math.floor(Math.random() * 3) + 1;
    env.gain.setValueAtTime(0.001, ac2.currentTime);
    env.gain.linearRampToValueAtTime(0.08, ac2.currentTime + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, ac2.currentTime + 1.8);
    osc.connect(env);
    env.connect(musicMaster);
    osc.start();
    osc.stop(ac2.currentTime + 1.8);
    setTimeout(plink, 1400 + Math.random() * 2000);
  }
  setTimeout(plink, 800);
}

function playEatSound(fishSize) {
  const ac = getAudio();
  const baseFreq = Math.max(280, 620 - fishSize * 5);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.4, ac.currentTime + 0.07);
  gain.gain.setValueAtTime(0.45, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.2);
}

function playComboSound(combo) {
  const ac = getAudio();
  const freqs = [523.25, 659.25, 783.99, 1046.5];
  const f = freqs[Math.min(combo - 2, freqs.length - 1)];
  [0, 0.09].forEach((delay, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f * (i === 0 ? 1 : 1.5);
    gain.gain.setValueAtTime(0.3, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.28);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + 0.3);
  });
}

function playDeathSound() {
  const ac = getAudio();
  [0, 0.2, 0.4].forEach((delay, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200 - i * 30, ac.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + delay + 0.5);
    gain.gain.setValueAtTime(0.35, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.5);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + 0.55);
  });
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
const LB_KEY = 'fishgame_lb';

function loadLB() { return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); }

function saveLB(name, score, fishEaten) {
  const lb = loadLB();
  lb.push({ name, score, fish: fishEaten, date: new Date().toLocaleDateString() });
  lb.sort((a, b) => b.score - a.score);
  lb.splice(10);
  localStorage.setItem(LB_KEY, JSON.stringify(lb));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLB() {
  const lb = loadLB();
  const list = document.getElementById('lbList');
  const MEDALS = ['🥇', '🥈', '🥉'];
  if (lb.length === 0) {
    list.innerHTML = '<p class="lb-empty">No scores yet. Be the first!</p>';
    return;
  }
  list.innerHTML = lb.map((entry, i) => `
    <div class="lb-entry${i < 3 ? ` rank-${i + 1}` : ''}">
      <span class="lb-rank">${i < 3 ? MEDALS[i] : `#${i + 1}`}</span>
      <span class="lb-name">${escapeHtml(entry.name)}</span>
      <span class="lb-score">${Number(entry.score).toLocaleString()}</span>
      <span class="lb-meta">${Number(entry.fish)}🐟 · ${escapeHtml(entry.date)}</span>
    </div>`).join('');
}

// ─── Overlay Helpers ──────────────────────────────────────────────────────────
function lbIsVisible() {
  return !document.getElementById('lbOverlay').classList.contains('hidden');
}

function showNameOverlay() {
  touchTarget = null;
  for (const k in keys) keys[k] = false;  // clear stuck keys before overlay takes focus
  document.getElementById('nameOverlay').classList.remove('hidden');
  document.getElementById('lbOverlay').classList.add('hidden');
  if (gameState === 'playing') gameState = 'start';
  setTimeout(() => document.getElementById('nameInput').focus(), 50);
}

function showLeaderboard() {
  renderLB();
  document.getElementById('lbOverlay').classList.remove('hidden');
  document.getElementById('nameOverlay').classList.add('hidden');
}

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
  if ((e.key === ' ' || e.key === 'Enter') && gameState === 'dead' && !lbIsVisible()) startGame();
  if (e.key === 'Escape') showNameOverlay();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('click', () => {
  if (gameState === 'dead' && !lbIsVisible()) startGame();
});

let touchTarget = null;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (gameState === 'dead' && !lbIsVisible()) { startGame(); return; }
  if (gameState !== 'playing') return;
  const r = canvas.getBoundingClientRect();
  touchTarget = {
    x: (e.touches[0].clientX - r.left) * (canvas.width / r.width),
    y: (e.touches[0].clientY - r.top) * (canvas.height / r.height),
  };
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  touchTarget = {
    x: (e.touches[0].clientX - r.left) * (canvas.width / r.width),
    y: (e.touches[0].clientY - r.top) * (canvas.height / r.height),
  };
}, { passive: false });
canvas.addEventListener('touchend', () => { touchTarget = null; });

// ─── Draw Fish ────────────────────────────────────────────────────────────────
function drawFish(x, y, size, color, facingRight, mouthOpen = 0) {
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
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.58, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Body highlight
  ctx.beginPath();
  ctx.ellipse(-size * 0.05, -size * 0.15, size * 0.55, size * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();

  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, -size * 0.55);
  ctx.quadraticCurveTo(size * 0.2, -size * 0.98, size * 0.4, -size * 0.55);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();

  // Eye white
  ctx.beginPath();
  ctx.arc(size * 0.45, -size * 0.1, size * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Pupil
  ctx.beginPath();
  ctx.arc(size * 0.49, -size * 0.1, size * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();

  // Eye shine
  ctx.beginPath();
  ctx.arc(size * 0.44, -size * 0.15, size * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Mouth
  const mouthX = size * 0.88;
  const mouthY = size * 0.08;
  if (mouthOpen > 0.05) {
    const jawDrop = mouthOpen * size * 0.28;
    const halfW = size * 0.18;
    ctx.beginPath();
    ctx.moveTo(mouthX - halfW, mouthY);
    ctx.lineTo(mouthX + halfW * 0.4, mouthY - size * 0.06);
    ctx.lineTo(mouthX - halfW, mouthY + jawDrop);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 0, 0, 0.88)';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(mouthX - halfW * 0.3, mouthY + jawDrop * 0.6, halfW * 0.35, jawDrop * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#c62828';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(mouthX - size * 0.05, mouthY + size * 0.04, size * 0.13, 0.35, Math.PI - 0.35);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = Math.max(1, size * 0.055);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Tips ─────────────────────────────────────────────────────────────────────
const TIPS = [
  'Eat 3 fish quickly for a COMBO multiplier!',
  'Bigger fish eaten = more points!',
  'Your speed drops as you grow — use it wisely.',
  'Fish come from all directions — stay alert!',
  'A 6x COMBO triples your points per fish!',
];
let currentTip = 0;
let tipCycle = 0;

// ─── Player ───────────────────────────────────────────────────────────────────
class Player {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.size = 22;
    this.baseSpeed = 3.2;
    this.facingRight = true;
    this.color = '#4fc3f7';
    this.maxSize = 85;
    this.mouthTimer = 0;
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
        this.facingRight = dx >= 0;
      }
    } else {
      let dx = 0, dy = 0;
      if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx -= 1;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
      if (keys['ArrowUp']    || keys['w'] || keys['W']) dy -= 1;
      if (keys['ArrowDown']  || keys['s'] || keys['S']) dy += 1;

      if (dx !== 0 && dy !== 0) { dx /= Math.SQRT2; dy /= Math.SQRT2; }

      this.x += dx * this.speed;
      this.y += dy * this.speed;
      if (dx > 0) this.facingRight = true;
      else if (dx < 0) this.facingRight = false;
    }

    this.x = Math.max(this.size, Math.min(canvas.width  - this.size, this.x));
    this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));

    if (this.mouthTimer > 0) this.mouthTimer--;
  }

  draw() {
    const mouthOpen = this.mouthTimer > 0 ? Math.sin((this.mouthTimer / 20) * Math.PI) : 0;
    drawFish(this.x, this.y, this.size, this.color, this.facingRight, mouthOpen);
  }

  eat(fishSize) {
    this.size = Math.min(this.maxSize, this.size + fishSize * 0.12);
    this.mouthTimer = 20;
  }
}

// ─── Enemy Fish ───────────────────────────────────────────────────────────────
const FISH_COLORS = [
  '#ef5350', '#ab47bc', '#42a5f5', '#26a69a',
  '#ffca28', '#ff7043', '#66bb6a', '#ec407a', '#7c4dff',
];

class EnemyFish {
  constructor(playerSize) {
    const minSize = Math.max(8, playerSize * 0.28);
    const maxSize = Math.min(75, playerSize * 2.3);
    this.size = minSize + Math.random() * (maxSize - minSize);
    this.color = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
    this.active = true;
    this.mouthTimer = 0;

    const edge = Math.floor(Math.random() * 4);
    const m = this.size * 1.5;
    const speed = 0.9 + Math.random() * 1.6;
    const drift = (Math.random() - 0.5) * 1.3;

    if (edge === 0) {
      this.x = -m; this.y = m + Math.random() * (canvas.height - m * 2);
      this.vx = speed; this.vy = drift;
    } else if (edge === 1) {
      this.x = canvas.width + m; this.y = m + Math.random() * (canvas.height - m * 2);
      this.vx = -speed; this.vy = drift;
    } else if (edge === 2) {
      this.x = m + Math.random() * (canvas.width - m * 2); this.y = -m;
      this.vx = drift; this.vy = speed;
    } else {
      this.x = m + Math.random() * (canvas.width - m * 2); this.y = canvas.height + m;
      this.vx = drift; this.vy = -speed;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if ((this.y < this.size && this.vy < 0) || (this.y > canvas.height - this.size && this.vy > 0)) this.vy *= -1;

    if (this.mouthTimer > 0) this.mouthTimer--;

    const m = 120;
    if (this.x > canvas.width + m || this.x < -m || this.y > canvas.height + m || this.y < -m) {
      this.active = false;
    }
  }

  draw() {
    const facing = Math.abs(this.vx) >= Math.abs(this.vy) ? this.vx >= 0 : this.vx >= 0;
    const mouthOpen = this.mouthTimer > 0 ? Math.sin((this.mouthTimer / 20) * Math.PI) : 0;
    drawFish(this.x, this.y, this.size, this.color, facing, mouthOpen);
  }
}

// ─── Particles ────────────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = (Math.random() - 0.5) * 5;
    this.alpha = 1;
    this.r = Math.random() * 5 + 2;
    this.color = color;
  }
  update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.045; }
  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

// ─── Floating Text ────────────────────────────────────────────────────────────
class FloatText {
  constructor(x, y, text, color, size = 16) {
    this.x = x; this.y = y; this.text = text; this.color = color;
    this.fontSize = size; this.alpha = 1; this.vy = -1.5; this.life = 65;
  }
  update() { this.y += this.vy; this.life--; this.alpha = this.life / 65; }
  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
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

// ─── Game State ───────────────────────────────────────────────────────────────
let gameState = 'start';
let score = 0;
let highScore = 0;
let player = null;
let enemies = [];
let particles = [];
let floatTexts = [];
let frameCount = 0;
let spawnInterval = 90;

// Combo
let comboCount = 0;
let comboTimer = 0;
const COMBO_WINDOW = 150;

// Player identity & frenzy
let playerName = '';
let eatCount = 0;
let lastEatTime = 0;

function startGame() {
  for (const k in keys) keys[k] = false;  // clear any stuck keys from previous session
  startBackgroundMusic();
  score = 0;
  player = new Player();
  enemies = [];
  particles = [];
  floatTexts = [];
  frameCount = 0;
  spawnInterval = 90;
  comboCount = 0;
  comboTimer = 0;
  eatCount = 0;
  lastEatTime = 0;
  currentTip = Math.floor(Math.random() * TIPS.length);
  tipCycle = 0;
  gameState = 'playing';
  document.getElementById('nameOverlay').classList.add('hidden');
  document.getElementById('lbOverlay').classList.add('hidden');
}

// ─── Overlay Init ─────────────────────────────────────────────────────────────
document.getElementById('diveBtn').addEventListener('click', () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { document.getElementById('nameInput').focus(); return; }
  playerName = name;
  startGame();
});

document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('diveBtn').click();
});

document.getElementById('lbBtn').addEventListener('click', showLeaderboard);
document.getElementById('lbCloseBtn').addEventListener('click', showNameOverlay);
document.getElementById('switchBtn').addEventListener('click', showNameOverlay);

// Focus input on load
setTimeout(() => document.getElementById('nameInput').focus(), 100);

// ─── Main Loop ────────────────────────────────────────────────────────────────
function loop() {
  requestAnimationFrame(loop);
  frameCount++;

  // Background
  ctx.fillStyle = '#071425';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, 'rgba(30,100,160,0.12)');
  grad.addColorStop(1, 'rgba(5,20,50,0.26)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  updateBubbles();
  drawBubbles();

  // ── Playing ──
  if (gameState === 'playing') {
    const frenzyLvl = Math.floor(eatCount / 5);
    spawnInterval = Math.max(20, 90 - Math.floor(frameCount / 300) * 5 - frenzyLvl * 7);
    if (frameCount % spawnInterval === 0) enemies.push(new EnemyFish(player.size));

    player.update();

    if (comboTimer > 0) comboTimer--;
    else comboCount = 0;

    tipCycle++;
    if (tipCycle % 600 === 0) currentTip = (currentTip + 1) % TIPS.length;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.update();
      if (!e.active) { enemies.splice(i, 1); continue; }

      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < e.size * 0.75 + player.size * 0.75) {
        if (player.size > e.size * 1.1) {
          // ── Eat ──
          comboCount++;
          comboTimer = COMBO_WINDOW;
          eatCount++;

          // Speed bonus
          const now = performance.now();
          const gap = lastEatTime === 0 ? 99 : (now - lastEatTime) / 1000;
          lastEatTime = now;

          let speedMult = 1;
          let speedLabel = null;
          if      (gap < 0.4) { speedMult = 3;   speedLabel = '⚡ LIGHTNING! ×3'; }
          else if (gap < 1.0) { speedMult = 2;   speedLabel = '🔥 FAST! ×2'; }
          else if (gap < 2.0) { speedMult = 1.5; speedLabel = '×1.5'; }

          let pts = Math.ceil(e.size * 2 * speedMult);

          if (comboCount >= 3) {
            const mult = Math.min(comboCount, 6);
            pts = Math.ceil(pts * (1 + (mult - 2) * 0.5));
            floatTexts.push(new FloatText(
              player.x, player.y - player.size - 22,
              `${mult}x COMBO!`, '#ffd740', 22
            ));
            playComboSound(comboCount);
          }

          if (speedLabel) {
            floatTexts.push(new FloatText(e.x, e.y - e.size - 18, speedLabel, '#ff9800', 18));
          }

          // Frenzy
          const frenzyLevel = Math.floor(eatCount / 5);
          if (eatCount % 5 === 0) {
            floatTexts.push(new FloatText(
              canvas.width / 2, 120,
              `🐟 FEEDING FRENZY ×${frenzyLevel}`, '#ff9800', 26
            ));
          }

          const extraChance = [0, 0.25, 0.5, 0.7, 0.9][Math.min(frenzyLevel, 4)];
          let extra = 0;
          if (Math.random() < extraChance) extra++;
          if (frenzyLevel >= 3 && Math.random() < 0.4) extra++;
          for (let j = 0; j < extra; j++) enemies.push(new EnemyFish(player.size));

          score += pts;
          for (let p = 0; p < 8; p++) particles.push(new Particle(e.x, e.y, e.color));
          floatTexts.push(new FloatText(e.x, e.y - e.size, `+${pts}`, '#ffffff'));
          player.eat(e.size);
          playEatSound(e.size);
          enemies.splice(i, 1);

        } else if (e.size > player.size * 1.1) {
          // ── Eaten ──
          e.mouthTimer = 20;
          for (let p = 0; p < 16; p++) particles.push(new Particle(player.x, player.y, player.color));
          highScore = Math.max(highScore, score);
          playDeathSound();
          if (playerName) saveLB(playerName, score, eatCount);
          gameState = 'dead';
          setTimeout(() => { if (gameState === 'dead') showLeaderboard(); }, 1500);
        }
      }
    }

    enemies.forEach(e => e.draw());
    player.draw();

    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update(); particles[i].draw();
      if (particles[i].alpha <= 0) particles.splice(i, 1);
    }
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      floatTexts[i].update(); floatTexts[i].draw();
      if (floatTexts[i].life <= 0) floatTexts.splice(i, 1);
    }

    drawHUD();

  // ── Start screen ──
  } else if (gameState === 'start') {
    if (frameCount % 110 === 0) enemies.push(new EnemyFish(22));
    enemies = enemies.filter(e => e.active);
    enemies.forEach(e => { e.update(); e.draw(); });
    drawStartScreen();

  // ── Dead screen ──
  } else if (gameState === 'dead') {
    enemies.forEach(e => { e.update(); e.draw(); });
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update(); particles[i].draw();
      if (particles[i].alpha <= 0) particles.splice(i, 1);
    }
    drawDeadScreen();
  }
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD() {
  const hasName = playerName.length > 0;
  const panelH = hasName ? 76 : 60;

  // Score panel background
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(10, 10, 230, panelH);

  // Player name
  if (hasName) {
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`👤 ${playerName}`, 18, 26);
  }

  // Score
  const scoreY = hasName ? 44 : 32;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 18, scoreY);

  // Fish count
  ctx.fillStyle = '#ff9800';
  ctx.font = 'bold 12px Arial';
  ctx.fillText(`🐟 ×${eatCount}`, 156, scoreY);

  // Size bar
  const barY = hasName ? 56 : 42;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(18, barY, 162, 9);
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(18, barY, (player.size / player.maxSize) * 162, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '11px Arial';
  ctx.fillText('SIZE', 187, barY + 9);

  // Frenzy badge (below score panel)
  const frenzyLevel = Math.floor(eatCount / 5);
  if (frenzyLevel > 0) {
    const fy = 10 + panelH + 4;
    ctx.fillStyle = 'rgba(180,80,0,0.5)';
    ctx.fillRect(10, fy, 160, 20);
    ctx.fillStyle = '#ff9800';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`🐟 FRENZY ×${frenzyLevel}`, 90, fy + 14);
  }

  // Combo badge
  if (comboCount >= 2) {
    const cw = 130;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(canvas.width / 2 - cw / 2, 8, cw, 34);
    ctx.fillStyle = '#ffd740';
    ctx.font = `bold ${16 + Math.min(comboCount, 6)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`${comboCount}x COMBO`, canvas.width / 2, 32);
  }

  // Pro-tip bar at bottom
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = '#ffd740';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('PRO TIP:', 10, canvas.height - 9);
  ctx.fillStyle = '#e0f7fa';
  ctx.font = '12px Arial';
  ctx.fillText(TIPS[currentTip], 82, canvas.height - 9);
}

// ─── Screens ──────────────────────────────────────────────────────────────────
function drawStartScreen() {
  ctx.fillStyle = 'rgba(0,10,25,0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#4fc3f7';
  ctx.font = 'bold 58px Arial';
  ctx.fillText('FISH GAME', canvas.width / 2, canvas.height / 2 - 72);

  ctx.fillStyle = '#e0f7fa';
  ctx.font = '22px Arial';
  ctx.fillText('Eat smaller fish to grow.  Avoid bigger fish!', canvas.width / 2, canvas.height / 2 - 14);

  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = '16px Arial';
  ctx.fillText('Arrow Keys / WASD to move  •  Touch on mobile', canvas.width / 2, canvas.height / 2 + 26);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(canvas.width / 2 - 320, canvas.height / 2 + 50, 640, 32);
  ctx.fillStyle = '#ffd740';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(`PRO TIP: ${TIPS[0]}`, canvas.width / 2, canvas.height / 2 + 71);
}

function drawDeadScreen() {
  ctx.fillStyle = 'rgba(0,5,15,0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff5252';
  ctx.font = 'bold 52px Arial';
  ctx.fillText('YOU WERE EATEN!', canvas.width / 2, canvas.height / 2 - 58);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 2);

  if (highScore > 0) {
    ctx.fillStyle = '#ffd740';
    ctx.font = '20px Arial';
    ctx.fillText(`Best: ${highScore}`, canvas.width / 2, canvas.height / 2 + 36);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(canvas.width / 2 - 320, canvas.height / 2 + 58, 640, 30);
  ctx.fillStyle = '#ffd740';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(`PRO TIP: ${TIPS[(currentTip + 1) % TIPS.length]}`, canvas.width / 2, canvas.height / 2 + 78);

  ctx.fillStyle = '#4fc3f7';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('Click or SPACE to play again  •  ESC = Switch Player', canvas.width / 2, canvas.height / 2 + 115);
}

// ─── Go ───────────────────────────────────────────────────────────────────────
loop();
