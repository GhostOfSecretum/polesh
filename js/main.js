/**
 * polesh.pro — scroll-scrub project videos
 *
 * Desktop / tablet:
 *   IntersectionObserver tracks which project is in view.
 *   Scroll progress within the tall section maps to video.currentTime.
 *   Near the end of the scrub (≈85%+), project title/description fade in.
 *   Light parallax: video wrap moves slower than scroll.
 *
 * Mobile (≤768px):
 *   Simplified mode — when section enters viewport, video plays normally
 *   (still muted + playsinline). Overlay appears near the end of playback
 *   or when scrub progress is high if scrub still works.
 *
 * Replace video/photo paths in index.html comments — no JS path changes needed.
 */

(() => {
  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOBILE_MQ = window.matchMedia("(max-width: 768px)");

  const header = document.getElementById("site-header");
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Sticky header state ---------- */
  const onHeaderScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onHeaderScroll();
  window.addEventListener("scroll", onHeaderScroll, { passive: true });

  /* ---------- Project scrub setup ---------- */
  const sections = Array.from(document.querySelectorAll("[data-project]"));

  /** @type {{ section: HTMLElement, video: HTMLVideoElement, overlay: HTMLElement, wrap: HTMLElement, ready: boolean }[]} */
  const projects = sections.map((section) => {
    const video = section.querySelector("[data-scrub-video]");
    const overlay = section.querySelector("[data-project-overlay]");
    const wrap = section.querySelector("[data-parallax]");
    return {
      section,
      video,
      overlay,
      wrap,
      ready: false,
      active: false,
    };
  }).filter((p) => p.video && p.overlay);

  /** Mark video ready when metadata (duration) is available */
  projects.forEach((p) => {
    const markReady = () => {
      p.ready = Number.isFinite(p.video.duration) && p.video.duration > 0;
    };
    if (p.video.readyState >= 1) markReady();
    p.video.addEventListener("loadedmetadata", markReady);
    // Ensure muted for autoplay policies
    p.video.muted = true;
    p.video.playsInline = true;
    p.video.setAttribute("playsinline", "");
    p.video.setAttribute("muted", "");
  });

  /**
   * Progress 0→1 while sticky frame is pinned through the section.
   * Uses section top / (section height − viewport).
   */
  function getProgress(section) {
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    const scrolled = -rect.top;
    return clamp(scrolled / total, 0, 1);
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /** Overlay appears in the last portion of the scrub */
  const OVERLAY_START = 0.82;

  function updateOverlay(p, progress) {
    const show = progress >= OVERLAY_START;
    p.overlay.classList.toggle("is-visible", show);
  }

  function scrubVideo(p, progress) {
    if (!p.ready) return;
    const duration = p.video.duration;
    // Leave a tiny epsilon so we don't fight ended-state glitches
    const t = progress * Math.max(0, duration - 0.05);
    // Avoid excessive seeks when value barely changes
    if (Math.abs(p.video.currentTime - t) > 0.04) {
      try {
        p.video.currentTime = t;
      } catch (_) {
        /* ignore seek abort while loading */
      }
    }
    // Keep paused — we drive time via scroll only
    if (!p.video.paused) p.video.pause();
  }

  function applyParallax(p, progress) {
    if (!p.wrap || REDUCE_MOTION) return;
    // Video moves slightly slower → subtle depth vs text overlay
    const offset = (progress - 0.5) * 36; // px
    p.wrap.style.transform = `translate3d(0, ${offset}px, 0)`;
  }

  /* ---------- Mobile autoplay fallback ---------- */
  let mobileMode = MOBILE_MQ.matches;

  function onMobileChange() {
    mobileMode = MOBILE_MQ.matches;
    // Pause all when switching modes
    projects.forEach((p) => {
      p.video.pause();
      if (!mobileMode) {
        p.video.removeAttribute("data-mobile-playing");
      }
    });
    tick();
  }
  MOBILE_MQ.addEventListener?.("change", onMobileChange);

  /**
   * Mobile: play muted when mostly in view; show overlay near end of clip.
   */
  function updateMobile(p, ratio) {
    if (ratio > 0.55) {
      if (p.video.paused) {
        p.video.play().catch(() => {});
      }
      p.video.dataset.mobilePlaying = "1";
    } else if (ratio < 0.2) {
      p.video.pause();
      delete p.video.dataset.mobilePlaying;
    }

    // Overlay when clip is near the end (or section almost finished scrolling)
    const nearEnd =
      p.ready && p.video.duration > 0
        ? p.video.currentTime / p.video.duration >= 0.85
        : false;
    const progress = getProgress(p.section);
    updateOverlay(p, nearEnd || progress >= OVERLAY_START ? 1 : progress);

    // Soft parallax still ok on mobile
    applyParallax(p, progress);
  }

  /* Listen for timeupdate on mobile to reveal overlay at clip end */
  projects.forEach((p) => {
    p.video.addEventListener("timeupdate", () => {
      if (!mobileMode || !p.active) return;
      if (!p.ready || p.video.duration <= 0) return;
      const r = p.video.currentTime / p.video.duration;
      if (r >= 0.85) p.overlay.classList.add("is-visible");
    });
    p.video.addEventListener("ended", () => {
      if (mobileMode) {
        p.overlay.classList.add("is-visible");
        // Hold last frame
        p.video.pause();
      }
    });
  });

  /* ---------- Intersection Observer: which projects are active ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const p = projects.find((x) => x.section === entry.target);
        if (!p) return;
        p.active = entry.isIntersecting;
        p.ratio = entry.intersectionRatio;
        if (!entry.isIntersecting && mobileMode) {
          p.video.pause();
        }
      });
      // Kick a frame when visibility changes
      tick();
    },
    {
      threshold: buildThresholds(),
      rootMargin: "0px",
    }
  );

  function buildThresholds() {
    const t = [];
    for (let i = 0; i <= 20; i++) t.push(i / 20);
    return t;
  }

  projects.forEach((p) => io.observe(p.section));

  /* ---------- rAF scroll loop ---------- */
  let ticking = false;

  function tick() {
    ticking = false;

    if (REDUCE_MOTION) {
      // Accessibility: show overlays, freeze mid-frame
      projects.forEach((p) => {
        if (!p.active) return;
        if (p.ready && p.video.duration) {
          p.video.currentTime = p.video.duration * 0.5;
          p.video.pause();
        }
        p.overlay.classList.add("is-visible");
      });
      return;
    }

    projects.forEach((p) => {
      if (!p.active) return;
      const progress = getProgress(p.section);

      if (mobileMode) {
        updateMobile(p, p.ratio ?? 0);
        // Also allow light scrub if user scrolls through tall section
        if (p.ready && p.video.dataset.mobilePlaying !== "1") {
          scrubVideo(p, progress);
        }
        return;
      }

      scrubVideo(p, progress);
      updateOverlay(p, progress);
      applyParallax(p, easeOutCubic(progress));
    });
  }

  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });

  // Initial pass after videos may load
  requestTick();
  window.addEventListener("load", requestTick);
})();
