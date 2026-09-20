// ===== STORE =====
Apps.store = {
  open: function() {
    const old = document.getElementById('view-store');
    if (old) old.remove();
    const view = getOrCreateView('store', 'Kay Store',
      '<div style="padding:24px 20px 0;">' +
        '<div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Kay Store</div>' +
        '<div style="font-size:13px;color:var(--ios-text-secondary);margin-top:4px;">Your app ecosystem — install, launch, and manage experiences</div>' +
      '</div>' +
      '<div style="margin:16px 16px 0;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border-radius:14px;padding:11px 14px;">' +
        '<span style="font-size:17px;color:var(--ios-text-secondary);">⌕</span><input id="storeSearch" type="search" placeholder="Search apps and categories" aria-label="Search Kay Store" oninput="renderStore()" style="flex:1;background:transparent;border:0;outline:0;color:#fff;font-size:15px;min-width:0;">' +
      '</div>' +
      '<div id="storeFilters" style="display:flex;gap:8px;overflow-x:auto;padding:14px 16px 2px;scrollbar-width:none;">' +
        ['Featured','Productivity','Creative','Games','Social','Utilities'].map(function(c,i) { return '<button type="button" class="store-filter ' + (i===0?'active':'') + '" data-storecategory="' + c + '" onclick="selectStoreCategory(\'' + c + '\')">' + c + '</button>'; }).join('') +
      '</div>' +
      '<div style="margin:16px 16px 0;" data-upload="app">' +
        '<div style="background:linear-gradient(135deg,rgba(10,132,255,0.15),rgba(191,90,242,0.15));border:2px dashed rgba(255,255,255,0.2);border-radius:22px;padding:28px 20px;text-align:center;cursor:pointer;">' +
          '<div style="width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,var(--ios-blue),var(--ios-purple));display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 12px;">📤</div>' +
          '<div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:6px;">Upload HTML App</div>' +
          '<div style="font-size:13px;color:var(--ios-text-secondary);line-height:1.5;">Select any <strong style="color:rgba(255,255,255,0.7);">.html</strong> file — all HTML, CSS and JS will run inside the phone</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:20px 16px 0;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><div style="font-size:13px;font-weight:700;color:var(--ios-text-secondary);text-transform:uppercase;letter-spacing:0.6px;">Discover</div><span id="storeResultCount" style="font-size:11px;color:var(--ios-text-tertiary);"></span></div>' +
        '<div id="storeAvailable"></div>' +
      '</div>' +
      '<div style="padding:20px 16px 16px;">' +
        '<div style="font-size:13px;font-weight:700;color:var(--ios-text-secondary);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:12px;">Built-in Apps</div>' +
        '<div id="storeInstalled" style="display:flex;flex-direction:column;gap:6px;"></div>' +
      '</div>'
    );
    setTimeout(function() { view.classList.add('open'); renderStore(); }, 10);
    State.currentApp = 'store';
  },
  close: function() {
    const v = document.getElementById('view-store');
    if (v) v.classList.remove('open');
    State.currentApp = null;
  }
};

const KAY_STORE_CATALOG = [
  {id:'notes',name:'Notes+',icon:'📝',category:'Productivity',desc:'Capture ideas, checklists, and polished notes.',bg:'linear-gradient(135deg,#FFD60A,#FF9F0A)'},
  {id:'assistant',name:'Kay AI',icon:'🤖',category:'Utilities',desc:'A calm voice assistant for your phone.',bg:'linear-gradient(135deg,#5E5CE6,#BF5AF2)'},
  {id:'studio',name:'Studio',icon:'🎨',category:'Creative',desc:'Create, remix, and share your next idea.',bg:'linear-gradient(135deg,#FF375F,#BF5AF2)'},
  {id:'games',name:'Kay Arcade',icon:'🎮',category:'Games',desc:'Three polished quick games designed for KayPhone.',bg:'linear-gradient(135deg,#0A84FF,#30D158)'},
  {id:'kaychat',name:'KayChat',icon:'💬',category:'Social',desc:'Keep conversations close and expressive.',bg:'linear-gradient(135deg,#25D366,#128C7E)'},
  {id:'files',name:'Files',icon:'📁',category:'Utilities',desc:'Organize downloads and cloud documents.',bg:'linear-gradient(135deg,#5E5CE6,#0A84FF)'}
];
let selectedStoreCategory = 'Featured';
function selectStoreCategory(category) {
  selectedStoreCategory = category;
  document.querySelectorAll('.store-filter').forEach(function(btn) { btn.classList.toggle('active', btn.dataset.storecategory === category); });
  renderStore();
}


