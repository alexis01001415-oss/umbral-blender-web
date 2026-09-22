import "./style.css";
import "./room.css";
import { initHero } from "./hero.js";
import { initRoomControls } from "./room-controls.js";
import { initQuote } from "./quote.js";
import { initComparison } from "./comparison.js";
import { initRoomStory } from "./room-story.js";
import { initSectionMotion } from "./section-motion.js";
import { initContactDemo } from "./contact.js";
import "./refinements.css";
import "./contact.css";

initHero();
const roomControls = initRoomControls();
const quote = initQuote(document.querySelector("#quote-app"));
initComparison(document.querySelector("[data-duo-comparison]"));
initRoomStory();
initSectionMotion();
initContactDemo();

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
      document.querySelector("#cotizador").scrollIntoView({
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
    roomControls.setFabric(
      {
        lino: "linen",
        arena: "sand",
        cafe: "coffee",
        espresso: "espresso",
        carbon: "carbon",
      }[button.dataset.finish],
    );
    finishButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    document.querySelector("#finish-feedback").textContent =
      `${description} Aplicado al primer espacio del cotizador.`;
  }),
);

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
