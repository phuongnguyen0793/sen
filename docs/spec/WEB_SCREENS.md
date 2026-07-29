# Web screens — composition specs

**Status:** Spec for `apps/web` routes  
**Visual tokens:** [VISUAL_SYSTEM.md](./VISUAL_SYSTEM.md)  
**IA reference:** [WIREFRAMES.md](../WIREFRAMES.md) (structure only; look-and-feel is this doc)

---

## Global composition rules

1. **One job per screen** — one H1, one short support line where needed, one primary focal block.  
2. **Brand test (landing):** strip the top chrome; remaining viewport must still read as Sen via **wordmark + lotus**.  
3. **Hero budget (landing):** brand, one tagline, one CTA group, one dominant visual plane (pond mist + lotus over moon). No stats, schedules, or promo chips on first viewport.  
4. **No hero overlays:** no floating badges/stickers on the landing visual.  
5. **Cards:** not in landing hero; OK for auth and in-app status/controls.

---

## 1. Landing — `/`

**File today:** `apps/web/src/app/page.tsx`

### Job

Introduce Sen and route to sign-in or app.

### First viewport inventory (allowed)

| Element | Required | Notes |
|---------|----------|-------|
| Language switcher | Yes | Top-end; quiet |
| Sign out (if authed) | Optional | Quiet link |
| Lotus mark | Yes | Primary motif; optically above moon |
| Wordmark `Sen` | Yes | Display size per visual system |
| Tagline (i18n) | Yes | Single sentence |
| CTA group | Yes | Primary + optional ghost |
| Moon + rings | Yes | Secondary; behind lotus/copy |
| Footer line | Yes | Below fold OK on short phones |

### Forbidden on first viewport

Stats, feature grids, calendar previews, address blocks, “this week” lists, extra marketing sections.

### Layout

```
┌──────────────────────────────────────────────┐
│                         [EN|VI]  [Sign out?] │
│                                              │
│              (moon + rings, faded)           │
│                   [lotus]                    │
│                    Sen                       │
│              tagline one line                │
│            [ Primary ]  [ Ghost ]            │
│                                              │
│              footer meta                     │
└──────────────────────────────────────────────┘
```

- Full-viewport single composition (not a dashboard).  
- Visual plane is **full-bleed background** (existing body gradients) + centered stage; do not inset a media card.  
- CTA: jade primary; ghost secondary. If authenticated: single primary “Open app”.

### Acceptance

- [ ] Lotus is clearer brand signal than moon  
- [ ] Moon still present but quieter than current “moon-as-logo” weight  
- [ ] No card chrome around hero copy

---

## 2. Login — `/login`

**File today:** `apps/web/src/app/login/page.tsx`

### Job

Sign in or register.

### Inventory

| Element | Notes |
|---------|-------|
| Quiet lotus + “Sen” link home | Header of card or above card |
| Moon (secondary) | Soft backdrop behind card; lower opacity than landing |
| Title | Login / Register (i18n) |
| Form | Email, password, submit |
| Mode toggle | Text button, not a second primary CTA |
| Language switcher | Top of shell |

### Layout

- Centered **one** auth card (`--radius`, `--shadow-soft`, `--paper` glass).  
- Card is the interaction container (card allowed).  
- No social OAuth UI (API still 501).

### Acceptance

- [ ] Brand row uses lotus + Sen, not moon alone  
- [ ] Form errors use `--danger`; no pink lotus for errors

---

## 3. App shell — `/app/*`

**File today:** `apps/web/src/app/app/layout.tsx`

### Job

Orient within Today / Calendar / Reminders.

### Inventory

| Element | Spec |
|---------|------|
| Brand | `LotusMark` (22–28px) + “Sen” text link → `/app` |
| Actions | Language, Home, Sign out — quiet |
| Nav | Segmented: Today · Calendar · Reminders |
| Content | `.container` max 980px |

### Rules

