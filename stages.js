// stages.js - Konfigurace 10 unikátních středověkých fantasy stages
// Plynulá barevná progrese a rebalancovaná lineární křivka obtížnosti (Stage 10 jako vrchol výzvy)

const STAGE_CONFIGS = [
  {
    stage: 1,
    name: "Smaragdové Pláně Šerolesa",
    subtitle: "První vlna probuzených koster a zombií na travnatých pláních",
    durationSeconds: 40,
    bgColor: "#1e381c", // Svěží mechově zelené louky
    gridColor: "#2b4d28",
    accentColor: "#4ade80",
    theme: "plains",
    spawnRate: 1.0,
    allowedEnemies: ['zombie', 'skeleton'],
    bossType: 'ghoul_lord',
    obstacles: {
      types: ['tree', 'rock', 'stump', 'water'],
      count: 28
    }
  },
  {
    stage: 2,
    name: "Zatracený Hřbitov",
    subtitle: "Mlžné náhrobky a rychlí netopýři útočící ze stínů",
    durationSeconds: 45,
    bgColor: "#212b20", // Mlžná šedozelená hřbitovní půda
    gridColor: "#2e3b2c",
    accentColor: "#86efac",
    theme: "graveyard",
    spawnRate: 1.3,
    allowedEnemies: ['zombie', 'skeleton', 'bat'],
    bossType: 'crypt_horror',
    obstacles: {
      types: ['dead_tree', 'rock', 'stump', 'water'],
      count: 30
    }
  },
  {
    stage: 3,
    name: "Krvavá Bažina",
    subtitle: "Hnilobné rašeliniště a kyselí slizové pronásledující poutníky",
    durationSeconds: 50,
    bgColor: "#1c2317", // Tmavý bahenní močál
    gridColor: "#2d3826",
    accentColor: "#a3e635",
    theme: "swamp",
    spawnRate: 1.6,
    allowedEnemies: ['zombie', 'bat', 'slime'],
    bossType: 'swamp_abomination',
    obstacles: {
      types: ['water', 'dead_tree', 'stump', 'rock'],
      count: 32
    }
  },
  {
    stage: 4,
    name: "Ruiny Prokletých",
    subtitle: "Zvětralé kamenné kvádry a obrnění kostliví rytíři",
    durationSeconds: 50,
    bgColor: "#2a2118", // Pískovcové starobylé ruiny
    gridColor: "#3d3023",
    accentColor: "#f59e0b",
    theme: "ruins",
    spawnRate: 2.0,
    allowedEnemies: ['skeleton', 'armored_knight', 'bat'],
    bossType: 'bone_colossus',
    obstacles: {
      types: ['pillar', 'rock', 'stump'],
      count: 32
    }
  },
  {
    stage: 5,
    name: "Katakomby Zoufalství",
    subtitle: "Vlhký kobkový kámen, střelci a rychlé přízraky",
    durationSeconds: 55,
    bgColor: "#1b1e28", // Temný žalářní břidlicový kámen
    gridColor: "#272c3b",
    accentColor: "#38bdf8",
    theme: "dungeon",
    spawnRate: 2.4,
    allowedEnemies: ['bat', 'ghost', 'armored_knight'],
    bossType: 'shadow_reaper',
    obstacles: {
      types: ['pillar', 'rock', 'water'],
      count: 34
    }
  },
  {
    stage: 6,
    name: "Ledová Pustina",
    subtitle: "Mraziví ledoví běsi obkličující hrdinu ve věčném mrazu",
    durationSeconds: 55,
    bgColor: "#112232", // Zmrzlý ledovcový blankyt
    gridColor: "#1a344c",
    accentColor: "#7dd3fc",
    theme: "ice",
    spawnRate: 2.8,
    allowedEnemies: ['ice_wraith', 'armored_knight', 'ghost'],
    bossType: 'frost_titan',
    obstacles: {
      types: ['ice_boulder', 'rock', 'water'],
      count: 34
    }
  },
  {
    stage: 7,
    name: "Lávové Pukliny",
    subtitle: "Černý sopečný čedič a pekelní psi z vroucích hlubin",
    durationSeconds: 60,
    bgColor: "#291313", // Žhnoucí vulkanický čedič
    gridColor: "#451c1c",
    accentColor: "#f97316",
    theme: "lava",
    spawnRate: 3.3,
    allowedEnemies: ['hell_hound', 'slime', 'ghost'],
    bossType: 'magma_golem',
    obstacles: {
      types: ['magma_pool', 'rock', 'dead_tree'],
      count: 36
    }
  },
  {
    stage: 8,
    name: "Zapomenutá Nekropole",
    subtitle: "Ametystový kryptový mramor a masivní nekrotické hordy",
    durationSeconds: 65,
    bgColor: "#20122e", // Nekrotická fialová
    gridColor: "#361c4f",
    accentColor: "#c084fc",
    theme: "necropolis",
    spawnRate: 3.9,
    allowedEnemies: ['hell_hound', 'armored_knight', 'ghost', 'ice_wraith'],
    bossType: 'lich_king',
    obstacles: {
      types: ['pillar', 'rock', 'water'],
      count: 36
    }
  },
  {
    stage: 9,
    name: "Brána do Propasti",
    subtitle: "Předposlední zkouška u temně rubínové propasti",
    durationSeconds: 70,
    bgColor: "#260d1d", // Karmínově purpurová propast
    gridColor: "#421632",
    accentColor: "#fb7185",
    theme: "abyss",
    spawnRate: 4.6,
    allowedEnemies: ['hell_hound', 'ice_wraith', 'armored_knight', 'ghost'],
    bossType: 'abyss_herald',
    obstacles: {
      types: ['pillar', 'rock', 'magma_pool'],
      count: 38
    }
  },
  {
    stage: 10,
    name: "Trůn Temného Vládce",
    subtitle: "Finální střet! Hluboký obsidián s temně purpurovým zlatem",
    durationSeconds: 75,
    bgColor: "#0d0818", // Monolitický obsidián s temně fialovým odleskem
    gridColor: "#26153f",
    accentColor: "#eab308",
    theme: "throne",
    spawnRate: 5.6,
    allowedEnemies: ['hell_hound', 'ice_wraith', 'armored_knight', 'ghost', 'slime'],
    bossType: 'crimson_overlord',
    obstacles: {
      types: ['pillar', 'rock', 'magma_pool'],
      count: 40
    }
  }
];

window.STAGE_CONFIGS = STAGE_CONFIGS;
