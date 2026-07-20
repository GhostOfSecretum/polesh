/**
 * Project stills gallery:
 * - reveal on scroll
 * - subtle image parallax inside clipped frames
 */
(() => {
  const section = document.querySelector("[data-project-stills]");
  if (!section) return;

  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stills = Array.from(section.querySelectorAll("[data-still]"));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );
    stills.forEach((s) => io.observe(s));
  } else {
    stills.forEach((s) => s.classList.add("is-in"));
  }

  if (REDUCE) return;

  const frames = Array.from(section.querySelectorAll("[data-still-media]"));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  function paint() {
    const vh = window.innerHeight || 1;
    frames.forEach((frame) => {
      const img = frame.querySelector("img");
      if (!img) return;
      const rect = frame.getBoundingClientRect();
      const center = rect.top + rect.height * 0.5;
      const p = clamp(1 - center / vh, -0.4, 1.2);
      const y = (p - 0.35) * -36;
      img.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(1.08)`;
    });
  }

  let raf = 0;
  const kick = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      paint();
    });
  };

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick, { passive: true });
  kick();
})();
