'use strict';

const SPEED_POWER_UP_STYLE = Object.freeze({
  color: '#00e5ff',
  lineWidth: 2,
  font: '15px monospace',
  hudX: 14,
  hudY: 50,
  warningTime: 3,
  blinkRate: 6,
  bolt: Object.freeze([[-1, -11], [-8, 2], [-1, 2], [-3, 11], [8, -3], [1, -3]]),
});

function drawSpeedPowerUp(context, pickup) {
  if (!pickup) return;
  const style = SPEED_POWER_UP_STYLE;
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
  drawSpeedPowerUpBolt(context, style.bolt);
  context.restore();
}

function drawSpeedPowerUpBolt(context, points) {
  context.beginPath();
  context.moveTo(...points[0]);
  points.slice(1).forEach(point => context.lineTo(...point));
  context.closePath();
  context.fill();
}

function drawSpeedPowerUpHUD(context, remaining) {
  if (remaining <= 0) return;
  const style = SPEED_POWER_UP_STYLE;
  context.save();
  context.fillStyle = style.color;
  context.font = style.font;
  context.textAlign = 'left';
  context.fillText(`VELOCIDAD ×2  ${remaining.toFixed(1)} s`, style.hudX, style.hudY);
  context.restore();
}
