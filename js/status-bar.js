// ===== STATUS BAR =====
function updateStatusBar(){const clock=document.getElementById('statusTime');if(clock)clock.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}
setInterval(updateStatusBar,1000);
setTimeout(updateStatusBar,0);
