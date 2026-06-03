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


// ===== TALKS: expandable rows =====
// ===== TALKS: reliable expandable rows (replace previous implementation) =====
(function initTalkExpanders() {
  const talksSection = document.getElementById('talks');
  if (!talksSection) return;

  const rows = Array.from(talksSection.querySelectorAll('.scheduleList .row'));
  if (!rows.length) return;

  // hint
  const h2 = talksSection.querySelector('.h2');
  if (h2 && !talksSection.querySelector('.hint')) {
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Click a talk to expand for more details';
    h2.insertAdjacentElement('afterend', hint);
  }

  // ensure details exist for every row
  rows.forEach(row => {
    if (!row.querySelector('.talk__details')) {
      const details = document.createElement('div');
      details.className = 'talk__details';
      details.innerHTML = `<p><strong>About this talk:</strong> Placeholder description. Replace with real content.</p><ul><li>Key takeaway #1</li><li>Key takeaway #2</li></ul>`;
      row.appendChild(details);
    }
  });

  function closeRow(row) {
    const details = row.querySelector('.talk__details');
    if (!details) return;
    // set to current height then animate to 0 for smooth close
    details.style.maxHeight = details.scrollHeight + 'px';
    requestAnimationFrame(() => {
      details.style.maxHeight = '0px';
    });
    row.classList.remove('is-open');
    row.setAttribute('aria-expanded', 'false');
  }

  function openRow(row) {
    const details = row.querySelector('.talk__details');
    if (!details) return;
    row.classList.add('is-open');
    row.setAttribute('aria-expanded', 'true');

    // force style so scrollHeight includes padding added by CSS .is-open
    // ensure the element is measurable
    details.style.display = 'block';
    // force reflow
    void details.offsetHeight;
    // set maxHeight to content height to animate open
    details.style.maxHeight = details.scrollHeight + 'px';
  }

  function closeAll() {
    rows.forEach(r => {
      if (r.classList.contains('is-open')) closeRow(r);
    });
  }

  rows.forEach(row => {
    const details = row.querySelector('.talk__details');

    // initial collapsed state
    details.style.maxHeight = '0px';
    details.style.overflow = 'hidden';

    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-expanded', 'false');

    row.addEventListener('click', (e) => {
      if (e.target.closest('a')) return; // ignore link clicks
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

    // cleanup after transition: clear inline maxHeight when fully closed
    details.addEventListener('transitionend', () => {
      if (!row.classList.contains('is-open')) {
        details.style.maxHeight = '0px';
      } else {
        // keep the explicit maxHeight so large content doesn't collapse during repaint
        details.style.maxHeight = details.scrollHeight + 'px';
      }
    });
  });

  // optional: close all on large resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1200) closeAll();
  });
})();