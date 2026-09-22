import { ROOM_FINISHES, DEFAULT_ROOM_FINISH } from "./room-palette.js";

/** The original room is loaded only after an explicit request to explore it. */
export function initRoomControls() {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);
  const slider = $("#openness");
  const palette = $(".swatches");
  const currentFinish = palette.querySelector(".is-active")?.dataset.fabric;
  let selectedFinish = Object.hasOwn(ROOM_FINISHES, currentFinish)
    ? currentFinish
    : DEFAULT_ROOM_FINISH;
  palette.setAttribute("role", "group");
  palette.replaceChildren(
    ...Object.entries(ROOM_FINISHES).map(([key, finish]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.fabric = key;
      button.className = `swatch${key === selectedFinish ? " is-active" : ""}`;
      button.style.setProperty("--swatch", finish.color);
      button.setAttribute("aria-label", `Tejido ${finish.name}`);
      button.setAttribute("aria-pressed", String(key === selectedFinish));
      button.title = finish.name;
      return button;
    }),
  );
  $("#fabric-name").firstChild.textContent = ROOM_FINISHES[selectedFinish].name;
  let room,
    playing = false,
    paused = false,
    endpoint = 0,
    loaded = false,
    busy = false;

  function setPlayState(active) {
    playing = active;
    $("#play-label").textContent = active
      ? "Pausar movimiento"
      : paused
        ? endpoint === 1
          ? "Continuar apertura"
          : "Continuar cierre"
        : Number(slider.value) < 1
          ? "Abrir persiana"
          : "Cerrar persiana";
    $("#play-icon").textContent = active ? "pause" : "play_arrow";
    $("#motion-status").textContent = active
      ? endpoint === 0
        ? "La habitación se vuelve íntima."
        : "La luz vuelve a entrar."
      : "Tú decides cuánta luz entra.";
  }
  function updateOpenness(value) {
    const percent = Math.round(value * 100);
    slider.value = percent;
    slider.style.setProperty("--value", `${percent}%`);
    slider.setAttribute("aria-valuetext", `${percent} por ciento abierta`);
    $("#openness-value").firstChild.textContent = percent;
    if (!playing) setPlayState(false);
  }
  function choose(buttons, active) {
    buttons.forEach((button) => {
      button.classList.toggle("is-active", button === active);
      button.setAttribute("aria-pressed", String(button === active));
    });
  }
  function enableControls(enabled) {
    $("#room-settings").disabled = !enabled;
    $$(".camera-switch button, #reset-camera").forEach((button) => {
      button.disabled = !enabled;
    });
    $("#scene").tabIndex = enabled ? 0 : -1;
  }
  function showError(message) {
    const returnFocus =
      $("#loading") === document.activeElement ||
      $("#scene").contains(document.activeElement);
    loaded = false;
    $("#loading").hidden = true;
    $("#scene-error").hidden = false;
    $("#error-detail").textContent = message;
    enableControls(false);
    $(".viewport").classList.remove("is-ready");
    if (returnFocus && viewportVisible())
      $("#retry").focus({ preventScroll: true });
  }
  function viewportVisible() {
    const bounds = $(".viewport").getBoundingClientRect();
    return (
      bounds.bottom > $(".site-header").offsetHeight && bounds.top < innerHeight
    );
  }
  async function loadRoom() {
    if (busy) return;
    busy = true;
    const transferFocus =
      document.activeElement === $("#activate-room") ||
      document.activeElement === $("#retry");
    $("#scene-error").hidden = true;
    $("#activate-room").hidden = true;
    $("#loading").hidden = false;
    if (transferFocus) $("#loading").focus({ preventScroll: true });
    $("#load-progress").textContent = "0%";
    $("#load-bar").style.width = "0%";
    enableControls(false);
    room?.dispose();
    room = undefined;
    try {
      const { createRoom } = await import("./room.js");
      room = await createRoom($("#scene"), {
        onProgress: (percent) => {
          $("#load-progress").textContent = `${percent}%`;
          $("#load-bar").style.width = `${percent}%`;
        },
        onOpenness: updateOpenness,
        onComplete: () => {
          paused = false;
          setPlayState(false);
        },
        onCameraManual: () => choose($$("[data-view]"), null),
        onViewChange: (view) =>
          choose($$("[data-view]"), $(`[data-view="${view}"]`)),
        onError: showError,
      });
      loaded = true;
      playing = paused = false;
      room.setOpenness(Number(slider.value) / 100);
      room.setLighting($(".segmented .is-active").dataset.light);
      room.setFabric(selectedFinish);
      const stillWaiting =
        document.activeElement === $("#loading") && viewportVisible();
      $("#loading").hidden = true;
      $(".viewport").classList.add("is-ready");
      enableControls(true);
      setPlayState(false);
      if (stillWaiting) $("#scene").focus({ preventScroll: true });
    } catch (error) {
      console.error("Room initialization failed:", error);
      showError(
        "La vista necesita WebGL 2. Prueba de nuevo o continúa explorando materiales y cotizando tu espacio.",
      );
    } finally {
      busy = false;
    }
  }
  slider.addEventListener("input", () => {
    room?.stop();
    paused = false;
    setPlayState(false);
    updateOpenness(Number(slider.value) / 100);
    room?.setOpenness(Number(slider.value) / 100);
  });
  $("#play").addEventListener("click", () => {
    if (!loaded) return;
    if (playing) {
      room.stop();
      paused = true;
      setPlayState(false);
      return;
    }
    if (!paused) endpoint = Number(slider.value) < 1 ? 1 : 0;
    paused = false;
    setPlayState(true);
    room.animateTo(endpoint);
  });
  $("#reverse").addEventListener("click", () => {
    if (!loaded) return;
    endpoint = endpoint === 0 ? 1 : 0;
    paused = false;
    setPlayState(true);
    room.animateTo(endpoint);
  });
  $$("[data-light]").forEach((button) =>
    button.addEventListener("click", () => {
      choose($$("[data-light]"), button);
      room?.setLighting(button.dataset.light);
    }),
  );
  function selectFabric(name) {
    if (!Object.hasOwn(ROOM_FINISHES, name)) return false;
    selectedFinish = name;
    const button = palette.querySelector(`[data-fabric="${name}"]`);
    choose(palette.querySelectorAll("[data-fabric]"), button);
    $("#fabric-name").firstChild.textContent = ROOM_FINISHES[name].name;
    room?.setFabric(name);
    return true;
  }
  palette
    .querySelectorAll("[data-fabric]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        selectFabric(button.dataset.fabric),
      ),
    );
  $$("[data-view]").forEach((button) =>
    button.addEventListener("click", () => {
      choose($$("[data-view]"), button);
      room?.setView(button.dataset.view);
    }),
  );
  $("#reset-camera").addEventListener("click", () => {
    choose($$("[data-view]"), $('[data-view="room"]'));
    room?.setView("room");
  });
  $("#activate-room").addEventListener("click", loadRoom);
  $("#retry").addEventListener("click", loadRoom);
  addEventListener("pagehide", (event) => {
    if (!event.persisted) room?.dispose();
  });
  enableControls(false);
  return { setFabric: selectFabric, getFabric: () => selectedFinish };
}
