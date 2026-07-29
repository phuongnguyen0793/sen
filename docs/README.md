# Sen documentation

Catalog for product, architecture, how-to guides, and implementation specs.

## Folders (by purpose)

| Folder | Purpose | Put here when… |
|--------|---------|----------------|
| [`product/`](./product/) | Why / what — decisions, UX, feature tracker | Brand rules, wireframes, “is it built?” |
| [`architecture/`](./architecture/) | How the system is designed | Cross-cutting tech design |
| [`guides/`](./guides/) | How-to run, ship, or test | Runbooks, deployment, device testing |
| [`specs/`](./specs/) | Time-bound build contracts | Feature/implementation specs before/during coding |
| [`calendar/`](./calendar/) | Lunar golden vectors + scripts | Calendar algorithm reference data |

**Do not** add new evergreen docs at the flat `docs/*.md` root (except this README). Prefer the folders above, then link from this index.

### Adding a doc

1. Pick the folder that matches purpose (guide vs spec vs product).
2. Prefer **kebab-case** for brand-new filenames; existing `SCREAMING_SNAKE` names stay as moved.
3. Add a one-line entry in the index below.
4. Link related docs with **relative** paths inside the tree.

---

## Index

### Product

| Doc | Description |
|-----|-------------|
| [PRODUCT_ASSUMPTIONS.md](./product/PRODUCT_ASSUMPTIONS.md) | Locked product decisions (brand Sen, auth, AI, tone) |
| [WIREFRAMES.md](./product/WIREFRAMES.md) | MVP screen IA / ASCII wireframes |
| [FEATURES.md](./product/FEATURES.md) | Functionality tracker (API / web / mobile) |

### Architecture

| Doc | Description |
|-----|-------------|
| [TECH_DESIGN.md](./architecture/TECH_DESIGN.md) | System architecture, API sketch, i18n, CI notes |
| [DATA_MODEL.md](./architecture/DATA_MODEL.md) | PostgreSQL ER diagram (Mermaid) + cardinality |

### Guides

| Doc | Description |
|-----|-------------|
| [RUNNING.md](./guides/RUNNING.md) | Local Docker + API / web / mobile development |
| [DEPLOYMENT.md](./guides/DEPLOYMENT.md) | Publish API, web, and iOS |
| [MOBILE_NOTIFICATIONS_TESTING.md](./guides/MOBILE_NOTIFICATIONS_TESTING.md) | Test reminders on your iPhone via Expo Go (no paid Apple Developer) |

### Specs

| Doc | Description |
|-----|-------------|
| [NOTIFICATIONS_AND_CUSTOM_DAYS_SPEC.md](./specs/NOTIFICATIONS_AND_CUSTOM_DAYS_SPEC.md) | Custom lunar days + notification delivery (A→B→C) |
| [web-visual/](./specs/web-visual/) | Web Ao Sen visual redesign (tokens, screens, motion/a11y) |

### Calendar reference

| Doc | Description |
|-----|-------------|
| [calendar/README.md](./calendar/README.md) | Golden vectors + generate/verify scripts |
