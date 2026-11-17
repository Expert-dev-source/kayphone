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
