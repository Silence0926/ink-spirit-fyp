'use strict';

(() => {
  const STORAGE_KEY = 'inkSpirit.progress.v1';
  const creatures = {
    koi: { id:'koi', name:'锦鲤', title:'锦鲤 · 鲤鱼灵', habitat:'栖于烟雨荷塘', scene:'烟雨荷塘 / LOTUS POND', bond:'锦鲤 · 初见', folio:'001', reward:10, art:'<svg viewBox="0 0 420 260" aria-hidden="true"><g fill="#222820" opacity=".88"><path d="M94 130Q145 64 250 104Q294 120 320 93Q310 130 346 150Q300 158 278 178Q184 222 105 157Z"/><path d="M112 130L45 78Q62 131 45 184Z"/><path d="M180 103Q200 48 244 84L218 112Z" opacity=".55"/><path d="M190 165Q225 221 265 181L236 155Z" opacity=".6"/></g><path d="M120 136Q210 115 300 139" stroke="#e7e2d6" stroke-width="4" opacity=".45" fill="none"/><circle cx="285" cy="128" r="5" fill="#eee9dc"/><circle cx="286" cy="128" r="2.5" fill="#252923"/><path d="M105 137Q75 120 61 101M105 147Q72 160 60 177" stroke="#282e27" stroke-width="3" fill="none" opacity=".6"/></svg>' },
    dragon: { id:'dragon', name:'青龙', title:'青龙 · 云海之灵', habitat:'栖于云海山巅', scene:'云海山巅 / CLOUD PEAK', bond:'青龙 · 初见', folio:'002', reward:10, art:'<svg viewBox="0 0 420 260" aria-hidden="true"><g fill="none" stroke="#252b25" stroke-linecap="round" stroke-linejoin="round"><path d="M54 180Q105 45 190 115T340 90Q385 62 354 35Q332 14 315 45Q302 67 327 72" stroke-width="20"/><path d="M70 178Q145 225 212 160T337 130" stroke-width="13"/><path d="M320 92L355 65L375 89L404 85L381 111L399 129L362 123L345 148L339 116Z" fill="#252b25"/><path d="M355 66L367 30L381 69M338 75L315 42L321 84" stroke-width="8"/><path d="M120 100L90 48L155 80M210 125L240 65L254 132" stroke-width="9"/><path d="M95 190Q180 240 270 185" stroke-width="3" opacity=".5"/></g><circle cx="365" cy="99" r="4" fill="#eee9dc"/></svg>' },
    snake: { id:'snake', name:'灵蛇', title:'灵蛇 · 幽篁之灵', habitat:'栖于幽篁竹林', scene:'幽篁竹林 / BAMBOO GROVE', bond:'灵蛇 · 初见', folio:'003', reward:10, art:'<svg viewBox="0 0 420 260" aria-hidden="true"><path d="M95 215Q42 175 112 137Q185 98 254 155Q330 215 340 139Q350 74 280 78Q220 80 240 37" fill="none" stroke="#252a24" stroke-width="27" stroke-linecap="round"/><path d="M238 45Q260 10 295 27Q321 41 302 66L278 83L245 69Z" fill="#252a24"/><path d="M292 32L315 18L307 43" stroke="#252a24" stroke-width="7" fill="none"/><path d="M290 50l28 3" stroke="#eee9dc" stroke-width="3"/><circle cx="287" cy="43" r="4" fill="#eee9dc"/><path d="M85 213Q160 250 240 209" fill="none" stroke="#252a24" stroke-width="3" opacity=".4"/></svg>' },
    turtle: { id:'turtle', name:'玄龟', title:'玄龟 · 静水之灵', habitat:'栖于静水泽地', scene:'静水泽地 / QUIET MARSH', bond:'玄龟 · 初见', folio:'004', reward:10, art:'<svg viewBox="0 0 420 260" aria-hidden="true"><g fill="#252a24"><path d="M94 151Q100 75 210 72Q313 76 326 153Q286 207 155 200Q108 190 94 151Z"/><path d="M304 129Q355 105 380 130Q392 150 365 166L320 164Z"/><path d="M120 177L92 211L137 204L157 186M263 186L290 215L310 192L292 170" /></g><path d="M115 145Q125 91 208 88Q291 89 306 148Q275 180 160 180Q128 174 115 145Z" fill="none" stroke="#eee9dc" stroke-width="4" opacity=".48"/><path d="M210 90L210 180M151 105L178 177M269 105L243 177M120 143L300 143" stroke="#eee9dc" stroke-width="3" opacity=".35"/><circle cx="366" cy="136" r="4" fill="#eee9dc"/></svg>' }
  };

  const defaultProgress = () => Object.fromEntries(Object.keys(creatures).map(id => [id, { experience:0, level:1, visits:0 }]));
  function loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return defaultProgress();
      const base = defaultProgress();
      for (const id of Object.keys(creatures)) {
        const p = parsed[id];
        if (p && Number.isInteger(p.experience) && p.experience >= 0 && Number.isInteger(p.level) && p.level >= 1) {
          base[id] = { experience:p.experience, level:p.level, visits:Number.isInteger(p.visits) && p.visits >= 0 ? p.visits : 0 };
        }
      }
      return base;
    } catch { return defaultProgress(); }
  }

  let progress = loadProgress();
  let selected = creatures[localStorage.getItem('inkSpirit.selected') ] ? localStorage.getItem('inkSpirit.selected') : 'koi';
  const $ = id => document.getElementById(id);
  const threshold = level => level * 100;

  function renderProgress() {
    const p = progress[selected];
    const needed = threshold(p.level);
    $('level').textContent = 'LV. ' + p.level;
    $('xp-text').textContent = p.experience + ' / ' + needed + ' 灵息';
    $('xp-bar').style.width = Math.min(100, p.experience / needed * 100) + '%';
    $('bond-name').textContent = creatures[selected].bond;
  }

  function selectCreature(id) {
    if (!creatures[id]) return;
    selected = id;
    localStorage.setItem('inkSpirit.selected', id);
    const c = creatures[id];
    $('creature-art').innerHTML = c.art;
    $('creature-art').setAttribute('aria-label', c.title);
    $('scene-label').textContent = c.scene;
    $('creature-title').textContent = c.title;
    $('creature-habitat').textContent = c.habitat;
    $('folio').textContent = c.folio;
    document.querySelectorAll('.creature-card').forEach(card => {
      const active = card.dataset.creature === id;
      card.classList.toggle('selected', active);
      card.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('.mountain-scene').style.opacity = id === 'dragon' ? '.32' : '0';
    document.querySelector('.bamboo-scene').style.opacity = id === 'snake' ? '.34' : '0';
    $('painting').dataset.scene = id;
    renderProgress();
  }

  document.querySelectorAll('.creature-card').forEach(card => {
    card.addEventListener('click', () => selectCreature(card.dataset.creature));
  });

  $('interact-button').addEventListener('click', () => {
    const p = progress[selected];
    p.experience += creatures[selected].reward;
    p.visits += 1;
    while (p.experience >= threshold(p.level)) {
      p.experience -= threshold(p.level);
      p.level += 1;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    renderProgress();
    $('progress-note').textContent = '灵息增加了 ' + creatures[selected].reward + ' 点。你与' + creatures[selected].name + '的羁绊更深了。';
    $('creature-art').animate([{transform:'translateY(0) scale(1)'},{transform:'translateY(-18px) scale(1.04)'},{transform:'translateY(0) scale(1)'}], {duration:650,easing:'ease-out'});
  });

  selectCreature(selected);
})();
