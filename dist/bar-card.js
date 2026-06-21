/*
 * Bar Card Modernized Fork
 * Original project: https://github.com/custom-cards/bar-card
 * Copyright (c) 2019 Custom cards for Home Assistant and contributors
 * Released under the MIT License.
 */

const CARD_VERSION = "4.0.1";
const ORIGINAL_REPOSITORY = "https://github.com/custom-cards/bar-card";
const DOCUMENTATION_URL = "https://github.com/ichwars/bar-card-modernized";

const DEFAULT_POSITIONS = {
  icon: "outside",
  indicator: "outside",
  name: "inside",
  minmax: "off",
  value: "inside",
};

const DEFAULT_ANIMATION = {
  state: "off",
  speed: 5,
};

const DEFAULT_CONFIG = {
  animation: DEFAULT_ANIMATION,
  color: "var(--bar-card-color, var(--primary-color))",
  columns: 1,
  direction: "right",
  max: 100,
  min: 0,
  positions: DEFAULT_POSITIONS,
  bar_background_radius: undefined,
  bar_radius: undefined,
  height: "40px",
  width: "100%",
  entity_row: false,
  limit_value: false,
  complementary: false,
  hide_unavailable: false,
  show_entity_picture: false,
  center_zero: false,
  sort: "none",
};

const POSITION_VALUES = new Set(["inside", "outside", "off"]);
const DIRECTION_VALUES = new Set(["right", "left", "up", "down"]);
const ACTION_EVENT_TYPES = new Set([
  "assist",
  "call-service",
  "fire-dom-event",
  "more-info",
  "navigate",
  "perform-action",
  "toggle",
  "url",
]);

const LOCALIZE = {
  en: {
    common: {
      version: "Version",
      invalid_configuration: "Invalid configuration",
      entity_not_available: "Entity not available",
      original_notice: "Community fork of the original bar-card",
    },
  },
  nb: {
    common: {
      version: "Versjon",
      invalid_configuration: "Ikke gyldig konfiguration",
      entity_not_available: "Entitet ikke tilgjengelig",
      original_notice: "Community-fork av den opprinnelige bar-card",
    },
  },
  sk: {
    common: {
      version: "Verzia",
      invalid_configuration: "Neplatná konfigurácia",
      entity_not_available: "Entita nie je k dispozícii",
      original_notice: "Komunitný fork pôvodnej bar-card",
    },
  },
  de: {
    common: {
      version: "Version",
      invalid_configuration: "Ungültige Konfiguration",
      entity_not_available: "Entität nicht verfügbar",
      original_notice: "Community-Fork der ursprünglichen bar-card",
    },
  },
};

