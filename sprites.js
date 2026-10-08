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
function drawShadow(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ellipse(ctx, x, y, w, w * 0.35);
  ctx.fill();
}

/* ------------------------------------------------------------
 * 纸娃娃数据：帽子 / 上衣 / 裤子
 * ---------------------------------------------------------- */
const OUTFITS = {
  hat: {
    none:   { name: '不戴帽子', icon: '🚫', price: 0 },
    ragged: { name: '破帽子',   icon: '🧢', price: 0 },
    straw:  { name: '草帽',     icon: '👒', price: 30 },
    bow:    { name: '蝴蝶结',   icon: '🎀', price: 50 },
    crown:  { name: '小皇冠',   icon: '👑', price: 120 },
  },
  shirt: {
    ragged:   { name: '破衣服',     icon: '👕', price: 0 },
    overalls: { name: '蓝色背带装', icon: '🩵', price: 60 },
    dress:    { name: '粉色裙子',   icon: '👗', price: 80 },
    star:     { name: '星星T恤',    icon: '⭐', price: 100 },
  },
  pants: {
    ragged: { name: '破裤子', icon: '👖', price: 0 },
    jeans:  { name: '牛仔裤', icon: '💙', price: 40 },
    shorts: { name: '红短裤', icon: '🩳', price: 40 },
  },
};

const SHIRT_COLORS = {
  ragged:   { main: '#9a938a', patch: '#6e675f' },
  overalls: { main: '#4d8fd6', patch: '#2f6bb0' },
  dress:    { main: '#ff9fc0', patch: '#ff6fa5' },
  star:     { main: '#fff2f2', patch: '#ffd23e' },
};
const PANTS_COLORS = {
  ragged: { main: '#8a8378', patch: '#5f594f' },
  jeans:  { main: '#3f6fb5', patch: '#2c4f86' },
  shorts: { main: '#e05252', patch: '#b03636' },
};

/* ------------------------------------------------------------
 * 画小农夫（男孩 / 女孩，可换装，带走路与动作动画）
 * ---------------------------------------------------------- */
