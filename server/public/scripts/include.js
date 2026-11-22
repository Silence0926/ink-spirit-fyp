'use strict';

async function loadComponent(id, file) {
  const target=document.getElementById(id);if(!target)return;
  try{
    const response=await fetch(file);if(!response.ok)throw new Error('HTTP '+response.status);
    target.innerHTML=await response.text();
    if(id==='navbar'&&typeof checkLoginStatus==='function')await checkLoginStatus();
  }catch(error){console.error('Unable to load component:',file,error);}
}
document.addEventListener('DOMContentLoaded',async()=>{
  await Promise.all([loadComponent('navbar','components/navbar.html'),loadComponent('footer','components/footer.html')]);
  if(!document.querySelector('link[data-music-styles]')){const style=document.createElement('link');style.rel='stylesheet';style.href='styles/music.css';style.dataset.musicStyles='true';document.head.appendChild(style);}
  if(!document.getElementById('music-btn')){const button=document.createElement('button');button.id='music-btn';button.type='button';button.className='music-toggle';button.title='Toggle original Ink Spirit soundtrack';button.setAttribute('aria-label','Toggle original Ink Spirit soundtrack');button.textContent='♫';document.body.appendChild(button);}
  if(!document.querySelector('script[data-music-player]')){const script=document.createElement('script');script.src='scripts/music.js';script.dataset.musicPlayer='true';document.body.appendChild(script);}
});
