/**
 * Home parallax variant (index-parallax.html only)
 * - Hero photo / copy move at different speeds
 * - Project images parallax inside clipped frames
 * - Soft depth on section titles & about
 * Respects prefers-reduced-motion
 */
(() => {
  const root = document.body;
  if (!root.classList.contains("home-parallax")) return;

  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Card reveal (same as main.js) ---- */
  const cards = document.querySelectorAll("[data-card-reveal]");
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
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    cards.forEach((c) => io.observe(c));
  } else {
    cards.forEach((c) => c.classList.add("is-in"));
  }

  if (REDUCE) return;

  const hero = document.querySelector("[data-parallax-hero]");
  const heroMedia = document.querySelector("[data-parallax-hero-media]");
  const heroImg = heroMedia ? heroMedia.querySelector("img") : null;
  const heroCopy = document.querySelector("[data-parallax-hero-copy]");
  const sectionHead = document.querySelector("[data-parallax-section]");
  const aboutText = document.querySelector("[data-parallax-about]");
  const mediaFrames = Array.from(document.querySelectorAll("[data-parallax-media]"));
  const cardBodies = Array.from(document.querySelectorAll("[data-parallax-body]"));

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /** 0–1 progress of element through viewport */
  function viewProgress(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const center = rect.top + rect.height * 0.5;
    return clamp(1 - center / vh, -0.5, 1.5);
  }

  let smoothY = 0;
  let raf = 0;
  let needsFrame = false;

  function paint() {
    raf = 0;
    needsFrame = false;

    const y = window.scrollY || window.pageYOffset;
    smoothY += (y - smoothY) * 0.14;

    // Hero: image slower, copy slightly forward
    if (hero && heroImg) {
      const rect = hero.getBoundingClientRect();
      const local = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
      const imgY = local * 70 + (smoothY - y) * 0.02;
      heroImg.style.transform = `translate3d(0, ${imgY.toFixed(2)}px, 0) scale(1.1)`;
      if (heroCopy) {
        const copyY = local * -28;
        const fade = clamp(1 - local * 1.15, 0.35, 1);
        heroCopy.style.transform = `translate3d(0, ${copyY.toFixed(2)}px, 0)`;
        heroCopy.style.opacity = String(fade);
      }
    }

    // Project images
    mediaFrames.forEach((frame) => {
      const img = frame.querySelector("img");
      if (!img) return;
      const p = viewProgress(frame);
      const py = (p - 0.35) * -42;
      frame.style.setProperty("--py", `${py.toFixed(2)}px`);
      const hover = frame.closest(".project-card:hover");
      const scale = hover ? 1.08 : 1.06;
      img.style.transform = `translate3d(0, ${py.toFixed(2)}px, 0) scale(${scale})`;
    });

    // Card text slight counter-parallax
    cardBodies.forEach((body) => {
      const p = viewProgress(body);
      const ty = (p - 0.4) * 18;
      body.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
    });

    if (sectionHead) {
      const p = viewProgress(sectionHead);
      const ty = (p - 0.2) * 24;
      sectionHead.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
      sectionHead.style.opacity = String(clamp(0.55 + p * 0.6, 0.55, 1));
    }

    if (aboutText) {
      const p = viewProgress(aboutText);
      const ty = (p - 0.35) * 36;
      aboutText.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
      aboutText.style.opacity = String(clamp(0.4 + p * 0.9, 0.4, 1));
    }

    if (Math.abs(y - smoothY) > 0.2) {
      needsFrame = true;
      raf = requestAnimationFrame(paint);
    }
  }

  function requestPaint() {
    needsFrame = true;
    if (!raf) raf = requestAnimationFrame(paint);
  }

  window.addEventListener("scroll", requestPaint, { passive: true });
  window.addEventListener("resize", requestPaint, { passive: true });
  requestPaint();
})();
