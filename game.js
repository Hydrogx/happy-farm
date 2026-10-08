/* ============================================================
 * game.js — 快乐小牧场 主逻辑
 * ============================================================ */

// ---------------- 基础 ----------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const VIEW_W = canvas.width, VIEW_H = canvas.height;
const WORLD_W = 1600, WORLD_H = 1000;
const DAY_START = 8 * 60, DAY_END = 20 * 60;   // 游戏内分钟
const DAY_LENGTH = 240;                        // 现实秒 / 天

// ---------------- 物品数据 ----------------
const ITEMS = {
  egg:        { name: '鸡蛋',     icon: '🥚', price: 10 },
  milk:       { name: '牛奶',     icon: '🥛', price: 18 },
  wool:       { name: '羊毛',     icon: '🧶', price: 25 },
  carrot:     { name: '胡萝卜',   icon: '🥕', price: 15 },
  tomato:     { name: '番茄',     icon: '🍅', price: 20 },
  corn:       { name: '玉米',     icon: '🌽', price: 25 },
  apple:      { name: '苹果',     icon: '🍎', price: 12 },
  orange:     { name: '橘子',     icon: '🍊', price: 14 },
  pear:       { name: '梨子',     icon: '🍐', price: 16 },
  peach:      { name: '桃子',     icon: '🍑', price: 20 },
  strawberry: { name: '草莓',     icon: '🍓', price: 25 },
  fish:       { name: '小鱼',     icon: '🐟', price: 22 },
  bigfish:    { name: '大鱼',     icon: '🐠', price: 50 },
  fried_egg:  { name: '煎蛋',     icon: '🍳', price: 26 },
  salad:      { name: '水果沙拉', icon: '🥗', price: 40 },
  fish_grill: { name: '烤鱼',     icon: '🍢', price: 55 },
  pudding:    { name: '蛋奶布丁', icon: '🍮', price: 65 },
  fruit_cake: { name: '草莓蛋糕', icon: '🍰', price: 90 },
  seed_carrot:{ name: '胡萝卜种子', icon: '🌱', price: 5,  seed: 'carrot' },
  seed_tomato:{ name: '番茄种子',  icon: '🫘', price: 8,  seed: 'tomato' },
  seed_corn:  { name: '玉米种子',  icon: '🌾', price: 12, seed: 'corn' },
};
const RECIPES = [
  { id: 'fried_egg',  needs: { egg: 1 } },
  { id: 'salad',      needs: { fruit: 2 } },               // 任意 2 个水果
  { id: 'fish_grill', needs: { fish: 1 } },
  { id: 'pudding',    needs: { egg: 1, milk: 1 } },
  { id: 'fruit_cake', needs: { strawberry: 2, egg: 1, milk: 1 } },
];
const FRUIT_IDS = ['apple', 'orange', 'pear', 'peach', 'strawberry'];
const SELLABLE = ['egg','milk','wool','carrot','tomato','corn',...FRUIT_IDS,'fish','bigfish','fried_egg','salad','fish_grill','pudding','fruit_cake'];
const PET_HATS = {
  bow:    { name: '宠物蝴蝶结', icon: '🎀', price: 30 },
  straw:  { name: '宠物草帽',   icon: '👒', price: 30 },
  cap:    { name: '宠物棒球帽', icon: '🧢', price: 50 },
  flower: { name: '宠物花环',   icon: '🌸', price: 60 },
  crown:  { name: '宠物皇冠',   icon: '👑', price: 90 },
};
const CUSTOMER_COLORS = ['#7ac74f', '#ff9f43', '#5fa8e8', '#c88ae8', '#ff8f8f'];
const CUSTOMER_HAIRS = ['#3a2a1a', '#6b4226', '#d9a62e', '#8a8a8a', '#2a2a3a'];

// ---------------- 游戏状态 ----------------
const G = {
  started: false,
  t: 0,                       // 全局动画时钟（秒）
  coins: 20,
  day: 1,
  timeMin: DAY_START,
  weather: 'sunny',           // sunny | cloudy | rain
  inventory: { seed_carrot: 2 },
  player: {
    x: 420, y: 500, dir: 'down', gender: 'boy',
    moving: false, walkPhase: 0, actionT: 0,
    outfit: { hat: 'ragged', shirt: 'ragged', pants: 'ragged' },
  },
  owned: { hat: ['ragged'], shirt: ['ragged'], pants: ['ragged'] },
  pet: { type: 'dog', x: 380, y: 530, dir: 'right', moving: false, walkPhase: 0, phase: 0, hat: 'none', happy: 0 },
  petHatsOwned: [],
  animals: [],
  groundItems: [],
  plots: [],
  trees: [],
  decor: [],
  customers: [],
  customerTimer: 18,
  particles: [],
  fishing: null,              // {phase:'wait'|'bite', timer, bx, by}
  modalOpen: null,
  cam: { x: 0, y: 0 },
  sleepFade: 0,
  sleepDawn: false,
};

// 场景交互点（房子区搬到商店旁边，果树在房子左侧）
const ZONES = {
  house:    { x: 1020, y: 220 },
  kitchen:  { x: 1120, y: 400, r: 55 },
  wardrobe: { x: 930,  y: 370, r: 55 },
  bin:      { x: 1020, y: 490, r: 55 },
  stall:    { x: 1295, y: 300, r: 70 },
  pond:     { x: 1300, y: 800, w: 280, h: 140 },
};

// 动物棚舍区域（每种动物一个独立围栏）
const PENS = {
  chicken: { x: 200, y: 700, w: 220, h: 150, home: { x: 310, y: 790, r: 75 } },
  sheep:   { x: 520, y: 790, w: 240, h: 160, home: { x: 640, y: 885, r: 80 } },
  cow:     { x: 840, y: 780, w: 260, h: 170, home: { x: 975, y: 880, r: 85 } },
};

// ---------------- 音效（WebAudio 小蜂鸣） ----------------
let AC = null;
function beep(freq, dur = 0.1, type = 'sine', vol = 0.15, delay = 0) {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, AC.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + delay + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(AC.currentTime + delay); o.stop(AC.currentTime + delay + dur);
  } catch (e) { /* 静音环境忽略 */ }
}
const sfx = {
  pickup: () => { beep(880, .08); beep(1320, .1, 'sine', .12, .07); },
  coin:   () => { beep(990, .07); beep(1490, .12, 'sine', .14, .08); },
  error:  () => beep(180, .2, 'square', .08),
  splash: () => beep(300, .15, 'triangle', .12),
  success:() => { beep(660, .08); beep(880, .08, 'sine', .13, .08); beep(1100, .14, 'sine', .13, .16); },
  pop:    () => beep(520, .06, 'triangle', .1),
};

