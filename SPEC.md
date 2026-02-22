# Fish Game — Specification

> Documents the game as currently built. Use this as the source of truth when planning new features.

---

## Overview

A browser-based 2D survival game. You play as a fish: eat smaller fish to grow, avoid larger ones. Built with vanilla JS and HTML Canvas — no frameworks, no build step.

**File structure**
```
index.html   — HTML shell + UI overlays
style.css    — Overlay, panel, and button styles
game.js      — All game logic (~817 lines, single flat file)
```

**Entry point:** Open `index.html` directly in a browser.

---

## Canvas & Rendering

- Canvas resolution: **900 × 560** (fixed internal)
- CSS-scaled to fit the viewport (scale ≤ 1, letterboxed)
- Background: dark navy (`#071425`) with a subtle blue gradient overlay
- 22 ambient bubbles drift upward continuously

---

## Game States

| State | Description |
|-------|-------------|
| `'start'` | Name entry overlay visible; decorative fish swim in background |
| `'playing'` | Active gameplay |
| `'dead'` | Death screen shown; leaderboard auto-appears after 1.5 s |

---

## Screens & UI

### Name Entry Overlay (`#nameOverlay`)
- Shown on load and when ESC / "Switch Player" is pressed
- Text input: max 18 characters, auto-focused
- **DIVE IN** button starts the game (also triggered by Enter key)
- **Leaderboard** button opens the leaderboard overlay

### Leaderboard Overlay (`#lbOverlay`)
- Shows top 10 all-time scores from `localStorage` (`fishgame_lb`)
- Columns: rank (medal/number), player name, score, fish eaten, date
- Gold / Silver / Bronze left-border highlights for top 3
- **← Back** button returns to name entry
- Auto-shown 1.5 s after death (if still in `dead` state)

### Switch Player Button (`#switchBtn`)
- Fixed top-right corner, always visible during play
- Returns to name entry overlay (clears stuck keys, nulls touch target)

### Start Screen (canvas)
- Rendered under the name overlay when `gameState === 'start'`
- Title, tagline, controls hint, one rotating pro tip

### Dead Screen (canvas)
- Shown when `gameState === 'dead'` (overlay appears on top after 1.5 s)
- Shows current score, session best (`highScore`)
- "Click or SPACE to play again • ESC = Switch Player"
- Click / Space / Touch restarts as the same player (without re-entering name)

---

## Player

| Property | Value |
|----------|-------|
| Start size | 22 |
| Max size | 85 |
| Start position | Canvas center |
| Base speed | 3.2 px/frame |
| Min speed | 1.6 px/frame |
| Color | `#4fc3f7` (light blue) |

**Speed formula:** `max(1.6, 3.2 − (size − 22) × 0.018)` — player slows as they grow.

**Growth on eat:** `size += fishSize × 0.12` (capped at max size 85)

**Mouth animation:** Opens for 20 frames after eating, animates with `sin()`.

---

## Controls

| Input | Action |
|-------|--------|
| Arrow keys / WASD | Move in 8 directions (diagonal normalized) |
| Touch drag | Move toward touch point |
| Space / Enter (dead screen) | Restart game |
| ESC | Open name entry (Switch Player) |
| Click canvas (dead screen) | Restart game |

---

## Enemy Fish

- Spawn from a random edge (left, right, top, bottom) off-screen
- Size range: `max(8, playerSize × 0.28)` → `min(75, playerSize × 2.3)`
- Speed: `0.9 – 2.5` px/frame (random), with a perpendicular drift component
- Bounce off top/bottom edges; removed when 120 px past any edge
- 9 possible colors (red, purple, blue, teal, yellow, orange, green, pink, violet)
- Also have mouth animation when they eat the player

---

## Collision & Eating Rules

| Condition | Result |
|-----------|--------|
| `playerSize > enemySize × 1.1` | Player eats enemy → score, growth, particles, sound |
| `enemySize > playerSize × 1.1` | Enemy eats player → death |
| Within 10% size difference | No interaction (pass through) |

Collision detection: circle overlap using `Math.hypot`, radii at 75% of size.

---

## Scoring

**Base points per eat:**
```
pts = ceil(enemySize × 2 × speedMult)
```

