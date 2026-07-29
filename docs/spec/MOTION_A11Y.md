# Motion & accessibility — Sen web

**Status:** Implemented (web phase 6)  
**Complements:** [VISUAL_SYSTEM.md](./VISUAL_SYSTEM.md), [WEB_SCREENS.md](./WEB_SCREENS.md), [WIREFRAMES.md](../WIREFRAMES.md) §8–9

---

## 1. Motion principles

- Motion supports **presence and hierarchy**, not decoration spam.  
- Ship **2–3 intentional motions** for this phase (see below).  
- No particle systems, no glow pulses on text, no continuous distracting loops on in-app data screens.  
- Wireframes already discourage decorative particle/glow — this spec agrees.

---

## 2. Allowed motions (this phase)

| ID | Where | Behavior | Duration / easing |
|----|-------|----------|-------------------|
| `M1` Enter | Landing, login, app pages | Existing `fade-up` / staggered delays for copy blocks | ~500–700ms, ease-out |
| `M2` Lotus / moon atmosphere | Landing (and login soft) | Moon float **slower/quieter**; optional lotus mark drift **≤ 4px** translateY | Moon ~8–10s loop; lotus ~10–12s; low amplitude |
| `M3` State change | Today when fasting status loads | Soft fade/crossfade of status block opacity | ≤ 300ms |

**Not in this phase:** calendar month swipe animation (nice-to-have later), checkmark confetti, scroll-linked parallax.

---

## 3. Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* disable M1–M3 decorative loops and transforms */
}
```

Requirements:

- [x] `floatMoon`, `softPulse`, lotus drift → `animation: none` (or static final frame)  
- [x] `fade-up` transforms → opacity-only or instant  
- [x] No autoplay motion that cannot be paused via OS setting  

Existing `globals.css` reduced-motion block must be **extended**, not removed.

---

## 4. Focus & keyboard

| Control | Requirement |
|---------|-------------|
| Links / buttons | Visible focus ring: jade or `--lotus-mist` halo; never `outline: none` without replacement |
| App nav | `aria-label` on `<nav>`; active route conveyed by text + `aria-current="page"` (add if missing) |
| Language switcher | Keyboard reachable; pressed state clear |
| Auth fields | Label associated with input; error text linked via `aria-describedby` where practical |

Focus ring contrast on foam/mist backgrounds must remain visible (jade-800 ring ≥ 2px or equivalent shadow ring).

---

## 5. Color contrast

| Pairing | Rule |
|---------|------|
| `--ink` on `--foam` / paper | Body text — keep |
| White on `--jade-800` | Primary button — keep |
| `--lotus-deep` on mist / `--lotus-mist` wash | Fasting status — verify **WCAG AA** for text ≥ 1.25rem; if fail, darken toward `#8a3844` or thicken weight |
| `--muted` on foam | Meta only; do not use for primary status |
| Fasting vs not fasting | Must not rely on color alone — lotus mark / label text required on Today |

Do not use `--lotus` (`#c45c6a`) for small body text on white without checking AA; prefer `--lotus-deep` for text.

---

## 6. Semantics & assets

- Decorative lotus/moon: `aria-hidden="true"`.  
- Wordmark “Sen” remains real text (not image-only) for i18n-independent brand and SEO.  
- Calendar fasting cells: convey fasting in text layer or `title`/`aria-label` on cell if dot is the only visual cue.  
- Prefer `lang` on document from existing i18n provider behavior.

---

## 7. Performance

- Lotus SVG inline or single small component — no heavy Lottie this phase.  
- Keep CSS noise overlay; do not add video backgrounds.  
- Avoid animating large `filter`/`box-shadow` on scroll.

---

## 8. Acceptance checklist

- [x] Only M1–M3 (or subset) ship; no extra loops on Calendar/Reminders  
- [x] `prefers-reduced-motion: reduce` verified manually in browser  
- [x] Keyboard tab order: landing CTAs → login form → app nav → content  
- [x] Fasting state understandable in grayscale (mark + copy)  
- [x] No emoji used as UI icons  
