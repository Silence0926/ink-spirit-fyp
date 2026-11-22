'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  if (!loginBtn) return;
  loginBtn.addEventListener('click', () => {
    const username = document.getElementById('username')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    if (!username || !password) {
      alert('Please enter both username and password.');
      return;
    }
    loginUser(username, password);
  });
});