**Speed multiplier** (time since last eat):
| Gap | Multiplier | Label shown |
|-----|-----------|-------------|
| < 0.4 s | ×3 | ⚡ LIGHTNING! ×3 |
| < 1.0 s | ×2 | 🔥 FAST! ×2 |
| < 2.0 s | ×1.5 | ×1.5 |
| ≥ 2.0 s | ×1 | (none) |

**Combo multiplier** (stacks on top of speed mult):
- Combo window: 150 frames (~2.5 s)
- Combo activates at 3+ consecutive eats within the window
- Bonus: `pts × (1 + (min(combo, 6) − 2) × 0.5)`
- Max effective multiplier: 6× combo → pts × 3

**High score** is tracked in-session (not persisted to localStorage separately).

---

## Frenzy System

- `eatCount` tracks total fish eaten this session
- **Frenzy level** = `floor(eatCount / 5)` (max meaningful level: 4)
- Every 5 fish eaten: "FEEDING FRENZY ×N" float text shown at top-center

**Spawn interval** (frames between spawns):
```
max(20, 90 − floor(frameCount / 300) × 5 − frenzyLevel × 7)
```
Starts at 90 frames, ramps down with time and frenzy level, floors at 20.

**Extra fish on eat** (by frenzy level):
| Level | Extra spawn chance |
|-------|--------------------|
| 0 | 0% |
| 1 | 25% |
| 2 | 50% |
| 3 | 70% + 40% chance of a second extra |
| 4+ | 90% + 40% chance of a second extra |

---

## Audio (Web Audio API)

All audio is procedurally generated — no audio files.

| Sound | Trigger | Description |
|-------|---------|-------------|
| Background music | First interaction | Deep sine drones (55, 82, 110 Hz) + random ambient melody plinks |
| Eat sound | Eat an enemy | Rising sine chirp; pitch varies inversely with fish size |
| Combo sound | Combo ≥ 2 | Two-note triangle wave jingle; pitch rises with combo count |
| Death sound | Player eaten | Three descending sawtooth bursts |

Music master gain: 0.1 (quiet ambient). AudioContext resumed on first user gesture.

---

## HUD (during gameplay)

Top-left panel:
- Player name (if set)
- Score
- Fish eaten count (🐟 ×N)
- Size bar (progress toward max size)
- Frenzy badge (shown when frenzyLevel > 0)

Top-center:
- Combo badge (shown when combo ≥ 2, font size grows with combo)

Bottom bar:
- Rotating pro tips (cycle every 600 frames / ~10 s)

---

## Leaderboard Storage

- Key: `fishgame_lb` in `localStorage`
- Max entries: 10 (sorted by score descending, oldest removed)
- Entry fields: `name`, `score`, `fish` (eat count), `date`
- Names are HTML-escaped before rendering (`escapeHtml()`)

---

## Particles & Float Text

**Particles** (on eat or death):
- 8 particles on eat (enemy color), 16 on death (player color)
- Random velocity ±2.5 px/frame each axis, fade over ~22 frames

**Float text:**
- "+N" points: white, size 16, floats upward over 65 frames
- Speed/combo labels: orange/yellow, size 18–22
- Frenzy announcement: orange, size 26, shown at top-center

---

## Known Constraints / Design Notes

- `game.js` is one flat global-scope file; no modules
- Enemy fish facing direction uses velocity components (not always accurate for diagonal movers)
- `highScore` resets on page reload (not persisted)
- Leaderboard is device-local (localStorage only)
- Start screen fish spawn every 110 frames with fixed size 22 (not scaled to anything)

---

---

# Feature Wave 2 — Large World + Depth Zones

## Architecture Changes

### World & Camera
- **World size:** `WORLD_W = 4500`, `WORLD_H = 2800` (constants in `canvas.js`, loaded first)
- **Camera:** `{ x, y }` global in `game.js` — top-left corner of viewport in world space
- **Camera update** (each frame, playing state only):
  ```
  camera.x = clamp(player.x − canvas.width/2,  0, WORLD_W − canvas.width)
  camera.y = clamp(player.y − canvas.height/2, 0, WORLD_H − canvas.height)
  ```
- **Rendering split:**
  - Screen-space (no translate): background gradient, light rays, bubbles, HUD, poison flash, screen overlays
  - World-space (inside `ctx.save/translate(-camera.x, -camera.y)/restore`): coral, seaweed, enemies, player, particles, float texts, shark
