'use strict';

const SHIP_SKINS = Object.freeze([
  Object.freeze({ id: 'classic', name: 'Clásica' }),
  Object.freeze({ id: 'neon', name: 'Neón' }),
  Object.freeze({ id: 'fighter', name: 'Caza' }),
]);

let selectedShipSkinId = SHIP_SKINS[0].id;

function getSelectedShipSkinId() {
  return selectedShipSkinId;
}

function selectShipSkin(id) {
  if (!SHIP_SKINS.some(skin => skin.id === id)) return false;
  selectedShipSkinId = id;
  return true;
}
