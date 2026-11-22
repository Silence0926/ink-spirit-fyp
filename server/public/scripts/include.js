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
  if (!document.querySelector('link[data-music-styles]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'styles/music.css';
    style.dataset.musicStyles = 'true';
    document.head.appendChild(style);
  }
  if (!document.getElementById('music-btn')) {
    const musicButton = document.createElement('button');
    musicButton.id = 'music-btn';
    musicButton.type = 'button';
    musicButton.className = 'music-toggle';
    musicButton.title = 'Play / pause background music';
    musicButton.setAttribute('aria-label', 'Play or pause background music');
    musicButton.textContent = '♫';
    document.body.appendChild(musicButton);
  }
  if (!document.querySelector('script[data-music-player]')) {
    const player = document.createElement('script');
    player.src = 'scripts/music.js';
    player.dataset.musicPlayer = 'true';
    document.body.appendChild(player);
  }
});
