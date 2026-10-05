'use strict';

const SHIP_SKIN_STYLE = Object.freeze({
  lineWidth: 1.5, lineJoin: 'round',
  flameX: -8, flameHalfWidth: 4, flameMinLength: 6, flameMaxLength: 14,
  flameVisibilityThreshold: 0.35, lifeScale: 0.5,
});

// Draws in local coordinates; callers supply position, rotation and scale.
function drawShipSkin(context, skin) {
  context.strokeStyle = skin.color;
  context.lineWidth = SHIP_SKIN_STYLE.lineWidth;
  context.lineJoin = SHIP_SKIN_STYLE.lineJoin;
  context.beginPath();
  skin.vertices.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
  if (skin.fill) {
    context.fillStyle = skin.fill;
    context.fill();
  }
  context.stroke();
  (skin.details || []).forEach(vertices => {
    context.beginPath();
    vertices.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  });
}

function drawShipSkinFlame(context, skin) {
  const style = SHIP_SKIN_STYLE;
  if (Math.random() <= style.flameVisibilityThreshold) return;
  const length = style.flameMinLength + Math.random() * (style.flameMaxLength - style.flameMinLength);
  context.beginPath();
  context.moveTo(style.flameX, -style.flameHalfWidth);
  context.lineTo(style.flameX - length, 0);
  context.lineTo(style.flameX, style.flameHalfWidth);
  context.strokeStyle = skin.flameColor;
  context.stroke();
}
