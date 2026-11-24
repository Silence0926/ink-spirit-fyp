'use strict';

(() => {
  const canvas = document.getElementById('snake-board');
  const ctx = canvas.getContext('2d');
  const size = 24;
  const cell = canvas.width / size;
  const scoreEl = document.getElementById('snake-score');
  const bestEl = document.getElementById('snake-best');
  const speedEl = document.getElementById('snake-speed');
  const overlay = document.getElementById('snake-overlay');
  const message = document.getElementById('snake-message');
  const subtitle = document.getElementById('snake-subtitle');
  const startButton = document.getElementById('snake-start');
  const bestKey = 'inkSpirit.snake.best.v1';
  let snake, direction, nextDirection, food, score, best, timer, running, paused, gameOver, tick;

  try { best = Number(localStorage.getItem(bestKey)) || 0; } catch { best = 0; }
  bestEl.textContent = best;

  function reset() {
    snake = [{x:8,y:12},{x:7,y:12},{x:6,y:12}];
    direction = {x:1,y:0}; nextDirection = {x:1,y:0};
    score = 0; tick = 150; running = false; paused = false; gameOver = false;
    placeFood(); updateHud(); draw();
  }
  function placeFood() {
    do { food = {x:Math.floor(Math.random()*size),y:Math.floor(Math.random()*size)}; }
    while (snake.some(part => part.x === food.x && part.y === food.y));
  }
  function updateHud() {
    scoreEl.textContent = score;
    bestEl.textContent = best;
    speedEl.textContent = String(Math.min(8, 1 + Math.floor(score / 5)));
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#e9e3d5'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = 'rgba(62,69,57,.08)'; ctx.lineWidth = 1;
    for(let i=1;i<size;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,canvas.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(canvas.width,i*cell);ctx.stroke();}
    // Ink-wash lotus leaves as subtle board ornaments.
    for(let i=0;i<7;i++){const x=((i*83+29)%size)*cell+cell/2,y=((i*137+61)%size)*cell+cell/2;ctx.fillStyle='rgba(70,91,67,.12)';ctx.beginPath();ctx.ellipse(x,y,cell*.35,cell*.17,-.4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#a64e3e';ctx.beginPath();ctx.arc((food.x+.5)*cell,(food.y+.5)*cell,cell*.31,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f4e9d8';ctx.beginPath();ctx.arc((food.x+.5)*cell-cell*.1,(food.y+.5)*cell-cell*.1,cell*.08,0,Math.PI*2);ctx.fill();
    snake.forEach((part,index)=>{ctx.fillStyle=index===0?'#26372b':'#465746';ctx.beginPath();ctx.roundRect(part.x*cell+2,part.y*cell+2,cell-4,cell-4,cell*.35);ctx.fill();if(index===0){ctx.fillStyle='#eee9dc';ctx.beginPath();ctx.arc((part.x+.68)*cell,(part.y+.32)*cell,2.4,0,Math.PI*2);ctx.fill();}});
  }
  function setDirection(name) {
    const dirs={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    const candidate=dirs[name]; if(!candidate)return;
    if(candidate.x === -direction.x && candidate.y === -direction.y)return;
    nextDirection=candidate;
  }
  function endGame(won = false) {
    running=false;gameOver=true;clearInterval(timer);overlay.classList.remove('hidden');
    message.textContent=won?'灵蛇游遍全园':'灵蛇归隐';subtitle.textContent=(won?'恭喜完成棋盘！':'本局得分：'+score)+' · 再来一局？';
    startButton.textContent='重新开始';
  }
  function step() {
    direction=nextDirection;
    const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};
    const eating=head.x===food.x&&head.y===food.y;
    const bodyToCheck=eating?snake:snake.slice(0,-1);
    if(head.x<0||head.x>=size||head.y<0||head.y>=size||bodyToCheck.some(part=>part.x===head.x&&part.y===head.y)){endGame();return;}
    snake.unshift(head);
    if(eating){score++;if(score>best){best=score;try{localStorage.setItem(bestKey,String(best));}catch{}}if(score%5===0){tick=Math.max(65,tick-12);clearInterval(timer);timer=setInterval(step,tick);}if(snake.length===size*size){endGame(true);return;}placeFood();}
    else snake.pop();
    updateHud();draw();
  }
  function start() {
    if(running)return;
    if(!snake.length)reset();
    running=true;paused=false;overlay.classList.add('hidden');
    clearInterval(timer);timer=setInterval(step,tick);
  }
  function pause() {
    if(!running)return;
    running=false;paused=true;clearInterval(timer);overlay.classList.remove('hidden');
    message.textContent='暂歇片刻';subtitle.textContent='按继续，灵蛇将继续游动。';startButton.textContent='继续';
  }
  startButton.addEventListener('click',()=>{if(paused){start();return;}reset();start();});
  document.getElementById('snake-pause').addEventListener('click',pause);
  document.getElementById('snake-restart').addEventListener('click',()=>{clearInterval(timer);reset();overlay.classList.remove('hidden');message.textContent='灵蛇待命';subtitle.textContent='按开始，或使用方向键 / WASD';startButton.textContent='开始游园';});
  document.querySelectorAll('.snake-pad button').forEach(button=>button.addEventListener('click',()=>setDirection(button.dataset.dir)));
  document.addEventListener('keydown',event=>{const map={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};if(map[event.key]){event.preventDefault();setDirection(map[event.key]);}if(event.code==='Space'){event.preventDefault();if(running)pause();else if(gameOver){reset();start();}else start();}});
  reset();
})();