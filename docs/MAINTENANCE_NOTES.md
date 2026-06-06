# Maintenance notes

This fork was prepared from the public upstream repository `custom-cards/bar-card`.

The upstream project remains the original source and is credited in the README and license. The reason for this fork is missing active maintenance: the upstream repository has old releases and numerous open issues/pull requests.

## Upstream inputs considered

- Open issues around HACS compliance, editor crashes/freezes, new Home Assistant action syntax, icon coloring, entity pictures, unavailable sensors, dynamic names, rounded corners, title styling, background styling, and negative ranges.
- Open pull requests for entity-backed min/max, Slovak translation, and old dependency security bumps.
- Current Home Assistant custom-card developer documentation around card sizing, section grid sizing, built-in form editor, and card-picker suggestions.
- Current HACS plugin/dashboard repository structure rules.

## Important implementation choice

The distributed card is a self-contained vanilla Web Component. This avoids old `lit-element`, `lit-html`, Polymer/Paper editor controls, and stale bundler/dependency issues. It also makes the HACS artifact (`dist/bar-card.js`) immediately installable without a build step.

## Known limits

- This package has been syntax-checked with Node, but not run inside a live Home Assistant instance from this environment.
- A local browser harness exists for quick mocked checks outside Home Assistant.
- The built-in form editor exposes the common options. Advanced nested options such as `severity`, per-entity overrides, `positions`, `value_map`, and `target_band` are best edited in YAML.
- `sort` is documented as a possible next feature but not enabled by default because changing entity order can surprise existing dashboards.