- Shell is chrome only; no second hero.  
- Active nav = jade pill segment (existing pattern).  
- Do not add notification bells or avatar menus this phase.

### Acceptance

- [ ] Header brand includes lotus mark  
- [ ] Nav labels remain text-only

---

## 4. Today — `/app`

**File today:** `apps/web/src/app/app/page.tsx`

### Job

Answer: “Do I fast today?” plus solar/lunar context.

### Hero budget (in-app)

| Element | Required |
|---------|----------|
| Page title | Yes (`messages.today.title`) |
| Status block | Yes — one focal surface |
| Solar date | Yes |
| Lunar date | Yes |
| Fasting / not fasting line | Yes |
| Small lotus mark | Yes **if fasting**; optional/hidden if not |
| Next fasting day | Optional **one** quiet line under hero — only if data already cheap to add; else defer (no new API inventing in this visual phase) |
| Streak / stats / recipes | **No** |

### Status block styling

| State | Background | Status text | Motif |
|-------|------------|-------------|-------|
| Fasting | mist + `--lotus-mist` | `--lotus-deep` | Small lotus |
| Not fasting | paper / soft mist | `--jade-900` | No lotus ink |

### Layout

```
┌─────────────────────────────────────┐
│  Sen …                    nav pills │
│  Today                              │
│  ┌───────────────────────────────┐  │
│  │  badge                         │  │
│  │  solar                         │  │
│  │  lunar                         │  │
│  │  status (+ lotus if fasting)   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Acceptance

- [ ] Exactly one primary status card  
- [ ] Fasting vs not fasting distinguishable by color **and** motif, not color alone  
- [ ] No stat strip above or beside the hero

---

## 5. Calendar — `/app/calendar`

**File today:** `apps/web/src/app/app/calendar/page.tsx`

### Job

Scan the month for fasting days; see solar + lunar in cells.

### Inventory

| Element | Spec |
|---------|------|
| Month controls | Existing prev/next or chips |
| Grid | 7 columns; solar + lunar in cell |
| Today | Jade ring / border (keep) |
| Fasting day | Mist wash + **lotus dot** (replace jade-only dot if present) |
| List below (upcoming / fasting in month) | Optional existing list; quiet cards OK |
| Legend | One line: lotus dot = fasting (if not obvious) |

### Rules

- Do not turn the month grid into cards-per-day.  
- Do not overlay badges on cells other than today ring + fasting dot.  
- Keep dual calendar readability (solar primary, lunar secondary muted).

### Acceptance

- [ ] Fasting marker uses lotus color/shape per visual system  
- [ ] Today marker remains jade (role separation: today ≠ fasting)

---

## 6. Reminders — `/app/reminders`

**File today:** `apps/web/src/app/app/reminders/page.tsx`

### Job

Choose fasting preset; edit reminder slots.

### Inventory

| Element | Spec |
|---------|------|
| Page title | Yes |
| Preset list | Selectable rows (`--radius-sm`); selected = jade border or mist fill |
| Reminder slots | Existing toggles/times; one group |
| Save / feedback | Existing success pattern |

### Rules

- One purpose: configure reminders — no calendar embed.  
- Reduce nested card-in-card if present; preset row ≠ heavy shadowed card unless needed for hit target.  
- Lotus accent only on fasting-related selected state if helpful; otherwise jade selection is enough.

### Acceptance

- [ ] Screen still one column, calm density  
- [ ] Primary save/action remains jade

---

## 7. Responsive

| Breakpoint | Behavior |
|------------|----------|
| < 480px | Landing stage full width; CTAs stack if needed; brand clamp already fluid |
| ≥ 480px | CTAs in a row |
| App | Container padding ≥ 1rem; nav may wrap but prefer single row scroll if needed |

Touch targets for nav/CTA ≥ **44px** height.

---

## 8. Out of scope screens

Onboarding, recipes, settings beyond reminders, marketing blog — not in this redesign phase.
