// ===== HAMBURGER MENU =====
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");

hamburger.addEventListener("click", () => {
  const isOpen = hamburger.classList.toggle("open");
  navLinks.classList.toggle("open", isOpen);
  hamburger.setAttribute("aria-expanded", String(isOpen));
});

// Close menu on link click (mobile)
navLinks.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  });
});

// ===== SMOOTH SCROLL with nav offset =====
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const id = this.getAttribute("href");
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    const navH = document.getElementById("navbar").offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 8;

    window.scrollTo({ top, behavior: "smooth" });
  });
});

// ===== FAQ ACCORDION =====
const questions = document.querySelectorAll(".faq__q");
questions.forEach((btn) => {
  btn.addEventListener("click", () => {
    const answer = btn.nextElementSibling; // .faq__a
    const isOpen = btn.classList.contains("is-open");

    // close all
    questions.forEach((b) => {
      b.classList.remove("is-open");
      const a = b.nextElementSibling;
      if (a) a.classList.remove("is-open");
    });

    // open clicked if it was closed
    if (!isOpen) {
      btn.classList.add("is-open");
      if (answer) answer.classList.add("is-open");
    }
  });
});

// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll("section[id]");
const navAnchors = document.querySelectorAll(".nav__link");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navAnchors.forEach((a) => a.classList.remove("active-link"));
      const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
      if (active) active.classList.add("active-link");
    });
  },
  { rootMargin: "-35% 0px -55% 0px" }
);

sections.forEach((s) => observer.observe(s));