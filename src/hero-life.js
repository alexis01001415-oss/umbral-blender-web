import "./hero-life.css";

const instances = new WeakMap();
const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Loose, asymmetrical groups; depth, speed and wing phases differ per bird.
// These are silhouettes drawn as bodies and curved wings, not icon glyphs.
const flocks = [
  {
    cycle: 34,
    duration: 18,
    offset: 4.2,
    direction: 1,
    altitude: 0.19,
    birds: [
      { lag: 0, y: 0, depth: 1, phase: 0.3 },
      { lag: 0.75, y: -0.043, depth: 0.83, phase: 2.1 },
      { lag: 1.55, y: 0.032, depth: 0.92, phase: 4.5 },
      { lag: 2.05, y: -0.012, depth: 0.74, phase: 1.2 },
      { lag: 2.9, y: 0.072, depth: 0.8, phase: 3.4 },
      { lag: 3.6, y: 0.015, depth: 0.68, phase: 5.1 },
    ],
  },
  {
    cycle: 47,
    duration: 16,
    offset: 25,
    direction: -1,
    altitude: 0.34,
    birds: [
      { lag: 0, y: 0, depth: 0.52, phase: 1.6 },
      { lag: 1.35, y: 0.03, depth: 0.45, phase: 3.8 },
      { lag: 2.55, y: -0.024, depth: 0.48, phase: 0.6 },
    ],
  },
];

function drawBird(context, { x, y, scale, direction, phase, depth }, time) {
  // Short flapping bursts alternate with a longer glide. Each bird has its own
  // rhythm; banking and small body movement prevent an identical V silhouette.
  const beatTime = time * (2.5 + depth * 1.2) + phase;
  const burst = (time + phase) % 3.9 < 2.1;
  const lift = burst
    ? Math.sin(beatTime * TAU)
    : 0.54 + Math.sin(time * 1.1 + phase) * 0.055;
  const bank = Math.sin(time * 0.72 + phase) * 0.12;
  context.save();
  context.translate(x, y);
  context.scale(scale * direction, scale);
  context.rotate(bank);
  context.fillStyle = `rgba(43, 48, 41, ${0.48 + depth * 0.2})`;

  // Far wing: narrower and foreshortened, behind the body.
  const farTip = -5.3 * lift - 0.9;
  context.beginPath();
  context.moveTo(0.75, -0.25);
  context.bezierCurveTo(1.35, farTip * 0.5, 0.7, farTip, -0.6, farTip - 0.3);
  context.bezierCurveTo(-0.25, farTip * 0.53, -1.35, -0.25, -1.2, 0.45);
  context.closePath();
  context.fill();

  // Tapered tail, streamlined body, head and short beak.
  context.beginPath();
  context.moveTo(-2.15, -0.4);
  context.lineTo(-5.3, -0.95);
  context.lineTo(-4.5, 0.02);
  context.lineTo(-5.25, 0.7);
  context.lineTo(-2, 0.6);
  context.closePath();
  context.fill();
  context.beginPath();
  context.ellipse(-0.3, 0.1, 2.95, 0.86, -0.06, 0, TAU);
  context.fill();
  context.beginPath();
  context.ellipse(2.6, -0.3, 0.87, 0.7, 0, 0, TAU);
  context.fill();
  context.beginPath();
  context.moveTo(3.12, -0.43);
  context.lineTo(4.22, -0.15);
  context.lineTo(3.12, 0.08);
  context.closePath();
  context.fill();

  // Near wing has a broad shoulder and a swept, pointed outer feather group.
  const nearTip = -8.8 * lift + 0.45;
  const sweep = -3.15 - (1 - Math.abs(lift)) * 1.35;
  context.beginPath();
  context.moveTo(0.7, -0.15);
  context.bezierCurveTo(
    -0.35,
    nearTip * 0.46,
    sweep + 1.3,
    nearTip * 0.87,
    sweep,
    nearTip,
  );
  context.lineTo(sweep + 0.9, nearTip * 0.66);
  context.bezierCurveTo(-1.05, nearTip * 0.25, -2, 0.65, -1.1, 0.72);
  context.closePath();
  context.fill();
  context.restore();
}

/**
 * initHeroLife({ hero, pin, motionQuery }) adds a decorative canvas and an
 * accessible pause control. Call setViewport() from the hero's existing cover
 * geometry calculation. All coordinates are CSS pixels relative to hero-pin:
 * { width, height, aperture:{left,top,right,bottom}, edge, railHeight }.
 * The aperture is the actual window opening; edge is the actual curtain rail.
 * No animation runs under reduced motion, behind a fully closed curtain, in a
 * hidden tab, or outside the viewport. destroy() removes all owned resources.
 */
