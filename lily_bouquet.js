/**
 * ASCII Botanical Garden & Time-Lapse Master Engine
 * Features:
 * - Interactive Farmer & Sprout Landing Phase with footstep & watering procedural sound
 * - Natural stem bouquet growth from the ground up
 * - Split typography header (glides to wings on bloom)
 * - Botanical history & fun facts dossiers (with chrysanthemums inside joke)
 * - Continuous organic blooming & breathing time-lapse
 * - Dynamic theme color palettes affecting text, lighting & flowers
 * - Collapsible dock with spring bounce
 */

(function () {
  'use strict';

  // --- ENGINE STATE ---
  const state = {
    canvas: null,
    ctx: null,
    offCanvas: null,
    offCtx: null,
    width: 0,
    height: 0,
    charWidth: 6,
    charHeight: 10,
    cols: 0,
    rows: 0,

    // Lifecycle Stages: 'seedling' (pixel-art intro owns the screen), 'blooming'
    stage: 'seedling',

    // Botanical Time-Lapse Bloom Progress
    progress: 0.05,        // 0.05 = seedling, 1.0 = majestic full bloom
    loopMode: true,        // continuous organic breathing & blooming
    loopDirection: 1,      // 1 = unfurling, -1 = breathing contraction
    pauseAtPeak: 0,
    time: 0,
    speed: 1.0,
    isPlaying: true,

    // Selections
    species: 'grand',      // 'grand', 'roses', 'chrysanthemums', 'lilies', 'peonies'
    palette: 'original',   // 'original', 'golden', 'sakura', 'cyberpunk', 'matrix'
    asciiMode: 'classic',
    scanlines: true,

    // Environmental Particles & Breeze
    particles: [],
    wind: { x: 0, targetX: 0, velocity: 0 },
    mouse: { x: -1000, y: -1000, active: false },
    soundEnabled: true,
    audioCtx: null,
  };

  // ASCII Character Ramps
  const RAMPS = {
    classic: " .,:;+*#%@$",
    dense: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    matrix: " .10ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜXYZ89#%&@",
    botanical: " .·:+*ox%#&@",
  };

  // Botanical Color Palettes
  const PALETTES = {
    original: {
      name: "Botanical Classic",
      themeClass: "theme-botanical",
      red: { base: [245, 32, 60], shadow: [155, 12, 35], highlight: [255, 115, 140], spots: [90, 8, 20] },
      white: { base: [250, 252, 246], shadow: [185, 205, 185], highlight: [255, 255, 255], spots: [140, 165, 130], throat: [165, 230, 145] },
      gold: { base: [255, 185, 20], shadow: [185, 110, 10], highlight: [255, 235, 105], spots: [135, 70, 8] },
      magenta: { base: [242, 42, 135], shadow: [160, 18, 80], highlight: [255, 125, 190], spots: [110, 10, 50] },
      wine: { base: [180, 32, 75], shadow: [105, 14, 40], highlight: [225, 70, 115], spots: [68, 8, 25] },
      peach: { base: [255, 150, 88], shadow: [195, 85, 38], highlight: [255, 205, 155], spots: [150, 60, 22] },
      yellow: { base: [255, 220, 28], shadow: [190, 150, 12], highlight: [255, 248, 120], spots: [140, 105, 10] },
      coral: { base: [235, 85, 65], shadow: [160, 42, 30], highlight: [255, 140, 115], spots: [110, 28, 20] },
      lavender: { base: [205, 120, 245], shadow: [135, 60, 175], highlight: [240, 185, 255], spots: [95, 35, 130] },
      stems: { base: [50, 195, 68], shadow: [25, 105, 36], highlight: [95, 240, 115] },
      leaves: { base: [38, 168, 54], shadow: [18, 85, 28], highlight: [82, 218, 98] },
      stamens: { filament: [230, 255, 225], anther: [255, 185, 18] },
      soil: [110, 75, 45],
    },
    golden: {
      name: "Midnight Gold",
      themeClass: "theme-golden",
      red: { base: [255, 185, 25], shadow: [150, 85, 8], highlight: [255, 235, 135], spots: [95, 48, 5] },
      white: { base: [255, 245, 195], shadow: [180, 160, 95], highlight: [255, 255, 235], spots: [135, 115, 45], throat: [210, 180, 65] },
      gold: { base: [255, 205, 45], shadow: [165, 105, 15], highlight: [255, 245, 150], spots: [110, 60, 10] },
      magenta: { base: [245, 155, 40], shadow: [145, 75, 12], highlight: [255, 215, 115], spots: [95, 45, 8] },
      wine: { base: [195, 125, 30], shadow: [115, 65, 10], highlight: [240, 180, 75], spots: [75, 35, 5] },
      peach: { base: [255, 175, 65], shadow: [170, 95, 22], highlight: [255, 225, 140], spots: [115, 55, 12] },
      yellow: { base: [255, 225, 60], shadow: [185, 140, 20], highlight: [255, 250, 160], spots: [125, 85, 15] },
      coral: { base: [235, 145, 35], shadow: [145, 78, 15], highlight: [255, 200, 100], spots: [95, 45, 8] },
      lavender: { base: [240, 190, 85], shadow: [155, 110, 30], highlight: [255, 235, 160], spots: [105, 65, 15] },
      stems: { base: [145, 160, 42], shadow: [75, 85, 18], highlight: [200, 220, 85] },
      leaves: { base: [125, 140, 32], shadow: [60, 72, 14], highlight: [180, 195, 65] },
      stamens: { filament: [255, 245, 195], anther: [255, 160, 18] },
      soil: [85, 65, 30],
    },
    sakura: {
      name: "Sakura Dream",
      themeClass: "theme-sakura",
      red: { base: [255, 125, 165], shadow: [165, 48, 85], highlight: [255, 200, 220], spots: [110, 30, 55] },
      white: { base: [255, 245, 250], shadow: [215, 185, 200], highlight: [255, 255, 255], spots: [175, 140, 155], throat: [240, 190, 210] },
      gold: { base: [255, 180, 190], shadow: [175, 88, 105], highlight: [255, 225, 230], spots: [120, 55, 70] },
      magenta: { base: [248, 90, 138], shadow: [150, 36, 75], highlight: [255, 168, 198], spots: [100, 20, 45] },
      wine: { base: [215, 68, 115], shadow: [130, 30, 65], highlight: [255, 140, 175], spots: [85, 15, 40] },
      peach: { base: [255, 160, 180], shadow: [175, 75, 95], highlight: [255, 215, 225], spots: [120, 45, 60] },
      yellow: { base: [255, 205, 215], shadow: [195, 135, 145], highlight: [255, 245, 250], spots: [145, 95, 105] },
      coral: { base: [230, 80, 120], shadow: [140, 35, 65], highlight: [255, 150, 180], spots: [90, 20, 40] },
      lavender: { base: [225, 140, 210], shadow: [150, 65, 140], highlight: [255, 200, 245], spots: [110, 40, 100] },
      stems: { base: [65, 165, 98], shadow: [32, 88, 50], highlight: [110, 205, 145] },
      leaves: { base: [50, 145, 82], shadow: [24, 75, 40], highlight: [88, 185, 120] },
      stamens: { filament: [255, 235, 240], anther: [255, 190, 110] },
      soil: [90, 55, 60],
    },
    cyberpunk: {
      name: "Cyberpunk Neon",
      themeClass: "theme-cyberpunk",
      red: { base: [255, 0, 128], shadow: [120, 0, 75], highlight: [255, 110, 210], spots: [60, 0, 60] },
      white: { base: [0, 245, 255], shadow: [0, 120, 160], highlight: [190, 255, 255], spots: [0, 60, 80], throat: [0, 180, 200] },
      gold: { base: [255, 230, 0], shadow: [160, 130, 0], highlight: [255, 255, 150], spots: [80, 60, 0] },
      magenta: { base: [195, 0, 255], shadow: [95, 0, 150], highlight: [235, 130, 255], spots: [50, 0, 90] },
      wine: { base: [255, 35, 95], shadow: [130, 10, 40], highlight: [255, 120, 165], spots: [70, 5, 20] },
      peach: { base: [0, 255, 170], shadow: [0, 130, 85], highlight: [160, 255, 215], spots: [0, 70, 40] },
      yellow: { base: [255, 135, 0], shadow: [150, 65, 0], highlight: [255, 195, 95], spots: [80, 30, 0] },
      coral: { base: [255, 0, 85], shadow: [125, 0, 40], highlight: [255, 95, 140], spots: [60, 0, 20] },
      lavender: { base: [165, 0, 255], shadow: [85, 0, 140], highlight: [215, 110, 255], spots: [40, 0, 70] },
      stems: { base: [0, 255, 140], shadow: [0, 115, 55], highlight: [125, 255, 195] },
      leaves: { base: [0, 195, 175], shadow: [0, 90, 75], highlight: [100, 255, 235] },
      stamens: { filament: [225, 255, 255], anther: [255, 240, 0] },
      soil: [30, 20, 50],
    },
    matrix: {
      name: "Phosphor Matrix",
      themeClass: "theme-matrix",
      red: { base: [30, 245, 65], shadow: [8, 95, 20], highlight: [150, 255, 175], spots: [4, 55, 10] },
      white: { base: [140, 255, 165], shadow: [40, 140, 55], highlight: [210, 255, 225], spots: [25, 90, 35], throat: [70, 200, 90] },
      gold: { base: [45, 255, 80], shadow: [12, 110, 25], highlight: [165, 255, 190], spots: [8, 65, 15] },
      magenta: { base: [25, 235, 55], shadow: [6, 85, 16], highlight: [135, 255, 160], spots: [3, 45, 8] },
      wine: { base: [18, 180, 42], shadow: [4, 65, 12], highlight: [105, 230, 130], spots: [2, 35, 6] },
      peach: { base: [35, 250, 72], shadow: [10, 105, 22], highlight: [155, 255, 180], spots: [6, 60, 12] },
      yellow: { base: [50, 255, 90], shadow: [14, 120, 28], highlight: [175, 255, 200], spots: [10, 70, 16] },
      coral: { base: [28, 240, 60], shadow: [8, 90, 18], highlight: [145, 255, 170], spots: [4, 50, 10] },
      lavender: { base: [32, 245, 68], shadow: [9, 100, 20], highlight: [150, 255, 175], spots: [5, 55, 11] },
      stems: { base: [18, 185, 42], shadow: [6, 72, 14], highlight: [65, 235, 92] },
      leaves: { base: [14, 155, 32], shadow: [4, 62, 10], highlight: [52, 205, 78] },
      stamens: { filament: [165, 255, 185], anther: [215, 255, 145] },
      soil: [15, 40, 18],
    },
  };

  // Botanical Dossiers & Fun Facts (With Inside Joke on Chrysanthemums)
  const BOTANICAL_DOSSIERS = {
    grand: {
      tag: "💐 Master Floral Symphony",
      name: "Grand Garden Bouquet",
      botanicalName: "Plantae Magnoliophyta &bull; Flora Bountiful",
      desc: "An opulent multi-species botanical arrangement featuring spiraling garden roses, radiating spider chrysanthemums, recurved royal lilies, and ruffled romantic peonies.",
      fact: "Polyculture arrangements like this have been celebrated since 17th-century Dutch masters as representations of nature's infinite creative geometry.",
      note: "a little of everything, because one kind of flower was never going to be enough for you.",
    },
    roses: {
      tag: "🌹 Royal Rosa Dossier",
      name: "English Garden Roses",
      botanicalName: "Rosa gallica &bull; Rosaceae",
      desc: "Revered for centuries in royal gardens, cabbage roses feature up to 40 layered, spiraled petals arranged according to the golden ratio.",
      fact: "Fossilized rose leaves date back 35 million years. Cleopatra was said to have carpeted her banquet floors with a foot of rose petals.",
      note: "roses are the obvious choice. you were never the obvious choice — you're the only one.",
    },
    chrysanthemums: {
      tag: "🌼 Radiating Florets",
      name: "Spider Chrysanthemums",
      botanicalName: "Chrysanthemum morifolium &bull; Asteraceae",
      desc: "Originating in ancient East Asia over 3,000 years ago, spider mums feature tubular ray florets that arch outward like golden floral fireworks.",
      fact: "Under chrysanthemums...\n(Ensure you check the spelling — this is the actual spelling 😂! C-h-r-y-s-a-n-t-h-e-m-u-m-s!)",
      note: "they stand for joy & long life. selfishly, I'd like both of those with you.",
    },
    lilies: {
      tag: "🌺 Regal Lilium Dossier",
      name: "Royal Asiatic Lilies",
      botanicalName: "Lilium asiatica &bull; Liliaceae",
      desc: "Distinguished by six massive recurved tepals, deep throat papillae (freckles), and prominent filaments tipped with golden pollen anthers.",
      fact: "In botanical folklore, lilies represent majestic rebirth. Each lily blossom faces the horizon to maximize sun exposure and pollinator flight paths.",
      note: "lilies always turn to face the light. funny, I have the same problem around you.",
    },
    peonies: {
      tag: "🌸 Voluminous Blossom",
      name: "Romantic Peonies",
      botanicalName: "Paeonia lactiflora &bull; Paeoniaceae",
      desc: "Sensuous and lavish, peonies burst from tight round spheres into pillowy bowls with dozens of crinkled, translucent, ruffled layers.",
      fact: "In China, the peony is known as the 'King of Flowers' (花王) and was declared the national flower during the Qing dynasty.",
      note: "peonies mean a happy life & good fortune. I already got mine — I met you.",
    },
  };

  // Gap-filling blooms added to every scheme (type borrowed from the scheme, so single-species bouquets stay pure)
  const BOUQUET_FILLERS = [
    { relX: -85, relY: -70, scale: 1.15, tilt: -0.2, delay: 0.18, z: 10 },
    { relX: 88, relY: -75, scale: 1.15, tilt: 0.22, delay: 0.19, z: 10 },
    { relX: -95, relY: 95, scale: 1.2, tilt: -0.28, delay: 0.15, z: 10 },
    { relX: 95, relY: 92, scale: 1.2, tilt: 0.3, delay: 0.15, z: 10 },
    { relX: 0, relY: -165, scale: 1.1, tilt: 0.05, delay: 0.2, z: 6 },
    { relX: -255, relY: 120, scale: 1.0, tilt: -0.5, delay: 0.17, z: 3 },
    { relX: 258, relY: 115, scale: 1.0, tilt: 0.52, delay: 0.17, z: 3 },
    { relX: -175, relY: -250, scale: 0.92, tilt: -0.35, delay: 0.26, z: 1 },
    { relX: 180, relY: -245, scale: 0.92, tilt: 0.36, delay: 0.26, z: 1 },
    { relX: -300, relY: -150, scale: 0.88, tilt: -0.65, delay: 0.24, z: 1 },
    { relX: 302, relY: -145, scale: 0.88, tilt: 0.66, delay: 0.24, z: 1 },
  ];
  const FILLER_COLORS = ['peach', 'lavender', 'white', 'magenta', 'gold', 'coral', 'red', 'yellow', 'wine', 'white', 'peach'];

  // Bouquet Composition Schemes (13 blooms, tiered depth)
  const BOUQUET_SCHEMES = {
    grand: [
      { type: 'lily', relX: 0, relY: -10, scale: 1.55, tilt: 0, color: 'red', delay: 0.12, z: 12 },
      { type: 'peony', relX: -160, relY: -150, scale: 1.38, tilt: -0.22, color: 'white', delay: 0.16, z: 8 },
      { type: 'chrysanthemum', relX: 165, relY: -145, scale: 1.38, tilt: 0.24, color: 'gold', delay: 0.18, z: 7 },
      { type: 'rose', relX: -180, relY: 45, scale: 1.40, tilt: -0.32, color: 'magenta', delay: 0.14, z: 9 },
      { type: 'rose', relX: 185, relY: 38, scale: 1.36, tilt: 0.34, color: 'wine', delay: 0.15, z: 8 },
      { type: 'lily', relX: 0, relY: 145, scale: 1.42, tilt: 0.04, color: 'peach', delay: 0.10, z: 11 },
      { type: 'chrysanthemum', relX: -165, relY: 190, scale: 1.25, tilt: -0.42, color: 'yellow', delay: 0.08, z: 5 },
      { type: 'rose', relX: 165, relY: 185, scale: 1.25, tilt: 0.44, color: 'coral', delay: 0.09, z: 4 },
      { type: 'peony', relX: 15, relY: -270, scale: 1.10, tilt: 0.08, color: 'lavender', delay: 0.22, z: 3 },
      { type: 'rose', relX: -245, relY: -50, scale: 1.05, tilt: -0.55, color: 'peach', delay: 0.20, z: 2 },
      { type: 'chrysanthemum', relX: 245, relY: -42, scale: 1.05, tilt: 0.58, color: 'gold', delay: 0.21, z: 2 },
      { type: 'lily', relX: -95, relY: -235, scale: 0.98, tilt: -0.15, color: 'white', delay: 0.24, z: 1 },
      { type: 'rose', relX: 105, relY: -230, scale: 0.98, tilt: 0.18, color: 'magenta', delay: 0.25, z: 1 },
    ],
    roses: [
      { type: 'rose', relX: 0, relY: -15, scale: 1.68, tilt: 0, color: 'red', delay: 0.12, z: 12 },
      { type: 'rose', relX: -155, relY: -145, scale: 1.45, tilt: -0.25, color: 'peach', delay: 0.16, z: 7 },
      { type: 'rose', relX: 155, relY: -140, scale: 1.42, tilt: 0.28, color: 'white', delay: 0.17, z: 6 },
      { type: 'rose', relX: -185, relY: 45, scale: 1.48, tilt: -0.34, color: 'magenta', delay: 0.13, z: 9 },
      { type: 'rose', relX: 190, relY: 40, scale: 1.45, tilt: 0.36, color: 'coral', delay: 0.14, z: 8 },
      { type: 'rose', relX: 0, relY: 145, scale: 1.50, tilt: 0.05, color: 'wine', delay: 0.10, z: 11 },
      { type: 'rose', relX: -160, relY: 185, scale: 1.28, tilt: -0.44, color: 'yellow', delay: 0.08, z: 5 },
      { type: 'rose', relX: 160, relY: 180, scale: 1.25, tilt: 0.46, color: 'lavender', delay: 0.09, z: 4 },
      { type: 'rose', relX: 12, relY: -268, scale: 1.12, tilt: 0.10, color: 'red', delay: 0.22, z: 3 },
      { type: 'rose', relX: -245, relY: -45, scale: 1.08, tilt: -0.60, color: 'white', delay: 0.20, z: 2 },
      { type: 'rose', relX: 250, relY: -40, scale: 1.08, tilt: 0.62, color: 'peach', delay: 0.21, z: 2 },
      { type: 'rose', relX: -98, relY: -225, scale: 1.00, tilt: -0.18, color: 'magenta', delay: 0.24, z: 1 },
      { type: 'rose', relX: 105, relY: -220, scale: 1.00, tilt: 0.20, color: 'gold', delay: 0.25, z: 1 },
    ],
    chrysanthemums: [
      { type: 'chrysanthemum', relX: 0, relY: -10, scale: 1.72, tilt: 0, color: 'gold', delay: 0.12, z: 12 },
      { type: 'chrysanthemum', relX: -160, relY: -145, scale: 1.46, tilt: -0.22, color: 'white', delay: 0.16, z: 7 },
      { type: 'chrysanthemum', relX: 160, relY: -140, scale: 1.44, tilt: 0.25, color: 'lavender', delay: 0.17, z: 6 },
      { type: 'chrysanthemum', relX: -190, relY: 50, scale: 1.48, tilt: -0.32, color: 'yellow', delay: 0.13, z: 9 },
      { type: 'chrysanthemum', relX: 195, relY: 45, scale: 1.45, tilt: 0.35, color: 'red', delay: 0.14, z: 8 },
      { type: 'chrysanthemum', relX: 0, relY: 150, scale: 1.52, tilt: 0.04, color: 'coral', delay: 0.10, z: 11 },
      { type: 'chrysanthemum', relX: -165, relY: 190, scale: 1.30, tilt: -0.42, color: 'magenta', delay: 0.08, z: 5 },
      { type: 'chrysanthemum', relX: 165, relY: 185, scale: 1.28, tilt: 0.45, color: 'peach', delay: 0.09, z: 4 },
      { type: 'chrysanthemum', relX: 12, relY: -270, scale: 1.14, tilt: 0.08, color: 'gold', delay: 0.22, z: 3 },
      { type: 'chrysanthemum', relX: -250, relY: -48, scale: 1.10, tilt: -0.58, color: 'wine', delay: 0.20, z: 2 },
      { type: 'chrysanthemum', relX: 255, relY: -42, scale: 1.10, tilt: 0.60, color: 'white', delay: 0.21, z: 2 },
      { type: 'chrysanthemum', relX: -98, relY: -230, scale: 1.02, tilt: -0.16, color: 'yellow', delay: 0.24, z: 1 },
      { type: 'chrysanthemum', relX: 105, relY: -225, scale: 1.02, tilt: 0.18, color: 'lavender', delay: 0.25, z: 1 },
    ],
    lilies: [
      { type: 'lily', relX: 0, relY: -10, scale: 1.62, tilt: 0, color: 'red', delay: 0.12, z: 12 },
      { type: 'lily', relX: -160, relY: -150, scale: 1.42, tilt: -0.22, color: 'white', delay: 0.16, z: 7 },
      { type: 'lily', relX: 165, relY: -145, scale: 1.40, tilt: 0.25, color: 'gold', delay: 0.17, z: 6 },
      { type: 'lily', relX: -185, relY: 50, scale: 1.44, tilt: -0.32, color: 'magenta', delay: 0.13, z: 9 },
      { type: 'lily', relX: 190, relY: 42, scale: 1.38, tilt: 0.35, color: 'wine', delay: 0.14, z: 8 },
      { type: 'lily', relX: 0, relY: 150, scale: 1.46, tilt: 0.04, color: 'peach', delay: 0.10, z: 11 },
      { type: 'lily', relX: -170, relY: 195, scale: 1.25, tilt: -0.42, color: 'yellow', delay: 0.08, z: 5 },
      { type: 'lily', relX: 170, relY: 190, scale: 1.22, tilt: 0.45, color: 'coral', delay: 0.09, z: 4 },
      { type: 'lily', relX: 16, relY: -280, scale: 1.05, tilt: 0.08, color: 'peach', delay: 0.22, z: 3 },
      { type: 'lily', relX: -245, relY: -48, scale: 1.06, tilt: -0.58, color: 'lavender', delay: 0.20, z: 2 },
      { type: 'lily', relX: 250, relY: -42, scale: 1.06, tilt: 0.60, color: 'white', delay: 0.21, z: 2 },
      { type: 'lily', relX: -98, relY: -235, scale: 0.98, tilt: -0.16, color: 'red', delay: 0.24, z: 1 },
      { type: 'lily', relX: 105, relY: -230, scale: 0.98, tilt: 0.18, color: 'gold', delay: 0.25, z: 1 },
    ],
    peonies: [
      { type: 'peony', relX: 0, relY: -10, scale: 1.72, tilt: 0, color: 'white', delay: 0.12, z: 12 },
      { type: 'peony', relX: -155, relY: -145, scale: 1.48, tilt: -0.22, color: 'magenta', delay: 0.16, z: 7 },
      { type: 'peony', relX: 160, relY: -140, scale: 1.45, tilt: 0.25, color: 'coral', delay: 0.17, z: 6 },
      { type: 'peony', relX: -185, relY: 45, scale: 1.50, tilt: -0.32, color: 'peach', delay: 0.13, z: 9 },
      { type: 'peony', relX: 190, relY: 40, scale: 1.46, tilt: 0.35, color: 'lavender', delay: 0.14, z: 8 },
      { type: 'peony', relX: 0, relY: 145, scale: 1.54, tilt: 0.04, color: 'red', delay: 0.10, z: 11 },
      { type: 'peony', relX: -165, relY: 185, scale: 1.30, tilt: -0.42, color: 'white', delay: 0.08, z: 5 },
      { type: 'peony', relX: 165, relY: 180, scale: 1.28, tilt: 0.45, color: 'wine', delay: 0.09, z: 4 },
      { type: 'peony', relX: 12, relY: -270, scale: 1.14, tilt: 0.08, color: 'magenta', delay: 0.22, z: 3 },
      { type: 'peony', relX: -250, relY: -48, scale: 1.10, tilt: -0.58, color: 'peach', delay: 0.20, z: 2 },
      { type: 'peony', relX: 255, relY: -42, scale: 1.10, tilt: 0.60, color: 'coral', delay: 0.21, z: 2 },
      { type: 'peony', relX: -98, relY: -230, scale: 1.02, tilt: -0.16, color: 'lavender', delay: 0.24, z: 1 },
      { type: 'peony', relX: 105, relY: -225, scale: 1.02, tilt: 0.18, color: 'white', delay: 0.25, z: 1 },
    ],
  };

  // 16 Rich lanceolate base foliage leaves
  const LEAF_SPECS = [
    { startAngle: -Math.PI * 0.44, len: 270, curve: -85, width: 36, z: 1 },
    { startAngle: -Math.PI * 0.56, len: 280, curve: 95, width: 38, z: 1 },
    { startAngle: -Math.PI * 0.34, len: 320, curve: -115, width: 40, z: 2 },
    { startAngle: -Math.PI * 0.66, len: 330, curve: 125, width: 42, z: 2 },
    { startAngle: -Math.PI * 0.24, len: 290, curve: -145, width: 36, z: 3 },
    { startAngle: -Math.PI * 0.76, len: 300, curve: 155, width: 38, z: 3 },
    { startAngle: -Math.PI * 0.14, len: 250, curve: -165, width: 32, z: 4 },
    { startAngle: -Math.PI * 0.86, len: 255, curve: 175, width: 32, z: 4 },
    { startAngle: -Math.PI * 0.47, len: 370, curve: -45, width: 38, z: 5 },
    { startAngle: -Math.PI * 0.53, len: 360, curve: 50, width: 40, z: 5 },
    { startAngle: -Math.PI * 0.38, len: 390, curve: -65, width: 40, z: 6 },
    { startAngle: -Math.PI * 0.62, len: 385, curve: 70, width: 40, z: 6 },
    { startAngle: -Math.PI * 0.28, len: 310, curve: -130, width: 36, z: 7 },
    { startAngle: -Math.PI * 0.72, len: 315, curve: 135, width: 36, z: 7 },
    { startAngle: -Math.PI * 0.42, len: 410, curve: -35, width: 36, z: 8 },
    { startAngle: -Math.PI * 0.58, len: 405, curve: 40, width: 36, z: 8 },
  ];

  // --- PROCEDURAL AUDIO ENGINE ---
  function getAudioContext() {
    if (!state.soundEnabled) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!state.audioCtx) state.audioCtx = new AudioCtx();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    return state.audioCtx;
  }

  // Farmer Footstep sound: a crisp "ta" (filtered noise tick) over a soft heel thump
  function playFootstepSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.06);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400 + Math.random() * 500;
      filter.Q.value = 1.2;
      const nGain = ctx.createGain();
      nGain.gain.value = 0.22;
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(t);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.08);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {}
  }

  // Gentle Water Pouring Stream (White noise filtered with bubbling bandpass)
  function playWaterPourSound(duration = 2.4) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      // Noise buffer for water hiss
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to simulate water splashing/pouring
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(1400, ctx.currentTime + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(900, ctx.currentTime + duration);
      filter.Q.value = 3.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  // Harmonic Bloom Chimes & Whoosh
  function playBloomWhoosh() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      // Harmonic sweep (whoosh)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {}
  }

  function playBloomTone(freq = 440, duration = 1.2) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  // --- MATHEMATICAL EASING ---
  function smoothstep(edge0, edge1, x) {
    if (Math.abs(edge1 - edge0) < 0.0001) return x >= edge1 ? 1 : 0;
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  // --- INITIALIZATION ---
  function init() {
    state.canvas = document.getElementById('ascii-canvas');
    state.ctx = state.canvas.getContext('2d');

    state.offCanvas = document.createElement('canvas');
    state.offCtx = state.offCanvas.getContext('2d', { willReadFrequently: true });

    resize();
    window.addEventListener('resize', resize);

    setupInteractions();
    setupParticles();
    setupControls();
    updateTheme(state.palette);
    updateDossier(state.species);

    requestAnimationFrame(renderLoop);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    state.width = w;
    state.height = h;

    state.canvas.width = w;
    state.canvas.height = h;

    state.offCanvas.width = w;
    state.offCanvas.height = h;

    // Crisp high-density ASCII grid
    state.charWidth = 6;
    state.charHeight = 10;
    state.cols = Math.floor(w / state.charWidth);
    state.rows = Math.floor(h / state.charHeight);
  }

  function setupParticles() {
    state.particles = [];
    const count = 50;
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x: Math.random() * state.width,
        y: Math.random() * state.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.25 - Math.random() * 0.5,
        char: ["*", "+", "·", ".", "'"][Math.floor(Math.random() * 5)],
        alpha: Math.random(),
        twinkleSpeed: 0.02 + Math.random() * 0.03,
      });
    }
  }

  // --- MASTER BOTANICAL RENDER PIPELINE ---
  function drawMasterScene(ctx, progress, time) {
    const pal = PALETTES[state.palette];
    ctx.clearRect(0, 0, state.width, state.height);

    const groundY = state.height * 0.88;
    const centerX = state.width / 2 + state.wind.x * 18;

    // The landing is pure black: the pixel-art intro (garden_intro.js) draws the seedling & farmer
    if (state.stage === 'seedling') return;

    // Fit the bouquet to smaller screens, scaling around the root of the stems
    const fit = Math.min(0.9, state.width / 1000, state.height / 1000);
    ctx.save();
    ctx.translate(centerX, groundY);
    ctx.scale(fit, fit);
    ctx.translate(-centerX, -groundY);

    // 1. Draw Mound of Organic Soil & Base Roots
    drawSoilBed(ctx, centerX, groundY, pal);

    // 2: BOUNTIFUL BOUQUET BLOOM (Stem-driven growth)
    drawBountifulBouquet(ctx, progress, time, centerX, groundY, pal);
    ctx.restore();
  }

  // Rich soil mound at base (Reel 2 inspired: organic soil granules and layered bed)
  function drawSoilBed(ctx, cx, groundY, pal) {
    ctx.save();
    
    // Gradient dark earth base
    const soilGrad = ctx.createRadialGradient(cx, groundY + 16, 20, cx, groundY + 16, 260);
    soilGrad.addColorStop(0, `rgb(${pal.soil.join(',')})`);
    soilGrad.addColorStop(0.6, `rgba(${Math.floor(pal.soil[0] * 0.65)}, ${Math.floor(pal.soil[1] * 0.65)}, ${Math.floor(pal.soil[2] * 0.65)}, 0.85)`);
    soilGrad.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 16, 240, 36, 0, 0, Math.PI * 2);
    ctx.fillStyle = soilGrad;
    ctx.fill();

    // Organic pointillist soil crumbles / pebbles
    ctx.fillStyle = `rgba(${pal.soil.map(c => Math.min(255, c + 35)).join(',')}, 0.75)`;
    const pebbles = [
      [-95, 14, 5, 3], [-65, 8, 4, 2.5], [-35, 18, 6, 3], [0, 10, 5, 3],
      [40, 16, 6, 3.5], [75, 9, 4, 2], [110, 15, 5, 2.5], [-140, 22, 6, 3],
      [145, 20, 5, 3], [-20, 5, 3, 2], [25, 6, 4, 2]
    ];
    pebbles.forEach(([px, py, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(cx + px, groundY + py, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // --- BOUNTIFUL BOUQUET: STEM-DRIVEN GROWTH & BLOOM ---
  function drawBountifulBouquet(ctx, progress, time, centerX, groundY, pal) {
    // Spread the blooms apart and trim their size so each flower reads on its own
    // while the arrangement keeps its rounded bouquet silhouette
    const SPREAD_X = 1.15;
    const SPREAD_Y = 1.05;
    const BLOOM_SIZE = 0.55;
    const scheme = BOUQUET_SCHEMES[state.species] || BOUQUET_SCHEMES.grand;
    // Extra blooms tucked into the gaps between the main 13 for a fuller bouquet
    const fillers = BOUQUET_FILLERS.map((f, i) => {
      const donor = scheme[(i * 5 + 3) % scheme.length];
      return { ...f, type: donor.type, color: FILLER_COLORS[i % FILLER_COLORS.length] };
    });
    const bouquet = scheme.concat(fillers).map((fl) => ({
      ...fl,
      relX: fl.relX * SPREAD_X,
      relY: fl.relY * SPREAD_Y,
      scale: fl.scale * BLOOM_SIZE,
    }));
    const centerY = state.height * 0.54;
    const baseOriginX = centerX;
    const baseOriginY = groundY;

    const windSway = Math.sin(time * 1.4) * 8 + state.wind.x * 28;
    const windGentle = Math.cos(time * 1.8) * 4;

    // Stem progress: rises smoothly from 0.0 to 0.45
    const stemProgress = smoothstep(0.0, 0.45, progress);

    // 1. BACKGROUND LEAVES
    ctx.save();
    LEAF_SPECS.filter(l => l.z <= 4).forEach((leaf) => {
      drawLilyLeaf(ctx, baseOriginX, baseOriginY, leaf, stemProgress, time, pal, windSway);
    });
    ctx.restore();

    // 2. BOUNTIFUL STEMS (Growing upwards like a real bouquet)
    bouquet.forEach((fl) => {
      const targetX = centerX + fl.relX + (windSway * (baseOriginY - (centerY + fl.relY))) / 450;
      const targetY = centerY + fl.relY;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(baseOriginX, baseOriginY);

      const ctrlX = (baseOriginX + targetX) / 2 + (fl.relX > 0 ? 32 : -32) + windGentle;
      const ctrlY = (baseOriginY + targetY) / 2 + 55;

      const t = stemProgress;
      const curX = Math.pow(1 - t, 2) * baseOriginX + 2 * (1 - t) * t * ctrlX + Math.pow(t, 2) * targetX;
      const curY = Math.pow(1 - t, 2) * baseOriginY + 2 * (1 - t) * t * ctrlY + Math.pow(t, 2) * targetY;

      ctx.quadraticCurveTo(ctrlX, ctrlY, curX, curY);

      // Dark core
      ctx.strokeStyle = `rgb(${pal.stems.shadow.join(',')})`;
      ctx.lineWidth = 10 * (fl.scale / 1.85);
      ctx.lineCap = 'round';
      ctx.stroke();

      // Green stem body
      const stemGrad = ctx.createLinearGradient(baseOriginX, baseOriginY, targetX, targetY);
      stemGrad.addColorStop(0, `rgb(${pal.stems.shadow.join(',')})`);
      stemGrad.addColorStop(0.35, `rgb(${pal.stems.base.join(',')})`);
      stemGrad.addColorStop(1, `rgb(${pal.stems.highlight.join(',')})`);

      ctx.strokeStyle = stemGrad;
      ctx.lineWidth = 7 * (fl.scale / 1.85);
      ctx.stroke();

      // Tubular highlight line
      ctx.beginPath();
      ctx.moveTo(baseOriginX - 1, baseOriginY);
      ctx.quadraticCurveTo(ctrlX - 1, ctrlY, curX - 1, curY);
      ctx.strokeStyle = `rgba(${pal.stems.highlight.join(',')}, 0.85)`;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.restore();
    });

    // 3. FOREGROUND LEAVES
    ctx.save();
    LEAF_SPECS.filter(l => l.z > 4).forEach((leaf) => {
      drawLilyLeaf(ctx, baseOriginX, baseOriginY, leaf, stemProgress, time, pal, windSway);
    });
    ctx.restore();

    // 4. BOUQUET BLOOMS (Layered by z-depth)
    const sortedFlowers = [...bouquet].sort((a, b) => a.z - b.z);

    sortedFlowers.forEach((fl, idx) => {
      const flowerGrowth = smoothstep(fl.delay, fl.delay + 0.42, progress);
      if (flowerGrowth <= 0.01) return;

      const flowerX = centerX + fl.relX + (windSway * (baseOriginY - (centerY + fl.relY))) / 400;
      const flowerY = centerY + fl.relY + Math.sin(time * 2 + idx) * 3;

      const colorSpec = pal[fl.color] || pal.red;

      ctx.save();
      ctx.translate(flowerX, flowerY);
      ctx.rotate(fl.tilt + (windSway * 0.002) + Math.sin(time * 1.6 + idx) * 0.03);

      if (fl.type === 'rose') {
        drawBountifulRose(ctx, flowerGrowth, fl.scale, colorSpec, pal, time + idx);
      } else if (fl.type === 'chrysanthemum') {
        drawBountifulChrysanthemum(ctx, flowerGrowth, fl.scale, colorSpec, pal, time + idx);
      } else if (fl.type === 'peony') {
        drawBountifulPeony(ctx, flowerGrowth, fl.scale, colorSpec, pal, time + idx);
      } else {
        drawBountifulLily(ctx, flowerGrowth, fl.scale, colorSpec, pal, time + idx);
      }

      ctx.restore();
    });
  }

  // --- BOTANICAL LEAF ---
  function drawLilyLeaf(ctx, rootX, rootY, spec, progress, time, pal, wind) {
    if (progress <= 0.03) return;

    ctx.save();
    ctx.translate(rootX, rootY);

    const leafProg = Math.min(1, progress * 1.35);
    const length = spec.len * leafProg;
    const angle = spec.startAngle + (Math.sin(time + spec.len) * 0.04) + (wind * 0.002);

    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);

    const midL = length * 0.52;
    const curveOffset = spec.curve * leafProg;
    const halfW = (spec.width * leafProg) / 2;

    ctx.bezierCurveTo(
      curveOffset * 0.2 - halfW * 0.8, midL * 0.4,
      curveOffset * 0.7 - halfW, midL,
      curveOffset, length
    );

    ctx.bezierCurveTo(
      curveOffset * 0.7 + halfW, midL,
      curveOffset * 0.2 + halfW * 0.8, midL * 0.4,
      0, 0
    );

    ctx.closePath();

    const leafGrad = ctx.createLinearGradient(0, 0, curveOffset, Math.max(1, length));
    leafGrad.addColorStop(0, `rgb(${pal.leaves.shadow.join(',')})`);
    leafGrad.addColorStop(0.5, `rgb(${pal.leaves.base.join(',')})`);
    leafGrad.addColorStop(1, `rgb(${pal.leaves.highlight.join(',')})`);

    ctx.fillStyle = leafGrad;
    ctx.fill();

    // Central rib
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(curveOffset * 0.5, midL, curveOffset, length);
    ctx.strokeStyle = `rgba(${pal.leaves.highlight.join(',')}, 0.8)`;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  // --- SPECIES 1: ENGLISH GARDEN ROSE ---
  function drawBountifulRose(ctx, growth, scale, fColor, pal, seed) {
    if (growth < 0.20) {
      drawRoseBud(ctx, growth / 0.20, scale, fColor, pal);
      return;
    }

    const bloom = easeOutCubic((growth - 0.20) / 0.80);
    const numPetals = 32;
    const maxR = 90 * scale * (0.28 + 0.72 * bloom);
    const goldenAngle = 137.508 * (Math.PI / 180);

    // Sepals peeling back
    for (let s = 0; s < 5; s++) {
      const sAngle = (s * Math.PI * 2) / 5;
      const sLen = 50 * scale * (1 - 0.3 * bloom);
      ctx.save();
      ctx.rotate(sAngle);
      ctx.beginPath();
      ctx.moveTo(-6 * scale, 0);
      ctx.quadraticCurveTo(-10 * scale, -sLen * 0.5, 0, -sLen);
      ctx.quadraticCurveTo(10 * scale, -sLen * 0.5, 6 * scale, 0);
      ctx.fillStyle = `rgb(${pal.leaves.base.join(',')})`;
      ctx.fill();
      ctx.restore();
    }

    // Concentric petals
    for (let i = numPetals - 1; i >= 0; i--) {
      const frac = i / numPetals;
      const petalBloom = smoothstep(1.0 - frac * 0.85, 1.0, bloom);
      if (petalBloom <= 0.01) continue;

      const angle = i * goldenAngle;
      const dist = Math.sqrt(frac) * maxR * (0.35 + 0.65 * petalBloom);

      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;

      const pWidth = (28 + 42 * frac) * scale * (0.4 + 0.6 * petalBloom);
      const pHeight = (24 + 36 * frac) * scale * (0.4 + 0.6 * petalBloom);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);

      ctx.beginPath();
      ctx.moveTo(-pWidth / 2, 0);
      ctx.bezierCurveTo(-pWidth * 0.6, -pHeight * 0.6, -pWidth * 0.3, -pHeight * 1.08, 0, -pHeight);
      ctx.bezierCurveTo(pWidth * 0.3, -pHeight * 1.08, pWidth * 0.6, -pHeight * 0.6, pWidth / 2, 0);
      ctx.closePath();

      const gradH = Math.max(1, pHeight || 1);
      const grad = ctx.createLinearGradient(0, 0, 0, -gradH);
      grad.addColorStop(0, `rgb(${fColor.shadow.join(',')})`);
      grad.addColorStop(0.5, `rgb(${fColor.base.join(',')})`);
      grad.addColorStop(1, `rgb(${fColor.highlight.join(',')})`);

      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = `rgba(${fColor.highlight.map(c => Math.min(255, c + 30)).join(',')}, 0.75)`;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 14 * scale * (1 - 0.4 * bloom), 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${fColor.shadow.join(',')})`;
    ctx.fill();
  }

  function drawRoseBud(ctx, prog, scale, fColor, pal) {
    const budH = (45 + 35 * prog) * scale;
    const budW = (18 + 16 * prog) * scale;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -budH);
    ctx.bezierCurveTo(budW, -budH * 0.5, budW * 1.1, 0, 0, 10);
    ctx.bezierCurveTo(-budW * 1.1, 0, -budW, -budH * 0.5, 0, -budH);
    ctx.fillStyle = `rgb(${pal.leaves.base.join(',')})`;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -budH * 0.95);
    ctx.bezierCurveTo(budW * 0.6, -budH * 0.5, budW * 0.6, -budH * 0.2, 0, 0);
    ctx.bezierCurveTo(-budW * 0.6, -budH * 0.2, -budW * 0.6, -budH * 0.5, 0, -budH * 0.95);
    ctx.fillStyle = `rgb(${fColor.base.join(',')})`;
    ctx.fill();

    ctx.restore();
  }

  // --- SPECIES 2: SPIDER CHRYSANTHEMUM ---
  function drawBountifulChrysanthemum(ctx, growth, scale, fColor, pal, seed) {
    if (growth < 0.18) {
      drawChrysanthemumBud(ctx, growth / 0.18, scale, fColor, pal);
      return;
    }

    const bloom = easeOutCubic((growth - 0.18) / 0.82);
    const rings = 6;
    const floretsPerRing = [12, 16, 20, 22, 24, 26];

    for (let s = 0; s < 6; s++) {
      const sAngle = (s * Math.PI * 2) / 6;
      ctx.save();
      ctx.rotate(sAngle);
      ctx.beginPath();
      ctx.moveTo(-5 * scale, 0);
      ctx.lineTo(0, -35 * scale);
      ctx.lineTo(5 * scale, 0);
      ctx.fillStyle = `rgb(${pal.leaves.shadow.join(',')})`;
      ctx.fill();
      ctx.restore();
    }

    for (let r = rings - 1; r >= 0; r--) {
      const ringFrac = r / rings;
      const count = floretsPerRing[r];
      const maxLen = (45 + r * 16) * scale * (0.3 + 0.7 * bloom);
      const ringBloom = smoothstep(1.0 - ringFrac * 0.8, 1.0, bloom);

      if (ringBloom <= 0.01) continue;

      for (let f = 0; f < count; f++) {
        const baseAngle = (f * Math.PI * 2) / count + (r * 0.35);
        const len = maxLen * (0.9 + 0.2 * Math.sin(f * 3.7 + seed));
        const curve = (25 + r * 6) * ringBloom * (f % 2 === 0 ? 1 : -1) * 0.5;

        ctx.save();
        ctx.rotate(baseAngle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(curve, -len * 0.6, curve * 1.3, -len);

        const gradLen = Math.max(1, len || 1);
        const floretGrad = ctx.createLinearGradient(0, 0, curve * 1.3, -gradLen);
        floretGrad.addColorStop(0, `rgb(${fColor.shadow.join(',')})`);
        floretGrad.addColorStop(0.6, `rgb(${fColor.base.join(',')})`);
        floretGrad.addColorStop(1, `rgb(${fColor.highlight.join(',')})`);

        ctx.strokeStyle = floretGrad;
        ctx.lineWidth = (3.5 + (1 - ringFrac) * 1.5) * scale;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(curve * 1.3, -len, 2.5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${fColor.highlight.join(',')})`;
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.beginPath();
    ctx.arc(0, 0, 16 * scale * bloom, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${pal.stamens.anther.join(',')})`;
    ctx.fill();
  }

  function drawChrysanthemumBud(ctx, prog, scale, fColor, pal) {
    const r = (16 + 18 * prog) * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${pal.leaves.base.join(',')})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -r * 0.3, r * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${fColor.base.join(',')})`;
    ctx.fill();
    ctx.restore();
  }

  // --- SPECIES 3: ROYAL ASIATIC LILY ---
  function drawBountifulLily(ctx, growth, scale, fColor, pal, seed) {
    if (growth < 0.22) {
      drawLilyBud(ctx, growth / 0.22, scale, fColor, pal);
      return;
    }

    const bloom = easeOutCubic((growth - 0.22) / 0.78);
    const petalLen = 100 * scale * (0.35 + 0.65 * bloom);
    const petalW = 40 * scale * (0.30 + 0.70 * bloom);
    const recurve = 35 * bloom;

    const outerIndices = [0, 2, 4];
    const innerIndices = [1, 3, 5];
    const breath = Math.sin(state.time * 2.0 + seed) * 2;

    ctx.save();
    ctx.rotate(Math.PI / 6);

    outerIndices.forEach((i) => {
      const angle = (i * Math.PI) / 3;
      drawSinglePetal(ctx, angle, petalLen * 0.95 + breath, petalW * 0.88, recurve, bloom, fColor, pal, false);
    });

    ctx.beginPath();
    ctx.arc(0, 0, 18 * scale * bloom, 0, Math.PI * 2);
    const throatGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22 * scale * bloom);
    throatGrad.addColorStop(0, `rgb(${fColor.shadow.join(',')})`);
    throatGrad.addColorStop(0.5, `rgb(${fColor.base.join(',')})`);
    throatGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = throatGrad;
    ctx.fill();

    innerIndices.forEach((i) => {
      const angle = (i * Math.PI) / 3;
      drawSinglePetal(ctx, angle, petalLen + breath, petalW, recurve, bloom, fColor, pal, true);
    });

    if (bloom > 0.35) {
      drawStamensAndPistil(ctx, scale, bloom, state.time, pal, fColor);
    }

    ctx.restore();
  }

  function drawLilyBud(ctx, budProg, scale, fColor, pal) {
    const budH = (50 + 35 * budProg) * scale;
    const budW = (16 + 14 * budProg) * scale;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -budH);
    ctx.bezierCurveTo(budW, -budH * 0.6, budW * 1.2, 0, 0, 12);
    ctx.bezierCurveTo(-budW * 1.2, 0, -budW, -budH * 0.6, 0, -budH);
    ctx.closePath();

    const budGrad = ctx.createLinearGradient(0, 12, 0, -budH);
    budGrad.addColorStop(0, `rgb(${pal.stems.base.join(',')})`);
    budGrad.addColorStop(0.35, `rgb(${fColor.shadow.join(',')})`);
    budGrad.addColorStop(0.85, `rgb(${fColor.base.join(',')})`);
    budGrad.addColorStop(1, `rgb(${fColor.highlight.join(',')})`);

    ctx.fillStyle = budGrad;
    ctx.fill();

    ctx.strokeStyle = `rgba(${fColor.shadow.join(',')}, 0.85)`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -budH);
    ctx.quadraticCurveTo(budW * 0.4, -budH * 0.5, 0, 12);
    ctx.stroke();

    ctx.restore();
  }

  function drawSinglePetal(ctx, angle, len, width, recurve, bloom, fColor, pal, isInner) {
    ctx.save();
    ctx.rotate(angle);

    const tipY = -len;
    const midY = -len * 0.52;
    const halfW = width / 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-halfW * 0.75, -len * 0.2, -halfW * 1.15, midY, 0, tipY);
    ctx.bezierCurveTo(halfW * 1.15, midY, halfW * 0.75, -len * 0.2, 0, 0);
    ctx.closePath();

    ctx.fillStyle = `rgb(${fColor.shadow.join(',')})`;
    ctx.fill();

    const gradLen = Math.max(1, len || 1);
    const petalGrad = ctx.createLinearGradient(0, 0, 0, -gradLen);
    petalGrad.addColorStop(0, `rgb(${fColor.shadow.join(',')})`);
    petalGrad.addColorStop(0.3, `rgb(${fColor.base.join(',')})`);
    petalGrad.addColorStop(0.85, `rgb(${fColor.highlight.join(',')})`);
    petalGrad.addColorStop(1, `rgb(${fColor.highlight.map(c => Math.min(255, c + 25)).join(',')})`);

    ctx.fillStyle = petalGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(0, midY, 0, tipY);
    ctx.strokeStyle = `rgba(${fColor.highlight.join(',')}, 0.85)`;
    ctx.lineWidth = isInner ? 2.2 : 1.5;
    ctx.stroke();

    if (bloom > 0.35) {
      ctx.fillStyle = `rgb(${fColor.spots.join(',')})`;
      const spotCount = isInner ? 12 : 7;
      for (let s = 0; s < spotCount; s++) {
        const sy = -len * (0.12 + (s / spotCount) * 0.45);
        const sx = ((s % 2 === 0 ? 1 : -1) * (3.5 + (s * 1.6))) * (halfW / 22);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawStamensAndPistil(ctx, scale, bloom, time, pal, fColor) {
    const stamenProg = smoothstep(0.35, 0.95, bloom);
    const len = 52 * scale * stamenProg;

    const filCol = `rgb(${pal.stamens.filament.join(',')})`;
    const antherCol = `rgb(${pal.stamens.anther.join(',')})`;

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + Math.PI / 6;
      const spreadX = Math.cos(angle) * len;
      const spreadY = Math.sin(angle) * len;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(spreadX * 0.45, spreadY * 0.25, spreadX, spreadY);
      ctx.strokeStyle = filCol;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.translate(spreadX, spreadY);
      ctx.rotate(angle + Math.PI / 2);

      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * scale, 3.2 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = antherCol;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, -1, 6 * scale, 1.4 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fff9bd';
      ctx.fill();

      ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len * 1.08);
    ctx.strokeStyle = '#d2f2be';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -len * 1.08, 4.0 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#82b36b';
    ctx.fill();
  }

  // --- SPECIES 4: ROMANTIC PEONY ---
  function drawBountifulPeony(ctx, growth, scale, fColor, pal, seed) {
    if (growth < 0.20) {
      drawPeonyBud(ctx, growth / 0.20, scale, fColor, pal);
      return;
    }

    const bloom = easeOutCubic((growth - 0.20) / 0.80);
    const layers = 5;
    const petalsPerLayer = [8, 10, 12, 14, 16];
    const maxR = 95 * scale * (0.3 + 0.7 * bloom);

    for (let l = layers - 1; l >= 0; l--) {
      const lFrac = l / layers;
      const count = petalsPerLayer[l];
      const dist = (0.2 + 0.75 * lFrac) * maxR;
      const pW = (32 + lFrac * 38) * scale;
      const pH = (28 + lFrac * 36) * scale;

      const layerBloom = smoothstep(1.0 - lFrac * 0.75, 1.0, bloom);
      if (layerBloom <= 0.01) continue;

      for (let p = 0; p < count; p++) {
        const angle = (p * Math.PI * 2) / count + (l * 0.4);
        const px = Math.cos(angle) * dist * layerBloom;
        const py = Math.sin(angle) * dist * layerBloom;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);

        ctx.beginPath();
        ctx.moveTo(-pW / 2, 0);
        ctx.bezierCurveTo(-pW * 0.7, -pH * 0.5, -pW * 0.4, -pH * 1.15, -pW * 0.15, -pH * 0.95);
        ctx.bezierCurveTo(0, -pH * 1.12, pW * 0.4, -pH * 1.15, pW / 2, 0);
        ctx.closePath();

        const gradH = Math.max(1, pH || 1);
        const pGrad = ctx.createLinearGradient(0, 0, 0, -gradH);
        pGrad.addColorStop(0, `rgb(${fColor.shadow.join(',')})`);
        pGrad.addColorStop(0.5, `rgb(${fColor.base.join(',')})`);
        pGrad.addColorStop(1, `rgb(${fColor.highlight.join(',')})`);

        ctx.fillStyle = pGrad;
        ctx.fill();

        ctx.strokeStyle = `rgba(${fColor.highlight.map(c => Math.min(255, c + 20)).join(',')}, 0.65)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
      }
    }

    if (bloom > 0.4) {
      for (let st = 0; st < 20; st++) {
        const sAngle = (st * Math.PI * 2) / 20;
        const sDist = Math.random() * 12 * scale * bloom;
        ctx.beginPath();
        ctx.arc(Math.cos(sAngle) * sDist, Math.sin(sAngle) * sDist, 2.2 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${pal.stamens.anther.join(',')})`;
        ctx.fill();
      }
    }
  }

  function drawPeonyBud(ctx, prog, scale, fColor, pal) {
    const r = (18 + 22 * prog) * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${pal.leaves.base.join(',')})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -r * 0.4, r * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${fColor.base.join(',')})`;
    ctx.fill();
    ctx.restore();
  }

  // --- HIGH-PERFORMANCE ASCII RASTERIZER ---
  function rasterizeToAscii(ctx, offCtx, time) {
    const w = state.width;
    const h = state.height;
    const cw = state.charWidth;
    const ch = state.charHeight;
    const cols = state.cols;
    const rows = state.rows;

    const imgData = offCtx.getImageData(0, 0, w, h);
    const pixels = imgData.data;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    const ramp = RAMPS[state.asciiMode] || RAMPS.classic;
    const rampLen = ramp.length;

    ctx.font = `600 ${ch - 1}px 'Consolas', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace`;
    ctx.textBaseline = 'top';

    for (let r = 0; r < rows; r++) {
      const py = r * ch;
      for (let c = 0; c < cols; c++) {
        const px = c * cw;
        const sampleX = Math.min(w - 1, px + Math.floor(cw / 2));
        const sampleY = Math.min(h - 1, py + Math.floor(ch / 2));
        const idx = (sampleY * w + sampleX) * 4;

        const a = pixels[idx + 3];

        if (a > 15) {
          const red = pixels[idx];
          const green = pixels[idx + 1];
          const blue = pixels[idx + 2];

          const lum = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
          const maxChan = Math.max(red, green, blue) / 255;
          const intensity = 0.42 * lum + 0.58 * maxChan;

          const jitter = Math.sin(c * 17.1 + r * 23.3 + time * 6) * 0.04;
          const normLum = Math.max(0, Math.min(1, intensity + jitter));
          const charIdx = 1 + Math.floor(normLum * (rampLen - 2));
          const char = ramp[charIdx];

          const boost = 1.22;
          const rB = Math.min(255, Math.floor(red * boost));
          const gB = Math.min(255, Math.floor(green * boost));
          const bB = Math.min(255, Math.floor(blue * boost));
          const alphaNorm = Math.min(1, (a / 255) * 1.2);

          ctx.fillStyle = `rgba(${rB}, ${gB}, ${bB}, ${alphaNorm})`;
          ctx.fillText(char, px, py);
        }
      }
    }

    // Keep the landing completely black: pollen and vignette only arrive with the bloom
    if (state.stage === 'seedling') return;

    renderParticles(ctx, time);

    if (state.scanlines) {
      renderScanlines(ctx, w, h, ch);
    }
  }

  function renderParticles(ctx, time) {
    ctx.save();
    state.particles.forEach((p) => {
      p.x += p.vx + state.wind.x * 0.6;
      p.y += p.vy;
      p.alpha += Math.sin(time * 3 + p.x) * p.twinkleSpeed;

      if (p.y < 0) {
        p.y = state.height;
        p.x = Math.random() * state.width;
      }
      if (p.x < 0) p.x = state.width;
      if (p.x > state.width) p.x = 0;

      const normAlpha = Math.max(0.12, Math.min(0.88, Math.abs(Math.sin(p.alpha))));
      ctx.fillStyle = `rgba(255, 238, 190, ${normAlpha})`;
      ctx.fillText(p.char, p.x, p.y);
    });
    ctx.restore();
  }

  function renderScanlines(ctx, w, h, ch) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
    for (let y = 0; y < h; y += ch) {
      ctx.fillRect(0, y, w, 1);
    }
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.22, w / 2, h / 2, w * 0.78);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.60)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // --- TIME-LAPSE & LIFECYCLE ANIMATION LOOP ---
  let lastTime = performance.now();

  function renderLoop(currentTime) {
    requestAnimationFrame(renderLoop);

    const delta = Math.min(0.1, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    if (state.isPlaying) {
      state.time += delta * state.speed;

      // 2. STAGE: CONTINUOUS TIME-LAPSE BLOOMING & BREATHING
      if (state.stage === 'blooming') {
        if (state.loopMode) {
          if (state.loopDirection === 1) {
            state.progress += delta * 0.14 * state.speed;
            if (state.progress >= 1.0) {
              state.progress = 1.0;
              state.pauseAtPeak += delta;
              // Linger at peak glory for 5.0 seconds
              if (state.pauseAtPeak > 5.0) {
                state.pauseAtPeak = 0;
                state.loopDirection = -1;
              }
            }
          } else {
            // Gentle rhythmic contraction back to swelling buds
            state.progress -= delta * 0.12 * state.speed;
            if (state.progress <= 0.22) {
              state.progress = 0.22;
              state.loopDirection = 1;
              playBloomTone(392.0, 0.8);
            }
          }
        }

      }
    }

    // Spring-damped mouse breeze
    state.wind.velocity += (state.wind.targetX - state.wind.x) * 4 * delta;
    state.wind.velocity *= 0.88;
    state.wind.x += state.wind.velocity;

    // Render Scene & Rasterize
    drawMasterScene(state.offCtx, state.progress, state.time);
    rasterizeToAscii(state.ctx, state.offCtx, state.time);
  }

  // --- DOSSIER & THEME MANAGERS ---
  function updateDossier(speciesKey) {
    const dossier = BOTANICAL_DOSSIERS[speciesKey] || BOTANICAL_DOSSIERS.grand;
    document.body.setAttribute('data-species', speciesKey);

    const tag = document.getElementById('bio-species-tag');
    const name = document.getElementById('bio-name');
    const botName = document.getElementById('bio-botanical-name');
    const desc = document.getElementById('bio-description');
    const fact = document.getElementById('bio-fact');

    if (tag) tag.innerHTML = dossier.tag;
    if (name) name.textContent = dossier.name;
    if (botName) botName.innerHTML = dossier.botanicalName;
    if (desc) desc.textContent = dossier.desc;
    if (fact) {
      // Formatted with line breaks if any (e.g. inside joke for chrysanthemums)
      fact.innerHTML = dossier.fact.replace(/\n/g, '<br>');
    }

    const note = document.getElementById('bio-note');
    if (note) note.textContent = dossier.note;
  }

  function updateTheme(themeKey) {
    const pal = PALETTES[themeKey] || PALETTES.original;
    state.palette = themeKey;

    // Swap only the theme class so state classes like "is-bloomed" survive
    Object.values(PALETTES).forEach((p) => document.body.classList.remove(p.themeClass));
    document.body.classList.add(pal.themeClass);
    document.body.setAttribute('data-species', state.species);

    document.querySelectorAll('[data-theme-key]').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.themeKey === themeKey);
    });
  }

  // Pixel-art intro hands the stage over to the ASCII bloom
  function startBloom() {
    state.stage = 'blooming';
    state.progress = 0.04;
    state.loopDirection = 1;
    state.pauseAtPeak = 0;
    playBloomWhoosh();
    document.body.classList.add('is-bloomed');
  }

  function resetToSeedling() {
    state.stage = 'seedling';
    state.progress = 0.05;
    document.body.classList.remove('is-bloomed');
  }

  // --- INTERACTIVITY & CONTROLS SETUP ---
  function setupInteractions() {
    window.addEventListener('mousemove', (e) => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
      state.mouse.active = true;

      const normX = (e.clientX - state.width / 2) / (state.width / 2);
      state.wind.targetX = normX * 0.85;
    });

    window.addEventListener('mouseleave', () => {
      state.wind.targetX = 0;
      state.mouse.active = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        const normX = (t.clientX - state.width / 2) / (state.width / 2);
        state.wind.targetX = normX * 0.85;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      state.wind.targetX = 0;
    });
  }

  function setupControls() {
    // 1. SPECIES CHIPS
    document.querySelectorAll('[data-species-key]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.speciesKey;
        if (!BOUQUET_SCHEMES[key] || key === state.species) return;
        state.species = key;
        document.querySelectorAll('[data-species-key]').forEach((c) => c.classList.toggle('is-active', c === chip));
        updateDossier(key);
        // Swap content with a little re-entry flourish
        const card = document.getElementById('botanical-card');
        if (card) {
          card.classList.remove('is-swapping');
          void card.offsetWidth;
          card.classList.add('is-swapping');
        }
        if (state.stage === 'blooming') {
          state.progress = 0.20;
          state.loopDirection = 1;
          playBloomTone(523.25, 0.6);
        }
      });
    });

    // 2. THEME SWATCHES
    document.querySelectorAll('[data-theme-key]').forEach((sw) => {
      sw.addEventListener('click', () => {
        updateTheme(sw.dataset.themeKey);
        playBloomTone(659.25, 0.4);
      });
    });

    // 3. SOUND TOGGLE
    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        soundBtn.classList.toggle('is-off', !state.soundEnabled);
        soundBtn.setAttribute('aria-pressed', String(state.soundEnabled));
        if (state.soundEnabled) playBloomTone(523.25, 0.4);
      });
    }

    // 4. BIO CARD COLLAPSE
    const bioToggle = document.getElementById('bio-toggle');
    const bioContainer = document.getElementById('botanical-card-container');
    if (bioToggle && bioContainer) {
      bioToggle.addEventListener('click', () => {
        const collapsed = bioContainer.classList.toggle('is-collapsed');
        bioToggle.setAttribute('aria-expanded', String(!collapsed));
      });
    }

    // Keyboard Shortcuts (Space / W to water is handled by the intro)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const key = e.key.toLowerCase();
      if (key === 's') {
        if (soundBtn) soundBtn.click();
      } else if (key === 'h') {
        document.body.classList.toggle('ui-hidden');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Window API used by the pixel-art intro (garden_intro.js) and for debugging
  window.AsciiBotanicalGarden = {
    state,
    startBloom,
    resetToSeedling,
    sfx: {
      step: playFootstepSound,
      pour: playWaterPourSound,
      tone: playBloomTone,
      whoosh: playBloomWhoosh,
    },
    setSpecies: (s) => {
      const chip = document.querySelector(`[data-species-key="${s}"]`);
      if (chip) chip.click();
    },
    setTheme: (t) => {
      if (PALETTES[t]) updateTheme(t);
    },
  };
})();
