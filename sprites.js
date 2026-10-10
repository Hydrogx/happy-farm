/* ============================================================
 * sprites.js — 全部用 Canvas 代码绘制的可爱素材（无外部图片）
 * ============================================================ */

// 圆角矩形小助手
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

// 影子
// 各个角色「脚底」在自己贴图里的本地 y：阴影要画在这里（画在原点会被身体挡住）
const PLAYER_FOOT_Y = 22;      // 人物（连鞋子）
const CHICK_FOOT_Y = 9;
const SHEEP_FOOT_Y = 14;
const COW_FOOT_Y = 17;
const PET_FOOT_Y = 9;
const DUCK_FOOT_Y = 10;
const GOOSE_FOOT_Y = 11;

function drawShadow(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ellipse(ctx, x, y, w, w * 0.35);
  ctx.fill();
}

/* ------------------------------------------------------------
 * 纸娃娃数据：帽子×11 / 头饰×12 / 裙子×12 / 上衣×10 / 裤子×11 / 鞋子×12
 * ---------------------------------------------------------- */
const OUTFITS = {
  hat: {
    none:    { name: '不戴帽子', icon: '🚫', price: 0, tier: 0 },
    ragged:  { name: '破帽子',   icon: '🧢', price: 0, tier: 0 },
    straw:   { name: '草帽',     icon: '👒', price: 30, tier: 1 },
    bow:     { name: '蝴蝶结',   icon: '🎀', price: 50, tier: 1 },
    cap:     { name: '棒球帽',   icon: '🧢', price: 60, tier: 1 },
    beanie:  { name: '毛线帽',   icon: '🎅', price: 70, tier: 1 },
    bandana: { name: '海盗头巾', icon: '🏴‍☠️', price: 80, tier: 2 },
    flower:  { name: '花环',     icon: '🌸', price: 90, tier: 2 },
    chef:    { name: '厨师帽',   icon: '👨‍🍳', price: 100, tier: 2 },
    wizard:  { name: '巫师帽',   icon: '🧙', price: 120, tier: 3 },
    frog:    { name: '青蛙帽',   icon: '🐸', price: 130, tier: 3 },
    crown:   { name: '小皇冠',   icon: '👑', price: 150, tier: 3 },
  },
  // 🎀 头饰：漂亮的发饰（12 种），和帽子可以同时戴
  hair: {
    none:        { name: '不戴头饰',     icon: '🚫', price: 0, tier: 0 },
    hairbow:     { name: '珍珠蝴蝶结',   icon: '🎀', price: 45, tier: 1 },
    flowerpin:   { name: '小花发夹',     icon: '🌸', price: 40, tier: 1 },
    heartpin:    { name: '爱心发夹',     icon: '💖', price: 50, tier: 1 },
    starpin:     { name: '星星发卡',     icon: '⭐', price: 55, tier: 1 },
    rainbowband: { name: '彩虹发带',     icon: '🌈', price: 75, tier: 2 },
    sunflower:   { name: '向日葵发卡',   icon: '🌻', price: 70, tier: 2 },
    cherrypin:   { name: '樱桃发夹',     icon: '🍒', price: 80, tier: 2 },
    bunnyears:   { name: '兔耳发箍',     icon: '🐰', price: 85, tier: 2 },
    catears:     { name: '猫耳发箍',     icon: '🐱', price: 85, tier: 2 },
    butterfly:   { name: '蝴蝶发饰',     icon: '🦋', price: 120, tier: 3 },
    unicorn:     { name: '独角兽角',     icon: '🦄', price: 150, tier: 3 },
    tiara:       { name: '公主皇冠',     icon: '👑', price: 160, tier: 3 },
  },
  shirt: {
    ragged:   { name: '破衣服',     icon: '👕', price: 0, tier: 0 },
    stripes:  { name: '黄条纹衫',   icon: '🟡', price: 40, tier: 1 },
    overalls: { name: '蓝色背带装', icon: '🩵', price: 60, tier: 1 },
    dotty:    { name: '粉波点衫',   icon: '🌸', price: 70, tier: 1 },
    dress:    { name: '粉色连衣裙', icon: '👗', price: 80, tier: 0, legacy: true },
    hoodie:   { name: '绿连帽衫',   icon: '🧥', price: 80, tier: 2 },
    sailor:   { name: '水手服',     icon: '⚓', price: 90, tier: 2 },
    vest:     { name: '小马甲',     icon: '🤎', price: 90, tier: 2 },
    star:     { name: '星星T恤',    icon: '⭐', price: 100, tier: 3 },
    pumpkin:  { name: '南瓜装',     icon: '🎃', price: 110, tier: 3 },
    rainbow:  { name: '彩虹T恤',    icon: '🌈', price: 120, tier: 3 },
  },
  // 👗 裙子（12 种）：穿上裙子就不用再穿上衣和裤子了
  dress: {
    none:            { name: '不穿裙子',     icon: '🚫', price: 0, tier: 0 },
    pinkdress:       { name: '粉粉连衣裙',   icon: '👗', price: 80,  tier: 1 },
    bluedots:        { name: '蓝点点裙',     icon: '🔵', price: 85,  tier: 1 },
    yellowdress:     { name: '柠檬黄裙',     icon: '🍋', price: 85,  tier: 1 },
    denimdress:      { name: '牛仔背带裙',   icon: '💙', price: 90,  tier: 1 },
    strawberrydress: { name: '草莓小裙',     icon: '🍓', price: 110, tier: 2 },
    sunflowerdress:  { name: '向日葵裙',     icon: '🌻', price: 110, tier: 2 },
    plaidred:        { name: '红格纹裙',     icon: '🔴', price: 115, tier: 2 },
    rainbowdress:    { name: '彩虹蛋糕裙',   icon: '🌈', price: 130, tier: 2 },
    princessdress:   { name: '公主蓬蓬裙',   icon: '👸', price: 150, tier: 3 },
    starrydress:     { name: '星空纱裙',     icon: '✨', price: 165, tier: 3 },
    butterflydress:  { name: '蝴蝶仙子裙',   icon: '🦋', price: 175, tier: 3 },
    weddingdress:    { name: '白雪婚纱裙',   icon: '💒', price: 210, tier: 3 },
  },
  pants: {
    ragged:      { name: '破裤子',   icon: '👖', price: 0, tier: 0 },
    brown:       { name: '工装裤',   icon: '🟤', price: 30, tier: 1 },
    jeans:       { name: '牛仔裤',   icon: '💙', price: 40, tier: 1 },
    shorts:      { name: '红短裤',   icon: '🩳', price: 40, tier: 1 },
    green:       { name: '绿长裤',   icon: '💚', price: 50, tier: 1 },
    orange:      { name: '橙短裤',   icon: '🧡', price: 50, tier: 2 },
    white:       { name: '白裤子',   icon: '🤍', price: 60, tier: 2 },
    pink:        { name: '粉裤子',   icon: '🩷', price: 60, tier: 2 },
    purple:      { name: '紫长裤',   icon: '💜', price: 70, tier: 2 },
    stripepants: { name: '条纹裤',   icon: '🦓', price: 80, tier: 3 },
    polka:       { name: '波点裤',   icon: '🔵', price: 90, tier: 3 },
  },
  // 👟 鞋子（12 种，含光脚）：一开始是光脚的
  shoes: {
    none:        { name: '光脚丫',     icon: '🦶', price: 0, tier: 0 },
    redshoes:    { name: '小红鞋',     icon: '👟', price: 30, tier: 1 },
    sandals:     { name: '凉鞋',       icon: '🩴', price: 35, tier: 1 },
    sneakers:    { name: '白球鞋',     icon: '👟', price: 40, tier: 1 },
    boots:       { name: '小黄靴',     icon: '🥾', price: 45, tier: 1 },
    rainboots:   { name: '蓝雨靴',     icon: '🥾', price: 55, tier: 2 },
    maryjanes:   { name: '黑皮鞋',     icon: '👞', price: 60, tier: 2 },
    flowershoes: { name: '花边小鞋',   icon: '🩰', price: 65, tier: 2 },
    sportshoes:  { name: '绿运动鞋',   icon: '👟', price: 70, tier: 2 },
    magicshoes:  { name: '魔法靴',     icon: '🥾', price: 110, tier: 3 },
    glassshoes:  { name: '水晶鞋',     icon: '👠', price: 120, tier: 3 },
    wingshoes:   { name: '小翅膀鞋',   icon: '👟', price: 130, tier: 3 },
    cloudshoes:  { name: '云朵鞋',     icon: '☁️', price: 140, tier: 3 },
  },
};

// 服饰分类（衣柜 / 商店共用的顺序）
const OUTFIT_CATS = ['hat', 'hair', 'dress', 'shirt', 'pants', 'shoes'];
const OUTFIT_CAT_LABEL = {
  hat:   ['🎩 帽子',  '🎩 Hats'],
  hair:  ['🎀 头饰',  '🎀 Hair'],
  dress: ['👗 裙子',  '👗 Dresses'],
  shirt: ['👕 上衣',  '👕 Tops'],
  pants: ['👖 裤子',  '👖 Pants'],
  shoes: ['👟 鞋子',  '👟 Shoes'],
};
// 这个分类里「还在卖」的服饰（跳过价格 0 的和旧版遗留的）
function shopClothesOf(cat, maxTier) {
  const out = [];
  for (const [key, o] of Object.entries(OUTFITS[cat])) {
    if (!o.price || o.legacy) continue;
    if (maxTier !== undefined && (o.tier || 1) > maxTier) continue;
    out.push(key);
  }
  return out;
}

const SHIRT_COLORS = {
  ragged:   { main: '#9a938a', patch: '#6e675f' },
  stripes:  { main: '#fff6d8', patch: '#ffb84d' },
  overalls: { main: '#4d8fd6', patch: '#2f6bb0' },
  dotty:    { main: '#ffc4d6', patch: '#ff6fa5' },
  hoodie:   { main: '#6fbf5a', patch: '#4a9e3f' },
  dress:    { main: '#ff9fc0', patch: '#ff6fa5' },
  sailor:   { main: '#ffffff', patch: '#3a6fd8' },
  vest:     { main: '#b58452', patch: '#8a5f36' },
  star:     { main: '#fff2f2', patch: '#ffd23e' },
  pumpkin:  { main: '#ff9a3e', patch: '#e07b1e' },
  rainbow:  { main: '#ffffff', patch: '#ffd23e' },
};
const PANTS_COLORS = {
  ragged:      { main: '#8a8378', patch: '#5f594f' },
  brown:       { main: '#a07848', patch: '#7a5630' },
  jeans:       { main: '#3f6fb5', patch: '#2c4f86' },
  shorts:      { main: '#e05252', patch: '#b03636' },
  green:       { main: '#5aa84f', patch: '#3f7a38' },
  orange:      { main: '#ff9a3e', patch: '#d97b1e' },
  white:       { main: '#f2f2ee', patch: '#c9c9c0' },
  pink:        { main: '#ffb0c8', patch: '#e08aa8' },
  purple:      { main: '#9a7ac7', patch: '#6f4fa0' },
  stripepants: { main: '#f2e8d8', patch: '#d86a6a' },
  polka:       { main: '#7ac7e8', patch: '#ffffff' },
};

// 裤子花纹（swing = 走路摆动，图标传 0）
function drawPantsPattern(ctx, key, pants, swing = 0) {
  ctx.fillStyle = pants.patch;
  if (key === 'ragged') {
    rr(ctx, -8 + swing * 0.5, 8, 4, 4, 1); ctx.fill();
  } else if (key === 'stripepants') {
    rr(ctx, -9 + swing * 0.5, 5, 8, 2.5, 1); ctx.fill();
    rr(ctx, -9 + swing * 0.5, 11, 8, 2.5, 1); ctx.fill();
    rr(ctx, 1 - swing * 0.5, 5, 8, 2.5, 1); ctx.fill();
    rr(ctx, 1 - swing * 0.5, 11, 8, 2.5, 1); ctx.fill();
  } else if (key === 'polka') {
    ellipse(ctx, -5 + swing * 0.5, 7, 1.8, 1.8); ctx.fill();
    ellipse(ctx, -5 + swing * 0.5, 13, 1.8, 1.8); ctx.fill();
    ellipse(ctx, 5 - swing * 0.5, 7, 1.8, 1.8); ctx.fill();
    ellipse(ctx, 5 - swing * 0.5, 13, 1.8, 1.8); ctx.fill();
  } else if (key === 'jeans' || key === 'brown') {
    rr(ctx, -9 + swing * 0.5, 3, 8, 2, 1); ctx.fill(); // 裤兜线
    rr(ctx, 1 - swing * 0.5, 3, 8, 2, 1); ctx.fill();
  }
}

// 上衣花纹（与 drawPlayer 共用，商店图标也用它）
function drawShirtPattern(ctx, key, shirt) {
  switch (key) {
    case 'ragged':
      ctx.fillStyle = shirt.patch;
      rr(ctx, -8, -10, 6, 6, 1); ctx.fill();
      rr(ctx, 3, -2, 5, 5, 1); ctx.fill();
      break;
    case 'star':
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#7a5a2a';
      ctx.fillText('⭐', 0, -3);
      break;
    case 'stripes':
      ctx.fillStyle = shirt.patch;
      rr(ctx, -11, -11, 22, 4, 2); ctx.fill();
      rr(ctx, -11, -3, 22, 4, 2); ctx.fill();
      break;
    case 'rainbow': {
      const cols = ['#ff6b6b', '#ffb84d', '#ffe66d', '#6fbf5a', '#5fa8e8'];
      cols.forEach((c, i) => { ctx.fillStyle = c; rr(ctx, -11, -14 + i * 4, 22, 4, 2); ctx.fill(); });
      break;
    }
    case 'sailor':
      ctx.fillStyle = shirt.patch;
      ctx.beginPath(); ctx.moveTo(-8, -16); ctx.lineTo(8, -16); ctx.lineTo(0, -6); ctx.closePath(); ctx.fill();
      rr(ctx, -11, -15, 22, 2.5, 1); ctx.fill();
      break;
    case 'dotty':
      ctx.fillStyle = shirt.patch;
      ellipse(ctx, -6, -10, 2, 2); ctx.fill();
      ellipse(ctx, 5, -8, 2, 2); ctx.fill();
      ellipse(ctx, -2, -1, 2, 2); ctx.fill();
      ellipse(ctx, 7, 1, 2, 2); ctx.fill();
      break;
    case 'hoodie':
      ctx.strokeStyle = shirt.patch; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, -15, 8, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke(); // 帽兜
      ctx.fillStyle = shirt.patch;
      rr(ctx, -6, -4, 12, 7, 3); ctx.fill(); // 口袋
      break;
    case 'pumpkin':
      ctx.strokeStyle = shirt.patch; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(i * 6, -15); ctx.quadraticCurveTo(i * 8, -5, i * 6, 4); ctx.stroke();
      }
      break;
    case 'overalls':
      ctx.strokeStyle = shirt.patch; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-7, -15); ctx.lineTo(-7, 4);
      ctx.moveTo(7, -15); ctx.lineTo(7, 4); ctx.stroke();
      break;
    case 'vest':
      ctx.fillStyle = shirt.patch;
      rr(ctx, -11, -16, 6, 20, 3); ctx.fill();
      rr(ctx, 5, -16, 6, 20, 3); ctx.fill();
      break;
  }
}

/* ------------------------------------------------------------
 * 画小农夫（男孩 / 女孩，可换装，带走路与动作动画）
 * ---------------------------------------------------------- */
/* ------------------------------------------------------------
 * 交通工具：滑板车 / 自行车 / 摩托车
 * 这些图统一按「车头朝右」画；人物往左走时整组（人 + 车）一起镜像，
 * 所以车头永远朝着前进方向，不会倒着走。
 * ---------------------------------------------------------- */
function drawVehicle(ctx, id, o) {
  o = o || {};
  const t = o.t || 0;
  const wp = o.walkPhase || 0;
  const on = !!o.moving;
  const spin = on ? wp : 0;
  drawShadow(ctx, 0, 1, 22);

  // ---- 轮子 ----
  const wheel = (wx, r, spokes) => {
    ctx.fillStyle = '#33373d';
    ellipse(ctx, wx, -r, r, r); ctx.fill();
    ctx.fillStyle = '#dfe3e8';
    ellipse(ctx, wx, -r, r * 0.34, r * 0.34); ctx.fill();
    if (spokes) {
      ctx.strokeStyle = 'rgba(150,158,168,.95)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const a = spin + i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(wx - Math.cos(a) * r * 0.85, -r - Math.sin(a) * r * 0.85);
        ctx.lineTo(wx + Math.cos(a) * r * 0.85, -r + Math.sin(a) * r * 0.85);
        ctx.stroke();
      }
    }
  };

  if (id === 'scooter') {
    // 滑板车：小轮子 + 低踏板 + 高车把（人站在踏板上、双手扶把）
    wheel(-12, 5, false);
    wheel(12, 5, false);
    ctx.fillStyle = '#8b939c';
    rr(ctx, -16, -8, 32, 3.5, 1.5); ctx.fill();       // 踏板
    ctx.fillStyle = '#6c757e';
    rr(ctx, -16, -5, 32, 2, 1); ctx.fill();
    ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(11, -4); ctx.lineTo(16, -27); ctx.stroke();
    ctx.strokeStyle = '#aab2ba'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(11, -4); ctx.lineTo(12.5, -14); ctx.stroke();
    ctx.fillStyle = '#4a5058';                          // 车把
    rr(ctx, 10, -30, 13, 4, 2); ctx.fill();
    ctx.fillStyle = '#e05a5a';
    rr(ctx, 10, -30, 5, 4, 2); ctx.fill();
    if (on) {                                          // 速度线
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.8;
      for (let i = 0; i < 2; i++) {
        const ly = -12 - i * 6;
        ctx.beginPath(); ctx.moveTo(-22 - i * 3, ly); ctx.lineTo(-30 - i * 3, ly); ctx.stroke();
      }
    }
  } else if (id === 'bicycle') {
    // 自行车：两个大轮子、车筐在车头前方、人坐在座椅上
    wheel(-11, 9.5, true);
    wheel(12, 9.5, true);
    const pa = spin * 0.9;                              // 脚踏（先画，人在上面）
    ctx.strokeStyle = '#5a6068'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1 - Math.cos(pa) * 5, -12 - Math.sin(pa) * 5);
    ctx.lineTo(1 + Math.cos(pa) * 5, -12 + Math.sin(pa) * 5);
    ctx.stroke();
    ctx.strokeStyle = '#e05a5a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -9.5); ctx.lineTo(-2, -23);         // 后上叉
    ctx.moveTo(-2, -23); ctx.lineTo(7, -19);            // 上管
    ctx.moveTo(7, -19); ctx.lineTo(12, -9.5);           // 前叉
    ctx.moveTo(7, -19); ctx.lineTo(4, -24);             // 车把立管
    ctx.moveTo(-2, -23); ctx.lineTo(1, -9.5);           // 座管
    ctx.moveTo(1, -9.5); ctx.lineTo(-11, -9.5);         // 后下叉
    ctx.moveTo(1, -9.5); ctx.lineTo(12, -9.5);          // 下管
    ctx.stroke();
    ctx.strokeStyle = '#4a5058'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(3, -25); ctx.lineTo(12, -25); ctx.stroke();   // 车把
    ctx.fillStyle = '#d9b06a';                          // 车筐（挂在车把前面）
    rr(ctx, 10, -22, 11, 8, 2.5); ctx.fill();
    ctx.strokeStyle = '#b8905e'; ctx.lineWidth = 1.2;
    rr(ctx, 10, -22, 11, 8, 2.5); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(13.5, -22); ctx.lineTo(13.5, -14);
    ctx.moveTo(18, -22); ctx.lineTo(18, -14);
    ctx.stroke();
    ctx.fillStyle = '#4a5058';                          // 座椅
    rr(ctx, -8, -26, 11, 5, 2.5); ctx.fill();
  } else {   // motorcycle
    wheel(-16, 10, false);
    wheel(16, 10, false);
    ctx.fillStyle = '#3f4a8a';                          // 车身
    ctx.beginPath();
    ctx.moveTo(-16, -13); ctx.quadraticCurveTo(-2, -27, 16, -18);
    ctx.lineTo(17, -10); ctx.lineTo(-16, -10);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2f3a72';                          // 油箱
    rr(ctx, -8, -26, 18, 8, 4); ctx.fill();
    ctx.fillStyle = '#4a5058';                          // 座位
    rr(ctx, -20, -28, 11, 6, 3); ctx.fill();
    ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(15, -18); ctx.lineTo(20, -30); ctx.stroke();
    ctx.fillStyle = '#4a5058';                          // 车把
    rr(ctx, 14, -34, 14, 4.5, 2.2); ctx.fill();
    ctx.fillStyle = '#ffe08a';                          // 车灯
    ellipse(ctx, 21, -27, 3.6, 3); ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ellipse(ctx, 21, -27, 1.7, 1.4); ctx.fill();
    ctx.fillStyle = '#b8bec4';                          // 尾气管
    rr(ctx, -26, -17, 13, 5, 2.5); ctx.fill();
    if (on) {
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const ly = -13 - i * 6;
        ctx.beginPath(); ctx.moveTo(-28 - i * 4, ly); ctx.lineTo(-38 - i * 4, ly); ctx.stroke();
      }
    }
  }
}