export function initHeroLife({ hero, pin, motionQuery }) {
  if (!hero || !pin) return null;
  if (instances.has(pin)) return instances.get(pin);
  const art = pin.querySelector(".hero-art");
  const open = art?.querySelector(".hero-picture--open");
  if (!art || !open) return null;
  const canvas = document.createElement("canvas");
  canvas.className = "hero-life-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const context = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
  if (!context) return null;
  // DOM paint order: landscape → birds → daylight → curtain → bottom rail.
  // The window aperture clip also excludes every piece of frame and cassette.
  open.after(canvas);

  const control = document.createElement("button");
  control.type = "button";
  control.className = "hero-life-toggle";
  control.innerHTML =
    '<span class="material-symbols-outlined" aria-hidden="true">pause</span><span class="hero-life-toggle-label">Pausar ambientación</span>';
  pin.append(control);
  hero.classList.add("has-ambient-life");

  const icon = control.querySelector(".material-symbols-outlined");
  const label = control.querySelector(".hero-life-toggle-label");
  const reduce = motionQuery || matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  const { signal } = events;
  let paused = false;
  try {
    paused = sessionStorage.getItem("umbral-ambient-paused") === "true";
  } catch {
    /* Preferences are optional. */
  }
  let viewport = null;
  let inView = false;
  let raf = 0;
  let elapsed = 0;
  let lastTick = 0;
  let lastPaint = 0;
  let dpr = 1;
  let disposed = false;

  function syncControl() {
    const action = paused ? "Reanudar ambientación" : "Pausar ambientación";
    label.textContent = action;
    control.setAttribute("aria-label", action);
    icon.textContent = paused ? "play_arrow" : "pause";
    // There is no ambient motion to pause when this OS preference is active.
    control.hidden = reduce.matches;
  }

  function clear() {
    if (!viewport) return;
    context.clearRect(0, 0, viewport.width, viewport.height);
  }

  function draw() {
    if (!viewport) return;
    clear();
    const { aperture } = viewport;
    const width = aperture.right - aperture.left;
    const height = aperture.bottom - aperture.top;
    const screenScale = clamp(width / 1100, 0.76, 1.15);
    context.save();
    context.beginPath();
    context.rect(
      aperture.left,
      viewport.visibleTop,
      width,
      Math.max(0, aperture.bottom - viewport.visibleTop),
    );
    context.clip();
    for (const flock of flocks) {
      const cycleTime = (elapsed + flock.offset) % flock.cycle;
      for (const bird of flock.birds) {
        const flight = (cycleTime - bird.lag) / flock.duration;
        if (flight < 0 || flight > 1) continue;
        const course = -0.12 + flight * 1.24;
        const x =
          aperture.left + width * (flock.direction === 1 ? course : 1 - course);
        const undulation =
          Math.sin(flight * Math.PI * 1.6 + bird.phase * 0.1) * 0.04;
        const lift = Math.sin(elapsed * 0.8 + bird.phase) * 0.004;
        const y =
          aperture.top + height * (flock.altitude + bird.y + undulation + lift);
        drawBird(
          context,
          {
            x,
            y,
            scale: screenScale * (0.72 + bird.depth * 0.48),
            direction: flock.direction,
            phase: bird.phase,
            depth: bird.depth,
          },
          elapsed,
        );
      }
    }
    context.restore();
  }

  function allowed() {
    return (
      !disposed &&
      viewport &&
      viewport.uncovered &&
      inView &&
      !document.hidden &&
      !reduce.matches &&
      !paused
    );
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    lastTick = 0;
    lastPaint = 0;
  }

  function tick(timestamp) {
    raf = 0;
    if (!allowed()) return;
    if (lastTick) elapsed += Math.min(0.1, (timestamp - lastTick) / 1000);
    lastTick = timestamp;
    // Cap rendering to 30fps; geometry and masking still update with scroll.
    if (!lastPaint || timestamp - lastPaint >= 1000 / 30 - 1) {
      draw();
      lastPaint = timestamp;
    }
    raf = requestAnimationFrame(tick);
  }

  function syncRunning() {
    const state = reduce.matches
      ? "reduced"
      : paused
        ? "paused"
        : !inView || document.hidden
          ? "hidden"
          : !viewport?.uncovered
            ? "covered"
            : "running";
    canvas.dataset.lifeState = state;
    if (reduce.matches) clear();
    if (allowed()) {
      if (!raf) raf = requestAnimationFrame(tick);
    } else stop();
  }

  control.addEventListener(
    "click",
    () => {
      paused = !paused;
      try {
        sessionStorage.setItem("umbral-ambient-paused", String(paused));
      } catch {
        /* No storage required. */
      }
      syncControl();
      syncRunning();
    },
    { signal },
  );
  reduce.addEventListener(
    "change",
    () => {
      syncControl();
      syncRunning();
    },
    { signal },
  );
  document.addEventListener("visibilitychange", syncRunning, { signal });

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          ([entry]) => {
            inView = entry.isIntersecting && entry.intersectionRatio > 0.01;
            syncRunning();
          },
          { threshold: [0, 0.01] },
        )
      : null;
  observer?.observe(pin);

  const instance = {
    setViewport({ width, height, aperture, edge, railHeight }) {
      if (disposed || !width || !height) return;
      const nextDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const resized =
        !viewport ||
        width !== viewport.width ||
        height !== viewport.height ||
        nextDpr !== dpr;
      const left = clamp(aperture.left, 0, width);
      const right = clamp(aperture.right, left, width);
      const top = clamp(aperture.top, 0, height);
      const bottom = clamp(aperture.bottom, top, height);
      const visibleTop = clamp(
        Math.max(top, edge + railHeight / 2 + 1),
        top,
        bottom,
      );
      viewport = {
        width,
        height,
        aperture: { left, top, right, bottom },
        visibleTop,
        uncovered: bottom - visibleTop > 2 && right - left > 2,
      };
      if (resized) {
        dpr = nextDpr;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      canvas.style.clipPath = `inset(${visibleTop}px ${width - right}px ${height - bottom}px ${left}px)`;
      if (!observer) {
        const rect = pin.getBoundingClientRect();
        inView = rect.bottom > 0 && rect.top < window.innerHeight;
      }
      // A paused scene stays still while following changes in crop and size.
      if (!reduce.matches && (resized || paused)) draw();
      syncRunning();
    },
    destroy() {
      disposed = true;
      stop();
      events.abort();
      observer?.disconnect();
      canvas.remove();
      control.remove();
      hero.classList.remove("has-ambient-life");
      instances.delete(pin);
    },
  };
  instances.set(pin, instance);
  syncControl();
  syncRunning();
  return instance;
}
