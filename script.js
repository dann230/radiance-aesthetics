/* ============================================================
   RADIANCE AESTHETICS — script.js
   Vanilla JS, no dependencies.
   1.  Helpers
   2.  Mobile navigation
   3.  Sticky header + active link
   4.  Scroll reveal
   5.  Automated testimonial carousel
   6.  Before / after comparison sliders
   7.  Gallery lightbox
   8.  Service → booking pre-select
   9.  Appointment form validation + WhatsApp handoff
   10. Smooth anchor scrolling & misc
   ============================================================ */

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  /* ---------- 1. HELPERS ---------- */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  var WHATSAPP_NUMBER = '2348134612316'; // 0813 461 2316 in international format

  /* ---------- 2. MOBILE NAVIGATION ---------- */
  var nav = $('#primaryNav');
  var navToggle = $('#navToggle');

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  }

  function openNav() {
    if (!nav || !navToggle) return;
    nav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    // close when a nav link is tapped
    $$('.nav-link, .nav-cta', nav).forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    // close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        navToggle.focus();
      }
    });

    // close if resized up to desktop
    var mqDesktop = window.matchMedia('(min-width: 901px)');
    var handleMq = function (e) { if (e.matches) closeNav(); };
    if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', handleMq);
    else if (mqDesktop.addListener) mqDesktop.addListener(handleMq);
  }

  /* ---------- 3. STICKY HEADER + ACTIVE LINK ---------- */
  var header = $('#siteHeader');
  var navLinks = $$('.nav-link');
  var sectionIds = ['home', 'about', 'services', 'gallery', 'contact'];
  var sections = sectionIds
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  var lastScrollY = 0;
  var ticking = false;

  function onScrollFrame() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    // sticky header
    if (header) {
      if (y > 24) header.classList.add('is-stuck');
      else header.classList.remove('is-stuck');
    }

    // active nav link
    if (sections.length) {
      var offset = y + 140;
      var current = sections[0].id;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= offset) current = sections[i].id;
      }
      // bottom of page → contact
      if (y + window.innerHeight >= document.body.scrollHeight - 60) {
        current = sections[sections.length - 1].id;
      }
      navLinks.forEach(function (link) {
        var href = link.getAttribute('href') || '';
        var isCurrent = href === '#' + current;
        link.classList.toggle('is-active', isCurrent);
        if (isCurrent) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }

    lastScrollY = y;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScrollFrame();

  /* ---------- 4. SCROLL REVEAL ---------- */
  var revealEls = $$('.reveal');

  // assign stagger delay from data-delay
  revealEls.forEach(function (el) {
    var d = el.getAttribute('data-delay');
    if (d) el.style.setProperty('--d', d);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 5. TESTIMONIAL CAROUSEL (autoplay) ---------- */
  var track = $('#testiTrack');
  var dotsWrap = $('#testiDots');
  var carousel = $('.testi-carousel');

  if (track && dotsWrap) {
    var cards = $$('.testi-card', track);
    var index = 0;
    var timer = null;
    var AUTOPLAY_MS = 5200;
    var paused = false;

    function perView() {
      if (window.innerWidth <= 900) return 1;
      if (window.innerWidth <= 1180) return 2;
      return 3;
    }

    function maxIndex() {
      return Math.max(0, cards.length - perView());
    }

    function cardStep() {
      if (!cards.length) return 0;
      var first = cards[0];
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 22;
      return first.getBoundingClientRect().width + gap;
    }

    function buildDots() {
      dotsWrap.innerHTML = '';
      var total = maxIndex() + 1;
      for (var i = 0; i < total; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Show testimonial set ' + (i + 1));
        if (i === index) b.classList.add('is-active');
        b.addEventListener('click', (function (n) {
          return function () { goTo(n); restart(); };
        })(i));
        dotsWrap.appendChild(b);
      }
    }

    function syncDots() {
      $$('button', dotsWrap).forEach(function (b, i) {
        b.classList.toggle('is-active', i === index);
        b.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
    }

    function goTo(n) {
      index = clamp(n, 0, maxIndex());
      track.style.transform = 'translate3d(' + (-index * cardStep()) + 'px, 0, 0)';
      syncDots();
    }

    function next() {
      var max = maxIndex();
      if (index >= max) goTo(0);
      else goTo(index + 1);
    }

    function start() {
      stop();
      if (reduceMotion || paused) return;
      timer = window.setInterval(next, AUTOPLAY_MS);
    }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    function restart() { start(); }

    buildDots();
    goTo(0);
    start();

    // pause on hover / focus / tab hidden — resumes after
    if (carousel) {
      carousel.addEventListener('mouseenter', function () { paused = true; stop(); });
      carousel.addEventListener('mouseleave', function () { paused = false; start(); });
      carousel.addEventListener('focusin', function () { paused = true; stop(); });
      carousel.addEventListener('focusout', function () { paused = false; start(); });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (!paused) start();
    });

    // subtle swipe support
    var startX = 0, deltaX = 0, dragging = false;
    var viewport = $('.testi-viewport');

    if (viewport) {
      viewport.addEventListener('touchstart', function (e) {
        dragging = true;
        startX = e.touches[0].clientX;
        deltaX = 0;
        stop();
      }, { passive: true });

      viewport.addEventListener('touchmove', function (e) {
        if (!dragging) return;
        deltaX = e.touches[0].clientX - startX;
      }, { passive: true });

      viewport.addEventListener('touchend', function () {
        if (!dragging) return;
        dragging = false;
        if (Math.abs(deltaX) > 46) {
          if (deltaX < 0) goTo(index + 1);
          else goTo(index - 1);
        }
        start();
      });
    }

    // keep alignment on resize
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        buildDots();
        goTo(index);
        start();
      }, 160);
    });
  }

  /* ---------- 6. BEFORE / AFTER SLIDERS ---------- */
  var sliders = $$('[data-ba]');

  sliders.forEach(function (slider) {
    var handle = $('.ba-handle', slider);
    var afterImg = $('.ba-after', slider);
    if (!handle || !afterImg) return;

    var position = 50; // percentage of the AFTER image revealed

    function apply(pct) {
      position = clamp(pct, 2, 98);
      // reveal the after image from the left up to `position`
      var inset = 'inset(0 ' + (100 - position) + '% 0 0)';
      afterImg.style.webkitClipPath = inset;
      afterImg.style.clipPath = inset;
      handle.style.left = position + '%';
      handle.setAttribute('aria-valuenow', Math.round(position));
    }

    function fromEvent(clientX) {
      var rect = slider.getBoundingClientRect();
      if (!rect.width) return;
      apply(((clientX - rect.left) / rect.width) * 100);
    }

    var active = false;

    function pointerDown(e) {
      active = true;
      slider.classList.add('is-dragging');
      if (e.pointerId !== undefined && slider.setPointerCapture) {
        try { slider.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      }
      fromEvent(e.clientX);
    }

    function pointerMove(e) {
      if (!active) return;
      fromEvent(e.clientX);
    }

    function pointerUp() {
      active = false;
      slider.classList.remove('is-dragging');
    }

    if (window.PointerEvent) {
      slider.addEventListener('pointerdown', pointerDown);
      slider.addEventListener('pointermove', pointerMove);
      slider.addEventListener('pointerup', pointerUp);
      slider.addEventListener('pointercancel', pointerUp);
      slider.addEventListener('pointerleave', pointerUp);
    } else {
      slider.addEventListener('mousedown', pointerDown);
      window.addEventListener('mousemove', pointerMove);
      window.addEventListener('mouseup', pointerUp);
      slider.addEventListener('touchstart', function (e) { pointerDown(e.touches[0]); }, { passive: true });
      slider.addEventListener('touchmove', function (e) { pointerMove(e.touches[0]); }, { passive: true });
      slider.addEventListener('touchend', pointerUp);
    }

    // keyboard support on the handle
    handle.addEventListener('keydown', function (e) {
      var stepSize = e.shiftKey ? 10 : 3;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        apply(position - stepSize);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        apply(position + stepSize);
      } else if (e.key === 'Home') {
        e.preventDefault(); apply(2);
      } else if (e.key === 'End') {
        e.preventDefault(); apply(98);
      }
    });

    apply(50);
  });

  /* ---------- 7. GALLERY LIGHTBOX ---------- */
  var lightbox = $('#lightbox');
  var lightboxImg = $('#lightboxImg');
  var lightboxCaption = $('#lightboxCaption');
  var lightboxClose = $('#lightboxClose');
  var lastFocused = null;

  function openLightbox(src, caption, alt) {
    if (!lightbox || !lightboxImg) return;
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || caption || '';
    if (lightboxCaption) lightboxCaption.textContent = caption || '';
    lightbox.hidden = false;
    // force reflow then animate
    void lightbox.offsetWidth;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      lightbox.hidden = true;
      lightboxImg.removeAttribute('src');
    }, 320);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  $$('[data-lightbox]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = btn.getAttribute('data-lightbox');
      var caption = btn.getAttribute('data-lightbox-caption');
      var img = btn.closest('.gallery-item');
      var afterImg = img ? $('.ba-after', img) : null;
      openLightbox(src, caption, afterImg ? afterImg.alt : caption);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
  });

  /* ---------- 8. SERVICE → BOOKING PRE-SELECT ---------- */
  var serviceSelect = $('#service');

  function prefillService(name) {
    if (!serviceSelect || !name) return;
    var decoded = name.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
    var matched = false;

    Array.prototype.forEach.call(serviceSelect.options, function (opt) {
      if (opt.value && opt.value.toLowerCase() === decoded.toLowerCase()) {
        serviceSelect.value = opt.value;
        matched = true;
      }
    });

    if (!matched) return;

    serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));

    var field = serviceSelect.closest('.field');
    if (field) field.classList.remove('has-error');

    var booking = document.getElementById('booking');
    if (booking) booking.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

    window.setTimeout(function () {
      if (typeof serviceSelect.focus === 'function') serviceSelect.focus({ preventScroll: true });
    }, reduceMotion ? 60 : 620);
  }

  $$('[data-book-service]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      prefillService(btn.getAttribute('data-book-service'));
    });
  });

  /* ---------- 9. APPOINTMENT FORM ---------- */
  var form = $('#bookingForm');
  var statusEl = $('#formStatus');

  if (form) {
    var dateInput = $('#date');

    // can't pick a date in the past
    if (dateInput) {
      var today = new Date();
      var iso = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
      dateInput.min = iso;
    }

    function fieldWrap(el) { return el ? el.closest('.field') : null; }

    function setError(el, message) {
      var wrap = fieldWrap(el);
      if (!wrap) return;
      var err = wrap.querySelector('.field-error');
      if (message) {
        wrap.classList.add('has-error');
        el.setAttribute('aria-invalid', 'true');
        if (err) err.textContent = message;
      } else {
        wrap.classList.remove('has-error');
        el.removeAttribute('aria-invalid');
        if (err) err.textContent = '';
      }
    }

    function setStatus(message, kind) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.remove('is-error', 'is-ok');
      statusEl.classList.add('is-shown');
      if (kind) statusEl.classList.add(kind === 'ok' ? 'is-ok' : 'is-error');
    }

    var validators = {
      fullName: function (v) {
        if (!v.trim()) return 'Please enter your full name.';
        if (v.trim().length < 2) return 'Please enter your name as you would like us to use it.';
        return '';
      },
      phone: function (v) {
        var digits = v.replace(/[^\d]/g, '');
        if (!v.trim()) return 'Please enter a phone number we can reach you on.';
        if (digits.length < 7) return 'That number looks too short — please check it.';
        if (digits.length > 15) return 'That number looks too long — please check it.';
        return '';
      },
      email: function (v) {
        if (!v.trim()) return ''; // optional
        var ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());
        return ok ? '' : 'Please enter a valid email address, or leave it blank.';
      },
      service: function (v) {
        return v ? '' : 'Please choose the service you are interested in.';
      },
      date: function (v) {
        if (!v) return 'Please choose a preferred date.';
        var chosen = new Date(v + 'T00:00:00');
        if (isNaN(chosen.getTime())) return 'Please choose a valid date.';
        var now = new Date();
        now.setHours(0, 0, 0, 0);
        if (chosen < now) return 'Please choose today or a future date.';
        return '';
      }
    };

    function validateField(name, silent) {
      var el = form.elements[name];
      if (!el || !validators[name]) return true;
      var message = validators[name](el.value);
      if (!silent) setError(el, message);
      else if (!message) setError(el, '');
      return !message;
    }

    // live validation once a field has been touched
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('blur', function () {
        if (validators[el.name]) validateField(el.name);
      });
      el.addEventListener('input', function () {
        var wrap = fieldWrap(el);
        if (wrap && wrap.classList.contains('has-error') && validators[el.name]) {
          validateField(el.name);
        }
      });
      el.addEventListener('change', function () {
        if (validators[el.name]) validateField(el.name);
      });
    });

    function formatDateForMessage(value) {
      if (!value) return '';
      var d = new Date(value + 'T00:00:00');
      if (isNaN(d.getTime())) return value;
      return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var names = ['fullName', 'phone', 'email', 'service', 'date'];
      var firstInvalid = null;

      names.forEach(function (n) {
        var ok = validateField(n);
        if (!ok && !firstInvalid) firstInvalid = form.elements[n];
      });

      if (firstInvalid) {
        setStatus('Please check the highlighted fields and try again.', 'error');
        if (firstInvalid.focus) firstInvalid.focus();
        return;
      }

      var data = {
        name: form.elements.fullName.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email.value.trim(),
        service: form.elements.service.value,
        date: form.elements.date.value,
        message: form.elements.message.value.trim()
      };

      var lines = [
        'Hello Radiance Aesthetics, I would like to request an appointment.',
        '',
        'Name: ' + data.name,
        'Phone: ' + data.phone
      ];
      if (data.email) lines.push('Email: ' + data.email);
      lines.push('Service: ' + data.service);
      lines.push('Preferred date: ' + formatDateForMessage(data.date));
      if (data.message) {
        lines.push('');
        lines.push('Additional message: ' + data.message);
      }
      lines.push('');
      lines.push('(Sent from the Radiance Aesthetics website)');

      var text = lines.join('\n');
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);

      var win = window.open(url, '_blank', 'noopener');

      if (win) {
        setStatus(
          'WhatsApp has opened in a new tab with your details filled in — press send there and we will reply to confirm a time.',
          'ok'
        );
      } else {
        setStatus(
          'Your browser blocked the new tab. Please open WhatsApp and send this to 0813 461 2316, or tap the WhatsApp button on this page.',
          'error'
        );
      }

      // give a fallback link in the status area so the request is never lost
      if (statusEl) {
        var existing = statusEl.querySelector('a');
        if (existing) existing.remove();
        var fallback = document.createElement('a');
        fallback.href = url;
        fallback.target = '_blank';
        fallback.rel = 'noopener';
        fallback.textContent = ' Open WhatsApp manually →';
        fallback.style.cssText = 'display:inline-block;margin-top:6px;font-weight:500;text-decoration:underline;';
        statusEl.appendChild(fallback);
      }
    });
  }

  /* ---------- 10. MISC ---------- */
  // current year in the footer
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // smooth scroll for same-page anchors where the browser needs a nudge
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      // keep the URL shareable without jumping twice
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  // mark page as ready (used by reveal fallback)
  document.documentElement.setAttribute('data-js', 'ready');
})();
