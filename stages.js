// stages.js - Konfigurace 10 unikátních stages
// Každá stage trvá určitý čas (např. 60 sekund) nebo po poražení bosse

const STAGE_CONFIGS = [
  {
    stage: 1,
    name: "Les Nemrtvých",
    subtitle: "První vlna probuzených koster a zombií",
    durationSeconds: 45, // 45 sekund na zónu
    bgColor: "#09120e",
    gridColor: "#142820",
    spawnRate: 1.1, // nepřátel za sekundu
    allowedEnemies: ['zombie', 'skeleton'],
    bossType: 'ghoul_lord'
  },
  {
    stage: 2,
    name: "Zatracený Hřbitov",
    subtitle: "Rychlejší ghúlové a netopýři útočí ze stínů",
    durationSeconds: 50,
    bgColor: "#130f1d",
    gridColor: "#221a36",
    spawnRate: 1.4,
    allowedEnemies: ['zombie', 'skeleton', 'bat'],
    bossType: 'crypt_horror'
  },
  {
    stage: 3,
    name: "Krvavá Bažina",
    subtitle: "Otravní slizové se dělí a pronásledují tě",
    durationSeconds: 55,
    bgColor: "#0d1b11",
    gridColor: "#173421",
    spawnRate: 1.8,
    allowedEnemies: ['zombie', 'bat', 'slime'],
    bossType: 'swamp_abomination'
  },
  {
    stage: 4,
    name: "Ruiny Prokletých",
    subtitle: "Obrnění kostliví rytíři s vyšší odolností",
    durationSeconds: 60,
    bgColor: "#1c1410",
    gridColor: "#32231c",
    spawnRate: 2.1,
    allowedEnemies: ['skeleton', 'armored_knight', 'bat'],
    bossType: 'bone_colossus'
  },
  {
    stage: 5,
    name: "Katakomby Zoufalství",
    subtitle: "Střelci a rychlé přízraky se shlukují",
    durationSeconds: 60,
    bgColor: "#121422",
    gridColor: "#1e223d",
    spawnRate: 2.5,
    allowedEnemies: ['bat', 'ghost', 'armored_knight'],
    bossType: 'shadow_reaper'
  },
  {
    stage: 6,
    name: "Ledová Pustina",
    subtitle: "Mraziví démoni a rychlí běsi tě zkoušejí obklíčit",
    durationSeconds: 65,
    bgColor: "#0a1826",
    gridColor: "#132d47",
    spawnRate: 3.0,
    allowedEnemies: ['ice_wraith', 'armored_knight', 'ghost'],
    bossType: 'frost_titan'
  },
  {
    stage: 7,
    name: "Lávové Pukliny",
    subtitle: "Ohniví chrliči a pekelní psi z hlubin země",
    durationSeconds: 70,
    bgColor: "#230e0e",
    gridColor: "#3e1818",
    spawnRate: 3.4,
    allowedEnemies: ['hell_hound', 'ice_wraith', 'slime'],
    bossType: 'magma_golem'
  },
  {
    stage: 8,
    name: "Zapomenutá Nekropole",
    subtitle: "Masivní hordy útočí ze všech čtyř stran naráz",
    durationSeconds: 70,
    bgColor: "#170f24",
    gridColor: "#2c1c45",
    spawnRate: 4.0,
    allowedEnemies: ['hell_hound', 'armored_knight', 'ghost', 'bat'],
    bossType: 'lich_king'
  },
  {
    stage: 9,
    name: "Brána do Propasti",
    subtitle: "Předposlední zkouška! Elitní jednotky démonů",
    durationSeconds: 75,
    bgColor: "#1f0d1a",
    gridColor: "#3a1932",
    spawnRate: 4.6,
    allowedEnemies: ['hell_hound', 'ice_wraith', 'armored_knight', 'ghost'],
    bossType: 'abyss_herald'
  },
  {
    stage: 10,
    name: "Trůn Temného Vládce",
    subtitle: "Finální střet! Nekonečné legie a finální vládce nicoty",
    durationSeconds: 80,
    bgColor: "#07070b",
    gridColor: "#1d1b28",
    spawnRate: 5.5,
    allowedEnemies: ['hell_hound', 'ice_wraith', 'armored_knight', 'ghost', 'slime'],
    bossType: 'crimson_overlord'
  }
];

window.STAGE_CONFIGS = STAGE_CONFIGS;
