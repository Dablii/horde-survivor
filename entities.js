// entities.js - Hráč, projektily, nepřátelé, bossové, XP krystaly

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

    // Pokud je aktivní joystick, zkombinujeme nebo použijeme joystick
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

    // Stín pod hráčem
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tělo hrdiny (Karmínový lovec s pláštěm)
    // Plášť
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    const bobbing = this.moving ? Math.sin(this.walkAnimTime) * 2 : 0;
    ctx.moveTo(-10, -4 + bobbing);
    ctx.lineTo(-16, 14 + bobbing);
    ctx.lineTo(4, 14 + bobbing);
    ctx.closePath();
    ctx.fill();

    // Zbroj / Tělo
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(0, 0 + bobbing, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1d4ed8';
    ctx.stroke();

    // Hlava / Helma
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(2, -10 + bobbing, 8, 0, Math.PI * 2);
    ctx.fill();

    // Vizor / Oči
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.fillRect(4, -12 + bobbing, 5, 4);

    // Magická aura
    const gradient = ctx.createRadialGradient(0, 0, 12, 0, 0, 26);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Kreslení obíhajících čepelí (Orbitals)
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

        // Zářící čepel
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(6, 10);
        ctx.lineTo(-6, 10);
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
    this.radius = 6;
    this.life = 1.6; // sekundy trvání
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
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.splash ? '#fb923c' : '#7dd3fc';

    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Jádro střely
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
    this.life = 3.5; // sekundy trvání
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
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.color;

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

    // Výchozí vlastnosti dle typu
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
        this.color = '#15803d';
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
        this.color = '#a855f7';
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
        this.color = '#64748b';
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
        this.color = '#ef4444';
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

    // Pohyb k hráči
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Pokud střelec telegrafuje útok, zpomalí se a míří
    if (this.isShooter) {
      if (this.telegraphTimer > 0) {
        this.telegraphTimer -= dt;
        // Během telegrafování stojí nebo se pohybuje velmi pomalu
        if (this.telegraphTimer <= 0 && spawnEnemyProjectile && this.telegraphTarget) {
          // Vypustit střelu směrem k cíli
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
          // Zahájit telegrafovaný útok
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

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // 1. Vykreslení telegrafované červené zóny (indikátor zásahu)
    if (this.telegraphTimer > 0 && this.telegraphTarget) {
      const targetScreenX = this.telegraphTarget.x - camera.x;
      const targetScreenY = this.telegraphTarget.y - camera.y;
      const progress = 1 - (this.telegraphTimer / this.telegraphDuration);

      ctx.save();
      // Telegrafovaná linie k cíli
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + progress * 0.5})`;
      ctx.lineWidth = 2 + progress * 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(targetScreenX, targetScreenY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Červená cílová zóna
      ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + progress * 0.25})`;
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + progress * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetScreenX, targetScreenY, 22 * (0.6 + progress * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // Stín
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius, this.radius, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Barva (bílá při zásahu)
    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = this.color;
    }

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Jednoduché detaily očí dle typu
    ctx.fillStyle = '#fee2e2';
    ctx.beginPath();
    ctx.arc(-4, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // HP lišta pro těžší nepřátele
    if (this.hp < this.maxHp) {
      const barW = this.radius * 2;
      const barH = 4;
      const hpRatio = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = '#334155';
      ctx.fillRect(-this.radius, -this.radius - 8, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-this.radius, -this.radius - 8, barW * hpRatio, barH);
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
    this.color = '#dc2626';
    this.xpValue = 60 + stageNumber * 25;

    // Boss útoky a telegrafování
    this.attackCooldown = 3.5;
    this.telegraphTimer = 0;
    this.telegraphDuration = 1.1; // 1.1s varovná červená zóna
    this.attackMode = 'aimed_spread'; // 'aimed_spread' nebo 'ring'
    this.telegraphTarget = null;
    this.ringRadius = 140;

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
        // Provést výstřel projektilů
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

    // Bossové se pohybují pomaleji během nabíjení útoku
    const moveMult = (this.telegraphTimer > 0) ? 0.3 : 1.0;
    if (dist > 2) {
      this.x += (dx / dist) * this.speed * moveMult * dt * 60;
      this.y += (dy / dist) * this.speed * moveMult * dt * 60;
    }
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Telegrafované červené zóny bosse
    if (this.telegraphTimer > 0) {
      const progress = 1 - (this.telegraphTimer / this.telegraphDuration);

      ctx.save();
      if (this.attackMode === 'aimed_spread' && this.telegraphTarget) {
        const targetScreenX = this.telegraphTarget.x - camera.x;
        const targetScreenY = this.telegraphTarget.y - camera.y;
        const aimAngle = Math.atan2(this.telegraphTarget.y - this.y, this.telegraphTarget.x - this.x);

        // Vykreslit kužel/vějíř nebezpečné červené zóny
        ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + progress * 0.3})`;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + progress * 0.5})`;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        const arcSpread = 0.45;
        const beamLen = 320;
        ctx.arc(screenX, screenY, beamLen, aimAngle - arcSpread, aimAngle + arcSpread);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Zaměřovač na hráče
        ctx.fillStyle = `rgba(220, 38, 38, ${0.4 + progress * 0.4})`;
        ctx.beginPath();
        ctx.arc(targetScreenX, targetScreenY, 28 * (0.6 + progress * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (this.attackMode === 'ring') {
        // Rozpínající se červený kruh okolo bosse
        const ringR = 160 * progress;
        ctx.fillStyle = `rgba(249, 115, 22, ${0.1 + progress * 0.25})`;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + progress * 0.4})`;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(screenX, screenY, ringR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(screenX, screenY);

    // Temná aura
    const glow = ctx.createRadialGradient(0, 0, this.radius * 0.8, 0, 0, this.radius * 1.6);
    glow.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
    glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Tělo bosse
    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    // Rohy / Koruna
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-16, -this.radius);
    ctx.lineTo(-24, -this.radius - 16);
    ctx.lineTo(-8, -this.radius - 4);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, -this.radius);
    ctx.lineTo(24, -this.radius - 16);
    ctx.lineTo(8, -this.radius - 4);
    ctx.fill();

    // Velká HP lišta bosse
    const barW = 80;
    const barH = 8;
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-barW / 2, -this.radius - 24, barW, barH);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-barW / 2, -this.radius - 24, barW * hpRatio, barH);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, -this.radius - 24, barW, barH);

    // Jméno bosse
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 13px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(`👑 ${this.name}`, 0, -this.radius - 28);

    ctx.restore();
  }
}

class XPGem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 6;
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
      return true; // Sebráno
    }
    return false;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Kosočtverec XP drahokamu
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(0, this.radius);
    ctx.lineTo(-this.radius, 0);
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
    this.radius = 7;
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
      return true; // Sebráno
    }
    return false;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Zlatá záře
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Vnitřní lem mince
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Znak $ / mince uvnitř
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 9px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);

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
