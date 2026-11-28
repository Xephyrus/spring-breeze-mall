/** 转盘占比与后端结果停靠回归测试，不调用抽奖接口。@author Bulbasaur @since 2026-11-15 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
// 被测模块已从 wheel.js 改为 wheel.ts。原来「读源码 + data: URI eval」的写法是为了绕开
// Node 不认 .ts；现在用解析钩子直接 import，跑到的是**真实模块**而不是源码文本副本。
register('./ts-resolve-hook.mjs', import.meta.url);
const { createWheelSegments, wheelLandingRotation, layoutRadialLabel } = await import('../pages/promotion/lottery/wheel.ts');
/** 构建指定万分点的独立奖池。 */
function pool(weights) { return weights.map((weight, index) => ({ id: `p${index}`, name: `奖品${index}`, weight })); }
/** 比较浮点角度，避免把小数精度误差当作绘制偏移。 */
function near(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`); }

test('10%、80%、10%按36°、288°、36°绘制，扇区连续且覆盖整圆', () => {
  const segments = createWheelSegments(pool([1000, 8000, 1000]));
  assert.deepEqual(segments.map(p => [p.startAngle, p.endAngle]), [[0, 36], [36, 324], [324, 360]]);
  near(segments.reduce((sum, p) => sum + p.endAngle - p.startAngle, 0), 360);
});

test('1%小奖项仍保留3.6°扇区，不为可读性改变真实占比', () => {
  const segments = createWheelSegments(pool([100, 9900]));
  near(segments[0].endAngle - segments[0].startAngle, 3.6);
  near(segments[1].endAngle - segments[1].startAngle, 356.4);
});

test('八奖项和历史小数百分比均保留原始概率，不做等分', () => {
  for (const weights of [[100, 100, 100, 100, 100, 100, 100, 9300], [1234, 8766]]) {
    const segments = createWheelSegments(pool(weights));
    segments.forEach((p, index) => near(p.endAngle - p.startAngle, weights[index] * 360 / 10000));
    near(segments.at(-1).endAngle, 360);
  }
});

test('不同起始角度下，顶部指针始终停在后端返回奖项中心', () => {
  const segments = createWheelSegments(pool([100, 1900, 8000]));
  for (const current of [-20, 0, 359, 360, 2026]) for (const prize of segments) {
    const end = wheelLandingRotation(segments, prize.id, current);
    assert.ok(end >= current + 1800);
    const pointerAngle = (360 - end % 360) % 360;
    near(pointerAngle, prize.midAngle);
    assert.ok(pointerAngle > prize.startAngle && pointerAngle < prize.endAngle);
  }
});

test('非法奖池不绘制，未知奖项不编造停靠结果', () => {
  for (const prizes of [null, [], [null], pool([0]), pool([9000]), pool([-1, 10001]), pool([1.5, 9998.5])])
    assert.deepEqual(createWheelSegments(prizes), []);
  assert.equal(wheelLandingRotation(createWheelSegments(pool([1000, 9000])), 'missing'), null);
});

test('历史零概率奖项不占扇区，也不能被动画误选中', () => {
  const segments = createWheelSegments(pool([0, 10000]));
  assert.equal(segments.length, 1);
  assert.equal(segments[0].id, 'p1');
  assert.equal(wheelLandingRotation(segments, 'p0'), null);
});

/** 用可重复的字宽模型验证排版边界，实际画布采用Canvas.measureText测量。 */
function measure(text, size) { return Array.from(text).reduce((sum, char) => sum + (char.charCodeAt(0) < 128 ? 0.6 : 1) * size, 0); }

test('10%扇区的长奖品名称可分两行完整显示，不再固定截断三字', () => {
  const name = '满100减10元优惠券';
  const layout = layoutRadialLabel(name, 150, 36, measure);
  assert.ok(layout);
  assert.equal(layout.lines.join(''), name);
  assert.ok(layout.lines.length <= 2 && layout.fontSize >= 12);
  layout.lines.forEach(line => assert.ok(measure(line, layout.fontSize) <= layout.width));
  assert.ok(layout.center + layout.width / 2 < 150);
});

test('超长名称限定两行并省略末尾，避免文字越过扇区边缘', () => {
  const layout = layoutRadialLabel('超长奖品名称'.repeat(10), 150, 36, measure);
  assert.ok(layout && layout.lines.length <= 2);
  assert.ok(layout.lines.at(-1).endsWith('…'));
  layout.lines.forEach(line => assert.ok(measure(line, layout.fontSize) <= layout.width));
});

test('1%极窄扇区不强塞小字，名称保留在奖品详情中', () => {
  assert.equal(layoutRadialLabel('10积分奖励', 150, 3.6, measure), null);
});