function drawPlayer(ctx, x, y, o) {
  // o: {gender, dir, walkPhase, moving, outfit, actionT, t}
  const bob = o.moving ? Math.abs(Math.sin(o.walkPhase)) * 3 : Math.sin(o.t * 2) * 1.2;
  const swing = o.moving ? Math.sin(o.walkPhase) * 6 : 0;
  const yy = y - bob;
  const dirX = o.dir === 'left' ? -1 : 1;   // 左右镜像
  const skin = '#ffdbac';
  const shirt = SHIRT_COLORS[o.outfit.shirt] || SHIRT_COLORS.ragged;
  const pants = PANTS_COLORS[o.outfit.pants] || PANTS_COLORS.ragged;

  ctx.save();
  ctx.translate(x, yy);
  if (o.dir === 'left' || o.dir === 'right') ctx.scale(dirX, 1);

  drawShadow(ctx, 0, bob, 15);

  // --- 腿（裤子层） ---
  ctx.fillStyle = pants.main;
  rr(ctx, -9 + swing * 0.5, 2, 8, 15, 3); ctx.fill();
  rr(ctx, 1 - swing * 0.5, 2, 8, 15, 3); ctx.fill();
  if (o.outfit.pants === 'ragged') { // 破洞补丁
    ctx.fillStyle = pants.patch;
    rr(ctx, -8 + swing * 0.5, 8, 4, 4, 1); ctx.fill();
  }
  // 鞋子
  ctx.fillStyle = '#7a5230';
  rr(ctx, -10 + swing * 0.6, 15, 9, 5, 2); ctx.fill();
  rr(ctx, 1 - swing * 0.6, 15, 9, 5, 2); ctx.fill();

  // --- 身体（上衣层） ---
  ctx.fillStyle = shirt.main;
  if (o.outfit.shirt === 'dress') {
    ctx.beginPath();
    ctx.moveTo(-11, -16); ctx.lineTo(11, -16);
    ctx.lineTo(15, 6); ctx.lineTo(-15, 6); ctx.closePath(); ctx.fill();
  } else {
    rr(ctx, -11, -16, 22, 21, 6); ctx.fill();
  }
  if (o.outfit.shirt === 'ragged') { // 破补丁
    ctx.fillStyle = shirt.patch;
    rr(ctx, -8, -10, 6, 6, 1); ctx.fill();
    rr(ctx, 3, -2, 5, 5, 1); ctx.fill();
  }
  if (o.outfit.shirt === 'star') { // 胸前星星
    ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⭐', 0, -3);
  }
  if (o.outfit.shirt === 'overalls') { // 背带
    ctx.strokeStyle = shirt.patch; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-7, -15); ctx.lineTo(-7, 4);
    ctx.moveTo(7, -15); ctx.lineTo(7, 4); ctx.stroke();
  }

  // --- 手臂（动作时举起来） ---
  const armRaise = o.actionT > 0 ? Math.sin(o.actionT * 10) * 10 + 12 : 0;
  ctx.strokeStyle = shirt.main; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-11, -11); ctx.lineTo(-16, -2 + swing * 0.4 - armRaise);
  ctx.moveTo(11, -11); ctx.lineTo(16, -2 - swing * 0.4 - armRaise);
  ctx.stroke();
  // 手
  ctx.fillStyle = skin;
  ellipse(ctx, -16, -2 + swing * 0.4 - armRaise, 3.2, 3.2); ctx.fill();
  ellipse(ctx, 16, -2 - swing * 0.4 - armRaise, 3.2, 3.2); ctx.fill();

  // --- 头 ---
  ctx.fillStyle = skin;
  ellipse(ctx, 0, -27, 11, 10.5); ctx.fill();

  // --- 头发（男/女不同） ---
  ctx.fillStyle = o.gender === 'boy' ? '#5a3a1e' : '#6b4226';
  if (o.gender === 'boy') {
    ctx.beginPath();
    ctx.ellipse(0, -31, 11, 7, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    rr(ctx, -11, -32, 22, 5, 2); ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, -31, 11.5, 7.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // 双马尾
    ellipse(ctx, -12, -24, 4, 7); ctx.fill();
    ellipse(ctx, 12, -24, 4, 7); ctx.fill();
    ctx.fillStyle = '#ff6b8a';
    ellipse(ctx, -12, -30, 2.2, 2.2); ctx.fill();
    ellipse(ctx, 12, -30, 2.2, 2.2); ctx.fill();
  }

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
  // 腮红 + 微笑
  ctx.fillStyle = 'rgba(255,120,120,.5)';
  ellipse(ctx, -7.5, -24.5, 2, 1.4); ctx.fill();
  ellipse(ctx, 7.5, -24.5, 2, 1.4); ctx.fill();
  ctx.strokeStyle = '#b5673a'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, -24, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

  // --- 帽子层 ---
  drawHat(ctx, o.outfit.hat, o.t);

  ctx.restore();
}

function drawHat(ctx, hat, t) {
  const flop = Math.sin(t * 2) * 1;
  if (hat === 'ragged') { // 破帽子：灰褐色软帽 + 补丁
    ctx.fillStyle = '#8f8578';
    ctx.beginPath(); ctx.ellipse(0, -34, 13, 5.5, 0, Math.PI, Math.PI * 2); ctx.fill();
    rr(ctx, -14, -35, 28, 3.5, 2); ctx.fill();
    ctx.fillStyle = '#6e675f';
    rr(ctx, 4, -37.5, 5, 4, 1); ctx.fill(); // 补丁
  } else if (hat === 'straw') {
    ctx.fillStyle = '#f4d35e';
    ctx.beginPath(); ctx.ellipse(0, -33.5, 16, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -35.5, 9, 6, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9a62e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, -34.5); ctx.lineTo(9, -34.5); ctx.stroke();
  } else if (hat === 'bow') {
    ctx.fillStyle = '#ff6fa5';
    ctx.save(); ctx.translate(-3, -37 + flop);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -4); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill();
    ellipse(ctx, 0, 0, 2.4, 2.4); ctx.fill();
    ctx.restore();
  } else if (hat === 'crown') {
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(-8, -34); ctx.lineTo(-8, -40); ctx.lineTo(-4, -36.5);
    ctx.lineTo(0, -42); ctx.lineTo(4, -36.5); ctx.lineTo(8, -40);
    ctx.lineTo(8, -34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff6b8a'; ellipse(ctx, 0, -37.5, 1.6, 1.6); ctx.fill();
  }
}

