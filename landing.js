const tabs=[...document.querySelectorAll('[data-demo]')];
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
let panelAnimation=null;let detailAnimations=[];let outgoing=null;
function selectTab(tab,focus=false){
 const changed=tab.getAttribute('aria-selected')!=='true';
 outgoing?.remove();outgoing=null;
 const previous=document.querySelector('.demo-stage [role="tabpanel"]:not([hidden])');
 if(changed&&previous&&!reducedMotion?.matches&&previous.animate){
  outgoing=previous.cloneNode(true);outgoing.removeAttribute('id');outgoing.removeAttribute('role');outgoing.removeAttribute('tabindex');outgoing.removeAttribute('aria-labelledby');outgoing.setAttribute('aria-hidden','true');outgoing.inert=true;outgoing.classList.add('demo-outgoing');outgoing.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));previous.parentElement.append(outgoing);
  const ghost=outgoing;const exit=ghost.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-12px)'}],{duration:220,easing:'ease-in',fill:'forwards'});exit.finished?.then(()=>ghost.remove(),()=>ghost.remove());
 }
 panelAnimation?.cancel();detailAnimations.forEach(a=>a.cancel());detailAnimations=[];
 for(const item of tabs){const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;document.getElementById('demo-'+item.dataset.demo).hidden=!active;}
 const panel=document.getElementById('demo-'+tab.dataset.demo);
 if(changed&&!reducedMotion?.matches&&panel.animate)panelAnimation=panel.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'});
 if(changed&&!reducedMotion?.matches){
  const items=[...panel.querySelectorAll('.file-list>div,.idea-flow>div,.plan-list>div')];
  for(const [index,item] of items.entries())if(item.animate)detailAnimations.push(item.animate([{opacity:0,transform:'translateY(16px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:520,delay:80+index*65,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
 }
 if(focus)tab.focus();
}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>{pauseAutoplay();selectTab(tab);});tab.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();pauseAutoplay();selectTab(tabs[event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length],true);});});
// Progressive enhancement: content stays visible without JavaScript or observers.
let revealObserver;
const revealTargets=[...document.querySelectorAll('.section-heading,.showcase,.feature-grid article,.steps li,.privacy-note,.faq-list,.closing h2,.closing .button')];
if(!reducedMotion?.matches&&'IntersectionObserver' in window){
 revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');revealObserver.unobserve(entry.target);}},{threshold:.08,rootMargin:'0px 0px -24px 0px'});
 revealTargets.forEach(el=>{el.classList.add('scroll-reveal');if(el.getBoundingClientRect().top>window.innerHeight){el.classList.add('reveal-pending');revealObserver.observe(el);}});
 document.addEventListener('focusin',event=>{const target=event.target.closest?.('.reveal-pending');if(target){target.classList.remove('reveal-pending');revealObserver.unobserve(target);}});
}
reducedMotion?.addEventListener?.('change',event=>{if(event.matches){panelAnimation?.cancel();detailAnimations.forEach(a=>a.cancel());revealObserver?.disconnect();revealTargets.forEach(el=>el.classList.remove('reveal-pending'));}});

// Pointer tilt runs only on precise pointers and settles on exit. No timer loop.
const showcase=document.querySelector('.demo-stage');
const finePointer=window.matchMedia?.('(hover: hover) and (pointer: fine)');
let tiltAnimation=null;
function resetTilt(){tiltAnimation?.cancel();tiltAnimation=null;}
if(showcase?.animate){
 showcase.addEventListener('pointermove',event=>{if(reducedMotion?.matches||!finePointer?.matches)return;const rect=showcase.getBoundingClientRect();const x=Math.max(-.5,Math.min(.5,(event.clientX-rect.left)/rect.width-.5)),y=Math.max(-.5,Math.min(.5,(event.clientY-rect.top)/rect.height-.5));const current=getComputedStyle(showcase).transform;tiltAnimation?.cancel();tiltAnimation=showcase.animate([{transform:current==='none'?'perspective(1400px) rotateX(0deg) rotateY(0deg)':current},{transform:`perspective(1400px) rotateX(${-y*3}deg) rotateY(${x*3}deg)`}],{duration:450,fill:'forwards',easing:'ease-out'});});
 showcase.addEventListener('pointerleave',()=>{const current=getComputedStyle(showcase).transform;resetTilt();if(!reducedMotion?.matches)tiltAnimation=showcase.animate([{transform:current},{transform:'perspective(1400px) rotateX(0deg) rotateY(0deg)'}],{duration:600,easing:'cubic-bezier(.22,1,.36,1)'});});
 reducedMotion?.addEventListener?.('change',event=>{if(event.matches)resetTilt();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)resetTilt();});
}