// 停车架：不骑的车停在这里（两根木柱 + 一根横杆 + 🅿️ 牌子）
function drawBikeRack(ctx, x, y, t) {
  drawShadow(ctx, x, y + 2, 44);
  ctx.fillStyle = '#a57c4a';
  rr(ctx, x - 34, y - 26, 7, 28, 3); ctx.fill();
  rr(ctx, x + 27, y - 26, 7, 28, 3); ctx.fill();
  ctx.fillStyle = '#c98a5a';
  rr(ctx, x - 37, y - 31, 74, 8, 3.5); ctx.fill();
  ctx.fillStyle = '#e0b878';
  rr(ctx, x - 37, y - 31, 74, 3, 1.5); ctx.fill();
  ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('🅿️', x, y - 38 + Math.sin(t * 2) * 1.2);
}

// 每辆车的比例 / 座位高度（人物缩小一点坐上去，看着才像真的在骑）
const VEH_SPEC = {
  // vs = 车辆放大倍数｜ps = 人物缩放｜px = 人物左右位置
  // footLocal = 脚底应该踩在车辆的哪个高度（车辆本地坐标，会乘上 vs）
  //   · 滑板车：踏板面 -8   · 自行车：脚踏 -12   · 摩托车：踏板/排气管 -14.7
  scooter:    { vs: 1.35, ps: 0.68, px: 2, pose: 'deck', footLocal: -8 },
  bicycle:    { vs: 1.40, ps: 0.68, px: 4, pose: 'ride', footLocal: -12 },
  motorcycle: { vs: 1.50, ps: 0.70, px: 2, pose: 'ride', footLocal: -14.7 },
};
// 画「人物 + 座驾」：mirror 由这里统一处理（人和车一起镜像，车头才不会反）
function drawRider(ctx, x, y, o) {
  const id = o.vehicleId;
  const spec = VEH_SPEC[id] || VEH_SPEC.bicycle;
  const mirror = (o.dir === 'left') ? -1 : 1;
  // ★ 车轮要落在地面上：人物站着的脚底在 player.y + PLAYER_FOOT_Y×scale，
  //   所以整组（车 + 人）也往下挪这么多，车轮的着地点才和脚底是同一条线
  const ground = PLAYER_FOOT_Y * (o.scale || 1);
  const riderScale = (o.scale || 1) * spec.ps;
  ctx.save();
  ctx.translate(x, y + ground);
  ctx.scale(mirror, 1);
  if (id === 'scooter' || o.pose === 'ride' || o.pose === 'deck') {
    // 人在车上：先画车，再把缩小的人物放上去（脚正好踩在踏板 / 座位上）
    ctx.save();
    ctx.scale(spec.vs, spec.vs);
    drawVehicle(ctx, id, o);
    ctx.restore();
    // py 由「脚底要落在车上的高度」反推：脚底 = py + PLAYER_FOOT_Y × riderScale
    const footTarget = (spec.footLocal || 0) * spec.vs;
    const py = footTarget - PLAYER_FOOT_Y * riderScale;
    drawPlayer(ctx, spec.px, py, Object.assign({}, o, {
      scale: riderScale, pose: spec.pose, noShadow: true,   // 阴影由车轮下面那圈负责
    }));
  } else {
    // 站在车旁边：车停在身后，人站在地上
    ctx.save();
    ctx.scale(spec.vs, spec.vs);
    drawVehicle(ctx, id, Object.assign({}, o, { moving: false }));
    ctx.restore();
    drawPlayer(ctx, 14, -ground, Object.assign({}, o, { pose: 'veh' }));
  }
  ctx.restore();
}

