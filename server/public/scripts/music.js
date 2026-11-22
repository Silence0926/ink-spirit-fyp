'use strict';

// Original procedural soundtrack: ink-wash ambience, guzheng-like plucks,
// airy bamboo-flute tones and a soft ocean/water texture. No third-party track.
async function initializeMusicPlayer(){
 const button=document.getElementById('music-btn');if(!button)return;
 let context=null,master=null,noiseSource=null,playing=false,step=0,clock=null;
 const bpm=58,beat=60/bpm;
 const scale=[0,2,4,7,9,12,14,16,19,21];
 const root=146.83;
 function makeNoise(){
  const buffer=context.createBuffer(1,context.sampleRate*4,context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.3;
  const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
  const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=420;
  const gain=context.createGain();gain.gain.value=.12;
  source.connect(filter).connect(gain).connect(master);source.start();noiseSource=source;
 }
 function pluck(note,when,volume=.16){
  const frequency=root*Math.pow(2,note/12),osc=context.createOscillator(),harm=context.createOscillator();
  const gain=context.createGain(),tone=context.createBiquadFilter();
  osc.type='triangle';osc.frequency.setValueAtTime(frequency,when);
  harm.type='sine';harm.frequency.setValueAtTime(frequency*2.01,when);
  tone.type='lowpass';tone.frequency.value=2200;
  gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.012);gain.gain.exponentialRampToValueAtTime(.0001,when+2.1);
  osc.connect(tone);harm.connect(tone);tone.connect(gain).connect(master);
  osc.start(when);harm.start(when);osc.stop(when+2.2);harm.stop(when+2.2);
 }
 function flute(note,when,duration=1.8){
  const osc=context.createOscillator(),vibrato=context.createOscillator(),vibratoGain=context.createGain(),gain=context.createGain(),filter=context.createBiquadFilter();
  const freq=root*2*Math.pow(2,note/12);
  osc.type='sine';osc.frequency.setValueAtTime(freq,when);
  vibrato.frequency.value=4.8;vibratoGain.gain.value=2.2;vibrato.connect(vibratoGain).connect(osc.frequency);
  filter.type='lowpass';filter.frequency.value=1350;
  gain.gain.setValueAtTime(.0001,when);gain.gain.linearRampToValueAtTime(.055,when+.35);gain.gain.setValueAtTime(.05,when+duration*.65);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  osc.connect(filter).connect(gain).connect(master);osc.start(when);vibrato.start(when);osc.stop(when+duration+.05);vibrato.stop(when+duration+.05);
 }
 function schedule(){
  if(!playing)return;
  const now=context.currentTime+.08;
  const phrase=[0,4,7,9,7,4,2,4,0,2,4,7,9,7,4,2];
  const n=phrase[step%phrase.length];
  if(step%2===0)pluck(n,now,.13);
  if(step%8===0)flute([0,4,7,9][Math.floor(step/8)%4],now,2.6);
  if(step%4===2)pluck(phrase[(step+3)%phrase.length]+12,now,.045);
  step++; 
 }
 async function toggle(){
  if(!context){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext){alert('Web Audio is not supported in this browser.');return;}context=new AudioContext();master=context.createGain();master.gain.value=.7;master.connect(context.destination);makeNoise();}
  if(context.state==='suspended')await context.resume();
  if(playing){playing=false;clearInterval(clock);button.classList.remove('playing');button.textContent='♫';master.gain.setTargetAtTime(.0001,context.currentTime,.18);return;}
  master.gain.setTargetAtTime(.7,context.currentTime,.4);playing=true;button.classList.add('playing');button.textContent='❚❚';schedule();clock=setInterval(schedule,beat*1000);
 }
 button.addEventListener('click',()=>toggle().catch(console.error));
 button.title='Original Ink Spirit soundtrack · plucked strings, bamboo flute and sea ambience';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeMusicPlayer,{once:true});else initializeMusicPlayer();
