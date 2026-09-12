#!/usr/bin/env python3
"""Write thin HTML shells for photo project pages."""

import json
import re
from pathlib import Path

ROOT = Path("/Users/rustamahatov/Desktop/Polesh")
works_js = (ROOT / "js/works.js").read_text(encoding="utf-8")
match = re.search(r"window\.POLESH_WORKS = (\[.*\]);", works_js, re.S)
if not match:
    raise SystemExit("Cannot parse js/works.js")
works = json.loads(match.group(1))

TEMPLATE = """<!DOCTYPE html>
<html lang="ru" data-theme="stone">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — Сергей Полещук</title>
  <meta name="description" content="{card}" />
  <meta name="author" content="Сергей Полещук" />
  <link rel="canonical" href="https://polesh.pro/projects/{id}.html" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="ru_RU" />
  <meta property="og:site_name" content="polesh.pro" />
  <meta property="og:title" content="{title} — Сергей Полещук" />
  <meta property="og:description" content="{card}" />
  <meta property="og:url" content="https://polesh.pro/projects/{id}.html" />
  <meta property="og:image" content="https://polesh.pro/{cover}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="../css/styles.css" />
  <script>
    try {{
      var allowed = ["night", "stone"];
      var t = localStorage.getItem("polesh-theme");
      document.documentElement.dataset.theme = allowed.indexOf(t) >= 0 ? t : "stone";
    }} catch (e) {{
      document.documentElement.dataset.theme = "stone";
    }}
  </script>
</head>
<body class="work-page" data-work="{id}">
  <header class="site-header" id="site-header">
    <a class="logo" href="../index.html" aria-label="polesh.pro">
      <img class="logo__img logo__img--ink" src="../images/logo-lockup.png" alt="" width="268" height="46" />
      <img class="logo__img logo__img--paper" src="../images/logo-lockup-on-dark.png" alt="" width="268" height="46" />
    </a>
    <div class="header__right">
      <nav class="nav" aria-label="Primary">
        <a href="../projects.html" aria-current="page" data-i18n="nav.projects">Проекты</a>
        <a href="../index.html#contact" data-i18n="nav.contact">Контакты</a>
      </nav>
      <div class="controls">
        <div class="control-group" role="group">
          <button type="button" data-lang-btn="ru" class="is-active">RU</button>
          <button type="button" data-lang-btn="en">EN</button>
        </div>
      </div>
    </div>
  </header>

  <main>
    <section class="work-hero" data-work-hero aria-hidden="true"></section>
    <section class="work-intro" data-work-intro></section>
    <nav class="work-rooms" data-work-rooms hidden aria-label="Rooms"></nav>
    <section class="project-stills work-gallery" data-work-gallery></section>
  </main>

  <footer class="site-footer">
    <div class="footer__grid">
      <div>
        <span class="logo">
          <img class="logo__img logo__img--ink" src="../images/logo-lockup.png" alt="polesh.pro" width="268" height="46" />
          <img class="logo__img logo__img--paper" src="../images/logo-lockup-on-dark.png" alt="" width="268" height="46" />
        </span>
        <p class="footer__tagline" data-i18n="footer.tagline">Архитектура и дизайн интерьеров</p>
      </div>
      <div class="footer__col">
        <h3 class="footer__label" data-i18n="footer.contacts">Контакты</h3>
        <a href="mailto:polesh.pro@yandex.ru">polesh.pro@yandex.ru</a>
      </div>
    </div>
    <p class="footer__copy"><span data-i18n="footer.copy">© Сергей Полещук</span> · <span data-year></span></p>
  </footer>

  <div class="work-lightbox" data-lightbox hidden>
    <button type="button" class="work-lightbox__close" data-lightbox-close aria-label="Закрыть">×</button>
    <button type="button" class="work-lightbox__nav work-lightbox__nav--prev" data-lightbox-prev aria-label="Назад">‹</button>
    <img data-lightbox-img alt="" />
    <button type="button" class="work-lightbox__nav work-lightbox__nav--next" data-lightbox-next aria-label="Далее">›</button>
  </div>

  <script src="../js/i18n.js"></script>
  <script src="../js/works.js"></script>
  <script src="../js/shared.js"></script>
  <script src="../js/work-page.js"></script>
</body>
</html>
"""

out_dir = ROOT / "projects"
for work in works:
    if work.get("custom"):
        continue
    html = TEMPLATE.format(
        id=work["id"],
        title=work["title_ru"],
        card=work["card_ru"],
        cover=work["cover"],
    )
    path = out_dir / f"{work['id']}.html"
    path.write_text(html, encoding="utf-8")
    print(path.name)
