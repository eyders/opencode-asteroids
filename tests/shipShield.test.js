'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { createContext, runInContext } = require('node:vm');

function createGame() {
  const calls = [];
  const drawing = new Proxy({}, {
    get: (_, name) => (...args) => calls.push([name, ...args]),
    set: (_, name, value) => { calls.push([name, value]); return true; },
  });
  const events = {};
  const context = createContext({
    document: {
      getElementById: () => ({
        getContext: () => drawing, appendChild() {}, addEventListener() {},
      }),
      createElement: () => ({}),
    },
    window: { addEventListener: (name, handler) => { events[name] = handler; },
      localStorage: { getItem: () => null } },
    requestAnimationFrame() {},
  });
  const scripts = ['speedPowerUp.js', 'speedPowerUpView.js', 'shootingStar.js',
    'shootingStarView.js', 'shipSkins.js', 'shipSkinStorage.js', 'shipSkinView.js', 'shipSkinSelector.js',
    'tripleShotPowerUp.js', 'tripleShotPowerUpView.js',
    'shipShield.js', 'shipShieldView.js', 'game.js'];
  scripts.forEach(filename => runInContext(
    readFileSync(join(__dirname, '..', filename), 'utf8'), context, { filename }));
  const run = code => runInContext(code, context);
  run(`ship.invincible = 0;
    speedPowerUps.spawnRemaining = Infinity;
    tripleShotPowerUps.spawnRemaining = Infinity;
    shootingStars.spawnRemaining = Infinity;
    asteroids = [{ x: 0, y: 0, radius: 16, dead: false, update() {} }];`);
  return { run, calls, events };
}

test('shield starts ready, lasts 3 seconds and is ready again 8 seconds after activation', () => {
  const { run } = createGame();
  assert.equal(run('ship.shield.active'), false);
  assert.equal(run('ship.shield.activate()'), true);
  assert.equal(run('ship.shield.remaining'), 3);
  assert.equal(run('ship.shield.cooldownRemaining'), 8);
  assert.equal(run('ship.shield.activate()'), false);
  run('ship.shield.update(3);');
  assert.equal(run('ship.shield.active'), false);
  assert.equal(run('ship.shield.activate()'), false);
  run('ship.shield.update(5);');
  assert.equal(run('ship.shield.activate()'), true);
});

test('invalid timer inputs are ignored and large updates clamp both timers to zero', () => {
  const { run } = createGame();
  run('ship.shield.activate(); [-1, NaN, Infinity, "1", null].forEach(dt => ship.shield.update(dt));');
  assert.equal(run('ship.shield.remaining'), 3);
  assert.equal(run('ship.shield.cooldownRemaining'), 8);
  run('ship.shield.update(100);');
  assert.equal(run('ship.shield.remaining'), 0);
  assert.equal(run('ship.shield.cooldownRemaining'), 0);
});

test('S blocks asteroid collisions immediately without destroying asteroids or scoring', () => {
  const { run } = createGame();
  run('asteroids[0].x = ship.x; asteroids[0].y = ship.y; justPressed.KeyS = true; update(0.05);');
  assert.equal(run('lives'), 3);
  assert.equal(run('state'), 'playing');
  assert.equal(run('ship.shield.remaining'), 3);
  assert.equal(run('asteroids.length'), 1);
  assert.equal(run('score'), 0);
  run('update(2.95);');
  assert.equal(run('lives'), 3);
  run('update(0.06);');
  assert.equal(run('lives'), 2);
  assert.equal(run('state'), 'dead');
});

test('shield also blocks shooting stars; an unprotected collision remains lethal', () => {
  const { run } = createGame();
  run(`shootingStars.star = new ShootingStar({ x: ship.x, y: ship.y, angle: 0, width: W, height: H });
    ship.shield.activate(); update(0);`);
  assert.equal(run('lives'), 3);
  assert.equal(run('shootingStars.star !== null'), true);
  assert.equal(run('score'), 0);
  run('ship.shield.reset(); update(0);');
  assert.equal(run('lives'), 2);
});

