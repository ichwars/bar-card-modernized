# Roadmap for 4.0.1

Prepared on 2026-06-21 after checking the current project against the Home Assistant developer documentation through Context7.

## Context7 findings

- `setConfig`, `getCardSize`, `getGridOptions`, `getStubConfig`, `getConfigForm`, and `window.customCards` remain valid custom-card integration points.
- `getConfigForm` is current and preferable to maintaining a heavy custom editor for common options.
- Home Assistant documents `hass-action` as the native event path for Lovelace actions. The 4.0.1 work moves standard actions to that event path.
- Current custom-card examples emphasize rendering only when relevant state changes, either through `hass` updates or direct context subscriptions.
- `getGridOptions` is important for sections view. The card implements it, but the sizing heuristics need more real dashboard validation.

## Priority 0: correctness and Home Assistant behavior

1. [Done] Replace manual Lovelace action execution with native `hass-action` dispatch where possible.
   - Keep fallback handling only for legacy or card-specific behavior.
   - Cover `more-info`, `toggle`, `navigate`, `url`, `perform-action`, `assist`, confirmation configs, and custom events.
   - Reason: aligns with current HA frontend action patterns and reduces drift from new action behavior.

2. [Done] Skip re-rendering when relevant entity state/config inputs have not changed.
   - Build a render snapshot from displayed entity states, attributes used by the card, dynamic `min`/`max`/`target`, and relevant config values.
   - Keep the existing `requestAnimationFrame` batching.
   - Reason: frequently updating dashboards should not restart DOM, focus, pointer state, or animations unnecessarily.

3. [Done] Add focused automated smoke tests for action dispatch and render snapshots.
   - Keep tests dependency-light.
   - Use mocked `hass` and DOM where practical.
   - Reason: `node --check` catches syntax only; 4.0.1 should prevent regressions in the live areas we touched.

## Priority 1: editor and configuration quality

1. [Done] Improve `getConfigForm` coverage and ergonomics.
   - Add labels/helpers for `bar_background_radius`, `bar_radius`, animation speed, dynamic ranges, and entity-backed values.
   - Use selector context where available, especially for icon/entity/attribute fields.
   - Keep advanced nested YAML options documented instead of overbuilding the visual editor.

2. [Done] Validate and normalize common config edge cases.
   - Invalid `columns`, invalid `animation.speed`, malformed `positions`, reversed `min`/`max`, and unsupported `direction`.
   - Prefer safe fallback plus warning over broken render.

3. [Done] Add examples for real-world integrations.
   - `custom:auto-entities` Shelly power list.
   - Negative/positive `center_zero`.
   - Dynamic `max` and `target_band`.

## Priority 2: layout, HACS, and release polish

1. [Needs live HA] Validate `getGridOptions` in Home Assistant sections view.
   - Test single entity, multi-column lists, vertical bars, and title/no-title variants.
   - Adjust row estimates if cards look cramped or over-tall.

2. [Needs live HACS] Confirm HACS install path and resource URL.
   - Verify custom repository install with type Dashboard.
   - Confirm release asset and `/hacsfiles/bar-card-modernized/bar-card.js` behavior.

3. [Partly done] Improve release metadata.
   - Add GitHub topics such as `home-assistant`, `lovelace`, `custom-card`, `hacs`.
   - Add screenshots or animated preview after visual behavior is stable.
   - Consider a short compatibility table for Home Assistant versions tested live.
   - Note: GitHub topic updates require a refreshed `gh auth login` or manual repository settings access.

## Suggested 4.0.1 acceptance checklist

See `docs/RELEASE_CHECKLIST_4.0.1.md` for the detailed release checklist.

- `npm run build` passes.
- `npm run check` passes.
- Local harness smoke checks pass.
- Live Home Assistant test passes with:
  - manual single entity config,
  - multi-entity config,
  - `custom:auto-entities`,
  - action configs,
  - animation on/off,
  - radius options,
  - sections view.
- GitHub Actions pass on branch and release tag.
- README and CHANGELOG document the exact patch scope.
