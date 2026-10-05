'use strict';

function initShipSkinSelector() {
  const selector = document.getElementById('ship-skin');
  selectShipSkin(loadShipSkinPreference());
  SHIP_SKINS.forEach(skin => {
    const option = document.createElement('option');
    option.value = skin.id;
    option.textContent = skin.name;
    selector.appendChild(option);
  });
  selector.value = getSelectedShipSkin().id;
  selector.addEventListener('change', () => {
    if (selectShipSkin(selector.value)) saveShipSkinPreference(selector.value);
  });
}

initShipSkinSelector();
