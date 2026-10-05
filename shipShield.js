'use strict';

const SHIP_SHIELD = Object.freeze({ duration: 3, cooldown: 8 });

class ShipShield {
  constructor() { this.reset(); }

  reset() {
    this.remaining = 0;
    this.cooldownRemaining = 0;
  }

  get active() { return this.remaining > 0; }

  activate() {
    if (this.active || this.cooldownRemaining > 0) return false;
    this.remaining = SHIP_SHIELD.duration;
    this.cooldownRemaining = SHIP_SHIELD.cooldown;
    return true;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt < 0) return;
    this.remaining = Math.max(0, this.remaining - dt);
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
  }
}

function canShipTakeCollisionDamage(ship) {
  return !ship.dead && ship.invincible <= 0 && !ship.shield.active;
}
