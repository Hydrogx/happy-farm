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
  egg: { name: '鸡蛋', icon: '🥚', price: 10, cp: '1f95a' },
  milk: { name: '牛奶', icon: '🥛', price: 18, cp: '1f95b' },
  wool: { name: '羊毛', icon: '🧶', price: 25, cp: '1f9f6' },
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
  seed_carrot:{ name: '胡萝卜种子', icon: '🌱', price: 5,  seed: 'carrot' },
  seed_tomato:{ name: '番茄种子',  icon: '🫘', price: 8,  seed: 'tomato' },
  seed_corn: { name: '玉米种子', icon: '🌾', price: 12, cp: '1f331', seed: 'corn' },
};
const RECIPES = [
  { id: 'fried_egg',  needs: { egg: 1 } },
  { id: 'salad',      needs: { fruit: 2 } },               // 任意 2 个水果
  { id: 'fish_grill', needs: { fish: 1 } },
  { id: 'pudding',    needs: { egg: 1, milk: 1 } },
  { id: 'fruit_cake', needs: { strawberry: 2, egg: 1, milk: 1 } },
];
const FRUIT_IDS = ['apple', 'orange', 'pear', 'peach', 'strawberry'];
// ---------------- 钓鱼：5 种大小的水波纹，每种 3 种渔获 ----------------
const RIPPLE_SIZES = [
  { lv: 1, name: '小水波',   nameEn: 'Small Ripple',  r: 11, color: '#cdeeff', w: 34 },
  { lv: 2, name: '中水波',   nameEn: 'Medium Ripple', r: 18, color: '#9adcff', w: 26 },
  { lv: 3, name: '大水波',   nameEn: 'Big Ripple',    r: 26, color: '#63c6f7', w: 20 },
  { lv: 4, name: '巨水波',   nameEn: 'Huge Ripple',   r: 36, color: '#2f9fdc', w: 13 },
  { lv: 5, name: '传说水波', nameEn: 'Legend Ripple', r: 48, color: '#9a7cf0', w: 7 },
];
const SEA_POOL = {
  1: ['fish', 'shrimp', 'shell'],
  2: ['goldfish', 'crab', 'squid'],
  3: ['puffer', 'octopus', 'lobster'],
  4: ['seaturtle', 'croc', 'seal'],
  5: ['dolphin', 'shark', 'whale'],
};
const SEA_ALL = Object.keys(SEA_POOL).reduce(function (a, k) { return a.concat(SEA_POOL[k]); }, []);

