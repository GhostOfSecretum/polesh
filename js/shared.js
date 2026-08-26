/**
 * Shared UI: language + font + theme switchers, i18n apply, sticky header
 */
(() => {
  const LANG_KEY = "polesh-lang";
  const FONT_KEY = "polesh-font";
  const THEME_KEY = "polesh-theme";
  const THEMES = ["garden", "night", "park", "stone"];

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "ru";
  }

  function getFont() {
    return localStorage.getItem(FONT_KEY) || "classic";
  }

  function getTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    return THEMES.includes(stored) ? stored : "night";
  }

  const THEME_MARKUP = `
    <div class="control-group control-group--themes" role="group" data-i18n-aria="ui.theme" aria-label="Стиль">
      <button type="button" data-theme-btn="garden">
        <span class="theme-swatch" style="--sw:#1d4ed8"></span>
        <span class="theme-label" data-i18n="ui.theme.garden">Сад</span>
      </button>
      <button type="button" data-theme-btn="night">
        <span class="theme-swatch" style="--sw:#d4b483"></span>
        <span class="theme-label" data-i18n="ui.theme.night">Ночь</span>
      </button>
      <button type="button" data-theme-btn="park">
        <span class="theme-swatch theme-swatch--split" style="--sw:#3b6fff;--sw2:#6faf4a"></span>
        <span class="theme-label" data-i18n="ui.theme.park">Парк</span>
      </button>
      <button type="button" data-theme-btn="stone">
        <span class="theme-swatch" style="--sw:#3f6f64"></span>
        <span class="theme-label" data-i18n="ui.theme.stone">Камень</span>
      </button>
    </div>
  `;

  function ensureThemeControls() {
    if (document.querySelector("[data-theme-btn]")) return;
    const controls = document.querySelector(".controls");
    if (!controls) return;
    controls.insertAdjacentHTML("beforeend", THEME_MARKUP);
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

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] != null) el.setAttribute("placeholder", dict[key]);
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (dict[key] != null) {
        el.textContent = dict[key];
        document.title = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-content]").forEach((el) => {
      const key = el.getAttribute("data-i18n-content");
      if (dict[key] != null) el.setAttribute("content", dict[key]);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      const key = el.getAttribute("data-i18n-alt");
      if (dict[key] != null) el.setAttribute("alt", dict[key]);
    });

    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute("content", lang === "en" ? "en_US" : "ru_RU");

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

  function applyTheme(themeId) {
    const id = THEMES.includes(themeId) ? themeId : "night";
    document.documentElement.dataset.theme = id;

    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      const on = btn.getAttribute("data-theme-btn") === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setTheme(themeId) {
    localStorage.setItem(THEME_KEY, themeId);
    applyTheme(themeId);
  }

  // Init
  ensureThemeControls();
  applyFont(getFont());
  applyTheme(getTheme());
  applyI18n(getLang());

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang-btn")));
  });

  document.querySelectorAll("[data-font-btn]").forEach((btn) => {
    btn.addEventListener("click", () => setFont(btn.getAttribute("data-font-btn")));
  });

  document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
    btn.addEventListener("click", () => setTheme(btn.getAttribute("data-theme-btn")));
  });

  const header = document.getElementById("site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const yearText = String(new Date().getFullYear());
  const year = document.getElementById("year");
  if (year) year.textContent = yearText;
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = yearText;
  });

  // Expose for project pages if needed
  window.PoleshUI = { setLang, setFont, setTheme, applyI18n, getLang, getFont, getTheme };
})();