// ===== STOCKS =====
Apps.stocks = {
  open: function() {
    const stocks = [
      {symbol:'AAPL',name:'Apple Inc.',price:189.52,change:+1.24,up:true},
      {symbol:'GOOGL',name:'Alphabet Inc.',price:142.18,change:-0.86,up:false},
      {symbol:'MSFT',name:'Microsoft',price:378.91,change:+2.15,up:true},
      {symbol:'TSLA',name:'Tesla Inc.',price:238.45,change:-3.21,up:false},
      {symbol:'NVDA',name:'NVIDIA Corp',price:495.22,change:+5.67,up:true}
    ];
    const old = document.getElementById('view-stocks');
    if (old) old.remove();
    const view = getOrCreateView('stocks', 'Stocks',
      '<div style="padding:0 16px;">' +
        '<div style="font-size:32px;font-weight:700;margin-bottom:16px;color:#fff;">Stocks</div>' +
        stocks.map(s =>
          '<div style="display:flex;align-items:center;padding:14px 0;border-bottom:1px solid var(--ios-border);color:#fff;">' +
            '<div style="width:60px;"><div style="font-size:18px;font-weight:700;">' + s.symbol + '</div><div style="font-size:14px;color:var(--ios-text-secondary);">' + s.name + '</div></div>' +
            '<div style="width:80px;height:40px;margin:0 10px;"><svg width="80" height="40" style="opacity:0.6;"><polyline points="' + (s.up ? '10,30 30,20 50,15 70,8' : '10,10 30,18 50,22 70,30') + '" fill="none" stroke="' + (s.up ? 'var(--ios-green)' : 'var(--ios-red)') + '" stroke-width="2"/></svg></div>' +
            '<div style="flex:1;text-align:right;font-size:16px;font-weight:600;">$' + s.price + '</div>' +
            '<div style="width:60px;text-align:right;font-size:13px;font-weight:600;color:' + (s.change > 0 ? 'var(--ios-green)' : 'var(--ios-red)') + ';">' + (s.change > 0 ? '+' : '') + s.change + '%</div>' +
          '</div>'
        ).join('') +
      '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'stocks';
  },
  close: function() { const v = document.getElementById('view-stocks'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

// ===== KAY ARCADE =====
let snakeGame = null, snakeDx = 1, snakeDy = 0, stackGame = null, memoryState = null;
Apps.games = {
  open: function() {
    const old = document.getElementById('view-games'); if (old) old.remove();
    const view = getOrCreateView('games', 'Kay Arcade',
      '<div class="arcade-shell">' +
        '<div class="arcade-hero"><div class="arcade-kicker">KAY ORIGINALS · 01</div><div class="arcade-title">Play something<br><span>beautiful.</span></div><div class="arcade-subtitle">Quick games built for KayPhone. No ads. No waiting.</div><div class="arcade-stats"><span>🏆 Best score <b id="arcadeBestScore">' + (localStorage.getItem('kayv3_best_score') || '0') + '</b></span><span>⚡ 3 games</span></div></div>' +
        '<div class="arcade-section-label">CHOOSE A GAME</div>' +
        '<div class="arcade-game-list">' +
          '<button class="arcade-card arcade-snake" onclick="openSnake()"><span class="arcade-art">✦</span><span><b>Neon Snake</b><small>Classic chase · swipe or tap</small></span><i>›</i></button>' +
          '<button class="arcade-card arcade-stack" onclick="openStackRush()"><span class="arcade-art">▰</span><span><b>Stack Rush</b><small>Place the block · beat your best</small></span><i>›</i></button>' +
          '<button class="arcade-card arcade-memory" onclick="openMemoryFlip()"><span class="arcade-art">◈</span><span><b>Memory Flip</b><small>Match the pairs · train your brain</small></span><i>›</i></button>' +
        '</div>' +
        '<div id="gameArea" class="game-area"></div>' +
      '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10); State.currentApp = 'games';
  },
  close: function() { if (snakeGame) clearInterval(snakeGame); if (stackGame) cancelAnimationFrame(stackGame); const v = document.getElementById('view-games'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

function arcadeBackToGames() { const area = document.getElementById('gameArea'); if (area) area.innerHTML = ''; }
function arcadeScore(score) { const best = Math.max(Number(localStorage.getItem('kayv3_best_score') || 0), score); localStorage.setItem('kayv3_best_score', best); const node = document.getElementById('arcadeBestScore'); if (node) node.textContent = best; }
function openSnake() {
  const area = document.getElementById('gameArea'); if (!area) return;
  area.innerHTML = '<div class="game-topline"><button onclick="arcadeBackToGames()">‹ Arcade</button><b>Neon Snake</b><span id="snakeScoreLabel">0</span></div><canvas id="snakeCanvas" width="300" height="300" class="game-canvas"></canvas><button class="game-primary" onclick="startSnake()">Start Run</button><div class="game-pad"><span></span><button onclick="snakeDir(0,-1)">▲</button><span></span><button onclick="snakeDir(-1,0)">◀</button><button onclick="snakeDir(0,1)">▼</button><button onclick="snakeDir(1,0)">▶</button></div><div class="game-hint">Swipe the board or use the controls</div>';
  const canvas = document.getElementById('snakeCanvas'); let sx, sy;
  canvas.addEventListener('touchstart', e => { sx=e.touches[0].clientX; sy=e.touches[0].clientY; }, {passive:true});
  canvas.addEventListener('touchend', e => { const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy; if(Math.abs(dx)>Math.abs(dy)) snakeDir(dx>0?1:-1,0); else if(Math.abs(dy)>12) snakeDir(0,dy>0?1:-1); }, {passive:true});
}
function snakeDir(dx, dy) { if (snakeDx + dx === 0 && snakeDy + dy === 0) return; snakeDx = dx; snakeDy = dy; }
function startSnake() {
  const canvas = document.getElementById('snakeCanvas'); if (!canvas) return; const ctx = canvas.getContext('2d'), size=15,count=20;
  let snake=[{x:10,y:10}], apple={x:15,y:15}, score=0; snakeDx=1; snakeDy=0; if(snakeGame) clearInterval(snakeGame);
  function draw(){ ctx.fillStyle='#070b16';ctx.fillRect(0,0,300,300);ctx.strokeStyle='rgba(100,210,255,.06)';for(let i=0;i<20;i++){ctx.beginPath();ctx.moveTo(i*15,0);ctx.lineTo(i*15,300);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*15);ctx.lineTo(300,i*15);ctx.stroke();}ctx.shadowBlur=12;ctx.shadowColor='#64D2FF';ctx.fillStyle='#64D2FF';snake.forEach((s,i)=>ctx.fillRect(s.x*size+1,s.y*size+1,size-3,size-3));ctx.shadowColor='#FF375F';ctx.fillStyle='#FF375F';ctx.beginPath();ctx.arc(apple.x*size+7,apple.y*size+7,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  draw(); snakeGame=setInterval(()=>{const head={x:snake[0].x+snakeDx,y:snake[0].y+snakeDy};if(head.x<0||head.x>=count||head.y<0||head.y>=count||snake.some(s=>s.x===head.x&&s.y===head.y)){clearInterval(snakeGame);arcadeScore(score);showToast('💥','Run over · '+score+' points');return;}snake.unshift(head);if(head.x===apple.x&&head.y===apple.y){score+=10;const label=document.getElementById('snakeScoreLabel');if(label)label.textContent=score;do{apple={x:Math.floor(Math.random()*count),y:Math.floor(Math.random()*count)}}while(snake.some(s=>s.x===apple.x&&s.y===apple.y));}else snake.pop();draw();},105);
}

function openStackRush(){const area=document.getElementById('gameArea');if(!area)return;area.innerHTML='<div class="game-topline"><button onclick="arcadeBackToGames()">‹ Arcade</button><b>Stack Rush</b><span id="stackScoreLabel">0</span></div><canvas id="stackCanvas" width="300" height="360" class="game-canvas"></canvas><button class="game-primary" onclick="startStackRush()">Start Run</button><div class="game-hint">Tap anywhere to drop the moving block</div>';const canvas=document.getElementById('stackCanvas');canvas.onclick=dropStackBlock;}
function startStackRush(){const c=document.getElementById('stackCanvas');if(!c)return;const ctx=c.getContext('2d');let blocks=[{x:70,w:160,y:330}],moving={x:0,w:160,y:300,dir:1},score=0;function draw(){ctx.fillStyle='#090716';ctx.fillRect(0,0,300,360);ctx.strokeStyle='rgba(191,90,242,.08)';for(let y=0;y<360;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(300,y);ctx.stroke()}blocks.forEach((b,i)=>{ctx.fillStyle=i%2?'#0A84FF':'#BF5AF2';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=16;ctx.fillRect(b.x,b.y,b.w,24)});ctx.fillStyle='#FF9F0A';ctx.shadowColor='#FF9F0A';ctx.fillRect(moving.x,moving.y,moving.w,24);ctx.shadowBlur=0}function tick(){moving.x+=moving.dir*3;if(moving.x<0||moving.x+moving.w>300)moving.dir*=-1;draw();stackGame=requestAnimationFrame(tick)}window._stack={blocks,moving,ctx,draw,score};draw();if(stackGame)cancelAnimationFrame(stackGame);stackGame=requestAnimationFrame(tick)}
function dropStackBlock(){const g=window._stack;if(!g||!g.moving)return;const last=g.blocks[g.blocks.length-1],left=Math.max(g.moving.x,last.x),right=Math.min(g.moving.x+g.moving.w,last.x+last.w),w=right-left;if(w<18){cancelAnimationFrame(stackGame);arcadeScore(g.score);showToast('💥','Stack ended · '+g.score+' points');return;}g.blocks.push({x:left,w:w,y:last.y-27});g.moving={x:0,w:w,y:last.y-54,dir:1};g.score+=10;const label=document.getElementById('stackScoreLabel');if(label)label.textContent=g.score;}

function openMemoryFlip(){const area=document.getElementById('gameArea');if(!area)return;const symbols=['✦','✧','◈','◇','●','○'];memoryState={open:[],matched:[],moves:0};area.innerHTML='<div class="game-topline"><button onclick="arcadeBackToGames()">‹ Arcade</button><b>Memory Flip</b><span id="memoryMovesLabel">0 moves</span></div><div id="memoryBoard" class="memory-board"></div><button class="game-primary" onclick="openMemoryFlip()">New Game</button><div class="game-hint">Find every matching pair</div>';const deck=symbols.concat(symbols).sort(()=>Math.random()-.5),board=document.getElementById('memoryBoard');board.innerHTML=deck.map((s,i)=>'<button class="memory-card" data-memory-index="'+i+'" data-memory-symbol="'+s+'" onclick="flipMemoryCard('+i+')"><span>?</span></button>').join('');memoryState.deck=deck;}
function flipMemoryCard(i){if(!memoryState||memoryState.matched.includes(i)||memoryState.open.includes(i)||memoryState.open.length===2)return;memoryState.open.push(i);const cards=document.querySelectorAll('.memory-card');cards[i].classList.add('flipped');cards[i].querySelector('span').textContent=memoryState.deck[i];if(memoryState.open.length===2){memoryState.moves++;document.getElementById('memoryMovesLabel').textContent=memoryState.moves+' moves';const[a,b]=memoryState.open;if(memoryState.deck[a]===memoryState.deck[b]){memoryState.matched.push(a,b);memoryState.open=[];if(memoryState.matched.length===memoryState.deck.length){arcadeScore(Math.max(10,100-memoryState.moves*3));showToast('🏆','Perfect match!');}}else setTimeout(()=>{cards[a].classList.remove('flipped');cards[b].classList.remove('flipped');memoryState.open=[];},650);}}

// ===== LIVE KAY SOCIAL =====
// All Kay social surfaces share the same Supabase tables. The network label
// keeps each app's feed separate while giving the user one identity, likes,
// comments, and follow graph across KayBook, KayTok, KayTube, and KayGram.
const LIVE_SOCIAL_META = {
  kaybook: {title:'KayBook', network:'kaybook', accent:'linear-gradient(135deg,#1877F2,#0A84FF)', prompt:'Share an update with your Kay circle…', icon:'📘'},
  kaytok: {title:'KayTok', network:'kaytok', accent:'linear-gradient(135deg,#ff0050,#00f2ea)', prompt:'Post a short KayTok thought or clip note…', icon:'🎵'},
  kaytube: {title:'KayTube', network:'kaytube', accent:'linear-gradient(135deg,#FF0000,#CC0000)', prompt:'Share a video title or channel update…', icon:'▶️'},
  kaygram: {title:'KayGram', network:'kaygram', accent:'linear-gradient(135deg,#E1306C,#F77737)', prompt:'Share a photo caption or moment…', icon:'📷'}
};
function liveSocialAuthor(post){const p=post.profiles||{};return escapeHtml(p.kay_id||p.display_name||'Kay member');}
function liveSocialTime(value){try{return new Intl.DateTimeFormat([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value));}catch(e){return 'Recently';}}
function liveSocialEmpty(meta, text){return '<div class="social-empty"><div style="font-size:34px;">'+meta.icon+'</div><b>'+text+'</b><span>Connect Supabase and sign in with Kay ID to make this feed live.</span></div>';}
async function loadLiveSocial(meta){
  const list=document.getElementById('liveSocialList_'+meta.network); if(!list)return;
  if(!Supa.isConfigured||!Supa.getUser()){list.innerHTML=liveSocialEmpty(meta,'Kay Social is ready');return;}
  list.innerHTML='<div class="social-loading">Loading live posts…</div>';
  const result=await Supa.social.listPosts(meta.network,40);
  if(result.error){list.innerHTML=liveSocialEmpty(meta,'Could not load this feed');return;}
  const posts=result.data||[];
  if(!posts.length){list.innerHTML=liveSocialEmpty(meta,'Be the first to post');return;}
  const counts=await Supa.social.getLikeCounts(posts.map(p=>p.id)); const likes={};(counts.data||[]).forEach(l=>{likes[l.post_id]=(likes[l.post_id]||0)+1;});
  list.innerHTML=posts.map(p=>'<article class="social-post" data-social-post="'+p.id+'"><div class="social-post-head"><div class="social-avatar" style="background:'+meta.accent+'">'+meta.icon+'</div><div><b>'+liveSocialAuthor(p)+'</b><small>'+liveSocialTime(p.created_at)+'</small></div></div><div class="social-post-copy">'+escapeHtml(p.content)+'</div>'+(p.media_url?'<a class="social-post-media" href="'+escapeHtml(p.media_url)+'" target="_blank" rel="noopener">Open attached media</a>':'')+'<div class="social-post-actions"><button data-social-like="'+p.id+'">♡ '+(likes[p.id]||0)+'</button><button data-social-comments="'+p.id+'">💬 Comments</button><button data-social-follow="'+p.author_id+'">＋ Follow</button><button data-social-share="'+p.id+'">↗ Share</button></div><div class="social-comment-box" id="socialComments_'+p.id+'"></div></article>').join('');
}
function openLiveSocialApp(id){
  const meta=LIVE_SOCIAL_META[id]; const old=document.getElementById('view-'+id);if(old)old.remove();
  const view=getOrCreateView(id,meta.title,'<div class="live-social-shell"><div class="live-social-brand" style="background:'+meta.accent+'"><div><span>'+meta.icon+' KAY SOCIAL</span><h2>'+meta.title+'</h2><p>Real posts from your Kay community.</p></div></div><form class="social-composer" data-social-compose="'+meta.network+'"><textarea maxlength="2000" placeholder="'+meta.prompt+'" required></textarea><div><small>Signed in with Kay ID</small><button type="submit">Post</button></div></form><div class="social-feed-label">LATEST FROM KAY MEMBERS</div><div id="liveSocialList_'+meta.network+'"></div></div>');
  setTimeout(()=>view.classList.add('open'),10);State.currentApp=id;loadLiveSocial(meta);
}
Apps.kaybook={open:()=>openLiveSocialApp('kaybook'),close:()=>{const v=document.getElementById('view-kaybook');if(v)v.classList.remove('open');State.currentApp=null;}};
Apps.kaytok={open:()=>openLiveSocialApp('kaytok'),close:()=>{const v=document.getElementById('view-kaytok');if(v)v.classList.remove('open');State.currentApp=null;}};
Apps.kaytube={open:()=>openLiveSocialApp('kaytube'),close:()=>{const v=document.getElementById('view-kaytube');if(v)v.classList.remove('open');State.currentApp=null;}};
Apps.kaygram={open:()=>openLiveSocialApp('kaygram'),close:()=>{const v=document.getElementById('view-kaygram');if(v)v.classList.remove('open');State.currentApp=null;}};
document.addEventListener('submit',async function(e){
  const comment=e.target.closest('[data-comment-post]');
  if(comment){e.preventDefault();const input=comment.querySelector('input'),btn=comment.querySelector('button');if(btn)btn.disabled=true;const result=await Supa.social.addComment(comment.dataset.commentPost,input.value);if(result.error)showToast('⚠️',result.error.message);else{input.value='';showToast('💬','Comment added');const post=document.querySelector('[data-social-post="'+comment.dataset.commentPost+'"] button[data-social-comments]');if(post)post.click();}if(btn)btn.disabled=false;return;}
  const form=e.target.closest('[data-social-compose]');if(!form)return;e.preventDefault();const btn=form.querySelector('button'),text=form.querySelector('textarea').value.trim(),network=form.dataset.socialCompose;if(btn)btn.disabled=true;const result=await Supa.social.createPost(network,text);if(result.error)showToast('⚠️',result.error.message);else{form.querySelector('textarea').value='';showToast('✅','Posted to Kay Social');loadLiveSocial(LIVE_SOCIAL_META[network]);}if(btn)btn.disabled=false;
});
document.addEventListener('click',async function(e){const like=e.target.closest('[data-social-like]');if(like){const r=await Supa.social.toggleLike(like.dataset.socialLike);if(r.error)showToast('⚠️',r.error.message);else loadLiveSocial(LIVE_SOCIAL_META[State.currentApp]);return;}const follow=e.target.closest('[data-social-follow]');if(follow){const r=await Supa.social.toggleFollow(follow.dataset.socialFollow);if(r.error)showToast('⚠️',r.error.message);else{follow.textContent='✓ Following';showToast('👤','Following Kay member');}return;}const share=e.target.closest('[data-social-share]');if(share){try{await navigator.clipboard.writeText(location.href+'#post-'+share.dataset.socialShare);showToast('↗','Post link copied');}catch(err){showToast('↗','Share link ready');}return;}const comments=e.target.closest('[data-social-comments]');if(comments){const box=document.getElementById('socialComments_'+comments.dataset.socialComments);if(!box)return;box.innerHTML='<div class="social-comment-loading">Loading comments…</div>';const r=await Supa.social.listComments(comments.dataset.socialComments);if(r.error){box.innerHTML='<small>'+escapeHtml(r.error.message)+'</small>';return;}box.innerHTML=(r.data||[]).map(c=>'<div><b>'+liveSocialAuthor(c)+'</b> '+escapeHtml(c.body)+'</div>').join('')+'<form class="social-comment-form" data-comment-post="'+comments.dataset.socialComments+'"><input maxlength="500" placeholder="Add a comment…" required><button>Send</button></form>';}});

// ===== SOCIAL APPS =====
Apps.kaybook = {
  open: function() {
    const old = document.getElementById('view-kaybook'); if (old) old.remove();
    const posts = [
      {user:'Sarah Johnson',avatar:'👩',time:'2h ago',content:'Just finished the new project! So excited to share it with everyone. 🎉',likes:24,comments:5},
      {user:'Mike Chen',avatar:'👨',time:'4h ago',content:'Beautiful sunset from my vacation! 🌅',likes:156,comments:23},
      {user:'Kay Store',avatar:'🛒',time:'5h ago',content:'New apps available now! 📱',likes:89,comments:12}
    ];
    const view = getOrCreateView('kaybook', 'KayBook',
      '<div style="padding:0 16px;">' +
        '<div style="display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid var(--ios-border);">' +
          '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--ios-blue),var(--ios-purple));display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>' +
          '<div style="flex:1;background:rgba(255,255,255,0.08);border-radius:20px;padding:10px 16px;color:var(--ios-text-secondary);font-size:14px;cursor:pointer;" data-toast="✏️|Create post">What\'s on your mind?</div>' +
        '</div>' +
        posts.map(p =>
          '<div style="padding:16px 0;border-bottom:1px solid var(--ios-border);color:#fff;">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
              '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--ios-purple),var(--ios-pink));display:flex;align-items:center;justify-content:center;font-size:20px;">' + p.avatar + '</div>' +
              '<div><div style="font-size:15px;font-weight:600;">' + p.user + '</div><div style="font-size:12px;color:var(--ios-text-secondary);">' + p.time + '</div></div>' +
            '</div>' +
            '<div style="font-size:14px;line-height:1.5;margin-bottom:12px;">' + p.content + '</div>' +
            '<div style="display:flex;gap:20px;font-size:13px;color:var(--ios-text-secondary);">' +
              '<span style="cursor:pointer;" data-toast="❤️|Liked!">❤️ ' + p.likes + '</span>' +
              '<span style="cursor:pointer;" data-toast="💬|Commented!">💬 ' + p.comments + '</span>' +
              '<span style="cursor:pointer;" data-toast="🔄|Shared!">🔄</span>' +
            '</div>' +
          '</div>'
        ).join('') +
      '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'kaybook';
  },
  close: function() { const v = document.getElementById('view-kaybook'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

Apps.kaychat = {
  open: function() {
    const old = document.getElementById('view-kaychat'); if (old) old.remove();
    const chats = [
      {name:'Mom',avatar:'👩',msg:'Are you coming for dinner?',time:'2m',unread:2},
      {name:'Dad',avatar:'👨',msg:'Send me the file',time:'15m',unread:0},
      {name:'Work Group',avatar:'👥',msg:'Meeting at 3 PM',time:'1h',unread:5},
    ];
    const view = getOrCreateView('kaychat', 'KayChat',
      '<div style="padding:0 16px;"><div style="font-size:28px;font-weight:700;padding:16px 0;color:#fff;">KayChat</div>' +
      chats.map(c =>
        '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;color:#fff;" data-toast="💬|Opening chat...">' +
          '<div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--ios-green),var(--ios-teal));display:flex;align-items:center;justify-content:center;font-size:22px;">' + c.avatar + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;justify-content:space-between;"><span style="font-size:16px;font-weight:600;">' + c.name + '</span><span style="font-size:12px;color:var(--ios-text-secondary);">' + c.time + '</span></div>' +
            '<div style="font-size:14px;color:var(--ios-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + c.msg + (c.unread ? '<span style="display:inline-block;width:18px;height:18px;background:var(--ios-green);color:#fff;border-radius:50%;font-size:11px;text-align:center;line-height:18px;margin-left:6px;">' + c.unread + '</span>' : '') + '</div>' +
          '</div>' +
        '</div>'
      ).join('') + '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'kaychat';
  },
  close: function() { const v = document.getElementById('view-kaychat'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

Apps.kaytok = {
  open: function() {
    const old = document.getElementById('view-kaytok'); if (old) old.remove();
    const vids = [
      {user:'@dancequeen',desc:'New dance trend! 💃',likes:'1.2M',comments:'45K'},
      {user:'@techguy',desc:'KayPhone review! 📱',likes:'2.1M',comments:'89K'},
      {user:'@funnyclips',desc:'When your code works first try 😂',likes:'3.4M',comments:'120K'}
    ];
    const view = getOrCreateView('kaytok', 'KayTok',
      '<div style="height:100%;overflow-y:auto;scroll-snap-type:y mandatory;">' +
      vids.map(v =>
        '<div style="height:100vh;scroll-snap-align:start;display:flex;flex-direction:column;justify-content:flex-end;padding:20px;position:relative;background:linear-gradient(180deg,#111 0%,#000 100%);color:#fff;">' +
          '<div style="position:absolute;right:16px;bottom:100px;display:flex;flex-direction:column;gap:16px;align-items:center;">' +
            '<div style="text-align:center;cursor:pointer;" data-toast="❤️|Liked!"><div style="font-size:28px;">❤️</div><div style="font-size:12px;">' + v.likes + '</div></div>' +
            '<div style="text-align:center;cursor:pointer;" data-toast="💬|Commented!"><div style="font-size:28px;">💬</div><div style="font-size:12px;">' + v.comments + '</div></div>' +
          '</div>' +
          '<div style="margin-bottom:20px;"><div style="font-size:16px;font-weight:600;margin-bottom:4px;">' + v.user + '</div><div style="font-size:14px;color:rgba(255,255,255,0.7);">' + v.desc + '</div></div>' +
        '</div>'
      ).join('') + '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'kaytok';
  },
  close: function() { const v = document.getElementById('view-kaytok'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

Apps.kaytube = {
  open: function() {
    const old = document.getElementById('view-kaytube'); if (old) old.remove();
    const vids = [
      {title:'How to build a phone OS in HTML',channel:'Kay Tech',views:'1.2M views',time:'2 days ago',dur:'12:45'},
      {title:'iPhone 15 Pro vs KayPhone 15 Pro',channel:'Tech Review',views:'3.4M views',time:'1 week ago',dur:'8:32'},
      {title:'Top 10 Web APIs You Did Not Know',channel:'Code Master',views:'890K views',time:'3 days ago',dur:'15:20'}
    ];
    const view = getOrCreateView('kaytube', 'KayTube',
      '<div style="padding:0 16px;">' +
      vids.map(v =>
        '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;color:#fff;" data-toast="▶️|Playing video">' +
          '<div style="width:140px;height:80px;border-radius:10px;background:linear-gradient(135deg,var(--ios-red),var(--ios-orange));display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;position:relative;">' +
            '▶️<div style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.8);padding:2px 6px;border-radius:4px;font-size:11px;">' + v.dur + '</div>' +
          '</div>' +
          '<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;line-height:1.3;margin-bottom:4px;">' + v.title + '</div><div style="font-size:12px;color:var(--ios-text-secondary);">' + v.channel + ' • ' + v.views + '</div></div>' +
        '</div>'
      ).join('') + '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'kaytube';
  },
  close: function() { const v = document.getElementById('view-kaytube'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

Apps.kaygram = {
  open: function() {
    const old = document.getElementById('view-kaygram'); if (old) old.remove();
    const view = getOrCreateView('kaygram', 'KayGram',
      '<div style="padding:0 16px;">' +
        '<div style="display:flex;gap:12px;padding:16px 0;overflow-x:auto;border-bottom:1px solid var(--ios-border);">' +
          [['You','👤'],['Sarah','👩'],['Mike','👨']].map(([n,ic]) =>
            '<div style="text-align:center;flex-shrink:0;"><div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--ios-purple),var(--ios-pink),var(--ios-orange));padding:2px;"><div style="width:100%;height:100%;border-radius:50%;background:var(--ios-bg);display:flex;align-items:center;justify-content:center;font-size:24px;">' + ic + '</div></div><div style="font-size:11px;color:#fff;margin-top:4px;">' + n + '</div></div>'
          ).join('') +
        '</div>' +
        [['linear-gradient(135deg,#ff9a9e,#fecfef)','sarah_photos','Beautiful day! ☀️',234],['linear-gradient(135deg,#a8edea,#fed6e3)','mike_travels','New adventure 🌍',567]].map(([bg,user,desc,likes]) =>
          '<div style="padding:16px 0;border-bottom:1px solid var(--ios-border);color:#fff;">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--ios-purple),var(--ios-pink));display:flex;align-items:center;justify-content:center;font-size:16px;">👤</div><span style="font-size:14px;font-weight:600;">' + user + '</span></div>' +
            '<div style="width:100%;aspect-ratio:1;border-radius:8px;background:' + bg + ';margin-bottom:10px;"></div>' +
            '<div style="display:flex;gap:16px;margin-bottom:8px;font-size:20px;"><span style="cursor:pointer;" data-toast="❤️|Liked!">❤️</span><span style="cursor:pointer;" data-toast="💬|Commented!">💬</span></div>' +
            '<div style="font-size:14px;font-weight:600;margin-bottom:4px;">' + likes + ' likes</div>' +
            '<div style="font-size:14px;color:var(--ios-text-secondary);">' + desc + '</div>' +
          '</div>'
        ).join('') +
      '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'kaygram';
  },
  close: function() { const v = document.getElementById('view-kaygram'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

Apps.kaypay = {
  open: function() {
    const old = document.getElementById('view-kaypay'); if (old) old.remove();
    const view = getOrCreateView('kaypay', 'KayPay',
      '<div style="padding:20px;">' +
        '<div style="background:linear-gradient(135deg,var(--ios-blue),var(--ios-indigo));border-radius:20px;padding:24px;margin-bottom:24px;color:#fff;">' +
          '<div style="font-size:14px;opacity:0.8;margin-bottom:8px;">Balance</div>' +
          '<div style="font-size:36px;font-weight:700;">$4,250.00</div>' +
          '<div style="font-size:13px;opacity:0.7;margin-top:4px;">**** 4521</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">' +
          '<div style="text-align:center;cursor:pointer;" data-toast="💸|Send"><div style="width:50px;height:50px;border-radius:14px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 8px;">💸</div><div style="font-size:12px;color:#fff;">Send</div></div>' +
        '<div style="text-align:center;cursor:pointer;" data-toast="📥|Request"><div style="width:50px;height:50px;border-radius:14px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 8px;">📥</div><div style="font-size:12px;color:#fff;">Request</div></div>' +
        '<div style="text-align:center;cursor:pointer;" data-toast="📱|Scan"><div style="width:50px;height:50px;border-radius:14px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 8px;">📱</div><div style="font-size:12px;color:#fff;">Scan</div></div>' +
        '<div style="text-align:center;cursor:pointer;" data-toast="📋|History"><div style="width:50px;height:50px;border-radius:14px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 8px;">📋</div><div style="font-size:12px;color:#fff;">History</div></div>' +
        '</div>' +
        '<div style="font-size:18px;font-weight:700;margin-bottom:16px;color:#fff;">Recent Activity</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
          '<div style="display:flex;align-items:center;gap:12px;padding:14px;background:rgba(255,255,255,0.05);border-radius:12px;color:#fff;"><div style="font-size:24px;">☕</div><div style="flex:1;"><div style="font-size:15px;font-weight:600;">Starbucks</div><div style="font-size:12px;color:var(--ios-text-secondary);">Today</div></div><div style="font-size:15px;font-weight:600;color:var(--ios-red);">-$5.40</div></div>' +
          '<div style="display:flex;align-items:center;gap:12px;padding:14px;background:rgba(255,255,255,0.05);border-radius:12px;color:#fff;"><div style="font-size:24px;">💰</div><div style="flex:1;"><div style="font-size:15px;font-weight:600;">Salary</div><div style="font-size:12px;color:var(--ios-text-secondary);">Yesterday</div></div><div style="font-size:15px;font-weight:600;color:var(--ios-green);">+$3,500.00</div></div>' +
        '</div>' +
      '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'kaypay';
  },
  close: function() { const v = document.getElementById('view-kaypay'); if(v) v.classList.remove('open'); State.currentApp = null; }
};

// Re-apply live social apps after the legacy visual definitions above.
Apps.kaybook={open:()=>openLiveSocialApp('kaybook'),close:()=>{const v=document.getElementById('view-kaybook');if(v)v.classList.remove('open');State.currentApp=null;}};
Apps.kaytok={open:()=>openLiveSocialApp('kaytok'),close:()=>{const v=document.getElementById('view-kaytok');if(v)v.classList.remove('open');State.currentApp=null;}};
Apps.kaytube={open:()=>openLiveSocialApp('kaytube'),close:()=>{const v=document.getElementById('view-kaytube');if(v)v.classList.remove('open');State.currentApp=null;}};
Apps.kaygram={open:()=>openLiveSocialApp('kaygram'),close:()=>{const v=document.getElementById('view-kaygram');if(v)v.classList.remove('open');State.currentApp=null;}};

Apps.assistant = { open: openAssistant, close: closeAssistant };

// Gestures handled by gestureInit()

// Long press handled via gestureInit
let longPressTimer;
document.addEventListener('touchstart', e => {
  if (e.target.closest('[data-appid]') && !State.locked) {
    longPressTimer = setTimeout(() => {
      State.editingMode = true; haptic('heavy'); renderHome();
      showToast('✏️', 'Editing mode — long press done. Tap × to delete, tap app to exit.');
    }, 700);
  }
}, {passive:true});
document.addEventListener('touchend', () => clearTimeout(longPressTimer), {passive:true});
document.addEventListener('touchmove', () => clearTimeout(longPressTimer), {passive:true});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('appSwitcher').classList.contains('open')) closeSwitcher();
    else if (document.getElementById('spotlight').classList.contains('open')) closeSpotlight();
    else if (document.getElementById('controlCenter').classList.contains('open')) closeCC();
    else if (document.getElementById('notifCenter').classList.contains('open')) closeNotif();
    else if (State.currentApp && Apps[State.currentApp]) Apps[State.currentApp].close();
  }
  if (e.key === ' ' && !State.locked && document.getElementById('screen-home').classList.contains('active')) {
    e.preventDefault();
    openSpotlight();
  }
});