const SELLABLE = ['egg','milk','wool','carrot','tomato','corn',...FRUIT_IDS,...SEA_ALL,'fried_egg','salad','fish_grill','pudding','fruit_cake'];
const PET_HATS = {
  bow:    { name: '宠物蝴蝶结', icon: '🎀', price: 30 },
  straw:  { name: '宠物草帽',   icon: '👒', price: 30 },
  cap:    { name: '宠物棒球帽', icon: '🧢', price: 50 },
  flower: { name: '宠物花环',   icon: '🌸', price: 60 },
  crown:  { name: '宠物皇冠',   icon: '👑', price: 90 },
};
// 可购买的动物
const ANIMAL_SHOP = [
  { type: 'chicken', name: '小鸡',   icon: '🐔', price: 150, desc: '会下蛋' },
  { type: 'sheep',   name: '小绵羊', icon: '🐑', price: 320, desc: '能剪羊毛' },
  { type: 'cow',     name: '小奶牛', icon: '🐄', price: 650, desc: '能挤牛奶' },
];
const MAX_ANIMALS = 24;
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
const CUSTOMER_COLORS = ['#7ac74f', '#ff9f43', '#5fa8e8', '#c88ae8', '#ff8f8f'];
const CUSTOMER_HAIRS = ['#3a2a1a', '#6b4226', '#d9a62e', '#8a8a8a', '#2a2a3a'];

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
    prPetChicken: '🐔 摸摸小鸡', prPetSheep: '🐑 摸摸小羊（羊毛还没长好）', prPetCow: '🐄 摸摸奶牛（等会儿才有奶）',
    prTill: '⛏️ 耕地', prPlant: '🌱 播种 {seed}', prNoSeed: '🌱 需要种子（去商店买）',
    prWater: '💧 浇水', prHarvest: '🧺 收获 {crop}', prTree: '摇一摇{fruit}树',
    prCook: '🍳 做饭', prWardrobe: '👕 换衣服', prSell: '📦 卖东西', prShop: '🛒 打开商店',
    prFish: '🎣 钓鱼', prCustomer: '把 {item} 卖给客人',
    prPlace: '放置「{decor}」：[{key}] 放下{extra}',
    prFishing: '🎣 等待中…（按 {key} 提前收杆）', prBite: '❗ 快按 {key} 收杆！',
    // —— 日志 / 提示 ——
    welcome: '欢迎来到快乐小牧场！去找点事情做吧 🌱',
    welcomeBack: '欢迎回来！第 {day} 天继续加油 🌻',
    loadFailed: '存档读不出来，重新开始吧',
    saveOk: '💾 游戏已保存',
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
    customerCome: '🔔 有客人来买东西啦！',
    customerGone: '客人等太久走掉了…',
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
    logCustomerWant: '🔔 有客人想买 {item}',
    logMusicOn: '🎵 背景音乐已打开', logMusicOff: '🔕 背景音乐已关闭',
    logSoundOn: '🔊 音效已打开', logSoundOff: '🔇 音效已关闭',
    logLang: '🌏 语言切换为中文',
    logDecor: '摆放了{decor}',
    cancelHint: '（按 Q 取消）',
    ripple1: '小水波', ripple2: '中水波', ripple3: '大水波', ripple4: '巨水波', ripple5: '传说水波',
    caught: '🎣 钓到了{fish}！（{size}）',
    logRipple: '水面出现{size}…',
    zooHead: '农场里有 {n} 只观赏动物（最多 {max} 只）',
    zooNote: '观赏动物·不产出',
    tooManyZoo: '观赏动物太多啦，先让它们散散步吧！',
    boughtZoo: '{animal}来到农场啦！它会四处散步 🎉',
    genderSwitched: '变成{who}啦！',
    petSwitched: '宠物换成小{pet}啦！',
    charSection: '👦 角色与宠物',
    tabZoo: '🦁 观赏动物',
    bookTitle: '📖 动物图鉴', bookZoo: '🦁 动物园', bookSea: '🐟 海洋馆',
    bookOwned: '已拥有 {n} 只', bookNone: '还没收集到',
    bookHint: '买到的观赏动物和钓到的海洋生物都会记录在这里',
    caughtTimes: '钓到过 {n} 次',
    petDuck: '小鸭',
    logSoldCustomer: '把 {item} 卖给了客人，+{n} 金币',
    rotateHint: '🔄 横过来玩，画面更大更清楚',
    logTitle2: '最近发生的事',
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
    prPetChicken: '🐔 Pet the chick', prPetSheep: '🐑 Pet the lamb (no wool yet)', prPetCow: '🐄 Pet the cow (no milk yet)',
    prTill: '⛏️ Till the soil', prPlant: '🌱 Plant {seed}', prNoSeed: '🌱 Need seeds (buy at the shop)',
    prWater: '💧 Water it', prHarvest: '🧺 Harvest {crop}', prTree: 'Shake the {fruit} tree',
    prCook: '🍳 Cook', prWardrobe: '👕 Change clothes', prSell: '📦 Sell things', prShop: '🛒 Open the shop',
    prFish: '🎣 Go fishing', prCustomer: 'Sell {item} to the customer',
    prPlace: 'Place "{decor}": [{key}] put down{extra}',
    prFishing: '🎣 Waiting… (press {key} to reel in)', prBite: '❗ Press {key} now!',
    welcome: 'Welcome to Happy Little Farm! Go find something to do 🌱',
    welcomeBack: 'Welcome back! Day {day} — let\'s go 🌻',
    loadFailed: 'Could not read the save — starting fresh',
    saveOk: '💾 Game saved',
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
    customerCome: '🔔 A customer is coming!',
    customerGone: 'The customer waited too long and left…',
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
    logCustomerWant: '🔔 A customer wants to buy {item}',
    logMusicOn: '🎵 Music on', logMusicOff: '🔕 Music off',
    logSoundOn: '🔊 Sound on', logSoundOff: '🔇 Sound off',
    logLang: '🌏 Language switched to English',
    logDecor: 'Placed {decor}',
    cancelHint: ' (press Q to cancel)',
    ripple1: 'Small ripple', ripple2: 'Medium ripple', ripple3: 'Big ripple', ripple4: 'Huge ripple', ripple5: 'Legendary ripple',
    caught: '🎣 You caught {fish}! ({size})',
    logRipple: 'A {size} appears on the water…',
    zooHead: 'You have {n} zoo animals (max {max})',
    zooNote: 'Ornamental · no produce',
    tooManyZoo: 'Too many zoo animals — let them roam first!',
    boughtZoo: '{animal} joined the farm! It will wander around 🎉',
    genderSwitched: 'Now you are a {who}!',
    petSwitched: 'Your pet is now a {pet}!',
    charSection: '👦 Character & Pet',
    tabZoo: '🦁 Zoo Animals',
    bookTitle: '📖 Animal Book', bookZoo: '🦁 Zoo', bookSea: '🐟 Aquarium',
    bookOwned: '{n} owned', bookNone: 'Not collected yet',
    bookHint: 'Zoo animals you buy and sea creatures you catch are recorded here',
    caughtTimes: 'Caught {n} times',
    petDuck: 'Duck',
    logSoldCustomer: 'Sold {item} to the customer, +{n} coins',
    rotateHint: '🔄 Turn your phone sideways for a bigger view',
    logTitle2: 'Recent events',
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
  item: { egg: 'Egg', milk: 'Milk', wool: 'Wool', carrot: 'Carrot', tomato: 'Tomato', corn: 'Corn',
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
  animal: { chicken: 'Chick', sheep: 'Lamb', cow: 'Calf' },
  decor: { rock: 'Big Rock', mushroom: 'Mushroom', fence: 'Small Fence', flowerbed: 'Flower Bed',
    lamp: 'Lamp Post', bench: 'Bench', scarecrow: 'Scarecrow', blossom: 'Cherry Tree',
    christmas: 'Christmas Tree', fountain: 'Fountain', windmill: 'Windmill' },
  crop: { carrot: 'Carrot', tomato: 'Tomato', corn: 'Corn' },
};

