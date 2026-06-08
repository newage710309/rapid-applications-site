/**
 * RAPID APPLICATIONS — main.js
 * No external dependencies
 */

(function () {
  'use strict';

  /* ========================================================
     Utility
  ======================================================== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ========================================================
     Header: scroll shadow
  ======================================================== */
  function initHeader() {
    const header = $('#site-header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check
  }

  /* ========================================================
     Mobile nav toggle
  ======================================================== */
  function initMobileNav() {
    const toggle = $('#nav-toggle');
    const nav    = $('#global-nav');
    if (!toggle || !nav) return;

    const close = () => {
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'メニューを開く');
      nav.classList.remove('open');
    };

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      if (isOpen) {
        close();
      } else {
        toggle.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'メニューを閉じる');
        nav.classList.add('open');
      }
    });

    // Close on nav link click (single-page)
    $$('a', nav).forEach(link => {
      link.addEventListener('click', close);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        close();
      }
    });

    // Close on Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  /* ========================================================
     Smooth scroll: offset for fixed header
  ======================================================== */
  function initSmoothScroll() {
    const HEADER_H = 64;

    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const hash = anchor.getAttribute('href');
        if (hash === '#') return;
        const target = document.querySelector(hash);
        if (!target) return;

        e.preventDefault();

        const top = target.getBoundingClientRect().top + window.scrollY - HEADER_H;
        window.scrollTo({ top, behavior: 'smooth' });

        // Update URL without jump
        history.pushState(null, '', hash);
      });
    });
  }

  /* ========================================================
     Reveal on scroll (IntersectionObserver)
  ======================================================== */
  function initReveal() {
    const elements = $$('.reveal');
    if (!elements.length) return;

    // Respect reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      elements.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.08
    });

    elements.forEach(el => observer.observe(el));
  }

  /* ========================================================
     Active nav link on scroll (highlight current section)
  ======================================================== */
  function initActiveNav() {
    const sections = $$('section[id]');
    const navLinks = $$('.global-nav a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const HEADER_H = 64;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === '#' + id) {
            link.style.color = 'var(--cyan)';
          } else {
            link.style.color = '';
          }
        });
      });
    }, {
      rootMargin: `-${HEADER_H}px 0px -50% 0px`,
      threshold: 0
    });

    sections.forEach(sec => observer.observe(sec));
  }

  /* ========================================================
     Typing effect in hero eyebrow
  ======================================================== */
  function initTypingEffect() {
    const target = $('.hero-eyebrow .mono');
    if (!target) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const original = target.textContent.trim();
    target.textContent = '';
    target.style.borderRight = '2px solid var(--cyan)';
    target.style.paddingRight = '2px';

    let i = 0;
    const SPEED = 45;

    function type() {
      if (i < original.length) {
        target.textContent = original.slice(0, i + 1);
        i++;
        setTimeout(type, SPEED);
      } else {
        // Remove cursor after typing
        setTimeout(() => {
          target.style.borderRight = 'none';
          target.style.paddingRight = '0';
        }, 800);
      }
    }

    // Start after short delay
    setTimeout(type, 400);
  }

  /* ========================================================
     Hero scroll indicator: hide after scrolled
  ======================================================== */
  function initScrollIndicator() {
    const indicator = $('.hero-scroll-indicator');
    if (!indicator) return;

    const onScroll = () => {
      if (window.scrollY > 200) {
        indicator.style.opacity = '0';
        indicator.style.pointerEvents = 'none';
      } else {
        indicator.style.opacity = '0.4';
        indicator.style.pointerEvents = 'auto';
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ========================================================
     Counter animation for any [data-count] elements
     (Reserved for future use)
  ======================================================== */
  function initCounters() {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 1500;
        const step = target / (duration / 16);
        let current = 0;
        observer.unobserve(el);

        const tick = () => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current);
          if (current < target) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  /* ========================================================
     Init all
  ======================================================== */
  function init() {
    initHeader();
    initMobileNav();
    initSmoothScroll();
    initReveal();
    initActiveNav();
    initTypingEffect();
    initScrollIndicator();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
