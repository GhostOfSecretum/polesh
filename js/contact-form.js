/**
 * Contact form → FormSubmit → polesh.pro@yandex.ru
 */
(() => {
  const ENDPOINT = "https://formsubmit.co/ajax/polesh.pro@yandex.ru";
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const statusEl = form.querySelector("[data-contact-status]");
  const submitBtn = form.querySelector('button[type="submit"]');

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

  const phoneInput = form.querySelector("[data-phone-local]");

  function normalizePhoneDigits(raw) {
    let digits = String(raw || "").replace(/\D/g, "");
    // If paste includes country code 7/8, keep only the local 10 digits
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

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      const formatted = formatPhoneLocal(phoneInput.value);
      phoneInput.value = formatted;
    });

    phoneInput.addEventListener("paste", (event) => {
      event.preventDefault();
      const text = (event.clipboardData || window.clipboardData).getData("text");
      phoneInput.value = formatPhoneLocal(text);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = fullPhoneFromLocal(data.get("phone"));
    const message = String(data.get("message") || "").trim();
    const honey = String(data.get("_honey") || "").trim();

    if (honey) return;

    if (!name || !email || !message) {
      setStatus(t("contact.error.required", "Заполните обязательные поля."), "err");
      return;
    }
    if (!isValidEmail(email)) {
      setStatus(t("contact.error.email", "Проверьте адрес email."), "err");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.busy = "1";
    }
    setStatus(t("contact.sending", "Отправляем…"), null);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          phone: phone || "—",
          message,
          _subject: "Заявка с polesh.pro",
          _template: "table",
          _captcha: "false"
        })
      });

      if (!res.ok) throw new Error("submit_failed");

      form.reset();
      setStatus(t("contact.success", "Заявка отправлена. Скоро отвечу."), "ok");
    } catch (_) {
      setStatus(
        t(
          "contact.error.send",
          "Не удалось отправить. Напишите напрямую: polesh.pro@yandex.ru"
        ),
        "err"
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        delete submitBtn.dataset.busy;
      }
    }
  });
})();
