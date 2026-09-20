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
  {id:'games',name:'Arcade',icon:'🎮',category:'Games',desc:'Quick games designed for short sessions.',bg:'linear-gradient(135deg,#0A84FF,#30D158)'},
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

// ===== GAMES =====
Apps.games = {
  open: function() {
    const old = document.getElementById('view-games');
    if (old) old.remove();
    const view = getOrCreateView('games', 'Games',
      '<div style="padding:20px;">' +
        '<div style="font-size:28px;font-weight:700;margin-bottom:20px;color:#fff;">Arcade</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">' +
          '<div style="background:linear-gradient(135deg,var(--ios-green),var(--ios-teal));border-radius:16px;padding:20px;text-align:center;cursor:pointer;" onclick="openSnake()">' +
            '<div style="font-size:40px;margin-bottom:8px;">🐍</div><div style="font-size:16px;font-weight:700;color:#fff;">Snake</div>' +
          '</div>' +
          '<div style="background:linear-gradient(135deg,var(--ios-purple),var(--ios-pink));border-radius:16px;padding:20px;text-align:center;cursor:pointer;" data-toast="🧱|Blocks coming soon!">' +
            '<div style="font-size:40px;margin-bottom:8px;">🧱</div><div style="font-size:16px;font-weight:700;color:#fff;">Blocks</div>' +
          '</div>' +
        '</div>' +
        '<div id="gameArea" style="margin-top:20px;"></div>' +
      '</div>'
    );
    setTimeout(() => view.classList.add('open'), 10);
    State.currentApp = 'games';
  },
  close: function() { const v = document.getElementById('view-games'); if(v) v.classList.remove('open'); State.currentApp = null; }
};
function openSnake() {
  const area = document.getElementById('gameArea');
  if (!area) return;
  area.innerHTML = '<canvas id="snakeCanvas" width="300" height="300" style="border-radius:12px;background:var(--ios-gray5);border:1px solid var(--ios-border);display:block;margin:0 auto;"></canvas>' +
    '<div style="display:flex;gap:20px;justify-content:center;margin-top:20px;"><button style="background:var(--ios-blue);color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:16px;font-weight:600;cursor:pointer;" onclick="startSnake()">Start</button></div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:180px;margin:16px auto 0;text-align:center;">' +
      '<div></div><button onclick="snakeDir(0,-1)" style="background:var(--ios-gray4);color:#fff;border:none;border-radius:8px;padding:12px;font-size:18px;cursor:pointer;">▲</button><div></div>' +
      '<button onclick="snakeDir(-1,0)" style="background:var(--ios-gray4);color:#fff;border:none;border-radius:8px;padding:12px;font-size:18px;cursor:pointer;">◄</button>' +
      '<button onclick="snakeDir(0,1)" style="background:var(--ios-gray4);color:#fff;border:none;border-radius:8px;padding:12px;font-size:18px;cursor:pointer;">▼</button>' +
      '<button onclick="snakeDir(1,0)" style="background:var(--ios-gray4);color:#fff;border:none;border-radius:8px;padding:12px;font-size:18px;cursor:pointer;">►</button>' +
    '</div>';
}
let snakeGame = null, snakeDx = 1, snakeDy = 0;
function snakeDir(dx, dy) { snakeDx = dx; snakeDy = dy; }
function startSnake() {
  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const grid = 15, count = 20;
  let snake = [{x:10,y:10}], apple = {x:15,y:15}, score = 0;
  snakeDx = 1; snakeDy = 0;
  if (snakeGame) clearInterval(snakeGame);
  snakeGame = setInterval(() => {
    const head = {x:snake[0].x+snakeDx, y:snake[0].y+snakeDy};
    if (head.x<0||head.x>=count||head.y<0||head.y>=count||snake.some(s=>s.x===head.x&&s.y===head.y)) {
      clearInterval(snakeGame);
      showToast('💀', 'Game Over! Score: ' + score);
      return;
    }
    snake.unshift(head);
    if (head.x===apple.x&&head.y===apple.y) { score+=10; apple={x:Math.floor(Math.random()*count),y:Math.floor(Math.random()*count)}; }
    else snake.pop();
    ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#30D158'; snake.forEach(s=>ctx.fillRect(s.x*grid,s.y*grid,grid-1,grid-1));
    ctx.fillStyle='#FF453A'; ctx.fillRect(apple.x*grid,apple.y*grid,grid-1,grid-1);
    ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.fillText('Score: '+score,8,16);
  }, 100);
}

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
