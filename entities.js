// entities.js - Hráč, projektily, nepřátelé, bossové, XP krystaly, zlaté mince
// Kompletní 2D top-down středověký fantasy vizuál

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.baseSpeed = 3.2;
    this.speedMult = 1.0;

    // Zdraví
    this.maxHp = 100;
    this.hp = 100;
    this.hpRegen = 0; // za sekundu

    // Útočné staty
    this.fireCooldown = 0;
    this.baseFireInterval = 0.55; // sekundy mezi střelami
    this.fireRateMult = 1.0;
    this.baseDamage = 25;
    this.damageMult = 1.0;
    this.baseRange = 320;
    this.rangeMult = 1.0;
    this.extraProjectiles = 0;
    this.pierceCount = 0;
    this.hasSplash = false;
    this.splashRadius = 0;

    // Meta-progrese bonusy
    this.xpMult = 1.0;

    // Orbiting blades
    this.hasOrbitals = false;
    this.orbitalsCount = 0;
    this.orbitalAngle = 0;

    // Lightning
    this.hasLightning = false;
    this.lightningCooldown = 0;
    this.lightningChain = 0;

    // XP a Magnet
    this.magnetBaseRange = 75;
    this.magnetRangeMult = 1.0;
    this.xp = 0;
    this.xpToNextLevel = 10;
    this.level = 1;

    // Animace & stav
    this.facing = 1; // 1 doprava, -1 doleva
    this.moving = false;
    this.invulnTimer = 0;
    this.walkAnimTime = 0;
  }

  get speed() {
    return this.baseSpeed * this.speedMult;
  }

  get fireInterval() {
    return Math.max(0.08, this.baseFireInterval * this.fireRateMult);
  }

  get damage() {
    return Math.round(this.baseDamage * this.damageMult);
  }

  get range() {
    return this.baseRange * this.rangeMult;
  }

  get magnetRange() {
    return this.magnetBaseRange * this.magnetRangeMult;
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
  }

  // 2D Top-Down středověký hrdina: Zelená tunika, kožený opasek, meč a rytířský štít
  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Blikání při nezranitelnosti
    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 20) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.scale(this.facing, 1);

    const bob = this.moving ? Math.sin(this.walkAnimTime) * 2.2 : 0;
    const legSwing = this.moving ? Math.sin(this.walkAnimTime) * 5 : 0;

    // 1. Měkký stín hrdiny
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 17, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Kožené boty / nohy
    ctx.fillStyle = '#451a03';
    // Levá noha
    ctx.fillRect(-8, 8 + legSwing, 6, 8);
    // Pravá noha
    ctx.fillRect(2, 8 - legSwing, 6, 8);

    // 3. Vlající plášť za zády (Tmavě lesní zeleň s karmínovou podšívkou)
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

    // 4. Tělo - Zelená dobrodruhova tunika / kazajka
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, 0 + bob, 13, 0, Math.PI * 2);
    ctx.fill();

    // Zlaté lemování tuniky
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Kožený pásek s mosaznou sponou
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-12, 1 + bob, 24, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-3, 0 + bob, 6, 6);

    // Ocelové nárameníky (Pauldrons)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(-8, -4 + bob, 5, 0, Math.PI * 2);
    ctx.arc(8, -4 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Hlava & Rytířská přilbice (Bascinet s chocholem)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, -9 + bob, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Zlatý průzor helmy
    ctx.fillStyle = '#d97706';
    ctx.fillRect(1, -11 + bob, 6, 3);
    ctx.fillStyle = '#38bdf8'; // Světlo očí / vizoru
    ctx.fillRect(3, -11 + bob, 3, 2);

    // Péřový chochol (Červeno-zlatý)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-2, -16 + bob);
    ctx.lineTo(-8, -21 + bob);
    ctx.lineTo(1, -17 + bob);
    ctx.fill();

    // 6. Rytířský štít (Heater Shield na levé ruce)
    ctx.save();
    ctx.translate(-11, 2 + bob);
    // Tvar klasického středověkého štítu
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(5, -10);
    ctx.lineTo(5, 4);
    ctx.lineTo(0, 11);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();

    // Zlatý heraldický lem štítu
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Zlatý heraldický kříž uprostřed štítu
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-1.5, -7, 3, 14);
    ctx.fillRect(-4, -4, 8, 3);
    ctx.restore();

    // 7. Ocelový meč (V pravé ruce směřující vpřed)
    ctx.save();
    ctx.translate(11, 2 + bob);
    ctx.rotate(0.3 + (this.moving ? Math.sin(this.walkAnimTime * 2) * 0.15 : 0));

    // Jílec & Hruška
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-1.5, 8, 3, 5); // rukojeť
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 13, 2.5, 0, Math.PI * 2); // pommel
    ctx.fill();

    // Záštita meče
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-6, 6, 12, 2.5);

    // Čepel (Leštěná ocel se stříbrným ostřím)
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

    // Středové žebro čepele
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(0, -15);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // 8. Rotující magické čepele (Orbitals)
    if (this.hasOrbitals && this.orbitalsCount > 0) {
      const radius = 65;
      const count = this.orbitalsCount;
      for (let i = 0; i < count; i++) {
        const angle = this.orbitalAngle + (i * (Math.PI * 2 / count));
        const ox = screenX + Math.cos(angle) * radius;
        const oy = screenY + Math.sin(angle) * radius;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(angle + Math.PI / 2);

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
        this.hp = 70;
        this.speed = 3.4;
        this.damage = 22;
        this.color = '#dc2626';
        this.xpValue = 8;
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
    this.telegraphDuration = 1.1; // 1.1s varovná zóna
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
        if (this.attackMode === 'aimed_spread' && this.telegraphTarget) {
          const aimAngle = Math.atan2(this.telegraphTarget.y - this.y, this.telegraphTarget.x - this.x);
          const shots = 5;
          const spread = 0.35;
          const projSpeed = 6.2;
          const projDmg = Math.round(this.damage * 0.85);

          for (let i = 0; i < shots; i++) {
            const angle = aimAngle + (i - (shots - 1) / 2) * spread;
            const vx = Math.cos(angle) * projSpeed;
            const vy = Math.sin(angle) * projSpeed;
            spawnEnemyProjectile(new EnemyProjectile(this.x, this.y, vx, vy, projDmg, 9, '#ef4444'));
          }
          if (window.sound && window.sound.enemyShoot) window.sound.enemyShoot();
        } else if (this.attackMode === 'ring') {
          const count = 10;
          const projSpeed = 5.0;
          const projDmg = Math.round(this.damage * 0.75);

          for (let i = 0; i < count; i++) {
            const angle = (i * Math.PI * 2) / count;
            const vx = Math.cos(angle) * projSpeed;
            const vy = Math.sin(angle) * projSpeed;
            spawnEnemyProjectile(new EnemyProjectile(this.x, this.y, vx, vy, projDmg, 8, '#f97316'));
          }
          if (window.sound && window.sound.enemyShoot) window.sound.enemyShoot();
        }
        this.telegraphTarget = null;
      }
    } else {
      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 3.8 + Math.random() * 1.5;
        this.telegraphTimer = this.telegraphDuration;
        this.attackMode = Math.random() < 0.6 ? 'aimed_spread' : 'ring';
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

    // 1. ZÁŘÍCÍ RUNOVÉ TELEGRAFOVÁNÍ ÚTOKU (Vysoký kontrast proti tmě i trávě)
    if (this.telegraphTimer > 0) {
      const progress = 1 - (this.telegraphTimer / this.telegraphDuration);

      ctx.save();
      if (this.attackMode === 'aimed_spread' && this.telegraphTarget) {
        const targetScreenX = this.telegraphTarget.x - camera.x;
        const targetScreenY = this.telegraphTarget.y - camera.y;
        const aimAngle = Math.atan2(this.telegraphTarget.y - this.y, this.telegraphTarget.x - this.x);

        // Zářící rudý kužel zkázy
        ctx.fillStyle = `rgba(239, 68, 68, ${0.25 + progress * 0.45})`;
        ctx.strokeStyle = `rgba(255, 30, 30, ${0.8 + progress * 0.2})`;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        const arcSpread = 0.48;
        const beamLen = 340;
        ctx.arc(screenX, screenY, beamLen, aimAngle - arcSpread, aimAngle + arcSpread);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Zaměřovací terč na hráče s pulzujícími runami
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
        const ringR = 170 * progress;
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
    this.radius = 6.5;
    this.color = value > 5 ? '#a855f7' : (value > 2 ? '#38bdf8' : '#34d399');
    this.sparkleTimer = Math.random();
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

window.Player = Player;
window.Projectile = Projectile;
window.EnemyProjectile = EnemyProjectile;
window.Enemy = Enemy;
window.BossEnemy = BossEnemy;
window.XPGem = XPGem;
window.GoldCoin = GoldCoin;
