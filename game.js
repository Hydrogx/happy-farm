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
const CAMERA_ZOOM = 1.2;                       // 画面整体放大一点（人物/动物/文字在手机上更清楚）

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
  fish:       { name: '小鱼',     icon: '🐟', price: 22, cp: '1f41f' },
  shrimp:     { name: '小虾',     icon: '🦐', price: 14, cp: '1f990' },
  shell:      { name: '贝壳',     icon: '🐚', price: 8,  cp: '1f41a' },
  goldfish:   { name: '金鱼',     icon: '🐠', price: 24, cp: '1f420' },
  crab:       { name: '螃蟹',     icon: '🦀', price: 28, cp: '1f980' },
  squid:      { name: '鱿鱼',     icon: '🦑', price: 32, cp: '1f991' },
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
  seed_carrot:{ name: '胡萝卜种子', icon: '🌱', price: 5,  seed: 'carrot' },
  seed_tomato:{ name: '番茄种子',  icon: '🫘', price: 8,  seed: 'tomato' },
  seed_corn: { name: '玉米种子', icon: '🌾', price: 12, cp: '1f331', seed: 'corn' },
};
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
];
const FRUIT_IDS = ['apple', 'orange', 'pear', 'peach', 'strawberry'];
// ---------------- 钓鱼：5 种大小的水波纹，每种 3 种渔获 ----------------
// 三个不同位置的水坑：小水坑 / 中水坑 / 大水坑，每个水坑 5 种渔获
const PONDS = [
  { id: 'small',  name: '小水坑', nameEn: 'Small Puddle', x: 1250, y: 600, w: 132, h: 76,
    rip: { lv: 1, r: 12, color: '#cdeeff', w: 34, name: '小水波', nameEn: 'Small ripple' },
    pool: ['fish', 'shrimp', 'shell', 'goldfish', 'crab'] },
  { id: 'medium', name: '中水坑', nameEn: 'Medium Pond',  x: 1420, y: 706, w: 186, h: 104,
    rip: { lv: 3, r: 24, color: '#63c6f7', w: 20, name: '中水波', nameEn: 'Medium ripple' },
    pool: ['squid', 'puffer', 'octopus', 'lobster', 'seaturtle'] },
  { id: 'large',  name: '大水坑', nameEn: 'Large Pond',   x: 1300, y: 884, w: 286, h: 142,
    rip: { lv: 5, r: 44, color: '#9a7cf0', w: 7,  name: '大水波', nameEn: 'Big ripple' },
    pool: ['croc', 'seal', 'dolphin', 'shark', 'whale'] },
];
const POND_MAP = {};
PONDS.forEach(p => { POND_MAP[p.id] = p; });
const SEA_ALL = PONDS.reduce(function (a, p) { return a.concat(p.pool); }, []);
function pondLabel(p) { return lang === 'en' ? p.nameEn : p.name; }

// ---------------- 森林 & 蜂巢 ----------------
// 森林在农场的右上角（摊位与小水坑之间那片树林），里面有一个蜂巢可以拿蜂蜜
// 森林放在果树区的左下方（左半边那一大片空地），范围比以前大
const FOREST = { x: 30, y: 400, w: 400, h: 250 };
const HIVE = { x: 390, y: 524, r: 96, honey: 1, honeyT: 0, max: 2 };
const HONEY_EVERY = 55;          // 秒：蜂巢重新酿出蜂蜜
// 小工具（提前定义，下面的数据表初始化就要用）
function dist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
const FOREST_TREES = [           // 森林里的大树（蜂巢就挂在那棵树上）
  { x: 390, y: 600, kind: 'big', phase: 0.4 },
  { x: 120, y: 560, kind: 'pine', phase: 1.2 },
  { x: 378, y: 470, kind: 'pine', phase: 2.1 },
  { x: 140, y: 462, kind: 'pine', phase: 3.4 },
  { x: 300, y: 588, kind: 'pine', phase: 4.2 },
];
const FOREST_DECOR = [];         // 树桩 / 灌木（纯装饰）
[['stump', 330, 470], ['stump', 60, 636], ['bush', 240, 610], ['bush', 100, 452],
 ['bush', 400, 520]]
  .forEach(function (d) { FOREST_DECOR.push({ kind: d[0], x: d[1], y: d[2], phase: rand(0, 6) }); });

// 森林里的蘑菇：走过去按 E 就能采；采完过一会儿（或睡一觉）会自己长回来
const MUSHROOMS = [];
const MUSHROOM_REGROW = 40;      // 采完多少秒长回来
const MUSHROOM_POS = [[70, 500], [250, 520], [360, 640], [180, 632], [90, 578], [330, 612], [205, 452]];
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
 'carrot', 'tomato', 'corn', ...FRUIT_IDS, ...SEA_ALL].forEach(function (k) { OBTAINABLE[k] = 1; });

const SELLABLE = ['egg','milk','wool','honey','mushroom','feed','carrot','tomato','corn',...FRUIT_IDS,...SEA_ALL,
  'fried_egg','salad','fish_grill','pudding','fruit_cake','honey_toast','honey_cake',
  'mushroom_soup','mushroom_omelet','veggie_soup','fruit_pie','seafood_platter'];
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
const MAX_ANIMALS = 24;

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
const VEHICLE_RACK = { x: 545, y: 520, r: 86 };
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
    help3: '🥚 鸡会下蛋，捡起来！',
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
    shopTitle: '🛒 牧场商店', tabSeeds: '🌱 种子', tabClothes: '👕 服装',
    tabAnimals: '🐮 动物', tabDecor: '🎡 装饰', tabPet: '🐾 宠物装扮',
    btnLeaveShop: '离开商店',
    cookTitle: '🍳 小厨房', btnCookDone: '做好啦',
    wardrobeTitle: '👕 我的衣柜', wtabHat: '🎩 帽子', wtabShirt: '👕 上衣', wtabPants: '👖 裤子',
    btnWardrobeDone: '换好啦',
    sellTitle: '📦 卖货箱', sellSubtitle: '点一点，把东西换成金币！', btnCloseBin: '关上门',
    logTitle: '📜 牧场日志',
    // —— 状态栏 ——
    hudDay: '📅 第 {n} 天', weather: { sunny: '☀️ 晴天', cloudy: '⛅ 多云', rain: '🌧️ 下雨' },
    // —— 交互提示 ——
    prPickup: '捡起 {item}', prShear: '✂️ 剪羊毛', prMilk: '🥛 挤牛奶',
    prPetChicken: '🐔 摸摸小鸡', prPetChick: '🐤 摸摸小鸡', prPetHen: '🐔 摸摸母鸡',
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
    tooCrowded: '这里太挤啦，换个地方吧',
    wearPetHat: '小{pet}戴上啦，好开心！',
    equipDone: '换上 {name}！',
    cookDone: '香喷喷的{dish}做好啦！',
    soldBin: '卖掉 {item}，+{n} 金币！',
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
    logEgg: '小鸡下了一个蛋 🥚',
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
    // —— 找零钱小挑战 ——
    mathTitle: '🧮 帮忙算零钱',
    mathAsk: '客人买了 {item}（{price} 金币），给了 {paid} 金币，要找他多少零钱？',
    mathHint: '客人给的钱 − 东西的价格 = 要找的零钱',
    nlPrice: '价格',
    nlPaid: '付的钱',
    coinUnit: '{n} 金币',
    mathWrong: '再想想～',
    mathRight: '零钱算对啦：找了 {n} 金币 ✅',
    logCustomerLeftMath: '🧮 {name} 等太久，走了…（下次算快一点）',
    prCustomerMath: '把 {item} 卖给{name}（要算零钱）',
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
    help3: '🥚 Chickens lay eggs — pick them up!',
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
    shopTitle: '🛒 Farm Shop', tabSeeds: '🌱 Seeds', tabClothes: '👕 Clothes',
    tabAnimals: '🐮 Animals', tabDecor: '🎡 Decor', tabPet: '🐾 Pet Hats',
    btnLeaveShop: 'Leave Shop',
    cookTitle: '🍳 Kitchen', btnCookDone: 'Done',
    wardrobeTitle: '👕 My Wardrobe', wtabHat: '🎩 Hats', wtabShirt: '👕 Tops', wtabPants: '👖 Pants',
    btnWardrobeDone: 'Done',
    sellTitle: '📦 Shipping Bin', sellSubtitle: 'Tap an item to turn it into coins!', btnCloseBin: 'Close',
    logTitle: '📜 Farm Log',
    hudDay: '📅 Day {n}', weather: { sunny: '☀️ Sunny', cloudy: '⛅ Cloudy', rain: '🌧️ Rainy' },
    prPickup: 'Pick up {item}', prShear: '✂️ Shear wool', prMilk: '🥛 Milk the cow',
    prPetChicken: '🐔 Pet the chick', prPetChick: '🐤 Pet the chick', prPetHen: '🐔 Pet the hen',
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
    tooCrowded: 'Too crowded here — try another spot',
    wearPetHat: 'Your {pet} loves the new hat!',
    equipDone: 'Wearing {name}!',
    cookDone: 'Yummy {dish} is ready!',
    soldBin: 'Sold {item}, +{n} coins!',
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
    logEgg: 'A chicken laid an egg 🥚',
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
    mathTitle: '🧮 Count the Change',
    mathAsk: 'Your customer buys {item} ({price} coins) and pays {paid} coins. How much change do you give back?',
    mathHint: 'Money paid − price of the item = change',
    nlPrice: 'price',
    nlPaid: 'paid',
    coinUnit: '{n} coins',
    mathWrong: 'Try again~',
    mathRight: 'Correct! You gave {n} coins change ✅',
    logCustomerLeftMath: '🧮 {name} waited too long and left… (be quicker next time)',
    prCustomerMath: 'Sell {item} to {name} (count the change)',
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
  },
};

