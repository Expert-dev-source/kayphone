// ===== UI EXTRAS =====
function updateWidgetPhotos(){}
function updateCameraThumbnail(){}
function addFocusToCC(){}
function addScreenRecordToCC(){}
function showQuickActionToast(icon,msg){if(typeof showToast==='function')showToast(icon,msg);}
function applyWallpaper(url){
  if(!url)return;
  currentWallpaper=url;
  try{localStorage.setItem('kayv3_wallpaper',url);}catch(e){}
  const wallpaper=document.getElementById('wallpaper');
  if(wallpaper)wallpaper.style.backgroundImage='url("'+String(url).replace(/"/g,'')+'")';
}
