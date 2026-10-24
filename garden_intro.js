/**
 * Pixel-art landing intro.
 *
 * Owns the screen while the ASCII engine sits in its 'seedling' stage:
 * a pure-black scene with a seedling, a water-drop button, and a little
 * farmer who walks in (ta-ta-ta), waters the sprout, waits, and hands the
 * stage over to the ASCII bloom via window.AsciiBotanicalGarden.startBloom().
 */
(function () {
  'use strict';

  // --- PALETTE (one char per pixel colour) ---
  const COLORS = {
    K: '#1b1210', // outline
    H: '#f1c75b', // straw hat
    h: '#c8973a', // straw shadow
    B: '#d9485f', // hat band
    S: '#f6c6a0', // skin
    s: '#dca07d', // skin shadow
    E: '#1b1210', // eye
    C: '#ff8fa8', // blush
    m: '#a8443c', // smile
    M: '#7a4a2a', // hair
    R: '#e0574f', // plaid shirt
    r: '#a83a36', // shirt shadow
    O: '#4a7fd0', // overalls
    o: '#2f5a9e', // overalls shadow
    Y: '#ffd76a', // brass buttons
    W: '#7a4a2a', // boots
    G: '#9fb6cc', // watering can
    g: '#e6f1fb', // can highlight
    L: '#5fd36a', // leaf
    l: '#a6f08a', // leaf highlight
    T: '#3fa54b', // stem
    t: '#2c7d37', // stem shadow
    D: '#5a3a22', // soil
    d: '#7d5634', // soil crumbs
    P: '#ff6f91', // bud / heart
    p: '#ffc2d1', // bud highlight
  };

  // --- SPRITES ---
  const FARMER_HEAD = [
    '......KKKKK.......',
    '.....KHHHHHK......',
    '....KHHHhHHHK.....',
    '....KBBBBBBBK.....',
    '..KKHHHHHHHHHKK...',
    '.KHHHhHHHHHhHHHK..',
    '..KKKKKKKKKKKKK...',
    '....KMMSSSSSSK....',
    '....KMSSSSSESK....',
    '....KMSSSSSESSK...',
    '....KSSSSSSSCSK...',
    '....KsSSSSSSSK....',
    '.....KsSSSmmK.....',
    '......KKKKKK......',
  ];
  const FARMER_BODY = [
    '.....KRORRORK.....',
    '....KRROYYOORK....',
    '....KRrOOOOOrRK...',
    '....KRrOOOOOrRK...',
    '....KSKOOOOOOKK...',
    '.....KKOOOOOOK....',
    '......KOOOOOOK....',
    '......KOOoOOOK....',
  ];
  const LEGS_STAND = [
    '......KOOKOOK.....',
    '......KOOKOOK.....',
    '......KWWKWWK.....',
    '.....KWWWKWWWK....',
    '.....KKKKKKKKK....',
  ];
  const LEGS_STRIDE = [
    '.....KOOK.KOOK....',
    '....KOOK...KOOK...',
    '....KWWK...KWWK...',
    '...KWWWK...KWWWK..',
    '...KKKKK...KKKKK..',
  ];
  const FARMER_H = FARMER_HEAD.length + FARMER_BODY.length + LEGS_STAND.length; // 27

  const CAN = [
    '..KKKK......',
    '.K....K.....',
    'KKKKKKKK..KK',
    'KGGGGGGK.KGK',
    'KGgGGGGKKGK.',
    'KGgGGGGGGK..',
    'KGGGGGGKK...',
    'KKKKKKKK....',
  ];
  const CAN_GRIP = { x: 3.5, y: 0.5 };
  const CAN_SPOUT = { x: 11.5, y: 2.5 };

  const LEAVES = [
    '.KKK.......KKK.',
    'KLLLKK...KKLLLK',
    'KLlLLLK.KLLLlLK',
    '.KLllLLKLLllLK.',
    '..KKLLlKlLLKK..',
    '....KKKTKKK....',
  ];
  const BUD = [
    '.KPK.',
    'KPPPK',
    'KPpPK',
    'KPPPK',
    '.KTK.',
  ];
  const SOIL = [
    '.....KKKKKKKKKKK.....',
    '..KKKDDDdDDDDdDDDKK..',
    '.KDDdDDDDDdDDDDDDdDK.',
    'KKKKKKKKKKKKKKKKKKKKK',
  ];
  const HEART = [
    '.KK.KK.',
    'KPPKPPK',
    'KPpPPPK',
    '.KPPPK.',
    '..KPK..',
    '...K...',
  ];

  // --- STATE ---
  const intro = {
    canvas: null,
    ctx: null,
    px: 4,         // CSS pixels per art pixel
    w: 0,
    h: 0,
    groundY: 0,
    plantX: 0,
    phase: 'idle', // idle → walk → greet → pour → wait → grow → handoff → done
    phaseT: 0,
    farmer: { x: -24, frame: 0, frameT: 0, facing: 1 },
    stemLen: 4,
    budAlpha: 0,
    drops: [],
    splashes: [],
    hearts: [],
    sparkles: [],
    time: 0,
    canSprite: null,
  };

  const $ = (id) => document.getElementById(id);
  const engine = () => window.AsciiBotanicalGarden;
  const sfx = (name, ...args) => {
    const e = engine();
    if (e && e.sfx && e.sfx[name]) e.sfx[name](...args);
  };

  // --- SPRITE HELPERS ---
  function drawMap(ctx, map, x, y, flip = false, alpha = 1) {
    ctx.globalAlpha = alpha;
    const width = map[0].length;
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        ctx.fillStyle = COLORS[ch];
        const cx = flip ? width - 1 - c : c;
        ctx.fillRect(Math.round(x) + cx, Math.round(y) + r, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function buildCanSprite() {
    const c = document.createElement('canvas');
    c.width = CAN[0].length;
    c.height = CAN.length;
    drawMap(c.getContext('2d'), CAN, 0, 0);
    intro.canSprite = c;
  }

  // Rotate a point of the can around its grip
  function canPoint(pt, angle) {
    const dx = pt.x - CAN_GRIP.x;
    const dy = pt.y - CAN_GRIP.y;
    return {
      x: dx * Math.cos(angle) - dy * Math.sin(angle),
      y: dx * Math.sin(angle) + dy * Math.cos(angle),
    };
  }

  const POUR_ANGLE = 0.62;
  // Hand offset (relative to farmer x, top) while pouring: arm stretched forward
  const POUR_HAND = { x: 17, y: 16 };

  // --- LAYOUT ---
  function resize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    intro.px = Math.max(4, Math.min(7, Math.round(Math.min(W, H) / 130)));
    intro.w = Math.ceil(W / intro.px);
    intro.h = Math.ceil(H / intro.px);
    intro.canvas.width = intro.w;
    intro.canvas.height = intro.h;
    intro.canvas.style.width = intro.w * intro.px + 'px';
    intro.canvas.style.height = intro.h * intro.px + 'px';
    intro.ctx.imageSmoothingEnabled = false;
    // Match the ASCII engine's ground line (88% of the viewport) so the bloom grows from the same spot
    intro.groundY = Math.round((H * 0.88) / intro.px);
    intro.plantX = Math.round(W / 2 / intro.px);
    positionBubbles();
  }

  function farmerStopX() {
    const tip = canPoint(CAN_SPOUT, POUR_ANGLE);
    // Spout tip should hang just left of the sprout so the stream lands on it
    return intro.plantX - 3 - (POUR_HAND.x + tip.x);
  }

  function farmerTopY(bob = 0) {
    return intro.groundY - FARMER_H + 1 - bob;
  }

  // --- BUBBLES (HTML, positioned in art-pixel space) ---
  function placeAt(el, x, y) {
    if (!el) return;
    el.style.left = x * intro.px + 'px';
    el.style.top = y * intro.px + 'px';
  }

  function positionBubbles() {
    placeAt($('plant-bubble'), intro.plantX + 1, intro.groundY - intro.stemLen - 12);
    placeAt($('farmer-bubble'), intro.farmer.x + 9, farmerTopY() - 3);
  }

  function showBubble(id, text) {
    const el = $(id);
    if (!el) return;
    if (text) el.querySelector('span').textContent = text;
    positionBubbles();
    el.classList.add('is-visible');
  }

  function hideBubble(id) {
    const el = $(id);
    if (el) el.classList.remove('is-visible');
  }

  // --- DRAWING ---
  function drawSoil(ctx) {
    drawMap(ctx, SOIL, intro.plantX - 10, intro.groundY - 2);
  }

  function drawSeedling(ctx) {
    const { plantX, groundY } = intro;
    const len = Math.round(intro.stemLen);
    // Pixel-art sway: leaves shift a single pixel, like a two-frame idle
    const sway = intro.phase === 'grow' ? 0 : (Math.sin(intro.time * 2.4) > 0.35 ? 1 : 0);
    const baseY = groundY - 1;

    for (let i = 0; i < len; i++) {
      const y = baseY - i;
      const lean = i > len * 0.6 ? sway : 0;
      ctx.fillStyle = COLORS.K;
      ctx.fillRect(plantX - 1 + lean, y, 1, 1);
      ctx.fillRect(plantX + 1 + lean, y, 1, 1);
      ctx.fillStyle = i % 3 === 0 ? COLORS.t : COLORS.T;
      ctx.fillRect(plantX + lean, y, 1, 1);
    }

    const leavesTop = baseY - len - LEAVES.length + 1;
    drawMap(ctx, LEAVES, plantX - 7 + sway, leavesTop);
    if (intro.budAlpha > 0) {
      drawMap(ctx, BUD, plantX - 2 + sway, leavesTop - BUD.length + 2, false, intro.budAlpha);
    }
  }

  function drawFarmer(ctx) {
    const f = intro.farmer;
    const walking = intro.phase === 'walk' || intro.phase === 'leave';
    const stride = walking && f.frame % 2 === 1;
    const bob = walking && stride ? 1 : 0;
    const top = farmerTopY(bob);
    const flip = f.facing < 0;
    const x = Math.round(f.x);

    // Can carried low at the side (drawn first so legs overlap it when walking)
    const pouring = intro.phase === 'pour' || intro.phase === 'greet' || intro.phase === 'wait';
    if (!pouring) {
      const canX = flip ? x + 18 - 12 - 9 : x + 9;
      ctx.save();
      if (flip) {
        ctx.translate(canX + 12, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(intro.canSprite, 0, top + 18);
      } else {
        ctx.drawImage(intro.canSprite, canX, top + 18);
      }
      ctx.restore();
    }

    drawMap(ctx, FARMER_HEAD, x, top, flip);
    drawMap(ctx, FARMER_BODY, x, top + FARMER_HEAD.length, flip);
    drawMap(ctx, stride ? LEGS_STRIDE : LEGS_STAND, x, top + FARMER_HEAD.length + FARMER_BODY.length, flip);

    // Front arm
    const armCol = (c) => (flip ? x + 17 - c : x + c);
    if (pouring) {
      // Raise the can towards the plant during greet, hold it out while pouring
      const raise = intro.phase === 'greet' ? Math.min(1, intro.phaseT / 0.8) : 1;
      const tilt = intro.phase === 'pour' ? POUR_ANGLE : intro.phase === 'wait' ? POUR_ANGLE * Math.max(0, 1 - intro.phaseT / 0.5) : POUR_ANGLE * 0.15 * raise;
      for (let c = 12; c <= 16; c++) {
        ctx.fillStyle = COLORS.K;
        ctx.fillRect(armCol(c), top + 15, 1, 1);
        ctx.fillRect(armCol(c), top + 18, 1, 1);
        ctx.fillStyle = c >= 15 ? COLORS.S : COLORS.R;
        ctx.fillRect(armCol(c), top + 16, 1, 2);
      }
      ctx.save();
      ctx.translate(x + POUR_HAND.x, top + POUR_HAND.y + 1);
      ctx.rotate(tilt);
      ctx.drawImage(intro.canSprite, -CAN_GRIP.x, -CAN_GRIP.y);
      ctx.restore();
      intro.spout = (() => {
        const p = canPoint(CAN_SPOUT, tilt);
        return { x: x + POUR_HAND.x + p.x, y: top + POUR_HAND.y + 1 + p.y };
      })();
    } else {
      // Arm hanging down holding the can's grip
      ctx.fillStyle = COLORS.K;
      ctx.fillRect(armCol(10), top + 15, 1, 4);
      ctx.fillRect(armCol(13), top + 15, 1, 4);
      ctx.fillStyle = COLORS.R;
      ctx.fillRect(Math.min(armCol(11), armCol(12)), top + 15, 2, 2);
      ctx.fillStyle = COLORS.S;
      ctx.fillRect(Math.min(armCol(11), armCol(12)), top + 17, 2, 2);
    }
  }

  function drawParticles(ctx, dt) {
    // Water drops with gravity
    intro.drops = intro.drops.filter((d) => {
      d.vy += 120 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y >= intro.groundY - 2 - (Math.abs(d.x - intro.plantX) < 7 ? 0 : 0)) {
        for (let i = 0; i < 2; i++) {
          intro.splashes.push({ x: d.x, y: intro.groundY - 2, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 20, life: 0.35 });
        }
        return false;
      }
      ctx.fillStyle = '#7cc8ff';
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 2);
      ctx.fillStyle = '#e3f4ff';
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
      return true;
    });

    intro.splashes = intro.splashes.filter((s) => {
      s.life -= dt;
      s.vy += 140 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      ctx.fillStyle = `rgba(160, 215, 255, ${Math.max(0, s.life / 0.35)})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
      return s.life > 0;
    });

    intro.hearts = intro.hearts.filter((h) => {
      h.t += dt;
      const a = h.t < 0.25 ? h.t / 0.25 : Math.max(0, 1 - (h.t - 1.1) / 0.6);
      drawMap(ctx, HEART, h.x - 3 + Math.round(Math.sin(h.t * 5)), h.y - h.t * 8, false, a);
      return h.t < 1.7;
    });

    intro.sparkles = intro.sparkles.filter((s) => {
      s.t += dt;
      const a = Math.max(0, 1 - s.t / s.life);
      const on = Math.sin(s.t * 18) > -0.3;
      if (on) {
        ctx.fillStyle = `rgba(255, 228, 140, ${a})`;
        const x = Math.round(s.x);
        const y = Math.round(s.y - s.t * 6);
        ctx.fillRect(x, y, 1, 1);
        if (s.big) {
          ctx.fillRect(x - 1, y, 1, 1);
          ctx.fillRect(x + 1, y, 1, 1);
          ctx.fillRect(x, y - 1, 1, 1);
          ctx.fillRect(x, y + 1, 1, 1);
        }
      }
      return s.t < s.life;
    });
  }

  // --- TIMELINE ---
  function setPhase(p) {
    intro.phase = p;
    intro.phaseT = 0;
  }

  function update(dt) {
    intro.time += dt;
    intro.phaseT += dt;
    const f = intro.farmer;

    switch (intro.phase) {
      case 'walk': {
        const target = farmerStopX();
        f.x = Math.min(target, f.x + 34 * dt);
        f.frameT += dt;
        if (f.frameT > 0.15) {
          f.frameT = 0;
          f.frame++;
          if (f.frame % 2 === 1) sfx('step'); // ta... ta... ta...
        }
        if (f.x >= target) {
          f.frame = 0;
          setPhase('greet');
          showBubble('farmer-bubble', 'here you go, little one ♡');
        }
        break;
      }
      case 'greet':
        if (intro.phaseT > 1.6) {
          hideBubble('farmer-bubble');
          setPhase('pour');
          sfx('pour', 2.4);
        }
        break;
      case 'pour':
        if (intro.spout && intro.phaseT > 0.25 && intro.phaseT < 2.2) {
          for (let i = 0; i < 2; i++) {
            intro.drops.push({ x: intro.spout.x + Math.random(), y: intro.spout.y, vx: 6 + Math.random() * 6, vy: 4 + Math.random() * 6 });
          }
        }
        if (intro.phaseT > 2.6) {
          setPhase('wait');
          intro.hearts.push({ x: f.x + 9, y: farmerTopY() - 2, t: 0 });
        }
        break;
      case 'wait':
        if (intro.phaseT > 0.6 && !intro.waitBubble) {
          intro.waitBubble = true;
          showBubble('farmer-bubble', 'now grow pretty for her…');
        }
        if (intro.phaseT > 2.2) {
          hideBubble('farmer-bubble');
          setPhase('grow');
          sfx('tone', 523.25, 0.9);
        }
        break;
      case 'grow': {
        const k = Math.min(1, intro.phaseT / 1.8);
        intro.stemLen = 4 + Math.round(k * 14);
        intro.budAlpha = Math.min(1, Math.max(0, (k - 0.55) / 0.35));
        if (Math.random() < 0.5) {
          intro.sparkles.push({ x: intro.plantX + (Math.random() - 0.5) * 26, y: intro.groundY - 4 - Math.random() * (intro.stemLen + 8), t: 0, life: 0.8 + Math.random() * 0.6, big: Math.random() < 0.35 });
        }
        if (intro.phaseT > 2.2) {
          setPhase('handoff');
          sfx('tone', 783.99, 1.2);
          const e = engine();
          if (e) e.startBloom();
          intro.canvas.classList.add('is-fading');
          f.facing = -1;
        }
        break;
      }
      case 'handoff':
        // The farmer strolls off left while the ASCII bouquet takes over
        f.x -= 30 * dt;
        f.frameT += dt;
        if (f.frameT > 0.15) {
          f.frameT = 0;
          f.frame++;
        }
        if (intro.phaseT > 1.8) {
          setPhase('done');
          intro.canvas.style.visibility = 'hidden';
        }
        break;
      default:
        break;
    }
  }

  function render() {
    const ctx = intro.ctx;
    ctx.clearRect(0, 0, intro.w, intro.h);
    drawSoil(ctx);
    drawSeedling(ctx);
    if (intro.phase !== 'idle') drawFarmer(ctx);
  }

  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (intro.phase === 'done') return;
    update(dt);
    render();
    drawParticles(intro.ctx, dt);
    if (intro.phase === 'walk' || intro.phase === 'greet' || intro.phase === 'wait') positionBubbles();
  }

  // --- START / REPLAY ---
  function begin() {
    if (intro.phase !== 'idle') return;
    document.body.classList.add('is-watering');
    hideBubble('plant-bubble');
    sfx('tone', 440, 0.5);
    intro.farmer = { x: -24, frame: 0, frameT: 0, facing: 1 };
    setPhase('walk');
  }

  function replay() {
    const e = engine();
    if (e) e.resetToSeedling();
    intro.stemLen = 4;
    intro.budAlpha = 0;
    intro.drops = [];
    intro.hearts = [];
    intro.sparkles = [];
    intro.waitBubble = false;
    intro.canvas.style.visibility = 'visible';
    intro.canvas.classList.remove('is-fading');
    intro.phase = 'idle';
    begin();
  }

  function init() {
    intro.canvas = $('intro-canvas');
    intro.ctx = intro.canvas.getContext('2d');
    buildCanSprite();
    resize();
    window.addEventListener('resize', resize);

    const btn = $('btn-water');
    if (btn) {
      btn.addEventListener('click', () => {
        btn.classList.add('is-pressed');
        begin();
      });
    }
    const rewater = $('btn-rewater');
    if (rewater) rewater.addEventListener('click', replay);

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if ((key === ' ' || key === 'w') && intro.phase === 'idle') {
        e.preventDefault();
        begin();
      }
    });

    // Let the seedling ask for water once the quote has settled in
    setTimeout(() => {
      if (intro.phase === 'idle') showBubble('plant-bubble');
    }, 1600);

    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GardenIntro = { begin, replay, state: intro };
})();
