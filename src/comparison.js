import "./comparison.css";

const instances = new WeakMap();
let comparisonCount = 0;

/** Progressive enhancement of a static image into an accessible day/night comparison.
 * Position is the percentage of DAY shown on the LEFT. NIGHT stays on the RIGHT.
 * The native range handles keyboard, Home/End and assistive technology; pointer
 * gestures only claim horizontal drags, leaving vertical mobile scrolling intact.
 */
export function initComparison(container) {
  if (!container) return null;
  if (instances.has(container)) return instances.get(container);
  const fallback = container.querySelector("img");
  if (!fallback) return null;
  const base = import.meta.env.BASE_URL;
  const id = `duo-comparison-${++comparisonCount}`;
  const events = new AbortController();
  const signal = events.signal;
  const savedChildren = [...container.childNodes];
  const stage = document.createElement("div");
  stage.className = "duo-comparison__stage";
  stage.innerHTML = `
    <div class="duo-comparison__images"></div>
    <span class="duo-comparison__label duo-comparison__label--day" aria-hidden="true">Día</span>
    <span class="duo-comparison__label duo-comparison__label--night" aria-hidden="true">Noche</span>
    <span class="duo-comparison__divider" aria-hidden="true">
      <span class="duo-comparison__handle"><span class="material-symbols-outlined">contrast</span></span>
    </span>
    <span class="duo-comparison__hint" aria-hidden="true">Desliza para comparar</span>
    <label class="duo-comparison__sr-only" for="${id}">Comparar persiana dúo de día y de noche</label>
    <p class="duo-comparison__sr-only" id="${id}-help">La misma persiana y apertura con distinta iluminación. Usa las flechas para mover la división; Inicio muestra noche y Fin muestra día. En pantalla táctil, desliza horizontalmente.</p>
    <input class="duo-comparison__range" id="${id}" type="range" min="0" max="100" step="1" value="50" aria-describedby="${id}-help" disabled>
  `;
  const day = fallback.cloneNode(true);
  day.className = "duo-comparison__image duo-comparison__image--day";
  day.draggable = false;
  const night = document.createElement("img");
  night.className = "duo-comparison__image duo-comparison__image--night";
  night.src = `${base}comparison/duo-night-768.webp`;
  night.srcset = `${base}comparison/duo-night-480.webp 480w, ${base}comparison/duo-night-768.webp 768w`;
  night.sizes = day.sizes || "(max-width:540px) calc(100vw - 48px), 30vw";
  night.width = 768;
  night.height = 864;
  night.alt = "La misma persiana dúo con luz interior cálida durante la noche";
  night.loading = "lazy";
  night.decoding = "async";
  night.draggable = false;
  stage.querySelector(".duo-comparison__images").append(day, night);
  container.replaceChildren(stage);
  container.classList.add("duo-comparison");

  const input = stage.querySelector("input");
  const dayLabel = stage.querySelector(".duo-comparison__label--day");
  const nightLabel = stage.querySelector(".duo-comparison__label--night");
  const hint = stage.querySelector(".duo-comparison__hint");
  let ready = false;
  let gesture = null;
  let destroyed = false;

  function render() {
    const value = Math.round(Math.min(100, Math.max(0, Number(input.value))));
    input.value = value;
    stage.style.setProperty("--comparison-position", `${value}%`);
    input.setAttribute(
      "aria-valuetext",
      `${value} por ciento día; ${100 - value} por ciento noche`,
    );
    dayLabel.hidden = value < 12;
    nightLabel.hidden = value > 88;
  }
  function onLoaded() {
    if (destroyed || !night.naturalWidth || !day.naturalWidth) return;
    ready = true;
    input.disabled = false;
    stage.classList.add("is-ready");
    render();
  }
  function onError() {
    ready = false;
    input.disabled = true;
    stage.classList.remove("is-ready");
    hint.textContent = "Persiana dúo · vista de día";
    hint.classList.add("is-fallback");
  }
  night.addEventListener("load", onLoaded, { signal });
  day.addEventListener("load", onLoaded, { signal });
  night.addEventListener("error", onError, { signal });
  day.addEventListener("error", onError, { signal });
  input.addEventListener("input", render, { signal });
  render();
  onLoaded();

  const setPoint = (x) => {
    const rect = stage.getBoundingClientRect();
    if (!rect.width) return;
    input.value = Math.round(
      Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100)),
    );
    render();
  };
  const focusRange = () => input.focus({ preventScroll: true });
  stage.addEventListener(
    "pointerdown",
    (event) => {
      if (
        !ready ||
        !event.isPrimary ||
        (event.pointerType === "mouse" && event.button !== 0)
      )
        return;
      gesture = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        active: event.pointerType === "mouse",
      };
      if (gesture.active) {
        event.preventDefault();
        stage.setPointerCapture(event.pointerId);
        stage.classList.add("is-dragging");
        focusRange();
        setPoint(event.clientX);
      }
    },
    { signal },
  );
  stage.addEventListener(
    "pointermove",
    (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (!gesture.active) {
        const x = Math.abs(event.clientX - gesture.x);
        const y = Math.abs(event.clientY - gesture.y);
        if (y > 8 && y > x) {
          gesture = null;
          return;
        }
        if (x <= 8 || x <= y) return;
        gesture.active = true;
        stage.setPointerCapture(event.pointerId);
        stage.classList.add("is-dragging");
        focusRange();
      }
      if (event.cancelable) event.preventDefault();
      setPoint(event.clientX);
    },
    { signal },
  );
  stage.addEventListener(
    "pointerup",
    (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (
        !gesture.active &&
        Math.abs(event.clientX - gesture.x) < 8 &&
        Math.abs(event.clientY - gesture.y) < 8
      ) {
        focusRange();
        setPoint(event.clientX);
      }
      gesture = null;
      stage.classList.remove("is-dragging");
      if (stage.hasPointerCapture(event.pointerId))
        stage.releasePointerCapture(event.pointerId);
    },
    { signal },
  );
  for (const type of ["pointercancel", "lostpointercapture"]) {
    stage.addEventListener(
      type,
      () => {
        gesture = null;
        stage.classList.remove("is-dragging");
      },
      { signal },
    );
  }

  const instance = {
    setValue(value) {
      if (!Number.isFinite(Number(value))) return;
      input.value = Math.min(100, Math.max(0, Number(value)));
      render();
    },
    destroy() {
      destroyed = true;
      events.abort();
      container.replaceChildren(...savedChildren);
      instances.delete(container);
    },
  };
  instances.set(container, instance);
  return instance;
}
