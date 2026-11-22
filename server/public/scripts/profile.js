'use strict';

document.addEventListener('DOMContentLoaded', () => {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('loggedInUser') || 'null'); } catch {}
  if (!user) { location.replace('login.html'); return; }
  document.getElementById('profile-username').textContent = user.username || '—';
  document.getElementById('profile-email').textContent = user.email || '—';
  document.getElementById('profile-role').textContent = user.role || 'user';
  document.getElementById('profile-logout')?.addEventListener('click', logoutUser);
});
