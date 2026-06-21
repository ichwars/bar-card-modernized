# Changelog

## 4.0.1

Patch release focused on Home Assistant compatibility and stability.

- Dispatch Lovelace actions through Home Assistant's native `hass-action` event.
- Avoid full re-renders when relevant entity/config inputs have not changed.
- Normalize common config edge cases for directions, positions, columns, animation settings, and reversed min/max ranges.
- Improve built-in form labels, helpers, and selector context for icons and attributes.
- Add dependency-free smoke tests for registration, actions, render snapshots, and config normalization.
- Add real-world README examples for `custom:auto-entities`, centered zero ranges, and dynamic target bands.
- Add a 4.0.1 roadmap and acceptance checklist.

## 4.0.0-fork.0

Initial maintained fork release.

- HACS-compatible `dist/bar-card.js` distribution.
- Self-contained browser module without obsolete runtime dependencies.
- Home Assistant custom card API refresh: `getGridOptions`, `getConfigForm`, `getStubConfig`, and `window.customCards` registration with entity suggestions.
- New `perform-action` action syntax support.
- Entity-backed `min`, `max`, and `target` values.
- `hide_unavailable`, `show_entity_picture`, `name_entity`, `name_attribute`, `background_color`, `icon_color`, `center_zero`, `value_map`, and `target_band` support.
- Separate radius controls for the outer bar background and the filled current bar.
- Smoother non-synchronized sweep animation to reduce flicker on frequently updating dashboards.
- Local browser harness for quick regression checks outside Home Assistant.
- Styling hooks for rounded corners, title, icon color, and background bar color.
- Slovak localization.