/* ------------------------------------------------------------
 * 动物们（全部带呼吸/走动/小动作动画）
 * ---------------------------------------------------------- */
function drawChicken(ctx, x, y, a) {
  // a: {t, phase, dir, moving, walkPhase, peck}
  const hop = a.moving ? Math.abs(Math.sin(a.walkPhase)) * 4 : 0;
  const bob = Math.sin(a.t * 3 + a.phase) * 1;
  ctx.save();
  ctx.translate(x, y - hop);
  if (a.dir === 'left') ctx.scale(-1, 1);
  drawShadow(ctx, 0, hop, 9);
  // 腿
  const step = a.moving ? Math.sin(a.walkPhase) * 3 : 0;
  ctx.strokeStyle = '#e8930c'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, 4); ctx.lineTo(-2 + step, 9);
  ctx.moveTo(2, 4); ctx.lineTo(2 - step, 9);
  ctx.stroke();
  // 身体
  ctx.fillStyle = '#fff8ee';
  ellipse(ctx, 0, -2 + bob, 10, 8.5); ctx.fill();
  // 翅膀（拍打）
  const flap = a.moving ? Math.sin(a.walkPhase * 2) * 3 : Math.sin(a.t * 2 + a.phase) * 1.5;
  ctx.fillStyle = '#f2e6d2';
  ellipse(ctx, -2, -3 + bob + flap * 0.3, 6, 4.5); ctx.fill();
  // 头（啄米时下低）
  const peckD = a.peck > 0 ? Math.sin(a.peck * Math.PI) * 6 : 0;
  ctx.fillStyle = '#fff8ee';
  ellipse(ctx, 7, -9 + bob + peckD, 5.5, 5); ctx.fill();
  // 鸡冠
  ctx.fillStyle = '#ff5a5a';
  ellipse(ctx, 5.5, -14.5 + bob + peckD, 2, 2.4); ctx.fill();
  ellipse(ctx, 8.5, -14.5 + bob + peckD, 2, 2.4); ctx.fill();
  // 眼睛 & 嘴
  ctx.fillStyle = '#333';
  ellipse(ctx, 8.5, -10 + bob + peckD, 1.1, 1.3); ctx.fill();
  ctx.fillStyle = '#ffb020';
  ctx.beginPath();
  ctx.moveTo(11.5, -8.5 + bob + peckD);
  ctx.lineTo(15, -7.5 + bob + peckD);
  ctx.lineTo(11.5, -6.5 + bob + peckD);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawSheep(ctx, x, y, a) {
  // a: {t, phase, dir, moving, walkPhase, wool(0-1)}
  const bob = a.moving ? Math.abs(Math.sin(a.walkPhase)) * 2.5 : Math.sin(a.t * 2 + a.phase) * 1;
  ctx.save();
  ctx.translate(x, y - bob);
  if (a.dir === 'left') ctx.scale(-1, 1);
  drawShadow(ctx, 0, bob, 14);
  // 腿
  const step = a.moving ? Math.sin(a.walkPhase) * 4 : 0;
  ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, 4); ctx.lineTo(-8 + step, 13);
  ctx.moveTo(8, 4); ctx.lineTo(8 - step, 13);
  ctx.moveTo(-3, 5); ctx.lineTo(-3 - step, 14);
  ctx.moveTo(3, 5); ctx.lineTo(3 + step, 14);
  ctx.stroke();
  // 身体（有羊毛=蓬松云朵，剪过=光滑粉色）
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
  // 头
  ctx.fillStyle = '#4a4a4a';
  ellipse(ctx, 13, -6 + bob * 0.4, 5.5, 5); ctx.fill();
  // 耳朵（抖动）
  const earW = Math.sin(a.t * 4 + a.phase) * 1.5;
  ellipse(ctx, 11, -11 + earW * 0.3, 2.6, 1.6); ctx.fill();
  // 眼睛
  ctx.fillStyle = '#fff'; ellipse(ctx, 14.5, -7, 1.8, 1.8); ctx.fill();
  ctx.fillStyle = '#333'; ellipse(ctx, 15, -7, 0.9, 0.9); ctx.fill();
  ctx.restore();
}

