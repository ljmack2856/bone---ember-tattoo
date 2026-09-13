// Back-to-top button: appears after scrolling past one viewport height,
// smooth-scrolls to top on click. Shared across every page.
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}