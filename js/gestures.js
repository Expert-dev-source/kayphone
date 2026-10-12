// ===== TOUCH + MOUSE GESTURES =====
function gestureInit(){
  const home=document.getElementById('homePages'); if(!home)return;
  let startX=0,startY=0,startTime=0;
  home.addEventListener('touchstart',e=>{const t=e.touches[0];startX=t.clientX;startY=t.clientY;startTime=Date.now();},{passive:true});
  home.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(Date.now()-startTime<700&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2){goToPage(State.homePage+(dx<0?1:-1));}},{passive:true});
}