// 取名字：cat = item/hat/shirt/pants/petHat/animal/decor/crop
function nm(cat, key) {
  if (cat === 'zoo') { const z = ZOO_MAP[key]; if (z) return lang === 'en' ? z.nameEn : z.name; return key; }
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
  if (p && typeof s === 'string') for (const k in p) s = s.split('{' + k + '}').join(p[k]);
  return s;
}
function weatherText() { const w = STR[lang].weather || STR.zh.weather; return w[G.weather] || w.sunny; }

// ---------------- 动画 emoji 资源（Noto Emoji Animation） ----------------
// 资源来源：https://googlefonts.github.io/noto-emoji-animation/
// 有动画的用 512.gif（浏览器自动播放），没有动画版的退回 512.png（再用 canvas 叠加动作）
const EMOJI_BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest/';
const emojiCache = {};     // cp -> { img, ok, kind }
function emojiAnimUrl(cp) { return EMOJI_BASE + cp + '/512.gif'; }
function emojiPngUrl(cp) { return EMOJI_BASE + cp + '/512.png'; }
function loadEmoji(cp) {
  if (!cp) return null;
  let rec = emojiCache[cp];
  if (rec) return rec;
  rec = emojiCache[cp] = { img: null, ok: false, kind: '' };
  if (typeof Image === 'undefined') return rec;
  const tryLoad = (url, kind, onFail) => {
    const im = new Image();
    im.onload = () => { rec.img = im; rec.ok = true; rec.kind = kind; };
    im.onerror = () => { if (onFail) onFail(); };
    im.src = url;
  };
  tryLoad(emojiAnimUrl(cp), 'gif', () => tryLoad(emojiPngUrl(cp), 'png'));
  return rec;
}
// DOM 里用 <img> 显示动画 emoji（列表用）
function emojiImgHTML(cp, emoji, cls) {
  cls = cls || 'emoji-img';
  if (cp) return '<img class="' + cls + '" src="' + emojiAnimUrl(cp) + '" alt="' + emoji + '" loading="lazy" draggable="false">';
  return emoji;
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
  zoo: [],                // 动物园观赏动物（只看不产出）
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
  // 动物自己的叫声（可延时，用在和玩家互动之后）
  animalVoice: (type, delay = 0) => setTimeout(() => {
    if (type === 'chicken') sfx.cluck();
    else if (type === 'sheep') sfx.baa();
    else sfx.moo();
  }, delay),
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
  // 宠物叫声（狗/猫/鸭）
  petVoice: (type, delay = 0) => {
    if (type === 'duck') { tone(420, 300, 0.1, 'square', 0.06, delay); tone(380, 260, 0.12, 'square', 0.055, delay + 0.13); }
    else if (type === 'cat') { tone(620, 900, 0.25, 'triangle', 0.06, delay); tone(900, 700, 0.3, 'sine', 0.045, delay + 0.22); }
    else { tone(300, 200, 0.1, 'square', 0.07, delay); tone(260, 180, 0.1, 'square', 0.06, delay + 0.12); }
  },
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
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  keys[k] = true;
  if (k === 'e' || k === ' ') interactQueued = true;
  if (k === 'h') toggleModal('help-modal');
  if (k === 'q' && G.placing) { G.placing = null; sfx.close(); say('decorCancel'); }
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
  G.animals = [
    newAnimal('chicken', 270, 780), newAnimal('chicken', 320, 810), newAnimal('chicken', 350, 770),
    newAnimal('sheep', 600, 870), newAnimal('sheep', 690, 900),
    newAnimal('cow', 970, 870),
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

// 创建一只动物（初始动物和商店买的动物都用它）
function newAnimal(type, x, y) {
  return {
    type, x, y, dir: Math.random() < .5 ? 'left' : 'right',
    moving: false, walkPhase: 0, phase: rand(0, 6),
    tx: x, ty: y, waitT: rand(1, 3), peck: 0,
    wool: 1, woolT: 0, milkReady: true, milkT: 0, eggT: rand(15, 40),
    home: { ...PENS[type].home },
  };
}

// ---------------- 存档 / 读档（localStorage） ----------------
const SAVE_KEY = 'happy-farm-save-v1';
const SAVE_EVERY = 10;         // 每 10 秒自动存一次

function saveGame(silent = false) {
  if (!G.started) return false;   // 还没开始玩就不存
  const data = {
    v: 1,
    coins: G.coins, day: G.day, timeMin: G.timeMin, weather: G.weather,
    inventory: G.inventory, owned: G.owned, petHatsOwned: G.petHatsOwned,
    player: {
      x: G.player.x, y: G.player.y, dir: G.player.dir,
      gender: G.player.gender, outfit: { ...G.player.outfit },
    },
    pet: { type: G.pet.type, hat: G.pet.hat },
    animals: G.animals.map(a => ({ type: a.type, x: a.x, y: a.y, wool: a.wool, milkReady: a.milkReady })),
    plots: G.plots.map(p => ({ state: p.state, crop: p.crop, timer: p.timer, watered: p.watered })),
    trees: G.trees.map(t => ({ type: t.type, fruits: t.fruits, timer: t.timer })),
    items: G.groundItems.map(i => ({ id: i.id, x: i.x, y: i.y })),
    decorations: G.decorations.map(d => ({ id: d.id, x: d.x, y: d.y })),
    zoo: G.zoo.map(z => ({ type: z.type, x: z.x, y: z.y })),
    seaCaught: G.seaCaught,
    music: musicOn, muted,
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    G.saveT = 0;
    flashSaveIcon();
    if (!silent) note('saveOk');
    return true;
  } catch (e) { return false; }
}

function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return (d && d.v === 1) ? d : null;
  } catch (e) { return null; }
}
function hasSave() { return readSave() !== null; }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