function drawPlayer(ctx, x, y, o) {
  // o: {gender, dir, walkPhase, moving, outfit, actionT, t, scale, pose}
  // pose: 不填 = 走路；'ride' = 骑在车上（腿弯着）；'deck' = 站在滑板车上；'veh' = 站在车旁边
  const pose = o.pose || 'walk';
  const riding = pose === 'ride';
  const deck = pose === 'deck';
  const veh = pose === 'veh';
  const bob = veh ? 0
    : o.moving ? Math.abs(Math.sin(o.walkPhase)) * (riding ? 1.2 : deck ? 1.6 : 3)
    : Math.sin(o.t * 2) * 1.2;
  const swing = o.moving ? Math.sin(o.walkPhase) * 6 : 0;
  const yy = y - bob;
  const dirX = o.dir === 'left' ? -1 : 1;
  const skin = '#ffdbac';
  const shirt = SHIRT_COLORS[o.outfit.shirt] || SHIRT_COLORS.ragged;
  const pants = PANTS_COLORS[o.outfit.pants] || PANTS_COLORS.ragged;
  // 裙子（穿上裙子就不画上衣和裤子，只留裙摆 + 鞋子）
  const dressKey = (o.outfit.dress && o.outfit.dress !== 'none') ? o.outfit.dress : null;
  const dressCol = dressKey ? (DRESS_COLORS[dressKey] || DRESS_COLORS.pinkdress) : null;
  const bodyColor = dressCol ? dressCol.main : shirt.main;
  const shoeKey = o.outfit.shoes || 'none';
  const hairAcc = o.outfit.hair || 'none';

  ctx.save();
  ctx.translate(x, yy);
  if (o.dir === 'left' || o.dir === 'right') ctx.scale(dirX, 1);
  const sc = o.scale || 1;
  if (sc !== 1) ctx.scale(sc, sc);

  // ★ 阴影画在**脚底**：本地 y = 呼吸偏移/sc + 脚底，换算到世界坐标正好落在脚上
  if (!o.noShadow) drawShadow(ctx, 0, bob / sc + PLAYER_FOOT_Y, 15);

  // --- 腿（裤子层；穿裙子时是光腿） ---
  ctx.fillStyle = dressKey ? skin : pants.main;
  if (riding) {
    // 骑在车上：前腿弯着踩踏板，后腿收在座位下方
    ctx.save();
    ctx.translate(-2, 0); ctx.rotate(-0.55);
    rr(ctx, -4, 2, 8, 16, 3); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(4, 0); ctx.rotate(0.45);
    rr(ctx, -3, 2, 8, 15, 3); ctx.fill();
    ctx.restore();
    if (!dressKey) drawPantsPattern(ctx, o.outfit.pants, pants, 0);
    drawShoes(ctx, shoeKey, 0, 'ride', dirX);
  } else if (deck) {
    // 站在滑板车上：双腿微弯、前后站稳
    ctx.save();
    ctx.translate(-3, 0); ctx.rotate(-0.10);
    rr(ctx, -4, 2, 8, 15, 3); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(4, 0); ctx.rotate(0.12);
    rr(ctx, -3, 2, 8, 15, 3); ctx.fill();
    ctx.restore();
    if (!dressKey) drawPantsPattern(ctx, o.outfit.pants, pants, 0);
    drawShoes(ctx, shoeKey, 0, 'deck', dirX);
  } else {
    rr(ctx, -9 + swing * 0.5, 2, 8, 15, 3); ctx.fill();
    rr(ctx, 1 - swing * 0.5, 2, 8, 15, 3); ctx.fill();
    // 裤子花纹
    if (!dressKey) drawPantsPattern(ctx, o.outfit.pants, pants, swing);
    // 鞋子（光脚就不画）
    drawShoes(ctx, shoeKey, swing, 'walk', dirX);
  }

  // --- 身体：裙子 或 上衣 ---
  if (dressKey) {
    drawDress(ctx, dressKey, o.t);
  } else {
    ctx.fillStyle = shirt.main;
    if (o.outfit.shirt === 'dress') {
      ctx.beginPath();
      ctx.moveTo(-11, -16); ctx.lineTo(11, -16);
      ctx.lineTo(15, 6); ctx.lineTo(-15, 6); ctx.closePath(); ctx.fill();
    } else {
      rr(ctx, -11, -16, 22, 21, 6); ctx.fill();
    }
    // 上衣花纹
    drawShirtPattern(ctx, o.outfit.shirt, shirt);
  }

  // --- 手臂（动作时举起来；骑车时向前扶着车把） ---
  const armRaise = o.actionT > 0 ? Math.sin(o.actionT * 10) * 10 + 12 : 0;
  ctx.strokeStyle = bodyColor; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  if (riding || deck) {
    // 两只手都伸向前方（+x 方向），像抓着车把
    ctx.moveTo(8, -13); ctx.lineTo(18, -14);
    ctx.moveTo(6, -14); ctx.lineTo(16, -16);
  } else {
    ctx.moveTo(-11, -11); ctx.lineTo(-16, -2 + swing * 0.4 - armRaise);
    ctx.moveTo(11, -11); ctx.lineTo(16, -2 - swing * 0.4 - armRaise);
  }
  ctx.stroke();
  ctx.fillStyle = skin;
  if (riding || deck) {
    ellipse(ctx, 19, -14.5, 3.2, 3.2); ctx.fill();
    ellipse(ctx, 17, -16.5, 3.2, 3.2); ctx.fill();
  } else {
    ellipse(ctx, -16, -2 + swing * 0.4 - armRaise, 3.2, 3.2); ctx.fill();
    ellipse(ctx, 16, -2 - swing * 0.4 - armRaise, 3.2, 3.2); ctx.fill();
  }

  // --- 手里的鱼竿（钓鱼时从手的位置伸出去） ---
  if (o.rod) {
    const rhx = 16, rhy = -2 - swing * 0.4 - armRaise;
    ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(rhx - 3, rhy + 3); ctx.lineTo(rhx + 11, rhy - 25); ctx.stroke();
    ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(rhx + 11, rhy - 25); ctx.lineTo(rhx + 12.5, rhy - 27); ctx.stroke();
  }

  // --- 头 ---
  ctx.fillStyle = skin;
  ellipse(ctx, 0, -27, 11, 10.5); ctx.fill();

  // --- 头发（7 种发型，整体上移，给眼睛留出空隙） ---
  drawHair(ctx, o.hairStyle || (o.gender === 'boy' ? 'short' : 'pigtail'),
           o.hairColor || (o.gender === 'boy' ? '#5a3a1e' : '#6b4226'));

  // --- 脸（眨眼动画） ---
  const blink = (o.t % 3.2) < 0.12;
  ctx.fillStyle = '#333';
  if (blink) {
    ctx.fillRect(-5.5, -28, 3.4, 1.2);
    ctx.fillRect(2.5, -28, 3.4, 1.2);
  } else {
    ellipse(ctx, -4, -28, 1.7, 2.2); ctx.fill();
    ellipse(ctx, 4, -28, 1.7, 2.2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,120,120,.5)';
  ellipse(ctx, -7.5, -24.5, 2, 1.4); ctx.fill();
  ellipse(ctx, 7.5, -24.5, 2, 1.4); ctx.fill();
  ctx.strokeStyle = '#b5673a'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, -24, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

  // --- 头饰 / 帽子层（整体上移一点，避免压住眼睛） ---
  // 发箍、耳朵、独角兽角这些「大件」先画（帽子会压在上面），
  // 小发夹、蝴蝶结这些「小件」后画（保证戴上帽子也看得见）。
  const HAIR_OVER_HAT = { hairbow: 1, flowerpin: 1, heartpin: 1, starpin: 1, cherrypin: 1, butterfly: 1 };
  if (hairAcc !== 'none' && !HAIR_OVER_HAT[hairAcc]) {
    ctx.save();
    ctx.translate(0, -3.5);
    drawHairAcc(ctx, hairAcc, o.t);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(0, -3.5);
  drawHat(ctx, o.outfit.hat, o.t);
  ctx.restore();
  if (hairAcc !== 'none' && HAIR_OVER_HAT[hairAcc]) {
    ctx.save();
    ctx.translate(0, -3.5);
    drawHairAcc(ctx, hairAcc, o.t);
    ctx.restore();
  }

  ctx.restore();
}

// 发型（头心 0,-27；刘海下沿不低于 -32.5，避免压住眼睛）
function drawHair(ctx, style, color) {
  ctx.fillStyle = color;
  const dome = (ry, rx) => {
    ctx.beginPath();
    ctx.ellipse(0, -34.5, rx || 11, ry || 6.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  };
  switch (style) {
    case 'long':
      dome(7, 11.5);
      ellipse(ctx, -11, -22, 4.5, 10); ctx.fill();
      ellipse(ctx, 11, -22, 4.5, 10); ctx.fill();
      rr(ctx, -11, -35.5, 22, 3, 2); ctx.fill();
      break;
    case 'pigtail':
      dome(7, 11.5);
      ellipse(ctx, -12, -24, 4, 7); ctx.fill();
      ellipse(ctx, 12, -24, 4, 7); ctx.fill();
      ctx.fillStyle = '#ff6b8a';
      ellipse(ctx, -12, -30, 2.2, 2.2); ctx.fill();
      ellipse(ctx, 12, -30, 2.2, 2.2); ctx.fill();
      break;
    case 'ponytail':
      dome(6.8, 11.5);
      ellipse(ctx, -13, -22, 4, 9); ctx.fill();
      ctx.fillStyle = '#ff6b8a';
      ellipse(ctx, -13, -29, 2, 2); ctx.fill();
      rr(ctx, -11, -35.5, 22, 3, 2); ctx.fill();
      break;
    case 'bun':
      dome(6.5, 10.5);
      ellipse(ctx, 0, -43, 5.5, 5); ctx.fill();
      rr(ctx, -10.5, -35.5, 21, 3, 2); ctx.fill();
      break;
    case 'curly':
      [[-8, -36, 5], [0, -39, 5.5], [8, -36, 5], [-5, -34, 4.5], [5, -34, 4.5]].forEach(c => {
        ellipse(ctx, c[0], c[1], c[2], c[2]); ctx.fill();
      });
      break;
    case 'bowl':
      dome(6.5, 11.5);
      rr(ctx, -11, -36, 22, 5.5, 3); ctx.fill();
      break;
    default:  // short
      dome(6.5, 11);
      rr(ctx, -11, -35.5, 22, 3, 2); ctx.fill();
  }
}

function drawHat(ctx, hat, t) {
  const flop = Math.sin(t * 2) * 1;
  switch (hat) {
    case 'ragged': // 破帽子：灰褐色软帽 + 补丁
      ctx.fillStyle = '#8f8578';
      ctx.beginPath(); ctx.ellipse(0, -34, 13, 5.5, 0, Math.PI, Math.PI * 2); ctx.fill();
      rr(ctx, -14, -35, 28, 3.5, 2); ctx.fill();
      ctx.fillStyle = '#6e675f';
      rr(ctx, 4, -37.5, 5, 4, 1); ctx.fill();
      break;
    case 'straw':
      ctx.fillStyle = '#f4d35e';
      ctx.beginPath(); ctx.ellipse(0, -33.5, 16, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -35.5, 9, 6, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d9a62e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-9, -34.5); ctx.lineTo(9, -34.5); ctx.stroke();
      break;
    case 'bow':
      ctx.fillStyle = '#ff6fa5';
      ctx.save(); ctx.translate(-3, -37 + flop);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -4); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill();
      ellipse(ctx, 0, 0, 2.4, 2.4); ctx.fill();
      ctx.restore();
      break;
    case 'crown':
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.moveTo(-8, -34); ctx.lineTo(-8, -40); ctx.lineTo(-4, -36.5);
      ctx.lineTo(0, -42); ctx.lineTo(4, -36.5); ctx.lineTo(8, -40);
      ctx.lineTo(8, -34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff6b8a'; ellipse(ctx, 0, -37.5, 1.6, 1.6); ctx.fill();
      break;
    case 'cap': // 棒球帽
      ctx.fillStyle = '#4d8fd6';
      ctx.beginPath(); ctx.ellipse(0, -33.5, 11.5, 6.5, 0, Math.PI, Math.PI * 2); ctx.fill();
      rr(ctx, 2, -34.5, 13, 3, 1.5); ctx.fill(); // 帽檐朝前
      ctx.fillStyle = '#fff';
      ellipse(ctx, 0, -39.5, 1.8, 1.8); ctx.fill();
      break;
    case 'beanie': // 毛线帽
      ctx.fillStyle = '#e05252';
      ctx.beginPath(); ctx.ellipse(0, -34, 11.5, 7, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      rr(ctx, -11.5, -34.5, 23, 4, 2); ctx.fill();
      ellipse(ctx, 0, -42 + flop, 3, 3); ctx.fill(); // 绒球
      break;
    case 'bandana': // 海盗头巾
      ctx.fillStyle = '#d84040';
      ctx.beginPath(); ctx.ellipse(0, -32.5, 11.5, 6, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ellipse(ctx, -5, -34, 1.4, 1.4); ctx.fill();
      ellipse(ctx, 2, -36, 1.4, 1.4); ctx.fill();
      ellipse(ctx, 6, -33, 1.4, 1.4); ctx.fill();
      ctx.fillStyle = '#d84040'; // 结
      ctx.beginPath(); ctx.moveTo(-10, -33); ctx.lineTo(-16, -37 + flop); ctx.lineTo(-13, -31); ctx.closePath(); ctx.fill();
      break;
    case 'flower': // 花环
      ctx.strokeStyle = '#5aa84f'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, -33.5, 11, 4.5, 0, Math.PI, Math.PI * 2); ctx.stroke();
      const fc = ['#ff8fb0', '#ffd23e', '#fff', '#c88ae8'];
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + (i / 4) * Math.PI;
        ctx.fillStyle = fc[i % 4];
        ellipse(ctx, Math.cos(a) * 11, -33.5 + Math.sin(a) * 4.5 - 1, 2.4, 2.4); ctx.fill();
      }
      break;
    case 'chef': // 厨师帽
      ctx.fillStyle = '#fff';
      rr(ctx, -8, -44, 16, 11, 4); ctx.fill();
      ellipse(ctx, -5, -44, 4.5, 4); ctx.fill();
      ellipse(ctx, 0, -46, 5, 4.5); ctx.fill();
      ellipse(ctx, 5, -44, 4.5, 4); ctx.fill();
      rr(ctx, -8, -35, 16, 3, 1.5); ctx.fill();
      break;
    case 'wizard': // 巫师帽
      ctx.fillStyle = '#8a5fc7';
      ctx.beginPath();
      ctx.moveTo(-9, -34); ctx.quadraticCurveTo(-2, -46, 3 + flop * 2, -54);
      ctx.quadraticCurveTo(6, -46, 9, -34); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -34, 15, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd23e';
      ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⭐', 1, -40);
      break;
    case 'frog': // 青蛙帽
      ctx.fillStyle = '#6fbf5a';
      ctx.beginPath(); ctx.ellipse(0, -33.5, 11.5, 6, 0, Math.PI, Math.PI * 2); ctx.fill();
      ellipse(ctx, -6, -39, 4, 4); ctx.fill();
      ellipse(ctx, 6, -39, 4, 4); ctx.fill();
      ctx.fillStyle = '#fff';
      ellipse(ctx, -6, -39.5, 2.4, 2.4); ctx.fill();
      ellipse(ctx, 6, -39.5, 2.4, 2.4); ctx.fill();
      ctx.fillStyle = '#333';
      ellipse(ctx, -6, -39.5, 1.1, 1.1); ctx.fill();
      ellipse(ctx, 6, -39.5, 1.1, 1.1); ctx.fill();
      break;
  }
}

/* ------------------------------------------------------------
 * 🎀 头饰（发饰）：和帽子画在同一层，可以同时戴
 *   坐标系和 drawHat 一样：头心在 (0,-27)，调用前已经 translate(0,-3.5)
 * ---------------------------------------------------------- */
function drawHairAcc(ctx, key, t) {
  const bob = Math.sin(t * 2) * 0.8;
  switch (key) {
    case 'hairbow':   // 珍珠蝴蝶结：戴在头顶偏左
      ctx.save(); ctx.translate(-6, -36 + bob);
      ctx.fillStyle = '#ff6fa5';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -4.5); ctx.lineTo(-7, 4.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -4.5); ctx.lineTo(7, 4.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe9f2'; ellipse(ctx, 0, 0, 2.6, 2.6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ellipse(ctx, -4.5, -2, 1, 1); ctx.fill(); ellipse(ctx, 4.5, -2, 1, 1); ctx.fill();
      ctx.restore();
      break;
    case 'flowerpin':  // 小花发夹：三朵小花
      ctx.save(); ctx.translate(7, -34 + bob);
      [[0, 0, '#ff8fb0'], [-5, 2, '#ffd23e'], [2, 5, '#c88ae8']].forEach(function (f) {
        ctx.fillStyle = f[2];
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ellipse(ctx, f[0] + Math.cos(a) * 2.6, f[1] + Math.sin(a) * 2.6, 1.9, 1.9); ctx.fill();
        }
        ctx.fillStyle = '#fff8d0';
        ellipse(ctx, f[0], f[1], 1.4, 1.4); ctx.fill();
      });
      ctx.restore();
      break;
    case 'heartpin':
      ctx.save(); ctx.translate(-7, -35 + bob);
      ctx.fillStyle = '#ff5f8f';
      ctx.beginPath();
      ctx.moveTo(0, 4); ctx.quadraticCurveTo(-6, -1, -3, -4);
      ctx.quadraticCurveTo(0, -5.5, 0, -2);
      ctx.quadraticCurveTo(0, -5.5, 3, -4);
      ctx.quadraticCurveTo(6, -1, 0, 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ellipse(ctx, -1.6, -2.2, 1, 0.8); ctx.fill();
      ctx.restore();
      break;
    case 'starpin':
      ctx.save(); ctx.translate(7, -36 + bob);
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const r = i % 2 ? 2.6 : 6;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e0a81e'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      break;
    case 'rainbowband':  // 彩虹发带：横过额头
      ctx.save(); ctx.translate(0, -33 + bob);
      const rc = ['#ff6b6b', '#ffb84d', '#ffd23e', '#6fbf5a', '#5fb8e8', '#a07ce0'];
      rc.forEach(function (c, i) {
        ctx.strokeStyle = c; ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.ellipse(0, -i * 1.1, 11.4, 5.4, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
      });
      ctx.fillStyle = '#ffd23e';
      ellipse(ctx, 10.5, -1, 2.2, 2.2); ctx.fill();
      ctx.restore();
      break;
    case 'sunflower':
      ctx.save(); ctx.translate(-8, -34 + bob);
      ctx.fillStyle = '#ffc93e';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ellipse(ctx, Math.cos(a) * 5, Math.sin(a) * 5, 3.4, 2.2); ctx.fill();
      }
      ctx.fillStyle = '#8a5a2e'; ellipse(ctx, 0, 0, 3, 3); ctx.fill();
      ctx.restore();
      break;
    case 'cherrypin':   // 两颗小樱桃
      ctx.save(); ctx.translate(7, -33 + bob);
      ctx.strokeStyle = '#5aa84f'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(3, -3, 1, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(-3, -3, -3, 1); ctx.stroke();
      ctx.fillStyle = '#e03a4a';
      ellipse(ctx, 1, 2, 2.8, 2.8); ctx.fill();
      ellipse(ctx, -3, 3, 2.6, 2.6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ellipse(ctx, 0.2, 1, 0.8, 0.8); ctx.fill();
      ctx.restore();
      break;
    case 'bunnyears':   // 兔耳发箍
      ctx.save(); ctx.translate(0, -33 + bob);
      ctx.fillStyle = '#fff';
      [[-6, -1.1], [6, 1.1]].forEach(function (e) {
        ctx.save(); ctx.translate(e[0], -6); ctx.rotate(e[1] * 0.28);
        ellipse(ctx, 0, -5, 3.4, 9.5); ctx.fill();
        ctx.fillStyle = '#ffc4d6';
        ellipse(ctx, 0, -5, 1.7, 6.4); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.restore();
      });
      ctx.strokeStyle = '#f0c8d8'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 4.6, 0, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.restore();
      break;
    case 'catears':
      ctx.save(); ctx.translate(0, -34 + bob);
      ctx.fillStyle = '#5a4a42';
      [[-7, -1], [7, 1]].forEach(function (e) {
        ctx.save(); ctx.translate(e[0], -3); ctx.rotate(e[1] * 0.35);
        ctx.beginPath();
        ctx.moveTo(-4.5, 3); ctx.lineTo(0, -7.5); ctx.lineTo(4.5, 3);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffb0c8';
        ctx.beginPath();
        ctx.moveTo(-2.2, 2); ctx.lineTo(0, -4.2); ctx.lineTo(2.2, 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a4a42';
        ctx.restore();
      });
      ctx.strokeStyle = '#5a4a42'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 4.6, 0, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.restore();
      break;
    case 'butterfly':   // 停在头上的小蝴蝶（会扇翅膀）
      ctx.save(); ctx.translate(7, -38 + bob);
      const flap = Math.abs(Math.sin(t * 6)) * 0.6 + 0.5;
      ctx.fillStyle = '#8ac7ff';
      ctx.save(); ctx.scale(flap, 1);
      ellipse(ctx, -4, -2, 4.2, 3.2); ctx.fill();
      ellipse(ctx, -4, 2.5, 3.4, 2.6); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#c88ae8';
      ctx.save(); ctx.scale(flap, 1);
      ellipse(ctx, 4, -2, 4.2, 3.2); ctx.fill();
      ellipse(ctx, 4, 2.5, 3.4, 2.6); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#5a3a6a';
      rr(ctx, -0.9, -3.5, 1.8, 7, 0.9); ctx.fill();
      ctx.strokeStyle = '#5a3a6a'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0, -3.5); ctx.lineTo(-2, -6); ctx.moveTo(0, -3.5); ctx.lineTo(2, -6); ctx.stroke();
      ctx.restore();
      break;
    case 'unicorn':     // 独角兽角 + 小耳朵
      ctx.save(); ctx.translate(0, -33 + bob);
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.moveTo(-3, 0); ctx.lineTo(0, -13); ctx.lineTo(3, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e0a81e'; ctx.lineWidth = 0.9;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-3 + i * 0.9, -i * 3.2); ctx.lineTo(3 - i * 0.9, -i * 3.2 + 0.6);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(-10, 1); ctx.lineTo(-7, -5); ctx.lineTo(-4.5, 1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(7, -5); ctx.lineTo(4.5, 1); ctx.closePath(); ctx.fill();
      ctx.restore();
      break;
    case 'tiara':       // 小公主皇冠发饰
      ctx.save(); ctx.translate(0, -34 + bob);
      ctx.fillStyle = '#ffe27a';
      ctx.beginPath();
      ctx.moveTo(-9, 1); ctx.lineTo(-9, -4); ctx.lineTo(-5.5, -0.5);
      ctx.lineTo(-2.5, -7); ctx.lineTo(0, -3);
      ctx.lineTo(2.5, -7); ctx.lineTo(5.5, -0.5); ctx.lineTo(9, -4);
      ctx.lineTo(9, 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e0b81e'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = '#ff6b8a'; ellipse(ctx, 0, -1.5, 1.5, 1.5); ctx.fill();
      ctx.fillStyle = '#8ac7ff'; ellipse(ctx, -6, -0.6, 1.1, 1.1); ctx.fill();
      ellipse(ctx, 6, -0.6, 1.1, 1.1); ctx.fill();
      ctx.restore();
      break;
  }
}

/* ------------------------------------------------------------
 * 👗 裙子（连衣裙）：穿上裙子就不再画上衣和裤子
 *   坐标系和身体层一样：躯干 y=-16 起，腿部 y=2 起
 * ---------------------------------------------------------- */
const DRESS_COLORS = {
  pinkdress:       { main: '#ff9fc0', trim: '#fff3f8', accent: '#ff6fa5' },
  bluedots:        { main: '#9fd0f0', trim: '#ffffff', accent: '#ffffff' },
  yellowdress:     { main: '#ffe27a', trim: '#fffbe8', accent: '#ffb84d' },
  denimdress:      { main: '#5b8fd0', trim: '#e8f0fa', accent: '#3f6fb5' },
  strawberrydress: { main: '#ff8fa8', trim: '#fff3f8', accent: '#e03a4a' },
  sunflowerdress:  { main: '#ffd85e', trim: '#fffbe8', accent: '#8a5a2e' },
  plaidred:        { main: '#e05656', trim: '#fff3f3', accent: '#a83434' },
  rainbowdress:    { main: '#fff6e8', trim: '#ffffff', accent: '#ff6b8a' },
  princessdress:   { main: '#ffb8d8', trim: '#fff6fb', accent: '#ffd23e' },
  starrydress:     { main: '#6a5fc0', trim: '#e8e4ff', accent: '#ffe27a' },
  butterflydress:  { main: '#c9a8f0', trim: '#f6f0ff', accent: '#8ac7ff' },
  weddingdress:    { main: '#ffffff', trim: '#f0f4ff', accent: '#cfe0ff' },
};
function drawDressPattern(ctx, key, c) {
  const SKIRT_BOTTOM = 17;
  if (key === 'bluedots') {
    ctx.fillStyle = c.accent;
    for (let i = 0; i < 7; i++) {
      const a = -1.1 + i * 0.36;
      ellipse(ctx, Math.sin(a) * 15, 6 + (i % 3) * 4.4, 1.7, 1.7); ctx.fill();
    }
  } else if (key === 'sunflowerdress' || key === 'sunflower') {
    ctx.fillStyle = c.accent;
    ellipse(ctx, 0, 6, 3.2, 3.2); ctx.fill();
    ctx.fillStyle = '#ffd23e';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ellipse(ctx, Math.cos(a) * 6, 6 + Math.sin(a) * 6, 2.4, 1.8); ctx.fill();
    }
  } else if (key === 'strawberrydress') {
    ctx.fillStyle = c.accent;
    for (let i = 0; i < 4; i++) {
      const x = -10 + i * 7;
      ctx.beginPath();
      ctx.moveTo(x, 5); ctx.quadraticCurveTo(x + 3, 10, x + 1.5, 12);
      ctx.quadraticCurveTo(x, 10, x - 1.5, 12);
      ctx.quadraticCurveTo(x - 3, 10, x, 5);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#5aa84f';
    for (let i = 0; i < 4; i++) { rr(ctx, -10 + i * 7 - 1, 4, 4, 1.6, 0.8); ctx.fill(); }
  } else if (key === 'plaidred') {
    ctx.strokeStyle = c.accent; ctx.lineWidth = 1.4;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(i * 4.6, 2); ctx.lineTo(i * 6.4, SKIRT_BOTTOM); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, 4 + i * 4); ctx.lineTo(15, 4 + i * 4); ctx.stroke();
    }
  } else if (key === 'rainbowdress') {
    const rc = ['#ff6b6b', '#ffb84d', '#ffd23e', '#6fbf5a', '#5fb8e8', '#a07ce0'];
    rc.forEach(function (col, i) {
      ctx.fillStyle = col;
      rr(ctx, -16 + i * 0.6, 3 + i * 2.3, 32 - i * 1.2, 2.1, 1); ctx.fill();
    });
  } else if (key === 'starrydress') {
    ctx.fillStyle = c.accent;
    const pts = [[-8, 5], [-1, 9], [6, 6], [10, 12], [-11, 12], [2, 14], [-4, 3]];
    pts.forEach(function (p, i) {
      ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1, 1);
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5;
        const r = k % 2 ? 0.8 : 2.1;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.restore();
    });
  } else if (key === 'butterflydress') {
    ctx.fillStyle = c.accent;
    [[-7, 7], [7, 9], [0, 13]].forEach(function (p) {
      ellipse(ctx, p[0] - 2.5, p[1], 2.6, 2); ctx.fill();
      ellipse(ctx, p[0] + 2.5, p[1], 2.6, 2); ctx.fill();
    });
    ctx.fillStyle = '#fff';
    [[-7, 7], [7, 9], [0, 13]].forEach(function (p) {
      ellipse(ctx, p[0], p[1], 0.8, 2.4); ctx.fill();
    });
  } else if (key === 'princessdress' || key === 'weddingdress') {
    ctx.fillStyle = c.accent;
    for (let i = 0; i < 14; i++) {
      const a = -1.2 + i * 0.18;
      ellipse(ctx, Math.sin(a) * (14 + (i % 2) * 2), 8 + (i % 5) * 2, 0.9, 0.9); ctx.fill();
    }
  } else if (key === 'yellowdress') {
    ctx.fillStyle = c.accent;
    ctx.fillStyle = '#a8d84f';
    ellipse(ctx, -5, 8, 2.6, 3.4); ctx.fill();
    ellipse(ctx, 5, 10, 2.6, 3.4); ctx.fill();
  } else if (key === 'denimdress') {
    ctx.strokeStyle = c.accent; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(i * 6, 3); ctx.lineTo(i * 8, SKIRT_BOTTOM); ctx.stroke();
    }
    ctx.fillStyle = c.trim;
    rr(ctx, -3, 3, 6, 4, 1.5); ctx.fill();
  }
}
// 连衣裙：上身 + 裙摆 + 腰带
function drawDress(ctx, key, t) {
  const c = DRESS_COLORS[key] || DRESS_COLORS.pinkdress;
  const flare = (key === 'princessdress' || key === 'weddingdress') ? 1.22 : 1;
  // 裙摆
  ctx.fillStyle = c.main;
  ctx.beginPath();
  ctx.moveTo(-11, -13);
  ctx.lineTo(11, -13);
  ctx.quadraticCurveTo(15 * flare, 2, 18 * flare, 17);
  ctx.quadraticCurveTo(0, 21, -18 * flare, 17);
  ctx.quadraticCurveTo(-15 * flare, 2, -11, -13);
  ctx.closePath(); ctx.fill();
  // 裙摆下沿的蕾丝
  ctx.fillStyle = c.trim;
  ctx.beginPath();
  ctx.moveTo(-18 * flare, 17);
  ctx.quadraticCurveTo(0, 21, 18 * flare, 17);
  ctx.quadraticCurveTo(16 * flare, 15.4, 14 * flare, 16.2);
  ctx.quadraticCurveTo(0, 19.6, -14 * flare, 16.2);
  ctx.quadraticCurveTo(-16 * flare, 15.4, -18 * flare, 17);
  ctx.closePath(); ctx.fill();
  // 花纹
  drawDressPattern(ctx, key, c);
  // 小领子 + 腰带
  ctx.fillStyle = c.trim;
  ctx.beginPath();
  ctx.moveTo(-9, -15); ctx.lineTo(9, -15); ctx.lineTo(6, -9); ctx.lineTo(-6, -9);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = c.accent;
  rr(ctx, -12, -1, 24, 3, 1.5); ctx.fill();
  if (key === 'pinkdress' || key === 'princessdress' || key === 'butterflydress') {
    ctx.fillStyle = c.accent;
    ctx.save(); ctx.translate(0, 0.5);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, -3); ctx.lineTo(-5, 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(5, -3); ctx.lineTo(5, 3); ctx.closePath(); ctx.fill();
    ellipse(ctx, 0, 0, 1.6, 1.6); ctx.fill();
    ctx.restore();
  }
}

/* ------------------------------------------------------------
 * 👟 鞋子：12 种，画在两条腿的脚上
 * ---------------------------------------------------------- */
const SHOE_STYLES = {
  none:        null,
  redshoes:    { main: '#e0483f', sole: '#a8342c', shape: 'flat' },
  sandals:     { main: '#f0b8c8', sole: '#c88fa0', shape: 'sandal', accent: '#ff6fa5' },
  sneakers:    { main: '#f7f7f2', sole: '#d2d2c8', shape: 'sneak', accent: '#4d8fd6' },
  boots:       { main: '#e8b23e', sole: '#a87a1e', shape: 'boot', accent: '#8a5a2e' },
  rainboots:   { main: '#4d8fd6', sole: '#2f6bb0', shape: 'boot', accent: '#cfe8ff' },
  maryjanes:   { main: '#33333d', sole: '#1c1c24', shape: 'flat', accent: '#e8e8f0' },
  flowershoes: { main: '#ffd8e6', sole: '#e09ab0', shape: 'flat', accent: '#ff6fa5' },
  sportshoes:  { main: '#6fbf5a', sole: '#f7f7f2', shape: 'sneak', accent: '#fff' },
  magicshoes:  { main: '#8a5fc7', sole: '#5f3f96', shape: 'boot', accent: '#ffd23e' },
  glassshoes:  { main: 'rgba(205,238,255,.88)', sole: 'rgba(150,205,240,.9)', shape: 'heel', accent: '#ffffff' },
  wingshoes:   { main: '#fff6d8', sole: '#e0c98a', shape: 'sneak', accent: '#a8e0ff' },
  cloudshoes:  { main: '#ffffff', sole: '#dce8f5', shape: 'boot', accent: '#cfe8ff' },
};
// 画一只鞋：脚的位置 (cx, cy)，朝向由 dirX 决定
function drawOneShoe(ctx, key, cx, cy, dirX) {
  const s = SHOE_STYLES[key];
  if (!s) {                             // 光脚：画一只小脚丫（脚底高度和穿鞋一样，都是 cy+5 左右）
    ctx.fillStyle = '#ffdbac';
    ellipse(ctx, cx + (dirX || 1) * 1.2, cy + 2.6, 4.6, 2.9); ctx.fill();
    return;
  }
  const sh = s.shape;
  if (sh === 'boot') {
    ctx.fillStyle = s.main;
    rr(ctx, cx - 4.5, cy - 7, 9, 10, 2.5); ctx.fill();
    ctx.fillStyle = s.sole;
    rr(ctx, cx - 5.5, cy + 1, 11, 3.6, 1.6); ctx.fill();
    if (s.accent) { ctx.fillStyle = s.accent; rr(ctx, cx - 4.5, cy - 6, 9, 2, 1); ctx.fill(); }
  } else if (sh === 'sneak') {
    ctx.fillStyle = s.main;
    rr(ctx, cx - 4.5, cy - 4, 9, 7.5, 2.5); ctx.fill();
    ctx.fillStyle = s.sole;
    rr(ctx, cx - 5, cy + 2, 10.5, 3, 1.4); ctx.fill();
    if (s.accent) { ctx.fillStyle = s.accent; rr(ctx, cx - 1, cy - 3.6, 4, 1.8, 0.8); ctx.fill(); }
  } else if (sh === 'heel') {
    ctx.fillStyle = s.main;
    rr(ctx, cx - 4.2, cy - 3.5, 8.4, 6.5, 2.2); ctx.fill();
    ctx.fillStyle = s.sole;
    rr(ctx, cx - 4.6, cy + 1.4, 9.2, 2.4, 1.2); ctx.fill();
    rr(ctx, cx + 2.2, cy + 3, 2, 3.4, 0.8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ellipse(ctx, cx - 2, cy - 1.4, 1.2, 0.9); ctx.fill();
  } else if (sh === 'sandal') {
    ctx.fillStyle = s.sole;
    rr(ctx, cx - 5, cy + 0.5, 10, 3.6, 1.6); ctx.fill();
    ctx.strokeStyle = s.main; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 4, cy + 0.5); ctx.lineTo(cx + 3, cy - 3.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 0.5, cy + 0.5); ctx.lineTo(cx + 3.5, cy - 3.5); ctx.stroke();
    if (s.accent) { ctx.fillStyle = s.accent; ellipse(ctx, cx + 1.2, cy - 3.4, 1.4, 1.4); ctx.fill(); }
  } else {                              // flat
    ctx.fillStyle = s.main;
    rr(ctx, cx - 4.4, cy - 3.6, 8.8, 6.8, 2.2); ctx.fill();
    ctx.fillStyle = s.sole;
    rr(ctx, cx - 4.8, cy + 1.6, 9.6, 2.6, 1.3); ctx.fill();
    if (s.accent) { ctx.fillStyle = s.accent; rr(ctx, cx - 4.4, cy - 2.6, 8.8, 1.6, 0.8); ctx.fill(); }
  }
  // 特殊款的小装饰
  if (key === 'wingshoes') {
    ctx.fillStyle = 'rgba(168,224,255,.8)';
    ctx.beginPath(); ctx.moveTo(cx, cy + 1); ctx.quadraticCurveTo(cx - 8 * dirX, cy - 4, cx - 7 * dirX, cy + 4); ctx.closePath(); ctx.fill();
  } else if (key === 'cloudshoes') {
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ellipse(ctx, cx - 2, cy - 1, 3.6, 2.4); ctx.fill();
    ellipse(ctx, cx + 2.6, cy - 1.6, 2.8, 2.2); ctx.fill();
  } else if (key === 'glassshoes') {
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ellipse(ctx, cx + 3, cy - 2.4, 1.1, 1.1); ctx.fill();
  } else if (key === 'flowershoes') {
    ctx.fillStyle = '#ff6fa5';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ellipse(ctx, cx + Math.cos(a) * 1.7, cy - 2 + Math.sin(a) * 1.7, 1.1, 1.1); ctx.fill();
    }
  }
}
// 两只脚一起画（walk = 走路摆动；其他姿势两只脚并排）
// 脚的位置和以前硬编码的「棕鞋子」完全对齐（走路 y≈17、滑板车 16.5、骑车 14）
function drawShoes(ctx, key, swing, mode, dirX) {
  const dx = dirX || 1;
  if (mode === 'ride') {
    drawOneShoe(ctx, key, 11, 14, dx);
    drawOneShoe(ctx, key, -7.5, 13, dx);
  } else if (mode === 'deck') {
    drawOneShoe(ctx, key, -6.5, 16.5, dx);
    drawOneShoe(ctx, key, 7.5, 16.5, dx);
  } else {
    drawOneShoe(ctx, key, -5.5 + swing * 0.6, 17, dx);
    drawOneShoe(ctx, key, 5.5 - swing * 0.6, 17, dx);
  }
}

/* ------------------------------------------------------------
 * 服饰独立图标（商店 / 衣柜用，画出真实样式）
 * ---------------------------------------------------------- */
// 帽子图标：头 + 头发 + 帽子
function iconHat(ctx, key) {
  ctx.fillStyle = '#ffdbac';
  ellipse(ctx, 0, 0, 11, 10.5); ctx.fill();
  ctx.fillStyle = '#6b4226';
  ctx.beginPath(); ctx.ellipse(0, -4, 11.5, 7.5, 0, Math.PI, Math.PI * 2); ctx.fill();
  // drawHat 以头中心 (0,-27) 为基准，向下偏移 27 对齐到头中心 (0,0)
  ctx.save();
  ctx.translate(0, 27);
  drawHat(ctx, key, 0);
  ctx.restore();
}

// 上衣图标：只画上半身（露出花色）
function iconShirt(ctx, key) {
  const shirt = SHIRT_COLORS[key] || SHIRT_COLORS.ragged;
  // 手臂
  ctx.strokeStyle = shirt.main; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-11, -11); ctx.lineTo(-16, -1);
  ctx.moveTo(11, -11); ctx.lineTo(16, -1);
  ctx.stroke();
  // 手
  ctx.fillStyle = '#ffdbac';
  ellipse(ctx, -16, -1, 3.2, 3.2); ctx.fill();
  ellipse(ctx, 16, -1, 3.2, 3.2); ctx.fill();
  // 身体
  ctx.fillStyle = shirt.main;
  if (key === 'dress') {
    ctx.beginPath();
    ctx.moveTo(-11, -16); ctx.lineTo(11, -16);
    ctx.lineTo(15, 8); ctx.lineTo(-15, 8); ctx.closePath(); ctx.fill();
  } else {
    rr(ctx, -11, -16, 22, 22, 6); ctx.fill();
  }
  // 花纹
  drawShirtPattern(ctx, key, shirt);
}

// 裤子图标：只画两条腿
function iconPants(ctx, key) {
  const pants = PANTS_COLORS[key] || PANTS_COLORS.ragged;
  ctx.fillStyle = pants.main;
  rr(ctx, -9, -10, 8, 17, 3); ctx.fill();
  rr(ctx, 1, -10, 8, 17, 3); ctx.fill();
  drawPantsPattern(ctx, key, pants, 0);
  // 鞋子（统一的小棕鞋，裤子图标里只是陪衬）
  ctx.fillStyle = '#7a5230';
  rr(ctx, -10, 5, 9, 5, 2); ctx.fill();
  rr(ctx, 1, 5, 9, 5, 2); ctx.fill();
}

// 头饰图标：头 + 头发 + 头饰（和帽子图标同一套坐标）
function iconHair(ctx, key) {
  ctx.fillStyle = '#ffdbac';
  ellipse(ctx, 0, 0, 11, 10.5); ctx.fill();
  ctx.fillStyle = '#6b4226';
  ctx.beginPath(); ctx.ellipse(0, -4, 11.5, 7.5, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(0, 27);
  drawHairAcc(ctx, key, 0.6);
  ctx.restore();
}

// 裙子图标：一条连衣裙
function iconDress(ctx, key) {
  if (key === 'none') {
    ctx.strokeStyle = '#c9b8a8'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, 8);
    ctx.moveTo(8, -8); ctx.lineTo(-8, 8); ctx.stroke();
    return;
  }
  ctx.save();
  ctx.translate(0, 3);
  drawDress(ctx, key, 0.6);
  ctx.restore();
}

// 鞋子图标：一双鞋（左右各一只）
function iconShoes(ctx, key) {
  drawOneShoe(ctx, key, -7, 0, 1);
  drawOneShoe(ctx, key, 7, 0, 1);
}

// 生成服饰图标的 canvas 元素
function clothingIconCanvas(cat, key, size = 44) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  if (typeof c.getContext !== 'function') return c;
  const x = c.getContext('2d');
  if (!x) return c;
  x.save();
  if (cat === 'hat') {
    // iconHat 内部把帽子画在头中心上方，这里整体下移使「帽子+头」居中
    x.translate(size / 2, size * 0.66);
    x.scale(0.85, 0.85);
    iconHat(x, key);
  } else if (cat === 'hair') {
    x.translate(size / 2, size * 0.66);
    x.scale(0.85, 0.85);
    iconHair(x, key);
  } else if (cat === 'shirt') {
    x.translate(size / 2, size / 2 + 4);
    x.scale(0.95, 0.95);
    iconShirt(x, key);
  } else if (cat === 'dress') {
    x.translate(size / 2, size / 2 - 2);
    x.scale(0.92, 0.92);
    iconDress(x, key);
  } else if (cat === 'shoes') {
    x.translate(size / 2, size / 2);
    x.scale(1.25, 1.25);
    iconShoes(x, key);
  } else {
    x.translate(size / 2, size / 2);
    x.scale(1.3, 1.3);
    iconPants(x, key);
  }
  x.restore();
  return c;
}