- **Player start position:** world center `(WORLD_W/2, WORLD_H/2)` = `(2250, 1400)`
- **Player boundary:** clamped to world bounds instead of canvas bounds
- **Enemy spawn:** from camera viewport edges in world space; culled when >200px outside viewport

### Background Elements (world-space, spread across full world)
- **Coral back:** 45 clusters, `x: 0→WORLD_W`, `y: WORLD_H−100 → WORLD_H`
- **Coral mid:** 30 clusters, `x: 0→WORLD_W`, `y: WORLD_H−160 → WORLD_H−40`
- **Seaweed:** 60 plants, `x: 0→WORLD_W`, `baseY: WORLD_H` (ocean floor)
- All draw functions apply **frustum culling** (skip if outside camera viewport)

## Depth Zones (Option D)

`depthRatio = player.y / WORLD_H` (0 = surface, 1 = abyss)

| Zone | depthRatio | Background base color | Notes |
|------|-----------|----------------------|-------|
| Surface | 0–0.2 | `rgb(7,35,60)` | Light rays visible |
| Mid | 0.2–0.6 | `rgb(7,20,37)` | Current look |
| Deep | 0.6–0.85 | `rgb(4,10,22)` | Darker blue |
| Abyss | 0.85–1.0 | `rgb(2,5,12)` | Near black |

- Background color lerps smoothly between surface and abyss colors
- Light rays only drawn when `depthRatio < 0.3`
- **Depth meter** in HUD bottom-right: shows `⬇ Nm` (rounded to 10m)
- Start screen uses `depthRatio = 0` (surface look)

## File Change Summary
| File | Change |
|------|--------|
| `canvas.js` | Add `WORLD_W`, `WORLD_H` constants |
| `game.js` | Add camera global; restructure loop for translate; depth-aware background |
| `entities.js` | Player boundary → world; EnemyFish spawn/cull → camera-relative |
| `background.js` | Spread elements across world; add frustum culling |
| `hud.js` | Add depth meter |

## Deep Fish Variants (Wave 2 — Session 2, deferred)
- Deep zone (depthRatio > 0.6): larger, slower, darker fish
- Abyss (depthRatio > 0.85): bioluminescent fish (glow outline, no fill)

---

---

# Planned Enhancements (Wave 1 — complete)

Five features planned together. Implement in this order (each is self-contained):

1. Hunger / Shrink Mechanic
2. Seaweed + Light Rays
3. Shark Apex Predator
4. Parallax Coral Background
5. Toxic Fish

---

## Feature 1 — Hunger / Shrink Mechanic

**Goal:** Remove the invincibility of large fish by making them need to keep eating.

### New globals
```js
let hunger    = 420;   // current hunger (frames of food remaining)
const MAX_HUNGER = 420; // ~7 s at 60 fps
```

### Hunger decay (each frame while playing)
```
decayRate = 0.3 + (player.size - 22) / 85 * 0.4
hunger -= decayRate
```
Bigger fish decay faster (range: 0.3 → 0.7 per frame). At max size, food runs out in ~4 s.

### Starvation shrink
When `hunger <= 0`:
- `player.size -= 0.08` per frame
- If `player.size < 12` → trigger death (same flow as being eaten)

### On eat
- `hunger = MAX_HUNGER` (fully restored)
- `startGame()` resets `hunger = MAX_HUNGER`

### HUD changes
- Add a **hunger bar** below the size bar in the top-left panel (orange fill)
- When `hunger < MAX_HUNGER * 0.25`: bar turns red and pulses (opacity flicker using `sin(frameCount * 0.2)`)
- Float text "STARVING!" in red when hunger first hits 0

### New pro tip to add
- `'Keep eating — big fish starve faster!'`

---

## Feature 2 — Seaweed + Light Rays

**Goal:** Enrich the visual atmosphere with animated underwater elements. No gameplay impact.

### Rendering order (revised)
1. Background gradient (existing)
2. **Light rays** ← new
3. **Coral / seaweed** ← new (Feature 4)
4. Bubbles (existing)
5. Fish, particles, float texts (existing)
6. HUD (existing)

