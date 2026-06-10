/* ============================================================
   JIAZC — shared site JavaScript
   - Mobile nav toggle
   - EN / 中文 language switch (localStorage persisted)
   - Scroll reveal (IntersectionObserver)
   - Sticky header shadow
   - Current year
   - Contact form validation (contact page)
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Current year ---------------- */
  function setYear() {
    var els = document.querySelectorAll("[data-year]");
    var y = new Date().getFullYear();
    els.forEach(function (el) { el.textContent = y; });
  }

  /* ---------------- Mobile nav ---------------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close when a link is clicked
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        close();
        toggle.focus();
      }
    });
    // Close when resizing up to desktop
    var mq = window.matchMedia("(min-width: 861px)");
    mq.addEventListener("change", function (e) { if (e.matches) close(); });
  }

  /* ---------------- Language switch ---------------- */
  var LANG_KEY = "jiazc-lang";

  function applyLang(lang) {
    var isZh = lang === "zh";
    document.documentElement.setAttribute("lang", isZh ? "zh-Hans" : "en");

    // Swap text content
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      if (val !== null && val !== undefined) el.textContent = val;
    });
    // Swap placeholders
    document.querySelectorAll("[data-en-ph]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh-ph") : el.getAttribute("data-en-ph");
      if (val !== null && val !== undefined) el.setAttribute("placeholder", val);
    });
    // Swap <option> labels
    document.querySelectorAll("option[data-en]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      if (val !== null && val !== undefined) el.textContent = val;
    });
    // Swap aria-labels where provided
    document.querySelectorAll("[data-en-aria]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh-aria") : el.getAttribute("data-en-aria");
      if (val) el.setAttribute("aria-label", val);
    });

    // Toggle button pressed states
    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === lang ? "true" : "false");
    });
  }

  function initLang() {
    var stored = null;
    try { stored = localStorage.getItem(LANG_KEY); } catch (e) {}
    var lang = stored === "zh" ? "zh" : "en"; // default English
    applyLang(lang);

    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var chosen = btn.getAttribute("data-lang");
        applyLang(chosen);
        try { localStorage.setItem(LANG_KEY, chosen); } catch (e) {}
      });
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Image fallback ----------------
     If a remote image fails to load, hide the <img> so the
     parent's branded gradient background shows through cleanly
     instead of a broken-image icon + alt text. */
  function initImageFallback() {
    document.querySelectorAll("img").forEach(function (img) {
      function fail() {
        img.style.display = "none";
        var parent = img.parentElement;
        if (parent) parent.setAttribute("data-img-failed", "true");
      }
      // Already errored before JS ran (cached failure)
      if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
      img.addEventListener("error", fail);
    });
  }

  /* ---------------- Sticky header shadow ---------------- */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------- Contact form validation ---------------- */
  function initForm() {
    var form = document.getElementById("inquiry-form");
    if (!form) return;
    var success = document.getElementById("form-success");

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function isZh() { return document.documentElement.getAttribute("lang") !== "en"; }

    function showError(field, key) {
      var input = field.querySelector("input, select, textarea");
      var msg = field.querySelector(".error-msg");
      if (input) input.classList.add("invalid");
      if (input) input.setAttribute("aria-invalid", "true");
      if (msg) {
        msg.textContent = isZh() ? msg.getAttribute("data-zh-" + key) : msg.getAttribute("data-en-" + key);
        msg.classList.add("show");
      }
    }
    function clearError(field) {
      var input = field.querySelector("input, select, textarea");
      var msg = field.querySelector(".error-msg");
      if (input) { input.classList.remove("invalid"); input.removeAttribute("aria-invalid"); }
      if (msg) msg.classList.remove("show");
    }

    function validateField(field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return true;
      var val = (input.value || "").trim();
      var required = input.hasAttribute("required");

      if (required && !val) { showError(field, "required"); return false; }
      if (input.type === "email" && val && !EMAIL_RE.test(val)) { showError(field, "email"); return false; }
      clearError(field);
      return true;
    }

    // Live clear on input
    form.querySelectorAll(".field").forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return;
      input.addEventListener("input", function () {
        if (input.classList.contains("invalid")) validateField(field);
      });
      input.addEventListener("blur", function () { validateField(field); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll(".field");
      var ok = true;
      var firstInvalid = null;
      fields.forEach(function (field) {
        var valid = validateField(field);
        if (!valid && !firstInvalid) firstInvalid = field;
        if (!valid) ok = false;
      });

      if (!ok) {
        if (firstInvalid) {
          var inp = firstInvalid.querySelector("input, select, textarea");
          if (inp) inp.focus();
        }
        return;
      }

      // Fake submit success
      form.reset();
      fields.forEach(clearError);
      if (success) {
        success.classList.add("show");
        success.setAttribute("tabindex", "-1");
        success.focus();
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    setYear();
    initNav();
    initLang();
    initReveal();
    initImageFallback();
    initHeader();
    initForm();
  });
})();
