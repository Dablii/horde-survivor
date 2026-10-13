// entities.js - Hráč, projektily, nepřátelé, bossové, XP krystaly, zlaté mince
// Kompletní 2D top-down středověký fantasy vizuál

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;

    // Rychlost pohybu (decoupled škálování)
    this.baseSpeed = 3.2;
    this.metaSpeedBonus = 0; // z trvalých upgradů (+0.03 za lvl)
    this.inGameSpeedMult = 1.0; // z in-game karet

    // Zdraví & Regenerace
    this.baseMaxHp = 100;
    this.metaMaxHpBonus = 0; // z trvalých upgradů (+8 za lvl)
    this.inGameMaxHpBonus = 0; // z in-game karet (+30 za lvl)
    this.maxHp = 100;
    this.hp = 100;
    this.metaHpRegen = 0; // z trvalých upgradů (+0.3 HP/s za lvl)
    this.inGameHpRegen = 0; // z in-game karet (+1.5 HP/s za lvl)
    this.hpRegen = 0;

    // Útočné staty
    this.fireCooldown = 0;
    this.baseFireInterval = 0.55; // sekundy mezi střelami
    this.fireRateMult = 1.0;
    this.baseDamage = 25;
    this.metaDamageBonus = 0; // z trvalých upgradů (+0.05 za lvl)
    this.inGameDamageMult = 1.0; // z in-game karet (+0.25 za lvl)
    this.baseRange = 320;
    this.metaRangeBonus = 0; // z trvalých upgradů (+0.04 za lvl)
    this.inGameRangeMult = 1.0; // z in-game karet (+0.30 za lvl)
    this.extraProjectiles = 0;
    this.pierceCount = 0;
    this.hasSplash = false;
    this.splashRadius = 0;

    // Meta-progrese XP bonus
    this.xpMult = 1.0;

    // Orbiting blades
    this.hasOrbitals = false;
    this.orbitalsCount = 0;
    this.orbitalAngle = 0;

    // Lightning
    this.hasLightning = false;
    this.lightningCooldown = 0;
    this.lightningChain = 0;

    // Fire Trail (Aktivní schopnost)
    this.hasFireTrail = false;
    this.fireTrailLevel = 0;
    this.fireTrailTimer = 0;

    // Holy Cross (Aktivní schopnost)
    this.hasHolyCross = false;
    this.holyCrossLevel = 0;
    this.holyCrossTimer = 0;

    // XP a Magnet
    this.magnetBaseRange = 75;
    this.metaMagnetBonus = 0; // z trvalých upgradů (+0.12 za lvl)
    this.inGameMagnetMult = 1.0; // z in-game karet (+0.50 za lvl)
    this.xp = 0;
    this.xpToNextLevel = 10;
    this.level = 1;

    // Animace & stav
    this.facing = 1; // 1 doprava, -1 doleva
    this.moving = false;
    this.invulnTimer = 0;
    this.walkAnimTime = 0;
    this.skin = 'default';
  }

  setSkin(skinId) {
    this.skin = skinId || 'default';
  }

  getOrbitalRadius() {
    return 60 + (this.orbitalsCount * 8);
  }

  getOrbitalBladeSize() {
    return 1 + (this.orbitalsCount - 1) * 0.18;
  }

  // Multiplikativní gettery eliminující scaling bug
  get speed() {
    return this.baseSpeed * (1 + this.metaSpeedBonus) * this.inGameSpeedMult;
  }
  get speedMult() {
    return (1 + this.metaSpeedBonus) * this.inGameSpeedMult;
  }
  set speedMult(val) {
    this.inGameSpeedMult = val;
  }

  get fireInterval() {
    return Math.max(0.08, this.baseFireInterval * this.fireRateMult);
  }

  get damage() {
    return Math.round(this.baseDamage * (1 + this.metaDamageBonus) * this.inGameDamageMult);
  }
  get damageMult() {
    return (1 + this.metaDamageBonus) * this.inGameDamageMult;
  }
  set damageMult(val) {
    this.inGameDamageMult = val;
  }

  get range() {
    return this.baseRange * (1 + this.metaRangeBonus) * this.inGameRangeMult;
  }
  get rangeMult() {
    return (1 + this.metaRangeBonus) * this.inGameRangeMult;
  }
  set rangeMult(val) {
    this.inGameRangeMult = val;
  }

  get magnetRange() {
    return this.magnetBaseRange * (1 + this.metaMagnetBonus) * this.inGameMagnetMult;
  }
  get magnetRangeMult() {
    return (1 + this.metaMagnetBonus) * this.inGameMagnetMult;
  }
  set magnetRangeMult(val) {
    this.inGameMagnetMult = val;
  }

  recalculateMaxHp(healDifference = false) {
    const oldMax = this.maxHp;
    this.maxHp = Math.round(this.baseMaxHp + this.metaMaxHpBonus + this.inGameMaxHpBonus);
    if (healDifference && this.maxHp > oldMax) {
      this.hp += (this.maxHp - oldMax);
    }
    this.hp = Math.min(this.maxHp, this.hp);
  }

  recalculateHpRegen() {
    this.hpRegen = this.metaHpRegen + this.inGameHpRegen;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  takeDamage(amount) {
    if (this.invulnTimer > 0) return false;
    this.hp -= amount;
    this.invulnTimer = 0.35; // 350ms nezranitelnost
    window.sound.playerHurt();
    window.particleSystem.spawnBlood(this.x, this.y, '#dc2626', 10);
    return true;
  }

  update(dt, keys, joystickInput = { x: 0, y: 0 }) {
    // Regenerace HP
    if (this.hpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);
    }

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
    }

    // WASD / šipky pohyb nebo joystick
    let dx = 0;
    let dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    // Joystick
    if (joystickInput.x !== 0 || joystickInput.y !== 0) {
      dx = joystickInput.x;
      dy = joystickInput.y;
    }

    this.moving = (dx !== 0 || dy !== 0);

    if (this.moving) {
      this.walkAnimTime += dt * 10;
      const len = Math.hypot(dx, dy);
      const normX = dx / len;
      const normY = dy / len;
      const moveSpeed = this.speed * Math.min(1, len);
      this.x += normX * moveSpeed * dt * 60;
      this.y += normY * moveSpeed * dt * 60;

      if (dx > 0) this.facing = 1;
      else if (dx < 0) this.facing = -1;
    }

    // Rotace orbitálních čepelí
    if (this.hasOrbitals) {
      this.orbitalAngle += dt * 3.5;
    }

    // Odpočet střelby
    this.fireCooldown -= dt;

    // Odpočet blesků
    if (this.hasLightning) {
      this.lightningCooldown -= dt;
    }

    // Odpočet schopností Fire Trail a Holy Cross
    if (this.hasFireTrail) {
      this.fireTrailTimer -= dt;
    }
    if (this.hasHolyCross) {
      this.holyCrossTimer -= dt;
    }
  }

  // Pomocné živé vykreslení náhledu skinu pro obchod
  static drawSkinPreview(ctx, skinId, width = 64, height = 64) {
    ctx.clearRect(0, 0, width, height);
    const dummy = new Player(width / 2, height / 2 + 6);
    dummy.skin = skinId;
    dummy.facing = 1;
    dummy.moving = false;
    dummy.invulnTimer = 0;
    dummy.walkAnimTime = performance.now() * 0.003;
    dummy.draw(ctx, { x: 0, y: 0 });
  }

  // 2D Top-Down středověký hrdina: Vykreslování podle vybraného skinu (default, mage, archer, paladin, dark_knight)
  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Blikání při nezranitelnosti
    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 20) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // 0. TEMNÁ PULZUJÍCÍ AURA (Pouze pro skin Dark Knight)
    if (this.skin === 'dark_knight') {
      const auraPulse = Math.sin(this.walkAnimTime * 2.5) * 5;
      const auraGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 32 + auraPulse);
      auraGrad.addColorStop(0, 'rgba(220, 38, 38, 0.55)');
      auraGrad.addColorStop(0.5, 'rgba(127, 29, 29, 0.4)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 32 + auraPulse, 0, Math.PI * 2);
      ctx.fill();

      // Šlehající runové plaménky a jiskry
      for (let a = 0; a < 4; a++) {
        const ang = this.walkAnimTime * 2.2 + (a * Math.PI / 2);
        const ax = Math.cos(ang) * (22 + a * 2.5);
        const ay = Math.sin(ang) * (16 + a * 2.5);
        ctx.fillStyle = (a % 2 === 0) ? '#ef4444' : '#991b1b';
        ctx.beginPath();
        ctx.arc(ax, ay, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.scale(this.facing, 1);

    const bob = this.moving ? Math.sin(this.walkAnimTime) * 2.2 : 0;
    const legSwing = this.moving ? Math.sin(this.walkAnimTime) * 5 : 0;

    // 1. Měkký stín hrdiny
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 17, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vykreslení podle aktivního skinu
    if (this.skin === 'mage') {
      // ===== ARCIMÁG (Fialovo-modrá róba, magická hůl, kouzelná kniha) =====
      // Boty
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-8, 8 + legSwing, 6, 8);
      ctx.fillRect(2, 8 - legSwing, 6, 8);

      // Vlající magický plášť
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(-10, -6 + bob);
      ctx.lineTo(-20, 16 + bob);
      ctx.lineTo(4, 16 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Tělo - Háv mága
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.arc(0, 0 + bob, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pás mága se zlatou runou
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-12, 1 + bob, 24, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 3 + bob, 3, 0, Math.PI * 2);
      ctx.fill();

      // Hlava & Kapuce
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.arc(0, -9 + bob, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Zářící oči pod kapucí
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, -11 + bob, 7, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -10 + bob, 2.5, 2.5);
      ctx.fillRect(5, -10 + bob, 2.5, 2.5);

      // Levá ruka: Magický Grimoár
      ctx.save();
      ctx.translate(-11, 2 + bob);
      ctx.fillStyle = '#831843';
      ctx.fillRect(-5, -7, 9, 13);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-5, -7, 9, 13);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -3, 3, 5);
      ctx.restore();

      // Pravá ruka: Kouzelnická Hůl s pulzujícím krystalem
      ctx.save();
      ctx.translate(12, 2 + bob);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1.5, -18, 3, 26);
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(0, -21, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1, -22, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else if (this.skin === 'archer') {
      // ===== HRANIČÁŘ (Lovecká zeleň, kůže, toulec, luk) =====
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, 8 + legSwing, 6, 8);
      ctx.fillRect(2, 8 - legSwing, 6, 8);

      // Lesní maskovací plášť
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.moveTo(-10, -6 + bob);
      ctx.lineTo(-18, 14 + bob);
      ctx.lineTo(2, 14 + bob);
      ctx.closePath();
      ctx.fill();

      // Kožená kamizola
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(0, 0 + bob, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Toulec se šípy na zádech
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-14, -12 + bob, 5, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-15, -15 + bob, 2, 4);
      ctx.fillRect(-12, -16 + bob, 2, 5);

      // Klobouk s peřím
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, -9 + bob, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-2, -15 + bob);
      ctx.lineTo(-8, -21 + bob);
      ctx.lineTo(1, -16 + bob);
      ctx.fill();

      // Luk v ruce
      ctx.save();
      ctx.translate(11, 2 + bob);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(2, 0, 14, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8, -12);
      ctx.lineTo(8, 12);
      ctx.stroke();
      ctx.restore();

    } else if (this.skin === 'paladin') {
      // ===== ZLATÝ RYTÍŘ (Zářivé zlaté pláty, bílý plášť, křídlatá helma) =====
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-8, 8 + legSwing, 6, 8);
      ctx.fillRect(2, 8 - legSwing, 6, 8);

      // Bílý královský plášť se zlatou obrubou
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-10, -6 + bob);
      ctx.lineTo(-19, 15 + bob);
      ctx.lineTo(3, 15 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Zlatý kyrys
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0 + bob, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Zlaté nárameníky
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-9, -4 + bob, 6, 0, Math.PI * 2);
      ctx.arc(9, -4 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      // Zlatá přilbice s modrým hledím
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -9 + bob, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(1, -11 + bob, 6, 2.5);

      // Křídla helmy
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-3, -15 + bob);
      ctx.lineTo(-10, -22 + bob);
      ctx.lineTo(1, -17 + bob);
      ctx.fill();

      // Sluneční štít
      ctx.save();
      ctx.translate(-11, 2 + bob);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -5, 4, 10);
      ctx.fillRect(-5, -2, 10, 4);
      ctx.restore();

      // Zlatý meč
      ctx.save();
      ctx.translate(11, 2 + bob);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-2.5, 6);
      ctx.lineTo(0, -20);
      ctx.lineTo(2.5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

    } else if (this.skin === 'dark_knight') {
      // ===== TEMNÝ RYTÍŘ (Obsidiánová zbroj, krvavý plášť, rohatá přilba, démonický meč) =====
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-8, 8 + legSwing, 6, 8);
      ctx.fillRect(2, 8 - legSwing, 6, 8);

      // Potrhaný krvavě rudý plášť
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(-10, -6 + bob);
      ctx.lineTo(-20, 16 + bob);
      ctx.lineTo(4, 15 + bob);
      ctx.closePath();
      ctx.fill();

      // Obsidiánový plátový kyrys
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.arc(0, 0 + bob, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Ostnaté nárameníky
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(-9, -4 + bob, 6, 0, Math.PI * 2);
      ctx.arc(9, -4 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      // Rohatá přilba temnoty
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(0, -9 + bob, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Démonicky žhnoucí rudé oči
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(1, -11 + bob, 3, 2.5);
      ctx.fillRect(5, -11 + bob, 3, 2.5);

      // Zakroucené rohy
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(-4, -14 + bob);
      ctx.lineTo(-12, -22 + bob);
      ctx.lineTo(-2, -17 + bob);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, -14 + bob);
      ctx.lineTo(8, -21 + bob);
      ctx.lineTo(4, -16 + bob);
      ctx.fill();

      // Štít s hroty
      ctx.save();
      ctx.translate(-11, 2 + bob);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-6, -7, 10, 14);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6, -7, 10, 14);
      ctx.restore();

      // Temný krvavý meč
      ctx.save();
      ctx.translate(11, 2 + bob);
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(-3, 6);
      ctx.lineTo(0, -21);
      ctx.lineTo(3, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

    } else {
      // ===== ZÁKLADNÍ HRDINA (Zelená tunika, bascinet přilba, meč & štít) =====
      // 2. Kožené boty / nohy
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-8, 8 + legSwing, 6, 8);
      ctx.fillRect(2, 8 - legSwing, 6, 8);

      // 3. Vlající plášť za zády (Tmavě lesní zeleň)
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.moveTo(-10, -6 + bob);
      ctx.lineTo(-18, 14 + bob);
      ctx.lineTo(2, 14 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 4. Tělo - Zelená tunika
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 0 + bob, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Kožený pásek
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-12, 1 + bob, 24, 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3, 0 + bob, 6, 6);

      // Nárameníky
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-8, -4 + bob, 5, 0, Math.PI * 2);
      ctx.arc(8, -4 + bob, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 5. Hlava & Rytířská přilbice
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(0, -9 + bob, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Průzor helmy
      ctx.fillStyle = '#d97706';
      ctx.fillRect(1, -11 + bob, 6, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(3, -11 + bob, 3, 2);

      // Péřový chochol
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-2, -16 + bob);
      ctx.lineTo(-8, -21 + bob);
      ctx.lineTo(1, -17 + bob);
      ctx.fill();

      // 6. Rytířský štít
      ctx.save();
      ctx.translate(-11, 2 + bob);
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(-5, -10);
      ctx.lineTo(5, -10);
      ctx.lineTo(5, 4);
      ctx.lineTo(0, 11);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-1.5, -7, 3, 14);
      ctx.fillRect(-4, -4, 8, 3);
      ctx.restore();

      // 7. Ocelový meč
      ctx.save();
      ctx.translate(11, 2 + bob);
      ctx.rotate(0.3 + (this.moving ? Math.sin(this.walkAnimTime * 2) * 0.15 : 0));
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-1.5, 8, 3, 5);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 13, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, 6, 12, 2.5);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-3, 6);
      ctx.lineTo(0, -18);
      ctx.lineTo(3, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // 8. Rotující magické čepele (Orbitals) - dynamický dosah i velikost podle úrovně
    if (this.hasOrbitals && this.orbitalsCount > 0) {
      const radius = this.getOrbitalRadius();
      const bladeScale = this.getOrbitalBladeSize();
      const count = this.orbitalsCount;
      for (let i = 0; i < count; i++) {
        const angle = this.orbitalAngle + (i * (Math.PI * 2 / count));
        const ox = screenX + Math.cos(angle) * radius;
        const oy = screenY + Math.sin(angle) * radius;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(angle + Math.PI / 2);
        ctx.scale(bladeScale, bladeScale);

        // Zářící magická čepel
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(6, 10);
        ctx.lineTo(-6, 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(2, 6);
        ctx.lineTo(-2, 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }
  }
}

class Projectile {
  constructor(x, y, vx, vy, damage, pierce = 0, splash = false, splashRadius = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.pierce = pierce;
    this.splash = splash;
    this.splashRadius = splashRadius;
    this.radius = 6.5;
    this.life = 1.6;
    this.hitEnemies = new Set();
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.shadowColor = this.splash ? '#f97316' : '#38bdf8';
    ctx.shadowBlur = 12;

    // Vnější aura
    ctx.fillStyle = this.splash ? '#fb923c' : '#7dd3fc';
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Horké magické jádro
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class EnemyProjectile {
  constructor(x, y, vx, vy, damage = 15, radius = 7, color = '#ef4444') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = radius;
    this.color = color;
    this.life = 3.5;
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = this.color;

    // Vnější plamenná koule
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Horké jádro
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Enemy {
  constructor(x, y, type, stageNumber = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.stageMult = 1 + (stageNumber - 1) * 0.28;

    this.setupTypeProps();
    this.hp *= this.stageMult;
    this.maxHp = this.hp;
    this.damage *= Math.min(3, 1 + (stageNumber - 1) * 0.15);

    this.hitFlash = 0;
    this.animTime = Math.random() * 10;
  }

  setupTypeProps() {
    switch (this.type) {
      case 'zombie':
        this.name = 'Zombie';
        this.radius = 15;
        this.hp = 35;
        this.speed = 1.4;
        this.damage = 10;
        this.color = '#365314';
        this.xpValue = 1;
        break;
      case 'skeleton':
        this.name = 'Kostlivec';
        this.radius = 14;
        this.hp = 25;
        this.speed = 2.1;
        this.damage = 12;
        this.color = '#e2e8f0';
        this.xpValue = 1.5;
        break;
      case 'bat':
        this.name = 'Upíří Netopýr';
        this.radius = 12;
        this.hp = 18;
        this.speed = 3.2;
        this.damage = 8;
        this.color = '#581c87';
        this.xpValue = 1.5;
        break;
      case 'slime':
        this.name = 'Kyselý Sliz';
        this.radius = 18;
        this.hp = 50;
        this.speed = 1.2;
        this.damage = 15;
        this.color = '#84cc16';
        this.xpValue = 2;
        break;
      case 'armored_knight':
        this.name = 'Kostlivý Rytíř';
        this.radius = 19;
        this.hp = 95;
        this.speed = 1.3;
        this.damage = 20;
        this.color = '#334155';
        this.xpValue = 4;
        break;
      case 'ghost':
        this.name = 'Přízrak';
        this.radius = 16;
        this.hp = 45;
        this.speed = 2.6;
        this.damage = 14;
        this.color = '#38bdf8';
        this.xpValue = 5;
        this.isShooter = true;
        this.shootCooldown = 2.5 + Math.random() * 1.5;
        this.telegraphTimer = 0;
        this.telegraphDuration = 0.75;
        this.telegraphTarget = null;
        break;
      case 'ice_wraith':
        this.name = 'Ledový Běs';
        this.radius = 17;
        this.hp = 80;
        this.speed = 2.4;
        this.damage = 18;
        this.color = '#0284c7';
        this.xpValue = 7;
        this.isShooter = true;
        this.shootCooldown = 2.2 + Math.random() * 1.5;
        this.telegraphTimer = 0;
        this.telegraphDuration = 0.8;
        this.telegraphTarget = null;
        break;
      case 'hell_hound':
        this.name = 'Pekelný Pes';
        this.radius = 16;
        this.hp = 65;
        this.speed = 2.7;
        this.damage = 18;
        this.color = '#dc2626';
        this.xpValue = 8;
        break;
      case 'cultist':
        this.name = 'Kultista Temnoty';
        this.radius = 16;
        this.hp = 60;
        this.speed = 1.9;
        this.damage = 16;
        this.color = '#a855f7';
        this.xpValue = 5;
        this.isShooter = true;
        this.shootCooldown = 2.4 + Math.random() * 1.2;
        this.telegraphTimer = 0;
        this.telegraphDuration = 0.7;
        this.telegraphTarget = null;
        break;
      case 'skeleton_archer':
        this.name = 'Kostlivý Lučištník';
        this.radius = 14;
        this.hp = 38;
        this.speed = 2.0;
        this.damage = 14;
        this.color = '#cbd5e1';
        this.xpValue = 4;
        this.isShooter = true;
        this.shootCooldown = 2.0 + Math.random() * 1.0;
        this.telegraphTimer = 0;
        this.telegraphDuration = 0.65;
        this.telegraphTarget = null;
        break;
      case 'fire_imp':
        this.name = 'Ohnivý Diblík';
        this.radius = 13;
        this.hp = 32;
        this.speed = 3.1;
        this.damage = 12;
        this.color = '#f97316';
        this.xpValue = 4.5;
        this.isShooter = true;
        this.shootCooldown = 1.8 + Math.random() * 1.0;
        this.telegraphTimer = 0;
        this.telegraphDuration = 0.55;
        this.telegraphTarget = null;
        break;
      case 'infernal_brute':
        this.name = 'Pekelný Brut';
        this.radius = 24;
        this.hp = 190;
        this.speed = 1.15;
        this.damage = 32;
        this.color = '#b91c1c';
        this.xpValue = 12;
        break;
      default:
        this.name = 'Nestvůra';
        this.radius = 15;
        this.hp = 40;
        this.speed = 1.8;
        this.damage = 12;
        this.color = '#94a3b8';
        this.xpValue = 3;
        break;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.15;
    window.sound.hit();
    window.particleSystem.spawnBlood(this.x, this.y, this.color, 4);
    window.particleSystem.addDamageNumber(this.x, this.y, amount);
    return this.hp <= 0;
  }

  update(dt, player, spawnEnemyProjectile = null) {
    this.animTime += dt * 6;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Pokud střelec telegrafuje útok, zpomalí se a míří
    if (this.isShooter) {
      if (this.telegraphTimer > 0) {
        this.telegraphTimer -= dt;
        if (this.telegraphTimer <= 0 && spawnEnemyProjectile && this.telegraphTarget) {
          const aimDx = this.telegraphTarget.x - this.x;
          const aimDy = this.telegraphTarget.y - this.y;
          const aimDist = Math.hypot(aimDx, aimDy) || 1;
          const projSpeed = 6.5;
          const vx = (aimDx / aimDist) * projSpeed;
          const vy = (aimDy / aimDist) * projSpeed;
          const projDmg = Math.round(this.damage * 0.85);

          spawnEnemyProjectile(new EnemyProjectile(this.x, this.y, vx, vy, projDmg, 7, this.color));
          if (window.sound && window.sound.enemyShoot) window.sound.enemyShoot();
          this.telegraphTarget = null;
        }
      } else {
        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0 && dist < 420) {
          this.shootCooldown = 3.0 + Math.random() * 1.5;
          this.telegraphTimer = this.telegraphDuration;
          this.telegraphTarget = { x: player.x, y: player.y };
        }
      }
    }

    const moveMult = (this.telegraphTimer > 0) ? 0.25 : 1.0;
    if (dist > 2) {
      this.x += (dx / dist) * this.speed * moveMult * dt * 60;
      this.y += (dy / dist) * this.speed * moveMult * dt * 60;
    }
  }

  // Středověký vizuál jednotlivých monster
  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // 1. Telegrafovaná červená zóna střelce
    if (this.telegraphTimer > 0 && this.telegraphTarget) {
      const targetScreenX = this.telegraphTarget.x - camera.x;
      const targetScreenY = this.telegraphTarget.y - camera.y;
      const progress = 1 - (this.telegraphTimer / this.telegraphDuration);

      ctx.save();
      // Laserová červená varovná čára
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + progress * 0.5})`;
      ctx.lineWidth = 2 + progress * 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(targetScreenX, targetScreenY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cílová výstražná zóna
      ctx.fillStyle = `rgba(239, 68, 68, ${0.2 + progress * 0.35})`;
      ctx.strokeStyle = `rgba(255, 68, 68, ${0.7 + progress * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetScreenX, targetScreenY, 24 * (0.6 + progress * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Zaměřovací nitkový kříž
      ctx.beginPath();
      ctx.moveTo(targetScreenX - 8, targetScreenY);
      ctx.lineTo(targetScreenX + 8, targetScreenY);
      ctx.moveTo(targetScreenX, targetScreenY - 8);
      ctx.lineTo(targetScreenX, targetScreenY + 8);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // Měkký stín
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius, this.radius, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vykreslení podle typu nepřítele
    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      switch (this.type) {
        case 'zombie': {
          // Hnijící tlející tělo
          ctx.fillStyle = '#365314';
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Roztrhaný hnědý rubáš
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-6, -4, 12, 10);

          // Žluté prázdné oči
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-5, -3, 3, 3);
          ctx.fillRect(2, -3, 3, 3);
          break;
        }

        case 'skeleton': {
          // Bělostné kosti a žebra
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(0, -3, this.radius * 0.8, 0, Math.PI * 2); // lebka
          ctx.fill();

          // Oční důlky a nos
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
          ctx.arc(3, -3, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Žebra pod lebkou
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-6, 6); ctx.lineTo(6, 6);
          ctx.moveTo(-5, 10); ctx.lineTo(5, 10);
          ctx.stroke();
          break;
        }

        case 'bat': {
          // Upíří netopýr s mávajícími křídly
          const wingSpread = Math.sin(this.animTime) * 6;
          ctx.fillStyle = '#3b0764';
          ctx.beginPath();
          // Tělo
          ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2);
          // Levé křídlo
          ctx.moveTo(-5, 0);
          ctx.lineTo(-18, -8 + wingSpread);
          ctx.lineTo(-10, 8);
          // Pravé křídlo
          ctx.moveTo(5, 0);
          ctx.lineTo(18, -8 + wingSpread);
          ctx.lineTo(10, 8);
          ctx.fill();

          // Rudé oči
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-3, -4, 2, 2);
          ctx.fillRect(2, -4, 2, 2);
          break;
        }

        case 'slime': {
          // Kyselý deformující se sliz
          const wobble = Math.sin(this.animTime) * 2.5;
          ctx.fillStyle = '#84cc16';
          ctx.beginPath();
          ctx.ellipse(0, 0, this.radius + wobble, this.radius - wobble * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#4d7c0f';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Vnitřní jádro
          ctx.fillStyle = 'rgba(77, 124, 15, 0.6)';
          ctx.beginPath();
          ctx.arc(2, 1, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'armored_knight': {
          // Temný rytíř v plátové zbroji s helmou
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Rohy na helmě
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(-8, -12); ctx.lineTo(-14, -18); ctx.lineTo(-4, -13);
          ctx.moveTo(8, -12); ctx.lineTo(14, -18); ctx.lineTo(4, -13);
          ctx.fill();

          // Hledí s rudým svitem
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-6, -4, 12, 3);
          break;
        }

        case 'ghost': {
          // Vlající éterický přízrak
          const sway = Math.sin(this.animTime) * 3;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
          ctx.beginPath();
          ctx.arc(0, -4, this.radius * 0.9, Math.PI, 0, false);
          ctx.lineTo(this.radius * 0.9, 10);
          ctx.lineTo(sway, 6);
          ctx.lineTo(-this.radius * 0.9, 10);
          ctx.closePath();
          ctx.fill();

          // Duté modré oči
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-4, -4, 2.5, 0, Math.PI * 2);
          ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'ice_wraith': {
          // Ledový démon s krystalickými hroty
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(0, 0, this.radius * 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Ledové krystaly
          ctx.fillStyle = '#e0f2fe';
          for (let a = 0; a < 4; a++) {
            const rot = (a * Math.PI / 2) + this.animTime * 0.3;
            const px = Math.cos(rot) * 14;
            const py = Math.sin(rot) * 14;
            ctx.fillRect(px - 2, py - 2, 4, 4);
          }
          break;
        }

        case 'hell_hound': {
          // Pekelný pes s žhnoucí srstí
          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();

          // Hořící hříva
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(0, -4, this.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();

          // Žnoucí oči
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-5, -6, 3, 3);
          ctx.fillRect(2, -6, 3, 3);
          break;
        }

        case 'cultist': {
          // Temný kultista v purpurové kápi s runovým symbolem
          ctx.fillStyle = '#4c1d95';
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Kápě
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(0, -2, this.radius * 0.65, 0, Math.PI * 2);
          ctx.fill();

          // Fialově žhnoucí oči
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(-4, -3, 2.5, 2.5);
          ctx.fillRect(2, -3, 2.5, 2.5);

          // Magická hůl
          ctx.fillStyle = '#78350f';
          ctx.fillRect(9, -12, 3, 19);
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(10.5, -13, 3.8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'skeleton_archer': {
          // Kostlivec s dlouhým lukem a toulcem
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(0, -3, this.radius * 0.8, 0, Math.PI * 2);
          ctx.fill();

          // Oční důlky
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-3, -3, 2.2, 0, Math.PI * 2);
          ctx.arc(3, -3, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Luk v ruce
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(9, 0, 10, -Math.PI / 2.2, Math.PI / 2.2);
          ctx.stroke();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(13, -7);
          ctx.lineTo(13, 7);
          ctx.stroke();
          break;
        }

        case 'fire_imp': {
          // Ohnivý diblík - rohatý malý démon se žlutýma očima
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Rohy
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.moveTo(-5, -6); ctx.lineTo(-9, -13); ctx.lineTo(-2, -8);
          ctx.moveTo(5, -6); ctx.lineTo(9, -13); ctx.lineTo(2, -8);
          ctx.fill();

          // Žlutá očka a jiskry
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-4, -2, 2.5, 2.5);
          ctx.fillRect(2, -2, 2.5, 2.5);
          break;
        }

        case 'infernal_brute': {
          // Pekelný Brut - obrovský rohatý démon s ostnatým kyjem
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#450a0a';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Kamenné/obsidiánové pláty
          ctx.fillStyle = '#18181b';
          ctx.fillRect(-10, -6, 20, 12);

          // Masivní rohy
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.moveTo(-10, -8); ctx.lineTo(-18, -18); ctx.lineTo(-4, -12);
          ctx.moveTo(10, -8); ctx.lineTo(18, -18); ctx.lineTo(4, -12);
          ctx.fill();

          // Žhnoucí lávové oči
          ctx.fillStyle = '#f97316';
          ctx.fillRect(-6, -3, 4, 3);
          ctx.fillRect(2, -3, 4, 3);
          break;
        }

        default: {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    }

    // Středověká HP lišta pro zraněná monstra
    if (this.hp < this.maxHp) {
      const barW = this.radius * 2;
      const barH = 4;
      const hpRatio = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-this.radius, -this.radius - 8, barW, barH);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-this.radius, -this.radius - 8, barW * hpRatio, barH);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.strokeRect(-this.radius, -this.radius - 8, barW, barH);
    }

    ctx.restore();
  }
}

class BossEnemy extends Enemy {
  constructor(x, y, bossKey, stageNumber) {
    super(x, y, 'boss', stageNumber);
    this.bossKey = bossKey;
    this.stageNumber = stageNumber;
    this.isBoss = true;
    this.radius = 34;
    this.hp = (400 + stageNumber * 280) * this.stageMult;
    this.maxHp = this.hp;
    this.speed = 1.6 + Math.min(1.2, stageNumber * 0.1);
    this.damage = 25 + stageNumber * 5;
    this.color = '#7f1d1d';
    this.xpValue = 60 + stageNumber * 25;

    // Boss útoky a telegrafování
    this.attackCooldown = 3.5;
    this.telegraphTimer = 0;
    this.telegraphDuration = 1.15; // 1.15s varovná zóna
    this.attackMode = 'aimed_spread';
    this.telegraphTarget = null;

    this.setupBossData();
  }

  setupBossData() {
    const names = {
      ghoul_lord: 'Pán Ghúlů',
      crypt_horror: 'Kryptový Děs',
      swamp_abomination: 'Bahenní Zrůda',
      bone_colossus: 'Kostěný Kolos',
      shadow_reaper: 'Stínový Sekáč',
      frost_titan: 'Mrazivý Titán',
      magma_golem: 'Magmatický Golem',
      lich_king: 'Král Lichů',
      abyss_herald: 'Hlasatel Propasti',
      crimson_overlord: 'Karmínový Vládce'
    };
    this.name = names[this.bossKey] || 'Arcidémon';
  }

  update(dt, player, spawnEnemyProjectile = null) {
    this.animTime += dt * 6;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Telegrafování a útoky bosse
    if (this.telegraphTimer > 0) {
      this.telegraphTimer -= dt;

      if (this.telegraphTimer <= 0 && spawnEnemyProjectile) {
        const projDmg = Math.round(this.damage * 0.85);

        if (this.attackMode === 'aimed_spread' && this.telegraphTarget) {
          // Vějířový útok: úhly střel přesně odpovídají telegrafovanému výseči
          const aimAngle = Math.atan2(this.telegraphTarget.y - this.y, this.telegraphTarget.x - this.x);
          const shots = 5 + (this.stageNumber >= 6 ? 2 : 0);
          const spread = 0.30;
          const projSpeed = 6.2;

          for (let i = 0; i < shots; i++) {
            const angle = aimAngle + (i - (shots - 1) / 2) * spread;
            const vx = Math.cos(angle) * projSpeed;
            const vy = Math.sin(angle) * projSpeed;
            spawnEnemyProjectile(new EnemyProjectile(this.x, this.y, vx, vy, projDmg, 9, '#ef4444'));
          }
          if (window.sound && window.sound.enemyShoot) window.sound.enemyShoot();

        } else if (this.attackMode === 'ring') {
          // Kruhová salva projektilů
          const count = 12;
          const projSpeed = 5.2;

          for (let i = 0; i < count; i++) {
            const angle = (i * Math.PI * 2) / count;
            const vx = Math.cos(angle) * projSpeed;
            const vy = Math.sin(angle) * projSpeed;
            spawnEnemyProjectile(new EnemyProjectile(this.x, this.y, vx, vy, projDmg, 8, '#f97316'));
          }
          if (window.sound && window.sound.enemyShoot) window.sound.enemyShoot();

        } else if (this.attackMode === 'cross_explosion') {
          // Křížová exploze: projektily vystřelené do 8 směrů (kardinální + diagonální osy)
          const axes = [
            0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4,
            Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4
          ];
          const projSpeed = 6.8;

          axes.forEach((ang) => {
            const vx = Math.cos(ang) * projSpeed;
            const vy = Math.sin(ang) * projSpeed;
            spawnEnemyProjectile(new EnemyProjectile(this.x, this.y, vx, vy, projDmg, 9, '#dc2626'));
          });
          if (window.sound && window.sound.enemyShoot) window.sound.enemyShoot();

        } else if (this.attackMode === 'spiral') {
          // Spirálové střílení: vířivý závoj projektilů
          const count = 16;
          const projSpeed = 5.8;
          const offset = this.animTime;

          for (let i = 0; i < count; i++) {
            const angle = offset + (i * Math.PI * 2) / count;
            const vx = Math.cos(angle) * projSpeed;
            const vy = Math.sin(angle) * projSpeed;
            spawnEnemyProjectile(new EnemyProjectile(this.x, this.y, vx, vy, projDmg, 8, '#a855f7'));
          }
          if (window.sound && window.sound.enemyShoot) window.sound.enemyShoot();

        } else if (this.attackMode === 'shrinking_zone' && this.telegraphTarget) {
          // Plošná zóna: detonace v cílovém místě se shrapnely do všech stran
          const blastX = this.telegraphTarget.x;
          const blastY = this.telegraphTarget.y;
          const count = 10;
          const projSpeed = 5.0;

          for (let i = 0; i < count; i++) {
            const angle = (i * Math.PI * 2) / count;
            const vx = Math.cos(angle) * projSpeed;
            const vy = Math.sin(angle) * projSpeed;
            spawnEnemyProjectile(new EnemyProjectile(blastX, blastY, vx, vy, projDmg, 8, '#ef4444'));
          }

          // Přímé zranění, pokud hráč zůstal v oblasti dopadu
          const pDist = Math.hypot(player.x - blastX, player.y - blastY);
          if (pDist <= 85) {
            player.takeDamage(Math.round(this.damage * 0.9));
          }

          if (window.particleSystem) {
            window.particleSystem.spawnExplosion(blastX, blastY, '#ef4444', 35);
          }
          if (window.sound && window.sound.enemyShoot) window.sound.enemyShoot();
        }

        this.telegraphTarget = null;
      }
    } else {
      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 3.6 + Math.random() * 1.4;
        this.telegraphTimer = this.telegraphDuration;

        // Volba komplexního vzorce podle dosažené stage
        const availableModes = ['aimed_spread', 'ring'];
        if (this.stageNumber >= 4) availableModes.push('cross_explosion');
        if (this.stageNumber >= 7) availableModes.push('spiral');
        if (this.stageNumber >= 9) availableModes.push('shrinking_zone');

        this.attackMode = availableModes[Math.floor(Math.random() * availableModes.length)];
        this.telegraphTarget = { x: player.x, y: player.y };
      }
    }

    const moveMult = (this.telegraphTimer > 0) ? 0.3 : 1.0;
    if (dist > 2) {
      this.x += (dx / dist) * this.speed * moveMult * dt * 60;
      this.y += (dy / dist) * this.speed * moveMult * dt * 60;
    }
  }

  // Vykreslení bosse a kontrastního runového telegrafování
  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // 1. ZÁŘÍCÍ RUNOVÉ TELEGRAFOVÁNÍ ÚTOKU (Vysoký kontrast proti tmě i aréně)
    if (this.telegraphTimer > 0) {
      const progress = 1 - (this.telegraphTimer / this.telegraphDuration);

      ctx.save();
      if (this.attackMode === 'aimed_spread' && this.telegraphTarget) {
        // Vějířový útok: Matematicky přesný kužel odpovídající trajektoriím
        const targetScreenX = this.telegraphTarget.x - camera.x;
        const targetScreenY = this.telegraphTarget.y - camera.y;
        const aimAngle = Math.atan2(this.telegraphTarget.y - this.y, this.telegraphTarget.x - this.x);

        const shots = 5 + (this.stageNumber >= 6 ? 2 : 0);
        const spread = 0.30;
        const fanHalfAngle = ((shots - 1) / 2) * spread + 0.08;
        const beamLen = 350;

        ctx.fillStyle = `rgba(239, 68, 68, ${0.25 + progress * 0.45})`;
        ctx.strokeStyle = `rgba(255, 30, 30, ${0.85 + progress * 0.15})`;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.arc(screenX, screenY, beamLen, aimAngle - fanHalfAngle, aimAngle + fanHalfAngle);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Zaměřovací terč na hráče
        ctx.strokeStyle = `rgba(255, 230, 0, ${0.7 + progress * 0.3})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(targetScreenX, targetScreenY, 30 * (0.6 + progress * 0.4), 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(targetScreenX - 12, targetScreenY);
        ctx.lineTo(targetScreenX + 12, targetScreenY);
        ctx.moveTo(targetScreenX, targetScreenY - 12);
        ctx.lineTo(targetScreenX, targetScreenY + 12);
        ctx.stroke();

      } else if (this.attackMode === 'ring') {
        // Expanzivní runový kruh okolo bosse
        const ringR = 175 * progress;
        ctx.fillStyle = `rgba(249, 115, 22, ${0.2 + progress * 0.35})`;
        ctx.strokeStyle = `rgba(255, 50, 50, ${0.85 + progress * 0.15})`;
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        ctx.arc(screenX, screenY, ringR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vnitřní runový prstenec
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, ringR * 0.7, 0, Math.PI * 2);
        ctx.stroke();

      } else if (this.attackMode === 'cross_explosion') {
        // Křížové varovné koridory
        const corridorLen = 420;
        const width = 24;
        ctx.fillStyle = `rgba(220, 38, 38, ${0.25 + progress * 0.45})`;
        ctx.strokeStyle = `rgba(255, 20, 20, ${0.85 + progress * 0.15})`;
        ctx.lineWidth = 2;

        const angles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4];
        angles.forEach((ang) => {
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(ang);
          ctx.fillRect(-corridorLen, -width / 2, corridorLen * 2, width);
          ctx.strokeRect(-corridorLen, -width / 2, corridorLen * 2, width);
          ctx.restore();
        });

      } else if (this.attackMode === 'spiral') {
        // Spirálový vír energie
        const count = 5;
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + progress * 0.55})`;
        ctx.lineWidth = 3;

        for (let s = 0; s < count; s++) {
          const startAngle = this.animTime * 2 + (s * (Math.PI * 2 / count));
          ctx.beginPath();
          for (let r = 20; r < 200; r += 15) {
            const a = startAngle + (r * 0.03);
            const px = screenX + Math.cos(a) * r;
            const py = screenY + Math.sin(a) * r;
            if (r === 20) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

      } else if (this.attackMode === 'shrinking_zone' && this.telegraphTarget) {
        // Zmenšující se varovná zóna: Cílový kruh a stahující se prstenec
        const targetScreenX = this.telegraphTarget.x - camera.x;
        const targetScreenY = this.telegraphTarget.y - camera.y;
        const zoneRadius = 85;
        const shrinkingRadius = zoneRadius + (1 - progress) * 80;

        // Cílová dopadová zóna
        ctx.fillStyle = `rgba(239, 68, 68, ${0.2 + progress * 0.35})`;
        ctx.strokeStyle = `rgba(255, 30, 30, 0.8)`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(targetScreenX, targetScreenY, zoneRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Zmenšující se kruh indikující okamžik detonace
        ctx.strokeStyle = `rgba(254, 240, 138, ${0.8 + progress * 0.2})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(targetScreenX, targetScreenY, shrinkingRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // Temná magická aura
    const glow = ctx.createRadialGradient(0, 0, this.radius * 0.8, 0, 0, this.radius * 1.7);
    glow.addColorStop(0, 'rgba(185, 28, 28, 0.7)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.7, 0, Math.PI * 2);
    ctx.fill();

    // Tělo bosse (Masivní obsidiánové brnění)
    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();

    // Karmínový plášť
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(-18, -10);
    ctx.lineTo(-30, 26);
    ctx.lineTo(30, 26);
    ctx.lineTo(18, -10);
    ctx.fill();

    // Mohutné rohy
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(-16, -this.radius);
    ctx.lineTo(-28, -this.radius - 22);
    ctx.lineTo(-8, -this.radius - 6);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, -this.radius);
    ctx.lineTo(28, -this.radius - 22);
    ctx.lineTo(8, -this.radius - 6);
    ctx.fill();

    // Zlatá královská koruna s rubíny
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(-18, -this.radius + 2);
    ctx.lineTo(-14, -this.radius - 12);
    ctx.lineTo(-6, -this.radius - 2);
    ctx.lineTo(0, -this.radius - 16);
    ctx.lineTo(6, -this.radius - 2);
    ctx.lineTo(14, -this.radius - 12);
    ctx.lineTo(18, -this.radius + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Zářící rubín na koruně
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -this.radius - 8, 3, 0, Math.PI * 2);
    ctx.fill();

    // Žnoucí oči bosse
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-9, -6, 5, 4);
    ctx.fillRect(4, -6, 5, 4);

    // Středověká vyřezávaná kamenná HP lišta bosse
    const barW = 96;
    const barH = 9;
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-barW / 2, -this.radius - 26, barW, barH);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-barW / 2, -this.radius - 26, barW * hpRatio, barH);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-barW / 2, -this.radius - 26, barW, barH);

    // Jméno bosse
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px "MedievalSharp", serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.name}`, 0, -this.radius - 30);

    ctx.restore();
  }
}

class XPGem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.sparkleTimer = Math.random();
    this.updateVisualProperties();
  }

  updateVisualProperties() {
    // Odstupňované vizuály krystalů (Smaragd -> Safír -> Ametyst -> Rubín -> Sluneční diamant)
    if (this.value >= 40) {
      this.color = '#fbbf24'; // Solární Zlatý Diamant
      this.radius = 12;
    } else if (this.value >= 18) {
      this.color = '#ef4444'; // Karmínový Rubín
      this.radius = 10;
    } else if (this.value >= 8) {
      this.color = '#a855f7'; // Temný Ametyst
      this.radius = 8.5;
    } else if (this.value >= 3) {
      this.color = '#38bdf8'; // Zářící Safír
      this.radius = 7.2;
    } else {
      this.color = '#34d399'; // Smaragd
      this.radius = 6.2;
    }
  }

  mergeWith(other) {
    this.value += other.value;
    this.updateVisualProperties();
    if (window.particleSystem && window.particleSystem.spawnXPGemSparkle) {
      window.particleSystem.spawnXPGemSparkle(this.x, this.y);
    }
  }

  update(dt, player) {
    this.sparkleTimer += dt;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Magnetizace
    if (dist <= player.magnetRange) {
      const speed = Math.max(4.5, 400 / (dist + 10));
      this.x += (dx / dist) * speed * dt * 60;
      this.y += (dy / dist) * speed * dt * 60;
    }

    // Sebrání
    if (dist <= player.radius + this.radius) {
      const earnedXP = this.value * (player.xpMult || 1.0);
      player.xp += earnedXP;
      window.sound.pickupXP();
      window.particleSystem.spawnXPGemSparkle(this.x, this.y);
      return true;
    }
    return false;
  }

  // Broušený krystalický drahokam s fazetami
  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);

    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;

    // Fazetovaný kosočtverec
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(0, this.radius);
    ctx.lineTo(-this.radius, 0);
    ctx.closePath();
    ctx.fill();

    // Vnitřní fazety a třpyt
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 0.7);
    ctx.lineTo(this.radius * 0.5, 0);
    ctx.lineTo(0, this.radius * 0.4);
    ctx.lineTo(-this.radius * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

class GoldCoin {
  constructor(x, y, value = 1) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 7.5;
    this.color = '#fbbf24';
    this.sparkleTimer = Math.random();
    this.angle = 0;
  }

  update(dt, player) {
    this.sparkleTimer += dt;
    this.angle += dt * 4;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Magnetizace
    if (dist <= player.magnetRange) {
      const speed = Math.max(5, 420 / (dist + 10));
      this.x += (dx / dist) * speed * dt * 60;
      this.y += (dy / dist) * speed * dt * 60;
    }

    // Sebrání
    if (dist <= player.radius + this.radius) {
      if (window.game) {
        window.game.addGold(this.value);
      }
      window.sound.pickupCoin();
      window.particleSystem.spawnExplosion(this.x, this.y, '#f59e0b', 8);
      return true;
    }
    return false;
  }

  // 3D iluze točící se královské zlaté mince - sjednocený vizuál s UI mincí
  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);

    ctx.shadowColor = '#D4AF37';
    ctx.shadowBlur = 8;

    // Šířka měnící se s rotací mince
    const scaleX = Math.abs(Math.cos(this.angle)) * 0.8 + 0.2;
    ctx.scale(scaleX, 1);

    // 1. Zlaté tělo mince (přechod)
    const grad = ctx.createLinearGradient(0, -this.radius, 0, this.radius);
    grad.addColorStop(0, '#FFF1B0');
    grad.addColorStop(0.5, '#D4AF37');
    grad.addColorStop(1, '#8A6A14');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vnější tmavý obvod
    ctx.strokeStyle = '#4A3408';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 3. Vnitřní vyrytý prstenec
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = '#8A6A14';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 4. Středový kosočtvercový znak (pergamen/zlato)
    const dH = this.radius * 0.55;
    const dW = this.radius * 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -dH);
    ctx.lineTo(dW, 0);
    ctx.lineTo(0, dH);
    ctx.lineTo(-dW, 0);
    ctx.closePath();
    ctx.fillStyle = '#F1E4C3';
    ctx.fill();
    ctx.strokeStyle = '#8A6A14';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    ctx.restore();
  }
}

// Třída pro překážky v aréně (stromy, balvany, pařezy, pilíře, voda / láva)
class Obstacle {
  constructor(x, y, type = 'rock', radius = null) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = radius || this.getDefaultRadius(type);
    this.isWater = (type === 'water' || type === 'magma_pool');
    this.seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    this.rotation = Math.abs(this.seed) % (Math.PI * 2);
    this.animTime = Math.abs(this.seed) % 10;
  }

  getDefaultRadius(type) {
    switch (type) {
      case 'water':
      case 'magma_pool':
        return 42;
      case 'tree':
      case 'dead_tree':
        return 22;
      case 'rock':
      case 'ice_boulder':
        return 20;
      case 'pillar':
        return 18;
      case 'stump':
        return 16;
      default:
        return 20;
    }
  }

  checkEntityCollision(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    const dist = Math.hypot(dx, dy);
    const minDist = this.radius + entity.radius;
    if (dist < minDist && dist > 0.001) {
      const overlap = minDist - dist;
      entity.x += (dx / dist) * overlap;
      entity.y += (dy / dist) * overlap;
      return true;
    }
    return false;
  }

  checkProjectileCollision(p) {
    if (this.isWater) return false; // Projektily volně létají nad vodou a lávou
    const dist = Math.hypot(p.x - this.x, p.y - this.y);
    return dist < (this.radius + p.radius);
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (
      screenX < -80 || screenX > ctx.canvas.width + 80 ||
      screenY < -80 || screenY > ctx.canvas.height + 80
    ) {
      return;
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    switch (this.type) {
      case 'tree': {
        // 1. Měkký stín koruny
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(8, 12, this.radius * 1.1, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Kmen uprostřed
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(0, 4, 7, 0, Math.PI * 2);
        ctx.fill();

        // 3. Spodní vrstva koruny (tmavě lesní zelená)
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(0, -4, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 4. Střední vrstva koruny (svěží zelená)
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(-2, -6, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // 5. Vrchní světlá koruna & listoví
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(-4, -9, this.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(-5, -11, this.radius * 0.28, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'dead_tree': {
        // Mrtvý pokroucený strom
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(6, 8, this.radius * 0.9, this.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(-4, -8);
        ctx.lineTo(-14, -18);
        ctx.moveTo(-4, -8);
        ctx.lineTo(10, -16);
        ctx.moveTo(1, -2);
        ctx.lineTo(12, 2);
        ctx.moveTo(-3, 0);
        ctx.lineTo(-12, 4);
        ctx.stroke();

        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(0, 2, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'rock': {
        // Balvan / Kámen s fazetami a stínem
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(4, 6, this.radius, this.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.9, 2);
        ctx.lineTo(-this.radius * 0.6, -this.radius * 0.8);
        ctx.lineTo(this.radius * 0.4, -this.radius * 0.9);
        ctx.lineTo(this.radius * 0.9, -this.radius * 0.2);
        ctx.lineTo(this.radius * 0.7, this.radius * 0.7);
        ctx.lineTo(-this.radius * 0.4, this.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        // Světlá nasvícená fazeta
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.6, -this.radius * 0.8);
        ctx.lineTo(this.radius * 0.4, -this.radius * 0.9);
        ctx.lineTo(0, -this.radius * 0.2);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        // Mechová skvrna
        ctx.fillStyle = '#3f6212';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, this.radius * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      }

      case 'ice_boulder': {
        // Mrazivý ledový krystal / balvan
        ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
        ctx.beginPath();
        ctx.ellipse(4, 6, this.radius, this.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.8, -this.radius * 0.3);
        ctx.lineTo(this.radius * 0.6, this.radius * 0.7);
        ctx.lineTo(-this.radius * 0.6, this.radius * 0.7);
        ctx.lineTo(-this.radius * 0.8, -this.radius * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.5, -this.radius * 0.2);
        ctx.lineTo(0, this.radius * 0.2);
        ctx.lineTo(-this.radius * 0.5, -this.radius * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.2, -this.radius * 0.4);
        ctx.lineTo(-this.radius * 0.2, -this.radius * 0.4);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'pillar': {
        // Prastarý kamenný sloup / ruina
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(4, 8, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pata sloupu
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 4, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Hlavice / tělo
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, -2, this.radius * 0.85, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, -6, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      }

      case 'stump': {
        // Dřevěný pařez s letokruhy
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(3, 5, this.radius, this.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#543015';
        ctx.beginPath();
        ctx.arc(0, 2, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#a16207';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.85, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
        ctx.arc(0, 0, this.radius * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'water': {
        // Rybník / Voda s jemným vlněním
        this.animTime += 0.016;
        const wave = Math.sin(this.animTime * 2) * 2;

        // Břeh
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
        ctx.fill();

        // Voda
        const waterGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius);
        waterGrad.addColorStop(0, '#38bdf8');
        waterGrad.addColorStop(0.7, '#0284c7');
        waterGrad.addColorStop(1, '#0369a1');
        ctx.fillStyle = waterGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + wave, 0, Math.PI * 2);
        ctx.fill();

        // Odlesk / vlnka
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-8, -8, 12, 0.3, 1.8);
        ctx.stroke();
        break;
      }

      case 'magma_pool': {
        // Vroucí lávové jezírko
        this.animTime += 0.02;
        const bubble = Math.sin(this.animTime * 3) * 2.5;

        // Vulkanický břeh
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
        ctx.fill();

        // Láva
        const lavaGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius);
        lavaGrad.addColorStop(0, '#fef08a');
        lavaGrad.addColorStop(0.5, '#ea580c');
        lavaGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = lavaGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + bubble, 0, Math.PI * 2);
        ctx.fill();

        // Žhavá bublina
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-6, -6, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      default: {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }
}

// Třída pro ohnivé stopy zanechávané hráčem (Fire Trail)
class FirePatch {
  constructor(x, y, damage, radius = 22, duration = 3.0) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.radius = radius;
    this.duration = duration;
    this.maxDuration = duration;
    this.tickTimer = 0;
    this.tickInterval = 0.25; // škoda každých 250ms
    this.flickerTimer = Math.random() * 10;
  }

  update(dt, enemies, registerDamage) {
    this.duration -= dt;
    this.flickerTimer += dt * 8;
    this.tickTimer -= dt;

    if (this.duration <= 0) return false;

    if (this.tickTimer <= 0) {
      this.tickTimer = this.tickInterval;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const dist = Math.hypot(e.x - this.x, e.y - this.y);
        if (dist <= this.radius + e.radius) {
          registerDamage(e, this.damage);
        }
      }
    }
    return true;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    const alpha = Math.min(1, this.duration / 0.5) * 0.85;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Žhnoucí ohnivá plocha
    const flicker = Math.sin(this.flickerTimer) * 2;
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + flicker);
    grad.addColorStop(0, `rgba(255, 237, 74, ${alpha})`);
    grad.addColorStop(0.4, `rgba(249, 115, 22, ${alpha * 0.85})`);
    grad.addColorStop(0.8, `rgba(220, 38, 38, ${alpha * 0.5})`);
    grad.addColorStop(1, 'rgba(127, 29, 29, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + flicker, 0, Math.PI * 2);
    ctx.fill();

    // Vnitřní plamínky a jiskry
    for (let i = 0; i < 3; i++) {
      const ang = this.flickerTimer + (i * Math.PI * 2 / 3);
      const fx = Math.cos(ang) * (this.radius * 0.4);
      const fy = Math.sin(ang) * (this.radius * 0.4);
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Třída pro rotující prorážející posvátné kříže (Holy Cross)
class HolyCrossProjectile {
  constructor(x, y, vx, vy, damage, size = 16, duration = 3.5) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = size;
    this.duration = duration;
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = 8.5; // rychlá rotace kříže
    this.hitCooldowns = new Map(); // nepřítel -> cooldown na další tick zásahu
  }

  update(dt, enemies, registerDamage) {
    this.duration -= dt;
    if (this.duration <= 0) return false;

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.angle += this.rotationSpeed * dt;

    // Odpočet cooldownů zásahu pro každého nepřítele (průraz)
    for (const [enemy, cd] of this.hitCooldowns.entries()) {
      if (cd <= dt) {
        this.hitCooldowns.delete(enemy);
      } else {
        this.hitCooldowns.set(enemy, cd - dt);
      }
    }

    // Kolize s nepřáteli (proráží všemi!)
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (this.hitCooldowns.has(e)) continue;

      const dist = Math.hypot(e.x - this.x, e.y - this.y);
      if (dist <= this.radius + e.radius) {
        this.hitCooldowns.set(e, 0.4); // znovu zasáhne za 0.4s
        registerDamage(e, this.damage);
        if (window.sound && window.sound.hit) window.sound.hit();
        if (window.particleSystem && window.particleSystem.spawnExplosion) {
          window.particleSystem.spawnExplosion(e.x, e.y, '#fde047', 6);
        }
      }
    }

    return true;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(this.angle);

    // Zářící svatá aura
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;

    const armW = 5;
    const armL = this.radius;

    // Zlatý kříž
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-armW / 2, -armL, armW, armL * 2);
    ctx.fillRect(-armL, -armW / 2, armL * 2, armW);

    // Vnitřní zářící jádro
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-armW / 4, -armL * 0.7, armW / 2, armL * 1.4);
    ctx.fillRect(-armL * 0.7, -armW / 4, armL * 1.4, armW / 2);

    ctx.restore();
  }
}

window.Player = Player;
window.Projectile = Projectile;
window.EnemyProjectile = EnemyProjectile;
window.Enemy = Enemy;
window.BossEnemy = BossEnemy;
window.XPGem = XPGem;
window.GoldCoin = GoldCoin;
window.Obstacle = Obstacle;
window.FirePatch = FirePatch;
window.HolyCrossProjectile = HolyCrossProjectile;
