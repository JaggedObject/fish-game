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
  for (const k in keys) keys[k] = false;
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