/* ------------------------------------------------------------
 * 动物们（全部带呼吸/走动/小动作动画）
 * ---------------------------------------------------------- */
function drawChicken(ctx, x, y, a) {
  const hop = a.moving ? Math.abs(Math.sin(a.walkPhase)) * 4 : 0;
  const bob = Math.sin(a.t * 3 + a.phase) * 1;
  // 小鸡 / 母鸡：同一套画法，靠 scale 区分大小（小鸡小小一只还带点绒毛）
  const s = a.scale || 1;
  const isChick = s < 0.9;      // 小鸡永远比母鸡小
  ctx.save();
  ctx.translate(x, y - hop * s);
  if (a.dir === 'left') ctx.scale(-1, 1);
  if (s !== 1) ctx.scale(s, s);
  drawShadow(ctx, 0, hop + CHICK_FOOT_Y, isChick ? 7 : 9);   // 阴影压在脚上
  const step = a.moving ? Math.sin(a.walkPhase) * 3 : 0;
  ctx.strokeStyle = isChick ? '#f0b45c' : '#e8930c'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, 4); ctx.lineTo(-2 + step, 9);
  ctx.moveTo(2, 4); ctx.lineTo(2 - step, 9);
  ctx.stroke();
  // 身体：小鸡是毛茸茸的淡黄，母鸡是奶白色
  ctx.fillStyle = isChick ? '#ffe9a8' : '#fff8ee';
  ellipse(ctx, 0, -2 + bob, isChick ? 8.5 : 10, isChick ? 7.6 : 8.5); ctx.fill();
  // 小鸡的绒毛边
  if (isChick) {
    ctx.strokeStyle = '#ffd873'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const bx = Math.cos(ang) * 8.2, by = -2 + bob + Math.sin(ang) * 7.4;
      ctx.beginPath();
      ctx.moveTo(bx, by); ctx.lineTo(bx * 1.24, by * 1.24 + bob * 0.2);
      ctx.stroke();
    }
  }
  const flap = a.moving ? Math.sin(a.walkPhase * 2) * 3 : Math.sin(a.t * 2 + a.phase) * 1.5;
  ctx.fillStyle = isChick ? '#ffdd8f' : '#f2e6d2';
  ellipse(ctx, -2, -3 + bob + flap * 0.3, isChick ? 5 : 6, isChick ? 3.8 : 4.5); ctx.fill();
  const peckD = a.peck > 0 ? Math.sin(a.peck * Math.PI) * 6 : 0;
  ctx.fillStyle = isChick ? '#ffe9a8' : '#fff8ee';
  ellipse(ctx, 7, -9 + bob + peckD, isChick ? 4.6 : 5.5, isChick ? 4.3 : 5); ctx.fill();
  // 小鸡头顶的胎毛
  if (isChick) {
    ctx.strokeStyle = '#ffd873'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(6, -13 + bob); ctx.quadraticCurveTo(6.5, -16.5 + bob, 8.5, -15 + bob);
    ctx.stroke();
  }
  // 鸡冠只有长大的母鸡才有
  if (!isChick) {
    ctx.fillStyle = '#ff5a5a';
    ellipse(ctx, 5.5, -14.5 + bob + peckD, 2, 2.4); ctx.fill();
    ellipse(ctx, 8.5, -14.5 + bob + peckD, 2, 2.4); ctx.fill();
  }
  ctx.fillStyle = '#333';
  ellipse(ctx, 8.5, -10 + bob + peckD, isChick ? 1.3 : 1.1, isChick ? 1.5 : 1.3); ctx.fill();
  ctx.fillStyle = '#ffb020';
  ctx.beginPath();
  ctx.moveTo(11.5, -8.5 + bob + peckD);
  ctx.lineTo(isChick ? 14 : 15, -7.5 + bob + peckD);
  ctx.lineTo(11.5, -6.5 + bob + peckD);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawSheep(ctx, x, y, a) {
  const bob = a.moving ? Math.abs(Math.sin(a.walkPhase)) * 2.5 : Math.sin(a.t * 2 + a.phase) * 1;
  ctx.save();
  ctx.translate(x, y - bob);
  if (a.dir === 'left') ctx.scale(-1, 1);
  const sc = a.scale || 1;
  if (sc !== 1) ctx.scale(sc, sc);
  drawShadow(ctx, 0, bob / sc + SHEEP_FOOT_Y, 14);   // 阴影压在脚上
  const step = a.moving ? Math.sin(a.walkPhase) * 4 : 0;
  ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, 4); ctx.lineTo(-8 + step, 13);
  ctx.moveTo(8, 4); ctx.lineTo(8 - step, 13);
  ctx.moveTo(-3, 5); ctx.lineTo(-3 - step, 14);
  ctx.moveTo(3, 5); ctx.lineTo(3 + step, 14);
  ctx.stroke();
  if (a.wool > 0.5) {
    ctx.fillStyle = '#fdfdf6';
    const wob = Math.sin(a.t * 2.5 + a.phase) * 0.8;
    ellipse(ctx, -7, -4, 8 + wob, 7.5); ctx.fill();
    ellipse(ctx, 0, -8, 9 + wob, 8); ctx.fill();
    ellipse(ctx, 7, -4, 8 + wob, 7.5); ctx.fill();
    ellipse(ctx, 0, -1, 10 + wob, 7); ctx.fill();
  } else {
    ctx.fillStyle = '#f7c8c8';
    ellipse(ctx, 0, -3, 11, 8); ctx.fill();
  }
  ctx.fillStyle = '#4a4a4a';
  ellipse(ctx, 13, -6 + bob * 0.4, 5.5, 5); ctx.fill();
  const earW = Math.sin(a.t * 4 + a.phase) * 1.5;
  ellipse(ctx, 11, -11 + earW * 0.3, 2.6, 1.6); ctx.fill();
  ctx.fillStyle = '#fff'; ellipse(ctx, 14.5, -7, 1.8, 1.8); ctx.fill();
  ctx.fillStyle = '#333'; ellipse(ctx, 15, -7, 0.9, 0.9); ctx.fill();
  ctx.restore();
}

function drawCow(ctx, x, y, a) {
  const bob = a.moving ? Math.abs(Math.sin(a.walkPhase)) * 2 : Math.sin(a.t * 1.8 + a.phase) * 1;
  ctx.save();
  ctx.translate(x, y - bob);
  if (a.dir === 'left') ctx.scale(-1, 1);
  const sc = a.scale || 1;
  if (sc !== 1) ctx.scale(sc, sc);
  drawShadow(ctx, 0, bob / sc + COW_FOOT_Y, 19);     // 阴影压在脚上
  const step = a.moving ? Math.sin(a.walkPhase) * 4 : 0;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-13, 4); ctx.lineTo(-13 + step, 17);
  ctx.moveTo(13, 4); ctx.lineTo(13 - step, 17);
  ctx.moveTo(-5, 6); ctx.lineTo(-5 - step, 18);
  ctx.moveTo(5, 6); ctx.lineTo(5 + step, 18);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  rr(ctx, -19, -14, 36, 20, 9); ctx.fill();
  ctx.fillStyle = '#b07b4f';
  ellipse(ctx, -8, -7, 6, 5); ctx.fill();
  ellipse(ctx, 8, -9, 5, 4); ctx.fill();
  const tail = Math.sin(a.t * 3 + a.phase) * 6;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-19, -10); ctx.quadraticCurveTo(-26, 0, -23 + tail, 8); ctx.stroke();
  ctx.fillStyle = '#b07b4f'; ellipse(ctx, -23 + tail, 9, 2.5, 3); ctx.fill();
  ctx.fillStyle = '#ffb6c9'; ellipse(ctx, 3, 6, 5, 3.5); ctx.fill();
  const chew = Math.sin(a.t * 5 + a.phase) * 1;
  ctx.fillStyle = '#fff';
  ellipse(ctx, 22, -12 + chew * 0.3, 8, 7.5); ctx.fill();
  ctx.fillStyle = '#ffc4d0';
  ellipse(ctx, 27, -8 + chew * 0.5, 5, 4); ctx.fill();
  ctx.fillStyle = '#d98a9a';
  ellipse(ctx, 25.5, -8 + chew * 0.5, 0.9, 0.9); ctx.fill();
  ellipse(ctx, 28.5, -8 + chew * 0.5, 0.9, 0.9); ctx.fill();
  ctx.fillStyle = '#e8d9b0';
  ellipse(ctx, 18, -19, 2, 3); ctx.fill();
  ctx.fillStyle = '#fff';
  ellipse(ctx, 16, -13, 3, 2); ctx.fill();
  ctx.fillStyle = '#333'; ellipse(ctx, 21, -13.5, 1.4, 1.7); ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------
 * 宠物（小狗 / 小猫，跟随，可戴帽）
 * ---------------------------------------------------------- */
// 小鸭子宠物
function drawDuckPet(ctx, p) {
  const waddle = p.moving ? Math.sin(p.walkPhase) * 0.13 : Math.sin(p.t * 2 + p.phase) * 0.035;
  ctx.save();
  ctx.rotate(waddle);
  const step = p.moving ? Math.sin(p.walkPhase) * 2.5 : 0;
  // 橙色蹼足
  ctx.fillStyle = '#ffab2e';
  rr(ctx, -7 + step, 6, 9, 4, 2); ctx.fill();
  rr(ctx, 1 - step, 6, 9, 4, 2); ctx.fill();
  // 身体
  ctx.fillStyle = '#fffdf5';
  ellipse(ctx, 0, 0, 10, 7.5); ctx.fill();
  // 翅膀（拍打）
  const flap = p.moving ? Math.sin(p.walkPhase * 2) * 2.2 : Math.sin(p.t * 2 + p.phase) * 0.9;
  ctx.fillStyle = '#f0e7cf';
  ellipse(ctx, -2, -1 + flap * 0.3, 5.5, 4); ctx.fill();
  // 尾巴
  ctx.strokeStyle = '#f0e7cf'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(-13.5, -5.5); ctx.stroke();
  // 头
  ctx.fillStyle = '#fffdf5';
  ellipse(ctx, 7, -8, 6, 5.5); ctx.fill();
  // 头顶呆毛
  ctx.strokeStyle = '#f0e7cf'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(7, -13); ctx.quadraticCurveTo(9 + flap, -17.5, 11.5, -14); ctx.stroke();
  // 橙色嘴
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath(); ctx.ellipse(13.6, -7.6, 4.2, 2.7, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8852a';
  ctx.beginPath(); ctx.ellipse(14, -6.7, 3.5, 1.1, 0.15, 0, Math.PI * 2); ctx.fill();
  // 眼睛
  ctx.fillStyle = '#333';
  ellipse(ctx, 8.6, -9.6, 1.3, 1.6); ctx.fill();
  ctx.restore();
}

// 小鹅宠物（白白的、脖子长长的，走路一摇一摆还会昂头）
function drawGoosePet(ctx, p) {
  const waddle = p.moving ? Math.sin(p.walkPhase) * 0.15 : Math.sin(p.t * 2 + p.phase) * 0.04;
  const bob = Math.sin(p.t * 2.4 + p.phase) * 1;
  ctx.save();
  ctx.rotate(waddle);
  const step = p.moving ? Math.sin(p.walkPhase) * 3 : 0;
  // 橙色蹼足
  ctx.fillStyle = '#ff9f43';
  rr(ctx, -8 + step, 7, 9, 4, 2); ctx.fill();
  rr(ctx, 1 - step, 7, 9, 4, 2); ctx.fill();
  ctx.strokeStyle = '#f08020'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-8 + step, 7); ctx.lineTo(-8 + step, 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1 - step, 7); ctx.lineTo(1 - step, 3); ctx.stroke();
  // 身体（比鸭子更圆更大一点）
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -1, 0 + bob * 0.3, 11, 8); ctx.fill();
  // 翅膀
  const flap = p.moving ? Math.sin(p.walkPhase * 2) * 2.4 : Math.sin(p.t * 2 + p.phase) * 1;
  ctx.fillStyle = '#f2f2ef';
  ellipse(ctx, -3, -1 + flap * 0.3, 6, 4.4); ctx.fill();
  // 尾巴
  ctx.strokeStyle = '#f2f2ef'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-14.5, -6); ctx.stroke();
  // 长脖子
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5.4;
  ctx.beginPath();
  ctx.moveTo(6, -3 + bob * 0.3);
  ctx.quadraticCurveTo(10.5, -9, 11 + flap * 0.3, -16);
  ctx.stroke();
  // 头
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 11.5 + flap * 0.3, -18, 5.2, 4.6); ctx.fill();
  // 橙色长嘴
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(15, -19.6);
  ctx.lineTo(21.5, -18.2);
  ctx.lineTo(15, -16.6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8852a';
  ctx.beginPath();
  ctx.moveTo(15, -18);
  ctx.lineTo(21, -18.2);
  ctx.lineTo(15, -17.4);
  ctx.closePath(); ctx.fill();
  // 眼睛
  ctx.fillStyle = '#333';
  ellipse(ctx, 12.6, -19.4, 1.3, 1.6); ctx.fill();
  ctx.restore();
}

function drawPet(ctx, x, y, p) {
  const hop = p.moving ? Math.abs(Math.sin(p.walkPhase)) * 5 : Math.sin(p.t * 3 + p.phase) * 1.5;
  ctx.save();
  ctx.translate(x, y - hop);
  if (p.dir === 'left') ctx.scale(-1, 1);
  const sc = p.scale || 1;
  if (sc !== 1) ctx.scale(sc, sc);
  // ★ 阴影压在脚上（画在原点会被身体挡住，看起来就像没阴影）
  const petFoot = p.type === 'duck' ? DUCK_FOOT_Y : p.type === 'goose' ? GOOSE_FOOT_Y : PET_FOOT_Y;
  drawShadow(ctx, 0, hop / sc + petFoot, 9);
  if (p.type === 'duck') { drawDuckPet(ctx, p); ctx.restore(); return; }
  if (p.type === 'goose') { drawGoosePet(ctx, p); ctx.restore(); return; }
  const body = p.type === 'dog' ? '#e8b36a' : '#b8b8c8';
  const dark = p.type === 'dog' ? '#c78f3f' : '#8a8a9e';
  const step = p.moving ? Math.sin(p.walkPhase) * 3.5 : 0;
  ctx.strokeStyle = body; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, 2); ctx.lineTo(-5 + step, 8);
  ctx.moveTo(5, 2); ctx.lineTo(5 - step, 8);
  ctx.stroke();
  const wag = Math.sin(p.t * (p.happy > 0 ? 14 : 5) + p.phase) * (p.happy > 0 ? 8 : 4);
  ctx.strokeStyle = dark; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-8, -4); ctx.quadraticCurveTo(-13, -8, -12 + wag, -11); ctx.stroke();
  ctx.fillStyle = body;
  ellipse(ctx, 0, -2, 9, 7); ctx.fill();
  ellipse(ctx, 7, -8, 6, 5.5); ctx.fill();
  if (p.type === 'dog') {
    ctx.fillStyle = dark;
    ellipse(ctx, 4, -13, 2.4, 3.4); ctx.fill();
  } else {
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.moveTo(3, -11); ctx.lineTo(4.5, -16); ctx.lineTo(7, -12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, -12); ctx.lineTo(11, -16); ctx.lineTo(12.5, -11); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#333'; ellipse(ctx, 8.5, -9, 1.2, 1.5); ctx.fill();
  ctx.fillStyle = p.type === 'dog' ? '#5a3a2a' : '#ff8fa5';
  ellipse(ctx, 12.5, -6.5, 1.4, 1.1); ctx.fill();
  if (p.type === 'cat') {
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(10, -6); ctx.lineTo(15, -5); ctx.moveTo(10, -7.5); ctx.lineTo(15, -8.5);
    ctx.stroke();
  }
  // 宠物帽子：把 drawHat 的「头部基准点」对准宠物的头，帽子才戴得正
  if (p.hat && p.hat !== 'none') {
    ctx.save();
    ctx.translate(7, 9.3);        // 宠物头中心在 (7,-8)，drawHat 以 (0,-27) 为头心
    ctx.scale(0.7, 0.7);
    drawHat(ctx, p.hat, p.t);
    ctx.restore();
  }
  ctx.restore();
}

