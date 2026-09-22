import "./room-story.css";

const rooms = [
  {
    key: "bedroom",
    title: "Hazle espacio al descanso.",
    text: "Una tela opaca ayuda a bajar la intensidad del exterior. Acompáñala con tonos cálidos para un ambiente que invita a parar.",
    icon: "bed",
    recommendation: "Explora blackout o dúo",
    image: "closed",
    alt: "Ambiente de descanso con la persiana cerrada y luz cálida",
    caption: "UN RINCÓN PARA BAJAR EL RITMO.",
  },
  {
    key: "living",
    title: "Deja que el día se quede.",
    text: "Suaviza la luz sin perder la sensación de amplitud. Las texturas neutras unen tu ventana con el resto de la sala.",
    icon: "weekend",
    recommendation: "Explora screen o translúcido",
    image: "open",
    alt: "Sala con persiana abierta y luz natural junto al sillón",
    caption: "LUZ PARA COMPARTIR EL DÍA.",
  },
  {
    key: "office",
    title: "Encuentra tu punto de enfoque.",
    text: "Gradúa la luz que llega a tu escritorio y reduce reflejos según la orientación de tu ventana. Tú decides cuándo desconectar.",
    icon: "workspaces",
    recommendation: "Explora screen o dúo",
    image: "room",
    alt: "Rincón tranquilo con luz filtrada para inspirar un espacio de trabajo",
    caption: "UN MOMENTO PARA CONCENTRARTE.",
  },
];

const instances = new WeakMap();
const clamp = (value) => Math.min(1, Math.max(0, value));

