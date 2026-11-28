/** 按服务端概率生成转盘扇区及停靠角度，不参与抽奖判定。@author Bulbasaur @since 2026-11-15 */
export const WHEEL_COLORS = ['#fff0c9', '#f8ce78', '#f4a765', '#f9dfb1', '#ffd98e', '#efb587', '#ffe9ad', '#eecba2'];

/** 使用原始万分点确定顺时针扇区，起点为12点；拒绝非法奖池，零概率历史奖项不占角度。 */
export function createWheelSegments(prizes = []) {
  if (!Array.isArray(prizes) || !prizes.length || prizes.some(p => !p || !Number.isInteger(p.weight) || p.weight < 0)
      || prizes.reduce((sum, p) => sum + p.weight, 0) !== 10000) return [];
  let weight = 0;
  return prizes.filter(p => p.weight > 0).map((prize, index) => {
    const startAngle = weight * 360 / 10000;
    weight += prize.weight;
    const endAngle = weight * 360 / 10000;
    return { ...prize, startAngle, endAngle, midAngle: (startAngle + endAngle) / 2, color: WHEEL_COLORS[index % WHEEL_COLORS.length] };
  });
}

/** 在当前角度后顺时针转五圈以上，使固定顶部指针指向后端奖项中心；未找到可见奖项时返回null。 */
export function wheelLandingRotation(segments, prizeId, currentRotation = 0) {
  const target = segments.find(p => p.id === prizeId);
  if (!target || !Number.isFinite(currentRotation)) return null;
  const desired = (360 - target.midAngle) % 360;
  const current = ((currentRotation % 360) + 360) % 360;
  return currentRotation + 5 * 360 + (desired - current + 360) % 360;
}

/**
 * 按扇区可用空间排版径向文字，优先完整展示两行，再缩小至12px；极窄扇区不绘制不可读的小字。
 * measure接收文字与字号，返回实际像素宽度；名称过长时仅省略盘内末尾，完整内容由奖品详情提供。
 */
export function layoutRadialLabel(name, radius, span, measure) {
  if (!name || radius <= 0 || span <= 0) return null;
  const width = radius * 0.56, center = radius * 0.64, inner = center - width / 2;
  const height = 2 * inner * Math.tan(Math.min(span, 120) * Math.PI / 360);
  const largestFont = Math.max(12, Math.min(16, Math.floor((radius * 2 + 16) / 23)));
  let fallback;
  for (let fontSize = largestFont; fontSize >= 12; fontSize--) {
    const lineHeight = fontSize * 1.15;
    const maxLines = Math.min(2, Math.floor(height / lineHeight));
    if (maxLines < 1) continue;
    const lines = []; let line = '';
    for (const character of Array.from(name)) {
      if (line && measure(line + character, fontSize) > width) { lines.push(line); line = ''; }
      line += character;
    }
    if (line) lines.push(line);
    const layout = { lines, fontSize, lineHeight, center, width };
    if (lines.length <= maxLines) return layout;
    const shown = lines.slice(0, maxLines);
    let last = shown[shown.length - 1];
    while (last && measure(last + '…', fontSize) > width) last = Array.from(last).slice(0, -1).join('');
    shown[shown.length - 1] = last + '…';
    fallback = { ...layout, lines: shown };
  }
  return fallback || null;
}
