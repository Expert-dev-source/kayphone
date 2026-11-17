// No demo photos: render only the current account's private signed images.
async function updateWidgetPhotos(){
  const grid=document.getElementById('widgetPhotos');if(!grid)return;
  const empty=(title,subtitle)=>{
    const wrapper=document.createElement('div');wrapper.className='kay-gallery-empty';
    const copy=document.createElement('div');const heading=document.createElement('strong');const detail=document.createElement('span');const arrow=document.createElement('b');
    heading.textContent=title;detail.textContent=subtitle;arrow.textContent='↗';
    copy.append(heading,detail);wrapper.append(copy,arrow);grid.replaceChildren(wrapper);
  };
  if(typeof Supa==='undefined'||!Supa.isConfigured){empty('Your photos, not placeholders','Cloud library needs Kay ID setup');return;}
  if(!Supa.getUser()){empty('Your private photo library','Sign in to load your photos');return;}
  try {
    const files=await Supa.photos.list();
    if(!files.length){empty('A space for memories','Open Photos to add your first picture');return;}
    const first=files.find(file=>/\.(?:png|jpe?g|webp|gif|avif)$/i.test(file.name));
    if(!first){empty('Your photo library','Open Photos to view your files');return;}
    const url=await Supa.photos.getSignedUrl(first.name,600);
    if(!url||!/^https:\/\//i.test(url)){empty('Photo preview unavailable','Open Photos to retry');return;}
    const image=document.createElement('img');image.className='kay-gallery-image';image.loading='lazy';image.alt='Your private photo';image.src=url;
    grid.replaceChildren(image);
  }catch(_){empty('Photos unavailable','Open Photos to retry');}
}
function updateCameraThumbnail(){}
function addFocusToCC(){}
function addScreenRecordToCC(){}
function showQuickActionToast(icon,msg){if(typeof showToast==='function')showToast(icon,msg);}
function applyWallpaper(url){
  if(!url)return;
  const value=String(url).trim();
  if(!/^(?:linear-gradient|radial-gradient)\(/.test(value)&&!/^(https?:\/\/|data:image\/|blob:)/i.test(value))return;
  currentWallpaper=value;
  try{localStorage.setItem('kayv3_wallpaper',value);}catch(_){}
  const wallpaper=document.getElementById('wallpaper');
  if(wallpaper) wallpaper.style.backgroundImage=/^(?:linear-gradient|radial-gradient)\(/.test(value)?value:'url("'+value.replace(/["\\]/g,'')+'")';
}



// Upgrade the legacy first-visit and lock surfaces immediately, before unlock.
(function upgradeShell(){
  document.title='Kay OS — Your space, in motion';
  const set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text;};
  set('faceIdLabel','Local screen lock');
  set('faceIdIcon','K');
  set('lockHint','Tap to open Kay OS');
  // The browser battery API is unavailable on many platforms; never invent 84%.
  set('lockBatteryPct','--');
  const welcome=document.querySelector('#onboarding [data-onboarding-slide="0"] h1');
  if(welcome){welcome.replaceChildren();welcome.append('Ideas deserve ');const span=document.createElement('span');span.textContent='space.';welcome.append(span);}
  const kicker=document.querySelector('#onboarding [data-onboarding-slide="0"] .onboarding-kicker');
  if(kicker)kicker.textContent='WELCOME TO KAY OS';
  const intro=document.querySelector('#onboarding [data-onboarding-slide="0"] p');
  if(intro)intro.textContent='A personal web workspace for thoughts, useful apps and creative life. Start with Kay Space.';
  const bootStamp=document.querySelector('#bootScreen > div:last-child');
  if(bootStamp&&bootStamp.textContent.includes('KAYPHONE OS'))bootStamp.textContent='KAY / OS — THE PERSONAL WEB';
  const label=document.getElementById('passcodeLabel');
  if(label&&!localStorage.getItem('kayv3_passcode')){
    const hint=document.createElement('small');
    hint.id='kayDemoHint';
    hint.textContent='First visit: demo screen code 123456. Local screen lock only; account sign-in is separate.';
    hint.style.cssText='display:block;max-width:245px;text-align:center;color:#bac9b0;font-size:11px;line-height:1.5;margin:0 auto 10px';
    label.after(hint);
  }
  // Save actual browser battery value when the platform supplies it.
  if(navigator.getBattery)navigator.getBattery().then(battery=>{
    const update=()=>set('lockBatteryPct',Math.round(battery.level*100)+'%');
    update();battery.addEventListener('levelchange',update);
  }).catch(()=>{});
})();

// Static index.html is legacy. Load the new UI through this existing, already-linked
// module until the document shell is migrated. Dependencies load in a known order.
(function bootstrapKayOS(){
  const version='20261117-2';
  ['css/experience.css','css/kay-space.css'].forEach(file=>{
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=file+'?v='+version;
    document.head.append(link);
  });
  function load(source,next){
    const script=document.createElement('script');
    script.src=source+'?v='+version;
    script.onload=next;
    script.onerror=()=>{console.warn('[Kay OS] Experience module unavailable:',source);};
    document.head.append(script);
  }
  load('js/experience.js',()=>{
    load('js/kay-space.js',()=>{
      // The original boot may have already called init(). Reconcile exactly once.
      if(typeof renderHome==='function')renderHome();
      if(typeof renderDock==='function')renderDock();
      if(window.KayExperience)KayExperience.init();
      if(window.KaySpace)KaySpace.refresh();
    });
  });
})();