/* ------------------------------------------------------------
 * 客人 NPC
 * ---------------------------------------------------------- */
// 客人：复用主角的绘制（随机性别/发型/头饰/上衣/裤子）
function drawCustomer(ctx, x, y, c) {
  drawPlayer(ctx, x, y, {
    gender: c.gender, dir: c.dir, walkPhase: c.walkPhase, moving: c.moving,
    // 客人也会穿裙子 / 戴头饰 / 穿鞋子（随机搭配）
    outfit: { hat: c.hat, hair: c.hair || 'none', shirt: c.shirt,
              dress: c.dress || 'none', pants: c.pants, shoes: c.shoes || 'none' },
    hairStyle: c.hairStyle, hairColor: c.hairColor,
    actionT: 0, t: c.t,
  });
}

/* ------------------------------------------------------------
 * 场景物件
 * ---------------------------------------------------------- */
const TANK_ANIM_SPEED = 0.5;   // 水族箱里的生物动画速度（0.5 = 半速）
const ZOO_ANIM_SPEED = 1;      // 地图上观赏动物的动画速度（1 = 原速，跟商店一致）

// ------------------------------------------------------------
// 画一只「用 Noto 动画 emoji 做的生物」——水族箱里的鱼和地图上的观赏动物
// 都用这一个函数，保证两边的动画行为完全一致：
//   ① 有逐帧动画（ImageDecoder 拆好的帧）→ 逐帧画，动画时间可以单独调速；
//   ② 没有动画素材（官网没做 / 这个浏览器解不出来）→ 静态图 + 呼吸效果
//      （缩放和摇摆都套在原图上，位置和逐帧那条路完全对齐）；
//   ③ 连图都没有 → 返回 false，让调用方退回文字 emoji。
// 说明：中心点 cx/cy 就是静止图那一帧的中心，逐帧画和呼吸画都用它，
//       所以两条路切换的时候位置不会跳。
// callerScale = 调用方自己已经叠好的缩放（例如动物园的 sc），
//               在「中心点」外面做缩放，两种画法都会同等受益。
// ------------------------------------------------------------
function drawEmojiCreature(ctx, cp, cx, cy, size, tSec, rec, speed, phase, callerScale) {
  if (!rec || !rec.ok || !rec.img) return false;
  const sp = speed || 1;
  // ① 逐帧动画：时刻直接传游戏时间，倍速交给 emojiFrameIndex 按 (t - startedAt) * speed 算，
  //    这样 0.5 就是真的半速（不动 startedAt，也不会倒退或定格）。
  if (drawEmojiAnimated(ctx, cp, cx, cy, size, tSec, rec, sp)) {
    // 注意：缩放要**留在当前变换里**（调用方 drawZoo 靠它做呼吸/走路的缩放，
    // 由它自己的 ctx.restore() 收尾）。所以这里不能包 save/restore，
    // 否则缩放会被 restore 抵消掉，调用方每帧再乘一次 → 变换指数级膨胀。
    const k = callerScale || 1;
    if (k !== 1) {
      ctx.translate(cx, cy);
      ctx.scale(k, k);
      ctx.translate(-cx, -cy);
    }
    return true;
  }
  // ② 没有动画素材：静态图 + 呼吸（±6% 缩放 + 轻微左右摇摆）
  if (!needsBreath(cp)) return false;
  const bs = breathScale(tSec, phase) * (callerScale || 1);
  const sway = Math.sin(tSec * 2.2 + (phase || 0)) * 0.045;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(sway);
  ctx.drawImage(rec.img, -size * bs / 2, -size * bs / 2, size * bs, size * bs);
  ctx.restore();
  return true;
}

const FRUIT_COLORS = {
  apple: '#ff5a4e', orange: '#ffa02e', pear: '#c8e05a',
  peach: '#ff9a90', strawberry: '#ff4e6a',
  cherry: '#d6203c', watermelon: '#3fae4a', mango: '#ff9f1c',
  pineapple: '#e8b23a', lemon: '#ffe14d', melon: '#b7e07a',
  grape: '#8e5bd4', kiwi: '#8bc34a',
};

function drawTree(ctx, x, y, t, phase, fruits, type = 'apple') {
  drawShadow(ctx, x, y + 4, 22);
  const sway = Math.sin(t * 1.2 + phase) * 2;
  ctx.fillStyle = '#8a5a2e';
  rr(ctx, x - 5, y - 26, 10, 30, 4); ctx.fill();
  ctx.fillStyle = '#5db550';
  ellipse(ctx, x - 14 + sway, y - 40, 17, 14); ctx.fill();
  ellipse(ctx, x + 14 + sway, y - 40, 17, 14); ctx.fill();
  ellipse(ctx, x + sway, y - 52, 20, 16); ctx.fill();
  ctx.fillStyle = '#6fc763';
  ellipse(ctx, x - 6 + sway, y - 50, 10, 8); ctx.fill();
  const col = FRUIT_COLORS[type] || FRUIT_COLORS.apple;
  for (let i = 0; i < fruits; i++) {
    const fx = x + [-10, 8, -1][i % 3] + sway;
    const fy = y + [-38, -42, -55][i % 3] + Math.sin(t * 2 + i) * 1;
    ctx.fillStyle = col;
    if (type === 'pear') { // 梨子：上小下大
      ellipse(ctx, fx, fy + 1.5, 4, 4); ctx.fill();
      ellipse(ctx, fx, fy - 2.5, 2.4, 2.6); ctx.fill();
    } else if (type === 'peach') { // 桃子：带小叶子
      ellipse(ctx, fx, fy, 4.2, 4); ctx.fill();
      ctx.fillStyle = '#5db550';
      ellipse(ctx, fx + 2.5, fy - 4, 2, 1.2); ctx.fill();
    } else {
      ellipse(ctx, fx, fy, 4, 4.2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ellipse(ctx, fx - 1.2, fy - 1.4, 1.2, 1); ctx.fill();
  }
}

// 草莓丛（低矮灌木）
function drawStrawberryBush(ctx, x, y, t, phase, fruits) {
  drawShadow(ctx, x, y + 3, 18);
  const sway = Math.sin(t * 1.5 + phase) * 1.5;
  ctx.fillStyle = '#4f9e45';
  ellipse(ctx, x - 9 + sway, y - 8, 11, 9); ctx.fill();
  ellipse(ctx, x + 9 + sway, y - 8, 11, 9); ctx.fill();
  ellipse(ctx, x + sway, y - 14, 13, 10); ctx.fill();
  ctx.fillStyle = '#61b356';
  ellipse(ctx, x - 4 + sway, y - 14, 7, 5); ctx.fill();
  for (let i = 0; i < fruits; i++) {
    const fx = x + [-8, 7, 0][i % 3] + sway;
    const fy = y + [-6, -10, -17][i % 3] + Math.sin(t * 2.2 + i) * 1;
    ctx.fillStyle = FRUIT_COLORS.strawberry;
    ctx.beginPath(); // 小草莓：倒三角圆润形
    ctx.moveTo(fx - 3.4, fy - 1.5);
    ctx.quadraticCurveTo(fx, fy + 5, fx + 3.4, fy - 1.5);
    ctx.quadraticCurveTo(fx, fy - 4, fx - 3.4, fy - 1.5);
    ctx.fill();
    ctx.fillStyle = '#5db550';
    ellipse(ctx, fx, fy - 2.5, 2.4, 1.2); ctx.fill();
  }
}

function drawPlot(ctx, x, y, plot, t) {
  const S = 34;
  if (plot.state === 'grass') return;
  ctx.fillStyle = plot.watered ? '#6b4a2a' : '#8a6136';
  rr(ctx, x - S / 2, y - S / 2, S, S, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x - S / 2 + 3, y - S / 2 + 3, S - 6, S - 6);
  if (plot.watered) {
    ctx.fillStyle = `rgba(120,190,255,${0.15 + Math.sin(t * 3 + x) * 0.08})`;
    rr(ctx, x - S / 2 + 3, y - S / 2 + 3, S - 6, S - 6, 4); ctx.fill();
  }
  if (plot.state === 'seed' || plot.state === 'growing' || plot.state === 'ripe') {
    const g = plot.state === 'seed' ? 0.25 : plot.state === 'growing' ? 0.6 : 1;
    const sway = Math.sin(t * 2.5 + x * 0.1) * 1.5;
    ctx.strokeStyle = '#3f9e3f'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.quadraticCurveTo(x + sway, y + 4 - 12 * g, x + sway * 1.5, y + 6 - 20 * g);
    ctx.stroke();
    ctx.fillStyle = '#57b857';
    ellipse(ctx, x - 4 * g, y + 2 - 8 * g, 4 * g, 2.4 * g); ctx.fill();
    ellipse(ctx, x + 4 * g, y - 4 * g, 4 * g, 2.4 * g); ctx.fill();
    if (plot.state === 'ripe') {
      const col = plot.crop === 'carrot' ? '#ff8c2e' : plot.crop === 'tomato' ? '#ff4e4e' : '#ffd23e';
      ctx.fillStyle = col;
      ellipse(ctx, x + sway * 1.5, y + 2 - 18 * g, 6, 6); ctx.fill();
      ctx.fillStyle = `rgba(255,255,200,${0.3 + Math.sin(t * 4) * 0.2})`;
      ellipse(ctx, x + sway * 1.5 - 2, y - 18 * g, 2, 2); ctx.fill();
    }
  }
}

function drawHouse(ctx, x, y, t) {
  drawShadow(ctx, x + 60, y + 56, 70);
  ctx.fillStyle = '#ffe9c9';
  rr(ctx, x, y - 60, 120, 116, 8); ctx.fill();
  ctx.fillStyle = '#ff7b54';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 56); ctx.lineTo(x + 60, y - 104); ctx.lineTo(x + 132, y - 56);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e5643f';
  rr(ctx, x - 12, y - 60, 144, 8, 4); ctx.fill();
  ctx.fillStyle = '#c98a5a';
  rr(ctx, x + 88, y - 96, 14, 26, 3); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const sy = y - 100 - ((t * 20 + i * 22) % 60);
    const sa = 1 - ((t * 20 + i * 22) % 60) / 60;
    ctx.fillStyle = `rgba(230,230,230,${sa * 0.7})`;
    ellipse(ctx, x + 95 + Math.sin(t + i) * 6, sy, 5 + (1 - sa) * 5, 4 + (1 - sa) * 4);
    ctx.fill();
  }
  ctx.fillStyle = '#a56a35';
  rr(ctx, x + 46, y + 6, 28, 50, 6); ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ellipse(ctx, x + 68, y + 32, 2.4, 2.4); ctx.fill();
  ctx.fillStyle = `rgba(255,220,120,${0.85 + Math.sin(t * 2) * 0.1})`;
  rr(ctx, x + 12, y - 30, 26, 24, 5); ctx.fill();
  rr(ctx, x + 84, y - 30, 26, 24, 5); ctx.fill();
  ctx.strokeStyle = '#a56a35'; ctx.lineWidth = 2.5;
  ctx.strokeRect(x + 12, y - 30, 26, 24);
  ctx.strokeRect(x + 84, y - 30, 26, 24);
}

function drawStall(ctx, x, y, t, sc) {
  // 商店摊位升级后会变大（sc = 1 / 1.2 / 1.45）
  const k = sc || 1;
  if (k !== 1) {
    ctx.save();
    ctx.translate(x + 45, y + 40);
    ctx.scale(k, k);
    ctx.translate(-(x + 45), -(y + 40));
    drawStall(ctx, x, y, t, 1);
    ctx.restore();
    return;
  }
  drawShadow(ctx, x + 45, y + 40, 55);
  ctx.fillStyle = '#c98a5a';
  rr(ctx, x, y, 90, 40, 6); ctx.fill();
  ctx.fillStyle = '#a56a35';
  rr(ctx, x, y + 32, 90, 8, 4); ctx.fill();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#ff6b8a' : '#fff';
    const sx = x - 4 + i * 20;
    ctx.beginPath();
    ctx.moveTo(sx, y - 44); ctx.lineTo(sx + 20, y - 44);
    ctx.lineTo(sx + 18, y - 26 + Math.sin(t * 3 + i) * 1.5);
    ctx.lineTo(sx + 2, y - 26 + Math.sin(t * 3 + i + 1) * 1.5);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#8a5a2e';
  rr(ctx, x - 2, y - 44, 5, 84, 2); ctx.fill();
  rr(ctx, x + 87, y - 44, 5, 84, 2); ctx.fill();
  ctx.fillStyle = '#fff3d6';
  rr(ctx, x + 22, y - 70, 46, 22, 6); ctx.fill();
  ctx.strokeStyle = '#d9a62e'; ctx.lineWidth = 2;
  ctx.strokeRect(x + 22, y - 70, 46, 22);
  ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('🛒', x + 45, y - 53);
}

function drawPond(ctx, x, y, w, h, t, label, locked, needLv, deep) {
  // 水坑的水**不管有没有解锁都画成完全一样**（颜色、深浅、岸边沙圈、水纹波纹一模一样，
  // 连一个像素都不差）；没解锁的只在名牌上多挂一把 🔒，走过去会提示去升级水坑
  // deep = 大海里的「蓝洞」：比周围的海水更深、更蓝（解锁与否都一样）
  ctx.fillStyle = deep ? 'rgba(255,255,255,.35)' : '#c9b280';
  ellipse(ctx, x, y, w / 2 + 14, h / 2 + 12); ctx.fill();
  ctx.fillStyle = deep ? '#0d4a94' : '#5fb8e8';
  ellipse(ctx, x, y, w / 2, h / 2); ctx.fill();
  ctx.fillStyle = deep ? '#1a63b4' : '#7ccbf0';
  ellipse(ctx, x - w * 0.12, y - h * 0.15, w / 2.8, h / 3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const rx = ((t * 25 + i * 40) % (w / 2 - 8));
    ctx.globalAlpha = 1 - rx / (w / 2 - 8);
    ellipse(ctx, x + Math.sin(i * 7) * 20, y + Math.cos(i * 5) * 12, rx, rx * (h / w));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // 水坑名牌（没解锁的多一把 🔒）
  if (label) {
    const txt = (locked ? '🔒 ' : '💧 ') + label;
    const sw = Math.max(58, txt.length * 15 + 20);
    const sx = x - sw / 2, sy = y - h / 2 - 36 + Math.sin(t * 1.8) * 1.5;
    ctx.fillStyle = '#fff3d6';
    rr(ctx, sx, sy, sw, 20, 6); ctx.fill();
    ctx.strokeStyle = '#5fb8e8'; ctx.lineWidth = 2.5;
    rr(ctx, sx, sy, sw, 20, 6); ctx.stroke();
    ctx.fillStyle = '#2a6a95';
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(txt, x, sy + 15);
  }
}

/* ------------------------------------------------------------
 * 升级系统的场景元素
 * ---------------------------------------------------------- */

// 以前用来画「扩建预留区」的白色虚线框：现在地图上不再画预留区了（函数留着备用）
function drawExpandOutline(ctx, rect, t, text) {
  if (!rect) return;
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -(t * 14) % 18;
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = 2.5;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10); ctx.stroke();
  ctx.setLineDash([]);
  const txt = text || '🔨 扩建预留区';
  ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  const cx = rect.x + rect.w / 2, cy = rect.y - 8 + Math.sin(t * 2) * 1.5;
  const tw = txt.length * 12 + 16;
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  rr(ctx, cx - tw / 2, cy - 13, tw, 18, 8); ctx.fill();
  ctx.fillStyle = '#8a6a2a';
  ctx.fillText(txt, cx, cy);
  ctx.restore();
}

// 设施等级小牌子（挂在棚舍 / 水坑 / 果园的告示牌上）
function drawLvBadge(ctx, x, y, lv, t, canUp) {
  const w = 46, h = 19;
  ctx.save();
  ctx.fillStyle = canUp ? '#fff6d0' : '#ffffff';
  rr(ctx, x - w / 2, y - h / 2, w, h, 8); ctx.fill();
  ctx.strokeStyle = canUp ? '#ffb020' : '#c9b8a0';
  ctx.lineWidth = 2;
  if (canUp) ctx.lineWidth = 2.4 + Math.sin(t * 5) * 0.6;
  rr(ctx, x - w / 2, y - h / 2, w, h, 8); ctx.stroke();
  ctx.fillStyle = canUp ? '#c9750a' : '#8a7a62';
  ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⭐Lv.' + lv + (canUp ? ' 🔨' : ''), x, y + 4.5);
  ctx.restore();
}

// 🔨 升级木板：每栋建筑正下方都有一块（十个设施统一），
// 走过去按 E 就能看到「现在是什么状况」+「升级以后会怎样」。
// 钱够的时候板子上会闪一个小锤子，够不够一眼就能看出来。
function drawUpgradeBoard(ctx, x, y, t, icon, lv, canUp, full) {
  const W = 64, H = 26;
  const bob = Math.sin(t * 2) * 1.2;
  drawShadow(ctx, x, y + 22, 15);
  // 立柱
  ctx.fillStyle = '#a57c4a';
  rr(ctx, x - 3, y + 4, 6, 20, 2); ctx.fill();
  // 木板
  ctx.fillStyle = '#e0b878';
  rr(ctx, x - W / 2, y - H / 2 + bob, W, H, 5); ctx.fill();
  ctx.strokeStyle = canUp && !full ? '#ff9f43' : '#a57c4a';
  ctx.lineWidth = canUp && !full ? 3 + Math.sin(t * 5) * 0.7 : 2.5;
  rr(ctx, x - W / 2, y - H / 2 + bob, W, H, 5); ctx.stroke();
  // 木纹
  ctx.strokeStyle = 'rgba(165,124,74,.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - W / 2 + 5, y - 4 + bob); ctx.lineTo(x + W / 2 - 5, y - 4 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - W / 2 + 5, y + 6 + bob); ctx.lineTo(x + W / 2 - 5, y + 6 + bob); ctx.stroke();
  // 图标 + 等级
  ctx.textAlign = 'center';
  ctx.font = '15px sans-serif';
  ctx.fillText(icon, x - 14, y + 5 + bob);
  ctx.fillStyle = '#7a4a12';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Lv.' + lv, x + 14, y + 5 + bob);
  // 可以升级就闪小锤子
  if (canUp && !full) {
    ctx.font = '13px sans-serif';
    ctx.fillText('🔨', x + 24, y - 8 + bob + Math.sin(t * 6) * 1.6);
  }
}