### Light rays
Generate once (or at start of each game):
```js
const lightRays = Array.from({ length: 5 }, (_, i) => ({
  x:     100 + i * 170 + (Math.random() - 0.5) * 80,
  width: 40 + Math.random() * 60,
  phase: Math.random() * Math.PI * 2,   // for opacity animation
}));
```

Draw each frame (before bubbles):
- Fill a trapezoid from `(x - width/2, 0)` to `(x + width/2, 0)` narrowing to a point at `y = canvas.height`
- Use a vertical `createLinearGradient`: `rgba(255,255,255,0.06)` → `rgba(255,255,255,0)`
- Opacity multiplied by `0.7 + 0.3 * sin(frameCount * 0.008 + phase)`

### Seaweed
Generate 12 plants along the bottom at game start:
```js
const seaweedPlants = Array.from({ length: 12 }, () => ({
  x:          30 + Math.random() * (canvas.width - 60),
  height:     40 + Math.random() * 70,      // total plant height
  segments:   4 + Math.floor(Math.random() * 4),
  swayOffset: Math.random() * Math.PI * 2,
  swaySpeed:  0.025 + Math.random() * 0.02,
  color:      `hsl(${130 + Math.random() * 30}, 55%, ${18 + Math.random() * 12}%)`,
}));
```

Draw each plant as a chain of quadratic bezier curves bottom-up:
- Each segment control point offset: `sin(frameCount * swaySpeed + swayOffset) * segmentIdx * 6`
- Stroke only (lineWidth 3–5, color from plant), no fill
- `drawSeaweed()` called in the game loop after light rays

---

## Feature 3 — Shark Apex Predator

**Goal:** A persistent threat that cannot be eaten, forcing the player to keep moving.

### New global
```js
let shark = null;          // Shark instance or null
let sharkRespawnTimer = 0; // counts down frames until next spawn attempt
```

### Shark class
```js
class Shark {
  constructor() {
    this.size  = 96;
    this.color = '#455a64';  // dark blue-grey
    this.x     = -120;
    this.y     = Math.random() * canvas.height;
    this.facingRight = true;
    this.active = true;
  }

  get speed() {
    const frenzyLvl = Math.floor(eatCount / 5);
    return 1.4 + frenzyLvl * 0.15;  // 1.4 → 2.0 across frenzy levels
  }

  update() {
    if (!player) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
    this.facingRight = dx >= 0;

    // Deactivate if far off-screen (player led it out of bounds)
    const m = 200;
    if (this.x < -m || this.x > canvas.width + m ||
        this.y < -m || this.y > canvas.height + m) {
      this.active = false;
      sharkRespawnTimer = 900; // 15 s before re-spawn attempt
    }
  }

  draw() {
    // Reuse drawFish with a red warning glow halo before drawing
    ctx.save();
    ctx.shadowColor = 'rgba(255, 50, 50, 0.5)';
    ctx.shadowBlur  = 18;
    drawFish(this.x, this.y, this.size, this.color, this.facingRight, 0);
    ctx.restore();
  }
}
```

### Spawn logic (inside game loop, `playing` state)
```js
if (!shark) {
  if (sharkRespawnTimer > 0) {
    sharkRespawnTimer--;
  } else if (Math.floor(eatCount / 5) >= 2 || frameCount > 3600) {
    shark = new Shark();
    floatTexts.push(new FloatText(canvas.width/2, 80, '🦈 SHARK!', '#ff5252', 28));
  }
}
if (shark) {
  shark.update();
  if (!shark.active) { shark = null; }
  else {
    shark.draw();
    // Collision: any overlap = instant death
    const dist = Math.hypot(shark.x - player.x, shark.y - player.y);
    if (dist < shark.size * 0.6 + player.size * 0.75) {
      // trigger death (same as being eaten)
    }
  }
}
```

### Reset on `startGame()`
```js
shark = null;
sharkRespawnTimer = 0;
```

### New pro tip to add
- `'A shark is hunting you — you cannot eat it, only outrun it!'`

---

## Feature 4 — Parallax Coral Background

**Goal:** Make the ocean feel alive and textured with static-but-rich background scenery.

### Two coral layers
Generate once at game start (or module-level as constants):

