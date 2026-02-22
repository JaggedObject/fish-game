// ─── Tips ─────────────────────────────────────────────────────────────────────
const TIPS = [
  'Eat 3 fish quickly for a COMBO multiplier!',
  'Bigger fish eaten = more points!',
  'Your speed drops as you grow — use it wisely.',
  'Fish come from all directions — stay alert!',
  'A 6x COMBO triples your points per fish!',
  'Keep eating — big fish starve faster!',
  'A shark is hunting you — you cannot eat it, only outrun it!',
  'Purple glowing fish are TOXIC — they shrink you!',
];
let currentTip = 0;
let tipCycle = 0;

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD() {
  const hasName = playerName.length > 0;
  const panelH = hasName ? 90 : 74;

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

  // Hunger bar
  const hungerY = barY + 14;
  const hungerRatio = hunger / MAX_HUNGER;
  const isLow = hungerRatio < 0.25;
  const hungerColor = isLow
    ? `rgba(255,${Math.floor(50 + 50 * Math.abs(Math.sin(frameCount * 0.2)))},50,0.9)`
    : '#ff9800';
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(18, hungerY, 162, 9);
  ctx.fillStyle = hungerColor;
  ctx.fillRect(18, hungerY, hungerRatio * 162, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '11px Arial';
  ctx.fillText('FOOD', 187, hungerY + 9);

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
