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
(function initTalkExpanders() {
  const talksSection = document.getElementById('talks');
  if (!talksSection) return;

  const rows = talksSection.querySelectorAll('.scheduleList .row');
  if (!rows.length) return;

  // Provide a hint under the H2 if not already present
  const h2 = talksSection.querySelector('.h2');
  if (h2 && !talksSection.querySelector('.hint')) {
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Click a talk to expand for more details';
    h2.insertAdjacentElement('afterend', hint);
  }

  // helper to close all open rows
  function closeAll() {
    rows.forEach(r => {
      if (r.classList.contains('is-open')) {
        const details = r.querySelector('.talk__details');
        if (details) details.style.maxHeight = null;
        r.classList.remove('is-open');
        r.setAttribute('aria-expanded', 'false');
      }
    });
  }

  rows.forEach((row) => {
    // make keyboard accessible and ARIA-friendly
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-expanded', 'false');

    // if details block not present, inject placeholder content
    if (!row.querySelector('.talk__details')) {
      const details = document.createElement('div');
      details.className = 'talk__details';
      details.innerHTML = `
        <p><strong>About this talk:</strong> This is placeholder text describing the talk — what it covers, the format and who it is best for. Replace with real content.</p>
        <ul>
          <li>Key takeaway #1</li>
          <li>Key takeaway #2</li>
          <li>Audience: beginners to intermediate</li>
        </ul>
      `;
      row.appendChild(details);
    }

    const details = row.querySelector('.talk__details');

    // Toggle on click (closes others)
    row.addEventListener('click', (e) => {
      // ignore clicks on actual links inside the row (if any)
      if (e.target.closest('a')) return;

      const isOpen = row.classList.contains('is-open');
      closeAll();
      if (!isOpen) {
        row.classList.add('is-open');
        row.setAttribute('aria-expanded', 'true');
        // set maxHeight to enable CSS transition
        details.style.maxHeight = details.scrollHeight + 'px';
      }
    });

    // Keyboard: Enter or Space toggles
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    });

    // When transition ends and row closed, remove inline maxHeight
    details.addEventListener('transitionend', () => {
      if (!row.classList.contains('is-open')) {
        details.style.maxHeight = null;
      }
    });
  });

  // Close all if user resizes to very small/large (optional)
  window.addEventListener('resize', () => {
    // keep state conservative on resize
    if (window.innerWidth > 1200) closeAll();
  });
})();