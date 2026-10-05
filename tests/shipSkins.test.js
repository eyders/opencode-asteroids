'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { createContext, runInContext } = require('node:vm');

function createGame(options = {}) {
  const events = {};
  const warnings = [];
  const storage = new Map(options.savedSkin ? [['asteroids.shipSkin', options.savedSkin]] : []);
  const drawing = [];
  const context2d = new Proxy({}, {
    get: (_, method) => (...args) => drawing.push([method, ...args]),
    set: (target, key, value) => { drawing.push([key, value]); return true; },
  });
  const selector = {
    value: '', options: [],
    appendChild(option) { this.options.push(option); },
    addEventListener(type, handler) { events[`select:${type}`] = handler; },
  };
  const context = createContext({
    document: {
      getElementById: id => id === 'ship-skin' ? selector : { getContext: () => context2d },
      createElement: () => ({}),
    },
    window: {
      addEventListener: (type, handler) => { events[type] = handler; },
      localStorage: {
        getItem(key) {
          if (options.blockStorage) throw new Error('Storage blocked');
          return storage.get(key) ?? null;
        },
        setItem(key, value) {
          if (options.blockStorage) throw new Error('Storage blocked');
          storage.set(key, value);
        },
      },
    },
    console: { warn: message => warnings.push(message) },
    requestAnimationFrame() {},
  });
  const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(match => match[1]);
  scripts.forEach(filename => runInContext(readFileSync(join(__dirname, '..', filename), 'utf8'), context, { filename }));
  return { run: code => runInContext(code, context), selector, storage, events, warnings, drawing };
}

test('selector offers all merged skins and restores only valid stored preferences', () => {
  const game = createGame();
  assert.deepEqual(game.selector.options.map(option => option.textContent), ['Clásica', 'Neón', 'Solar', 'Caza']);
  assert.equal(game.selector.value, 'classic');
  assert.equal(createGame({ savedSkin: 'solar' }).selector.value, 'solar');
  assert.equal(createGame({ savedSkin: 'unknown' }).selector.value, 'classic');
  assert.equal(game.run("selectShipSkin('unknown')"), false);
  assert.equal(game.run('getSelectedShipSkin().id'), 'classic');
  assert.equal(game.run('SHIP_SKINS.every(skin => Object.isFrozen(skin) && Object.isFrozen(skin.vertices[0]))'), true);
});

test('changing the selector saves the skin without changing gameplay state', () => {
  const game = createGame();
  const before = game.run('JSON.stringify([ship.x, ship.y, ship.radius, ship.vx, ship.vy, score, lives, level])');
  game.selector.value = 'neon';
  game.events['select:change']();
  assert.equal(game.run('getSelectedShipSkin().id'), 'neon');
  assert.equal(game.storage.get('asteroids.shipSkin'), 'neon');
  assert.equal(game.run('JSON.stringify([ship.x, ship.y, ship.radius, ship.vx, ship.vy, score, lives, level])'), before);
});

test('blocked storage does not prevent selecting or playing', () => {
  const game = createGame({ blockStorage: true });
  game.selector.value = 'solar';
  game.events['select:change']();
  assert.equal(game.run('getSelectedShipSkin().id'), 'solar');
  assert.equal(game.warnings.length, 2);
  assert.doesNotThrow(() => game.run('update(0); draw()'));
});

test('skin survives respawn, level progression and Space restart', () => {
  const { run } = createGame();
  run("selectShipSkin('neon'); killShip(); update(2)");
  assert.equal(run('state'), 'playing');
  assert.equal(run('getSelectedShipSkin().id'), 'neon');
  run('asteroids = []; update(0)');
  assert.equal(run('level'), 2);
  assert.equal(run('getSelectedShipSkin().id'), 'neon');
  run("state = 'gameover'; justPressed.Space = true; update(0)");
  assert.equal(run('level'), 1);
  assert.equal(run('getSelectedShipSkin().id'), 'neon');
});

test('all skins keep physics and bullet origins identical', () => {
  const { run } = createGame();
  const snapshots = run(`SHIP_SKINS.map(skin => {
    selectShipSkin(skin.id);
    ship.reset(); keys.ArrowUp = true; keys.ArrowRight = true;
    ship.update(0.05);
    const bullet = ship.tryShoot()[0];
    return JSON.stringify([ship.x, ship.y, ship.vx, ship.vy, ship.angle, ship.radius,
      bullet.x, bullet.y, bullet.vx, bullet.vy]);
  })`);
  assert.equal(new Set(snapshots).size, 1);
});

test('rendering uses selected hull and life icons while preserving invincibility blinking', () => {
  const game = createGame();
  for (const id of ['classic', 'neon', 'solar', 'fighter']) {
    game.drawing.length = 0;
    game.run(`selectShipSkin('${id}'); ship.invincible = 0; ship.draw(); drawLifeIcon(10, 10)`);
    const color = game.run('getSelectedShipSkin().color');
    assert.equal(game.drawing.filter(call => call[0] === 'strokeStyle' && call[1] === color).length, 2);
    assert.equal(game.drawing.filter(call => call[0] === 'fill').length, ['classic', 'fighter'].includes(id) ? 0 : 2);
  }
  game.drawing.length = 0;
  game.run('ship.invincible = 3; ship.draw()');
  assert.equal(game.drawing.length, 0);
  game.run('ship.invincible = 0; ship.dead = true; ship.draw()');
  assert.equal(game.drawing.length, 0);
});

test('selector keyboard events do not move, shoot or restart the game', () => {
  const game = createGame();
  const target = { closest: () => game.selector };
  game.events.keydown({ code: 'Space', target, preventDefault() { assert.fail('native input blocked'); } });
  assert.equal(game.run("!!pressed('Space')"), false);
  game.events.keydown({ code: 'ArrowUp', target });
  assert.equal(game.run('!!keys.ArrowUp'), false);
  game.events.keydown({ code: 'Space', target: { closest: () => null }, preventDefault() {} });
  assert.equal(game.run("pressed('Space')"), true);
});

test('selector focus releases movement, shots and pending shield activation', () => {
  const { run, events } = createGame();
  run('keys.ArrowUp = true; justPressed.Space = true; justPressed.KeyS = true;');
  events['select:focus']();
  assert.equal(run('keys.ArrowUp'), false);
  assert.equal(run('pressed("Space")'), false);
  assert.equal(run('pressed("KeyS")'), false);
});

test('all skins allow simultaneous shield, triple shot and speed boost without HUD overlap', () => {
  const { run } = createGame();
  run('asteroids = [{ x: 0, y: 0, radius: 16, dead: false, update() {}, draw() {} }];');
  for (const id of ['classic', 'neon', 'solar', 'fighter']) {
    run(`selectShipSkin('${id}'); ship.reset(); ship.invincible = 0;
      ship.tripleShotRemaining = 5; ship.speedBoostRemaining = 5;
      keys.ArrowUp = true; justPressed.Space = true; justPressed.KeyS = true;
      bullets = []; update(0.05); draw();`);
    assert.equal(run('bullets.length'), 3);
    assert.equal(run('ship.shield.active'), true);
    assert.equal(run('lives'), 3);
    assert.ok(run('ship.vy < 0'));
  }
  assert.ok(run('SHIP_SHIELD_STYLE.hudY > TRIPLE_SHOT_POWER_UP_STYLE.hudY + 15'));
});
