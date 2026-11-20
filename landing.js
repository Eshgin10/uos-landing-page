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
const revealTargets=[...document.querySelectorAll('.ed-display,.ed-copy-col,.ed-demo-offset,.sc-prompt,.ed-piece,.ed-stage-wide,.ed-cmd,.ed-spec-row,.uos-faq-list details')];
if(!reducedMotion?.matches&&'IntersectionObserver' in window){
 const staggerGroups=['.ed-scatter-prompts .sc-prompt','.ed-uneven-grid .ed-piece','.ed-cloud-commands .ed-cmd','.ed-spec-matrix .ed-spec-row','.uos-faq-list details'];
 staggerGroups.forEach(sel=>{
  document.querySelectorAll(sel).forEach((el,i)=>{
   const step=sel.includes('ed-cmd')?45:75;
   el.style.setProperty('--rev-delay',`${Math.min(i*step,360)}ms`);
  });
 });
 revealObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(entry.isIntersecting){
    entry.target.classList.remove('is-hidden');
    revealObserver.unobserve(entry.target);
   }
  }
 },{threshold:.08,rootMargin:'0px 0px -36px 0px'});
 revealTargets.forEach(el=>{
  el.classList.add('ed-reveal');
  if(el.getBoundingClientRect().top>window.innerHeight*0.92){
   el.classList.add('is-hidden');
   revealObserver.observe(el);
  }
 });
 document.addEventListener('focusin',event=>{
  const target=event.target.closest?.('.is-hidden');
  if(target){target.classList.remove('is-hidden');revealObserver.unobserve(target);}
 });
}
reducedMotion?.addEventListener?.('change',event=>{if(event.matches){panelAnimation?.cancel();detailAnimations.forEach(a=>a.cancel());revealObserver?.disconnect();revealTargets.forEach(el=>el.classList.remove('is-hidden'));}});

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

// Smooth open and close animation for FAQ accordion items (only one open at a time)
const faqItems=[...document.querySelectorAll('.uos-faq-list details')];
const faqControllers=new Map();
faqItems.forEach(details=>{
 const summary=details.querySelector('summary');
 const content=details.querySelector('p');
 if(!summary||!content)return;
 let anim=null,isClosing=false,isExpanding=false;
 function closeItem(){
  if(!details.open||isClosing)return;
  if(reducedMotion?.matches||!details.animate){details.open=false;return;}
  isClosing=true;
  details.style.overflow='hidden';
  details.classList.add('is-closing');
  const startHeight=`${details.offsetHeight}px`;
  const endHeight=`${summary.offsetHeight}px`;
  anim?.cancel();
  anim=details.animate({height:[startHeight,endHeight]},{duration:260,easing:'cubic-bezier(.22,1,.36,1)'});
  anim.onfinish=()=>{details.open=false;details.classList.remove('is-closing');details.style.height='';details.style.overflow='';isClosing=false;anim=null;};
  anim.oncancel=()=>{isClosing=false;};
 }
 faqControllers.set(details,{close:closeItem});
 summary.addEventListener('click',event=>{
  if(reducedMotion?.matches||!details.animate){
   if(!details.open)faqItems.forEach(other=>{if(other!==details)other.open=false;});
   return;
  }
  event.preventDefault();
  details.style.overflow='hidden';
  if(isClosing||!details.open){
   faqItems.forEach(other=>{if(other!==details)faqControllers.get(other)?.close();});
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
   closeItem();
  }
 });
});

