'use strict';

const SHOOTING_STAR = Object.freeze({
  speed: 250,
  lifetime: 6,
  spawnMin: 12,
  spawnMax: 18,
  radius: 16,
  safeDistance: 130,
  collisionScale: 0.82,
  points: 200,
  explosionParticles: 8,
});

class ShootingStar {
  constructor({ x, y, angle, width, height }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = Math.cos(angle) * SHOOTING_STAR.speed;
    this.vy = Math.sin(angle) * SHOOTING_STAR.speed;
    this.radius = SHOOTING_STAR.radius;
    this.remaining = SHOOTING_STAR.lifetime;
    this.dead = false;
  }

  update(dt) {
    if (this.dead) return;
    this.x = ((this.x + this.vx * dt) % this.width + this.width) % this.width;
    this.y = ((this.y + this.vy * dt) % this.height + this.height) % this.height;
    this.remaining = Math.max(0, this.remaining - dt);
    this.dead = this.remaining <= 0;
  }
}

class ShootingStarSpawner {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.star = null;
    this.scheduleSpawn();
  }

  scheduleSpawn() {
    const { spawnMin, spawnMax } = SHOOTING_STAR;
    this.spawnRemaining = spawnMin + Math.random() * (spawnMax - spawnMin);
  }

  spawn(ship) {
    const { radius, safeDistance } = SHOOTING_STAR;
    let x = radius + Math.random() * (this.width - radius * 2);
    let y = radius + Math.random() * (this.height - radius * 2);
    if (Math.hypot(x - ship.x, y - ship.y) < safeDistance) {
      x = ship.x < this.width / 2 ? this.width - radius : radius;
      y = ship.y < this.height / 2 ? this.height - radius : radius;
    }
    this.star = new ShootingStar({
      x, y, angle: Math.random() * Math.PI * 2,
      width: this.width, height: this.height,
    });
    this.scheduleSpawn();
  }

  clear() {
    this.star = null;
  }

  update(dt, ship, playing = true) {
    if (this.star) {
      this.star.update(dt);
      if (this.star.dead) this.clear();
    }
    if (!playing) return;
    this.spawnRemaining -= dt;
    if (!this.star && this.spawnRemaining <= 0) this.spawn(ship);
  }

  findBulletHit(bullets) {
    const star = this.star;
    if (!star) return null;
    return bullets.find(bullet => !bullet.dead &&
      Math.hypot(bullet.x - star.x, bullet.y - star.y) < star.radius) || null;
  }

  collidesWithShip(ship) {
    const star = this.star;
    if (!star || ship.dead || ship.invincible > 0) return false;
    return Math.hypot(ship.x - star.x, ship.y - star.y) <
      ship.radius + star.radius * SHOOTING_STAR.collisionScale;
  }
}
