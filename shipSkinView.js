'use strict';

const SHIP_SKIN_STYLES = {
  classic: {
    color: '#fff', flameColor: 'rgba(255, 130, 0, 0.85)',
    outline: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    details: [],
  },
  neon: {
    color: '#66f7ff', flameColor: '#c4a0ff',
    outline: [[20, 0], [-10, -12], [-5, 0], [-10, 12]],
    details: [[[10, 0], [-4, -5], [-4, 5], [10, 0]]],
  },
  fighter: {
    color: '#ffd966', flameColor: '#ff9b66',
    outline: [[20, 0], [2, -5], [-12, -12], [-9, 0], [-12, 12], [2, 5]],
    details: [[[12, 0], [-3, 0]], [[-6, -8], [-6, 8]]],
  },
};

const SHIP_SKIN_DRAWING = Object.freeze({
  lineWidth: 1.5,
  lifeLineWidth: 1.2,
  lifeScale: 0.5,
  lineJoin: 'round',
  flameX: -8,
  flameHalfWidth: 4,
  flameMinLength: 6,
  flameMaxLength: 14,
  flameFlickerThreshold: 0.35,
});

function drawShipSkinPath(context, vertices, closed = false) {
  context.beginPath();
  vertices.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  if (closed) context.closePath();
  context.stroke();
}

function drawShipSkin(context, skinId, options = {}) {
  const style = SHIP_SKIN_STYLES[skinId] || SHIP_SKIN_STYLES.classic;
  context.save();
  context.strokeStyle = style.color;
  context.lineWidth = options.lineWidth ?? SHIP_SKIN_DRAWING.lineWidth;
  context.lineJoin = SHIP_SKIN_DRAWING.lineJoin;
  drawShipSkinPath(context, style.outline, true);
  style.details.forEach(vertices => drawShipSkinPath(context, vertices));
  if (options.thrusting && Math.random() > SHIP_SKIN_DRAWING.flameFlickerThreshold)
    drawShipSkinFlame(context, style.flameColor);
  context.restore();
}

function drawShipSkinFlame(context, color) {
  const style = SHIP_SKIN_DRAWING;
  const length = style.flameMinLength + Math.random() * (style.flameMaxLength - style.flameMinLength);
  context.strokeStyle = color;
  drawShipSkinPath(context, [
    [style.flameX, -style.flameHalfWidth],
    [style.flameX - length, 0],
    [style.flameX, style.flameHalfWidth],
  ]);
}

function initializeShipSkinSelector(select, onSelect) {
  SHIP_SKINS.forEach(skin => {
    const option = document.createElement('option');
    option.value = skin.id;
    option.textContent = skin.name;
    select.appendChild(option);
  });
  select.value = getSelectedShipSkinId();
  select.addEventListener('change', () => {
    onSelect(select.value);
    select.value = getSelectedShipSkinId();
  });
}
