/**
 * Contact form → FormSubmit → polesh.pro@yandex.ru
 * Uses classic POST (more reliable than AJAX) + local validation.
 */
(() => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const statusEl = form.querySelector("[data-contact-status]");
  const submitBtn = form.querySelector('button[type="submit"]');
  const phoneInput = form.querySelector("[data-phone-local]");
  const nextInput = form.querySelector("[data-contact-next]");

  function t(key, fallback) {
    const lang = (window.PoleshUI && window.PoleshUI.getLang && window.PoleshUI.getLang()) || "ru";
    const dict = (window.POLESH_I18N && window.POLESH_I18N[lang]) || {};
    return dict[key] != null ? dict[key] : fallback;
  }

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-ok", type === "ok");
    statusEl.classList.toggle("is-err", type === "err");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function normalizePhoneDigits(raw) {
    let digits = String(raw || "").replace(/\D/g, "");
    if (digits.length >= 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
      digits = digits.slice(1);
    }
    return digits.slice(0, 10);
  }

  function formatPhoneLocal(digits) {
    const d = normalizePhoneDigits(digits);
    const parts = [];
    if (d.length > 0) parts.push(d.slice(0, 3));
    if (d.length > 3) parts.push(d.slice(3, 6));
    if (d.length > 6) parts.push(d.slice(6, 8));
    if (d.length > 8) parts.push(d.slice(8, 10));

    if (parts.length <= 1) return parts[0] || "";
    if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
    if (parts.length === 3) return `${parts[0]} ${parts[1]}-${parts[2]}`;
    return `${parts[0]} ${parts[1]}-${parts[2]}-${parts[3]}`;
  }

  function fullPhoneFromLocal(raw) {
    const digits = normalizePhoneDigits(raw);
    return digits ? `+7${digits}` : "";
  }

  function ensureHidden(name) {
    let el = form.querySelector(`input[type="hidden"][name="${name}"]`);
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.name = name;
      form.appendChild(el);
    }
    return el;
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatPhoneLocal(phoneInput.value);
    });

    phoneInput.addEventListener("paste", (event) => {
      event.preventDefault();
      const text = (event.clipboardData || window.clipboardData).getData("text");
      phoneInput.value = formatPhoneLocal(text);
    });
  }

  // Success return from FormSubmit (?sent=1)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sent") === "1") {
      setStatus(t("contact.success", "Заявка отправлена. Скоро отвечу."), "ok");
      params.delete("sent");
      const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash || "#contact"}`;
      window.history.replaceState({}, "", clean);
    }
  } catch (_) {
    /* ignore */
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const honey = String(data.get("_honey") || "").trim();
    const phone = fullPhoneFromLocal(phoneInput ? phoneInput.value : data.get("phone"));

    if (honey) return;

    if (!name || !email || !message) {
      setStatus(t("contact.error.required", "Заполните обязательные поля."), "err");
      return;
    }
    if (!isValidEmail(email)) {
      setStatus(t("contact.error.email", "Проверьте адрес email."), "err");
      return;
    }

    // Return URL after FormSubmit processes the request
    if (nextInput) {
      const url = new URL(window.location.href);
      url.searchParams.set("sent", "1");
      url.hash = "contact";
      nextInput.value = url.toString();
    }

    // Send full international phone
    if (phoneInput) {
      phoneInput.removeAttribute("name");
    }
    ensureHidden("phone").value = phone || "—";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.busy = "1";
    }
    setStatus(t("contact.sending", "Отправляем…"), null);

    // Native POST — FormSubmit handles delivery + first-time activation page
    form.submit();
  });
})();