function loadGame() {
  const d = readSave();
  if (!d) return false;
  try {
    G.coins = Number.isFinite(d.coins) ? d.coins : 20;
    G.day = Number.isFinite(d.day) ? d.day : 1;
    G.timeMin = Number.isFinite(d.timeMin) ? d.timeMin : DAY_START;
    G.weather = ['sunny', 'cloudy', 'rain'].includes(d.weather) ? d.weather : 'sunny';
    G.inventory = (d.inventory && typeof d.inventory === 'object') ? d.inventory : {};
    for (const k in G.inventory) if (!ITEMS[k] || !(G.inventory[k] > 0)) delete G.inventory[k];   // 丢掉旧版本残留物品
    G.owned = d.owned || { hat: ['ragged'], shirt: ['ragged'], pants: ['ragged'] };
    G.petHatsOwned = Array.isArray(d.petHatsOwned) ? d.petHatsOwned : [];
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
      G.pet.type = ['cat', 'duck'].includes(d.pet.type) ? d.pet.type : 'dog';
      G.pet.hat = (d.pet.hat && OUTFITS.hat[d.pet.hat]) ? d.pet.hat : 'none';
      G.pet.x = G.player.x - 40; G.pet.y = G.player.y + 30;
    }
    // 动物
    if (Array.isArray(d.animals) && d.animals.length) {
      G.animals = d.animals.filter(a => a && PENS[a.type]).map(a => {
        const na = newAnimal(a.type, Number.isFinite(a.x) ? a.x : PENS[a.type].home.x,
                                      Number.isFinite(a.y) ? a.y : PENS[a.type].home.y);
        if (typeof a.wool === 'number') na.wool = a.wool;
        na.milkReady = a.milkReady !== false;
        return na;
      });
      if (!G.animals.length) G.animals = [newAnimal('chicken', 270, 780)];
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
  G.player.x = 420; G.player.y = 500; G.player.dir = 'down';
  G.player.gender = chosenGender;
  G.player.outfit = { hat: 'ragged', shirt: 'ragged', pants: 'ragged' };
  G.pet.type = chosenPet; G.pet.hat = 'none'; G.pet.happy = 0;
  G.pet.x = 380; G.pet.y = 530;
  G.groundItems = []; G.customers = []; G.particles = [];
  G.plots = []; G.trees = []; G.decor = []; G.animals = [];
  G.decorations = []; G.placing = null; G.zoo = []; G.seaCaught = {};
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
    tx: x, ty: y, waitT: rand(1, 4), voiceT: rand(6, 22),
    home: { x, y, r: 230 },
  };
}
// 随机找一个能站的位置（不落水、不出界）
function zooRandomSpot(home) {
  for (let i = 0; i < 12; i++) {
    const x = Math.max(40, Math.min(WORLD_W - 40, home.x + rand(-home.r, home.r)));
    const y = Math.max(150, Math.min(WORLD_H - 30, home.y + rand(-home.r, home.r)));
    const pc = ZONES.pond;
    const ex = (x - pc.x) / (pc.w / 2 + 40), ey = (y - pc.y) / (pc.h / 2 + 40);
    if (ex * ex + ey * ey > 1) return { x, y };
  }
  return { x: home.x, y: home.y };
}

