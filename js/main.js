document.addEventListener('DOMContentLoaded', () => {
  // Find hamburger / nav — try IDs first for backwards compatibility, then classes
  const hamburger =
    document.getElementById('hamburger') ||
    document.querySelector('.nav__hamburger') ||
    null;
  const navLinks =
    document.getElementById('nav-links') ||
    document.querySelector('.nav__links') ||
    null;

  // ===== HAMBURGER MENU =====
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      navLinks.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu on link click (mobile)
    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 860) {
          hamburger.classList.remove('open');
          navLinks.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Ensure state resets if viewport switches to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  } else {
    // Optional console hints to help debug if needed
    // console.warn('Hamburger or nav-links not found. Found:', { hamburger, navLinks });
  }

  // ===== SMOOTH SCROLL with nav offset =====
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;

      // only intercept internal anchors (skip empty '#')
      if (id === '#') return;

      e.preventDefault();
      const navbar = document.getElementById('navbar') || document.querySelector('.nav');
      const navH = navbar ? navbar.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 8;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ===== FAQ ACCORDION =====
  const questions = document.querySelectorAll('.faq__q');
  questions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling; // .faq__a
      const isOpen = btn.classList.contains('is-open');

      // close all
      questions.forEach((b) => {
        b.classList.remove('is-open');
        const a = b.nextElementSibling;
        if (a) a.classList.remove('is-open');
      });

      // open clicked if it was closed
      if (!isOpen) {
        btn.classList.add('is-open');
        if (answer) answer.classList.add('is-open');
      }
    });
  });

  // ===== ACTIVE NAV LINK ON SCROLL =====
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav__link');

  if (sections.length && navAnchors.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navAnchors.forEach((a) => a.classList.remove('active-link'));
          const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
          if (active) active.classList.add('active-link');
        });
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );

    sections.forEach((s) => observer.observe(s));
  }
});