// 英文名表（中文名直接用原表）
const EN_NAMES = {
  item: { egg: 'Egg', milk: 'Milk', wool: 'Wool', honey: 'Honey', feed: 'Animal Feed',
    mushroom: 'Mushroom', honey_toast: 'Honey Toast', honey_cake: 'Honey Cake',
    mushroom_soup: 'Mushroom Soup', mushroom_omelet: 'Mushroom Omelet',
    veggie_soup: 'Veggie Soup', fruit_pie: 'Fruit Pie', seafood_platter: 'Seafood Platter',
    scooter: 'Scooter', bicycle: 'Bicycle', motorcycle: 'Motorcycle',
    carrot: 'Carrot', tomato: 'Tomato', corn: 'Corn',
    apple: 'Apple', orange: 'Orange', pear: 'Pear', peach: 'Peach', strawberry: 'Strawberry',
    fish: 'Small Fish', bigfish: 'Big Fish', fried_egg: 'Fried Egg', salad: 'Fruit Salad',
    fish_grill: 'Grilled Fish', pudding: 'Milk Pudding', fruit_cake: 'Strawberry Cake',
    seed_carrot: 'Carrot Seeds', seed_tomato: 'Tomato Seeds', seed_corn: 'Corn Seeds',
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
// 有动画的用 512.gif（浏览器自动播放），没有动画版的退回 512.png（再用 canvas 叠加动作）
const EMOJI_BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest/';
const emojiCache = {};     // cp -> { img, ok, kind }
// 官网（googlefonts.github.io/noto-emoji-animation）只给一部分 emoji 做了动画，
// 它自己的清单在 data/api.json 里。拉一次存起来，就知道某个 emoji 到底有没有动画，
// 没有的话直接走静态图，不用白白发两个会 404 的请求。
const NOTO_API = 'https://googlefonts.github.io/noto-emoji-animation/data/api.json';
const NOTO_LIST_KEY = 'farm-noto-anim-list';
let notoAnimSet = null;          // Set：有动画的 codepoint（去掉了 fe0f）
let notoAnimState = 'idle';      // idle | loading | ready | failed
function notoNorm(cp) { return String(cp || '').toLowerCase().replace(/[_-]?fe0f/g, '').replace(/[-_]/g, ''); }
function notoHasAnim(cp) {
  if (!notoAnimSet) return null;            // 还不知道，就让调用方按老办法试
  return notoAnimSet.has(notoNorm(cp));
}
(function loadNotoList() {
  try {
    const cached = localStorage.getItem(NOTO_LIST_KEY);
    if (cached) {
      const arr = JSON.parse(cached);
      if (arr && arr.length) { notoAnimSet = new Set(arr); notoAnimState = 'ready'; return; }
    }
  } catch (e) {}
  if (typeof fetch === 'undefined') { notoAnimState = 'failed'; return; }
  notoAnimState = 'loading';
  fetch(NOTO_API).then(r => r.json()).then(d => {
    const arr = (d.icons || []).map(ic => notoNorm(ic.codepoint));
    notoAnimSet = new Set(arr);
    notoAnimState = 'ready';
    try { localStorage.setItem(NOTO_LIST_KEY, JSON.stringify(arr)); } catch (e) {}
  }).catch(() => { notoAnimState = 'failed'; });
})();

// Noto 的动图有两个地址，和官网 <picture> 里的写法一致：
//   .webp —— 动画版（优先，官网就是先给 webp）
//   .gif  —— 动图（第二选择）
//   .png  —— 静态图（兜底：有些 emoji 官方只有静态图）
function emojiWebpUrl(cp) { return EMOJI_BASE + cp + '/512.webp'; }
function emojiAnimUrl(cp) { return EMOJI_BASE + cp + '/512.gif'; }
function emojiPngUrl(cp) { return EMOJI_BASE + cp + '/512.png'; }

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
const EMOJI_ANIM_MAX = 28;      // 最多同时缓存多少套动画（超出就淘汰最早解的那几套）
const EMOJI_ANIM_PX = 128;      // 每一帧缩到 128px，省内存（游戏里最大也就画 ~70px）
const EMOJI_ANIM_FRAMES = 18;   // 每套动画最多取 18 帧（±× 128px ≈ 1.2MB/套，够顺滑了）
const emojiAnims = {};          // cp -> { frames:[canvas], delay:[ms], total }
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
let emojiAnimQueue = [];
function emojiFrameReady(cp) {
  const a = emojiAnims[cp];
  return !!(a && a.frames && a.frames.length > 1);
}
// 取这一时刻该显示第几帧
function emojiFrameIndex(cp, tSec) {
  const a = emojiAnims[cp];
  if (!a || !a.frames || a.frames.length < 2) return -1;
  let ms = ((tSec * 1000) % a.total + a.total) % a.total;
  for (let i = 0; i < a.frames.length; i++) {
    if (ms < a.delay[i]) return i;
    ms -= a.delay[i];
  }
  return a.frames.length - 1;
}
// 画一帧动画（没有动画就返回 false，让调用方退回静态图）
function drawEmojiFrame(ctx, cp, cx, cy, size, tSec) {
  const i = emojiFrameIndex(cp, tSec);
  if (i < 0) return false;
  const a = emojiAnims[cp];
  ctx.drawImage(a.frames[i], cx - size / 2, cy - size / 2, size, size);
  return true;
}
// 把 GIF 解码成帧（浏览器不支持 / 解码失败就静默放弃，继续用静态图）
function decodeEmojiAnim(cp, url, cb) {
  if (emojiAnims[cp]) {                                        // 已经解过 / 正在解
    const a = emojiAnims[cp];
    if (a.frames && a.frames.length > 1) { if (cb) cb(true); return; }
    if (a.pending && cb) a.cbs.push(cb);
    return;
  }
  if (typeof ImageDecoder === 'undefined' || typeof fetch === 'undefined') { if (cb) cb(false); return; }
  const cbList = cb ? [cb] : [];                                // 必须在下面赋值之前定义
  emojiAnims[cp] = { frames: [], delay: [], total: 0, pending: true, cbs: cbList };
  const finishCb = (ok) => {
    const list = cbList.slice();
    cbList.length = 0;
    const a = emojiAnims[cp];
    if (a) { a.cbs = []; a.pending = false; }
    list.forEach(f => { try { f(ok); } catch (e) {} });
  };
  // 注意顺序：先把回调叫醒，再删掉占位记录（反过来的话回调就永远收不到消息了）
  const fail = (why) => { ANIM_DEBUG.push(cp + ':fail(' + (why || '?') + ')'); finishCb(false); delete emojiAnims[cp]; };
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
        if (!list || list.length < 2) { fail('few:' + (list ? list.length : 0)); return; }
        if (!anyPixels) { fail('blank'); return; }               // 每帧都是空的：这种素材做不了动画
        const a = emojiAnims[cp];
        a.frames = list.map(x => x.cv);
        a.delay = list.map(x => x.dur);
        a.total = a.delay.reduce((x, y) => x + y, 0) || 1200;
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

// 加载 emoji 图：先加载静态 PNG 保证「立刻能用」，再依次尝试 webp / gif 动图，
// 只有确认「能画出东西」才换成动图，同时后台把动图拆成帧做真动画。
function loadEmoji(cp) {
  if (!cp) return null;
  let rec = emojiCache[cp];
  if (rec) return rec;
  rec = emojiCache[cp] = { img: null, ok: false, kind: '' };
  if (typeof Image === 'undefined' || typeof document === 'undefined') return rec;
  const make = () => {
    const im = new Image();
    try { im.crossOrigin = 'anonymous'; } catch (e) {}
    return im;
  };
  rec.pngUrl = emojiPngUrl(cp);
  rec.webpUrl = emojiWebpUrl(cp);
  rec.gifUrl = emojiAnimUrl(cp);
  // ① 先用 PNG 顶上（PNG 一定有，保证任何时刻都有图）
  const png = make();
  png.onload = () => {
    rec.pngOk = true;
    if (!rec.ok) { rec.img = png; rec.ok = true; rec.kind = 'png'; }
  };
  png.onerror = () => { rec.pngOk = false; };
  rec.pngImg = png;
  png.src = rec.pngUrl;
  // ② 依次尝试动图：webp 优先，然后 gif。
  //    注意：这里**不能**只测第 0 帧 —— 海豚、鲨鱼的动图首帧是全透明的，
  //    只看首帧会把它们误判成坏图。改成让解析器解码多帧后再校验。
  const tried = { webp: false, gif: false };
  const pickAnim = (ok) => {
    if (ok) return;
    // 官网清单说这个 emoji 没有动画 → 直接静态图，省掉两个 404 请求
    if (notoHasAnim(cp) === false) { rec.animUrl = rec.pngUrl; return; }
    if (!tried.webp) { tried.webp = true; tryAnim(rec.webpUrl, 'webp', () => pickAnim()); return; }
    if (!tried.gif) { tried.gif = true; tryAnim(rec.gifUrl, 'gif', () => pickAnim()); return; }
  };
  const tryAnim = (url, kind, next) => {
    rec.animUrl = url;                           // DOM 立刻用动图地址（浏览器自己播）
    decodeEmojiAnim(cp, url, function (ok) {
      if (!ok) rec.animUrl = rec.pngUrl;         // 动图不可用就退回静态图
      if (ok) {
        rec.img = emojiAnims[cp].frames[0];      // 用解出来的第一帧当静态底图
        rec.ok = true; rec.kind = kind; rec.animUrl = url;
        if (kind === 'webp') rec.webpOk = true; else rec.gifOk = true;
        // DOM 里还是要原始动图地址（<img> 由浏览器自己播）
        rec.domUrl = url;
      } else if (next) next();
    });
  };
  pickAnim(false);
  return rec;
}
// DOM 里显示某个 emoji 图时该用哪个地址：
// 确认过 GIF 能用就用 GIF（浏览器自己会播动画）；GIF 不能用就用 PNG
function emojiSrcFor(rec) {
  if (!rec) return '';
  if (rec.animUrl) return rec.animUrl;      // webp / gif 动图
  return rec.pngUrl || '';
}
// DOM 里用 <img> 显示 emoji（列表用）。
// 地址走 emojiSrcFor()：有动画的用 GIF，没有动画的用 PNG，
// 并挂了 onerror —— 万一还是加载失败就当场退回 PNG，绝不显示成「碎图」
function emojiImgHTML(cp, emoji, cls) {
  cls = cls || 'emoji-img';
  if (!cp) return emoji;
  const rec = loadEmoji(cp);
  const src = emojiSrcFor(rec);
  if (!src) return emoji;
  const fallback = rec.pngUrl || emojiPngUrl(cp);
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
  { type: 'monkey',   cp: '1f435', name: '猴子', icon: '🐵',   nameEn: 'Monkey',    price: 850,  size: 58, v: 'high',   p: 1.4 },
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
  bear: 'front', bee: 'front', butterfly: 'front', elephant: 'left', flamingo: 'left', fox: 'front',
  frog: 'front', giraffe: 'left', hedgehog: 'left', kangaroo: 'left', koala: 'front',
  lion: 'front', lizard: 'left', monkey: 'front', panda: 'front', peacock: 'front',
  penguin: 'left', rabbit: 'left', raccoon: 'front', sloth: 'front', snail: 'left',
  snake: 'left', squirrel: 'left', turtle: 'right', zebra: 'left',
};
const ZOO_FLY = { bee: 1, butterfly: 1, flamingo: 0, peacock: 0 };   // 会飞的（轻盈地飘）

// ---------------- 鸡棚规则（母鸡 / 孵蛋 / 小鸡） ----------------
const MAX_HENS = 5;              // 最多 5 只母鸡
const MAX_CHICKS = 10;           // 最多 10 只小鸡
const HATCH_DAYS = 15;           // 鸡蛋放进孵蛋器，15 天（游戏内天数）后孵出小鸡
const CHICK_GROW_DAYS = 30;      // 小鸡出生 30 天后长成母鸡
const MAX_INCUBATE = 12;         // 孵蛋器最多同时放 12 个蛋（要等 15 天，一次多放几个才够玩）
const HEN_GROW = 1.15;           // 母鸡整体放大一点
const CHICK_SCALE = 0.62;        // 小鸡小小一只

// ---------------- 放牧规则（饲料） ----------------
// 每种农场动物每天都要吃一份饲料；连续 3 天没放饲料，动物就会饿得跑出围栏、也不再产出
const FEED_PER_DAY = 1;          // 每只动物每天 1 份
const FEED_MAX = 15;             // 每个食槽最多存 15 份（够 5 只动物吃 3 天）
const UNFED_LIMIT = 3;           // 连续 3 天没饲料 → 饿跑
const FEED_BUY_PRICE = 8;        // 商店里一份饲料的价格
const PET_SCALE = 1.3;           // 人物整体再放大一点
const ANIMAL_SCALE = 1.3;        // 动物整体再放大一点
// 食槽（放在各自棚舍里，走到旁边按 E 放饲料）
const TROUGHS = [
  { id: 'chicken', type: 'chicken', x: 268, y: 760, r: 72, feed: 8, unfed: 0 },
  { id: 'sheep',   type: 'sheep',   x: 556, y: 852, r: 72, feed: 8, unfed: 0 },
  { id: 'cow',     type: 'cow',     x: 876, y: 846, r: 74, feed: 8, unfed: 0 },
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
function fillTrough(tr) {
  const need = FEED_MAX - tr.feed;
  if (need <= 0) { sfx.error(); say('feedFull'); return false; }
  const have = G.inventory.feed || 0;
  if (have > 0) {
    const use = Math.min(have, need);
    removeItem('feed', use);
    tr.feed += use;
    if (tr.feed > 0) tr.unfed = 0;
    sfx.plant(); spawnParticles(tr.x, tr.y - 14, '🌾', 5);
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
    say('logFeedCorn', { n: tr.feed, max: FEED_MAX });
    saveGame(true);
    return true;
  }
  sfx.error(); say('noFeed');
  return false;
}
function isHen(a) { return a.type === 'chicken' && a.stage !== 'chick'; }
function isChick(a) { return a.type === 'chicken' && a.stage === 'chick'; }
function countHens() { return G.animals.filter(isHen).length; }
function countChicks() { return G.animals.filter(isChick).length; }
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
    x: 420, y: 500, dir: 'down', gender: 'boy',
    moving: false, walkPhase: 0, actionT: 0,
    outfit: { hat: 'ragged', shirt: 'ragged', pants: 'ragged' },
  },
  owned: { hat: ['ragged'], shirt: ['ragged'], pants: ['ragged'] },
  pet: { type: 'dog', x: 380, y: 530, dir: 'right', moving: false, walkPhase: 0, phase: 0, hat: 'none', happy: 0 },
  petHatsOwned: [],
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
};

// 场景交互点（房子区搬到商店旁边，果树在房子左侧）
const ZONES = {
  house:    { x: 1020, y: 220 },
  kitchen:  { x: 1120, y: 400, r: 55 },
  wardrobe: { x: 930,  y: 370, r: 55 },
  bin:      { x: 1020, y: 490, r: 55 },
  stall:    { x: 1295, y: 300, r: 70 },
  tank:     { x: 730, y: 470, r: 132 },
  rack:     { x: 545, y: 520, r: 86 },    // 停车架（骑上 / 停下交通工具）
  hatchery: { x: 348, y: 742, r: 74 },    // 鸡棚里的孵蛋器
  pond:     { x: 1300, y: 800, w: 280, h: 140 },
};

// 动物棚舍区域（每种动物一个独立围栏）
const PENS = {
  chicken: { x: 200, y: 700, w: 220, h: 150, home: { x: 310, y: 790, r: 75 } },
  sheep:   { x: 520, y: 790, w: 240, h: 160, home: { x: 640, y: 885, r: 80 } },
  cow:     { x: 840, y: 780, w: 260, h: 170, home: { x: 975, y: 880, r: 85 } },
};

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
  // 动物（各自住在自己的棚舍里）：一开始是 2 只母鸡 + 1 只小鸡
  G.animals = [
    newAnimal('chicken', 270, 780), newAnimal('chicken', 320, 810),
    newAnimal('chicken', 350, 770, 'chick'),
    newAnimal('sheep', 600, 870), newAnimal('sheep', 690, 900),
    newAnimal('cow', 970, 870),
  ];
  G.incubating = [];
  // 装饰（避开建筑/田地/池塘/棚舍/果树/森林）
  const avoid = [
    { x: 890, y: 90, w: 330, h: 460 },    // 房子区（近商店）
    { x: 470, y: 570, w: 240, h: 190 },   // 田地
    { x: 1170, y: 545, w: 250, h: 120 },  // 小水坑
    { x: 1310, y: 640, w: 250, h: 135 },  // 中水坑
    { x: 1140, y: 800, w: 340, h: 180 },  // 大水坑
    { x: 1180, y: 190, w: 240, h: 180 },  // 摊位
    { x: 190, y: 690, w: 240, h: 170 },   // 鸡棚
    { x: 510, y: 780, w: 260, h: 180 },   // 羊棚
    { x: 830, y: 770, w: 280, h: 190 },   // 牛棚
    { x: 160, y: 120, w: 500, h: 320 },   // 果树区（房子左侧）
    { x: 610, y: 345, w: 250, h: 140 },   // 水族箱
    { x: FOREST.x, y: FOREST.y, w: FOREST.w, h: FOREST.h },   // 森林
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

// 创建一只动物（初始动物和商店买的动物都用它）
// stage: 'hen'（母鸡，会下蛋）/ 'chick'（小鸡，出生 5 天后长成母鸡）
function newAnimal(type, x, y, stage) {
  return {
    type, x, y, dir: Math.random() < .5 ? 'left' : 'right',
    moving: false, walkPhase: 0, phase: rand(0, 6),
    tx: x, ty: y, waitT: rand(1, 3), peck: 0,
    wool: 1, woolT: 0, milkReady: true, milkT: 0, eggT: rand(15, 40),
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
  if (countChicks() >= MAX_CHICKS) { note('logChicksFull', { max: MAX_CHICKS }); return null; }
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
      // 只要今天吃饱了，之前饿跑的动物就自己回窝（每次结算都清一次，避免漏掉）
      let cameBack = false;
      for (const a of G.animals) {
        if (a.type === tr.type && a.tired) {
          a.tired = false;
          cameBack = true;
          spawnParticles(a.x, a.y - 18, '💖', 4);
        }
      }
      if (cameBack) { note('logFeedBack'); sfx.sparkle(); }
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
  // ① 小鸡长大（母鸡满 5 只就保持原样）
  for (const a of G.animals) {
    if (!isChick(a)) continue;
    a.growT++;
    if (a.growT >= CHICK_GROW_DAYS) {
      if (countHens() < MAX_HENS) {
        a.stage = 'hen'; a.growT = 0; a.eggT = rand(20, 45);
        spawnParticles(a.x, a.y - 18, '✨', 6);
        sfx.sparkle();
        note('logChickGrew');
      } else {
        a.growT = CHICK_GROW_DAYS;   // 保持原样，等母鸡位置空出来
        note('logHensFull', { max: MAX_HENS });
      }
    }
  }
  // ② 孵蛋器：15 天后孵出小鸡
  for (let i = G.incubating.length - 1; i >= 0; i--) {
    const e = G.incubating[i];
    e.left--;
    if (e.left <= 0) {
      if (countChicks() >= MAX_CHICKS) { e.left = 1; continue; }   // 小鸡满了，再等等
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
  if (G.incubating.length >= MAX_INCUBATE) { sfx.error(); say('hatchFull', { max: MAX_INCUBATE }); return; }
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
function readSave(name) {
  let pid = playerPid;
  if (name !== undefined) { const p = profileFor(name); pid = p ? p.pid : -1; }
  if (pid < 0) {
    // 还没有任何档案时的兜底：尝试旧的单存档键
    try {
      const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return (d && d.v === 1) ? d : null;
    } catch (e) { return null; }
  }
  try {
    const raw = localStorage.getItem(slotKey(pid));
    if (!raw) return null;
    const d = JSON.parse(raw);
    return (d && d.v === 1) ? d : null;
  } catch (e) { return null; }
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
    v: 1,
    profile: { name: playerName },
    coins: G.coins, day: G.day, timeMin: G.timeMin, weather: G.weather,
    inventory: G.inventory, owned: G.owned, petHatsOwned: G.petHatsOwned,
    player: {
      x: G.player.x, y: G.player.y, dir: G.player.dir,
      gender: G.player.gender, outfit: { ...G.player.outfit },
    },
    pet: { type: G.pet.type, hat: G.pet.hat },
    animals: G.animals.map(a => ({ type: a.type, x: a.x, y: a.y, wool: a.wool, milkReady: a.milkReady,
                                   stage: a.stage, growT: a.growT, tired: a.tired })),
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
    tank: G.tank.slice(0, TANK_MAX),
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
    G.petHatsOwned = Array.isArray(d.petHatsOwned) ? d.petHatsOwned : [];
    G.vehicles = Array.isArray(d.vehicles) ? d.vehicles.filter(function (v) { return VEHICLE_MAP[v]; }) : [];
    G.vehicle = (d.vehicle && G.vehicles.indexOf(d.vehicle) >= 0) ? d.vehicle : null;
    if (d.player) {
      if (Number.isFinite(d.player.x)) G.player.x = Math.max(20, Math.min(WORLD_W - 20, d.player.x));
      if (Number.isFinite(d.player.y)) G.player.y = Math.max(120, Math.min(WORLD_H - 20, d.player.y));
      G.player.dir = d.player.dir || 'down';
      G.player.gender = d.player.gender === 'girl' ? 'girl' : 'boy';
      if (d.player.outfit) {
        G.player.outfit = {
          hat: OUTFITS.hat[d.player.outfit.hat] ? d.player.outfit.hat : 'ragged',
          shirt: OUTFITS.shirt[d.player.outfit.shirt] ? d.player.outfit.shirt : 'ragged',
          pants: OUTFITS.pants[d.player.outfit.pants] ? d.player.outfit.pants : 'ragged',
        };
      }
    }
    if (d.pet) {
      G.pet.type = ['cat', 'duck', 'goose'].includes(d.pet.type) ? d.pet.type : 'dog';
      G.pet.hat = (d.pet.hat && OUTFITS.hat[d.pet.hat]) ? d.pet.hat : 'none';
      G.pet.x = G.player.x - 40; G.pet.y = G.player.y + 30;
    }
    // 动物（老存档里的鸡都是成年母鸡；小鸡记录生长天数）
    if (Array.isArray(d.animals) && d.animals.length) {
      G.animals = d.animals.filter(a => a && PENS[a.type]).map(a => {
        const na = newAnimal(a.type, Number.isFinite(a.x) ? a.x : PENS[a.type].home.x,
                                      Number.isFinite(a.y) ? a.y : PENS[a.type].home.y,
                                      a.stage === 'chick' ? 'chick' : 'hen');
        if (typeof a.wool === 'number') na.wool = a.wool;
        na.milkReady = a.milkReady !== false;
        if (na.stage === 'chick') na.growT = Number.isFinite(a.growT) ? Math.max(0, Math.min(CHICK_GROW_DAYS, a.growT)) : 0;
        na.tired = a.tired === true;
        return na;
      });
      if (!G.animals.length) G.animals = [newAnimal('chicken', 270, 780), newAnimal('chicken', 320, 810)];
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
      ? d.incubating.filter(e => e && Number.isFinite(e.left)).slice(0, MAX_INCUBATE)
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
    // 果树
    if (Array.isArray(d.trees)) {
      d.trees.forEach((t, i) => {
        const tr = G.trees[i];
        if (!tr || !t) return;
        tr.fruits = Number.isFinite(t.fruits) ? Math.max(0, Math.min(3, t.fruits)) : tr.fruits;
        tr.timer = Number.isFinite(t.timer) ? t.timer : 0;
      });
    }
    // 地上的物品
    G.groundItems = Array.isArray(d.items)
      ? d.items.filter(i => i && ITEMS[i.id] && Number.isFinite(i.x) && Number.isFinite(i.y))
               .map(i => ({ id: i.id, x: i.x, y: i.y, phase: rand(0, 6) }))
      : [];
    // 动物园的观赏动物
    if (Array.isArray(d.zoo)) {
      G.zoo = d.zoo.filter(z => z && ZOO_MAP[z.type] && Number.isFinite(z.x) && Number.isFinite(z.y))
                   .map(z => newZoo(z.type, z.x, z.y));
    }
    // 水族箱（只收鱼类/海洋生物，最多 20）
    G.tank = Array.isArray(d.tank) ? d.tank.filter(id => SEA_SET[id]).slice(0, TANK_MAX) : [];
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
    G.sleepFade = 0; G.sleepDawn = false; G.customerTimer = rand(20, 40);
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
  G.owned = { hat: ['ragged'], shirt: ['ragged'], pants: ['ragged'] };
  G.petHatsOwned = [];
  G.vehicles = []; G.vehicle = null;
  G.player.x = 420; G.player.y = 500; G.player.dir = 'down';
  G.player.gender = chosenGender;
  G.player.outfit = { hat: 'ragged', shirt: 'ragged', pants: 'ragged' };
  G.pet.type = chosenPet; G.pet.hat = 'none'; G.pet.happy = 0;
  G.pet.x = 380; G.pet.y = 530;
  G.groundItems = []; G.customers = []; G.particles = [];
  G.plots = []; G.trees = []; G.decor = []; G.animals = []; G.incubating = [];
  TROUGHS.forEach(tr => { tr.feed = 8; tr.unfed = 0; });
  freshMushroom();
  G.decorations = []; G.placing = null; G.zoo = []; G.seaCaught = {}; G.tank = [];
  HIVE.honey = 1; HIVE.honeyT = 0;
  G.fishing = null; G.sleepFade = 0; G.sleepDawn = false;
  G.customerTimer = 18; G.ambientT = 6; G.saveT = 0;
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
// 随机找一个能站的位置（不落水、不出界）
function zooRandomSpot(home) {
  for (let i = 0; i < 12; i++) {
    const x = Math.max(40, Math.min(WORLD_W - 40, home.x + rand(-home.r, home.r)));
    const y = Math.max(150, Math.min(WORLD_H - 30, home.y + rand(-home.r, home.r)));
    let wet = false;
    for (const pc of PONDS) {
      const ex = (x - pc.x) / (pc.w / 2 + 40), ey = (y - pc.y) / (pc.h / 2 + 40);
      if (ex * ex + ey * ey <= 1) { wet = true; break; }
    }
    if (!wet) return { x, y };
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
// 客人用整钱付款，小朋友要算「该找多少零钱」，答对才成交
const MATH_TIME = 16;                    // 每题给 16 秒
function coinChoices(price) {
  // 价格不可能大于 20，凑一个「整钱」付款额（5 / 10 / 20 / 50 / 100）
  const pays = [5, 10, 20].filter(p => p > price);
  const pay = pays.length ? pick(pays) : pick([20, 50, 100].filter(p => p > price));
  return { pay, change: pay - price };
}
// 生成四个选项：一个正确答案 + 三个贴近答案的错项
function makeChoices(correct) {
  const set = [correct];
  const near = [1, 2, 5, 10, 3, 4, 20];
  const cand = [];
  for (let i = 0; i < near.length; i++) {
    cand.push(correct + near[i]);
    if (correct - near[i] > 0) cand.push(correct - near[i]);
  }
  // 打乱候选，挑三个不重复、不为负的
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
function openMathChallenge(c) {
  const price = ITEMS[c.want].price;
  const cc = coinChoices(price);
  G.math = {
    c: c, item: c.want, price: price, paid: cc.pay, change: cc.change,
    choices: makeChoices(cc.change), t: MATH_TIME,
    payLabel: t('coinUnit', { n: cc.pay }),   // 用「50 金币」这种说法
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
  q.innerHTML = t('mathAsk', { item: nm('item', m.item), price: m.price, paid: m.paid });
  if (info) info.innerHTML = numberLineHTML(m.price, m.paid);
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
// 数轴：把「价格」和「付的钱」标在一条线上，小朋友一眼看出要往前跳多少
function numberLineHTML(price, paid) {
  const max = Math.max(paid, price) + 5;
  const pPct = (price / max) * 100, dPct = (paid / max) * 100;
  let ticks = '';
  for (let v = 0; v <= max; v += 5) {
    const pct = (v / max) * 100;
    ticks += '<span class="nl-tick" style="left:' + pct + '%"></span>' +
             '<span class="nl-label" style="left:' + pct + '%">' + v + '</span>';
  }
  return '<div class="nl-wrap">' +
      '<div class="nl-dot price" style="left:' + pPct + '%"><b>' + price + '</b></div>' +
      '<div class="nl-dot paid" style="left:' + dPct + '%"><b>' + paid + '</b></div>' +
      '<div class="nl-jump" style="left:' + pPct + '%;width:' + Math.max(0, dPct - pPct) + '%"></div>' +
      '<div class="nl-line">' + ticks + '</div>' +
      '<div class="nl-caption">' +
        '<span class="nl-key price">' + t('nlPrice') + ' ' + price + ' 金币</span>' +
        '<span class="nl-key paid">' + t('nlPaid') + ' ' + paid + ' 金币</span>' +
      '</div>' +
    '</div>';
}
// 把金额画成硬币（10 / 5 / 1）
function coinHTML(n) {
  let left = n, out = '';
  const coins = [[10, '#ffd23e', '#d9a62e', '10'], [5, '#ffb84d', '#e09a2f', '5'], [1, '#e8d9b0', '#c9a86a', '1']];
  const MAX = 6;                        // 最多画 6 枚，剩下用数字表示
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
function answerMath(v) {
  const m = G.math;
  if (!m) return;
  const c = m.c;
  if (v === m.change) {
    // 答对：成交，客人开开心心走了
    closeMathChallenge();
    if (!removeItem(c.want)) { sfx.error(); say('noSuchItem', { item: nm('item', c.want) }); return; }
    const gain = Math.round(ITEMS[c.want].price * 1.5);
    G.coins += gain; renderHUD();
    coinBurst(c.x, c.y - 30, gain);
    spawnParticles(c.x, c.y - 25, '💖', 6);
    c.state = 'leave'; c.happy = true;
    sfx.happy(); sfx.coin();
    const msg = t('logSoldCustomer', { item: nm('item', c.want), name: custName(c), n: gain });
    toast(msg, 2200);
    addLog(msg);
    addLog(t('mathRight', { n: m.change }));
    saveGame(true);
  } else {
    // 答错：再给一次机会，时间也在走
    sfx.error();
    const box = $('math-choices');
    if (box) {
      box.classList.add('shake');
      setTimeout(function () { box.classList.remove('shake'); }, 420);
    }
    toast(t('mathWrong'), 1500);
  }
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
// 客人等不及走了（没卖掉的那件东西不算）
function resolveCustomerSale(c) {
  if (removeItem(c.want)) {
    const gain = Math.round(ITEMS[c.want].price * 1.5);
    G.coins += gain; renderHUD();
    coinBurst(c.x, c.y - 30, gain);
    c.state = 'leave'; c.happy = true;
  }
}

// 宠物的名字（狗 / 猫 / 鸭 / 鹅）
function petName() {
  const ty = G.pet.type;
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
  G.pet.type = ['cat', 'duck', 'goose'].includes(type) ? type : 'dog';
  G.pet.happy = 3;
  sfx.petVoice(G.pet.type);
  spawnParticles(G.pet.x, G.pet.y - 20, '💖', 5);
  say('petSwitched', { pet: petName() }, 2200, false, { icon: '🐾', sub: t('petSwitchSub') });
  saveGame(true); renderWardrobe();
}

// ---------------- 庭院装饰：放置 ----------------
function canPlaceAt(id, x, y) {
  const d = DECOR_SHOP.find(v => v.id === id);
  if (!d) return 'tooCrowded';
  for (const pc of PONDS) {
    const ex = (x - pc.x) / (pc.w / 2 + 20), ey = (y - pc.y) / (pc.h / 2 + 20);
    if (ex * ex + ey * ey < 1) return 'inWater';
  }
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
  const phs = (document.querySelectorAll ? document.querySelectorAll('[data-i18n-ph]') : []) || [];
  for (let i = 0; i < phs.length; i++) {
    const k = phs[i].getAttribute && phs[i].getAttribute('data-i18n-ph');
    if (k) phs[i].placeholder = t(k);
  }
  const rh = $('rotate-hint'); if (rh) rh.textContent = t('rotateHint');
  const lh = $('log-head'); if (lh) lh.textContent = t('logTitle');
  const lb = $('btn-lang');
  if (lb) { lb.textContent = lang === 'en' ? 'EN' : '\u4e2d'; lb.title = t('switchLang'); }
  const btns = { 'btn-help': 'helpTitle', 'save-box': 'saveTitle2',
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
  const items = G.log.slice(-5);
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
  // 东西多的时候把格子自动缩小，保证物品栏只占一行、不会压住日志和提示
  const maxW = (VIEW_W - 96) * 0.94;          // 左右各留一点，别顶到边上
  const gap = 6;
  let slot = ids.length ? Math.floor((maxW - gap * (ids.length - 1)) / ids.length) : 62;
  slot = Math.max(30, Math.min(62, slot));
  bar.style.setProperty('--inv-slot', slot + 'px');
  bar.style.setProperty('--inv-emoji', Math.round(slot * 0.66) + 'px');
  bar.style.setProperty('--inv-font', Math.round(slot * 0.44) + 'px');
  bar.style.setProperty('--inv-cnt', Math.max(10, Math.round(slot * 0.26)) + 'px');
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
$('btn-help').addEventListener('click', () => { sfx.open(); toggleModal('help-modal'); });
$('btn-book').addEventListener('click', () => { sfx.open(); renderBook(); toggleModal('book-modal'); });
$('touch-book').addEventListener('pointerdown', (e) => { e.preventDefault(); sfx.open(); renderBook(); toggleModal('book-modal'); });
$('btn-mute').addEventListener('click', () => { setMuted(!muted); sfx.click(); note(muted ? 'logSoundOff' : 'logSoundOn'); });
$('btn-music').addEventListener('click', () => { sfx.click(); setMusic(!musicOn); note(musicOn ? 'logMusicOn' : 'logMusicOff'); });
// 点右上角的 💾 或按 S 随时手动存档（S 也能往下走，所以只在没在走路时存）
$('save-box').addEventListener('click', () => { manualSave(); });
// 正在输入名字的时候不要触发游戏快捷键
function playerTyping() {
  const el = document.activeElement;
  return !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'));
}

// ---------------- 商店 ----------------
let shopTab = 'seeds';
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

function renderShop() {
  const box = $('shop-items');
  box.innerHTML = '';
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
    for (const id of ['seed_carrot', 'seed_tomato', 'seed_corn']) {
      mkCard(iconBox('item', id), nm('item', id), ITEMS[id].price, () => {
        G.coins -= ITEMS[id].price; addItem(id); sfx.buy();
        say('bought', { item: nm('item', id) }, 2200, false, { icon: id, sub: t('boughtCardSub') });
        renderShop(); renderHUD();
      });
    }
    // 动物饲料：一次买 5 份，够喂几天
    mkCard(iconBox('item', 'feed'), nm('item', 'feed'), ITEMS.feed.price * 5, () => {
      G.coins -= ITEMS.feed.price * 5; addItem('feed', 5); sfx.buy();
      say('boughtFeed', { n: 5 }, 2200, false, { icon: 'feed', sub: t('feedCardSub') });
      renderShop(); renderHUD();
    }, false, t('feedShopDesc', { n: FEED_PER_DAY, max: FEED_MAX }));
  } else if (shopTab === 'clothes') {
    for (const cat of ['hat', 'shirt', 'pants']) {
      for (const [key, o] of Object.entries(OUTFITS[cat])) {
        if (o.price === 0) continue;
        const owned = G.owned[cat].includes(key);
        mkCard(iconBox(cat, key), o.name, o.price, () => {
          G.coins -= o.price; G.owned[cat].push(key); sfx.buy();
          say('boughtClothes', { name: nm(cat, key) }, 2400, false, { icon: '👕', sub: t('boughtCardSub') });
          renderShop(); renderHUD();
        }, owned);
      }
    }
  } else if (shopTab === 'vehicles') {
    // 交通工具：买回来后走到停车架按 E 就能骑上，骑上走得快
    const vhead = document.createElement('div');
    vhead.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    vhead.textContent = t('vehicleShopHead', { key: KEY_HINT });
    box.appendChild(vhead);
    for (const v of VEHICLES) {
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
    head.textContent = t('animalCount', { n: cappedAnimalCount(), max: MAX_ANIMALS })
      + ' · ' + t('logHens', { h: countHens(), hm: MAX_HENS, c: countChicks(), cm: MAX_CHICKS,
                               f: chTrough ? chTrough.feed : 0 });
    box.appendChild(head);
    for (const a of ANIMAL_SHOP) {
      const isHenBuy = a.type === 'chicken';
      const full = isHenBuy ? (countHens() >= MAX_HENS)
                            : (cappedAnimalCount() >= MAX_ANIMALS);
      const sub = isHenBuy ? t('shopHenDesc', { hm: MAX_HENS }) : a.desc;
      mkCard(iconBox('emoji', a.icon), isHenBuy ? t('animalHen') : a.name, a.price, () => {
        if (isHenBuy && countHens() >= MAX_HENS) { sfx.error(); say('tooManyHens', { max: MAX_HENS }); return; }
        if (!isHenBuy && cappedAnimalCount() >= MAX_ANIMALS) { sfx.error(); say('tooManyAnimals'); return; }
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
        renderShop(); renderHUD();
      }, false, sub);
    }
  } else if (shopTab === 'zoo') {
    // 动物园：观赏动物，不产出
    const head = document.createElement('div');
    head.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    head.textContent = t('zooHead', { n: G.zoo.length, max: MAX_ZOO });
    box.appendChild(head);
    for (const z of ZOO_SHOP) {
      mkCard(iconBox('zoo', z.type), nm('zoo', z.type), z.price, () => {
        if (G.zoo.length >= MAX_ZOO) { sfx.error(); say('tooManyZoo'); return; }
        G.coins -= z.price;
        const spot = zooRandomSpot({ x: WORLD_W / 2, y: 520, r: 420 });
        G.zoo.push(newZoo(z.type, spot.x, spot.y));
        sfx.buy(); sfx.zooVoice(z.v, z.p, 300);
        spawnParticles(spot.x, spot.y - 20, '💖', 5);
        say('boughtZoo', { animal: nm('zoo', z.type) }, 2600, false, { icon: z.icon, sub: t('zooNote') });
        renderShop(); renderHUD();
      }, false, t('zooNote'));
    }
  } else if (shopTab === 'decor') {
    // 庭院装饰：买好后进入放置模式，走到喜欢的位置放下
    const head = document.createElement('div');
    head.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    head.textContent = t('decorCount', { n: G.decorations.length, key: KEY_HINT });
    box.appendChild(head);
    for (const d of DECOR_SHOP) {
      mkCard(iconBox('emoji', d.icon), d.name, d.price, () => {
        G.coins -= d.price;
        sfx.buy(); renderHUD();
        closeModal('shop-modal');
        G.placing = { id: d.id };
        say('boughtDecor', { key: KEY_HINT, extra: isTouch ? '' : t('cancelHint') }, 3200, false,
            { big: true, icon: d.icon, sub: t('boughtCardSub') });
      }, false, t('placeFree'));
    }
  } else {
    for (const [key, o] of Object.entries(PET_HATS)) {
      const owned = G.petHatsOwned.includes(key);
      mkCard(iconBox('hat', key), o.name, o.price, () => {
        G.coins -= o.price; G.petHatsOwned.push(key);
        G.pet.hat = key; G.pet.happy = 3; sfx.buy();
        spawnParticles(G.pet.x, G.pet.y - 20, '💖', 4);
        say('wearPetHat', { pet: petName() }, 2400, false, { icon: o.icon, sub: t('boughtCardSub') });
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

// ---------------- 衣柜 ----------------
let wTab = 'hat';
function renderWardrobe() {
  if (typeof highlightChar === 'function') highlightChar();
  const box = $('wardrobe-items');
  box.innerHTML = '';
  // 帽子可以有「不戴」选项；上衣/裤子必须穿，初始的破衣服/破裤子也在列表里
  const list = wTab === 'hat' ? ['none', ...G.owned.hat] : [...G.owned[wTab]];
  for (const key of list) {
    const o = OUTFITS[wTab][key];
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.appendChild(iconBox(wTab, key));
    d.insertAdjacentHTML('beforeend', `<div>${o.name}</div>`);
    const b = document.createElement('button');
    const wearing = G.player.outfit[wTab] === key;
    b.textContent = wearing ? t('wearing') : t('wearIt');
    b.disabled = wearing;
    b.onclick = () => {
      G.player.outfit[wTab] = key;
      sfx.equip(); spawnParticles(G.player.x, G.player.y - 30, '✨', 5);
      say('equipDone', { name: nm(wTab, key) });
      renderWardrobe();
    };
    d.appendChild(b);
    box.appendChild(d);
  }
  // 宠物帽子区
  if (G.petHatsOwned.length) {
    const title = document.createElement('div');
    title.style.cssText = 'grid-column:1/-1;font-weight:bold;color:#c77;';
    title.textContent = t('petSection');
    box.appendChild(title);
    for (const key of G.petHatsOwned) {
      const o = PET_HATS[key];
      const d = document.createElement('div');
      d.className = 'shop-item';
      d.appendChild(iconBox('hat', key));
      d.insertAdjacentHTML('beforeend', `<div>${o.name}</div>`);
      const b = document.createElement('button');
      const wearing = G.pet.hat === key;
      b.textContent = wearing ? t('wearing') : t('wearPet');
      b.disabled = wearing;
      b.onclick = () => {
        G.pet.hat = key; G.pet.happy = 3; sfx.equip();
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
    sfx.click();
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
const TANK_MAX = 20;
function putInTank(id) {
  if (!SEA_SET[id]) return;
  if (G.tank.length >= TANK_MAX) { sfx.error(); say('tankFull', { max: TANK_MAX }); return; }  // 超过就提示放不下
  if (!removeItem(id)) return;
  G.tank.push(id);
  sfx.water();
  say('tankPut', { fish: nm('item', id) });
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
  cnt.textContent = t('tankCount', { n: G.tank.length, max: TANK_MAX });
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
  const full = G.tank.length >= TANK_MAX;
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
    const d = document.createElement('div');
    d.className = 'shop-item';
    d.innerHTML = `<div class="icon">${emojiImgHTML(it.cp, it.icon, 'emoji-img big')}</div><div>${nm('item', id)} ×${G.inventory[id]}</div>`;
    const b = document.createElement('button');
    b.textContent = t('sellOne', { n: it.price });
    b.onclick = () => {
      if (removeItem(id)) {
        G.coins += it.price; sfx.coin(); renderHUD(); renderSell();
        say('soldBin', { item: nm('item', id), n: it.price });
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
    if (d < bestD) { bestD = d; best = { kind: 'item', it, label: `${ITEMS[it.id].icon} ${t('prPickup', { item: nm('item', it.id) })}` }; }
  }
  // 2. 等待中的客人（优先售卖，检测范围比其它略大）
  for (const c of G.customers) {
    if (c.state !== 'wait') continue;
    const d = dist(p.x, p.y, c.x, c.y);
    if (d < bestD + 30) {
      bestD = Math.min(bestD, d);
      best = { kind: 'customer', c, label: `${ITEMS[c.want].icon} ${t('prCustomerMath', { item: nm('item', c.want), name: custName(c) })}` };
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
          : { kind: 'petChicken', a, label: t('prPetHen') };
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
    ['tank', 'tank', t('prTank')],
    ['rack', 'rack', G.vehicle
        ? t('prPark', { v: nm('vehicle', G.vehicle) })
        : (G.vehicles.length ? t('prRide', { v: nm('vehicle', G.vehicles[G.vehicles.length - 1]) }) : t('prRackEmpty'))],
    ['hatchery', 'hatch', G.incubating.length
        ? t('hatchDays', { n: G.incubating.length, d: hatchDaysLeft() })
        : t('prHatch', { n: G.incubating.length, max: MAX_INCUBATE })],
  ];
  for (const [zk, kind, label] of zoneChecks) {
    const z = ZONES[zk];
    const d = dist(p.x, p.y, z.x, z.y);
    if (d < z.r && d < bestD) { bestD = d; best = { kind, label }; }
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
  let nearPond = null, nearPondD = Infinity;
  for (const pond of PONDS) {
    if (Math.abs(p.x - pond.x) < pond.w / 2 + 44 && Math.abs(p.y - pond.y) < pond.h / 2 + 44) {
      const d = Math.max(0, pondDist(pond, p.x, p.y));
      if (d < nearPondD) { nearPondD = d; nearPond = pond; }
    }
  }
  if (!best && nearPond) best = { kind: 'fish', pond: nearPond, label: t('prFishAt', { pond: pondLabel(nearPond) }) };
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
      if (G.inventory[c.want] > 0) {
        // 先请小朋友帮忙算要找多少零钱（小学二年级难度），答对才算成交
        openMathChallenge(c);
      } else {
        sfx.error();
        say('noSuchItem', { item: nm('item', c.want) });
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
    G.pet.happy = 2;
    saveGame(true);
  } else {
    sfx.splash(); say('reelIn');
  }
  G.fishing = null;
}

// ---------------- 客人系统 ----------------
// 客人只会买「农场能产出」的东西：已采摘的、还能摘/挤/剪的、材料够做的菜
// 鱼类和海洋生物不在此列（准备太久、太随机）
const FARM_GOODS = ['egg', 'milk', 'wool', 'honey', 'mushroom', 'carrot', 'tomato', 'corn', ...FRUIT_IDS];
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
  // ③ 材料已经够做的菜（需要鱼的菜不算）
  for (const r of RECIPES) {
    const needsSea = Object.keys(r.needs).some(k => SEA_SET[k] || k === 'fish');
    if (!needsSea && hasItems(r.needs)) add(r.id);
  }
  if (!pool.length) add('egg');   // 兜底，保证客人总有东西能买
  return pool;
}

// 客人的名字按当前语言显示
function custName(c) { return (lang === 'en' ? c.nameObj.en : c.nameObj.zh); }

function spawnCustomer() {
  const pool = customerPool();
  const want = pick(pool);
  const hatKeys = Object.keys(OUTFITS.hat).filter(k => k !== 'none');
  const c = {
    nameObj: pick(CUSTOMER_NAMES),
    gender: Math.random() < 0.5 ? 'boy' : 'girl',
    hat: Math.random() < 0.35 ? 'none' : pick(hatKeys),      // 头饰
    shirt: pick(Object.keys(OUTFITS.shirt)),                  // 上衣
    pants: pick(Object.keys(OUTFITS.pants)),                  // 裤子
    hairStyle: pick(HAIR_STYLES),                             // 发型
    hairColor: pick(HAIR_COLORS),                             // 发色
    x: WORLD_W + 30, y: ZONES.stall.y + rand(-20, 40),
    dir: 'left', moving: true, walkPhase: 0, phase: rand(0, 6), t: 0,
    want, state: 'come', waitT: 25, happy: false,
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
  note('logCustomerWant', { name: custName(c), item: nm('item', want) });
  sfx.bell();
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

  // 水坑不能踩水：走到水边会被轻轻推回岸上（三个水坑都要判定）
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

    // 生产：只有母鸡会下蛋（小鸡只管到处跑、啄米）
    if (a.type === 'chicken') {
      if (!chick && !starving) {
        a.eggT -= dt;
        if (a.eggT <= 0) {
          a.eggT = rand(35, 60);
          G.groundItems.push({ id: 'egg', x: a.x + rand(-15, 15), y: a.y + rand(5, 15), phase: rand(0, 6) });
          spawnParticles(a.x, a.y - 15, '🎵', 1);
          sfx.cluck();
          note('logEgg');
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
      pl.timer += dt * speed;
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
        sfx.sad();
        say('customerGone', { name: custName(c) });
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

function startSleep() {
  G.sleepFade = 0.01;
  G.sleepDawn = false;
  sfx.night();
  say('night');
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

  // 森林地面（在草地格子和天空之后、所有实体之前）
  drawForestGround(ctx, t);

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
  for (const pond of PONDS) drawPond(ctx, pond.x, pond.y, pond.w, pond.h, t, pondLabel(pond));

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
  // 庭院装饰
  for (const dc of G.decorations) {
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
  // 大型水族箱
  drawables.push({ y: ZONES.tank.y + 6, draw: () => drawAquarium(ctx, ZONES.tank.x, ZONES.tank.y, t, G.tank) });
  // 动物园的观赏动物（动画 emoji 图）
  for (const z of G.zoo) {
    const zd = ZOO_MAP[z.type] || ZOO_SHOP[0];
    const rec = loadEmoji(zd.cp);
    drawables.push({
      y: z.y + 4,
      draw: () => drawZoo(ctx, z.x, z.y, {
        type: z.type, fly: !!ZOO_FLY[z.type],
        size: zd.size, rec, moving: z.moving, walkPhase: z.walkPhase,
        phase: z.phase, emoji: zd.icon, dir: z.dir, t,
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
  // 客人带来的宠物
  for (const c of G.customers) {
    if (c.pet) drawables.push({ y: c.pet.y + 10, draw: () => drawPet(ctx, c.pet.x, c.pet.y, { ...c.pet, t }) });
  }
  // 宠物 & 玩家
  drawables.push({ y: G.pet.y + 10, draw: () => drawPet(ctx, G.pet.x, G.pet.y, { ...G.pet, t, scale: PET_SCALE }) });
  drawables.push({
    y: p_y() + 20,
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

  // 自己摆放的庭院装饰（已放在 drawables 里一起排序）
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
  for (const it of G.groundItems) drawGroundItem(ctx, it.x, it.y, ITEMS[it.id].icon, t, it.phase);

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
  const g = G.player.gender, pt = G.pet.type;
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
  G, HIVE, ZONES, PENS, FOREST, ITEMS, TROUGHS, ZOO_MAP, ZOO_FACING, ZOO_FLY, newZoo,
  SEA_ALL, SEA_SET, PONDS, emojiDrawable, RECIPES, OBTAINABLE, MUSHROOMS, MUSHROOM_REGROW,
  FARM_GOODS, nextDay, dailyFeedUpdate, TROUGH_OF, MUSHROOMS, OBTAINABLE, RECIPES,
  VEHICLES, VEHICLE_MAP, WALK_SPEED, useRack, mountVehicle, dismountVehicle,
  openMathChallenge, answerMath, renderMathChallenge, coinChoices, makeChoices, spawnCustomer,
  MATH_TIME, resolveCustomerSale,
  renderCook,
  startFarm, startNewGame, saveGame, loadGame, manualSave, resetGame,
  listProfiles, deleteProfile, update, render, nearestInteract, doInteract,
  addItem, putEggInHatchery, dailyChickenUpdate, isChick, isHen,
  renderInventory, renderHUD, renderProfiles, applyLang, setLang,
  emojiCache, emojiAnimUrl, emojiPngUrl, emojiWebpUrl, emojiSrcFor, emojiDrawable,
  emojiAnims, emojiFrameIndex, drawEmojiFrame, decodeEmojiAnim, ANIM_DEBUG,
  notoAnimState, notoAnimSet, notoHasAnim,
  canvasHasPixels, animSlot, ANIM_PARALLEL, notoHasAnim, notoAnimSet, notoNorm,
};

requestAnimationFrame(loop);
