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


// ===== TALKS: expandable rows =====(function initTalkExpanders() {
  document.addEventListener('DOMContentLoaded', () => {
  (function initTalkExpanders() {
    const talksSection = document.getElementById('talks');
    if (!talksSection) return;

    const rows = Array.from(talksSection.querySelectorAll('.scheduleList .row'));
    if (!rows.length) return;

    // Provide a hint under the H2 if not already present
    const h2 = talksSection.querySelector('.h2');
    if (h2 && !talksSection.querySelector('.hint')) {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = 'Click a talk to expand for more details';
      h2.insertAdjacentElement('afterend', hint);
    }

    rows.forEach(row => {
      const details = row.querySelector('.talk__details');
      if (!details) return;
      details.style.overflow = 'hidden';
      details.style.maxHeight = '0px';
      details.style.boxSizing = details.style.boxSizing || 'border-box';
      details.querySelectorAll('img').forEach(img => {
        img.addEventListener('load', () => {
          if (row.classList.contains('is-open')) {
            details.style.maxHeight = details.scrollHeight + 'px';
          }
        });
      });
    });

    function closeRow(r) {
      const details = r.querySelector('.talk__details');
      if (!details) {
        r.classList.remove('is-open');
        r.setAttribute('aria-expanded', 'false');
        return;
      }
      if (details.style.maxHeight === 'none') {
        details.style.maxHeight = details.scrollHeight + 'px';
      }
      details.style.overflow = 'hidden';
      details.style.maxHeight = details.scrollHeight + 'px';
      requestAnimationFrame(() => {
        details.style.maxHeight = '0px';
      });
      r.classList.remove('is-open');
      r.setAttribute('aria-expanded', 'false');
    }

    function openRow(r) {
      const details = r.querySelector('.talk__details');
      if (!details) {
        r.classList.add('is-open');
        r.setAttribute('aria-expanded', 'true');
        return;
      }
      r.classList.add('is-open');
      r.setAttribute('aria-expanded', 'true');
      details.style.display = 'block';
      void details.offsetHeight;
      details.style.overflow = 'hidden';
      details.style.maxHeight = details.scrollHeight + 'px';
    }

    function closeAll() {
      rows.forEach(r => {
        if (r.classList.contains('is-open')) closeRow(r);
      });
    }

    rows.forEach((row) => {
      const details = row.querySelector('.talk__details');
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-expanded', 'false');

      row.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        const isOpen = row.classList.contains('is-open');
        closeAll();
        if (!isOpen) openRow(row);
      });

      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          row.click();
        }
      });

      if (details) {
        details.addEventListener('transitionend', (ev) => {
          if (ev.propertyName !== 'max-height') return;
          if (row.classList.contains('is-open')) {
            details.style.maxHeight = 'none';
            details.style.overflow = '';
          } else {
            details.style.maxHeight = '0px';
            details.style.overflow = 'hidden';
          }
        });
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1200) closeAll();
    });
  })();
});