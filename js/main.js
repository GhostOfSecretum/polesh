/**
 * Home page: portrait picker + reveal-on-scroll for project cards
 */
(() => {
  const PORTRAIT_KEY = "polesh-portrait";
  const PORTRAITS = {
    lobby: { src: "images/portrait-lobby-no-watch.png", pos: "center 20%" },
    "garden-1": { src: "images/portrait-garden-01.png", pos: "center 18%" },
    "garden-2": { src: "images/portrait-garden-02.png", pos: "center 22%" },
    "garden-3": { src: "images/portrait-garden-03.png", pos: "center 16%" }
  };

  const heroImg = document.querySelector("[data-hero-portrait]");
  const heroMedia = document.querySelector(".hero__media");

  function getPortrait() {
    const stored = localStorage.getItem(PORTRAIT_KEY);
    return PORTRAITS[stored] ? stored : "lobby";
  }

  function applyPortrait(id, animate) {
    const pack = PORTRAITS[id] || PORTRAITS.lobby;
    if (heroMedia) heroMedia.style.setProperty("--portrait-pos", pack.pos);
    if (heroImg && heroImg.getAttribute("src") !== pack.src) {
      if (animate) {
        heroImg.classList.add("is-swapping");
        window.setTimeout(() => {
          heroImg.setAttribute("src", pack.src);
          heroImg.classList.remove("is-swapping");
          heroImg.style.animation = "none";
          void heroImg.offsetWidth;
          heroImg.style.animation = "";
        }, 160);
      } else {
        heroImg.setAttribute("src", pack.src);
      }
    }
    document.querySelectorAll("[data-portrait-btn]").forEach((btn) => {
      const on = btn.getAttribute("data-portrait-btn") === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  if (heroImg) {
    applyPortrait(getPortrait(), false);
    document.querySelectorAll("[data-portrait-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-portrait-btn");
        localStorage.setItem(PORTRAIT_KEY, id);
        applyPortrait(id, true);
      });
    });
  }

  const cards = document.querySelectorAll("[data-card-reveal]");
  if (!cards.length || !("IntersectionObserver" in window)) {
    cards.forEach((c) => c.classList.add("is-in"));
    return;
  }

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
})();
