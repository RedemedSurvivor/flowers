# ASCII Botanical Garden & Time-Lapse Floral Simulation 🌸

An interactive procedural ASCII botanical engine, organic seedling time-lapse, and real-time ASCII rasterizer. Inspired by National Geographic botanical cinema and viral creative code experiments:
- **["Who needs flowers when you can code them?" — ASCII Lily Bouquet by @arimecoa](https://www.instagram.com/reel/De1IvFqSihx/)**
- **[Procedural seedling sprout & bloom dynamics](https://www.instagram.com/reel/DefhSsAoMJd/)**
- Reference: **[National Geographic Time-Lapse: Watch Flowers Bloom Before Your Eyes](https://www.youtube.com/watch?v=LjCzPp-MK48)**

![ASCII Floral Preview](preview.png)

---

## 🌺 The Experience

1. **🌱 A pure-black landing** — just a quote (*"For the days you need flowers & I'm not there to bring them… so I grew you some."*), a pixel-art seedling asking *"psst… water me?"*, and a glowing water-drop button.
2. **🧑‍🌾 The farmer** — tap the drop and a pixel-art farmer (straw hat, plaid shirt, overalls, watering can) walks in with *ta-ta-ta* footsteps, says hi, pours real falling water droplets onto the sprout, waits, and sends a little heart.
3. **💐 The bloom** — the sprout grows a bud, sparkles, and hands the stage to the ASCII bouquet, which grows from the same spot while the farmer strolls off.
4. **📜 Flower bio card** — appears after the bloom with a history blurb, a fun fact and *a note from me ♡* for each flower. Collapsible with the corner button.
5. **🎛️ Springy dock** — flower chips, colour-theme swatches, sound toggle and *water again*, with bouncy hover/press/jelly transitions (left rail on desktop, bottom bar on phones).

The quote lives only on the landing; once the flowers bloom, the screen belongs to them.

---

## 🌼 Flower Species

| Species | Morphology | Bloom Dynamics |
|---|---|---|
| **💐 Grand Garden Bouquet** | 13-bloom arrangement combining Lilies, Roses, Chrysanthemums, and Peonies | Multi-tiered bouquet growth with cascading lateral flowers |
| **🌹 English Garden Roses** | 32-petal Fibonacci spiral whorls ($137.5^\circ$), ruffled scalloped margins, velvety core | Sepals peel back, outer petals unroll, spiraled cabbage center opens |
| **🌼 Spider Chrysanthemums** | 80+ radiating curved quill/spoon florets across 6 concentric rings | Floral fireworks explosion; tubular florets arch and uncurl outward |
| **🌺 Royal Asiatic Lilies** | 6 massive recurved star tepals, throat papillae, 6 pollen stamens | Buds swell, split, tepals roll back in 3D, filaments spring forward |
| **🌸 Romantic Peonies** | 50+ layered, voluminous, crinkled ruffled petals | Round bud bursts open in pillowy, voluminous waves |

---

## 🔬 Dual-Canvas ASCII Rasterizer Engine

Directly rendering tens of thousands of colored DOM glyphs causes severe frame drops. This simulation runs on a high-speed **dual-canvas graphics pipeline**:

1. **Vector Geometry Canvas**: Renders high-precision Bezier petals, linear gradients, dynamic shadows, and leaf veins.
2. **Dual-Channel Intensity Mapping**:
   $$\text{Intensity} = 0.42 \times \text{Luminance} + 0.58 \times \max(R, G, B)$$
   Standard perceived luminance ($0.299R + 0.587G + 0.114B$) penalizes deep reds and rich greens. By blending luminance with maximum channel intensity, petals maintain vibrant character density across all glyph ramps.
3. **CRT Shimmer & Ambient Wind**: Micro-temporal glyph jitter and spring-damped cursor breeze physics create organic motion.

---

## 🚀 Getting Started

No build step or dependencies required. Open [`index.html`](index.html) in any modern browser:

```bash
# Serve locally
python -m http.server 5500
```
Visit `http://localhost:5500`.

### Keyboard Shortcuts
- `Space` or `W`: Water the seedling
- `S`: Toggle Audio
- `H`: Hide the dock and bio card for clean viewing