// ---------------- 宠物正在做的事：🍖 吃东西 / 🧹 打扫 / 🛁 洗澡 ----------------
// 点了「喂食 / 清理 / 洗澡」之后，地图上的宠物会真的动起来：
//   吃 → 面前的食盆里冒出肉，一口一口啃，头上冒爱心；
//   打扫 → 一把扫帚左右扫，便便化成星星飞走；
//   洗澡 → 坐进澡盆，泡泡一颗颗往上飘，泡泡还晃来晃去。
function drawPetAction(ctx, x, y, t, anim) {
  if (!anim) return;
  const k = Math.min(1, anim.t / anim.dur);
  const fade = k > 0.78 ? Math.max(0, (1 - k) / 0.22) : Math.min(1, k / 0.12 + 0.15);
  ctx.save();
  ctx.globalAlpha = fade;
  if (anim.kind === 'eat') {
    ctx.fillStyle = '#f0b8c8';
    ellipse(ctx, x + 16, y + 9, 12, 5.5); ctx.fill();
    ctx.fillStyle = '#e09ab0';
    ellipse(ctx, x + 16, y + 8, 9, 3.6); ctx.fill();
    const chew = Math.abs(Math.sin(k * Math.PI * 7));
    ctx.textAlign = 'center';
    ctx.font = '13px sans-serif';
    ctx.fillText('🍖', x + 16, y + 5 - chew * 4);
    for (let i = 0; i < 3; i++) {
      const ph = (k * 3 + i * 0.33) % 1;
      ctx.globalAlpha = fade * (1 - ph);
      ctx.font = '13px sans-serif';
      ctx.fillText('💖', x - 10 + i * 10, y - 22 - ph * 24);
    }
    ctx.globalAlpha = fade;
  } else if (anim.kind === 'clean') {
    const sw = Math.sin(k * Math.PI * 6) * 15;
    ctx.strokeStyle = '#b3814a'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 10 + sw, y - 2); ctx.lineTo(x + 19 + sw, y + 19); ctx.stroke();
    ctx.fillStyle = '#f4d35e';
    rr(ctx, x + 12 + sw, y + 17, 15, 8, 2.5); ctx.fill();
    ctx.strokeStyle = '#d9a62e'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(x + 14 + sw + i * 3.4, y + 20); ctx.lineTo(x + 14 + sw + i * 3.4, y + 25); ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const ph = (k * 2 + i * 0.25) % 1;
      ctx.globalAlpha = fade * (1 - ph);
      ctx.textAlign = 'center'; ctx.font = '13px sans-serif';
      ctx.fillText('✨', x - 20 + i * 13, y - 4 - ph * 22);
    }
    ctx.globalAlpha = fade;
  } else if (anim.kind === 'bath') {
    // 泡泡先飘，再把宠物「洗一洗」
    ctx.fillStyle = '#a8d8f0';
    rr(ctx, x - 20, y - 2, 44, 19, 7); ctx.fill();
    ctx.fillStyle = '#7cc4e8';
    rr(ctx, x - 23, y - 7, 50, 9, 4.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    for (let i = 0; i < 5; i++) {
      const ph = (k * 1.7 + i * 0.2) % 1;
      const bx = x - 15 + i * 8.5 + Math.sin(ph * 7 + i) * 3.5;
      const r = 2 + ph * 3.4;
      ellipse(ctx, bx, y - 9 - ph * 28, r, r); ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.font = '14px sans-serif';
    ctx.fillText('🫧', x + 20, y - 16 - Math.sin(k * 9) * 3);
    ctx.fillText('🛁', x - 24, y - 14 + Math.sin(k * 7) * 2);
  }
  ctx.globalAlpha = fade;
  ctx.textAlign = 'center';
  ctx.font = '17px sans-serif';
  const ic = anim.kind === 'eat' ? '😋' : anim.kind === 'clean' ? '🧹' : '🛁';
  ctx.fillText(ic, x, y - 44 + Math.sin(t * 7) * 2.5);
  ctx.restore();
}

// 🐾 宠物房间：一间小屋子，里面有食盆、澡盆和垫子；升级后屋子变大、床变多
function drawPetRoom(ctx, x, y, t, lv, pets, rect) {
  const r = rect || { x: x - 48, y: y - 60, w: 96, h: 60 };
  const W = r.w, H = r.h;
  // 宠物房比主角家小，里面的门 / 窗 / 招牌 / 小枕头都跟着房间一起缩（k = 相对老尺寸的比例）
  const k = W / 170;
  const wallTop = r.y, wallBot = r.y + H;
  const roofH = 34 * k, over = 10 * k;
  drawShadow(ctx, r.x + W / 2, wallBot + 4, W / 2);
  // 墙
  ctx.fillStyle = '#ffe6c8';
  rr(ctx, r.x, wallTop, W, H, 8 * k + 2); ctx.fill();
  ctx.strokeStyle = '#e0b878'; ctx.lineWidth = Math.max(1.6, 2.5 * k);
  rr(ctx, r.x, wallTop, W, H, 8 * k + 2); ctx.stroke();
  // 屋顶
  ctx.fillStyle = '#f0a058';
  ctx.beginPath();
  ctx.moveTo(r.x - over, wallTop + 4 * k);
  ctx.lineTo(r.x + W / 2, wallTop - roofH);
  ctx.lineTo(r.x + W + over, wallTop + 4 * k);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d8863e';
  rr(ctx, r.x - over, wallTop, W + over * 2, Math.max(4, 7 * k), 3.5 * k); ctx.fill();
  // 门（下方中间）
  const dw = Math.max(16, 30 * k), dh = Math.max(18, 34 * k);
  ctx.fillStyle = '#b5723a';
  rr(ctx, r.x + W / 2 - dw / 2, wallBot - dh, dw, dh, 5 * k + 1); ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ellipse(ctx, r.x + W / 2 + dw * 0.3, wallBot - dh / 2, Math.max(1.4, 2 * k), Math.max(1.4, 2 * k)); ctx.fill();
  // 招牌
  ctx.font = Math.max(10, Math.round(15 * k)) + 'px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🐾', r.x + W / 2, wallTop + Math.max(14, 26 * k));
  // 窗户
  const ww = Math.max(15, 26 * k), wh = Math.max(12, 22 * k), wy = wallTop + Math.max(7, 14 * k);
  const wx1 = r.x + 12 * k, wx2 = r.x + W - 12 * k - ww;
  ctx.fillStyle = 'rgba(180,225,245,.9)';
  rr(ctx, wx1, wy, ww, wh, 4 * k); ctx.fill();
  rr(ctx, wx2, wy, ww, wh, 4 * k); ctx.fill();
  ctx.strokeStyle = '#e0b878'; ctx.lineWidth = Math.max(1.2, 2 * k);
  rr(ctx, wx1, wy, ww, wh, 4 * k); ctx.stroke();
  rr(ctx, wx2, wy, ww, wh, 4 * k); ctx.stroke();
  // 屋里的垫子：按等级画出所有床位（有几只宠物就有几个小枕头）
  const beds = Math.min(4, Math.max(lv, (pets || []).length));
  const innerL = r.x + 16 * k, innerR = r.x + W - 16 * k;
  const bedY = wallBot - Math.max(8, 16 * k);
  for (let i = 0; i < beds; i++) {
    const px = beds === 1 ? (innerL + innerR) / 2 : innerL + (innerR - innerL) * (i / (beds - 1));
    ctx.fillStyle = i % 2 ? '#cfe8ff' : '#ffd8e6';
    ellipse(ctx, px, bedY, Math.max(6.5, 15 * k), Math.max(3, 6 * k)); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ellipse(ctx, px, bedY - Math.max(1.5, 3 * k), Math.max(3, 7 * k), Math.max(1.6, 3.4 * k)); ctx.fill();
  }
  // 门边的食盆和澡盆
  const bowlY = wallBot + Math.max(7, 12 * k);
  ctx.fillStyle = '#f0b8c8';
  ellipse(ctx, r.x + 20 * k, bowlY, Math.max(5, 10 * k), Math.max(2.6, 5 * k)); ctx.fill();
  ctx.fillStyle = '#a8d8f0';
  ellipse(ctx, r.x + W - 20 * k, bowlY, Math.max(5.5, 11 * k), Math.max(3, 6 * k)); ctx.fill();
  ctx.font = Math.max(9, Math.round(11 * k)) + 'px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🍖', r.x + 20 * k, bowlY + 4 * k);
  ctx.fillText('🛁', r.x + W - 20 * k, bowlY + 4 * k);
  // 等级徽章（挂在屋顶尖尖上面）
  drawLvBadge(ctx, r.x + W / 2, wallTop - roofH - 12, lv, t, false);
}

// 🛒 销售门面（接在商店右边）：一张带遮阳棚的柜台 ——
// 小朋友把收来的东西拿到这里卖给客人，客人从**右边**排队过来
function drawSalesCounter(ctx, x, y, t) {
  const W = 118;
  drawShadow(ctx, x, y + 10, W / 2);
  // 柜台（木箱 + 台面）
  ctx.fillStyle = '#c98a5a';
  rr(ctx, x - W / 2, y - 34, W, 42, 6); ctx.fill();
  ctx.fillStyle = '#e0b878';
  rr(ctx, x - W / 2 - 6, y - 40, W + 12, 10, 4); ctx.fill();
  ctx.strokeStyle = '#a57c4a'; ctx.lineWidth = 2;
  rr(ctx, x - W / 2 - 6, y - 40, W + 12, 10, 4); ctx.stroke();
  // 台面上的小秤和钱箱
  ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⚖️', x - 26, y - 26 + Math.sin(t * 2) * 1.2);
  ctx.fillText('💰', x + 28, y - 26 + Math.sin(t * 2 + 1) * 1.2);
  // 条纹遮阳棚
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#ff9f43' : '#fff';
    const sx = x - W / 2 - 4 + i * ((W + 8) / 6);
    ctx.beginPath();
    ctx.moveTo(sx, y - 74); ctx.lineTo(sx + (W + 8) / 6, y - 74);
    ctx.lineTo(sx + (W + 8) / 6 - 3, y - 54 + Math.sin(t * 3 + i) * 1.5);
    ctx.lineTo(sx + 3, y - 54 + Math.sin(t * 3 + i + 1) * 1.5);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#8a5a2e';
  rr(ctx, x - W / 2 - 8, y - 78, 6, 48, 2); ctx.fill();
  rr(ctx, x + W / 2 + 2, y - 78, 6, 48, 2); ctx.fill();
  // 招牌：销售门面 + 右边排队的箭头
  ctx.fillStyle = '#fff3d6';
  rr(ctx, x - 40, y - 104, 80, 22, 6); ctx.fill();
  ctx.strokeStyle = '#d9a62e'; ctx.lineWidth = 2;
  rr(ctx, x - 40, y - 104, 80, 22, 6); ctx.stroke();
  ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('💰', x - 22, y - 87);
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('➡', x + 24, y - 87 + Math.sin(t * 4) * 2);
}

function drawBin(ctx, x, y, t) {
  drawShadow(ctx, x, y + 16, 18);
  ctx.fillStyle = '#9a6a3a';
  rr(ctx, x - 16, y - 14, 32, 30, 5); ctx.fill();
  ctx.fillStyle = '#7a5228';
  rr(ctx, x - 18, y - 18, 36, 8, 3); ctx.fill();
  ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#3a2a12';
  ctx.fillText('📦', x, y + 4 + Math.sin(t * 2) * 1);
}

function drawWardrobeProp(ctx, x, y, t) {
  drawShadow(ctx, x, y + 14, 16);
  ctx.fillStyle = '#d9a066';
  rr(ctx, x - 14, y - 26, 28, 40, 4); ctx.fill();
  ctx.strokeStyle = '#b3814a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.lineTo(x, y + 14); ctx.stroke();
  ctx.fillStyle = '#ffd23e';
  ellipse(ctx, x - 3, y - 5, 1.8, 1.8); ctx.fill();
  ellipse(ctx, x + 3, y - 5, 1.8, 1.8); ctx.fill();
  ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('👕', x, y - 30 + Math.sin(t * 2) * 1.5);
}

