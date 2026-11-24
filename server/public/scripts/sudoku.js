'use strict';
(() => {
  const N=9, BOX=3, boardEl=document.getElementById('sudoku-board');
  const statusEl=document.getElementById('sudoku-status'), timerEl=document.getElementById('timer'), mistakesEl=document.getElementById('mistakes');
  const difficultyEl=document.getElementById('difficulty'), notesButton=document.getElementById('notes-mode');
  let puzzle, solution, values, notes, selected=-1, notesMode=false, mistakes=0, seconds=0, finished=false, timerId=null;
  const empty=()=>Array.from({length:N},()=>Array(N).fill(0));
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function candidates(grid,r,c){const used=new Set();for(let i=0;i<N;i++){used.add(grid[r][i]);used.add(grid[i][c]);}const br=Math.floor(r/BOX)*BOX,bc=Math.floor(c/BOX)*BOX;for(let y=br;y<br+BOX;y++)for(let x=bc;x<bc+BOX;x++)used.add(grid[y][x]);return Array.from({length:9},(_,i)=>i+1).filter(n=>!used.has(n));}
  function fill(grid){
    let best=null,opts=null;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!grid[r][c]){const possible=candidates(grid,r,c);if(!opts||possible.length<opts.length){best=[r,c];opts=possible;}if(!possible.length)return false;}
    if(!best)return true;
    const [r,c]=best;for(const n of shuffle(opts)){grid[r][c]=n;if(fill(grid))return true;grid[r][c]=0;}return false;
  }
  function countSolutions(grid,limit=2){
    let best=null,opts=null;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!grid[r][c]){const possible=candidates(grid,r,c);if(!opts||possible.length<opts.length){best=[r,c];opts=possible;}if(!possible.length)return 0;}
    if(!best)return 1;
    let count=0;const [r,c]=best;for(const n of opts){grid[r][c]=n;count+=countSolutions(grid,limit-count);grid[r][c]=0;if(count>=limit)return count;}return count;
  }
  function makePuzzle(level){
    const solved=empty();fill(solved);const grid=solved.map(row=>row.slice());
    const target={easy:34,medium:43,hard:51}[level];let removed=0;
    for(const index of shuffle(Array.from({length:81},(_,i)=>i))){
      if(removed>=target)break;const r=Math.floor(index/9),c=index%9,old=grid[r][c];grid[r][c]=0;
      if(countSolutions(grid.map(row=>row.slice()))===1)removed++;else grid[r][c]=old;
    }
    return {grid,solved};
  }
  function render(){
    boardEl.replaceChildren();
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      const index=r*N+c,value=values[r][c],cell=document.createElement('button');
      cell.type='button';cell.className='sudoku-cell';cell.setAttribute('role','gridcell');cell.setAttribute('aria-label','第 '+(r+1)+' 行第 '+(c+1)+' 列'+(value?'，数字 '+value:'，空格'));
      cell.dataset.index=String(index);
      if(puzzle[r][c])cell.classList.add('given');
      if(index===selected)cell.classList.add('selected');
      if(selected>=0){const sr=Math.floor(selected/9),sc=selected%9;if(sr===r||sc===c||(Math.floor(sr/3)===Math.floor(r/3)&&Math.floor(sc/3)===Math.floor(c/3)))cell.classList.add('related');if(value&&value===values[sr][sc])cell.classList.add('same-number');}
      if(value){cell.textContent=String(value);if(!puzzle[r][c]&&value!==solution[r][c])cell.classList.add('incorrect');}
      else if(notes[index].size){const mini=document.createElement('span');mini.className='sudoku-candidates';for(let n=1;n<=9;n++){const s=document.createElement('i');s.textContent=notes[index].has(n)?String(n):'';mini.append(s);}cell.append(mini);}
      boardEl.append(cell);
    }
    mistakesEl.textContent=String(mistakes);
  }
  function formatTime(){timerEl.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
  function startTimer(){clearInterval(timerId);timerId=setInterval(()=>{if(!finished){seconds++;formatTime();}},1000);}
  function newGame(){
    const generated=makePuzzle(difficultyEl.value);puzzle=generated.grid;solution=generated.solved;values=puzzle.map(row=>row.slice());notes=Array.from({length:81},()=>new Set());selected=-1;notesMode=false;mistakes=0;seconds=0;finished=false;notesButton.setAttribute('aria-pressed','false');notesButton.textContent='候选笔记：关闭';formatTime();statusEl.textContent='新棋局已准备。选择空格并输入数字。';render();startTimer();
  }
  function select(index){selected=index;render();}
  function enterNumber(number){
    if(selected<0||finished)return;
    const r=Math.floor(selected/9),c=selected%9;if(puzzle[r][c]){statusEl.textContent='这是题目给定数字，不能修改。';return;}
    if(notesMode){if(values[r][c]){statusEl.textContent='请先擦除该格，再记录候选数字。';return;}if(notes[selected].has(number))notes[selected].delete(number);else notes[selected].add(number);statusEl.textContent='候选笔记已更新。';render();return;}
    values[r][c]=number;notes[selected].clear();
    if(number!==solution[r][c]){mistakes++;statusEl.textContent='这个数字不正确，可以继续修改。';}
    else{statusEl.textContent='正确。继续完成其余空格。';}
    render();checkComplete();
  }
  function erase(){if(selected<0||finished)return;const r=Math.floor(selected/9),c=selected%9;if(puzzle[r][c])return;values[r][c]=0;notes[selected].clear();statusEl.textContent='已清除所选格。';render();}
  function checkComplete(){
    for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(values[r][c]!==solution[r][c])return;
    finished=true;clearInterval(timerId);statusEl.textContent='恭喜完成数独！用时 '+timerEl.textContent+'，错误 '+mistakes+' 次。';
  }
  function checkBoard(){
    let wrong=0,filled=0;for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(values[r][c]){filled++;if(values[r][c]!==solution[r][c])wrong++;}
    statusEl.textContent=wrong?('目前有 '+wrong+' 个错误数字，已填写 '+filled+'/81 格。'):('已填写 '+filled+'/81 格，当前数字均正确。');
  }
  boardEl.addEventListener('click',event=>{const cell=event.target.closest('[data-index]');if(cell)select(Number(cell.dataset.index));});
  document.querySelectorAll('[data-number]').forEach(button=>button.addEventListener('click',()=>enterNumber(Number(button.dataset.number))));
  notesButton.addEventListener('click',()=>{notesMode=!notesMode;notesButton.setAttribute('aria-pressed',String(notesMode));notesButton.textContent='候选笔记：'+(notesMode?'开启':'关闭');});
  document.getElementById('erase').addEventListener('click',erase);
  document.getElementById('check').addEventListener('click',checkBoard);
  document.getElementById('new-puzzle').addEventListener('click',newGame);
  document.addEventListener('keydown',event=>{
    if(event.key>='1'&&event.key<='9'){event.preventDefault();enterNumber(Number(event.key));}
    else if(event.key==='Backspace'||event.key==='Delete'||event.key==='0'){event.preventDefault();erase();}
    else if(selected>=0&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const r=Math.floor(selected/9),c=selected%9;const dr=event.key==='ArrowUp'?-1:event.key==='ArrowDown'?1:0,dc=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0;select(Math.max(0,Math.min(8,r+dr))*9+Math.max(0,Math.min(8,c+dc)));}
  });
  newGame();
})();