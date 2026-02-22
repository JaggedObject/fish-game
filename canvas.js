// ─── Canvas & Resize ──────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

// ─── World Dimensions ─────────────────────────────────────────────────────────
const WORLD_W = 4500;
const WORLD_H = 2800;
