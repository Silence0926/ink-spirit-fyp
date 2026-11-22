'use strict';
(() => {
  const SIZE=4, BEST_KEY='inkSpirit.2048.best.v1';
  const boardEl=document.getElementById('board'),scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),statusEl=document.getElementById('status');
  let grid,score,best,won,over;
  try{best=Number(localStorage.getItem(BEST_KEY))||0;}catch{best=0;}
  bestEl.textContent=String(best);
  const empty=()=>Array.from({length:SIZE},()=>Array(SIZE).fill(0));
  function spawn(){
    const slots=[];for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(!grid[r][c])slots.push([r,c]);
    if(!slots.length)return false;
    const [r,c]=slots[Math.floor(Math.random()*slots.length)];grid[r][c]=Math.random()<.9?2:4;return true;
  }
  function render(){
    boardEl.replaceChildren();
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
      const value=grid[r][c],cell=document.createElement('div');cell.className='puzzle-cell'+(value?' filled':'');cell.dataset.value=String(value);cell.setAttribute('role','gridcell');cell.setAttribute('aria-label',value?String(value):'空格');cell.textContent=value?String(value):'';boardEl.append(cell);
    }
    scoreEl.textContent=String(score);bestEl.textContent=String(best);
  }
  function reset(){
    grid=empty();score=0;won=false;over=false;spawn();spawn();statusEl.textContent='方向键 / WASD 或在棋盘上滑动';render();
  }
  function collapse(line){
    const values=line.filter(Boolean),merged=[];let gained=0;
    for(let i=0;i<values.length;i++){
      if(values[i]===values[i+1]){const next=values[i]*2;merged.push(next);gained+=next;i++;}
      else merged.push(values[i]);
    }
    while(merged.length<SIZE)merged.push(0);
    return {line:merged,gained};
  }
  function move(direction){
    if(over)return;
    const before=grid.map(row=>row.slice());let gained=0;
    for(let i=0;i<SIZE;i++){
      let coords=[];
      for(let j=0;j<SIZE;j++){
        if(direction==='left')coords.push([i,j]);
        if(direction==='right')coords.push([i,SIZE-1-j]);
        if(direction==='up')coords.push([j,i]);
        if(direction==='down')coords.push([SIZE-1-j,i]);
      }
      const result=collapse(coords.map(([r,c])=>grid[r][c]));gained+=result.gained;
      coords.forEach(([r,c],index)=>{grid[r][c]=result.line[index];});
    }
    const changed=grid.some((row,r)=>row.some((v,c)=>v!==before[r][c]));
    if(!changed)return;
    score+=gained;
    if(score>best){best=score;try{localStorage.setItem(BEST_KEY,String(best));}catch{}}
    spawn();
    if(!won&&grid.some(row=>row.includes(2048))){won=true;statusEl.textContent='恭喜合成 2048！仍可继续挑战更高数字。';}
    else statusEl.textContent=gained?'合并成功 · +'+gained+' 分':'继续寻找相同数字';
    if(!canMove()){over=true;statusEl.textContent='棋盘已满且无可合并方块 · 最终分数 '+score+'。重新开始再挑战一次。';}
    render();
  }
  function canMove(){
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
      if(!grid[r][c])return true;
      if(c<SIZE-1&&grid[r][c]===grid[r][c+1])return true;
      if(r<SIZE-1&&grid[r][c]===grid[r+1][c])return true;
    }return false;
  }
  const keyMap={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'};
  document.addEventListener('keydown',event=>{const direction=keyMap[event.key];if(direction){event.preventDefault();move(direction);}});
  document.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>move(button.dataset.move)));
  document.getElementById('new-game').addEventListener('click',reset);
  let touchStart=null;
  boardEl.addEventListener('pointerdown',event=>{touchStart={x:event.clientX,y:event.clientY};});
  boardEl.addEventListener('pointerup',event=>{
    if(!touchStart)return;const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;
    if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
    move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
  });
  boardEl.addEventListener('pointercancel',()=>{touchStart=null;});
  reset();
})();