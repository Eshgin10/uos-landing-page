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

// Vertical dot feature showcase switcher
const featureSection=document.querySelector('.features-showcase');
const featureDots=[...document.querySelectorAll('[data-feature-dot]')];
const featureSlides=[...document.querySelectorAll('[data-feature-slide]')];
if(featureSection&&featureDots.length&&featureSlides.length){
 let activeFeature=0,featureTimer=null,featureAuto=!reducedMotion?.matches,featureInView=false,featureHover=false,slideAnim=null;
 function showFeature(nextIndex,focusDot=false){
  const idx=(nextIndex+featureSlides.length)%featureSlides.length;
  const changed=idx!==activeFeature;
  activeFeature=idx;
  slideAnim?.cancel();
  featureDots.forEach((dot,i)=>{const on=i===idx;dot.setAttribute('aria-selected',String(on));dot.tabIndex=on?0:-1;});
  featureSlides.forEach((slide,i)=>{const on=i===idx;slide.hidden=!on;slide.classList.toggle('is-active',on);});
  const activeSlide=featureSlides[idx];
  if(changed&&!reducedMotion?.matches&&activeSlide?.animate){
   slideAnim=activeSlide.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  if(focusDot)featureDots[idx]?.focus();
 }
 function stopFeatureAuto(){clearTimeout(featureTimer);featureTimer=null;}
 function scheduleFeatureAuto(){
  stopFeatureAuto();
  if(!featureAuto||reducedMotion?.matches||!featureInView||featureHover||document.hidden||featureSection.contains(document.activeElement))return;
  featureTimer=setTimeout(()=>{showFeature(activeFeature+1);scheduleFeatureAuto();},6500);
 }
 featureDots.forEach((dot,i)=>{
  dot.addEventListener('click',()=>{featureAuto=false;stopFeatureAuto();showFeature(i);});
  dot.addEventListener('keydown',event=>{
   if(!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
   event.preventDefault();featureAuto=false;stopFeatureAuto();
   if(event.key==='Home')showFeature(0,true);
   else if(event.key==='End')showFeature(featureSlides.length-1,true);
   else showFeature(i+(event.key==='ArrowDown'||event.key==='ArrowRight'?1:-1),true);
  });
 });
 featureSection.addEventListener('pointerenter',()=>{featureHover=true;stopFeatureAuto();});
 featureSection.addEventListener('pointerleave',()=>{featureHover=false;scheduleFeatureAuto();});
 featureSection.addEventListener('focusin',stopFeatureAuto);
 featureSection.addEventListener('focusout',()=>setTimeout(scheduleFeatureAuto,0));
 document.addEventListener('visibilitychange',scheduleFeatureAuto);
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{featureInView=entries[0].isIntersecting;scheduleFeatureAuto();},{threshold:.35}).observe(featureSection);
 }
 reducedMotion?.addEventListener?.('change',event=>{if(event.matches){featureAuto=false;stopFeatureAuto();slideAnim?.cancel();}});
}
