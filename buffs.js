// buffs.js - System pro správu vylepšení a karet při level-upu

const BUFF_DEFINITIONS = [
  {
    id: 'movespeed',
    name: 'Bleskový Krok',
    iconKey: 'boots',
    get icon() { return window.getSvg ? window.getSvg('boots') : ''; },
    tier: 'Pohyblivost',
    rarity: 'common',
    description: 'Zvyšuje rychlost pohybu o +20%. Snadnější únik před monstry.',
    maxLevel: 5,
    apply: (player) => {
      player.speedMult += 0.20;
    }
  },
  {
    id: 'firerate',
    name: 'Rychlopalba',
    iconKey: 'lightning',
    get icon() { return window.getSvg ? window.getSvg('lightning') : ''; },
    tier: 'Rychlost útoku',
    rarity: 'rare',
    description: 'Zkracuje interval mezi střelami o 18%. Střílíš znatelně častěji.',
    maxLevel: 5,
    apply: (player) => {
      player.fireRateMult *= 0.82;
    }
  },
  {
    id: 'range',
    name: 'Dalekonosný Pohled',
    iconKey: 'bow',
    get icon() { return window.getSvg ? window.getSvg('bow') : ''; },
    tier: 'Dostřel',
    rarity: 'common',
    description: 'Zvyšuje dosah střelby a detekce nepřátel o +30%.',
    maxLevel: 5,
    apply: (player) => {
      player.rangeMult += 0.30;
    }
  },
  {
    id: 'multishot',
    name: 'Rozptyl Střel',
    iconKey: 'bow',
    get icon() { return window.getSvg ? window.getSvg('bow') : ''; },
    tier: 'Projektily',
    rarity: 'epic',
    description: 'Přidává +1 dodatečný projektil k hlavní salvě.',
    maxLevel: 4,
    apply: (player) => {
      player.extraProjectiles += 1;
    }
  },
  {
    id: 'damage',
    name: 'Krvavé Ostří',
    iconKey: 'sword',
    get icon() { return window.getSvg ? window.getSvg('sword') : ''; },
    tier: 'Poškození',
    rarity: 'common',
    description: 'Zvyšuje veškeré poškození zbraní o +25%.',
    maxLevel: 5,
    apply: (player) => {
      player.damageMult += 0.25;
    }
  },
  {
    id: 'splash',
    name: 'Výbušná Munice',
    iconKey: 'explosion',
    get icon() { return window.getSvg ? window.getSvg('explosion') : ''; },
    tier: 'Plošné poškození',
    rarity: 'epic',
    description: 'Projektily po zásahu explodují s plošným zraněním (+40px rádius).',
    maxLevel: 3,
    apply: (player) => {
      player.splashRadius += 40;
      player.hasSplash = true;
    }
  },
  {
    id: 'pierce',
    name: 'Průrazné Střely',
    iconKey: 'sword',
    get icon() { return window.getSvg ? window.getSvg('sword') : ''; },
    tier: 'Penetrace',
    rarity: 'rare',
    description: 'Projektily proletí skrze +1 dalšího nepřítele.',
    maxLevel: 4,
    apply: (player) => {
      player.pierceCount += 1;
    }
  },
  {
    id: 'orbiter',
    name: 'Rotující Čepele',
    iconKey: 'orbit',
    get icon() { return window.getSvg ? window.getSvg('orbit') : ''; },
    tier: 'Obranná zbraň',
    rarity: 'legendary',
    description: 'Aura létajících magických čepelí kolem tebe sekající nepřátele.',
    maxLevel: 4,
    apply: (player) => {
      player.orbitalsCount += 1;
      player.hasOrbitals = true;
    }
  },
  {
    id: 'lightning',
    name: 'Řetězový Blesk',
    iconKey: 'lightning',
    get icon() { return window.getSvg ? window.getSvg('lightning') : ''; },
    tier: 'Magický útok',
    rarity: 'epic',
    description: 'Pravidelně sešle blesk do náhodného nepřítele, který přeskočí na další.',
    maxLevel: 3,
    apply: (player) => {
      player.hasLightning = true;
      player.lightningChain += 2;
    }
  },
  {
    id: 'magnet',
    name: 'Magnet na Duše',
    iconKey: 'magnet',
    get icon() { return window.getSvg ? window.getSvg('magnet') : ''; },
    tier: 'Užitek',
    rarity: 'common',
    description: 'Zvyšuje dosah sběru XP drahokamů o +50%.',
    maxLevel: 4,
    apply: (player) => {
      player.magnetRangeMult += 0.50;
    }
  },
  {
    id: 'regen',
    name: 'Regenerace Života',
    iconKey: 'potion',
    get icon() { return window.getSvg ? window.getSvg('potion') : ''; },
    tier: 'Přežití',
    rarity: 'rare',
    description: 'Obnovuje +1.5 HP za sekundu a okamžitě vyléčí 30 HP.',
    maxLevel: 4,
    apply: (player) => {
      player.hpRegen += 1.5;
      player.heal(30);
    }
  },
  {
    id: 'maxhp',
    name: 'Železná Vůle',
    iconKey: 'shield',
    get icon() { return window.getSvg ? window.getSvg('shield') : ''; },
    tier: 'Maximální HP',
    rarity: 'common',
    description: 'Zvyšuje maximální životy o +30 a plně tě vyléčí na tuto hodnotu.',
    maxLevel: 5,
    apply: (player) => {
      player.maxHp += 30;
      player.hp = Math.min(player.maxHp, player.hp + 30);
    }
  }
];

class BuffManager {
  constructor() {
    this.activeBuffLevels = {};
  }

  reset() {
    this.activeBuffLevels = {};
  }

  getLevel(buffId) {
    return this.activeBuffLevels[buffId] || 0;
  }

  // Vybere 3 náhodné buffy, které ještě nedosáhly maxLevel
  getRandomSelection(count = 3) {
    const available = BUFF_DEFINITIONS.filter(b => {
      const curLvl = this.getLevel(b.id);
      return curLvl < b.maxLevel;
    });

    if (available.length === 0) {
      // Pokud už jsou všechny na maxu, nabídneme instant heal a bonus damage
      return [
        {
          id: 'bonus_heal',
          name: 'Lektvar Obnovy',
          iconKey: 'potion',
          get icon() { return window.getSvg ? window.getSvg('potion') : ''; },
          tier: 'Okamžitý efekt',
          rarity: 'rare',
          description: 'Obnoví 50 HP tvému hrdinovi.',
          maxLevel: 99,
          apply: (player) => player.heal(50)
        },
        {
          id: 'bonus_overcharge',
          name: 'Přetížení Zbraní',
          iconKey: 'sword',
          get icon() { return window.getSvg ? window.getSvg('sword') : ''; },
          tier: 'Permanentní posílení',
          rarity: 'epic',
          description: 'Trvale zvýší poškození o dalších +15%.',
          maxLevel: 99,
          apply: (player) => player.damageMult += 0.15
        }
      ];
    }

    // Zamíchat
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  applyBuff(buffId, player) {
    const buff = BUFF_DEFINITIONS.find(b => b.id === buffId) || {
      id: buffId,
      apply: (p) => {}
    };
    this.activeBuffLevels[buffId] = (this.activeBuffLevels[buffId] || 0) + 1;
    buff.apply(player);
  }
}

window.BUFF_DEFINITIONS = BUFF_DEFINITIONS;
window.buffManager = new BuffManager();
