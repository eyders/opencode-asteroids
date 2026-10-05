'use strict';

const SHIP_SKIN_STORAGE_KEY = 'asteroids.shipSkin';

function loadShipSkinPreference() {
  try {
    return window.localStorage.getItem(SHIP_SKIN_STORAGE_KEY);
  } catch {
    console.warn('No se pudo leer la skin guardada; se usará la skin clásica.');
    return null;
  }
}

function saveShipSkinPreference(id) {
  try {
    window.localStorage.setItem(SHIP_SKIN_STORAGE_KEY, id);
  } catch {
    console.warn('No se pudo guardar la skin; seguirá activa durante esta sesión.');
  }
}