// ReactBits-inspired WebGL "Orb" swirling plasma ring for Voice Control
(function initVoiceOrb(){
 const canvas=document.getElementById('strands-orb');
 if(!canvas)return;
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
 if(!gl)return;
 const vs=`attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
 const fs=`precision highp float;
 varying vec2 vUv;
 uniform float uTime,uHover,uRot,uPulse;
 uniform vec2 uMouse;
 vec3 hash33(vec3 p3){
  p3=fract(p3*vec3(0.1031,0.11369,0.13787));
  p3+=dot(p3,p3.yxz+19.19);
  return -1.0+2.0*fract(vec3(p3.x+p3.y,p3.x+p3.z,p3.y+p3.z)*p3.zyx);
 }
 float snoise3(vec3 p){
  const float K1=0.333333333;
  const float K2=0.166666667;
  vec3 i=floor(p+(p.x+p.y+p.z)*K1);
  vec3 d0=p-(i-(i.x+i.y+i.z)*K2);
  vec3 e=step(vec3(0.0),d0-d0.yzx);
  vec3 i1=e*(1.0-e.zxy);
  vec3 i2=1.0-e.zxy*(1.0-e);
  vec3 d1=d0-(i1-K2);
  vec3 d2=d0-(i2-K1);
  vec3 d3=d0-0.5;
  vec4 h=max(0.6-vec4(dot(d0,d0),dot(d1,d1),dot(d2,d2),dot(d3,d3)),0.0);
  vec4 n=h*h*h*h*vec4(dot(d0,hash33(i)),dot(d1,hash33(i+i1)),dot(d2,hash33(i+i2)),dot(d3,hash33(i+1.0)));
  return dot(vec4(31.316),n);
 }
 float light1(float intensity,float attenuation,float dist){return intensity/(1.0+dist*attenuation);}
 float light2(float intensity,float attenuation,float dist){return intensity/(1.0+dist*dist*attenuation);}
 void main(){
  vec2 uv=(vUv-0.5)*2.0;
  float c=cos(uRot),s=sin(uRot);
  uv=mat2(c,-s,s,c)*uv;
  float hoverAmp=(0.24+uPulse*0.22)*uHover;
  uv.x+=hoverAmp*0.12*sin(uv.y*10.0+uTime*1.8);
  uv.y+=hoverAmp*0.12*sin(uv.x*10.0+uTime*1.8);
  uv-=uMouse*0.09*uHover;
  vec3 color1=vec3(0.12,0.44,0.26);
  vec3 color2=vec3(0.55,0.82,0.38);
  vec3 color3=vec3(0.84,0.74,0.28);
  float innerRadius=0.58;
  float noiseScale=0.68;
  float ang=atan(uv.y,uv.x);
  float len=length(uv);
  float invLen=len>0.0?1.0/len:0.0;
  float n0=snoise3(vec3(uv*noiseScale,uTime*0.55))*0.5+0.5;
  float r0=mix(mix(innerRadius,1.0,0.4),mix(innerRadius,1.0,0.6),n0);
  float d0=distance(uv,(r0*invLen)*uv);
  float v0=light1(1.15,10.5,d0);
  v0*=smoothstep(r0*1.06,r0,len);
  float cl=cos(ang+uTime*2.0)*0.5+0.5;
  float a=uTime*-1.15;
  vec2 pos=vec2(cos(a),sin(a))*r0;
  float d=distance(uv,pos);
  float v1=light2(1.65,5.2,d);
  v1*=light1(1.0,50.0,d0);
  float v2=smoothstep(1.0,mix(innerRadius,1.0,n0*0.52),len);
  float v3=smoothstep(innerRadius,mix(innerRadius,1.0,0.52),len);
  vec3 col=mix(color1,color2,cl);
  col=mix(color3,col,v0);
  col=(col+v1*vec3(0.95,0.94,0.66))*v2*v3;
  col=clamp(col,0.0,1.0);
  float aVal=max(max(col.r,col.g),col.b);
  float alpha=smoothstep(0.03,0.42,aVal);
  vec3 finalCol=mix(vec3(0.06,0.20,0.12),col,0.86);
  gl_FragColor=vec4(finalCol*alpha,alpha);
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
 const uHover=gl.getUniformLocation(prog,'uHover');
 const uRot=gl.getUniformLocation(prog,'uRot');
 const uPulse=gl.getUniformLocation(prog,'uPulse');
 const uMouse=gl.getUniformLocation(prog,'uMouse');
 let mx=0,my=0,tx=0,ty=0,hover=0,targetHover=0,rot=0,pulse=0,last=performance.now(),start=last,visible=true;
 function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(canvas.clientWidth*dpr));
  const h=Math.max(1,Math.round(canvas.clientHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);
 }
 canvas.addEventListener('pointermove',e=>{
  const r=canvas.getBoundingClientRect();
  const nx=((e.clientX-r.left)/r.width-.5)*2;
  const ny=-(((e.clientY-r.top)/r.height-.5)*2);
  tx=nx;ty=ny;
  targetHover=Math.hypot(nx,ny)<0.88?1:0;
 });
 canvas.addEventListener('pointerleave',()=>{tx=0;ty=0;targetHover=0;});
 canvas.addEventListener('click',()=>{pulse=1;targetHover=1;});
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.05}).observe(canvas);
 }
 window.addEventListener('resize',resize,{passive:true});
 resize();
 function frame(now){
  requestAnimationFrame(frame);
  if(!visible&&!reducedMotion?.matches)return;
  resize();
  const dt=Math.min(0.05,(now-last)*0.001);
  last=now;
  mx+=(tx-mx)*0.09;my+=(ty-my)*0.09;
  hover+=(targetHover-hover)*0.08;
  pulse*=0.93;
  if(!reducedMotion?.matches&&hover>0.05)rot+=dt*0.42*hover;
  const elapsed=reducedMotion?.matches?1.2:(now-start)*0.001;
  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(uTime,elapsed);
  gl.uniform1f(uHover,Math.max(hover,pulse));
  gl.uniform1f(uRot,rot);
  gl.uniform1f(uPulse,pulse);
  gl.uniform2f(uMouse,mx,my);
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

// Interactive multi-agent orchestration constellation for Agentic Work
(function initAgentSwarm(){
 const root=document.getElementById('agent-swarm');
 if(!root)return;
 const canvas=root.querySelector('.swarm-canvas');
 if(!canvas)return;
 const ctx=canvas.getContext('2d');
 if(!ctx)return;
 const agents=[
  {label:'Planner',sub:'Fast router',angle:-2.35,rx:.36,ry:.33,glow:0},
  {label:'Research',sub:'Live sources',angle:-.78,rx:.38,ry:.33,glow:0},
  {label:'Reasoner',sub:'Deep model',angle:.72,rx:.37,ry:.34,glow:0},
  {label:'Verifier',sub:'Quality check',angle:2.38,rx:.36,ry:.33,glow:0}
 ];
 const packets=[];
 let mx=0,my=0,tx=0,ty=0,burst=0,visible=true,lastSpawn=0;
 function spawnPacket(idx,dir=1){
  packets.push({idx,dir,t:0,speed:0.014+Math.random()*0.008,size:3.6+Math.random()*1.8});
 }
 function dispatchBurst(){
  burst=1;
  agents.forEach((a,i)=>{setTimeout(()=>spawnPacket(i,1),i*90);setTimeout(()=>spawnPacket(i,-1),520+i*110);});
 }
 canvas.addEventListener('pointermove',e=>{
  const r=canvas.getBoundingClientRect();
  tx=((e.clientX-r.left)/r.width-.5)*2;
  ty=((e.clientY-r.top)/r.height-.5)*2;
 });
 canvas.addEventListener('pointerleave',()=>{tx=0;ty=0;});
 canvas.addEventListener('click',dispatchBurst);
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.05}).observe(root);
 }
 function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(canvas.clientWidth*dpr));
  const h=Math.max(1,Math.round(canvas.clientHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);
 }
 function frame(now){
  requestAnimationFrame(frame);
  if(!visible)return;
  resize();
  const W=canvas.clientWidth,H=canvas.clientHeight;
  const cx=W*0.5+mx*12,cy=H*0.5+my*10;
  const t=reducedMotion?.matches?1.5:now*0.001;
  mx+=(tx-mx)*0.07;my+=(ty-my)*0.07;burst*=0.94;
  if(!reducedMotion?.matches&&now-lastSpawn>420){
   lastSpawn=now;
   spawnPacket(Math.floor(Math.random()*agents.length),Math.random()>0.45?1:-1);
  }
  ctx.clearRect(0,0,W,H);
  // Subtle concentric orbital guide rings
  [0.24,0.36].forEach((scale,ri)=>{
   ctx.beginPath();
   ctx.ellipse(cx,cy,W*scale,H*scale*0.92,0,0,Math.PI*2);
   ctx.strokeStyle=ri===0?'rgba(31,111,67,0.18)':'rgba(31,111,67,0.10)';
   ctx.lineWidth=1.2;
   ctx.setLineDash(ri===1?[4,6]:[]);
   ctx.stroke();
  });
  ctx.setLineDash([]);
  // Compute agent positions
  const pos=agents.map((a,i)=>{
   const ang=a.angle+Math.sin(t*0.55+i*1.4)*0.12;
   const px=cx+Math.cos(ang)*W*a.rx+mx*18;
   const py=cy+Math.sin(ang)*H*a.ry+my*14;
   const cpx=(cx+px)*0.5+(py-cy)*0.16;
   const cpy=(cy+py)*0.5-(px-cx)*0.16;
   return {px,py,cpx,cpy};
  });
  // Curved filament links
  pos.forEach((p,i)=>{
   const g=ctx.createLinearGradient(cx,cy,p.px,p.py);
   g.addColorStop(0,'rgba(31,111,67,0.48)');
   g.addColorStop(1,'rgba(126,194,98,0.26)');
   ctx.beginPath();
   ctx.moveTo(cx,cy);
   ctx.quadraticCurveTo(p.cpx,p.cpy,p.px,p.py);
   ctx.strokeStyle=g;
   ctx.lineWidth=1.6+agents[i].glow*1.5;
   ctx.stroke();
  });
  // Animated energy packets
  for(let i=packets.length-1;i>=0;i--){
   const pk=packets[i];
   pk.t+=pk.speed;
   if(pk.t>=1){
    if(pk.dir===1)agents[pk.idx].glow=1;else burst=Math.max(burst,0.45);
    packets.splice(i,1);continue;
   }
   const p=pos[pk.idx];
   const u=pk.dir===1?pk.t:1-pk.t;
   const inv=1-u;
   const x=inv*inv*cx+2*inv*u*p.cpx+u*u*p.px;
   const y=inv*inv*cy+2*inv*u*p.cpy+u*u*p.py;
   const rg=ctx.createRadialGradient(x,y,0,x,y,pk.size*3.2);
   rg.addColorStop(0,pk.dir===1?'rgba(31,111,67,0.95)':'rgba(205,186,74,0.95)');
   rg.addColorStop(0.45,'rgba(126,194,98,0.35)');
   rg.addColorStop(1,'rgba(126,194,98,0)');
   ctx.fillStyle=rg;
   ctx.beginPath();ctx.arc(x,y,pk.size*3.2,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#ffffff';
   ctx.beginPath();ctx.arc(x,y,pk.size*0.55,0,Math.PI*2);ctx.fill();
  }
  // Coordinator central jewel core
  const coreR=38+Math.sin(t*2.2)*2+burst*6;
  const halo=ctx.createRadialGradient(cx,cy,coreR*0.6,cx,cy,coreR*2.2);
  halo.addColorStop(0,`rgba(31,111,67,${0.26+burst*0.24})`);
  halo.addColorStop(1,'rgba(31,111,67,0)');
  ctx.fillStyle=halo;
  ctx.beginPath();ctx.arc(cx,cy,coreR*2.2,0,Math.PI*2);ctx.fill();
  const cg=ctx.createRadialGradient(cx-10,cy-12,4,cx,cy,coreR);
  cg.addColorStop(0,'#9bd676');
  cg.addColorStop(0.42,'#1f6f43');
  cg.addColorStop(1,'#0c2618');
  ctx.fillStyle=cg;
  ctx.beginPath();ctx.arc(cx,cy,coreR,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.55)';
  ctx.lineWidth=1.4;
  ctx.stroke();
  ctx.fillStyle='#ffffff';
  ctx.font='600 11.5px "DM Sans",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('UOS',cx,cy-6);
  ctx.fillStyle='rgba(232,245,228,0.92)';
  ctx.font='500 9.5px "DM Sans",sans-serif';
  ctx.fillText('Coordinator',cx,cy+8);
  // Specialist agent floating white pills
  const pillW=W<380?98:116,pillH=44;
  pos.forEach((p,i)=>{
   const a=agents[i];
   a.glow*=0.94;
   const x=p.px-pillW/2,y=p.py-pillH/2;
   ctx.save();
   ctx.shadowColor=`rgba(15,46,28,${0.14+a.glow*0.18})`;
   ctx.shadowBlur=22+a.glow*12;
   ctx.shadowOffsetY=10;
   roundRect(x,y,pillW,pillH,14);
   ctx.fillStyle='#ffffff';
   ctx.fill();
   ctx.restore();
   roundRect(x,y,pillW,pillH,14);
   ctx.strokeStyle=a.glow>0.1?`rgba(31,111,67,${0.25+a.glow*0.65})`:'rgba(31,111,67,0.18)';
   ctx.lineWidth=1.2;
   ctx.stroke();
   // Live status dot
   ctx.fillStyle=a.glow>0.15?'#1f6f43':'#7ec262';
   ctx.beginPath();ctx.arc(x+14,y+16,3.5+a.glow*1.2,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#142e20';
   ctx.font='600 12px "DM Sans",sans-serif';
   ctx.textAlign='left';ctx.textBaseline='middle';
   ctx.fillText(a.label,x+24,y+16);
   ctx.fillStyle='#556e5e';
   ctx.font='500 10px "DM Sans",sans-serif';
   ctx.fillText(a.sub,x+14,y+31);
  });
 }
 requestAnimationFrame(frame);
})();

