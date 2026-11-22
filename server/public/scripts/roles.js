'use strict';
async function loadRolePage(requiredRole){
 try{const response=await fetch('/api/me',{credentials:'same-origin'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Login required');if(data.user.role!==requiredRole){alert('Access denied.');location.replace(data.user.role==='admin'?'admin.html':data.user.role==='manager'?'manager.html':'user.html');return;}const target=document.getElementById(requiredRole+'-name');if(target)target.textContent=data.user.username;}catch{location.replace('login.html');}
}
