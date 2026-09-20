const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const intro = document.querySelector('#intro');
const button = document.querySelector('#start-button');
const message = document.querySelector('#message');
const crystalCount = document.querySelector('#crystals');
const crystalTotal = document.querySelector('#total-crystals');
const timer = document.querySelector('#time');

const W = canvas.width, H = canvas.height;
const keys = {};
let playing = false, won = false, collected = 0, startedAt = 0, last = 0;
const player = { x: 105, y: 460, w: 37, h: 48, vx: 0, vy: 0, grounded: false, facing: 1 };
const platforms = [
  [0, 575, 360, 145], [425, 510, 170, 210], [670, 448, 205, 272], [952, 522, 136, 198], [1150, 430, 130, 290],
  [120, 420, 130, 25], [310, 348, 125, 25], [540, 300, 120, 25], [760, 245, 145, 25], [1000, 315, 105, 25]
];
const crystals = [[195, 370], [375, 295], [590, 248], [820, 190], [1045, 260], [520, 450], [760, 398], [1210, 375]].map(([x,y]) => ({x,y, got:false, bob:Math.random()*6.2}));
crystalTotal.textContent = crystals.length;

addEventListener('keydown', e => { keys[e.code] = true; if (['Space','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault(); if (!playing && (e.code === 'Space' || e.code === 'Enter')) start(); });
addEventListener('keyup', e => keys[e.code] = false);
button.addEventListener('click', start);
function start() {
  if (playing) return;
  if (won) { won = false; message.classList.remove('show'); reset(); }
  playing = true;
  intro.classList.add('hidden');
  startedAt = performance.now();
  last = startedAt;
  requestAnimationFrame(loop);
}
function rect(x,y,w,h,c) { ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
function cloud(x,y,s) { ctx.fillStyle='#f5f3dc'; [[0,18,72,23],[22,2,42,40],[52,10,54,31],[-12,25,126,20]].forEach(a=>ctx.beginPath(),ctx.fillStyle='#f5f3dc'); ctx.beginPath(); ctx.arc(x+18*s,y+25*s,19*s,0,7);ctx.arc(x+46*s,y+14*s,28*s,0,7);ctx.arc(x+79*s,y+25*s,20*s,0,7);ctx.fill(); }
function drawWorld(t) {
  ctx.clearRect(0,0,W,H); const sky=ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#71c9e1');sky.addColorStop(1,'#c4edf0');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#f8cf61';ctx.beginPath();ctx.arc(1080,105,55,0,7);ctx.fill(); cloud(110,110,.8); cloud(570,92,.55); cloud(880,180,.45);
  // distant islands
  [[-50,510,250],[250,540,185],[825,530,185]].forEach(([x,y,w])=>{ctx.fillStyle='#5fa9ae';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w-55,y+80);ctx.lineTo(x+45,y+88);ctx.closePath();ctx.fill();});
  platforms.forEach(([x,y,w,h])=>{rect(x,y,w,h,'#577e52');rect(x,y,w,16,'#d9e876');rect(x,y+16,w,9,'#a9c956'); for(let i=16;i<w;i+=30) rect(x+i,y+29,4,Math.min(h-29,16),'#426b48');});
  // beacon
  rect(1214,320,13,110,'#f9f0c9');rect(1205,309,31,13,'#e6634a');ctx.fillStyle='#f4bf50';ctx.beginPath();ctx.arc(1220,302,14,0,7);ctx.fill();
  crystals.forEach(c=>{if(c.got)return;const yy=c.y+Math.sin(t/250+c.bob)*6;ctx.save();ctx.translate(c.x,yy);ctx.rotate(Math.PI/4);rect(-9,-9,18,18,'#fff7ae');rect(-5,-5,10,10,'#64d7d5');ctx.restore();});
}
function drawPlayer() { const {x,y,w,h,facing}=player; ctx.save();ctx.translate(x+w/2,y+h/2);ctx.scale(facing,1); // scarf, explorer, boots
  ctx.fillStyle='#e6634a';ctx.fillRect(-16,-10,31,12);ctx.fillRect(13,-6,15,7);ctx.fillStyle='#f2b66b';ctx.fillRect(-12,-18,24,22);ctx.fillStyle='#25375f';ctx.fillRect(-13,-25,26,11);ctx.fillStyle='#f4bf50';ctx.fillRect(-16,-28,29,7);ctx.fillStyle='#fff8df';ctx.fillRect(4,-14,4,4);ctx.fillStyle='#415e9a';ctx.fillRect(-13,4,25,19);ctx.fillStyle='#263353';ctx.fillRect(-15,22,12,6);ctx.fillRect(3,22,12,6);ctx.restore(); }
function update(dt,t) { const d=Math.min(dt/16.67,2); const left=keys.ArrowLeft||keys.KeyA,right=keys.ArrowRight||keys.KeyD; if(left){player.vx=-5.2;player.facing=-1;}else if(right){player.vx=5.2;player.facing=1;}else player.vx*=.72; if((keys.Space||keys.KeyW||keys.ArrowUp)&&player.grounded){player.vy=-13;player.grounded=false;} player.vy+=.65*d; player.x+=player.vx*d; player.x=Math.max(0,Math.min(W-player.w,player.x)); const prev=player.y;player.y+=player.vy*d;player.grounded=false; platforms.forEach(([x,y,w])=>{if(player.vy>=0&&player.x+player.w>x&&player.x<x+w&&prev+player.h<=y&&player.y+player.h>=y){player.y=y-player.h;player.vy=0;player.grounded=true;}}); if(player.y>H+90) reset(); crystals.forEach(c=>{if(!c.got&&Math.hypot(player.x+18-c.x,player.y+20-c.y)<34){c.got=true;collected++;crystalCount.textContent=collected;}}); if(player.x>1170&&player.y<430&&collected===crystals.length) victory(); const remain=Math.max(0,180-Math.floor((t-startedAt)/1000));timer.textContent=remain;if(!remain) reset(); }
function reset(){player.x=105;player.y=460;player.vx=player.vy=0; crystals.forEach(c=>c.got=false);collected=0;crystalCount.textContent=0;startedAt=performance.now();}
function victory(){won=true;playing=false;message.innerHTML='YOU FOUND THE WAY HOME!<br><small>PRESS ENTER TO EXPLORE AGAIN</small>';message.classList.add('show');}
function loop(t){if(!playing)return;update(t-last,t);drawWorld(t);drawPlayer();last=t;requestAnimationFrame(loop);}
drawWorld(0);drawPlayer();
