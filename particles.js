// particles.js - Systém pro vizuální efekty, čísla poškození (damage numbers) a exploze

class Particle {
  constructor(x, y, vx, vy, color, size, life, isBlood = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.isBlood = isBlood;
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.life -= dt;
    if (this.isBlood) {
      this.vx *= 0.95;
      this.vy *= 0.95;
    }
    return this.life > 0;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    const alpha = Math.max(0, this.life / this.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, Math.max(1, this.size * (this.life / this.maxLife)), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class DamageNumber {
  constructor(x, y, text, color = '#f87171', isCrit = false) {
    this.x = x + (Math.random() * 20 - 10);
    this.y = y - 10;
    this.text = text;
    this.color = color;
    this.isCrit = isCrit;
    this.vy = isCrit ? -1.8 : -1.2;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.life = 0.8; // sekundy
    this.maxLife = 0.8;
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
    const alpha = Math.max(0, this.life / this.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = this.isCrit ? 'bold 20px Rajdhani' : 'bold 15px Rajdhani';
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, screenX, screenY);
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageNumbers = [];
  }

  reset() {
    this.particles = [];
    this.damageNumbers = [];
  }

  spawnExplosion(x, y, color = '#f97316', count = 22) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 4 + 2;
      const life = Math.random() * 0.4 + 0.2;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life));
    }
  }

  spawnBlood(x, y, color = '#ef4444', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 0.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 3 + 1.5;
      const life = Math.random() * 0.5 + 0.2;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, true));
    }
  }

  spawnXPGemSparkle(x, y) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5;
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#38bdf8', 2.5, 0.3));
    }
  }

  addDamageNumber(x, y, text, color = '#f87171', isCrit = false) {
    this.damageNumbers.push(new DamageNumber(x, y, text, color, isCrit));
  }

  update(dt) {
    this.particles = this.particles.filter(p => p.update(dt));
    this.damageNumbers = this.damageNumbers.filter(d => d.update(dt));
  }

  draw(ctx, camera) {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(ctx, camera);
    }
    for (let i = 0; i < this.damageNumbers.length; i++) {
      this.damageNumbers[i].draw(ctx, camera);
    }
  }
}

window.particleSystem = new ParticleSystem();
