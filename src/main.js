import "./style.css";
import { createRoom } from "./room.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const slider = $("#openness");
let room;
let playing = false;
let paused = false;
let endpoint = 0;
let loaded = false;

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
  $("#play-icon").innerHTML = active
    ? '<path d="M7 4v12M13 4v12"/>'
    : '<path d="m7 4 9 6-9 6Z"/>';
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
  $("#openness-value").innerHTML = `${percent}<span>%</span>`;
  if (!playing) setPlayState(false);
}

function choose(buttons, active) {
  buttons.forEach((button) => {
    const selected = button === active;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

async function init() {
  $("#scene-error").hidden = true;
  $("#loading").classList.remove("is-done");
  $("#loading").removeAttribute("aria-hidden");
  $("#play").disabled = true;
  $("#load-progress").textContent = "0%";
  room?.dispose();
  try {
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
      onCameraManual: () => {
        $$(".camera-switch button").forEach((button) => {
          button.classList.remove("is-active");
          button.setAttribute("aria-pressed", "false");
        });
      },
      onError: (message) => showError(message),
    });
    loaded = true;
    room.setOpenness(Number(slider.value) / 100);
    room.setLighting($(".segmented .is-active").dataset.light);
    room.setFabric($(".swatch.is-active").dataset.fabric);
    $("#loading").classList.add("is-done");
    $("#loading").setAttribute("aria-hidden", "true");
    $(".viewport").classList.add("is-ready");
    $("#play").disabled = false;
    $("#reverse").disabled = false;
  } catch (error) {
    console.error("Room initialization failed:", error);
    showError(
      "La vista necesita WebGL 2 y una conexión para cargar la escena. Prueba a recargar o a usar otro navegador.",
    );
  }
}

function showError(message) {
  loaded = false;
  $("#loading").classList.add("is-done");
  $("#loading").setAttribute("aria-hidden", "true");
  $("#scene-error").hidden = false;
  $("#error-detail").textContent = message;
  $("#play").disabled = true;
  $("#reverse").disabled = true;
  $(".viewport").classList.remove("is-ready");
}

slider.addEventListener("input", () => {
  const value = Number(slider.value) / 100;
  room?.stop();
  paused = false;
  setPlayState(false);
  updateOpenness(value);
  room?.setOpenness(value);
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
$$("[data-fabric]").forEach((button) =>
  button.addEventListener("click", () => {
    choose($$("[data-fabric]"), button);
    const names = { carbon: "Carbón", linen: "Lino", clay: "Arcilla" };
    $("#fabric-name").innerHTML =
      `${names[button.dataset.fabric]}<small>BLACKOUT · TEJIDO MATE</small>`;
    room?.setFabric(button.dataset.fabric);
  }),
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
$("#retry").addEventListener("click", init);
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) room?.dispose();
});
init();
