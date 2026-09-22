/** Entry motion uses transforms only. No letters are split or read twice. */
export function initSectionMotion() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const running = new Set();
  const play = (element, keyframes, options) => {
    if (reduced.matches || !element) return;
    const animation = element.animate(keyframes, options);
    running.add(animation);
    animation.finished.then(
      () => running.delete(animation),
      () => running.delete(animation),
    );
  };
  const finishMotion = () => {
    running.forEach((animation) => animation.finish());
    running.clear();
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (reduced.matches) continue;
        if (entry.target.classList.contains("finishes-section")) {
          const section = entry.target;
          // Tab can bring the section into view before this observer runs.
          // Never animate an already focused control back to opacity zero.
          if (section.contains(document.activeElement)) continue;
          play(
            section.querySelector(".finishes-surface"),
            [
              { transform: "translateX(-102%)" },
              { transform: "translateX(0)" },
            ],
            { duration: 900, easing: "cubic-bezier(.2,.7,.15,1)" },
          );
          play(
            section.querySelector(".section-heading"),
            [
              { opacity: 0, transform: "translateY(24px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 680,
              delay: 140,
              fill: "backwards",
              easing: "cubic-bezier(.2,.7,.15,1)",
            },
          );
          section
            .querySelectorAll(".finish-palette button")
            .forEach((button, index) => {
              play(
                button,
                [
                  { opacity: 0, transform: "translateY(24px)" },
                  { opacity: 1, transform: "translateY(0)" },
                ],
                {
                  duration: 500,
                  delay: 250 + index * 90,
                  fill: "backwards",
                  easing: "ease-out",
                },
              );
              play(
                button.querySelector(".finish-chip"),
                [
                  { transform: "translateY(24px) scale(.9)", offset: 0 },
                  { transform: "translateY(-9px) scale(1.025)", offset: 0.52 },
                  { transform: "translateY(3px) scale(.995)", offset: 0.77 },
                  { transform: "translateY(0) scale(1)", offset: 1 },
                ],
                {
                  duration: 800,
                  delay: 250 + index * 90,
                  fill: "backwards",
                  easing: "ease-in-out",
                },
              );
            });
          continue;
        }
        play(
          entry.target,
          [
            { opacity: 0, transform: "translateY(24px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 680, easing: "cubic-bezier(.2,.7,.15,1)" },
        );
      }
    },
    { threshold: 0.22 },
  );
  document
    .querySelectorAll(
      ".section:not(.finishes-section):not(.rooms-section) h2, .finishes-section",
    )
    .forEach((element) => observer.observe(element));
  document
    .querySelector(".finishes-section")
    .addEventListener("focusin", finishMotion);
  reduced.addEventListener("change", (event) => {
    if (event.matches) finishMotion();
  });
  return {
    destroy() {
      observer.disconnect();
      finishMotion();
    },
  };
}