function getLanguage() {
  const selected = localStorage.getItem("selectedLanguage") || navigator.language || "en";
  return selected.replace(/["']/g, "").replace("-", "_").split("_")[0];
}

function localize(key) {
  const [section, name] = key.split(".");
  const lang = getLanguage();
  return (
    LOCALIZE[lang]?.[section]?.[name] ??
    LOCALIZE.en?.[section]?.[name] ??
    key
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(...objects) {
  const result = {};
  for (const object of objects) {
    if (!isPlainObject(object)) continue;
    for (const [key, value] of Object.entries(object)) {
      if (isPlainObject(value) && isPlainObject(result[key])) {
        result[key] = deepMerge(result[key], value);
      } else if (Array.isArray(value)) {
        result[key] = value.slice();
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cssValue(value, fallback = "") {
  const stringValue = String(value ?? fallback).trim();
  return stringValue.replace(/[;{}]/g, "");
}

function clamp(number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, number));
}

function parseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return Number.NaN;
  return Number(normalized);
}

function looksLikeEntityId(value) {
  return typeof value === "string" && /^[a-zA-Z_][\w]*\.[\w.-]+$/.test(value.trim());
}

function normalizeEntityId(value) {
  return looksLikeEntityId(value) ? value.trim() : undefined;
}

function getStateObj(hass, entityId) {
  return entityId && hass?.states ? hass.states[entityId] : undefined;
}

function resolveNumber(hass, value, fallback = 0) {
  if (looksLikeEntityId(value)) {
    const entity = getStateObj(hass, value.trim());
    const parsed = parseNumber(entity?.state);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  const parsed = parseNumber(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getAttributeValue(stateObj, attributePath) {
  if (!stateObj || !attributePath) return undefined;
  return String(attributePath)
    .split(".")
    .reduce((value, key) => (value === undefined || value === null ? undefined : value[key]), stateObj.attributes);
}

function domainFromEntity(entityId) {
  return String(entityId || "").split(".")[0];
}

function stableHash(value) {
  let hash = 0;
  for (const char of String(value || "")) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function normalizeDirectionValue(value) {
  const normalized = String(value || DEFAULT_CONFIG.direction).replace("-reverse", "");
  return DIRECTION_VALUES.has(normalized) ? normalized : DEFAULT_CONFIG.direction;
}

function normalizePositionValue(value, fallback) {
  return POSITION_VALUES.has(value) ? value : fallback;
}

function normalizeAnimation(animation) {
  const normalized = deepMerge(DEFAULT_ANIMATION, animation || {});
  normalized.state = normalized.state === "on" ? "on" : "off";
  const speed = parseNumber(normalized.speed);
  normalized.speed = Number.isFinite(speed) ? Math.max(1, speed) : DEFAULT_ANIMATION.speed;
  return normalized;
}

function normalizePositions(positions) {
  const merged = deepMerge(DEFAULT_POSITIONS, positions || {});
  return Object.fromEntries(
    Object.entries(DEFAULT_POSITIONS).map(([key, fallback]) => [
      key,
      normalizePositionValue(merged[key], fallback),
    ]),
  );
}

function defaultIcon(entityId) {
  const domain = domainFromEntity(entityId);
  const icons = {
    binary_sensor: "mdi:radiobox-marked",
    climate: "mdi:thermostat",
    cover: "mdi:window-shutter",
    device_tracker: "mdi:account-arrow-right",
    fan: "mdi:fan",
    humidifier: "mdi:air-humidifier",
    input_boolean: "mdi:toggle-switch",
    light: "mdi:lightbulb",
    lock: "mdi:lock",
    person: "mdi:account",
    sensor: "mdi:eye",
    switch: "mdi:toggle-switch",
    update: "mdi:update",
    weather: "mdi:weather-partly-cloudy",
  };
  return icons[domain] || "mdi:checkbox-blank-circle-outline";
}

function makeEntityArray(config) {
  const baseConfig = { ...config };
  delete baseConfig.entities;

  if (Array.isArray(config.entities)) {
    return config.entities.map((entry) => {
      const entityConfig = typeof entry === "string" ? { entity: entry } : entry || {};
      return normalizeEntityConfig(deepMerge(DEFAULT_CONFIG, baseConfig, entityConfig));
    });
  }

  return [
    normalizeEntityConfig(deepMerge(DEFAULT_CONFIG, baseConfig)),
  ];
}

function normalizeConfig(config) {
  const normalized = deepMerge(DEFAULT_CONFIG, config || {}, {
    positions: normalizePositions(config?.positions),
    animation: normalizeAnimation(config?.animation),
  });

  if (normalized.stack === "horizontal" && Array.isArray(normalized.entities)) {
    normalized.columns = normalized.entities.length || 1;
  }

  normalized.direction = normalizeDirectionValue(normalized.direction);
  normalized.columns = Math.max(1, Math.floor(parseNumber(normalized.columns) || 1));
  normalized.sort = ["none", "asc", "desc"].includes(normalized.sort) ? normalized.sort : DEFAULT_CONFIG.sort;
  return normalized;
}

function normalizeEntityConfig(config) {
  const normalized = deepMerge(DEFAULT_CONFIG, config || {});
  normalized.direction = normalizeDirectionValue(normalized.direction);
  normalized.positions = normalizePositions(normalized.positions);
  normalized.animation = normalizeAnimation(normalized.animation);
  normalized.columns = Math.max(1, Math.floor(parseNumber(normalized.columns) || 1));
  normalized.sort = ["none", "asc", "desc"].includes(normalized.sort) ? normalized.sort : DEFAULT_CONFIG.sort;
  return normalized;
}

function fireEvent(node, type, detail, options = {}) {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: options.bubbles ?? true,
      cancelable: options.cancelable ?? false,
      composed: options.composed ?? true,
    }),
  );
}

function formatNumber(value, decimals) {
  const number = parseNumber(value);
  if (!Number.isFinite(number)) return String(value ?? "");

  if (decimals === 0 || decimals === "0") {
    return number.toFixed(0);
  }

  if (decimals !== undefined && decimals !== null && decimals !== "") {
    return number.toFixed(Number(decimals));
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 3,
  }).format(number);
}

function applyValueMap(config, value) {
  if (!Array.isArray(config.value_map)) return undefined;
  const numeric = parseNumber(value);

  for (const item of config.value_map) {
    if (!item) continue;
    if (item.value !== undefined && String(item.value) === String(value)) return item.text ?? item.label;
    const from = parseNumber(item.from);
    const to = parseNumber(item.to);
    if (Number.isFinite(numeric) && Number.isFinite(from) && Number.isFinite(to) && numeric >= from && numeric <= to) {
      return item.text ?? item.label;
    }
  }

  return undefined;
}

class BarCard extends HTMLElement {
  static getStubConfig(hass, entities) {
    const entity = entities?.[0] || Object.keys(hass?.states || {}).find((entityId) => entityId.startsWith("sensor."));
    return entity ? { entity } : { entity: "sensor.example" };
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "entity", selector: { entity: {} } },
        { name: "entities", selector: { entity: { multiple: true } } },
        { name: "title", selector: { text: {} } },
        { name: "name", selector: { text: {} } },
        { name: "icon", selector: { icon: {} }, context: { icon_entity: "entity" } },
        { name: "color", selector: { text: {} } },
        { name: "bar_background_radius", selector: { text: {} } },
        { name: "bar_radius", selector: { text: {} } },
        { name: "height", selector: { text: {} } },
        { name: "width", selector: { text: {} } },
        { name: "columns", selector: { number: { min: 1, mode: "box" } } },
        {
          name: "direction",
          selector: {
            select: {
              options: [
                { value: "right", label: "right" },
                { value: "left", label: "left" },
                { value: "up", label: "up" },
                { value: "down", label: "down" },
              ],
            },
          },
        },
        { name: "min", selector: { text: {} } },
        { name: "max", selector: { text: {} } },
        { name: "target", selector: { text: {} } },
        { name: "decimal", selector: { number: { min: 0, mode: "box" } } },
        { name: "unit_of_measurement", selector: { text: {} } },
        { name: "attribute", selector: { attribute: {} }, context: { filter_entity: "entity" } },
        { name: "hide_unavailable", selector: { boolean: {} } },
        { name: "limit_value", selector: { boolean: {} } },
        { name: "complementary", selector: { boolean: {} } },
        { name: "show_entity_picture", selector: { boolean: {} } },
        { name: "center_zero", selector: { boolean: {} } },
        { name: "entity_row", selector: { boolean: {} } },
        {
          name: "sort",
          selector: {
            select: {
              options: [
                { value: "none", label: "none" },
                { value: "asc", label: "asc" },
                { value: "desc", label: "desc" },
              ],
            },
          },
        },
      ],
      computeLabel: (schema) => {
        const labels = {
          bar_background_radius: "Outer bar radius",
          bar_radius: "Filled bar radius",
          center_zero: "Fill from zero",
          entity_row: "Entity row mode",
          hide_unavailable: "Hide unavailable",
          limit_value: "Clamp value",
          show_entity_picture: "Show entity picture",
        };
        return labels[schema.name];
      },
      computeHelper: (schema) => {
        const helpers = {
          bar_background_radius: "Radius of the outer bar background, for example 8px or 0px.",
          bar_radius: "Radius of the filled current bar, for example 4px or inherit.",
          max: "Number, numeric string, or entity ID used as the upper range.",
          min: "Number, numeric string, or entity ID used as the lower range.",
          target: "Optional number, numeric string, or entity ID for the target marker.",
          sort: "Sorts multi-entity cards by the current numeric value.",
        };
        return helpers[schema.name];
      },
    };
  }

  constructor() {
    super();
    this._config = undefined;
    this._configArray = [];
    this._hass = undefined;
    this._previousValues = new Map();
    this._pressTimers = new Map();
    this._lastTap = new Map();
    this._renderFrame = undefined;
    this._renderQueued = false;
    this._lastRenderSnapshot = undefined;
  }

  setConfig(config) {
    if (!config || (!config.entity && !Array.isArray(config.entities))) {
      throw new Error(localize("common.invalid_configuration") + ": entity or entities required");
    }

    this._config = normalizeConfig(config);
    this._configArray = makeEntityArray(this._config);
    this._lastRenderSnapshot = undefined;
    this._queueRender();
  }

  set hass(hass) {
    const nextSnapshot = this._config ? this._renderSnapshot(hass) : undefined;
    this._hass = hass;
    if (nextSnapshot && nextSnapshot === this._lastRenderSnapshot) return;
    this._queueRender();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._queueRender();
  }

  disconnectedCallback() {
    if (this._renderFrame !== undefined) {
      cancelAnimationFrame(this._renderFrame);
      this._renderFrame = undefined;
    }
    this._renderQueued = false;
    this._pressTimers.forEach((timer) => clearTimeout(timer));
    this._pressTimers.clear();
  }

  _queueRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    this._renderFrame = requestAnimationFrame(() => {
      this._renderFrame = undefined;
      this._renderQueued = false;
      this._render();
    });
  }

  getCardSize() {
    const rows = Math.ceil((this._configArray.length || 1) / (this._config?.columns || 1));
    const configuredHeight = parseNumber(this._config?.height);
    if (Number.isFinite(configuredHeight)) {
      return Math.max(1, Math.ceil((configuredHeight * rows + 56) / 50));
    }
    return Math.max(1, rows + (this._config?.title ? 1 : 0));
  }

  getGridOptions() {
    const rows = Math.max(1, Math.ceil((this._configArray.length || 1) / (this._config?.columns || 1)));
    const tall = ["up", "down"].includes(this._config?.direction);
    return {
      columns: this._config?.grid_columns || (this._config?.columns > 1 ? 12 : 6),
      min_columns: 3,
      rows: this._config?.grid_rows || (tall ? Math.max(3, rows * 3) : Math.max(2, rows + (this._config?.title ? 1 : 0))),
      min_rows: 1,
    };
  }

  _render() {
    if (!this.isConnected && !this.parentNode) return;
    if (!this._config) return;

    const hass = this._hass;
    if (!hass) {
      this.innerHTML = this._styleTemplate() + `<ha-card><div class="card-content"></div></ha-card>`;
      return;
    }

    this._lastRenderSnapshot = this._renderSnapshot(hass);

    this._renderedConfigArray = this._sortedConfigArray();
    const bars = this._renderedConfigArray
      .map((config, index) => this._barTemplate(config, index))
      .filter(Boolean)
      .join("");

    const columns = Math.max(1, Number(this._config.columns || 1));
    const title = this._config.title
      ? `<div class="bar-card-header">${escapeHtml(this._config.title)}</div>`
      : "";

    const entityRowClass = this._config.entity_row ? " entity-row" : "";
    this.innerHTML = `
      ${this._styleTemplate()}
      <ha-card class="bar-card-root${entityRowClass}">
        ${title}
        <div id="states" class="card-content" style="--bar-card-columns: ${columns};">
          ${bars}
        </div>
      </ha-card>
    `;

    this._attachActions();
  }

  _renderSnapshot(hass) {
    const entities = new Set();
    const configs = this._configArray.length ? this._configArray : [this._config];
    for (const config of configs) {
      if (!config) continue;
      [
        config.entity,
        config.name_entity,
        normalizeEntityId(config.min),
        normalizeEntityId(config.max),
        normalizeEntityId(config.target),
        normalizeEntityId(config.target_band?.from),
        normalizeEntityId(config.target_band?.to),
      ].forEach((entityId) => {
        if (entityId) entities.add(entityId);
      });
    }

    const states = [...entities].sort().map((entityId) => {
      const stateObj = getStateObj(hass, entityId);
      return [
        entityId,
        stateObj?.state ?? null,
        stateObj?.attributes ?? null,
      ];
    });

    return JSON.stringify({
      config: this._configArray,
      columns: this._config?.columns,
      rows: this._config?.grid_rows,
      states,
    });
  }

  _sortedConfigArray() {
    const configs = this._configArray.slice();
    const sort = this._config?.sort;
    if (!["asc", "desc"].includes(sort)) return configs;

    return configs.sort((a, b) => {
      const aState = getStateObj(this._hass, a.entity);
      const bState = getStateObj(this._hass, b.entity);
      const aRaw = a.attribute ? getAttributeValue(aState, a.attribute) : aState?.state;
      const bRaw = b.attribute ? getAttributeValue(bState, b.attribute) : bState?.state;
      const aValue = parseNumber(aRaw);
      const bValue = parseNumber(bRaw);
      const aComparable = Number.isFinite(aValue) ? aValue : Number.NEGATIVE_INFINITY;
      const bComparable = Number.isFinite(bValue) ? bValue : Number.NEGATIVE_INFINITY;
      return sort === "asc" ? aComparable - bComparable : bComparable - aComparable;
    });
  }

  _barTemplate(config, index) {
    const hass = this._hass;
    const stateObj = getStateObj(hass, config.entity);

    if (!stateObj) {
      if (config.hide_unavailable) return "";
      return `<div class="warning">${escapeHtml(localize("common.entity_not_available"))}: ${escapeHtml(config.entity)}</div>`;
    }

    const rawValue = config.attribute ? getAttributeValue(stateObj, config.attribute) : stateObj.state;
    const numericRawValue = parseNumber(rawValue);
    const unavailable = ["unavailable", "unknown", "none", ""].includes(String(rawValue).toLowerCase());

    if (unavailable && config.hide_unavailable) return "";

    const resolvedMin = resolveNumber(hass, config.min, 0);
    const resolvedMax = resolveNumber(hass, config.max, 100);
    const min = Math.min(resolvedMin, resolvedMax);
    const max = Math.max(resolvedMin, resolvedMax);
    const target = config.target !== undefined && config.target !== null && config.target !== "" ? resolveNumber(hass, config.target, Number.NaN) : Number.NaN;
    let barValue = Number.isFinite(numericRawValue) ? numericRawValue : 0;

    if (config.limit_value && Number.isFinite(barValue)) {
      barValue = clamp(barValue, Math.min(min, max), Math.max(min, max));
    }

    const severity = this._severityForValue(config, rawValue);
    if (severity?.hide) return "";

    const barColor = cssValue(severity?.color || (unavailable ? `var(--bar-card-disabled-color, ${config.color})` : config.color));
    const backgroundColor = cssValue(config.background_color || "var(--bar-card-background-color, color-mix(in srgb, var(--bar-color) 25%, transparent))");
    const iconColor = cssValue(severity?.icon_color || config.icon_color || "var(--bar-icon-color, var(--bar-color))");
    const percentages = this._computeBarPercentages(barValue, min, max, config);
    const direction = normalizeDirectionValue(config.direction);
    const vertical = ["up", "down"].includes(direction);
    const backgroundBarRadius = cssValue(config.bar_background_radius || "var(--bar-card-background-border-radius, var(--bar-card-border-radius, var(--ha-card-border-radius, 12px)))");
    const currentBarRadius = cssValue(config.bar_radius || "var(--bar-card-currentbar-border-radius, inherit)");
    const barHeight = cssValue(config.height || DEFAULT_CONFIG.height);
    const barWidth = cssValue(config.width || DEFAULT_CONFIG.width);
    const marker = Number.isFinite(target) ? this._targetTemplate(target, min, max, direction, config) : "";

    const icon = this._iconTemplate(config, stateObj, severity, iconColor);
    const name = escapeHtml(this._nameForConfig(config, stateObj));
    const unit = this._unitForConfig(config, stateObj, rawValue);
    const displayValue = escapeHtml(this._displayValue(config, stateObj, rawValue, barValue, max, unit));
    const minText = escapeHtml(`${formatNumber(min, config.min_decimal ?? config.decimal)}${unit}`);
    const maxText = escapeHtml(`${formatNumber(max, config.max_decimal ?? config.decimal)}${unit}`);
    const indicator = this._indicatorTemplate(config, stateObj.entity_id, numericRawValue, barColor);

    const inside = [];
    const outsideBefore = [];
    const outsideAfter = [];

    if (config.positions.icon === "inside") inside.push(icon);
    else if (config.positions.icon !== "off") outsideBefore.push(icon);

    if (config.positions.indicator === "inside") inside.push(indicator);
    else if (config.positions.indicator !== "off") outsideBefore.push(indicator);

    if (config.positions.name === "inside") inside.push(`<bar-card-name>${name}</bar-card-name>`);
    else if (config.positions.name !== "off") outsideBefore.push(`<bar-card-name class="name-outside">${name}</bar-card-name>`);

    if (config.positions.minmax === "inside") inside.push(`<bar-card-minmax><bar-card-min>${minText}</bar-card-min><bar-card-divider>/</bar-card-divider><bar-card-max>${maxText}</bar-card-max></bar-card-minmax>`);
    else if (config.positions.minmax === "outside") outsideAfter.push(`<bar-card-minmax><bar-card-min>${minText}</bar-card-min><bar-card-divider>/</bar-card-divider><bar-card-max>${maxText}</bar-card-max></bar-card-minmax>`);

    if (config.positions.value === "inside") inside.push(`<bar-card-value>${displayValue}</bar-card-value>`);
    else if (config.positions.value === "outside") outsideAfter.push(`<bar-card-value>${displayValue}</bar-card-value>`);

    const animation = config.animation?.state === "on"
      ? `<bar-card-animationbar></bar-card-animationbar>`
      : "";
    const animationSpeed = Math.max(1, Number(config.animation?.speed || 5));
    const animationOffset = (performance.now() / 1000 + (stableHash(config.entity) % 1000) / 1000) % animationSpeed;

    return `
      <bar-card-card
        data-index="${index}"
        tabindex="0"
        role="button"
        class="direction-${direction}${vertical ? " vertical" : " horizontal"}"
        style="
          --bar-color: ${barColor};
          --bar-background-color: ${backgroundColor};
          --bar-icon-color: ${iconColor};
          --bar-background-border-radius: ${backgroundBarRadius};
          --bar-current-border-radius: ${currentBarRadius};
          --bar-height: ${barHeight};
          --bar-width: ${barWidth};
          --bar-start: ${percentages.start}%;
          --bar-size: ${percentages.size}%;
          --bar-animation-speed: ${animationSpeed}s;
          --bar-animation-delay: -${animationOffset.toFixed(3)}s;
        "
      >
        ${outsideBefore.join("")}
        <bar-card-background>
          <bar-card-backgroundbar></bar-card-backgroundbar>
          ${animation}
          <bar-card-currentbar></bar-card-currentbar>
          ${marker}
          <bar-card-contentbar>${inside.join("")}</bar-card-contentbar>
        </bar-card-background>
        ${outsideAfter.join("")}
      </bar-card-card>
    `;
  }

  _styleTemplate() {
    return `
      <style>
        :host {
          display: block;
          --bar-card-gap: 8px;
        }
        .bar-card-root {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .bar-card-root.entity-row {
          background: transparent;
          box-shadow: none;
          border: 0;
        }
        .bar-card-header {
          color: var(--bar-card-title-color, var(--primary-text-color));
          font-size: var(--bar-card-title-font-size, var(--ha-font-size-2xl, 24px));
          font-weight: var(--bar-card-title-font-weight, 400);
          line-height: 1.2;
          padding: 16px 16px 0;
        }
        #states {
          display: grid;
          grid-template-columns: repeat(var(--bar-card-columns, 1), minmax(0, 1fr));
          gap: var(--bar-card-gap);
          flex: 1 1 auto;
        }
        .entity-row #states {
          padding: 0;
        }
        .warning {
          display: block;
          color: var(--primary-text-color, #000);
          background: var(--warning-color, #fce588);
          padding: 8px;
          border-radius: var(--ha-card-border-radius, 12px);
        }
        bar-card-card {
          display: flex;
          min-width: 0;
          color: var(--primary-text-color);
          outline: none;
        }
        bar-card-card.horizontal {
          align-items: center;
          flex-direction: row;
        }
        bar-card-card.vertical {
          align-items: stretch;
          flex-direction: column-reverse;
          min-height: var(--bar-height, 160px);
        }
        bar-card-card:focus-visible {
          box-shadow: 0 0 0 2px var(--primary-color);
          border-radius: var(--bar-background-border-radius, var(--bar-card-background-border-radius, var(--bar-card-border-radius, var(--ha-card-border-radius, 12px))));
        }
        bar-card-background {
          cursor: pointer;
          display: block;
          flex: 1 1 auto;
          height: var(--bar-height, 40px);
          max-width: var(--bar-width, 100%);
          min-width: 0;
          overflow: hidden;
          position: relative;
          width: var(--bar-width, 100%);
          border-radius: var(--bar-background-border-radius, var(--bar-card-background-border-radius, var(--bar-card-border-radius, var(--ha-card-border-radius, 12px))));
        }
        .vertical bar-card-background {
          height: var(--bar-height, 160px);
          min-height: var(--bar-height, 160px);
          width: 100%;
        }
        bar-card-backgroundbar,
        bar-card-currentbar,
        bar-card-contentbar,
        bar-card-targetbar,
        bar-card-markerbar,
        bar-card-animationbar {
          border-radius: inherit;
          display: block;
          inset: 0;
          position: absolute;
        }
        bar-card-backgroundbar {
          background: var(--bar-background-color);
        }
        bar-card-currentbar {
          background: var(--bar-color);
          border-radius: var(--bar-current-border-radius, inherit);
          inset: auto;
          transition: left .3s ease, right .3s ease, bottom .3s ease, top .3s ease, width .3s ease, height .3s ease;
        }
        .direction-right bar-card-currentbar {
          left: var(--bar-start);
          top: 0;
          height: 100%;
          width: var(--bar-size);
        }
        .direction-left bar-card-currentbar {
          right: var(--bar-start);
          top: 0;
          height: 100%;
          width: var(--bar-size);
        }
        .direction-up bar-card-currentbar {
          bottom: var(--bar-start);
          left: 0;
          height: var(--bar-size);
          width: 100%;
        }
        .direction-down bar-card-currentbar {
          top: var(--bar-start);
          left: 0;
          height: var(--bar-size);
          width: 100%;
        }
        bar-card-contentbar {
          align-items: center;
          box-sizing: border-box;
          display: flex;
          gap: 4px;
          justify-content: flex-start;
          overflow: hidden;
          padding: 0 8px;
          pointer-events: none;
          z-index: 2;
        }
        .vertical bar-card-contentbar {
          flex-direction: column;
          justify-content: flex-end;
          padding: 8px 4px;
        }
        bar-card-targetbar {
          background: color-mix(in srgb, var(--bar-color) 35%, transparent);
          opacity: .6;
          z-index: 1;
        }
        bar-card-markerbar {
          background: var(--bar-card-marker-color, var(--bar-color));
          border-radius: 0;
          opacity: .85;
          z-index: 3;
        }
        .horizontal bar-card-markerbar {
          bottom: 0;
          top: 0;
          width: 2px;
        }
        .vertical bar-card-markerbar {
          height: 2px;
          left: 0;
          right: 0;
        }
        bar-card-animationbar {
          background: linear-gradient(90deg, transparent 0%, transparent 38%, color-mix(in srgb, var(--bar-color) 28%, white) 50%, transparent 62%, transparent 100%);
          opacity: 0;
          z-index: 1;
          will-change: transform, opacity;
        }
        .horizontal bar-card-animationbar {
          animation: bar-card-sweep-horizontal var(--bar-animation-speed, 5s) infinite linear;
          animation-delay: var(--bar-animation-delay, 0s);
        }
        .vertical bar-card-animationbar {
          animation: bar-card-sweep-vertical var(--bar-animation-speed, 5s) infinite linear;
          animation-delay: var(--bar-animation-delay, 0s);
        }
        @keyframes bar-card-sweep-horizontal {
          0% { opacity: 0; transform: translateX(-100%); }
          18% { opacity: .14; }
          62% { opacity: .14; }
          100% { opacity: 0; transform: translateX(100%); }
        }
        @keyframes bar-card-sweep-vertical {
          0% { opacity: 0; transform: translateY(100%); }
          18% { opacity: .14; }
          62% { opacity: .14; }
          100% { opacity: 0; transform: translateY(-100%); }
        }
        bar-card-iconbar {
          align-items: center;
          color: var(--bar-icon-color, var(--paper-item-icon-color));
          display: flex;
          flex: 0 0 auto;
          height: 40px;
          justify-content: center;
          width: 40px;
          z-index: 4;
        }
        bar-card-iconbar img {
          border-radius: 50%;
          height: 28px;
          object-fit: cover;
          width: 28px;
        }
        bar-card-name,
        bar-card-value,
        bar-card-min,
        bar-card-max,
        bar-card-divider,
        bar-card-indicator,
        bar-card-minmax {
          align-items: center;
          display: inline-flex;
          min-width: 0;
          position: relative;
          white-space: nowrap;
          z-index: 4;
        }
        bar-card-name {
          flex: 1 1 auto;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        bar-card-value {
          margin-left: auto;
        }
        .vertical bar-card-value {
          margin-left: 0;
          margin-top: auto;
        }
        bar-card-minmax {
          font-size: 10px;
          gap: 2px;
          opacity: .65;
        }
        bar-card-indicator {
          color: var(--bar-color);
          filter: brightness(.85);
          width: 16px;
          justify-content: center;
        }
        .name-outside {
          margin: 0 8px;
        }
      </style>
    `;
  }

  _iconTemplate(config, stateObj, severity, iconColor) {
    const picture = config.show_entity_picture ? stateObj.attributes?.entity_picture : undefined;
    if (picture) {
      return `<bar-card-iconbar style="--bar-icon-color: ${iconColor};"><img alt="" src="${escapeHtml(picture)}"></bar-card-iconbar>`;
    }
    const icon = severity?.icon || config.icon || stateObj.attributes?.icon || defaultIcon(config.entity);
    if (String(icon).toLowerCase() === "off") return "";
    return `<bar-card-iconbar style="--bar-icon-color: ${iconColor};"><ha-icon icon="${escapeHtml(icon)}"></ha-icon></bar-card-iconbar>`;
  }

  _nameForConfig(config, stateObj) {
    if (config.name_entity) {
      const nameEntity = getStateObj(this._hass, config.name_entity);
      if (nameEntity) return nameEntity.state;
    }
    if (config.name_attribute) {
      const attributeName = getAttributeValue(stateObj, config.name_attribute);
      if (attributeName !== undefined) return attributeName;
    }
    if (config.name !== undefined && config.name !== null && config.name !== "") {
      if (this._hass?.formatEntityName && typeof config.name !== "string") {
        try {
          return this._hass.formatEntityName(stateObj, config.name);
        } catch (_err) {
          return JSON.stringify(config.name);
        }
      }
      return config.name;
    }
    if (this._hass?.formatEntityName) {
      try {
        return this._hass.formatEntityName(stateObj, undefined);
      } catch (_err) {
        // Fall through to friendly_name.
      }
    }
    return stateObj.attributes?.friendly_name || config.entity;
  }

  _unitForConfig(config, stateObj, rawValue) {
    if (Number.isNaN(parseNumber(rawValue))) return "";
    if (config.unit_of_measurement !== undefined && config.unit_of_measurement !== null) return config.unit_of_measurement;
    return stateObj.attributes?.unit_of_measurement || "";
  }

  _displayValue(config, stateObj, rawValue, barValue, max, unit) {
    const mapped = applyValueMap(config, rawValue);
    if (mapped !== undefined) return mapped;

    if (config.complementary && Number.isFinite(barValue)) {
      return `${formatNumber(max - barValue, config.decimal)}${unit ? ` ${unit}` : ""}`;
    }

    if (!config.attribute && config.unit_of_measurement === undefined && config.decimal === undefined && this._hass?.formatEntityState) {
      try {
        return this._hass.formatEntityState(stateObj);
      } catch (_err) {
        // Fall through to local formatting.
      }
    }

    if (Number.isFinite(parseNumber(rawValue))) {
      return `${formatNumber(rawValue, config.decimal)}${unit ? ` ${unit}` : ""}`;
    }

    return String(rawValue ?? "");
  }

  _severityForValue(config, value) {
    if (!Array.isArray(config.severity)) return undefined;
    const numeric = parseNumber(value);
    for (const section of config.severity) {
      if (!section) continue;
      if (Number.isFinite(numeric)) {
        const from = parseNumber(section.from);
        const to = parseNumber(section.to);
        if (Number.isFinite(from) && Number.isFinite(to) && numeric >= from && numeric <= to) return section;
      } else if (section.text !== undefined && String(section.text) === String(value)) {
        return section;
      }
    }
    return undefined;
  }

  _computeBarPercentages(value, min, max, config) {
    if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || min === max) {
      return { start: 0, size: 0 };
    }

    const percentFor = (candidate) => clamp(((candidate - min) / (max - min)) * 100, 0, 100);
    if (config.center_zero && min < 0 && max > 0) {
      const zero = percentFor(0);
      const current = percentFor(value);
      return {
        start: Math.min(zero, current),
        size: Math.abs(current - zero),
      };
    }

    return {
      start: 0,
      size: percentFor(value),
    };
  }

  _targetTemplate(target, min, max, direction, config) {
    if (!Number.isFinite(target) || min === max) return "";
    const percent = clamp(((target - min) / (max - min)) * 100, 0, 100);
    const markerPosition = direction === "left" ? `right: calc(${percent}% - 1px);` :
      direction === "up" ? `bottom: calc(${percent}% - 1px);` :
      direction === "down" ? `top: calc(${percent}% - 1px);` :
      `left: calc(${percent}% - 1px);`;

    if (config.target_band) {
      const bandStart = resolveNumber(this._hass, config.target_band.from, target);
      const bandEnd = resolveNumber(this._hass, config.target_band.to, target);
      const start = clamp(((Math.min(bandStart, bandEnd) - min) / (max - min)) * 100, 0, 100);
      const end = clamp(((Math.max(bandStart, bandEnd) - min) / (max - min)) * 100, 0, 100);
      const size = Math.max(0, end - start);
      const style = ["up", "down"].includes(direction)
        ? `bottom: ${start}%; height: ${size}%; left: 0; right: 0; top: auto; width: auto;`
        : `left: ${start}%; width: ${size}%; bottom: 0; top: 0; right: auto; height: auto;`;
      return `<bar-card-targetbar style="${style}"></bar-card-targetbar><bar-card-markerbar style="${markerPosition}"></bar-card-markerbar>`;
    }

    return `<bar-card-markerbar style="${markerPosition}"></bar-card-markerbar>`;
  }

  _indicatorTemplate(config, entityId, value, barColor) {
    if (!Number.isFinite(value)) return "";
    const key = entityId || config.entity;
    const previous = this._previousValues.get(key);
    this._previousValues.set(key, value);
    if (previous === undefined || previous === value) return `<bar-card-indicator style="--bar-color: ${barColor};"></bar-card-indicator>`;
    return `<bar-card-indicator style="--bar-color: ${barColor};">${value > previous ? "▲" : "▼"}</bar-card-indicator>`;
  }

  _attachActions() {
    this.querySelectorAll("bar-card-card[data-index]").forEach((element) => {
      const index = Number(element.dataset.index);
      const config = (this._renderedConfigArray || this._configArray)[index];
      const key = `${index}:${config.entity}`;

      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this._handleAction(config, "tap", event);
        }
      });

      element.addEventListener("pointerdown", () => {
        clearTimeout(this._pressTimers.get(key));
        this._pressTimers.set(
          key,
          window.setTimeout(() => {
            this._pressTimers.delete(key);
            this._handleAction(config, "hold");
          }, 500),
        );
      });

      element.addEventListener("pointerup", (event) => {
        const timer = this._pressTimers.get(key);
        if (!timer) return;
        clearTimeout(timer);
        this._pressTimers.delete(key);

        const now = Date.now();
        const last = this._lastTap.get(key) || 0;
        if (now - last < 300 && config.double_tap_action) {
          this._lastTap.delete(key);
          this._handleAction(config, "double_tap", event);
          return;
        }

        this._lastTap.set(key, now);
        window.setTimeout(() => {
          if (this._lastTap.get(key) === now) {
            this._lastTap.delete(key);
            this._handleAction(config, "tap", event);
          }
        }, config.double_tap_action ? 300 : 0);
      });

      element.addEventListener("pointercancel", () => {
        clearTimeout(this._pressTimers.get(key));
        this._pressTimers.delete(key);
      });
    });
  }

  _handleAction(config, actionName, event) {
    const actionConfig =
      config[`${actionName}_action`] ||
      (actionName === "tap" ? config.tap_action : undefined) ||
      (actionName === "tap" ? { action: "more-info" } : undefined);

    if (!actionConfig || actionConfig.action === "none") return;

    const normalizedAction = String(actionConfig.action || "");
    if (!ACTION_EVENT_TYPES.has(normalizedAction)) {
      fireEvent(this, "bar-card-action", { config, action: actionName, actionConfig, originalEvent: event });
      return;
    }

    const eventConfig = {
      ...config,
      entity: actionConfig.entity || config.entity,
      [`${actionName}_action`]: actionConfig,
    };
    fireEvent(this, "hass-action", { config: eventConfig, action: actionName, originalEvent: event }, { cancelable: true });
  }
}

if (!customElements.get("bar-card")) {
  customElements.define("bar-card", BarCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "bar-card",
  name: "Bar Card Modernized",
  preview: true,
  description: `Modernized community fork of custom-cards/bar-card (${CARD_VERSION}). Original: ${ORIGINAL_REPOSITORY}`,
  documentationURL: DOCUMENTATION_URL,
  getEntitySuggestion: (_hass, entityId) => {
    const domain = domainFromEntity(entityId);
    if (!["sensor", "input_number", "number", "counter", "person"].includes(domain)) return null;
    return {
      config: {
        type: "custom:bar-card",
        entity: entityId,
      },
    };
  },
});

console.info(
  `%c BAR-CARD MODERNIZED %c ${localize("common.version")} ${CARD_VERSION} `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray",
);