test('overlapping asteroid and star cannot remove two lives in one frame', () => {
  const { run } = createGame();
  run(`asteroids[0].x = ship.x; asteroids[0].y = ship.y;
    shootingStars.star = new ShootingStar({ x: ship.x, y: ship.y, angle: 0, width: W, height: H });
    update(0);`);
  assert.equal(run('lives'), 2);
});

test('holding S never auto-reactivates; release and press again is required', () => {
  const { run, events } = createGame();
  const event = { code: 'KeyS', target: { closest: () => null } };
  events.keydown(event);
  run('update(0); update(8);');
  events.keydown(event);
  run('update(0);');
  assert.equal(run('ship.shield.active'), false);
  events.keyup(event);
  events.keydown(event);
  run('update(0);');
  assert.equal(run('ship.shield.active'), true);
});

test('S presses during death or game over are discarded, not queued', () => {
  const { run } = createGame();
  run("killShip(); justPressed.KeyS = true; update(2); update(0);");
  assert.equal(run('ship.shield.active'), false);
  run("state = 'gameover'; justPressed.KeyS = true; update(0); justPressed.Space = true; update(0); update(0);");
  assert.equal(run('ship.shield.active'), false);
});

test('death, respawn, level change and restart clear the shield and cooldown', () => {
  const { run } = createGame();
  for (const reset of ['killShip()', 'ship.reset()', 'nextLevel()', 'initGame()']) {
    run(`ship.shield.reset(); ship.shield.activate(); ${reset};`);
    assert.equal(run('ship.shield.remaining'), 0);
    assert.equal(run('ship.shield.cooldownRemaining'), 0);
  }
});

test('respawn invincibility remains independent of the shield', () => {
  const { run } = createGame();
  run('ship.invincible = 3; asteroids[0].x = ship.x; asteroids[0].y = ship.y; update(0);');
  assert.equal(run('lives'), 3);
  assert.equal(run('ship.shield.active'), false);
  run('ship.shield.activate(); ship.shield.update(3); update(0);');
  assert.equal(run('lives'), 3);
  assert.equal(run('ship.invincible'), 3);
});

test('shield permits thrust, shooting and normal destruction/scoring', () => {
  const { run } = createGame();
  run('ship.shield.activate(); keys.ArrowUp = true; justPressed.Space = true; update(0.05);');
  assert.equal(run('bullets.length'), 1);
  assert.ok(run('ship.vy < 0'));
  run(`shootingStars.star = new ShootingStar({ x: 100, y: 100, angle: 0, width: W, height: H });
    bullets = [new Bullet(100, 100, 0)]; update(0);`);
  assert.equal(run('score'), 200);
  assert.equal(run('shootingStars.star'), null);
  assert.equal(run('ship.shield.active'), true);
});

test('halo stays visible while invincibility blinks; HUD reports ready, active and cooldown', () => {
  const { run, calls } = createGame();
  run('drawShipShieldHUD(ctx, ship);');
  assert.ok(calls.some(call => call[0] === 'fillText' && call[1] === 'ESCUDO [S] LISTO'));
  calls.length = 0;
  run('ship.shield.activate(); ship.invincible = 3; ship.draw(); drawShipShield(ctx, ship); drawShipShieldHUD(ctx, ship);');
  assert.ok(calls.some(call => call[0] === 'arc' && call[3] === run('SHIP_SHIELD_STYLE.radius')));
  assert.ok(calls.some(call => call[0] === 'fillText' && call[1] === 'ESCUDO ACTIVO  3.0 s'));
  calls.length = 0;
  run('ship.shield.update(3); drawShipShield(ctx, ship); drawShipShieldHUD(ctx, ship);');
  assert.ok(!calls.some(call => call[0] === 'arc'));
  assert.ok(calls.some(call => call[0] === 'fillText' && call[1] === 'ESCUDO RECARGANDO  5.0 s'));
  calls.length = 0;
  run('ship.dead = true; drawShipShield(ctx, ship); drawShipShieldHUD(ctx, ship);');
  assert.ok(!calls.some(call => call[0] === 'arc'));
  assert.ok(calls.some(call => call[0] === 'fillText' && call[1] === 'ESCUDO — NO DISPONIBLE'));
});
