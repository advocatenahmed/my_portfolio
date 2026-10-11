/* ==========================================================================
   Naeem Ahmed — Law & Engineering Consultancy
   main.js

   No dependencies. Every feature below degrades safely: if an element it
   needs is missing from the page, the feature exits without doing anything.
   ========================================================================== */

(function () {
  "use strict";

  /* Flags no-JS / reduced-motion queries in one place */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isDesktop = window.matchMedia("(min-width: 1024px)");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* ======================================================================
     1. Header — solid state on scroll (overlay variant only)
     ====================================================================== */

  function initHeader() {
    var header = $(".site-header");
    if (!header) return;

    var threshold = 40;
    var ticking = false;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > threshold);
      ticking = false;
    }

    update();

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );
  }

  /* ======================================================================
     2. Mobile drawer navigation
     ====================================================================== */

  function initMobileNav() {
    var toggle = $(".nav__toggle");
    var drawer = $("#nav-drawer");
    var backdrop = $(".nav-backdrop");
    var closeBtn = $(".nav-drawer__close");
    if (!toggle || !drawer) return;

    var lastFocused = null;

    function isOpen() {
      return document.body.classList.contains("nav-open");
    }

    function open() {
      lastFocused = document.activeElement;
      document.body.classList.add("nav-open", "is-locked");
      toggle.setAttribute("aria-expanded", "true");
      drawer.removeAttribute("inert");
      drawer.setAttribute("aria-hidden", "false");
      if (closeBtn) closeBtn.focus();
    }

    function close(returnFocus) {
      if (!isOpen()) return;
      document.body.classList.remove("nav-open", "is-locked");
      toggle.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");

      /* Wait for the slide-out before the drawer leaves the a11y tree */
      window.setTimeout(function () {
        if (!isOpen()) drawer.setAttribute("inert", "");
      }, 400);

      if (returnFocus !== false && lastFocused) lastFocused.focus();
    }

    toggle.addEventListener("click", function () {
      isOpen() ? close() : open();
    });

    if (closeBtn) closeBtn.addEventListener("click", function () { close(); });
    if (backdrop) backdrop.addEventListener("click", function () { close(); });

    /* Close after following a link */
    $$("a", drawer).forEach(function (link) {
      link.addEventListener("click", function () { close(false); });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close();
    });

    /* Keep tab focus inside the drawer while it is open */
    drawer.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !isOpen()) return;

      var focusable = $$(
        'a[href], button:not([disabled]), input, select, textarea',
        drawer
      ).filter(function (el) { return el.offsetParent !== null; });

      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    /* Start hidden for assistive tech on small screens */
    if (!isDesktop.matches) {
      drawer.setAttribute("inert", "");
      drawer.setAttribute("aria-hidden", "true");
    } else {
      drawer.removeAttribute("inert");
      drawer.setAttribute("aria-hidden", "false");
    }

    isDesktop.addEventListener("change", function (e) {
      close(false);
      if (e.matches) {
        drawer.removeAttribute("inert");
        drawer.setAttribute("aria-hidden", "false");
      } else {
        drawer.setAttribute("inert", "");
        drawer.setAttribute("aria-hidden", "true");
      }
    });
  }

  /* ======================================================================
     3. Scroll reveal
     ====================================================================== */

  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ======================================================================
     4. Animated counters
     ====================================================================== */

  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;

    var decimals = (el.dataset.count.split(".")[1] || "").length;
    var duration = 1500;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;

      var progress = Math.min((ts - start) / duration, 1);
      /* easeOutExpo — fast start, gentle settle */
      var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      var value = (target * eased).toFixed(decimals);

      el.textContent = value + (el.dataset.suffix || "");
      if (progress < 1) window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  function initCounters() {
    var counters = $$("[data-count]");
    if (!counters.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        el.textContent = el.dataset.count + (el.dataset.suffix || "");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ======================================================================
     5. Back to top
     ====================================================================== */

  function initToTop() {
    var btn = $(".to-top");
    if (!btn) return;

    var ticking = false;

    function update() {
      btn.classList.toggle("is-visible", window.scrollY > 600);
      ticking = false;
    }

    update();

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    btn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
    });
  }

  /* ======================================================================
     6. Exclusive accordion (native <details>, no animation dependency)
     ====================================================================== */

  function initAccordion() {
    $$("[data-accordion]").forEach(function (group) {
      var single = group.dataset.accordion === "single";

      $$("details", group).forEach(function (item) {
        var summary = $("summary", item);
        if (!summary) return;

        summary.addEventListener("click", function (e) {
          if (!single) return;

          /* Own the toggle entirely: a single-open group never collapses
             to zero, and opening one item closes its siblings. */
          e.preventDefault();
          if (item.open) return;

          $$("details", group).forEach(function (other) {
            other.open = false;
          });
          item.open = true;
        });
      });
    });
  }

  /* ======================================================================
     7. Footer year
     ====================================================================== */

  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ======================================================================
     8. Contact form validation
     ----------------------------------------------------------------------
     Client-side only. To connect a real endpoint, replace the body of the
     marked block in submitHandler() with a fetch() call.
     ====================================================================== */

  var FIELDS = [
    {
      name: "fullName",
      label: "Full name",
      required: true,
      test: function (v) { return v.trim().length >= 2; },
      message: "Please enter your full name (at least 2 characters)."
    },
    {
      name: "email",
      label: "Email address",
      required: true,
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      message: "Please enter a valid email address, for example name@company.com."
    },
    {
      name: "phone",
      label: "Telephone",
      required: false,
      test: function (v) {
        return v.trim() === "" || /^[+()\-\s\d.]{7,25}$/.test(v.trim());
      },
      message: "Please enter a valid telephone number, or leave this blank."
    },
    {
      name: "practice",
      label: "Area of interest",
      required: true,
      test: function (v) { return v !== ""; },
      message: "Please select the area your enquiry relates to."
    },
    {
      name: "message",
      label: "Enquiry",
      required: true,
      test: function (v) { return v.trim().length >= 20; },
      message: "Please describe your enquiry in at least 20 characters so we can route it correctly."
    }
  ];

  function initContactForm() {
    var form = $("#enquiry-form");
    if (!form) return;

    var summary = $("#form-summary");
    var summaryList = $("#form-summary-list");
    var success = $("#form-success");
    var successRef = $("#form-success-ref");
    var submitBtn = $("#form-submit");

    function fieldWrap(input) { return input.closest(".field"); }
    function errorEl(input) { return fieldWrap(input).querySelector(".field__error"); }

    function setError(input, config) {
      var wrap = fieldWrap(input);
      var slot = errorEl(input);

      wrap.classList.add("has-error");
      input.setAttribute("aria-invalid", "true");

      if (slot) {
        var span = $("span", slot);
        if (span) span.textContent = config.message;
      }
    }

    function clearError(input) {
      var wrap = fieldWrap(input);
      wrap.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
    }

    function validate(input, config) {
      var value = input.type === "checkbox" ? input.checked : input.value;
      var ok = config.test(String(value));
      ok ? clearError(input) : setError(input, config);
      return ok;
    }

    /* Live re-validation once a field has been flagged */
    FIELDS.forEach(function (config) {
      var input = form.elements[config.name];
      if (!input) return;

      var revalidate = function () {
        if (fieldWrap(input).classList.contains("has-error")) {
          validate(input, config);
        }
      };

      input.addEventListener("blur", function () { validate(input, config); });
      input.addEventListener("input", revalidate);
      input.addEventListener("change", revalidate);
    });

    /* Consent checkbox */
    var consent = form.elements.consent;
    if (consent) {
      consent.addEventListener("change", function () {
        if (consent.checked) clearError(consent);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var failed = [];

      FIELDS.forEach(function (config) {
        var input = form.elements[config.name];
        if (!input) return;
        if (!validate(input, config)) failed.push({ config: config, input: input });
      });

      if (consent && !consent.checked) {
        consent.setAttribute("aria-invalid", "true");
        fieldWrap(consent).classList.add("has-error");
        failed.push({
          config: { label: "Privacy consent", message: "Please confirm you have read the privacy notice." },
          input: consent
        });
      }

      /* Summary panel */
      if (failed.length) {
        summaryList.innerHTML = "";
        failed.forEach(function (item) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#" + item.input.id;
          a.textContent = item.config.label;
          a.addEventListener("click", function (ev) {
            ev.preventDefault();
            item.input.focus();
          });
          li.appendChild(a);
          summaryList.appendChild(li);
        });

        summary.classList.add("is-visible");
        summary.setAttribute("tabindex", "-1");
        summary.focus();
        summary.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "center"
        });
        return;
      }

      summary.classList.remove("is-visible");

      /* ------------------------------------------------------------------
         TODO: connect a real endpoint.
         Example:
           fetch(form.action, { method: "POST", body: new FormData(form) })
             .then(function (r) { if (!r.ok) throw new Error(r.status); })
             .then(showSuccess)
             .catch(showError);
         ------------------------------------------------------------------ */

      showSuccess();
    });

    function showSuccess() {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      /* Brief simulated round-trip so the state change is legible */
      window.setTimeout(function () {
        var ref =
          "NA-" +
          new Date().getFullYear() +
          "-" +
          String(Math.floor(1000 + Math.random() * 9000));

        if (successRef) successRef.textContent = ref;

        form.hidden = true;
        if (success) {
          success.classList.add("is-visible");
          success.setAttribute("tabindex", "-1");
          success.focus();
          success.scrollIntoView({
            behavior: reduceMotion.matches ? "auto" : "smooth",
            block: "center"
          });
        }
      }, 650);
    }

    /* Send another */
    var again = $("#form-again");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        $$(".field", form).forEach(function (f) { f.classList.remove("has-error"); });
        form.hidden = false;
        if (success) success.classList.remove("is-visible");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send enquiry";
        }
        var first = form.elements.fullName || form.elements[0];
        if (first) first.focus();
      });
    }
  }

  /* ======================================================================
     Boot
     ====================================================================== */

  function init() {
    initHeader();
    initMobileNav();
    initReveal();
    initCounters();
    initToTop();
    initAccordion();
    initYear();
    initContactForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
