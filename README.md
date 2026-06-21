# Bar Card Modernized

A maintained community fork of [`custom-cards/bar-card`](https://github.com/custom-cards/bar-card), the customizable animated bar card for Home Assistant dashboards.

This fork exists because the original project appears to lack active maintenance: the last upstream release is old, and many issues and pull requests have remained open. The original project, authors, copyright, and MIT license remain credited here. This fork is not affiliated with or endorsed by the original maintainers.

## What changed

- HACS-compatible repository layout: the installable file is available at `dist/bar-card.js`.
- No bundled legacy `lit-element`, `lit-html`, Polymer/Paper editor, or old action-handler dependency.
- Uses the current Home Assistant custom-card lifecycle: `setConfig`, `hass`, `getCardSize`, `getGridOptions`, `getStubConfig`, `getConfigForm`, and card-picker registration via `window.customCards`.
- Adds entity suggestions for Home Assistant 2026.6+ card picker.
- Replaces the old custom visual editor with Home Assistant's built-in form editor to avoid the freezes/crashes reported with newer Home Assistant versions.
- Uses Home Assistant's native `hass-action` event for actions, including `perform-action`, `call-service`, `more-info`, `toggle`, `navigate`, `url`, `assist`, and `fire-dom-event`.
- Supports entity-backed `min`, `max`, and `target` values.
- Adds `hide_unavailable`, `show_entity_picture`, `name_entity`, `name_attribute`, `background_color`, `icon_color`, `center_zero`, `value_map`, and `target_band` options.
- Adds separate radius controls for the outer bar background and the filled current bar.
- Smooths the optional sweep animation to avoid distracting flicker on frequently updating entities.
- Improves CSS customizability for rounded corners, title styling, bar background, icon color, and card-mod selectors.
- Adds Slovak localization from the open upstream translation pull request.

## Installation through HACS as a custom repository

1. Add this repository as a HACS custom repository with type **Dashboard**.
2. Install **Bar Card Modernized**.
3. Add this resource if HACS does not add it automatically:

```yaml
url: /hacsfiles/bar-card-modernized/bar-card.js
type: module
```

For a manual install, copy `dist/bar-card.js` into `<config>/www/bar-card/bar-card.js` and add:

```yaml
url: /local/bar-card/bar-card.js
type: module
```

## Local harness

This repository includes a dependency-free browser harness for quick local checks outside Home Assistant:

```bash
npm run harness
```

Then open <http://localhost:4173/>. The harness loads `src/bar-card.js`, mocks the minimal `hass` object, and renders scenarios for severity colors, entity-backed ranges, target bands, centered zero ranges, hidden unavailable entities, vertical bars, sorting, value maps, entity pictures, and basic actions.

This does not replace testing inside a real Home Assistant dashboard, but it is useful for catching visual and interaction regressions before installing the card.

For non-visual smoke checks:

```bash
npm run smoke
```

The smoke test verifies custom-element registration, native `hass-action` dispatch, render-snapshot behavior, and common config normalization.

## Basic usage

```yaml
type: custom:bar-card
entity: sensor.example
title: Example
min: 0
max: 100
```

Multiple entities:

```yaml
type: custom:bar-card
title: Energy
columns: 2
entities:
  - entity: sensor.washing_machine_power
    name: Washing machine
    max: sensor.house_power_limit
  - entity: sensor.dishwasher_power
    name: Dishwasher
    max: sensor.house_power_limit
```

## Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | string | required | `custom:bar-card` |
| `entity` | string | required unless `entities` is used | Entity state used as the bar value. |
| `entities` | array | none | List of entity IDs or per-entity config objects. |
| `title` | string | none | Optional header. |
| `name` | string/object | friendly name | Display name. Structured names are passed to `hass.formatEntityName` when available. |
| `name_entity` | string | none | Use another entity's state as the displayed name. |
| `name_attribute` | string | none | Use an attribute of the main entity as the displayed name. |
| `attribute` | string | none | Use an attribute instead of the entity state as the value. Dot paths are supported. |
| `min` | number/string | `0` | Minimum value. Can be a number, numeric string, or entity ID. |
| `max` | number/string | `100` | Maximum value. Can be a number, numeric string, or entity ID. |
| `target` | number/string | none | Target marker. Can be a number, numeric string, or entity ID. |
| `target_band` | object | none | Range highlight: `{ from: 20, to: 80 }`. Values can be entity IDs. |
| `decimal` | number | HA/default formatting | Number of decimals for displayed values. |
| `unit_of_measurement` | string | entity attribute | Override displayed unit. |
| `color` | string | `var(--primary-color)` | Bar color. |
| `background_color` | string | derived from bar color | Bar background color. |
| `bar_background_radius` | string | HA/card radius | Radius of the outer bar background. Use `0px`, `8px`, or `inherit`. |
| `bar_radius` | string | inherited outer radius | Radius of the filled current bar. Use `0px`, `4px`, or `inherit`. |
| `icon` | string | entity/domain icon | Icon. Use `off` to hide. |
| `icon_color` | string | bar color | Icon color. |
| `show_entity_picture` | boolean | `false` | Show `entity_picture` instead of icon when available. |
| `columns` | number | `1` | Number of bars per row. |
| `direction` | string | `right` | `right`, `left`, `up`, or `down`. |
| `height` | string | `40px` | Bar height. For vertical bars this is the chart height. |
| `width` | string | `100%` | Bar width. |
| `limit_value` | boolean | `false` | Clamp value to `min`/`max`. |
| `complementary` | boolean | `false` | Display `max - value`. |
| `hide_unavailable` | boolean | `false` | Hide bars when the state is `unavailable`, `unknown`, empty, or missing. |
| `center_zero` | boolean | `false` | Fill from the zero center point for negative/positive ranges. |
| `entity_row` | boolean | `false` | Remove normal card background for use inside an entities card. |
| `sort` | string | `none` | `none`, `asc`, or `desc`; sorts rendered bars by current numeric value. |
| `positions` | object | see below | `icon`, `indicator`, `name`, `minmax`, `value`: `inside`, `outside`, or `off`. |
| `severity` | array | none | Per-range color/icon/hide rules. |
| `value_map` | array | none | Convert values/ranges into labels. |
| `animation` | object | `{ state: "off", speed: 5 }` | Enable the subtle sweep animation. Higher `speed` values are calmer. |
| `tap_action` | object | `more-info` | Home Assistant action config. |
| `hold_action` | object | none | Home Assistant action config. |
| `double_tap_action` | object | none | Home Assistant action config. |

Default positions:

```yaml
positions:
  icon: outside
  indicator: outside
  name: inside
  minmax: off
  value: inside
```

Severity example:

```yaml
type: custom:bar-card
entity: sensor.battery
severity:
  - from: 0
    to: 20
    color: var(--error-color)
    icon: mdi:battery-alert
  - from: 21
    to: 100
    color: var(--success-color)
```

Value mapping example:

```yaml
type: custom:bar-card
entity: sensor.air_quality
value_map:
  - from: 0
    to: 50
    text: Good
  - from: 51
    to: 100
    text: Moderate
```

New Home Assistant action syntax:

```yaml
type: custom:bar-card
entity: sensor.disk_free
tap_action:
  action: perform-action
  perform_action: input_boolean.toggle
  target:
    entity_id: input_boolean.example
```

Real-world `custom:auto-entities` example:

```yaml
type: custom:auto-entities
show_empty: false
card_param: entities
card:
  type: custom:bar-card
  title: Aktuelle Shelly-Verbraucher
  direction: right
  min: 0
  max: 2500
  height: 34px
  decimal: 0
  unit_of_measurement: W
  bar_background_radius: 8px
  bar_radius: 4px
  positions:
    icon: outside
    name: inside
    value: inside
    indicator: "off"
    minmax: "off"
  animation:
    state: "on"
    speed: 6
  tap_action:
    action: more-info
filter:
  include:
    - domain: sensor
      entity_id: sensor.shelly*_power
      state: "> 1"
  exclude:
    - state: unavailable
    - state: unknown
sort:
  method: state
  numeric: true
  reverse: true
```

Centered zero example:

```yaml
type: custom:bar-card
entity: sensor.temperature_delta
min: -20
max: 20
center_zero: true
bar_background_radius: 8px
bar_radius: 4px
```

Dynamic range and target band example:

```yaml
type: custom:bar-card
entity: sensor.current_power
min: 0
max: sensor.power_limit
target: sensor.power_target
target_band:
  from: sensor.power_target_low
  to: sensor.power_target_high
```

## CSS / card-mod hooks

The fork keeps the original custom element names where practical:

- `bar-card-card`
- `bar-card-background`
- `bar-card-backgroundbar`
- `bar-card-currentbar`
- `bar-card-contentbar`
- `bar-card-iconbar`
- `bar-card-name`
- `bar-card-value`
- `bar-card-min`, `bar-card-divider`, `bar-card-max`
- `bar-card-animationbar`
- `bar-card-targetbar`
- `bar-card-markerbar`
- `bar-card-indicator`

Theme variables:

```yaml
card_mod:
  style: |
    bar-card-card {
      --bar-card-border-radius: 8px;
      --bar-card-background-border-radius: 8px;
      --bar-card-currentbar-border-radius: 4px;
      --bar-card-background-color: rgba(128,128,128,.18);
      --bar-card-title-font-size: 18px;
    }
```

## Notes on upstream issues and PRs

This fork explicitly incorporates or addresses the following upstream requests:

- PR #184: entity-backed `min` and `max` values, with a corrected min/max display.
- PR #165/#172: Slovak localization.
- PR #117/#118/#120/#123/#127/#136/#145: dependency/security refresh by removing obsolete runtime/editor dependencies and keeping the distributed module self-contained.
- Issue #201: HACS repository structure.
- Issues #175/#186/#190/#196: visual editor freezes/crashes.
- Issue #189: 2024.8+ action syntax.
- Issues #193/#195: icon color handling.
- Issue #194: `entity_picture` support.
- Issues #197/#203/#156/#162: styling hooks for background color, rounded corners, and title styling.
- Issues #179/#183: hide unavailable entities.
- Issues #124/#163/#184: dynamic min/max values.
- Issues #185/#202: dynamic names via entity or attribute.
- Issue #174: optional sorting via `sort: asc` or `sort: desc`; default remains stable entity order.
- Issues #181/#143: negative ranges are handled correctly, with optional `center_zero` filling from the zero point.

## License

MIT. See [`LICENSE`](LICENSE). Original license and copyright notice are preserved.
