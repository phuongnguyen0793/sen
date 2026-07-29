# Sen — Web visual redesign specs

**Status:** Locked for implementation (web only)  
**Date:** 2026-07-29  
**Scope:** `apps/web` only. Mobile parity is out of scope until a later phase.  
**Depends on:** [PRODUCT_ASSUMPTIONS.md](../PRODUCT_ASSUMPTIONS.md) (brand Sen = lotus), current Lotus Pond tokens in `apps/web/src/app/globals.css`

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Platforms this phase | **Web first** |
| Brand motif | **Lotus primary**, **moon secondary** |
| Cultural tone | **International minimal** — calm and soft; no kitsch, no religious iconography, no dense “áo dài / temple” ornament |
| Starting point | Extend current jade-mist system; do not invent a second theme |

## Spec index

| Doc | Contents |
|-----|----------|
| [VISUAL_SYSTEM.md](./VISUAL_SYSTEM.md) | Color, type, radius, elevation, motif assets, component rules |
| [WEB_SCREENS.md](./WEB_SCREENS.md) | Landing, login, app shell, Today, Calendar, Reminders — composition budgets |
| [MOTION_A11Y.md](./MOTION_A11Y.md) | Allowed motion, reduced-motion, contrast, focus |

## Non-goals (this phase)

- Mobile / Expo visual changes
- New product features (streak, recipes, check-in, onboarding flow)
- Dark mode
- Illustration packs beyond the lotus mark + moon secondary graphic
- Rewriting i18n copy except where a screen label is required by layout

## Implementation order (when coding starts)

1. ~~Tokens + lotus SVG mark in `globals.css` / shared component~~  
2. ~~Landing + Login~~  
3. ~~App shell + Today~~  
4. ~~Calendar accents~~  
5. ~~Reminders polish~~  
6. ~~Motion + a11y pass per [MOTION_A11Y.md](./MOTION_A11Y.md)~~

## Acceptance (whole phase)

- [ ] Removing the nav still leaves a first viewport that reads as **Sen** (lotus + wordmark), not a generic green calendar app  
- [ ] Moon remains visible on landing/login but is clearly **secondary** to lotus  
- [ ] No purple gradient theme, no terracotta/cream “AI default”, no glow stacks, no emoji decoration  
- [ ] Web screens listed in [WEB_SCREENS.md](./WEB_SCREENS.md) match their composition budgets  
- [ ] `prefers-reduced-motion: reduce` disables decorative motion  
