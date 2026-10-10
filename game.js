/* ============================================================
 * game.js — 快乐小牧场 主逻辑
 * ============================================================ */

// ---------------- 基础 ----------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const VIEW_W = canvas.width, VIEW_H = canvas.height;
// 农场地图：四排建筑的布局（每栋建筑下面还要留出升级预留区 + 门口木牌）
// 第一排：果园 | 大水族箱（右边一整片都给它）
// 第二排：森林 | 宠物家 | 衣柜 | 厨房 | 主角家 | 卖货箱 | 商店 | 销售门面（右边排队）
// 第三排：森林 | 农田 | 鸡棚 | 小水坑
// 第四排：森林 | 中水坑 | 羊棚 | 牛棚 | 大海水蓝洞（连着右下角的大海）
const WORLD_W = 1920, WORLD_H = 1460;
// 主角出生点：第一排「主角家」大门口的正前方
const PLAYER_SPAWN = { x: 960, y: 745 };
const SAVE_V = 3;               // 存档格式版本（2/3 = 两版四排布局，老存档都要搬家）
// 观赏动物散步的范围（地图中间那一大片空地）
const ZOO_AREA = { x: WORLD_W / 2, y: 800, r: 560 };
const DAY_START = 8 * 60, DAY_END = 20 * 60;   // 游戏内分钟
const DAY_LENGTH = 240;                        // 现实秒 / 天
const CAMERA_ZOOM = 1.2;                       // 画面整体放大一点（人物/动物/文字在手机上更清楚）

// ---------------- 蔬菜作物表（来自 Noto 动画 Food and drink 部分的蔬菜） ----------------
// rate = 生长速度倍率（越大越快）；seed 价格越贵、卖价越高
const CROPS = [
  { id: 'carrot',     icon: '🥕', name: '胡萝卜',   nameEn: 'Carrot',      seedPrice: 5,  cropPrice: 15, rate: 1.0 },
  { id: 'tomato',     icon: '🍅', name: '番茄',     nameEn: 'Tomato',      seedPrice: 8,  cropPrice: 20, rate: 0.95 },
  { id: 'corn',       icon: '🌽', name: '玉米',     nameEn: 'Corn',        seedPrice: 12, cropPrice: 25, rate: 0.9 },
  { id: 'pea',        icon: '🫛', name: '豌豆',     nameEn: 'Pea Pod',     seedPrice: 10, cropPrice: 28, rate: 1.1,  cp: '1fadb' },
  { id: 'lettuce',    icon: '🥬', name: '生菜',     nameEn: 'Lettuce',     seedPrice: 12, cropPrice: 32, rate: 1.15, cp: '1f96c' },
  { id: 'pepper',     icon: '🫑', name: '青椒',     nameEn: 'Bell Pepper', seedPrice: 16, cropPrice: 40, rate: 0.95, cp: '1fad1' },
  { id: 'broccoli',   icon: '🥦', name: '西兰花',   nameEn: 'Broccoli',    seedPrice: 20, cropPrice: 48, rate: 0.9,  cp: '1f966' },
  { id: 'cucumber',   icon: '🥒', name: '黄瓜',     nameEn: 'Cucumber',    seedPrice: 18, cropPrice: 44, rate: 1.05, cp: '1f952' },
  { id: 'beet',       icon: '🍠', name: '甜菜根',   nameEn: 'Beet',        seedPrice: 22, cropPrice: 52, rate: 0.85, cp: '1fadc' },
  { id: 'potato',     icon: '🥔', name: '土豆',     nameEn: 'Potato',      seedPrice: 14, cropPrice: 34, rate: 1.2,  cp: '1f954' },
  { id: 'onion',      icon: '🧅', name: '洋葱',     nameEn: 'Onion',       seedPrice: 16, cropPrice: 38, rate: 1.1,  cp: '1f9c5' },
  { id: 'garlic',     icon: '🧄', name: '大蒜',     nameEn: 'Garlic',      seedPrice: 24, cropPrice: 56, rate: 0.85, cp: '1f9c4' },
];
const CROP_MAP = {};
CROPS.forEach(function (c) { CROP_MAP[c.id] = c; });

// ---------------- 物品数据 ----------------
const ITEMS = {
  egg: { name: '鸡蛋', icon: '🥚', price: 10, cp: '1f95a' },
  milk: { name: '牛奶', icon: '🥛', price: 18, cp: '1f95b' },
  wool: { name: '羊毛', icon: '🧶', price: 25, cp: '1f9f6' },
  honey: { name: '蜂蜜', icon: '🍯', price: 60, cp: '1f36f' },
  feed: { name: '动物饲料', icon: '🌾', price: 8, cp: '1f33e' },
  mushroom: { name: '蘑菇', icon: '🍄', price: 20, cp: '1f344' },
  carrot: { name: '胡萝卜', icon: '🥕', price: 15, cp: '1f955' },
  tomato: { name: '番茄', icon: '🍅', price: 20, cp: '1f345' },
  corn: { name: '玉米', icon: '🌽', price: 25, cp: '1f33d' },
  apple: { name: '苹果', icon: '🍎', price: 12, cp: '1f34e' },
  orange: { name: '橘子', icon: '🍊', price: 14, cp: '1f34a' },
  pear: { name: '梨子', icon: '🍐', price: 16, cp: '1f350' },
  peach: { name: '桃子', icon: '🍑', price: 20, cp: '1f351' },
  strawberry: { name: '草莓', icon: '🍓', price: 25, cp: '1f353' },
  // —— 新增水果（Noto 动画食物清单）——
  cherry:     { name: '樱桃',   icon: '🍒', price: 30, cp: '1f352' },
  watermelon: { name: '西瓜',   icon: '🍉', price: 45, cp: '1f349' },
  mango:      { name: '芒果',   icon: '🥭', price: 55, cp: '1f96d' },
  pineapple:  { name: '菠萝',   icon: '🍍', price: 70, cp: '1f34d' },
  lemon:      { name: '柠檬',   icon: '🍋', price: 26, cp: '1f34b' },
  melon:      { name: '甜瓜',   icon: '🍈', price: 50, cp: '1f348' },
  grape:      { name: '葡萄',   icon: '🍇', price: 60, cp: '1f347' },
  kiwi:       { name: '奇异果', icon: '🥝', price: 40, cp: '1f95d' },
  fish:       { name: '小鱼',     icon: '🐟', price: 22, cp: '1f41f' },
  shrimp:     { name: '小龙虾',   icon: '🦞', price: 14, cp: '1f99e' },
  shell:      { name: '小海星',   icon: '⭐', price: 8,  cp: '2b50' },
  goldfish:   { name: '热带鱼',   icon: '🐠', price: 24, cp: '1f41f' },
  crab:       { name: '螃蟹',     icon: '🦀', price: 28, cp: '1f980' },
  squid:      { name: '小水母',   icon: '🪼', price: 32, cp: '1fabc' },
  puffer:     { name: '河豚',     icon: '🐡', price: 48, cp: '1f421' },
  octopus:    { name: '章鱼',     icon: '🐙', price: 56, cp: '1f419' },
  lobster:    { name: '龙虾',     icon: '🦞', price: 68, cp: '1f99e' },
  seaturtle:  { name: '海龟',     icon: '🐢', price: 95, cp: '1f422' },
  croc:       { name: '鳄鱼',     icon: '🐊', price: 120, cp: '1f40a' },
  seal:       { name: '海豹',     icon: '🦭', price: 150, cp: '1f9ad' },
  dolphin:    { name: '海豚',     icon: '🐬', price: 200, cp: '1f42c' },
  shark:      { name: '鲨鱼',     icon: '🦈', price: 280, cp: '1f988' },
  whale:      { name: '鲸鱼',     icon: '🐳', price: 400, cp: '1f433' },
  fried_egg: { name: '煎蛋', icon: '🍳', price: 26, cp: '1f373' },
  salad: { name: '水果沙拉', icon: '🥗', price: 40, cp: '1f957' },
  fish_grill: { name: '烤鱼', icon: '🍢', price: 55, cp: '1f362' },
  pudding: { name: '蛋奶布丁', icon: '🍮', price: 65, cp: '1f36e' },
  fruit_cake: { name: '草莓蛋糕', icon: '🍰', price: 90, cp: '1f370' },
  honey_toast: { name: '蜂蜜吐司', icon: '🍞', price: 95, cp: '1f35e' },
  honey_cake: { name: '蜂蜜蛋糕', icon: '🧁', price: 175, cp: '1f9c1' },
  mushroom_soup: { name: '蘑菇浓汤', icon: '🍲', price: 85, cp: '1f372' },
  mushroom_omelet: { name: '蘑菇蛋卷', icon: '🥘', price: 58, cp: '1f958' },
  veggie_soup: { name: '蔬菜浓汤', icon: '🥣', price: 70, cp: '1f963' },
  fruit_pie: { name: '水果派', icon: '🥧', price: 130, cp: '1f967' },
  seafood_platter: { name: '海鲜小炒', icon: '🍤', price: 120, cp: '1f364' },
  // —— 新增菜肴（Noto 动画食物清单）——
  pasta:     { name: '番茄意面', icon: '🍝', price: 96,  cp: '1f35d' },
  pancakes:  { name: '松饼',     icon: '🥞', price: 105, cp: '1f95e' },
  doughnut:  { name: '甜甜圈',   icon: '🍩', price: 120, cp: '1f369' },
  cookie:    { name: '蜂蜜饼干', icon: '🍪', price: 130, cp: '1f36a' },
  popcorn:   { name: '爆米花',   icon: '🍿', price: 78,  cp: '1f37f' },
  pizza:     { name: '田园披萨', icon: '🍕', price: 145, cp: '1f355' },
  seed_carrot:{ name: '胡萝卜种子', icon: '🌱', price: 5,  seed: 'carrot' },
  seed_tomato:{ name: '番茄种子',  icon: '🫘', price: 8,  seed: 'tomato' },
  seed_corn: { name: '玉米种子', icon: '🌾', price: 12, cp: '1f331', seed: 'corn' },
  // —— 新增蔬菜（来自 Noto 动画食物清单）——
  pea:       { name: '豌豆',   icon: '🫛', price: 28, cp: '1fadb' },
  lettuce:   { name: '生菜',   icon: '🥬', price: 32, cp: '1f96c' },
  pepper:    { name: '青椒',   icon: '🫑', price: 40, cp: '1fad1' },
  broccoli:  { name: '西兰花', icon: '🥦', price: 48, cp: '1f966' },
  cucumber:  { name: '黄瓜',   icon: '🥒', price: 44, cp: '1f952' },
  beet:      { name: '甜菜根', icon: '🍠', price: 52, cp: '1fadc' },
  potato:    { name: '土豆',   icon: '🥔', price: 34, cp: '1f954' },
  onion:     { name: '洋葱',   icon: '🧅', price: 38, cp: '1f9c5' },
  garlic:    { name: '大蒜',   icon: '🧄', price: 56, cp: '1f9c4' },
};
// 种子物品：按 CROPS 自动补齐（名称 / 图标 / 价格 / 对应作物）
CROPS.forEach(function (c) {
  const key = 'seed_' + c.id;
  if (!ITEMS[key]) {
    ITEMS[key] = {
      name: c.name + '种子', icon: c.id === 'corn' ? '🌾' : '🌱',
      price: c.seedPrice, seed: c.id,
    };
  } else {
    ITEMS[key].price = c.seedPrice;
    ITEMS[key].seed = c.id;
  }
});

const RECIPES = [
  // —— 基础（材料很容易凑齐）——
  { id: 'fried_egg',       needs: { egg: 1 } },
  { id: 'salad',           needs: { fruit: 2 } },                       // 任意 2 个水果
  { id: 'fish_grill',      needs: { fish: 1 } },
  { id: 'pudding',         needs: { egg: 1, milk: 1 } },
  // —— 森林蘑菇 ——
  { id: 'mushroom_omelet', needs: { mushroom: 1, egg: 1 } },
  { id: 'mushroom_soup',   needs: { mushroom: 2, milk: 1 } },
  // —— 蜂蜜 ——
  { id: 'honey_toast',     needs: { honey: 1, corn: 1 } },
  { id: 'honey_cake',      needs: { honey: 2, egg: 2, milk: 1 } },
  // —— 菜地里种的 ——
  { id: 'veggie_soup',     needs: { carrot: 1, tomato: 1, corn: 1 } },
  { id: 'fruit_cake',      needs: { strawberry: 2, egg: 1, milk: 1 } },
  { id: 'fruit_pie',       needs: { fruit: 3, honey: 1 } },             // 任意 3 个水果 + 蜂蜜
  { id: 'seafood_platter', needs: { shrimp: 1, squid: 1, crab: 1 } },   // 钓上来的小海鲜
  // —— 新增菜肴（材料都能种 / 能养 / 能采）——
  { id: 'pasta',    needs: { tomato: 2, corn: 1 } },
  { id: 'pancakes', needs: { egg: 1, milk: 1, honey: 1 } },
  { id: 'doughnut', needs: { egg: 1, milk: 1, corn: 1 } },
  { id: 'cookie',   needs: { egg: 1, honey: 1, honey: 1 } },
  { id: 'popcorn',  needs: { corn: 2 } },
  { id: 'pizza',    needs: { tomato: 2, pepper: 1, milk: 1 } },
];
// 水果：前 5 种是原有的（草莓是灌木），后面几种是新增的果树
const FRUIT_IDS = ['apple', 'orange', 'pear', 'peach', 'strawberry',
  'cherry', 'watermelon', 'mango', 'pineapple', 'lemon', 'melon', 'grape', 'kiwi'];


// ---------------- 钓鱼：5 种大小的水波纹，每种 3 种渔获 ----------------
// 三个不同位置的水坑（排在第三、四排）：小水坑 / 中水坑 / 大海水蓝洞，每个水坑 5 种渔获
const PONDS = [
  { id: 'small',  name: '小水坑', nameEn: 'Small Puddle', x: 1630, y: 890, w: 152, h: 88,
    rip: { lv: 1, r: 12, color: '#cdeeff', w: 34, name: '小水波', nameEn: 'Small ripple' },
    pool: ['fish', 'shrimp', 'shell', 'goldfish', 'crab'] },
  { id: 'medium', name: '中水坑', nameEn: 'Medium Pond',  x: 650, y: 1180, w: 212, h: 124,
    rip: { lv: 3, r: 24, color: '#63c6f7', w: 20, name: '中水波', nameEn: 'Medium ripple' },
    pool: ['squid', 'puffer', 'octopus', 'lobster', 'seaturtle'] },
  { id: 'large',  name: '大海水蓝洞', nameEn: 'Big Blue Hole', x: 1710, y: 1180, w: 300, h: 172,
    rip: { lv: 5, r: 44, color: '#9a7cf0', w: 7,  name: '大水波', nameEn: 'Big ripple' },
    pool: ['croc', 'seal', 'dolphin', 'shark', 'whale'] },
];
const POND_MAP = {};
PONDS.forEach(p => { POND_MAP[p.id] = p; });
const SEA_ALL = PONDS.reduce(function (a, p) { return a.concat(p.pool); }, []);
function pondLabel(p) { return lang === 'en' ? p.nameEn : p.name; }

// ---------------- 森林 & 蜂巢 ----------------
// 森林排在最左边一列，占满第二、三、四排（一条竖直的林带）：
// 右边依次是水族箱/农田/羊棚这些，走进去就能采蜂蜜和蘑菇
const FOREST = { x: 30, y: 500, w: 400, h: 830 };
const HIVE = { x: 330, y: 704, r: 96, honey: 1, honeyT: 0, max: 2 };
const HONEY_EVERY = 55;          // 秒：蜂巢重新酿出蜂蜜
// 小工具（提前定义，下面的数据表初始化就要用）
function dist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
const FOREST_TREES = [           // 森林里的大树（蜂巢就挂在那棵树上）
  { x: 330, y: 780, kind: 'big', phase: 0.4 },
  { x: 140, y: 610, kind: 'pine', phase: 1.2 },
  { x: 150, y: 940, kind: 'pine', phase: 2.1 },
  { x: 330, y: 1080, kind: 'pine', phase: 3.4 },
  { x: 165, y: 1250, kind: 'pine', phase: 4.2 },
];
const FOREST_DECOR = [];         // 树桩 / 灌木（纯装饰）
[['stump', 300, 560], ['stump', 80, 720], ['bush', 250, 860], ['bush', 90, 1060],
 ['bush', 380, 1160]]
  .forEach(function (d) { FOREST_DECOR.push({ kind: d[0], x: d[1], y: d[2], phase: rand(0, 6) }); });

// 森林里的蘑菇：走过去按 E 就能采；采完过一会儿（或睡一觉）会自己长回来
const MUSHROOMS = [];
const MUSHROOM_REGROW = 40;      // 采完多少秒长回来
const MUSHROOM_POS = [[80, 560], [250, 660], [110, 830], [350, 900], [200, 1010], [120, 1190], [330, 1290]];
function freshMushroom() {
  MUSHROOMS.length = 0;
  MUSHROOM_POS.forEach(function (p) {
    MUSHROOMS.push({ x: p[0], y: p[1], phase: rand(0, 6), picked: false, timer: 0 });
  });
}
freshMushroom();
function inForest(x, y) {
  return x > FOREST.x && x < FOREST.x + FOREST.w && y > FOREST.y && y < FOREST.y + FOREST.h;
}
function inHiveReach(x, y) { return dist(x, y, HIVE.x, HIVE.y) < HIVE.r; }
// 离水坑边缘的距离（负数表示站在水里）
function pondDist(p, x, y) {
  const ex = (x - p.x) / (p.w / 2), ey = (y - p.y) / (p.h / 2);
  const d = Math.sqrt(ex * ex + ey * ey);
  return (d - 1) * Math.min(p.w, p.h) / 2;
}

// 玩家真正能拿到手的材料（菜谱只应该用这些）：
// 动物产出 3 种 + 饲料 + 森林蘑菇/蜂蜜 + 3 种作物 + 5 种水果 + 15 种渔获
const OBTAINABLE = {};
['egg', 'milk', 'wool', 'feed', 'mushroom', 'honey',
 ...CROPS.map(c => c.id), ...FRUIT_IDS, ...SEA_ALL].forEach(function (k) { OBTAINABLE[k] = 1; });

const SELLABLE = ['egg','milk','wool','honey','mushroom','feed',...CROPS.map(c => c.id),...FRUIT_IDS,...SEA_ALL,
  'fried_egg','salad','fish_grill','pudding','fruit_cake','honey_toast','honey_cake',
  'mushroom_soup','mushroom_omelet','veggie_soup','fruit_pie','seafood_platter',
  'pasta','pancakes','doughnut','cookie','popcorn','pizza'];
const PET_HATS = {
  bow:    { name: '宠物蝴蝶结', icon: '🎀', price: 30 },
  straw:  { name: '宠物草帽',   icon: '👒', price: 30 },
  cap:    { name: '宠物棒球帽', icon: '🧢', price: 50 },
  flower: { name: '宠物花环',   icon: '🌸', price: 60 },
  crown:  { name: '宠物皇冠',   icon: '👑', price: 90 },
};
// 可购买的动物
const ANIMAL_SHOP = [
  { type: 'chicken', name: '母鸡',   icon: '🐔', price: 150, desc: '会下蛋' },
  { type: 'sheep',   name: '小绵羊', icon: '🐑', price: 320, desc: '能剪羊毛' },
  { type: 'cow',     name: '小奶牛', icon: '🐄', price: 650, desc: '能挤牛奶' },
];
// 非鸡类动物的总上限由「羊棚 + 牛棚」的等级决定：见 maxOtherAnimals()

// ---------------- 交通工具（骑上以后走得快） ----------------
const WALK_SPEED = 170;          // 走路速度（像素/秒）
const VEHICLES = [
  { id: 'scooter',    name: '滑板车', nameEn: 'Scooter', icon: '🛴', price: 120, speed: 1.55, desc: '轻巧好骑' },
  { id: 'bicycle',    name: '自行车', nameEn: 'Bicycle', icon: '🚲', price: 320, speed: 1.95, desc: '踩起来飞快' },
  { id: 'motorcycle', name: '摩托车', nameEn: 'Motorcycle', icon: '🏍️', price: 780, speed: 2.50, desc: '农场最快' },
];
const VEHICLE_MAP = {};
VEHICLES.forEach(function (v) { VEHICLE_MAP[v.id] = v; });
// 停车架：走到旁边可以「骑上 / 停下」，停下来时车停在原地
const VEHICLE_RACK = { x: 668, y: 480, r: 86 };   // 停车架（第一、二排之间的空地）
// 可购买的庭院装饰（r = 占地半径，用于防重叠）
const DECOR_SHOP = [
  { id: 'rock',      name: '大石头', icon: '🪨', price: 20,  r: 16 },
  { id: 'mushroom',  name: '小蘑菇', icon: '🍄', price: 30,  r: 13 },
  { id: 'fence',     name: '小栅栏', icon: '🚧', price: 40,  r: 34 },
  { id: 'flowerbed', name: '花坛',   icon: '🌷', price: 60,  r: 34 },
  { id: 'lamp',      name: '路灯',   icon: '💡', price: 100, r: 13 },
  { id: 'bench',     name: '长椅',   icon: '🪑', price: 120, r: 32 },
  { id: 'scarecrow', name: '稻草人', icon: '🧑‍🌾', price: 180, r: 22 },
  { id: 'blossom',   name: '樱花树', icon: '🌸', price: 200, r: 26 },
  { id: 'christmas', name: '圣诞树', icon: '🎄', price: 300, r: 26 },
  { id: 'fountain',  name: '小喷泉', icon: '⛲', price: 500, r: 38 },
  { id: 'windmill',  name: '大风车', icon: '🎡', price: 800, r: 38 },
];
const DECOR_R = {};
DECOR_SHOP.forEach(d => { DECOR_R[d.id] = d.r; });
// 客人的随机姓名（中英各一套）
const CUSTOMER_NAMES = [
  { zh: '小明', en: 'Ming' },   { zh: '小红', en: 'Hong' },   { zh: '小刚', en: 'Gang' },
  { zh: '丽丽', en: 'Lily' },   { zh: '大力', en: 'Leo' },    { zh: '甜甜', en: 'Candy' },
  { zh: '阿宝', en: 'Bao' },    { zh: '小雨', en: 'Rainy' },  { zh: '豆豆', en: 'Doudou' },
  { zh: '圆圆', en: 'Yuan' },   { zh: '果果', en: 'Guo' },    { zh: '星星', en: 'Star' },
  { zh: '乐乐', en: 'Joy' },    { zh: '妞妞', en: 'Niu' },    { zh: '虎子', en: 'Tiger' },
  { zh: '米米', en: 'Mimi' },   { zh: '阳阳', en: 'Sunny' },  { zh: '月月', en: 'Luna' },
];
const HAIR_STYLES = ['short', 'long', 'pigtail', 'ponytail', 'bun', 'curly', 'bowl'];
const HAIR_COLORS = ['#5a3a1e', '#6b4226', '#3a2a1a', '#a86a3a', '#d9a62e', '#8a5a2e', '#c88ae8', '#5fa8e8'];

// ---------------- 多语言（中文 / English） ----------------
let lang = 'zh';
try { lang = localStorage.getItem('farm-lang') === 'en' ? 'en' : 'zh'; } catch (e) {}

const STR = {
  zh: {
    // —— 开始界面 / 通用 UI ——
    title: '🌈 快乐小牧场',
    subtitle1: '选择你的角色开始农场生活吧！',
    boy: '小男孩', girl: '小女孩',
    subtitle2: '再挑一只小宠物陪你：',
    dog: '小狗', cat: '小猫',
    btnStart: '🎮 开始新游戏',
    btnContinue: '📂 继续上次的牧场',
    helpHint: '⌨️ 方向键 / WASD 走路 · E 或 空格 做动作 · H 帮助',
    helpTitle: '📖 怎么玩', btnKnow: '知道啦！',
    help1: '🚶 方向键 / WASD：走来走去',
    help2: '✋ E / 空格：捡东西、种地、挤奶、剪羊毛、钓鱼、和客人说话',
    help3: '🥚 母鸡会下蛋（一只母鸡一天最多下一个），捡起来！小鸡还不会下蛋',
    help4: '🐄 牛可以挤牛奶，🐑 羊可以剪羊毛',
    help5: '🌱 田里：先耕地 → 撒种子 → 浇水 → 收获',
    help6: '🍎 摇摇果树，水果掉下来',
    help7: '🎣 去池塘边钓鱼，看到「!」马上按 E！',
    help8: '🍳 回家用厨房做好吃的',
    help9: '👕 衣柜可以换新衣服（商店里买）',
    help10: '🛒 客人来买你头上的东西，卖给TA赚金币',
    help11: '📦 卖货箱可以卖掉任何东西',
    help12: '🎡 商店还能买动物和庭院装饰，自己摆放！',
    help13: '🌧️ 下雨天水会自动浇好；💾 游戏会自动存档',
    help16: '🔨 点右上角的「🔨 升级」按钮，选一样东西就能升级 —— 地方变大、能养更多、能买更多',
    help17: '🐾 宠物房间要给宠物🍖喂食、🧹清理便便、🛁洗澡；升级房间能养更多只宠物',
    help18: '👗 买到的裙子 / 头饰 / 鞋子会自动挂进「衣帽间」，点一下就能换上',
    shopTitle: '🛒 牧场商店', tabSeeds: '🌱 种子', tabClothes: '👕 服装',
    tabAnimals: '🐮 动物', tabDecor: '🎡 装饰', tabPet: '🐾 宠物装扮',
    btnLeaveShop: '离开商店',
    btnQuitHint: '离开',
    cookTitle: '🍳 小厨房', btnCookDone: '做好啦',
    wardrobeTitle: '👕 我的衣柜', wtabHat: '🎩 帽子', wtabShirt: '👕 上衣', wtabPants: '👖 裤子',
    btnWardrobeDone: '换好啦',
    sellTitle: '📦 卖货箱', sellSubtitle: '点一点，把东西换成金币！', btnCloseBin: '关上门',
    logTitle: '📜 牧场日志',
    minimapTitle: '🗺️ 农场地图',
    bedTitle: '🌙 睡觉时间到啦',
    bedHint: '睡觉前先做完三件事，做完才能去睡觉哦',
    bedStepBrush: '刷牙', bedStepWash: '洗脸', bedStepCream: '涂脸',
    bedTipBrush: '手指当小牙刷 🪥 把牙齿上的小黄点都刷掉～',
    bedTipWash: '手指当小毛巾 🧽 把脸上的小泥点都擦干净～',
    bedTipCream: '手指当面霜 🧴 把香香涂满小脸～',
    bedTipAllDone: '真棒！三件事都做完啦，点「去睡觉」吧 😴',
    bedPercent: '（{n}%）',
    bedNice: '好棒！',
    bedSleep: '😴 去睡觉',
    bedAgain: '🔄 再洗一次',
    bedLogNight: '🌙 天黑啦，睡觉前先刷牙洗脸',

    // —— 状态栏 ——
    hudDay: '📅 第 {n} 天', weather: { sunny: '☀️ 晴天', cloudy: '⛅ 多云', rain: '🌧️ 下雨' },
    // —— 交互提示 ——
    prPickup: '捡起 {item}', prShear: '✂️ 剪羊毛', prMilk: '🥛 挤牛奶',
    prPetChicken: '🐔 摸摸小鸡', prPetChick: '🐤 摸摸小鸡', prPetHen: '🐔 摸摸母鸡',
    prPetHenLaid: '🐔 摸摸母鸡（今天已经下过蛋啦）',
    henLaidToday: '这只母鸡今天已经下过蛋啦，明天再来吧 🥚',
    henWillLay: '它今天还没下蛋，等等看 🥚',
    prPetSheep: '🐑 摸摸小羊（羊毛还没长好）', prPetCow: '🐄 摸摸奶牛（等会儿才有奶）',
    prTill: '⛏️ 耕地', prPlant: '🌱 播种 {seed}', prNoSeed: '🌱 需要种子（去商店买）',
    prWater: '💧 浇水', prHarvest: '🧺 收获 {crop}', prTree: '摇一摇{fruit}树',
    prCook: '🍳 做饭', prWardrobe: '👕 换衣服', prSell: '📦 卖东西', prShop: '🛒 打开商店',
    prFish: '🎣 钓鱼', prCustomer: '把 {item} 卖给{name}',
    prPlace: '放置「{decor}」：[{key}] 放下{extra}',
    prFishing: '🎣 等待中…（按 {key} 提前收杆）', prBite: '❗ 快按 {key} 收杆！',
    // —— 日志 / 提示 ——
    welcome: '欢迎来到快乐小牧场，{name}！去找点事情做吧 🌱',
    welcomeBack: '欢迎回来，{name}！第 {day} 天继续加油 🌻',
    loadFailed: '存档读不出来，重新开始吧',
    night: '🌙 天黑啦，睡觉觉…',
    morning: '☀️ 第 {day} 天开始啦！',
    rainHint: '🌧️ 今天下雨，不用浇水～',
    bought: '买到 {item}！',
    boughtClothes: '买到 {name}！去衣柜换上吧 👕',
    boughtAnimal: '{animal}来到牧场啦！它会自己散步 🎉',
    tooManyAnimals: '牧场里的动物太多啦！',
    boughtDecor: '买好啦！走到想放的地方按 {key} 放下{extra}',
    decorCancel: '先不放了，收起来咯',
    placedDecor: '{decor}放好啦，真好看 🎉',
    inWater: '不能放在水里哦 💧',
    noRoomHere: '这里放不下，去那块空着的草地上试试～',
    tooCrowded: '这里太挤啦，换个地方吧',
    wearPetHat: '小{pet}戴上啦，好开心！',
    equipDone: '换上 {name}！',
    cookDone: '香喷喷的{dish}做好啦！',
    soldBin: '卖掉 {item}，+{n} 金币！',
    sellHalf: '卖一半（{k} 个）💰{n}',
    soldCustomer: '客人好开心！+{n} 金币',
    noSuchItem: '背包里没有 {item} 哦',
    gotWool: '剪到一团软软的羊毛！',
    gotMilk: '挤到新鲜牛奶！',
    noSeed: '没有种子啦，去商店买一些吧 🛒',
    harvested: '收获 2 个{crop}！',
    castLine: '等待小鱼上钩…',
    caughtBig: '哇！钓到一条大鱼！🐠',
    caughtSmall: '钓到一条小鱼！🐟',
    reelIn: '收起鱼竿啦',
    customerCome: '🔔 {name} 来买东西啦！',
    customerGone: '{name} 等太久走掉了…',
    fishEscaped: '小鱼跑掉了…再试一次！',
    notEnoughCoins: '金币不够啦',
    // —— 日志专用 ——
    logPickup: '捡起了 {item}',
    logTill: '翻好了一块地',
    logPlant: '种下了 {seed}',
    logWater: '给菜地浇了水',
    logShear: '剪到了羊毛',
    logMilk: '挤到了牛奶',
    logEgg: '🥚 母鸡下了一个蛋（今天 {laid}/{hen} 只母鸡下过蛋）',
    logWoolBack: '🐑 羊毛长好啦',
    logMilkBack: '🐄 奶牛又有奶了',
    logCustomerWant: '🔔 {name} 想买 {item}',
    logMusicOn: '🎵 背景音乐已打开', logMusicOff: '🔕 背景音乐已关闭',
    logSoundOn: '🔊 音效已打开', logSoundOff: '🔇 音效已关闭',
    logLang: '🌏 语言切换为中文',
    logDecor: '摆放了{decor}',
    cancelHint: '（按 Q 取消）',
    caught: '🎣 在{pond}钓到了{fish}！',
    logRipple: '{pond}泛起{size}…',
    prFishAt: '🎣 在{pond}钓鱼',
    zooHead: '农场里有 {n} 只观赏动物（最多 {max} 只）',
    zooNote: '观赏动物·不产出',
    tooManyZoo: '观赏动物太多啦，先让它们散散步吧！',
    boughtZoo: '{animal}来到农场啦！它会四处散步 🎉',
    genderSwitched: '变成{who}啦！',
    petSwitched: '宠物换成小{pet}啦！',
    charSection: '👦 角色与宠物',
    tabZoo: '🦁 观赏动物',
    tankTitle: '🐠 大型水族箱', tankCount: '水族箱里 {n}/{max} 条',
    tankBagTitle: '🎣 我的鱼篓', tankEmpty: '水族箱还是空的，去钓几条鱼吧 🎣',
    bagNoFish: '还没有钓到鱼呢，去池塘边钓鱼吧',
    putIn: '放入', takeOut: '取出', tankFull2: '放不下了',
    tankFull: '水族箱满了（最多 {max} 条），先取出几条吧！',
    tankPut: '{fish} 放进水族箱啦 🐠', tankTake: '把 {fish} 取出来了',
    prTank: '🐠 打开水族箱',
    bookTitle: '📖 动物图鉴', bookZoo: '🦁 动物园', bookSea: '🐟 海洋馆',
    bookOwned: '已拥有 {n} 只', bookNone: '还没收集到',
    bookHint: '买到的观赏动物和钓到的海洋生物都会记录在这里',
    caughtTimes: '钓到过 {n} 次',
    petDuck: '小鸭',
    petGoose: '小鹅',
    animalHen: '母鸡',
    tooManyHens: '鸡棚里已经有 {max} 只母鸡啦，先让小鸡长大吧',
    shopHenDesc: '会下蛋 · 最多 {hm} 只',
    logSoldCustomer: '把 {item} 卖给了{name}，+{n} 金币',
    rotateHint: '🔄 横过来玩，画面更大更清楚',
    logTitle2: '最近发生的事',
    // —— 取名字 / 多存档 ——
    nameLabel: '✏️ 我的名字',
    namePlaceholder: '输入名字，比如 小明',
    saveListHead: '💾 这台电脑上的存档（点名字继续玩）',
    enterName: '✏️ 先写下你的名字吧（这样才好分辨谁的存档）',
    nameTooLong: '名字太长啦，最多 8 个字',
    maxProfiles: '存档太多了，先删掉一个再用新名字吧',
    nameOccupied: '这个名字已经有存档了，点下面的存档继续玩，或换个名字',
    saveDeleted: '删掉了「{name}」的存档',
    saveFailed: '存档失败，浏览器空间可能满了',
    dayUnit: '天',
    // —— 大图卡片 ——
    gotCard: '拿到 {item}！',
    gotCardSub: '放进背包里啦',
    boughtCardSub: '已经放进背包',
    cookCardSub: '香喷喷，可以卖个好价钱',
    boughtAnimalSub: '它会自己散步',
    feedCardSub: '每天都要喂动物哦',
    petSwitchSub: '它会一直跟着你',
    // —— 饲料 / 放牧 ——
    prTrough: '🌾 放饲料（{animal}，槽里还有 {n}/{max} 份）',
    prTroughEmpty: '🌾 快放饲料！{animal} 饿啦（{n}）',
    feedToday: '今天必须喂，不然就跑出去了',
    runOff: '已经跑出围栏了',
    prHungryAnimal: '🌾 {animal} 饿跑了（去食槽放饲料）',
    noFeed: '背包里没有饲料，去商店买或收获玉米吧 🌾',
    feedFull: '食槽已经满满的啦',
    logFeed: '往食槽里放了饲料（还剩 {n}/{max} 份）',
    logFeedCorn: '用玉米拌了饲料放进槽里（还剩 {n}/{max} 份）',
    logFeedBack: '🌾 动物们吃饱啦，又有精神产出了',
    logStarveOut: '😢 {animal} 连续 3 天没吃东西，饿得跑出围栏了！',
    logStillHungry: '😢 {animal} 已经饿了 {n} 天，快放饲料！',
    animalHungry: '{animal} 饿坏了，先去食槽放饲料吧 🌾',
    boughtFeed: '买到 {n} 份动物饲料！',
    feedShopDesc: '每只动物每天 {n} 份 · 连续 3 天不喂会饿跑',
    feedCount: '食槽：{n}/{max} 份',
    saveSummary: '第 {day} 天 · 💰{coins} · {time}',
    // —— 鸡棚：孵蛋 / 小鸡长大 ——
    prHatch: '🐣 孵蛋器（鸡蛋 {n}/{max}）',
    prHatchReady: '🐣 小鸡孵出来啦！',
    logHatchPut: '把鸡蛋放进了孵蛋器 🥚',
    logHatched: '🐣 孵出了一只小鸡！',
    logChickGrew: '🐤 小鸡长大了，变成母鸡！',
    logHensFull: '🐔 已经有 {max} 只母鸡了，小鸡就先这样吧',
    logChicksFull: '🐤 小鸡已经满 {max} 只啦',
    logHens: '🐔 母鸡 {h}/{hm} 只 · 🐤 小鸡 {c}/{cm} 只 · 🌾 饲料 {f} 份',
    noEggForHatch: '背包里没有鸡蛋，先去捡一个吧 🥚',
    hatchFull: '孵蛋器满了（最多 {max} 个），等小鸡孵出来吧',
    hatchWait: '🥚 孵蛋器里有 {n} 个鸡蛋，再过 {d} 天小鸡就出来啦',
    hatchDays: '🥚 孵蛋器：{n} 个蛋 · 还要 {d} 天',
    growDays: '🐤 还要 {d} 天长成母鸡',
    hatchNone: '🥚 孵蛋器空着，把鸡蛋放进去吧',
    // —— 森林 / 蜂巢 ——
    prHive: '🍯 拿蜂蜜',
    prPickMushroom: '采蘑菇',
    cropInfo: '约 {sec} 秒长好',
    logPlantCrop: '种下了{crop}（约 {sec} 秒长好）',
    // —— 找零钱小挑战 ——
    mathTitle: '🧮 帮忙算零钱',
    mathAsk: '客人买了 {item}（{price} 金币），给了 {paid} 金币，要找他多少零钱？',
    mathHint: '客人给的钱 − 东西的价格 = 要找的零钱',
    eachFor: '每个 {n} 金币',
    paidChip: '给了 {n} 金币',
    nlPrice: '价格',
    nlPaid: '付的钱',
    coinUnit: '{n} 金币',
    mathWrong: '再想想～',
    mathRight: '零钱算对啦：找了 {n} 金币 ✅',
    logCustomerLeftMath: '🧮 {name} 等太久，走了…（下次算快一点）',
    prCustomerMath: '把 {item} 卖给{name}（要算零钱）',
    needMoreBasket: '客人要的是 {list}，先去收齐吧',
    // —— 交通工具 ——
    tabVehicles: '🛴 交通',
    prRide: '骑上{v}',
    prPark: '停下{v}',
    prRackEmpty: '停车架（先去商店买一辆）',
    noVehicle: '还没有交通工具，去商店的「🛴 交通」里买一辆吧',
    mounted: '骑上{v}啦！',
    mountedSub: '走得比以前快多了',
    parked: '把{v}停在这里了',
    boughtVehicle: '买到{v}！',
    boughtVehicleSub: '速度 ×{n}，走到停车架就能骑',
    speedNote: '速度 ×{n}',
    vehicleShopHead: '买回来后走到停车架（小屋旁）按 {key} 就能骑上，骑上走得快；再按一次就停下',
    logPickMushroom: '🍄 在森林里采到一朵蘑菇',
    mushroomCardSub: '可以卖钱，也能做菜',
    prHiveEmpty: '🍯 蜂蜜还没酿好…',
    logHoney: '🍯 从蜂巢拿到了蜂蜜',
    logHoneyReady: '🍯 蜂巢又有蜂蜜啦',
    honeyGot: '拿到蜂蜜啦，甜甜的！🍯',
    honeyNotReady: '蜂蜜还没酿好，等一等吧 🐝',
    owned: '已有啦 ✓', buyFor: '💰{n} 买',
    animalCount: '牧场现在有 {n} 只动物（最多 {max} 只）',
    decorCount: '农场已有 {n} 件装饰 · 买好后走到想放的地方，按 {key} 放下',
    placeFree: '可自由摆放', wearing: '穿着呢 ✓', wearIt: '穿上',
    petSection: '🐾 宠物的装扮：', wearPet: '给宠物戴',
    need: '需要', cookOne: '🍳 做一份', noMats: '材料不够',
    bagEmpty: '背包空空的呢～', sellOne: '卖 1 个 💰{n}', anyFruit: '🍎任意水果×{n}',
    saveInfo: '第 {day} 天 · 💰{coins} · 上次保存 {time}',
    switchLang: '切换中文 / English',
    saveTitle2: '自动存档', musicTitle: '背景音乐开关', muteTitle: '声音开关',
    // —— 设施升级 ——
    expandArea: '🔨 扩建预留区',
    upgradeTitle: '🔨 升级设施',
    upgNow: '现在是 {lv} 级',
    upgNext: '升级后会变成：{cap}',
    upgMax: '已经是最高级啦 🎉',
    upgBtn: '🔨 升级  💰{n}',
    upgNoCoin: '金币不够，升级要 {n} 金币',
    upgradeDone: '{fac} 升到 {lv} 级啦！',
    logUpgrade: '🔨 {fac} 升到 {lv} 级',
    upgPickHint: '点一下想升级的东西，就能看到它现在的样子',
    upgMaxShort: '已满级',
    upgBack: '返回上一页',
    upgradeHint: '升级以后地方变大，能养 / 能买的东西也更多！',
    lvBadge: '⭐{lv} 级',
    pondLocked: '这个水坑还没解锁，升级「水坑」就能来这里钓鱼',
    // —— 商店 / 厨房 / 水族箱 / 衣橱 的升级入口 ——
    upgFacility: '🔨 升级{fac}',
    shopTierNote: '商店 {lv} 级 · 升级后能买到更多东西',
    wdTierNote: '衣橱 {lv} 级 · 升级后开放更多服饰',
    cookTierNote: '厨房 {lv} 级 · 升级后能做更多菜',
    tankTierNote: '水族箱 {lv} 级 · 升级后能养更多鱼',
    tierLocked: '🔒 升级后开放',
    // —— 宠物房间 ——
    prPetFood: '🍖 给{pet}喂食（{n} 金币）',
    prPetClean: '🧹 清理{pet}的便便',
    prPetBath: '🛁 给{pet}洗澡',
    petNoPet: '还没有宠物呢，去商店的「🍖 宠物用品」领养一只吧',
    petHaveOne: '现在带着 {pet} · 再买一只就是换掉它',
    petShopHead: '还没有宠物，先领养一只吧',
    petSwapThis: '换成这只',
    petSwapped: '{pet}换好啦，真可爱！',

    petHunger: '🍖 饱腹',
    petClean: '🛁 清洁',
    petPoop: '💩 便便 ×{n}',
    petFeed: '🍖 喂食',
    petBrush: '🧹 清理',
    petBath: '🛁 洗澡',
    petAdopt: '🐾 领养一只',
    petAdoptSub: '会住进宠物房间',
    petAlreadyFull: '{pet}已经吃得饱饱的啦',
    petFed: '{pet}吃得饱饱的 🍖（花了 {n} 金币）',
    petCleaned: '{pet}的便便清理干净啦 🧹',
    petBathed: '{pet}洗得香香的 🛁',
    petAdoptDone: '{pet}搬进宠物房间啦 🐾',
    petNeedHungry: '肚子饿了',
    petNeedPoop: '该清理便便了',
    petNeedDirty: '该洗澡了',
    petAllHappy: '宠物们都很开心 💖',
    petStatusOk: '开开心心 💖',
    // —— 衣帽间 ——
    // —— 🎫 来参观的客人（观赏费）——
    spot_chicken: '鸡棚的母鸡', spot_sheep: '羊棚的小羊', spot_cow: '牛棚的奶牛',
    spot_zoo: '观赏动物', spot_tank: '水族箱里的鱼',
    themeZoo: '动物', themeTank: '水族馆',
    logVisitorCome: '🎫 {name}来农场参观了（想看{what}）',
    logVisitorPaid: '👀 {name}看了{spot}，付了 {n} 金币观赏费',
    logVisitorLeave: '🚶 {name}参观完走了，一共付了 {n} 金币观赏费',
    visitorSay: '{name}：这里的{spot}真好看！',
    prGreetVisitor: '🙋 跟{name}打个招呼',
    greetVisitor: '{name}：谢谢你让我参观，下次还来！💖',
    attractHint: '🌟 农场现在能同时接待 {n} 位参观客人（动物 / 观赏动物 / 水族箱的鱼越多，来的人越多、给的观赏费也越多）',
    logAttractMore: '🌟 农场更热闹了！现在最多能同时接待 {n} 位参观客人',
    // —— 升级面板：建筑现状 ——
    upgStatusHead: '📋 现在的状况：',
    upgCapHead: '✅ 现在的容量：',
    stCoop: '母鸡 {h}/{hm} 只 · 小鸡 {c}/{cm} 只 · 孵蛋器 {e}/{em} 个蛋',
    stSheep: '羊 {n}/{max} 只',
    stCow: '牛 {n}/{max} 头',
    stOrchard: '果树 {n}/{max} 棵 · 没种的果树苗可以在商店买',
    stPond: '已解锁 {n}/{max} 个水坑 · 能钓 {k}/{km} 种鱼',
    stTank: '水族箱里 {n}/{max} 条 · 图鉴已收集 {caught} 种',
    stKitchen: '能做 {n}/{max} 道菜 · 现在材料够做 {can} 道',
    stWardrobe: '开放 {t}/{tm} 档服饰 · 能买到 {avail} 件 · 衣橱里已有 {n} 件',
    stShop: '开放 {t}/{tm} 档商品 · 现在在卖 {n} 种',
    closetTitle: '👗 我的衣帽间',
    closetMirror: '🪞 试衣镜',
    wtabHair: '🎀 头饰', wtabDress: '👗 裙子', wtabShoes: '👟 鞋子',
    tabPetCare: '🐾 领养宠物',
    shopSheepDesc: '会产羊毛 · 最多 {max} 只',
    shopCowDesc: '会产牛奶 · 最多 {max} 头',
    tooManySheep: '羊棚里已经有 {max} 只羊啦，先升级羊棚吧',
    tooManyCows: '牛棚里已经有 {max} 头牛啦，先升级牛棚吧',
    orchardShopHead: '果树园 {n}/{max} 棵（{lv} 级）· 买一棵就自动种进果园',
    orchardFull: '果树园已经种满啦（最多 {max} 棵）',
    saplingSuffix: '果树苗',
    saplingDesc: '💰{n} · 种进果树园',
    saplingSub: '过一会儿就会结果子啦',
    plantSapling: '把{fruit}树种进果园啦！现在 {n}/{max} 棵 🌳',
    closetHint: '买到的衣服会自动挂进衣帽间，点一下就能换上',
    closetRail: '🧥 挂衣杆',
    closetShelf: '🎩 帽子架',
    closetHair: '🎀 头饰架',
    closetDrawer: '👖 抽屉',
    closetShoeRack: '👟 鞋架',
    closetDress: '👗 裙子杆',
    closetEmpty: '这里还空着，去商店买一些吧',
    dressNote: '穿上裙子就不穿上衣和裤子啦',
    boughtToCloset: '{name}已经挂进衣橱啦 👗',
    tryOn: '试穿',
    // —— 复数商品的找零 ——
    mathAskMulti: '客人买了 {n} 个{item}（每个 {price} 金币），给了 {paid} 金币，要找他多少零钱？',
    mathAskMix: '客人买了 {a}（{pa} 金币）和 {b}（{pb} 金币），给了 {paid} 金币，要找他多少零钱？',
    mathStepTotal: '第一步 · 先算总价',
    mathStepMul: '{price} × {n} = ?',
    mathStepAdd: '{pa} + {pb} = ?',
    mathStepChange: '第二步 · 再算找零',
    mathStepSub: '{paid} − {total} = ?',
    mathExpression: '列出算式',
    mathNiceMul: '总价算对啦：{price} × {n} = {total} ✅',
    mathNiceAdd: '总价算对啦：{pa} + {pb} = {total} ✅',
    mathNiceSub: '找零算对啦：{paid} − {total} = {change} ✅',
    mathStep2Now: '再算要找多少零钱吧',
  },
  en: {
    title: '🌈 Happy Little Farm',
    subtitle1: 'Pick your character and start farm life!',
    boy: 'Boy', girl: 'Girl',
    subtitle2: 'Now choose a pet to join you:',
    dog: 'Puppy', cat: 'Kitten',
    btnStart: '🎮 New Game',
    btnContinue: '📂 Continue',
    helpHint: '⌨️ Arrows / WASD to walk · E or Space to act · H for help',
    helpTitle: '📖 How to Play', btnKnow: 'Got it!',
    help1: '🚶 Arrow keys / WASD: walk around',
    help2: '✋ E / Space: pick up, plant, milk, shear, fish, talk to customers',
    help3: '🥚 Hens lay eggs (one per hen per day) — pick them up! Chicks do not lay yet',
    help4: '🐄 Milk the cow, 🐑 shear the sheep',
    help5: '🌱 Field: till → plant seeds → water → harvest',
    help6: '🍎 Shake the fruit trees to drop fruit',
    help7: '🎣 Fish at the pond — press E fast when you see「!」',
    help8: '🍳 Cook tasty food in the kitchen at home',
    help9: '👕 Change clothes in the wardrobe (buy them in the shop)',
    help10: '🛒 Customers come to buy things — sell to earn coins',
    help11: '📦 The shipping bin buys anything you have',
    help12: '🎡 The shop also sells animals and yard decorations!',
    help13: '🌧️ Rain waters your crops; 💾 the game saves by itself',
    help16: '🔨 Tap the 🔨 Upgrade button up top, pick something, and upgrade it — bigger area, more room, more goods',
    help17: '🐾 At the pet room you can 🍖 feed, 🧹 clean up and 🛁 bathe your pet; upgrade it to keep more pets',
    help18: '👗 Dresses, hair accessories and shoes you buy are hung up in the walk-in closet — tap to wear them',
    shopTitle: '🛒 Farm Shop', tabSeeds: '🌱 Seeds', tabClothes: '👕 Clothes',
    tabAnimals: '🐮 Animals', tabDecor: '🎡 Decor', tabPet: '🐾 Pet Hats',
    btnLeaveShop: 'Leave Shop',
    btnQuitHint: 'Leave',
    cookTitle: '🍳 Kitchen', btnCookDone: 'Done',
    wardrobeTitle: '👕 My Wardrobe', wtabHat: '🎩 Hats', wtabShirt: '👕 Tops', wtabPants: '👖 Pants',
    btnWardrobeDone: 'Done',
    sellTitle: '📦 Shipping Bin', sellSubtitle: 'Tap an item to turn it into coins!', btnCloseBin: 'Close',
    logTitle: '📜 Farm Log',
    minimapTitle: '🗺️ Farm Map',
    bedTitle: '🌙 Bedtime!',
    bedHint: 'Do three things first — then you can go to sleep',
    bedStepBrush: 'Brush teeth', bedStepWash: 'Wash face', bedStepCream: 'Face cream',
    bedTipBrush: 'Use your finger as a toothbrush 🪥 — wipe off all the yellow spots!',
    bedTipWash: 'Use your finger as a towel 🧽 — wipe the little smudges away!',
    bedTipCream: 'Use your finger as cream 🧴 — spread it all over the face!',
    bedTipAllDone: 'All done! Now tap “Go to sleep” 😴',
    bedPercent: ' ({n}%)',
    bedNice: 'Great!',
    bedSleep: '😴 Go to sleep',
    bedAgain: '🔄 Again',
    bedLogNight: '🌙 It is dark — brush your teeth and wash your face first',

    hudDay: '📅 Day {n}', weather: { sunny: '☀️ Sunny', cloudy: '⛅ Cloudy', rain: '🌧️ Rainy' },
    prPickup: 'Pick up {item}', prShear: '✂️ Shear wool', prMilk: '🥛 Milk the cow',
    prPetChicken: '🐔 Pet the chick', prPetChick: '🐤 Pet the chick', prPetHen: '🐔 Pet the hen',
    prPetHenLaid: '🐔 Pet the hen (already laid today)',
    henLaidToday: 'This hen already laid her egg today — come back tomorrow 🥚',
    henWillLay: 'She has not laid yet today, wait a bit 🥚',
    prPetSheep: '🐑 Pet the lamb (no wool yet)', prPetCow: '🐄 Pet the cow (no milk yet)',
    prTill: '⛏️ Till the soil', prPlant: '🌱 Plant {seed}', prNoSeed: '🌱 Need seeds (buy at the shop)',
    prWater: '💧 Water it', prHarvest: '🧺 Harvest {crop}', prTree: 'Shake the {fruit} tree',
    prCook: '🍳 Cook', prWardrobe: '👕 Change clothes', prSell: '📦 Sell things', prShop: '🛒 Open the shop',
    prFish: '🎣 Go fishing', prCustomer: 'Sell {item} to {name}',
    prPlace: 'Place "{decor}": [{key}] put down{extra}',
    prFishing: '🎣 Waiting… (press {key} to reel in)', prBite: '❗ Press {key} now!',
    welcome: 'Welcome to Happy Little Farm, {name}! Go find something to do 🌱',
    welcomeBack: 'Welcome back, {name}! Day {day} — let\'s go 🌻',
    loadFailed: 'Could not read the save — starting fresh',
    night: '🌙 It\'s dark — time to sleep…',
    morning: '☀️ Day {day} begins!',
    rainHint: '🌧️ It\'s raining — no need to water today!',
    bought: 'Bought {item}!',
    boughtClothes: 'Bought {name}! Change it in the wardrobe 👕',
    boughtAnimal: '{animal} joined the farm! It will wander around 🎉',
    tooManyAnimals: 'The farm has too many animals!',
    boughtDecor: 'Bought! Walk somewhere nice and press {key} to place it{extra}',
    decorCancel: 'Put it away for now',
    placedDecor: '{decor} looks lovely there! 🎉',
    inWater: 'Can\'t put that in the water 💧',
    noRoomHere: 'No room here — try an open patch of grass',
    tooCrowded: 'Too crowded here — try another spot',
    wearPetHat: 'Your {pet} loves the new hat!',
    equipDone: 'Wearing {name}!',
    cookDone: 'Yummy {dish} is ready!',
    soldBin: 'Sold {item}, +{n} coins!',
    sellHalf: 'Sell half ({k}) 💰{n}',
    soldCustomer: 'The customer is happy! +{n} coins',
    noSuchItem: 'No {item} in your bag',
    gotWool: 'Got a fluffy ball of wool!',
    gotMilk: 'Got fresh milk!',
    noSeed: 'No seeds left — buy some at the shop 🛒',
    harvested: 'Harvested 2 {crop}!',
    castLine: 'Waiting for a bite…',
    caughtBig: 'Wow! You caught a big fish! 🐠',
    caughtSmall: 'You caught a small fish! 🐟',
    reelIn: 'Reeled the line in',
    customerCome: '🔔 {name} is here to shop!',
    customerGone: '{name} waited too long and left…',
    fishEscaped: 'The fish got away… try again!',
    notEnoughCoins: 'Not enough coins',
    logPickup: 'Picked up {item}',
    logTill: 'Tilled a patch of soil',
    logPlant: 'Planted {seed}',
    logWater: 'Watered the crops',
    logShear: 'Sheared some wool',
    logMilk: 'Milked the cow',
    logEgg: '🥚 A hen laid an egg ({laid}/{hen} hens laid today)',
    logWoolBack: '🐑 The wool grew back',
    logMilkBack: '🐄 The cow has milk again',
    logCustomerWant: '🔔 {name} wants to buy {item}',
    logMusicOn: '🎵 Music on', logMusicOff: '🔕 Music off',
    logSoundOn: '🔊 Sound on', logSoundOff: '🔇 Sound off',
    logLang: '🌏 Language switched to English',
    logDecor: 'Placed {decor}',
    cancelHint: ' (press Q to cancel)',
    caught: '🎣 You caught {fish} at the {pond}!',
    logRipple: 'A {size} on the {pond}…',
    prFishAt: '🎣 Fish at the {pond}',
    zooHead: 'You have {n} zoo animals (max {max})',
    zooNote: 'Ornamental · no produce',
    tooManyZoo: 'Too many zoo animals — let them roam first!',
    boughtZoo: '{animal} joined the farm! It will wander around 🎉',
    genderSwitched: 'Now you are a {who}!',
    petSwitched: 'Your pet is now a {pet}!',
    charSection: '👦 Character & Pet',
    tabZoo: '🦁 Zoo Animals',
    tankTitle: '🐠 Big Aquarium', tankCount: '{n}/{max} in the tank',
    tankBagTitle: '🎣 My Catch', tankEmpty: 'The tank is empty — go catch some fish! 🎣',
    bagNoFish: 'No fish yet — try fishing at the pond',
    putIn: 'Put in', takeOut: 'Take out', tankFull2: 'Tank full',
    tankFull: 'The tank is full (max {max})! Take some out first.',
    tankPut: '{fish} is now in the tank 🐠', tankTake: 'Took {fish} out',
    prTank: '🐠 Open the aquarium',
    bookTitle: '📖 Animal Book', bookZoo: '🦁 Zoo', bookSea: '🐟 Aquarium',
    bookOwned: '{n} owned', bookNone: 'Not collected yet',
    bookHint: 'Zoo animals you buy and sea creatures you catch are recorded here',
    caughtTimes: 'Caught {n} times',
    petDuck: 'Duck',
    petGoose: 'Goose',
    animalHen: 'Hen',
    tooManyHens: 'You already have {max} hens — let a chick grow up first',
    shopHenDesc: 'Lays eggs · max {hm}',
    logSoldCustomer: 'Sold {item} to {name}, +{n} coins',
    rotateHint: '🔄 Turn your phone sideways for a bigger view',
    logTitle2: 'Recent events',
    // —— names / multiple saves ——
    nameLabel: '✏️ My Name',
    namePlaceholder: 'Type a name, e.g. Sam',
    saveListHead: '💾 Saves on this computer (tap a name to play)',
    enterName: '✏️ Please write your name first (so we know whose farm it is)',
    nameTooLong: 'That name is too long — 8 letters max',
    maxProfiles: 'Too many saves — delete one before using a new name',
    nameOccupied: 'That name already has a save. Tap it below, or pick another name',
    saveDeleted: 'Deleted "{name}"\'s save',
    saveFailed: 'Could not save — browser storage may be full',
    dayUnit: 'd',
    // —— big cards ——
    gotCard: 'Got {item}!',
    gotCardSub: 'It is in your bag',
    boughtCardSub: 'Added to your bag',
    cookCardSub: 'Yummy — sells for more',
    boughtAnimalSub: 'It will wander around',
    feedCardSub: 'Feed your animals every day',
    petSwitchSub: 'It will follow you everywhere',
    // —— feed / grazing ——
    prTrough: '🌾 Put in feed ({animal}, {n}/{max} left)',
    prTroughEmpty: '🌾 Feed me! {animal} is hungry ({n})',
    feedToday: 'feed today or it runs off',
    runOff: 'it already ran off',
    prHungryAnimal: '🌾 {animal} ran off hungry (put feed in the trough)',
    noFeed: 'No feed in your bag — buy some or harvest corn 🌾',
    feedFull: 'The trough is already full',
    logFeed: 'Put feed in the trough ({n}/{max} left)',
    logFeedCorn: 'Mixed corn into feed ({n}/{max} left)',
    logFeedBack: '🌾 The animals are fed and happy again',
    logStarveOut: '😢 {animal} went 3 days without food and ran out of the pen!',
    logStillHungry: '😢 {animal} has been hungry for {n} days — feed it soon!',
    animalHungry: '{animal} is starving — put feed in the trough 🌾',
    boughtFeed: 'Bought {n} portions of feed!',
    feedShopDesc: '{n} per animal per day · 3 days unfed and they run off',
    feedCount: 'Trough: {n}/{max}',
    saveSummary: 'Day {day} · 💰{coins} · {time}',
    // —— chicken coop: incubator / chicks ——
    prHatch: '🐣 Incubator (eggs {n}/{max})',
    prHatchReady: '🐣 A chick hatched!',
    logHatchPut: 'Put an egg in the incubator 🥚',
    logHatched: '🐣 A chick hatched!',
    logChickGrew: '🐤 The chick grew into a hen!',
    logHensFull: '🐔 You already have {max} hens — the chicks stay small',
    logChicksFull: '🐤 You already have {max} chicks',
    logHens: '🐔 Hens {h}/{hm} · 🐤 Chicks {c}/{cm} · 🌾 Feed {f}',
    noEggForHatch: 'No egg in your bag — go pick one up 🥚',
    hatchFull: 'The incubator is full (max {max}) — wait for a chick',
    hatchWait: '🥚 {n} egg(s) incubating — {d} day(s) until they hatch',
    hatchDays: '🥚 Incubator: {n} eggs · {d} days to go',
    growDays: '🐤 {d} more days to become a hen',
    hatchNone: '🥚 The incubator is empty — put an egg in',
    // —— forest / beehive ——
    prHive: '🍯 Take honey',
    prPickMushroom: 'Pick the mushroom',
    cropInfo: 'about {sec}s to grow',
    logPlantCrop: 'Planted {crop} (about {sec}s to grow)',
    mathTitle: '🧮 Count the Change',
    mathAsk: 'Your customer buys {item} ({price} coins) and pays {paid} coins. How much change do you give back?',
    mathHint: 'Money paid − price of the item = change',
    eachFor: '{n} coins each',
    paidChip: 'pays {n} coins',
    nlPrice: 'price',
    nlPaid: 'paid',
    coinUnit: '{n} coins',
    mathWrong: 'Try again~',
    mathRight: 'Correct! You gave {n} coins change ✅',
    logCustomerLeftMath: '🧮 {name} waited too long and left… (be quicker next time)',
    prCustomerMath: 'Sell {item} to {name} (count the change)',
    needMoreBasket: 'The customer wants {list} — go and collect it first',
    tabVehicles: '🛴 Rides',
    prRide: 'Ride the {v}',
    prPark: 'Park the {v}',
    prRackEmpty: 'Bike rack (buy a ride in the shop first)',
    noVehicle: 'No ride yet — buy one in the shop「🛴 Rides」',
    mounted: 'You are riding the {v}!',
    mountedSub: 'Much faster than walking',
    parked: 'Parked the {v} here',
    boughtVehicle: 'Bought a {v}!',
    boughtVehicleSub: 'Speed ×{n} — walk to the bike rack to ride',
    speedNote: 'Speed ×{n}',
    vehicleShopHead: 'Buy one, then press {key} at the bike rack (near the house) to ride — much faster!',
    logPickMushroom: '🍄 Picked a mushroom in the forest',
    mushroomCardSub: 'Sell it or cook with it',
    prHiveEmpty: '🍯 The honey is not ready yet…',
    logHoney: '🍯 Got honey from the beehive',
    logHoneyReady: '🍯 The beehive has honey again',
    honeyGot: 'Yummy honey! 🍯',
    honeyNotReady: 'The honey is not ready yet 🐝',
    owned: 'Owned ✓', buyFor: '💰{n} Buy',
    animalCount: 'You have {n} animals (max {max})',
    decorCount: '{n} decorations placed · walk somewhere and press {key} to place',
    placeFree: 'Place anywhere', wearing: 'Wearing ✓', wearIt: 'Wear it',
    petSection: '🐾 Pet outfits:', wearPet: 'Put on pet',
    need: 'Needs', cookOne: '🍳 Cook one', noMats: 'Not enough',
    bagEmpty: 'Your bag is empty~', sellOne: 'Sell 1 for 💰{n}', anyFruit: '🍎Any fruit ×{n}',
    saveInfo: 'Day {day} · 💰{coins} · saved {time}',
    switchLang: 'Switch 中文 / English',
    saveTitle2: 'Auto-save', musicTitle: 'Music on/off', muteTitle: 'Sound on/off',
    // —— 设施升级 ——
    expandArea: '🔨 Expansion space',
    upgradeTitle: '🔨 Upgrade a building',
    upgNow: 'Now level {lv}',
    upgNext: 'After upgrading: {cap}',
    upgMax: 'Already the top level 🎉',
    upgBtn: '🔨 Upgrade  💰{n}',
    upgNoCoin: 'Not enough coins — you need {n}',
    upgradeDone: '{fac} is now level {lv}!',
    logUpgrade: '🔨 {fac} upgraded to level {lv}',
    upgPickHint: 'Tap something to see how it is doing now',
    upgMaxShort: 'Max',
    upgBack: 'Back',
    upgradeHint: 'Upgrading makes the area bigger and lets you keep / buy more!',
    lvBadge: '⭐Lv.{lv}',
    pondLocked: 'This pond is still locked — upgrade “Ponds” to fish here',
    // —— 商店 / 厨房 / 水族箱 / 衣橱 的升级入口 ——
    upgFacility: '🔨 Upgrade {fac}',
    shopTierNote: 'Shop level {lv} · more goods unlock when you upgrade',
    wdTierNote: 'Wardrobe level {lv} · unlock more clothes when you upgrade',
    cookTierNote: 'Kitchen level {lv} · unlock more recipes when you upgrade',
    tankTierNote: 'Aquarium level {lv} · unlock more fish space when you upgrade',
    tierLocked: '🔒 Upgrade to unlock',
    // —— 宠物房间 ——
    prPetFood: '🍖 Feed {pet} (💰{n})',
    prPetClean: "🧹 Clean up {pet}'s poop",
    prPetBath: '🛁 Bathe {pet}',
    petNoPet: 'No pet yet — adopt one in the shop (🍖 Pet care)',
    petHaveOne: 'You have {pet} · buying another swaps it',
    petShopHead: 'No pet yet — adopt one!',
    petSwapThis: 'Swap to this one',
    petSwapped: '{pet} is yours now — so cute!',

    petHunger: '🍖 Fullness',
    petClean: '🛁 Clean',
    petPoop: '💩 Poop ×{n}',
    petFeed: '🍖 Feed',
    petBrush: '🧹 Clean up',
    petBath: '🛁 Bathe',
    petAdopt: '🐾 Adopt a pet',
    petAdoptSub: 'Will move into the pet room',
    petAlreadyFull: '{pet} is already full',
    petFed: '{pet} is full 🍖 (cost {n} coins)',
    petCleaned: 'Cleaned up {pet}\'s mess 🧹',
    petBathed: '{pet} smells lovely 🛁',
    petAdoptDone: '{pet} moved into the pet room 🐾',
    petNeedHungry: 'hungry',
    petNeedPoop: 'needs cleanup',
    petNeedDirty: 'needs a bath',
    petAllHappy: 'All your pets are happy 💖',
    petStatusOk: 'Happy 💖',
    // —— 衣帽间 ——
    // —— 🎫 Visitors (viewing fee) ——
    spot_chicken: 'the hens', spot_sheep: 'the lambs', spot_cow: 'the cows',
    spot_zoo: 'the zoo animals', spot_tank: 'the aquarium fish',
    themeZoo: 'animals', themeTank: 'the aquarium',
    logVisitorCome: '🎫 {name} came to visit the farm (wants to see {what})',
    logVisitorPaid: '👀 {name} looked at {spot} and paid {n} coins',
    logVisitorLeave: '🚶 {name} finished the tour — {n} coins in viewing fees',
    visitorSay: '{name}: Your {spot} are lovely!',
    prGreetVisitor: '🙋 Say hi to {name}',
    greetVisitor: '{name}: Thanks for the tour — I will come again! 💖',
    attractHint: '🌟 Your farm can host {n} visitors at once (more animals / zoo animals / fish = more visitors and bigger fees)',
    logAttractMore: '🌟 The farm is livelier! Up to {n} visitors at once',
    // —— 升级面板：建筑现状 ——
    upgStatusHead: '📋 Right now: ',
    upgCapHead: '✅ Current capacity: ',
    stCoop: '{h}/{hm} hens · {c}/{cm} chicks · {e}/{em} egg slots',
    stSheep: '{n}/{max} sheep',
    stCow: '{n}/{max} cows',
    stOrchard: '{n}/{max} fruit trees · buy saplings in the shop',
    stPond: '{n}/{max} ponds unlocked · {k}/{km} fish species',
    stTank: '{n}/{max} fish in the tank · {caught} species collected',
    stKitchen: '{n}/{max} recipes unlocked · {can} cookable right now',
    stWardrobe: 'tier {t}/{tm} clothes unlocked · {avail} items for sale · {n} in your closet',
    stShop: 'tier {t}/{tm} goods unlocked · {n} kinds on sale',
    closetTitle: '👗 My Walk-in Closet',
    closetMirror: '🪞 Mirror',
    wtabHair: '🎀 Hair', wtabDress: '👗 Dresses', wtabShoes: '👟 Shoes',
    tabPetCare: '🐾 Adopt',
    shopSheepDesc: 'Gives wool · up to {max}',
    shopCowDesc: 'Gives milk · up to {max}',
    tooManySheep: 'The sheep pen already has {max} sheep — upgrade it first',
    tooManyCows: 'The barn already has {max} cows — upgrade it first',
    orchardShopHead: 'Orchard {n}/{max} trees (level {lv}) · a sapling is planted right away',
    orchardFull: 'The orchard is full (max {max} trees)',
    saplingSuffix: ' Sapling',
    saplingDesc: '💰{n} · planted in the orchard',
    saplingSub: 'It will bear fruit very soon',
    plantSapling: 'Planted the {fruit} tree! Now {n}/{max} 🌳',
    closetHint: 'Everything you buy is hung up here automatically — tap to wear it',
    closetRail: '🧥 Hanging rail',
    closetShelf: '🎩 Hat shelf',
    closetHair: '🎀 Hair shelf',
    closetDrawer: '👖 Drawer',
    closetShoeRack: '👟 Shoe rack',
    closetDress: '👗 Dress rail',
    closetEmpty: 'Nothing here yet — buy some in the shop',
    dressNote: 'Wearing a dress hides your top and pants',
    boughtToCloset: '{name} is hanging in your closet 👗',
    tryOn: 'Try on',
    // —— 复数商品的找零 ——
    mathAskMulti: 'The customer buys {n} × {item} ({price} coins each) and pays {paid} coins. How much change?',
    mathAskMix: 'The customer buys {a} ({pa} coins) and {b} ({pb} coins), paying {paid} coins. How much change?',
    mathStepTotal: 'Step 1 · total price',
    mathStepMul: '{price} × {n} = ?',
    mathStepAdd: '{pa} + {pb} = ?',
    mathStepChange: 'Step 2 · change',
    mathStepSub: '{paid} − {total} = ?',
    mathExpression: 'Write the number sentence',
    mathNiceMul: 'Great! {price} × {n} = {total} ✅',
    mathNiceAdd: 'Great! {pa} + {pb} = {total} ✅',
    mathNiceSub: 'And {paid} − {total} = {change} ✅',
    mathStep2Now: 'Now work out the change',
  },
};

// 英文名表（中文名直接用原表）
const EN_NAMES = {
  item: { egg: 'Egg', milk: 'Milk', wool: 'Wool', honey: 'Honey', feed: 'Animal Feed',
    mushroom: 'Mushroom', honey_toast: 'Honey Toast', honey_cake: 'Honey Cake',
    mushroom_soup: 'Mushroom Soup', mushroom_omelet: 'Mushroom Omelet',
    veggie_soup: 'Veggie Soup', fruit_pie: 'Fruit Pie', seafood_platter: 'Seafood Platter',
    cherry: 'Cherry', watermelon: 'Watermelon', mango: 'Mango', pineapple: 'Pineapple',
    lemon: 'Lemon', melon: 'Melon', grape: 'Grape', kiwi: 'Kiwi',
    pea: 'Pea Pod', lettuce: 'Lettuce', pepper: 'Bell Pepper', broccoli: 'Broccoli',
    cucumber: 'Cucumber', beet: 'Beet', potato: 'Potato', onion: 'Onion', garlic: 'Garlic',
    pasta: 'Pasta', pancakes: 'Pancakes', doughnut: 'Doughnut', cookie: 'Cookie',
    popcorn: 'Popcorn', pizza: 'Pizza',
    scooter: 'Scooter', bicycle: 'Bicycle', motorcycle: 'Motorcycle',
    carrot: 'Carrot', tomato: 'Tomato', corn: 'Corn',
    apple: 'Apple', orange: 'Orange', pear: 'Pear', peach: 'Peach', strawberry: 'Strawberry',
    fish: 'Small Fish', bigfish: 'Big Fish', fried_egg: 'Fried Egg', salad: 'Fruit Salad',
    fish_grill: 'Grilled Fish', pudding: 'Milk Pudding', fruit_cake: 'Strawberry Cake',
    seed_carrot: 'Carrot Seeds', seed_tomato: 'Tomato Seeds', seed_corn: 'Corn Seeds',
    seed_pea: 'Pea Seeds', seed_lettuce: 'Lettuce Seeds', seed_pepper: 'Pepper Seeds',
    seed_broccoli: 'Broccoli Seeds', seed_cucumber: 'Cucumber Seeds', seed_beet: 'Beet Seeds',
    seed_potato: 'Potato Seeds', seed_onion: 'Onion Seeds', seed_garlic: 'Garlic Seeds',
    shrimp: 'Shrimp', shell: 'Seashell', goldfish: 'Goldfish', crab: 'Crab', squid: 'Squid',
    puffer: 'Pufferfish', octopus: 'Octopus', lobster: 'Lobster', seaturtle: 'Sea Turtle',
    croc: 'Crocodile', seal: 'Seal', dolphin: 'Dolphin', shark: 'Shark', whale: 'Whale' },
  hat: { none: 'No Hat', ragged: 'Torn Hat', straw: 'Straw Hat', bow: 'Hair Bow', cap: 'Baseball Cap',
    beanie: 'Knit Beanie', bandana: 'Pirate Bandana', flower: 'Flower Crown', chef: 'Chef Hat',
    wizard: 'Wizard Hat', frog: 'Frog Hat', crown: 'Little Crown' },
  shirt: { ragged: 'Torn Shirt', stripes: 'Striped Shirt', overalls: 'Blue Overalls', dotty: 'Polka Top',
    hoodie: 'Green Hoodie', dress: 'Pink Dress', sailor: 'Sailor Top', vest: 'Little Vest',
    star: 'Star T-Shirt', pumpkin: 'Pumpkin Suit', rainbow: 'Rainbow Tee' },
  pants: { ragged: 'Torn Pants', brown: 'Work Pants', jeans: 'Blue Jeans', shorts: 'Red Shorts',
    green: 'Green Pants', orange: 'Orange Shorts', white: 'White Pants', pink: 'Pink Pants',
    purple: 'Purple Pants', stripepants: 'Striped Pants', polka: 'Polka Pants' },
  petHat: { bow: 'Pet Bow', straw: 'Pet Straw Hat', cap: 'Pet Cap', flower: 'Pet Flower Crown', crown: 'Pet Crown' },
  animal: { chicken: 'Hen', sheep: 'Lamb', cow: 'Calf' },
  decor: { rock: 'Big Rock', mushroom: 'Mushroom', fence: 'Small Fence', flowerbed: 'Flower Bed',
    lamp: 'Lamp Post', bench: 'Bench', scarecrow: 'Scarecrow', blossom: 'Cherry Tree',
    christmas: 'Christmas Tree', fountain: 'Fountain', windmill: 'Windmill' },
  crop: { carrot: 'Carrot', tomato: 'Tomato', corn: 'Corn' },
};

// 取名字：cat = item/hat/shirt/pants/petHat/animal/decor/crop
function nm(cat, key) {
  if (cat === 'zoo') { const z = ZOO_MAP[key]; if (z) return lang === 'en' ? z.nameEn : z.name; return key; }
  if (cat === 'vehicle') { const v = VEHICLE_MAP[key]; return v ? (lang === 'en' ? v.nameEn : v.name) : key; }
  if (lang === 'en' && EN_NAMES[cat] && EN_NAMES[cat][key]) return EN_NAMES[cat][key];
  switch (cat) {
    case 'item': case 'crop': return (ITEMS[key] && ITEMS[key].name) || key;
    case 'petHat': return (PET_HATS[key] && PET_HATS[key].name) || key;
    case 'animal': { const a = ANIMAL_SHOP.find(v => v.type === key); return a ? a.name : key; }
    case 'decor': { const d = DECOR_SHOP.find(v => v.id === key); return d ? d.name : key; }
    default: return (OUTFITS[cat] && OUTFITS[cat][key] && OUTFITS[cat][key].name) || key;
  }
}
// translate 的小别名：render() 里有一个局部变量 `const t = G.t`（时间），
// 会把全局的 t() 翻译函数遮住，所以 render 内部要用文字时走这个别名。
function TXT(key, p) { return t(key, p); }
// 翻译：t('key', {占位符: 值})
function t(key, p) {
  const tbl = STR[lang] || STR.zh;
  let s = tbl[key] !== undefined ? tbl[key] : (STR.zh[key] !== undefined ? STR.zh[key] : key);
  if (p && typeof s === 'string') {
    // 英文单复数：文案里写 day{s}，数字为 1 时 {s} 变空（1 day），否则变 s（2 days）
    if (s.indexOf('{s}') >= 0) s = s.split('{s}').join(p.n === 1 ? '' : 's');
    for (const k in p) s = s.split('{' + k + '}').join(p[k]);
  }
  return s;
}
function weatherText() { const w = STR[lang].weather || STR.zh.weather; return w[G.weather] || w.sunny; }

// ---------------- 动画 emoji 资源（Noto Emoji Animation） ----------------
// 资源来源：https://googlefonts.github.io/noto-emoji-animation/
//
// 【本项目的做法：资源全部放在本地 assets/emoji/】
//   官网素材已经提前下载到 assets/emoji/<codepoint>.webp（动图）和 <codepoint>.png（静态图），
//   取图时**本地优先**，本地没有才回落到远端 gstatic。这样做的三个原因：
//     ① 同源 —— canvas 画出来的图不会被「污染」，getImageData 抽样检测、ImageDecoder 拆帧都能正常工作；
//     ② 没有跨域请求 —— 不发跨域请求、不依赖 CORS 响应头，断网 / 内网部署也不会白图；
//     ③ 路径不会错 —— 相对路径跟着站点走，换域名、加子目录（/farm/）都不会失效。
//   官网的 data/api.json 也只是用来判断「有没有动画」，现在这份清单已经内嵌 + 以本地文件为准，
//   所以启动时不再需要联网拉清单。
const EMOJI_BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest/';
const EMOJI_LOCAL_DIR = 'assets/emoji/';
const emojiCache = {};     // cp -> { img, ok, kind }
let notoAnimSet = null;          // 兼容保留：以前从官网 api.json 拉的清单（现在不用了）
let notoAnimState = 'ready';     // 现在以本地文件 + 内嵌表为准，启动即 ready
function notoNorm(cp) { return String(cp || '').toLowerCase().replace(/[_-]?fe0f/g, '').replace(/[-_]/g, ''); }

// 本地有没有这个 emoji 的动图？
// 下载脚本只给「官网确实做了动画」的 70 个存了 .webp，正好等于 NOTO_HAS_ANIM 这份内嵌清单，
// 而 NOTO_NO_ANIM（18 个：大象、长颈鹿、斑马、考拉、蜂蜜、毛线、鸡蛋、牛奶、饲料…）只有静态 png。
// 所以「有没有动画」不看网络、不发请求，启动瞬间就有答案。
function emojiLocalAnim(cp) {
  const k = notoNorm(cp);
  if (NOTO_NO_ANIM[k]) return false;        // 本地就没下动图，别去请求
  return true;
}
// 「这个 emoji 到底有没有动画」——本地清单是唯一权威，不再依赖网络
function notoHasAnim(cp) {
  const k = notoNorm(cp);
  if (NOTO_HAS_ANIM[k]) return true;
  if (NOTO_NO_ANIM[k]) return false;
  return null;                              // 表里没有的（以后新增的）交给加载流程实测
}

// 三种格式的地址，都**本地优先**：
//   .webp —— 动画版（第一优先）
//   .gif  —— 动图（第二选择，本地没存，只有远端兜底）
//   .png  —— 静态图（兜底：官方有些 emoji 只有静态图）
function emojiLocalUrl(cp, ext) { return EMOJI_LOCAL_DIR + cp + '.' + ext; }
function emojiRemoteUrl(cp, file) { return EMOJI_BASE + cp + '/' + file; }
function emojiWebpUrl(cp) { return emojiLocalAnim(cp) ? emojiLocalUrl(cp, 'webp') : emojiRemoteUrl(cp, '512.webp'); }
function emojiAnimUrl(cp) { return emojiLocalAnim(cp) ? emojiLocalUrl(cp, 'webp') : emojiRemoteUrl(cp, '512.gif'); }
function emojiPngUrl(cp) { return emojiLocalUrl(cp, 'png'); }
// 远端的备用地址（本地文件缺失 / 部署时忘了带上 assets 时用）
function emojiWebpFallback(cp) { return emojiRemoteUrl(cp, '512.webp'); }
function emojiPngFallback(cp) { return emojiRemoteUrl(cp, '512.png'); }

// 判断一张图「画出来是不是真的有东西」。
// 有些素材（海豚 1f42c、鲨鱼 1f988 的 512.gif）能加载、尺寸也正常，但每一帧都是全透明的，
// 直接画就是空白；另外还有几种（金鱼 / 斑马 / 长颈鹿 / 虾 / 贝壳 / 鱿鱼）根本没有 gif，
// 服务器返回 404 的 HTML，onload 也会触发，画的时候直接抛错 —— 都不能用。
function emojiDrawable(im) {
  if (!im) return false;
  if (!im.naturalWidth || !im.naturalHeight) return false;      // 404 的 HTML 页面
  try {
    const c = document.createElement('canvas');
    c.width = 48; c.height = 48;
    const x = c.getContext('2d');
    if (!x) return true;                                        // 环境不支持检测，就先当它能用
    x.clearRect(0, 0, 48, 48);
    x.drawImage(im, 0, 0, 48, 48);
    return canvasHasPixels(x, 48, 48, 20);                      // 画出来有东西才算能用
  } catch (e) {
    return false;                                               // 图坏了 / 跨域不让读
  }
}
// 判断一块画布上有没有「看得见的像素」（通用的空图检测）
function canvasHasPixels(x, w, h, thresh) {
  try {
    const d = x.getImageData(0, 0, w, h).data;
    const th = thresh || 20;
    for (let i = 3; i < d.length; i += 4) if (d[i] > th) return true;
  } catch (e) { return true; }
  return false;
}

// ---------------- 动画 emoji：自己解 GIF 的每一帧 ----------------
// 直接把 <img src="xxx.gif"> 画到 canvas 上，浏览器**不会**推进 GIF 的动画帧
// （画出来永远是第一帧，看着就是「一张图在平移」）。
// 所以这里用 ImageDecoder 把 GIF 拆成一帧一帧的小画布，再按时间自己换帧，
// 这样任何浏览器都能看到真的动效，而且节奏可以和游戏时间对齐。
const EMOJI_ANIM_MAX = 24;      // 最多同时缓存多少套动画（36 帧/套，约 55MB 上限）
                                // 动物园最多 30 种同时在地图上，24 套够用；
                                // 被淘汰的再画到时会自动重新解码（见 ensureEmojiAnim）
const EMOJI_ANIM_PX = 128;      // 每一帧缩到 128px，省内存（游戏里最大也就画 ~70px）
const EMOJI_ANIM_FRAMES = 36;   // 每套动画最多取 36 帧（尽量贴近原动图的流畅度）
const emojiAnims = {};          // cp -> { frames:[canvas], delay:[ms], total }
const emojiNoAnim = {};         // cp -> 1：确认没有动画 / 解码失败过，别再反复重试
const animRetryAt = {};         // cp -> 上次尝试解码的时间（给重新解码做个节流）
const ANIM_PARALLEL = 4;        // 同时最多解 4 套动画（一次几十个请求容易有个别加载失败）
let animRunning = 0;
const animWaiters = [];
function animSlot(fn) {
  if (animRunning < ANIM_PARALLEL) { animRunning++; fn(); return; }
  animWaiters.push(fn);
}
function animSlotDone() {
  animRunning = Math.max(0, animRunning - 1);
  const next = animWaiters.shift();
  if (next) { animRunning++; next(); }
}
const ANIM_DEBUG = [];          // 解码过程的诊断信息（排查用）
// 官方没有动画素材的 emoji（查过官网 881 个清单 + 实测 webp/gif 都是 404）
// 这些在画面里用「呼吸缩放」让它活起来，看起来就不呆了
// 官方动画清单里「我们有用到、且有动画」的 emoji（内嵌一份，启动瞬间就能判断，
// 不用等网络返回的清单；也因此不会对没有动画的 emoji 发出注定 404 的请求）
const NOTO_HAS_ANIM = {
  '1f331': 1, '1f33d': 1, '1f344': 1, '1f345': 1, '1f347': 1, '1f348': 1,
  '1f349': 1, '1f34a': 1, '1f34b': 1, '1f34d': 1, '1f34e': 1, '1f350': 1,
  '1f352': 1, '1f353': 1, '1f355': 1, '1f35d': 1, '1f35e': 1, '1f362': 1,
  '1f369': 1, '1f36a': 1, '1f373': 1, '1f37f': 1, '1f407': 1, '1f40a': 1,
  '1f40c': 1, '1f40d': 1, '1f412': 1, '1f419': 1, '1f41d': 1, '1f41f': 1,
  '1f421': 1, '1f422': 1, '1f427': 1, '1f42c': 1, '1f433': 1, '1f438': 1,
  '1f43b': 1, '1f43c': 1, '1f43f': 1, '1f952': 1, '1f954': 1, '1f955': 1,
  '1f957': 1, '1f95d': 1, '1f95e': 1, '1f966': 1, '1f967': 1, '1f96c': 1,
  '1f96d': 1, '1f980': 1, '1f981': 1, '1f988': 1, '1f98a': 1, '1f98b': 1,
  '1f98e': 1, '1f994': 1, '1f998': 1, '1f99a': 1, '1f99d': 1, '1f99e': 1,
  '1f9a5': 1, '1f9a9': 1, '1f9ad': 1, '1f9c4': 1, '1f9c5': 1, '1fabc': 1,
  '1fad1': 1, '1fadb': 1, '1fadc': 1, '2b50': 1,
};
// 明确「官方没有动画」的 emoji（发了也只会 404，直接跳过）
const NOTO_NO_ANIM = {
  '1f33e': 1, '1f351': 1, '1f364': 1, '1f36e': 1, '1f36f': 1, '1f370': 1,
  '1f372': 1, '1f418': 1, '1f428': 1, '1f958': 1, '1f95a': 1, '1f95b': 1,
  '1f963': 1, '1f992': 1, '1f993': 1, '1f999': 1, '1f9c1': 1, '1f9f6': 1,
};

// 「没有动画素材」的 emoji：官方没做动画，或者这个浏览器解不出来（emojiNoAnim）。
// 判据全部收在这里一处，不另外维护硬编码名单：
//   · 官方没做动画的 18 个（NOTO_NO_ANIM：大象、长颈鹿、斑马、考拉、羊驼、蜂蜜、毛线…）
//   · 实测解不出动画的（emojiNoAnim：单帧 / 空图 / file:// 下取不到）
// 这些就用「静态图 + 呼吸效果」，不再傻等动画。
// 注意：只有**真的没有帧**时才算「需要呼吸」，一旦解码成功就自动切回动画。
function needsBreath(cp) {
  if (!cp) return false;
  if (emojiFrameReady(cp)) return false;                 // 有逐帧动画 → 不需要呼吸
  if (emojiNoAnim[cp]) return true;                      // 试过，解不出来
  return notoHasAnim(cp) === false;                      // 官方本来就没有动画
}
// 每个物种一个固定相位（同一个 emoji 的动画在所有实例上同步）
function cpPhase(cp) {
  let h = 0;
  const s = String(cp || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 6283;
  return h / 1000;
}
// 呼吸缩放系数（1.5 秒一个来回，幅度 ±6%）
function breathScale(t, phase) {
  return 1 + Math.sin((t || 0) * 4.2 + (phase || 0)) * 0.06;
}
let emojiAnimQueue = [];
function emojiFrameReady(cp) {
  const a = emojiAnims[cp];
  return !!(a && a.frames && a.frames.length > 1);
}
// 取这一时刻该显示第几帧
// speed 是**播放倍率**：0.5 = 半速（水族箱里的生物），1 = 原速（地图上的动物、商店）。
// 只按 (时刻 - startedAt) * speed 算动画进度，所以放慢之后仍然是往前播、不会倒退或定格。
function emojiFrameIndex(cp, tSec, speed) {
  const a = emojiAnims[cp];
  if (!a || !a.frames || a.frames.length < 2) return -1;
  const t0 = Number.isFinite(a.startedAt) ? a.startedAt : 0;
  const sp = speed || 1;
  let ms = (((tSec - t0) * sp * 1000) % a.total + a.total) % a.total;
  for (let i = 0; i < a.frames.length; i++) {
    if (ms < a.delay[i]) return i;
    ms -= a.delay[i];
  }
  return a.frames.length - 1;
}
// 画一帧动画（没有动画就返回 false，让调用方退回静态图）
function drawEmojiFrame(ctx, cp, cx, cy, size, tSec, speed) {
  const i = emojiFrameIndex(cp, tSec, speed);
  if (i < 0) return false;
  const a = emojiAnims[cp];
  ctx.drawImage(a.frames[i], cx - size / 2, cy - size / 2, size, size);
  return true;
}
// 画一只 emoji 动物 / 生物：优先「自己逐帧画」（ImageDecoder 拆好的帧，最可靠），
// 帧还没准备好时才直接画原动图，都不行就返回 false（调用方再叠呼吸效果）。
// 返回 true 表示已经由动画画完了。
//
// 为什么把「逐帧画」放在第一位：实测（Chrome）把动图 <img> 画到 canvas 上，
// 浏览器**只交第一帧**——图在页面上照样会动，但 canvas 上拿到的是定格画面，
// 这就是「商店里的动物会动、地图上的动物却像贴纸」的真正原因。
// 所以这里的顺序是：有帧就用帧，没帧先拿原图顶着，帧一到就自动切过去。
// cp 拿不到时（老调用点）退回 rec.cp，避免又出现「找不到帧」。
function drawEmojiAnimated(ctx, cp, cx, cy, size, tSec, rec, speed) {
  const key = cp || (rec && rec.cp);
  if (emojiFrameReady(key)) {
    if (drawEmojiFrame(ctx, key, cx, cy, size, tSec, speed)) return true;
  } else {
    ensureEmojiAnim(key, rec);                    // 帧被缓存淘汰掉了 → 重新解一次
  }
  if (rec && rec.raw && rawAnimState[key] !== 'frames') {
    ctx.drawImage(rec.raw, cx - size / 2, cy - size / 2, size, size);
    return true;
  }
  return false;
}
// 缓存满了会把最早解好的那几套动画丢掉（省内存）。被丢掉之后再画到时，
// 这里补一次解码，让它自己「长回来」，不至于永远停在原图第一帧。
// 另外：官方本来就没有动画的（静态 png）和解不出来的，记在 emojiNoAnim 里，别再反复重试；
// 即使还在重试中，也用 animRetryAt 限一下频率（1.5 秒一次），别每帧都开一路。
function ensureEmojiAnim(cp, rec) {
  if (!cp || emojiAnims[cp]) return;             // 有记录（正在解 / 已解好）就别重复开工
  if (emojiNoAnim[cp]) return;                   // 官方没做动画 / 试过解不出来 → 不再尝试
  if (notoHasAnim(cp) === false) return;         // 静态图，不该走解码
  const now = Date.now();
  if (now - (animRetryAt[cp] || 0) < 1500) return;   // 刚试过，先歇一下
  animRetryAt[cp] = now;
  const url = (rec && (rec.animUrl || rec.webpUrl)) || emojiWebpUrl(cp);
  if (url) decodeEmojiAnim(cp, url, null);
}
const rawAnimState = {};        // cp -> 'raw'（直接画原动图）| 'frames'（逐帧画）
const rawCheckPending = {};     // 正在检测的 cp（避免重复检测）

// 有些环境（例如无头浏览器）把动图画到 canvas 上是不会动的一帧。
// 这里用一张很小的离屏画布抽样两次：画面有变化 → 浏览器会自动播放，
// 地图上就直接画原动图；没有变化 → 标记成要逐帧画。
// 另外：只要逐帧缓存已经就绪，就一律按 'frames' 处理（逐帧画更可靠），
// 免得抽样恰好采到两帧一样的画面而误判成「原生会动」。
function detectRawAnim(cp, raw) {
  if (!raw || typeof cp !== 'string') return;
  if (rawAnimState[cp] || rawCheckPending[cp]) return;
  rawCheckPending[cp] = true;
  const N = 24;
  setTimeout(function () {
    if (rawAnimState[cp]) return;
    let c1, c2;
    try {
      const c = document.createElement('canvas');
      c.width = c.height = N;
      const x = c.getContext('2d');
      x.clearRect(0, 0, N, N);
      x.drawImage(raw, 0, 0, N, N);
      c1 = x.getImageData(0, 0, N, N).data;
      setTimeout(function () {
        try {
          x.clearRect(0, 0, N, N);
          x.drawImage(raw, 0, 0, N, N);
          c2 = x.getImageData(0, 0, N, N).data;
          let diff = 0;
          for (let i = 0; i < c1.length; i += 4) {
            if (c1[i] !== c2[i] || c1[i + 1] !== c2[i + 1] || c1[i + 2] !== c2[i + 2] || c1[i + 3] !== c2[i + 3]) diff++;
          }
          rawAnimState[cp] = (diff > 0 && !emojiFrameReady(cp)) ? 'raw' : 'frames';
        } catch (e) { rawAnimState[cp] = 'frames'; }
      }, 280);
    } catch (e) { rawAnimState[cp] = 'frames'; }
  }, 160);
}
// 把 GIF / webp 解码成帧（浏览器不支持 / 解码失败就静默放弃，继续用静态图）
// 注意：同一个 emoji 只允许有一路解码在跑 —— 否则先成功的那一路
// 可能被后失败的那一路删掉，动物就会卡在静态图（只播第一帧）不动。
function decodeEmojiAnim(cp, url, cb, attempt, force) {
  if (emojiAnims[cp]) {                                        // 已经解过 / 正在解
    const a = emojiAnims[cp];
    if (a.frames && a.frames.length > 1) { if (cb) cb(true); return; }
    if (cb) (a.cbs = a.cbs || []).push(cb);                    // 排队等这一路的结果
    return;
  }
  if (typeof ImageDecoder === 'undefined' || typeof fetch === 'undefined') { if (cb) cb(false); return; }
  const N = attempt || 0;
  if (!force && emojiNoAnim[cp]) { if (cb) cb(false); return; }  // 试过解不出来 → 别反复刷请求
  const cbList = cb ? [cb] : [];                                // 必须在下面赋值之前定义
  const a0 = { frames: [], delay: [], total: 0, pending: true, cbs: cbList, fetching: true, finishedAt: 0 };
  emojiAnims[cp] = a0;
  // 万一这次没解出来（网络慢 / 解析失败），隔一小会儿再试（2s → 4s → 8s → 16s）。
  // 不重试的话，这只动物就会一直停在静态图上不动。
  // ⚠️ 关键：**不能**在解码还在进行时就把记录删掉重来 —— 否则解码完成时会写回一个
  //    undefined 的记录（报 "Cannot set properties of undefined (setting 'src')"），
  //    帧缓存直接丢掉，动物就一直只有一帧。所以这里只在「确实卡住了」时才重来。
  if (N + 1 <= 4) {
    setTimeout(function () {
      const a = emojiAnims[cp];
      if (a !== a0) return;                                    // 已经被换掉 / 删掉了
      if (a.frames && a.frames.length > 1) return;             // 已经成功了
      if (a.fetching) { decodeEmojiAnim(cp, url, null, N + 1, true); return; }   // 还在解，别打断它
      if (a.finishedAt) return;                                // 已经有确定结果（单帧 / 空图 / 解码失败）
      delete emojiAnims[cp];                                   // 卡在半路 → 清掉重来
      decodeEmojiAnim(cp, url, null, N + 1, true);
    }, 1000 * Math.pow(2, N + 1));
  }
  const finishCb = (ok) => {
    const list = cbList.slice();
    cbList.length = 0;
    const a = emojiAnims[cp];
    if (a) { a.cbs = []; a.pending = false; }
    list.forEach(f => { try { f(ok); } catch (e) {} });
  };
  // 注意顺序：先把回调叫醒，再删掉占位记录（反过来的话回调就永远收不到消息了）
  const fail = (why) => {
    ANIM_DEBUG.push(cp + ':fail(' + (why || '?') + ')');
    a0.fetching = false; a0.finishedAt = Date.now();
    // 记住「这个 emoji 解不出动画」：不然映射到它的动物会每帧都重试一遍，
    // 白白刷一堆注定失败的请求（静态 png 送进 ImageDecoder 就会这样）。
    if (N + 1 > 4 || why === 'single' || why === 'blank' || String(why).indexOf('ctor') === 0) emojiNoAnim[cp] = 1;
    finishCb(false);
    if (emojiAnims[cp] === a0) delete emojiAnims[cp];
  };
  animSlot(() => fetch(url).then(r => r.arrayBuffer()).then(buf => {
    let dec;
    try { dec = new ImageDecoder({ data: buf, type: (rec_mime(url)) }); }
    catch (e) { fail('ctor:' + e.message); return; }
    // 必须等 tracks.ready，否则 frameCount 还是 0
    return dec.tracks.ready.then(() => {
      const track = dec.tracks.selectedTrack || dec.tracks[0];
      const count = (track && track.frameCount) || 0;
      ANIM_DEBUG.push(cp + ':frames=' + count);
      if (count < 2) { fail('single'); return; }                // 单帧：不需要做动画
      // 有些素材第 0 帧是全透明的（例如海豚的 webp），所以要抽几帧一起判断
      const probeIdx = [0, Math.floor(count / 3), Math.floor(count * 2 / 3), count - 1];
      let anyPixels = false;
      const total = Math.min(count, EMOJI_ANIM_FRAMES);        // 限制帧数，控制内存
      const shots = [];
      const off = document.createElement('canvas');
      off.width = EMOJI_ANIM_PX; off.height = EMOJI_ANIM_PX;
      const octx = off.getContext('2d');
      const step = () => {
        if (shots.length >= total) { finish(shots); return; }
        const idx = Math.floor(shots.length * count / total);
        dec.decode({ frameIndex: idx }).then(r2 => {
          const vf = r2.image;
          octx.clearRect(0, 0, EMOJI_ANIM_PX, EMOJI_ANIM_PX);
          octx.drawImage(vf, 0, 0, EMOJI_ANIM_PX, EMOJI_ANIM_PX);
          const cv = document.createElement('canvas');
          cv.width = cv.height = EMOJI_ANIM_PX;
          cv.getContext('2d').drawImage(off, 0, 0);
          if (probeIdx.indexOf(idx) >= 0 && canvasHasPixels(octx, EMOJI_ANIM_PX, EMOJI_ANIM_PX, 16)) {
            anyPixels = true;                                   // 至少有一帧是有内容的
          }
          // duration 单位是微秒，转成毫秒（太短就给个下限，别闪得太快）
          shots.push({ cv: cv, dur: Math.max(40, (vf.duration || 0) / 1000) });
          if (vf.close) vf.close();
          step();
        }).catch((e) => { ANIM_DEBUG.push(cp + ':decode err ' + e.message); finish(shots); });
      };
      const finish = (list) => {
        a0.fetching = false; a0.finishedAt = Date.now();
        if (!list || list.length < 2) { fail('few:' + (list ? list.length : 0)); return; }
        if (!anyPixels) { fail('blank'); return; }               // 每帧都是空的：这种素材做不了动画
        const a = emojiAnims[cp];
        if (!a) return;                                          // 记录已被丢弃（超出缓存上限 / 重试）→ 老实放弃
        a.src = url; a.frames = list.map(x => x.cv);
        a.delay = list.map(x => x.dur);
        a.total = a.delay.reduce((x, y) => x + y, 0) || 1200;
        // 记下解好的时刻：动画相位从现在开始算，保证解出来的瞬间就在动
        a.startedAt = (typeof G !== 'undefined' && G && Number.isFinite(G.t)) ? G.t : 0;
        emojiAnimQueue.push(cp);
        finishCb(true);
        // 超出上限就把最早解的那几套丢掉，避免越积越多占内存
        while (emojiAnimQueue.length > EMOJI_ANIM_MAX) {
          const old = emojiAnimQueue.shift();
          if (old && old !== cp && emojiAnims[old]) delete emojiAnims[old];
        }
      };
      step();
    });
  }).catch((e) => fail('fetch:' + e.message)).then(animSlotDone));
}
// 根据扩展名给出 mime（webp / gif）
function rec_mime(url) { return /[.]webp(\?|$)/.test(url) ? 'image/webp' : 'image/gif'; }

// 加载 emoji 图：先加载静态 PNG 保证「立刻能用」，再尝试动图并把动图拆成帧做真动画。
// 地址本地优先（assets/emoji/），本地拿不到才回落远端 gstatic。
function loadEmoji(cp) {
  if (!cp) return null;
  let rec = emojiCache[cp];
  if (rec) return rec;
  // ⚠️ cp 必须记在记录上：地图上画动物时（drawZoo）用的是 rec.cp 去找动画帧，
  //    少了这个字段，逐帧动画永远找不到帧，动物就只能是一张不动的图。
  rec = emojiCache[cp] = { cp: cp, img: null, ok: false, kind: '' };
  if (typeof Image === 'undefined' || typeof document === 'undefined') return rec;
  // 本地是同源资源，不需要（也不该）带 crossOrigin：带上的话图会被当成跨域 CORS 图，
  // 某些浏览器画到 canvas 上只出第一帧、读像素还会抛安全错误。
  // 只有当本地文件缺失、要回落远端时才需要 CORS 模式。
  const make = (remote) => {
    const im = new Image();
    if (remote) { try { im.crossOrigin = 'anonymous'; } catch (e) {} }
    return im;
  };
  rec.pngUrl = emojiPngUrl(cp);                                            // assets/emoji/<cp>.png
  rec.webpUrl = emojiWebpUrl(cp);                                          // 本地 .webp，没有就是远端 .webp
  rec.gifUrl = emojiAnimUrl(cp);
  rec.hasAnim = notoHasAnim(cp) !== false;
  // ① 先用静态 PNG 顶上（本地一定有），保证任何时刻都有图可画
  const png = make(!/^assets\//.test(rec.pngUrl));
  png.onload = () => {
    rec.pngOk = true;
    if (!rec.ok) { rec.img = png; rec.ok = true; rec.kind = 'png'; }
  };
  // 本地 png 万一没部署上，退回远端 png（地图上画动画的图不能是碎图）
  png.onerror = () => {
    rec.pngOk = false;
    const fb = emojiPngFallback(cp);
    if (png.src.indexOf(fb) < 0) { const im2 = make(true); im2.onload = png.onload; im2.src = fb; rec.pngImg = im2; }
  };
  rec.pngImg = png;
  png.src = rec.pngUrl;
  // ② 尝试动图：本地 .webp → 远端 .webp → 远端 .gif（本地没存 gif）。
  //    注意：这里**不能**只测第 0 帧 —— 海豚、鲨鱼的动图首帧是全透明的，
  //    只看首帧会把它们误判成坏图。改成让解析器解码多帧后再校验。
  const steps = [];
  if (rec.hasAnim) {
    if (/^assets\//.test(rec.webpUrl)) {
      steps.push({ url: rec.webpUrl, kind: 'webp' });
      steps.push({ url: emojiWebpFallback(cp), kind: 'webp' });   // 本地缺文件时的远端兜底
    } else {
      steps.push({ url: rec.webpUrl, kind: 'webp' });
    }
    steps.push({ url: emojiRemoteUrl(cp, '512.gif'), kind: 'gif' });
  }
  let lastUrl = '';
  const useStatic = () => { rec.animUrl = rec.pngUrl; rec.kind = rec.img === rec.pngImg ? 'png' : rec.kind; rec.animLocal = true; };
  // 尝试一路动图。三种结果都覆盖：① 解码出多帧（最好）；② 只能画第一帧（file:// 打不开时）；
  // ③ 完全不能用（本地文件缺失、404）→ 自动跳下一种格式，最后退回静态 png。
  const tryAnim = (url, kind, next) => {
    if (lastUrl === url) { next(); return; }      // 同一个地址别试两次
    lastUrl = url;
    rec.animUrl = url;                            // DOM 立刻用动图地址（浏览器自己播）
    const local = /^assets\//.test(url);
    const raw = make(!local);                     // 本地资源同源，不需要 CORS 模式
    let decoded = null;                           // null=还没结果 | true=有多帧 | false=解不了
    const settle = () => {
      if (decoded === null) return;               // 等 <img> 和解析器两边都有结果
      if (decoded) {                              // ① 有逐帧动画：这才算真的能用
        rec.animUrl = url; rec.animLocal = local;
        if (kind === 'webp') rec.webpOk = true; else rec.gifOk = true;
        if (!rec.ok || rec.img === rec.pngImg) {
          rec.img = (emojiAnims[cp] && emojiAnims[cp].frames[0]) || raw;
          rec.kind = kind;
        }
        rec.domUrl = url;
        return;                                   // 成功，不再往下试
      }
      // 解析不出多帧：
      if (rec.raw === raw && rec.ok && rec.img === raw) return;   // ② 至少 <img> 能画 → 先用它顶着（定格）
      if (rec.raw === raw) rec.raw = null;
      if (rec.img === raw) { rec.img = null; rec.ok = !!(rec.pngImg && rec.pngOk) || false; }
      rec.animUrl = rec.pngUrl;
      // 官方本来就没有动画的（静态 png 送进 ImageDecoder 会报
      // "Failed to retrieve track metadata."），试一次就够了，别再往下换格式、也别再重试
      if (notoHasAnim(cp) === false || emojiNoAnim[cp]) { useStatic(); return; }
      next();                                     // ③ 这一路不行，试下一种格式
    };
    raw.onload = () => {
      if (!emojiDrawable(raw)) { settle(); return; }   // 首帧全透明的（海豚等）交给逐帧画判断
      rec.raw = raw;
      if (rec.img === rec.pngImg || !rec.ok) { rec.img = raw; rec.ok = true; rec.kind = kind; }
      detectRawAnim(cp, raw);                     // 抽样确认浏览器会不会原生推进帧
      settle();
    };
    raw.onerror = () => { if (rec.animUrl === url) rec.animUrl = rec.pngUrl; };
    raw.src = url;
    decodeEmojiAnim(cp, url, function (ok) {
      decoded = !!ok;
      settle();
    });
  };
  // 依次尝试；每一路自己决定成功（不调 next）还是失败（调 next）
  (function step() {
    if (emojiFrameReady(cp)) return;              // 已经有逐帧动画了，不用再试
    const s = steps.shift();
    if (!s) { if (!rec.animUrl) useStatic(); return; }   // 都没有 → 静态图（调用方会叠呼吸）
    tryAnim(s.url, s.kind, step);
  })();
  return rec;
}
// DOM 里显示某个 emoji 图时该用哪个地址：
// 有动图就用动图（本地 .webp 优先；浏览器会自己播），否则用静态 png
function emojiSrcFor(rec) {
  if (!rec) return '';
  if (rec.animUrl) return rec.animUrl;      // 本地 .webp / 远端 .webp / 远端 .gif
  return rec.pngUrl || '';
}
// DOM 里用 <img> 显示 emoji（列表用）。
// 地址走 emojiSrcFor()：有动画的用动图（本地 webp），没有动画的用 png，
// 并挂了 onerror —— 万一还是加载失败就当场退回 PNG，绝不显示成「碎图」
function emojiImgHTML(cp, emoji, cls) {
  cls = cls || 'emoji-img';
  if (!cp) return emoji;
  const rec = loadEmoji(cp);
  const src = emojiSrcFor(rec);
  if (!src) return emoji;
  const fallback = rec.pngUrl || emojiPngUrl(cp);
  // 官方没有动画素材的（蜂蜜/毛线/鸡蛋/牛奶/饲料…）加个呼吸动效，看着就不呆了
  if (needsBreath(cp)) cls += ' breathe';
  // 不用 loading="lazy"：这些图很小，而且物品栏/列表一旦被判定「暂时不可见」
  // 懒加载就会让图标空着不显示
  return '<img class="' + cls + '" src="' + src + '" alt="' + emoji + '" draggable="false"' +
    ' onerror="this.onerror=null;this.src=\'' + fallback + '\'">';
}

// ---------------- 动物园观赏动物（只看不产出，会在农场里散步） ----------------
const ZOO_SHOP = [
  { type: 'giraffe',  cp: '1f992', name: '长颈鹿', icon: '🦒', nameEn: 'Giraffe',   price: 1600, size: 76, v: 'low',    p: 0.8 },
  { type: 'elephant', cp: '1f418', name: '大象', icon: '🐘',   nameEn: 'Elephant',  price: 1800, size: 74, v: 'low',    p: 0.7 },
  { type: 'zebra',    cp: '1f993', name: '斑马', icon: '🦓',   nameEn: 'Zebra',     price: 1400, size: 68, v: 'mid',    p: 1 },
  { type: 'lion',     cp: '1f981', name: '狮子', icon: '🦁',   nameEn: 'Lion',      price: 1500, size: 66, v: 'growl',  p: 0.9 },
  { type: 'bear',     cp: '1f43b', name: '小熊', icon: '🐻',   nameEn: 'Bear',      price: 1100, size: 66, v: 'growl',  p: 1.1 },
  { type: 'panda',    cp: '1f43c', name: '熊猫', icon: '🐼',   nameEn: 'Panda',     price: 1200, size: 64, v: 'mid',    p: 1.1 },
  { type: 'peacock',  cp: '1f99a', name: '孔雀', icon: '🦚',   nameEn: 'Peacock',   price: 1300, size: 64, v: 'trill',  p: 1.2 },
  { type: 'kangaroo', cp: '1f998', name: '袋鼠', icon: '🦘',   nameEn: 'Kangaroo',  price: 1000, size: 64, v: 'mid',    p: 1.3 },
  { type: 'monkey',   cp: '1f412', name: '小猴', icon: '🐒',   nameEn: 'Monkey',    price: 850,  size: 58, v: 'high',   p: 1.4 },
  { type: 'alpaca',   cp: '1f999', name: '羊驼', icon: '🦙',   nameEn: 'Alpaca',    price: 1300, size: 64, v: 'squeak', p: 1 },
  { type: 'flamingo', cp: '1f9a9', name: '火烈鸟', icon: '🦩', nameEn: 'Flamingo',  price: 950,  size: 62, v: 'trill',  p: 1.5 },
  { type: 'sloth',    cp: '1f9a5', name: '树懒', icon: '🦥',   nameEn: 'Sloth',     price: 900,  size: 56, v: 'squeak', p: 0.8 },
  { type: 'fox',      cp: '1f98a', name: '狐狸', icon: '🦊',   nameEn: 'Fox',       price: 700,  size: 56, v: 'high',   p: 1.2 },
  { type: 'koala',    cp: '1f428', name: '考拉', icon: '🐨',   nameEn: 'Koala',     price: 750,  size: 56, v: 'squeak', p: 1 },
  { type: 'raccoon',  cp: '1f99d', name: '浣熊', icon: '🦝',   nameEn: 'Raccoon',   price: 600,  size: 54, v: 'mid',    p: 1.5 },
  { type: 'penguin',  cp: '1f427', name: '企鹅', icon: '🐧',   nameEn: 'Penguin',   price: 800,  size: 58, v: 'trill',  p: 1.3 },
  { type: 'lizard',   cp: '1f98e', name: '蜥蜴', icon: '🦎',   nameEn: 'Lizard',    price: 550,  size: 50, v: 'squeak', p: 1.4 },
  { type: 'snake',    cp: '1f40d', name: '小蛇', icon: '🐍',   nameEn: 'Snake',     price: 650,  size: 50, v: 'squeak', p: 0.9 },
  { type: 'turtle',   cp: '1f422', name: '乌龟', icon: '🐢',   nameEn: 'Turtle',    price: 500,  size: 48, v: 'low',    p: 1.6 },
  { type: 'hedgehog', cp: '1f994', name: '刺猬', icon: '🦔',   nameEn: 'Hedgehog',  price: 450,  size: 46, v: 'squeak', p: 1.6 },
  { type: 'rabbit',   cp: '1f407', name: '兔子', icon: '🐇',   nameEn: 'Rabbit',    price: 350,  size: 48, v: 'squeak', p: 1.8 },
  { type: 'squirrel', cp: '1f43f', name: '松鼠', icon: '🐿️',   nameEn: 'Squirrel',  price: 400,  size: 46, v: 'high',   p: 2 },
  { type: 'frog',     cp: '1f438', name: '青蛙', icon: '🐸',   nameEn: 'Frog',      price: 300,  size: 42, v: 'low',    p: 2.2 },
  { type: 'butterfly',cp: '1f98b', name: '蝴蝶', icon: '🦋', nameEn: 'Butterfly', price: 250, size: 40, v: 'trill', p: 2.4 },
  { type: 'bee',      cp: '1f41d', name: '蜜蜂', icon: '🐝',   nameEn: 'Bee',       price: 220,  size: 36, v: 'trill',  p: 2.6 },
  { type: 'snail',    cp: '1f40c', name: '蜗牛', icon: '🐌',   nameEn: 'Snail',     price: 200,  size: 38, v: 'squeak', p: 1.2 },
];
const ZOO_MAP = {};
ZOO_SHOP.forEach(function (z) { ZOO_MAP[z.type] = z; });
const MAX_ZOO = 30;

// 每种动物「画出来的时候头朝哪边」——用脚本量过每张 emoji 图上半部的重心，
// 走路时按这个来镜像，保证它朝着前进方向走，不会倒着走。
// left = 图里的头在左边（往左走时不用翻转）｜right = 头在右边｜front = 正面（不用翻转）
const ZOO_FACING = {
  alpaca: 'left', bear: 'front', bee: 'front', butterfly: 'front', elephant: 'left', flamingo: 'left', fox: 'front',
  frog: 'front', giraffe: 'left', hedgehog: 'left', kangaroo: 'left', koala: 'front',
  lion: 'front', lizard: 'left', monkey: 'front', panda: 'front', peacock: 'front',
  penguin: 'left', rabbit: 'left', raccoon: 'front', sloth: 'front', snail: 'left',
  snake: 'left', squirrel: 'left', turtle: 'right', zebra: 'left',
};
const ZOO_FLY = { bee: 1, butterfly: 1, flamingo: 0, peacock: 0 };   // 会飞的（轻盈地飘）

// ---------------- 鸡棚规则（母鸡 / 孵蛋 / 小鸡） ----------------
// 母鸡 / 小鸡 / 孵蛋器的上限都由「鸡巢等级」决定：见 maxHens() / maxChicks() / maxIncubate()
const HATCH_DAYS = 15;           // 鸡蛋放进孵蛋器，15 天（游戏内天数）后孵出小鸡
const CHICK_GROW_DAYS = 30;      // 小鸡出生 30 天后长成母鸡
const HEN_GROW = 1.15;           // 母鸡整体放大一点
const CHICK_SCALE = 0.62;        // 小鸡小小一只

// ---------------- 放牧规则（饲料） ----------------
// 每种农场动物每天都要吃一份饲料；连续 3 天没放饲料，动物就会饿得跑出围栏、也不再产出
const FEED_PER_DAY = 1;          // 每只动物每天 1 份
const FEED_MAX = 15;             // 每个食槽最多存 15 份（够 5 只动物吃 3 天）
const UNFED_LIMIT = 3;           // 连续 3 天没饲料 → 饿跑
const FEED_BUY_PRICE = 8;        // 商店里一份饲料的价格
const SAPLING_PRICE = 130;       // 商店里一棵果树苗的价格（买回来直接种进果树园）
const PET_SCALE = 1.3;           // 人物整体再放大一点
const ANIMAL_SCALE = 1.3;        // 动物整体再放大一点
// 食槽（放在各自棚舍里，走到旁边按 E 放饲料）
const TROUGHS = [
  { id: 'chicken', type: 'chicken', x: 1125, y: 872,  r: 72, feed: 8, unfed: 0 },
  { id: 'sheep',   type: 'sheep',   x: 976,  y: 1172, r: 72, feed: 8, unfed: 0 },
  { id: 'cow',     type: 'cow',     x: 1331, y: 1171, r: 74, feed: 8, unfed: 0 },
];
const TROUGH_OF = {};
TROUGHS.forEach(function (tr) { TROUGH_OF[tr.type] = tr; });
// 这一种动物今天吃饱了吗
function troughOf(type) { return TROUGH_OF[type] || null; }
function isFed(type) { const tr = troughOf(type); return !tr || tr.feed > 0; }
function isHungry(type) { const tr = troughOf(type); return !!tr && tr.feed <= 0; }
// 这种动物是不是已经饿跑了（连续 3 天没喂）
function isStarving(type) { const tr = troughOf(type); return !!tr && tr.unfed >= UNFED_LIMIT; }
// 某种动物现在有几只
function countAnimalType(type) { return G.animals.filter(a => a.type === type).length; }
// 放饲料：一次把食槽加满（用背包里的饲料 / 玉米）
// 放进去之后**马上**让饿跑的动物回窝（不用等到第二天结算）。
// 以前这里只清了 unfed 计数，没清 animals 上的 tired 标志，所以食槽里明明有饲料了，
// 鸡头上还是一直顶着「饿跑了 / 饲料不足」的红框，走到它旁边也只会提示「它饿了」。
function feedArrived(tr) {
  let cameBack = false;
  for (const a of G.animals) {
    if (a.type !== tr.type || !a.tired) continue;
    a.tired = false;
    cameBack = true;
    spawnParticles(a.x, a.y - 18, '💖', 4);
    // 让它掉头回窝，而不是继续在外面乱走
    const h = a.home || (PENS[a.type] && PENS[a.type].home);
    if (h) { a.tx = h.x + rand(-30, 30); a.ty = h.y + rand(-20, 20); a.moving = true; }
  }
  if (cameBack) { note('logFeedBack'); sfx.sparkle(); }
  return cameBack;
}
function fillTrough(tr) {
  const need = FEED_MAX - tr.feed;
  if (need <= 0) { sfx.error(); say('feedFull'); return false; }
  const have = G.inventory.feed || 0;
  if (have > 0) {
    const use = Math.min(have, need);
    removeItem('feed', use);
    tr.feed += use;
    tr.unfed = 0;                          // 今天开始算「吃饱了」
    sfx.plant(); spawnParticles(tr.x, tr.y - 14, '🌾', 5);
    feedArrived(tr);
    say('logFeed', { n: tr.feed, max: FEED_MAX });
    saveGame(true);
    return true;
  }
  if ((G.inventory.corn || 0) > 0) {
    // 没有现成饲料就用玉米自己拌（一份玉米 = 一份饲料）
    const use = Math.min(G.inventory.corn, need);
    removeItem('corn', use);
    tr.feed += use;
    tr.unfed = 0;
    sfx.plant(); spawnParticles(tr.x, tr.y - 14, '🌾', 5);
    feedArrived(tr);
    say('logFeedCorn', { n: tr.feed, max: FEED_MAX });
    saveGame(true);
    return true;
  }
  // 背包里连玉米都没有：只叫一声，不改状态
  sfx.error(); say('noFeed');
  return false;
}
function isHen(a) { return a.type === 'chicken' && a.stage !== 'chick'; }
function isChick(a) { return a.type === 'chicken' && a.stage === 'chick'; }
function countHens() { return G.animals.filter(isHen).length; }
function countChicks() { return G.animals.filter(isChick).length; }
// 今天已经下过蛋的母鸡有几只（日志和界面用）
function countHensLaidToday() { return G.animals.filter(function (a) { return isHen(a) && a.laidToday; }).length; }

// 孵蛋器里还要等最少几天
function hatchDaysLeft() {
  if (!G.incubating.length) return 0;
  let m = Infinity;
  for (const e of G.incubating) m = Math.min(m, e.left);
  return m;
}

// 成年动物总数上限（鸡棚的母鸡/小鸡另有各自上限，单独判断）
function cappedAnimalCount() {
  return G.animals.filter(a => a.type !== 'chicken').length;
}

// ---------------- 游戏状态 ----------------
const G = {
  started: false,
  t: 0,                       // 全局动画时钟（秒）
  coins: 20,
  day: 1,
  timeMin: DAY_START,
  weather: 'sunny',           // sunny | cloudy | rain
  inventory: { seed_carrot: 2, feed: 3 },
  player: {
    x: PLAYER_SPAWN.x, y: PLAYER_SPAWN.y, dir: 'down', gender: 'boy',
    moving: false, walkPhase: 0, actionT: 0,
    // 一开始只有「破帽子 + 破衣服 + 破裤子」，鞋子是光脚，裙子不穿
    outfit: { hat: 'ragged', hair: 'none', shirt: 'ragged', dress: 'none', pants: 'ragged', shoes: 'none' },
  },
  owned: { hat: ['ragged'], hair: [], shirt: ['ragged'], dress: [], pants: ['ragged'], shoes: [] },
  // 宠物：一只宠物一条记录（宠物房间升级后可以多养几只）
  pets: [],
  petHatsOwned: [],
  // 设施等级：十个设施都是从这个初始值开始往上升
  levels: { coop: 1, sheep: 1, cow: 1, orchard: 1, pond: 1, tank: 1, kitchen: 1, wardrobe: 1, shop: 1 },
  vehicles: [],           // 已经买到的交通工具
  vehicle: null,          // 正在骑的那辆（null = 走路）
  math: null,             // 找零钱小挑战：{c, price, paid, change, choices, t, total}
  animals: [],
  incubating: [],         // 孵蛋器里的鸡蛋：[{left: 剩余天数}]
  groundItems: [],
  zoo: [],                // 动物园观赏动物（只看不产出）
  tank: [],               // 大型水族箱里养的鱼（最多 20）
  seaCaught: {},          // 钓鱼图鉴：已钓到的种类
  decorations: [],        // 自己摆放的庭院装饰
  placing: null,          // 放置模式：{ id }
  plots: [],
  trees: [],
  decor: [],
  customers: [],
  customerTimer: 18,
  visitorTimer: 12,          // 下一位参观客人什么时候来
  ambientT: 6,          // 环境动物叫声计时
  lastStep: 0,          // 脚步动画相位
  saveT: 0,             // 自动存档计时
  log: [],              // 游戏日志
  particles: [],
  fishing: null,              // {phase:'wait'|'bite', timer, bx, by}
  modalOpen: null,
  cam: { x: 0, y: 0 },
  sleepFade: 0,
  sleepDawn: false,
  // 🌙 睡前任务：到了晚上先做刷牙 / 洗脸 / 涂脸，做完才能点「去睡觉」
  bed: { active: false, step: 0, done: [false, false, false] },
};

// 场景交互点（按四排布局排好）
const ZONES = {
  house:    { x: 900,  y: 640 },           // 主角家（第二排正中间）
  wardrobe: { x: 680,  y: 660, r: 55 },    // 衣柜
  kitchen:  { x: 790,  y: 660, r: 55 },    // 厨房
  // （宠物家取消了：原来的位置改成下面三个能互动的小物件）
  bin:      { x: 1090, y: 660, r: 55 },    // 卖货箱
  stall:    { x: 1240, y: 651, r: 78 },    // 商店（玩家在这里买东西）
  counter:  { x: 1400, y: 670, r: 78 },    // 销售门面（客人从右边排队过来买东西）
  tank:     { x: 1260, y: 410, r: 140 },   // 大水族箱（第一排，占掉果园右边一整片）
  rack:     { x: 668,  y: 480, r: 86 },    // 停车架（第一、二排之间的空地）
  hatchery: { x: 1193, y: 840, r: 74 },    // 鸡棚里的孵蛋器（跟着鸡棚升级一起挪）
};

// 🐾 宠物区：宠物家取消以后，改成三个可以直接互动的小物件（对着谁按 E 就做哪件事）
const PET_SPOTS = {
  food:  { x: 498, y: 668, r: 50 },   // 🍖 宠物粮食 → 喂食
  clean: { x: 562, y: 690, r: 50 },   // 🧹 砂盆     → 清理便便
  bath:  { x: 626, y: 664, r: 50 },   // 🛁 浴缸     → 洗澡
};

// 动物棚舍区域（每种动物一个独立围栏）
// 这里的值会被 applyLevels() 按当前等级覆写，所以只当「1 级的默认值」看
const PENS = {
  chicken: { x: 1055, y: 810,  w: 200, h: 145, home: { x: 1155, y: 890,  r: 70 } },
  sheep:   { x: 930,  y: 1110, w: 210, h: 145, home: { x: 1035, y: 1180, r: 72 } },
  cow:     { x: 1285, y: 1105, w: 220, h: 150, home: { x: 1395, y: 1180, r: 75 } },
};

// ============================================================
//                       设施升级系统
// ------------------------------------------------------------
// 十个设施各自 1~3 级。升级之后：
//   ① 地图上的占地变大（每个等级的矩形都提前排好，互相不打架）
//   ② 能容纳的动物 / 果树 / 鱼种 / 菜品 / 服饰变多
//   ③ 商店里能买到的东西逐步开放
// 地图上每一次扩建的位置都已经预留好了：1、2 级时还会用虚线画出「下次会扩到这里」。
// ============================================================
const MAX_LV = 3;

// 每个设施的占地（按等级）。同一个设施三个等级的矩形**都在这里定死**，
// 这样「升级以后变大」不会把邻居挤到水里或者压到别的建筑上。
// 排布约定：每个设施的围栏都绕着同一条中轴线向两边长，底边向下长；
// 因此「正下方的那块木牌（升级牌子）」永远落在围栏外面，不会挡住动物。
const PEN_RECTS = {
  chicken: [
    { x: 1055, y: 810, w: 200, h: 145 },
    { x: 1020, y: 795, w: 270, h: 180 },
    { x: 985,  y: 780, w: 340, h: 215 },
  ],
  sheep: [
    { x: 930, y: 1110, w: 210, h: 145 },
    { x: 890, y: 1095, w: 290, h: 180 },
    { x: 850, y: 1080, w: 370, h: 210 },
  ],
  cow: [
    { x: 1285, y: 1105, w: 220, h: 150 },
    { x: 1258, y: 1090, w: 275, h: 185 },
    { x: 1250, y: 1075, w: 290, h: 215 },
  ],
};
const PEN_HOME = {
  chicken: [
    { x: 1155, y: 890, r: 70 }, { x: 1155, y: 905, r: 82 }, { x: 1155, y: 920, r: 95 },
  ],
  sheep: [
    { x: 1035, y: 1180, r: 72 }, { x: 1035, y: 1195, r: 86 }, { x: 1035, y: 1210, r: 98 },
  ],
  cow: [
    { x: 1395, y: 1180, r: 75 }, { x: 1395, y: 1195, r: 87 }, { x: 1395, y: 1215, r: 99 },
  ],
};
// 食槽跟着围栏一起挪（相对围栏左上角的偏移固定）
const TROUGH_OFF = {
  chicken: { x: 70, y: 62 }, sheep: { x: 46, y: 62 }, cow: { x: 46, y: 66 },
};

// 果树园：同样是三个等级三块地（第一排最左），13 个树坑按「先进先出」的顺序填充
// 每次扩建都从中心向外长，下面留出木牌的位置
const ORCHARD_RECTS = [
  { x: 150, y: 150, w: 330, h: 220 },
  { x: 110, y: 140, w: 440, h: 250 },
  { x: 60,  y: 130, w: 550, h: 275 },
];
// 树坑顺序经过设计：前 2 个落在 1 级地里、前 6 个落在 2 级地里，全部 13 个落在 3 级地里
// （横竖都是等距的，果树不会挤在一起）
const ORCHARD_SLOTS = [
  { x: 230, y: 185 }, { x: 340, y: 185 },
  { x: 450, y: 185 }, { x: 230, y: 285 }, { x: 340, y: 285 }, { x: 450, y: 285 },
  { x: 120, y: 185 }, { x: 120, y: 285 }, { x: 560, y: 185 }, { x: 560, y: 285 },
  { x: 120, y: 380 }, { x: 340, y: 380 }, { x: 560, y: 380 },
];

// 水坑：解锁等级 + 三个等级的尺寸（越大鱼越多、越值钱）
const POND_SPEC = [
  { id: 'small',  unlockLv: 1, x: 1630, y: 890,
    sizes: [{ w: 112, h: 64 }, { w: 132, h: 76 }, { w: 152, h: 88 }] },
  { id: 'medium', unlockLv: 2, x: 650, y: 1180,
    sizes: [{ w: 130, h: 76 }, { w: 170, h: 100 }, { w: 212, h: 124 }] },
  { id: 'large',  unlockLv: 3, x: 1710, y: 1180,
    sizes: [{ w: 180, h: 104 }, { w: 240, h: 140 }, { w: 300, h: 172 }] },
];

// 水族箱：三个等级的体积。第一排右边一整片都留给它，所以能做得很大
const TANK_SIZE = [{ w: 320, h: 130 }, { w: 570, h: 190 }, { w: 860, h: 250 }];
// 水族箱占的地（玻璃箱 + 木架），用来画「下次扩建到这里」的虚线框、算小地图和碰撞
function tankRect(lv) {
  const ts = TANK_SIZE[Math.max(0, Math.min(MAX_LV, lv || 1)) - 1];
  return { x: ZONES.tank.x - ts.w / 2, y: ZONES.tank.y - ts.h - 14, w: ts.w, h: ts.h + 18 };
}
// 商店摊位：升级后摊子变大、货架变多
const STALL_SCALE = [1, 1.2, 1.45];

// 农田（4×3 共 12 块地）：现在只有 1 级大小，四周按 3 级的大小**预留出升级区域**（白色虚线框）
const FARM_RECTS = [
  { x: 580, y: 810, w: 240, h: 150 },
  { x: 550, y: 795, w: 300, h: 185 },
  { x: 520, y: 780, w: 360, h: 220 },
];
function farmRect() { return FARM_RECTS[0]; }

// 销售门面右侧的排队位：客人从右边过来，按先来后到依次往前站
const QUEUE_SLOTS = [
  { x: 1545, y: 700 }, { x: 1645, y: 700 }, { x: 1745, y: 700 }, { x: 1845, y: 700 },
];
const MAX_BUYERS = 3;              // 同时最多来 3 位买东西的客人（可能排成一队）

// 右下角的大海：从大海水蓝洞一路连到地图的右下角，看起来是通到外面的海里。
// 岸线是一条波浪线，海水都画在这条线右下的一侧。
const SEA_POLY = [
  { x: 1466, y: 1460 }, { x: 1492, y: 1358 }, { x: 1540, y: 1300 },
  { x: 1548, y: 1226 }, { x: 1578, y: 1156 }, { x: 1652, y: 1096 },
  { x: 1768, y: 1066 }, { x: 1920, y: 1056 },
  { x: 1920, y: 1460 },
];
// 某个点是不是在海里（射线法）
function pointInSea(x, y) {
  let inside = false;
  for (let i = 0, j = SEA_POLY.length - 1; i < SEA_POLY.length; j = i++) {
    const xi = SEA_POLY[i].x, yi = SEA_POLY[i].y, xj = SEA_POLY[j].x, yj = SEA_POLY[j].y;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// 特意空出来给小朋友摆装饰的空地（浅色草坪，买好装饰走过去按 E 就能放下）。
// 这些地方不盖房子、不种地，摆大风车 / 小喷泉 / 长椅都放得下。
const DECOR_PATCHES = [
  { x: 1355, y: 800, w: 155, h: 195 },   // 第三排：鸡棚和小水坑中间
  { x: 1740, y: 790, w: 150, h: 205 },   // 第三排：最右边
  { x: 445,  y: 1080, w: 95,  h: 170 },  // 第四排：森林和中水坑之间
  { x: 55,   y: 1330, w: 345, h: 110 },  // 森林下面（地图左下角）
];

// 十个设施的等级表：费用 / 容量 / 说明
const FACILITIES = {
  coop: {
    name: '鸡巢', nameEn: 'Chicken Coop', icon: '🐔',
    tip: '母鸡和小鸡住的地方', tipEn: 'Home of the hens and chicks',
    cost: [0, 150, 400],
    cap: [{ hen: 3, chick: 4 }, { hen: 5, chick: 10 }, { hen: 8, chick: 16 }],
    capText: [
      ['母鸡 3 只 · 小鸡 4 只 · 孵蛋器 3 格', '3 hens · 4 chicks · 3 egg slots'],
      ['母鸡 5 只 · 小鸡 10 只 · 孵蛋器 6 格', '5 hens · 10 chicks · 6 egg slots'],
      ['母鸡 8 只 · 小鸡 16 只 · 孵蛋器 10 格', '8 hens · 16 chicks · 10 egg slots'],
    ],
    growText: ['围栏变大 →', 'Bigger fence →'],
  },
  sheep: {
    name: '羊棚', nameEn: 'Sheep Pen', icon: '🐑',
    tip: '养小羊、剪羊毛', tipEn: 'Raise lambs and shear wool',
    cost: [0, 180, 450],
    cap: [2, 4, 6],
    capText: [['最多养 2 只羊', 'Up to 2 sheep'],
              ['最多养 4 只羊', 'Up to 4 sheep'],
              ['最多养 6 只羊', 'Up to 6 sheep']],
    growText: ['羊棚变大 →', 'Bigger pen →'],
  },
  cow: {
    name: '牛棚', nameEn: 'Cow Barn', icon: '🐄',
    tip: '养奶牛、挤牛奶', tipEn: 'Raise cows and get milk',
    cost: [0, 220, 550],
    cap: [2, 4, 6],
    capText: [['最多养 2 头牛', 'Up to 2 cows'],
              ['最多养 4 头牛', 'Up to 4 cows'],
              ['最多养 6 头牛', 'Up to 6 cows']],
    growText: ['牛棚变大 →', 'Bigger barn →'],
  },
  orchard: {
    name: '果树园', nameEn: 'Orchard', icon: '🍎',
    tip: '种更多果树，结更多果子', tipEn: 'Plant more fruit trees',
    cost: [0, 200, 500],
    cap: [2, 6, 13],
    capText: [['最多 2 棵果树', 'Up to 2 trees'],
              ['最多 6 棵果树', 'Up to 6 trees'],
              ['最多 13 棵果树', 'Up to 13 trees']],
    growText: ['果园变大 →', 'Bigger orchard →'],
  },
  pond: {
    name: '水坑', nameEn: 'Ponds', icon: '💧',
    tip: '水坑越大，能钓到的鱼越多', tipEn: 'Bigger ponds, more fish',
    cost: [0, 160, 420],
    cap: [5, 10, 15],
    capText: [['小水坑 · 能钓到 5 种', 'Small puddle · 5 species'],
              ['+ 中水坑 · 能钓到 10 种', '+ medium pond · 10 species'],
              ['+ 大海水蓝洞 · 能钓到 15 种', '+ Big Blue Hole · 15 species']],
    growText: ['水坑变大 →', 'Bigger ponds →'],
  },
  tank: {
    name: '水族箱', nameEn: 'Aquarium', icon: '🐠',
    tip: '把钓到的鱼养起来', tipEn: 'Keep the fish you catch',
    cost: [0, 200, 520],
    cap: [6, 12, 20],
    capText: [['最多养 6 条鱼', 'Up to 6 fish'],
              ['最多养 12 条鱼', 'Up to 12 fish'],
              ['最多养 20 条鱼', 'Up to 20 fish']],
    growText: ['水族箱变大 →', 'Bigger tank →'],
  },
  kitchen: {
    name: '厨房', nameEn: 'Kitchen', icon: '🍳',
    tip: '厨房越大，能做的菜越多', tipEn: 'Bigger kitchen, more recipes',
    cost: [0, 240, 580],
    cap: [6, 12, 18],
    capText: [['能做 6 道菜', '6 recipes'],
              ['能做 12 道菜', '12 recipes'],
              ['能做全部 18 道菜', 'All 18 recipes']],
    growText: ['灶台变大 →', 'Bigger stove →'],
  },
  wardrobe: {
    name: '衣橱', nameEn: 'Wardrobe', icon: '👗',
    tip: '衣橱越大，能买到的衣服越多', tipEn: 'Bigger closet, more clothes',
    cost: [0, 180, 460],
    cap: [1, 2, 3],
    capText: [['开放「基础」服饰', 'Basic clothes unlocked'],
              ['开放「漂亮」服饰', 'Pretty clothes unlocked'],
              ['开放「华丽」服饰', 'Fancy clothes unlocked']],
    growText: ['衣帽间变大 →', 'Bigger closet →'],
  },
  shop: {
    name: '商店', nameEn: 'Shop', icon: '🛒',
    tip: '商店越大，卖的东西越多', tipEn: 'Bigger shop, more goods',
    cost: [0, 250, 600],
    cap: [1, 2, 3],
    capText: [['卖「基础」商品', 'Basic goods'],
              ['开放「进阶」商品', 'Advanced goods unlocked'],
              ['开放「高级」商品', 'Premium goods unlocked']],
    growText: ['摊位变大 →', 'Bigger stall →'],
  },
};
const FACILITY_ORDER = ['coop', 'sheep', 'cow', 'orchard', 'pond', 'tank', 'kitchen', 'wardrobe', 'shop'];

// 设施名字（中/英）
function facName(f) { const d = FACILITIES[f]; return lang === 'en' ? d.nameEn : d.name; }
function facTip(f) { const d = FACILITIES[f]; return lang === 'en' ? d.tipEn : d.tip; }
function facCapText(f, lv) {
  const d = FACILITIES[f];
  return d.capText[Math.max(0, Math.min(2, (lv || 1) - 1))][lang === 'en' ? 1 : 0];
}
// 当前等级（没记录过就是 1 级）
function lvOf(f) { return (G.levels && G.levels[f]) || 1; }
function isMaxLv(f) { return lvOf(f) >= MAX_LV; }
function upgradeCost(f) { if (isMaxLv(f)) return 0; return FACILITIES[f].cost[lvOf(f)]; }
function canUpgradeFacility(f) { return !isMaxLv(f) && G.coins >= upgradeCost(f); }
// 这个设施离下一级还差多少钱（升级面板上显示用）
function upgradeShort(f) { return isMaxLv(f) ? 0 : Math.max(0, upgradeCost(f) - G.coins); }

// 容量查询：到处都用这几个函数，改等级就自动生效
function maxHens() { return FACILITIES.coop.cap[lvOf('coop') - 1].hen; }
function maxChicks() { return FACILITIES.coop.cap[lvOf('coop') - 1].chick; }
function maxIncubate() { return [3, 6, 10][lvOf('coop') - 1]; }
function maxSheep() { return FACILITIES.sheep.cap[lvOf('sheep') - 1]; }
function maxCows() { return FACILITIES.cow.cap[lvOf('cow') - 1]; }
function maxOtherAnimals() { return maxSheep() + maxCows(); }   // 非鸡类动物的总上限
function maxOrchard() { return FACILITIES.orchard.cap[lvOf('orchard') - 1]; }
function maxTank() { return FACILITIES.tank.cap[lvOf('tank') - 1]; }
function tankSize() { return TANK_SIZE[lvOf('tank') - 1]; }
function maxRecipes() { return FACILITIES.kitchen.cap[lvOf('kitchen') - 1]; }
function maxPets() { return 1; }        // 一个人只带一只宠物（想换别的去衣帽间 / 商店换）
function outfitTierMax() { return FACILITIES.wardrobe.cap[lvOf('wardrobe') - 1]; }
function shopTierMax() { return FACILITIES.shop.cap[lvOf('shop') - 1]; }
function pondUnlocked(p) { return lvOf('pond') >= p.unlockLv; }
function unlockedPonds() { return PONDS.filter(pondUnlocked); }
function orchardRect() { return ORCHARD_RECTS[lvOf('orchard') - 1]; }
function penRect(type) { return PEN_RECTS[type][lvOf(FACILITY_OF_PEN[type]) - 1]; }
function penHome(type) { return PEN_HOME[type][lvOf(FACILITY_OF_PEN[type]) - 1]; }
const FACILITY_OF_PEN = { chicken: 'coop', sheep: 'sheep', cow: 'cow' };
// 棚舍对应的设施 id（鸡巢 / 羊棚 / 牛棚）
function facOfPen(type) { return FACILITY_OF_PEN[type]; }

// 把当前等级「写进」各种数据结构里：
// PENS / PONDS / ZONES / TROUGHS 会被就地改写，这样其它地方照旧读它们就行。
function applyLevels() {
  // ① 三种棚舍的围栏 + 小窝 + 食槽
  for (const type of ['chicken', 'sheep', 'cow']) {
    const r = penRect(type), h = penHome(type), pen = PENS[type];
    pen.x = r.x; pen.y = r.y; pen.w = r.w; pen.h = r.h;
    pen.home = { x: h.x, y: h.y, r: h.r };
  }
  const off = TROUGH_OFF;
  const ct = troughOf('chicken'), st = troughOf('sheep'), wt = troughOf('cow');
  if (ct) { ct.x = PENS.chicken.x + off.chicken.x; ct.y = PENS.chicken.y + off.chicken.y; }
  if (st) { st.x = PENS.sheep.x + off.sheep.x;     st.y = PENS.sheep.y + off.sheep.y; }
  if (wt) { wt.x = PENS.cow.x + off.cow.x;         wt.y = PENS.cow.y + off.cow.y; }
  // 孵蛋器放在鸡棚里（跟着围栏走）：摆在围栏靠右的位置，
  // 和左边靠门口的那个食槽拉开一点距离，走过去按 E 不会互相抢
  ZONES.hatchery.x = PENS.chicken.x + PENS.chicken.w - 62;
  ZONES.hatchery.y = PENS.chicken.y + 30;
  // ② 水坑的尺寸
  const pl = lvOf('pond') - 1;
  for (const p of PONDS) {
    const spec = POND_SPEC.find(s => s.id === p.id);
    if (!spec) continue;
    const sz = spec.sizes[pl];
    p.x = spec.x; p.y = spec.y; p.w = sz.w; p.h = sz.h;
    p.unlockLv = spec.unlockLv;
    p.locked = !pondUnlocked(p);
  }
  // ③ 水族箱的交互半径跟着体积走一点
  const ts = tankSize();
  ZONES.tank.r = Math.max(120, ts.w / 2 + 8);
  // ⑤ 农场动物（按等级）出生 / 散步的活动范围
  G.animalArea = { sheep: PENS.sheep, cow: PENS.cow, chicken: PENS.chicken };
}

// 升一级（扣钱、扩容、写日志、存档）
function doUpgrade(f) {
  if (!FACILITIES[f] || isMaxLv(f)) { sfx.error(); return false; }
  const cost = upgradeCost(f);
  if (G.coins < cost) { sfx.error(); say('upgradeNoCoin', { n: cost }); return false; }
  G.coins -= cost;
  G.levels[f] = lvOf(f) + 1;
  applyLevels();
  sfx.success(); sfx.till();
  spawnParticles(G.player.x, G.player.y - 24, '✨', 10);
  note('logUpgrade', { fac: facName(f), lv: lvOf(f) });
  bigToast(FACILITIES[f].icon, t('upgradeDone', { fac: facName(f), lv: lvOf(f) }),
           facCapText(f, lvOf(f)), 2800);
  saveGame(true);
  renderHUD();
  return true;
}

// ---------------- 音效引擎（WebAudio 全合成，无外部音频文件） ----------------
let AC = null, master = null, noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem('farm-muted') === '1'; } catch (e) {}

// 懒初始化 AudioContext（浏览器要求用户手势后才能出声）
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return true; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(AC.destination);
    // 预生成白噪声缓冲（水声/脚步声/风声都用它）
    const len = Math.floor(AC.sampleRate * 1.2);
    noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  } catch (e) { return false; }
}
function setMuted(m) {
  muted = m;
  try { localStorage.setItem('farm-muted', m ? '1' : '0'); } catch (e) {}
  if (master) master.gain.value = m ? 0 : 1;
  const b = $('btn-mute');
  if (b) b.textContent = m ? '🔇' : '🔊';
}
// 纯音：f 起始频率, f2 滑到, t 秒, type 波形, v 音量, when 延迟(秒)
function tone(f, f2, t, type, v, when = 0) {
  if (!audioInit() || muted) return;
  const t0 = AC.currentTime + when;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2 && f2 !== f) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + t);
  g.gain.setValueAtTime(v, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + t);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + t + 0.03);
}
// 噪声：t 秒, v 音量, filterFreq 低通频率, q 共鸣, when 延迟
function noise(t, v, filterFreq = 2000, q = 1, when = 0) {
  if (!audioInit() || muted) return;
  const t0 = AC.currentTime + when;
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq; f.Q.value = q;
  const g = AC.createGain();
  g.gain.setValueAtTime(v, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + t);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t0); s.stop(t0 + t + 0.03);
}

const sfx = {
  // ---- UI ----
  click:  () => tone(900, 700, 0.05, 'triangle', 0.08),
  open:   () => tone(520, 660, 0.07, 'triangle', 0.1),
  close:  () => tone(480, 380, 0.07, 'triangle', 0.09),
  // ---- 走路（左右脚交替） ----
  step:   (alt) => noise(0.05, 0.045, alt ? 950 : 700, 1),
  // ---- 农场动作 ----
  till:   () => { noise(0.12, 0.16, 480); tone(120, 80, 0.12, 'triangle', 0.12); },
  plant:  () => { tone(600, 920, 0.09, 'sine', 0.12); noise(0.04, 0.05, 3200); },
  water:  () => { noise(0.28, 0.14, 1700, 1); tone(520, 300, 0.22, 'sine', 0.05); },
  harvest:() => { tone(660, 660, 0.07, 'triangle', 0.12); tone(880, 880, 0.07, 'triangle', 0.12, 0.07); tone(1108, 1108, 0.13, 'triangle', 0.12, 0.14); },
  shake:  () => { noise(0.06, 0.11, 2600); noise(0.06, 0.11, 2600, 1, 0.09); noise(0.09, 0.11, 2600, 1, 0.18); },
  pickup: () => { tone(880, 880, 0.06, 'sine', 0.12); tone(1318, 1318, 0.09, 'sine', 0.1, 0.06); },
  sparkle:() => { tone(1200, 1600, 0.08, 'sine', 0.05); tone(1600, 2100, 0.1, 'sine', 0.04, 0.07); },
  // ---- 动物 ----
  shear:  () => { tone(1800, 1400, 0.05, 'square', 0.055); tone(1800, 1400, 0.05, 'square', 0.055, 0.09); },
  milk:   () => { tone(400, 820, 0.18, 'sine', 0.12); tone(920, 920, 0.08, 'sine', 0.1, 0.16); },
  cluck:  () => { tone(700, 500, 0.06, 'square', 0.06); tone(620, 420, 0.07, 'square', 0.06, 0.08); },
  moo:    () => { tone(165, 110, 0.5, 'sawtooth', 0.09); tone(82, 60, 0.5, 'triangle', 0.05); },
  baa:    () => { for (let i = 0; i < 5; i++) tone(620 + Math.sin(i * 2.2) * 120, 620, 0.09, 'square', 0.045, i * 0.09); },
  pet:    () => { tone(700, 1050, 0.1, 'sine', 0.1); tone(1050, 1400, 0.12, 'sine', 0.09, 0.09); },
  // 动物自己的叫声（可延时，用在和玩家互动之后）；小鸡是细细的叫声
  animalVoice: (type, delay = 0, a) => setTimeout(() => {
    if (type === 'chicken') { if (a && isChick(a)) sfx.chick(); else sfx.cluck(); }
    else if (type === 'sheep') sfx.baa();
    else sfx.moo();
  }, delay),
  // 小鸡的啾啾声
  chick:  () => { tone(1500, 2100, 0.05, 'sine', 0.05); tone(1700, 2400, 0.06, 'sine', 0.045, 0.08); },
  // 动物园动物的叫声（v=音色, p=音高）
  zooVoice: (v, p, delay = 0) => {
    p = p || 1;
    if (v === 'low') { tone(150 * p, 100 * p, 0.5, 'sawtooth', 0.07, delay); }
    else if (v === 'growl') { tone(190 * p, 120 * p, 0.42, 'sawtooth', 0.065, delay); noise(0.3, 0.045, 420, 1, delay); }
    else if (v === 'mid') { tone(340 * p, 270 * p, 0.22, 'triangle', 0.07, delay); }
    else if (v === 'high') { tone(700 * p, 900 * p, 0.09, 'square', 0.05, delay); tone(820 * p, 1100 * p, 0.09, 'square', 0.045, delay + 0.1); }
    else if (v === 'trill') { for (let i = 0; i < 4; i++) tone(1100 * p, 1500 * p, 0.06, 'sine', 0.04, delay + i * 0.07); }
    else { tone(900 * p, 1400 * p, 0.07, 'sine', 0.045, delay); tone(1500 * p, 800 * p, 0.09, 'sine', 0.04, delay + 0.07); }
  },
  // 宠物叫声（狗/猫/鸭/鹅）
  petVoice: (type, delay = 0) => {
    if (type === 'goose') { tone(300, 420, 0.22, 'sawtooth', 0.055, delay); tone(420, 300, 0.26, 'sawtooth', 0.05, delay + 0.24); }
    else if (type === 'duck') { tone(420, 300, 0.1, 'square', 0.06, delay); tone(380, 260, 0.12, 'square', 0.055, delay + 0.13); }
    else if (type === 'cat') { tone(620, 900, 0.25, 'triangle', 0.06, delay); tone(900, 700, 0.3, 'sine', 0.045, delay + 0.22); }
    else { tone(300, 200, 0.1, 'square', 0.07, delay); tone(260, 180, 0.1, 'square', 0.06, delay + 0.12); }
  },
  // 蜜蜂嗡嗡（蜂巢附近）
  buzz:   (delay = 0) => { tone(220, 260, 0.35, 'sawtooth', 0.03, delay); tone(180, 210, 0.4, 'sawtooth', 0.025, delay + 0.2); },
  // ---- 商店 / 烹饪 ----
  coin:   () => { tone(988, 988, 0.06, 'square', 0.07); tone(1319, 1319, 0.1, 'square', 0.07, 0.06); },
  buy:    () => { sfx.coin(); tone(1976, 1976, 0.12, 'sine', 0.06, 0.14); },
  cook:   () => { noise(0.4, 0.09, 4200, 1); tone(880, 880, 0.1, 'triangle', 0.1, 0.35); tone(1175, 1175, 0.16, 'triangle', 0.1, 0.45); },
  equip:  () => { tone(520, 780, 0.08, 'triangle', 0.1); tone(1040, 1040, 0.12, 'sine', 0.08, 0.08); },
  error:  () => tone(180, 150, 0.18, 'square', 0.07),
  // ---- 客人 ----
  bell:   () => { tone(880, 880, 0.18, 'sine', 0.11); tone(659, 659, 0.26, 'sine', 0.11, 0.2); },
  happy:  () => { tone(523, 523, 0.08, 'triangle', 0.1); tone(659, 659, 0.08, 'triangle', 0.1, 0.08); tone(784, 784, 0.08, 'triangle', 0.1, 0.16); tone(1047, 1047, 0.17, 'triangle', 0.1, 0.24); },
  sad:    () => { tone(440, 440, 0.12, 'triangle', 0.08); tone(330, 330, 0.22, 'triangle', 0.08, 0.12); },
  // ---- 钓鱼 ----
  cast:   () => { noise(0.2, 0.09, 1200, 1); tone(300, 620, 0.18, 'sine', 0.06); },
  bite:   () => { tone(1175, 1175, 0.07, 'square', 0.09); tone(1175, 1175, 0.07, 'square', 0.09, 0.1); tone(1568, 1568, 0.11, 'square', 0.09, 0.2); },
  catchf: () => { sfx.happy(); noise(0.2, 0.11, 1500, 1, 0.1); },
  escape: () => tone(500, 240, 0.3, 'sine', 0.09),
  splash: () => noise(0.2, 0.13, 1600),
  // ---- 时间 / 天气 ----
  morning:() => { tone(523, 523, 0.1, 'triangle', 0.09); tone(659, 659, 0.1, 'triangle', 0.09, 0.1); tone(784, 784, 0.22, 'triangle', 0.09, 0.2); },
  night:  () => { tone(784, 784, 0.2, 'sine', 0.07); tone(659, 659, 0.2, 'sine', 0.07, 0.2); tone(523, 523, 0.38, 'sine', 0.07, 0.4); },
  rain:   () => { noise(0.6, 0.07, 900, 1); noise(0.6, 0.05, 700, 1, 0.15); },
  // ---- 通用 ----
  success:() => sfx.happy(),
  pop:    () => tone(520, 640, 0.06, 'triangle', 0.1),
};

// ---------------- 背景音乐（轻柔五声音阶循环，全部合成） ----------------
let musicOn = true;
try { musicOn = localStorage.getItem('farm-music') !== '0'; } catch (e) {}
let musicTimer = null, musicStep = 0;
const MUSIC_BEAT = 550;                       // 每拍毫秒（约 109 BPM）
const M_CHORDS = [                            // 4 小节和弦（半音偏移，相对 C4）
  { bass: 0,  triad: [0, 4, 7] },             // C
  { bass: -3, triad: [-3, 0, 4] },            // Am
  { bass: -7, triad: [-7, -3, 0] },           // F
  { bass: -5, triad: [-5, -1, 2] },           // G
];
const M_MELODY = [                            // 32 拍旋律（都是悦耳的和弦音/五声音阶）
  7, 4, 0, 4, 7, 12, 7, 4,
  -3, 0, 4, 0, -3, -5, -3, 0,
  -7, -5, -3, -5, -7, -3, 0, -3,
  -5, -3, 0, 2, 4, 2, 0, -3,
];
const mtof = (semi) => 261.63 * Math.pow(2, semi / 12);   // 半音 → 频率

function musicTick() {
  const step = musicStep++;
  if (!musicOn || muted || !audioInit()) return;
  const ch = M_CHORDS[Math.floor(step / 8) % 4];
  const beat = step % 8;
  if (beat % 2 === 0) tone(mtof(ch.bass - 24), null, 1.0, 'sine', 0.045);          // 低音
  if (beat === 0) ch.triad.forEach((n, i) =>                                          // 和弦垫音
    tone(mtof(n - 12), null, 1.7, 'sine', 0.016, i * 0.03));
  const n = M_MELODY[step % M_MELODY.length];
  if (n !== null) tone(mtof(n), null, 0.5, 'triangle', 0.026);                        // 主旋律
}
function startMusic() {
  if (musicTimer || !musicOn) return;
  audioInit();
  musicTick();
  musicTimer = setInterval(musicTick, MUSIC_BEAT);
}
function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
function syncMusicButton() {
  const b = $('btn-music');
  if (b) { b.textContent = musicOn ? '🎵' : '🔕'; b.classList.toggle('off', !musicOn); }
}
function setMusic(on) {
  musicOn = on;
  try { localStorage.setItem('farm-music', on ? '1' : '0'); } catch (e) {}
  syncMusicButton();
  if (on) startMusic(); else stopMusic();
}

// ---------------- 输入 ----------------
const keys = {};
let interactQueued = false;
window.addEventListener('keydown', (e) => {
  // 在输入名字的框里打字时，不要触发游戏操作
  if (playerTyping()) { if (e.key === 'Enter') e.target.blur(); return; }
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  keys[k] = true;
  if (k === 'e' || k === ' ') interactQueued = true;
  if (k === 'h') toggleModal('help-modal');
  if (k === 's' && G.started && !G.modalOpen && !keys['arrowdown'] && !keys['w'] && !keys['a'] && !keys['d']) manualSave();
  if (k === 'q' && G.placing) { G.placing = null; sfx.close(); say('decorCancel'); }
  if (k === 'escape' && G.modalOpen) closeModal(G.modalOpen);
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ---------------- 工具 ----------------
// dist / rand / pick 在前面已定义（数据表初始化时要用）

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
// amount 是正数 = 赚到，负数 = 花掉（显示成 -12💰 而不是 +-12💰）
function coinBurst(x, y, amount) {
  G.particles.push({ x, y, icon: (amount >= 0 ? '+' : '') + amount + '💰', vx: 0, vy: -45,
                     life: 1.4, maxLife: 1.4, size: 18, text: true });
  sfx.coin();
}

// ---------------- 世界初始化 ----------------
function initWorld() {
  // 农田 4x3（摆在农田栅栏「农田」区域的正中间，第三排）
  const fr = farmRect();
  const fcx = fr.x + fr.w / 2, fcy = fr.y + fr.h / 2;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++)
      G.plots.push({ x: fcx - 69 + c * 46, y: fcy - 46 + r * 46, state: 'grass', crop: null, stage: 0, watered: false, timer: 0 });
  // 果树园：一开始只有 2 棵（苹果 + 橘子），其它树苗要去商店买
  G.trees = [];
  addOrchardTree('apple');
  addOrchardTree('orange');
  // 动物（各自住在自己的棚舍里）：一开始只有 1 只鸡 + 1 只羊 + 1 只牛
  const ch = PENS.chicken.home, sp = PENS.sheep.home, cw = PENS.cow.home;
  G.animals = [
    newAnimal('chicken', ch.x - 26, ch.y + 10),
    newAnimal('sheep', sp.x - 22, sp.y + 14),
    newAnimal('cow', cw.x - 24, cw.y + 12),
  ];
  G.incubating = [];
  // 装饰（避开建筑/田地/池塘/棚舍/果树园/森林）——用的是「3 级时最大」的范围，
  // 这样以后升级扩建时，草和花不会长到新围栏里面去；木牌下面也跟着避开
  const avoid = [
    // —— 第一排 ——
    { x: 60,  y: 130, w: 550, h: 305 },   // 果树园（含下方木牌）
    { x: 810, y: 140, w: 900, h: 340 },   // 大水族箱（3 级最大范围，含下方木牌）
    // —— 第二排 ——
    { x: FOREST.x, y: FOREST.y, w: FOREST.w, h: FOREST.h },   // 森林（第二、三、四排最左）
    { x: 462, y: 630, w: 180, h: 100 },   // 🍖 宠物粮食 / 🧹 砂盆 / 🛁 浴缸
    { x: 650, y: 620, w: 180, h: 105 },   // 衣柜 + 厨房（连木牌）
    { x: 878, y: 525, w: 165, h: 185 },   // 主角家
    { x: 1062, y: 632, w: 56, h: 54 },    // 卖货箱
    { x: 1160, y: 530, w: 160, h: 240 },  // 商店摊位（含下方木牌）
    { x: 1325, y: 555, w: 150, h: 130 },  // 销售门面
    { x: 1490, y: 660, w: 400, h: 80 },   // 客人排队的队伍
    // —— 第三排 ——
    { x: FARM_RECTS[2].x, y: FARM_RECTS[2].y, w: FARM_RECTS[2].w, h: FARM_RECTS[2].h }, // 农田（含升级预留区）
    { x: 985,  y: 780, w: 340, h: 275 },  // 鸡棚（含下方木牌）
    { x: 1540, y: 830, w: 180, h: 130 },  // 小水坑
    // —— 第四排 ——
    { x: 530,  y: 1110, w: 240, h: 150 }, // 中水坑
    { x: 850,  y: 1080, w: 370, h: 250 }, // 羊棚
    { x: 1250, y: 1075, w: 290, h: 250 }, // 牛棚
    { x: 1555, y: 1090, w: 310, h: 230 }, // 大海水蓝洞（含下方木牌）
    // —— 右下角的大海（整片都不长草） ——
    { x: 1420, y: 1030, w: 500, h: 430 },
  ];
  // 留给装饰的空地上也不要长杂草，干干净净等小朋友来摆东西
  for (const p of DECOR_PATCHES) avoid.push({ x: p.x + 8, y: p.y + 8, w: p.w - 16, h: p.h - 16 });
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

// 果树园的树坑：第 i 个坑（i 从 0 开始）
function orchardTree(type, i) {
  const slot = ORCHARD_SLOTS[i];
  if (!slot) return null;
  return { type, x: slot.x, y: slot.y, fruits: 3, timer: 0, phase: rand(0, 6) };
}
// 往果树园里加一棵树（初始的 2 棵、商店买的树苗都用它）
// 返回 null 表示果园满了或者位置不对
function addOrchardTree(type) {
  if (FRUIT_IDS.indexOf(type) < 0) return null;
  if (G.trees.length >= maxOrchard()) return null;
  const tr = orchardTree(type, G.trees.length);
  if (!tr) return null;
  G.trees.push(tr);
  return tr;
}
// 果树苗商店里还没种下的水果种类
function missingFruitTypes() {
  const have = G.trees.map(t => t.type);
  return FRUIT_IDS.filter(id => have.indexOf(id) < 0);
}


// 创建一只动物（初始动物和商店买的动物都用它）
// stage: 'hen'（母鸡，会下蛋）/ 'chick'（小鸡，出生 5 天后长成母鸡）
function newAnimal(type, x, y, stage) {
  return {
    type, x, y, dir: Math.random() < .5 ? 'left' : 'right',
    moving: false, walkPhase: 0, phase: rand(0, 6),
    tx: x, ty: y, waitT: rand(1, 3), peck: 0,
    wool: 1, woolT: 0, milkReady: true, milkT: 0,
    // 下蛋：每只母鸡**一天最多下一个蛋**，蛋会落在一天里的随机时刻
    eggT: rand(30, 180), laidToday: false,
    stage: type === 'chicken' ? (stage === 'chick' ? 'chick' : 'hen') : undefined,
    growT: 0,                                  // 小鸡还差几天长大
    tired: isHungry(type),                     // 饿跑了：不产出、会跑出围栏
    home: { ...PENS[type].home },
  };
}
// 在鸡棚附近找个能站的地方
function chickenSpot(r) {
  const h = PENS.chicken.home;
  return {
    x: Math.max(60, Math.min(WORLD_W - 40, h.x + rand(-(r || 50), r || 50))),
    y: Math.max(660, Math.min(PENS.chicken.y + PENS.chicken.h - 14, h.y + rand(-(r || 40), r || 40))),
  };
}
// 孵蛋器里孵出一只小鸡（超过 10 只就不孵了）
function spawnChick() {
  if (countChicks() >= maxChicks()) { note('logChicksFull', { max: maxChicks() }); return null; }
  const sp = chickenSpot(46);
  const c = newAnimal('chicken', sp.x, sp.y, 'chick');
  G.animals.push(c);
  spawnParticles(c.x, c.y - 16, '🐣', 5);
  return c;
}
// 天亮了：结算饲料 → 动物长大 → 孵蛋器推进一天
function dailyFarmUpdate() {
  dailyFeedUpdate();
  dailyChickenUpdate();
}
// 每天结算一次饲料：吃了就掉一份，没吃就记一天「饿」；连续 3 天没吃就饿跑
function dailyFeedUpdate() {
  for (const tr of TROUGHS) {
    const n = countAnimalType(tr.type);
    if (!n) { tr.feed = Math.min(tr.feed, FEED_MAX); continue; }   // 没有这种动物就不消耗
    const need = n * FEED_PER_DAY;
    if (tr.feed >= need) {
      tr.feed -= need;
      tr.unfed = 0;
      // 只要今天吃饱了，之前饿跑的动物就自己回窝（和手动放饲料时同一套逻辑）
      feedArrived(tr);
    } else {
      // 今天没吃上：记一天。前 2 天只是没产出，撑到第 3 天才饿得跑出围栏
      tr.feed = 0;
      tr.unfed++;
      if (tr.unfed >= UNFED_LIMIT) {
        for (const a of G.animals) if (a.type === tr.type) a.tired = true;
        if (tr.unfed === UNFED_LIMIT) note('logStarveOut', { animal: nm('animal', tr.type) });
        else note('logStillHungry', { animal: nm('animal', tr.type), n: tr.unfed });
      }
    }
  }
}
// 天亮了：小鸡长大 / 孵蛋器推进一天
function dailyChickenUpdate() {
  // ⓪ 新的一天：每只母鸡重新获得「今天的那个蛋」
  //    下蛋时刻随机落在这一天里（一天 240 秒），所以不会每天都在同一秒下蛋
  for (const a of G.animals) {
    if (!isHen(a)) continue;
    a.laidToday = false;
    a.eggT = rand(30, 180);
  }
  // ① 小鸡长大（母鸡满 5 只就保持原样）
  for (const a of G.animals) {
    if (!isChick(a)) continue;
    a.growT++;
    if (a.growT >= CHICK_GROW_DAYS) {
      if (countHens() < maxHens()) {
        a.stage = 'hen'; a.growT = 0; a.eggT = rand(30, 180); a.laidToday = false;
        spawnParticles(a.x, a.y - 18, '✨', 6);
        sfx.sparkle();
        note('logChickGrew');
      } else {
        a.growT = CHICK_GROW_DAYS;   // 保持原样，等母鸡位置空出来
        note('logHensFull', { max: maxHens() });
      }
    }
  }
  // ② 孵蛋器：15 天后孵出小鸡
  for (let i = G.incubating.length - 1; i >= 0; i--) {
    const e = G.incubating[i];
    e.left--;
    if (e.left <= 0) {
      if (countChicks() >= maxChicks()) { e.left = 1; continue; }   // 小鸡满了，再等等
      G.incubating.splice(i, 1);
      const c = spawnChick();
      if (c) {
        sfx.chick();
        note('logHatched');
      }
    }
  }
}
// 拿一个鸡蛋放进孵蛋器
function putEggInHatchery() {
  if (G.incubating.length >= maxIncubate()) { sfx.error(); say('hatchFull', { max: maxIncubate() }); return; }
  if (!removeItem('egg')) { sfx.error(); say('noEggForHatch'); return; }
  G.incubating.push({ left: HATCH_DAYS });
  sfx.pop();
  spawnParticles(ZONES.hatchery.x, ZONES.hatchery.y - 40, '🥚', 3);
  say('logHatchPut');
  saveGame(true);
}

// ---------------- 存档 / 读档（localStorage，按名字分档） ----------------
// 一台电脑上可以有很多个小朋友：每个名字一个存档，互不影响
const SAVE_EVERY = 10;             // 每 10 秒自动存一次
const OLD_SAVE_KEY = 'happy-farm-save-v1';    // 旧版本的单存档，会自动搬进来
const SAVE_KEY = 'happy-farm-save-v2';        // 当前正在玩的那一档（自动存档写这里）
const SAVE_INDEX = 'happy-farm-profiles-v1';  // 名字列表（含摘要）
const LAST_NAME_KEY = 'happy-farm-last-name';
const MAX_PROFILES = 12;
const MAX_NAME_LEN = 8;

// 当前玩家名字（每档的「档名」）；pid = 在存档列表里的下标
let playerName = '';
let playerPid = -1;
function slotKey(i) { return 'happy-farm-save-p' + i; }

// 开局随机名字（都控制在 3 个字以内）
const RANDOM_NAMES = [
  '小明', '小红', '小刚', '小美', '小星', '小豆', '小虎', '小兔', '小鹿', '小熊',
  '小雨', '小云', '小沐', '小满', '小禾', '小穗', '小果', '小朵', '小糖', '小铃',
  '阿宝', '阿福', '阿吉', '豆豆', '糖糖', '团团', '圆圆', '乐乐', '欢欢', '多多',
  '毛毛', '球球', '布丁', '团子', '年年', '贝贝', '点点', '闪闪', '花花', '喵喵',
];
// 生成一个「这台电脑上还没人用」的随机名字；万一都占了就加个数字
function randomName() {
  const used = {};
  loadIndex().forEach(function (p) { used[nameKey(p.name)] = 1; });
  const free = RANDOM_NAMES.filter(function (n) { return !used[n.toLowerCase()]; });
  if (free.length) return pick(free);
  for (let i = 0; i < 60; i++) {
    const n = pick(RANDOM_NAMES) + (2 + Math.floor(Math.random() * 9));
    if (!used[n.toLowerCase()]) return n.slice(0, MAX_NAME_LEN);
  }
  return pick(RANDOM_NAMES);
}

// 名字统一处理：去空格 + 限制长度
function normalizeName(s) { return String(s == null ? '' : s).trim().slice(0, MAX_NAME_LEN); }
function nameKey(s) { return normalizeName(s).toLowerCase(); }

function loadIndex() {
  try {
    const raw = localStorage.getItem(SAVE_INDEX);
    const a = raw ? JSON.parse(raw) : [];
    if (Array.isArray(a)) return a.filter(p => p && typeof p.name === 'string' && Number.isFinite(p.pid));
  } catch (e) {}
  return [];
}
function writeIndex(list) {
  try { localStorage.setItem(SAVE_INDEX, JSON.stringify(list)); return true; }
  catch (e) { return false; }
}
function getLastProfile() {
  try { const n = localStorage.getItem(LAST_NAME_KEY); return n ? normalizeName(n) : null; } catch (e) { return null; }
}
function setLastProfile(name) { try { localStorage.setItem(LAST_NAME_KEY, name); } catch (e) {} }
function pidInUse(pid) { return loadIndex().some(x => x.pid === pid); }
function freePid() { for (let i = 0; i < MAX_PROFILES; i++) if (!pidInUse(i)) return i; return -1; }
function profileFor(name) {
  const k = nameKey(name);
  return loadIndex().find(x => nameKey(x.name) === k) || null;
}
// 旧版本单存档 → 搬进多存档（第一个名字）
function migrateOldSave() {
  let raw = null;
  try { raw = localStorage.getItem(OLD_SAVE_KEY); } catch (e) {}
  if (!raw) return;
  try { if (JSON.parse(raw)) { try { localStorage.setItem(slotKey(0), raw); } catch (e) {} } } catch (e) {}
  try { localStorage.removeItem(OLD_SAVE_KEY); } catch (e) {}
  const list = loadIndex();
  if (!list.some(x => x.pid === 0)) {
    let nm = '小农夫';
    try { const d = JSON.parse(raw); if (d && d.profile && d.profile.name) nm = normalizeName(d.profile.name) || nm; } catch (e) {}
    list.unshift({ pid: 0, name: nm, savedAt: 0, day: 1, coins: 20 });
    writeIndex(list);
  }
  setLastProfile(loadIndex()[0].name);
}
migrateOldSave();
// 还没开始玩也把正在玩的那一档的名字准备好（开始界面要用）
(function initCurrentName() {
  const last = getLastProfile();
  const list = loadIndex();
  const p = (last && profileFor(last)) || list[0] || null;
  if (p) { playerName = p.name; playerPid = p.pid; }
})();

// 取某一档的存档数据（不传就用当前这一档）
// ★ 这里**不能把版本号写死**：v1 是很早的老存档、v2 是现在的，
//   以后再加版本也要能读出来（真正的兼容处理都在 loadGame 里按 d.v 做）。
function readSave(name) {
  const parse = function (raw) {
    if (!raw) return null;
    try {
      const d = JSON.parse(raw);
      if (!d || typeof d !== 'object') return null;
      if (!(Number(d.v) >= 1)) return null;      // 完全没有版本号的不是存档
      return d;
    } catch (e) { return null; }
  };
  let pid = playerPid;
  if (name !== undefined) { const p = profileFor(name); pid = p ? p.pid : -1; }
  if (pid < 0) {
    // 还没有任何档案时的兜底：尝试旧的单存档键
    return parse(localStorage.getItem(SAVE_KEY)) || parse(localStorage.getItem(OLD_SAVE_KEY));
  }
  return parse(localStorage.getItem(slotKey(pid)));
}
function hasSave() { return readSave() !== null; }
// 开始界面上的存档列表（按最近保存排序）
function listProfiles() {
  return loadIndex()
    .map(p => ({ p, d: readSave(p.name) }))
    .sort((a, b) => ((b.d && b.d.savedAt) || b.p.savedAt || 0) - ((a.d && a.d.savedAt) || a.p.savedAt || 0));
}
function deleteProfile(name) {
  const p = profileFor(name);
  if (!p) return false;
  try { localStorage.removeItem(slotKey(p.pid)); } catch (e) {}
  writeIndex(loadIndex().filter(x => x.pid !== p.pid));
  if (playerPid === p.pid) {
    const rest = loadIndex();
    playerPid = rest.length ? rest[0].pid : -1;
    playerName = rest.length ? rest[0].name : '';
  }
  if (nameKey(getLastProfile() || '') === nameKey(p.name)) setLastProfile(playerName || '');
  return true;
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  if (playerPid >= 0) { try { localStorage.removeItem(slotKey(playerPid)); } catch (e) {} }
}

// 存档本身不弹提示、不写日志 —— 右上角的 💾 闪一下就是「存好了」
function saveGame(silent = true) {
  if (!G.started) return false;   // 还没开始玩就不存
  // 还没定名字（比如直接继续了旧存档）：自动补一个
  if (playerPid < 0) {
    let pid = 0; while (pidInUse(pid)) pid++;
    if (pid >= MAX_PROFILES) return false;
    playerPid = pid;
    if (!playerName) playerName = '小农夫';
    const list = loadIndex(); list.push({ pid, name: playerName, savedAt: 0, day: G.day, coins: G.coins });
    writeIndex(list);
    setLastProfile(playerName);
  }
  const data = {
    v: SAVE_V,
    profile: { name: playerName },
    coins: G.coins, day: G.day, timeMin: G.timeMin, weather: G.weather,
    inventory: G.inventory, owned: G.owned, petHatsOwned: G.petHatsOwned,
    levels: { ...G.levels },
    player: {
      x: G.player.x, y: G.player.y, dir: G.player.dir,
      gender: G.player.gender, outfit: { ...G.player.outfit },
    },
    pets: G.pets.map(p => ({ type: p.type, hat: p.hat, hunger: p.hunger, poop: p.poop,
                             clean: p.clean, x: p.x, y: p.y })),
    animals: G.animals.map(a => ({ type: a.type, x: a.x, y: a.y, wool: a.wool, milkReady: a.milkReady,
                                   stage: a.stage, growT: a.growT, tired: a.tired,
                                   eggT: a.eggT, laidToday: a.laidToday })),
    troughs: TROUGHS.map(tr => ({ id: tr.id, feed: tr.feed, unfed: tr.unfed })),
    vehicles: G.vehicles.slice(),
    vehicle: G.vehicle,
    mushrooms: MUSHROOMS.map(m => (m.picked ? 1 : 0)),
    incubating: G.incubating.map(e => ({ left: e.left })),
    plots: G.plots.map(p => ({ state: p.state, crop: p.crop, timer: p.timer, watered: p.watered })),
    trees: G.trees.map(t => ({ type: t.type, fruits: t.fruits, timer: t.timer })),
    items: G.groundItems.map(i => ({ id: i.id, x: i.x, y: i.y })),
    decorations: G.decorations.map(d => ({ id: d.id, x: d.x, y: d.y })),
    zoo: G.zoo.map(z => ({ type: z.type, x: z.x, y: z.y })),
    tank: G.tank.slice(0, maxTank()),
    seaCaught: G.seaCaught,
    hive: { honey: HIVE.honey, honeyT: HIVE.honeyT },
    music: musicOn, muted,
    savedAt: Date.now(),
  };
  const json = JSON.stringify(data);
  try {
    localStorage.setItem(slotKey(playerPid), json);
    localStorage.setItem(SAVE_KEY, json);         // 兼容旧键
    setLastProfile(playerName);
    const list = loadIndex();
    const rec = list.find(x => x.pid === playerPid);
    if (rec) { rec.name = playerName; rec.savedAt = data.savedAt; rec.day = G.day; rec.coins = G.coins; }
    else list.push({ pid: playerPid, name: playerName, savedAt: data.savedAt, day: G.day, coins: G.coins });
    writeIndex(list);
    G.saveT = 0;
    flashSaveIcon();
    return true;
  } catch (e) {
    if (!silent) { toast(t('saveFailed'), 2400); }
    return false;
  }
}

function loadGame(name) {
  // 指定名字就切到那一档（多人同机：各自的牧场互不影响）
  if (name !== undefined && name !== null && name !== '') {
    const p = profileFor(name);
    if (p) { playerPid = p.pid; playerName = p.name; setLastProfile(p.name); }
  }
  const d = readSave();
  if (!d) return false;
  try {
    if (d.profile && d.profile.name) playerName = normalizeName(d.profile.name) || playerName;
    G.coins = Number.isFinite(d.coins) ? d.coins : 20;
    G.day = Number.isFinite(d.day) ? d.day : 1;
    G.timeMin = Number.isFinite(d.timeMin) ? d.timeMin : DAY_START;
    G.weather = ['sunny', 'cloudy', 'rain'].includes(d.weather) ? d.weather : 'sunny';
    G.inventory = (d.inventory && typeof d.inventory === 'object') ? d.inventory : {};
    for (const k in G.inventory) if (!ITEMS[k] || !(G.inventory[k] > 0)) delete G.inventory[k];   // 丢掉旧版本残留物品
    G.owned = d.owned || { hat: ['ragged'], shirt: ['ragged'], pants: ['ragged'] };
    // 服饰分类多了头饰 / 裙子 / 鞋子三种，老存档按新结构补齐
    for (const cat of ['hat', 'hair', 'shirt', 'dress', 'pants', 'shoes']) {
      if (!Array.isArray(G.owned[cat])) G.owned[cat] = [];
      G.owned[cat] = G.owned[cat].filter(k => OUTFITS[cat] && OUTFITS[cat][k]);
    }
    if (G.owned.hat.indexOf('ragged') < 0) G.owned.hat.push('ragged');
    if (G.owned.shirt.indexOf('ragged') < 0) G.owned.shirt.push('ragged');
    if (G.owned.pants.indexOf('ragged') < 0) G.owned.pants.push('ragged');
    // 设施等级（老存档没有这个字段 → 全部按 1 级）
    G.levels = {};
    for (const f of FACILITY_ORDER) {
      const v = d.levels && Number(d.levels[f]);
      G.levels[f] = Number.isFinite(v) ? Math.max(1, Math.min(MAX_LV, Math.round(v))) : 1;
    }
    applyLevels();          // ★ 先把等级写进地图，后面恢复动物/果树坐标才对得上
    G.petHatsOwned = Array.isArray(d.petHatsOwned) ? d.petHatsOwned : [];
    G.vehicles = Array.isArray(d.vehicles) ? d.vehicles.filter(function (v) { return VEHICLE_MAP[v]; }) : [];
    G.vehicle = (d.vehicle && G.vehicles.indexOf(d.vehicle) >= 0) ? d.vehicle : null;
    if (d.player) {
      if (Number.isFinite(d.player.x)) G.player.x = Math.max(20, Math.min(WORLD_W - 20, d.player.x));
      if (Number.isFinite(d.player.y)) G.player.y = Math.max(120, Math.min(WORLD_H - 20, d.player.y));
      G.player.dir = d.player.dir || 'down';
      G.player.gender = d.player.gender === 'girl' ? 'girl' : 'boy';
      if (d.player.outfit) {
        const of = d.player.outfit;
        G.player.outfit = {
          hat: OUTFITS.hat[of.hat] ? of.hat : 'ragged',
          hair: (OUTFITS.hair && OUTFITS.hair[of.hair]) ? of.hair : 'none',
          shirt: OUTFITS.shirt[of.shirt] ? of.shirt : 'ragged',
          dress: (OUTFITS.dress && OUTFITS.dress[of.dress]) ? of.dress : 'none',
          pants: OUTFITS.pants[of.pants] ? of.pants : 'ragged',
          shoes: (OUTFITS.shoes && OUTFITS.shoes[of.shoes]) ? of.shoes : 'none',
        };
      }
    }
    // 老存档（v1）是在旧地图上存的，坐标已经对不上新布局了：
    // 把主角直接送回「主角家」门口（动物在下面也各自送回棚舍）
    if (Number(d.v || 1) < SAVE_V) {
      G.player.x = PLAYER_SPAWN.x; G.player.y = PLAYER_SPAWN.y; G.player.dir = 'down';
    }
    // 宠物：新存档是数组；老存档只有一只，搬进来
    G.pets = [];
    const petSrc = Array.isArray(d.pets) ? d.pets : (d.pet ? [d.pet] : []);
    petSrc.slice(0, maxPets()).forEach(function (sp, i) {
      const p = newPet(sp.type, G.player.x - 40 - i * 34, G.player.y + 30 + i * 16);
      p.hat = (sp.hat && OUTFITS.hat[sp.hat]) ? sp.hat : 'none';
      if (Number.isFinite(sp.hunger)) p.hunger = Math.max(0, Math.min(100, sp.hunger));
      if (Number.isFinite(sp.poop)) p.poop = Math.max(0, Math.min(3, Math.round(sp.poop)));
      if (Number.isFinite(sp.clean)) p.clean = Math.max(0, Math.min(100, sp.clean));
      G.pets.push(p);
    });
    if (!G.pets.length) G.pets.push(newPet(chosenPet, G.player.x - 40, G.player.y + 30));
    // 动物（老存档里的鸡都是成年母鸡；小鸡记录生长天数）
    if (Array.isArray(d.animals) && d.animals.length) {
      const oldMap = Number(d.v || 1) < SAVE_V;   // 老地图的坐标不能用了 → 直接放回自己的棚舍
      G.animals = d.animals.filter(a => a && PENS[a.type]).map(a => {
        const useHome = oldMap || !Number.isFinite(a.x) || !Number.isFinite(a.y);
        const na = newAnimal(a.type, useHome ? PENS[a.type].home.x + rand(-24, 24) : a.x,
                                      useHome ? PENS[a.type].home.y + rand(-16, 16) : a.y,
                                      a.stage === 'chick' ? 'chick' : 'hen');
        if (typeof a.wool === 'number') na.wool = a.wool;
        na.milkReady = a.milkReady !== false;
        if (na.stage === 'chick') na.growT = Number.isFinite(a.growT) ? Math.max(0, Math.min(CHICK_GROW_DAYS, a.growT)) : 0;
        na.tired = a.tired === true;
        // 「今天下过蛋没有」也要存：不然读档之后同一只母鸡一天能下两个
        na.laidToday = a.laidToday === true;
        if (Number.isFinite(a.eggT)) na.eggT = Math.max(1, Math.min(240, a.eggT));
        return na;
      });
      if (!G.animals.length) {
        const h = PENS.chicken.home;
        G.animals = [newAnimal('chicken', h.x, h.y)];
      }
    }
    // 森林蘑菇（哪些被采走了）
    freshMushroom();
    if (Array.isArray(d.mushrooms)) d.mushrooms.forEach(function (v, i) { if (MUSHROOMS[i]) MUSHROOMS[i].picked = v === 1; });
    // 食槽（饲料）
    if (Array.isArray(d.troughs)) {
      for (const rec of d.troughs) {
        const tr = TROUGHS.find(v => v.id === rec.id);
        if (!tr) continue;
        tr.feed = Number.isFinite(rec.feed) ? Math.max(0, Math.min(FEED_MAX, Math.round(rec.feed))) : tr.feed;
        tr.unfed = Number.isFinite(rec.unfed) ? Math.max(0, Math.round(rec.unfed)) : 0;
      }
    }
    // 孵蛋器
    G.incubating = Array.isArray(d.incubating)
      ? d.incubating.filter(e => e && Number.isFinite(e.left)).slice(0, maxIncubate())
                    .map(e => ({ left: Math.max(1, Math.min(HATCH_DAYS, Math.round(e.left))) }))
      : [];
    // 蜂巢（森林里的蜂蜜）
    if (d.hive) {
      HIVE.honey = Number.isFinite(d.hive.honey) ? Math.max(0, Math.min(HIVE.max, d.hive.honey)) : 1;
      HIVE.honeyT = Number.isFinite(d.hive.honeyT) ? Math.max(0, d.hive.honeyT) : 0;
    }
    // 田地（按下标恢复）
    if (Array.isArray(d.plots)) {
      d.plots.forEach((p, i) => {
        const pl = G.plots[i];
        if (!pl || !p) return;
        pl.state = ['grass', 'tilled', 'seed', 'growing', 'ripe'].includes(p.state) ? p.state : 'grass';
        pl.crop = (p.crop && ITEMS[p.crop]) ? p.crop : null;
        pl.timer = Number.isFinite(p.timer) ? p.timer : 0;
        pl.watered = !!p.watered;
      });
    }
    // 果树：按存档里的顺序重新落到果树园的树坑里（升级后树坑变多）
    if (Array.isArray(d.trees) && d.trees.length) {
      G.trees = [];
      d.trees.slice(0, maxOrchard()).forEach(function (t) {
        if (!t || FRUIT_IDS.indexOf(t.type) < 0) return;
        const tr = orchardTree(t.type, G.trees.length);
        if (!tr) return;
        tr.fruits = Number.isFinite(t.fruits) ? Math.max(0, Math.min(3, t.fruits)) : tr.fruits;
        tr.timer = Number.isFinite(t.timer) ? t.timer : 0;
        G.trees.push(tr);
      });
      if (!G.trees.length) G.trees.push(orchardTree('apple', 0));
    }
    // 地上的物品
    G.groundItems = Array.isArray(d.items)
      ? d.items.filter(i => i && ITEMS[i.id] && Number.isFinite(i.x) && Number.isFinite(i.y))
               .map(i => ({ id: i.id, x: i.x, y: i.y, phase: rand(0, 6) }))
      : [];
    // 动物园的观赏动物
    if (Array.isArray(d.zoo)) {
      const oldMap = Number(d.v || 1) < SAVE_V;
      G.zoo = d.zoo.filter(z => z && ZOO_MAP[z.type] && (oldMap || (Number.isFinite(z.x) && Number.isFinite(z.y))))
                   .map(z => {
                     if (oldMap) { const sp = zooRandomSpot(ZOO_AREA); return newZoo(z.type, sp.x, sp.y); }
                     return newZoo(z.type, z.x, z.y);
                   });
    }
    // 水族箱（只收鱼类/海洋生物，最多 20）
    G.tank = Array.isArray(d.tank) ? d.tank.filter(id => SEA_SET[id]).slice(0, maxTank()) : [];
    // 钓鱼图鉴
    G.seaCaught = (d.seaCaught && typeof d.seaCaught === 'object') ? d.seaCaught : {};
    for (const k in G.seaCaught) if (!ITEMS[k]) delete G.seaCaught[k];
    // 自己摆放的装饰
    G.decorations = Array.isArray(d.decorations)
      ? d.decorations.filter(v => v && DECOR_R[v.id] && Number.isFinite(v.x) && Number.isFinite(v.y))
                      .map(v => ({ id: v.id, x: v.x, y: v.y, phase: rand(0, 6) }))
      : [];
    // 音效设置
    if (typeof d.music === 'boolean') { musicOn = d.music; syncMusicButton(); }
    if (typeof d.muted === 'boolean') setMuted(d.muted);
    // 清掉临时状态
    G.customers = []; G.particles = []; G.fishing = null;
    G.sleepFade = 0; G.sleepDawn = false; G.bed = { active: false, step: 0, done: [false, false, false] };
    G.customerTimer = rand(20, 40); G.visitorTimer = rand(8, 20);
    renderInventory(); renderHUD();
    return true;
  } catch (e) { return false; }
}

// 存档小图标闪一下
function flashSaveIcon() {
  const b = $('save-box');
  if (!b) return;
  b.classList.add('flash');
  clearTimeout(flashSaveIcon._t);
  flashSaveIcon._t = setTimeout(() => b.classList.remove('flash'), 700);
}

// 全新开始（清空进度）
function resetGame() {
  G.coins = 20; G.day = 1; G.timeMin = DAY_START; G.weather = 'sunny';
  G.inventory = { seed_carrot: 2 };
  // 一开始只有「破帽子 + 破衣服 + 破裤子」，头饰 / 裙子 / 鞋子都还没有
  G.owned = { hat: ['ragged'], hair: [], shirt: ['ragged'], dress: [], pants: ['ragged'], shoes: [] };
  G.petHatsOwned = [];
  G.vehicles = []; G.vehicle = null;
  // 十个设施全部从 1 级开始
  G.levels = { coop: 1, sheep: 1, cow: 1, orchard: 1, pond: 1, tank: 1, kitchen: 1, wardrobe: 1, shop: 1 };
  G.player.x = PLAYER_SPAWN.x; G.player.y = PLAYER_SPAWN.y; G.player.dir = 'down';
  G.player.gender = chosenGender;
  G.player.outfit = { hat: 'ragged', hair: 'none', shirt: 'ragged', dress: 'none', pants: 'ragged', shoes: 'none' };
  // 一只初始宠物
  G.pets = [newPet(chosenPet, PLAYER_SPAWN.x - 50, PLAYER_SPAWN.y + 20)];
  G.groundItems = []; G.customers = []; G.particles = [];
  G.plots = []; G.trees = []; G.decor = []; G.animals = []; G.incubating = [];
  TROUGHS.forEach(tr => { tr.feed = 8; tr.unfed = 0; });
  freshMushroom();
  G.decorations = []; G.placing = null; G.zoo = []; G.seaCaught = {}; G.tank = [];
  HIVE.honey = 1; HIVE.honeyT = 0;
  G.fishing = null; G.sleepFade = 0; G.sleepDawn = false;
  G.bed = { active: false, step: 0, done: [false, false, false] };
  G.customerTimer = 18; G.visitorTimer = 12; G.ambientT = 6; G.saveT = 0;
  applyLevels();          // ★ 先把等级写进地图（围栏/水坑/水族箱尺寸）
  initWorld();
  renderInventory(); renderHUD();
}

// ---------------- 动物园观赏动物 ----------------
function newZoo(type, x, y) {
  const z = ZOO_MAP[type] || ZOO_SHOP[0];
  loadEmoji(z.cp);                 // 预加载动画图
  return {
    type, x, y, dir: Math.random() < .5 ? 'left' : 'right',
    moving: false, walkPhase: 0, phase: rand(0, 6),
    tx: x, ty: y, waitT: rand(1, 4), voiceT: rand(6, 22), speedK: 0,
    home: { x, y, r: 230 },
  };
}
// 农场里「盖了建筑 / 不能摆东西」的大块区域（按各设施**当前等级**的占地算）。
// 观赏动物散步时绕开它们，摆装饰时也不能摆进去。
// ★ 用当前等级（不是 3 级最大范围），是为了让白色虚线框里的升级预留地保持「空草地」，
//   小朋友可以先把装饰摆在那儿 —— 等扩建压上来，render() 会把装饰画在最外层。
function solidRects(lv) {
  const cur = (f) => Math.max(1, Math.min(MAX_LV, lv || lvOf(f)));
  const orr = ORCHARD_RECTS[cur('orchard') - 1];
  const ts = TANK_SIZE[cur('tank') - 1], k = STALL_SCALE[cur('shop') - 1], fr = FARM_RECTS[cur('farm') - 1];
  const h = ZONES.house;
  return [
    { x: h.x - 12, y: h.y - 104, w: 144, h: 160 },                                  // 主角家
    { x: ZONES.wardrobe.x - 20, y: ZONES.wardrobe.y - 34, w: 40, h: 52 },           // 衣柜
    { x: ZONES.kitchen.x - 22, y: ZONES.kitchen.y - 22, w: 44, h: 40 },             // 厨房
    { x: ZONES.bin.x - 22, y: ZONES.bin.y - 22, w: 44, h: 42 },                     // 卖货箱
    { x: ZONES.counter.x - 68, y: ZONES.counter.y - 108, w: 136, h: 124 },         // 销售门面
    { x: PET_SPOTS.food.x - 24,  y: PET_SPOTS.food.y - 26,  w: 48, h: 42 },          // 🍖 宠物粮食
    { x: PET_SPOTS.clean.x - 26, y: PET_SPOTS.clean.y - 22, w: 52, h: 38 },          // 🧹 砂盆
    { x: PET_SPOTS.bath.x - 28,  y: PET_SPOTS.bath.y - 30,  w: 56, h: 46 },          // 🛁 浴缸
    { x: orr.x, y: orr.y, w: orr.w, h: orr.h },                                     // 果树园
    { x: ZONES.tank.x - ts.w / 2 - 10, y: ZONES.tank.y - ts.h - 18, w: ts.w + 20, h: ts.h + 36 }, // 大水族箱
    { x: ZONES.stall.x - 47 * k, y: ZONES.stall.y + 20 - 92 * k, w: 94 * k, h: 116 * k },         // 商店摊位
    { x: fr.x, y: fr.y, w: fr.w, h: fr.h },                                         // 农田
    { x: PENS.chicken.x, y: PENS.chicken.y, w: PENS.chicken.w, h: PENS.chicken.h }, // 鸡棚
    { x: PENS.sheep.x, y: PENS.sheep.y, w: PENS.sheep.w, h: PENS.sheep.h },         // 羊棚
    { x: PENS.cow.x, y: PENS.cow.y, w: PENS.cow.w, h: PENS.cow.h },                 // 牛棚
  ];
}

// 摆好的装饰是不是正好被建筑压住了（被压住的要画在最外层，不然会看不见）
function decorUnderBuilding(dc, solids) {
  const list = solids || solidRects();
  for (const s of list) {
    if (dc.x > s.x - 4 && dc.x < s.x + s.w + 4 && dc.y > s.y - 4 && dc.y < s.y + s.h + 4) return true;
  }
  return false;
}

// 随机找一个能站的位置（不落水、不出界、不站到建筑上）
function zooRandomSpot(home) {
  const solids = solidRects();
  for (let i = 0; i < 12; i++) {
    const x = Math.max(40, Math.min(WORLD_W - 40, home.x + rand(-home.r, home.r)));
    const y = Math.max(150, Math.min(WORLD_H - 30, home.y + rand(-home.r, home.r)));
    let wet = false;
    for (const pc of PONDS) {
      const ex = (x - pc.x) / (pc.w / 2 + 40), ey = (y - pc.y) / (pc.h / 2 + 40);
      if (ex * ex + ey * ey <= 1) { wet = true; break; }
    }
    if (wet) continue;
    if (pointInSea(x, y)) continue;
    if (solids.some(r => x > r.x - 26 && x < r.x + r.w + 26 && y > r.y - 26 && y < r.y + r.h + 26)) continue;
    return { x, y };
  }
  return { x: home.x, y: home.y };
}

// ---------------- 交通工具：骑上 / 停下 ----------------
function mountVehicle(id) {
  if (!VEHICLE_MAP[id]) return;
  G.vehicle = id;
  sfx.equip();
  spawnParticles(G.player.x, G.player.y - 10, '💨', 5);
  say('mounted', { v: nm('vehicle', id) }, 2200, false, { icon: VEHICLE_MAP[id].icon, sub: t('mountedSub') });
  saveGame(true);
}
function dismountVehicle() {
  const id = G.vehicle;
  if (!id) return;
  G.vehicle = null;
  sfx.close();
  spawnParticles(G.player.x, G.player.y - 10, '✨', 4);
  say('parked', { v: nm('vehicle', id) }, 2000);
  saveGame(true);
}
// 走到停车架旁边按 E：没骑就骑上（没车就先提示去买），骑着就停下
function useRack() {
  if (G.vehicle) { dismountVehicle(); return; }
  if (!G.vehicles.length) { sfx.error(); say('noVehicle', null, 2600); return; }
  mountVehicle(G.vehicles[G.vehicles.length - 1]);   // 默认骑最新买的那辆
}

// ---------------- 卖东西：找零钱小挑战（小学二年级难度） ----------------
// 客人可能一次买**好几件**东西（比如「2 个苹果」或者「1 个苹果 + 1 个鸡蛋」），
// 流程和老师教的一样：
//   ① 先把算式写出来 —— 屏幕上给出完整的算式，比如 `100 − 38 × 2 = ?`
//   ② 再一步一步算 —— 先算总价（乘 / 加），再算找零（减）
// 每一步答对才进入下一步，全部答对才成交。
const MATH_TIME = 26;                    // 两步题给 26 秒
// 客人实际付的钱 = 基础价 × 1.5（和 resolveCustomerSale() 结算时完全一致）
function salePriceOf(id) { return Math.round((ITEMS[id] ? ITEMS[id].price : 0) * 1.5); }

// 购物篮：{ items: [{id, qty}], total }
function basketTotal(items) {
  return items.reduce(function (s, it) { return s + salePriceOf(it.id) * it.qty; }, 0);
}
// 挑一张「刚够付」的整钱：付款额一定是 5 的倍数，找零至少 5、最多 99
function coinChoices(price) {
  const step = price < 20 ? 5 : (price < 100 ? 10 : 50);
  for (let k = 1; k <= 40; k++) {
    const pay = price + k * step;
    const change = pay - price;
    if (pay % 5 === 0 && change >= 5 && change <= 99 && change % 5 === 0) {
      return { pay: pay, change: change };
    }
  }
  const base = Math.ceil((price + 5) / 10) * 10;
  return { pay: base, change: base - price };
}
// 生成四个选项：一个正确答案 + 三个贴近答案的错项
function makeChoices(correct) {
  const set = [correct];
  const near = [1, 2, 5, 10, 3, 4, 20, 6, 8];
  const cand = [];
  for (let i = 0; i < near.length; i++) {
    cand.push(correct + near[i]);
    if (correct - near[i] > 0) cand.push(correct - near[i]);
  }
  cand.sort(function () { return Math.random() - 0.5; });
  for (let i = 0; i < cand.length && set.length < 4; i++) {
    const v = cand[i];
    if (v > 0 && set.indexOf(v) < 0) set.push(v);
  }
  let extra = 1;
  while (set.length < 4) { if (set.indexOf(correct + extra) < 0) set.push(correct + extra); extra++; }
  set.sort(function () { return Math.random() - 0.5; });
  return set;
}

// 把购物篮翻译成「算式 + 分步」。
//   1 件 × n 个 ： 100 − 38 × 2 = ?   → 第一步 38×2，第二步 100−76
//   2 件各 1 个 ： 100 − (24 + 15) = ? → 第一步 24+15，第二步 100−39
//   1 件 × 1 个 ： 50 − 24 = ?         → 只有一步 50−24
function buildMathSteps(items, total, paid) {
  const steps = [];
  if (items.length === 1 && items[0].qty > 1) {
    const it = items[0], unit = salePriceOf(it.id);
    steps.push({ kind: 'mul', expr: unit + ' × ' + it.qty, plain: unit + ' × ' + it.qty,
                 answer: unit * it.qty, choices: makeChoices(unit * it.qty) });
  } else if (items.length > 1) {
    const a = salePriceOf(items[0].id), b = salePriceOf(items[1].id);
    steps.push({ kind: 'add', expr: a + ' + ' + b, plain: a + ' + ' + b,
                 answer: a + b, choices: makeChoices(a + b) });
  }
  const sub = { kind: 'sub', expr: paid + ' − ' + total, plain: paid + ' − ' + total,
                answer: paid - total, choices: makeChoices(paid - total) };
  steps.push(sub);
  return steps;
}
// 完整算式的字符串（第一步的结果先留着空位）
function mathExpressionText(m) {
  const items = m.items || [{ id: m.item, qty: 1 }];
  if (items.length === 1 && items[0].qty > 1) {
    return m.paid + ' − ' + salePriceOf(items[0].id) + ' × ' + items[0].qty + ' = ?';
  }
  if (items.length > 1) {
    const parts = items.map(it => salePriceOf(it.id) + (it.qty > 1 ? ' × ' + it.qty : ''));
    return m.paid + ' − (' + parts.join(' + ') + ') = ?';
  }
  return m.paid + ' − ' + salePriceOf(items[0].id) + ' = ?';
}
function openMathChallenge(c) {
  const items = (c.items && c.items.length) ? c.items.map(it => ({ id: it.id, qty: it.qty }))
                                            : [{ id: c.want, qty: 1 }];
  const total = basketTotal(items);
  const cc = coinChoices(total);
  const steps = buildMathSteps(items, total, cc.pay);
  G.math = {
    c: c, item: items[0].id, items: items,
    price: items.length === 1 ? salePriceOf(items[0].id) : total,
    total: total, paid: cc.pay, change: cc.change,
    steps: steps, step: 0,
    choices: steps[0].choices,
    t: MATH_TIME,
    payLabel: t('coinUnit', { n: cc.pay }),
  };
  G.modalOpen = 'math-modal';
  renderMathChallenge();
  const el = $('math-modal');
  if (el) el.classList.remove('hidden');
  sfx.open();
}
function closeMathChallenge() {
  G.math = null;
  const el = $('math-modal');
  if (el) el.classList.add('hidden');
  if (G.modalOpen === 'math-modal') G.modalOpen = null;
}
function renderMathChallenge() {
  const q = $('math-question'), box = $('math-choices'), info = $('math-info'), bar = $('math-bar');
  if (!q || !box || !G.math) return;
  const m = G.math;
  // ① 第一行：买了什么 / 单价 / 给了多少 —— 做成小圆牌，多买几件也不会变成一大段话
  const chips = [];
  m.items.forEach(function (it) {
    chips.push('<span class="math-chip"><span class="ci">' + ITEMS[it.id].icon + '</span>' +
               nm('item', it.id) + (it.qty > 1 ? ' ×' + it.qty : '') + '</span>');
  });
  if (m.items.length === 1 && m.items[0].qty > 1) {
    chips.push('<span class="math-chip">' + t('eachFor', { n: salePriceOf(m.items[0].id) }) + '</span>');
  } else if (m.items.length > 1) {
    chips.push('<span class="math-chip">' + m.items.map(function (it) {
      return salePriceOf(it.id) + '💰';
    }).join(' + ') + '</span>');
  }
  chips.push('<span class="math-chip paid">' + t('paidChip', { n: m.paid }) + '</span>');
  q.innerHTML = chips.join('');
  // ② 完整算式 + 分步；数轴只在「算找零」这一步出现
  const step = m.steps[m.step];
  const last = m.step === m.steps.length - 1;
  const stepHtml = m.steps.map(function (s, i) {
    const cls = i < m.step ? 'done' : i === m.step ? 'active' : 'locked';
    const shown = i < m.step ? (s.expr + ' = ' + s.answer) : (s.expr + ' = ?');
    const label = i < m.steps.length - 1 ? t('mathStepTotal') : t('mathStepChange');
    return '<div class="math-step ' + cls + '"><span class="st-label">' + label +
           '</span><span class="st-expr">' + shown + '</span></div>';
  }).join('');
  if (info) {
    info.innerHTML =
      '<div class="math-expr">' + mathExpressionText(m) + '</div>' +
      '<div class="math-steps">' + stepHtml + '</div>' +
      (last ? numberLineHTML(m.total, m.paid) : '');
  }
  box.innerHTML = '';
  m.choices.forEach(function (v) {
    const b = document.createElement('button');
    b.className = 'math-choice';
    b.textContent = v + ' 💰';
    b.onclick = function () { answerMath(v); };
    box.appendChild(b);
  });
  if (bar) bar.style.width = '100%';
}
// 数轴（矮矮一条）：把「算出来的总价」和「付的钱」标在一条线上，一眼看出要往前跳多少
function numberLineHTML(price, paid) {
  const max = Math.max(paid, price) + 4;
  const pPct = (price / max) * 100, dPct = (paid / max) * 100;
  return '<div class="nl2">' +
      '<div class="nl2-track">' +
        '<div class="nl2-fill" style="left:' + pPct + '%;width:' + Math.max(0, dPct - pPct) + '%"></div>' +
      '</div>' +
      '<div class="nl2-dot price" style="left:' + pPct + '%">' + price + '</div>' +
      '<div class="nl2-dot paid" style="left:' + dPct + '%">' + paid + '</div>' +
      '<div class="nl2-legend">' +
        '<span class="price">' + t('nlPrice') + ' ' + price + ' 金币</span>' +
        '<span class="paid">' + t('nlPaid') + ' ' + paid + ' 金币</span>' +
      '</div>' +
    '</div>';
}
// 把金额画成硬币（10 / 5 / 1）
function coinHTML(n) {
  let left = n, out = '';
  const coins = [[10, '#ffd23e', '#d9a62e', '10'], [5, '#ffb84d', '#e09a2f', '5'], [1, '#e8d9b0', '#c9a86a', '1']];
  const MAX = 6;
  let drawn = 0;
  for (let i = 0; i < coins.length; i++) {
    const [val, fill, edge, label] = coins[i];
    while (left >= val && drawn < MAX) {
      out += '<i class="coin" style="background:' + fill + ';border-color:' + edge + '">' + label + '</i>';
      left -= val; drawn++;
    }
  }
  if (left > 0) out += '<i class="coin more">+' + left + '</i>';
  return out;
}
// 客人到底要买哪些东西（成交 / 离开时都要按这个扣货）
function basketOf(c) {
  return (c.items && c.items.length) ? c.items : [{ id: c.want, qty: 1 }];
}
function canFulfillBasket(c) {
  const b = basketOf(c);
  return b.every(function (it) { return (G.inventory[it.id] || 0) >= it.qty; });
}
// 还差哪些东西（客人点单了、小朋友还没收齐的时候提示用）
function basketMissing(c) {
  const b = basketOf(c);
  const miss = [];
  b.forEach(function (it) {
    const have = G.inventory[it.id] || 0;
    if (have < it.qty) miss.push(nm('item', it.id) + ' ' + have + '/' + it.qty);
  });
  return miss.join('、');
}
function takeBasket(c) {
  const b = basketOf(c);
  if (!canFulfillBasket(c)) return false;
  b.forEach(function (it) { removeItem(it.id, it.qty); });
  return true;
}
// 一步一步答题：第一步答对 → 进入第二步；第二步答对 → 成交
function answerMath(v) {
  const m = G.math;
  if (!m) return;
  const c = m.c;
  const step = m.steps[m.step];
  if (v !== step.answer) {
    sfx.error();
    const box = $('math-choices');
    if (box) {
      box.classList.add('shake');
      setTimeout(function () { box.classList.remove('shake'); }, 420);
    }
    toast(t('mathWrong'), 1500);
    return;
  }
  // 这一步对了
  sfx.coin();
  if (m.step < m.steps.length - 1) {
    // 还有下一步（先算总价，再算找零）
    addLog(step.kind === 'mul' ? t('mathNiceMul', { price: salePriceOf(m.items[0].id), n: m.items[0].qty, total: step.answer })
         : step.kind === 'add' ? t('mathNiceAdd', { pa: salePriceOf(m.items[0].id), pb: salePriceOf(m.items[1].id), total: step.answer })
         : '');
    m.step++;
    m.choices = m.steps[m.step].choices;
    renderMathChallenge();
    toast(t('mathStep2Now'), 1400);
    return;
  }
  // 全部算对：成交
  closeMathChallenge();
  if (!takeBasket(c)) { sfx.error(); say('noSuchItem', { item: nm('item', c.want) }); return; }
  const gain = m.total;                       // 和题目里的成交价完全一致
  G.coins += gain; renderHUD();
  coinBurst(c.x, c.y - 30, gain);
  spawnParticles(c.x, c.y - 25, '💖', 6);
  c.state = 'leave'; c.happy = true;
  sfx.happy(); sfx.coin();
  const msg = t('logSoldCustomer', { item: basketLabel(c), name: custName(c), n: gain });
  toast(msg, 2200);
  addLog(msg);
  addLog(t('mathNiceSub', { paid: m.paid, total: m.total, change: m.change }));
  saveGame(true);
}
// 「2 个苹果」/「苹果 + 鸡蛋」这种购物清单的说法
function basketLabel(c) {
  const b = basketOf(c);
  return b.map(function (it) {
    return nm('item', it.id) + (it.qty > 1 ? '×' + it.qty : '');
  }).join(' + ');
}
// 时间到 = 客人等太久，走了
function mathTimeout() {
  const m = G.math;
  if (!m) return;
  const c = m.c;
  closeMathChallenge();
  c.state = 'leave';
  spawnParticles(c.x, c.y - 30, '💦', 3);
  sfx.sad();
  say('logCustomerLeftMath', { name: custName(c) }, 2400);
}
// 客人等不及走了（没卖掉的东西不算）
function resolveCustomerSale(c) {
  if (takeBasket(c)) {
    const gain = basketTotal(basketOf(c));
    G.coins += gain; renderHUD();
    coinBurst(c.x, c.y - 30, gain);
    c.state = 'leave'; c.happy = true;
  }
}

// ---------------- 宠物房间：宠物模型 ----------------
// 一只宠物有「饱腹度 / 便便数 / 清洁度」三个需要照顾的指标。
// 宠物房间 1 级只能养 1 只，升级后能养 2 只、4 只。
function newPet(type, x, y) {
  return {
    type: (type === 'cat' || type === 'duck' || type === 'goose') ? type : 'dog',
    x, y, dir: 'right', moving: false, walkPhase: 0, phase: rand(0, 6),
    hat: 'none', happy: 0, mood: 0,
    hunger: 65,          // 0~100：越低越饿
    poop: 0,             // 0~3：地上的便便
    clean: 100,          // 0~100：越低越脏
    poopT: rand(40, 80), // 下一次拉便便的倒计时（秒）
    sadT: 0,
  };
}
// 这只宠物现在最需要什么（给提示和头顶小图标用）
function petNeed(p) {
  if (p.hunger <= 25) return 'hungry';
  if (p.poop >= 2) return 'poop';
  if (p.clean <= 35) return 'dirty';
  return null;
}
function petNeedIcon(p) {
  const n = petNeed(p);
  return n === 'hungry' ? '🍖' : n === 'poop' ? '💩' : n === 'dirty' ? '🛁' : null;
}
function petIsSad(p) { return petNeed(p) !== null; }

// 宠物的名字（狗 / 猫 / 鸭 / 鹅）
function petName(p) {
  const ty = (p && p.type) || (G.pets[0] && G.pets[0].type) || 'dog';
  if (ty === 'dog') return t('dog');
  if (ty === 'cat') return t('cat');
  if (ty === 'goose') return t('petGoose');
  return t('petDuck');
}

// ---------------- 角色 / 宠物切换（游戏内） ----------------
function setGender(g) {
  G.player.gender = (g === 'girl') ? 'girl' : 'boy';
  sfx.equip(); spawnParticles(G.player.x, G.player.y - 30, '✨', 5);
  say('genderSwitched', { who: t(G.player.gender) });
  saveGame(true); renderWardrobe();
}
function setPet(type) {
  const p = G.pets[0];
  if (!p) return;
  p.type = ['cat', 'duck', 'goose'].includes(type) ? type : 'dog';
  p.happy = 3;
  sfx.petVoice(p.type);
  spawnParticles(p.x, p.y - 20, '💖', 5);
  say('petSwitched', { pet: petName(p) }, 2200, false, { icon: '🐾', sub: t('petSwitchSub') });
  saveGame(true); renderWardrobe();
}

// ---------------- 庭院装饰：放置 ----------------
// 装饰只能摆在**空草地**上：水里、房子 / 围栏 / 农田 / 水族箱上面、大树底下都放不下，
// 这样装饰不会插进建筑里，农场也一直是「房子成排、中间留白」的样子。
function canPlaceAt(id, x, y) {
  const d = DECOR_SHOP.find(v => v.id === id);
  if (!d) return 'tooCrowded';
  // ① 水里 / 干土坑里 / 大海里放不下
  for (const pc of PONDS) {
    const ex = (x - pc.x) / (pc.w / 2 + 20), ey = (y - pc.y) / (pc.h / 2 + 20);
    if (ex * ex + ey * ey < 1) return 'inWater';
  }
  if (pointInSea(x, y) || pointInSea(x - d.r, y) || pointInSea(x + d.r, y) ||
      pointInSea(x, y - d.r) || pointInSea(x, y + d.r)) return 'inWater';
  // ② 建筑、围栏、农田、水族箱、摊位「里面」放不下。
  //    留一点点余量就够（以前留 0.75 倍半径，结果白色虚线框里的升级预留地几乎没法摆东西；
  //    现在就算真的压到建筑边边，render() 也会把装饰画在最外层，所以可以贴得近一点）
  const pad = d.r * 0.3;
  for (const s of solidRects()) {
    if (x > s.x - pad && x < s.x + s.w + pad && y > s.y - pad && y < s.y + s.h + pad) return 'noRoomHere';
  }
  // ③ 森林里的大树和蜂巢旁边留出来（树底下还要长蘑菇呢）
  for (const ft of FOREST_TREES) if (dist(x, y, ft.x, ft.y) < 48 + d.r) return 'noRoomHere';
  if (dist(x, y, HIVE.x, HIVE.y) < 40 + d.r) return 'noRoomHere';
  // ④ 别和已经摆好的装饰挤在一起
  for (const dd of G.decorations) {
    const need = (d.r + (DECOR_R[dd.id] || 20)) * 0.75;
    if (dist(x, y, dd.x, dd.y) < need) return 'tooCrowded';
  }
  return true;
}
function placeDecoration() {
  const id = G.placing.id;
  const d = DECOR_SHOP.find(v => v.id === id);
  const x = Math.max(30, Math.min(WORLD_W - 30, G.player.x));
  const y = Math.max(150, Math.min(WORLD_H - 20, G.player.y + 8));
  const chk = canPlaceAt(id, x, y);
  if (chk !== true) { sfx.error(); say(chk); return; }
  G.decorations.push({ id, x, y, phase: rand(0, 6) });
  G.player.actionT = 0.6;
  sfx.equip();
  spawnParticles(x, y - 20, '✨', 8);
  G.placing = null;
  saveGame(true);
  say('placedDecor', { decor: nm('decor', id) }, 2200);
}

// ---------------- 界面语言切换 ----------------
// 存档列表（开始界面：一台电脑上每个名字一份存档）
function fmtSaveTime(ms) {
  return new Date(ms || Date.now()).toLocaleString(
    lang === 'en' ? 'en-US' : 'zh-CN',
    { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function renderProfiles() {
  const list = $('save-list'), panel = $('save-panel');
  if (!list || !panel) return;
  const profs = listProfiles();
  // 没有存档：隐藏面板，只留一行「继续上次」
  // 有存档：显示列表，那一行信息就不用了（列表里已经写得很清楚）
  const infoEl = $('save-info');
  if (!profs.length) {
    panel.classList.add('hidden'); list.innerHTML = '';
    if (infoEl) infoEl.classList.remove('hidden');
    updateSaveInfo();
    return;
  }
  panel.classList.remove('hidden');
  if (infoEl) infoEl.classList.add('hidden');
  list.innerHTML = '';  profs.forEach(function (it) {
    const d = it.d;
    const chip = document.createElement('div');
    chip.className = 'save-chip' + (nameKey(it.p.name) === nameKey(playerName) ? ' current' : '');
    const main = document.createElement('button');
    main.className = 'save-chip-main';
    const nmEl = document.createElement('span');
    nmEl.className = 'save-chip-name';
    nmEl.textContent = '👦 ' + it.p.name;
    const infoEl = document.createElement('span');
    infoEl.className = 'save-chip-info';
    infoEl.textContent = d
      ? t('saveSummary', { day: d.day || 1, coins: d.coins || 0, time: fmtSaveTime(d.savedAt) })
      : t('saveSummary', { day: it.p.day || 1, coins: it.p.coins || 0, time: fmtSaveTime(it.p.savedAt) });
    main.appendChild(nmEl); main.appendChild(infoEl);
    main.onclick = function () {
      sfx.click();
      const input = $('name-input');
      if (input) input.value = it.p.name;
      startFarm(it.p.name, true);      // 点名字直接继续这个牧场
    };
    const del = document.createElement('button');
    del.className = 'save-chip-del';
    del.textContent = '✕';
    del.title = '删除';
    del.onclick = function (e) {
      if (e && e.stopPropagation) e.stopPropagation();
      const name = it.p.name;
      if (typeof confirm === 'function' && !confirm('删除「' + name + '」的存档？')) return;
      deleteProfile(name);
      sfx.close();
      say('saveDeleted', { name: name });
      renderProfiles();
    };
    chip.appendChild(main); chip.appendChild(del);
    list.appendChild(chip);
  });
  updateSaveInfo();
}
function updateSaveInfo() {
  const info = $('save-info');
  if (!info) return;
  const last = getLastProfile();
  const d = last ? readSave(last) : readSave();
  if (!d) { info.classList.add('hidden'); return; }
  const nm = (d.profile && d.profile.name) || last || '';
  info.textContent = (nm ? '👦 ' + nm + ' · ' : '') +
    t('saveInfo', { day: d.day || 1, coins: d.coins || 0, time: fmtSaveTime(d.savedAt) });
  info.classList.remove('hidden');
}
// 手动存档（点右上角的 💾）
function manualSave() {
  if (!G.started) return false;
  // 存档不弹提示、不写日志、也不出音效 —— 右上角的 💾 闪一下就够了
  return saveGame(true);
}
function applyLang() {
  // 静态界面文字
  const els = (document.querySelectorAll ? document.querySelectorAll('[data-i18n]') : []) || [];
  for (let i = 0; i < els.length; i++) {
    const k = els[i].getAttribute && els[i].getAttribute('data-i18n');
    if (k) els[i].textContent = t(k);
  }
  const tts = (document.querySelectorAll ? document.querySelectorAll('[data-i18n-title]') : []) || [];
  for (let i = 0; i < tts.length; i++) {
    const k = tts[i].getAttribute && tts[i].getAttribute('data-i18n-title');
    if (k) tts[i].title = t(k);
  }
  const phs = (document.querySelectorAll ? document.querySelectorAll('[data-i18n-ph]') : []) || [];
  for (let i = 0; i < phs.length; i++) {
    const k = phs[i].getAttribute && phs[i].getAttribute('data-i18n-ph');
    if (k) phs[i].placeholder = t(k);
  }
  const rh = $('rotate-hint'); if (rh) rh.textContent = t('rotateHint');
  const lh = $('log-head'); if (lh) lh.textContent = t('logTitle');
  const lb = $('btn-lang');
  if (lb) { lb.textContent = lang === 'en' ? 'EN' : '\u4e2d'; lb.title = t('switchLang'); }
  const btns = { 'btn-help': 'helpTitle', 'btn-book': 'bookTitle', 'save-box': 'saveTitle2',
                 'btn-music': 'musicTitle', 'btn-mute': 'muteTitle' };
  for (const id in btns) { const b = $(id); if (b) b.title = t(btns[id]); }
  document.title = t('title');
  // 动态内容
  renderHUD(); renderInventory(); renderLog(); renderProfiles();
  if (G.modalOpen === 'shop-modal') renderShop();
  else if (G.modalOpen === 'wardrobe-modal') renderWardrobe();
  else if (G.modalOpen === 'cook-modal') renderCook();
  else if (G.modalOpen === 'sell-modal') renderSell();
  else if (G.modalOpen === 'book-modal') renderBook();
  else if (G.modalOpen === 'tank-modal') renderTank();
  else if (G.modalOpen === 'math-modal') renderMathChallenge();
  else if (G.modalOpen === 'bed-modal') bedSyncUI();
}
function setLang(l) {
  lang = (l === 'en') ? 'en' : 'zh';
  try { localStorage.setItem('farm-lang', lang); } catch (e) {}
  applyLang();
  note('logLang');
}

// ---------------- DOM / UI ----------------
const $ = (id) => document.getElementById(id);

// ---------------- 消息日志 ----------------
function addLog(text) {
  if (!text) return;
  G.log.push({ text });
  if (G.log.length > 120) G.log.shift();   // 只留最近 120 条
  renderLog();
}
function renderLog() {
  const box = $('log-list');
  if (!box) return;
  // 日志框比以前高一截：多渲染几条，写满了由 CSS 把最旧的挤出去（最新的贴在底部）
  const items = G.log.slice(-10);
  box.innerHTML = '';
  items.forEach((e, i) => {
    const d = document.createElement('div');
    d.className = 'log-line' + (i === items.length - 1 ? ' newest' : '');
    d.textContent = e.text;
    box.appendChild(d);
  });
}
// 只弹提示（普通气泡）
function toast(msg, ms = 1800) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), ms);
}
// 大图卡片提示：拿到 / 买到东西时显示在画面中间，图标很大，一眼就能看清
function bigToast(icon, title, sub, ms = 2200) {
  const box = $('big-toast');
  if (!box) { toast(title, ms); return; }
  const ic = $('big-toast-icon'), ti = $('big-toast-title'), su = $('big-toast-sub');
  if (ic) {
    // 直接传物品 id 就用它的图标（emoji 或动画图）
    if (icon && ITEMS[icon] && ITEMS[icon].icon) ic.textContent = ITEMS[icon].icon;
    else ic.textContent = icon || '✨';
  }
  if (ti) ti.textContent = title || '';
  if (su) { su.textContent = sub || ''; su.classList.toggle('hidden', !sub); }
  box.classList.remove('hidden');
  const card = box.firstElementChild;      // 让出现动画重播一次
  if (card) { card.style.animation = 'none'; void card.offsetWidth; card.style.animation = ''; }
  clearTimeout(bigToast._t);
  bigToast._t = setTimeout(() => box.classList.add('hidden'), ms);
}
// 翻译 + 弹提示 + 记日志
// opts: { icon: 物品id 或 emoji, sub: 小字说明, big: 用大图卡片, ms: 时长, noLog: 不记日志 }
function say(key, params, ms = 1800, noLog = false, opts) {
  const s = t(key, params);
  const o = opts || {};
  if (o.big || o.icon) bigToast(o.icon || '✨', s, o.sub, Math.max(ms, 2000));
  else toast(s, ms);
  if (!noLog) addLog(s);
  return s;
}
// 只记日志（不弹提示）
function note(key, params) { addLog(t(key, params)); }
function renderHUD() {
  $('coins').textContent = G.coins;
  $('day-box').innerHTML = t('hudDay', { n: G.day });
  const h = Math.floor(G.timeMin / 60), m = Math.floor(G.timeMin % 60);
  $('clock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  $('weather-box').textContent = weatherText();
  // 存档按钮：显示是谁的牧场（名字放 title，按钮本身保持小巧不越界）
  // 🔨 升级按钮：有东西升得起就轻轻闪一下
  const ub = $('btn-upgrade');
  if (ub) {
    const canAny = FACILITY_ORDER.some(f => canUpgradeFacility(f));
    ub.classList.toggle('flash', canAny);
  }
  const sb = $('save-box');
  if (sb) {
    sb.textContent = '💾';
    sb.title = t('saveTitle2') + (playerName ? ' · ' + playerName : '');
  }
}
function renderInventory() {
  const bar = $('inventory');
  if (!bar) return;
  bar.innerHTML = '';
  const ids = Object.keys(G.inventory).filter(id => ITEMS[id]);
  // 物品栏排布：格子大小 / 行数按「种类数量」自动算。
  // 目标：整体高度不超过屏高的 12%（≈72px、最多 3 行），单格尽量大但不小于 22px，
  // 这样手机上图标看得清，也不会挡住上面和中间的提示。
  // 第 3 行只在东西特别多（比如鱼和果子都攒齐了）时才用得上。
  const gap = 5;
  // 物品栏现在排在「左下角牧场日志」的右边，宽度按容器实测（日志一挪就不用改这里）
  const maxW = Math.max(200, (bar.clientWidth || (VIEW_W - 40)) - 12);
  const maxH = VIEW_H * 0.12;                      // 物品栏总高度上限
  const n = ids.length || 1;
  let slot = 44, rows = 1;
  for (var r2 = 1; r2 <= 3; r2++) {                // 最多三行（再多就压到交互提示了）
    const per = Math.ceil(n / r2);
    const sByW = Math.floor((maxW - gap * (per - 1)) / per);
    const sByH = Math.floor((maxH - gap * (r2 - 1)) / r2);
    const cand = Math.min(44, sByW, sByH);
    if (cand >= 22) { slot = cand; rows = r2; break; }
    slot = Math.max(18, Math.min(44, sByW, sByH)); rows = r2;
  }
  bar.style.setProperty('--inv-gap', gap + 'px');
  bar.style.setProperty('--inv-slot', slot + 'px');
  bar.style.setProperty('--inv-emoji', Math.round(slot * 0.62) + 'px');
  bar.style.setProperty('--inv-font', Math.round(slot * 0.42) + 'px');
  bar.style.setProperty('--inv-cnt', Math.max(10, Math.round(slot * 0.26)) + 'px');
  // 两行时把物品栏整体抬高一行，别贴到屏幕最下面
  bar.style.bottom = (rows > 1 ? 8 + (rows - 1) * (slot + gap) : 10) + 'px';
  for (const id of ids) {
    const n = G.inventory[id];
    const d = document.createElement('div');
    d.className = 'inv-slot';
    d.title = nm('item', id);
    d.innerHTML = emojiImgHTML(ITEMS[id].cp, ITEMS[id].icon) + `<span class="cnt">${n}</span>`;
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
  b.addEventListener('click', () => { sfx.close(); closeModal(b.dataset.close); }));
$('btn-upgrade').addEventListener('click', () => {
  if (G.modalOpen === 'upgrade-modal') { closeModal('upgrade-modal'); return; }
  if (G.modalOpen) return;
  openUpgradePanel();
});
$('upgrade-back').addEventListener('click', () => { sfx.click(); showUpgradeList(); });
$('btn-help').addEventListener('click', () => { sfx.open(); toggleModal('help-modal'); });
$('btn-book').addEventListener('click', () => { sfx.open(); renderBook(); toggleModal('book-modal'); });
$('touch-book').addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.open(); renderBook(); toggleModal('book-modal'); });
$('btn-mute').addEventListener('click', () => { setMuted(!muted); sfx.click(); note(muted ? 'logSoundOff' : 'logSoundOn'); });
$('btn-music').addEventListener('click', () => { sfx.click(); setMusic(!musicOn); note(musicOn ? 'logMusicOn' : 'logMusicOff'); });
// 点右上角的 💾 或按 S 随时手动存档（S 也能往下走，所以只在没在走路时存）
$('save-box').addEventListener('click', () => { manualSave(); });

const bedAgainBtn = $('bed-again');
if (bedAgainBtn) bedAgainBtn.addEventListener('click', () => {
  if (!G.bed || !G.bed.active) return;
  sfx.click();
  G.bed.done[G.bed.step] = false;
  bedInitStep(G.bed.step);
});
const bedSleepBtn = $('bed-sleep');
if (bedSleepBtn) bedSleepBtn.addEventListener('click', () => {
  if (!G.bed || !bedAllDone()) { sfx.error(); return; }   // 三件事没做完不给睡
  sfx.click();
  G.bed.active = false;
  bedDragging = false;
  closeModal('bed-modal');
  startSleep();
});

// 正在输入名字的时候不要触发游戏快捷键
function playerTyping() {
  const el = document.activeElement;
  return !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'));
}

// ---------------- 商店 ----------------
let shopTab = 'seeds';

// ============================================================
//                    设施升级界面
// ============================================================
// 升级成功之后，所有打开着的面板都要重新画一遍
function refreshAllPanels() {
  if (!$('shop-modal').classList.contains('hidden')) renderShop();
  if (!$('cook-modal').classList.contains('hidden')) renderCook();
  if (!$('tank-modal').classList.contains('hidden')) renderTank();
  if (!$('wardrobe-modal').classList.contains('hidden')) renderWardrobe();
  if (!$('upgrade-modal').classList.contains('hidden')) renderUpgradeModal(upgradeTarget);
  renderHUD();
}
// 这栋建筑现在是什么状况（升级面板里第一眼看的就是它）
// 每一项都写清「现在有几个 / 最多几个」，一眼就知道该不该升级。
function facilityStatus(f) {
  switch (f) {
    case 'coop':
      return t('stCoop', { h: countHens(), hm: maxHens(), c: countChicks(), cm: maxChicks(),
                           e: G.incubating.length, em: maxIncubate() });
    case 'sheep':   return t('stSheep', { n: countAnimalType('sheep'), max: maxSheep() });
    case 'cow':     return t('stCow', { n: countAnimalType('cow'), max: maxCows() });
    case 'orchard': return t('stOrchard', { n: G.trees.length, max: maxOrchard() });
    case 'pond': {
      const open = PONDS.filter(function (p) { return !p.locked; }).length;
      const kinds = PONDS.reduce(function (a, p) { return a + (p.locked ? 0 : p.pool.length); }, 0);
      return t('stPond', { n: open, max: PONDS.length, k: kinds, km: SEA_ALL.length });
    }
    case 'tank':
      return t('stTank', { n: G.tank.length, max: maxTank(), caught: Object.keys(G.seaCaught).length });
    case 'kitchen': {
      let can = 0;
      for (let i = 0; i < RECIPES.length; i++) if (recipeUnlocked(i) && !Object.keys(RECIPES[i].needs).some(k => SEA_SET[k] || k === 'fish') && hasItems(RECIPES[i].needs)) can++;
      return t('stKitchen', { n: Math.min(RECIPES.length, maxRecipes()), max: RECIPES.length, can: can });
    }
    case 'wardrobe': {
      let owned = 0;
      for (const c of OUTFIT_CATS) owned += (G.owned[c] || []).filter(function (k) { return OUTFITS[c][k] && OUTFITS[c][k].price > 0; }).length;
      const tier = outfitTierMax();
      return t('stWardrobe', { n: owned, t: tier, tm: MAX_LV, avail: shopClothesOf2(tier) });
    }
    case 'shop': {
      const tier = shopTierMax();
      return t('stShop', { t: tier, tm: MAX_LV, n: shopGoodsCount(tier) });
    }
  }
  return '';
}
// 衣橱等级下「能买到的服饰件数」
function shopClothesOf2(tier) {
  let n = 0;
  for (const c of OUTFIT_CATS) n += shopClothesOf(c, tier).length;
  return n;
}
// 商店等级下「在卖的商品种类数」（不含服饰，服饰看衣橱）
function shopGoodsCount(tier) {
  let n = 0;
  CROPS.forEach(function (c, i) { if (shopTierOfIndex(i, CROPS.length) <= tier) n++; });
  VEHICLES.forEach(function (v, i) { if (shopTierOfIndex(i, VEHICLES.length) <= tier) n++; });
  ZOO_SHOP.forEach(function (z, i) { if (shopTierOfIndex(i, ZOO_SHOP.length) <= tier) n++; });
  DECOR_SHOP.forEach(function (d, i) { if (shopTierOfIndex(i, DECOR_SHOP.length) <= tier) n++; });
  FRUIT_IDS.forEach(function (f, i) { if (shopTierOfIndex(i, FRUIT_IDS.length) <= tier) n++; });
  return n;
}

// ============================================================
//   🔨 升级面板：先列出所有建筑（点一个）→ 再看那个建筑的升级选项
// ============================================================
let upgradeTarget = 'coop';
// 列表页：九张卡片（图标 / 名字 / 现在几级 / 现在的状况 / 能不能升）
function renderUpgradeList() {
  const box = $('upgrade-list');
  if (!box) return;
  box.innerHTML = '';
  FACILITY_ORDER.forEach(function (f) {
    const d = FACILITIES[f];
    const lv = lvOf(f);
    const maxed = isMaxLv(f);
    const afford = !maxed && G.coins >= upgradeCost(f);
    const card = document.createElement('button');
    card.className = 'upg-item' + (maxed ? ' maxed' : afford ? ' can' : '');
    const main = document.createElement('span');
    main.className = 'upg-item-main';
    const nm = document.createElement('span');
    nm.className = 'upg-item-name';
    nm.innerHTML = facName(f) + ' <b>Lv.' + lv + '</b>';
    const st = document.createElement('span');
    st.className = 'upg-item-st';
    st.textContent = facilityStatus(f);
    main.appendChild(nm); main.appendChild(st);
    const ic = document.createElement('span');
    ic.className = 'upg-item-icon'; ic.textContent = d.icon;
    const go = document.createElement('span');
    go.className = 'upg-item-go';
    go.textContent = maxed ? '✅ ' + t('upgMaxShort') : '🔨 ' + upgradeCost(f);
    card.appendChild(ic); card.appendChild(main); card.appendChild(go);
    card.onclick = function () { sfx.click(); showUpgradeDetail(f); };
    box.appendChild(card);
  });
}
// 切回列表页
function showUpgradeList() {
  renderUpgradeList();
  const l = $('upgrade-list'), b = $('upgrade-body'), bk = $('upgrade-back'), ti = $('upgrade-title'), h = $('upgrade-hint');
  if (l) l.classList.remove('hidden');
  if (b) b.classList.add('hidden');
  if (bk) bk.classList.add('hidden');
  if (ti) ti.textContent = t('upgradeTitle');
  if (h) h.textContent = t('upgPickHint');
}
// 切换到某个设施的升级选项
function showUpgradeDetail(f) {
  upgradeTarget = f;
  renderUpgradeModal(f);
  const l = $('upgrade-list'), b = $('upgrade-body'), bk = $('upgrade-back'), h = $('upgrade-hint');
  if (l) l.classList.add('hidden');
  if (b) b.classList.remove('hidden');
  if (bk) bk.classList.remove('hidden');
  if (h) h.textContent = t('upgradeHint');
}
// 点 HUD 上的「🔨 升级」打开面板
function openUpgradePanel() {
  showUpgradeList();
  sfx.open();
  openModal('upgrade-modal');
}
// 直接打开某个设施的升级选项（列表顺便铺好，返回时就能看到列表）
function openUpgrade(f) {
  if (!FACILITIES[f]) return;
  renderUpgradeList();
  showUpgradeDetail(f);
  sfx.open();
  openModal('upgrade-modal');
}
function renderUpgradeModal(f) {
  const box = $('upgrade-body');
  if (!box) return;
  const title = $('upgrade-title');
  if (title) title.textContent = '🔨 ' + facName(f);
  box.innerHTML = '';
  const lv = lvOf(f);
  const wrap = document.createElement('div');
  wrap.className = 'upg-card';
  wrap.innerHTML =
    '<div class="upg-head"><span class="upg-icon">' + FACILITIES[f].icon + '</span>' +
    '<span>' + facName(f) + ' · ' + t('upgNow', { lv: lv }) + '</span></div>' +
    '<div class="upg-tip">' + facTip(f) + '</div>' +
    // ★ 建筑现状：现在养了几只 / 种了几棵 / 能做几道菜…
    '<div class="upg-status"><b>' + t('upgStatusHead') + '</b>' + facilityStatus(f) + '</div>' +
    '<div class="upg-status next"><b>' + t('upgCapHead') + '</b>' + facCapText(f, lv) + '</div>';
  // 三个等级的小方块
  const row = document.createElement('div');
  row.className = 'upg-levels';
  for (let i = 1; i <= MAX_LV; i++) {
    const b = document.createElement('div');
    b.className = 'upg-lvbox' + (i < lv ? ' done' : i === lv ? ' now' : '');
    b.innerHTML = '<b>' + (i < lv ? '✅ ' : i === lv ? '⭐ ' : '🔒 ') + t('lvBadge', { lv: i }) + '</b>'
                + facCapText(f, i)
                + (i > 1 ? '<div class="upg-area">' + t('expandArea') + '</div>' : '');
    row.appendChild(b);
  }
  wrap.appendChild(row);
  // 升级按钮
  const acts = document.createElement('div');
  acts.className = 'upg-actions';
  if (isMaxLv(f)) {
    const s = document.createElement('div');
    s.className = 'upg-tip';
    s.textContent = t('upgMax');
    acts.appendChild(s);
  } else {
    const cost = upgradeCost(f);
    const b = document.createElement('button');
    b.className = 'big-btn';
    b.textContent = t('upgBtn', { n: cost });
    b.disabled = G.coins < cost;
    b.onclick = function () { if (doUpgrade(f)) renderUpgradeModal(f); };
    acts.appendChild(b);
    const s = document.createElement('div');
    s.className = 'upg-short';
    s.textContent = t('upgNext', { cap: facCapText(f, lv + 1) });
    acts.appendChild(s);
  }
  wrap.appendChild(acts);
  box.appendChild(wrap);
}

// ============================================================
//                    🐾 宠物房间
// ============================================================
// 宠物口粮在商店的「🍖 宠物用品」里买；喂食要消耗口粮，
// 清理便便和洗澡是免费的，但不做的话宠物会不开心。
const PET_FEED_COST = 12;      // 喂一次宠物直接花金币（不用先去商店买口粮）
const PET_ADOPT_PRICE = 120;   // 领养一只新宠物
const PET_TYPES = ['dog', 'cat', 'duck', 'goose'];
const PET_EMOJI = { dog: '🐶', cat: '🐱', duck: '🦆', goose: '🦢' };

// 宠物区三个小物件的交互名（站在旁边按 E 会提示什么）
function petSpotLabel(which) {
  const pet = G.pets[0];
  const who = pet ? petName(pet) : '';
  if (which === 'food')  return t('prPetFood', { pet: who, n: PET_FEED_COST });
  if (which === 'clean') return t('prPetClean', { pet: who });
  return t('prPetBath', { pet: who });
}
// 对着小物件按 E：没有宠物就提示先去领养
function withPet(fn) {
  const p = G.pets[0];
  if (!p) { sfx.error(); say('petNoPet', null, 2400); return; }
  fn(p);
}
// 三个动作都会给宠物加一段「正在做事」的动画（1.6~2 秒），
// 地图上会画出食盆 / 扫帚 / 澡盆。
function startPetAnim(p, kind) {
  p.anim = { kind: kind, t: 0, dur: kind === 'eat' ? 1.9 : 1.7 };
  p.happy = 3;
}
function feedPet(p) {
  if (p.hunger >= 100) { sfx.error(); say('petAlreadyFull', { pet: petName(p) }); return; }
  if (G.coins < PET_FEED_COST) { sfx.error(); say('upgNoCoin', { n: PET_FEED_COST }); return; }
  G.coins -= PET_FEED_COST;
  p.hunger = Math.min(100, p.hunger + 45);
  startPetAnim(p, 'eat');
  sfx.pet(); sfx.pickup();
  spawnParticles(p.x, p.y - 14, '🍖', 4);
  coinBurst(p.x, p.y - 34, -PET_FEED_COST);
  say('petFed', { pet: petName(p), n: PET_FEED_COST }, 2200);
  saveGame(true); renderHUD();
}
function cleanPet(p) {
  p.poop = 0; p.poopT = rand(70, 130);
  startPetAnim(p, 'clean');
  sfx.water(); sfx.sparkle();
  spawnParticles(p.x, p.y + 4, '✨', 6);
  say('petCleaned', { pet: petName(p) }, 2000);
  saveGame(true);
}
function bathePet(p) {
  p.clean = 100;
  startPetAnim(p, 'bath');
  sfx.water(); sfx.sparkle();
  spawnParticles(p.x, p.y - 10, '🫧', 7);
  say('petBathed', { pet: petName(p) }, 2200);
  saveGame(true);
}
// 一个人只带一只宠物：已经有宠物时，领养就是**换一只**（把现在这只换掉）
function adoptPet(type) {
  if (G.coins < PET_ADOPT_PRICE) { sfx.error(); say('upgradeNoCoin', { n: PET_ADOPT_PRICE }); return; }
  G.coins -= PET_ADOPT_PRICE;
  let p;
  if (G.pets.length) {
    p = G.pets[0];
    p.type = PET_TYPES.indexOf(type) >= 0 ? type : 'dog';
    p.hunger = 100; p.clean = 100; p.poop = 0; p.poopT = rand(70, 130);
    p.anim = null; p.happy = 3;
    sfx.buy(); sfx.petVoice(p.type, 260);
    spawnParticles(p.x, p.y - 20, '💖', 6);
    say('petSwapped', { pet: petName(p) }, 2600, false, { icon: PET_EMOJI[p.type] || '🐾', sub: t('petAdoptSub') });
  } else {
    const sp = PET_SPOTS.food;
    p = newPet(type, sp.x + rand(-30, 30), sp.y + rand(46, 66));
    G.pets.push(p);
    sfx.buy(); sfx.petVoice(type, 260);
    spawnParticles(p.x, p.y - 20, '💖', 6);
    say('petAdoptDone', { pet: petName(p) }, 2600, false, { icon: PET_EMOJI[type] || '🐾', sub: t('petAdoptSub') });
  }
  saveGame(true); renderHUD();
}

// 图标容器：服饰用「画出来的真实样式」，其它用 emoji
function iconBox(kind, keyOrEmoji) {
  const d = document.createElement('div');
  d.className = 'icon';
  if (kind === 'emoji') d.textContent = keyOrEmoji;
  else if (kind === 'item' || kind === 'sea') {
    const it = ITEMS[keyOrEmoji];
    d.innerHTML = emojiImgHTML(it.cp, it.icon, 'emoji-img big');
  } else if (kind === 'zoo') {
    const z = ZOO_MAP[keyOrEmoji];
    d.innerHTML = emojiImgHTML(z.cp, z.icon, 'emoji-img big');
  } else d.appendChild(clothingIconCanvas(kind, keyOrEmoji));
  return d;
}

// 商店等级决定「能买到哪一档的东西」：
//   1 级只卖基础款，2 级开放进阶，3 级全部开放。
// tier 是怎么分的：种子 / 观赏动物 / 装饰 / 交通 都按列表顺序三等分；
// 衣服按 OUTFITS 里每件的 tier；果树苗跟着商店等级走。
function shopTierOfIndex(i, total) { return Math.min(3, Math.floor(i / Math.ceil(total / 3)) + 1); }
// 某一件商品是不是因为商店等级不够而锁着
function tierLocked(tier) { return tier > shopTierMax(); }

function renderShop() {
  const box = $('shop-items');
  box.innerHTML = '';
  const lockedCard = (icon, name, tier) => {
    const d = document.createElement('div');
    d.className = 'shop-item locked';
    d.appendChild(icon);
    const info = document.createElement('div');
    info.innerHTML = `<div>${name}</div><div class="sub">${t('tierLocked')}</div>`;
    d.appendChild(info);
    const b = document.createElement('button');
    b.textContent = '🔒'; b.disabled = true;
    d.appendChild(b);
    box.appendChild(d);
  };
  const mkCard = (icon, name, price, onBuy, owned, sub) => {
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.appendChild(icon);
    const info = document.createElement('div');
    info.innerHTML = `<div>${name}</div>${sub ? `<div class="sub">${sub}</div>` : ''}`;
    d.appendChild(info);
    const b = document.createElement('button');
    if (owned) {
      b.textContent = t('owned'); b.disabled = true;
    } else {
      b.textContent = t('buyFor', { n: price });
      b.disabled = G.coins < price;
      b.onclick = onBuy;
    }
    d.appendChild(b);
    box.appendChild(d);
  };
  if (shopTab === 'seeds') {
    // 种子按商店等级分批开放
    CROPS.forEach(function (c, ci) {
      const id = 'seed_' + c.id;
      const tier = shopTierOfIndex(ci, CROPS.length);
      if (tierLocked(tier)) { lockedCard(iconBox('item', id), c.name + '种子', tier); return; }
      mkCard(iconBox('item', id), c.name + '种子', ITEMS[id].price, () => {
        G.coins -= ITEMS[id].price; addItem(id); sfx.buy();
        say('bought', { item: nm('item', id) }, 2200, false, { icon: id, sub: t('boughtCardSub') });
        renderShop(); renderHUD();
      }, false, t('cropInfo', { sec: Math.round(55 / c.rate) }));
    });
    // 动物饲料：一次买 5 份，够喂几天
    mkCard(iconBox('item', 'feed'), nm('item', 'feed'), ITEMS.feed.price * 5, () => {
      G.coins -= ITEMS.feed.price * 5; addItem('feed', 5); sfx.buy();
      say('boughtFeed', { n: 5 }, 2200, false, { icon: 'feed', sub: t('feedCardSub') });
      renderShop(); renderHUD();
    }, false, t('feedShopDesc', { n: FEED_PER_DAY, max: FEED_MAX }));
    // 🌳 果树苗：买一棵就种进果树园（果园升级后能种更多棵）
    const fhead = document.createElement('div');
    fhead.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;margin-top:4px;';
    fhead.textContent = t('orchardShopHead', { n: G.trees.length, max: maxOrchard(), lv: lvOf('orchard') });
    box.appendChild(fhead);
    const missing = missingFruitTypes();
    if (G.trees.length >= maxOrchard()) {
      const e = document.createElement('div');
      e.style.cssText = 'grid-column:1/-1;font-size:14px;color:#c0392b;font-weight:bold;';
      e.textContent = t('orchardFull', { max: maxOrchard() }) + ' ' + t('upgradeHint');
      box.appendChild(e);
    }
    for (const f of FRUIT_IDS) {
      if (missing.indexOf(f) < 0) continue;
      if (tierLocked(shopTierOfIndex(FRUIT_IDS.indexOf(f), FRUIT_IDS.length))) {
        lockedCard(iconBox('item', f), nm('item', f) + t('saplingSuffix'),
                   shopTierOfIndex(FRUIT_IDS.indexOf(f), FRUIT_IDS.length));
        continue;
      }
      mkCard(iconBox('item', f), nm('item', f) + t('saplingSuffix'), SAPLING_PRICE, () => {
        if (G.trees.length >= maxOrchard()) { sfx.error(); say('orchardFull', { max: maxOrchard() }); return; }
        if (G.coins < SAPLING_PRICE) { sfx.error(); say('upgradeNoCoin', { n: SAPLING_PRICE }); return; }
        G.coins -= SAPLING_PRICE;
        const tr = addOrchardTree(f);
        sfx.plant(); sfx.success();
        if (tr) spawnParticles(tr.x, tr.y - 30, '🌱', 8);
        say('plantSapling', { fruit: nm('item', f), n: G.trees.length, max: maxOrchard() }, 2800, false,
            { icon: f, sub: t('saplingSub') });
        renderShop(); renderHUD();
      }, false, t('saplingDesc', { n: SAPLING_PRICE }));
    }
  } else if (shopTab === 'clothes') {
    // 服装：帽子 / 头饰 / 裙子 / 上衣 / 裤子 / 鞋子 六类，
    // 每一类里都有「衣橱等级」还没开放的部分（显示成 🔒）。
    const wmax = outfitTierMax();
    const whead = document.createElement('div');
    whead.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    whead.textContent = t('wdTierNote', { lv: lvOf('wardrobe') });
    box.appendChild(whead);
    for (const cat of OUTFIT_CATS) {
      const catHead = document.createElement('div');
      catHead.style.cssText = 'grid-column:1/-1;font-size:15px;color:#c9750a;font-weight:bold;margin-top:4px;';
      catHead.textContent = OUTFIT_CAT_LABEL[cat][lang === 'en' ? 1 : 0];
      box.appendChild(catHead);
      for (const [key, o] of Object.entries(OUTFITS[cat])) {
        if (!o.price || o.legacy) continue;
        const owned = G.owned[cat].includes(key);
        // 服饰的开放档位看的是「衣橱等级」，不是商店等级
        if ((o.tier || 1) > wmax) { lockedCard(iconBox(cat, key), o.name, o.tier); continue; }
        mkCard(iconBox(cat, key), o.name, o.price, () => {
          G.coins -= o.price; G.owned[cat].push(key); sfx.buy();
          // 买到的衣服会自动挂进衣橱（这里给一句明确的提示）
          say('boughtToCloset', { name: nm(cat, key) }, 2400, false,
              { icon: '👗', sub: t('boughtClothes') });
          renderShop(); renderHUD();
        }, owned);
      }
    }
  } else if (shopTab === 'petcare') {
    // 宠物用品：宠物口粮 + 领养新宠物
    const phead = document.createElement('div');
    phead.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    const hasPet = G.pets.length > 0;
    phead.textContent = hasPet ? t('petHaveOne', { pet: petName(G.pets[0]) }) : t('petShopHead');
    box.appendChild(phead);
    PET_TYPES.forEach(function (ty) {
      mkCard(iconBox('emoji', PET_EMOJI[ty] || '🐾'),
             t(ty === 'goose' ? 'petGoose' : ty === 'duck' ? 'petDuck' : ty),
             PET_ADOPT_PRICE, () => { adoptPet(ty); renderShop(); },
             false, hasPet ? t('petSwapThis') : t('petAdopt'));
    });
  } else if (shopTab === 'vehicles') {
    // 交通工具：买回来后走到停车架按 E 就能骑上，骑上走得快
    const vhead = document.createElement('div');
    vhead.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    vhead.textContent = t('vehicleShopHead', { key: KEY_HINT });
    box.appendChild(vhead);
    for (let vi = 0; vi < VEHICLES.length; vi++) {
      const v = VEHICLES[vi];
      if (tierLocked(shopTierOfIndex(vi, VEHICLES.length))) {
        lockedCard(iconBox('emoji', v.icon), nm('vehicle', v.id), shopTierOfIndex(vi, VEHICLES.length));
        continue;
      }
      const owned = G.vehicles.indexOf(v.id) >= 0;
      mkCard(iconBox('emoji', v.icon), nm('vehicle', v.id), v.price, () => {
        G.coins -= v.price;
        G.vehicles.push(v.id);
        G.vehicle = v.id;                 // 买到就直接骑上
        sfx.buy(); sfx.equip();
        spawnParticles(G.player.x, G.player.y - 20, '💨', 6);
        say('boughtVehicle', { v: nm('vehicle', v.id) }, 2600, false,
            { icon: v.icon, sub: t('boughtVehicleSub', { n: v.speed }) });
        renderShop(); renderHUD();
      }, owned, t('speedNote', { n: v.speed }));
    }
  } else if (shopTab === 'animals') {
    // 动物列表：买回来会在自己的棚舍附近自由散步
    // 母鸡最多 5 只、小鸡最多 10 只（孵蛋器孵出来的也算），其它动物最多 24 只
    const head = document.createElement('div');
    head.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    const chTrough = troughOf('chicken');
    head.textContent = t('animalCount', { n: cappedAnimalCount(), max: maxOtherAnimals() })
      + ' · ' + t('logHens', { h: countHens(), hm: maxHens(), c: countChicks(), cm: maxChicks(),
                               f: chTrough ? chTrough.feed : 0 });
    box.appendChild(head);
    for (const a of ANIMAL_SHOP) {
      const isHenBuy = a.type === 'chicken';
      const full = isHenBuy ? (countHens() >= maxHens())
                            : (a.type === 'sheep' ? countAnimalType('sheep') >= maxSheep()
                                                  : countAnimalType('cow') >= maxCows()
                               || cappedAnimalCount() >= maxOtherAnimals());
      const sub = isHenBuy ? t('shopHenDesc', { hm: maxHens() })
                : a.type === 'sheep' ? t('shopSheepDesc', { max: maxSheep() })
                : t('shopCowDesc', { max: maxCows() });
      mkCard(iconBox('emoji', a.icon), isHenBuy ? t('animalHen') : a.name, a.price, () => {
        if (isHenBuy && countHens() >= maxHens()) { sfx.error(); say('tooManyHens', { max: maxHens() }); return; }
        if (a.type === 'sheep' && countAnimalType('sheep') >= maxSheep()) { sfx.error(); say('tooManySheep', { max: maxSheep() }); return; }
        if (a.type === 'cow' && countAnimalType('cow') >= maxCows()) { sfx.error(); say('tooManyCows', { max: maxCows() }); return; }
        if (!isHenBuy && cappedAnimalCount() >= maxOtherAnimals()) { sfx.error(); say('tooManyAnimals'); return; }
        G.coins -= a.price;
        const h = PENS[a.type].home;
        const na = newAnimal(a.type, h.x + rand(-30, 30), h.y + rand(-20, 20));
        na.waitT = 0.8;
        G.animals.push(na);
        sfx.buy();
        sfx.animalVoice(a.type, 260);
        spawnParticles(na.x, na.y - 20, '💖', 5);
        say('boughtAnimal', { animal: isHenBuy ? t('animalHen') : nm('animal', a.type) }, 2500, false,
            { icon: a.icon, sub: t('boughtAnimalSub') });
        note('logAttractMore', { n: visitorSlots() });     // 动物多了 → 能接待更多参观客人
        renderShop(); renderHUD();
      }, false, sub);
    }
  } else if (shopTab === 'zoo') {
    // 动物园：观赏动物，不产出（按商店等级分三批开放）
    const head = document.createElement('div');
    head.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    head.textContent = t('zooHead', { n: G.zoo.length, max: MAX_ZOO });
    box.appendChild(head);
    for (let zi = 0; zi < ZOO_SHOP.length; zi++) {
      const z = ZOO_SHOP[zi];
      if (tierLocked(shopTierOfIndex(zi, ZOO_SHOP.length))) {
        lockedCard(iconBox('zoo', z.type), nm('zoo', z.type), shopTierOfIndex(zi, ZOO_SHOP.length));
        continue;
      }
      mkCard(iconBox('zoo', z.type), nm('zoo', z.type), z.price, () => {
        if (G.zoo.length >= MAX_ZOO) { sfx.error(); say('tooManyZoo'); return; }
        G.coins -= z.price;
        const spot = zooRandomSpot(ZOO_AREA);
        G.zoo.push(newZoo(z.type, spot.x, spot.y));
        sfx.buy(); sfx.zooVoice(z.v, z.p, 300);
        spawnParticles(spot.x, spot.y - 20, '💖', 5);
        say('boughtZoo', { animal: nm('zoo', z.type) }, 2600, false, { icon: z.icon, sub: t('zooNote') });
        note('logAttractMore', { n: visitorSlots() });
        renderShop(); renderHUD();
      }, false, t('zooNote'));
    }
  } else if (shopTab === 'decor') {
    // 庭院装饰：买好后进入放置模式，走到喜欢的位置放下（按商店等级分三批开放）
    const head = document.createElement('div');
    head.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    head.textContent = t('decorCount', { n: G.decorations.length, key: KEY_HINT });
    box.appendChild(head);
    for (let di = 0; di < DECOR_SHOP.length; di++) {
      const d = DECOR_SHOP[di];
      if (tierLocked(shopTierOfIndex(di, DECOR_SHOP.length))) {
        lockedCard(iconBox('emoji', d.icon), d.name, shopTierOfIndex(di, DECOR_SHOP.length));
        continue;
      }
      mkCard(iconBox('emoji', d.icon), d.name, d.price, () => {
        G.coins -= d.price;
        sfx.buy(); renderHUD();
        closeModal('shop-modal');
        G.placing = { id: d.id };
        say('boughtDecor', { key: KEY_HINT, extra: isTouch ? '' : t('cancelHint') }, 3200, false,
            { big: true, icon: d.icon, sub: t('boughtCardSub') });
      }, false, t('placeFree'));
    }
  } else if (shopTab === 'pet') {
    for (const [key, o] of Object.entries(PET_HATS)) {
      const owned = G.petHatsOwned.includes(key);
      mkCard(iconBox('hat', key), o.name, o.price, () => {
        G.coins -= o.price; G.petHatsOwned.push(key);
        const lp = G.pets[0];
        lp.hat = key; lp.happy = 3; sfx.buy();
        spawnParticles(lp.x, lp.y - 20, '💖', 4);
        say('wearPetHat', { pet: petName(lp) }, 2400, false, { icon: o.icon, sub: t('boughtCardSub') });
        renderShop(); renderHUD();
      }, owned);
    }
  }
}
document.querySelectorAll('#shop-modal .tab-btn').forEach(b =>
  b.addEventListener('click', () => {
    shopTab = b.dataset.tab;
    sfx.click();
    document.querySelectorAll('#shop-modal .tab-btn').forEach(x => x.classList.toggle('selected', x === b));
    renderShop();
  }));

// ---------------- 衣橱（开放式衣帽间） ----------------
// 「开放式衣帽间」：左边一面试衣镜（实时把角色画出来），右边一层层的
// 挂衣杆 / 帽子架 / 头饰架 / 抽屉 / 鞋架 —— 买到的衣服会自动出现在这里。
let wTab = 'hat';
// 每一类衣服在衣帽间里的「摆放方式」
const CLOSET_STYLE = {
  hat:   { cls: 'shelf',    label: 'closetShelf' },
  hair:  { cls: 'shelf',    label: 'closetHair' },
  dress: { cls: 'rail',     label: 'closetDress' },
  shirt: { cls: 'rail',     label: 'closetRail' },
  pants: { cls: 'drawer',   label: 'closetDrawer' },
  shoes: { cls: 'shoerack', label: 'closetShoeRack' },
};
// 试衣镜里的角色（照着当前穿着实时画一遍）
function renderClosetAvatar() {
  const cv = $('closet-avatar');
  if (!cv || typeof cv.getContext !== 'function') return;
  const x = cv.getContext('2d');
  if (!x) return;
  x.clearRect(0, 0, cv.width, cv.height);
  x.save();
  x.translate(cv.width / 2, cv.height * 0.80);
  x.scale(2.15, 2.15);
  const of = G.player.outfit;
  drawPlayer(x, 0, 0, {
    gender: G.player.gender, dir: 'down', walkPhase: 0, moving: false,
    outfit: { hat: of.hat, hair: of.hair, shirt: of.shirt, dress: of.dress,
              pants: of.pants, shoes: of.shoes },
    actionT: 0, t: G.t, scale: 1,
  });
  x.restore();
  const nmEl = $('closet-name');
  if (nmEl) nmEl.textContent = playerName || '';
}
function renderWardrobe() {
  if (typeof highlightChar === 'function') highlightChar();
  const hint = $('closet-hint');
  if (hint) hint.textContent = t('closetHint');
  renderClosetAvatar();
  const box = $('wardrobe-items');
  if (!box) return;
  box.innerHTML = '';
  const style = CLOSET_STYLE[wTab] || CLOSET_STYLE.shirt;
  box.className = 'shop-grid closet-grid ' + style.cls;
  // 这一层架子的名字
  const head = document.createElement('div');
  head.className = 'closet-note';
  head.textContent = t(style.label);
  box.appendChild(head);
  // 「不戴 / 不穿」这类选项排在最前面
  const owned = G.owned[wTab] || [];
  const list = (wTab === 'hat' || wTab === 'hair' || wTab === 'dress' || wTab === 'shoes')
    ? ['none', ...owned.filter(k => k !== 'none')]
    : [...owned];
  if (!list.length) {
    const e = document.createElement('div');
    e.className = 'closet-empty';
    e.textContent = t('closetEmpty');
    box.appendChild(e);
  }
  for (const key of list) {
    const o = OUTFITS[wTab][key];
    if (!o) continue;
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.appendChild(iconBox(wTab, key));
    d.insertAdjacentHTML('beforeend', `<div>${nm(wTab, key)}</div>`);
    const b = document.createElement('button');
    const wearing = G.player.outfit[wTab] === key;
    b.textContent = wearing ? t('wearing') : t('wearIt');
    b.disabled = wearing;
    b.onclick = () => {
      G.player.outfit[wTab] = key;
      // 穿上裙子 = 不用再穿上衣和裤子；反过来穿上衣 / 裤子就自动脱掉裙子
      if (wTab === 'shirt' || wTab === 'pants') G.player.outfit.dress = 'none';
      sfx.equip(); spawnParticles(G.player.x, G.player.y - 30, '✨', 5);
      say('equipDone', { name: nm(wTab, key) });
      renderWardrobe();
    };
    d.appendChild(b);
    box.appendChild(d);
  }
  // 如果穿着裙子，上衣和裤子两层给个说明
  if ((wTab === 'shirt' || wTab === 'pants') && G.player.outfit.dress !== 'none') {
    const n = document.createElement('div');
    n.className = 'closet-note';
    n.textContent = '👗 ' + t('dressNote');
    box.appendChild(n);
  }
  // 宠物帽子区（挂衣帽间最下面一格）
  if (G.petHatsOwned.length) {
    const title = document.createElement('div');
    title.style.cssText = 'grid-column:1/-1;font-weight:bold;color:#c77;margin-top:6px;';
    title.textContent = t('petSection');
    box.appendChild(title);
    for (const key of G.petHatsOwned) {
      const o = PET_HATS[key];
      const d = document.createElement('div');
      d.className = 'shop-item';
      d.appendChild(iconBox('hat', key));
      d.insertAdjacentHTML('beforeend', `<div>${o.name}</div>`);
      const b = document.createElement('button');
      const wearing = G.pets[0] && G.pets[0].hat === key;
      b.textContent = wearing ? t('wearing') : t('wearPet');
      b.disabled = wearing;
      b.onclick = () => {
        const lp = G.pets[0];
        if (!lp) return;
        lp.hat = key; lp.happy = 3; sfx.equip();
        spawnParticles(lp.x, lp.y - 20, '💖', 4);
        renderWardrobe();
      };
      d.appendChild(b);
      box.appendChild(d);
    }
  }
}
document.querySelectorAll('#wardrobe-modal .tab-btn[data-wtab]').forEach(b =>
  b.addEventListener('click', () => {
    wTab = b.dataset.wtab;
    sfx.click();
    document.querySelectorAll('#wardrobe-modal .tab-btn[data-wtab]').forEach(x => x.classList.toggle('selected', x === b));
    renderWardrobe();
  }));

// ---------------- 厨房 ----------------
// 厨房等级决定能做的菜：1 级 6 道 → 2 级 12 道 → 3 级全部 18 道
function recipeUnlocked(i) { return i < maxRecipes(); }
function renderCook() {
  const box = $('cook-items');
  box.innerHTML = '';
  const rhead = document.createElement('div');
  rhead.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
  rhead.textContent = t('cookTierNote', { lv: lvOf('kitchen') })
    + ' · ' + Math.min(RECIPES.length, maxRecipes()) + '/' + RECIPES.length;
  box.appendChild(rhead);
  for (let ri = 0; ri < RECIPES.length; ri++) {
    const r = RECIPES[ri];
    const out = ITEMS[r.id];
    if (!recipeUnlocked(ri)) {
      const dl = document.createElement('div');
      dl.className = 'shop-item locked';
      dl.innerHTML = `<div class="icon">🍽️</div><div>${nm('item', r.id)}</div><div class="sub">${t('tierLocked')}</div>`;
      const bl = document.createElement('button');
      bl.textContent = '🔒'; bl.disabled = true;
      dl.appendChild(bl);
      box.appendChild(dl);
      continue;
    }
    const can = hasItems(r.needs);
    const needStr = Object.entries(r.needs).map(([id, n]) =>
      id === 'fruit' ? t('anyFruit', { n }) : `${ITEMS[id].icon}×${n}`).join(' + ');
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.innerHTML = `<div class="icon">${emojiImgHTML(out.cp, out.icon, 'emoji-img big')}</div><div>${nm('item', r.id)}</div><div style="font-size:12px">${t('need')} ${needStr}</div>`;
    const b = document.createElement('button');
    b.textContent = can ? t('cookOne') : t('noMats');
    b.disabled = !can;
    b.onclick = () => {
      consumeItems(r.needs);
      addItem(r.id);
      sfx.cook();
      spawnParticles(G.player.x, G.player.y - 30, '✨', 6);
      say('cookDone', { dish: nm('item', r.id) }, 2400, false, { icon: r.id, sub: t('cookCardSub') });
      renderCook();
    };
    d.appendChild(b);
    box.appendChild(d);
  }
}

// ---------------- 大型水族箱 ----------------
// 容量由「水族箱等级」决定（1 级 6 条 / 2 级 12 条 / 3 级 20 条），见 maxTank()
function putInTank(id) {
  if (!SEA_SET[id]) return;
  if (G.tank.length >= maxTank()) { sfx.error(); say('tankFull', { max: maxTank() }); return; }  // 超过就提示放不下
  if (!removeItem(id)) return;
  G.tank.push(id);
  sfx.water();
  say('tankPut', { fish: nm('item', id) });
  note('logAttractMore', { n: visitorSlots() });       // 鱼多了 → 参观的人也会变多
  saveGame(true); renderTank();
}
function takeFromTank(i) {
  const id = G.tank[i];
  if (!id) return;
  G.tank.splice(i, 1);
  addItem(id);
  sfx.pop();
  say('tankTake', { fish: nm('item', id) });
  saveGame(true); renderTank();
}
function renderTank() {
  const cnt = $('tank-count'), list = $('tank-list'), bag = $('tank-bag');
  if (!cnt || !list || !bag) return;
  cnt.textContent = t('tankCount', { n: G.tank.length, max: maxTank() })
    + ' · ' + t('tankTierNote', { lv: lvOf('tank') });
  const bagTitle = $('tank-bag-title');
  if (bagTitle) bagTitle.textContent = t('tankBagTitle');
  list.innerHTML = '';
  if (!G.tank.length) {
    list.innerHTML = `<div style="grid-column:1/-1;color:#a8906a">${t('tankEmpty')}</div>`;
  } else {
    G.tank.forEach((id, i) => {
      const it = ITEMS[id];
      if (!it) return;
      const d = document.createElement('div');
      d.className = 'shop-item';
      d.innerHTML = `<div class="icon">${emojiImgHTML(it.cp, it.icon, 'emoji-img big')}</div><div>${nm('item', id)}</div>`;
      const b = document.createElement('button');
      b.textContent = t('takeOut');
      b.onclick = () => takeFromTank(i);
      d.appendChild(b);
      list.appendChild(d);
    });
  }
  bag.innerHTML = '';
  const mine = Object.keys(G.inventory).filter(id => SEA_SET[id] && G.inventory[id] > 0);
  const full = G.tank.length >= maxTank();
  if (!mine.length) {
    bag.innerHTML = `<div style="grid-column:1/-1;color:#a8906a">${t('bagNoFish')}</div>`;
  } else {
    for (const id of mine) {
      const it = ITEMS[id];
      const d = document.createElement('div');
      d.className = 'shop-item';
      d.innerHTML = `<div class="icon">${emojiImgHTML(it.cp, it.icon, 'emoji-img big')}</div><div>${nm('item', id)} ×${G.inventory[id]}</div>`;
      const b = document.createElement('button');
      b.textContent = full ? t('tankFull2') : t('putIn');
      b.disabled = full;
      b.onclick = () => putInTank(id);
      d.appendChild(b);
      bag.appendChild(d);
    }
  }
}

// ---------------- 动物图鉴 ----------------
let bookTab = 'zoo';
function renderBook() {
  const box = $('book-items');
  if (!box) return;
  box.innerHTML = '';
  const mk = (html, name, sub) => {
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.innerHTML = `<div class="icon">${html}</div><div>${name}</div><div class="sub">${sub}</div>`;
    box.appendChild(d);
  };
  if (bookTab === 'zoo') {
    for (const z of ZOO_SHOP) {
      const n = G.zoo.filter(v => v.type === z.type).length;
      mk(emojiImgHTML(z.cp, z.icon, 'emoji-img big'), nm('zoo', z.type),
         n > 0 ? t('bookOwned', { n }) : t('bookNone'));
    }
  } else {
    for (const pond of PONDS) {
      const head = document.createElement('div');
      head.style.cssText = 'grid-column:1/-1;font-size:13px;font-weight:bold;color:#3a7fbf;margin-top:4px;';
      head.textContent = pondLabel(pond) + ' 💧';
      box.appendChild(head);
      for (const id of pond.pool) {
        const n = G.seaCaught[id] || 0;
        mk(emojiImgHTML(ITEMS[id].cp, ITEMS[id].icon, 'emoji-img big'), nm('item', id),
           n > 0 ? t('caughtTimes', { n }) : t('bookNone'));
      }
    }
  }
}
document.querySelectorAll('#book-modal .tab-btn').forEach(b =>
  b.addEventListener('click', () => {
    bookTab = b.dataset.book;
    sfx.click();
    document.querySelectorAll('#book-modal .tab-btn').forEach(x => x.classList.toggle('selected', x === b));
    renderBook();
  }));

// ---------------- 卖货箱 ----------------
function renderSell() {
  const box = $('sell-items');
  box.innerHTML = '';
  const ids = Object.keys(G.inventory).filter(id => !ITEMS[id].seed);
  if (!ids.length) {
    box.innerHTML = `<div style="grid-column:1/-1;color:#a8906a">${t('bagEmpty')}</div>`;
    return;
  }
  for (const id of ids) {
    const it = ITEMS[id];
    const have = G.inventory[id] || 0;
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.innerHTML = `<div class="icon">${emojiImgHTML(it.cp, it.icon, 'emoji-img big')}</div><div>${nm('item', id)} ×${have}</div>`;
    const row = document.createElement('div');
    row.className = 'sell-btns';
    // ① 卖 1 个
    const b1 = document.createElement('button');
    b1.textContent = t('sellOne', { n: it.price });
    b1.onclick = () => {
      if (removeItem(id)) {
        G.coins += it.price; sfx.coin(); renderHUD(); renderSell();
        say('soldBin', { item: nm('item', id), n: it.price });
      }
    };
    row.appendChild(b1);
    // ② 卖一半（数量不足 2 个就不显示这一颗，按钮上写清楚到底卖几个）
    const half = Math.floor(have / 2);
    if (half >= 1) {
      const b2 = document.createElement('button');
      b2.className = 'half';
      b2.textContent = t('sellHalf', { k: half, n: half * it.price });
      b2.onclick = () => {
        if (removeItem(id, half)) {
          const gain = half * it.price;
          G.coins += gain; sfx.coin(); renderHUD(); renderSell();
          say('soldBin', { item: nm('item', id) + ' ×' + half, n: gain });
        }
      };
      row.appendChild(b2);
    }
    d.appendChild(row);
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
    if (d < bestD) { bestD = d; best = { kind: 'item', it, label: `${ITEMS[it.id].icon} ${t('prPickup', { item: nm('item', it.id) })}` }; }
  }
  // 2. 客人：买东西的可以卖东西给他；来参观的可以打个招呼
  for (const c of G.customers) {
    if (c.kind === 'visitor') {
      const dv = dist(p.x, p.y, c.x, c.y);
      if (dv < bestD + 22) {
        bestD = Math.min(bestD, dv);
        best = { kind: 'greet', c, label: t('prGreetVisitor', { name: custName(c) }) };
      }
      continue;
    }
    if (c.state !== 'wait') continue;
    const d = dist(p.x, p.y, c.x, c.y);
    if (d < bestD + 30) {
      bestD = Math.min(bestD, d);
      best = { kind: 'customer', c, label: `${ITEMS[c.want].icon} ${t('prCustomerMath', { item: basketLabel(c), name: custName(c) })}` };
    }
  }
  // 3. 动物（饿跑了的动物只会告诉你它饿了）
  for (const a of G.animals) {
    const d = dist(p.x, p.y, a.x, a.y);
    if (d < bestD) {
      if (a.tired) { bestD = d; best = { kind: 'hungry', a, label: t('prHungryAnimal', { animal: nm('animal', a.type) }) }; }
      else if (a.type === 'sheep' && a.wool > 0.5) { bestD = d; best = { kind: 'shear', a, label: t('prShear') }; }
      else if (a.type === 'cow' && a.milkReady) { bestD = d; best = { kind: 'milk', a, label: t('prMilk') }; }
      else if (a.type === 'chicken') {
        bestD = d;
        best = isChick(a)
          ? { kind: 'petChicken', a, label: t('prPetChick') }
          : { kind: 'petChicken', a, label: a.laidToday ? t('prPetHenLaid') : t('prPetHen') };
      }
      else if (a.type === 'sheep') { bestD = d; best = { kind: 'petSheep', a, label: t('prPetSheep') }; }
      else { bestD = d; best = { kind: 'petCow', a, label: t('prPetCow') }; }
    }
  }
  // 4. 田块
  for (const pl of G.plots) {
    const d = dist(p.x, p.y, pl.x, pl.y);
    if (d < bestD) {
      let label = null, kind = null;
      if (pl.state === 'grass') { kind = 'till'; label = t('prTill'); }
      else if (pl.state === 'tilled') {
        const seed = Object.keys(G.inventory).find(id => ITEMS[id].seed);
        if (seed) { kind = 'plant'; label = t('prPlant', { seed: nm('item', seed) }); }
        else { kind = 'noseed'; label = t('prNoSeed'); }
      }
      else if (pl.state === 'seed' || pl.state === 'growing') { kind = 'water'; label = t('prWater'); }
      else if (pl.state === 'ripe') { kind = 'harvest'; label = t('prHarvest', { crop: nm('crop', pl.crop) }); }
      if (kind) { bestD = d; best = { kind, pl, label }; }
    }
  }
  // 5. 果树
  for (const tr of G.trees) {
    const d = dist(p.x, p.y, tr.x, tr.y);
    if (d < bestD + 10 && tr.fruits > 0) {
      bestD = Math.min(bestD, d);
      best = { kind: 'tree', tr, label: `${ITEMS[tr.type].icon} ${t('prTree', { fruit: nm('item', tr.type) })}` };
    }
  }
  // 5.5 食槽：走到旁边就能放饲料（比别的交互优先）
  for (const tr of TROUGHS) {
    if (!countAnimalType(tr.type)) continue;
    const d = dist(p.x, p.y, tr.x, tr.y);
    if (d < tr.r && d < bestD + 6) {
      bestD = Math.min(bestD, d);
      // 饿跑的进度：还能撑几天 / 今天必须喂 / 已经跑出去了
      const left = UNFED_LIMIT - 1 - tr.unfed;
      const hunger = tr.unfed >= UNFED_LIMIT ? t('runOff')
                   : left <= 0 ? t('feedToday')
                   : lang === 'en' ? (left + ' day' + (left === 1 ? '' : 's') + ' left')
                   : ('还剩 ' + left + ' 天');
      best = tr.feed > 0
        ? { kind: 'trough', tr, label: t('prTrough', { animal: nm('animal', tr.type), n: tr.feed, max: FEED_MAX }) }
        : { kind: 'trough', tr, label: t('prTroughEmpty', { animal: nm('animal', tr.type), n: hunger }) };
    }
  }
  // 5.6 森林里的蘑菇（长出来才能采）
  for (const m of MUSHROOMS) {
    if (m.picked) continue;
    const d = dist(p.x, p.y, m.x, m.y);
    if (d < bestD + 10) {
      bestD = Math.min(bestD, d);
      best = { kind: 'mushroom', m, label: `🍄 ${t('prPickMushroom')}` };
    }
  }
  // 6. 设施
  const zoneChecks = [
    ['kitchen', 'cook', t('prCook')],
    ['wardrobe', 'wardrobe', t('prWardrobe')],
    ['bin', 'sell', t('prSell')],
    ['stall', 'shop', t('prShop')],
    ['counter', 'shop', t('prShop')],
    ['petfood',  'petfood',  petSpotLabel('food')],
    ['petclean', 'petclean', petSpotLabel('clean')],
    ['petbath',  'petbath',  petSpotLabel('bath')],
    ['rack', 'rack', G.vehicle
        ? t('prPark', { v: nm('vehicle', G.vehicle) })
        : (G.vehicles.length ? t('prRide', { v: nm('vehicle', G.vehicles[G.vehicles.length - 1]) }) : t('prRackEmpty'))],
    ['hatchery', 'hatch', G.incubating.length
        ? t('hatchDays', { n: G.incubating.length, d: hatchDaysLeft() })
        : t('prHatch', { n: G.incubating.length, max: maxIncubate() })],
  ];
  for (const [zk, kind, label] of zoneChecks) {
    const z = ZONES[zk] || PET_SPOTS[zk.replace('pet', '')];
    const d = dist(p.x, p.y, z.x, z.y);
    if (d < z.r && d < bestD) { bestD = d; best = { kind, label }; }
  }
  // 6.1 水族箱特别大：不是站在正中间那一小圈，而是**贴着它前面一整条边**都能按 E
  {
    const z = ZONES.tank;
    const half = tankSize().w / 2 + 26;
    const dx = Math.max(0, Math.abs(p.x - z.x) - half);
    const dy = Math.max(0, Math.abs(p.y - (z.y + 26)) - 52);
    const d = Math.hypot(dx, dy);
    if (d < bestD) { bestD = d; best = { kind: 'tank', label: t('prTank') }; }
  }
  // 6.5 森林里的蜂巢（走到蜂巢下面就能拿蜂蜜）
  if (inHiveReach(p.x, p.y)) {
    const d = dist(p.x, p.y, HIVE.x, HIVE.y);
    if (d < bestD) {
      bestD = d;
      best = HIVE.honey > 0
        ? { kind: 'honey', label: `🍯 ${t('prHive')}` }
        : { kind: 'honeyWait', label: t('prHiveEmpty') };
    }
  }
  // 7. 池塘钓鱼：附近没有别的可交互对象时，才提示钓鱼
  //    （捡蛋、挤奶、种地这些操作优先，避免在岸边抢走交互）
  // 站在水坑边：附近没有别的可交互对象时，才提示钓鱼（取最近的那个水坑）
  let nearPond = null, nearPondD = Infinity, nearLocked = null;
  for (const pond of PONDS) {
    if (Math.abs(p.x - pond.x) < pond.w / 2 + 44 && Math.abs(p.y - pond.y) < pond.h / 2 + 44) {
      if (pond.locked) { if (!nearLocked) nearLocked = pond; continue; }
      const d = Math.max(0, pondDist(pond, p.x, p.y));
      if (d < nearPondD) { nearPondD = d; nearPond = pond; }
    }
  }
  if (!best && nearPond) best = { kind: 'fish', pond: nearPond, label: t('prFishAt', { pond: pondLabel(nearPond) }) };
  else if (!best && nearLocked) best = { kind: 'pondLocked', label: '🔒 ' + t('pondLocked') };
  return best;
}

function doInteract() {
  if (G.modalOpen) return;
  // 放置模式：按 E 把装饰放下
  if (G.placing) { placeDecoration(); return; }
  // 钓鱼中再按 = 收杆
  if (G.fishing) { reelIn(); return; }
  const target = nearestInteract();
  if (!target) return;
  const p = G.player;
  p.actionT = 0.6;

  switch (target.kind) {
    case 'item': {
      G.groundItems.splice(G.groundItems.indexOf(target.it), 1);
      addItem(target.it.id); sfx.pickup();
      note('logPickup', { item: nm('item', target.it.id) });
      bigToast(target.it.id, t('gotCard', { item: nm('item', target.it.id) }), t('gotCardSub'), 2000);
      spawnParticles(target.it.x, target.it.y - 10, '✨', 3);
      break;
    }
    case 'customer': {
      const c = target.c;
      if (canFulfillBasket(c)) {
        // 先请小朋友帮忙算要找多少零钱（小学二年级难度），答对才算成交
        openMathChallenge(c);
      } else {
        sfx.error();
        say('needMoreBasket', { list: basketMissing(c) }, 2600);
      }
      break;
    }
    case 'shear':
      target.a.wool = 0; target.a.woolT = 0;
      addItem('wool'); sfx.shear(); sfx.animalVoice('sheep', 230);
      note('logShear');
      spawnParticles(target.a.x, target.a.y - 20, '✨', 5);
      bigToast('wool', t('gotCard', { item: nm('item', 'wool') }), t('gotCardSub'), 2000);
      break;
    case 'milk':
      target.a.milkReady = false; target.a.milkT = 0;
      addItem('milk'); sfx.milk(); sfx.animalVoice('cow', 270);
      note('logMilk');
      spawnParticles(target.a.x, target.a.y - 20, '🥛', 4);
      bigToast('milk', t('gotCard', { item: nm('item', 'milk') }), t('gotCardSub'), 2000);
      break;
    case 'hungry':
      sfx.error();
      say('animalHungry', { animal: nm('animal', target.a.type) }, 2400);
      break;
    case 'trough':
      fillTrough(target.tr);
      break;
    case 'petChicken': case 'petSheep': case 'petCow':
      spawnParticles(target.a.x, target.a.y - 20, '💖', 3);
      sfx.pet(); sfx.animalVoice(target.a.type, 130, target.a);   // 摸一摸，动物会回应你
      // 摸母鸡的时候顺口说一句「今天下过蛋没有」，小朋友就不会一直等
      if (isHen(target.a)) say(target.a.laidToday ? 'henLaidToday' : 'henWillLay');
      break;
    case 'till':
      target.pl.state = 'tilled'; sfx.till();
      note('logTill');
      spawnParticles(target.pl.x, target.pl.y, '🟫', 3);
      break;
    case 'plant': {
      const seed = Object.keys(G.inventory).find(id => ITEMS[id].seed);
      if (seed && removeItem(seed)) {
        target.pl.state = 'seed'; target.pl.crop = ITEMS[seed].seed; target.pl.stage = 0; target.pl.timer = 0;
        const cd = CROP_MAP[target.pl.crop];
        if (cd) note('logPlantCrop', { crop: nm('crop', target.pl.crop), sec: Math.round(55 / cd.rate) });
        sfx.plant();
        note('logPlant', { seed: nm('item', seed) });
      }
      break;
    }
    case 'noseed':
      sfx.error(); say('noSeed');
      break;
    case 'water':
      target.pl.watered = true; sfx.water();
      note('logWater');
      spawnParticles(target.pl.x, target.pl.y - 6, '💧', 4);
      break;
    case 'harvest':
      addItem(target.pl.crop, 2);
      spawnParticles(target.pl.x, target.pl.y - 10, '✨', 6);
      sfx.harvest();
      say('harvested', { crop: nm('crop', target.pl.crop) }, 2200, false, { icon: target.pl.crop, sub: t('gotCardSub') });
      target.pl.state = 'tilled'; target.pl.crop = null; target.pl.watered = false;
      break;
    case 'mushroom': {
      // 采走这朵蘑菇，过一会儿（或睡一觉）会自己长回来
      target.m.picked = true;
      target.m.timer = 0;
      addItem('mushroom');
      sfx.pickup();
      spawnParticles(target.m.x, target.m.y - 10, '🍄', 4);
      bigToast('mushroom', t('gotCard', { item: nm('item', 'mushroom') }), t('mushroomCardSub'), 2000);
      note('logPickMushroom');
      saveGame(true);
      break;
    }
    case 'tree': {
      target.tr.fruits--;
      const fx = target.tr.x + rand(-30, 30), fy = target.tr.y + rand(-5, 15);
      G.groundItems.push({ id: target.tr.type, x: fx, y: fy, phase: rand(0, 6) });
      spawnParticles(target.tr.x, target.tr.y - 40, '🍃', 4);
      sfx.shake();
      break;
    }
    case 'cook': renderCook(); sfx.open(); openModal('cook-modal'); break;
    case 'wardrobe': renderWardrobe(); sfx.open(); openModal('wardrobe-modal'); break;
    case 'sell': renderSell(); sfx.open(); openModal('sell-modal'); break;
    case 'shop': renderShop(); sfx.open(); openModal('shop-modal'); break;
    case 'tank': renderTank(); sfx.open(); openModal('tank-modal'); break;
    case 'rack': useRack(); break;
    case 'hatch':   // 把背包里的鸡蛋放进孵蛋器（3 天后孵出小鸡）
      putEggInHatchery();
      if (G.incubating.length) {
        const left = hatchDaysLeft();
        say('hatchWait', { n: G.incubating.length, d: left }, 2200);
      }
      break;
    case 'honey':   // 森林蜂巢
      HIVE.honey--;
      addItem('honey');
      HIVE.honeyT = 0;
      sfx.pickup(); sfx.buzz(120);
      spawnParticles(HIVE.x, HIVE.y - 40, '🍯', 5);
      bigToast('honey', t('honeyGot'), t('gotCardSub'), 2400);
      note('logHoney');
      saveGame(true);
      break;
    case 'honeyWait':
      sfx.error(); say('honeyNotReady');
      break;
    case 'fish': startFishing(target.pond); break;
    case 'pondLocked':
      sfx.error(); say('pondLocked', null, 3000);
      break;
    case 'greet': {
      const v = target.c;
      spawnParticles(v.x, v.y - 24, '💖', 4);
      sfx.happy(); sfx.pet();
      say('greetVisitor', { name: custName(v) }, 2600);
      break;
    }
    case 'petfood':
      withPet((p) => feedPet(p));
      break;
    case 'petclean':
      withPet((p) => cleanPet(p));
      break;
    case 'petbath':
      withPet((p) => bathePet(p));
      break;
  }
}

// ---------------- 钓鱼 ----------------
// 在指定水坑抛竿（水坑越大等得越久、咬钩窗口越短、鱼越值钱）
function startFishing(pond) {
  if (!pond) pond = PONDS[0];
  const p = G.player;
  const ang = Math.atan2(pond.y - p.y, pond.x - p.x);
  const bx = p.x + Math.cos(ang) * 70, by = p.y + Math.sin(ang) * 45;
  const rip = pond.rip;
  const wait = rip.lv <= 1 ? rand(1.2, 3) : rip.lv === 3 ? rand(2.2, 4.5) : rand(3.2, 6);
  G.fishing = {
    phase: 'wait', timer: wait, bx, by, pond,
    lv: rip.lv, rip, biteWin: 1.45 - rip.lv * 0.12, ripple: 0,
  };
  p.dir = pond.x < p.x ? 'left' : 'right';   // 面朝水坑，鱼竿握在手里
  sfx.cast();
  say('castLine');
  note('logRipple', { pond: pondLabel(pond), size: lang === 'en' ? rip.nameEn : rip.name });
}
function reelIn() {
  const f = G.fishing;
  if (f.phase === 'bite') {
    const pond = f.pond || PONDS[0];
    const id = pick(pond.pool);
    addItem(id);
    G.seaCaught[id] = (G.seaCaught[id] || 0) + 1;   // 记进图鉴
    sfx.catchf();
    spawnParticles(f.bx, f.by, '💦', 8);
    spawnParticles(f.bx, f.by - 12, ITEMS[id].icon, 1);
    say('caught', { fish: nm('item', id), pond: pondLabel(pond) }, 2600, false, { icon: id, sub: t('gotCardSub') });
    G.pets.forEach(function (pp) { pp.mood = 2; });
    saveGame(true);
  } else {
    sfx.splash(); say('reelIn');
  }
  G.fishing = null;
}

// ---------------- 客人系统 ----------------
// 客人只会买「农场能产出」的东西：已采摘的、还能摘/挤/剪的、材料够做的菜
// 鱼类和海洋生物不在此列（准备太久、太随机）
const FARM_GOODS = ['egg', 'milk', 'wool', 'honey', 'mushroom', ...CROPS.map(c => c.id), ...FRUIT_IDS];
const SEA_SET = {};
SEA_ALL.forEach(id => { SEA_SET[id] = true; });

function customerPool() {
  const inv = G.inventory || {};
  const pool = [];
  const add = (id) => { if (ITEMS[id] && !SEA_SET[id] && pool.indexOf(id) < 0) pool.push(id); };
  // ① 背包里已有的农场货
  for (const id of FARM_GOODS) if ((inv[id] || 0) > 0) add(id);
  // ② 农场上还能拿到的（还没采摘/挤奶/剪毛也算）
  if (G.animals.some(a => a.type === 'chicken')) add('egg');
  if (G.animals.some(a => a.type === 'sheep')) add('wool');
  if (G.animals.some(a => a.type === 'cow')) add('milk');
  for (const tr of G.trees) if (tr.fruits > 0) add(tr.type);          // 树上还有果子
  for (const pl of G.plots) if (pl.crop) add(pl.crop);                 // 田里种着的
  for (const id in inv) if (ITEMS[id] && ITEMS[id].seed) add(ITEMS[id].seed);
  // ③ 材料已经够做、而且**厨房已经解锁**的菜（需要鱼的菜不算）
  //    厨房等级不够时，就算材料凑齐了也不能做，客人自然也不该点它
  for (let i = 0; i < RECIPES.length; i++) {
    if (!recipeUnlocked(i)) continue;
    const r = RECIPES[i];
    const needsSea = Object.keys(r.needs).some(k => SEA_SET[k] || k === 'fish');
    if (!needsSea && hasItems(r.needs)) add(r.id);
  }
  if (!pool.length) {                 // 兜底：保证客人总有东西能买
    if (G.animals.some(a => a.type === 'chicken')) add('egg');
    else if (G.animals.length) add('milk');
    else if (G.trees.length) add(G.trees[0].type);
    else add('egg');
  }
  return pool;
}

// 客人的名字按当前语言显示
function custName(c) { return (lang === 'en' ? c.nameObj.en : c.nameObj.zh); }

// 组一张购物清单：客人可能一次买好几件。
//   · 大部分是「同一种东西买 1~3 个」（对应算式 100 − 38 × 2 = ?）
//   · 有时是「两样东西各 1 个」（对应算式 100 − (24 + 15) = ?）
// 注意：这里挑的是「农场**拿得到**的东西」（customerPool 给的清单），
// 不是玩家此刻背包里已经有的 —— 和原来的玩法一致：客人点单，小朋友先去收，
// 收齐了再卖给 TA（收不齐就只能看着客人走掉）。数量按价格控制：贵的只买 1 个。
function basketQtyRange(id) {
  const price = salePriceOf(id);
  let max = price < 20 ? 3 : price < 40 ? 2 : 1;   // 便宜的多买几个，贵的一次只买 1 个
  // 动物产品是「按天慢慢产出」的（一只母鸡一天才一个蛋），别一次点太多，
  // 不然小朋友要等好几天才凑得齐 —— 客人最多点「农场一天大概能产出多少」
  if (id === 'egg') max = Math.min(max, countHens());
  else if (id === 'milk') max = Math.min(max, countAnimalType('cow'));
  else if (id === 'wool') max = Math.min(max, countAnimalType('sheep'));
  else if (id === 'honey') max = Math.min(max, 2);
  return Math.max(1, Math.min(3, max));
}
function buildBasket() {
  const pool = customerPool();
  if (!pool.length) return [{ id: 'egg', qty: 1 }];
  const id = pick(pool);
  const maxQ = basketQtyRange(id);
  let qty = 1;
  // 一半的机会买复数个（2 ~ maxQ）
  if (maxQ > 1 && Math.random() < 0.5) qty = 2 + Math.floor(Math.random() * (maxQ - 1));
  const basket = [{ id: id, qty: qty }];
  // 再有三成的机会带上另一样（各 1 个），凑成「先加后减」的算式
  if (qty === 1 && pool.length > 1 && Math.random() < 0.3) {
    const rest = pool.filter(function (x) { return x !== id; });
    const other = pick(rest);
    if (other && salePriceOf(id) + salePriceOf(other) <= 130) basket.push({ id: other, qty: 1 });
  }
  return basket;
}

function spawnCustomer() {
  const items = buildBasket();
  const want = items[0].id;
  const hatKeys = Object.keys(OUTFITS.hat).filter(k => k !== 'none');
  const hairKeys = Object.keys(OUTFITS.hair).filter(k => k !== 'none');
  const dressKeys = OUTFITS.dress ? Object.keys(OUTFITS.dress).filter(k => k !== 'none') : [];
  const shoeKeys = Object.keys(OUTFITS.shoes).filter(k => k !== 'none');
  // 客人也穿得花里胡哨：有一半的机会穿裙子（穿裙子就不画上衣和裤子）
  const wearDress = Math.random() < 0.45 && dressKeys.length;
  const c = {
    nameObj: pick(CUSTOMER_NAMES),
    gender: Math.random() < 0.5 ? 'boy' : 'girl',
    hat: Math.random() < 0.35 ? 'none' : pick(hatKeys),        // 帽子
    hair: Math.random() < 0.3 ? 'none' : pick(hairKeys),        // 头饰
    shirt: pick(Object.keys(OUTFITS.shirt)),                    // 上衣
    dress: wearDress ? pick(dressKeys) : 'none',                // 裙子
    pants: pick(Object.keys(OUTFITS.pants)),                    // 裤子
    shoes: Math.random() < 0.3 ? 'none' : pick(shoeKeys),       // 鞋子
    hairStyle: pick(HAIR_STYLES),                               // 发型
    hairColor: pick(HAIR_COLORS),                               // 发色
    x: WORLD_W + 30, y: QUEUE_SLOTS[0].y + rand(-14, 14),
    dir: 'left', moving: true, walkPhase: 0, phase: rand(0, 6), t: 0,
    kind: 'buyer',
    seq: (G.customerSeq = (G.customerSeq || 0) + 1),   // 先来后到，用来排队
    qSlot: 0,                                          // 站在队伍的第几个位置
    items: items, want: want, state: 'come', happy: false,
    pet: null,
  };
  if (Math.random() < 0.7) {   // 大部分客人带一只小宠物
    c.pet = {
      type: pick(['dog', 'cat', 'duck', 'goose']),
      x: c.x + rand(24, 46), y: c.y + rand(8, 26), dir: 'left',
      moving: false, walkPhase: 0, phase: rand(0, 6), happy: 0,
      hat: Math.random() < 0.3 ? pick(Object.keys(PET_HATS)) : 'none',
    };
  }
  G.customers.push(c);
  say('customerCome', { name: custName(c) }, 2200);
  note('logCustomerWant', { name: custName(c), item: basketLabel(c) });
  sfx.bell();
}

// ============================================================
//            🎫 来参观的客人（观赏费）
// ------------------------------------------------------------
// 农场上**动物 / 观赏动物 / 水族箱里的鱼**越多：
//   ① 同时能接待的参观客人越多（visitorSlots）
//   ② 每个人给的观赏费越高（visitorFee）
// 参观客人在农场里自己逛：走到动物跟前看一会儿、付一次观赏费，看完 1~3 处就走。
// ============================================================
// 农场的「看头」有多少（鱼和观赏动物更稀罕，算 2 分）
function attractionScore() {
  return G.animals.length + G.zoo.length * 2 + G.tank.length * 2;
}
// 同时最多能接待几位参观客人
function visitorSlots() {
  const s = attractionScore();
  if (s <= 0) return 0;
  return Math.min(4, 1 + Math.floor(s / 8));
}
// 看一处景点的观赏费：农场越大给得越多，同一处东西越多也越值
function visitorFee(n) {
  const s = attractionScore();
  const base = 4 + Math.sqrt(s) * 4;
  const bonus = 1 + Math.min(1.4, Math.max(0, (n || 1) - 1) * 0.1);
  return Math.max(4, Math.round(base * bonus));
}
// 现在能看的景点有哪些
function attractionSpots() {
  const out = [];
  const push = function (id, n) { if (n > 0) out.push({ id: id, n: n, name: t('spot_' + id) }); };
  push('chicken', countAnimalType('chicken'));
  push('sheep', countAnimalType('sheep'));
  push('cow', countAnimalType('cow'));
  push('zoo', G.zoo.length);
  push('tank', G.tank.length);
  return out;
}
// 到某一处景点「站在哪里看」（动物会走动，所以每次现算）
function spotLookAt(spot) {
  if (spot.id === 'tank') return { x: ZONES.tank.x, y: ZONES.tank.y + 78, ax: ZONES.tank.x, ay: ZONES.tank.y };
  if (spot.id === 'zoo') {
    const z = G.zoo[Math.floor(Math.random() * G.zoo.length)];
    if (!z) return null;
    return { x: z.x, y: z.y + 48, ax: z.x, ay: z.y };
  }
  const list = G.animals.filter(function (a) { return a.type === spot.id; });
  const a = list[Math.floor(Math.random() * list.length)];
  if (!a) return null;
  return { x: a.x, y: a.y + 48, ax: a.x, ay: a.y };
}
// 别走进水里（干土坑也不踩）
function pushOutOfPonds(x, y) {
  // 右下角的大海：走进海里就往回推（往最近的岸边推）
  if (pointInSea(x, y)) {
    let bestD = Infinity, bx = x, by = y;
    const coastEdges = SEA_POLY.length - 2;      // 只往「岸线」那几条边上推，不往地图边界推
    for (let i = 0; i < coastEdges; i++) {
      const a = SEA_POLY[i], b = SEA_POLY[i + 1];
      const vx = b.x - a.x, vy = b.y - a.y;
      const len2 = vx * vx + vy * vy || 1;
      let tt = ((x - a.x) * vx + (y - a.y) * vy) / len2;
      tt = Math.max(0, Math.min(1, tt));
      const px = a.x + vx * tt, py = a.y + vy * tt;
      const d = Math.hypot(x - px, y - py);
      if (d < bestD) { bestD = d; bx = px; by = py; }
    }
    // 朝「岸上」推：从玩家指向最近的岸点，再越过岸点一点点
    const ang = Math.atan2(by - y, bx - x);
    x = bx + Math.cos(ang) * 24;
    y = by + Math.sin(ang) * 24;
  }
  for (const pc of PONDS) {
    const ex = (x - pc.x) / (pc.w / 2 + 14), ey = (y - pc.y) / (pc.h / 2 + 14);
    const d = ex * ex + ey * ey;
    if (d < 1 && d > 0.0001) {
      const k = 1 / Math.sqrt(d);
      x = pc.x + (x - pc.x) * k;
      y = pc.y + (y - pc.y) * k;
    }
  }
  return { x: Math.max(24, Math.min(WORLD_W - 24, x)), y: Math.max(150, Math.min(WORLD_H - 20, y)) };
}
// 安排一条参观路线：按喜好排出 1~3 处
function planVisit(c) {
  const spots = attractionSpots();
  if (!spots.length) return [];
  const like = function (s) {
    if (c.theme === 'tank') return s.id === 'tank' ? 0 : 2;
    return s.id === 'tank' ? 2 : 0;
  };
  const sorted = spots.slice().sort(function (a, b) {
    return (like(a) - like(b)) + (Math.random() - 0.5) * 0.8;
  });
  return sorted.slice(0, Math.min(sorted.length, 1 + Math.floor(Math.random() * 3)));
}
// 去下一处；没有了就准备回家
function nextVisitStop(c) {
  c.target = null; c.targetSpot = null;
  let guard = 0;
  while (c.plan && c.plan.length && guard++ < 6) {
    const spot = c.plan.shift();
    const at = spotLookAt(spot);
    if (!at) continue;                       // 那处已经没东西可看了
    c.targetSpot = spot; c.target = at; c.state = 'walk';
    return;
  }
  c.state = 'leave';
  if (c.earned > 0) { note('logVisitorLeave', { name: custName(c), n: c.earned }); }
  sfx.happy();
}
function spawnVisitor() {
  const spots = attractionSpots();
  if (!spots.length) return;
  const hatKeys = Object.keys(OUTFITS.hat).filter(k => k !== 'none');
  const hairKeys = Object.keys(OUTFITS.hair).filter(k => k !== 'none');
  const dressKeys = Object.keys(OUTFITS.dress).filter(k => k !== 'none');
  const shoeKeys = Object.keys(OUTFITS.shoes).filter(k => k !== 'none');
  const wearDress = Math.random() < 0.45 && dressKeys.length;
  const c = {
    kind: 'visitor',
    nameObj: pick(CUSTOMER_NAMES),
    gender: Math.random() < 0.5 ? 'boy' : 'girl',
    hat: Math.random() < 0.4 ? 'none' : pick(hatKeys),
    hair: Math.random() < 0.35 ? 'none' : pick(hairKeys),
    shirt: pick(Object.keys(OUTFITS.shirt)),
    dress: wearDress ? pick(dressKeys) : 'none',
    pants: pick(Object.keys(OUTFITS.pants)),
    shoes: Math.random() < 0.3 ? 'none' : pick(shoeKeys),
    hairStyle: pick(HAIR_STYLES), hairColor: pick(HAIR_COLORS),
    x: WORLD_W + 30, y: rand(200, WORLD_H - 200),
    dir: 'left', moving: true, walkPhase: 0, phase: rand(0, 6), t: 0,
    theme: pick(['zoo', 'zoo', 'tank']),      // 想看动物 / 想看水族馆
    state: 'walk', lookT: 0, target: null, targetSpot: null,
    visited: 0, earned: 0, happy: false, pet: null,
  };
  c.plan = planVisit(c);
  if (!c.plan.length) return;
  nextVisitStop(c);
  if (c.state !== 'walk') return;
  if (Math.random() < 0.55) {   // 参观的人有时也带一只小宠物
    c.pet = {
      type: pick(['dog', 'cat', 'duck', 'goose']),
      x: c.x + rand(24, 46), y: c.y + rand(8, 26), dir: 'left',
      moving: false, walkPhase: 0, phase: rand(0, 6), happy: 0,
      hat: Math.random() < 0.3 ? pick(Object.keys(PET_HATS)) : 'none',
    };
  }
  G.customers.push(c);
  say('logVisitorCome', { name: custName(c), what: t(c.theme === 'tank' ? 'themeTank' : 'themeZoo') }, 2600);
  sfx.bell();
}
// 参观客人自己的走动逻辑
function updateVisitor(c, dt) {
  c.t += dt;
  if (c.state === 'walk') {
    if (!c.target) { nextVisitStop(c); return; }
    const d = dist(c.x, c.y, c.target.x, c.target.y);
    if (d < 14) {
      c.state = 'look';
      c.lookT = rand(4.5, 8);
      c.moving = false;
      if (c.targetSpot) c.dir = c.target.ax < c.x ? 'left' : 'right';
    } else {
      const a = Math.atan2(c.target.y - c.y, c.target.x - c.x);
      const spd = 92;
      const nx = c.x + Math.cos(a) * spd * dt, ny = c.y + Math.sin(a) * spd * dt;
      const fx = pushOutOfPonds(nx, ny);
      c.x = fx.x; c.y = fx.y;
      c.dir = Math.cos(a) < 0 ? 'left' : 'right';
      c.moving = true; c.walkPhase += dt * 10;
    }
  } else if (c.state === 'look') {
    c.moving = false;
    c.lookT -= dt;
    const spot = c.targetSpot;
    if (Math.random() < dt * 1.6) {
      spawnParticles(c.x + rand(-14, 14), c.y - 30, pick(['💖', '✨', '👀']), 1);
    }
    if (c.lookT <= 0) {
      // 看完一处 → 付观赏费
      const fee = visitorFee(spot ? spot.n : 1);
      c.earned += fee;
      c.visited++;
      G.coins += fee;
      renderHUD();
      coinBurst(c.x, c.y - 44, fee);
      sfx.coin(); sfx.happy();
      addLog(t('logVisitorPaid', { name: custName(c), spot: spot ? spot.name : '', n: fee }));
      if (c.visited === 1 && Math.random() < 0.7) {
        toast(t('visitorSay', { name: custName(c), spot: spot ? spot.name : '' }), 2000);
      }
      nextVisitStop(c);
    }
  } else if (c.state === 'leave') {
    const tx = WORLD_W + 40;
    const d = Math.abs(c.x - tx);
    if (d < 20) { c.gone = true; return; }
    c.x += 95 * dt;
    c.dir = 'right';
    c.moving = true; c.walkPhase += dt * 10;
  }
}

// ---------------- 更新逻辑 ----------------
function update(dt) {
  G.t += dt;
  const p = G.player;

  // 时间流逝
  if (G.started && G.sleepFade <= 0 && !G.bed.active) {
    G.timeMin += dt * (DAY_END - DAY_START) / DAY_LENGTH;
    if (G.timeMin >= DAY_END) openBedtime();     // 天黑啦 → 先做睡前任务
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
    dx += touchMove.x; dy += touchMove.y;   // 虚拟摇杆
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const spd = WALK_SPEED * (G.vehicle ? (VEHICLE_MAP[G.vehicle] || {}).speed || 1 : 1);
      p.x = Math.max(20, Math.min(WORLD_W - 20, p.x + dx / len * spd * dt));
      p.y = Math.max(120, Math.min(WORLD_H - 20, p.y + dy / len * spd * dt));
      p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      p.moving = true;
      p.walkPhase += dt * 11;
      // 脚步声（左右脚交替）
      const stepIdx = Math.floor(p.walkPhase / Math.PI);
      if (stepIdx !== G.lastStep) { G.lastStep = stepIdx; sfx.step(stepIdx % 2); }
    }
  }
  if (p.actionT > 0) p.actionT -= dt;

  // 水坑 / 大海不能踩水：走到水边会被轻轻推回岸上
  if (pointInSea(p.x, p.y)) {
    const back = pushOutOfPonds(p.x, p.y);
    p.x = back.x; p.y = back.y;
  }
  for (const pc of PONDS) {
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

  // --- 宠物跟随（宠物房间升级后可以有好几只，排成一队跟着走） ---
  for (let i = 0; i < G.pets.length; i++) {
    const pet = G.pets[i];
    const follow = i === 0 ? p : G.pets[i - 1];
    const gap = i === 0 ? 55 : 46;
    const pd = dist(pet.x, pet.y, follow.x, follow.y);
    if (pd > gap) {
      const a = Math.atan2(follow.y - pet.y, follow.x - pet.x);
      const spd = pd > 160 ? 220 : 130;
      pet.x += Math.cos(a) * spd * dt;
      pet.y += Math.sin(a) * spd * dt;
      pet.dir = Math.cos(a) < 0 ? 'left' : 'right';
      pet.moving = true;
      pet.walkPhase += dt * 13;
    } else pet.moving = false;
    if (pet.happy > 0) pet.happy -= dt;
    if (pet.mood > 0) pet.mood -= dt;
    // 「正在吃东西 / 打扫 / 洗澡」的动画计时；吃饭时停下来专心吃
    if (pet.anim) {
      pet.anim.t += dt;
      if (pet.anim.kind === 'eat') pet.moving = false;
      if (pet.anim.t >= pet.anim.dur) pet.anim = null;
    }
    // 三个需要照顾的指标会慢慢变差：饱腹度下降、清洁度下降、隔一阵子拉一次便便
    pet.hunger = Math.max(0, pet.hunger - dt * 0.5);
    pet.clean = Math.max(0, pet.clean - dt * 0.35);
    if (pet.poop < 3) {
      pet.poopT -= dt;
      if (pet.poopT <= 0) {
        pet.poop++;
        pet.poopT = rand(70, 130);
        if (i === 0 || Math.random() < 0.5) spawnParticles(pet.x, pet.y + 4, '💩', 1);
      }
    }
    // 太久没人管：头顶冒一个小图标提醒（会稍微掉队）
    if (petIsSad(pet)) {
      pet.sadT = (pet.sadT || 0) + dt;
      if (pet.sadT > 26) { pet.sadT = 0; sfx.petVoice(pet.type, 200); }
    } else pet.sadT = 0;
  }

  // --- 动物 AI：闲逛 + 生产（母鸡下蛋、小鸡只在鸡棚附近乱走） ---
  for (const a of G.animals) {
    a.peck = Math.max(0, a.peck - dt);
    const chick = isChick(a);
    if (a.moving) {
      const d = dist(a.x, a.y, a.tx, a.ty);
      if (d < 6) { a.moving = false; a.waitT = rand(1.5, 4); }
      else {
        const ang = Math.atan2(a.ty - a.y, a.tx - a.x);
        const spd = a.type === 'chicken' ? (chick ? 42 : 55) : 32;
        a.x += Math.cos(ang) * spd * dt;
        a.y += Math.sin(ang) * spd * dt;
        a.dir = Math.cos(ang) < 0 ? 'left' : 'right';
        a.walkPhase += dt * (a.type === 'chicken' ? (chick ? 15 : 12) : 7);
      }
    } else {
      a.waitT -= dt;
      if (a.type === 'chicken' && Math.random() < dt * (chick ? 0.85 : 0.5)) a.peck = 0.5;
      if (a.waitT <= 0) {
        // 小鸡就在鸡棚附近走走，母鸡可以走远一点；
        // 饿跑的动物（连续 3 天没饲料）会跑出围栏到处乱走
        const base = a.type === 'chicken' ? (chick ? a.home.r * 0.55 : a.home.r) : a.home.r;
        const r = a.tired ? base * 2.2 : base;
        a.tx = a.home.x + rand(-r, r);
        a.ty = a.home.y + rand(-r * 0.8, r * 0.8);
        a.tx = Math.max(30, Math.min(WORLD_W - 30, a.tx));
        a.ty = Math.max(130, Math.min(WORLD_H - 30, a.ty));
        a.moving = true;
        // 小鸡会啾啾叫
        if (chick && Math.random() < 0.25) sfx.chick();
      }
    }
    // 饿跑了就先不产出（要往食槽里放饲料）
    const starving = !!a.tired;

    // 生产：只有母鸡会下蛋，而且**一只母鸡一天最多下一个蛋**
    //   · 小鸡（chick）只到处跑、啄米，永远不下蛋
    //   · 母鸡今天已经下过了（laidToday）就等到第二天早上再来
    //   · 饿跑了（starving）的母鸡不下蛋，计时器也一起停住，喂饱了继续
    if (a.type === 'chicken') {
      if (!chick && !starving && !a.laidToday) {
        a.eggT -= dt;
        if (a.eggT <= 0) {
          a.laidToday = true;
          G.groundItems.push({ id: 'egg', x: a.x + rand(-15, 15), y: a.y + rand(5, 15), phase: rand(0, 6) });
          spawnParticles(a.x, a.y - 15, '🎵', 1);
          sfx.cluck();
          note('logEgg', { hen: countHens(), laid: countHensLaidToday() });
        }
      }
    } else if (a.type === 'sheep' && a.wool < 1 && !starving) {
      a.woolT += dt;
      if (a.woolT > 80) { a.wool = 1; spawnParticles(a.x, a.y - 20, '✨', 4); sfx.sparkle(); note('logWoolBack'); }
    } else if (a.type === 'cow' && !a.milkReady && !starving) {
      a.milkT += dt;
      if (a.milkT > 60) { a.milkReady = true; spawnParticles(a.x, a.y - 20, '🥛', 2); sfx.sparkle(); note('logMilkBack'); }
    }
  }

  // --- 动物园动物：随机散步 + 随机叫 ---
  for (const z of G.zoo) {
    const zd = ZOO_MAP[z.type] || ZOO_SHOP[0];
    if (z.moving) {
      const dx = z.tx - z.x, dy = z.ty - z.y;
      const d = Math.hypot(dx, dy);
      if (d < 5) {
        // 走到了：停下歇一会儿，并且朝着刚走的方向站住
        z.moving = false;
        z.waitT = rand(1.2, 4.5) * (1 + zd.size / 90);
        z.walkPhase = 0; z.speedK = 0;
      } else {
        const ang = Math.atan2(dy, dx);
        // 刚起步慢慢加速到 1（1 秒左右），不会「嗖」地一下弹出去
        z.speedK = Math.min(1, (z.speedK == null ? 1 : z.speedK) + dt * 1.2);
        // 步伐带动速度轻微起伏（一步一步的节奏感）
        z.walkPhase += dt * (4.6 + zd.size * 0.055);
        const gait = 0.86 + Math.abs(Math.sin(z.walkPhase)) * 0.26;
        const spd = (26 + zd.size * 0.22) * z.speedK * gait;
        z.x += Math.cos(ang) * spd * dt;
        z.y += Math.sin(ang) * spd * dt;
        // 朝着前进方向：用水平分量的正负来决定（别用角度，避免抖动时来回翻）
        if (Math.abs(Math.cos(ang)) > 0.18) z.dir = Math.cos(ang) < 0 ? 'left' : 'right';
      }
    } else {
      z.waitT -= dt;
      if (z.waitT <= 0) { const sp = zooRandomSpot(z.home); z.tx = sp.x; z.ty = sp.y; z.moving = true; }
    }
    // 随机叫一声
    z.voiceT -= dt;
    if (z.voiceT <= 0) {
      z.voiceT = rand(8, 26);
      if (!G.modalOpen && G.started) sfx.zooVoice(zd.v, zd.p);
    }
  }

  // --- 作物生长 ---
  for (const pl of G.plots) {
    if (pl.state === 'seed' || pl.state === 'growing') {
      const speed = (pl.watered || G.weather === 'rain') ? 1 : 0.25;
      const cdef = CROP_MAP[pl.crop];
      pl.timer += dt * speed * ((cdef && cdef.rate) || 1);      // 不同蔬菜生长快慢不同
      if (G.weather === 'rain') pl.watered = true;
      if (pl.timer > 25 && pl.state === 'seed') { pl.state = 'growing'; }
      else if (pl.timer > 55 && pl.state === 'growing') {
        pl.state = 'ripe';
        spawnParticles(pl.x, pl.y - 15, '✨', 4);
      }
    }
  }

  // --- 找零钱小挑战的倒计时 ---
  if (G.math) {
    G.math.t -= dt;
    const bar = $('math-bar');
    if (bar) {
      bar.style.width = Math.max(0, (G.math.t / MATH_TIME) * 100) + '%';
      bar.classList.toggle('hurry', G.math.t <= 5);
    }
    const timeBox = $('math-time');
    if (timeBox) {
      timeBox.textContent = Math.max(0, Math.ceil(G.math.t)) + 's';
      timeBox.classList.toggle('hurry', G.math.t <= 5);
    }
    if (G.math.t <= 0) mathTimeout();
  }

  // --- 森林蘑菇长回来 ---
  for (const m of MUSHROOMS) {
    if (!m.picked) continue;
    m.timer += dt;
    if (m.timer > MUSHROOM_REGROW) {
      m.picked = false;
      m.timer = 0;
      spawnParticles(m.x, m.y - 10, '✨', 3);
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
  // 买东西的客人：最多同时来 MAX_BUYERS 位，在销售门面右边排成一队
  G.customerTimer -= dt;
  if (G.customerTimer <= 0 && !G.bed.active &&
      G.customers.filter(c => c.kind !== 'visitor').length < MAX_BUYERS) {
    G.customerTimer = rand(35, 65);
    spawnCustomer();
  }
  // 排队顺序：还在等 / 还在走过来的客人按先来后到，依次站到 1、2、3… 号位
  // （前面的客人买完走了，后面的会自动往前挪一格）
  const queued = G.customers.filter(c => c.kind === 'buyer' && (c.state === 'come' || c.state === 'wait'));
  queued.sort((a, b) => (a.seq || 0) - (b.seq || 0));
  queued.forEach((c, i) => { c.qSlot = Math.min(i, QUEUE_SLOTS.length - 1); });
  // 🎫 来参观的客人：农场越热闹，来的越勤、同时能接待的越多
  G.visitorTimer -= dt;
  if (G.visitorTimer <= 0) {
    G.visitorTimer = rand(16, 34);
    const now = G.customers.filter(c => c.kind === 'visitor').length;
    if (G.started && !G.bed.active && now < visitorSlots()) spawnVisitor();
  }
  for (let i = G.customers.length - 1; i >= 0; i--) {
    const c = G.customers[i];
    if (c.gone) { G.customers.splice(i, 1); continue; }
    // 参观的客人走自己的一条逻辑（逛农场、看动物、付观赏费）
    if (c.kind === 'visitor') { updateVisitor(c, dt); continue; }
    c.t += dt;
    if (c.state === 'leave') {
      // 买完 / 等不到就走了：往右边走出农场
      const tx = WORLD_W + 40;
      if (Math.abs(c.x - tx) < 20) { G.customers.splice(i, 1); continue; }
      c.x += 95 * dt;
      c.dir = 'right'; c.moving = true; c.walkPhase += dt * 10;
    } else {
      // 客人站在「销售门面」右边的队伍里（come = 正在走过来，wait = 站好了）
      const slot = QUEUE_SLOTS[Math.min(c.qSlot || 0, QUEUE_SLOTS.length - 1)];
      const d = dist(c.x, c.y, slot.x, slot.y);
      if (d > 8) {
        const a = Math.atan2(slot.y - c.y, slot.x - c.x);
        c.x += Math.cos(a) * 95 * dt;
        c.y += Math.sin(a) * 95 * dt;
        c.dir = Math.cos(a) < 0 ? 'left' : 'right';
        c.moving = true; c.walkPhase += dt * 10;
      } else {
        c.moving = false;
        if (c.state === 'come') { c.state = 'wait'; c.dir = 'left'; }   // 站好了，脸朝着柜台
      }
      if (c.state === 'wait') {
        // ★ 客人的耐心变得很长：只要天还没黑，他就一直在队伍里等着，
        //   最长可以等到当天结束（20:00）才回家 —— 小朋友慢慢凑东西也不会跑掉
        //   （不看秒表，直接看游戏里的钟点；客人对象上不再存 waitT）
        if (G.timeMin >= DAY_END - 0.5) {
          c.state = 'leave';
          spawnParticles(c.x, c.y - 30, '💦', 3);
          sfx.sad();
          say('customerGone', { name: custName(c) }, 2200);
        }
      }
    }
    // 客人的宠物跟着客人走
    if (c.pet) {
      const pd = dist(c.pet.x, c.pet.y, c.x, c.y);
      if (pd > 46) {
        const pa = Math.atan2(c.y - c.pet.y, c.x - c.pet.x);
        const pspd = pd > 150 ? 200 : 125;
        c.pet.x += Math.cos(pa) * pspd * dt;
        c.pet.y += Math.sin(pa) * pspd * dt;
        c.pet.dir = Math.cos(pa) < 0 ? 'left' : 'right';
        c.pet.moving = true; c.pet.walkPhase += dt * 12;
      } else c.pet.moving = false;
    }
  }

  // --- 钓鱼 ---
  if (G.fishing) {
    const f = G.fishing;
    f.timer -= dt;
    f.ripple = (f.ripple || 0) + dt * (0.6 + f.lv * 0.12);
    if (f.phase === 'wait' && f.timer <= 0) {
      f.phase = 'bite'; f.timer = f.biteWin || 1.1;
      sfx.bite();
    } else if (f.phase === 'bite' && f.timer <= 0) {
      G.fishing = null;
      sfx.escape();
      say('fishEscaped');
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

  // --- 森林：蜂巢慢慢酿出新的蜂蜜 ---
  if (HIVE.honey < HIVE.max) {
    HIVE.honeyT += dt;
    if (HIVE.honeyT > HONEY_EVERY) {
      HIVE.honeyT = 0;
      HIVE.honey++;
      spawnParticles(HIVE.x, HIVE.y - 34, '🍯', 2);
      sfx.sparkle();
      note('logHoneyReady');
    }
  }

  // --- 环境音：偶尔听到动物的叫声（更生动） ---
  if (G.started && !G.modalOpen && G.animals.length) {
    G.ambientT -= dt;
    if (G.ambientT <= 0) {
      G.ambientT = rand(6, 16);
      const a = pick(G.animals);
      sfx.animalVoice(a.type, 0, a);
    }
  }

  // --- 自动存档 ---
  if (G.started && G.sleepFade === 0) {
    G.saveT += dt;
    if (G.saveT >= SAVE_EVERY) saveGame(true);   // 自动存档不刷日志
  }

  // --- 相机（画面放大了，可视范围要相应缩小） ---
  const camW = VIEW_W / CAMERA_ZOOM, camH = VIEW_H / CAMERA_ZOOM;
  G.cam.x = Math.max(0, Math.min(WORLD_W - camW, p.x - camW / 2));
  G.cam.y = Math.max(0, Math.min(WORLD_H - camH, p.y - camH / 2));

  // --- 交互提示 ---
  const pr = $('prompt');
  const actionBtn = $('touch-action');
  if (G.placing && !G.modalOpen) {
    const d = DECOR_SHOP.find(v => v.id === G.placing.id);
    pr.textContent = t('prPlace', { decor: `${d.icon} ${nm('decor', d.id)}`, key: KEY_HINT, extra: isTouch ? '' : ' · ' + t('cancelHint') });
    pr.classList.remove('hidden');
  } else if (!G.modalOpen && !G.fishing && G.sleepFade === 0) {
    const it = nearestInteract();
    if (it) { pr.textContent = `[${KEY_HINT}] ${it.label}`; pr.classList.remove('hidden'); }
    else pr.classList.add('hidden');
  } else if (G.fishing && G.fishing.phase === 'bite') {
    pr.textContent = t('prBite', { key: KEY_HINT });
    pr.classList.remove('hidden');
  } else if (G.fishing) {
    const rip = G.fishing.rip || {};
    const ripName = lang === 'en' ? (rip.nameEn || '') : (rip.name || '');
    pr.textContent = t('prFishing', { key: KEY_HINT }) + (ripName ? ' · ' + ripName : '');
    pr.classList.remove('hidden');
  } else pr.classList.add('hidden');
  // 钓鱼咬钩时，动作按钮闪烁提醒（手机端一眼能看到）
  if (actionBtn) actionBtn.classList.toggle('urgent', !!(G.fishing && G.fishing.phase === 'bite'));

  renderHUD();
}

// ============================================================
//   🌙 睡前任务：刷牙 → 洗脸 → 涂脸（给小小朋友的点击 / 涂抹小游戏）
// ------------------------------------------------------------
// 到了晚上 8 点不再直接睡，先弹出这个小游戏：
//   · 刷牙：手指当牙刷，把牙齿上的小黄点刷掉
//   · 洗脸：手指当毛巾，把脸上的小泥点擦掉
//   · 涂脸：手指当面霜，把香香涂满小脸
// 三件事都做到 100%，下面的「去睡觉」按钮才会亮起来 —— 点它才真的睡觉。
// 玩法就是「按一按、抹一抹」，不用认字也能玩。
// ============================================================
const BED_STEPS = [
  { key: 'brush', icon: '🪥', nameKey: 'bedStepBrush', tipKey: 'bedTipBrush' },
  { key: 'wash',  icon: '🧽', nameKey: 'bedStepWash',  tipKey: 'bedTipWash'  },
  { key: 'cream', icon: '🧴', nameKey: 'bedStepCream', tipKey: 'bedTipCream' },
];
// 每一步用多少「小格」、手指多粗：刷牙的牙齿大、格子粗一点；洗脸 / 涂脸的脸小，格子细一点
const BED_GRID = [
  { cols: 8,  rows: 6, bw: 52 },   // 刷牙
  { cols: 11, rows: 8, bw: 40 },   // 洗脸
  { cols: 11, rows: 8, bw: 40 },   // 涂脸
];
const bedCanvas = $('bed-canvas');
const bctx = bedCanvas ? bedCanvas.getContext('2d') : null;
const BED_W = bedCanvas ? bedCanvas.width : 330;
const BED_H = bedCanvas ? bedCanvas.height : 250;
const BED_FACE = { x: BED_W / 2, y: 128, r: 92, hairTop: -20, safeGap: 14 };  // 小脸（hairTop = 头发盖到哪儿；safeGap = 再往下留一点，脏点才不会压到头发边）
const BED_TOOTH = { x: BED_W / 2, y: 126, rx: 92, ry: 96 };      // 刷牙的大牙齿
let bedCellW = BED_W / BED_GRID[0].cols, bedCellH = BED_H / BED_GRID[0].rows, bedBrushR = BED_GRID[0].bw;
let bedCells = [], bedBrush = null, bedDragging = false, bedRubMs = 0, bedAdvanceTimer = null;

// 这一格在不在「要清洁的图形」里面（牙齿 / 小脸）
function bedInShape(step, x, y) {
  if (step === 0) {
    const dx = (x - BED_TOOTH.x) / BED_TOOTH.rx, dy = (y - BED_TOOTH.y) / BED_TOOTH.ry;
    return dx * dx + dy * dy <= 1;
  }
  const dx = (x - BED_FACE.x) / BED_FACE.r, dy = (y - BED_FACE.y) / BED_FACE.r;
  if (dx * dx + dy * dy > 1) return false;
  // ★ 洗脸 / 涂脸只做「脸」：额头上面那一块是被头发盖住的，不算 ——
  //   不然手指会洗到 / 涂到头发上（头发是已经画好的弧线，位置在 BED_FACE.hairTop 以上）。
  //   再往下留 safeGap：脏点本身是个小圆，圆心太靠上还是会压到头发边
  return (y - BED_FACE.y) >= BED_FACE.hairTop + BED_FACE.safeGap;
}
function bedProgress() {
  if (!bedCells.length) return 0;
  let n = 0;
  for (const c of bedCells) if (c.done) n++;
  return n / bedCells.length;
}
function bedAllDone() { return G.bed.done[0] && G.bed.done[1] && G.bed.done[2]; }

// 开始某一步（重置这一格的进度）
function bedInitStep(step) {
  if (!bctx) return;
  G.bed.step = step;
  const grid = BED_GRID[step] || BED_GRID[0];
  bedCellW = BED_W / grid.cols;
  bedCellH = BED_H / grid.rows;
  bedBrushR = grid.bw;
  bedCells = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const x = (c + 0.5) * bedCellW, y = (r + 0.5) * bedCellH;
      if (!bedInShape(step, x, y)) continue;
      bedCells.push({ x, y, seed: ((r * 7 + c * 13) % 11) / 11, done: false });
    }
  }
  bedBrush = null;
  bedRender();
  bedSyncUI();
}

// 手指抹过的地方：把附近的小格标记成「干净了 / 涂好了」
function bedScrub(clientX, clientY) {
  if (!bedCanvas || !G.bed.active) return;
  const rect = bedCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = (clientX - rect.left) / rect.width * BED_W;
  const y = (clientY - rect.top) / rect.height * BED_H;
  bedBrush = { x, y };
  let hit = 0;
  for (const c of bedCells) {
    if (c.done) continue;
    if (Math.hypot(c.x - x, c.y - y) < bedBrushR) { c.done = true; hit++; }
  }
  if (hit) {
    const now = Date.now();
    if (now - bedRubMs > 170 && typeof sfx.water === 'function') { sfx.water(); bedRubMs = now; }
  }
  bedRender();
  bedSyncUI();
  if (hit && bedProgress() >= 1) bedStepDone();
}

// 一步做完：撒花 + 等一下自动进入下一步
function bedStepDone() {
  const i = G.bed.step;
  if (G.bed.done[i]) return;
  G.bed.done[i] = true;
  sfx.success(); sfx.sparkle();
  const flash = $('bed-flash');
  if (flash) {
    flash.textContent = '✅ ' + t('bedNice');
    flash.classList.remove('hidden');
    setTimeout(() => { const f = $('bed-flash'); if (f && G.bed.done[i]) f.classList.add('hidden'); }, 950);
  }
  bedRender();
  bedSyncUI();
  clearTimeout(bedAdvanceTimer);
  bedAdvanceTimer = setTimeout(function () {
    if (!G.bed.active) return;
    const f = $('bed-flash'); if (f) f.classList.add('hidden');
    if (i < BED_STEPS.length - 1) bedInitStep(i + 1);
    else bedSyncUI();          // 三步都做完 → 让「去睡觉」亮起来
  }, 1000);
}

// ---------------- 小游戏的画面 ----------------
function bedDrawTooth() {
  const cx = BED_TOOTH.x, cy = BED_TOOTH.y;
  bctx.fillStyle = '#fff';
  bctx.strokeStyle = '#cfe3f2'; bctx.lineWidth = 3;
  bctx.beginPath();
  bctx.moveTo(cx - 84, cy - 22);
  bctx.bezierCurveTo(cx - 96, cy - 106, cx + 96, cy - 106, cx + 84, cy - 22);
  bctx.bezierCurveTo(cx + 78, cy + 26, cx + 56, cy + 30, cx + 46, cy + 80);
  bctx.bezierCurveTo(cx + 38, cy + 112, cx + 8, cy + 104, cx + 2, cy + 62);
  bctx.bezierCurveTo(cx - 4, cy + 104, cx - 38, cy + 112, cx - 46, cy + 80);
  bctx.bezierCurveTo(cx - 56, cy + 30, cx - 78, cy + 26, cx - 84, cy - 22);
  bctx.closePath();
  bctx.fill(); bctx.stroke();
  // 牙齿上的高光
  bctx.fillStyle = 'rgba(205,232,255,.8)';
  ellipse(bctx, cx - 36, cy - 48, 15, 26); bctx.fill();
  ellipse(bctx, cx - 8, cy - 66, 8, 12); bctx.fill();
}
function bedDrawFace() {
  const cx = BED_FACE.x, cy = BED_FACE.y, r = BED_FACE.r;
  // 耳朵
  bctx.fillStyle = '#ffd9b8';
  ellipse(bctx, cx - r, cy + 8, 13, 17); bctx.fill();
  ellipse(bctx, cx + r, cy + 8, 13, 17); bctx.fill();
  // 脸
  bctx.fillStyle = '#ffe3c8';
  bctx.beginPath(); bctx.arc(cx, cy, r, 0, Math.PI * 2); bctx.fill();
  bctx.strokeStyle = '#e8b088'; bctx.lineWidth = 2.5; bctx.stroke();
  // 头发
  bctx.fillStyle = '#7a4a2a';
  bctx.beginPath();
  bctx.arc(cx, cy - 8, r + 3, Math.PI * 1.04, Math.PI * 1.96);
  bctx.closePath(); bctx.fill();
  // 眼睛
  bctx.fillStyle = '#4a3222';
  ellipse(bctx, cx - 30, cy - 6, 7, 9); bctx.fill();
  ellipse(bctx, cx + 30, cy - 6, 7, 9); bctx.fill();
  bctx.fillStyle = '#fff';
  ellipse(bctx, cx - 32, cy - 9, 2.6, 3); bctx.fill();
  ellipse(bctx, cx + 28, cy - 9, 2.6, 3); bctx.fill();
  // 腮红
  bctx.fillStyle = 'rgba(255,160,170,.45)';
  ellipse(bctx, cx - 56, cy + 22, 15, 9); bctx.fill();
  ellipse(bctx, cx + 56, cy + 22, 15, 9); bctx.fill();
  // 笑嘴
  bctx.strokeStyle = '#d1705a'; bctx.lineWidth = 3; bctx.lineCap = 'round';
  bctx.beginPath(); bctx.arc(cx, cy + 24, 20, 0.15 * Math.PI, 0.85 * Math.PI); bctx.stroke();
}
function bedRender() {
  if (!bctx || !G.bed) return;
  const step = G.bed.step;
  // 背景
  const g = bctx.createLinearGradient(0, 0, 0, BED_H);
  if (step === 2) { g.addColorStop(0, '#fff4f8'); g.addColorStop(1, '#ffe7f0'); }
  else { g.addColorStop(0, '#f0f9ff'); g.addColorStop(1, '#e2f1fd'); }
  bctx.fillStyle = g;
  bctx.fillRect(0, 0, BED_W, BED_H);
  // 底图
  if (step === 0) bedDrawTooth(); else bedDrawFace();
  // 小黄点 / 小泥点 / 面霜
  for (const c of bedCells) {
    const show = step === 2 ? c.done : !c.done;
    if (!show) continue;
    const s = c.seed;
    const rx = bedCellW * (0.33 + s * 0.15), ry = bedCellH * (0.30 + s * 0.15);
    const ox = (s - 0.5) * 9, oy = ((s * 7) % 1 - 0.5) * 9;
    if (step === 2) {
      bctx.fillStyle = 'rgba(255,255,255,.94)';
      ellipse(bctx, c.x + ox, c.y + oy, rx, ry); bctx.fill();
      bctx.fillStyle = 'rgba(255,214,232,.9)';
      ellipse(bctx, c.x + ox - rx * 0.3, c.y + oy - ry * 0.3, rx * 0.42, ry * 0.42); bctx.fill();
    } else {
      bctx.fillStyle = ['#c9a24a', '#b98a3a', '#d8c070'][Math.floor(s * 3) % 3];
      bctx.globalAlpha = 0.85;
      ellipse(bctx, c.x + ox, c.y + oy, rx, ry); bctx.fill();
      bctx.globalAlpha = 1;
      bctx.fillStyle = 'rgba(120,92,32,.45)';
      ellipse(bctx, c.x + ox + 2, c.y + oy - 2, rx * 0.3, ry * 0.3); bctx.fill();
    }
  }
  // 手指（画成牙刷 / 毛巾 / 面霜）
  if (bedBrush) {
    bctx.strokeStyle = 'rgba(255,184,77,.9)'; bctx.lineWidth = 3;
    bctx.beginPath(); bctx.arc(bedBrush.x, bedBrush.y, bedBrushR, 0, Math.PI * 2); bctx.stroke();
    bctx.fillStyle = 'rgba(255,255,255,.5)';
    bctx.beginPath(); bctx.arc(bedBrush.x, bedBrush.y, bedBrushR, 0, Math.PI * 2); bctx.fill();
    bctx.font = '32px sans-serif'; bctx.textAlign = 'center';
    bctx.fillText(BED_STEPS[step].icon, bedBrush.x, bedBrush.y + 11);
  }
}

// ---------------- 弹窗上的字 / 进度条 / 按钮 ----------------
function bedSyncUI() {
  const stepsEl = $('bed-steps');
  if (stepsEl) {
    stepsEl.innerHTML = '';
    for (let i = 0; i < BED_STEPS.length; i++) {
      const s = BED_STEPS[i];
      const el = document.createElement('div');
      el.className = 'bed-step' + (G.bed.done[i] ? ' done' : (i === G.bed.step ? ' active' : ''));
      el.textContent = (G.bed.done[i] ? '✅ ' : (i + 1) + '. ') + s.icon + ' ' + t(s.nameKey);
      stepsEl.appendChild(el);
    }
  }
  const p = Math.round(bedProgress() * 100);
  const fill = $('bed-bar-fill');
  if (fill) fill.style.width = p + '%';
  const all = bedAllDone();
  const tip = $('bed-tip');
  if (tip) {
    tip.textContent = all ? t('bedTipAllDone')
                          : t(BED_STEPS[G.bed.step].tipKey) + ' ' + t('bedPercent', { n: p });
  }
  const btn = $('bed-sleep');
  if (btn) {
    btn.disabled = !all;
    btn.classList.toggle('ready', all);
  }
}

// 天黑啦 → 弹出睡前任务（做完才能睡）
function openBedtime() {
  if (G.bed.active) return;
  G.timeMin = DAY_END;
  G.bed.active = true;
  G.bed.step = 0;
  G.bed.done = [false, false, false];
  if (G.fishing) G.fishing = null;          // 天黑了先收杆
  if (G.placing) G.placing = null;
  if (G.math) closeMathChallenge();         // 天黑了不算客人等超时，明天再说
  // 天黑了：还在排队 / 参观的客人今天先回家（明天再来）
  for (const c of G.customers) {
    if (c.kind === 'buyer') { c.state = 'leave'; c.moving = true; }
    else if (c.kind === 'visitor') { c.state = 'leave'; c.moving = true; }
  }
  G.player.moving = false;
  if (G.modalOpen && G.modalOpen !== 'bed-modal') closeModal(G.modalOpen);
  bedInitStep(0);
  openModal('bed-modal');
  sfx.night();
  say('bedLogNight', null, 2600);
}

// 手指在画面上按一按、抹一抹（放到 bedCanvas 定义之后，避免 const 还没初始化）
// 🌙 睡前任务：在画面上按一按、抹一抹；三件事都做完才能「去睡觉」
if (bedCanvas) {
  bedCanvas.addEventListener('pointerdown', (e) => {
    if (!G.bed || !G.bed.active) return;
    e.preventDefault();
    bedDragging = true;
    if (bedCanvas.setPointerCapture) { try { bedCanvas.setPointerCapture(e.pointerId); } catch (err) {} }
    bedScrub(e.clientX, e.clientY);
  });
  bedCanvas.addEventListener('pointermove', (e) => {
    if (!bedDragging || !G.bed || !G.bed.active) return;
    e.preventDefault();
    bedScrub(e.clientX, e.clientY);
  });
  const endBrush = () => { bedDragging = false; bedBrush = null; if (G.bed && G.bed.active) bedRender(); };
  bedCanvas.addEventListener('pointerup', endBrush);
  bedCanvas.addEventListener('pointercancel', endBrush);
  bedCanvas.addEventListener('pointerleave', endBrush);
  window.addEventListener('pointerup', endBrush);
}

function startSleep() {
  G.sleepFade = 0.01;
  G.sleepDawn = false;
  sfx.night();
  say('night');
}
function nextDay() {
  G.day++;
  G.timeMin = DAY_START;
  G.bed.active = false; G.bed.step = 0; G.bed.done = [false, false, false];
  G.customers = [];                       // 客人都回家睡觉了，第二天再来
  // 新一天天气
  const r = Math.random();
  G.weather = r < 0.55 ? 'sunny' : r < 0.8 ? 'cloudy' : 'rain';
  // 作物睡一觉长一截
  for (const pl of G.plots) {
    if (pl.state === 'seed') { pl.state = 'growing'; pl.timer = 26; pl.watered = false; }
    else if (pl.state === 'growing') pl.timer += 20;
    pl.watered = G.weather === 'rain';
  }
  // 农场日常：结算饲料（连续 3 天没喂就饿跑）→ 小鸡长大 → 孵蛋器推进一天
  MUSHROOMS.forEach(function (m) { m.picked = false; m.timer = 0; });   // 森林蘑菇睡一晚也长回来
  dailyFarmUpdate();
  renderHUD();
  if (G.weather === 'rain') sfx.rain(); else sfx.morning();
  saveGame(true);   // 换天时存一次（安静存档）
  say('morning', { day: G.day }, 2500);
  if (G.weather === 'rain') addLog(t('rainHint'));
}

// ---------------- 渲染 ----------------
function render() {
  const t = G.t;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
  ctx.translate(-G.cam.x, -G.cam.y);

  // 草地底色
  ctx.fillStyle = G.weather === 'rain' ? '#6fae66' : '#8fd48a';
  ctx.fillRect(G.cam.x, G.cam.y, VIEW_W / CAMERA_ZOOM, VIEW_H / CAMERA_ZOOM);
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

  // 右下角的大海（在草地之后、所有实体之前）
  drawSea(ctx, t);
  // 森林地面（在草地格子和天空之后、所有实体之前）
  drawForestGround(ctx, t);
  // 留给装饰的空地（浅色草坪）
  drawDecorPatches(ctx, t);

  // 装饰（草/花）
  for (const d of G.decor) {
    if (d.kind === 'grass') drawGrassTuft(ctx, d.x, d.y, t, d.phase);
    else drawFlower(ctx, d.x, d.y, t, d.phase, d.color);
  }

  // 田块
  for (const pl of G.plots) drawPlot(ctx, pl.x, pl.y, pl, t);
  // 农田：小栅栏（第三排）＋「以后会扩到这里」的虚线预留区
  const fRect = farmRect();
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.strokeRect(fRect.x, fRect.y, fRect.w, fRect.h);
  ctx.strokeStyle = '#a57c4a'; ctx.lineWidth = 2;
  for (let fx = fRect.x; fx <= fRect.x + fRect.w; fx += 24) {
    ctx.beginPath(); ctx.moveTo(fx, fRect.y - 4); ctx.lineTo(fx, fRect.y + 4); ctx.stroke();
  }
  // 农田没有等级（预留区也不再画出来了）

  // 果树园：栅栏
  const oRect = orchardRect();
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.strokeRect(oRect.x, oRect.y, oRect.w, oRect.h);
  ctx.strokeStyle = '#a57c4a'; ctx.lineWidth = 2;
  for (let fx = oRect.x; fx <= oRect.x + oRect.w; fx += 26) {
    ctx.beginPath(); ctx.moveTo(fx, oRect.y - 4); ctx.lineTo(fx, oRect.y + 4); ctx.stroke();
  }
  // ★ 所有设施的「扩建预留区 / 白色虚线框」都不再画出来（升级照样能升，只是地图上不提前画框）

  // 池塘（没解锁的画成干土坑 + 🔒）；大海水蓝洞在大海里，画成更深的蓝洞
  for (const pond of PONDS) {
    drawPond(ctx, pond.x, pond.y, pond.w, pond.h, t, pondLabel(pond),
             !!pond.locked, pond.unlockLv, pond.id === 'large');
  }

  // 动物棚舍：后半栅栏（画在动物后面）
  drawFenceBack(ctx, PENS.chicken.x, PENS.chicken.y, PENS.chicken.w, PENS.chicken.h);
  drawFenceBack(ctx, PENS.sheep.x, PENS.sheep.y, PENS.sheep.w, PENS.sheep.h);
  drawFenceBack(ctx, PENS.cow.x, PENS.cow.y, PENS.cow.w, PENS.cow.h);

  // y 排序渲染的实体集合
  const drawables = [];
  // 食槽（每天的饲料放这里）
  for (const tr of TROUGHS) {
    if (!countAnimalType(tr.type)) continue;
    drawables.push({ y: tr.y + 6, draw: () => drawTrough(ctx, tr.x, tr.y, t, tr.feed, FEED_MAX, tr.feed <= 0) });
  }
  // 棚舍小窝（鸡棚/羊棚/牛棚）
  drawables.push({ y: PENS.chicken.y + 28, draw: () => drawCoopHouse(ctx, PENS.chicken.x + 52, PENS.chicken.y + 28, t) });
  drawables.push({ y: PENS.sheep.y + 30, draw: () => drawSheepShed(ctx, PENS.sheep.x + 75, PENS.sheep.y + 30, t) });
  drawables.push({ y: PENS.cow.y + 34, draw: () => drawCowBarn(ctx, PENS.cow.x + 72, PENS.cow.y + 34, t) });
  // 前半栅栏（画在动物前面）
  drawables.push({ y: PENS.chicken.y + PENS.chicken.h, draw: () => drawFenceFront(ctx, PENS.chicken.x, PENS.chicken.y + PENS.chicken.h, PENS.chicken.w) });
  drawables.push({ y: PENS.sheep.y + PENS.sheep.h, draw: () => drawFenceFront(ctx, PENS.sheep.x, PENS.sheep.y + PENS.sheep.h, PENS.sheep.w) });
  drawables.push({ y: PENS.cow.y + PENS.cow.h, draw: () => drawFenceFront(ctx, PENS.cow.x, PENS.cow.y + PENS.cow.h, PENS.cow.w) });
  drawables.push({ y: ZONES.house.y + 56, draw: () => drawHouse(ctx, ZONES.house.x, ZONES.house.y, t) });
  drawables.push({ y: ZONES.stall.y + 40, draw: () => drawStall(ctx, ZONES.stall.x - 45, ZONES.stall.y - 20, t, STALL_SCALE[lvOf('shop') - 1]) });
  // 商店等级的牌子挂在摊子旁边
  drawables.push({
    y: ZONES.stall.y + 8,
    draw: () => drawLvBadge(ctx, ZONES.stall.x + 46, ZONES.stall.y - 62, lvOf('shop'), t, canUpgradeFacility('shop')),
  });
  // 🛒 销售门面：接在商店右边，客人从它右侧排队来买东西
  drawables.push({ y: ZONES.counter.y + 10, draw: () => drawSalesCounter(ctx, ZONES.counter.x, ZONES.counter.y, t) });
  drawables.push({ y: ZONES.kitchen.y + 12, draw: () => drawKitchenProp(ctx, ZONES.kitchen.x, ZONES.kitchen.y, t) });
  drawables.push({ y: ZONES.wardrobe.y + 14, draw: () => drawWardrobeProp(ctx, ZONES.wardrobe.x, ZONES.wardrobe.y, t) });
  drawables.push({ y: ZONES.bin.y + 16, draw: () => drawBin(ctx, ZONES.bin.x, ZONES.bin.y, t) });
  // 🐾 宠物区：🍖 宠物粮食 / 🧹 砂盆 / 🛁 浴缸（对着谁按 E 就做哪件事）
  const pet = G.pets[0];
  const needKind = pet ? petNeed(pet) : null;
  drawables.push({ y: PET_SPOTS.food.y + 6,  draw: () => drawPetFood(ctx, PET_SPOTS.food.x, PET_SPOTS.food.y, t, needKind === 'hungry') });
  drawables.push({ y: PET_SPOTS.clean.y + 6, draw: () => drawPetLitter(ctx, PET_SPOTS.clean.x, PET_SPOTS.clean.y, t, needKind === 'poop') });
  drawables.push({ y: PET_SPOTS.bath.y + 6,  draw: () => drawPetBath(ctx, PET_SPOTS.bath.x, PET_SPOTS.bath.y, t, needKind === 'dirty') });
  for (const tr of G.trees) drawables.push({
    y: tr.y + 4,
    draw: () => tr.type === 'strawberry'
      ? drawStrawberryBush(ctx, tr.x, tr.y, t, tr.phase, tr.fruits)
      : drawTree(ctx, tr.x, tr.y, t, tr.phase, tr.fruits, tr.type),
  });
  // 🅿️ 停车架 + 停好的交通工具（正在骑的那辆不画在这里）
  drawables.push({ y: ZONES.rack.y + 4, draw: () => drawBikeRack(ctx, ZONES.rack.x, ZONES.rack.y, t) });
  const parkedVeh = G.vehicles.filter(v => v !== G.vehicle);
  parkedVeh.forEach((vid, i) => {
    const px = ZONES.rack.x - (parkedVeh.length - 1) * 50 + i * 100;   // 车变大了，间距也拉开
    drawables.push({
      y: ZONES.rack.y + 4,
      draw: () => {
        const spec = VEH_SPEC[vid] || VEH_SPEC.bicycle;
        ctx.save();
        ctx.translate(px, ZONES.rack.y);
        ctx.scale(spec.vs, spec.vs);
        drawVehicle(ctx, vid, { t, moving: false, walkPhase: 0 });
        ctx.restore();
      },
    });
  });

  // 庭院装饰：压在建筑底下的那些不在这里排队，等所有实体的画完再单独画在最外层
  const decorSolids = solidRects();
  for (const dc of G.decorations) {
    if (decorUnderBuilding(dc, decorSolids)) continue;
    drawables.push({ y: dc.y + 4, draw: () => drawDecor(ctx, dc.id, dc.x, dc.y, t, dc.phase) });
  }
  // 森林里的大树；蜂巢挂在那棵大树伸出的枝丫下 ——
  // 必须和树放在同一个 drawable 里按 y 排序，否则蜂巢会先画、被树挡住
  for (const ft of FOREST_TREES) {
    const treeY = ft.y + 4;
    if (ft.kind === 'big') {
      drawables.push({
        y: treeY,
        draw: () => {
          drawForestTree(ctx, ft.x, ft.y, t, ft.phase, ft.kind);
          drawBeehive(ctx, HIVE.x, HIVE.y, t, HIVE.honey > 0);
        },
      });
    } else {
      drawables.push({ y: treeY, draw: () => drawForestTree(ctx, ft.x, ft.y, t, ft.phase, ft.kind) });
    }
  }
  // 森林里的蘑菇（采走了就先不画，长回来再出现）
  for (const m of MUSHROOMS) {
    if (m.picked) continue;
    drawables.push({ y: m.y + 2, draw: () => drawForestDecor(ctx, 'mushroom', m.x, m.y, t, m.phase) });
  }
  // 树桩 / 灌木
  for (const fd of FOREST_DECOR) {
    drawables.push({ y: fd.y + 2, draw: () => drawForestDecor(ctx, fd.kind, fd.x, fd.y, t, fd.phase) });
  }
  // 鸡棚里的孵蛋器
  drawables.push({
    y: ZONES.hatchery.y + 6,
    draw: () => drawHatchery(ctx, ZONES.hatchery.x, ZONES.hatchery.y, t, G.incubating),
  });
  // 大型水族箱（尺寸跟着等级变）
  drawables.push({ y: ZONES.tank.y + 6, draw: () => drawAquarium(ctx, ZONES.tank.x, ZONES.tank.y, t, G.tank, tankSize()) });
  // 动物园的观赏动物（动画 emoji 图）
  for (const z of G.zoo) {
    const zd = ZOO_MAP[z.type] || ZOO_SHOP[0];
    const rec = loadEmoji(zd.cp);
    drawables.push({
      y: z.y + 4,
      draw: () => drawZoo(ctx, z.x, z.y, {
        type: z.type, fly: !!ZOO_FLY[z.type],
        size: zd.size, rec, cp: zd.cp, moving: z.moving, walkPhase: z.walkPhase,
        // 动画相位按物种固定（和商店里同一条动画同步），不再用每只一个的随机相位
        phase: cpPhase(zd.cp), emoji: zd.icon, dir: z.dir, t,
      }),
    });
  }
  for (const a of G.animals) {
    drawables.push({
      y: a.y + 14,
      draw: () => {
        const o = { ...a, t };
        // 人物和动物都比以前大一点（手机上更好看清）
        const grow = (a.type === 'chicken' ? (isChick(a) ? CHICK_SCALE : HEN_GROW) : 1) * ANIMAL_SCALE;
        o.scale = grow;
        if (a.type === 'chicken') drawChicken(ctx, a.x, a.y, o);
        else if (a.type === 'sheep') drawSheep(ctx, a.x, a.y, o);
        else drawCow(ctx, a.x, a.y, o);
        // 饿跑了的动物头顶冒一个「饿」的提示
        if (a.tired) {
          const by = a.y - 46 * grow + Math.sin(t * 3 + a.phase) * 2;
          ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          rr(ctx, a.x - 26, by - 15, 52, 19, 8); ctx.fill();
          ctx.strokeStyle = '#ff7a7a'; ctx.lineWidth = 2;
          rr(ctx, a.x - 26, by - 15, 52, 19, 8); ctx.stroke();
          ctx.fillStyle = '#d13b3b';
          ctx.fillText('🌾❗', a.x, by);
        }
      },
    });
  }
  for (const c of G.customers) {
    drawables.push({
      y: c.y + 16,
      draw: () => {
        drawCustomer(ctx, c.x, c.y, { ...c, t });
        // 客人的名字
        {
          const ny = c.y - 78 + Math.sin(t * 2 + c.phase) * 1.5;
          ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
          const nw = 34 + custName(c).length * 7;
          ctx.fillStyle = 'rgba(255,255,255,.92)';
          rr(ctx, c.x - nw / 2, ny - 12, nw, 17, 8); ctx.fill();
          ctx.strokeStyle = '#ffb84d'; ctx.lineWidth = 1.8;
          rr(ctx, c.x - nw / 2, ny - 12, nw, 17, 8); ctx.stroke();
          ctx.fillStyle = '#c95a1a';
          ctx.fillText(custName(c), c.x, ny);
        }
        // 参观客人：头顶挂一个 🎫，正在看的时候冒一个「👀 + 想看的东西」的泡泡
        if (c.kind === 'visitor') {
          ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('🎫', c.x + 20, c.y - 58 + Math.sin(t * 3 + c.phase) * 2);
          if (c.state === 'look') {
            const by = c.y - 52 + Math.sin(t * 3 + c.phase) * 3;
            ctx.fillStyle = '#fff';
            rr(ctx, c.x - 24, by - 18, 48, 30, 10); ctx.fill();
            ctx.strokeStyle = '#7ddb6a'; ctx.lineWidth = 2.5;
            rr(ctx, c.x - 24, by - 18, 48, 30, 10); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(c.x - 4, by + 12); ctx.lineTo(c.x + 4, by + 12); ctx.lineTo(c.x, by + 20);
            ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
            ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('👀', c.x - 6, by + 4);
            ctx.fillText(c.theme === 'tank' ? '🐠' : '🦁', c.x + 12, by + 5);
          }
        }
        // 想要物品的气泡：买好几件就把清单缩写在气泡里
        if (c.kind !== 'visitor' && c.state === 'wait') {
          const by = c.y - 52 + Math.sin(t * 3 + c.phase) * 3;
          const bi = basketOf(c);
          const bw = bi.length > 1 ? 74 : 44;
          ctx.fillStyle = '#fff';
          rr(ctx, c.x - bw / 2, by - 18, bw, 30, 10); ctx.fill();
          ctx.strokeStyle = '#ffb84d'; ctx.lineWidth = 2.5;
          rr(ctx, c.x - bw / 2, by - 18, bw, 30, 10); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(c.x - 4, by + 12); ctx.lineTo(c.x + 4, by + 12); ctx.lineTo(c.x, by + 20);
          ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.font = '19px sans-serif'; ctx.textAlign = 'center';
          if (bi.length > 1) {
            // 两样东西：左边一个图标 + 「+」+ 右边一个图标
            ctx.fillText(ITEMS[bi[0].id].icon, c.x - 18, by + 3);
            ctx.fillStyle = '#e2701d'; ctx.font = 'bold 14px sans-serif';
            ctx.fillText('+', c.x, by + 4);
            ctx.font = '19px sans-serif';
            ctx.fillText(ITEMS[bi[1].id].icon, c.x + 18, by + 3);
          } else {
            ctx.fillText(ITEMS[bi[0].id].icon, c.x - 7, by + 3);
            ctx.fillStyle = '#e2701d'; ctx.font = 'bold 13px sans-serif';
            ctx.fillText(bi[0].qty > 1 ? ('×' + bi[0].qty) : '?', c.x + 13, by + 4);
          }
        }
      },
    });
  }
  // 客人带来的宠物
  for (const c of G.customers) {
    if (c.pet) drawables.push({ y: c.pet.y + 10, draw: () => drawPet(ctx, c.pet.x, c.pet.y, { ...c.pet, t }) });
  }
  // 宠物 & 玩家
  for (let i = 0; i < G.pets.length; i++) {
    const p = G.pets[i];
    drawables.push({
      y: p.y + 10,
      draw: () => {
        drawPet(ctx, p.x, p.y, { ...p, t, scale: PET_SCALE });
        drawPetAction(ctx, p.x, p.y, t, p.anim);
        // 需要照顾的宠物头顶冒小图标：🍖 饿了 / 💩 要清理 / 🛁 要洗澡
        const ic = petNeedIcon(p);
        if (ic) {
          const by = p.y - 46 + Math.sin(t * 3 + p.phase) * 2.5;
          ctx.fillStyle = 'rgba(255,255,255,.92)';
          rr(ctx, p.x - 13, by - 13, 26, 22, 9); ctx.fill();
          ctx.strokeStyle = '#ff9a3e'; ctx.lineWidth = 2;
          rr(ctx, p.x - 13, by - 13, 26, 22, 9); ctx.stroke();
          ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(ic, p.x, by + 4);
        }
      },
    });
  }
  drawables.push({
    y: p_y() + PLAYER_FOOT_Y * PET_SCALE,      // 排序锚点 = 人物真正的脚底（最低点）
    draw: () => {
      const pl = {
        gender: G.player.gender, dir: G.player.dir,
        walkPhase: G.player.walkPhase, moving: G.player.moving,
        outfit: G.player.outfit, actionT: G.player.actionT, rod: !!G.fishing, t,
        scale: PET_SCALE,          // 人物整体放大一点
      };
      if (G.vehicle) {
        // 骑上交通工具：整组（人 + 车）一起镜像，车头永远朝前进方向
        pl.vehicleId = G.vehicle;
        pl.pose = G.vehicle === 'scooter' ? 'deck' : 'ride';
        drawRider(ctx, G.player.x, G.player.y, pl);
      } else {
        drawPlayer(ctx, G.player.x, G.player.y, pl);
      }
    },
  });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();

  // ★ 被建筑压住的装饰画在**最外层**：升级扩建把地圈进去以后，装饰也不会被房子 / 围栏挡住
  for (const dc of G.decorations) {
    if (!decorUnderBuilding(dc, decorSolids)) continue;
    drawDecor(ctx, dc.id, dc.x, dc.y, t, dc.phase);
  }

  // 放置预览：跟着角色走，绿色=可以放，红色=放不下
  if (G.placing) {
    const d = DECOR_SHOP.find(v => v.id === G.placing.id);
    if (d) {
      const px2 = Math.max(30, Math.min(WORLD_W - 30, G.player.x));
      const py2 = Math.max(150, Math.min(WORLD_H - 20, G.player.y + 8));
      const okSpot = canPlaceAt(d.id, px2, py2) === true;
      ctx.globalAlpha = 0.62;
      drawDecor(ctx, d.id, px2, py2, t, 0);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = okSpot ? 'rgba(80,220,120,.95)' : 'rgba(255,90,90,.95)';
      ctx.lineWidth = 3;
      if (ctx.setLineDash) ctx.setLineDash([7, 5]);
      ellipse(ctx, px2, py2 - 8, d.r + 8, (d.r + 8) * 0.42);
      ctx.stroke();
      if (ctx.setLineDash) ctx.setLineDash([]);
      ctx.fillStyle = okSpot ? 'rgba(80,220,120,.9)' : 'rgba(255,90,90,.9)';
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(okSpot ? '✓' : '✕', px2, py2 - 10);
    }
  }

  // 玩家动作特效（浇水/收获光圈）
  if (G.player.actionT > 0) {
    const k = 1 - G.player.actionT / 0.6;
    ctx.strokeStyle = `rgba(255,230,120,${1 - k})`;
    ctx.lineWidth = 3;
    ellipse(ctx, G.player.x, G.player.y + 6, 20 + k * 30, (20 + k * 30) * 0.4);
    ctx.stroke();
  }

  // 地面物品（休息动画）
  for (const it of G.groundItems) {
    const cp = ITEMS[it.id] && ITEMS[it.id].cp;
    const rec = cp ? loadEmoji(cp) : null;
    drawGroundItem(ctx, it.x, it.y, ITEMS[it.id].icon, t, it.phase, rec && rec.ok ? rec : null, cp);
  }

  // 钓鱼：水波纹 + 从手里鱼竿伸出的鱼线 + 浮漂
  if (G.fishing) {
    const f = G.fishing;
    const dip = f.phase === 'bite' ? Math.sin(t * 20) * 4 + 3 : Math.sin(t * 3) * 2;
    drawRipple(ctx, f.bx, f.by, f.rip, f.ripple || 0);          // 波纹大小 = 能钓到的鱼的大小
    const dirS = G.player.dir === 'left' ? -1 : 1;
    const tipX = G.player.x + 29 * dirS, tipY = G.player.y - 32; // 鱼竿尖端（手举起来的位置）
    ctx.strokeStyle = 'rgba(252,252,252,.85)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.quadraticCurveTo((tipX + f.bx) / 2 + 6, f.by - 46, f.bx, f.by + dip);
    ctx.stroke();
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
    const visW = VIEW_W / CAMERA_ZOOM, visH = VIEW_H / CAMERA_ZOOM;
    for (let i = 0; i < 130; i++) {
      const rx = ((i * 137 + G.cam.x) % (visW + 60)) + G.cam.x - 30;
      const ry = ((i * 89) % visH) + off * ((i % 3) + 1) / 3 % visH + G.cam.y;
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

  renderMinimap();   // 右上角的小地图（画在另一块 DOM 画布上，不受上面的变换影响）
}
function p_y() { return G.player.y; }

// ---------------- 右上角的小地图 ----------------
// 把整张农场按比例缩到一块小画布上：森林 / 果园 / 农田 / 棚舍 / 水坑 / 房子一眼看清。
// 白框 = 现在画面能看到的地方，红点 = 主角，橙点 = 买东西的客人，绿点 = 参观客人。
const miniCanvas = $('minimap');
const mctx = miniCanvas ? miniCanvas.getContext('2d') : null;
const MINI_W = miniCanvas ? miniCanvas.width : 0;
const MINI_H = miniCanvas ? miniCanvas.height : 0;
const MINI_K = MINI_W ? MINI_W / WORLD_W : 0;    // 世界坐标 → 小地图坐标

function miniRect(x, y, w, h, fill, stroke) {
  const rx = x * MINI_K, ry = y * MINI_K;
  const rw = Math.max(2, w * MINI_K), rh = Math.max(2, h * MINI_K);
  mctx.fillStyle = fill; mctx.fillRect(rx, ry, rw, rh);
  if (stroke) { mctx.strokeStyle = stroke; mctx.lineWidth = 1; mctx.strokeRect(rx, ry, rw, rh); }
}
function miniDot(x, y, r, fill, stroke) {
  mctx.beginPath();
  mctx.arc(x * MINI_K, y * MINI_K, r, 0, Math.PI * 2);
  mctx.fillStyle = fill; mctx.fill();
  if (stroke) { mctx.strokeStyle = stroke; mctx.lineWidth = 1.2; mctx.stroke(); }
}

function renderMinimap() {
  if (!mctx) return;
  // 草地底
  mctx.fillStyle = '#a9e5a0';
  mctx.fillRect(0, 0, MINI_W, MINI_H);
  // 右下角的大海
  if (typeof SEA_POLY !== 'undefined' && SEA_POLY) {
    mctx.beginPath();
    mctx.moveTo(SEA_POLY[0].x * MINI_K, SEA_POLY[0].y * MINI_K);
    for (let i = 1; i < SEA_POLY.length; i++) mctx.lineTo(SEA_POLY[i].x * MINI_K, SEA_POLY[i].y * MINI_K);
    mctx.closePath();
    mctx.fillStyle = '#3aa0e0';
    mctx.fill();
  }
  // 森林（最左边那一大条）
  miniRect(FOREST.x, FOREST.y, FOREST.w, FOREST.h, '#63b268');
  // 果园（第一排最左）
  const orr = orchardRect();
  miniRect(orr.x, orr.y, orr.w, orr.h, '#d3ea96', '#9cc45e');
  // 农田（第三排）
  const fr = farmRect();
  miniRect(fr.x, fr.y, fr.w, fr.h, '#c39a63', '#9a7440');
  // 三个棚舍的围栏
  for (const t of ['chicken', 'sheep', 'cow']) {
    const p = PENS[t];
    miniRect(p.x, p.y, p.w, p.h, '#f7e6c2', '#b98a52');
  }
  // 水坑（还没解锁的画成干土坑的颜色）
  for (const p of PONDS) {
    const spec = POND_SPEC.find(s => s.id === p.id);
    if (!spec) continue;
    const sz = spec.sizes[lvOf('pond') - 1];
    mctx.beginPath();
    mctx.ellipse(spec.x * MINI_K, spec.y * MINI_K,
                 Math.max(2, sz.w / 2 * MINI_K), Math.max(2, sz.h / 2 * MINI_K), 0, 0, Math.PI * 2);
    mctx.fillStyle = '#63c6f7';                           // 有没有解锁都是同一个蓝
    mctx.fill();
  }
  // 房子：主角家 / 衣柜 / 厨房 / 宠物房 / 卖货箱 / 水族箱 / 商店 / 销售门面
  const hz = ZONES.house;
  miniRect(hz.x - 12, hz.y - 104, 144, 160, '#ff8f6a');
  miniRect(ZONES.wardrobe.x - 14, ZONES.wardrobe.y - 30, 28, 44, '#d9a066');
  miniRect(ZONES.kitchen.x - 17, ZONES.kitchen.y - 20, 34, 32, '#c9d2dc');
  miniRect(PET_SPOTS.food.x - 9,  PET_SPOTS.food.y - 7,  18, 14, '#f0a058');
  miniRect(PET_SPOTS.clean.x - 9, PET_SPOTS.clean.y - 7, 18, 14, '#c8b48a');
  miniRect(PET_SPOTS.bath.x - 10, PET_SPOTS.bath.y - 8,  20, 16, '#9fd6ef');
  miniRect(ZONES.bin.x - 16, ZONES.bin.y - 14, 32, 30, '#9a6a3a');
  const ts = tankSize();
  miniRect(ZONES.tank.x - ts.w / 2, ZONES.tank.y - ts.h - 14, ts.w, ts.h + 16, '#8fd0f0');
  const sk = STALL_SCALE[lvOf('shop') - 1];
  miniRect(ZONES.stall.x - 47 * sk, ZONES.stall.y + 20 - 90 * sk, 94 * sk, 110 * sk, '#ffb84d');
  miniRect(ZONES.counter.x - 62, ZONES.counter.y - 96, 124, 106, '#ffe08a', '#d9a62e');
  // 动物（小白点） / 客人（橙点） / 参观客人（绿点）
  for (const a of G.animals) miniDot(a.x, a.y, 1.7, '#fff', '#8a6a2a');
  for (const c of G.customers) miniDot(c.x, c.y, 1.9, c.kind === 'visitor' ? '#4fb83a' : '#ff9f43', '#fff');
  // 现在画面能看到的地方
  const camW = VIEW_W / CAMERA_ZOOM, camH = VIEW_H / CAMERA_ZOOM;
  mctx.strokeStyle = 'rgba(255,255,255,.92)'; mctx.lineWidth = 1.5;
  mctx.strokeRect(G.cam.x * MINI_K, G.cam.y * MINI_K, camW * MINI_K, camH * MINI_K);
  // 主角（红点 + 白圈，画在最上面）
  miniDot(G.player.x, G.player.y, 3.4, '#ff4e4e', '#fff');
}

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
    $(idA).classList.add('selected'); $(idB).classList.remove('selected');
    sfx.click(); cb(idA.includes('boy') || idA.includes('dog') ? 0 : 1);
  });
  $(idB).addEventListener('click', () => {
    $(idB).classList.add('selected'); $(idA).classList.remove('selected');
    sfx.click(); cb(1);
  });
}
setupChooser('choose-boy', 'choose-girl', (i) => { chosenGender = i === 0 ? 'boy' : 'girl'; });
setupChooser('choose-dog', 'choose-cat', (i) => { chosenPet = i === 0 ? 'dog' : 'cat'; });
// 宠物三选一（小鸭 / 小鹅）
['choose-duck', 'choose-goose'].forEach(function (id) {
  $(id).addEventListener('click', function () {
    ['choose-dog', 'choose-cat', 'choose-duck', 'choose-goose'].forEach(x => $(x).classList.remove('selected'));
    $(id).classList.add('selected');
    chosenPet = id === 'choose-goose' ? 'goose' : 'duck';
    sfx.click();
  });
});

// 输入名字（最多 8 个字）
const nameInput = $('name-input');
if (nameInput) {
  // 开局给个随机名字（3 个字以内），小朋友直接点开始就能玩；想改名直接输入即可。
  // 如果这台电脑上上次玩过（有上次的名字），就先填上次的名字，方便直接接着玩。
  if (!playerName) {
    nameInput.value = randomName();
    playerName = normalizeName(nameInput.value);
  } else {
    nameInput.value = playerName;
  }
  nameInput.addEventListener('input', function () {
    if (this.value.length > MAX_NAME_LEN) this.value = this.value.slice(0, MAX_NAME_LEN);
    playerName = normalizeName(this.value);          // 列表里高亮当前这个名字
    renderProfiles();
  });
  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); this.blur(); startNewGame(); }
  });
}

// 读取输入框里的名字（带校验），返回 null 表示不能开始
function readNameInput() {
  const raw = nameInput ? nameInput.value : '';
  const nm2 = normalizeName(raw);
  if (!nm2) { sfx.error(); say('enterName', null, 2600); if (nameInput) nameInput.focus(); return null; }
  if (String(raw).trim().length > MAX_NAME_LEN) { sfx.error(); say('nameTooLong'); return null; }
  return nm2;
}
// 开始/继续某个名字的牧场（isNew=false 时读存档）
function startFarm(name, isContinue) {
  const nm2 = name != null ? normalizeName(name) : playerName;
  playerName = nm2;
  const p = profileFor(nm2);
  playerPid = p ? p.pid : -1;
  if (isContinue) {
    if (!loadGame(nm2)) { sfx.error(); say('loadFailed'); resetGame(); }
  } else {
    if (playerPid < 0) {
      const pid = freePid();
      if (pid < 0) { sfx.error(); say('maxProfiles', null, 2600); return; }
      playerPid = pid;
      const list = loadIndex();
      list.push({ pid, name: nm2, savedAt: 0, day: 1, coins: 20 });
      writeIndex(list);
    }
    resetGame();
  }
  setLastProfile(nm2);
  const ss = $('start-screen');
  if (ss) ss.classList.add('hidden');
  G.started = true;
  sfx.success();
  startMusic();
  saveGame(true);
  if (isContinue) say('welcomeBack', { day: G.day, name: nm2 }, 3000);
  else say('welcome', { name: nm2 }, 3000);
}
// 开始新游戏（这个名字已经有存档就问一下要不要重新开始）
function startNewGame() {
  const nm2 = readNameInput();
  if (!nm2) return;
  const exist = profileFor(nm2);
  if (exist) {
    const ok = (typeof confirm !== 'function') ||
      confirm(t('nameOccupied') + '\n\n' + t('btnStart') + ' ?');
    if (!ok) { startFarm(nm2, true); return; }
    // 确认重开：清掉旧数据，用同一个档位重新开始
    try { localStorage.removeItem(slotKey(exist.pid)); } catch (e) {}
    playerName = nm2; playerPid = exist.pid;
    const list = loadIndex();
    const rec = list.find(x => x.pid === exist.pid);
    if (rec) { rec.name = nm2; rec.savedAt = 0; rec.day = 1; rec.coins = 20; }
    writeIndex(list);
    resetGame();
    setLastProfile(nm2);
    const ss = $('start-screen');
    if (ss) ss.classList.add('hidden');
    G.started = true; sfx.success(); startMusic(); saveGame(true);
    say('welcome', { name: nm2 }, 3000);
    return;
  }
  startFarm(nm2, false);
}
$('btn-start').addEventListener('click', () => { sfx.click(); startNewGame(); });
// 继续上次的存档（用上次玩的名字 / 最近保存的那一档）
$('btn-continue').addEventListener('click', () => {
  sfx.click();
  const last = getLastProfile();
  const profs = listProfiles();
  const target = (last && profileFor(last)) ? last : (profs.length ? profs[0].p.name : null);
  if (!target) { sfx.error(); say('loadFailed'); return; }
  startFarm(target, true);
});

// ---------------- 屏幕适配 & 触摸控件 ----------------
// 触摸检测：触屏设备自动显示虚拟摇杆和按钮
const isTouch = ('ontouchstart' in window) ||
  (navigator.maxTouchPoints > 0) ||
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
if (isTouch) document.body.classList.add('touch');

// 手机上的操作提示用 ✋ 代替键盘的 E
const KEY_HINT = isTouch ? '✋' : 'E';
// 虚拟摇杆的方向向量（-1 ~ 1），与键盘一起驱动角色
const touchMove = { x: 0, y: 0 };

// 让游戏画面适配屏幕（保持 960x600 比例等比缩放，居中显示）
function fitScreen() {
  const s = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  const wrap = $('scale-wrap');
  if (!wrap) return;
  wrap.style.width = (VIEW_W * s) + 'px';
  wrap.style.height = (VIEW_H * s) + 'px';
  const gw = $('game-wrap');
  gw.style.transform = `scale(${s})`;
  // HUD 的文字大小跟着画面缩放走：
  // 缩放得很小（手机）时把字放大一点才看得清，但放大到一定程度就顶到右边按钮了，
  // 所以这里按 1/s 开根号来放，缩放极小时甚至会缩小一点，保证 5 个按钮都不出界
  // 基础字号变大了，这里的补偿系数相应调小（总宽度基本不变）
  const ui = Math.max(0.7, Math.min(1.35, Math.sqrt(1 / s) * 0.62));
  gw.style.setProperty('--ui-scale', ui.toFixed(3));
}
window.addEventListener('resize', fitScreen);
window.addEventListener('orientationchange', () => setTimeout(fitScreen, 120));
fitScreen();

// ---- 虚拟摇杆（左下角，支持多点触控：一边走一边按动作键） ----
const joyBase = $('joy-base'), joyKnob = $('joy-knob');
const JOY_R = 42;                 // 摇杆活动半径
let joyPid = null, joyCx = 0, joyCy = 0;
function joyUpdate(t) {
  let dx = t.clientX - joyCx, dy = t.clientY - joyCy;
  const len = Math.hypot(dx, dy);
  if (len > JOY_R) { dx = dx / len * JOY_R; dy = dy / len * JOY_R; }
  joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  touchMove.x = dx / JOY_R;
  touchMove.y = dy / JOY_R;
}
if (joyBase) {
  joyBase.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    joyPid = e.pointerId;
    try { joyBase.setPointerCapture(joyPid); } catch (err) {}
    const r = joyBase.getBoundingClientRect();
    joyCx = r.left + r.width / 2;
    joyCy = r.top + r.height / 2;
    joyUpdate(e);
  });
  joyBase.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joyPid) return;
    e.preventDefault();
    joyUpdate(e);
  });
  const joyEnd = (e) => {
    if (e.pointerId !== joyPid) return;
    joyPid = null;
    touchMove.x = 0; touchMove.y = 0;
    joyKnob.style.transform = 'translate(0px, 0px)';
  };
  joyBase.addEventListener('pointerup', joyEnd);
  joyBase.addEventListener('pointercancel', joyEnd);
}

// ---- 动作按钮（= E / 空格） ----
const actionBtn = $('touch-action');
if (actionBtn) {
  actionBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    interactQueued = true;
  });
}
// 触摸版帮助键
const touchHelp = $('touch-help');
if (touchHelp) {
  touchHelp.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sfx.open();
    toggleModal('help-modal');
  });
}
// 点一下游戏画面也能做动作（手机上更方便）
canvas.addEventListener('pointerdown', () => { interactQueued = true; });
// 首次触摸时再确认一次显示触摸控件（兼容带触屏的笔记本）
window.addEventListener('touchstart', () => {
  if (!document.body.classList.contains('touch')) {
    document.body.classList.add('touch');
  }
  audioInit();          // 手机上第一次触碰时把声音引擎打开
}, { passive: true });

// ---- 手机浏览器：禁止双击放大 ----
// viewport 里的 user-scalable=no 大部分浏览器认，但有些（尤其国产浏览器 / Safari）
// 还会响应双击缩放，所以这里再挡一层：300ms 内的第二次点击直接 cancel 掉。
(function blockDoubleTapZoom() {
  let lastTap = 0;
  document.addEventListener('touchend', function (e) {
    // 名字输入框里点两下要能正常选词，不能拦
    if (e.target && e.target.tagName === 'INPUT') return;
    const now = Date.now();
    if (now - lastTap < 300) {
      if (e.cancelable) e.preventDefault();
      lastTap = 0;
    } else {
      lastTap = now;
    }
  }, { passive: false });
  // 双指 / 手势缩放也一起挡掉（游戏里用不到）
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('gesturechange', function (e) { e.preventDefault(); });
  document.addEventListener('gestureend', function (e) { e.preventDefault(); });
  // iOS Safari：捏合缩放
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1 && e.cancelable) e.preventDefault();
  }, { passive: false });
})();

// 启动
applyLevels();     // 按设施等级（默认全部 1 级）把地图尺寸摆好
initWorld();
setMuted(muted);   // 同步静音按钮图标
{
  const mb = $('btn-music');
  if (mb) syncMusicButton();
}
// 关页面 / 切到后台时也存一次，避免丢进度
window.addEventListener('beforeunload', () => saveGame(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(true); });
// 角色与宠物切换
function highlightChar() {
  const g = G.player.gender, pt = (G.pets[0] && G.pets[0].type) || 'dog';
  const set = (id, on) => { const el = $(id); if (el) el.classList.toggle('selected', !!on); };
  set('pick-boy', g === 'boy'); set('pick-girl', g === 'girl');
  set('pick-dog', pt === 'dog'); set('pick-cat', pt === 'cat');
  set('pick-duck', pt === 'duck'); set('pick-goose', pt === 'goose');
}
$('pick-boy').addEventListener('click', () => { setGender('boy'); highlightChar(); });
$('pick-girl').addEventListener('click', () => { setGender('girl'); highlightChar(); });
$('pick-dog').addEventListener('click', () => { setPet('dog'); highlightChar(); });
$('pick-cat').addEventListener('click', () => { setPet('cat'); highlightChar(); });
$('pick-duck').addEventListener('click', () => { setPet('duck'); highlightChar(); });
$('pick-goose').addEventListener('click', () => { setPet('goose'); highlightChar(); });

// 开始界面：有存档就显示「继续上次」，并列出这台电脑上的所有存档
if (hasSave()) {
  const btn = $('btn-continue');
  if (btn) btn.classList.remove('hidden');
}
renderProfiles();
$('btn-lang').addEventListener('click', () => { sfx.click(); setLang(lang === 'en' ? 'zh' : 'en'); });
$('btn-lang-big').addEventListener('click', () => { sfx.click(); setLang(lang === 'en' ? 'zh' : 'en'); });
applyLang();   // 启动时按上次选择的语言显示界面
renderInventory();
renderHUD();

// 调试用的小开关（方便在控制台里看状态 / 测试）
window.__farm = {
  G, HIVE, ZONES, PENS, FOREST, ITEMS, TROUGHS, ZOO_MAP, ZOO_FACING, ZOO_FLY, newZoo, newAnimal,
  feedArrived, fillTrough,
  SEA_ALL, SEA_SET, PONDS, emojiDrawable, RECIPES, OBTAINABLE, MUSHROOMS, MUSHROOM_REGROW,
  CROPS, CROP_MAP, FRUIT_IDS,
  FARM_GOODS, nextDay, dailyFeedUpdate, TROUGH_OF, MUSHROOMS, OBTAINABLE, RECIPES,
  VEHICLES, VEHICLE_MAP, WALK_SPEED, useRack, mountVehicle, dismountVehicle,
  openMathChallenge, answerMath, renderMathChallenge, coinChoices, makeChoices, spawnCustomer,
  salePriceOf, closeMathChallenge, mathTimeout,
  MATH_TIME, resolveCustomerSale,
  renderCook,
  startFarm, startNewGame, saveGame, loadGame, manualSave, resetGame,
  listProfiles, deleteProfile, render, nearestInteract, doInteract, readSave, hasSave, profileFor, addLog, renderLog,
  addItem, putEggInHatchery, dailyChickenUpdate, isChick, isHen,
  renderInventory, renderHUD, renderProfiles, applyLang, setLang,
  emojiCache, emojiAnimUrl, emojiPngUrl, emojiWebpUrl, emojiSrcFor, emojiDrawable,
  emojiAnims, emojiFrameIndex, drawEmojiFrame, decodeEmojiAnim, ANIM_DEBUG,
  needsBreath, breathScale, loadEmoji, emojiFrameReady,
  notoAnimState, notoAnimSet, notoHasAnim,
  canvasHasPixels, animSlot, ANIM_PARALLEL, notoNorm, maxIncubate, maxHens, maxChicks,
  maxSheep, maxCows, maxOtherAnimals, maxOrchard, maxTank, maxRecipes, maxPets,
  FACILITIES, FACILITY_ORDER, doUpgrade, applyLevels, lvOf, isMaxLv, upgradeCost,
  addOrchardTree, orchardRect, ORCHARD_SLOTS, ORCHARD_RECTS, PEN_RECTS, POND_SPEC,
  FARM_RECTS, farmRect, QUEUE_SLOTS, MAX_BUYERS, MAX_LV, WORLD_W, WORLD_H, PEN_HOME, TROUGH_OFF, DECOR_SHOP, DECOR_R,
  renderMinimap, miniCanvas, MINI_K, miniRect,
  drawPlayer, drawRider, drawVehicle, drawPet, drawChicken, drawSheep, drawCow, drawShadow, drawBikeRack, VEH_SPEC, PLAYER_FOOT_Y,
  openBedtime, bedInitStep, bedScrub, bedSyncUI, bedProgress, bedAllDone, bedRender, BED_STEPS, bedInShape, BED_GRID, BED_FACE,
  __bedCells: () => bedCells.map(c => ({ x: Math.round(c.x), y: Math.round(c.y), done: c.done })), DECOR_PATCHES, canPlaceAt, solidRects, placeDecoration,
  tankRect, pointInSea, SEA_POLY, decorUnderBuilding,
  newPet, petNeed, petName, renderUpgradeModal, openUpgrade, openUpgradePanel, showUpgradeList, showUpgradeDetail, renderUpgradeList, renderClosetAvatar, tankSize, penRect, penHome, facName, facCapText, facilityStatus, update, TANK_SIZE, STALL_SCALE, PET_SPOTS, petSpotLabel, withPet,
  attractionScore, visitorSlots, visitorFee, attractionSpots, spawnVisitor, updateVisitor, planVisit,
  countHensLaidToday, countHens, countChicks, dailyFarmUpdate, isHen, isChick,
  newZoo, newAnimal,
  buildBasket, basketTotal, basketLabel, canFulfillBasket, basketOf, basketMissing, buildMathSteps, mathExpressionText,
  shopClothesOf, OUTFIT_CATS, RECIPES,
  renderShop, renderWardrobe, renderTank, renderBook, renderSell, customerPool, spawnCustomer,
  startFishing, reelIn, adoptPet, feedPet, cleanPet, bathePet, maxPets, outfitTierMax, shopTierMax,
  drawEmojiAnimated, rawAnimState, detectRawAnim,
};

requestAnimationFrame(loop);