// ---------------- 角色 / 宠物切换（游戏内） ----------------
function setGender(g) {
  G.player.gender = (g === 'girl') ? 'girl' : 'boy';
  sfx.equip(); spawnParticles(G.player.x, G.player.y - 30, '✨', 5);
  say('genderSwitched', { who: t(G.player.gender) });
  saveGame(true); renderWardrobe();
}
function setPet(type) {
  G.pet.type = ['cat', 'duck'].includes(type) ? type : 'dog';
  G.pet.happy = 3;
  sfx.petVoice(G.pet.type);
  spawnParticles(G.pet.x, G.pet.y - 20, '💖', 5);
  say('petSwitched', { pet: t(G.pet.type === 'duck' ? 'petDuck' : G.pet.type) });
  saveGame(true); renderWardrobe();
}

// ---------------- 庭院装饰：放置 ----------------
function canPlaceAt(id, x, y) {
  const d = DECOR_SHOP.find(v => v.id === id);
  if (!d) return 'tooCrowded';
  const pc = ZONES.pond;
  const ex = (x - pc.x) / (pc.w / 2 + 20), ey = (y - pc.y) / (pc.h / 2 + 20);
  if (ex * ex + ey * ey < 1) return 'inWater';
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
  saveGame();
  say('placedDecor', { decor: nm('decor', id) }, 2200);
}

