'use strict';

(() => {
  const audio = document.getElementById('ink-spirit-audio');
  const playButton = document.getElementById('music-btn');
  const settingsButton = document.getElementById('music-settings-btn');
  const panel = document.getElementById('music-panel');
  const volume = document.getElementById('music-volume');
  const volumeValue = document.getElementById('music-volume-value');
  const status = document.getElementById('music-status');

  if (!audio || !playButton) return;
  audio.volume = 0.46;

  function render() {
    const playing = !audio.paused && !audio.ended;
    playButton.classList.toggle('playing', playing);
    playButton.textContent = playing ? '❚❚' : '♫';
    playButton.setAttribute('aria-label', playing ? '暂停原创配乐' : '播放原创配乐');
    if (status) status.textContent = playing ? '正在播放 · ORIGINAL SOUNDTRACK' : '已暂停 · READY TO PLAY';
  }

  playButton.addEventListener('click', async () => {
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
      render();
    } catch (error) {
      if (status) status.textContent = '音频无法播放，请检查浏览器支持或网络连接。';
      console.error('Ink Spirit soundtrack playback failed:', error);
    }
  });

  settingsButton?.addEventListener('click', () => {
    const isHidden = panel?.classList.toggle('hidden');
    settingsButton.setAttribute('aria-expanded', String(!isHidden));
  });

  volume?.addEventListener('input', () => {
    audio.volume = Number(volume.value) / 100;
    if (volumeValue) volumeValue.textContent = volume.value + '%';
  });

  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('ended', render);
  audio.addEventListener('error', () => {
    if (status) status.textContent = '音频资源暂时无法读取。';
    render();
  });
  render();
})();
