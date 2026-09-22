import "./style.css";
import "./room.css";
import { initHero } from "./hero.js";
import { initRoomControls } from "./room-controls.js";
import { initQuote } from "./quote.js";

initHero();
initRoomControls();
const quote = initQuote(document.querySelector("#quote-app"));

const menuButton = document.querySelector("#menu-toggle");
const menu = document.querySelector("#mobile-menu");
function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  menuButton.firstElementChild.textContent = open ? "close" : "menu";
}
menuButton.addEventListener("click", () => setMenu(menu.hidden));
menu.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !menu.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!menu.hidden && !event.target.closest(".site-header")) setMenu(false);
});
matchMedia("(min-width:801px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

document.querySelectorAll("[data-quote-fabric]").forEach((button) => {
  button.addEventListener("click", () => {
    if (quote.setFirstWindow({ fabric: button.dataset.quoteFabric })) {
      document
        .querySelector("#cotizador")
        .scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      document
        .querySelector('#quote-app [data-field="fabric"]')
        .focus({ preventScroll: true });
    }
  });
});

const finishes = {
  lino: ["ivory", "Lino: un tono luminoso para un ambiente suave."],
  arena: ["sand", "Arena: una calidez natural que combina con todo."],
  cafe: ["coffee", "Café: una base cálida que acompaña a la madera."],
  espresso: ["espresso", "Espresso: profundidad y carácter en tu ventana."],
  carbon: ["charcoal", "Carbón: un acento sereno de líneas definidas."],
};
const finishButtons = document.querySelectorAll("[data-finish]");
finishButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const [color, description] = finishes[button.dataset.finish];
    quote.setFirstWindow({ color });
    finishButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    document.querySelector("#finish-feedback").textContent =
      `${description} Aplicado al primer espacio del cotizador.`;
  }),
);

const rooms = {
  bedroom: {
    title: "Hazle espacio al descanso.",
    text: "Una tela opaca ayuda a bajar la intensidad del exterior. Acompáñala con tonos cálidos para un ambiente que invita a parar.",
    icon: "bed",
    recommendation: "Explora blackout o dúo",
    image: "closed",
    alt: "Ambiente de descanso con la persiana cerrada y luz cálida",
  },
  living: {
    title: "Deja que el día se quede.",
    text: "Suaviza la luz sin perder la sensación de amplitud. Las texturas neutras unen tu ventana con el resto de la sala.",
    icon: "weekend",
    recommendation: "Explora screen o translúcido",
    image: "open",
    alt: "Sala con persiana abierta y luz natural junto al sillón",
  },
  office: {
    title: "Encuentra tu punto de enfoque.",
    text: "Gradúa la luz que llega a tu escritorio y reduce reflejos según la orientación de tu ventana. Tú decides cuándo desconectar.",
    icon: "workspaces",
    recommendation: "Explora screen o dúo",
    image: "room",
    alt: "Rincón tranquilo con luz filtrada para inspirar un espacio de trabajo",
  },
};
const tabs = [...document.querySelectorAll("[data-room]")];
const panel = document.querySelector("#room-panel");
function chooseRoom(tab) {
  const data = rooms[tab.dataset.room];
  tabs.forEach((item) => {
    item.setAttribute("aria-selected", String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  });
  panel.setAttribute("aria-labelledby", tab.id);
  panel.querySelector("h3").textContent = data.title;
  panel.querySelector("p").textContent = data.text;
  const recommendation = panel.querySelector(".recommendation");
  recommendation.querySelector(".material-symbols-outlined").textContent =
    data.icon;
  recommendation.lastChild.textContent = data.recommendation;
  const photo = document.querySelector("#room-inspiration");
  const imageBase = `${import.meta.env.BASE_URL}rooms/${data.image}`;
  photo.srcset = `${imageBase}-480.webp 480w, ${imageBase}-960.webp 960w`;
  photo.src = `${imageBase}-960.webp`;
  photo.alt = data.alt;
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => chooseRoom(tab));
  tab.addEventListener("keydown", (event) => {
    const positions = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in positions)) return;
    event.preventDefault();
    const next = tabs[positions[event.key]];
    chooseRoom(next);
    next.focus();
  });
});

const privacy = document.querySelector("#privacy-dialog");
document
  .querySelector("#privacy-open")
  .addEventListener("click", () => privacy.showModal());
document
  .querySelector("#privacy-close")
  .addEventListener("click", () => privacy.close());
privacy.addEventListener("click", (event) => {
  if (event.target !== privacy) return;
  const bounds = privacy.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    privacy.close();
});
