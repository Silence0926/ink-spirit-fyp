# Product Roadmap / 产品路线图

## Product definition

Ink Spirit is a browser-based interactive ecosystem, not a conventional aquarium shop and not a combat game. The central experience is a living Chinese ink-wash world in which a user chooses a creature, explores its habitat, and develops a personal collection.

## Workstreams

### M1 — Visual foundation
- Establish rice-paper, ink, mist, mountain, water and vermilion-seal design language.
- Provide a responsive landing page and accessible creature selector.
- Persist the currently selected creature and habitat locally.

### M2 — Living companions
- Standardize creature metadata: id, display name, species, habitat, motion profile and unlock state.
- Add idle, hover, selected and interaction states.
- Keep animation independent from the creature data model.

### M3 — Habitat exploration
- Build a scene registry with scene-specific palette, environmental layers and ambient motion.
- Initial scenes: lotus pond, cloud mountain, bamboo grove and quiet marsh.
- Add transitions and scene-specific creature descriptions.

### M4 — Creature development
- Define persistent creature identity, level, experience, growth stage and attributes.
- Implement deterministic experience thresholds and prevent negative or invalid values.
- Add collection and progression UI.

### M5 — Sea Garden integration
- Keep aquarium commerce routes separate from the world experience.
- Reuse fish catalogue and product data only after auditing its schema and APIs.
- Integrate shop navigation without coupling progression logic to checkout.

### M6 — Quality and release
- Responsive testing, keyboard navigation, reduced-motion support and browser testing.
- Add automated tests for progression rules and server endpoints.
- Review authentication, authorization, data validation and deployment configuration.

## Acceptance criteria

- A visitor can select each initially available creature without a page reload.
- The scene, creature description and accessible labels update together.
- Selection persists after refresh on the same browser.
- Experience cannot become negative; level progression is deterministic.
- The interface remains usable on mobile and with reduced-motion preferences.
- No secrets or plaintext passwords are stored in the repository.
