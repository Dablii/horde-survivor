// stages.js - Konfigurace 10 unikátních středověkých fantasy stages
// Plynulá barevná progrese: od světle zelených plání přes krypty a led až po temný obsidiánový trůnní sál

const STAGE_CONFIGS = [
  {
    stage: 1,
    name: "Smaragdové Pláně Šerolesa",
    subtitle: "První vlna probuzených koster a zombií na travnatých pláních",
    durationSeconds: 45,
    bgColor: "#1e381c", // Svěží mechově zelené louky
    gridColor: "#2b4d28",
    accentColor: "#4ade80",
    theme: "plains",
    spawnRate: 1.1,
    allowedEnemies: ['zombie', 'skeleton'],
    bossType: 'ghoul_lord'
  },
  {
    stage: 2,
    name: "Zatracený Hřbitov",
    subtitle: "Mlžné náhrobky a rychlí netopýři útočící ze stínů",
    durationSeconds: 50,
    bgColor: "#212b20", // Mlžná šedozelená hřbitovní půda
    gridColor: "#2e3b2c",
    accentColor: "#86efac",
    theme: "graveyard",
    spawnRate: 1.4,
    allowedEnemies: ['zombie', 'skeleton', 'bat'],
    bossType: 'crypt_horror'
  },
  {
    stage: 3,
    name: "Krvavá Bažina",
    subtitle: "Hnilobné rašeliniště a kyselí slizové pronásledující poutníky",
    durationSeconds: 55,
    bgColor: "#1c2317", // Tmavý bahenní močál
    gridColor: "#2d3826",
    accentColor: "#a3e635",
    theme: "swamp",
    spawnRate: 1.8,
    allowedEnemies: ['zombie', 'bat', 'slime'],
    bossType: 'swamp_abomination'
  },
  {
    stage: 4,
    name: "Ruiny Prokletých",
    subtitle: "Zvětralé kamenné kvádry a obrnění kostliví rytíři",
    durationSeconds: 60,
    bgColor: "#2a2118", // Pískovcové starobylé ruiny
    gridColor: "#3d3023",
    accentColor: "#f59e0b",
    theme: "ruins",
    spawnRate: 2.1,
    allowedEnemies: ['skeleton', 'armored_knight', 'bat'],
    bossType: 'bone_colossus'
  },
  {
    stage: 5,
    name: "Katakomby Zoufalství",
    subtitle: "Vlhký kobkový kámen, střelci a rychlé přízraky",
    durationSeconds: 60,
    bgColor: "#1b1e28", // Temný žalářní břidlicový kámen
    gridColor: "#272c3b",
    accentColor: "#38bdf8",
    theme: "dungeon",
    spawnRate: 2.5,
    allowedEnemies: ['bat', 'ghost', 'armored_knight'],
    bossType: 'shadow_reaper'
  },
  {
    stage: 6,
    name: "Ledová Pustina",
    subtitle: "Mraziví ledoví běsi obkličující hrdinu ve věčném mrazu",
    durationSeconds: 65,
    bgColor: "#112232", // Zmrzlý ledovcový blankyt
    gridColor: "#1a344c",
    accentColor: "#7dd3fc",
    theme: "ice",
    spawnRate: 3.0,
    allowedEnemies: ['ice_wraith', 'armored_knight', 'ghost'],
    bossType: 'frost_titan'
  },
  {
    stage: 7,
    name: "Lávové Pukliny",
    subtitle: "Černý sopečný čedič a pekelní psi z vroucích hlubin",
    durationSeconds: 70,
    bgColor: "#291313", // Žhnoucí vulkanický čedič
    gridColor: "#451c1c",
    accentColor: "#f97316",
    theme: "lava",
    spawnRate: 3.4,
    allowedEnemies: ['hell_hound', 'ice_wraith', 'slime'],
    bossType: 'magma_golem'
  },
  {
    stage: 8,
    name: "Zapomenutá Nekropole",
    subtitle: "Ametystový kryptový mramor a masivní nekrotické hordy",
    durationSeconds: 70,
    bgColor: "#20122e", // Nekrotická fialová
    gridColor: "#361c4f",
    accentColor: "#c084fc",
    theme: "necropolis",
    spawnRate: 4.0,
    allowedEnemies: ['hell_hound', 'armored_knight', 'ghost', 'bat'],
    bossType: 'lich_king'
  },
  {
    stage: 9,
    name: "Brána do Propasti",
    subtitle: "Předposlední zkouška u temně rubínové propasti",
    durationSeconds: 75,
    bgColor: "#260d1d", // Karmínově purpurová propast
    gridColor: "#421632",
    accentColor: "#fb7185",
    theme: "abyss",
    spawnRate: 4.6,
    allowedEnemies: ['hell_hound', 'ice_wraith', 'armored_knight', 'ghost'],
    bossType: 'abyss_herald'
  },
  {
    stage: 10,
    name: "Trůn Temného Vládce",
    subtitle: "Finální střet! Hluboký obsidián s temně purpurovým zlatem",
    durationSeconds: 80,
    bgColor: "#0d0818", // Monolitický obsidián s temně fialovým odleskem
    gridColor: "#26153f",
    accentColor: "#eab308",
    theme: "throne",
    spawnRate: 5.5,
    allowedEnemies: ['hell_hound', 'ice_wraith', 'armored_knight', 'ghost', 'slime'],
    bossType: 'crimson_overlord'
  }
];

window.STAGE_CONFIGS = STAGE_CONFIGS;