function drawCow(ctx, x, y, a) {
  const bob = a.moving ? Math.abs(Math.sin(a.walkPhase)) * 2 : Math.sin(a.t * 1.8 + a.phase) * 1;
  ctx.save();
  ctx.translate(x, y - bob);
  if (a.dir === 'left') ctx.scale(-1, 1);
  drawShadow(ctx, 0, bob, 19);
  // 腿
  const step = a.moving ? Math.sin(a.walkPhase) * 4 : 0;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-13, 4); ctx.lineTo(-13 + step, 17);
  ctx.moveTo(13, 4); ctx.lineTo(13 - step, 17);
  ctx.moveTo(-5, 6); ctx.lineTo(-5 - step, 18);
  ctx.moveTo(5, 6); ctx.lineTo(5 + step, 18);
  ctx.stroke();
  // 身体
  ctx.fillStyle = '#fff';
  rr(ctx, -19, -14, 36, 20, 9); ctx.fill();
  // 棕色斑块
  ctx.fillStyle = '#b07b4f';
  ellipse(ctx, -8, -7, 6, 5); ctx.fill();
  ellipse(ctx, 8, -9, 5, 4); ctx.fill();
  // 尾巴（摇摆）
  const tail = Math.sin(a.t * 3 + a.phase) * 6;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-19, -10); ctx.quadraticCurveTo(-26, 0, -23 + tail, 8); ctx.stroke();
  ctx.fillStyle = '#b07b4f'; ellipse(ctx, -23 + tail, 9, 2.5, 3); ctx.fill();
  // 乳房（粉色，可挤奶标志）
  ctx.fillStyle = '#ffb6c9'; ellipse(ctx, 3, 6, 5, 3.5); ctx.fill();
  // 头（咀嚼动画：上下微动）
  const chew = Math.sin(a.t * 5 + a.phase) * 1;
  ctx.fillStyle = '#fff';
  ellipse(ctx, 22, -12 + chew * 0.3, 8, 7.5); ctx.fill();
  // 鼻子
  ctx.fillStyle = '#ffc4d0';
  ellipse(ctx, 27, -8 + chew * 0.5, 5, 4); ctx.fill();
  ctx.fillStyle = '#d98a9a';
  ellipse(ctx, 25.5, -8 + chew * 0.5, 0.9, 0.9); ctx.fill();
  ellipse(ctx, 28.5, -8 + chew * 0.5, 0.9, 0.9); ctx.fill();
  // 角 & 耳
  ctx.fillStyle = '#e8d9b0';
  ellipse(ctx, 18, -19, 2, 3); ctx.fill();
  ctx.fillStyle = '#fff';
  ellipse(ctx, 16, -13, 3, 2); ctx.fill();
  // 眼睛
  ctx.fillStyle = '#333'; ellipse(ctx, 21, -13.5, 1.4, 1.7); ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------
 * 宠物（小狗 / 小猫，跟随，可戴帽）
 * ---------------------------------------------------------- */
