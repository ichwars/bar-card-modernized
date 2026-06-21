const listeners = new WeakMap();

class TestElement {
  constructor() {
    this.innerHTML = "";
    this.isConnected = true;
    this.parentNode = {};
    listeners.set(this, new Map());
  }

  addEventListener(type, listener) {
    const byType = listeners.get(this);
    byType.set(type, [...(byType.get(type) || []), listener]);
  }

  dispatchEvent(event) {
    event.target = this;
    for (const listener of listeners.get(this).get(event.type) || []) {
      listener.call(this, event);
    }
    return !event.defaultPrevented;
  }

  querySelectorAll() {
    return [];
  }
}

class TestEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
    this.bubbles = Boolean(options.bubbles);
    this.cancelable = Boolean(options.cancelable);
    this.composed = Boolean(options.composed);
    this.defaultPrevented = false;
  }

  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
}

const registry = new Map();

globalThis.HTMLElement = TestElement;
globalThis.CustomEvent = TestEvent;
globalThis.customElements = {
  define(name, klass) {
    registry.set(name, klass);
  },
  get(name) {
    return registry.get(name);
  },
};
globalThis.localStorage = { getItem: () => "en" };
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { language: "en" },
});
globalThis.window = { customCards: [], open: () => undefined };
globalThis.performance = { now: () => 0 };
globalThis.requestAnimationFrame = (callback) => {
  callback();
  return 1;
};
globalThis.cancelAnimationFrame = () => undefined;

function assert(name, condition) {
  if (!condition) {
    throw new Error(`FAIL ${name}`);
  }
  console.log(`PASS ${name}`);
}

function makeHass(value = "42") {
  return {
    states: {
      "sensor.demo": {
        entity_id: "sensor.demo",
        state: value,
        attributes: {
          friendly_name: "Demo sensor",
          unit_of_measurement: "%",
        },
      },
    },
    formatEntityName: (stateObj) => stateObj.attributes.friendly_name,
    formatEntityState: (stateObj) => `${stateObj.state} ${stateObj.attributes.unit_of_measurement}`,
  };
}

await import("../src/bar-card.js");

const BarCard = customElements.get("bar-card");
assert("custom element registered", Boolean(BarCard));

const actionCard = new BarCard();
let actionEvent;
actionCard.addEventListener("hass-action", (event) => {
  actionEvent = event;
});
actionCard._handleAction({ entity: "sensor.demo", tap_action: { action: "more-info" } }, "tap");
assert("hass-action dispatches tap", actionEvent?.type === "hass-action");
assert("hass-action carries action name", actionEvent?.detail?.action === "tap");
assert("hass-action carries action config", actionEvent?.detail?.config?.tap_action?.action === "more-info");

const renderCard = new BarCard();
let renderCount = 0;
const originalRender = renderCard._render.bind(renderCard);
renderCard._render = () => {
  renderCount += 1;
  return originalRender();
};

renderCard.setConfig({ entity: "sensor.demo" });
renderCard.hass = makeHass("42");
const afterInitialHass = renderCount;
renderCard.hass = makeHass("42");
assert("same relevant hass state skips render", renderCount === afterInitialHass);
renderCard.hass = makeHass("43");
assert("changed relevant hass state renders", renderCount === afterInitialHass + 1);

const normalizedCard = new BarCard();
normalizedCard.setConfig({
  entity: "sensor.demo",
  columns: "0",
  direction: "sideways",
  positions: { value: "banana" },
  animation: { state: "maybe", speed: "slow" },
});
assert("columns normalized", normalizedCard._config.columns === 1);
assert("direction normalized", normalizedCard._config.direction === "right");
assert("positions normalized", normalizedCard._config.positions.value === "inside");
assert("animation normalized", normalizedCard._config.animation.state === "off" && normalizedCard._config.animation.speed === 5);