function drawKitchenProp(ctx, x, y, t) {
  drawShadow(ctx, x, y + 12, 18);
  ctx.fillStyle = '#e8e8f0';
  rr(ctx, x - 17, y - 16, 34, 28, 5); ctx.fill();
  ctx.fillStyle = '#555';
  ellipse(ctx, x - 8, y - 16, 5, 2.5); ctx.fill();
  ellipse(ctx, x + 8, y - 16, 5, 2.5); ctx.fill();
  for (let i = 0; i < 2; i++) {
    const sa = 1 - ((t * 15 + i * 14) % 28) / 28;
    ctx.strokeStyle = `rgba(255,255,255,${sa * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sy = y - 20 - ((t * 15 + i * 14) % 28);
    ctx.moveTo(x - 8, sy);
    ctx.quadraticCurveTo(x - 11, sy - 4, x - 8, sy - 8);
    ctx.stroke();
  }
  ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('🍳', x, y + 8);
}

/* ------------------------------------------------------------
 * 动物棚舍：鸡棚 / 羊棚 / 牛棚（栅栏 + 小窝）
 * ---------------------------------------------------------- */
// 后半栅栏（顶部带小门缺口 + 两侧）
function drawFenceBack(ctx, x, y, w, h) {
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const gate = 46;
  ctx.beginPath();
  // 顶栏（中间留门）
  ctx.moveTo(x, y); ctx.lineTo(x + w / 2 - gate / 2, y);
  ctx.moveTo(x + w / 2 + gate / 2, y); ctx.lineTo(x + w, y);
  // 两侧
  ctx.moveTo(x, y); ctx.lineTo(x, y + h);
  ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.strokeStyle = '#a57c4a'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 8); ctx.lineTo(x + w / 2 - gate / 2, y + 8);
  ctx.moveTo(x + w / 2 + gate / 2, y + 8); ctx.lineTo(x + w, y + 8);
  ctx.stroke();
  // 栅栏柱
  ctx.fillStyle = '#b8905e';
  for (let px = x; px <= x + w; px += Math.max(28, w / 6)) {
    if (Math.abs(px - (x + w / 2)) < gate / 2) continue;
    rr(ctx, px - 2.5, y - 8, 5, 18, 2); ctx.fill();
  }
}
// 前半栅栏（底部，画在动物前面）
function drawFenceFront(ctx, x, y, w) {
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.strokeStyle = '#a57c4a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x + w, y + 8); ctx.stroke();
  ctx.fillStyle = '#b8905e';
  for (let px = x; px <= x + w; px += Math.max(28, w / 6)) {
    rr(ctx, px - 2.5, y - 10, 5, 22, 2); ctx.fill();
  }
}

// 鸡棚小窝
function drawCoopHouse(ctx, x, y, t) {
  drawShadow(ctx, x, y + 2, 34);
  ctx.fillStyle = '#e8c88a'; // 木墙
  rr(ctx, x - 30, y - 34, 60, 36, 5); ctx.fill();
  ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(x - 30, y - 34 + i * 9); ctx.lineTo(x + 30, y - 34 + i * 9); ctx.stroke();
  }
  ctx.fillStyle = '#e05252'; // 屋顶
  ctx.beginPath();
  ctx.moveTo(x - 36, y - 32); ctx.lineTo(x, y - 54); ctx.lineTo(x + 36, y - 32);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a3a1e'; // 圆门
  ellipse(ctx, x, y - 12, 8, 10); ctx.fill();
  ctx.fillStyle = '#f4d35e'; // 干草
  ellipse(ctx, x, y - 5, 7, 3); ctx.fill();
  // 牌子
  ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('🐔', x + 22, y - 40 + Math.sin(t * 2) * 1);
}

// 羊棚（草顶小棚）
function drawSheepShed(ctx, x, y, t) {
  drawShadow(ctx, x, y + 2, 44);
  ctx.fillStyle = '#a57c4a'; // 立柱
  rr(ctx, x - 38, y - 30, 6, 32, 2); ctx.fill();
  rr(ctx, x + 32, y - 30, 6, 32, 2); ctx.fill();
  ctx.fillStyle = '#f4d35e'; // 草顶
  ctx.beginPath();
  ctx.moveTo(x - 46, y - 28); ctx.quadraticCurveTo(x, y - 52 + Math.sin(t * 1.5) * 1, x + 46, y - 28);
  ctx.lineTo(x + 40, y - 22); ctx.quadraticCurveTo(x, y - 42, x - 40, y - 22);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d9a62e'; ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(x + i * 16, y - 30 - (2 - Math.abs(i)) * 4); ctx.lineTo(x + i * 16, y - 24); ctx.stroke();
  }
  ctx.fillStyle = '#f4d35e'; // 干草堆
  ellipse(ctx, x - 18, y - 4, 12, 6); ctx.fill();
  ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('🐑', x + 24, y - 12 + Math.sin(t * 2) * 1);
}

// 牛棚（大红谷仓）
function drawCowBarn(ctx, x, y, t) {
  drawShadow(ctx, x, y + 2, 56);
  ctx.fillStyle = '#d85a4a'; // 红墙
  rr(ctx, x - 48, y - 50, 96, 52, 6); ctx.fill();
  ctx.fillStyle = '#b84038'; // 屋顶
  ctx.beginPath();
  ctx.moveTo(x - 54, y - 48); ctx.lineTo(x, y - 78); ctx.lineTo(x + 54, y - 48);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; // 白色边框
  rr(ctx, x - 54, y - 50, 108, 5, 2); ctx.fill();
  ctx.fillStyle = '#8a2f28'; // 大门
  rr(ctx, x - 16, y - 30, 32, 32, 3); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; // 门上 X
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 28); ctx.lineTo(x + 14, y - 2);
  ctx.moveTo(x + 14, y - 28); ctx.lineTo(x - 14, y - 2);
  ctx.stroke();
  ctx.fillStyle = '#fff3d6'; // 小圆窗
  ellipse(ctx, x, y - 58, 7, 7); ctx.fill();
  ctx.strokeStyle = '#a57c4a'; ctx.lineWidth = 2;
  ellipse(ctx, x, y - 58, 7, 7); ctx.stroke();
  ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('🐮', x + 34, y - 38 + Math.sin(t * 2) * 1);
}

// 大型水族箱（里面养的鱼会游动，用动画 emoji 图）
function drawAquarium(ctx, x, y, t, fish, size) {
  // 水族箱的尺寸跟着「水族箱等级」变：1 级 240x118 → 3 级 360x164
  const W = (size && size.w) || 300, H = (size && size.h) || 140;
  fish = fish || [];
  drawShadow(ctx, x, y + 6, W / 2);
  // 木架
  ctx.fillStyle = '#a57c4a';
  rr(ctx, x - W / 2 - 8, y - 18, W + 16, 20, 5); ctx.fill();
  ctx.fillStyle = '#8a5f36';
  rr(ctx, x - W / 2 - 2, y - 4, 16, 12, 3); ctx.fill();
  rr(ctx, x + W / 2 - 14, y - 4, 16, 12, 3); ctx.fill();
  // 玻璃箱
  ctx.fillStyle = 'rgba(180,225,245,.65)';
  rr(ctx, x - W / 2, y - H - 14, W, H, 10); ctx.fill();
  // 水
  ctx.fillStyle = 'rgba(95,184,232,.55)';
  rr(ctx, x - W / 2 + 5, y - H - 6, W - 10, H - 12, 8); ctx.fill();
  // 底砂
  ctx.fillStyle = '#e0cfa8';
  ctx.beginPath();
  ctx.moveTo(x - W / 2 + 6, y - 18);
  ctx.quadraticCurveTo(x, y - 30, x + W / 2 - 6, y - 18);
  ctx.lineTo(x + W / 2 - 6, y - 12); ctx.lineTo(x - W / 2 + 6, y - 12);
  ctx.closePath(); ctx.fill();
  // 水草（箱子越大水草越多，沿着箱底均匀铺开）
  const grassN = Math.max(5, Math.round(W / 78));
  ctx.strokeStyle = '#3f9e63'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < grassN; i++) {
    const k = grassN === 1 ? 0 : (i / (grassN - 1) - 0.5);
    const bx = x + k * (W - 90), sway = Math.sin(t * 1.6 + i) * 6;
    const hgt = (58 + (i % 2 ? 14 : 0)) * Math.min(1.5, Math.max(0.7, H / 140));
    ctx.beginPath();
    ctx.moveTo(bx, y - 22);
    ctx.quadraticCurveTo(bx + sway, y - 22 - hgt * 0.55, bx + sway * 1.4, y - 22 - hgt);
    ctx.stroke();
  }
  // 小石头（也按箱子宽度摆开）
  const stoneN = Math.max(4, Math.round(W / 95));
  ctx.fillStyle = '#b9c3c9';
  for (let i = 0; i < stoneN; i++) {
    const k = stoneN === 1 ? 0 : (i / (stoneN - 1) - 0.5);
    const R = 7 + (i % 3) * 1.5;
    ellipse(ctx, x + k * (W - 120), y - 19 + (i % 2 ? 1 : 0), R, R * 0.55); ctx.fill();
  }
  // 气泡
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 12; i++) {
    const ph = ((t * 0.35 + i * 0.13) % 1);
    const bx = x - W / 2 + 22 + ((i * 41) % (W - 44));
    ellipse(ctx, bx, y - 16 - ph * (H - 30), 1.8 + (1 - ph) * 2.2, 1.8 + (1 - ph) * 2.2);
    ctx.fill();
  }
  // 里面的鱼：在玻璃箱内部沿椭圆轨迹游，游到边界会自己掉头。
  // 有些生物（海豚、鲨鱼）的图本身留白很多，要放大一点才看得清，
  // 所以这里给它们各自的显示倍率。
  const SW = W / 2 - 34, SH = H / 2 - 26;      // 允许游动的半宽 / 半高
  const cxm = x, cym = y - H / 2 - 12;         // 水体的中心
  const SEA_ZOOM = { dolphin: 1.6, shark: 1.55, whale: 1.15, seal: 1.3, croc: 1.25,
                     seaturtle: 1.25, goldfish: 1.2, fish: 1.15, puffer: 1.2,
                     octopus: 1.15, lobster: 1.15, crab: 1.1, squid: 1.15,
                     shrimp: 1.25, shell: 1.2 };
  fish.forEach((id, i) => {
    const it = ITEMS[id];
    if (!it) return;
    const rec = loadEmoji(it.cp);
    const a = t * (0.45 + (i % 5) * 0.11) + i * 1.7;
    const fx = cxm + Math.cos(a) * SW;
    const fy = cym + Math.sin(a * 1.5 + i) * SH;
    const vx = -Math.sin(a);                   // 水平速度方向 = -sin(a)
    // 水族箱越大，里面的鱼也越大一点（不然大缸里的鱼会显得很小很远）
    const sizeK = Math.min(1.55, Math.max(1, W / 340));
    const size = (26 + Math.min(22, (it.price || 20) / 16)) * (SEA_ZOOM[id] || 1.3) * sizeK;
    ctx.save();
    ctx.translate(fx, fy);
    if (vx < 0) ctx.scale(-1, 1);              // 朝游动方向
    // 和地图上的观赏动物走同一套画法（drawEmojiCreature）：
    // 优先逐帧动画（水族箱里用半速播放，看着更悠闲，游动速度不变），
    // 没有动画素材的用静态图 + 呼吸效果；都没有才退回文字 emoji
    if (!drawEmojiCreature(ctx, it.cp, 0, 0, size, t, rec, TANK_ANIM_SPEED, i, 1)) {
      ctx.font = Math.round(size * 0.85) + 'px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#123'; ctx.fillText(it.icon, 0, size * 0.3);
    }
    ctx.restore();
  });
  // 玻璃高光 + 边框
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
  rr(ctx, x - W / 2, y - H - 14, W, H, 10); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - W / 2 + 12, y - H - 4); ctx.lineTo(x - W / 2 + 40, y - H + 34);
  ctx.stroke();
  // 小招牌
  ctx.fillStyle = '#fff3d6';
  rr(ctx, x - 32, y - H - 38, 64, 24, 7); ctx.fill();
  ctx.strokeStyle = '#d9a62e'; ctx.lineWidth = 2;
  rr(ctx, x - 32, y - H - 38, 64, 24, 7); ctx.stroke();
  ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('🐠 ' + fish.length, x, y - H - 20);
}

/* ------------------------------------------------------------
 * 动物园观赏动物（用 Noto Emoji Animation 的动画图）
 * ---------------------------------------------------------- */
// 某只观赏动物朝 dir 走的时候，需不需要水平镜像？
// 返回 1 = 保持原图，-1 = 左右镜像。
// 依据 ZOO_FACING：这张 emoji 图里的头本来是朝哪边的（front = 正面画风，永远不用镜像）。
function zooFlip(type, dir) {
  const facing = (typeof ZOO_FACING !== 'undefined' && ZOO_FACING[type]) || 'front';
  if (facing === 'front') return 1;
  if (facing === 'left') return dir === 'left' ? 1 : -1;
  return dir === 'right' ? 1 : -1;      // facing === 'right'
}

function drawZoo(ctx, x, y, o) {
  const s = o.size;
  const moving = !!o.moving;
  const wp = o.walkPhase || 0;
  // 走路时用「上下颠 + 左右轻摆 + 前倾」做出自然的步态；站着时轻轻呼吸
  const walkBob = Math.abs(Math.sin(wp));
  const breath = Math.sin(o.t * 2 + o.phase) * 1.6;
  const fly = o.fly;
  const hop = moving ? (fly ? walkBob * s * 0.10 : walkBob * s * 0.045) : breath * 0.5 + 0.6;
  const sc = moving ? 1 + Math.sin(o.t * 2.4 + o.phase) * 0.012 : 1 + Math.sin(o.t * 2.2 + o.phase) * 0.022;
  // 面向：按量好的每种动物「头朝哪边」来镜像，保证朝着前进方向，不会倒着走
  const flip = zooFlip(o.type, o.dir);

  drawShadow(ctx, x, y, s * 0.4 * (1 - hop / (s * 1.6)));
  ctx.save();
  ctx.translate(x, y - hop);
  ctx.scale(flip, 1);
  // 走路时朝前倾一点，像在迈步
  const lean = moving ? (fly ? Math.sin(wp * 2) * 0.05 : 0.055) : 0;
  ctx.rotate(-lean);
  const cp = o.cp || (o.rec && o.rec.cp);
  // 和水族箱里的小鱼走同一套画法：优先逐帧动画，没有动画素材就静态图 + 呼吸
  // （cp 一定要传：没有 cp 就找不到帧，动物会定格成一张图）
  // 两条路都画不出来（连图都没有）才退回文字 emoji
  if (!drawEmojiCreature(ctx, cp, 0, -s / 2, s, o.t, o.rec, ZOO_ANIM_SPEED, o.phase, sc)) {
    ctx.font = Math.round(s * 0.8) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#222';
    ctx.fillText(o.emoji, 0, -s * 0.12);
  }
  ctx.restore();
}

// 钓鱼水波纹（大小对应能钓到的鱼）
function drawRipple(ctx, x, y, rip, phase) {
  for (let i = 0; i < 3; i++) {
    const ph = ((phase * 0.55 + i * 0.33) % 1);
    const r = rip.r * (0.3 + ph * 0.95);
    ctx.strokeStyle = rip.color;
    ctx.globalAlpha = (1 - ph) * 0.9;
    ctx.lineWidth = 1.5 + rip.lv * 0.6;
    ellipse(ctx, x, y + 2, r, r * 0.42);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------
 * 庭院装饰（商店购买后自己摆放，全部带动画）
 * ---------------------------------------------------------- */
function drawDecor(ctx, id, x, y, t, phase = 0) {
  switch (id) {
    case 'rock':
      drawShadow(ctx, x, y, 16);
      ctx.fillStyle = '#9aa0a6'; ellipse(ctx, x, y - 8, 15, 12); ctx.fill();
      ctx.fillStyle = '#b8bec4'; ellipse(ctx, x - 4, y - 12, 7, 5); ctx.fill();
      ctx.fillStyle = '#7c8288'; ellipse(ctx, x + 6, y - 4, 5.5, 3.5); ctx.fill();
      break;

    case 'mushroom': {
      drawShadow(ctx, x, y, 10);
      const bob = Math.sin(t * 2 + phase) * 1.2;
      ctx.fillStyle = '#fff2e0'; rr(ctx, x - 4, y - 15, 8, 15, 3); ctx.fill();
      ctx.fillStyle = '#ff5a5a';
      ctx.beginPath(); ctx.ellipse(x, y - 15 + bob, 12.5, 8.5, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ellipse(ctx, x - 5, y - 18 + bob, 2.5, 2); ctx.fill();
      ellipse(ctx, x + 4.5, y - 20 + bob, 2, 1.7); ctx.fill();
      break;
    }

    case 'flowerbed': {
      drawShadow(ctx, x, y, 34);
      ctx.fillStyle = '#b07b4f'; rr(ctx, x - 32, y - 16, 64, 18, 5); ctx.fill();
      ctx.fillStyle = '#8a5f36'; rr(ctx, x - 32, y - 6, 64, 8, 3); ctx.fill();
      const cols = ['#ff8fb0', '#ffd23e', '#c88ae8', '#fff', '#ff6b6b'];
      for (let i = 0; i < 5; i++) {
        const fx = x - 24 + i * 12, sw = Math.sin(t * 2 + phase + i) * 2;
        ctx.strokeStyle = '#5da84d'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(fx, y - 16); ctx.quadraticCurveTo(fx + sw * .5, y - 24, fx + sw, y - 31); ctx.stroke();
        ctx.fillStyle = cols[i % cols.length];
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + phase;
          ellipse(ctx, fx + sw + Math.cos(a) * 3.2, y - 33 + Math.sin(a) * 3.2, 2.3, 2.3); ctx.fill();
        }
        ctx.fillStyle = '#ffd23e'; ellipse(ctx, fx + sw, y - 33, 2.2, 2.2); ctx.fill();
      }
      break;
    }

    case 'fence':
      drawShadow(ctx, x, y, 34);
      ctx.fillStyle = '#b8905e';
      [-28, 0, 28].forEach(px => { rr(ctx, x + px - 3.5, y - 32, 7, 34, 3); ctx.fill(); });
      ctx.fillStyle = '#c9a06a';
      rr(ctx, x - 33, y - 25, 66, 5.5, 2); ctx.fill();
      rr(ctx, x - 33, y - 12, 66, 5.5, 2); ctx.fill();
      break;

    case 'lamp': {
      drawShadow(ctx, x, y, 12);
      ctx.fillStyle = '#5a5a66'; rr(ctx, x - 3, y - 54, 6, 56, 3); ctx.fill();
      ctx.fillStyle = '#7a7a88'; rr(ctx, x - 9, y - 4, 18, 5, 2); ctx.fill();
      const glow = 0.75 + Math.sin(t * 3 + phase) * 0.12;
      ctx.fillStyle = `rgba(255,225,130,${0.22 * glow})`;
      ellipse(ctx, x, y - 60, 20, 20); ctx.fill();
      ctx.fillStyle = `rgba(255,240,180,${glow})`;
      ellipse(ctx, x, y - 60, 8.5, 10); ctx.fill();
      ctx.fillStyle = '#5a5a66'; rr(ctx, x - 8, y - 70, 16, 5, 2); ctx.fill();
      break;
    }

    case 'bench':
      drawShadow(ctx, x, y, 30);
      ctx.fillStyle = '#a57c4a';
      rr(ctx, x - 26, y - 8, 7, 12, 2); ctx.fill();
      rr(ctx, x + 19, y - 8, 7, 12, 2); ctx.fill();
      ctx.fillStyle = '#c98a5a';
      rr(ctx, x - 30, y - 18, 60, 9, 3); ctx.fill();
      rr(ctx, x - 30, y - 36, 60, 7, 3); ctx.fill();
      ctx.fillStyle = '#a57c4a';
      rr(ctx, x - 26, y - 30, 5, 14, 2); ctx.fill();
      rr(ctx, x + 21, y - 30, 5, 14, 2); ctx.fill();
      break;

    case 'blossom': {
      drawShadow(ctx, x, y, 24);
      const sway = Math.sin(t * 1.3 + phase) * 2.5;
      ctx.fillStyle = '#8a5a2e'; rr(ctx, x - 5, y - 30, 10, 34, 4); ctx.fill();
      ctx.fillStyle = '#ffb7d5';
      ellipse(ctx, x - 15 + sway, y - 44, 16, 13); ctx.fill();
      ellipse(ctx, x + 15 + sway, y - 44, 16, 13); ctx.fill();
      ellipse(ctx, x + sway, y - 56, 19, 15); ctx.fill();
      ctx.fillStyle = '#ffd0e4';
      ellipse(ctx, x - 6 + sway, y - 54, 9, 7); ctx.fill();
      // 飘落的花瓣
      for (let i = 0; i < 4; i++) {
        const p = ((t * 0.35 + i * 0.27 + phase * 0.1) % 1);
        const px2 = x + Math.sin((t + i * 2) * 1.6) * 16;
        ctx.fillStyle = `rgba(255,183,213,${1 - p})`;
        ellipse(ctx, px2, y - 56 + p * 58, 3, 2.2); ctx.fill();
      }
      break;
    }

    case 'scarecrow': {
      drawShadow(ctx, x, y, 16);
      const sway = Math.sin(t * 1.8 + phase) * 2;
      ctx.fillStyle = '#a57c4a'; rr(ctx, x - 4, y - 52, 8, 54, 3); ctx.fill();
      ctx.fillStyle = '#c9a06a'; rr(ctx, x - 24, y - 44, 48, 6, 3); ctx.fill();
      // 稻草手
      ctx.strokeStyle = '#f4d35e'; ctx.lineWidth = 2.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(x - 24, y - 41); ctx.lineTo(x - 30, y - 38 + i * 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 24, y - 41); ctx.lineTo(x + 30, y - 38 + i * 3); ctx.stroke();
      }
      // 身体（格子衫）
      ctx.fillStyle = '#e05252'; rr(ctx, x - 14 + sway * .3, y - 40, 28, 26, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      rr(ctx, x - 14 + sway * .3, y - 34, 28, 3, 1); ctx.fill();
      rr(ctx, x - 14 + sway * .3, y - 24, 28, 3, 1); ctx.fill();
      // 头 + 草帽
      ctx.fillStyle = '#e8c88a'; ellipse(ctx, x + sway * .4, y - 48, 10, 9); ctx.fill();
      ctx.fillStyle = '#333'; ellipse(ctx, x - 3 + sway * .4, y - 49, 1.4, 1.6); ctx.fill();
      ellipse(ctx, x + 3 + sway * .4, y - 49, 1.4, 1.6); ctx.fill();
      ctx.strokeStyle = '#c98a5a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x + sway * .4, y - 45, 4, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      ctx.fillStyle = '#f4d35e';
      ctx.beginPath(); ctx.ellipse(x + sway * .4, y - 54, 17, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + sway * .4, y - 57, 9, 7, 0, Math.PI, Math.PI * 2); ctx.fill();
      break;
    }

    case 'christmas': {
      drawShadow(ctx, x, y, 26);
      ctx.fillStyle = '#8a5a2e'; rr(ctx, x - 5, y - 12, 10, 16, 3); ctx.fill();
      const tiers = [[0, -22, 26], [0, -40, 21], [0, -56, 15]];
      ctx.fillStyle = '#2f7d4f';
      tiers.forEach(([dx, dy, w]) => {
        ctx.beginPath();
        ctx.moveTo(x + dx, y + dy - 22); ctx.lineTo(x + dx + w, y + dy); ctx.lineTo(x + dx - w, y + dy);
        ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = '#3f9e63';
      ctx.beginPath(); ctx.moveTo(x, y - 96); ctx.lineTo(x + 8, y - 78); ctx.lineTo(x - 8, y - 78); ctx.closePath(); ctx.fill();
      // 星星
      const tw = 0.8 + Math.sin(t * 4 + phase) * 0.2;
      ctx.fillStyle = `rgba(255,225,90,${tw})`;
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⭐', x, y - 92);
      // 彩灯
      const lc = ['#ff5a5a', '#ffd23e', '#5fa8e8', '#ff8fb0'];
      for (let i = 0; i < 8; i++) {
        const tier = i % 3, row = Math.floor(i / 3);
        const ly = y - 18 - tier * 17 - (i % 2) * 5;
        const lx = x + (row - 1) * 12 + (tier % 2 ? 5 : -5);
        const on = Math.sin(t * 5 + i * 1.7) > 0;
        ctx.fillStyle = on ? lc[i % 4] : 'rgba(255,255,255,.35)';
        ellipse(ctx, lx, ly, 2.6, 2.6); ctx.fill();
      }
      break;
    }

    case 'fountain': {
      drawShadow(ctx, x, y, 40);
      ctx.fillStyle = '#b8bec4'; ellipse(ctx, x, y - 8, 38, 14); ctx.fill();
      ctx.fillStyle = '#9aa0a6'; ellipse(ctx, x, y - 12, 34, 12); ctx.fill();
      ctx.fillStyle = '#5fb8e8'; ellipse(ctx, x, y - 13, 29, 9.5); ctx.fill();
      // 水柱
      const h = 30 + Math.sin(t * 3 + phase) * 4;
      ctx.strokeStyle = 'rgba(190,235,255,.9)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.quadraticCurveTo(x + 3, y - 16 - h * .6, x, y - 16 - h); ctx.stroke();
      ctx.fillStyle = 'rgba(200,240,255,.85)';
      ellipse(ctx, x, y - 16 - h, 5, 4); ctx.fill();
      for (let i = 0; i < 5; i++) {
        const p = ((t * 0.7 + i * 0.2) % 1);
        const side = i % 2 ? 1 : -1;
        ctx.fillStyle = `rgba(200,240,255,${1 - p})`;
        ellipse(ctx, x + side * (8 + p * 22), y - 16 - h * .5 + p * 16, 2.2, 2.2); ctx.fill();
      }
      // 波纹
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        const r = ((t * 12 + i * 16) % 26) + 4;
        ctx.globalAlpha = 1 - r / 30;
        ellipse(ctx, x, y - 13, r, r * .33); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 'windmill': {
      drawShadow(ctx, x, y, 34);
      // 塔身
      ctx.fillStyle = '#f2e6cf';
      ctx.beginPath();
      ctx.moveTo(x - 20, y); ctx.lineTo(x - 12, y - 74); ctx.lineTo(x + 12, y - 74); ctx.lineTo(x + 20, y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d8c9a8'; rr(ctx, x - 22, y - 80, 44, 8, 3); ctx.fill();
      ctx.fillStyle = '#e05252';
      ctx.beginPath(); ctx.moveTo(x - 26, y - 78); ctx.lineTo(x, y - 96); ctx.lineTo(x + 26, y - 78); ctx.closePath(); ctx.fill();
      // 门窗
      ctx.fillStyle = '#a56a35'; rr(ctx, x - 6, y - 20, 12, 20, 3); ctx.fill();
      ctx.fillStyle = '#7cc3e8'; ellipse(ctx, x, y - 58, 5, 5); ctx.fill();
      // 风车叶片（旋转）
      ctx.save();
      ctx.translate(x, y - 68);
      ctx.rotate(t * 0.9);
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate((i / 4) * Math.PI * 2);
        ctx.fillStyle = i % 2 ? '#ffffff' : '#ffd8a8';
        ctx.beginPath();
        ctx.moveTo(0, -6); ctx.lineTo(30, -10); ctx.lineTo(30, 6); ctx.lineTo(0, 6);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#8a5a2e'; ellipse(ctx, 0, 0, 6, 6); ctx.fill();
      ctx.restore();
      break;
    }
  }
}

/* ------------------------------------------------------------
 * 地面物品（带原地休息动画：上下浮动 + 闪光）
 * ---------------------------------------------------------- */
function drawGroundItem(ctx, x, y, icon, t, phase, rec, cp) {
  // 有 emoji 图就直接画图（动画帧 / 呼吸缩放），没有就退回文字 emoji
  if (rec && rec.img) {
    const size = 26;
    const bs = (typeof needsBreath === 'function' && needsBreath(cp)) ? breathScale(t, phase) : 1;
    const bob = Math.sin(t * 2.2 + phase) * 2;
    ctx.save();
    ctx.translate(x, y - 12 + bob);
    if (!drawEmojiFrame(ctx, cp, 0, 0, size, t)) {
      ctx.drawImage(rec.img, -size * bs / 2, -size * bs / 2, size * bs, size * bs);
    }
    ctx.restore();
    drawShadow(ctx, x, y + 2, 10);
    return;
  }

  const bobY = Math.sin(t * 2.5 + phase) * 3;
  drawShadow(ctx, x, y + 4, 8);
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#222'; // 实色，避免继承透明 fillStyle 导致 emoji 变透明
  ctx.fillText(icon, x, y - 8 + bobY);
  const sp = (t * 1.5 + phase) % 2;
  if (sp < 0.6) {
    ctx.fillStyle = `rgba(255,255,180,${0.9 - sp})`;
    ctx.font = `${10 + sp * 6}px sans-serif`;
    ctx.fillText('✨', x + 10, y - 16 + bobY);
  }
  ctx.textBaseline = 'alphabetic';
}

/* ------------------------------------------------------------
 * 小草 & 花（风摆动画）
 * ---------------------------------------------------------- */
function drawGrassTuft(ctx, x, y, t, phase) {
  const sway = Math.sin(t * 1.8 + phase) * 2.5;
  ctx.strokeStyle = '#6dbb5d'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 2, y - 6, x - 3 + sway, y - 10);
  ctx.moveTo(x, y); ctx.quadraticCurveTo(x, y - 7, x + sway, y - 12);
  ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y - 6, x + 3 + sway, y - 9);
  ctx.stroke();
}

function drawFlower(ctx, x, y, t, phase, color) {
  const sway = Math.sin(t * 1.8 + phase) * 2;
  ctx.strokeStyle = '#5da84d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sway * 0.5, y - 6, x + sway, y - 11); ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + phase;
    ellipse(ctx, x + sway + Math.cos(a) * 3.4, y - 13 + Math.sin(a) * 3.4, 2.4, 2.4);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd23e';
  ellipse(ctx, x + sway, y - 13, 2.4, 2.4); ctx.fill();
}

/* ------------------------------------------------------------
 * 天气效果
 * ---------------------------------------------------------- */
function drawSun(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.15);
  ctx.strokeStyle = 'rgba(255,200,60,.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
    ctx.lineTo(Math.cos(a) * (34 + Math.sin(t * 3 + i) * 3), Math.sin(a) * (34 + Math.sin(t * 3 + i) * 3));
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#ffdd55';
  ellipse(ctx, x, y, 22, 22); ctx.fill();
  ctx.fillStyle = '#ff9f43';
  ellipse(ctx, x - 7, y - 2, 2.5, 3); ctx.fill();
  ellipse(ctx, x + 7, y - 2, 2.5, 3); ctx.fill();
  ctx.strokeStyle = '#ff9f43'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y + 3, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
}

function drawCloud(ctx, x, y, s, alpha) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ellipse(ctx, x, y, 26 * s, 15 * s); ctx.fill();
  ellipse(ctx, x - 20 * s, y + 4 * s, 17 * s, 11 * s); ctx.fill();
  ellipse(ctx, x + 20 * s, y + 4 * s, 17 * s, 11 * s); ctx.fill();
}

/* ------------------------------------------------------------
 * 森林（农场右上角的树林）：地面 + 大树 + 蜂巢 + 林间小物
 * ---------------------------------------------------------- */
/* ------------------------------------------------------------
 * 留给小朋友摆装饰的空地（浅色草坪 + 暖色点线边）：
 * 房子排成四排，中间特意留出这几块地方，买好装饰走过去按 E 就能放下
 * ---------------------------------------------------------- */
function drawDecorPatches(ctx, t) {
  if (typeof DECOR_PATCHES === 'undefined' || !DECOR_PATCHES) return;
  for (const p of DECOR_PATCHES) {
    const g = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    g.addColorStop(0, 'rgba(226,246,178,.55)');
    g.addColorStop(1, 'rgba(198,236,158,.40)');
    ctx.fillStyle = g;
    rr(ctx, p.x, p.y, p.w, p.h, 40); ctx.fill();
    ctx.save();
    ctx.setLineDash([3, 9]);
    ctx.lineCap = 'round';
    ctx.lineDashOffset = -(t * 7) % 12;
    ctx.strokeStyle = 'rgba(255,246,205,.85)';
    ctx.lineWidth = 3;
    rr(ctx, p.x + 5, p.y + 5, p.w - 10, p.h - 10, 36); ctx.stroke();
    ctx.restore();
    // 四个角上点几朵小花，一眼看出是「留给装饰的草地」
    const flowers = [[0.16, 0.13], [0.84, 0.15], [0.18, 0.87], [0.82, 0.86]];
    for (let i = 0; i < flowers.length; i++) {
      const fx = p.x + p.w * flowers[i][0], fy = p.y + p.h * flowers[i][1];
      const bob = Math.sin(t * 1.6 + i * 1.7) * 1.2;
      ctx.fillStyle = ['#ffb3c9', '#ffe08a', '#c8a8f0', '#fff'][i % 4];
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2;
        ellipse(ctx, fx + Math.cos(a) * 3.4, fy + bob + Math.sin(a) * 3.4, 2.4, 2.4); ctx.fill();
      }
      ctx.fillStyle = '#ffd23e';
      ellipse(ctx, fx, fy + bob, 1.8, 1.8); ctx.fill();
    }
  }
}

/* ------------------------------------------------------------
 * 右下角的大海：从大海水蓝洞连到地图的右下角，看起来是通到外面的海
 * 岸线是 SEA_POLY 里那串点（game.js），这里负责画沙滩、海水、浪花
 * ---------------------------------------------------------- */
function seaOutline(ctx, count, dx, dy) {
  if (typeof SEA_POLY === 'undefined' || !SEA_POLY) return false;
  dx = dx || 0; dy = dy || 0;
  ctx.beginPath();
  ctx.moveTo(SEA_POLY[0].x + dx, SEA_POLY[0].y + dy);
  const n = count || SEA_POLY.length;
  for (let i = 1; i < n; i++) ctx.lineTo(SEA_POLY[i].x + dx, SEA_POLY[i].y + dy);
  if (n >= SEA_POLY.length) ctx.closePath();
  return true;
}
function drawSea(ctx, t) {
  if (typeof SEA_POLY === 'undefined' || !SEA_POLY) return;
  const coast = SEA_POLY.length - 1;          // 最后两个点是地图角，不算岸线
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // ① 沙滩（沿着岸线铺一条沙色带，一半会被海水盖住）
  ctx.strokeStyle = '#f0dfb4'; ctx.lineWidth = 40;
  if (seaOutline(ctx, coast)) ctx.stroke();
  // ② 海水
  const g = ctx.createLinearGradient(1500, 1040, 1880, 1460);
  g.addColorStop(0, '#8adcf7');
  g.addColorStop(0.35, '#4fb2ea');
  g.addColorStop(1, '#1668b8');
  ctx.fillStyle = g;
  seaOutline(ctx); ctx.fill();
  // ③ 靠岸的浅水带
  ctx.strokeStyle = 'rgba(190,240,255,.75)'; ctx.lineWidth = 30;
  if (seaOutline(ctx, coast)) ctx.stroke();
  // ④ 一道道滚上来的浪花
  for (let i = 0; i < 2; i++) {
    const ph = (t * 0.55 + i * 0.5) % 1;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.85 - ph * 0.7) + ')';
    ctx.lineWidth = 5 + i;
    if (seaOutline(ctx, coast, -ph * 26, -ph * 26)) ctx.stroke();
  }
  // ⑤ 海面上的小闪光和波纹
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 26; i++) {
    const px = 1500 + ((i * 137) % 420);
    const py = 1080 + ((i * 211) % 370);
    if (typeof pointInSea === 'function' && !pointInSea(px, py)) continue;
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
    ellipse(ctx, px, py, 3 + tw * 3, 1.4 + tw * 1.2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const px = 1520 + ((i * 173) % 380);
    const py = 1120 + ((i * 149) % 320) + Math.sin(t * 0.8 + i) * 4;
    if (typeof pointInSea === 'function' && !pointInSea(px, py)) continue;
    ctx.beginPath();
    ctx.moveTo(px - 16, py); ctx.quadraticCurveTo(px, py - 5, px + 16, py);
    ctx.stroke();
  }
  ctx.restore();
}

function drawForestGround(ctx, t) {
  // 森林范围（和 game.js 里的 FOREST 保持一致，这里写成常量避免依赖加载顺序）
  const F = { x: 30, y: 500, w: 400, h: 830 };
  if (typeof FOREST !== 'undefined' && FOREST) { F.x = FOREST.x; F.y = FOREST.y; F.w = FOREST.w; F.h = FOREST.h; }
  const x0 = F.x, y0 = F.y, w = F.w, h = F.h;
  // 林间草地：颜色更深一点的绿
  const g = ctx.createLinearGradient(x0, y0, x0, y0 + h);
  g.addColorStop(0, 'rgba(72,138,74,.55)');
  g.addColorStop(1, 'rgba(96,160,86,.34)');
  ctx.fillStyle = g;
  rr(ctx, x0, y0, w, h, 46); ctx.fill();
  // 边缘的深色描边，像树荫
  ctx.strokeStyle = 'rgba(56,110,58,.35)'; ctx.lineWidth = 6;
  rr(ctx, x0 + 3, y0 + 3, w - 6, h - 6, 44); ctx.stroke();
  // 地面上的小草点（固定用伪随机，不会闪）
  ctx.fillStyle = 'rgba(60,124,62,.28)';
  for (let i = 0; i < 90; i++) {
    const px = x0 + ((i * 61) % w), py = y0 + ((i * 137) % h);
    ellipse(ctx, px, py, 2.4, 1.4); ctx.fill();
  }
  // 树荫光斑（慢慢晃）
  ctx.fillStyle = 'rgba(255,255,200,.10)';
  for (let i = 0; i < 7; i++) {
    const px = x0 + 40 + ((i * 97) % (w - 80)) + Math.sin(t * 0.4 + i) * 6;
    const py = y0 + 30 + ((i * 71) % (h - 60));
    ellipse(ctx, px, py, 22, 8); ctx.fill();
  }
  // 树冠在森林上边缘投下的一片深绿
  ctx.fillStyle = 'rgba(46,102,50,.30)';
  for (let i = 0; i < 9; i++) {
    const px = x0 + 30 + i * (w / 8.5), s = 34 + (i % 3) * 8;
    ellipse(ctx, px, y0 + 12 + Math.sin(t * 0.6 + i) * 3, s, s * 0.52); ctx.fill();
  }
}

// 森林里的大树（pine = 松树 / big = 蜂巢所在的那棵阔叶树）
function drawForestTree(ctx, x, y, t, phase, kind) {
  const sway = Math.sin(t * 1.1 + phase) * 2.2;
  if (kind === 'pine') {
    drawShadow(ctx, x, y + 2, 26);
    ctx.fillStyle = '#7a5230';
    rr(ctx, x - 6, y - 24, 12, 26, 3); ctx.fill();
    const tiers = [[0, -18, 42], [0, -52, 34], [0, -80, 25]];
    ctx.fillStyle = '#2f7d4f';
    tiers.forEach(([dx, dy, w], i) => {
      ctx.beginPath();
      ctx.moveTo(x + dx + sway * (0.4 + i * 0.2), y + dy - 34);
      ctx.lineTo(x + dx + w, y + dy);
      ctx.lineTo(x + dx - w, y + dy);
      ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = '#3f9e63';
    tiers.forEach(([dx, dy, w], i) => {
      ctx.beginPath();
      ctx.moveTo(x + dx + sway * (0.4 + i * 0.2), y + dy - 34);
      ctx.lineTo(x + dx + w * 0.5, y + dy - 4);
      ctx.lineTo(x + dx - w * 0.2, y + dy - 6);
      ctx.closePath(); ctx.fill();
    });
  } else {
    // 阔叶大树：树干很粗，蜂巢就挂在伸出来的枝丫下面
    drawShadow(ctx, x, y + 3, 34);
    ctx.fillStyle = '#7a5230';
    rr(ctx, x - 11, y - 60, 22, 62, 7); ctx.fill();
    ctx.fillStyle = '#8d6238';
    rr(ctx, x - 5, y - 58, 8, 60, 4); ctx.fill();
    // 伸向左边的大枝丫：梢头正好在蜂巢吊绳的正上方
    // （蜂巢在世界坐标 x=390, y=524；这棵树在 x=390, y=600）
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 56);
    ctx.quadraticCurveTo(x - 14, y - 62, x - 16, y - 62);
    ctx.stroke();
    // 树冠
    ctx.fillStyle = '#4aa457';
    ellipse(ctx, x - 22 + sway, y - 74, 30, 24); ctx.fill();
    ellipse(ctx, x + 24 + sway, y - 76, 30, 24); ctx.fill();
    ellipse(ctx, x + sway, y - 96, 38, 28); ctx.fill();
    ctx.fillStyle = '#5fbf68';
    ellipse(ctx, x - 10 + sway, y - 92, 18, 13); ctx.fill();
    ellipse(ctx, x + 16 + sway, y - 84, 14, 10); ctx.fill();
  }
}

// 蜂巢（挂在树上，有蜂蜜时亮晶晶，还有小蜜蜂飞来飞去）
function drawBeehive(ctx, x, y, t, hasHoney) {
  const sway = Math.sin(t * 0.9) * 2.5;
  // 吊绳：从枝丫梢头（大约 y-62 处）垂下来
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 16 * 0.1 - sway * 0.2, y - 62);
  ctx.quadraticCurveTo(x + sway * 0.5, y - 44, x + sway, y - 18);
  ctx.stroke();
  ctx.save();
  ctx.translate(x + sway, y);
  ctx.rotate(Math.sin(t * 0.9) * 0.05);
  // 一层层的蜂巢
  const layers = [[0, -16, 20], [0, -4, 24], [0, 8, 21], [0, 18, 15]];
  layers.forEach(function (L, i) {
    ctx.fillStyle = i % 2 ? '#e8a33a' : '#f0b455';
    ellipse(ctx, L[0], L[1], L[2], 9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ellipse(ctx, L[0] - L[2] * 0.3, L[1] - 2, L[2] * 0.4, 3); ctx.fill();
  });
  // 出入口
  ctx.fillStyle = '#7a4a12';
  ellipse(ctx, 0, 12, 4.5, 4); ctx.fill();
  // 有蜂蜜时：门口滴着蜂蜜 + 闪光
  if (hasHoney) {
    ctx.fillStyle = '#ffc93c';
    ellipse(ctx, 0, 18, 3.4, 4.4); ctx.fill();
    const tw = 0.5 + Math.sin(t * 4) * 0.5;
    ctx.fillStyle = 'rgba(255,245,170,' + (0.45 + tw * 0.5) + ')';
    ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('✨', 13, -12 + Math.sin(t * 3) * 2);
  }
  ctx.restore();
  // 小蜜蜂绕着蜂巢飞
  for (let i = 0; i < 3; i++) {
    const a = t * (1.1 + i * 0.25) + i * 2.1;
    const bx = x + sway + Math.cos(a) * (24 + i * 7);
    const by = y - 6 + Math.sin(a * 1.7) * (12 + i * 4);
    ctx.save();
    ctx.translate(bx, by);
    ctx.fillStyle = '#ffd23e';
    ellipse(ctx, 0, 0, 3.2, 2.4); ctx.fill();
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(-1.4, -1.2, 1.2, 2.4);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1;
    const wf = Math.sin(t * 26 + i) * 2;
    ctx.beginPath(); ctx.moveTo(0, -1.6); ctx.lineTo(-2.6, -4 - wf); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -1.6); ctx.lineTo(2.6, -4 - wf); ctx.stroke();
    ctx.restore();
  }
}

// 林间小物：蘑菇 / 树桩 / 灌木
function drawForestDecor(ctx, kind, x, y, t, phase) {
  if (kind === 'mushroom') {
    drawShadow(ctx, x, y, 8);
    const bob = Math.sin(t * 2 + phase) * 1;
    ctx.fillStyle = '#fff2e0'; rr(ctx, x - 3, y - 11, 6, 11, 2); ctx.fill();
    ctx.fillStyle = '#e05252';
    ctx.beginPath(); ctx.ellipse(x, y - 11 + bob, 10, 6.5, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ellipse(ctx, x - 4, y - 13 + bob, 2, 1.6); ctx.fill();
    ellipse(ctx, x + 3.5, y - 14.5 + bob, 1.6, 1.3); ctx.fill();
  } else if (kind === 'stump') {
    drawShadow(ctx, x, y, 13);
    ctx.fillStyle = '#8a5f36'; rr(ctx, x - 11, y - 16, 22, 17, 4); ctx.fill();
    ctx.fillStyle = '#c9a06a'; ellipse(ctx, x, y - 16, 11, 5); ctx.fill();
    ctx.strokeStyle = '#a57c4a'; ctx.lineWidth = 1.4;
    ellipse(ctx, x, y - 16, 6, 2.8); ctx.stroke();
    ctx.fillStyle = '#5fbf68';
    ellipse(ctx, x + 7, y - 14, 4, 2.4); ctx.fill();
  } else {   // bush
    drawShadow(ctx, x, y, 16);
    const sway = Math.sin(t * 1.4 + phase) * 1.4;
    ctx.fillStyle = '#3f9e63';
    ellipse(ctx, x - 8 + sway, y - 10, 11, 9); ctx.fill();
    ellipse(ctx, x + 8 + sway, y - 10, 11, 9); ctx.fill();
    ellipse(ctx, x + sway, y - 16, 13, 11); ctx.fill();
    ctx.fillStyle = '#5fbf68';
    ellipse(ctx, x - 4 + sway, y - 18, 6, 4.5); ctx.fill();
    // 小野果
    ctx.fillStyle = '#ff5a5a';
    ellipse(ctx, x + 6 + sway, y - 12, 2, 2); ctx.fill();
    ellipse(ctx, x - 9 + sway, y - 8, 2, 2); ctx.fill();
  }
}

/* ------------------------------------------------------------
 * 食槽（每天放饲料，动物才有产出；连续 3 天没放会饿跑）
 * ---------------------------------------------------------- */
function drawTrough(ctx, x, y, t, feed, max, hungry) {
  max = max || 15;
  feed = feed || 0;
  const full = feed / max;
  drawShadow(ctx, x, y + 1, 26);
  // 木槽
  ctx.fillStyle = '#b8905e';
  rr(ctx, x - 25, y - 16, 50, 17, 4); ctx.fill();
  ctx.fillStyle = '#a57c4a';
  rr(ctx, x - 25, y - 4, 50, 5, 2); ctx.fill();
  rr(ctx, x - 28, y - 20, 6, 22, 2); ctx.fill();
  rr(ctx, x + 22, y - 20, 6, 22, 2); ctx.fill();
  // 槽里的饲料（按剩余量决定高度）
  if (feed > 0) {
    const h = 3 + full * 9;
    ctx.fillStyle = '#f4d35e';
    rr(ctx, x - 20, y - 6 - h, 40, h, 3); ctx.fill();
    // 谷粒
    ctx.fillStyle = '#e0b53c';
    for (let i = 0; i < 7; i++) {
      const gx = x - 16 + ((i * 11) % 34);
      const gy = y - 8 - ((i * 7) % Math.max(2, h - 2));
      ellipse(ctx, gx, gy, 1.6, 1.1); ctx.fill();
    }
  }
  // 剩余份数小牌子
  ctx.fillStyle = '#fff8e6';
  rr(ctx, x - 15, y - 40, 30, 17, 5); ctx.fill();
  ctx.strokeStyle = hungry ? '#e05252' : '#d9a62e'; ctx.lineWidth = 2;
  rr(ctx, x - 15, y - 40, 30, 17, 5); ctx.stroke();
  ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = hungry ? '#c0392b' : '#7a4a12';
  ctx.fillText('🌾' + feed, x, y - 27);
  // 没饲料了：冒感叹号提醒
  if (hungry) {
    const b = Math.sin(t * 5) * 3;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ff3a3a';
    ctx.fillText('❗', x + 22, y - 40 + b);
  }
}

/* ------------------------------------------------------------
 * 鸡棚里的孵蛋器（放鸡蛋进去，15 天长出小鸡）
 * ---------------------------------------------------------- */
function drawHatchery(ctx, x, y, t, eggs) {
  eggs = eggs || [];
  drawShadow(ctx, x, y + 2, 32);
  // 木箱
  ctx.fillStyle = '#e8c88a';
  rr(ctx, x - 30, y - 34, 60, 36, 6); ctx.fill();
  ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(x - 30, y - 34 + i * 9); ctx.lineTo(x + 30, y - 34 + i * 9); ctx.stroke();
  }
  // 玻璃罩
  ctx.fillStyle = 'rgba(200,235,255,.72)';
  rr(ctx, x - 21, y - 30, 42, 22, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
  rr(ctx, x - 21, y - 30, 42, 22, 5); ctx.stroke();
  // 里面的鸡蛋（有几个画几个，最多画 6 个）
  const n = Math.min(eggs.length, 6);
  for (let i = 0; i < n; i++) {
    const ex = x - 15 + (i % 3) * 15;
    const ey = y - 24 + Math.floor(i / 3) * 9;
    const wob = Math.sin(t * 3 + i * 1.3) * 0.8;
    ctx.fillStyle = '#fff8ee';
    ellipse(ctx, ex + wob, ey, 5, 6.2); ctx.fill();
    ctx.fillStyle = 'rgba(220,200,160,.5)';
    ellipse(ctx, ex + wob - 1, ey + 2, 2.4, 3); ctx.fill();
  }
  if (!n) {
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ellipse(ctx, x, y - 20, 12, 6); ctx.fill();
  }
  // 小烟囱（冒热气，像在孵蛋）
  ctx.fillStyle = '#c9a86a';
  rr(ctx, x + 22, y - 46, 6, 14, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    const sy = y - 48 - ((t * 14 + i * 15) % 26);
    ctx.beginPath();
    ctx.moveTo(x + 25, sy);
    ctx.quadraticCurveTo(x + 28, sy - 4, x + 25, sy - 8);
    ctx.stroke();
  }
  // 招牌
  ctx.fillStyle = '#fff3d6';
  rr(ctx, x - 30, y - 58, 60, 20, 6); ctx.fill();
  ctx.strokeStyle = '#d9a62e'; ctx.lineWidth = 2;
  rr(ctx, x - 30, y - 58, 60, 20, 6); ctx.stroke();
  ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#7a4a12';
  ctx.fillText('🐣 ' + eggs.length, x, y - 44);
  // 鸡蛋还没孵好时，头上飘一个小闹钟
  if (eggs.length) {
    ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.7 + Math.sin(t * 2) * 0.3;
    ctx.fillText('⏳', x - 16, y - 62);
    ctx.globalAlpha = 1;
  }
}