// Advance only when the preview is visible and nobody is interacting with it.
const preview=document.querySelector('.showcase'),playControl=document.querySelector('#preview-play');
let autoTimer=null,autoEnabled=!reducedMotion?.matches,previewVisible=false,hovering=false;
function clearAutoplay(){clearTimeout(autoTimer);autoTimer=null;preview?.classList.remove('preview-playing');}
function scheduleAutoplay(){if(!preview||!playControl)return;clearAutoplay();playControl.textContent=autoEnabled?'Pause preview':'Play preview';playControl.setAttribute('aria-pressed',String(autoEnabled));if(!autoEnabled||reducedMotion?.matches||!previewVisible||hovering||document.hidden||preview.contains(document.activeElement))return;
 preview.classList.add('preview-playing');autoTimer=setTimeout(()=>{const current=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true');selectTab(tabs[(current+1)%tabs.length]);scheduleAutoplay();},6000);
}
function pauseAutoplay(){autoEnabled=false;scheduleAutoplay();}
if(preview&&playControl){
 playControl.addEventListener('click',()=>{autoEnabled=!autoEnabled;scheduleAutoplay();});
 preview.addEventListener('pointerenter',()=>{hovering=true;scheduleAutoplay();});preview.addEventListener('pointerleave',()=>{hovering=false;scheduleAutoplay();});preview.addEventListener('focusin',scheduleAutoplay);preview.addEventListener('focusout',()=>setTimeout(scheduleAutoplay,0));document.addEventListener('visibilitychange',scheduleAutoplay);
 if('IntersectionObserver' in window){new IntersectionObserver(entries=>{previewVisible=entries[0].isIntersecting;scheduleAutoplay();},{threshold:.35}).observe(preview);}else{playControl.hidden=true;}
 reducedMotion?.addEventListener?.('change',event=>{if(event.matches){autoEnabled=false;outgoing?.remove();}scheduleAutoplay();});
 scheduleAutoplay();
}

// Scroll-driven sticky feature showcase with vertical dot navigation
const featureSection=document.querySelector('.features-showcase');
const featureDots=[...document.querySelectorAll('[data-feature-dot]')];
const featureSlides=[...document.querySelectorAll('[data-feature-slide]')];
if(featureSection&&featureDots.length&&featureSlides.length){
 const count=featureSlides.length;
 featureSection.style.setProperty('--feature-count',String(count));
 let activeFeature=-1,rafId=null;
 function setActiveFeature(nextIndex){
  const idx=Math.max(0,Math.min(count-1,nextIndex));
  if(idx===activeFeature)return;
  activeFeature=idx;
  featureDots.forEach((dot,i)=>{const on=i===idx;dot.setAttribute('aria-selected',String(on));dot.tabIndex=on?0:-1;});
  featureSlides.forEach((slide,i)=>{
   const on=i===idx;
   slide.classList.toggle('is-active',on);
   slide.classList.toggle('is-prev',i<idx);
   slide.setAttribute('aria-hidden',String(!on));
  });
 }
 function syncFeatureFromScroll(){
  rafId=null;
  const rect=featureSection.getBoundingClientRect();
  const scrollable=featureSection.offsetHeight-window.innerHeight;
  if(scrollable<=0){setActiveFeature(0);return;}
  const progress=Math.max(0,Math.min(1,-rect.top/scrollable));
  const idx=Math.min(count-1,Math.floor(progress*count));
  setActiveFeature(idx);
 }
 function onScrollOrResize(){
  if(rafId===null)rafId=requestAnimationFrame(syncFeatureFromScroll);
 }
 function scrollToFeature(index,focusDot=false){
  const idx=Math.max(0,Math.min(count-1,index));
  const rect=featureSection.getBoundingClientRect();
  const sectionTop=window.scrollY+rect.top;
  const scrollable=Math.max(0,featureSection.offsetHeight-window.innerHeight);
  const targetY=sectionTop+((idx+0.5)/count)*scrollable;
  setActiveFeature(idx);
  window.scrollTo({top:targetY,behavior:reducedMotion?.matches?'auto':'smooth'});
  if(focusDot)featureDots[idx]?.focus({preventScroll:true});
 }
 featureDots.forEach((dot,i)=>{
  dot.addEventListener('click',()=>scrollToFeature(i));
  dot.addEventListener('keydown',event=>{
   if(!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
   event.preventDefault();
   if(event.key==='Home')scrollToFeature(0,true);
   else if(event.key==='End')scrollToFeature(count-1,true);
   else scrollToFeature(i+(event.key==='ArrowDown'||event.key==='ArrowRight'?1:-1),true);
  });
 });
 window.addEventListener('scroll',onScrollOrResize,{passive:true});
 window.addEventListener('resize',onScrollOrResize,{passive:true});
 syncFeatureFromScroll();
}

// Smooth hero parallax scroll effect
const heroStage=document.querySelector('.hero-stage');
if(heroStage&&!reducedMotion?.matches){
 let heroRaf=null;
 function syncHeroScroll(){
  heroRaf=null;
  const h=Math.max(1,heroStage.offsetHeight);
  const y=Math.max(0,Math.min(h,window.scrollY));
  const p=y/h;
  heroStage.style.setProperty('--hero-y',y.toFixed(1)+'px');
  heroStage.style.setProperty('--hero-p',p.toFixed(4));
 }
 function onHeroScroll(){if(heroRaf===null)heroRaf=requestAnimationFrame(syncHeroScroll);}
 window.addEventListener('scroll',onHeroScroll,{passive:true});
 window.addEventListener('resize',onHeroScroll,{passive:true});
 syncHeroScroll();
}

// Smooth open and close animation for FAQ accordion items
document.querySelectorAll('.uos-faq-list details').forEach(details=>{
 const summary=details.querySelector('summary');
 const content=details.querySelector('p');
 if(!summary||!content)return;
 let anim=null,isClosing=false,isExpanding=false;
 summary.addEventListener('click',event=>{
  if(reducedMotion?.matches||!details.animate)return;
  event.preventDefault();
  details.style.overflow='hidden';
  if(isClosing||!details.open){
   details.style.height=`${details.offsetHeight}px`;
   details.open=true;
   details.classList.remove('is-closing');
   requestAnimationFrame(()=>{
    isExpanding=true;
    const startHeight=`${details.offsetHeight}px`;
    const endHeight=`${summary.offsetHeight+content.offsetHeight}px`;
    anim?.cancel();
    anim=details.animate({height:[startHeight,endHeight]},{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
    content.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});
    anim.onfinish=()=>{details.style.height='';details.style.overflow='';isExpanding=false;anim=null;};
    anim.oncancel=()=>{isExpanding=false;};
   });
  }else if(isExpanding||details.open){
   isClosing=true;
   details.classList.add('is-closing');
   const startHeight=`${details.offsetHeight}px`;
   const endHeight=`${summary.offsetHeight}px`;
   anim?.cancel();
   anim=details.animate({height:[startHeight,endHeight]},{duration:260,easing:'cubic-bezier(.22,1,.36,1)'});
   anim.onfinish=()=>{details.open=false;details.classList.remove('is-closing');details.style.height='';details.style.overflow='';isClosing=false;anim=null;};
   anim.oncancel=()=>{isClosing=false;};
  }
 });
});

// ReactBits-inspired WebGL "Strands" frosted-glass orb for Voice Control
(function initStrandsOrb(){
 const canvas=document.getElementById('strands-orb');
 if(!canvas)return;
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
 if(!gl)return;
 const vs=`attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
 const fs=`precision highp float;
 varying vec2 vUv;
 uniform float uTime,uPulse,uListen;
 uniform vec2 uMouse;
 vec3 palette(float t){
  vec3 c1=vec3(0.11,0.34,0.98);
  vec3 c2=vec3(0.28,0.68,1.00);
  vec3 c3=vec3(0.55,0.44,1.00);
  vec3 c4=vec3(0.16,0.85,1.00);
  float s=fract(t);
  if(s<.33)return mix(c1,c2,s*3.);
  if(s<.66)return mix(c2,c3,(s-.33)*3.);
  return mix(c3,c4,(s-.66)*3.);
 }
 void main(){
  vec2 uv=(vUv-.5)*2.0;
  float r=length(uv);
  if(r>1.0)discard;
  float z=sqrt(max(0.0,1.0-r*r));
  vec2 refractUv=uv*(1.0-0.24*(1.0-z))+uMouse*0.18;
  float angle=atan(refractUv.y,refractUv.x);
  float rad=length(refractUv);
  float t=uTime*0.9;
  float swell=1.0+0.15*sin(t*2.1)*uListen+uPulse*0.28;
  vec3 strands=vec3(0.0);
  for(int i=0;i<6;i++){
   float fi=float(i);
   float phase=fi*1.047+t*(0.68+fi*0.09);
   float wave=sin(angle*2.0+rad*4.8-phase)*0.22*swell+cos(angle*3.0-rad*3.2+phase*0.8)*0.12;
   float dist=abs(rad-0.36-wave-0.06*sin(fi+t*1.3));
   float glow=0.024/(dist*dist+0.0075);
   strands+=palette(fi*0.17+t*0.08+rad*0.25)*glow*0.28;
  }
  float core=exp(-rad*rad*4.0)*0.85*swell;
  vec3 glassBase=mix(vec3(0.03,0.07,0.24),vec3(0.08,0.19,0.56),z);
  vec3 col=glassBase+strands*0.95+vec3(0.45,0.75,1.0)*core*0.65;
  float fresnel=pow(1.0-z,2.6);
  vec3 dispersion=vec3(
   smoothstep(0.55,1.0,r+0.03),
   smoothstep(0.58,1.0,r),
   smoothstep(0.52,1.0,r-0.03)
  )*vec3(0.42,0.74,1.0)*fresnel*1.15;
  float spec=pow(max(0.0,dot(normalize(vec3(uv,z)),normalize(vec3(-0.45,0.6,0.75)))),32.0);
  col+=dispersion+vec3(1.0)*spec*0.78+vec3(0.32,0.58,1.0)*fresnel*0.42;
  float edge=smoothstep(1.0,0.955,r);
  gl_FragColor=vec4(col*edge,edge);
 }`;
 function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
 const prog=gl.createProgram();
 gl.attachShader(prog,compile(gl.VERTEX_SHADER,vs));
 gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,fs));
 gl.linkProgram(prog);
 gl.useProgram(prog);
 const buf=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,buf);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const loc=gl.getAttribLocation(prog,'p');
 gl.enableVertexAttribArray(loc);
 gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 const uTime=gl.getUniformLocation(prog,'uTime');
 const uMouse=gl.getUniformLocation(prog,'uMouse');
 const uPulse=gl.getUniformLocation(prog,'uPulse');
 const uListen=gl.getUniformLocation(prog,'uListen');
 let mx=0,my=0,tx=0,ty=0,pulse=0,start=performance.now(),visible=true;
 function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(canvas.clientWidth*dpr));
  const h=Math.max(1,Math.round(canvas.clientHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);
 }
 canvas.addEventListener('pointermove',e=>{
  const r=canvas.getBoundingClientRect();
  tx=((e.clientX-r.left)/r.width-.5)*2;
  ty=-(((e.clientY-r.top)/r.height-.5)*2);
 });
 canvas.addEventListener('pointerleave',()=>{tx=0;ty=0;});
 canvas.addEventListener('click',()=>{pulse=1;});
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.05}).observe(canvas);
 }
 window.addEventListener('resize',resize,{passive:true});
 resize();
 function frame(now){
  requestAnimationFrame(frame);
  if(!visible&&!reducedMotion?.matches)return;
  resize();
  mx+=(tx-mx)*0.08;my+=(ty-my)*0.08;pulse*=0.93;
  const elapsed=reducedMotion?.matches?1.2:(now-start)*0.001;
  const listen=0.65+0.35*Math.sin(elapsed*1.7)*Math.cos(elapsed*0.9);
  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(uTime,elapsed);
  gl.uniform2f(uMouse,mx,my);
  gl.uniform1f(uPulse,pulse);
  gl.uniform1f(uListen,listen);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
 }
 requestAnimationFrame(frame);
})();

// ReactBits-inspired "Folder Float" interactive draggable file cloud for Full Context
(function initFolderFloat(){
 const root=document.getElementById('folder-float');
 if(!root)return;
 const btn=root.querySelector('.ff-folder');
 const els=[...root.querySelectorAll('.ff-item')];
 if(!btn||!els.length)return;
 const items=els.map((el,i)=>({
  el,
  hx:parseFloat(el.dataset.homeX)||0,
  hy:parseFloat(el.dataset.homeY)||-120,
  rot:parseFloat(el.dataset.rot)||0,
  x:0,y:0,vx:0,vy:0,
  dragging:false,thrown:false,
  phase:i*1.35
 }));
 let open=root.dataset.open!=='false';
 let visible=true;
 function setOpen(next){
  open=next;
  root.dataset.open=String(open);
  btn.setAttribute('aria-expanded',String(open));
  if(open){items.forEach(it=>{it.thrown=false;});}
 }
 btn.addEventListener('click',()=>setOpen(!open));
 items.forEach(it=>{
  let lastX=0,lastY=0,lastT=0;
  it.el.addEventListener('pointerdown',e=>{
   if(!open)return;
   e.preventDefault();
   it.dragging=true;it.thrown=true;it.vx=0;it.vy=0;
   it.el.classList.add('is-dragging');
   it.el.setPointerCapture(e.pointerId);
   lastX=e.clientX;lastY=e.clientY;lastT=performance.now();
  });
  it.el.addEventListener('pointermove',e=>{
   if(!it.dragging)return;
   const now=performance.now(),dt=Math.max(8,now-lastT);
   const dx=e.clientX-lastX,dy=e.clientY-lastY;
   it.x+=dx;it.y+=dy;
   it.vx=(dx/dt)*16;it.vy=(dy/dt)*16;
   lastX=e.clientX;lastY=e.clientY;lastT=now;
  });
  function release(){
   if(!it.dragging)return;
   it.dragging=false;
   it.el.classList.remove('is-dragging');
  }
  it.el.addEventListener('pointerup',release);
  it.el.addEventListener('pointercancel',release);
 });
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.05}).observe(root);
 }
 function tick(now){
  requestAnimationFrame(tick);
  if(!visible)return;
  const t=now*0.001;
  const compact=root.clientWidth<420?0.68:1;
  const maxX=Math.max(120,root.clientWidth*0.44);
  const maxUp=Math.max(180,root.clientHeight*0.62);
  items.forEach(it=>{
   if(!it.dragging){
    if(open){
     const floatX=reducedMotion?.matches?0:Math.sin(t*1.15+it.phase)*7;
     const floatY=reducedMotion?.matches?0:Math.cos(t*1.45+it.phase)*8;
     if(it.thrown){
      it.x+=it.vx;it.y+=it.vy;
      it.vx*=0.94;it.vy*=0.94;
      if(it.x<-maxX){it.x=-maxX;it.vx*=-0.55;}
      if(it.x>maxX){it.x=maxX;it.vx*=-0.55;}
      if(it.y<-maxUp){it.y=-maxUp;it.vy*=-0.55;}
      if(it.y>40){it.y=40;it.vy*=-0.55;}
      if(Math.hypot(it.vx,it.vy)<0.15){it.y+=Math.cos(t*1.4+it.phase)*0.18;}
     }else{
      const tx=it.hx*compact+floatX;
      const ty=it.hy*compact+floatY;
      it.vx=(it.vx+(tx-it.x)*0.12)*0.76;
      it.vy=(it.vy+(ty-it.y)*0.12)*0.76;
      it.x+=it.vx;it.y+=it.vy;
     }
    }else{
     it.vx=(it.vx+(0-it.x)*0.18)*0.72;
     it.vy=(it.vy+(18-it.y)*0.18)*0.72;
     it.x+=it.vx;it.y+=it.vy;
    }
   }
   const scale=open?1:0.45;
   const op=open?1:0;
   const r=open?(it.rot+it.vx*0.6):0;
   it.el.style.opacity=op;
   it.el.style.pointerEvents=open?'auto':'none';
   it.el.style.transform=`translate3d(calc(-50% + ${it.x.toFixed(1)}px),${it.y.toFixed(1)}px,0) rotate(${r.toFixed(1)}deg) scale(${scale})`;
  });
 }
 requestAnimationFrame(tick);
})();
