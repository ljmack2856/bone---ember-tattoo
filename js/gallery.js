// Description show/hide toggle
document.querySelectorAll('.category__toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const desc = document.getElementById(btn.getAttribute('aria-controls'));
    const isHidden = desc.hidden;
    desc.hidden = !isHidden;
    btn.setAttribute('aria-expanded', String(isHidden));
    btn.querySelector('span[aria-hidden]').textContent = isHidden ? '\u2212' : '+';
  });
});

// Rotating main + 3-thumbnail conveyor carousel.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROLES = ['role-main', 'role-thumb-a', 'role-thumb-b', 'role-thumb-c'];

document.querySelectorAll('.category__visual').forEach(visual => {
  const slides = Array.from(visual.querySelectorAll('.category__slide'));
  const dots = Array.from(visual.querySelectorAll('.category__dot'));
  if (slides.length < 4) return;

  let order = [...slides];
  let timer = null;

  function applyRoles() {
    order.forEach((slide, i) => {
      ROLES.forEach(r => slide.classList.remove(r));
      slide.classList.add(ROLES[i]);

      // Thumbnails (everything but the main slot) become clickable
      // and keyboard-focusable; the main image is not a control.
      if (i === 0) {
        slide.removeAttribute('role');
        slide.removeAttribute('tabindex');
        slide.removeAttribute('aria-label');
      } else {
        slide.setAttribute('role', 'button');
        slide.setAttribute('tabindex', '0');
        slide.setAttribute('aria-label', 'Show this image larger');
      }
    });
    const mainIndex = Number(order[0].dataset.index);
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === mainIndex));
  }

  function rotate() {
    order = [order[1], order[2], order[3], order[0]];
    applyRoles();
  }

  function jumpTo(targetIndex) {
    const pos = order.findIndex(s => Number(s.dataset.index) === targetIndex);
    if (pos <= 0) return;
    for (let i = 0; i < pos; i++) {
      order = [order[1], order[2], order[3], order[0]];
    }
    applyRoles();
  }

  function start() {
    if (prefersReducedMotion || timer) return;
    timer = setInterval(rotate, 3500);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      jumpTo(i);
      stop();
      start();
    });
  });

  // Clicking or keyboard-activating a thumbnail image brings it forward.
  slides.forEach(slide => {
    slide.addEventListener('click', () => {
      jumpTo(Number(slide.dataset.index));
      stop();
      start();
    });
    slide.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        jumpTo(Number(slide.dataset.index));
        stop();
        start();
      }
    });
  });

  applyRoles();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        start();
      } else {
        stop();
      }
    });
  }, { threshold: 0.4 });

  observer.observe(visual);
});