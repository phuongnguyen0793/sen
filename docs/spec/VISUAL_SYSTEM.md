# Visual system — Sen web (Ao Sen / international minimal)

**Status:** Spec for `apps/web`  
**Source of truth after implementation:** `apps/web/src/app/globals.css` + any `LotusMark` component must match this doc.

---

## 1. Brand metaphor

| Layer | Motif | Role |
|-------|--------|------|
| Primary | **Lotus** | Wordmark companion, fasting accent, Today “bloom” cue, calendar fasting marker |
| Secondary | **Moon** | Soft celestial backdrop on **landing** and **login** only; never the sole brand signal |
| Environment | **Mist / water** | Page background (jade + foam gradients already present) |

**International minimal means:**

- Prefer a side-profile bloom silhouette (e.g. Phosphor `flower-lotus`, MIT) over top-down “daisy” petals  
- Soft monochrome fill (`currentColor`) — not photoreal, not mandala, not clip-art outlines  
- No temple roofs, incense, prayer beads, lotus-with-Buddha silhouette  
- No Vietnamese decorative frames or “broadsheet” hairline newspaper layout  
- Copy stays bilingual EN/VI; visuals stay culturally soft, not illustrative folklore

---

## 2. Color tokens

Keep existing jade scale. **Activate and extend** lotus; do not replace jade as primary CTA.

### 2.1 Core (existing — keep)

| Token | Value | Use |
|-------|-------|-----|
| `--jade-950` | `#0c2a22` | Brand wordmark, strongest ink on foam |
| `--jade-900` … `--jade-500` | existing scale | Primary buttons, links, today ring, active nav |
| `--mist` | `#e8f1ed` | Soft surfaces, fasting wash base |
| `--mist-deep` | `#d4e5dc` | Stronger fasting tint |
| `--foam` | `#f7fbf9` | Page base |
| `--paper` | `rgba(255,255,255,0.72)` | Glass cards |
| `--paper-solid` | `#ffffff` | Opaque cards where blur is unsupported |
| `--ink` | `#122820` | Body text |
| `--ink-soft` | `#3d564c` | Secondary text |
| `--muted` | `#5f746a` | Meta, footer, quiet links |
| `--line` / `--line-strong` | existing | Borders |
| `--danger` | `#b42318` | Errors only |

### 2.2 Lotus (extend — currently unused)

| Token | Value | Use |
|-------|-------|-----|
| `--lotus` | `#c45c6a` | Accent ink on light (sparingly) |
| `--lotus-soft` | `#e8b4bc` | Soft petal fills / optional fills |
| `--lotus-mist` | `rgba(196, 92, 106, 0.12)` | Fasting bloom wash, focus halo |
| `--lotus-deep` | `#8a3844` | Fasting label text on mist (WCAG AA target) |

**Usage caps**

- At most **one** strong lotus ink element per viewport (e.g. fasting status word, or calendar legend).  
- Background lotus tint ≤ **12%** alpha (`--lotus-mist`).  
- Primary CTA stays **jade**, never lotus pink.

### 2.3 Moon (secondary graphic only)

| Token | Value | Use |
|-------|-------|-----|
| `--moon-core` | `#fff9f0` | Moon highlight |
| `--moon-mid` | `#f0e6d2` | Moon body |
| `--moon-edge` | `#d8c49a` | Moon rim |

Moon appears **behind** lotus + copy; opacity **0.55–0.75** so it reads as atmosphere, not logo.

### 2.4 Forbidden palettes this phase

- Purple / indigo brand gradients  
- Warm cream `#F4F1EA` + terracotta accent as the main look  
- Neon pink, gold foil, heavy drop-shadow stacks, glow blurs on type

---

## 3. Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display / brand | **Fraunces** (`--font-display`) | 550–600 | “Sen” hero, page titles |
| Body / UI | **Outfit** (`--font-body`) | 400–600 | Nav, forms, calendar cells |

| Element | Size | Line-height | Color |
|---------|------|-------------|-------|
| Landing brand `Sen` | `clamp(4rem, 14vw, 6.5rem)` | ~0.9 | `--jade-950` |
| Page title (app) | ~1.75–2rem | 1.15 | `--jade-950` |
| Body | 1rem | 1.55 | `--ink` |
| Meta / lunar line | 0.9–1rem | 1.45 | `--ink-soft` / `--muted` |
| Fasting status (Today) | 1.25–1.5rem | 1.3 | `--jade-900` default; `--lotus-deep` when fasting |

