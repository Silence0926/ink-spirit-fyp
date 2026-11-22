'use strict';

function loadRolePage(requiredRole) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('loggedInUser') || 'null'); } catch {}
  const role = user?.role || localStorage.getItem('role');
  if (!user || !role) { location.replace('login.html'); return; }
  if (role !== requiredRole) { alert('Access denied.'); location.replace('user.html'); return; }
  const name = document.getElementById(requiredRole + '-name');
  if (name) name.textContent = user.username || '';
}
