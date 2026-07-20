/**
 * Shared UI: language + font switchers, i18n apply, sticky header
 */
(() => {
  const LANG_KEY = "polesh-lang";
  const FONT_KEY = "polesh-font";

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "ru";
  }

  function getFont() {
    return localStorage.getItem(FONT_KEY) || "classic";
  }

  function applyI18n(lang) {
    const dict = (window.POLESH_I18N && window.POLESH_I18N[lang]) || {};
    document.documentElement.lang = lang === "en" ? "en" : "ru";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (dict[key] != null) el.innerHTML = dict[key];
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (dict[key] != null) el.setAttribute("aria-label", dict[key]);
    });

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang-btn") === lang);
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang-btn") === lang ? "true" : "false");
    });
  }

  function loadFontStylesheet(href) {
    let link = document.getElementById("polesh-font-link");
    if (!link) {
      link = document.createElement("link");
      link.id = "polesh-font-link";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }

  function applyFont(fontId) {
    const pack = (window.POLESH_FONTS && window.POLESH_FONTS[fontId]) || window.POLESH_FONTS.classic;
    loadFontStylesheet(pack.href);
    document.documentElement.style.setProperty("--font-display", pack.display);
    document.documentElement.style.setProperty("--font-body", pack.body);
    document.documentElement.dataset.font = pack.id;

    document.querySelectorAll("[data-font-btn]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-font-btn") === pack.id);
      btn.setAttribute("aria-pressed", btn.getAttribute("data-font-btn") === pack.id ? "true" : "false");
    });
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    applyI18n(lang);
  }

  function setFont(fontId) {
    localStorage.setItem(FONT_KEY, fontId);
    applyFont(fontId);
  }

  // Init
  applyFont(getFont());
  applyI18n(getLang());

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang-btn")));
  });

  document.querySelectorAll("[data-font-btn]").forEach((btn) => {
    btn.addEventListener("click", () => setFont(btn.getAttribute("data-font-btn")));
  });

  const header = document.getElementById("site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Expose for project pages if needed
  window.PoleshUI = { setLang, setFont, applyI18n, getLang, getFont };
})();