// ---------------- 界面语言切换 ----------------
function updateSaveInfo() {
  const info = $('save-info');
  if (!info) return;
  const d = readSave();
  if (!d) { info.classList.add('hidden'); return; }
  const time = new Date(d.savedAt || Date.now()).toLocaleString(
    lang === 'en' ? 'en-US' : 'zh-CN',
    { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  info.textContent = t('saveInfo', { day: d.day || 1, coins: d.coins || 0, time });
  info.classList.remove('hidden');
}
function applyLang() {
  // 静态界面文字
  const els = (document.querySelectorAll ? document.querySelectorAll('[data-i18n]') : []) || [];
  for (let i = 0; i < els.length; i++) {
    const k = els[i].getAttribute && els[i].getAttribute('data-i18n');
    if (k) els[i].textContent = t(k);
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
  renderHUD(); renderInventory(); renderLog(); updateSaveInfo();
  if (G.modalOpen === 'shop-modal') renderShop();
  else if (G.modalOpen === 'wardrobe-modal') renderWardrobe();
  else if (G.modalOpen === 'cook-modal') renderCook();
  else if (G.modalOpen === 'sell-modal') renderSell();
  else if (G.modalOpen === 'book-modal') renderBook();
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
// 只弹提示
function toast(msg, ms = 1800) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), ms);
}
// 翻译 + 弹提示 + 记日志
function say(key, params, ms = 1800, noLog = false) {
  const s = t(key, params);
  toast(s, ms);
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
}
function renderInventory() {
  const bar = $('inventory');
  bar.innerHTML = '';
  for (const [id, n] of Object.entries(G.inventory)) {
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
        G.coins -= ITEMS[id].price; addItem(id); sfx.buy(); say('bought', { item: nm('item', id) }); renderShop(); renderHUD();
      });
    }
  } else if (shopTab === 'clothes') {
    for (const cat of ['hat', 'shirt', 'pants']) {
      for (const [key, o] of Object.entries(OUTFITS[cat])) {
        if (o.price === 0) continue;
        const owned = G.owned[cat].includes(key);
        mkCard(iconBox(cat, key), o.name, o.price, () => {
          G.coins -= o.price; G.owned[cat].push(key); sfx.buy();
          say('boughtClothes', { name: nm(cat, key) }); renderShop(); renderHUD();
        }, owned);
      }
    }
  } else if (shopTab === 'animals') {
    // 动物列表：买回来会在自己的棚舍附近自由散步
    const head = document.createElement('div');
    head.style.cssText = 'grid-column:1/-1;font-size:14px;color:#8a7a52;font-weight:bold;';
    head.textContent = t('animalCount', { n: G.animals.length, max: MAX_ANIMALS });
    box.appendChild(head);
    for (const a of ANIMAL_SHOP) {
      const full = G.animals.length >= MAX_ANIMALS;
      mkCard(iconBox('emoji', a.icon), a.name, a.price, () => {
        if (G.animals.length >= MAX_ANIMALS) { sfx.error(); say('tooManyAnimals'); return; }
        G.coins -= a.price;
        const h = PENS[a.type].home;
        const na = newAnimal(a.type, h.x + rand(-30, 30), h.y + rand(-20, 20));
        na.waitT = 0.8;
        G.animals.push(na);
        sfx.buy();
        sfx.animalVoice(a.type, 260);
        spawnParticles(na.x, na.y - 20, '💖', 5);
        say('boughtAnimal', { animal: nm('animal', a.type) }, 2400);
        renderShop(); renderHUD();
      }, false, a.desc);
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
        say('boughtZoo', { animal: nm('zoo', z.type) }, 2600);
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
        say('boughtDecor', { key: KEY_HINT, extra: isTouch ? '' : t('cancelHint') }, 3200);
      }, false, t('placeFree'));
    }
  } else {
    for (const [key, o] of Object.entries(PET_HATS)) {
      const owned = G.petHatsOwned.includes(key);
      mkCard(iconBox('hat', key), o.name, o.price, () => {
        G.coins -= o.price; G.petHatsOwned.push(key);
        G.pet.hat = key; G.pet.happy = 3; sfx.buy();
        spawnParticles(G.pet.x, G.pet.y - 20, '💖', 4);
        say('wearPetHat', { pet: t(G.pet.type === 'dog' ? 'dog' : 'cat') });
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
      say('cookDone', { dish: nm('item', r.id) });
      renderCook();
    };
    d.appendChild(b);
    box.appendChild(d);
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
    for (const lv of RIPPLE_SIZES) {
      const head = document.createElement('div');
      head.style.cssText = 'grid-column:1/-1;font-size:13px;font-weight:bold;color:#3a7fbf;margin-top:4px;';
      head.textContent = t('ripple' + lv.lv);
      box.appendChild(head);
      for (const id of SEA_POOL[lv.lv]) {
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
      best = { kind: 'customer', c, label: `${ITEMS[c.want].icon} ${t('prCustomer', { item: nm('item', c.want) })}` };
    }
  }
  // 3. 动物
  for (const a of G.animals) {
    const d = dist(p.x, p.y, a.x, a.y);
    if (d < bestD) {
      if (a.type === 'sheep' && a.wool > 0.5) { bestD = d; best = { kind: 'shear', a, label: t('prShear') }; }
      else if (a.type === 'cow' && a.milkReady) { bestD = d; best = { kind: 'milk', a, label: t('prMilk') }; }
      else if (a.type === 'chicken') { bestD = d; best = { kind: 'petChicken', a, label: t('prPetChicken') }; }
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
  // 6. 设施
  const zoneChecks = [
    ['kitchen', 'cook', t('prCook')],
    ['wardrobe', 'wardrobe', t('prWardrobe')],
    ['bin', 'sell', t('prSell')],
    ['stall', 'shop', t('prShop')],
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
    best = { kind: 'fish', label: t('prFish') };
  }
  return best;
}

function doInteract() {
  if (G.modalOpen) return;
  // 放置模式：按 E 把装饰放下
  if (G.placing) { placeDecoration(); return; }
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
      note('logPickup', { item: nm('item', t.it.id) });
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
        sfx.happy();
        say('logSoldCustomer', { item: nm('item', c.want), n: gain });
      } else {
        sfx.error();
        say('noSuchItem', { item: nm('item', c.want) });
      }
      break;
    }
    case 'shear':
      t.a.wool = 0; t.a.woolT = 0;
      addItem('wool'); sfx.shear(); sfx.animalVoice('sheep', 230);
      note('logShear');
      spawnParticles(t.a.x, t.a.y - 20, '✨', 5);
      say('gotWool');
      break;
    case 'milk':
      t.a.milkReady = false; t.a.milkT = 0;
      addItem('milk'); sfx.milk(); sfx.animalVoice('cow', 270);
      note('logMilk');
      spawnParticles(t.a.x, t.a.y - 20, '🥛', 4);
      say('gotMilk');
      break;
    case 'petChicken': case 'petSheep': case 'petCow':
      spawnParticles(t.a.x, t.a.y - 20, '💖', 3);
      sfx.pet(); sfx.animalVoice(t.a.type, 130);   // 摸一摸，动物会回应你
      break;
    case 'till':
      t.pl.state = 'tilled'; sfx.till();
      note('logTill');
      spawnParticles(t.pl.x, t.pl.y, '🟫', 3);
      break;
    case 'plant': {
      const seed = Object.keys(G.inventory).find(id => ITEMS[id].seed);
      if (seed && removeItem(seed)) {
        t.pl.state = 'seed'; t.pl.crop = ITEMS[seed].seed; t.pl.stage = 0; t.pl.timer = 0;
        sfx.plant();
        note('logPlant', { seed: nm('item', seed) });
      }
      break;
    }
    case 'noseed':
      sfx.error(); say('noSeed');
      break;
    case 'water':
      t.pl.watered = true; sfx.water();
      note('logWater');
      spawnParticles(t.pl.x, t.pl.y - 6, '💧', 4);
      break;
    case 'harvest':
      addItem(t.pl.crop, 2);
      spawnParticles(t.pl.x, t.pl.y - 10, '✨', 6);
      sfx.harvest();
      say('harvested', { crop: nm('crop', t.pl.crop) });
      t.pl.state = 'tilled'; t.pl.crop = null; t.pl.watered = false;
      break;
    case 'tree': {
      t.tr.fruits--;
      const fx = t.tr.x + rand(-30, 30), fy = t.tr.y + rand(-5, 15);
      G.groundItems.push({ id: t.tr.type, x: fx, y: fy, phase: rand(0, 6) });
      spawnParticles(t.tr.x, t.tr.y - 40, '🍃', 4);
      sfx.shake();
      break;
    }
    case 'cook': renderCook(); sfx.open(); openModal('cook-modal'); break;
    case 'wardrobe': renderWardrobe(); sfx.open(); openModal('wardrobe-modal'); break;
    case 'sell': renderSell(); sfx.open(); openModal('sell-modal'); break;
    case 'shop': renderShop(); sfx.open(); openModal('shop-modal'); break;
    case 'fish': startFishing(); break;
  }
}

// ---------------- 钓鱼 ----------------
// 按权重随机水波纹大小（下雨天更容易出大波纹）
function pickRipple() {
  const rain = G.weather === 'rain';
  const w = RIPPLE_SIZES.map(r => rain && r.lv >= 3 ? r.w * 1.9 : (rain ? r.w * 0.85 : r.w));
  let x = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return RIPPLE_SIZES[i]; }
  return RIPPLE_SIZES[0];
}
function startFishing() {
  const p = G.player, pond = ZONES.pond;
  const ang = Math.atan2(pond.y - p.y, pond.x - p.x);
  const bx = p.x + Math.cos(ang) * 70, by = p.y + Math.sin(ang) * 45;
  const rip = pickRipple();
  // 波纹越大等得越久，但咬钩后给的时间窗口越短
  const wait = rip.lv <= 2 ? rand(1.5, 3.5) : rip.lv === 3 ? rand(2.5, 5) : rand(3.5, 6.5);
  G.fishing = {
    phase: 'wait', timer: wait, bx, by,
    lv: rip.lv, rip, biteWin: 1.45 - rip.lv * 0.13, ripple: 0,
  };
  p.dir = pond.x < p.x ? 'left' : 'right';   // 面朝池塘，鱼竿握在手里
  sfx.cast();
  say('castLine');
  note('logRipple', { size: t('ripple' + rip.lv) });
}
function reelIn() {
  const f = G.fishing;
  if (f.phase === 'bite') {
    const pool = SEA_POOL[f.lv] || SEA_POOL[1];
    const id = pick(pool);
    addItem(id);
    G.seaCaught[id] = (G.seaCaught[id] || 0) + 1;   // 记进图鉴
    sfx.catchf();
    spawnParticles(f.bx, f.by, '💦', 8);
    spawnParticles(f.bx, f.by - 12, ITEMS[id].icon, 1);
    say('caught', { fish: nm('item', id), size: t('ripple' + f.lv) }, 2600);
    G.pet.happy = 2;
    saveGame(true);
  } else {
    sfx.splash(); say('reelIn');
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
  say('customerCome');
  note('logCustomerWant', { item: nm('item', want) });
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
      const len = Math.hypot(dx, dy), spd = 170;
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
        sfx.cluck();
        note('logEgg');
      }
    } else if (a.type === 'sheep' && a.wool < 1) {
      a.woolT += dt;
      if (a.woolT > 80) { a.wool = 1; spawnParticles(a.x, a.y - 20, '✨', 4); sfx.sparkle(); note('logWoolBack'); }
    } else if (a.type === 'cow' && !a.milkReady) {
      a.milkT += dt;
      if (a.milkT > 60) { a.milkReady = true; spawnParticles(a.x, a.y - 20, '🥛', 2); sfx.sparkle(); note('logMilkBack'); }
    }
  }

  // --- 动物园动物：随机散步 + 随机叫 ---
  for (const z of G.zoo) {
    const zd = ZOO_MAP[z.type] || ZOO_SHOP[0];
    if (z.moving) {
      const d = dist(z.x, z.y, z.tx, z.ty);
      if (d < 6) { z.moving = false; z.waitT = rand(1.5, 5); }
      else {
        const ang = Math.atan2(z.ty - z.y, z.tx - z.x);
        const spd = 26 + zd.size * 0.22;          // 大动物走得快一点
        z.x += Math.cos(ang) * spd * dt;
        z.y += Math.sin(ang) * spd * dt;
        z.dir = Math.cos(ang) < 0 ? 'left' : 'right';
        z.walkPhase += dt * (5 + zd.size * 0.06);
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
        say('customerGone');
      }
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

  // --- 环境音：偶尔听到动物的叫声（更生动） ---
  if (G.started && !G.modalOpen) {
    G.ambientT -= dt;
    if (G.ambientT <= 0) {
      G.ambientT = rand(6, 16);
      sfx.animalVoice(pick(G.animals).type);
    }
  }

  // --- 自动存档 ---
  if (G.started && G.sleepFade === 0) {
    G.saveT += dt;
    if (G.saveT >= SAVE_EVERY) saveGame(true);   // 自动存档不刷日志
  }

  // --- 相机 ---
  G.cam.x = Math.max(0, Math.min(WORLD_W - VIEW_W, p.x - VIEW_W / 2));
  G.cam.y = Math.max(0, Math.min(WORLD_H - VIEW_H, p.y - VIEW_H / 2));

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
    pr.textContent = t('prFishing', { key: KEY_HINT }) + ' · ' + t('ripple' + G.fishing.lv);
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
  renderHUD();
  if (G.weather === 'rain') sfx.rain(); else sfx.morning();
  saveGame();   // 换天时存一次
  say('morning', { day: G.day }, 2500);
  if (G.weather === 'rain') addLog(t('rainHint'));
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
  // 庭院装饰
  for (const dc of G.decorations) {
    drawables.push({ y: dc.y + 4, draw: () => drawDecor(ctx, dc.id, dc.x, dc.y, t, dc.phase) });
  }
  // 动物园的观赏动物（动画 emoji 图）
  for (const z of G.zoo) {
    const zd = ZOO_MAP[z.type] || ZOO_SHOP[0];
    const rec = loadEmoji(zd.cp);
    drawables.push({
      y: z.y + 4,
      draw: () => drawZoo(ctx, z.x, z.y, {
        size: zd.size, rec, moving: z.moving, walkPhase: z.walkPhase,
        phase: z.phase, emoji: zd.icon, dir: z.dir, t,
      }),
    });
  }
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
      outfit: G.player.outfit, actionT: G.player.actionT, rod: !!G.fishing, t,
    }),
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
$('choose-duck').addEventListener('click', () => {
  ['choose-dog', 'choose-cat', 'choose-duck'].forEach(id => $(id).classList.remove('selected'));
  $('choose-duck').classList.add('selected');
  chosenPet = 'duck'; sfx.click();
});

