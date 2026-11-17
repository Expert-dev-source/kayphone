// Focus controls KayPhone in-app interruptions only, not OS notifications.
let kayFocusMode=localStorage.getItem('kayv3_focus')||'off';
function setFocus(mode){
  kayFocusMode=mode==='work'?'work':'off';
  try{localStorage.setItem('kayv3_focus',kayFocusMode);}catch(_){}
  document.body.dataset.focus=kayFocusMode;
  const tile=document.getElementById('ccDND');
  if(tile){
    tile.classList.toggle('on',kayFocusMode==='work');
    tile.setAttribute('aria-pressed',kayFocusMode==='work'?'true':'false');
    const caption=tile.querySelector('.cc-tile-label');
    if(caption)caption.textContent=kayFocusMode==='work'?'Focus on':'Focus';
  }
  if(window.KayExperience)KayExperience.refresh();
}
function addFocusToCC(){
  const tile=document.getElementById('ccDND');if(!tile)return;
  tile.setAttribute('role','button');tile.tabIndex=0;
  tile.onclick=function(e){e.stopPropagation();setFocus(kayFocusMode==='work'?'off':'work');};
  tile.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();tile.click();}});
  setFocus(kayFocusMode);
}
function addScreenRecordToCC(){}
