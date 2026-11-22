'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const registerBtn = document.getElementById('register-btn');
  if (!registerBtn) return;
  registerBtn.addEventListener('click', () => {
    const username = document.getElementById('username')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    if (!username || !password) {
      alert('Please enter a username and password.');
      return;
    }
    registerUser(username, email, password);
  });
});
