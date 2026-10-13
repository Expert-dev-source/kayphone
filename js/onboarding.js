// ===== FIRST-LAUNCH ONBOARDING =====
(function(){
  const KEY='kayv3_onboarding_complete';
  let index=0;
  function finish(){
    localStorage.setItem(KEY,'true');
    const overlay=document.getElementById('onboarding');
    if(overlay){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');}
  }
  function render(){
    const slides=[...document.querySelectorAll('[data-onboarding-slide]')],dots=document.getElementById('onboardingDots'),progress=document.getElementById('onboardingProgress'),next=document.getElementById('onboardingNext');
    slides.forEach((slide,i)=>slide.classList.toggle('active',i===index));
    if(dots)dots.innerHTML=slides.map((_,i)=>'<i class="'+(i===index?'active':'')+'"></i>').join('');
    if(progress)progress.style.width=((index+1)/slides.length*100)+'%';
    if(next)next.textContent=index===slides.length-1?'Enter KayPhone':'Continue';
  }
  function open(){
    if(localStorage.getItem(KEY)==='true')return;
    const overlay=document.getElementById('onboarding');if(!overlay)return;
    overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');render();
  }
  window.initOnboarding=function(){
    const overlay=document.getElementById('onboarding');if(!overlay)return;
    document.querySelectorAll('[data-onboarding-wall]').forEach(button=>{button.style.background=button.dataset.onboardingWall;button.addEventListener('click',()=>{document.querySelectorAll('[data-onboarding-wall]').forEach(b=>b.style.borderColor='transparent');button.style.borderColor='#fff';const value=button.dataset.onboardingWall;document.getElementById('wallpaper').style.backgroundImage=value;localStorage.setItem('kayv3_onboarding_wallpaper',value);});});
    const next=document.getElementById('onboardingNext');if(next)next.addEventListener('click',()=>{if(index===1){const name=(document.getElementById('onboardingName')||{}).value||'KayPhone',tag=(document.getElementById('onboardingTag')||{}).value||'Pro Max';localStorage.setItem('kayv3_boot_name',name);localStorage.setItem('kayv3_boot_tag',tag);if(typeof loadBootCustomization==='function')loadBootCustomization();}if(index<2){index++;render();}else finish();});
    const skip=document.getElementById('onboardingSkip');if(skip)skip.addEventListener('click',finish);
    open();
  };
})();
