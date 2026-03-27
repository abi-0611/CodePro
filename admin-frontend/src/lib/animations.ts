/**
 * Scroll-reveal observer — mirrors main site's ScrollReveal.astro logic.
 * Call `initAdminAnimations()` once per page after DOM is ready.
 */
export function initAdminAnimations(): void {
  // ── Reveal on scroll ──
  const revealEls = document.querySelectorAll(
    '.admin-reveal, .admin-reveal-left, .admin-reveal-right, .admin-reveal-scale'
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));

  // ── Cursor glow (desktop / fine pointer only) ──
  if (window.matchMedia('(pointer: fine)').matches) {
    const existing = document.querySelector('.admin-cursor-glow');
    if (!existing) {
      const glow = document.createElement('div');
      glow.className = 'admin-cursor-glow';
      glow.setAttribute('aria-hidden', 'true');
      document.body.appendChild(glow);

      let raf = 0;
      window.addEventListener(
        'mousemove',
        (e) => {
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            glow.style.left = `${e.clientX}px`;
            glow.style.top  = `${e.clientY}px`;
          });
        },
        { passive: true }
      );
    }
  }

  // ── Number counter animation ──
  const counters = document.querySelectorAll<HTMLElement>('[data-count-to]');
  const counterObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        if (el.dataset.animated === 'true') return;
        el.dataset.animated = 'true';
        animateCount(el);
        counterObs.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((el) => counterObs.observe(el));
}

function animateCount(el: HTMLElement): void {
  const target  = Number(el.dataset.countTo  ?? 0);
  const suffix  = el.dataset.suffix ?? '';
  const duration = Number(el.dataset.duration ?? 1600);

  if (!Number.isFinite(target) || target <= 0) {
    el.textContent = `${target}${suffix}`;
    return;
  }

  const start = performance.now();
  const tick = (now: number) => {
    const t    = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = `${Math.round(target * ease)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
