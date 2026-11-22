'use strict';

async function initializeMusicPlayer() {
  const button = document.getElementById('music-btn');
  if (!button) return;

  const audio = new Audio();
  let playlist = [];
  let index = 0;
  let panel = document.getElementById('music-panel');
  if (!panel) {
    panel = document.createElement('aside');
    panel.id = 'music-panel';
    panel.className = 'music-panel hidden';
    panel.setAttribute('aria-label', 'Music playlist');
    document.body.appendChild(panel);
  }

  const play = async nextIndex => {
    if (!playlist.length) return;
    index = nextIndex;
    audio.src = playlist[index];
    try {
      await audio.play();
      button.classList.add('playing');
    } catch (error) {
      console.warn('Browser blocked audio playback until user interaction.', error);
    }
  };

  const render = () => {
    panel.replaceChildren();
    if (!playlist.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No MP3 files found in server/public/music/.';
      panel.appendChild(empty);
      return;
    }
    const list = document.createElement('ul');
    playlist.forEach((src, itemIndex) => {
      const li = document.createElement('li');
      const track = document.createElement('button');
      track.type = 'button';
      track.textContent = decodeURIComponent(src.split('/').pop());
      track.addEventListener('click', () => play(itemIndex));
      li.appendChild(track);
      list.appendChild(li);
    });
    panel.appendChild(list);
  };

  try {
    const response = await fetch('/api/music');
    if (!response.ok) throw new Error('Music API returned ' + response.status);
    playlist = await response.json();
    render();
  } catch (error) {
    console.error('Unable to load music playlist.', error);
  }

  button.addEventListener('click', async () => {
    if (!playlist.length) {
      panel.classList.toggle('hidden');
      return;
    }
    if (audio.paused) {
      if (!audio.src) await play(index);
      else {
        try { await audio.play(); button.classList.add('playing'); } catch {}
      }
    } else {
      audio.pause();
      button.classList.remove('playing');
    }
  });
  button.addEventListener('dblclick', () => panel.classList.toggle('hidden'));
  audio.addEventListener('ended', () => play((index + 1) % playlist.length));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMusicPlayer, { once: true });
} else {
  initializeMusicPlayer();
}
