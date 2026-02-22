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
