/**
 * Home page: reveal-on-scroll for project cards
 */
(() => {
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