// ---------------- 输入 ----------------
const keys = {};
let interactQueued = false;
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  keys[k] = true;
  if (k === 'e' || k === ' ') interactQueued = true;
  if (k === 'h') toggleModal('help-modal');
  if (k === 'escape' && G.modalOpen) closeModal(G.modalOpen);
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ---------------- 工具 ----------------
const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function addItem(id, n = 1) {
  G.inventory[id] = (G.inventory[id] || 0) + n;
  renderInventory();
}
function removeItem(id, n = 1) {
  if ((G.inventory[id] || 0) < n) return false;
  G.inventory[id] -= n;
  if (G.inventory[id] <= 0) delete G.inventory[id];
  renderInventory();
  return true;
}
function countFruits() {
  return FRUIT_IDS.reduce((s, id) => s + (G.inventory[id] || 0), 0);
}
function hasItems(needs) {
  return Object.entries(needs).every(([id, n]) =>
    id === 'fruit' ? countFruits() >= n : (G.inventory[id] || 0) >= n);
}
function consumeItems(needs) {
  for (const [id, n] of Object.entries(needs)) {
    if (id === 'fruit') {
      let left = n;
      for (const fid of FRUIT_IDS) {
        while (left > 0 && (G.inventory[fid] || 0) > 0) { removeItem(fid); left--; }
      }
    } else removeItem(id, n);
  }
}

function spawnParticles(x, y, icon, n = 5) {
  for (let i = 0; i < n; i++) {
    G.particles.push({
      x, y, icon,
      vx: rand(-40, 40), vy: rand(-90, -30),
      life: rand(0.7, 1.2), maxLife: 1.2, size: rand(12, 20),
    });
  }
}
function coinBurst(x, y, amount) {
  G.particles.push({ x, y, icon: `+${amount}💰`, vx: 0, vy: -45, life: 1.4, maxLife: 1.4, size: 18, text: true });
  sfx.coin();
}

// ---------------- 世界初始化 ----------------
function initWorld() {
  // 农田 4x3
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++)
      G.plots.push({ x: 520 + c * 46, y: 620 + r * 46, state: 'grass', crop: null, stage: 0, watered: false, timer: 0 });
  // 果树（5 种水果各一，集中在房子左侧）
  const mkTree = (type, x, y) => ({ type, x, y, fruits: 3, timer: 0, phase: rand(0, 6) });
  G.trees = [
    mkTree('apple', 220, 180),
    mkTree('orange', 400, 210),
    mkTree('pear', 280, 360),
    mkTree('peach', 470, 380),
    mkTree('strawberry', 600, 250),
  ];
  // 动物（各自住在自己的棚舍里）
  const mk = (type, x, y) => ({
    type, x, y, dir: Math.random() < .5 ? 'left' : 'right',
    moving: false, walkPhase: 0, phase: rand(0, 6),
    tx: x, ty: y, waitT: rand(1, 3), peck: 0,
    wool: 1, woolT: 0, milkReady: true, milkT: 0, eggT: rand(15, 40),
    home: { ...PENS[type].home },
  });
  G.animals = [
    mk('chicken', 270, 780), mk('chicken', 320, 810), mk('chicken', 350, 770),
    mk('sheep', 600, 870), mk('sheep', 690, 900),
    mk('cow', 970, 870),
  ];
  // 装饰（避开建筑/田地/池塘/棚舍/果树）
  const avoid = [
    { x: 890, y: 90, w: 330, h: 460 },    // 房子区（近商店）
    { x: 470, y: 570, w: 240, h: 190 },   // 田地
    { x: 1120, y: 660, w: 360, h: 280 },  // 池塘
    { x: 1180, y: 190, w: 240, h: 180 },  // 摊位
    { x: 190, y: 690, w: 240, h: 170 },   // 鸡棚
    { x: 510, y: 780, w: 260, h: 180 },   // 羊棚
    { x: 830, y: 770, w: 280, h: 190 },   // 牛棚
    { x: 160, y: 120, w: 500, h: 320 },   // 果树区（房子左侧）
  ];
  const okSpot = (x, y) => !avoid.some(a => x > a.x - 20 && x < a.x + a.w + 20 && y > a.y - 20 && y < a.y + a.h + 20);
  for (let i = 0; i < 60; i++) {
    const x = rand(30, WORLD_W - 30), y = rand(120, WORLD_H - 30);
    if (!okSpot(x, y)) continue;
    G.decor.push({ kind: 'grass', x, y, phase: rand(0, 6) });
  }
  for (let i = 0; i < 24; i++) {
    const x = rand(30, WORLD_W - 30), y = rand(120, WORLD_H - 30);
    if (!okSpot(x, y)) continue;
    G.decor.push({ kind: 'flower', x, y, phase: rand(0, 6), color: pick(['#ff8fb0', '#fff', '#c88ae8', '#ffb84d']) });
  }
}

