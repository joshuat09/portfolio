/* Contact form via Web3Forms. Stays hidden (the email link remains) until SITE_CONFIG.WEB3FORMS_KEY is set. */
(function () {
  "use strict";
  const copy = document.getElementById("copy-email");
  if (copy) copy.addEventListener("click", async () => {
    const done = text => { if (window.SFX) window.SFX.play("tick"); copy.textContent = text; setTimeout(() => { copy.textContent = "Copy email"; }, 2000); };
    try { await navigator.clipboard.writeText("joshuatait09@gmail.com"); done("Copied ✓"); }
    catch (e) { done("joshuatait09@gmail.com"); }
  });
  const form = document.getElementById("contact-form");
  const key = ((window.SITE_CONFIG && window.SITE_CONFIG.WEB3FORMS_KEY) || "").trim();
  if (!form || !key) return;

  const EMAIL = "joshuatait09@gmail.com";
  const status = form.querySelector(".form-status");
  const button = form.querySelector("button[type=submit]");
  form.hidden = false;

  function say(text, kind) {
    status.textContent = text;
    status.dataset.kind = kind || "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (form.elements.botcheck.checked) return;   // honeypot: real people never tick this hidden box

    const data = new FormData(form);
    data.append("access_key", key);
    data.append("subject", "New message from your portfolio");
    data.append("from_name", "Portfolio contact form");

    button.disabled = true;
    say("Sending…");
    try {
      const response = await fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || `HTTP ${response.status}`);
      form.reset();
      say("Thanks, your message has been sent. I'll reply by email.", "ok");
    } catch (error) {
      say(`Sorry, that didn't send. Please email me at ${EMAIL} instead.`, "error");
      console.warn("[contact] send failed", error);
    } finally {
      button.disabled = false;
    }
  });
})();
