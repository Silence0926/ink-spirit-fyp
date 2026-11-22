# Architecture / 系统架构

## Current target architecture

```text
Browser
  ├── Ink Spirit world (HTML / CSS / vanilla JavaScript)
  │     ├── Creature registry
  │     ├── Habitat scene registry
  │     └── Local progression prototype (localStorage)
  └── Existing Sea Garden commerce pages (separate integration boundary)

Node.js + Express
  ├── Static frontend hosting
  ├── Health endpoint
  └── Future API boundary
```

## Current persistence boundary

The first interactive milestone uses browser localStorage for a single-device prototype. This is not account synchronization, secure cloud persistence, or a multi-user database. A future server-backed collection must be introduced only after authentication and authorization are implemented.

## Data contracts

Creature:
- id: stable lowercase identifier
- name: display name
- species: fish | dragon | snake | turtle
- habitatId: stable habitat identifier
- description: short user-facing description
- xpPerVisit: integer progression reward

Habitat:
- id: stable lowercase identifier
- title: localized scene name
- subtitle: English scene label
- atmosphere: short descriptive text
- accent: visual accent token

Progress:
- creatureId
- experience: non-negative integer
- level: positive integer
- visits: non-negative integer

## Security boundaries

- Never accept a role from an unauthenticated client as proof of authorization.
- Passwords must be hashed using a modern password-hashing algorithm.
- Validate request bodies and enforce size limits.
- Use environment variables for secrets and deployment configuration.
- Restrict CORS to known origins when cross-origin access is required.
- Do not expose filesystem paths or allow user-controlled file paths.
