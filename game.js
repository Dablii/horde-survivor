// game.js - Hlavní herní smyčka, kolize, autoshooting, přechody stage, UI logika

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Velikost okna a responzivita (včetně rotace mobilu)
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resizeCanvas(), 100));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.resizeCanvas());
    }

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
    this.state = 'start'; // 'start', 'playing', 'paused', 'levelup', 'stageclear', 'gameover', 'victory', 'shop'
    this.currentStageIndex = 0;
    this.survivalTime = 0; // v sekundách
    this.stageTimer = 0;
    this.totalKills = 0;
    this.totalDamageDealt = 0;
    this.runGold = 0; // Zlato získané v aktuálním runu
    this.gameMode = 'campaign'; // 'campaign' nebo 'endless'

    // Meta-progrese a lifetime statistiky
    this.gold = 0; // Celkové uložené zlato
    this.lifetimeStats = {
      bestSurvivalTime: 0,
      bestEndlessSurvivalTime: 0,
      highestStage: 1,
      highestLevel: 1,
      totalKills: 0
    };
    this.metaUpgrades = {
      maxHp: 0,
      movespeed: 0,
      damage: 0,
      xpMultiplier: 0,
      range: 0,
      regen: 0,
      magnet: 0
    };
    this.unlockedSkins = ['default'];
    this.activeSkin = 'default';
    this.shopTab = 'upgrades';
    this.obstacles = [];
    this.loadPersistentData();

    // Entity
    this.player = new Player(0, 0);
    this.projectiles = [];
    this.enemyProjectiles = []; // Telegrafované a vystřelené projektily nepřátel
    this.enemies = [];
    this.xpGems = [];
    this.goldCoins = []; // Vypadlé mince z monster
    this.firePatches = []; // Ohnivé stopy zanechané hráčem
    this.holyCrosses = []; // Rotující posvátné kříže
    this.bossSpawnedForCurrentStage = false;

    // Mechaniky: Anti-Camping & Endless mód & Konsolidace gemů
    this.campAnchor = { x: 0, y: 0 };
    this.campTimer = 0;
    this.campWarnLevel = 0; // 0: v pořádku, 1: výstražná zóna (>3.5s), 2: poškození (>5s)
    this.campDamageTick = 0;
    this.endlessBossTimer = 0;
    this.gemConsolidationTimer = 0;

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
    this.setupStaticIcons();
    this.updateStatsUI();
  }

  setupStaticIcons() {
    if (!window.getSvg) return;

    const setHtml = (id, svgName) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = window.getSvg(svgName);
    };

    const setAllHtml = (selector, svgName) => {
      document.querySelectorAll(selector).forEach(el => {
        el.innerHTML = window.getSvg(svgName);
      });
    };

    // HUD ikony
    setHtml('hud-icon-hp', 'heart');
    setHtml('hud-icon-kill', 'skull');
    setHtml('hud-icon-gold', 'coin');
    setHtml('hud-icon-timer', 'hourglass');
    setHtml('btn-pause', 'pause');

    // Audio tlačítko
    const audioBtn = document.getElementById('btn-audio');
    if (audioBtn) {
      const isMuted = window.sound && window.sound.isMuted;
      audioBtn.innerHTML = isMuted ? window.getSvg('soundOff') : window.getSvg('soundOn');
    }

    // Ikony v menu a lifetime statistikách
    setHtml('stat-icon-time', 'hourglass');
    setHtml('stat-icon-stage', 'map');
    setHtml('stat-icon-level', 'star');
    setHtml('stat-icon-kills', 'skull');
    setHtml('stat-icon-gold', 'coin');

    // Třídy v záhlavích a modalech
    setAllHtml('.svg-inline-coin', 'coin');
    setAllHtml('.modal-skull-icon', 'skull');
    setAllHtml('.logo-sword-left', 'sword');
    setAllHtml('.logo-sword-right', 'sword');
    setAllHtml('.stats-trophy-icon', 'trophy');
    setAllHtml('.btn-sword-icon', 'sword');
    setAllHtml('.btn-shop-icon', 'temple');
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupUI() {
    // Tlačítko start kampaně
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        window.sound.init();
        document.getElementById('start-modal').classList.add('hidden');
        this.startCampaignGame();
      });
    }

    const startCampaignBtn = document.getElementById('btn-start-campaign');
    if (startCampaignBtn) {
      startCampaignBtn.addEventListener('click', () => {
        window.sound.init();
        document.getElementById('start-modal').classList.add('hidden');
        this.startCampaignGame();
      });
    }

    // Tlačítko start Endless módu
    const startEndlessBtn = document.getElementById('btn-start-endless');
    if (startEndlessBtn) {
      startEndlessBtn.addEventListener('click', () => {
        window.sound.init();
        document.getElementById('start-modal').classList.add('hidden');
        this.startEndlessGame();
      });
    }

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

    // Tlačítko "Zpět do Hlavního menu" v pauze
    const pauseMenuBtn = document.getElementById('btn-pause-menu');
    if (pauseMenuBtn) {
      pauseMenuBtn.addEventListener('click', () => {
        this.quitToMainMenu();
      });
    }

    // Tlačítko "Zpět do Hlavního menu" v Game Over a Victory
    const goMenuBtn = document.getElementById('btn-gameover-menu');
    if (goMenuBtn) {
      goMenuBtn.addEventListener('click', () => {
        this.quitToMainMenu();
      });
    }
    const vicMenuBtn = document.getElementById('btn-victory-menu');
    if (vicMenuBtn) {
      vicMenuBtn.addEventListener('click', () => {
        this.quitToMainMenu();
      });
    }

    // Zvuk mute/unmute
    const audioBtn = document.getElementById('btn-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = window.sound.toggleMute();
        audioBtn.innerHTML = isMuted ? window.getSvg('soundOff') : window.getSvg('soundOn');
      });
    }

    // Otevření obchodu ze startovacího menu
    const openShopBtn = document.getElementById('btn-open-shop');
    if (openShopBtn) {
      openShopBtn.addEventListener('click', () => {
        window.sound.init();
        this.openShopModal();
      });
    }

    // Zavření obchodu
    const closeShopBtn = document.getElementById('btn-close-shop');
    if (closeShopBtn) {
      closeShopBtn.addEventListener('click', () => {
        this.closeShopModal();
      });
    }

    // Otevření a zavření Kroniky Statistik
    const openStatsBtn = document.getElementById('btn-open-stats');
    if (openStatsBtn) {
      openStatsBtn.addEventListener('click', () => {
        window.sound.init();
        this.openStatsModal();
      });
    }
    const closeStatsBtn = document.getElementById('btn-close-stats');
    if (closeStatsBtn) {
      closeStatsBtn.addEventListener('click', () => {
        this.closeStatsModal();
      });
    }

    // Otevření obchodu z Game Over
    const goShopBtn = document.getElementById('btn-gameover-shop');
    if (goShopBtn) {
      goShopBtn.addEventListener('click', () => {
        document.getElementById('gameover-modal').classList.add('hidden');
        this.openShopModal();
      });
    }

    // Otevření obchodu z Victory
    const vicShopBtn = document.getElementById('btn-victory-shop');
    if (vicShopBtn) {
      vicShopBtn.addEventListener('click', () => {
        document.getElementById('victory-modal').classList.add('hidden');
        this.openShopModal();
      });
    }

    // Záložky v obchodě (Vylepšení vs Skiny)
    const tabUpgrades = document.getElementById('tab-upgrades');
    if (tabUpgrades) {
      tabUpgrades.addEventListener('click', () => {
        this.setShopTab('upgrades');
      });
    }
    const tabSkins = document.getElementById('tab-skins');
    if (tabSkins) {
      tabSkins.addEventListener('click', () => {
        this.setShopTab('skins');
      });
    }
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

  startCampaignGame() {
    this.gameMode = 'campaign';
    this.startGame();
  }

  startEndlessGame() {
    this.gameMode = 'endless';
    this.startGame();
  }

  quitToMainMenu() {
    this.state = 'start';
    const modals = [
      'pause-modal', 'gameover-modal', 'victory-modal',
      'levelup-modal', 'stage-clear-modal', 'shop-modal', 'stats-modal'
    ];
    modals.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    const startModal = document.getElementById('start-modal');
    if (startModal) startModal.classList.remove('hidden');
    this.updateStatsUI();
  }

  openStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) modal.classList.remove('hidden');
    this.updateStatsUI();
  }

  closeStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) modal.classList.add('hidden');
  }

  startGame() {
    this.state = 'playing';
    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('start-modal').classList.add('hidden');
    document.getElementById('shop-modal').classList.add('hidden');
    const statsModal = document.getElementById('stats-modal');
    if (statsModal) statsModal.classList.add('hidden');

    this.currentStageIndex = 0;
    this.survivalTime = 0;
    this.stageTimer = 0;
    this.totalKills = 0;
    this.totalDamageDealt = 0;
    this.runGold = 0;

    this.player = new Player(0, 0);
    this.applyMetaUpgradesToPlayer();
    this.initStageObstacles();

    this.projectiles = [];
    this.enemyProjectiles = [];
    this.enemies = [];
    this.xpGems = [];
    this.goldCoins = [];
    this.firePatches = [];
    this.holyCrosses = [];
    window.particleSystem.reset();
    window.buffManager.reset();

    // Reset mechanik Anti-Camping a Endless
    this.campAnchor = { x: this.player.x, y: this.player.y };
    this.campTimer = 0;
    this.campWarnLevel = 0;
    this.campDamageTick = 0;
    this.endlessBossTimer = 0;
    this.gemConsolidationTimer = 0;

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
    if (this.gameMode === 'endless') {
      const effStage = 1 + Math.floor(this.survivalTime / 50);
      const stageIdx = (effStage - 1) % window.STAGE_CONFIGS.length;
      const baseCfg = window.STAGE_CONFIGS[stageIdx] || window.STAGE_CONFIGS[0];
      return {
        ...baseCfg,
        stage: effStage,
        name: `Nekonečné Hordy (Vlna ${effStage})`,
        durationSeconds: 9999999,
        spawnRate: 1.8 + Math.min(6.5, (this.survivalTime / 35) * 0.45)
      };
    }
    return window.STAGE_CONFIGS[this.currentStageIndex] || window.STAGE_CONFIGS[window.STAGE_CONFIGS.length - 1];
  }

  initStageObstacles() {
    this.obstacles = [];
    const config = this.currentStageConfig;
    if (!config || !config.obstacles || !window.Obstacle) return;

    const { types = ['rock'], count = 28 } = config.obstacles;
    const mapExtent = 1200;
    const safeRadius = 140; // Volný prostor kolem spawnu hráče

    let attempts = 0;
    while (this.obstacles.length < count && attempts < count * 8) {
      attempts++;
      const ox = (Math.random() * 2 - 1) * mapExtent;
      const oy = (Math.random() * 2 - 1) * mapExtent;

      if (Math.hypot(ox, oy) < safeRadius) continue;

      const type = types[Math.floor(Math.random() * types.length)];
      const tempObs = new window.Obstacle(ox, oy, type);

      let overlapping = false;
      for (let existing of this.obstacles) {
        if (Math.hypot(ox - existing.x, oy - existing.y) < (tempObs.radius + existing.radius + 20)) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        this.obstacles.push(tempObs);
      }
    }
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

    // Mechaniky: Anti-Camping a Gem Consolidation
    this.checkAntiCamping(dt);
    this.consolidateGems(dt);

    // Aktualizace hráče (klávesnice + joystick)
    const joyVec = { x: this.joystick.inputX, y: this.joystick.inputY };
    this.player.update(dt, this.keys, joyVec);

    // Kolize hráče s překážkami (stromy, kameny, rybníky blokují pohyb)
    for (let i = 0; i < this.obstacles.length; i++) {
      this.obstacles[i].checkEntityCollision(this.player);
    }

    // Aktualizace kamery (sleduje hráče do středu)
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;

    // Autoshooting mechanika
    this.handleAutoShooting(dt);

    // Dodatečné schopnosti (Blesky, Orbitals, Fire Trail, Holy Cross)
    this.handleSpecialPassives(dt);

    // Aktualizace stop Fire Trail
    this.firePatches = this.firePatches.filter((p) => {
      return p.update(dt, this.enemies, (e, dmg) => {
        this.totalDamageDealt += dmg;
        if (e.takeDamage(dmg)) {
          this.onEnemyKilled(e);
        }
      });
    });

    // Aktualizace projektilů Holy Cross
    this.holyCrosses = this.holyCrosses.filter((c) => {
      return c.update(dt, this.enemies, (e, dmg) => {
        this.totalDamageDealt += dmg;
        if (e.takeDamage(dmg)) {
          this.onEnemyKilled(e);
        }
      });
    });

    // Spawnování nepřátel
    this.handleEnemySpawning(dt);

    // Aktualizace střel
    this.projectiles = this.projectiles.filter((p) => {
      const alive = p.update(dt);
      if (!alive) return false;

      // Kolize střely hráče s pevnými překážkami (nad vodou střely volně létají)
      for (let i = 0; i < this.obstacles.length; i++) {
        const obs = this.obstacles[i];
        if (obs.checkProjectileCollision(p)) {
          window.particleSystem.spawnExplosion(p.x, p.y, '#94a3b8', 6);
          return false;
        }
      }

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

    // Aktualizace nepřátelských projektilů a kolize s hráčem
    this.enemyProjectiles = this.enemyProjectiles.filter((ep) => {
      const alive = ep.update(dt);
      if (!alive) return false;

      // Kolize nepřátelského projektilu s pevnými překážkami (poskytují krytí)
      for (let i = 0; i < this.obstacles.length; i++) {
        const obs = this.obstacles[i];
        if (obs.checkProjectileCollision(ep)) {
          window.particleSystem.spawnExplosion(ep.x, ep.y, ep.color, 6);
          return false;
        }
      }

      // Kolize nepřátelského projektilu s hráčem
      const dist = Math.hypot(ep.x - this.player.x, ep.y - this.player.y);
      if (dist <= ep.radius + this.player.radius) {
        if (this.player.takeDamage(ep.damage)) {
          if (this.player.hp <= 0) {
            this.triggerGameOver();
          }
        }
        return false; // Projektil zanikne po zásahu
      }
      return true;
    });

    // Aktualizace nepřátel a kolize s hráčem (včetně spawnování střel z telegrafovaných útoků)
    const spawnEnemyProj = (proj) => {
      this.enemyProjectiles.push(proj);
    };

    this.enemies.forEach((enemy) => {
      enemy.update(dt, this.player, spawnEnemyProj);

      // Kolize nepřítele s překážkami
      for (let i = 0; i < this.obstacles.length; i++) {
        this.obstacles[i].checkEntityCollision(enemy);
      }

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

    // Mince (Gold drops)
    this.goldCoins = this.goldCoins.filter((coin) => {
      const collected = coin.update(dt, this.player);
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
    // 1. Orbiting blades sekají nepřátele kolem hráče (škálování dosahu i velikosti)
    if (this.player.hasOrbitals && this.player.orbitalsCount > 0) {
      const radius = this.player.getOrbitalRadius();
      const bladeScale = this.player.getOrbitalBladeSize();
      const count = this.player.orbitalsCount;
      const hitReach = 14 * bladeScale;

      for (let i = 0; i < count; i++) {
        const angle = this.player.orbitalAngle + (i * (Math.PI * 2 / count));
        const ox = this.player.x + Math.cos(angle) * radius;
        const oy = this.player.y + Math.sin(angle) * radius;

        // Kontrola kolize čepele s nepřáteli
        for (let j = 0; j < this.enemies.length; j++) {
          const e = this.enemies[j];
          const dist = Math.hypot(e.x - ox, e.y - oy);
          if (dist < e.radius + hitReach) {
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

    // 3. Fire Trail (Ohnivá stopa za hráčem)
    if (this.player.hasFireTrail) {
      if (this.player.fireTrailTimer <= 0) {
        this.player.fireTrailTimer = 0.28;
        const lvl = this.player.fireTrailLevel || 1;
        const patchRadius = 20 + lvl * 3;
        const patchDmg = Math.round(this.player.damage * (0.35 + lvl * 0.12));
        const patchDuration = 2.4 + lvl * 0.4;
        this.firePatches.push(new FirePatch(this.player.x, this.player.y, patchDmg, patchRadius, patchDuration));
      }
    }

    // 4. Holy Cross (Posvátný rotující kříž)
    if (this.player.hasHolyCross) {
      if (this.player.holyCrossTimer <= 0) {
        const lvl = this.player.holyCrossLevel || 1;
        this.player.holyCrossTimer = Math.max(1.2, 2.8 - lvl * 0.35);
        const crossDmg = Math.round(this.player.damage * (1.1 + lvl * 0.25));
        const count = lvl >= 3 ? 8 : (lvl >= 2 ? 6 : 4);
        const baseAngle = Math.random() * Math.PI * 2;
        const crossSpeed = 4.8;
        for (let i = 0; i < count; i++) {
          const ang = baseAngle + (i * (Math.PI * 2 / count));
          const vx = Math.cos(ang) * crossSpeed;
          const vy = Math.sin(ang) * crossSpeed;
          this.holyCrosses.push(new HolyCrossProjectile(this.player.x, this.player.y, vx, vy, crossDmg, 16 + lvl * 2, 3.2));
        }
        if (window.sound && window.sound.shoot) window.sound.shoot();
      }
    }
  }

  checkAntiCamping(dt) {
    const dist = Math.hypot(this.player.x - this.campAnchor.x, this.player.y - this.campAnchor.y);
    if (dist > 75) {
      // Hráč se pohnul - reset varování
      this.campAnchor.x = this.player.x;
      this.campAnchor.y = this.player.y;
      this.campTimer = 0;
      this.campWarnLevel = 0;
      this.campDamageTick = 0;
    } else {
      this.campTimer += dt;
      if (this.campTimer >= 5.0) {
        this.campWarnLevel = 2; // Trest za kempování
        this.campDamageTick += dt;
        if (this.campDamageTick >= 0.5) {
          this.campDamageTick = 0;
          this.player.takeDamage(8);
          if (window.particleSystem) {
            window.particleSystem.spawnExplosion(this.player.x, this.player.y, '#ef4444', 12);
          }
          if (this.player.hp <= 0) {
            this.triggerGameOver();
          }
        }
      } else if (this.campTimer >= 3.5) {
        this.campWarnLevel = 1; // Varovná zóna
      } else {
        this.campWarnLevel = 0;
      }
    }
  }

  consolidateGems(dt) {
    this.gemConsolidationTimer = (this.gemConsolidationTimer || 0) + dt;
    if (this.gemConsolidationTimer < 0.6) return;
    this.gemConsolidationTimer = 0;

    if (this.xpGems.length <= 55) return;

    // Spojování sousedních krystalů pro udržení plynulosti hry bez ztráty zkušeností
    const mergedIndices = new Set();
    for (let i = 0; i < this.xpGems.length; i++) {
      if (mergedIndices.has(i)) continue;
      const g1 = this.xpGems[i];
      for (let j = i + 1; j < this.xpGems.length; j++) {
        if (mergedIndices.has(j)) continue;
        const g2 = this.xpGems[j];
        if (Math.hypot(g1.x - g2.x, g1.y - g2.y) < 110) {
          g1.mergeWith(g2);
          mergedIndices.add(j);
          if (this.xpGems.length - mergedIndices.size <= 45) break;
        }
      }
      if (this.xpGems.length - mergedIndices.size <= 45) break;
    }

    if (mergedIndices.size > 0) {
      this.xpGems = this.xpGems.filter((_, idx) => !mergedIndices.has(idx));
    }
  }

  handleEnemySpawning(dt) {
    if (this.gameMode === 'endless') {
      this.spawnTimer += dt;
      this.endlessBossTimer = (this.endlessBossTimer || 0) + dt;

      const effStage = 1 + Math.floor(this.survivalTime / 50);
      const spawnRate = 1.8 + Math.min(6.5, (this.survivalTime / 35) * 0.45);
      const spawnInterval = 1 / spawnRate;

      if (this.spawnTimer >= spawnInterval) {
        this.spawnTimer = 0;
        this.spawnEndlessEnemyAtEdge(effStage);
      }

      // Bossové v Endless módu každých 120 sekund (2 minuty)
      if (this.endlessBossTimer >= 120) {
        this.endlessBossTimer = 0;
        this.spawnEndlessBoss(effStage);
      }
      return;
    }

    // Klasická Kampaň
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

  spawnEndlessEnemyAtEdge(effStage) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(this.canvas.width, this.canvas.height) * 0.65;
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    const pool = ['zombie', 'skeleton'];
    if (effStage >= 2) pool.push('bat', 'slime');
    if (effStage >= 3) pool.push('cultist', 'ghost');
    if (effStage >= 4) pool.push('skeleton_archer', 'armored_knight');
    if (effStage >= 5) pool.push('fire_imp', 'ice_wraith');
    if (effStage >= 6) pool.push('hell_hound', 'infernal_brute');

    const type = pool[Math.floor(Math.random() * pool.length)];
    this.enemies.push(new Enemy(x, y, type, effStage));
  }

  spawnEndlessBoss(effStage) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(this.canvas.width, this.canvas.height) * 0.6;
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    const bossPool = ['necromancer', 'vampire_lord', 'death_knight', 'void_overlord', 'infernal_colossus'];
    const bossType = bossPool[(effStage - 1) % bossPool.length];

    const boss = new BossEnemy(x, y, bossType, effStage);
    this.enemies.push(boss);
    if (window.particleSystem) {
      window.particleSystem.spawnExplosion(x, y, '#ef4444', 40);
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

    // Drop Zlata (Gold drop): Bossové mají 100% jistotu více mincí, běžná monstra 30% šanci
    if (enemy.isBoss) {
      const coinCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < coinCount; i++) {
        const ox = enemy.x + (Math.random() * 40 - 20);
        const oy = enemy.y + (Math.random() * 40 - 20);
        this.goldCoins.push(new GoldCoin(ox, oy, 5 + this.currentStageConfig.stage));
      }
    } else if (Math.random() < 0.32) {
      const coinValue = enemy.isShooter ? 2 : 1;
      this.goldCoins.push(new GoldCoin(enemy.x, enemy.y, coinValue));
    }

    // Pokud byl zabit finální boss 10. stage
    if (enemy.isBoss && this.currentStageConfig.stage === 10) {
      this.triggerVictory();
    }
  }

  checkLevelUp() {
    while (this.player.xp >= this.player.xpToNextLevel) {
      this.player.xp -= this.player.xpToNextLevel;
      this.player.level++;

      // Rebalancovaná XP křivka: dynamický a svižný postup i v late-game
      // Místo strmého x1.35 exponenciálu používáme mírnější koeficient pro vyšší levely
      if (this.player.level < 10) {
        this.player.xpToNextLevel = Math.round(this.player.xpToNextLevel * 1.20 + 4);
      } else if (this.player.level < 25) {
        this.player.xpToNextLevel = Math.round(this.player.xpToNextLevel * 1.14 + 6);
      } else {
        this.player.xpToNextLevel = Math.round(this.player.xpToNextLevel * 1.08 + 10);
      }

      window.sound.levelUp();
      this.openLevelUpModal();
      break; // Zobrazí modal pro 1 level, po výběru se vyhodnotí další
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
    if (this.gameMode === 'endless') {
      return; // Endless mód nemá přechody mezi stages, běží neomezeně
    }
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

    // Částečné vyčištění nepřátel a střel
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.initStageObstacles(); // Vygenerování nových překážek pro další stage
    this.player.heal(40); // Odměna za postup - uzdravení 40 HP
    this.state = 'playing';
  }

  triggerGameOver() {
    this.state = 'gameover';
    window.sound.gameOver();

    // Uložit lifetime statistiky
    this.recordRunStatistics();

    const coinSvg = window.getSvg ? window.getSvg('coin') : '';
    const modal = document.getElementById('gameover-modal');
    document.getElementById('final-survival-time').textContent = this.formatTime(this.survivalTime);
    document.getElementById('final-stage').textContent = `${this.currentStageConfig.stage} (${this.currentStageConfig.name})`;
    document.getElementById('final-level').textContent = this.player.level;
    document.getElementById('final-kills').textContent = this.totalKills;
    document.getElementById('final-run-gold').innerHTML = `${this.runGold} <span class="svg-inline-coin" style="display:inline-flex;vertical-align:middle;margin-left:4px;">${coinSvg}</span>`;
    document.getElementById('final-damage').textContent = this.totalDamageDealt;

    modal.classList.remove('hidden');
  }

  triggerVictory() {
    this.state = 'victory';
    window.sound.stageClear();

    // Uložit lifetime statistiky
    this.recordRunStatistics();

    const coinSvg = window.getSvg ? window.getSvg('coin') : '';
    const modal = document.getElementById('victory-modal');
    document.getElementById('victory-time').textContent = this.formatTime(this.survivalTime);
    document.getElementById('victory-level').textContent = this.player.level;
    document.getElementById('victory-kills').textContent = this.totalKills;
    document.getElementById('victory-run-gold').innerHTML = `${this.runGold} <span class="svg-inline-coin" style="display:inline-flex;vertical-align:middle;margin-left:4px;">${coinSvg}</span>`;

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

    // Kills & Time & Gold
    document.getElementById('kill-count').textContent = this.totalKills;
    document.getElementById('hud-gold-count').textContent = this.gold;
    document.getElementById('survival-timer').textContent = this.formatTime(this.survivalTime);

    // Stage
    if (this.gameMode === 'endless') {
      const effStage = 1 + Math.floor(this.survivalTime / 50);
      document.getElementById('stage-display').textContent = '∞';
      document.getElementById('stage-name').textContent = `Endless (Vlna ${effStage})`;
    } else {
      document.getElementById('stage-display').textContent = this.currentStageConfig.stage;
      document.getElementById('stage-name').textContent = this.currentStageConfig.name;
    }
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

    // 1. Pozadí a fantasy kamenné dláždění odpovídající aktuální stage
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Mřížka mapy pohybující se s kamerou - středověké spáry kamenné dlažby
    const gridSize = 80;
    const offsetX = -this.camera.x % gridSize;
    const offsetY = -this.camera.y % gridSize;

    ctx.strokeStyle = config.gridColor;
    ctx.lineWidth = 1.5;
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

    // Jemné akcentové kachle na křižovatkách spár pro hloubku a fantasy atmosféru
    ctx.fillStyle = config.accentColor || '#ffffff';
    ctx.globalAlpha = 0.08;
    for (let x = offsetX; x < this.canvas.width; x += gridSize) {
      for (let y = offsetY; y < this.canvas.height; y += gridSize) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
    ctx.globalAlpha = 1.0;

    // 1.2. Výstražná runová zóna při kempování (Anti-Camping)
    if (this.campWarnLevel > 0) {
      ctx.save();
      const sx = this.campAnchor.x - this.camera.x;
      const sy = this.campAnchor.y - this.camera.y;
      const pulse = Math.sin(performance.now() * 0.008) * 6;
      const isDmg = this.campWarnLevel === 2;
      ctx.strokeStyle = isDmg ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.85)';
      ctx.fillStyle = isDmg ? 'rgba(239, 68, 68, 0.22)' : 'rgba(245, 158, 11, 0.15)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(sx, sy, 75 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isDmg ? '#ef4444' : '#f59e0b';
      ctx.font = 'bold 14px Crimson Text, serif';
      ctx.textAlign = 'center';
      ctx.fillText(isDmg ? '⚠️ TREST ZA KEMPOVÁNÍ! POHYBUJ SE!' : '⚠️ NESTŮJ NA MÍSTĚ!', sx, sy - 85);
      ctx.restore();
    }

    // 1.5. Překážky - Rybníky a vodní plochy (vykreslené na terénu před předměty)
    for (let i = 0; i < this.obstacles.length; i++) {
      if (this.obstacles[i].isWater) {
        this.obstacles[i].draw(ctx, this.camera);
      }
    }

    // 1.8. Ohnivé stopy Fire Trail na zemi
    for (let i = 0; i < this.firePatches.length; i++) {
      this.firePatches[i].draw(ctx, this.camera);
    }

    // 2. XP Krystaly a Mince (Gold Drops)
    for (let i = 0; i < this.xpGems.length; i++) {
      this.xpGems[i].draw(ctx, this.camera);
    }
    for (let i = 0; i < this.goldCoins.length; i++) {
      this.goldCoins[i].draw(ctx, this.camera);
    }

    // 2.5. Pevné překážky (stromy, kameny, pařezy, pilíře)
    for (let i = 0; i < this.obstacles.length; i++) {
      if (!this.obstacles[i].isWater) {
        this.obstacles[i].draw(ctx, this.camera);
      }
    }

    // 3. Nepřátelé (včetně telegrafovaných červených zón pod nimi/kolem nich)
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].draw(ctx, this.camera);
    }

    // 4. Projektily hráče a nepřátelské projektily
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].draw(ctx, this.camera);
    }
    for (let i = 0; i < this.enemyProjectiles.length; i++) {
      this.enemyProjectiles[i].draw(ctx, this.camera);
    }

    // 4.5. Rotující posvátné kříže Holy Cross
    for (let i = 0; i < this.holyCrosses.length; i++) {
      this.holyCrosses[i].draw(ctx, this.camera);
    }

    // 5. Hráč
    this.player.draw(ctx, this.camera);

    // 6. Částice a čísla poškození
    window.particleSystem.draw(ctx, this.camera);
  }

  // ==========================================
  // Meta-progrese & Obchod & Lifetime Statistiky
  // ==========================================

  loadPersistentData() {
    try {
      const savedGold = localStorage.getItem('crimson_horde_gold');
      if (savedGold !== null) {
        this.gold = Math.max(0, parseInt(savedGold, 10) || 0);
      }

      const savedStats = localStorage.getItem('crimson_horde_lifetime_stats');
      if (savedStats) {
        this.lifetimeStats = Object.assign(this.lifetimeStats, JSON.parse(savedStats));
      }

      const savedUpgrades = localStorage.getItem('crimson_horde_meta_upgrades');
      if (savedUpgrades) {
        this.metaUpgrades = Object.assign(this.metaUpgrades, JSON.parse(savedUpgrades));
      }

      const savedSkins = localStorage.getItem('crimson_horde_skins');
      if (savedSkins) {
        try {
          const parsed = JSON.parse(savedSkins);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.unlockedSkins = parsed;
          }
        } catch (e) {}
      }

      const savedActiveSkin = localStorage.getItem('crimson_horde_active_skin');
      if (savedActiveSkin) {
        this.activeSkin = savedActiveSkin;
      }
    } catch (e) {
      console.warn('Nepodařilo se načíst data z localStorage:', e);
    }
  }

  savePersistentData() {
    try {
      localStorage.setItem('crimson_horde_gold', this.gold.toString());
      localStorage.setItem('crimson_horde_lifetime_stats', JSON.stringify(this.lifetimeStats));
      localStorage.setItem('crimson_horde_meta_upgrades', JSON.stringify(this.metaUpgrades));
      localStorage.setItem('crimson_horde_skins', JSON.stringify(this.unlockedSkins));
      localStorage.setItem('crimson_horde_active_skin', this.activeSkin);
    } catch (e) {
      console.warn('Nepodařilo se uložit data do localStorage:', e);
    }
  }

  addGold(amount) {
    this.runGold += amount;
    this.gold += amount;
    this.savePersistentData();
    this.updateHUD();
    this.updateStatsUI();
  }

  applyMetaUpgradesToPlayer() {
    // 0. Aktivní Skin hrdiny
    if (this.player && this.player.setSkin) {
      this.player.setSkin(this.activeSkin);
    }

    // 1. Max HP (+8 HP za úroveň)
    const hpLvl = this.metaUpgrades.maxHp || 0;
    this.player.metaMaxHpBonus = hpLvl * 8;

    // 2. Movement Speed (+3% za úroveň)
    const speedLvl = this.metaUpgrades.movespeed || 0;
    this.player.metaSpeedBonus = speedLvl * 0.03;

    // 3. Damage (+5% za úroveň)
    const dmgLvl = this.metaUpgrades.damage || 0;
    this.player.metaDamageBonus = dmgLvl * 0.05;

    // 4. XP Multiplier (+6% za úroveň)
    const xpLvl = this.metaUpgrades.xpMultiplier || 0;
    this.player.xpMult = 1.0 + xpLvl * 0.06;

    // 5. Attack Range (+4% za úroveň)
    const rangeLvl = this.metaUpgrades.range || 0;
    this.player.metaRangeBonus = rangeLvl * 0.04;

    // 6. Health Regen (+0.3 HP/s za úroveň)
    const regenLvl = this.metaUpgrades.regen || 0;
    this.player.metaHpRegen = regenLvl * 0.3;

    // 7. Magnet (+12% za úroveň)
    const magnetLvl = this.metaUpgrades.magnet || 0;
    this.player.metaMagnetBonus = magnetLvl * 0.12;

    this.player.recalculateMaxHp();
    this.player.recalculateHpRegen();
    this.player.hp = this.player.maxHp;
  }

  recordRunStatistics() {
    let updated = false;

    // Záznam dle herního režimu
    if (this.gameMode === 'endless') {
      if (this.survivalTime > (this.lifetimeStats.bestEndlessSurvivalTime || 0)) {
        this.lifetimeStats.bestEndlessSurvivalTime = Math.floor(this.survivalTime);
        updated = true;
      }
    } else {
      if (this.survivalTime > (this.lifetimeStats.bestSurvivalTime || 0)) {
        this.lifetimeStats.bestSurvivalTime = Math.floor(this.survivalTime);
        updated = true;
      }
      const currentStage = this.currentStageConfig.stage;
      if (currentStage > (this.lifetimeStats.highestStage || 1)) {
        this.lifetimeStats.highestStage = currentStage;
        updated = true;
      }
    }

    // Nejvyšší level
    if (this.player.level > (this.lifetimeStats.highestLevel || 1)) {
      this.lifetimeStats.highestLevel = this.player.level;
      updated = true;
    }

    // Celkový počet zabitých nepřátel
    this.lifetimeStats.totalKills = (this.lifetimeStats.totalKills || 0) + this.totalKills;
    updated = true;

    this.savePersistentData();
    this.updateStatsUI();
  }

  updateStatsUI() {
    const bestTimeEl = document.getElementById('stats-best-time');
    const bestEndlessEl = document.getElementById('stats-endless-time');
    const maxStageEl = document.getElementById('stats-max-stage');
    const maxLevelEl = document.getElementById('stats-max-level');
    const totalKillsEl = document.getElementById('stats-total-kills');
    const goldAmountEl = document.getElementById('stats-gold-amount');
    const shopGoldAmountEl = document.getElementById('shop-gold-amount');

    const mBestTime = document.getElementById('modal-stats-best-time');
    const mBestEndless = document.getElementById('modal-stats-endless-time');
    const mMaxStage = document.getElementById('modal-stats-max-stage');
    const mMaxLevel = document.getElementById('modal-stats-max-level');
    const mTotalKills = document.getElementById('modal-stats-total-kills');
    const mGold = document.getElementById('modal-stats-gold-amount');

    const campTimeFormatted = this.formatTime(this.lifetimeStats.bestSurvivalTime || 0);
    const endlessTimeFormatted = this.formatTime(this.lifetimeStats.bestEndlessSurvivalTime || 0);

    if (bestTimeEl) bestTimeEl.textContent = campTimeFormatted;
    if (bestEndlessEl) bestEndlessEl.textContent = endlessTimeFormatted;
    if (maxStageEl) maxStageEl.textContent = `Stage ${this.lifetimeStats.highestStage || 1}`;
    if (maxLevelEl) maxLevelEl.textContent = `Lvl ${this.lifetimeStats.highestLevel || 1}`;
    if (totalKillsEl) totalKillsEl.textContent = this.lifetimeStats.totalKills || 0;
    if (goldAmountEl) goldAmountEl.textContent = this.gold;
    if (shopGoldAmountEl) shopGoldAmountEl.textContent = this.gold;

    if (mBestTime) mBestTime.textContent = campTimeFormatted;
    if (mBestEndless) mBestEndless.textContent = endlessTimeFormatted;
    if (mMaxStage) mMaxStage.textContent = `Stage ${this.lifetimeStats.highestStage || 1}`;
    if (mMaxLevel) mMaxLevel.textContent = `Lvl ${this.lifetimeStats.highestLevel || 1}`;
    if (mTotalKills) mTotalKills.textContent = this.lifetimeStats.totalKills || 0;
    if (mGold) mGold.textContent = this.gold;
  }

  // Definice permanentních vylepšení v obchodě (exponenciální ceny a vyvážené hodnoty)
  getShopDefinitions() {
    const svg = (key) => (window.getSvg ? window.getSvg(key) : '');
    return [
      {
        id: 'maxHp',
        name: 'Dračí Vitalita',
        icon: svg('heart'),
        desc: '+8 základních Max HP pro každou budoucí hru.',
        maxLevel: 10,
        costPerLevel: (lvl) => Math.round(20 * Math.pow(1.55, lvl))
      },
      {
        id: 'movespeed',
        name: 'Rychlé Boty',
        icon: svg('boots'),
        desc: '+3% permanentní rychlost pohybu postavy.',
        maxLevel: 10,
        costPerLevel: (lvl) => Math.round(25 * Math.pow(1.60, lvl))
      },
      {
        id: 'damage',
        name: 'Surová Síla',
        icon: svg('sword'),
        desc: '+5% trvalý nárůst poškození pro všechny zbraně.',
        maxLevel: 10,
        costPerLevel: (lvl) => Math.round(30 * Math.pow(1.60, lvl))
      },
      {
        id: 'xpMultiplier',
        name: 'Moudrost Prastarých',
        icon: svg('book'),
        desc: '+6% bonus k veškerým sebraným XP krystalům.',
        maxLevel: 10,
        costPerLevel: (lvl) => Math.round(35 * Math.pow(1.65, lvl))
      },
      {
        id: 'range',
        name: 'Ostrý Zrak',
        icon: svg('bow'),
        desc: '+4% trvalý dosah zaměřování a střelby.',
        maxLevel: 8,
        costPerLevel: (lvl) => Math.round(25 * Math.pow(1.55, lvl))
      },
      {
        id: 'regen',
        name: 'Krev Fénixe',
        icon: svg('potion'),
        desc: '+0.3 HP za sekundu trvalá regenerace zdraví.',
        maxLevel: 8,
        costPerLevel: (lvl) => Math.round(40 * Math.pow(1.70, lvl))
      },
      {
        id: 'magnet',
        name: 'Aura Přitažlivosti',
        icon: svg('magnet'),
        desc: '+12% trvalý dosah magnetu pro XP drahokamy a zlato.',
        maxLevel: 8,
        costPerLevel: (lvl) => Math.round(20 * Math.pow(1.50, lvl))
      }
    ];
  }

  openShopModal() {
    const modal = document.getElementById('shop-modal');
    modal.classList.remove('hidden');
    this.setShopTab(this.shopTab || 'upgrades');
  }

  setShopTab(tab) {
    this.shopTab = tab;
    const tabUpgrades = document.getElementById('tab-upgrades');
    const tabSkins = document.getElementById('tab-skins');
    const itemsCont = document.getElementById('shop-items-container');
    const skinsCont = document.getElementById('shop-skins-container');

    if (tab === 'skins') {
      if (tabUpgrades) tabUpgrades.classList.remove('active');
      if (tabSkins) tabSkins.classList.add('active');
      if (itemsCont) itemsCont.classList.add('hidden');
      if (skinsCont) skinsCont.classList.remove('hidden');
      this.renderShopSkins();
    } else {
      if (tabUpgrades) tabUpgrades.classList.add('active');
      if (tabSkins) tabSkins.classList.remove('active');
      if (itemsCont) itemsCont.classList.remove('hidden');
      if (skinsCont) skinsCont.classList.add('hidden');
      this.renderShopItems();
    }
  }

  closeShopModal() {
    const modal = document.getElementById('shop-modal');
    modal.classList.add('hidden');
    // Pokud jsme v menu, ukážeme start-modal
    if (this.state === 'start' || this.state === 'gameover' || this.state === 'victory') {
      document.getElementById('start-modal').classList.remove('hidden');
    }
    this.updateStatsUI();
  }

  // Definice středověkých skinů hrdiny
  getSkinDefinitions() {
    return [
      {
        id: 'default',
        name: 'Základní Hrdina',
        cost: 0,
        desc: 'Udatný dobrodruh v zelené tunice s přilbicí bascinet, mečem a rytířským štítem.',
        previewColor: '#22c55e',
        badge: 'Základní'
      },
      {
        id: 'mage',
        name: 'Arcimág',
        cost: 100,
        desc: 'Mistr tajemných umění v nočním hábitu s kouzelnickou holí a prastarým grimoárem.',
        previewColor: '#818cf8',
        badge: 'Magie'
      },
      {
        id: 'archer',
        name: 'Hraničář',
        cost: 250,
        desc: 'Tichý lesní stopař v maskovacím koženém odění s toulcem a dlouhým lukem.',
        previewColor: '#16a34a',
        badge: 'Dálka'
      },
      {
        id: 'paladin',
        name: 'Zlatý Rytíř',
        cost: 500,
        desc: 'Zářivý bojovník světla oděný v těžkém zlatém plátovém brnění se slunečním štítem.',
        previewColor: '#f59e0b',
        badge: 'Svatý'
      },
      {
        id: 'dark_knight',
        name: 'Temný Rytíř',
        cost: 1000,
        desc: 'Démonický šampion zkázy v rohaté přilbě s krvavým mečem a pulzující temnou magickou aurou.',
        previewColor: '#ef4444',
        badge: 'Karmín'
      }
    ];
  }

  renderShopSkins() {
    const container = document.getElementById('shop-skins-container');
    if (!container) return;
    container.innerHTML = '';

    const skins = this.getSkinDefinitions();
    this.updateStatsUI();

    const coinSvg = window.getSvg ? window.getSvg('coin') : '';

    skins.forEach((skin) => {
      const isUnlocked = this.unlockedSkins.includes(skin.id);
      const isActive = this.activeSkin === skin.id;
      const canAfford = !isUnlocked && this.gold >= skin.cost;

      const card = document.createElement('div');
      card.className = `shop-item-card skin-card ${isActive ? 'active-skin' : ''} ${isUnlocked ? 'unlocked' : ''}`;

      let btnHtml = '';
      if (isActive) {
        btnHtml = `<button class="shop-buy-btn skin-btn-active" disabled>AKTIVNÍ</button>`;
      } else if (isUnlocked) {
        btnHtml = `<button class="shop-buy-btn skin-btn-equip">VYBRAT</button>`;
      } else {
        btnHtml = `
          <button class="shop-buy-btn" ${!canAfford ? 'disabled' : ''}>
            Koupit za ${skin.cost} <span class="svg-inline-coin" style="display:inline-flex;vertical-align:middle;margin-left:4px;">${coinSvg}</span>
          </button>
        `;
      }

      card.innerHTML = `
        <div class="shop-item-icon skin-preview-wrapper" style="width:68px;height:68px;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle, rgba(45,34,24,0.9), rgba(16,11,7,0.98));border:1.5px solid rgba(212,175,55,0.45);border-radius:8px;box-shadow:inset 0 0 12px rgba(0,0,0,0.7);">
          <canvas class="skin-preview-canvas" width="64" height="64" style="image-rendering:pixelated;"></canvas>
        </div>
        <div class="shop-item-title">${skin.name}</div>
        <div class="shop-item-desc">${skin.desc}</div>
        <div class="shop-item-level">${isActive ? 'Aktuálně nasazeno' : (isUnlocked ? 'Zakoupeno' : `Cena: ${skin.cost} Zlata`)}</div>
        ${btnHtml}
      `;

      const previewCanvas = card.querySelector('.skin-preview-canvas');
      if (previewCanvas && window.Player && window.Player.drawSkinPreview) {
        const pCtx = previewCanvas.getContext('2d');
        window.Player.drawSkinPreview(pCtx, skin.id, 64, 64);
      }

      const buyBtn = card.querySelector('.shop-buy-btn');
      if (buyBtn) {
        if (!isUnlocked && canAfford) {
          buyBtn.addEventListener('click', () => {
            this.buySkin(skin.id, skin.cost);
          });
        } else if (isUnlocked && !isActive) {
          buyBtn.addEventListener('click', () => {
            this.equipSkin(skin.id);
          });
        }
      }

      container.appendChild(card);
    });
  }

  buySkin(skinId, cost) {
    if (this.gold < cost) return;
    this.gold -= cost;
    if (!this.unlockedSkins.includes(skinId)) {
      this.unlockedSkins.push(skinId);
    }
    this.activeSkin = skinId;
    this.savePersistentData();
    if (this.player && this.player.setSkin) {
      this.player.setSkin(skinId);
    }
    if (window.sound && window.sound.pickupCoin) window.sound.pickupCoin();
    this.renderShopSkins();
  }

  equipSkin(skinId) {
    if (!this.unlockedSkins.includes(skinId)) return;
    this.activeSkin = skinId;
    this.savePersistentData();
    if (this.player && this.player.setSkin) {
      this.player.setSkin(skinId);
    }
    if (window.sound && window.sound.shoot) window.sound.shoot();
    this.renderShopSkins();
  }

  renderShopItems() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    container.innerHTML = '';

    const shopItems = this.getShopDefinitions();
    this.updateStatsUI();

    const coinSvg = window.getSvg ? window.getSvg('coin') : '';

    shopItems.forEach((item) => {
      const currentLevel = this.metaUpgrades[item.id] || 0;
      const isMaxed = currentLevel >= item.maxLevel;
      const nextCost = isMaxed ? 0 : item.costPerLevel(currentLevel);
      const canAfford = !isMaxed && this.gold >= nextCost;

      const card = document.createElement('div');
      card.className = `shop-item-card ${isMaxed ? 'maxed' : ''}`;
      card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-title">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
        <div class="shop-item-level">Úroveň: ${currentLevel} / ${item.maxLevel}</div>
        <button class="shop-buy-btn" ${(!canAfford || isMaxed) ? 'disabled' : ''}>
          ${isMaxed ? 'MAXIMA' : `Koupit za ${nextCost} <span class="svg-inline-coin" style="display:inline-flex;vertical-align:middle;margin-left:4px;">${coinSvg}</span>`}
        </button>
      `;

      const buyBtn = card.querySelector('.shop-buy-btn');
      if (buyBtn && canAfford && !isMaxed) {
        buyBtn.addEventListener('click', () => {
          this.buyMetaUpgrade(item.id, nextCost);
        });
      }

      container.appendChild(card);
    });
  }

  buyMetaUpgrade(upgradeId, cost) {
    if (this.gold < cost) return;
    this.gold -= cost;
    this.metaUpgrades[upgradeId] = (this.metaUpgrades[upgradeId] || 0) + 1;
    this.savePersistentData();
    if (window.sound && window.sound.pickupCoin) window.sound.pickupCoin();
    this.renderShopItems();
  }
}

// Inicializace po načtení DOM
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
