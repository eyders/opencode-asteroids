'use strict';

const TRIPLE_SHOT_POWER_UP_STYLE = Object.freeze({
  color: '#ff80ff',
  lineWidth: 2,
  font: '15px monospace',
  hudX: 14,
  hudY: 72,
  warningTime: 3,
  blinkRate: 6,
  bulletRadius: 2,
  bulletPositions: Object.freeze([-8, 0, 8]),
});

function drawTripleShotPowerUp(context, pickup) {
  if (!pickup) return;
  const style = TRIPLE_SHOT_POWER_UP_STYLE;
  if (pickup.remaining < style.warningTime &&
      Math.floor(pickup.remaining * style.blinkRate) % 2 === 0) return;
  context.save();
  context.translate(pickup.x, pickup.y);
  context.strokeStyle = style.color;
  context.fillStyle = style.color;
  context.lineWidth = style.lineWidth;
  context.beginPath();
  context.arc(0, 0, pickup.radius, 0, Math.PI * 2);
  context.stroke();
  drawTripleShotPowerUpBullets(context, style);
  context.restore();
}

function drawTripleShotPowerUpBullets(context, style) {
  style.bulletPositions.forEach(y => {
    context.beginPath();
    context.arc(0, y, style.bulletRadius, 0, Math.PI * 2);
    context.fill();
  });
}

function drawTripleShotPowerUpHUD(context, remaining) {
  if (remaining <= 0) return;
  const style = TRIPLE_SHOT_POWER_UP_STYLE;
  context.save();
  context.fillStyle = style.color;
  context.font = style.font;
  context.textAlign = 'left';
  context.fillText(`DISPARO TRIPLE  ${remaining.toFixed(1)} s`, style.hudX, style.hudY);
  context.restore();
}
