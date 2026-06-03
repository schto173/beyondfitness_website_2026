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

  // Ensure each details block is set up for animation
  rows.forEach(row => {
    const details = row.querySelector('.talk__details');
    if (!details) return;
    details.style.overflow = 'hidden';
    details.style.maxHeight = '0px';
    // make sure box-sizing is included if not already
    details.style.boxSizing = details.style.boxSizing || 'border-box';

    // If there are images inside details, update height when they load
    details.querySelectorAll('img').forEach(img => {
      img.addEventListener('load', () => {
        if (row.classList.contains('is-open')) {
          // recalc to fit newly loaded media
          details.style.maxHeight = details.scrollHeight + 'px';
        }
      });
    });
  });

  // helper: close a single row (animates)
  function closeRow(r) {
    const details = r.querySelector('.talk__details');
    if (!details) {
      r.classList.remove('is-open');
      r.setAttribute('aria-expanded', 'false');
      return;
    }

    // If maxHeight was 'none' (no limit), set it to current height so we can animate to 0
    if (details.style.maxHeight === 'none') {
      details.style.maxHeight = details.scrollHeight + 'px';
    }

    // Animate from current height -> 0
    // Force a style flush to ensure browser acknowledges the start value
    details.style.transition = details.style.transition || '';
    details.style.overflow = 'hidden';
    // start from measured height (handle cases where it wasn't set)
    details.style.maxHeight = details.scrollHeight + 'px';
    requestAnimationFrame(() => {
      details.style.maxHeight = '0px';
    });

    r.classList.remove('is-open');
    r.setAttribute('aria-expanded', 'false');
  }

  // helper: open a single row (animates)
  function openRow(r) {
    const details = r.querySelector('.talk__details');
    if (!details) {
      r.classList.add('is-open');
      r.setAttribute('aria-expanded', 'true');
      return;
    }

    // add class first so CSS (padding etc.) takes effect and contributes to scrollHeight
    r.classList.add('is-open');
    r.setAttribute('aria-expanded', 'true');

    // Ensure details is visible for measurement
    details.style.display = 'block';
    // Force reflow so scrollHeight includes any styles/padding applied by .is-open
    void details.offsetHeight;

    // Set explicit maxHeight to scrollHeight to animate open
    details.style.overflow = 'hidden';
    details.style.maxHeight = details.scrollHeight + 'px';

    // After transition finishes we set maxHeight to 'none' so content can grow naturally
  }

  // close all (use animated close)
  function closeAll() {
    rows.forEach(r => {
      if (r.classList.contains('is-open')) closeRow(r);
    });
  }

  // Attach handlers
  rows.forEach((row) => {
    const details = row.querySelector('.talk__details');

    // accessibility
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-expanded', 'false');

    // click toggler (ignores clicks on links)
    row.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const isOpen = row.classList.contains('is-open');
      closeAll();
      if (!isOpen) openRow(row);
    });

    // keyboard support
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    });

    // After transition end, tidy inline styles
    if (details) {
      details.addEventListener('transitionend', (ev) => {
        // only handle max-height transitions
        if (ev.propertyName !== 'max-height') return;

        if (row.classList.contains('is-open')) {
          // fully opened -> remove maxHeight limit so content can expand naturally
          details.style.maxHeight = 'none';
          details.style.overflow = ''; // let CSS decide
        } else {
          // fully closed -> keep maxHeight 0 for consistency
          details.style.maxHeight = '0px';
          details.style.overflow = 'hidden';
        }
      });
    }
  });

  // Optional: close all when viewport gets wide
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1200) closeAll();
  });
})();