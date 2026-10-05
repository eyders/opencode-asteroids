'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { createContext, runInContext } = require('node:vm');

const scripts = ['shipSkins.js', 'shipSkinView.js', 'speedPowerUp.js', 'speedPowerUpView.js',
  'tripleShotPowerUp.js', 'tripleShotPowerUpView.js',
  'shootingStar.js', 'shootingStarView.js', 'game.js'].map(filename => ({
  filename, source: readFileSync(join(__dirname, '..', filename), 'utf8'),
}));

function createGame() {
  let seed = 42;
  const math = Object.create(Math);
  math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const context = createContext({ Math: math,
    document: { getElementById: () => ({ getContext: () => ({}) }) },
    window: { addEventListener() {} }, requestAnimationFrame() {},
  });
  scripts.forEach(({ source, filename }) => runInContext(source, context, { filename }));
  return code => runInContext(code, context);
}

function preparePlayingGame() {
  const run = createGame();
  run(`asteroids = [{ x: 0, y: 0, radius: 16, dead: false, update() {} }];
    ship.invincible = Infinity;
    speedPowerUps.spawnRemaining = Infinity;
    shootingStars.spawnRemaining = Infinity;`);
  return run;
}

test('spawn intervals stay within 12–18 seconds and stars move faster than normal asteroids', () => {
  const run = createGame();
  assert.equal(run('Math.random = () => 0; new ShootingStarSpawner(W, H).spawnRemaining'), 12);
  assert.ok(run(`Math.random = () => 0.999999;
    new ShootingStarSpawner(W, H).spawnRemaining < 18`));
  assert.ok(run('SHOOTING_STAR.speed > Math.max(...SPEEDS) + 15'));
});

test('first appearance and subsequent appearances follow the timer with only one active star', () => {
  const run = preparePlayingGame();
  run('Math.random = () => 0.5; shootingStars = new ShootingStarSpawner(W, H); update(14)');
  assert.equal(run('shootingStars.star'), null);
  run('update(1); const firstStar = shootingStars.star');
  assert.ok(run('firstStar !== null'));
  assert.equal(run('shootingStars.spawnRemaining'), 15);
  run('update(1)');
  assert.ok(run('shootingStars.star === firstStar'));
  run('update(5)');
  assert.equal(run('shootingStars.star'), null);
  assert.equal(run('score'), 0);
  run('update(9)');
  assert.ok(run('shootingStars.star !== null && shootingStars.star !== firstStar'));
});

test('unsafe random positions fall back to a location far from the ship', () => {
  const run = createGame();
  run('Math.random = () => 0.5; shootingStars.spawn(ship)');
  assert.ok(run('dist(ship, shootingStars.star) >= SHOOTING_STAR.safeDistance'));
});

test('stars move at 250 px/s and wrap horizontally and vertically', () => {
  const run = createGame();
  run(`const horizontal = new ShootingStar({ x: 795, y: 300, angle: 0, width: W, height: H });
    const vertical = new ShootingStar({ x: 400, y: 5, angle: -Math.PI / 2, width: W, height: H });
    horizontal.update(0.1); vertical.update(0.1);`);
  assert.equal(run('horizontal.x'), 20);
  assert.equal(run('horizontal.y'), 300);
  assert.equal(run('vertical.y'), 580);
  assert.equal(run('horizontal.remaining'), 5.9);
});

test('expired stars cannot collide or award points', () => {
  const run = preparePlayingGame();
  run(`shootingStars.spawn(ship);
    const star = shootingStars.star;
    star.x = ship.x; star.y = ship.y; star.remaining = 0.01;
    ship.invincible = 0;
    bullets = [new Bullet(star.x, star.y, 0)];
    update(0.02);`);
  assert.equal(run('shootingStars.star'), null);
  assert.equal(run('score'), 0);
  assert.equal(run('lives'), 3);
  assert.equal(run('asteroids.length'), 1);
  assert.equal(run('bullets.length'), 1);
});