/** Enhance the existing room tabs. Returns a cleanup function; no HTML changes required. */
export function initRoomStory() {
  const section = document.querySelector(".rooms-section");
  if (!section) return () => {};
  if (instances.has(section)) return instances.get(section);

  const photo = section.querySelector(".rooms-photo");
  const image = section.querySelector("#room-inspiration");
  const copy = section.querySelector(".rooms-copy");
  const panel = section.querySelector("#room-panel");
  const tabs = rooms.map(({ key }) =>
    section.querySelector(`[data-room="${key}"]`),
  );
  if (!photo || !image || !copy || !panel || tabs.some((tab) => !tab))
    return () => {};

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const narrowLayout = matchMedia("(max-width: 800px)");
  const controller = new AbortController();
  const { signal } = controller;
  const originalChildren = [...section.children];
  const originalImage = {
    src: image.getAttribute("src"),
    srcset: image.getAttribute("srcset"),
    sizes: image.getAttribute("sizes"),
    alt: image.alt,
  };
  const originalCaption = photo.querySelector(".photo-caption")?.textContent;
  const originalPanel = panel.cloneNode(true);
  const pin = document.createElement("div");
  pin.className = "room-story-pin";
  pin.append(...originalChildren);
  section.append(pin);
  section.classList.add("room-story");

  const panelFrame = document.createElement("div");
  panelFrame.className = "room-story-panel-frame";
  panel.before(panelFrame);
  panelFrame.append(panel);
  panel.classList.add("room-story-panel");

  const outgoingImage = image.cloneNode(false);
  outgoingImage.removeAttribute("id");
  outgoingImage.removeAttribute("src");
  outgoingImage.removeAttribute("srcset");
  outgoingImage.alt = "";
  outgoingImage.setAttribute("aria-hidden", "true");
  outgoingImage.className = "room-story-outgoing-photo";
  photo.append(outgoingImage);

  const step = document.createElement("span");
  step.className = "room-story-step";
  step.setAttribute("aria-hidden", "true");
  photo.append(step);

  let currentIndex = -1;
  let imageVersion = 0;
  let frame = 0;
  let layoutFrame = 0;
  let scrollEnabled = false;
  let navigation = null;
  let navigationTimer = 0;
  let disposed = false;
  let animations = [];

  function cancelAnimations() {
    animations.forEach((animation) => animation.cancel());
    animations = [];
    panelFrame.querySelector(".room-story-panel-outgoing")?.remove();
    outgoingImage.style.opacity = "0";
  }

  function animate(element, keyframes, options) {
    if (reducedMotion.matches || !element.animate) return null;
    const animation = element.animate(keyframes, options);
    animations.push(animation);
    return animation;
  }

  function writePanel(target, data) {
    target.querySelector("h3").textContent = data.title;
    target.querySelector("p").textContent = data.text;
    const recommendation = target.querySelector(".recommendation");
    const icon = recommendation.querySelector(".material-symbols-outlined");
    icon.textContent = data.icon;
    recommendation.replaceChildren(
      icon,
      document.createTextNode(data.recommendation),
    );
  }

  function decorativePanel(className) {
    const clone = panel.cloneNode(true);
    clone.removeAttribute("id");
    clone.removeAttribute("role");
    clone.removeAttribute("aria-labelledby");
    clone.removeAttribute("tabindex");
    clone
      .querySelectorAll("[id]")
      .forEach((node) => node.removeAttribute("id"));
    clone.setAttribute("aria-hidden", "true");
    clone.inert = true;
    clone.classList.add(className);
    return clone;
  }

  function sourceFor(data) {
    const base = `${import.meta.env.BASE_URL}rooms/${data.image}`;
    return {
      src: `${base}-960.webp`,
      srcset: `${base}-480.webp 480w, ${base}-960.webp 960w`,
    };
  }

  function setImage(data, shouldAnimate) {
    const version = ++imageVersion;
    const source = sourceFor(data);
    const show = () => {
      if (disposed || version !== imageVersion) return;
      outgoingImage.srcset = image.srcset;
      outgoingImage.src = image.src;
      outgoingImage.sizes = image.sizes;
      image.srcset = source.srcset;
      image.src = source.src;
      image.alt = data.alt;
      const caption = photo.querySelector(".photo-caption");
      if (caption) caption.textContent = data.caption;
      if (shouldAnimate && !reducedMotion.matches) {
        animate(outgoingImage, [{ opacity: 1 }, { opacity: 0 }], {
          duration: 520,
          easing: "cubic-bezier(.2,.6,.25,1)",
        });
        animate(
          image,
          [{ transform: "scale(1.018)" }, { transform: "scale(1)" }],
          {
            duration: 620,
            easing: "cubic-bezier(.2,.6,.25,1)",
          },
        );
      }
    };
    if (!shouldAnimate) {
      show();
      return;
    }
    const incoming = new Image();
    incoming.decoding = "async";
    incoming.sizes = image.sizes;
    let committed = false;
    const showIfLoaded = () => {
      // A failed download must not replace the current image or its caption.
      // Some browsers reject decode() despite a valid loaded image, so inspect
      // the resource itself and allow the load event to complete the update.
      if (committed || !incoming.naturalWidth) return;
      committed = true;
      show();
    };
    incoming.addEventListener("load", showIfLoaded, { once: true });
    incoming.srcset = source.srcset;
    incoming.src = source.src;
    if (incoming.decode) incoming.decode().then(showIfLoaded, showIfLoaded);
    if (incoming.complete) showIfLoaded();
  }

  function chooseRoom(index, shouldAnimate = true) {
    if (index === currentIndex) return;
    cancelAnimations();
    const oldPanel =
      shouldAnimate && !reducedMotion.matches
        ? decorativePanel("room-story-panel-outgoing")
        : null;
    currentIndex = index;
    const data = rooms[index];
    tabs.forEach((tab, position) => {
      tab.setAttribute("aria-selected", String(position === index));
      tab.tabIndex = position === index ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", tabs[index].id);
    writePanel(panel, data);
    section.dataset.room = data.key;
    step.textContent = `${String(index + 1).padStart(2, "0")} / 03`;
    if (oldPanel) {
      panelFrame.append(oldPanel);
      const out = animate(oldPanel, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
      });
      out?.finished.then(
        () => oldPanel.remove(),
        () => oldPanel.remove(),
      );
      animate(
        panel,
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 360,
          easing: "cubic-bezier(.2,.6,.25,1)",
        },
      );
    }
    setImage(data, shouldAnimate);
  }

  function geometry() {
    const top = parseFloat(getComputedStyle(pin).top) || 0;
    return {
      start: section.getBoundingClientRect().top + window.scrollY - top,
      travel: Math.max(1, section.offsetHeight - pin.offsetHeight),
    };
  }

  function releaseNavigation() {
    clearTimeout(navigationTimer);
    navigation = null;
  }

  function updateFromScroll() {
    frame = 0;
    if (disposed || !scrollEnabled) return;
    const { start, travel } = geometry();
    const progress = clamp((window.scrollY - start) / travel);
    section.style.setProperty("--room-story-progress", String(progress));
    if (navigation) {
      if (Math.abs(window.scrollY - navigation.target) > 2) return;
      releaseNavigation();
    }
    chooseRoom(Math.min(rooms.length - 1, Math.floor(progress * rooms.length)));
  }

  function scheduleScroll() {
    if (!frame) frame = requestAnimationFrame(updateFromScroll);
  }

  function reservePanelSpace() {
    const probe = decorativePanel("room-story-panel-measure");
    panelFrame.append(probe);
    let panelHeight = 0;
    rooms.forEach((data) => {
      writePanel(probe, data);
      panelHeight = Math.max(panelHeight, probe.scrollHeight);
    });
    probe.remove();
    panelFrame.style.setProperty("--room-panel-height", `${panelHeight}px`);
  }

  function selectByUser(index) {
    chooseRoom(index);
    releaseNavigation();
    if (!scrollEnabled) return;
    const { start, travel } = geometry();
    // Use the middle of the chosen interval, safely away from a scroll boundary.
    const target = start + travel * ((index + 0.5) / rooms.length);
    navigation = { target };
    navigationTimer = setTimeout(() => {
      releaseNavigation();
      scheduleScroll();
    }, 1800);
    window.scrollTo({ top: target, behavior: "smooth" });
  }

  function measureLayout() {
    layoutFrame = 0;
    if (disposed) return;
    releaseNavigation();
    const canTry =
      !reducedMotion.matches &&
      window.innerHeight >= 640 &&
      (!window.visualViewport || window.visualViewport.scale <= 1.05);
    section.classList.toggle("room-story-measuring", canTry);

    // Reserve enough space for the longest panel so transitions don't shift layout.
    reservePanelSpace();

    let fits = false;
    if (canTry) {
      const styles = getComputedStyle(pin);
      const padding =
        parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const gap = parseFloat(styles.rowGap) || 0;
      const contentHeight = narrowLayout.matches
        ? photo.offsetHeight + copy.offsetHeight + gap
        : Math.max(photo.offsetHeight, copy.offsetHeight);
      const visibleHeight = window.visualViewport?.height ?? window.innerHeight;
      const top = parseFloat(styles.top) || 0;
      fits =
        contentHeight + padding <= pin.clientHeight + 1 &&
        pin.clientHeight + top <= visibleHeight + 1;
    }
    scrollEnabled = canTry && fits;
    section.classList.toggle("is-scroll-story", scrollEnabled);
    section.classList.remove("room-story-measuring");
    section.dataset.storyMode = scrollEnabled ? "scroll" : "tabs";
    if (!scrollEnabled) reservePanelSpace();
    if (reducedMotion.matches) cancelAnimations();
    if (scrollEnabled) scheduleScroll();
  }

  function scheduleLayout() {
    if (!layoutFrame) layoutFrame = requestAnimationFrame(measureLayout);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectByUser(index), { signal });
    tab.addEventListener(
      "keydown",
      (event) => {
        const destinations = {
          ArrowRight: (index + 1) % rooms.length,
          ArrowLeft: (index + rooms.length - 1) % rooms.length,
          Home: 0,
          End: rooms.length - 1,
        };
        if (!(event.key in destinations)) return;
        event.preventDefault();
        const next = destinations[event.key];
        selectByUser(next);
        tabs[next].focus({ preventScroll: true });
      },
      { signal },
    );
  });
  window.addEventListener("scroll", scheduleScroll, { passive: true, signal });
  window.addEventListener("resize", scheduleLayout, { passive: true, signal });
  window.visualViewport?.addEventListener("resize", scheduleLayout, {
    passive: true,
    signal,
  });
  window.addEventListener(
    "scrollend",
    () => {
      if (!navigation || Math.abs(window.scrollY - navigation.target) > 2)
        return;
      releaseNavigation();
      scheduleScroll();
    },
    { signal },
  );
  ["wheel", "touchstart", "pointerdown"].forEach((event) => {
    window.addEventListener(event, releaseNavigation, {
      passive: true,
      signal,
    });
  });
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        releaseNavigation();
    },
    { capture: true, signal },
  );
  reducedMotion.addEventListener("change", scheduleLayout, { signal });
  narrowLayout.addEventListener("change", scheduleLayout, { signal });
  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(scheduleLayout)
      : null;
  resizeObserver?.observe(copy);
  const header = document.querySelector(".site-header");
  if (header) resizeObserver?.observe(header);
  document.fonts?.ready.then(() => {
    if (!disposed) scheduleLayout();
  });

  image.sizes =
    "(max-width:800px) calc(100vw - 48px), (max-width:1440px) 50vw, 680px";
  chooseRoom(0, false);
  scheduleLayout();

  const destroy = () => {
    disposed = true;
    ++imageVersion;
    controller.abort();
    resizeObserver?.disconnect();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(layoutFrame);
    releaseNavigation();
    cancelAnimations();
    outgoingImage.remove();
    step.remove();
    panelFrame.replaceWith(panel);
    panel.classList.remove("room-story-panel");
    panel.replaceChildren(...originalPanel.childNodes);
    panel.setAttribute(
      "aria-labelledby",
      originalPanel.getAttribute("aria-labelledby"),
    );
    tabs.forEach((tab, index) => {
      tab.setAttribute("aria-selected", String(index === 0));
      tab.tabIndex = index === 0 ? 0 : -1;
    });
    Object.entries(originalImage).forEach(([attribute, value]) => {
      if (value === null) image.removeAttribute(attribute);
      else image.setAttribute(attribute, value);
    });
    const caption = photo.querySelector(".photo-caption");
    if (caption && originalCaption) caption.textContent = originalCaption;
    pin.replaceWith(...originalChildren);
    section.classList.remove(
      "room-story",
      "is-scroll-story",
      "room-story-measuring",
    );
    section.style.removeProperty("--room-story-progress");
    delete section.dataset.room;
    delete section.dataset.storyMode;
    instances.delete(section);
  };
  instances.set(section, destroy);
  return destroy;
}
