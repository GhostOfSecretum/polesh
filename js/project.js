/**
 * Project page:
 * - Background video plays smoothly (muted, loop) — no frame scrubbing
 * - Scroll drives parallax + short project info reveals
 */
(() => {
  const stage = document.querySelector("[data-project-stage]");
  const video = document.querySelector("[data-scrub-video], [data-bg-video]");
  const track = document.querySelector("[data-project-track]");
  const panels = Array.from(document.querySelectorAll("[data-reveal]"));
  const progressBar = document.querySelector("[data-scroll-progress]");

  if (!stage || !video || !track) return;

  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  video.setAttribute("loop", "");
  // Helps browser decode smoothly
  video.preload = "auto";

  let canPlay = false;
  const onCanPlay = () => {
    canPlay = true;
    ensurePlaying();
  };
  video.addEventListener("canplay", onCanPlay, { once: true });
  video.addEventListener("loadeddata", onCanPlay, { once: true });

  function ensurePlaying() {
    if (REDUCE) {
      video.pause();
      return;
    }
    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // Autoplay blocked until gesture — retry on first scroll/touch
      });
    }
  }

  function clamp(n, a, b) {
    return Math.min(b, Math.max(a, n));
  }

  function getProgress() {
    const rect = track.getBoundingClientRect();
    const total = track.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-rect.top / total, 0, 1);
  }

  /** Smooth lerp for parallax (less jitter than raw scroll) */
  let smoothProgress = 0;

  function parallax(progress) {
    if (REDUCE) {
      stage.style.transform = "none";
      return;
    }
    const y = (progress - 0.5) * 56;
    const scale = 1.08 + progress * 0.05;
    stage.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
  }

  function revealPanels(progress) {
    panels.forEach((panel) => {
      const start = Number(panel.dataset.revealStart || 0.15);
      const end = Number(panel.dataset.revealEnd || 0.9);
      const local = clamp((progress - start) / Math.max(0.001, end - start), 0, 1);
      const opacity =
        local < 0.12 ? local / 0.12 : local > 0.88 ? (1 - local) / 0.12 : 1;
      const ty = (1 - Math.min(1, local * 1.35)) * 32;
      panel.style.opacity = String(clamp(opacity, 0, 1));
      panel.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
      panel.classList.toggle("is-active", opacity > 0.35);
    });
  }

  let rafId = 0;
  let scrolling = false;

  function frame() {
    const target = getProgress();
    // Ease progress for softer parallax / text
    smoothProgress += (target - smoothProgress) * 0.12;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${smoothProgress})`;
    }

    parallax(smoothProgress);
    revealPanels(smoothProgress);

    // Keep video playing while on the page
    if (!REDUCE && canPlay && video.paused) {
      ensurePlaying();
    }

    const stillCatching = Math.abs(target - smoothProgress) > 0.001;
    if (scrolling || stillCatching) {
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = 0;
    }
    scrolling = false;
  }

  function kick() {
    scrolling = true;
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  const unlockPlay = () => {
    ensurePlaying();
    window.removeEventListener("scroll", unlockPlay);
    window.removeEventListener("touchstart", unlockPlay);
    window.removeEventListener("pointerdown", unlockPlay);
  };

  window.addEventListener("scroll", () => {
    unlockPlay();
    kick();
  }, { passive: true });
  window.addEventListener("resize", kick, { passive: true });
  window.addEventListener("touchstart", unlockPlay, { passive: true });
  window.addEventListener("pointerdown", unlockPlay, { passive: true });
  window.addEventListener("load", () => {
    ensurePlaying();
    kick();
  });

  // Start
  ensurePlaying();
  kick();
})();