test('destroying a star awards 200 points once, consumes one bullet and creates no fragments', () => {
  const run = preparePlayingGame();
  run(`shootingStars.spawn(ship);
    const star = shootingStars.star;
    const deadBullet = new Bullet(star.x, star.y, 0); deadBullet.dead = true;
    bullets = [deadBullet, new Bullet(star.x, star.y, 0), new Bullet(star.x, star.y, 0)];
    update(0); update(0);`);
  assert.equal(run('shootingStars.star'), null);
  assert.equal(run('score'), 200);
  assert.equal(run('bullets.length'), 1);
  assert.equal(run('asteroids.length'), 1);
  assert.equal(run('particles.length'), 8);
});

test('star collisions respect invincibility and lose only one life', () => {
  const run = preparePlayingGame();
  run(`shootingStars.spawn(ship);
    shootingStars.star.x = ship.x; shootingStars.star.y = ship.y;
    ship.invincible = 1; update(0);`);
  assert.equal(run('lives'), 3);
  run('ship.invincible = 0; update(0)');
  assert.equal(run('lives'), 2);
  assert.equal(run('state'), 'dead');
  run('update(0)');
  assert.equal(run('lives'), 2);
});

test('during respawn the active star ages, but the spawn timer stays paused', () => {
  const run = preparePlayingGame();
  run(`shootingStars.spawn(ship); shootingStars.spawnRemaining = 8;
    shootingStars.star.remaining = 0.5;
    killShip(); update(0.5);`);
  assert.equal(run('shootingStars.star'), null);
  assert.equal(run('shootingStars.spawnRemaining'), 8);
  run('update(1.5)');
  assert.equal(run('state'), 'playing');
  assert.equal(run('ship.invincible'), 3);
  assert.equal(run('shootingStars.spawnRemaining'), 8);
  run('update(0.05)');
  assert.equal(run('shootingStars.spawnRemaining'), 7.95);
});

test('stars do not block level completion and clearing a level preserves the spawn timer', () => {
  const run = preparePlayingGame();
  run('shootingStars.spawn(ship); shootingStars.spawnRemaining = 7; asteroids = []; update(0)');
  assert.equal(run('level'), 2);
  assert.equal(run('shootingStars.star'), null);
  assert.equal(run('shootingStars.spawnRemaining'), 7);
  assert.equal(run('asteroids.length'), 5);
  run('asteroids = []; update(0)');
  assert.equal(run('shootingStars.spawnRemaining'), 7);
});

test('game over freezes the star and Space restart resets its lifecycle', () => {
  const run = preparePlayingGame();
  run(`shootingStars.spawn(ship); shootingStars.spawnRemaining = 7;
    const oldSpawner = shootingStars; const remaining = shootingStars.star.remaining;
    lives = 1; killShip(); update(1);`);
  assert.equal(run('state'), 'gameover');
  assert.equal(run('shootingStars.star.remaining === remaining'), true);
  assert.equal(run('shootingStars.spawnRemaining'), 7);
  run(`justPressed.Space = true; update(0)`);
  assert.equal(run('state'), 'playing');
  assert.equal(run('shootingStars !== oldSpawner'), true);
  assert.equal(run('shootingStars.star'), null);
  assert.ok(run('shootingStars.spawnRemaining >= 12 && shootingStars.spawnRemaining <= 18'));
  assert.equal(run('score'), 0);
  assert.equal(run('lives'), 3);
});

test('collision distance is not toroidal across opposite edges', () => {
  const run = preparePlayingGame();
  run(`shootingStars.spawn(ship);
    shootingStars.star.x = W - 1; shootingStars.star.y = H / 2;
    ship.x = 1; ship.y = H / 2; ship.invincible = 0;
    bullets = [new Bullet(1, H / 2, 0)]; update(0);`);
  assert.equal(run('score'), 0);
  assert.equal(run('lives'), 3);
  assert.ok(run('shootingStars.star !== null'));
});

test('normal asteroids still split and award their usual points', () => {
  const run = preparePlayingGame();
  run(`asteroids = [new Asteroid(100, 100, 3)];
    bullets = [new Bullet(100, 100, 0)]; update(0);`);
  assert.equal(run('score'), 20);
  assert.equal(run('asteroids.length'), 2);
  assert.equal(run('asteroids.every(asteroid => asteroid.size === 2)'), true);
});