// ReactBits-inspired interactive "Dot Grid" with ephemeral hover-generated UI frames
(function initDotGridUI(){
 const root=document.getElementById('dot-grid-ui');
 if(!root)return;
 const canvas=root.querySelector('.dot-grid-canvas');
 if(!canvas)return;
 const ctx=canvas.getContext('2d');
 if(!ctx)return;
 const gap=24,prox=115;
 let dots=[],frames=[],W=0,H=0,mx=-999,my=-999,lastSpawnX=-999,lastSpawnY=-999,lastAuto=0,visible=true,hovering=false;
 function buildDots(){
  dots=[];
  const cols=Math.floor((W-24)/gap),rows=Math.floor((H-24)/gap);
  const ox=(W-cols*gap)/2,oy=(H-rows*gap)/2;
  for(let r=0;r<=rows;r++){
   for(let c=0;c<=cols;c++){
    const x=ox+c*gap,y=oy+r*gap;
    dots.push({hx:x,hy:y,x,y,vx:0,vy:0});
   }
  }
 }
 function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const cw=Math.max(1,Math.round(canvas.clientWidth));
  const ch=Math.max(1,Math.round(canvas.clientHeight));
  if(cw!==W||ch!==H){
   W=cw;H=ch;
   canvas.width=cw*dpr;canvas.height=ch*dpr;
   ctx.setTransform(dpr,0,0,dpr,0,0);
   buildDots();
  }
 }
 function spawnFrame(x,y){
  const kind=Math.floor(Math.random()*3);
  const fw=kind===0?148:kind===1?132:156;
  const fh=kind===0?92:kind===1?84:76;
  const sx=Math.max(16,Math.min(W-fw-16,Math.round((x-fw/2)/gap)*gap));
  const sy=Math.max(16,Math.min(H-fh-16,Math.round((y-fh/2)/gap)*gap));
  frames.push({x:sx,y:sy,w:fw,h:fh,kind,born:performance.now(),life:920});
  if(frames.length>8)frames.shift();
 }
 function shock(x,y,strength=14){
  dots.forEach(d=>{
   const dx=d.x-x,dy=d.y-y,dist=Math.hypot(dx,dy);
   if(dist>0&&dist<130){
    const f=(1-dist/130)*strength;
    d.vx+=(dx/dist)*f;d.vy+=(dy/dist)*f;
   }
  });
 }
 canvas.addEventListener('pointermove',e=>{
  const r=canvas.getBoundingClientRect();
  const nx=e.clientX-r.left,ny=e.clientY-r.top;
  hovering=true;
  if(mx>-500){
   const speed=Math.hypot(nx-mx,ny-my);
   if(speed>6)shock(nx,ny,Math.min(9,speed*0.28));
  }
  mx=nx;my=ny;
  if(Math.hypot(nx-lastSpawnX,ny-lastSpawnY)>52){
   lastSpawnX=nx;lastSpawnY=ny;
   spawnFrame(nx,ny);
  }
 });
 canvas.addEventListener('pointerleave',()=>{hovering=false;mx=-999;my=-999;});
 canvas.addEventListener('click',e=>{
  const r=canvas.getBoundingClientRect();
  const nx=e.clientX-r.left,ny=e.clientY-r.top;
  shock(nx,ny,18);
  spawnFrame(nx,ny);
 });
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.05}).observe(root);
 }
 function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);
 }
 function drawUIFrame(f,now){
  const age=(now-f.born)/f.life;
  if(age>=1)return false;
  const enter=Math.min(1,age/0.16);
  const exit=age>0.55?1-(age-0.55)/0.45:1;
  const alpha=Math.max(0,enter*exit);
  const scale=0.92+enter*0.08-(1-exit)*0.04;
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.translate(f.x+f.w/2,f.y+f.h/2);
  ctx.scale(scale,scale);
  ctx.translate(-f.w/2,-f.h/2);
  ctx.shadowColor='rgba(15,46,28,0.16)';
  ctx.shadowBlur=22;ctx.shadowOffsetY=8;
  roundRect(0,0,f.w,f.h,13);
  ctx.fillStyle='rgba(255,255,248,0.95)';
  ctx.fill();
  ctx.shadowColor='transparent';
  ctx.strokeStyle='rgba(31,111,67,0.42)';
  ctx.lineWidth=1.25;
  ctx.stroke();
  // Mini window header dots + title bar
  ctx.fillStyle='rgba(31,111,67,0.88)';
  ctx.beginPath();ctx.arc(13,13,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(126,194,98,0.7)';
  ctx.beginPath();ctx.arc(22,13,3,0,Math.PI*2);ctx.fill();
  roundRect(32,10,48,6,3);
  ctx.fillStyle='rgba(20,46,32,0.14)';ctx.fill();
  if(f.kind===0){
   // Mini bar chart frame
   const heights=[18,32,24,42,36];
   heights.forEach((bh,bi)=>{
    roundRect(14+bi*24,f.h-14-bh,16,bh,4);
    ctx.fillStyle=bi===3?'#1f6f43':'#cce2c6';
    ctx.fill();
   });
  }else if(f.kind===1){
   // Mini checklist frame
   for(let li=0;li<3;li++){
    const ly=29+li*16;
    roundRect(14,ly,10,10,3);
    ctx.fillStyle=li<2?'#1f6f43':'#dcebd6';ctx.fill();
    roundRect(30,ly+2,f.w-46-(li*14),6,3);
    ctx.fillStyle='rgba(20,46,32,0.18)';ctx.fill();
   }
  }else{
   // Mini metric + pill CTA frame
   roundRect(14,28,64,12,4);ctx.fillStyle='#142e20';ctx.fill();
   roundRect(14,48,f.w-78,7,3.5);ctx.fillStyle='rgba(77,101,86,0.28)';ctx.fill();
   roundRect(f.w-54,36,40,22,11);ctx.fillStyle='#1f6f43';ctx.fill();
  }
  ctx.restore();
  return true;
 }
 function frame(now){
  requestAnimationFrame(frame);
  if(!visible)return;
  resize();
  ctx.clearRect(0,0,W,H);
  if(!hovering&&!reducedMotion?.matches&&now-lastAuto>1400){
   lastAuto=now;
   const ax=W*(0.24+Math.random()*0.52),ay=H*(0.24+Math.random()*0.52);
   shock(ax,ay,7);
   spawnFrame(ax,ay);
  }
  dots.forEach(d=>{
   d.vx=(d.vx+(d.hx-d.x)*0.14)*0.82;
   d.vy=(d.vy+(d.hy-d.y)*0.14)*0.82;
   d.x+=d.vx;d.y+=d.vy;
   const dist=Math.hypot(d.x-mx,d.y-my);
   const near=Math.max(0,1-dist/prox);
   const r=2.1+near*2.4;
   ctx.fillStyle=near>0.02?`rgba(31,111,67,${0.24+near*0.76})`:'rgba(20,46,32,0.18)';
   ctx.beginPath();ctx.arc(d.x,d.y,r,0,Math.PI*2);ctx.fill();
  });
  frames=frames.filter(f=>drawUIFrame(f,now));
 }
 requestAnimationFrame(frame);
})();

