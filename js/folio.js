/**
 * Projects catalog: two types, cards from POLESH_WORKS.
 */
(() => {
  const works = window.POLESH_WORKS || [];
  const residentialMount = document.querySelector("[data-folio='residential']");
  const commercialMount = document.querySelector("[data-folio='commercial']");
  if (!residentialMount || !commercialMount) return;

  const residentialGate = document.querySelector("[data-folio-gate='residential']");
  const commercialGate = document.querySelector("[data-folio-gate='commercial']");
  const residentialCount = document.querySelector("[data-folio-count='residential']");
  const commercialCount = document.querySelector("[data-folio-count='commercial']");

  function lang() {
    return (window.PoleshUI && PoleshUI.getLang()) || "ru";
  }

  function field(work, key) {
    const suffix = lang() === "en" ? "en" : "ru";
    return work[`${key}_${suffix}`] || "";
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function cardHTML(work, index) {
    return `
      <a class="folio-card" href="${work.page}" data-card-reveal>
        <span class="folio-card__media">
          <img src="${work.cover}" alt="" loading="lazy" />
        </span>
        <span class="folio-card__meta">
          <span class="folio-card__index">${pad(index)}</span>
          <span class="folio-card__tag">${field(work, "tag")}</span>
          <span class="folio-card__title">${field(work, "title")}</span>
          <span class="folio-card__place">${field(work, "place")}</span>
        </span>
      </a>
    `;
  }

  function revealCards(scope) {
    const cards = scope.querySelectorAll("[data-card-reveal]");
    if (!("IntersectionObserver" in window)) {
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
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    cards.forEach((c) => io.observe(c));
  }

  let firstPaint = true;

  function render() {
    const residential = works.filter((w) => w.type === "residential");
    const commercial = works.filter((w) => w.type === "commercial");

    residentialMount.innerHTML = residential.map((w, i) => cardHTML(w, i + 1)).join("");
    commercialMount.innerHTML = commercial.map((w, i) => cardHTML(w, i + 1)).join("");

    if (residentialCount) residentialCount.textContent = pad(residential.length);
    if (commercialCount) commercialCount.textContent = pad(commercial.length);

    if (residentialGate && residential[0]) {
      const img = residentialGate.querySelector("img");
      if (img) img.src = residential[0].cover;
    }
    if (commercialGate && commercial[0]) {
      const img = commercialGate.querySelector("img");
      if (img) img.src = commercial[0].cover;
    }

    if (firstPaint) {
      revealCards(residentialMount);
      revealCards(commercialMount);
      firstPaint = false;
      return;
    }

    residentialMount.querySelectorAll("[data-card-reveal]").forEach((c) => c.classList.add("is-in"));
    commercialMount.querySelectorAll("[data-card-reveal]").forEach((c) => c.classList.add("is-in"));
  }

  render();

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      requestAnimationFrame(render);
    });
  });
})();
