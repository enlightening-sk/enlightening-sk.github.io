(function () {
  var VISIT_COOKIE = "esk_visit";
  var CONSENT_COOKIE = "esk_mkt";
  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var config = readConfig();
  var pixelStarted = false;

  captureVisit();
  window.funnelVisit = function () {
    return readVisit() || {};
  };
  window.funnelMarketingAllowed = function () {
    return marketingAllowed();
  };
  window.funnelTrackLead = function (eventId) {
    if (!marketingAllowed() || !pixelStarted || typeof window.fbq !== "function" || !eventId) return;
    window.fbq("track", "Lead", {}, { eventID: eventId });
  };

  if (!config) return;
  var choice = consentChoice();
  if (choice === "1") {
    startPixel();
    return;
  }
  if (choice === "0") return;
  showBanner();
  if (config.consentMode === "opt_out") startPixel();

  function readConfig() {
    var cfg = window.FUNNEL_PIXEL;
    if (!cfg || typeof cfg !== "object") return null;
    if (typeof cfg.pixelId !== "string" || !/^\d{1,32}$/.test(cfg.pixelId)) return null;
    if (cfg.consentMode !== "opt_in" && cfg.consentMode !== "opt_out") return null;
    return cfg;
  }

  function pageKind() {
    var path = location.pathname.replace(/\/index\.html$/, "");
    if (path.length > 1 && path.charAt(path.length - 1) === "/") path = path.slice(0, -1);
    if (path === "/software/contact") return "contact";
    if (path === "/software/thanks") return "thanks";
    if (path === "/software") return "landing";
    return "";
  }

  function domainAttr() {
    var host = location.hostname;
    if (host === "enlightening.sk" || host === "www.enlightening.sk") return "; Domain=enlightening.sk";
    return "";
  }

  function readCookie(name) {
    var prefix = name + "=";
    var parts = document.cookie ? document.cookie.split("; ") : [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].indexOf(prefix) !== 0) continue;
      try { return decodeURIComponent(parts[i].slice(prefix.length)); }
      catch (ignore) { return parts[i].slice(prefix.length); }
    }
    return "";
  }

  function setCookie(name, value, maxAge) {
    var secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = name + "=" + encodeURIComponent(value) + "; Path=/" + domainAttr() + "; Max-Age=" + maxAge + "; SameSite=Lax" + secure;
  }

  function readVisit() {
    var raw = readCookie(VISIT_COOKIE);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (ignore) {
      return null;
    }
  }

  function captureVisit() {
    var params;
    try { params = new URLSearchParams(location.search); }
    catch (ignore) { return; }
    var next = {};
    var found = false;
    for (var i = 0; i < UTM.length; i++) {
      var key = UTM[i];
      var value = (params.get(key) || "").trim();
      if (!value) continue;
      found = true;
      next[key] = value.slice(0, 200);
    }
    var fbclid = (params.get("fbclid") || "").trim();
    if (fbclid) {
      found = true;
      next.fbclid = fbclid.slice(0, 480);
    }
    if (!found) return;
    if (next.fbclid) {
      var prev = readVisit();
      if (prev && prev.fbclid === next.fbclid && typeof prev.fbclid_ts === "number") next.fbclid_ts = prev.fbclid_ts;
      else next.fbclid_ts = Date.now();
    }
    setCookie(VISIT_COOKIE, JSON.stringify(next), 90 * 24 * 60 * 60);
  }

  function consentChoice() {
    var value = readCookie(CONSENT_COOKIE);
    return value === "1" || value === "0" ? value : "";
  }

  function setConsent(value) {
    setCookie(CONSENT_COOKIE, value, 180 * 24 * 60 * 60);
  }

  function marketingAllowed() {
    var choice = consentChoice();
    if (choice === "1") return true;
    if (choice === "0") return false;
    return !!(config && config.consentMode === "opt_out");
  }

  function startPixel() {
    if (pixelStarted || !config) return;
    var kind = pageKind();
    if (!kind) return;
    pixelStarted = true;
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", config.pixelId);
    window.fbq("track", "PageView");
    if (kind === "contact") window.fbq("track", "ViewContent");
  }

  function removeBanner() {
    var bar = document.getElementById("marketing-consent");
    if (bar) bar.remove();
    document.body.classList.remove("has-consent");
  }

  function showBanner() {
    if (document.getElementById("marketing-consent")) return;
    var bar = document.createElement("div");
    bar.id = "marketing-consent";
    bar.className = "consent";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Marketing cookies");
    bar.innerHTML = '<div class="consent-inner"><p>We use a necessary cookie to remember how you reached this site. Meta Pixel measures advertising only if you allow it. <a href="/privacy/">Privacy</a></p><div class="consent-actions"><button type="button" class="btn" data-consent="accept">Accept</button><button type="button" class="btn consent-reject" data-consent="reject">Reject</button></div></div>';
    document.body.appendChild(bar);
    document.body.classList.add("has-consent");
    bar.querySelector("[data-consent=accept]").addEventListener("click", function () {
      setConsent("1");
      removeBanner();
      startPixel();
    });
    bar.querySelector("[data-consent=reject]").addEventListener("click", function () {
      setConsent("0");
      removeBanner();
    });
  }
})();
