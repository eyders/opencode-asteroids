'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { createContext, runInContext } = require('node:vm');

function createGame() {
  const context = createContext({
    document: { getElementById: () => ({ getContext: () => ({}) }) },
    window: { addEventListener() {} }, requestAnimationFrame() {},
  });
  const scripts = ['speedPowerUp.js', 'speedPowerUpView.js',
    'tripleShotPowerUp.js', 'tripleShotPowerUpView.js',
    'shootingStar.js', 'shootingStarView.js', 'game.js'];
  scripts.forEach(filename => runInContext(
    readFileSync(join(__dirname, '..', filename), 'utf8'), context, { filename }));
  const run = code => runInContext(code, context);
  run(`asteroids = [{ x: 0, y: 0, radius: 16, dead: false, update() {} }];
    ship.invincible = Infinity;
    speedPowerUps.spawnRemaining = Infinity;
    shootingStars.spawnRemaining = Infinity;
    tripleShotPowerUps.spawnRemaining = Infinity;`);
  return run;
}

test('pickup spawns within bounds, expires and rejects dead ships', () => {
  const run = createGame();
  assert.equal(run(`Math.random = () => 0;
    new TripleShotPowerUpSpawner(W, H).spawnRemaining`), 15);
  assert.equal(run(`Math.random = () => 1;
    new TripleShotPowerUpSpawner(W, H).spawnRemaining`), 25);
  run('tripleShotPowerUps.spawnRemaining = 0; tripleShotPowerUps.update(0)');
  assert.ok(run(`tripleShotPowerUps.pickup.x <= W - TRIPLE_SHOT_POWER_UP.margin &&
    tripleShotPowerUps.pickup.y <= H - TRIPLE_SHOT_POWER_UP.margin`));
  assert.equal(run('tripleShotPowerUps.collect(ship)'), false);
  run(`ship.x = tripleShotPowerUps.pickup.x; ship.y = tripleShotPowerUps.pickup.y;
    ship.dead = true;`);
  assert.equal(run('tripleShotPowerUps.collect(ship)'), false);
  run('tripleShotPowerUps.update(10)');
  assert.equal(run('tripleShotPowerUps.pickup'), null);
});

test('collecting activates five seconds and collecting again refreshes without stacking', () => {
  const run = createGame();
  const collect = `tripleShotPowerUps.pickup = {
    x: ship.x, y: ship.y, radius: 16, remaining: 10 }; update(0);`;
  run(collect);
  assert.equal(run('ship.tripleShotRemaining'), 5);
  assert.equal(run('tripleShotPowerUps.pickup'), null);
  run('update(2)');
  assert.equal(run('ship.tripleShotRemaining'), 3);
  run(collect);
  assert.equal(run('ship.tripleShotRemaining'), 5);
  run('update(5)');
  assert.equal(run('ship.tripleShotRemaining'), 0);
  assert.equal(run('ship.tryShoot().length'), 1);
});

test('triple shot fires forward and at 45 degrees on each side at any ship angle', () => {
  const run = createGame();
  for (const angle of [0, Math.PI / 3, -Math.PI / 2]) {
    run(`ship.angle = ${angle}; ship.shootCooldown = 0;
      ship.tripleShotRemaining = 5; bullets = ship.tryShoot();`);
    assert.equal(run('bullets.length'), 3);
    assert.ok(run('bullets.every(b => b.x === bullets[0].x && b.y === bullets[0].y)'));
    for (const [index, offset] of [0, -Math.PI / 4, Math.PI / 4].entries()) {
      assert.ok(run(`Math.abs(bullets[${index}].vx - Math.cos(ship.angle + ${offset}) * 520) < 1e-9`));
      assert.ok(run(`Math.abs(bullets[${index}].vy - Math.sin(ship.angle + ${offset}) * 520) < 1e-9`));
    }
    assert.equal(run('ship.tryShoot().length'), 0);
  }
});

test('edge wrapping, held Space and speed boost still work with triple shot', () => {
  const run = createGame();
  run(`ship.x = W - 1; ship.angle = 0; ship.tripleShotRemaining = 5;
    ship.speedBoostRemaining = 5;
    justPressed.Space = true; keys.Space = true; update(0);`);
  assert.equal(run('bullets.length'), 3);
  assert.ok(run('bullets.every(b => b.x >= 0 && b.x < W)'));
  run('update(0.3)');
  assert.equal(run('bullets.length'), 3);
  assert.equal(run('ship.speedBoostRemaining'), 4.7);
  assert.equal(run('ship.tripleShotRemaining'), 4.7);
});

test('death, respawn, level changes and restart remove the effect', () => {
  const run = createGame();
  run('ship.tripleShotRemaining = 5; killShip()');
  assert.equal(run('ship.tripleShotRemaining'), 0);
  run('update(2)');
  assert.equal(run('ship.tripleShotRemaining'), 0);
  run('ship.tripleShotRemaining = 5; tripleShotPowerUps.spawn(); nextLevel()');
  assert.equal(run('ship.tripleShotRemaining'), 0);
  assert.equal(run('tripleShotPowerUps.pickup'), null);
  run('ship.tripleShotRemaining = 5; state = "gameover"; justPressed.Space = true; update(0)');
  assert.equal(run('ship.tripleShotRemaining'), 0);
  assert.equal(run('tripleShotPowerUps.pickup'), null);
});
