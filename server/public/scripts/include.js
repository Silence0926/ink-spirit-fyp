'use strict';

async function loadComponent(id, file) {
  const target = document.getElementById(id);
  if (!target) return;
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    target.innerHTML = await response.text();
    if (id === 'navbar') {
      if (typeof checkLoginStatus === 'function') checkLoginStatus();
      const logout = document.getElementById('logout-btn');
      logout?.addEventListener('click', () => {
        if (typeof logoutUser === 'function') logoutUser();
      });
    }
  } catch (error) {
    console.error('Unable to load component:', file, error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadComponent('navbar', 'components/navbar.html'),
    loadComponent('footer', 'components/footer.html')
  ]);
});
