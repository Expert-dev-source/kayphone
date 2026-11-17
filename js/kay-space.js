/* Kay Space — a local-first, interactive creative board. No backend or secrets. */
(function () {
  'use strict';
  const STORAGE_KEY='kayos_space_v1';
  const FOCUS_KEY='kayos_space_focus_until';
  const MAX_ITEMS=150;
  let items=[];
  let activeFilter='all';
  let editingId=null;
  let focusInterval=null;
  let focusUntil=0;
  let search='';
  try {
    const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
    if(Array.isArray(stored))items=stored.filter(validCard).slice(0,MAX_ITEMS);
  }catch(_){}
  try { focusUntil=Math.max(0,Number(localStorage.getItem(FOCUS_KEY)||0)||0); }catch(_){}

  function validCard(card) {
    return !!card && typeof card.id==='string' && typeof card.title==='string' &&
      card.title.length<=100 && typeof card.body==='string' && card.body.length<=3000 &&
      ['note','task','link'].includes(card.kind);
  }
  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items));return true;}
    catch(_){if(typeof showToast==='function')showToast('!','Storage unavailable; export your work');return false;}
  }
  function node(tag,className,text){
    const element=document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined)element.textContent=text;
    return element;
  }
  function button(label,action,ariaLabel) {
    const element=node('button','space-action',label);
    element.type='button'; element.dataset.spaceAction=action;
    if(ariaLabel)element.setAttribute('aria-label',ariaLabel);
    return element;
  }
  function viewRoot(){return document.getElementById('kaySpaceRoot');}
  function count(kind){return items.filter(item=>item.kind===kind && (!('done' in item)||!item.done)).length;}
  function pending(){return items.filter(item=>item.kind==='task'&&!item.done).length;}
  function displayDate(ts){
    const val=new Date(ts);
    if(!Number.isFinite(val.getTime()))return 'Recently';
    return val.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  }
  function openSpace(){
    const body ='<div id="kaySpaceRoot" class="space-root"></div>';
    const view=getOrCreateView('space','',body);
    view.classList.add('space-app-view');
    view.classList.add('open');
    State.currentApp='space';
    const header=view.querySelector('.app-view-title');
    if(header)header.textContent='KAY / SPACE';
    render();
  }
  function drawHeader(root){
    const top=node('div','space-top');
    const kicker=node('div','space-kicker','YOUR PRIVATE WORKSPACE / 01');
    top.append(kicker);
    const title=node('h1','space-title','Ideas deserve space.');
    top.append(title);
    top.append(node('p','space-subtitle','Capture thoughts, finish what matters, and return when you are ready. Everything stays on this browser.'));
    root.append(top);
    const stats=node('div','space-stats');
    [
      ['01',String(items.length),'captured'],
      ['02',String(pending()),'open tasks'],
      ['03',String(items.filter(item=>item.pinned).length),'pinned']
    ].forEach(([num,value,label])=>{
      const cell=node('div','space-stat');
      cell.append(node('span','space-stat-num',num));
      cell.append(node('strong','space-stat-value',value));
      cell.append(node('small','space-stat-label',label));
      stats.append(cell);
    });
    root.append(stats);
  }
  function drawTools(root) {
    const actions=node('div','space-tools');
    const add=button('+ New idea','add');
    add.classList.add('space-primary');
    const task=button('✓ Task','task');
    const backup=button('↓ Export','export');
    actions.append(add,task,backup);
    root.append(actions);
    const filters=node('div','space-filterrow');
    ['all','note','task','link','pinned'].forEach(filter=>{
      const chip=button(filter==='all'?'All':filter==='pinned'?'Pinned':filter.charAt(0).toUpperCase()+filter.slice(1)+'s','filter:'+filter);
      chip.classList.add('space-chip');
      chip.setAttribute('aria-pressed',activeFilter===filter?'true':'false');
      filters.append(chip);
    });
    root.append(filters);
    const input=node('input','space-search');
    input.type='search'; input.placeholder='Find a thought, task, or link…';
    input.value=search; input.setAttribute('aria-label','Search your space');
    input.addEventListener('input',e=>{search=e.target.value;renderCards();});
    root.append(input);
  }
  function makeCard(item){
    const card=node('article','space-card space-'+item.kind+(item.pinned?' space-pinned':'')+(item.done?' space-done':''));
    card.dataset.spaceId=item.id;
    const top=node('div','space-card-top');
    top.append(node('span','space-card-kind',item.kind.toUpperCase()));
    top.append(node('small','space-card-date',displayDate(item.created)));
    const title=node('h3','space-card-title',item.title);
    const content=node('p','space-card-content',item.body||'');
    const actions=node('div','space-card-actions');
    if(item.kind==='task'){
      const toggle=button(item.done?'↺ Reopen':'✓ Complete','toggle:'+item.id);
      toggle.setAttribute('aria-pressed',item.done?'true':'false');
      actions.append(toggle);
    }
    if(item.kind==='link'&&/^https?:\/\//i.test(item.body)){
      const link=node('a','space-open-link','↗ Visit');
      link.href=item.body;link.target='_blank';link.rel='noopener noreferrer';
      actions.append(link);
    }
    actions.append(button('✎ Edit','edit:'+item.id,'Edit '+item.title));
    actions.append(button(item.pinned?'◇ Unpin':'◆ Pin','pin:'+item.id,'Pin '+item.title));
    actions.append(button('×','delete:'+item.id,'Delete '+item.title));
    card.append(top,title,content,actions);
    return card;
  }
  function renderCards(){
    const root=viewRoot();if(!root)return;
    const container=root.querySelector('#spaceCards');if(!container)return;
    container.replaceChildren();
    const q=search.trim().toLowerCase();
    const selected=items.filter(item=>
      (activeFilter==='all'||activeFilter==='pinned'&&item.pinned||item.kind===activeFilter) &&
      (!q||(item.title+' '+item.body).toLowerCase().includes(q))
    ).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||b.created-a.created);
    if(!selected.length){
      const empty=node('div','space-empty');
      empty.append(node('span','space-empty-symbol','✳'));
      empty.append(node('h3','',q?'Nothing matches.':'A blank space is a beginning.'));
      empty.append(node('p','',q?'Try a different search.':'Use New idea to capture what is on your mind. No dummy cards, no fake data.'));
      empty.append(button('+ Make the first card','add'));
      container.append(empty);
      return;
    }
    selected.forEach(item=>container.append(makeCard(item)));
  }
  function drawFocus(root){
    const panel=node('section','space-focus');
    panel.append(node('div','space-focus-kicker','DEEP WORK / LOCAL TIMER'));
    const row=node('div','space-focus-row');
    const copy=node('div','space-focus-copy');
    copy.append(node('h2','','Make room for focus.'));
    copy.append(node('p','','A simple 25-minute session. You can leave this screen; the timer continues.'));
    row.append(copy);
    const timer=node('strong','space-timer','25:00');timer.id='spaceTimer';
    row.append(timer);panel.append(row);
    const tools=node('div','space-focus-tools');
    tools.append(button('Start 25 min','focus:start'),button('End session','focus:stop'));
    panel.append(tools);
    root.append(panel);
  }
  function render(){
    const root=viewRoot();if(!root)return;
    root.replaceChildren();
    drawHeader(root);
    drawTools(root);
    const board=node('section','space-board');
    board.append(node('h2','space-section-title','THE BOARD'));
    const grid=node('div','space-cardgrid');grid.id='spaceCards';
    board.append(grid);root.append(board);
    drawFocus(root);
    root.append(node('div','space-footnote','LOCAL FIRST · Export to back up your space · No cloud sync'));
    renderCards();
    updateTimer();
    refreshHome();
  }
  function openEditor(kind,id){
    const root=viewRoot();if(!root)return;
    const existing=root.querySelector('.space-modal');
    if(existing)existing.remove();
    const card=id?items.find(item=>item.id===id):null;
    editingId=card?card.id:null;
    const overlay=node('div','space-modal');
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',card?'Edit card':'New card');
    const panel=node('form','space-form');
    panel.append(node('div','space-kicker',card?'EDIT YOUR CARD':'NEW / KAY SPACE'));
    panel.append(node('h2','space-form-title',card?'Refine your thought.':'Capture the moment.'));
    const typeLabel=node('label','space-label','Type');
    const type=node('select','space-input');type.name='kind';
    [['note','Thought'],['task','Task'],['link','Link']].forEach(([value,label])=>{
      const option=node('option','',label);option.value=value;
      type.append(option);
    });
    type.value=card?card.kind:(kind||'note');typeLabel.append(type);
    const titleLabel=node('label','space-label','Title');
    const title=node('input','space-input');
    title.name='title';title.required=true;title.maxLength=100;title.placeholder='Give it a name…';title.value=card?card.title:'';
    titleLabel.append(title);
    const detailLabel=node('label','space-label','Details or URL');
    const detail=node('textarea','space-input space-textarea');
    detail.name='body';detail.maxLength=3000;detail.rows=5;detail.placeholder='Write without distractions…';detail.value=card?card.body:'';
    detailLabel.append(detail);
    const controls=node('div','space-modal-buttons');
    const cancel=button('Cancel','cancel');cancel.classList.add('space-cancel');
    const submit=node('button','space-action space-primary','Save to Space');submit.type='submit';
    controls.append(cancel,submit);
    panel.append(typeLabel,titleLabel,detailLabel,controls);
    panel.addEventListener('submit',event=>{
      event.preventDefault();
      const name=title.value.trim(),body=detail.value.trim();
      if(!name)return;
      if(type.value==='link' && body && !/^https?:\/\//i.test(body)){
        detail.setCustomValidity('Links must begin with https:// or http://');
        detail.reportValidity();return;
      }
      detail.setCustomValidity('');
      if(card){
        card.title=name;card.body=body;card.kind=type.value;card.updated=Date.now();
      }else if(items.length<MAX_ITEMS){
        items.unshift({id:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
          title:name,body:body,kind:type.value,done:false,pinned:false,created:Date.now()});
      }else {if(typeof showToast==='function')showToast('!','150-card limit reached; export or delete a card');return;}
      save();editingId=null;render();
    });
    overlay.append(panel);root.append(overlay);
    requestAnimationFrame(()=>title.focus());
  }
  function updateTimer(){
    const timer=document.getElementById('spaceTimer');if(!timer)return;
    const remaining=Math.max(0,Math.ceil((focusUntil-Date.now())/1000));
    const left=remaining||(!focusUntil?1500:0);
    timer.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');
    if(focusUntil&&!remaining){
      focusUntil=0;
      try{localStorage.removeItem(FOCUS_KEY);}catch(_){}
      if(typeof setFocus==='function')setFocus('off');
      if(typeof showToast==='function')showToast('✓','Focus session complete');
    }
  }
  function focus(action){
    if(action==='start'){
      focusUntil=Date.now()+25*60*1000;
      try{localStorage.setItem(FOCUS_KEY,String(focusUntil));}catch(_){}
      if(typeof setFocus==='function')setFocus('work');
    }else{
      focusUntil=0;try{localStorage.removeItem(FOCUS_KEY);}catch(_){}
      if(typeof setFocus==='function')setFocus('off');
    }
    updateTimer();
  }
  function refreshHome(){
    const countEl=document.getElementById('kaySpaceCount');
    const nextEl=document.getElementById('kaySpaceNext');
    if(countEl)countEl.textContent=String(pending());
    if(nextEl){
      const next=items.find(item=>item.kind==='task'&&!item.done);
      nextEl.textContent=next?next.title:'Capture something worth keeping';
    }
  }
  function exportCards(){
    const data=JSON.stringify({version:1,exportedAt:new Date().toISOString(),cards:items},null,2);
    const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='kay-space-backup.json';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function handleAction(action){
    if(action==='add'){openEditor('note');return;}
    if(action==='task'){openEditor('task');return;}
    if(action==='cancel'){const modal=document.querySelector('.space-modal');if(modal)modal.remove();return;}
    if(action==='export'){exportCards();return;}
    if(action.startsWith('focus:')){focus(action.split(':')[1]);return;}
    if(action.startsWith('filter:')){activeFilter=action.split(':')[1];render();return;}
    const pos=action.indexOf(':');if(pos<0)return;
    const op=action.slice(0,pos),id=action.slice(pos+1),item=items.find(x=>x.id===id);
    if(!item)return;
    if(op==='edit'){openEditor(item.kind,id);return;}
    if(op==='toggle'){item.done=!item.done;}
    if(op==='pin'){item.pinned=!item.pinned;}
    if(op==='delete'){
      if(!confirm('Delete "'+item.title+'"?'))return;
      items=items.filter(x=>x.id!==id);
    }
    save();render();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-space-action]');
    if(!button)return;
    if(!button.closest('#kaySpaceRoot')&&!button.closest('[data-space-shortcut]'))return;
    event.preventDefault();handleAction(button.dataset.spaceAction);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&viewRoot()?.querySelector('.space-modal')){
      event.preventDefault();handleAction('cancel');
    }
  });
  // Ensure existing users receive the app without resetting their installed layout.
  if(!installedApps.some(app=>app.id==='space')){
    installedApps.unshift({id:'space',name:'Kay Space',icon:'✳',bg:'#d5f66b',page:0,badge:0});
    if(typeof saveData==='function')saveData();
  }
  Apps.space={open:openSpace,close:function(){const el=document.getElementById('view-space');if(el)el.classList.remove('open');}};
  window.KaySpace={open:openSpace,refresh:refreshHome,quickCapture:()=>{openApp('space');setTimeout(()=>openEditor('note'),30);}};
  if(!focusInterval)focusInterval=setInterval(updateTimer,1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateTimer();});
})();
