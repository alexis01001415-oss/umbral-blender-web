import { initHeroLife } from "./hero-life.js";

/** The Eevee endpoints share a camera. One moving mask reveals the fabric and
 * the light copy at exactly the same physical edge; no video seeking or WebGL. */
export async function initHero() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const pin = hero.querySelector(".hero-pin");
  const copy = hero.querySelector("#hero-copy");
  const inverse = copy.cloneNode(true);
  inverse.classList.add("hero-content--inverse");
  inverse.setAttribute("aria-hidden", "true");
  inverse.removeAttribute("id");
  inverse
    .querySelectorAll("[id]")
    .forEach((element) => element.removeAttribute("id"));
  inverse.querySelectorAll("h1, a").forEach((element) => {
    const replacement = document.createElement(
      element.tagName === "H1" ? "div" : "span",
    );
    replacement.className = element.className;
    replacement.append(...element.childNodes);
    element.replaceWith(replacement);
  });
  copy.after(inverse);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const short = matchMedia("(max-height:620px)");
  const narrow = matchMedia("(max-width:700px)");
  let geometry;
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}hero/hero-geometry.json`,
    );
    if (!response.ok) throw new Error("Hero geometry unavailable");
    geometry = await response.json();
  } catch {
    // A readable static hero remains usable if an asset cannot load.
    hero.classList.add("is-reduced");
    return;
  }

  const ambience = initHeroLife({ hero, pin, motionQuery: reduce });
  let scheduled = false;
  function update() {
    scheduled = false;
    const staticHero = reduce.matches || short.matches;
    hero.classList.toggle("is-reduced", staticHero);
    const frame = geometry[narrow.matches ? "mobile" : "desktop"];
    const width = pin.clientWidth,
      height = pin.clientHeight;
    const scale = Math.max(width / frame.width, height / frame.height);
    const renderedHeight = frame.height * scale;
    const renderedWidth = frame.width * scale;
    const offset = (height - renderedHeight) / 2;
    const offsetX = (width - renderedWidth) / 2;
    const headerHeight = document.querySelector(".site-header").offsetHeight;
    const distance = Math.max(1, hero.offsetHeight - pin.offsetHeight);
    const progress = staticHero
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            (headerHeight - hero.getBoundingClientRect().top) / distance,
          ),
        );
    const railY =
      offset +
      renderedHeight *
        (frame.openRailCenter +
          (frame.closedRailCenter - frame.openRailCenter) * progress);
    hero.style.setProperty(
      "--edge",
      `${Math.max(0, Math.min(height, railY))}px`,
    );
    hero.style.setProperty("--rail-y", `${railY}px`);
    hero.style.setProperty("--rail-width", `${frame.width * scale}px`);
    hero.style.setProperty("--rail-height", `${frame.rail.height * scale}px`);
    hero.style.setProperty("--progress", progress.toFixed(4));
    hero.classList.toggle("has-progress", progress > 0.001 && progress < 0.999);
    ambience?.setViewport({
      width,
      height,
      aperture: {
        left: offsetX + renderedWidth * frame.apertureTopLeft[0],
        top: offset + renderedHeight * frame.apertureTopLeft[1],
        right: offsetX + renderedWidth * frame.apertureBottomRight[0],
        bottom: offset + renderedHeight * frame.apertureBottomRight[1],
      },
      edge: railY,
      railHeight: frame.rail.height * scale,
    });
  }
  const requestUpdate = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", requestUpdate, { passive: true });
  reduce.addEventListener("change", requestUpdate);
  short.addEventListener("change", requestUpdate);
  narrow.addEventListener("change", requestUpdate);
  new ResizeObserver(requestUpdate).observe(pin);
  document.fonts.ready.then(requestUpdate);
  update();
}
