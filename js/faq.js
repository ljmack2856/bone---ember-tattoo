document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = document.getElementById(btn.getAttribute('aria-controls'));
    const isHidden = answer.hidden;
    answer.hidden = !isHidden;
    btn.setAttribute('aria-expanded', String(isHidden));
  });
});