**Back layer** — 9 clusters, bottom 18% of canvas (`y: 460–560`), small and dark:
```js
const coralBack = generateCoralLayer(9, 460, 560, 0.6);
```

**Mid layer** — 6 clusters, bottom 28% (`y: 400–560`), medium and slightly lighter:
```js
const coralMid = generateCoralLayer(6, 400, 520, 0.85);
```

### `generateCoralLayer(count, yMin, yMax, brightness)`
Returns an array of cluster objects:
```js
{ x, y, type, size, hue, brightness }
```
- `type`: `'fan'` | `'tube'` | `'brain'`
- `hue`: random from `[0, 30, 270, 300]` (red-orange, purple, pink)
- `size`: back 14–28, mid 22–42

### Drawing coral types (in `drawCoral(cluster)`)

**Fan coral:**
- 7 arcs radiating from base point, each a `quadraticCurveTo` curving left/right
- Stroke only, lineWidth 2, color `hsl(hue, 60%, 22% * brightness)`

**Tube coral:**
- 3–5 `roundRect` (or arc-capped rectangles) of varying heights grouped at `x`
- Fill `hsl(hue, 50%, 18% * brightness)`

**Brain coral:**
- Filled circle base
- 4–6 short wavy strokes across the surface using `sin()`

### Draw order in loop
```
drawCoralLayer(coralBack);   // before mid layer
drawCoralLayer(coralMid);
```
Both drawn after light rays, before seaweed, before bubbles.

### Gentle ambient drift (optional)
Apply `ctx.translate(sin(frameCount * 0.0008) * 3, 0)` to mid layer only — barely perceptible slow sway.

---

## Feature 5 — Toxic Fish

**Goal:** Add a risk-reward element. Toxic fish look tempting but punish careless eating.

### EnemyFish changes
In `EnemyFish` constructor, add:
```js
this.toxic = Math.random() < 0.15;   // 15% spawn chance
if (this.toxic) this.color = '#ce93d8';  // override to light purple
```

### Visual distinction
In `EnemyFish.draw()`, before calling `drawFish()`:
```js
if (this.toxic) {
  ctx.save();
  ctx.shadowColor = '#ab47bc';
  ctx.shadowBlur  = 14 + Math.sin(frameCount * 0.12) * 6;  // pulsing glow
  // drawFish call happens inside; restore after
}
```
After `drawFish`, draw a small skull overlay:
```js
ctx.font = `bold ${this.size * 0.55}px Arial`;
ctx.textAlign = 'center';
ctx.fillText('☠', this.x, this.y + this.size * 0.18);
```

### On eat (in collision block)
Replace growth/score with:
```js
if (e.toxic) {
  player.size = Math.max(12, player.size - player.size * 0.18); // lose 18%
  score += Math.ceil(e.size * 0.5);   // reduced points
  poisonFlash = 18;                    // new global, frames of purple screen tint
  floatTexts.push(new FloatText(e.x, e.y - e.size, '☠ TOXIC!', '#ce93d8', 20));
  playToxicSound();
} else {
  // existing eat logic
}
```

### `poisonFlash` overlay
New global `let poisonFlash = 0;`

In game loop, after drawing everything but before HUD:
```js
if (poisonFlash > 0) {
  ctx.fillStyle = `rgba(171, 71, 188, ${poisonFlash / 18 * 0.28})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  poisonFlash--;
}
```

### `playToxicSound()`
```js
function playToxicSound() {
  const ac = getAudio();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.4);
  gain.gain.setValueAtTime(0.3, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.45);
}
```

### New pro tip to add
- `'Purple glowing fish are TOXIC — they shrink you!'`

---

## Implementation Checklist

- [ ] **F1** Hunger globals + decay + starvation death + HUD bar
- [ ] **F2** Light rays array + `drawLightRays()` + seaweed array + `drawSeaweed()`
- [ ] **F3** `Shark` class + spawn logic + collision + reset in `startGame()`
- [ ] **F4** `generateCoralLayer()` + coral draw functions + layer draw calls
- [ ] **F5** `toxic` flag on EnemyFish + glow draw + skull overlay + eat handler + `poisonFlash` + `playToxicSound()`
- [ ] Add 3 new pro tips (hunger, shark, toxic)
- [ ] Commit after all 5 features pass manual testing
