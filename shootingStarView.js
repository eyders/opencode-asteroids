'use strict';

const SHOOTING_STAR_STYLE = Object.freeze({
  color: '#ffd966',
  coreColor: '#fff7d6',
  transparentColor: 'rgba(255, 217, 102, 0)',
  lineWidth: 2,
  glowBlur: 12,
  fadeTime: 1.5,
  trailLength: 72,
  trailWidth: 14,
  points: 5,
  innerRadiusRatio: 0.45,
});

function drawShootingStar(context, star) {
  if (!star || star.dead) return;
  const style = SHOOTING_STAR_STYLE;
  context.save();
  context.globalAlpha = Math.min(1, star.remaining / style.fadeTime);
  context.translate(star.x, star.y);
  context.rotate(Math.atan2(star.vy, star.vx));
  context.shadowColor = style.color;
  context.shadowBlur = style.glowBlur;
  drawShootingStarTrail(context, star.radius);
  drawShootingStarHead(context, star.radius);
  context.restore();
}

function drawShootingStarTrail(context, radius) {
  const style = SHOOTING_STAR_STYLE;
  const tailX = -radius - style.trailLength;
  const gradient = context.createLinearGradient(tailX, 0, -radius, 0);
  gradient.addColorStop(0, style.transparentColor);
  gradient.addColorStop(1, style.color);
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(-radius, -style.trailWidth / 2);
  context.lineTo(tailX, 0);
  context.lineTo(-radius, style.trailWidth / 2);
  context.closePath();
  context.fill();
}

function drawShootingStarHead(context, radius) {
  const style = SHOOTING_STAR_STYLE;
  context.beginPath();
  for (let i = 0; i < style.points * 2; i++) {
    const angle = i * Math.PI / style.points;
    const vertexRadius = i % 2 === 0 ? radius : radius * style.innerRadiusRatio;
    const x = Math.cos(angle) * vertexRadius;
    const y = Math.sin(angle) * vertexRadius;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fillStyle = style.coreColor;
  context.strokeStyle = style.color;
  context.lineWidth = style.lineWidth;
  context.fill();
  context.stroke();
}