function drawPet(ctx, x, y, p) {
  // p: {type, t, phase, dir, moving, walkPhase, hat, happy}
  const hop = p.moving ? Math.abs(Math.sin(p.walkPhase)) * 5 : Math.sin(p.t * 3 + p.phase) * 1.5;
  ctx.save();
  ctx.translate(x, y - hop);
  if (p.dir === 'left') ctx.scale(-1, 1);
  drawShadow(ctx, 0, hop, 9);

  const body = p.type === 'dog' ? '#e8b36a' : '#b8b8c8';
  const dark = p.type === 'dog' ? '#c78f3f' : '#8a8a9e';
  // 腿
  const step = p.moving ? Math.sin(p.walkPhase) * 3.5 : 0;
  ctx.strokeStyle = body; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, 2); ctx.lineTo(-5 + step, 8);
  ctx.moveTo(5, 2); ctx.lineTo(5 - step, 8);
  ctx.stroke();
  // 尾巴（开心摇尾巴）
  const wag = Math.sin(p.t * (p.happy > 0 ? 14 : 5) + p.phase) * (p.happy > 0 ? 8 : 4);
  ctx.strokeStyle = dark; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-8, -4); ctx.quadraticCurveTo(-13, -8, -12 + wag, -11); ctx.stroke();
  // 身体
  ctx.fillStyle = body;
  ellipse(ctx, 0, -2, 9, 7); ctx.fill();
  // 头
  ellipse(ctx, 7, -8, 6, 5.5); ctx.fill();
  // 耳朵
  if (p.type === 'dog') {
    ctx.fillStyle = dark;
    ellipse(ctx, 4, -13, 2.4, 3.4); ctx.fill(); // 垂耳
  } else {
    ctx.fillStyle = body; // 三角耳
    ctx.beginPath(); ctx.moveTo(3, -11); ctx.lineTo(4.5, -16); ctx.lineTo(7, -12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, -12); ctx.lineTo(11, -16); ctx.lineTo(12.5, -11); ctx.closePath(); ctx.fill();
  }
  // 眼睛 & 鼻
  ctx.fillStyle = '#333'; ellipse(ctx, 8.5, -9, 1.2, 1.5); ctx.fill();
  ctx.fillStyle = p.type === 'dog' ? '#5a3a2a' : '#ff8fa5';
  ellipse(ctx, 12.5, -6.5, 1.4, 1.1); ctx.fill();
  if (p.type === 'cat') { // 胡须
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(10, -6); ctx.lineTo(15, -5); ctx.moveTo(10, -7.5); ctx.lineTo(15, -8.5);
    ctx.stroke();
  }
  // 宠物帽子
  if (p.hat && p.hat !== 'none') {
    ctx.save(); ctx.translate(7, -4); ctx.scale(0.55, 0.55);
    drawHat(ctx, p.hat, p.t);
    ctx.restore();
  }
  ctx.restore();
}

/* ------------------------------------------------------------
 * 客人 NPC
 * ---------------------------------------------------------- */