// Scrollspy for sticky left editorial rail chapters
(function initEditionRail(){
 const links=[...document.querySelectorAll('.rail-nav a[data-chapter]')];
 if(!links.length||'IntersectionObserver' in window===false)return;
 const map=new Map(links.map(a=>[a.dataset.chapter,a]));
 const io=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(entry.isIntersecting){
    links.forEach(a=>a.classList.remove('is-active'));
    map.get(entry.target.id)?.classList.add('is-active');
   }
  });
 },{rootMargin:'-25% 0px -55% 0px',threshold:0.01});
 links.forEach(a=>{const sec=document.getElementById(a.dataset.chapter);if(sec)io.observe(sec);});
})();

// Dynamic sticky top calculation so tall stacking layers scroll fully before pinning under the next layer
(function initStackLayers(){
 const layers=[...document.querySelectorAll('.stack-layer')];
 if(!layers.length)return;
 function updateTops(){
  const vh=window.innerHeight;
  layers.forEach(layer=>{
   const offset=Math.min(0,Math.round(vh-layer.offsetHeight));
   layer.style.top=`${offset}px`;
  });
 }
 updateTops();
 window.addEventListener('resize',updateTops,{passive:true});
 if('ResizeObserver' in window){
  const ro=new ResizeObserver(updateTops);
  layers.forEach(layer=>ro.observe(layer));
 }
})();
