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
