'use strict';

async function registerUser(username, email, password) {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Registration failed.');
    alert('Registration successful. You can now log in.');
    window.location.href = 'login.html';
  } catch (error) {
    alert(error.message || 'Unable to register. Please try again.');
  }
}

async function loginUser(username, password) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Invalid username or password.');
    localStorage.setItem('loggedInUser', JSON.stringify(result.user));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('role', result.user.role);
    alert('Welcome back, ' + result.user.username + '!');
    window.location.href = result.user.role === 'admin' ? 'admin.html'
      : result.user.role === 'manager' ? 'manager.html' : 'user.html';
  } catch (error) {
    alert(error.message || 'Unable to log in. Please try again.');
  }
}

function logoutUser() {
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('role');
  window.location.href = 'login.html';
}

function checkLoginStatus() {
  const loginLink = document.getElementById('login-link');
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('loggedInUser') || 'null'); } catch {}
  if (!loginLink || !userDisplay || !logoutBtn) return;
  if (user && user.username) {
    loginLink.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    userDisplay.textContent = user.username;
  } else {
    loginLink.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    userDisplay.textContent = '';
  }
}
