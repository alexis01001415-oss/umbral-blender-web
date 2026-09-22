import "./text-reveal.css";

const selector = ".section h2, #contact-title";
const instances = new WeakMap();
const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const fontProperties = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontStretch",
  "fontKerning",
  "fontFeatureSettings",
  "fontVariationSettings",
  "fontVariantLigatures",
  "fontOpticalSizing",
  "fontSizeAdjust",
  "fontSynthesis",
  "letterSpacing",
  "textTransform",
  "color",
];

/**
 * Reveals each static heading once. Original text, em/br elements and natural
 * line wrapping never change; temporary glyphs are hidden from assistive tech.
 */
export function initTextReveal(root = document) {
  if (instances.has(root)) return instances.get(root);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const { signal } = controller;
  const active = new Map();
  const headings = [...root.querySelectorAll(selector)].filter(
    (heading) =>
      !heading.closest("#room-panel, dialog, [aria-hidden='true']") &&
      !heading.querySelector("a, button, input, [tabindex]"),
  );
  const segmenter =
    typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter("es", { granularity: "grapheme" })
      : null;
  let disposed = false;

  function finish(heading) {
    const state = active.get(heading);
    if (!state) return;
    active.delete(heading);
    // Show the untouched source before removing its decorative copy.
    heading.classList.remove("text-reveal-active");
    state.animations.forEach((animation) => animation.cancel());
    state.overlay.remove();
  }

  function finishAll() {
    [...active.keys()].forEach(finish);
  }

  function graphemes(text) {
    if (segmenter) return [...segmenter.segment(text)];
    let index = 0;
    return Array.from(text, (segment) => {
      const item = { segment, index };
      index += segment.length;
      return item;
    });
  }

  function collectGlyphs(heading) {
    const bounds = heading.getBoundingClientRect();
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const glyphs = [];
    let elapsed = 0;
    let previousBottom = null;
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest("[aria-hidden='true']")) continue;
      const style = getComputedStyle(node.parentElement);
      const font = Object.fromEntries(
        fontProperties.map((property) => [property, style[property]]),
      );
      for (const { segment, index } of graphemes(node.data)) {
        range.setStart(node, index);
        range.setEnd(node, index + segment.length);
        const rect = range.getBoundingClientRect();
        // HTML indentation and collapsed whitespace have no visible glyph.
        if (/\s/u.test(segment)) {
          if (rect.width > 0) elapsed += 0.3;
          continue;
        }
        if (!rect.width || !rect.height) continue;
        if (previousBottom !== null && rect.top > previousBottom - 2)
          elapsed += 1.5;
        glyphs.push({
          segment,
          font,
          left: rect.left - bounds.left - heading.clientLeft,
          top: rect.top - bounds.top - heading.clientTop,
          width: rect.width,
          height: rect.height,
          delay: elapsed,
        });
        previousBottom = rect.bottom;
        elapsed += /[.,;:!?]/u.test(segment) ? 1.75 : 1;
      }
    }
    return { glyphs, weight: elapsed };
  }

  async function reveal(heading) {
    // Measure with the final font so a font swap cannot displace the overlay.
    if (document.fonts?.ready) await document.fonts.ready;
    const section = heading.closest("section, footer") ?? heading;
    const bounds = heading.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportLeft = viewport?.offsetLeft ?? 0;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const viewportWidth = viewport?.width ?? window.innerWidth;
    const selection = document.getSelection();
    if (
      disposed ||
      reduced.matches ||
      !heading.isConnected ||
      document.visibilityState === "hidden" ||
      section.contains(document.activeElement) ||
      !bounds.width ||
      !bounds.height ||
      getComputedStyle(heading).visibility !== "visible" ||
      bounds.bottom <= viewportTop ||
      bounds.top >= viewportTop + viewportHeight ||
      bounds.right <= viewportLeft ||
      bounds.left >= viewportLeft + viewportWidth ||
      (selection &&
        !selection.isCollapsed &&
        selection.containsNode(heading, true)) ||
      !heading.animate
    )
      return;

    const { glyphs, weight } = collectGlyphs(heading);
    if (!glyphs.length || glyphs.length > 120) return;
    const overlay = document.createElement("span");
    overlay.className = "text-reveal-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.inert = true;
    const duration = clamp(1200 + glyphs.length * 23, 1400, 2200);
    const appearance = 360;
    const timeline = (duration - appearance) / Math.max(1, weight);
    const animations = [];
    const state = { overlay, animations };
    const fragment = document.createDocumentFragment();
    for (const glyph of glyphs) {
      const element = document.createElement("span");
      element.className = "text-reveal-glyph";
      element.textContent = glyph.segment;
      Object.assign(element.style, glyph.font, {
        left: `${glyph.left}px`,
        top: `${glyph.top}px`,
        width: `${glyph.width}px`,
        height: `${glyph.height}px`,
        // Range supplies the font's inline box, without the source line's
        // extra leading. The same-height line box preserves that baseline.
        lineHeight: `${glyph.height}px`,
      });
      fragment.append(element);
      const animation = element.animate(
        [
          { opacity: 0, transform: "translateY(.12em)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: appearance,
          delay: glyph.delay * timeline,
          easing: "cubic-bezier(.16,.65,.28,1)",
          fill: "both",
        },
      );
      animations.push(animation);
    }
    overlay.append(fragment);
    heading.append(overlay);
    active.set(heading, state);
    heading.classList.add("text-reveal-active");
    Promise.all(animations.map((animation) => animation.finished)).then(
      () => finish(heading),
      () => finish(heading),
    );
  }

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              observer.unobserve(entry.target);
              if (!reduced.matches)
                reveal(entry.target).catch(() => finish(entry.target));
            }
          },
          { threshold: 0.45, rootMargin: "0px 0px -6% 0px" },
        )
      : null;
  headings.forEach((heading) => observer?.observe(heading));

  root.addEventListener(
    "focusin",
    (event) => {
      for (const heading of active.keys()) {
        const section = heading.closest("section, footer") ?? heading;
        if (section.contains(event.target)) finish(heading);
      }
    },
    { signal },
  );
  root.addEventListener("selectstart", finishAll, { signal });
  window.addEventListener("resize", finishAll, { passive: true, signal });
  window.visualViewport?.addEventListener("resize", finishAll, {
    passive: true,
    signal,
  });
  reduced.addEventListener(
    "change",
    (event) => {
      if (event.matches) finishAll();
    },
    { signal },
  );

  const instance = {
    destroy() {
      disposed = true;
      observer?.disconnect();
      controller.abort();
      finishAll();
      instances.delete(root);
    },
  };
  instances.set(root, instance);
  return instance;
}
