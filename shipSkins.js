'use strict';

const SHIP_SKINS = Object.freeze([
  Object.freeze({
    id: 'classic', name: 'Clásica', color: '#ffffff', fill: null,
    flameColor: 'rgba(255, 130, 0, 0.85)',
    vertices: Object.freeze([[20, 0], [-12, -9], [-7, 0], [-12, 9]].map(Object.freeze)),
  }),
  Object.freeze({
    id: 'neon', name: 'Neón', color: '#67e8f9', fill: '#083344',
    flameColor: '#a5f3fc',
    vertices: Object.freeze([[20, 0], [-12, -11], [-4, 0], [-12, 11]].map(Object.freeze)),
  }),
  Object.freeze({
    id: 'solar', name: 'Solar', color: '#fcd34d', fill: '#422006',
    flameColor: '#fb923c',
    vertices: Object.freeze([[20, 0], [0, -8], [-12, -9], [-8, 0], [-12, 9], [0, 8]].map(Object.freeze)),
  }),
]);

let selectedShipSkin = SHIP_SKINS[0];

function getSelectedShipSkin() {
  return selectedShipSkin;
}

function selectShipSkin(id) {
  const skin = SHIP_SKINS.find(candidate => candidate.id === id);
  if (!skin) return false;
  selectedShipSkin = skin;
  return true;
}
