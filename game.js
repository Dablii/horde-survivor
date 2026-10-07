// game.js - Hlavní herní smyčka, kolize, autoshooting, přechody stage, UI logika

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Velikost okna
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Stav kláves (WASD)
    this.keys = {};
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Klávesa pauzy (Escape nebo P)
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.state === 'playing') {
          this.pauseGame();
        } else if (this.state === 'paused') {
          this.resumeGame();
        }
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Herní stav
    this.state = 'start'; // 'start', 'playing', 'paused', 'levelup', 'stageclear', 'gameover', 'victory'
    this.currentStageIndex = 0;
    this.survivalTime = 0; // v sekundách
    this.stageTimer = 0;
    this.totalKills = 0;
    this.totalDamageDealt = 0;

    // Entity
    this.player = new Player(0, 0);
    this.projectiles = [];
    this.enemies = [];
    this.xpGems = [];
    this.bossSpawnedForCurrentStage = false;

    // Kamera
    this.camera = { x: 0, y: 0 };

    // Časovače
    this.lastTime = 0;
    this.spawnTimer = 0;

    // Virtuální joystick (pro mobily / dotyk)
    this.joystick = {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      inputX: 0,
      inputY: 0,
      maxRadius: 45
    };

    // UI reference
    this.setupUI();
    this.setupJoystick();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupUI() {
    // Tlačítko start
    document.getElementById('btn-start').addEventListener('click', () => {
      window.sound.init();
      document.getElementById('start-modal').classList.add('hidden');
      this.startGame();
    });

    // Tlačítko restart po smrti
    document.getElementById('btn-restart').addEventListener('click', () => {
      document.getElementById('gameover-modal').classList.add('hidden');
      this.restartGame();
    });

    // Tlačítko restart po vítězství
    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      document.getElementById('victory-modal').classList.add('hidden');
      this.restartGame();
    });

    // Další stage
    document.getElementById('btn-next-stage').addEventListener('click', () => {
      document.getElementById('stage-clear-modal').classList.add('hidden');
      this.advanceToNextStage();
    });

    // Tlačítko pauzy v HUDu
    document.getElementById('btn-pause').addEventListener('click', () => {
      if (this.state === 'playing') {
        this.pauseGame();
      } else if (this.state === 'paused') {
        this.resumeGame();
      }
    });

    // Tlačítko pokračovat v pauze
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.resumeGame();
    });

    // Tlačítko restart v pauze
    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      document.getElementById('pause-modal').classList.add('hidden');
      this.restartGame();
    });

    // Zvuk mute/unmute
    const audioBtn = document.getElementById('btn-audio');
    audioBtn.addEventListener('click', () => {
      const isMuted = window.sound.toggleMute();
      audioBtn.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  setupJoystick() {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');

    // Automatická detekce dotykového zařízení
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) {
      zone.classList.remove('hidden');
    }

    // Pokud uživatel poprvé tapne na obrazovku na mobilu, joystick se zviditelní
    window.addEventListener('touchstart', () => {
      if (zone.classList.contains('hidden')) {
        zone.classList.remove('hidden');
      }
    }, { once: true });

    const handleTouchStart = (e) => {
      e.preventDefault();
      if (this.joystick.active) return;
      const touch = e.changedTouches[0];
      this.joystick.touchId = touch.identifier;
      this.joystick.active = true;

      const rect = base.getBoundingClientRect();
      this.joystick.startX = rect.left + rect.width / 2;
      this.joystick.startY = rect.top + rect.height / 2;
      this.handleTouchMove(touch, thumb);
    };

    const handleTouchMoveEvent = (e) => {
      e.preventDefault();
      if (!this.joystick.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystick.touchId) {
          this.handleTouchMove(touch, thumb);
          break;
        }
      }
    };

    const handleTouchEndEvent = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystick.touchId) {
          this.joystick.active = false;
          this.joystick.touchId = null;
          this.joystick.inputX = 0;
          this.joystick.inputY = 0;
          thumb.style.transform = `translate(0px, 0px)`;
          break;
        }
      }
    };

    zone.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMoveEvent, { passive: false });
    window.addEventListener('touchend', handleTouchEndEvent, { passive: false });
    window.addEventListener('touchcancel', handleTouchEndEvent, { passive: false });
  }

  handleTouchMove(touch, thumb) {
    const dx = touch.clientX - this.joystick.startX;
    const dy = touch.clientY - this.joystick.startY;
    const dist = Math.hypot(dx, dy);
    const maxR = this.joystick.maxRadius;

    if (dist === 0) {
      this.joystick.inputX = 0;
      this.joystick.inputY = 0;
      thumb.style.transform = `translate(0px, 0px)`;
      return;
    }

    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const moveX = Math.cos(angle) * clampedDist;
    const moveY = Math.sin(angle) * clampedDist;

    thumb.style.transform = `translate(${moveX}px, ${moveY}px)`;
    this.joystick.inputX = moveX / maxR;
    this.joystick.inputY = moveY / maxR;
  }

  pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    document.getElementById('pause-modal').classList.remove('hidden');
  }

  resumeGame() {
    if (this.state !== 'paused') return;
    document.getElementById('pause-modal').classList.add('hidden');
    this.state = 'playing';
    this.lastTime = performance.now(); // zabránit časovému skoku
  }

  startGame() {
    this.state = 'playing';
    document.getElementById('pause-modal').classList.add('hidden');
    this.currentStageIndex = 0;
    this.survivalTime = 0;
    this.stageTimer = 0;
    this.totalKills = 0;
    this.totalDamageDealt = 0;

    this.player = new Player(0, 0);
    this.projectiles = [];
    this.enemies = [];
    this.xpGems = [];
    window.particleSystem.reset();
    window.buffManager.reset();

    this.bossSpawnedForCurrentStage = false;
    this.updateHUD();
    this.updateBuffIconsHUD();

    this.lastTime = performance.now();
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  restartGame() {
    this.startGame();
  }

  get currentStageConfig() {
    return window.STAGE_CONFIGS[this.currentStageIndex] || window.STAGE_CONFIGS[window.STAGE_CONFIGS.length - 1];
  }

  gameLoop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.state === 'playing') {
      this.update(dt);
    }

    this.render();

    if (this.state !== 'gameover' && this.state !== 'victory') {
      requestAnimationFrame((ts) => this.gameLoop(ts));
    }
  }

  update(dt) {
    this.survivalTime += dt;
    this.stageTimer += dt;

    // Aktualizace hráče (klávesnice + joystick)
    const joyVec = { x: this.joystick.inputX, y: this.joystick.inputY };
    this.player.update(dt, this.keys, joyVec);

    // Aktualizace kamery (sleduje hráče do středu)
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;

    // Autoshooting mechanika
    this.handleAutoShooting(dt);

    // Dodatečné schopnosti (Blesky & Orbitals)
    this.handleSpecialPassives(dt);

    // Spawnování nepřátel
    this.handleEnemySpawning(dt);

    // Aktualizace střel
    this.projectiles = this.projectiles.filter((p) => {
      const alive = p.update(dt);
      if (!alive) return false;

      // Kolize střely s nepřáteli
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (p.hitEnemies.has(e)) continue;

        const dist = Math.hypot(p.x - e.x, p.y - e.y);
        if (dist <= p.radius + e.radius) {
          p.hitEnemies.add(e);
          this.totalDamageDealt += p.damage;
          const killed = e.takeDamage(p.damage);

          // Splash zranění
          if (p.splash && p.splashRadius > 0) {
            window.sound.explosion();
            window.particleSystem.spawnExplosion(p.x, p.y, '#f97316', 15);
            for (let j = 0; j < this.enemies.length; j++) {
              const other = this.enemies[j];
              if (other !== e) {
                const splashDist = Math.hypot(p.x - other.x, p.y - other.y);
                if (splashDist <= p.splashRadius) {
                  const splashDmg = Math.round(p.damage * 0.6);
                  this.totalDamageDealt += splashDmg;
                  if (other.takeDamage(splashDmg)) {
                    this.onEnemyKilled(other);
                  }
                }
              }
            }
          }

          if (killed) {
            this.onEnemyKilled(e);
          }

          // Průraznost
          if (p.pierce > 0) {
            p.pierce--;
          } else {
            return false; // Střela zaniká
          }
        }
      }
      return true;
    });

    // Aktualizace nepřátel a kolize s hráčem
    this.enemies.forEach((enemy) => {
      enemy.update(dt, this.player);

      // Poškození hráče kontaktem
      const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
      if (dist <= this.player.radius + enemy.radius) {
        if (this.player.takeDamage(enemy.damage)) {
          if (this.player.hp <= 0) {
            this.triggerGameOver();
          }
        }
      }
    });

    // Úklid mrtvých nepřátel
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // XP drahokamy
    this.xpGems = this.xpGems.filter((gem) => {
      const collected = gem.update(dt, this.player);
      if (collected) {
        this.checkLevelUp();
      }
      return !collected;
    });

    // Aktualizace částic
    window.particleSystem.update(dt);

    // Kontrola postupu stage / Bosse
    this.checkStageProgress();

    // Aktualizace UI ukazatelů
    this.updateHUD();
  }

  handleAutoShooting(dt) {
    if (this.player.fireCooldown <= 0 && this.enemies.length > 0) {
      // Nalezení nejbližšího nepřítele v dosahu hráče
      let closestEnemy = null;
      let closestDist = this.player.range;

      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      if (closestEnemy) {
        this.player.fireCooldown = this.player.fireInterval;
        window.sound.shoot();

        // Výpočet úhlu
        const baseAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
        const projectileSpeed = 12;

        const count = 1 + this.player.extraProjectiles;
        const spreadAngle = 0.18; // radiány vějíře střel

        for (let i = 0; i < count; i++) {
          const angleOffset = count === 1 ? 0 : (i - (count - 1) / 2) * spreadAngle;
          const angle = baseAngle + angleOffset;
          const vx = Math.cos(angle) * projectileSpeed;
          const vy = Math.sin(angle) * projectileSpeed;

          this.projectiles.push(
            new Projectile(
              this.player.x,
              this.player.y,
              vx,
              vy,
              this.player.damage,
              this.player.pierceCount,
              this.player.hasSplash,
              this.player.splashRadius
            )
          );
        }
      }
    }
  }

  handleSpecialPassives(dt) {
    // 1. Orbiting blades sekají nepřátele kolem hráče
    if (this.player.hasOrbitals && this.player.orbitalsCount > 0) {
      const radius = 65;
      const count = this.player.orbitalsCount;
      for (let i = 0; i < count; i++) {
        const angle = this.player.orbitalAngle + (i * (Math.PI * 2 / count));
        const ox = this.player.x + Math.cos(angle) * radius;
        const oy = this.player.y + Math.sin(angle) * radius;

        // Kontrola kolize čepele s nepřáteli
        for (let j = 0; j < this.enemies.length; j++) {
          const e = this.enemies[j];
          const dist = Math.hypot(e.x - ox, e.y - oy);
          if (dist < e.radius + 14) {
            // Každých pár ticků seknout
            if (e.hitFlash <= 0) {
              const bladeDmg = Math.round(this.player.damage * 0.75);
              this.totalDamageDealt += bladeDmg;
              if (e.takeDamage(bladeDmg)) {
                this.onEnemyKilled(e);
              }
            }
          }
        }
      }
    }

    // 2. Chain Lightning
    if (this.player.hasLightning && this.player.lightningCooldown <= 0 && this.enemies.length > 0) {
      this.player.lightningCooldown = 2.4; // každých 2.4s
      const inRangeEnemies = this.enemies.filter(e => Math.hypot(e.x - this.player.x, e.y - this.player.y) <= this.player.range);
      if (inRangeEnemies.length > 0) {
        window.sound.laser();
        // Zásah 1 až N cílů
        const target = inRangeEnemies[Math.floor(Math.random() * inRangeEnemies.length)];
        const lightningDmg = Math.round(this.player.damage * 1.5);
        this.totalDamageDealt += lightningDmg;
        window.particleSystem.spawnExplosion(target.x, target.y, '#38bdf8', 12);
        if (target.takeDamage(lightningDmg)) {
          this.onEnemyKilled(target);
        }

        // Řetězení
        let lastX = target.x;
        let lastY = target.y;
        const chains = this.player.lightningChain;
        const chained = new Set([target]);

        for (let c = 0; c < chains; c++) {
          let nextTarget = null;
          let nextDist = 200;
          for (let e of this.enemies) {
            if (!chained.has(e)) {
              const d = Math.hypot(e.x - lastX, e.y - lastY);
              if (d < nextDist) {
                nextDist = d;
                nextTarget = e;
              }
            }
          }
          if (nextTarget) {
            chained.add(nextTarget);
            window.particleSystem.spawnExplosion(nextTarget.x, nextTarget.y, '#38bdf8', 8);
            const chainDmg = Math.round(lightningDmg * 0.7);
            this.totalDamageDealt += chainDmg;
            if (nextTarget.takeDamage(chainDmg)) {
              this.onEnemyKilled(nextTarget);
            }
            lastX = nextTarget.x;
            lastY = nextTarget.y;
          }
        }
      }
    }
  }

  handleEnemySpawning(dt) {
    const config = this.currentStageConfig;
    this.spawnTimer += dt;
    const spawnInterval = 1 / config.spawnRate;

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemyAtEdge(config);
    }

    // Spawnutí bosse stage ke konci času
    if (!this.bossSpawnedForCurrentStage && this.stageTimer >= config.durationSeconds - 10) {
      this.spawnBoss(config);
      this.bossSpawnedForCurrentStage = true;
    }
  }

  spawnEnemyAtEdge(config) {
    // Spawnutí těsně mimo obrazovku
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(this.canvas.width, this.canvas.height) * 0.65;
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    const allowed = config.allowedEnemies;
    const type = allowed[Math.floor(Math.random() * allowed.length)];
    this.enemies.push(new Enemy(x, y, type, config.stage));
  }

  spawnBoss(config) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(this.canvas.width, this.canvas.height) * 0.6;
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    const boss = new BossEnemy(x, y, config.bossType, config.stage);
    this.enemies.push(boss);
    window.particleSystem.spawnExplosion(x, y, '#ef4444', 35);
  }

  onEnemyKilled(enemy) {
    this.totalKills++;
    window.particleSystem.spawnExplosion(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 45 : 12);
    // Vytvoření XP drahokamu
    this.xpGems.push(new XPGem(enemy.x, enemy.y, enemy.xpValue));

    // Pokud byl zabit finální boss 10. stage
    if (enemy.isBoss && this.currentStageConfig.stage === 10) {
      this.triggerVictory();
    }
  }

  checkLevelUp() {
    while (this.player.xp >= this.player.xpToNextLevel) {
      this.player.xp -= this.player.xpToNextLevel;
      this.player.level++;
      // XP křivka pro další level
      this.player.xpToNextLevel = Math.round(this.player.xpToNextLevel * 1.35 + 5);

      window.sound.levelUp();
      this.openLevelUpModal();
      break; // Zobrazí modal pro 1 level, po výběru se eventuálně vyhodnotí další
    }
  }

  openLevelUpModal() {
    this.state = 'levelup';
    const modal = document.getElementById('levelup-modal');
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    const choices = window.buffManager.getRandomSelection(3);

    choices.forEach((buff) => {
      const curLvl = window.buffManager.getLevel(buff.id);
      const nextLvl = curLvl + 1;

      const card = document.createElement('div');
      card.className = `upgrade-card rarity-${buff.rarity || 'common'}`;
      card.innerHTML = `
        <div class="card-icon">${buff.icon}</div>
        <div class="card-title">${buff.name}</div>
        <div class="card-tier">${buff.tier}</div>
        <div class="card-desc">${buff.description}</div>
        <div class="card-level-tag">Úroveň ${nextLvl} / ${buff.maxLevel}</div>
      `;

      card.addEventListener('click', () => {
        window.buffManager.applyBuff(buff.id, this.player);
        modal.classList.add('hidden');
        this.updateBuffIconsHUD();
        this.state = 'playing';

        // Kontrola, zda hráč nemá dostatek XP na další okamžitý level
        this.checkLevelUp();
      });

      container.appendChild(card);
    });

    modal.classList.remove('hidden');
  }

  checkStageProgress() {
    const config = this.currentStageConfig;
    // Postup do další stage po vypršení času zóny a zabití bosse (nebo pokud boss padl a čas uběhl)
    const bossAlive = this.enemies.some(e => e.isBoss);

    if (this.stageTimer >= config.durationSeconds && !bossAlive && this.bossSpawnedForCurrentStage) {
      if (this.currentStageIndex >= window.STAGE_CONFIGS.length - 1) {
        this.triggerVictory();
      } else {
        this.triggerStageClear();
      }
    }
  }

  triggerStageClear() {
    this.state = 'stageclear';
    window.sound.stageClear();

    const modal = document.getElementById('stage-clear-modal');
    const desc = document.getElementById('stage-clear-desc');
    desc.textContent = `Gratulace! Úspěšně jsi dokončil Stage ${this.currentStageConfig.stage}: ${this.currentStageConfig.name}!`;
    modal.classList.remove('hidden');
  }

  advanceToNextStage() {
    this.currentStageIndex++;
    this.stageTimer = 0;
    this.bossSpawnedForCurrentStage = false;

    // Částečné vyčištění nepřátel
    this.enemies = [];
    this.player.heal(40); // Odměna za postup - uzdravení 40 HP
    this.state = 'playing';
  }

  triggerGameOver() {
    this.state = 'gameover';
    window.sound.gameOver();

    const modal = document.getElementById('gameover-modal');
    document.getElementById('final-survival-time').textContent = this.formatTime(this.survivalTime);
    document.getElementById('final-stage').textContent = `${this.currentStageConfig.stage} (${this.currentStageConfig.name})`;
    document.getElementById('final-level').textContent = this.player.level;
    document.getElementById('final-kills').textContent = this.totalKills;
    document.getElementById('final-damage').textContent = this.totalDamageDealt;

    modal.classList.remove('hidden');
  }

  triggerVictory() {
    this.state = 'victory';
    window.sound.stageClear();

    const modal = document.getElementById('victory-modal');
    document.getElementById('victory-time').textContent = this.formatTime(this.survivalTime);
    document.getElementById('victory-level').textContent = this.player.level;
    document.getElementById('victory-kills').textContent = this.totalKills;

    modal.classList.remove('hidden');
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateHUD() {
    // XP
    const xpPercent = Math.min(100, (this.player.xp / this.player.xpToNextLevel) * 100);
    document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;
    document.getElementById('level-display').textContent = this.player.level;
    document.getElementById('xp-ratio').textContent = `${Math.floor(this.player.xp)}/${this.player.xpToNextLevel}`;

    // HP
    const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    document.getElementById('hp-bar-fill').style.width = `${hpPercent}%`;
    document.getElementById('hp-text').textContent = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;

    // Kills & Time
    document.getElementById('kill-count').textContent = this.totalKills;
    document.getElementById('survival-timer').textContent = this.formatTime(this.survivalTime);

    // Stage
    document.getElementById('stage-display').textContent = this.currentStageConfig.stage;
    document.getElementById('stage-name').textContent = this.currentStageConfig.name;
  }

  updateBuffIconsHUD() {
    const list = document.getElementById('active-buffs-list');
    list.innerHTML = '';
    const active = window.buffManager.activeBuffLevels;
    for (const [id, lvl] of Object.entries(active)) {
      const def = BUFF_DEFINITIONS.find(b => b.id === id);
      if (def) {
        const tag = document.createElement('div');
        tag.className = 'buff-mini-tag';
        tag.title = `${def.name} (Lvl ${lvl})`;
        tag.innerHTML = `<span>${def.icon}</span><strong>${lvl}</strong>`;
        list.appendChild(tag);
      }
    }
  }

  render() {
    const config = this.currentStageConfig;
    const ctx = this.ctx;

    // 1. Pozadí a mřížka odpovídající stage
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Mřížka mapy pohybující se s kamerou
    const gridSize = 80;
    const offsetX = -this.camera.x % gridSize;
    const offsetY = -this.camera.y % gridSize;

    ctx.strokeStyle = config.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offsetX; x < this.canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
    }
    for (let y = offsetY; y < this.canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
    }
    ctx.stroke();

    // 2. XP Krystaly
    for (let i = 0; i < this.xpGems.length; i++) {
      this.xpGems[i].draw(ctx, this.camera);
    }

    // 3. Nepřátelé
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].draw(ctx, this.camera);
    }

    // 4. Projektily
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].draw(ctx, this.camera);
    }

    // 5. Hráč
    this.player.draw(ctx, this.camera);

    // 6. Částice a čísla poškození
    window.particleSystem.draw(ctx, this.camera);
  }
}

// Inicializace po načtení DOM
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