// 开始新游戏
$('btn-start').addEventListener('click', () => {
  resetGame();
  $('start-screen').classList.add('hidden');
  G.started = true;
  sfx.success();
  startMusic();
  saveGame();
  say('welcome', null, 3000);
});
// 继续上次的存档
$('btn-continue').addEventListener('click', () => {
  if (!loadGame()) { say('loadFailed'); resetGame(); }
  $('start-screen').classList.add('hidden');
  G.started = true;
  sfx.success();
  startMusic();
  saveGame();
  say('welcomeBack', { day: G.day }, 3000);
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
}, { passive: true });

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
  set('pick-dog', pt === 'dog'); set('pick-cat', pt === 'cat'); set('pick-duck', pt === 'duck');
}
$('pick-boy').addEventListener('click', () => { setGender('boy'); highlightChar(); });
$('pick-girl').addEventListener('click', () => { setGender('girl'); highlightChar(); });
$('pick-dog').addEventListener('click', () => { setPet('dog'); highlightChar(); });
$('pick-cat').addEventListener('click', () => { setPet('cat'); highlightChar(); });
$('pick-duck').addEventListener('click', () => { setPet('duck'); highlightChar(); });

// 开始界面：有存档就显示「继续上次」
if (hasSave()) {
  const btn = $('btn-continue');
  if (btn) btn.classList.remove('hidden');
}
$('btn-lang').addEventListener('click', () => { sfx.click(); setLang(lang === 'en' ? 'zh' : 'en'); });
$('btn-lang-big').addEventListener('click', () => { sfx.click(); setLang(lang === 'en' ? 'zh' : 'en'); });
applyLang();   // 启动时按上次选择的语言显示界面
renderInventory();
renderHUD();
requestAnimationFrame(loop);
