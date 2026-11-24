(() => {
'use strict';
const COLS=10, ROWS=20, SIZE=30;
const SHAPES={
 I:[[1,1,1,1]], O:[[1,1],[1,1]], T:[[0,1,0],[1,1,1]],
 S:[[0,1,1],[1,1,0]], Z:[[1,1,0],[0,1,1]],
 J:[[1,0,0],[1,1,1]], L:[[0,0,1],[1,1,1]]
};
const COLORS={I:'#8b9b91',O:'#c3a66b',T:'#a66c5c',S:'#879779',Z:'#b56e60',J:'#718b91',L:'#b28a65'};
const boardCanvas=document.getElementById('tetris-board'), ctx=boardCanvas.getContext('2d');
const nextCanvas=document.getElementById('tetris-next'), nctx=nextCanvas.getContext('2d');
const $=id=>document.getElementById(id);
let board, piece, nextType, bag=[], score=0, lines=0, level=1, best=0;
try{best=Number(localStorage.getItem('inkTetrisBest')||0)||0;}catch{best=0;}
let running=false, paused=false, over=false, last=0, dropCounter=0, raf=0;
$('tetris-best').textContent=best;
function refillBag(){bag=Object.keys(SHAPES);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}}
function takeType(){if(!bag.length)refillBag();return bag.pop();}
function cloneShape(type){return SHAPES[type].map(row=>row.slice());}
function spawn(){const type=nextType||takeType();nextType=takeType();piece={type,matrix:cloneShape(type),x:Math.floor((COLS-SHAPES[type][0].length)/2),y:0};drawNext();if(collides(piece.matrix,piece.x,piece.y)){finish();}}
function collides(matrix,ox,oy){for(let y=0;y<matrix.length;y++)for(let x=0;x<matrix[y].length;x++)if(matrix[y][x]){const bx=ox+x,by=oy+y;if(bx<0||bx>=COLS||by>=ROWS||(by>=0&&board[by][bx]))return true;}return false;}
function rotate(matrix,dir){const out=matrix[0].map((_,i)=>matrix.map(row=>row[i]));if(dir>0)out.forEach(row=>row.reverse());else out.reverse();return out;}
function turn(dir){if(!running||paused||over)return;const m=rotate(piece.matrix,dir);for(const kick of [0,-1,1,-2,2])if(!collides(m,piece.x+kick,piece.y)){piece.matrix=m;piece.x+=kick;draw();return;}}
function move(dx,dy){if(!running||paused||over)return false;if(!collides(piece.matrix,piece.x+dx,piece.y+dy)){piece.x+=dx;piece.y+=dy;draw();return true;}if(dy>0)lock();return false;}
function hardDrop(){if(!running||paused||over)return;let distance=0;while(!collides(piece.matrix,piece.x,piece.y+1)){piece.y++;distance++;}score+=distance*2;lock();}
function lock(){piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v&&piece.y+y>=0)board[piece.y+y][piece.x+x]=piece.type;}));clearLines();spawn();updateStats();draw();}
function clearLines(){let count=0;for(let y=ROWS-1;y>=0;y--){if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(COLS).fill(0));count++;y++;}}if(count){lines+=count;score+=[0,100,300,500,800][count]*level;level=Math.floor(lines/10)+1;}}
function updateStats(){$('tetris-score').textContent=score;$('tetris-lines').textContent=lines;$('tetris-level').textContent=level;if(score>best){best=score;try{localStorage.setItem('inkTetrisBest',String(best));}catch{}$('tetris-best').textContent=best;}}
function cell(c,type,col,row,size=SIZE){c.fillStyle=COLORS[type]||'#777';c.fillRect(col*size+1,row*size+1,size-2,size-2);c.strokeStyle='rgba(255,255,255,.3)';c.strokeRect(col*size+2,row*size+2,size-4,size-4);}
function draw(){ctx.clearRect(0,0,300,600);ctx.fillStyle='#e8e3d5';ctx.fillRect(0,0,300,600);ctx.strokeStyle='rgba(75,80,66,.12)';for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*SIZE,0);ctx.lineTo(x*SIZE,600);ctx.stroke();}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*SIZE);ctx.lineTo(300,y*SIZE);ctx.stroke();}board.forEach((row,y)=>row.forEach((v,x)=>{if(v)cell(ctx,v,x,y);}));if(piece)piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v)cell(ctx,piece.type,piece.x+x,piece.y+y);}));}
function drawNext(){nctx.clearRect(0,0,120,120);nctx.fillStyle='#e8e3d5';nctx.fillRect(0,0,120,120);const m=SHAPES[nextType],w=m[0].length*24,h=m.length*24,ox=(120-w)/2,oy=(120-h)/2;m.forEach((row,y)=>row.forEach((v,x)=>{if(v){nctx.fillStyle=COLORS[nextType];nctx.fillRect(ox+x*24+1,oy+y*24+1,22,22);}}));}
function showOverlay(title,subtitle,button){$('tetris-message').textContent=title;$('tetris-subtitle').textContent=subtitle;$('tetris-start').textContent=button;$('tetris-overlay').hidden=false;}
function hideOverlay(){$('tetris-overlay').hidden=true;}
function finish(){running=false;over=true;cancelAnimationFrame(raf);showOverlay('本局结束','得分 '+score+' · 消行 '+lines,'再来一局');}
function start(){cancelAnimationFrame(raf);board=Array.from({length:ROWS},()=>Array(COLS).fill(0));score=0;lines=0;level=1;bag=[];nextType=takeType();over=false;paused=false;running=true;last=0;dropCounter=0;updateStats();spawn();hideOverlay();draw();raf=requestAnimationFrame(loop);}
function togglePause(){if(over||!running)return;paused=!paused;if(paused){cancelAnimationFrame(raf);showOverlay('暂时歇笔','游戏已暂停，准备好后继续。','继续游戏');}else{hideOverlay();last=0;raf=requestAnimationFrame(loop);}}
function loop(time=0){if(!running||paused||over)return;const delta=time-last;last=time;dropCounter+=delta;if(dropCounter>Math.max(90,850-(level-1)*65)){move(0,1);dropCounter=0;}draw();raf=requestAnimationFrame(loop);}
function action(a){if(a==='left')move(-1,0);if(a==='right')move(1,0);if(a==='down'){if(move(0,1))score++;updateStats();}if(a==='rotate')turn(1);if(a==='rotate-left')turn(-1);if(a==='drop')hardDrop();}
document.addEventListener('keydown',e=>{const keys=['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ','Space','KeyX','KeyZ','KeyP'];if(keys.includes(e.code)||keys.includes(e.key))e.preventDefault();if(e.code==='ArrowLeft'||e.code==='KeyA')action('left');else if(e.code==='ArrowRight'||e.code==='KeyD')action('right');else if(e.code==='ArrowDown'||e.code==='KeyS')action('down');else if(e.code==='ArrowUp'||e.code==='KeyX')action('rotate');else if(e.code==='KeyZ')action('rotate-left');else if(e.code==='Space')action('drop');else if(e.code==='KeyP')togglePause();});
document.querySelectorAll('.tetris-pad [data-action]').forEach(btn=>{btn.addEventListener('click',()=>action(btn.dataset.action));});
$('tetris-start').addEventListener('click',()=>{if(paused&&!over){paused=false;hideOverlay();last=0;raf=requestAnimationFrame(loop);}else start();});
$('tetris-pause').addEventListener('click',togglePause);$('tetris-restart').addEventListener('click',start);
board=Array.from({length:ROWS},()=>Array(COLS).fill(0));draw();nextType=takeType();drawNext();showOverlay('墨方待落','按开始，或使用方向键操作','开始游戏');
})();