function drawCustomer(ctx, x, y, c) {
  const bob = c.moving ? Math.abs(Math.sin(c.walkPhase)) * 3 : Math.sin(c.t * 2 + c.phase) * 1.2;
  const swing = c.moving ? Math.sin(c.walkPhase) * 5 : 0;
  ctx.save();
  ctx.translate(x, y - bob);
  if (c.dir === 'left') ctx.scale(-1, 1);
  drawShadow(ctx, 0, bob, 13);
  // 腿
  ctx.fillStyle = '#5a6a8a';
  rr(ctx, -7 + swing * 0.5, 2, 6, 13, 3); ctx.fill();
  rr(ctx, 1 - swing * 0.5, 2, 6, 13, 3); ctx.fill();
  // 身体（随机颜色衣服）
  ctx.fillStyle = c.color;
  rr(ctx, -10, -15, 20, 19, 6); ctx.fill();
  // 手臂
  ctx.strokeStyle = c.color; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, -10); ctx.lineTo(-14, -1 + swing * 0.4);
  ctx.moveTo(10, -10); ctx.lineTo(14, -1 - swing * 0.4);
  ctx.stroke();
  // 头
  ctx.fillStyle = '#ffdbac';
  ellipse(ctx, 0, -25, 10, 9.5); ctx.fill();
  // 头发
  ctx.fillStyle = c.hair;
  ctx.beginPath(); ctx.ellipse(0, -29, 10, 6.5, 0, Math.PI, Math.PI * 2); ctx.fill();
  // 眼 & 笑
  ctx.fillStyle = '#333';
  ellipse(ctx, -3.5, -26, 1.5, 1.9); ctx.fill();
  ellipse(ctx, 3.5, -26, 1.5, 1.9); ctx.fill();
  ctx.strokeStyle = '#b5673a'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(0, -22.5, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------
 * 场景物件
 * ---------------------------------------------------------- */
function drawTree(ctx, x, y, t, phase, fruits) {
  drawShadow(ctx, x, y + 4, 22);
  const sway = Math.sin(t * 1.2 + phase) * 2;
  // 树干
  ctx.fillStyle = '#8a5a2e';
  rr(ctx, x - 5, y - 26, 10, 30, 4); ctx.fill();
  // 树冠
  ctx.fillStyle = '#5db550';
  ellipse(ctx, x - 14 + sway, y - 40, 17, 14); ctx.fill();
  ellipse(ctx, x + 14 + sway, y - 40, 17, 14); ctx.fill();
  ellipse(ctx, x + sway, y - 52, 20, 16); ctx.fill();
  ctx.fillStyle = '#6fc763';
  ellipse(ctx, x - 6 + sway, y - 50, 10, 8); ctx.fill();
  // 果实
  for (let i = 0; i < fruits; i++) {
    const fx = x + [-10, 8, -1][i % 3] + sway;
    const fy = y + [-38, -42, -55][i % 3] + Math.sin(t * 2 + i) * 1;
    ctx.fillStyle = '#ff5a4e';
    ellipse(ctx, fx, fy, 4, 4.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ellipse(ctx, fx - 1.2, fy - 1.4, 1.2, 1); ctx.fill();
  }
}

function drawPlot(ctx, x, y, plot, t) {
  // plot: {state, watered, crop, stage}
  const S = 34;
  if (plot.state === 'grass') return;
  // 翻过的土
  ctx.fillStyle = plot.watered ? '#6b4a2a' : '#8a6136';
  rr(ctx, x - S / 2, y - S / 2, S, S, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x - S / 2 + 3, y - S / 2 + 3, S - 6, S - 6);
  if (plot.watered) { // 水光闪闪
    ctx.fillStyle = `rgba(120,190,255,${0.15 + Math.sin(t * 3 + x) * 0.08})`;
    rr(ctx, x - S / 2 + 3, y - S / 2 + 3, S - 6, S - 6, 4); ctx.fill();
  }
  if (plot.state === 'seed' || plot.state === 'growing' || plot.state === 'ripe') {
    const g = plot.state === 'seed' ? 0.25 : plot.state === 'growing' ? 0.6 : 1;
    const sway = Math.sin(t * 2.5 + x * 0.1) * 1.5;
    // 茎叶
    ctx.strokeStyle = '#3f9e3f'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.quadraticCurveTo(x + sway, y + 4 - 12 * g, x + sway * 1.5, y + 6 - 20 * g);
    ctx.stroke();
    ctx.fillStyle = '#57b857';
    ellipse(ctx, x - 4 * g, y + 2 - 8 * g, 4 * g, 2.4 * g); ctx.fill();
    ellipse(ctx, x + 4 * g, y - 4 * g, 4 * g, 2.4 * g); ctx.fill();
    if (plot.state === 'ripe') { // 成熟果实 + 微光
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
  // 墙体
  ctx.fillStyle = '#ffe9c9';
  rr(ctx, x, y - 60, 120, 116, 8); ctx.fill();
  // 屋顶
  ctx.fillStyle = '#ff7b54';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 56); ctx.lineTo(x + 60, y - 104); ctx.lineTo(x + 132, y - 56);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e5643f';
  rr(ctx, x - 12, y - 60, 144, 8, 4); ctx.fill();
  // 烟囱 + 烟
  ctx.fillStyle = '#c98a5a';
  rr(ctx, x + 88, y - 96, 14, 26, 3); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const sy = y - 100 - ((t * 20 + i * 22) % 60);
    const sa = 1 - ((t * 20 + i * 22) % 60) / 60;
    ctx.fillStyle = `rgba(230,230,230,${sa * 0.7})`;
    ellipse(ctx, x + 95 + Math.sin(t + i) * 6, sy, 5 + (1 - sa) * 5, 4 + (1 - sa) * 4);
    ctx.fill();
  }
  // 门
  ctx.fillStyle = '#a56a35';
  rr(ctx, x + 46, y + 6, 28, 50, 6); ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ellipse(ctx, x + 68, y + 32, 2.4, 2.4); ctx.fill();
  // 窗户（暖光）
  ctx.fillStyle = `rgba(255,220,120,${0.85 + Math.sin(t * 2) * 0.1})`;
  rr(ctx, x + 12, y - 30, 26, 24, 5); ctx.fill();
  rr(ctx, x + 84, y - 30, 26, 24, 5); ctx.fill();
  ctx.strokeStyle = '#a56a35'; ctx.lineWidth = 2.5;
  ctx.strokeRect(x + 12, y - 30, 26, 24);
  ctx.strokeRect(x + 84, y - 30, 26, 24);
}

function drawStall(ctx, x, y, t) {
  drawShadow(ctx, x + 45, y + 40, 55);
  // 柜台
  ctx.fillStyle = '#c98a5a';
  rr(ctx, x, y, 90, 40, 6); ctx.fill();
  ctx.fillStyle = '#a56a35';
  rr(ctx, x, y + 32, 90, 8, 4); ctx.fill();
  // 顶棚（条纹）
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#ff6b8a' : '#fff';
    const sx = x - 4 + i * 20;
    ctx.beginPath();
    ctx.moveTo(sx, y - 44); ctx.lineTo(sx + 20, y - 44);
    ctx.lineTo(sx + 18, y - 26 + Math.sin(t * 3 + i) * 1.5);
    ctx.lineTo(sx + 2, y - 26 + Math.sin(t * 3 + i + 1) * 1.5);
    ctx.closePath(); ctx.fill();
  }
  // 支柱
  ctx.fillStyle = '#8a5a2e';
  rr(ctx, x - 2, y - 44, 5, 84, 2); ctx.fill();
  rr(ctx, x + 87, y - 44, 5, 84, 2); ctx.fill();
  // 招牌
  ctx.fillStyle = '#fff3d6';
  rr(ctx, x + 22, y - 70, 46, 22, 6); ctx.fill();
  ctx.strokeStyle = '#d9a62e'; ctx.lineWidth = 2;
  ctx.strokeRect(x + 22, y - 70, 46, 22);
  ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🛒', x + 45, y - 53);
}

function drawPond(ctx, x, y, w, h, t) {
  // 岸边
  ctx.fillStyle = '#c9b280';
  ellipse(ctx, x, y, w / 2 + 12, h / 2 + 10); ctx.fill();
  // 水面
  ctx.fillStyle = '#5fb8e8';
  ellipse(ctx, x, y, w / 2, h / 2); ctx.fill();
  ctx.fillStyle = '#7ccbf0';
  ellipse(ctx, x - w * 0.12, y - h * 0.15, w / 2.8, h / 3); ctx.fill();
  // 波纹
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const rx = ((t * 25 + i * 40) % (w / 2 - 8));
    ctx.globalAlpha = 1 - rx / (w / 2 - 8);
    ellipse(ctx, x + Math.sin(i * 7) * 20, y + Math.cos(i * 5) * 12, rx, rx * (h / w));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // 跳鱼动画偶尔交给 game.js 粒子
}

function drawBin(ctx, x, y, t) {
  drawShadow(ctx, x, y + 16, 18);
  ctx.fillStyle = '#9a6a3a';
  rr(ctx, x - 16, y - 14, 32, 30, 5); ctx.fill();
  ctx.fillStyle = '#7a5228';
  rr(ctx, x - 18, y - 18, 36, 8, 3); ctx.fill();
  ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
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
  ctx.fillText('👕', x, y - 30 + Math.sin(t * 2) * 1.5);
}

function drawKitchenProp(ctx, x, y, t) {
  drawShadow(ctx, x, y + 12, 18);
  ctx.fillStyle = '#e8e8f0';
  rr(ctx, x - 17, y - 16, 34, 28, 5); ctx.fill();
  ctx.fillStyle = '#555';
  ellipse(ctx, x - 8, y - 16, 5, 2.5); ctx.fill();
  ellipse(ctx, x + 8, y - 16, 5, 2.5); ctx.fill();
  // 锅里热气
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
  ctx.fillText('🍳', x, y + 8);
}

/* ------------------------------------------------------------
 * 地面物品（带原地休息动画：上下浮动 + 闪光）
 * ---------------------------------------------------------- */
function drawGroundItem(ctx, x, y, icon, t, phase) {
  const bobY = Math.sin(t * 2.5 + phase) * 3;
  drawShadow(ctx, x, y + 4, 8);
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, y - 8 + bobY);
  // 闪光
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
