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

// Cinematic portal-frame scroll progression for hero
const heroStage=document.querySelector('.hero-stage');
if(heroStage&&!reducedMotion?.matches){
 let heroRaf=null;
 function syncHeroScroll(){
  heroRaf=null;
  const rect=heroStage.getBoundingClientRect();
  const range=Math.max(1,heroStage.offsetHeight-window.innerHeight*0.35);
  const raw=Math.max(0,Math.min(1,-rect.top/range));
  const eased=1-Math.pow(1-raw,2.2);
  heroStage.style.setProperty('--hero-p',eased.toFixed(4));
 }
 function onHeroScroll(){if(heroRaf===null)heroRaf=requestAnimationFrame(syncHeroScroll);}
 window.addEventListener('scroll',onHeroScroll,{passive:true});
 window.addEventListener('resize',onHeroScroll,{passive:true});
 syncHeroScroll();
}
