// ===== FOCUS + SCREEN RECORDING =====
let kayFocusMode = localStorage.getItem('kayv3_focus') || 'off';
function setFocus(mode){kayFocusMode=mode||'off';localStorage.setItem('kayv3_focus',kayFocusMode);document.body.dataset.focus=kayFocusMode;if(typeof showToast==='function'&&mode)showToast('🎯','Focus '+kayFocusMode);}
function addFocusToCC(){}
function addScreenRecordToCC(){}
