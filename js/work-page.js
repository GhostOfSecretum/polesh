/**
 * Photo project page: hero, rooms, stills, lightbox.
 */
(() => {
  const workId = document.body.getAttribute("data-work");
  if (!workId) return;

  const works = window.POLESH_WORKS || [];
  const work = works.find((item) => item.id === workId);
  if (!work) return;

  const PREFIX = "../";
  const images = work.images || [];
  const box = document.querySelector("[data-lightbox]");
  const imgEl = document.querySelector("[data-lightbox-img]");
  let lightboxIndex = 0;
  let lightboxBound = false;

  function lang() {
    return (window.PoleshUI && PoleshUI.getLang()) || "ru";
  }

  function field(obj, key) {
    const suffix = lang() === "en" ? "en" : "ru";
    return obj[`${key}_${suffix}`] || "";
  }

  function src(path) {
    return PREFIX + path;
  }

  function stillClass(index, total) {
    if (total === 1) return "still still--wide";
    if (index % 5 === 0) return "still still--wide";
    if (index % 5 === 1 || index % 5 === 2) return "still still--tall";
    if (index % 5 === 3) return "still still--wide";
    return "still still--offset";
  }

  function figureHTML(image, index, total, galleryIndex) {
    return `
      <figure class="${stillClass(index, total)}" data-still>
        <button type="button" class="still__frame" data-still-media data-lightbox-open="${galleryIndex}">
          <img src="${src(image.src)}" alt="" loading="lazy" />
        </button>
      </figure>
    `;
  }

  function openLightbox(i) {
    if (!box || !imgEl || !images.length) return;
    lightboxIndex = (i + images.length) % images.length;
    imgEl.src = src(images[lightboxIndex].src);
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!box || !imgEl) return;
    box.hidden = true;
    imgEl.removeAttribute("src");
    document.body.style.overflow = "";
  }

  function bindLightbox() {
    if (lightboxBound || !box || !imgEl) return;
    lightboxBound = true;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lightbox-open]");
      if (!btn) return;
      openLightbox(Number(btn.getAttribute("data-lightbox-open")));
    });

    const closer = document.querySelector("[data-lightbox-close]");
    const prev = document.querySelector("[data-lightbox-prev]");
    const next = document.querySelector("[data-lightbox-next]");
    if (closer) closer.addEventListener("click", closeLightbox);
    if (prev) prev.addEventListener("click", () => openLightbox(lightboxIndex - 1));
    if (next) next.addEventListener("click", () => openLightbox(lightboxIndex + 1));
    box.addEventListener("click", (e) => {
      if (e.target === box) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (box.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") openLightbox(lightboxIndex - 1);
      if (e.key === "ArrowRight") openLightbox(lightboxIndex + 1);
    });
  }

  function bindStills() {
    const stills = Array.from(document.querySelectorAll("[data-still]"));
    if (!("IntersectionObserver" in window)) {
      stills.forEach((s) => s.classList.add("is-in"));
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
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );
    stills.forEach((s) => io.observe(s));
  }

  function render() {
    const title = field(work, "title");
    const card = field(work, "card");
    document.title = `${title} — ${lang() === "en" ? "Sergey Poleshchuk" : "Сергей Полещук"}`;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", card);

    const hero = document.querySelector("[data-work-hero]");
    if (hero) {
      hero.innerHTML = `<img src="${src(work.cover)}" alt="${title}" />`;
    }

    const intro = document.querySelector("[data-work-intro]");
    if (intro) {
      intro.innerHTML = `
        <div>
          <p class="work-intro__tag">${field(work, "tag")}</p>
          <p class="work-intro__place">${field(work, "place")}</p>
        </div>
        <div>
          <h1 class="work-intro__title">${title}</h1>
          <p class="work-intro__text">${card}</p>
        </div>
      `;
    }

    const roomsNav = document.querySelector("[data-work-rooms]");
    const gallery = document.querySelector("[data-work-gallery]");
    if (!gallery) return;

    const rooms = work.rooms || [];
    let galleryIndex = 0;

    if (rooms.length && roomsNav) {
      roomsNav.hidden = false;
      roomsNav.innerHTML = rooms
        .map((room) => `<a href="#room-${room.id}">${field(room, "title")}</a>`)
        .join("");
    } else if (roomsNav) {
      roomsNav.hidden = true;
      roomsNav.innerHTML = "";
    }

    if (rooms.length) {
      gallery.innerHTML = rooms
        .map((room) => {
          const roomImages = images.filter((img) => img.room === room.id);
          const figures = roomImages
            .map((img, i) => {
              const html = figureHTML(img, i, roomImages.length, galleryIndex);
              galleryIndex += 1;
              return html;
            })
            .join("");
          return `
            <div class="work-room" id="room-${room.id}">
              <h2 class="work-room__title">${field(room, "title")}</h2>
              <div class="project-stills__grid">${figures}</div>
            </div>
          `;
        })
        .join("");
    } else {
      gallery.innerHTML = `
        <div class="project-stills__head">
          <p class="project-stills__label" data-i18n="project.stills.label">Кадры проекта</p>
        </div>
        <div class="project-stills__grid">
          ${images.map((img, i) => figureHTML(img, i, images.length, i)).join("")}
        </div>
      `;
      if (window.PoleshUI) PoleshUI.applyI18n(lang());
    }

    bindStills();
  }

  bindLightbox();
  render();

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => requestAnimationFrame(render));
  });
})();