// ---------------- DOM / UI ----------------
const $ = (id) => document.getElementById(id);
function toast(msg, ms = 1800) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), ms);
}
function renderHUD() {
  $('coins').textContent = G.coins;
  $('day').textContent = G.day;
  const h = Math.floor(G.timeMin / 60), m = Math.floor(G.timeMin % 60);
  $('clock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  $('weather-box').textContent = { sunny: '☀️ 晴天', cloudy: '⛅ 多云', rain: '🌧️ 下雨' }[G.weather];
}
function renderInventory() {
  const bar = $('inventory');
  bar.innerHTML = '';
  for (const [id, n] of Object.entries(G.inventory)) {
    const d = document.createElement('div');
    d.className = 'inv-slot';
    d.title = ITEMS[id].name;
    d.innerHTML = `${ITEMS[id].icon}<span class="cnt">${n}</span>`;
    bar.appendChild(d);
  }
}

// 弹窗管理
function openModal(id) { G.modalOpen = id; $(id).classList.remove('hidden'); }
function closeModal(id) { G.modalOpen = null; $(id).classList.add('hidden'); }
function toggleModal(id) {
  if (G.modalOpen === id) { closeModal(id); return; }
  if (G.modalOpen) return;   // 已经有别的窗口开着，不叠加（否则关掉一个后状态会错乱）
  openModal(id);
}
document.querySelectorAll('.close-modal').forEach(b =>
  b.addEventListener('click', () => closeModal(b.dataset.close)));
$('btn-help').addEventListener('click', () => toggleModal('help-modal'));

// ---------------- 商店 ----------------
let shopTab = 'seeds';
function renderShop() {
  const box = $('shop-items');
  box.innerHTML = '';
  const mkCard = (icon, name, price, onBuy, owned) => {
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.innerHTML = `<div class="icon">${icon}</div><div>${name}</div>`;
    const b = document.createElement('button');
    if (owned) {
      b.textContent = '已有啦 ✓'; b.disabled = true;
      d.appendChild(b);
    } else {
      b.textContent = `💰${price} 买`;
      b.disabled = G.coins < price;
      b.onclick = onBuy;
      d.appendChild(b);
    }
    box.appendChild(d);
  };
  if (shopTab === 'seeds') {
    for (const id of ['seed_carrot', 'seed_tomato', 'seed_corn']) {
      mkCard(ITEMS[id].icon, ITEMS[id].name, ITEMS[id].price, () => {
        G.coins -= ITEMS[id].price; addItem(id); sfx.coin(); toast(`买到 ${ITEMS[id].name}！`); renderShop(); renderHUD();
      });
    }
  } else if (shopTab === 'clothes') {
    for (const cat of ['hat', 'shirt', 'pants']) {
      for (const [key, o] of Object.entries(OUTFITS[cat])) {
        if (o.price === 0) continue;
        const owned = G.owned[cat].includes(key);
        mkCard(o.icon, o.name, o.price, () => {
          G.coins -= o.price; G.owned[cat].push(key); sfx.success();
          toast(`买到 ${o.name}！去衣柜换上吧 👕`); renderShop(); renderHUD();
        }, owned);
      }
    }
  } else {
    for (const [key, o] of Object.entries(PET_HATS)) {
      const owned = G.petHatsOwned.includes(key);
      mkCard(o.icon, o.name, o.price, () => {
        G.coins -= o.price; G.petHatsOwned.push(key);
        G.pet.hat = key; G.pet.happy = 3; sfx.success();
        spawnParticles(G.pet.x, G.pet.y - 20, '💖', 4);
        toast(`小${G.pet.type === 'dog' ? '狗' : '猫'}戴上啦，好开心！`);
        renderShop(); renderHUD();
      }, owned);
    }
  }
}
document.querySelectorAll('#shop-modal .tab-btn').forEach(b =>
  b.addEventListener('click', () => {
    shopTab = b.dataset.tab;
    document.querySelectorAll('#shop-modal .tab-btn').forEach(x => x.classList.toggle('selected', x === b));
    renderShop();
  }));

// ---------------- 衣柜 ----------------
let wTab = 'hat';
function renderWardrobe() {
  const box = $('wardrobe-items');
  box.innerHTML = '';
  // 帽子可以有「不戴」选项；上衣/裤子必须穿，初始的破衣服/破裤子也在列表里
  const list = wTab === 'hat' ? ['none', ...G.owned.hat] : [...G.owned[wTab]];
  for (const key of list) {
    const o = OUTFITS[wTab][key];
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.innerHTML = `<div class="icon">${o.icon}</div><div>${o.name}</div>`;
    const b = document.createElement('button');
    const wearing = G.player.outfit[wTab] === key;
    b.textContent = wearing ? '穿着呢 ✓' : '穿上';
    b.disabled = wearing;
    b.onclick = () => {
      G.player.outfit[wTab] = key;
      sfx.pop(); spawnParticles(G.player.x, G.player.y - 30, '✨', 5);
      toast(`换上 ${o.name}！`);
      renderWardrobe();
    };
    d.appendChild(b);
    box.appendChild(d);
  }
  // 宠物帽子区
  if (G.petHatsOwned.length) {
    const title = document.createElement('div');
    title.style.cssText = 'grid-column:1/-1;font-weight:bold;color:#c77;';
    title.textContent = '🐾 宠物的装扮：';
    box.appendChild(title);
    for (const key of G.petHatsOwned) {
      const o = PET_HATS[key];
      const d = document.createElement('div');
      d.className = 'shop-item';
      d.innerHTML = `<div class="icon">${o.icon}</div><div>${o.name}</div>`;
      const b = document.createElement('button');
      const wearing = G.pet.hat === key;
      b.textContent = wearing ? '戴着呢 ✓' : '给宠物戴';
      b.disabled = wearing;
      b.onclick = () => {
        G.pet.hat = key; G.pet.happy = 3; sfx.pop();
        spawnParticles(G.pet.x, G.pet.y - 20, '💖', 4);
        renderWardrobe();
      };
      d.appendChild(b);
      box.appendChild(d);
    }
  }
}
document.querySelectorAll('#wardrobe-modal .tab-btn').forEach(b =>
  b.addEventListener('click', () => {
    wTab = b.dataset.wtab;
    document.querySelectorAll('#wardrobe-modal .tab-btn').forEach(x => x.classList.toggle('selected', x === b));
    renderWardrobe();
  }));

// ---------------- 厨房 ----------------
function renderCook() {
  const box = $('cook-items');
  box.innerHTML = '';
  for (const r of RECIPES) {
    const out = ITEMS[r.id];
    const can = hasItems(r.needs);
    const needStr = Object.entries(r.needs).map(([id, n]) =>
      id === 'fruit' ? `🍎任意水果×${n}` : `${ITEMS[id].icon}×${n}`).join(' + ');
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.innerHTML = `<div class="icon">${out.icon}</div><div>${out.name}</div><div style="font-size:12px">需要 ${needStr}</div>`;
    const b = document.createElement('button');
    b.textContent = can ? '🍳 做一份' : '材料不够';
    b.disabled = !can;
    b.onclick = () => {
      consumeItems(r.needs);
      addItem(r.id);
      sfx.success();
      spawnParticles(G.player.x, G.player.y - 30, '✨', 6);
      toast(`香喷喷的${out.name}做好啦！`);
      renderCook();
    };
    d.appendChild(b);
    box.appendChild(d);
  }
}

// ---------------- 卖货箱 ----------------
function renderSell() {
  const box = $('sell-items');
  box.innerHTML = '';
  const ids = Object.keys(G.inventory).filter(id => !ITEMS[id].seed);
  if (!ids.length) {
    box.innerHTML = '<div style="grid-column:1/-1;color:#a8906a">背包空空的呢～</div>';
    return;
  }
  for (const id of ids) {
    const it = ITEMS[id];
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.innerHTML = `<div class="icon">${it.icon}</div><div>${it.name} ×${G.inventory[id]}</div>`;
    const b = document.createElement('button');
    b.textContent = `卖 1 个 💰${it.price}`;
    b.onclick = () => {
      if (removeItem(id)) {
        G.coins += it.price; sfx.coin(); renderHUD(); renderSell();
        toast(`卖出 ${it.name}，+${it.price} 金币！`);
      }
    };
    d.appendChild(b);
    box.appendChild(d);
  }
}

// ---------------- 交互检测 ----------------
function nearestInteract() {
  const p = G.player;
  let best = null, bestD = 62;

  // 1. 地面物品
  for (const it of G.groundItems) {
    const d = dist(p.x, p.y, it.x, it.y);
    if (d < bestD) { bestD = d; best = { kind: 'item', it, label: `捡起 ${ITEMS[it.id].icon} ${ITEMS[it.id].name}` }; }
  }
  // 2. 等待中的客人（优先售卖，检测范围比其它略大）
  for (const c of G.customers) {
    if (c.state !== 'wait') continue;
    const d = dist(p.x, p.y, c.x, c.y);
    if (d < bestD + 30) {
      bestD = Math.min(bestD, d);
      best = { kind: 'customer', c, label: `把 ${ITEMS[c.want].icon} 卖给客人` };
    }
  }
  // 3. 动物
  for (const a of G.animals) {
    const d = dist(p.x, p.y, a.x, a.y);
    if (d < bestD) {
      if (a.type === 'sheep' && a.wool > 0.5) { bestD = d; best = { kind: 'shear', a, label: '✂️ 剪羊毛' }; }
      else if (a.type === 'cow' && a.milkReady) { bestD = d; best = { kind: 'milk', a, label: '🥛 挤牛奶' }; }
      else if (a.type === 'chicken') { bestD = d; best = { kind: 'petChicken', a, label: '🐔 摸摸小鸡' }; }
      else if (a.type === 'sheep') { bestD = d; best = { kind: 'petSheep', a, label: '🐑 摸摸小羊（羊毛还没长好）' }; }
      else { bestD = d; best = { kind: 'petCow', a, label: '🐄 摸摸奶牛（等会儿才有奶）' }; }
    }
  }
  // 4. 田块
  for (const pl of G.plots) {
    const d = dist(p.x, p.y, pl.x, pl.y);
    if (d < bestD) {
      let label = null, kind = null;
      if (pl.state === 'grass') { kind = 'till'; label = '⛏️ 耕地'; }
      else if (pl.state === 'tilled') {
        const seed = Object.keys(G.inventory).find(id => ITEMS[id].seed);
        if (seed) { kind = 'plant'; label = `🌱 播种 ${ITEMS[seed].name}`; }
        else { kind = 'noseed'; label = '🌱 需要种子（去商店买）'; }
      }
      else if (pl.state === 'seed' || pl.state === 'growing') { kind = 'water'; label = '💧 浇水'; }
      else if (pl.state === 'ripe') { kind = 'harvest'; label = `🧺 收获 ${ITEMS[pl.crop].name}`; }
      if (kind) { bestD = d; best = { kind, pl, label }; }
    }
  }
  // 5. 果树
  for (const tr of G.trees) {
    const d = dist(p.x, p.y, tr.x, tr.y);
    if (d < bestD + 10 && tr.fruits > 0) {
      bestD = Math.min(bestD, d);
      best = { kind: 'tree', tr, label: `${ITEMS[tr.type].icon} 摇一摇${ITEMS[tr.type].name}树` };
    }
  }
  // 6. 设施
  const zoneChecks = [
    ['kitchen', 'cook', '🍳 做饭'],
    ['wardrobe', 'wardrobe', '👕 换衣服'],
    ['bin', 'sell', '📦 卖东西'],
    ['stall', 'shop', '🛒 打开商店'],
  ];
  for (const [zk, kind, label] of zoneChecks) {
    const z = ZONES[zk];
    const d = dist(p.x, p.y, z.x, z.y);
    if (d < z.r && d < bestD) { bestD = d; best = { kind, label }; }
  }
  // 7. 池塘钓鱼：附近没有别的可交互对象时，才提示钓鱼
  //    （捡蛋、挤奶、种地这些操作优先，避免在岸边抢走交互）
  const pond = ZONES.pond;
  if (!best &&
      Math.abs(p.x - pond.x) < pond.w / 2 + 40 &&
      Math.abs(p.y - pond.y) < pond.h / 2 + 40) {
    best = { kind: 'fish', label: '🎣 钓鱼' };
  }
  return best;
}

function doInteract() {
  if (G.modalOpen) return;
  // 钓鱼中再按 = 收杆
  if (G.fishing) { reelIn(); return; }
  const t = nearestInteract();
  if (!t) return;
  const p = G.player;
  p.actionT = 0.6;

  switch (t.kind) {
    case 'item': {
      G.groundItems.splice(G.groundItems.indexOf(t.it), 1);
      addItem(t.it.id); sfx.pickup();
      spawnParticles(t.it.x, t.it.y - 10, '✨', 3);
      break;
    }
    case 'customer': {
      const c = t.c;
      if (removeItem(c.want)) {
        const gain = Math.round(ITEMS[c.want].price * 1.5);
        G.coins += gain; renderHUD();
        coinBurst(c.x, c.y - 30, gain);
        spawnParticles(c.x, c.y - 25, '💖', 6);
        c.state = 'leave'; c.happy = true;
        toast(`客人好开心！+${gain} 金币`);
      } else {
        sfx.error();
        toast(`背包里没有 ${ITEMS[c.want].name} 哦`);
      }
      break;
    }
    case 'shear':
      t.a.wool = 0; t.a.woolT = 0;
      addItem('wool'); sfx.pickup();
      spawnParticles(t.a.x, t.a.y - 20, '✨', 5);
      toast('剪到一团软软的羊毛！');
      break;
    case 'milk':
      t.a.milkReady = false; t.a.milkT = 0;
      addItem('milk'); sfx.pickup();
      spawnParticles(t.a.x, t.a.y - 20, '🥛', 4);
      toast('挤到新鲜牛奶！');
      break;
    case 'petChicken': case 'petSheep': case 'petCow':
      spawnParticles(t.a.x, t.a.y - 20, '💖', 3); sfx.pop();
      break;
    case 'till':
      t.pl.state = 'tilled'; sfx.pop();
      spawnParticles(t.pl.x, t.pl.y, '🟫', 3);
      break;
    case 'plant': {
      const seed = Object.keys(G.inventory).find(id => ITEMS[id].seed);
      if (seed && removeItem(seed)) {
        t.pl.state = 'seed'; t.pl.crop = ITEMS[seed].seed; t.pl.stage = 0; t.pl.timer = 0;
        sfx.pop();
      }
      break;
    }
    case 'noseed':
      sfx.error(); toast('没有种子啦，去商店买一些吧 🛒');
      break;
    case 'water':
      t.pl.watered = true; sfx.splash();
      spawnParticles(t.pl.x, t.pl.y - 6, '💧', 4);
      break;
    case 'harvest':
      addItem(t.pl.crop, 2);
      spawnParticles(t.pl.x, t.pl.y - 10, '✨', 6);
      sfx.pickup();
      toast(`收获 2 个${ITEMS[t.pl.crop].name}！`);
      t.pl.state = 'tilled'; t.pl.crop = null; t.pl.watered = false;
      break;
    case 'tree': {
      t.tr.fruits--;
      const fx = t.tr.x + rand(-30, 30), fy = t.tr.y + rand(-5, 15);
      G.groundItems.push({ id: t.tr.type, x: fx, y: fy, phase: rand(0, 6) });
      spawnParticles(t.tr.x, t.tr.y - 40, '🍃', 4);
      sfx.pop();
      break;
    }
    case 'cook': renderCook(); openModal('cook-modal'); break;
    case 'wardrobe': renderWardrobe(); openModal('wardrobe-modal'); break;
    case 'sell': renderSell(); openModal('sell-modal'); break;
    case 'shop': renderShop(); openModal('shop-modal'); break;
    case 'fish': startFishing(); break;
  }
}

// ---------------- 钓鱼 ----------------
function startFishing() {
  const p = G.player, pond = ZONES.pond;
  const ang = Math.atan2(pond.y - p.y, pond.x - p.x);
  const bx = p.x + Math.cos(ang) * 70, by = p.y + Math.sin(ang) * 45;
  G.fishing = { phase: 'wait', timer: rand(2, G.weather === 'rain' ? 4 : 7), bx, by };
  sfx.splash();
  toast('等待小鱼上钩…');
}
function reelIn() {
  const f = G.fishing;
  if (f.phase === 'bite') {
    const big = Math.random() < (G.weather === 'rain' ? 0.4 : 0.15);
    addItem(big ? 'bigfish' : 'fish');
    sfx.success();
    spawnParticles(f.bx, f.by, '💦', 6);
    spawnParticles(f.bx, f.by - 10, big ? '🐠' : '🐟', 1);
    toast(big ? '哇！钓到一条大鱼！🐠' : '钓到一条小鱼！🐟');
    G.pet.happy = 2;
  } else {
    sfx.pop(); toast('收起鱼竿啦');
  }
  G.fishing = null;
}

// ---------------- 客人系统 ----------------
function spawnCustomer() {
  const want = pick(SELLABLE);
  G.customers.push({
    x: WORLD_W + 30, y: ZONES.stall.y + rand(-20, 40),
    dir: 'left', moving: true, walkPhase: 0, phase: rand(0, 6), t: 0,
    want, state: 'come', waitT: 25, happy: false,
    color: pick(CUSTOMER_COLORS), hair: pick(CUSTOMER_HAIRS),
  });
  toast('🔔 有客人来买东西啦！');
  sfx.pop();
}

// ---------------- 更新逻辑 ----------------
function update(dt) {
  G.t += dt;
  const p = G.player;

  // 时间流逝
  if (G.started && G.sleepFade <= 0) {
    G.timeMin += dt * (DAY_END - DAY_START) / DAY_LENGTH;
    if (G.timeMin >= DAY_END) startSleep();
  }
  // 睡觉过场：用独立阶段标记区分「渐黑」和「渐亮」，
  // 不能只靠 sleepFade 的值做判断，否则淡出时会被夹回 1.0 反复换天
  if (G.sleepFade > 0) {
    if (!G.sleepDawn) {
      G.sleepFade = Math.min(1, G.sleepFade + dt * 1.2);
      if (G.sleepFade >= 1) { nextDay(); G.sleepDawn = true; }
    } else {
      G.sleepFade = Math.max(0, G.sleepFade - dt * 0.8);
      if (G.sleepFade <= 0) G.sleepDawn = false;
    }
  }

  // --- 玩家移动 ---
  p.moving = false;
  if (!G.modalOpen && !G.fishing && G.sleepFade === 0) {
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx--;
    if (keys['arrowright'] || keys['d']) dx++;
    if (keys['arrowup'] || keys['w']) dy--;
    if (keys['arrowdown'] || keys['s']) dy++;
    if (dx || dy) {
      const len = Math.hypot(dx, dy), spd = 170;
      p.x = Math.max(20, Math.min(WORLD_W - 20, p.x + dx / len * spd * dt));
      p.y = Math.max(120, Math.min(WORLD_H - 20, p.y + dy / len * spd * dt));
      p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      p.moving = true;
      p.walkPhase += dt * 11;
    }
  }
  if (p.actionT > 0) p.actionT -= dt;

  // 池塘不能踩水：走到水边会被轻轻推回岸上
  {
    const pc = ZONES.pond;
    const ex = (p.x - pc.x) / (pc.w / 2 + 8);
    const ey = (p.y - pc.y) / (pc.h / 2 + 8);
    const eD = ex * ex + ey * ey;
    if (eD < 1) {
      if (eD < 0.0001) p.x = pc.x + pc.w / 2 + 20;      // 极端情况：从中心推出去
      else {
        const k = 1.02 / Math.sqrt(eD);                 // 多推一点点，避免刚好卡在岸边抖动
        p.x = pc.x + (p.x - pc.x) * k;
        p.y = pc.y + (p.y - pc.y) * k;
      }
    }
  }

  // 交互键
  if (interactQueued) {
    interactQueued = false;
    if (!G.modalOpen && G.sleepFade === 0) doInteract();
  }

  // --- 宠物跟随 ---
  const pet = G.pet;
  const pd = dist(pet.x, pet.y, p.x, p.y);
  if (pd > 55) {
    const a = Math.atan2(p.y - pet.y, p.x - pet.x);
    const spd = pd > 160 ? 220 : 130;
    pet.x += Math.cos(a) * spd * dt;
    pet.y += Math.sin(a) * spd * dt;
    pet.dir = Math.cos(a) < 0 ? 'left' : 'right';
    pet.moving = true;
    pet.walkPhase += dt * 13;
  } else pet.moving = false;
  if (pet.happy > 0) pet.happy -= dt;

  // --- 动物 AI：闲逛 + 生产 ---
  for (const a of G.animals) {
    a.peck = Math.max(0, a.peck - dt);
    if (a.moving) {
      const d = dist(a.x, a.y, a.tx, a.ty);
      if (d < 6) { a.moving = false; a.waitT = rand(1.5, 4); }
      else {
        const ang = Math.atan2(a.ty - a.y, a.tx - a.x);
        const spd = a.type === 'chicken' ? 55 : 32;
        a.x += Math.cos(ang) * spd * dt;
        a.y += Math.sin(ang) * spd * dt;
        a.dir = Math.cos(ang) < 0 ? 'left' : 'right';
        a.walkPhase += dt * (a.type === 'chicken' ? 12 : 7);
      }
    } else {
      a.waitT -= dt;
      if (a.type === 'chicken' && Math.random() < dt * 0.5) a.peck = 0.5;
      if (a.waitT <= 0) {
        a.tx = a.home.x + rand(-a.home.r, a.home.r);
        a.ty = a.home.y + rand(-a.home.r, a.home.r);
        a.tx = Math.max(30, Math.min(WORLD_W - 30, a.tx));
        a.ty = Math.max(130, Math.min(WORLD_H - 30, a.ty));
        a.moving = true;
      }
    }
    // 生产
    if (a.type === 'chicken') {
      a.eggT -= dt;
      if (a.eggT <= 0) {
        a.eggT = rand(35, 60);
        G.groundItems.push({ id: 'egg', x: a.x + rand(-15, 15), y: a.y + rand(5, 15), phase: rand(0, 6) });
        spawnParticles(a.x, a.y - 15, '🎵', 1);
      }
    } else if (a.type === 'sheep' && a.wool < 1) {
      a.woolT += dt;
      if (a.woolT > 80) { a.wool = 1; spawnParticles(a.x, a.y - 20, '✨', 4); }
    } else if (a.type === 'cow' && !a.milkReady) {
      a.milkT += dt;
      if (a.milkT > 60) { a.milkReady = true; spawnParticles(a.x, a.y - 20, '🥛', 2); }
    }
  }

  // --- 作物生长 ---
  for (const pl of G.plots) {
    if (pl.state === 'seed' || pl.state === 'growing') {
      const speed = (pl.watered || G.weather === 'rain') ? 1 : 0.25;
      pl.timer += dt * speed;
      if (G.weather === 'rain') pl.watered = true;
      if (pl.timer > 25 && pl.state === 'seed') { pl.state = 'growing'; }
      else if (pl.timer > 55 && pl.state === 'growing') {
        pl.state = 'ripe';
        spawnParticles(pl.x, pl.y - 15, '✨', 4);
      }
    }
  }

  // --- 果树结果 ---
  for (const tr of G.trees) {
    if (tr.fruits < 3) {
      tr.timer += dt;
      if (tr.timer > 40) { tr.timer = 0; tr.fruits++; }
    }
  }

  // --- 客人 ---
  G.customerTimer -= dt;
  if (G.customerTimer <= 0 && G.customers.length < 2) {
    G.customerTimer = rand(35, 65);
    spawnCustomer();
  }
  for (let i = G.customers.length - 1; i >= 0; i--) {
    const c = G.customers[i];
    c.t += dt;
    // 客人站在摊位正前方（下方），与商店触发区保持距离
    const targetX = c.state === 'come' ? ZONES.stall.x + 5 : WORLD_W + 40;
    const targetY = c.state === 'come' ? ZONES.stall.y + 125 : c.y;
    if (c.state === 'come' || c.state === 'leave') {
      const d = dist(c.x, c.y, targetX, targetY);
      if (d > 8) {
        const a = Math.atan2(targetY - c.y, targetX - c.x);
        c.x += Math.cos(a) * 95 * dt;
        c.y += Math.sin(a) * 95 * dt;
        c.dir = Math.cos(a) < 0 ? 'left' : 'right';
        c.moving = true; c.walkPhase += dt * 10;
      } else if (c.state === 'come') {
        c.state = 'wait'; c.moving = false;
      } else {
        G.customers.splice(i, 1);
        continue;
      }
    } else if (c.state === 'wait') {
      c.waitT -= dt;
      if (c.waitT <= 0) {
        c.state = 'leave';
        spawnParticles(c.x, c.y - 30, '💦', 3);
        toast('客人等太久走掉了…');
      }
    }
  }

  // --- 钓鱼 ---
  if (G.fishing) {
    const f = G.fishing;
    f.timer -= dt;
    if (f.phase === 'wait' && f.timer <= 0) {
      f.phase = 'bite'; f.timer = 1.1;
      sfx.pop();
    } else if (f.phase === 'bite' && f.timer <= 0) {
      G.fishing = null;
      toast('小鱼跑掉了…再试一次！');
    }
  }

  // --- 粒子 ---
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const pt = G.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 120 * dt;
    if (pt.life <= 0) G.particles.splice(i, 1);
  }

  // --- 相机 ---
  G.cam.x = Math.max(0, Math.min(WORLD_W - VIEW_W, p.x - VIEW_W / 2));
  G.cam.y = Math.max(0, Math.min(WORLD_H - VIEW_H, p.y - VIEW_H / 2));

  // --- 交互提示 ---
  const pr = $('prompt');
  if (!G.modalOpen && !G.fishing && G.sleepFade === 0) {
    const it = nearestInteract();
    if (it) { pr.textContent = `[E] ${it.label}`; pr.classList.remove('hidden'); }
    else pr.classList.add('hidden');
  } else if (G.fishing && G.fishing.phase === 'bite') {
    pr.textContent = '❗ 快按 E 收杆！';
    pr.classList.remove('hidden');
  } else if (G.fishing) {
    pr.textContent = '🎣 等待中…（按 E 提前收杆）';
    pr.classList.remove('hidden');
  } else pr.classList.add('hidden');

  renderHUD();
}

