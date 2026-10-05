'use strict';

const TRIPLE_SHOT_POWER_UP = Object.freeze({
  duration: 5,
  angleOffsets: Object.freeze([0, -Math.PI / 4, Math.PI / 4]),
  lifetime: 10,
  spawnMin: 15,
  spawnMax: 25,
  radius: 16,
  margin: 32,
});

class TripleShotPowerUpSpawner {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    this.pickup = null;
    this.scheduleSpawn();
  }

  scheduleSpawn() {
    const { spawnMin, spawnMax } = TRIPLE_SHOT_POWER_UP;
    this.spawnRemaining = spawnMin + Math.random() * (spawnMax - spawnMin);
  }

  spawn() {
    const { margin, radius, lifetime } = TRIPLE_SHOT_POWER_UP;
    this.pickup = {
      x: margin + Math.random() * (this.width - margin * 2),
      y: margin + Math.random() * (this.height - margin * 2),
      radius,
      remaining: lifetime,
    };
    this.scheduleSpawn();
  }

  update(dt) {
    this.spawnRemaining -= dt;
    if (this.pickup) {
      this.pickup.remaining -= dt;
      if (this.pickup.remaining <= 0) this.pickup = null;
    }
    if (!this.pickup && this.spawnRemaining <= 0) this.spawn();
  }

  collect(ship) {
    if (!this.pickup || ship.dead) return false;
    const distance = Math.hypot(ship.x - this.pickup.x, ship.y - this.pickup.y);
    if (distance >= ship.radius + this.pickup.radius) return false;
    this.pickup = null;
    return true;
  }
}
