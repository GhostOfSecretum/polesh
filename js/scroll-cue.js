/**
 * Interactive scroll cues:
 * - animated mouse + label
 * - click / Enter scrolls one viewport step
 * - hides after user starts scrolling
 */
(() => {
  const cues = Array.from(document.querySelectorAll("[data-scroll-cue]"));
  if (!cues.length) return;

  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HIDE_AFTER = 48; // px scrolled

  function hideAll() {
    cues.forEach((cue) => cue.classList.add("is-hidden"));
  }

  function scrollStep(cue) {
    const targetSel = cue.getAttribute("data-scroll-target");
    const amount = Number(cue.getAttribute("data-scroll-amount")) || window.innerHeight * 0.85;

    if (targetSel) {
      const el = document.querySelector(targetSel);
      if (el) {
        el.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
        hideAll();
        return;
      }
    }

    window.scrollBy({
      top: amount,
      left: 0,
      behavior: REDUCE ? "auto" : "smooth",
    });
    hideAll();
  }

  cues.forEach((cue) => {
    cue.addEventListener("click", (e) => {
      e.preventDefault();
      scrollStep(cue);
    });
    cue.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        scrollStep(cue);
      }
    });
  });

  let hidden = false;
  const onScroll = () => {
    if (hidden) return;
    if ((window.scrollY || 0) > HIDE_AFTER) {
      hidden = true;
      hideAll();
      window.removeEventListener("scroll", onScroll);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