function startSleep() {
  G.sleepFade = 0.01;
  G.sleepDawn = false;
  toast('🌙 天黑啦，睡觉觉…');
}
function nextDay() {
  G.day++;
  G.timeMin = DAY_START;
  // 新一天天气
  const r = Math.random();
  G.weather = r < 0.55 ? 'sunny' : r < 0.8 ? 'cloudy' : 'rain';
  // 作物睡一觉长一截
  for (const pl of G.plots) {
    if (pl.state === 'seed') { pl.state = 'growing'; pl.timer = 26; pl.watered = false; }
    else if (pl.state === 'growing') pl.timer += 20;
    pl.watered = G.weather === 'rain';
  }
  renderHUD();
  toast(`☀️ 第 ${G.day} 天开始啦！${G.weather === 'rain' ? '今天下雨，不用浇水～' : ''}`, 2500);
}

// ---------------- 渲染 ----------------
function render() {
  const t = G.t;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(-G.cam.x, -G.cam.y);

  // 草地底色
  ctx.fillStyle = G.weather === 'rain' ? '#6fae66' : '#8fd48a';
  ctx.fillRect(G.cam.x, G.cam.y, VIEW_W, VIEW_H);
  // 深浅草地格子（卡通感）
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let gy = 0; gy < WORLD_H; gy += 80)
    for (let gx = (gy / 80 % 2) * 80; gx < WORLD_W; gx += 160)
      ctx.fillRect(gx, gy, 80, 80);

  // 天空条（世界顶部）
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 110);
  skyGrad.addColorStop(0, G.weather === 'rain' ? '#8fa8bd' : G.weather === 'cloudy' ? '#b8d4e8' : '#aee7ff');
  skyGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, WORLD_W, 110);
  if (G.weather === 'sunny') drawSun(ctx, 140, 55, t);
  drawCloud(ctx, (t * 12) % (WORLD_W + 200) - 100, 45, 1, G.weather === 'sunny' ? .9 : 1);
  drawCloud(ctx, (t * 8 + 400) % (WORLD_W + 260) - 130, 70, 1.3, G.weather === 'sunny' ? .8 : 1);
  if (G.weather !== 'sunny') {
    drawCloud(ctx, (t * 6 + 900) % (WORLD_W + 300) - 150, 35, 1.6, 1);
    drawCloud(ctx, (t * 10 + 1400) % (WORLD_W + 240) - 120, 80, 1.1, .95);
  }

  // 装饰（草/花）
  for (const d of G.decor) {
    if (d.kind === 'grass') drawGrassTuft(ctx, d.x, d.y, t, d.phase);
    else drawFlower(ctx, d.x, d.y, t, d.phase, d.color);
  }

  // 田块
  for (const pl of G.plots) drawPlot(ctx, pl.x, pl.y, pl, t);
  // 田地小栅栏
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.strokeRect(496, 596, 232, 140);
  ctx.strokeStyle = '#a57c4a'; ctx.lineWidth = 2;
  for (let fx = 496; fx <= 728; fx += 24) {
    ctx.beginPath(); ctx.moveTo(fx, 592); ctx.lineTo(fx, 600); ctx.stroke();
  }

  // 池塘
  drawPond(ctx, ZONES.pond.x, ZONES.pond.y, ZONES.pond.w, ZONES.pond.h, t);

  // 动物棚舍：后半栅栏（画在动物后面）
  drawFenceBack(ctx, PENS.chicken.x, PENS.chicken.y, PENS.chicken.w, PENS.chicken.h);
  drawFenceBack(ctx, PENS.sheep.x, PENS.sheep.y, PENS.sheep.w, PENS.sheep.h);
  drawFenceBack(ctx, PENS.cow.x, PENS.cow.y, PENS.cow.w, PENS.cow.h);

  // y 排序渲染的实体集合
  const drawables = [];
  // 棚舍小窝（鸡棚/羊棚/牛棚）
  drawables.push({ y: PENS.chicken.y + 28, draw: () => drawCoopHouse(ctx, PENS.chicken.x + 52, PENS.chicken.y + 28, t) });
  drawables.push({ y: PENS.sheep.y + 30, draw: () => drawSheepShed(ctx, PENS.sheep.x + 75, PENS.sheep.y + 30, t) });
  drawables.push({ y: PENS.cow.y + 34, draw: () => drawCowBarn(ctx, PENS.cow.x + 72, PENS.cow.y + 34, t) });
  // 前半栅栏（画在动物前面）
  drawables.push({ y: PENS.chicken.y + PENS.chicken.h, draw: () => drawFenceFront(ctx, PENS.chicken.x, PENS.chicken.y + PENS.chicken.h, PENS.chicken.w) });
  drawables.push({ y: PENS.sheep.y + PENS.sheep.h, draw: () => drawFenceFront(ctx, PENS.sheep.x, PENS.sheep.y + PENS.sheep.h, PENS.sheep.w) });
  drawables.push({ y: PENS.cow.y + PENS.cow.h, draw: () => drawFenceFront(ctx, PENS.cow.x, PENS.cow.y + PENS.cow.h, PENS.cow.w) });
  drawables.push({ y: ZONES.house.y + 56, draw: () => drawHouse(ctx, ZONES.house.x, ZONES.house.y, t) });
  drawables.push({ y: ZONES.stall.y + 40, draw: () => drawStall(ctx, ZONES.stall.x - 45, ZONES.stall.y - 20, t) });
  drawables.push({ y: ZONES.kitchen.y + 12, draw: () => drawKitchenProp(ctx, ZONES.kitchen.x, ZONES.kitchen.y, t) });
  drawables.push({ y: ZONES.wardrobe.y + 14, draw: () => drawWardrobeProp(ctx, ZONES.wardrobe.x, ZONES.wardrobe.y, t) });
  drawables.push({ y: ZONES.bin.y + 16, draw: () => drawBin(ctx, ZONES.bin.x, ZONES.bin.y, t) });
  for (const tr of G.trees) drawables.push({
    y: tr.y + 4,
    draw: () => tr.type === 'strawberry'
      ? drawStrawberryBush(ctx, tr.x, tr.y, t, tr.phase, tr.fruits)
      : drawTree(ctx, tr.x, tr.y, t, tr.phase, tr.fruits, tr.type),
  });
  for (const a of G.animals) {
    drawables.push({
      y: a.y + 14,
      draw: () => {
        if (a.type === 'chicken') drawChicken(ctx, a.x, a.y, { ...a, t });
        else if (a.type === 'sheep') drawSheep(ctx, a.x, a.y, { ...a, t });
        else drawCow(ctx, a.x, a.y, { ...a, t });
      },
    });
  }
  for (const c of G.customers) {
    drawables.push({
      y: c.y + 16,
      draw: () => {
        drawCustomer(ctx, c.x, c.y, { ...c, t });
        // 想要物品的气泡
        if (c.state === 'wait') {
          const by = c.y - 52 + Math.sin(t * 3 + c.phase) * 3;
          ctx.fillStyle = '#fff';
          rr(ctx, c.x - 22, by - 18, 44, 30, 10); ctx.fill();
          ctx.strokeStyle = '#ffb84d'; ctx.lineWidth = 2.5;
          rr(ctx, c.x - 22, by - 18, 44, 30, 10); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(c.x - 4, by + 12); ctx.lineTo(c.x + 4, by + 12); ctx.lineTo(c.x, by + 20);
          ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.font = '19px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(ITEMS[c.want].icon, c.x - 6, by + 3);
          ctx.fillStyle = '#e2701d'; ctx.font = 'bold 13px sans-serif';
          ctx.fillText('?', c.x + 12, by + 4);
        }
      },
    });
  }
  // 宠物 & 玩家
  drawables.push({ y: G.pet.y + 10, draw: () => drawPet(ctx, G.pet.x, G.pet.y, { ...G.pet, t }) });
  drawables.push({
    y: p_y() + 20,
    draw: () => drawPlayer(ctx, G.player.x, G.player.y, {
      gender: G.player.gender, dir: G.player.dir,
      walkPhase: G.player.walkPhase, moving: G.player.moving,
      outfit: G.player.outfit, actionT: G.player.actionT, t,
    }),
  });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();

  // 玩家动作特效（浇水/收获光圈）
  if (G.player.actionT > 0) {
    const k = 1 - G.player.actionT / 0.6;
    ctx.strokeStyle = `rgba(255,230,120,${1 - k})`;
    ctx.lineWidth = 3;
    ellipse(ctx, G.player.x, G.player.y + 6, 20 + k * 30, (20 + k * 30) * 0.4);
    ctx.stroke();
  }

  // 地面物品（休息动画）
  for (const it of G.groundItems) drawGroundItem(ctx, it.x, it.y, ITEMS[it.id].icon, t, it.phase);

  // 钓鱼浮漂
  if (G.fishing) {
    const f = G.fishing;
    const dip = f.phase === 'bite' ? Math.sin(t * 20) * 4 + 3 : Math.sin(t * 3) * 2;
    ctx.strokeStyle = 'rgba(80,60,40,.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(G.player.x, G.player.y - 20); ctx.quadraticCurveTo((G.player.x + f.bx) / 2, f.by - 40, f.bx, f.by + dip); ctx.stroke();
    ctx.fillStyle = '#ff5a5a';
    ellipse(ctx, f.bx, f.by + dip, 4, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(f.bx - 4, f.by + dip - 1, 8, 2.5);
    if (f.phase === 'bite') {
      ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ff3a3a';
      ctx.fillText('❗', f.bx, f.by - 18 + Math.sin(t * 12) * 3);
    }
  }

  // 粒子
  for (const pt of G.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.font = `${pt.text ? 'bold ' : ''}${pt.size}px sans-serif`;
    ctx.textAlign = 'center';
    if (pt.text) { ctx.fillStyle = '#ffb020'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeText(pt.icon, pt.x, pt.y); }
    ctx.fillText(pt.icon, pt.x, pt.y);
    ctx.globalAlpha = 1;
  }

  // 雨
  if (G.weather === 'rain') {
    ctx.strokeStyle = 'rgba(180,220,255,.55)';
    ctx.lineWidth = 1.5;
    const off = (t * 500) % 40;
    for (let i = 0; i < 130; i++) {
      const rx = ((i * 137 + G.cam.x) % (VIEW_W + 60)) + G.cam.x - 30;
      const ry = ((i * 89) % VIEW_H) + off * ((i % 3) + 1) / 3 % VIEW_H + G.cam.y;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 12);
      ctx.stroke();
    }
  }

  ctx.restore();

  // 夜间 / 睡觉遮罩
  const evening = Math.max(0, (G.timeMin - 18 * 60) / 120) * 0.25;
  if (evening > 0) {
    ctx.fillStyle = `rgba(40,40,120,${evening})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (G.sleepFade > 0) {
    ctx.fillStyle = `rgba(20,20,40,${Math.min(1, G.sleepFade)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  // 下雨天整体略暗
  if (G.weather === 'rain') {
    ctx.fillStyle = 'rgba(60,80,120,.12)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
function p_y() { return G.player.y; }

// ---------------- 主循环 ----------------
let lastT = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016);
  lastT = ts;
  if (G.started) update(dt);
  else G.t += dt; // 开始界面背后也在动
  render();
  requestAnimationFrame(loop);
}

// ---------------- 开始界面 ----------------
let chosenGender = 'boy', chosenPet = 'dog';
function setupChooser(idA, idB, cb) {
  $(idA).addEventListener('click', () => {
    $(idA).classList.add('selected'); $(idB).classList.remove('selected'); cb(idA.includes('boy') || idA.includes('dog') ? 0 : 1);
  });
  $(idB).addEventListener('click', () => {
    $(idB).classList.add('selected'); $(idA).classList.remove('selected'); cb(1);
  });
}
setupChooser('choose-boy', 'choose-girl', (i) => { chosenGender = i === 0 ? 'boy' : 'girl'; });
setupChooser('choose-dog', 'choose-cat', (i) => { chosenPet = i === 0 ? 'dog' : 'cat'; });

$('btn-start').addEventListener('click', () => {
  G.player.gender = chosenGender;
  G.pet.type = chosenPet;
  $('start-screen').classList.add('hidden');
  G.started = true;
  sfx.success();
  toast(`欢迎来到快乐小牧场！去找点事情做吧 🌱`, 3000);
});

// 启动
initWorld();
renderInventory();
renderHUD();
requestAnimationFrame(loop);
