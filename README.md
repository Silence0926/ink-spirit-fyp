# 墨灵 · Ink Spirit

**An Interactive Chinese Ink-Wash Ecosystem Combining Living Creatures, Exploration and Creature Development.**

墨灵 is an interactive digital world inspired by traditional Chinese ink-wash painting. The experience is built around three connected pillars:

- **Companions** — choose and interact with koi, dragon, snake, and turtle spirits.
- **Exploration** — visit distinct habitats rendered as living ink paintings.
- **Growth** — develop a persistent creature collection through experience and progression.

The project evolves from the original Sea Garden FYP. Existing aquarium commerce pages and assets are retained as a separate integration area.

## Repository structure

```text
server/
  public/
    index.html
    styles/
    scripts/
  server.js
  package.json
docs/
  ROADMAP.md
  ARCHITECTURE.md
```

## Run locally

Requirements: Node.js 18 or later.

```bash
cd server
npm install
npm start
```

Open http://localhost:3000.

## Development status

| Milestone | Scope | Status |
|---|---|---|
| M1 | Ink-wash landing world and creature selection | In progress |
| M2 | Creature registry, animation states and habitat scenes | Planned |
| M3 | Account-linked collection and secure persistence | Planned |
| M4 | Experience, levels, growth and unlocks | Planned |
| M5 | Sea Garden catalogue, cart and order integration | Planned |
| M6 | Accessibility, automated tests and deployment | Planned |

## Security notice

Do not use real credentials or payment data until authentication, authorization, input validation, password hashing, session handling, and persistence have been reviewed and tested. Never commit secrets, API keys, or production user data.

## Language

The interface and project documentation may use both Simplified Chinese and English.
