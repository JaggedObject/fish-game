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

// Hunger
const MAX_HUNGER = 420;
let hunger = MAX_HUNGER;

// Shark
let shark = null;
let sharkRespawnTimer = 0;

// Toxic
let poisonFlash = 0;

// ─── Start Game ───────────────────────────────────────────────────────────────
function startGame() {
  for (const k in keys) keys[k] = false;
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
  hunger = MAX_HUNGER;
  shark = null;
  sharkRespawnTimer = 0;
  poisonFlash = 0;
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

  drawLightRays();
  drawCoralLayer(coralBack);
  drawCoralLayer(coralMid, Math.sin(frameCount * 0.0008) * 3);
  drawSeaweed();
  updateBubbles();
  drawBubbles();

  // ── Playing ──
  if (gameState === 'playing') {
    const frenzyLvl = Math.floor(eatCount / 5);
    spawnInterval = Math.max(20, 90 - Math.floor(frameCount / 300) * 5 - frenzyLvl * 7);
    if (frameCount % spawnInterval === 0) enemies.push(new EnemyFish(player.size));

    // Shark spawn
    if (!shark) {
      if (sharkRespawnTimer > 0) {
        sharkRespawnTimer--;
      } else if (frenzyLvl >= 2 || frameCount > 3600) {
        shark = new Shark();
        floatTexts.push(new FloatText(canvas.width / 2, 80, '🦈 SHARK!', '#ff5252', 28));
      }
    }

    player.update();

    // Hunger decay — bigger fish starve faster
    const decayRate = 0.3 + (player.size - 22) / 85 * 0.4;
    hunger -= decayRate;
    if (hunger <= 0) {
      hunger = 0;
      player.size -= 0.08;
      if (frameCount % 120 === 0) {
        floatTexts.push(new FloatText(player.x, player.y - player.size - 30, 'STARVING!', '#ff1744', 22));
      }
      if (player.size < 12 && gameState === 'playing') {
        for (let p = 0; p < 16; p++) particles.push(new Particle(player.x, player.y, player.color));
        highScore = Math.max(highScore, score);
        playDeathSound();
        if (playerName) saveLB(playerName, score, eatCount);
        gameState = 'dead';
        setTimeout(() => { if (gameState === 'dead') showLeaderboard(); }, 1500);
      }
    }

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

          if (e.toxic) {
            player.size = Math.max(12, player.size - player.size * 0.18);
            player.mouthTimer = 20;
            score += Math.ceil(e.size * 0.5);
            poisonFlash = 18;
            floatTexts.push(new FloatText(e.x, e.y - e.size, '☠ TOXIC!', '#ce93d8', 20));
            playToxicSound();
          } else {
            score += pts;
            for (let p = 0; p < 8; p++) particles.push(new Particle(e.x, e.y, e.color));
            floatTexts.push(new FloatText(e.x, e.y - e.size, `+${pts}`, '#ffffff'));
            player.eat(e.size);
            playEatSound(e.size);
          }
          hunger = MAX_HUNGER;
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

    // Poison flash overlay
    if (poisonFlash > 0) {
      ctx.fillStyle = `rgba(171,71,188,${(poisonFlash / 18 * 0.28).toFixed(3)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      poisonFlash--;
    }

    // Shark update + collision
    if (shark) {
      shark.update();
      if (!shark.active) {
        shark = null;
        sharkRespawnTimer = 900;
      } else {
        shark.draw();
        const sharkDist = Math.hypot(shark.x - player.x, shark.y - player.y);
        if (sharkDist < shark.size * 0.6 + player.size * 0.75 && gameState === 'playing') {
          for (let p = 0; p < 16; p++) particles.push(new Particle(player.x, player.y, player.color));
          highScore = Math.max(highScore, score);
          playDeathSound();
          if (playerName) saveLB(playerName, score, eatCount);
          gameState = 'dead';
          setTimeout(() => { if (gameState === 'dead') showLeaderboard(); }, 1500);
        }
      }
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

// ─── Go ───────────────────────────────────────────────────────────────────────
loop();
