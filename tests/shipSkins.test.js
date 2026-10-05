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
  const selector = { children: [], events: {},
    appendChild(option) { this.children.push(option); },
    addEventListener(name, handler) { this.events[name] = handler; },
  };
  const events = {};
  const context = createContext({
    document: {
      getElementById: id => id === 'canvas' ? { getContext: () => drawing } : selector,
      createElement: () => ({}),
    },
    window: { addEventListener: (name, handler) => { events[name] = handler; } },
    requestAnimationFrame() {},
  });
  const scripts = ['speedPowerUp.js', 'speedPowerUpView.js', 'shootingStar.js',
    'shootingStarView.js', 'shipSkins.js', 'shipSkinView.js',
    'shipShield.js', 'shipShieldView.js', 'game.js'];
  scripts.forEach(filename => runInContext(
    readFileSync(join(__dirname, '..', filename), 'utf8'), context, { filename }));
  return { run: code => runInContext(code, context), selector, events, calls };
}

test('selector starts with Classic and offers three validated skins', () => {
  const { run, selector } = createGame();
  assert.deepEqual(selector.children.map(option => option.value), ['classic', 'neon', 'fighter']);
  assert.equal(selector.value, 'classic');
  assert.equal(run("selectShipSkin('neon')"), true);
  for (const invalid of [null, undefined, '', 'unknown', 'toString', {}]) {
    assert.equal(run(`selectShipSkin(${JSON.stringify(invalid)})`), false);
    assert.equal(run('getSelectedShipSkinId()'), 'neon');
  }
});

test('changing the selector updates the skin without resetting the game', () => {
  const { run, selector } = createGame();
  run('score = 123; ship.vx = 42; ship.shootCooldown = 0.1;');
  selector.value = 'fighter';
  selector.events.change();
  assert.equal(run('getSelectedShipSkinId()'), 'fighter');
  assert.equal(run('score'), 123);
  assert.equal(run('ship.vx'), 42);
  assert.equal(run('ship.shootCooldown'), 0.1);
  assert.equal(run('ship.radius'), 12);
});

test('skin survives respawn, next level and game-over restart', () => {
  const { run } = createGame();
  run("selectShipSkin('neon'); killShip(); update(2);");
  assert.equal(run('getSelectedShipSkinId()'), 'neon');
  assert.equal(run('ship.dead'), false);
  run('nextLevel();');
  assert.equal(run('getSelectedShipSkinId()'), 'neon');
  run("state = 'gameover'; justPressed.Space = true; update(0);");
  assert.equal(run('getSelectedShipSkinId()'), 'neon');
  assert.equal(run('state'), 'playing');
  assert.equal(run('lives'), 3);
});

test('skins keep identical movement, collision radius and bullet origin', () => {
  const { run } = createGame();
  const snapshots = ['classic', 'neon', 'fighter'].map(id => run(`
    selectShipSkin('${id}'); ship.reset(); keys.ArrowUp = true;
    ship.update(0.05);
    {
      const shot = ship.tryShoot()[0];
      JSON.stringify([ship.x, ship.y, ship.vx, ship.vy, ship.radius,
        shot.x, shot.y, shot.vx, shot.vy]);
    }
  `));
  assert.equal(snapshots[0], snapshots[1]);
  assert.equal(snapshots[1], snapshots[2]);
});

test('ship, flame and life icons use the selected skin; invincibility still blinks', () => {
  const { run, calls } = createGame();
  run("selectShipSkin('neon'); ship.invincible = 0; ship.thrusting = true; Math.random = () => 1; ship.draw(); drawLifeIcon(10, 10);");
  assert.equal(calls.filter(call => call[0] === 'strokeStyle' && call[1] === '#66f7ff').length, 2);
  assert.ok(calls.some(call => call[0] === 'strokeStyle' && call[1] === '#c4a0ff'));
  calls.length = 0;
  run('ship.invincible = 3; ship.draw();');
  assert.equal(calls.length, 0);
  run('ship.invincible = 0; ship.dead = true; ship.draw();');
  assert.equal(calls.length, 0);
});

test('selector focus releases movement and pending shots; its keyboard input stays native', () => {
  const { run, selector, events } = createGame();
  run('keys.ArrowUp = true; justPressed.Space = true;');
  selector.events.focus();
  assert.equal(run('keys.ArrowUp'), false);
  assert.equal(run('pressed("Space")'), false);
  events.keydown({ code: 'ArrowUp', target: { closest: () => selector },
    preventDefault() { assert.fail('Native selector input must not be prevented'); } });
  assert.equal(run('keys.ArrowUp'), false);
});
