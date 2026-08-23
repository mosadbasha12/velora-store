(function () {
  const main = document.querySelector('.main-content');
  if (!main) return;
  const reset = () => { main.scrollTop = 0; main.scrollLeft = 0; };
  reset();
  document.addEventListener('click', (event) => {
    const item = event.target.closest('[data-section]');
    if (!item) return;
    reset();
    setTimeout(reset, 0);
  }, true);
})();
