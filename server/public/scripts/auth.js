'use strict';

async function apiRequest(url, options = {}) {
  const response = await fetch(url, { credentials:'same-origin', ...options, headers:{ ...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
async function registerUser(username, email, password) {
  try {
    const result = await apiRequest('/api/register',{method:'POST',body:JSON.stringify({username,email,password})});
    localStorage.setItem('loggedInUser',JSON.stringify(result.user));
    localStorage.setItem('isLoggedIn','true');
    localStorage.setItem('role',result.user.role);
    location.href='user.html';
  } catch(error) { alert(error.message); }
}
async function loginUser(username,password) {
  try {
    const result = await apiRequest('/api/login',{method:'POST',body:JSON.stringify({username,password})});
    localStorage.setItem('loggedInUser',JSON.stringify(result.user));
    localStorage.setItem('isLoggedIn','true');
    localStorage.setItem('role',result.user.role);
    location.href=result.user.role==='admin'?'admin.html':result.user.role==='manager'?'manager.html':'user.html';
  } catch(error) { alert(error.message); }
}
async function logoutUser() {
  try { await apiRequest('/api/logout',{method:'POST'}); } catch {}
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('role');
  location.href='login.html';
}
async function checkLoginStatus() {
  const loginLink=document.getElementById('login-link');
  const userDisplay=document.getElementById('user-display');
  const logoutBtn=document.getElementById('logout-btn');
  const adminNav=document.getElementById('admin-nav-link');
  if(!loginLink||!userDisplay||!logoutBtn)return;
  try {
    const result=await apiRequest('/api/me');
    localStorage.setItem('loggedInUser',JSON.stringify(result.user));
    loginLink.hidden=true; logoutBtn.hidden=false; userDisplay.textContent=result.user.username;
    const profileLink=document.getElementById('profile-link');
    if(profileLink)profileLink.hidden=false;
    if(adminNav)adminNav.hidden=!['admin','manager'].includes(result.user.role);
  } catch {
    localStorage.removeItem('loggedInUser');localStorage.removeItem('isLoggedIn');localStorage.removeItem('role');
    loginLink.hidden=false;logoutBtn.hidden=true;userDisplay.textContent='';
    if(adminNav)adminNav.hidden=true;
  }
}
