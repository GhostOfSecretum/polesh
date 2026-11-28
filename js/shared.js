/**
 * Shared UI: language + theme switchers, i18n apply, sticky header
 */
(() => {
  const LANG_KEY = "polesh-lang";
  const THEME_KEY = "polesh-theme";
  const THEMES = ["stone", "night"];
  const DEFAULT_THEME = "stone";

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "ru";
  }

  function getTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    return THEMES.includes(stored) ? stored : DEFAULT_THEME;
  }

  const THEME_MARKUP = `
    <div class="control-group control-group--themes" role="group" data-i18n-aria="ui.theme" aria-label="Стиль">
      <button type="button" data-theme-btn="stone">
        <span class="theme-swatch" style="--sw:#3f6f64"></span>
        <span class="theme-label" data-i18n="ui.theme.stone">Камень</span>
      </button>
      <button type="button" data-theme-btn="night">
        <span class="theme-swatch" style="--sw:#d4b483"></span>
        <span class="theme-label" data-i18n="ui.theme.night">Ночь</span>
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

  function applyFont() {
    const pack = window.POLESH_FONTS && window.POLESH_FONTS.classic;
    if (!pack) return;
    loadFontStylesheet(pack.href);
    document.documentElement.style.setProperty("--font-display", pack.display);
    document.documentElement.style.setProperty("--font-body", pack.body);
    document.documentElement.dataset.font = pack.id;
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    applyI18n(lang);
    if (window.PoleshLive) window.PoleshLive.labelClips();
  }

  function applyTheme(themeId) {
    const id = THEMES.includes(themeId) ? themeId : DEFAULT_THEME;
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

  const LIVE_CLIPS = [
    { file: "videos/live/01.mp4", poster: "images/live/01.jpg", ru: "01", en: "01" },
    { file: "videos/live/02.mp4", poster: "images/live/02.jpg", ru: "02", en: "02" },
    { file: "videos/live/03.mp4", poster: "images/live/03.jpg", ru: "03", en: "03" },
    { file: "videos/live/04.mp4", poster: "images/live/04.jpg", ru: "04", en: "04" },
    { file: "videos/live/05.mp4", poster: "images/live/05.jpg", ru: "05", en: "05" },
    { file: "videos/live/06.mp4", poster: "images/live/06.jpg", ru: "06", en: "06" },
    { file: "videos/live/07.mp4", poster: "images/live/07.jpg", ru: "07", en: "07" },
    { file: "videos/live/08.mp4", poster: "images/live/08.jpg", ru: "08", en: "08" },
    { file: "videos/live/09.mp4", poster: "images/live/09.jpg", ru: "09", en: "09" }
  ];

  function assetPrefix() {
    const script = document.querySelector('script[src*="shared.js"]');
    if (!script) return "";
    return script.getAttribute("src").replace(/js\/shared\.js.*$/, "");
  }

  function mountLive() {
    const right = document.querySelector(".header__right");
    if (!right || document.querySelector("[data-live-open]")) return;

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "live-btn";
    openBtn.setAttribute("data-live-open", "");
    openBtn.setAttribute("aria-haspopup", "dialog");
    openBtn.innerHTML = `<span class="live-btn__dot" aria-hidden="true"></span><span data-i18n="nav.live">Live</span>`;
    right.insertBefore(openBtn, right.firstChild);

    const root = document.createElement("div");
    root.className = "live";
    root.hidden = true;
    root.setAttribute("data-live", "");
    root.innerHTML = `
      <div class="live__backdrop" data-live-close></div>
      <div class="live__panel" role="dialog" aria-modal="true" aria-labelledby="live-title">
        <div class="live__bar">
          <p class="live__kicker"><span class="live-btn__dot" aria-hidden="true"></span><span data-i18n="nav.live">Live</span></p>
          <h2 class="live__title" id="live-title" data-i18n="live.title">Готовый ремонт</h2>
          <button type="button" class="live__close" data-live-close data-i18n="live.close">Закрыть</button>
        </div>
        <div class="live__stage">
          <button type="button" class="live__step live__step--prev" data-live-prev data-i18n-aria="live.prev" aria-label="Предыдущее видео">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <video data-live-player controls playsinline preload="none"></video>
          <button type="button" class="live__step live__step--next" data-live-next data-i18n-aria="live.next" aria-label="Следующее видео">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="live__strip" data-live-strip></div>
      </div>
    `;
    document.body.appendChild(root);

    const prefix = assetPrefix();
    const player = root.querySelector("[data-live-player]");
    const strip = root.querySelector("[data-live-strip]");
    let current = 0;

    LIVE_CLIPS.forEach((clip, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "live__clip";
      btn.setAttribute("data-live-clip", String(index));
      btn.innerHTML = `<img src="${prefix}${clip.poster}" alt="" /><span class="live__clip-name"></span>`;
      btn.addEventListener("click", () => playClip(index, true));
      strip.appendChild(btn);
    });

    function clipName(clip) {
      return getLang() === "en" ? clip.en : clip.ru;
    }

    function labelClips() {
      strip.querySelectorAll("[data-live-clip]").forEach((btn) => {
        const clip = LIVE_CLIPS[Number(btn.getAttribute("data-live-clip"))];
        const name = btn.querySelector(".live__clip-name");
        if (name && clip) name.textContent = clipName(clip);
      });
    }

    function playClip(index, restart) {
      current = index;
      const clip = LIVE_CLIPS[index];
      if (player.dataset.file !== clip.file) {
        player.dataset.file = clip.file;
        player.src = prefix + clip.file;
      } else if (restart) {
        player.currentTime = 0;
      }
      player.play().catch(() => {});
      strip.querySelectorAll("[data-live-clip]").forEach((btn) => {
        const on = Number(btn.getAttribute("data-live-clip")) === index;
        btn.classList.toggle("is-active", on);
        if (on) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
    }

    function stepClip(delta) {
      playClip((current + delta + LIVE_CLIPS.length) % LIVE_CLIPS.length, true);
      const active = strip.querySelector(".live__clip.is-active");
      if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }

    function openLive() {
      root.hidden = false;
      document.body.style.overflow = "hidden";
      openBtn.setAttribute("aria-expanded", "true");
      playClip(current, true);
      const close = root.querySelector(".live__close");
      if (close) close.focus();
    }

    function closeLive() {
      root.hidden = true;
      document.body.style.overflow = "";
      openBtn.setAttribute("aria-expanded", "false");
      player.pause();
      openBtn.focus();
    }

    openBtn.addEventListener("click", openLive);
    root.querySelector("[data-live-prev]").addEventListener("click", () => stepClip(-1));
    root.querySelector("[data-live-next]").addEventListener("click", () => stepClip(1));
    root.querySelectorAll("[data-live-close]").forEach((el) => {
      el.addEventListener("click", closeLive);
    });
    document.addEventListener("keydown", (e) => {
      if (root.hidden) return;
      if (e.key === "Escape") closeLive();
      if (e.target === player) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepClip(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepClip(1);
      }
    });

    labelClips();
    window.PoleshLive = { labelClips };
  }

  // Init
  ensureThemeControls();
  mountLive();
  applyFont();
  applyTheme(getTheme());
  applyI18n(getLang());

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang-btn")));
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
  window.PoleshUI = { setLang, setTheme, applyI18n, getLang, getTheme };
})();
