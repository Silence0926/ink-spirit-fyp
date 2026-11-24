'use strict';

(() => {
  const STORAGE_KEY = 'inkSpirit.progress.v1';
  const creatures = {
    koi: { id:'koi', name:'锦鲤', title:'锦鲤 · 鲤鱼灵', habitat:'栖于烟雨荷塘', scene:'烟雨荷塘 / LOTUS POND', bond:'锦鲤 · 初见', folio:'001', reward:10, temperament:'灵动 · 亲和', idleBehavior:'沿着水纹轻轻游弋，偶尔追逐落在水面的光点。', interactionText:'锦鲤绕着你游了一圈，水面漾开细细涟漪。', art:'<svg viewBox="0 0 420 260" aria-hidden="true"><g fill="#222820" opacity=".88"><path d="M94 130Q145 64 250 104Q294 120 320 93Q310 130 346 150Q300 158 278 178Q184 222 105 157Z"/><path d="M112 130L45 78Q62 131 45 184Z"/><path d="M180 103Q200 48 244 84L218 112Z" opacity=".55"/><path d="M190 165Q225 221 265 181L236 155Z" opacity=".6"/></g><path d="M120 136Q210 115 300 139" stroke="#e7e2d6" stroke-width="4" opacity=".45" fill="none"/><circle cx="285" cy="128" r="5" fill="#eee9dc"/><circle cx="286" cy="128" r="2.5" fill="#252923"/><path d="M105 137Q75 120 61 101M105 147Q72 160 60 177" stroke="#282e27" stroke-width="3" fill="none" opacity=".6"/></svg>' },
    dragon: { id:'dragon', name:'青龙', title:'青龙 · 云海之灵', habitat:'栖于云海山巅', scene:'云海山巅 / CLOUD PEAK', bond:'青龙 · 初见', folio:'002', reward:10, temperament:'威严 · 守护', idleBehavior:'静卧云端，感知风向；云雾会随它的呼吸缓缓流动。', interactionText:'青龙昂首回应，周围云雾随之舒展。', art:'<svg viewBox="0 0 420 260" aria-hidden="true"><g fill="none" stroke="#252b25" stroke-linecap="round" stroke-linejoin="round"><path d="M54 180Q105 45 190 115T340 90Q385 62 354 35Q332 14 315 45Q302 67 327 72" stroke-width="20"/><path d="M70 178Q145 225 212 160T337 130" stroke-width="13"/><path d="M320 92L355 65L375 89L404 85L381 111L399 129L362 123L345 148L339 116Z" fill="#252b25"/><path d="M355 66L367 30L381 69M338 75L315 42L321 84" stroke-width="8"/><path d="M120 100L90 48L155 80M210 125L240 65L254 132" stroke-width="9"/><path d="M95 190Q180 240 270 185" stroke-width="3" opacity=".5"/></g><circle cx="365" cy="99" r="4" fill="#eee9dc"/></svg>' },
    snake: { id:'snake', name:'灵蛇', title:'灵蛇 · 幽篁之灵', habitat:'栖于幽篁竹林', scene:'幽篁竹林 / BAMBOO GROVE', bond:'灵蛇 · 初见', folio:'003', reward:10, temperament:'敏锐 · 静谧', idleBehavior:'盘踞竹影之间，偶尔探首观察周围的动静。', interactionText:'灵蛇轻轻探首，随后安静地盘回竹影。', art:'<svg viewBox="0 0 420 260" aria-hidden="true"><path d="M95 215Q42 175 112 137Q185 98 254 155Q330 215 340 139Q350 74 280 78Q220 80 240 37" fill="none" stroke="#252a24" stroke-width="27" stroke-linecap="round"/><path d="M238 45Q260 10 295 27Q321 41 302 66L278 83L245 69Z" fill="#252a24"/><path d="M292 32L315 18L307 43" stroke="#252a24" stroke-width="7" fill="none"/><path d="M290 50l28 3" stroke="#eee9dc" stroke-width="3"/><circle cx="287" cy="43" r="4" fill="#eee9dc"/><path d="M85 213Q160 250 240 209" fill="none" stroke="#252a24" stroke-width="3" opacity=".4"/></svg>' },
    turtle: { id:'turtle', name:'玄龟', title:'玄龟 · 静水之灵', habitat:'栖于静水泽地', scene:'静水泽地 / QUIET MARSH', bond:'玄龟 · 初见', folio:'004', reward:10, temperament:'沉稳 · 温和', idleBehavior:'在浅水边缓步停歇，偶尔将头缩入甲中休憩。', interactionText:'玄龟缓缓点头，像是在回应你的问候。', art:'<svg viewBox="0 0 420 260" aria-hidden="true"><g fill="#252a24"><path d="M94 151Q100 75 210 72Q313 76 326 153Q286 207 155 200Q108 190 94 151Z"/><path d="M304 129Q355 105 380 130Q392 150 365 166L320 164Z"/><path d="M120 177L92 211L137 204L157 186M263 186L290 215L310 192L292 170" /></g><path d="M115 145Q125 91 208 88Q291 89 306 148Q275 180 160 180Q128 174 115 145Z" fill="none" stroke="#eee9dc" stroke-width="4" opacity=".48"/><path d="M210 90L210 180M151 105L178 177M269 105L243 177M120 143L300 143" stroke="#eee9dc" stroke-width="3" opacity=".35"/><circle cx="366" cy="136" r="4" fill="#eee9dc"/></svg>' }
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
  let selected = 'koi';
  let authenticated = false;
  let dailyInteractions = { count:0, limit:50 };
  const defaultCare = () => Object.fromEntries(Object.keys(creatures).map(id => [id, { satiety:60, bond:0, bondStage:'初识', mood:'平静', dailyFeeds:{ count:0, limit:3 }, ability:{ id:({koi:'ripple-leap',dragon:'cloudborne-presence',snake:'veil-of-ink',turtle:'tortoise-ward'})[id], name:({koi:'锦鲤跃波',dragon:'云龙现世',snake:'幽影潜行',turtle:'玄甲守心'})[id], description:({koi:'跃出水面，唤起层层水纹。',dragon:'云气舒展，龙影穿过山岚。',snake:'墨影隐现，于竹影间悄然穿行。',turtle:'玄甲凝光，水泽泛起守护涟漪。'})[id], unlocked:false, unlockBond:50, unlockLevel:5, dailyUses:{count:0,limit:5} }, lastFedAt:null }]));
  let careProgress = defaultCare();
  let journalEvents = [];
  const $ = id => document.getElementById(id);
  const threshold = level => level * 100;
  const api = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials:'same-origin',
      ...options,
      headers:{ ...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  };
  function safeLocalWrite(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }
  function renderJournal() {
    const list = $('creature-journal');
    list.replaceChildren();
    if (!journalEvents.length) {
      const empty = document.createElement('li');
      empty.className = 'journal-empty';
      empty.textContent = '每一次相伴，都会留下一笔。';
      list.append(empty);
      return;
    }
    journalEvents.slice(0, 8).forEach(event => {
      const item = document.createElement('li');
      item.className = 'journal-entry';
      const marker = document.createElement('span');
      marker.className = 'journal-marker';
      marker.textContent = event.type === 'feeding' ? '食' : event.type === 'exploration' ? '游' : event.type === 'ability' ? '技' : '伴';
      const body = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = event.title || '相伴记录';
      const detail = document.createElement('p');
      detail.textContent = event.detail || '';
      const time = document.createElement('time');
      time.textContent = event.createdAt ? new Date(event.createdAt).toLocaleString() : '';
      body.append(title, detail, time);
      item.append(marker, body);
      list.append(item);
    });
  }
  async function loadJournal() {
    if (authenticated) {
      const data = await api('/api/creatures/journal');
      journalEvents = Array.isArray(data.events) ? data.events : [];
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('inkSpirit.journal.v1') || '[]');
        journalEvents = Array.isArray(saved) ? saved.slice(0, 30) : [];
      } catch { journalEvents = []; }
    }
    renderJournal();
  }
  function addLocalJournal(type, title, detail, creatureId = selected) {
    journalEvents.unshift({ type, title, detail, creatureId, createdAt:new Date().toISOString() });
    journalEvents = journalEvents.slice(0, 30);
    safeLocalWrite('inkSpirit.journal.v1', JSON.stringify(journalEvents));
    renderJournal();
  }

  function applyServerProgress(data) {
    if (!data || !data.creatures) return;
    for (const id of Object.keys(creatures)) {
      const p = data.creatures[id];
      if (p && Number.isInteger(p.experience) && p.experience >= 0 &&
          Number.isInteger(p.level) && p.level >= 1) {
        progress[id] = {
          experience:p.experience,
          level:p.level,
          visits:Number.isInteger(p.visits) ? p.visits : 0,
          totalExperience:Number.isInteger(p.totalExperience) ? p.totalExperience : 0
        };
      }
    }
    if (creatures[data.selectedCreature]) selected = data.selectedCreature;
    if (data.dailyInteractions) dailyInteractions = data.dailyInteractions;
  }
  const codexLore = {
    koi:'水纹映月，循流而行。锦鲤象征灵动与机缘，初入墨灵世界时便与你结缘。',
    dragon:'行云布雨，镇守山川。青龙象征威仪与守护，在云海之间聆听天地气息。',
    snake:'潜行竹影，静观万象。灵蛇象征敏锐与沉静，于幽篁深处感知细微变化。',
    turtle:'负甲守泽，静候四时。玄龟象征坚韧与长久，在静水边守望生灵往来。'
  };
  const realmNames = {
    'lotus-pond':'烟雨荷塘',
    'cloud-mountain':'云海山巅',
    'bamboo-forest':'幽篁竹林',
    'quiet-marsh':'静水泽地'
  };
  function renderCodex(discovered = []) {
    document.querySelectorAll('[data-codex]').forEach(entry => {
      const id = entry.dataset.codex;
      const unlocked = id === 'koi' || discovered.includes(entry.dataset.realm);
      entry.classList.toggle('unlocked', unlocked);
      entry.classList.toggle('locked', !unlocked);
      const status = entry.querySelector('.codex-status');
      const lore = entry.querySelector('.codex-lore');
      if (status) status.textContent = unlocked
        ? (id === 'koi' ? '已收录 · 初见之灵' : '已收录 · ' + realmNames[entry.dataset.realm])
        : '尚未发现 · 前往' + realmNames[entry.dataset.realm];
      if (lore) lore.textContent = unlocked ? codexLore[id] : '灵境尚未探索，图鉴记载暂未显现。';
    });
  }
  function renderPersonality() {
    const creature = creatures[selected];
    const trait = $('creature-trait');
    const behavior = $('creature-behavior');
    if (trait) trait.textContent = creature.temperament;
    if (behavior) behavior.textContent = creature.idleBehavior;
  }
  function animateCompanion() {
    const art = $('creature-art');
    if (!art || typeof art.animate !== 'function') return;
    const motions = {
      koi:[{transform:'translateX(0) rotate(0deg)'},{transform:'translateX(16px) rotate(3deg)'},{transform:'translateX(-12px) rotate(-2deg)'},{transform:'translateX(0) rotate(0deg)'}],
      dragon:[{transform:'translateY(0) scale(1)'},{transform:'translateY(-13px) scale(1.035)'},{transform:'translateY(-7px) scale(1.015)'},{transform:'translateY(0) scale(1)'}],
      snake:[{transform:'rotate(0deg) scale(1)'},{transform:'rotate(-5deg) scale(1.025)'},{transform:'rotate(4deg) scale(1.015)'},{transform:'rotate(0deg) scale(1)'}],
      turtle:[{transform:'scale(1)'},{transform:'scale(.94)'},{transform:'scale(1.035)'},{transform:'scale(1)'}]
    };
    art.animate(motions[selected], { duration:selected === 'turtle' ? 950 : 700, easing:'ease-in-out' });
  }

  function localEvolution(level, bond) {
    if (level >= 10 && bond >= 50) return { id:'transcendent', stage:3, name:'灵韵化境', description:'灵息充盈，灵契相通。', nextLevel:null, nextBond:null };
    if (level >= 5 && bond >= 20) return { id:'awakened', stage:2, name:'灵脉初醒', description:'灵脉苏醒，形态显现。', nextLevel:10, nextBond:50 };
    return { id:'young', stage:1, name:'初生灵形', description:'灵性尚在积蓄，等待下一次蜕变。', nextLevel:5, nextBond:20 };
  }
  function renderEvolution(care) {
    const evolution = care.evolution || localEvolution(progress[selected].level, care.bond);
    $('evolution-name').textContent = evolution.name;
    $('evolution-stage').textContent = '形态 · ' + evolution.stage + ' / 3';
    $('evolution-description').textContent = evolution.description;
    $('evolution-seal').textContent = evolution.stage === 3 ? '化' : evolution.stage === 2 ? '醒' : '初';
    $('evolution-requirements').textContent = evolution.stage === 3
      ? '已达到当前原型的最高形态。'
      : '下一阶段：等级 LV. ' + evolution.nextLevel + ' · 亲密度 ' + evolution.nextBond;
    $('creature-art').dataset.evolution = evolution.id;
    $('painting').dataset.evolution = evolution.id;
  }
  function renderCare() {
    const care = careProgress[selected] || defaultCare()[selected];
    $('care-bond').textContent = '亲密度 · ' + care.bond + ' · ' + (care.bondStage || (care.bond >= 100 ? '心契' : care.bond >= 50 ? '亲近' : care.bond >= 20 ? '熟悉' : '初识'));
    renderEvolution(care);
    $('care-mood').textContent = '心境 · ' + care.mood;
    $('care-satiety-text').textContent = '饱足 · ' + care.satiety + ' / 100';
    $('care-satiety-bar').style.width = care.satiety + '%';
    const feedButton = $('feed-button');
    const exhausted = care.dailyFeeds.count >= care.dailyFeeds.limit;
    const full = care.satiety >= 100;
    feedButton.disabled = exhausted || full;
    feedButton.textContent = exhausted ? '今日照料已达上限' : full ? '伙伴已经吃饱' : '喂给伙伴';

    const ability = care.ability || {};
    const unlocked = Boolean(ability.unlocked || (care.bond >= 50 && progress[selected].level >= 5));
    $('ability-name').textContent = ability.name || '本命灵技';
    $('ability-description').textContent = ability.description || '与伙伴建立更深的羁绊，唤醒专属灵技。';
    $('ability-requirements').textContent = unlocked
      ? '今日施展 · ' + (ability.dailyUses?.count || 0) + ' / ' + (ability.dailyUses?.limit || 5)
      : '觉醒条件：等级 LV. 5 · 亲密度 50';
    const abilityButton = $('ability-button');
    abilityButton.disabled = !unlocked || (authenticated && (ability.dailyUses?.count || 0) >= (ability.dailyUses?.limit || 5));
    abilityButton.textContent = !unlocked ? '尚未觉醒' : abilityButton.disabled ? '今日次数已用尽' : '施展灵技';
  }
  function applyCare(data) {
    if (!data || !data.creatures) return;
    for (const id of Object.keys(creatures)) {
      const item = data.creatures[id];
      if (item) careProgress[id] = item;
    }
    renderCare();
  }
  function renderProgress() {
    const p = progress[selected];
    const needed = threshold(p.level);
    $('level').textContent = 'LV. ' + p.level;
    $('xp-text').textContent = p.experience + ' / ' + needed + ' 灵息';
    $('xp-bar').style.width = Math.min(100, p.experience / needed * 100) + '%';
    $('bond-name').textContent = creatures[selected].bond;
    const visits = $('creature-visits');
    if (visits) visits.textContent = '相伴次数 · ' + (p.visits || 0);
    const daily = $('daily-interactions');
    if (daily) daily.textContent = authenticated
      ? '今日互动 · ' + dailyInteractions.count + ' / ' + dailyInteractions.limit
      : '访客模式 · 进度保存在本浏览器';
    const button = $('interact-button');
    button.disabled = authenticated && dailyInteractions.count >= dailyInteractions.limit;
    button.textContent = button.disabled ? '今日互动已达上限' : '与它互动 +10';
    renderCare();
  }
  function selectCreature(id, sync = true) {
    if (!creatures[id]) return;
    selected = id;
    safeLocalWrite('inkSpirit.selected', id);
    const c = creatures[id];
    $('creature-art').innerHTML = c.art;
    $('creature-art').setAttribute('aria-label', c.title);
    $('scene-label').textContent = c.scene;
    $('creature-title').textContent = c.title;
    $('creature-habitat').textContent = c.habitat;
    $('folio').textContent = c.folio;
    renderPersonality();
    document.querySelectorAll('.creature-card').forEach(card => {
      const active = card.dataset.creature === id;
      card.classList.toggle('selected', active);
      card.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('.mountain-scene').style.opacity = id === 'dragon' ? '.32' : '0';
    document.querySelector('.bamboo-scene').style.opacity = id === 'snake' ? '.34' : '0';
    $('painting').dataset.scene = id;
    renderProgress();
    if (sync && authenticated) {
      api('/api/creatures/selected', {
        method:'PATCH', body:JSON.stringify({ creatureId:id })
      }).then(data => applyServerProgress(data)).catch(error => {
        $('progress-note').textContent = '保存伙伴选择失败：' + error.message;
      });
    }
  }
  document.querySelectorAll('.creature-card').forEach(card => {
    card.addEventListener('click', () => selectCreature(card.dataset.creature));
  });
  $('interact-button').addEventListener('click', async () => {
    const button = $('interact-button');
    button.disabled = true;
    try {
      if (authenticated) {
        const result = await api('/api/creatures/interact', {
          method:'POST', body:JSON.stringify({ creatureId:selected })
        });
        applyServerProgress(result.progress);
        if (result.care) applyCare(result.care);
        $('progress-note').textContent = creatures[selected].interactionText + ' 灵息增加 ' + result.reward + ' 点，记录已保存。'
        await loadJournal();
      } else {
        const p = progress[selected];
        p.experience += creatures[selected].reward;
        p.visits += 1;
        careProgress[selected].bond += 1;
        careProgress[selected].bondStage = careProgress[selected].bond >= 100 ? '心契' : careProgress[selected].bond >= 50 ? '亲近' : careProgress[selected].bond >= 20 ? '熟悉' : '初识';
        safeLocalWrite('inkSpirit.care.v1', JSON.stringify(careProgress));
        p.totalExperience = (p.totalExperience || 0) + creatures[selected].reward;
        while (p.experience >= threshold(p.level)) {
          p.experience -= threshold(p.level);
          p.level += 1;
        }
        safeLocalWrite(STORAGE_KEY, JSON.stringify(progress));
        $('progress-note').textContent = creatures[selected].interactionText + ' 灵息增加 ' + creatures[selected].reward + ' 点。访客进度保存在此浏览器。'
        addLocalJournal('interaction', '相伴互动', '与' + creatures[selected].name + '相伴片刻，获得 ' + creatures[selected].reward + ' 点灵息，亲密度增加 1。');
      }
      renderProgress();
      animateCompanion();
    } catch (error) {
      $('progress-note').textContent = error.message;
      renderProgress();
    } finally {
      if (!(authenticated && dailyInteractions.count >= dailyInteractions.limit)) button.disabled = false;
    }
  });
  const abilityMotions = {
    koi:[{transform:'translateY(0) scale(1)'},{transform:'translateY(-22px) scale(1.08)'},{transform:'translateY(5px) scale(.98)'},{transform:'translateY(0) scale(1)'}],
    dragon:[{transform:'translateX(0) translateY(0) scale(1)'},{transform:'translateX(18px) translateY(-18px) scale(1.08)'},{transform:'translateX(-12px) translateY(-8px) scale(1.04)'},{transform:'translate(0) scale(1)'}],
    snake:[{opacity:1,transform:'translateX(0) scale(1)'},{opacity:.18,transform:'translateX(24px) scale(.94)'},{opacity:.55,transform:'translateX(-14px) scale(1.04)'},{opacity:1,transform:'translateX(0) scale(1)'}],
    turtle:[{transform:'scale(1)'},{transform:'scale(1.13)'},{transform:'scale(.96)'},{transform:'scale(1)'}]
  };
  $('ability-button').addEventListener('click', async () => {
    const button = $('ability-button');
    const care = careProgress[selected];
    const ability = care.ability || {};
    button.disabled = true;
    try {
      if (authenticated) {
        const result = await api('/api/creatures/ability', {
          method:'POST', body:JSON.stringify({ creatureId:selected, abilityId:ability.id })
        });
        applyCare(result.care);
        $('ability-note').textContent = result.ability.name + ' · ' + result.ability.description;
        await loadJournal();
      } else {
        if (care.bond < 50 || progress[selected].level < 5) throw new Error('需要等级 LV. 5 与亲密度 50 才能觉醒本命灵技。');
        const today = new Date().toISOString().slice(0,10);
        if (!care.abilityDaily || care.abilityDaily.date !== today) care.abilityDaily = { date:today, count:0 };
        if (care.abilityDaily.count >= 5) throw new Error('今日灵技施展次数已达上限。');
        care.abilityDaily.count += 1;
        care.ability = { ...ability, unlocked:true, dailyUses:{count:care.abilityDaily.count,limit:5} };
        safeLocalWrite('inkSpirit.care.v1', JSON.stringify(careProgress));
        $('ability-note').textContent = ability.name + ' · ' + ability.description + '（访客记录保存在当前浏览器）';
        addLocalJournal('ability', ability.name, ability.description);
        renderCare();
      }
      const art = $('creature-art');
      art.dataset.ability = selected;
      if (typeof art.animate === 'function') art.animate(abilityMotions[selected], { duration:1100, easing:'ease-in-out' });
      $('painting').dataset.ability = selected;
    } catch (error) {
      $('ability-note').textContent = error.message;
    } finally {
      renderCare();
    }
  });
  $('feed-button').addEventListener('click', async () => {
    const button = $('feed-button');
    button.disabled = true;
    try {
      const foodId = $('care-food').value;
      if (authenticated) {
        const result = await api('/api/creatures/care/feed', {
          method:'POST', body:JSON.stringify({ creatureId:selected, foodId })
        });
        applyCare(result.care);
        $('care-note').textContent = '已奉上' + result.food + '，饱足恢复 ' + result.satietyRestored + ' 点，亲密度增加 5。';
        await loadJournal();
      } else {
        const care = careProgress[selected];
        if (care.dailyFeeds.count >= 3) throw new Error('今日的喂养次数已达上限。');
        if (care.satiety >= 100) throw new Error('伙伴现在已经吃饱了。');
        care.satiety = Math.min(100, care.satiety + 20);
        care.lastFedAt = new Date().toISOString();
        care.bond += 5;
        care.mood = care.satiety >= 70 ? '安然' : care.satiety >= 35 ? '平静' : '需要照料';
        care.dailyFeeds.count += 1;
        safeLocalWrite('inkSpirit.care.v1', JSON.stringify(careProgress));
        renderCare();
        $('care-note').textContent = '已奉上灵食，亲密度增加 5。访客记录保存在当前浏览器。';
        addLocalJournal('feeding', '灵食照料', '奉上所选灵食，饱足恢复 20 点，亲密度增加 5。');
      }
    } catch (error) {
      $('care-note').textContent = error.message;
    } finally { renderCare(); }
  });
  async function init() {
    try {
      const data = await api('/api/creatures/progress');
      authenticated = true;
      applyServerProgress(data);
      try { applyCare(await api('/api/creatures/care')); } catch { renderCare(); }
      try { await loadJournal(); } catch { renderJournal(); }
      $('progress-note').textContent = '已登录：成长记录保存在服务器，可跨设备继续。每日最多获得 50 次互动奖励。';
      try {
        const exploration = await api('/api/exploration/progress');
        renderCodex(exploration.discovered || []);
      } catch { renderCodex([]); }
    } catch {
      authenticated = false;
      try { await loadJournal(); } catch { renderJournal(); }
      try {
        const savedCare = JSON.parse(localStorage.getItem('inkSpirit.care.v1') || 'null');
        if (savedCare && typeof savedCare === 'object') {
          for (const id of Object.keys(creatures)) {
            if (!savedCare[id]) continue;
            const item = savedCare[id];
            if (item.lastFedAt && Number.isFinite(Date.parse(item.lastFedAt))) {
              const elapsed = Math.max(0, Date.now() - Date.parse(item.lastFedAt));
              const intervals = Math.floor(elapsed / (6 * 60 * 60 * 1000));
              item.satiety = Math.max(0, item.satiety - intervals * 10);
              if (intervals) item.lastFedAt = new Date(Date.parse(item.lastFedAt) + intervals * 6 * 60 * 60 * 1000).toISOString();
            }
            item.mood = item.satiety >= 70 ? '安然' : item.satiety >= 35 ? '平静' : '需要照料';
            careProgress[id] = item;
          }
        }
      } catch {}
      try {
        const saved = localStorage.getItem('inkSpirit.selected');
        if (creatures[saved]) selected = saved;
      } catch {}
      $('progress-note').textContent = '访客模式：成长进度保存在此浏览器。登录后可启用跨设备同步。';
      try {
        const savedRealms = JSON.parse(localStorage.getItem('inkSpiritExplorationV1') || '[]');
        renderCodex(Array.isArray(savedRealms) ? savedRealms : []);
      } catch { renderCodex([]); }
    }
    selectCreature(selected, false);
  }
  init();
})();