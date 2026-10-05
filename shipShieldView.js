'use strict';

const SHIP_SHIELD_STYLE = Object.freeze({
  color: '#80dfff',
  fillColor: 'rgba(128, 223, 255, 0.12)',
  inactiveColor: '#ddd',
  radius: 26,
  lineWidth: 2,
  font: '15px monospace',
  hudX: 14,
  hudY: 98,
});

function drawShipShield(context, ship) {
  if (ship.dead || !ship.shield.active) return;
  const style = SHIP_SHIELD_STYLE;
  context.save();
  context.strokeStyle = style.color;
  context.fillStyle = style.fillColor;
  context.lineWidth = style.lineWidth;
  context.beginPath();
  context.arc(ship.x, ship.y, style.radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function drawShipShieldHUD(context, ship) {
  const { shield } = ship;
  const style = SHIP_SHIELD_STYLE;
  let label = 'ESCUDO [S] LISTO';
  if (ship.dead) label = 'ESCUDO — NO DISPONIBLE';
  else if (shield.active) label = `ESCUDO ACTIVO  ${shield.remaining.toFixed(1)} s`;
  else if (shield.cooldownRemaining > 0)
    label = `ESCUDO RECARGANDO  ${shield.cooldownRemaining.toFixed(1)} s`;
  context.save();
  context.fillStyle = shield.active ? style.color : style.inactiveColor;
  context.font = style.font;
  context.textAlign = 'left';
  context.fillText(label, style.hudX, style.hudY);
  context.restore();
}
