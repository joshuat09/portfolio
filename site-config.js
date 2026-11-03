/* Site settings for third-party services. Both are off until a value is filled in.
 *
 * GOATCOUNTER_CODE: create a free account at https://www.goatcounter.com and use the site code you
 *   choose (for "joshua.goatcounter.com" the code is "joshua"). No cookies, no consent banner needed.
 * WEB3FORMS_KEY: get a free access key at https://web3forms.com by entering the email address that
 *   should receive messages. The key is designed to be public, so it is safe to put here.
 */
window.SITE_CONFIG = {
  GOATCOUNTER_CODE: "joshuat",
  WEB3FORMS_KEY: "04645f46-6d28-4563-9e7a-ee14585ac852"
};

/* Analytics: loads GoatCounter only when a code is set. It ignores localhost automatically. */
(function () {
  "use strict";
  const code = (window.SITE_CONFIG.GOATCOUNTER_CODE || "").trim();
  if (!/^[a-z0-9-]+$/i.test(code)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  document.head.append(script);
})();
