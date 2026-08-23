(function () {
  if (typeof accountRole !== 'undefined' && accountRole === 'customer') {
    document.getElementById('customerViewLink')?.remove();
    return;
  }

  const profile = document.getElementById('profileView');
  if (!profile || document.getElementById('customerViewLink')) return;
  const button = document.createElement('button');
  button.id = 'customerViewLink';
  button.className = 'secondary-action';
  button.textContent = 'Open customer view';
  button.onclick = () => {
    localStorage.setItem('velora-account-role', 'customer');
    window.location.assign(new URL('store.html', window.location.href).href);
  };
  profile.appendChild(button);
})();