Do not introduce a third font family.

---

## 4. Shape & elevation

| Token | Value | Use |
|-------|-------|-----|
| `--radius` | `18px` | Cards, today hero, auth card |
| `--radius-sm` | `12px` | Inputs, calendar cells, preset rows |
| `--radius-pill` | `999px` | **Primary CTA only** + app segmented nav |
| Soft oval / lotus chip | `999px` on short axis **or** `40% / 60%` organic only for lotus badge | Fasting badge, calendar fasting dot container |

**Pill budget:** language switcher and secondary chips use `--radius-sm` or `999px` at **small** height (≤ 36px). Do not make every control a large pill.

| Elevation | Value | Use |
|-----------|-------|-----|
| `--shadow-card` | existing soft | Cards |
| `--shadow-soft` | existing | Auth / floating surfaces |
| No multi-layer neon glow | — | — |

---

## 5. Motif assets

### 5.1 Lotus mark (`LotusMark`)

- **Format:** inline SVG React component (accessible `aria-hidden` when decorative beside “Sen”).  
- **Geometry:** side-profile lotus bloom; prefer Phosphor Icons `flower-lotus` path (**MIT**) filled with `currentColor` (`--jade-800` / `--jade-900`).  
- **Avoid:** top-down multi-ellipse “daisy” with heavy outlines.  
- **Sizes:**  
  - Hero companion: **48–72px** near brand on landing  
  - App header: **22–28px** beside “Sen”  
  - Calendar fasting marker: **8–10px** mark tinted `--lotus`  
- **Clear space:** ≥ 0.25× mark width from unrelated controls.

### 5.2 Moon (secondary)

- Keep circular gradient moon + rings on **landing** and **login** only.  
- Scale down visually vs today: moon diameter ≤ **85%** of current landing moon, opacity ≤ **0.7**.  
- Lotus mark + wordmark sit **above** moon in z-order and optical weight (brand test: remove nav → still Sen via lotus + type).

### 5.3 Background

- Keep foam → mist vertical wash + soft jade/lotus radials + noise overlay.  
- Lotus radial already at ~8% — may raise to **10–12%** max on landing only.  
- No full-bleed photography; no stock lotus PNGs.

---

## 6. Component rules

### 6.1 Buttons

| Variant | Fill | Text | Radius |
|---------|------|------|--------|
| Primary `.btn` | `--jade-800` → hover `--jade-700` | white | pill |
| Ghost `.btn-ghost` | transparent / paper | `--jade-800` | pill |
| Quiet link | none | `--muted` | `8px` |

Never use lotus as button fill.

### 6.2 Cards

- Allowed for **interactive or status containers** (auth form, today status, reminder rows, calendar month panel).  
- Landing hero: **no card** wrapping brand + CTA.  
- If removing border/shadow/radius does not hurt understanding, drop the card chrome.

### 6.3 App nav

- Keep segmented control pattern.  
- Active: jade fill + white text (current).  
- Inactive: muted on translucent track.  
- Do not add icons in this phase (international minimal; text only).

### 6.4 Fasting affordance

| Context | Treatment |
|---------|-----------|
| Today fasting | Hero wash `--mist` + `--lotus-mist`; status color `--lotus-deep`; optional small lotus mark |
| Today not fasting | Mist/jade quiet; no lotus ink |
| Calendar cell fasting | Mist wash + lotus dot (not jade-only) |
| Calendar today | Jade ring (unchanged role) |

---

## 7. Density & whitespace

- App content max width: **980px** (existing `.container`).  
- Vertical rhythm: section title → **1rem** → primary block; avoid stacking >2 cards on Today.  
- Prefer one focal block per screen (see [WEB_SCREENS.md](./WEB_SCREENS.md)).

---

## 8. File / token checklist (implementation)

- [ ] Add `--lotus-soft`, `--lotus-mist`, `--lotus-deep` (and keep `--lotus`) in `:root`  
- [ ] Document moon tokens or map existing moon hexes to named vars  
- [ ] Add `LotusMark` (or equivalent) under `apps/web/src/components/`  
- [ ] Replace unused-lotus gap: fasting + markers consume lotus tokens  
- [ ] Audit pill usage: secondary chips → `--radius-sm` where spec requires  
