'use strict';
document.addEventListener('DOMContentLoaded', async () => {
  const cards = [...document.querySelectorAll('[data-habitat]')];
  const count = document.getElementById('realm-count');
  const bar = document.getElementById('realm-progress-bar');
  const status = document.getElementById('realm-status');
  const ids = cards.map(card => card.dataset.habitat);
  const guestKey = 'inkSpiritExplorationV1';
  let authenticated = false;
  let discovered = [];

  function render() {
    count.textContent = discovered.length + ' / ' + ids.length;
    bar.style.width = (discovered.length / ids.length * 100) + '%';
    cards.forEach(card => {
      const found = discovered.includes(card.dataset.habitat);
      card.classList.toggle('discovered', found);
      const button = card.querySelector('[data-discover]');
      button.textContent = found ? '已收入探索手札' : '踏入此境';
      button.disabled = found;
    });
  }
  function readGuest() {
    try {
      const saved = JSON.parse(localStorage.getItem(guestKey) || '[]');
      return Array.isArray(saved) ? ids.filter(id => saved.includes(id)) : [];
    } catch { return []; }
  }
  try {
    const me = await fetch('/api/me', { credentials:'same-origin' });
    authenticated = me.ok;
    if (authenticated) {
      const response = await fetch('/api/exploration/progress', { credentials:'same-origin' });
      if (!response.ok) throw new Error('无法读取服务器探索记录。');
      const data = await response.json();
      discovered = ids.filter(id => data.discovered.includes(id));
      status.textContent = '探索记录已与账号同步。首次发现灵境可为当前伙伴获得 25 点灵息。';
    } else {
      discovered = readGuest();
      status.textContent = '访客模式：探索记录保存在当前浏览器。登录后可使用账号同步与灵息奖励。';
    }
  } catch (error) {
    discovered = readGuest();
    status.textContent = '暂时无法连接服务器，已切换为本地访客记录。';
  }
  render();

  cards.forEach(card => {
    const button = card.querySelector('[data-discover]');
    button.addEventListener('click', async () => {
      const habitatId = button.dataset.discover;
      if (discovered.includes(habitatId)) return;
      button.disabled = true;
      const original = button.textContent;
      button.textContent = '正在记录……';
      try {
        if (authenticated) {
          const response = await fetch('/api/exploration/discover', {
            method:'POST',
            credentials:'same-origin',
            headers:{ 'content-type':'application/json' },
            body:JSON.stringify({ habitatId })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || '探索记录失败。');
          discovered = ids.filter(id => data.exploration.discovered.includes(id));
          status.textContent = data.alreadyDiscovered
            ? '这处灵境已在你的探索手札中。'
            : '初见成功：当前伙伴获得 ' + data.reward + ' 点灵息。';
        } else {
          discovered.push(habitatId);
          discovered = ids.filter(id => discovered.includes(id));
          localStorage.setItem(guestKey, JSON.stringify(discovered));
          status.textContent = '已记录这次访境。登录后可将探索与伙伴成长同步至账号。';
        }
        render();
      } catch (error) {
        button.disabled = false;
        button.textContent = original;
        status.textContent = error.message || '探索记录失败，请稍后重试。';
      }
    });
  });
});