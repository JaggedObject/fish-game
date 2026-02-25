// ─── Draw Fish ────────────────────────────────────────────────────────────────
function drawFish(x, y, size, color, facingRight, mouthOpen = 0, angryEyes = false) {
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
  ctx.fillStyle = angryEyes ? '#cc0000' : '#111';
  ctx.fill();

  // Eye shine
  ctx.beginPath();
  ctx.arc(size * 0.44, -size * 0.15, size * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Angry eyebrow
  if (angryEyes) {
    ctx.beginPath();
    ctx.moveTo(size * 0.28, -size * 0.33);
    ctx.lineTo(size * 0.63, -size * 0.22);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = Math.max(1.5, size * 0.07);
    ctx.lineCap = 'round';
    ctx.stroke();
  }

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
    let s = Math.max(1.6, this.baseSpeed - (this.size - 22) * 0.018);
    if (speedDebuffTimer > 0) s /= 1.5;
    if (speedBuffTimer > 0) s *= 1.5;
    return s;
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

    this.x = Math.max(this.size, Math.min(WORLD_W - this.size, this.x));
    this.y = Math.max(this.size, Math.min(WORLD_H - this.size, this.y));

    if (this.mouthTimer > 0) this.mouthTimer--;
  }

  draw() {
    if (immunityBuffTimer > 0) {
      ctx.save();
      ctx.shadowColor = '#ffd740';
      ctx.shadowBlur = 18 + Math.sin(frameCount * 0.18) * 8;
      ctx.strokeStyle = `rgba(255,215,64,${(0.5 + 0.3 * Math.sin(frameCount * 0.15)).toFixed(3)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.size * 1.45, this.size * 1.0, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
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
    this.toxic = Math.random() < 0.15;
    this.debuff = !this.toxic && Math.random() < 0.12;
    this.color = this.toxic
      ? '#ce93d8'
      : this.debuff
        ? '#8d6e63'
        : FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
    this.active = true;
    this.mouthTimer = 0;

    const edge = Math.floor(Math.random() * 4);
    const m = this.size * 1.5;
    const speed = 0.9 + Math.random() * 1.6;
    const drift = (Math.random() - 0.5) * 1.3;
    const vw = canvas.width, vh = canvas.height;

    if (edge === 0) {
      this.x = camera.x - m;           this.y = camera.y + m + Math.random() * (vh - m * 2);
      this.vx = speed; this.vy = drift;
    } else if (edge === 1) {
      this.x = camera.x + vw + m;      this.y = camera.y + m + Math.random() * (vh - m * 2);
      this.vx = -speed; this.vy = drift;
    } else if (edge === 2) {
      this.x = camera.x + m + Math.random() * (vw - m * 2); this.y = camera.y - m;
      this.vx = drift; this.vy = speed;
    } else {
      this.x = camera.x + m + Math.random() * (vw - m * 2); this.y = camera.y + vh + m;
      this.vx = drift; this.vy = -speed;
    }
    this.x = Math.max(m, Math.min(WORLD_W - m, this.x));
    this.y = Math.max(m, Math.min(WORLD_H - m, this.y));
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if ((this.y < this.size && this.vy < 0) || (this.y > WORLD_H - this.size && this.vy > 0)) this.vy *= -1;

    if (this.mouthTimer > 0) this.mouthTimer--;

    const m = 200;
    if (this.x > camera.x + canvas.width  + m || this.x < camera.x - m ||
        this.y > camera.y + canvas.height + m || this.y < camera.y - m) {
      this.active = false;
    }
  }

  draw() {
    const facing = Math.abs(this.vx) >= Math.abs(this.vy) ? this.vx >= 0 : this.vx >= 0;
    const mouthOpen = this.mouthTimer > 0 ? Math.sin((this.mouthTimer / 20) * Math.PI) : 0;
    if (this.toxic) {
      ctx.save();
      ctx.shadowColor = '#ab47bc';
      ctx.shadowBlur = 14 + Math.sin(frameCount * 0.12) * 6;
      drawFish(this.x, this.y, this.size, this.color, facing, mouthOpen);
      ctx.restore();
      ctx.save();
      ctx.font = `bold ${Math.round(this.size * 0.55)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('☠', this.x, this.y + this.size * 0.18);
      ctx.restore();
    } else if (this.debuff) {
      ctx.save();
      ctx.shadowColor = '#5d4037';
      ctx.shadowBlur = 14 + Math.sin(frameCount * 0.12) * 6;
      drawFish(this.x, this.y, this.size, this.color, facing, mouthOpen);
      ctx.restore();
      ctx.save();
      ctx.font = `bold ${Math.round(this.size * 0.55)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('⚠', this.x, this.y + this.size * 0.18);
      ctx.restore();
    } else {
      drawFish(this.x, this.y, this.size, this.color, facing, mouthOpen);
    }
  }
}

// ─── Shark ────────────────────────────────────────────────────────────────────
class Shark {
  constructor() {
    this.size = 96;
    this.color = '#455a64';
    this.x = -130;
    this.y = Math.random() * canvas.height;
    this.facingRight = true;
    this.active = true;
  }

  get speed() {
    return 1.4 + Math.floor(eatCount / 5) * 0.15;
  }

  update() {
    if (!player) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
    this.facingRight = dx >= 0;

    const m = 200;
    if (this.x < -m || this.x > canvas.width + m ||
        this.y < -m || this.y > canvas.height + m) {
      this.active = false;
    }
  }

  draw() {
    ctx.save();
    ctx.shadowColor = 'rgba(255,50,50,0.5)';
    ctx.shadowBlur = 18;
    drawFish(this.x, this.y, this.size, this.color, this.facingRight, 0, true);
    ctx.restore();
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

// ─── Fish Food ────────────────────────────────────────────────────────────────
class FishFood {
  constructor(clusterX) {
    const cx = clusterX !== undefined ? clusterX : 100 + Math.random() * (WORLD_W - 200);
    this.x = Math.max(50, Math.min(WORLD_W - 50, cx + (Math.random() - 0.5) * 70));
    this.y = -5 - Math.random() * 20;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = 0.5 + Math.random() * 0.4;
    this.size = 12;
    this.active = true;
    this.alpha = 1;
    this.dissolving = false;
  }

  update() {
    if (this.dissolving) {
      this.alpha -= 0.03;
      if (this.alpha <= 0) this.active = false;
      return;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.y >= WORLD_H) {
      this.y = WORLD_H;
      this.vy = 0;
      this.dissolving = true;
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.shadowColor = '#ffb74d';
    ctx.shadowBlur = 10 + Math.sin(frameCount * 0.1) * 4;
    const offsets = [[-5, -4], [4, -5], [0, 1], [-4, 5], [5, 3]];
    ctx.fillStyle = '#c68642';
    for (const [ox, oy] of offsets) {
      ctx.beginPath();
      ctx.ellipse(this.x + ox, this.y + oy, 3.5, 2.5, Math.atan2(oy, ox), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 3, 2, 0, 0, Math.PI * 2);
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
