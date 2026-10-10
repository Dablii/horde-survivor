// icons.js - Čisté, minimalistické středověké fantasy SVG vektorové ikony
// Vysoce kontrastní, jednoduché siluety optimalizované pro UI rámečky a karty

const SVG_ICONS = {
  // Srdce / Život (Crimson Heart se zlatým obrysem)
  heart: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-heart" aria-hidden="true">
    <path d="M12 21C2 14 3 5 8 5c2 0 3 1.5 4 3 1-1.5 2-3 4-3 5 0 6 9-4 16Z" fill="#C0392B" stroke="#D4AF37" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M8 7c-1.5 0-2.5 1-2.5 2.5" stroke="#FFF" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
  </svg>`,

  // Lebka / Zabití (Pergamenová lebka s tmavými očnicemi)
  skull: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-skull" aria-hidden="true">
    <path d="M12 3C7 3 4 6.5 4 11c0 2.5 1 4 3 5v3h10v-3c2-1 3-2.5 3-5 0-4.5-3-8-8-8Z" fill="#F1E4C3" stroke="#2A1608" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="9" cy="11.5" r="2" fill="#2A1608"/>
    <circle cx="15" cy="11.5" r="2" fill="#2A1608"/>
    <path d="M10 16.5v2.5M12 16.5v2.5M14 16.5v2.5" stroke="#2A1608" stroke-width="1.2"/>
  </svg>`,

  // Zlatá mince - sjednocený vizuál napříč celou hrou
  coin: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-coin" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#D4AF37" stroke="#4A3408" stroke-width="1.6"/>
    <circle cx="12" cy="12" r="7" fill="none" stroke="#8A6A14" stroke-width="1.1"/>
    <path d="M12 6.5 L16 12 L12 17.5 L8 12 Z" fill="#F1E4C3" stroke="#8A6A14" stroke-width="0.9"/>
  </svg>`,

  // Drahokam / XP Gem (Čistý fazetovaný azurový krystal)
  gem: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-gem" aria-hidden="true">
    <path d="M12 2l8 7-8 13L4 9Z" fill="#00E5FF" stroke="#07505A" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M4 9h16" stroke="#07505A" stroke-width="1.2"/>
    <path d="M8 6l2-1" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
  </svg>`,

  // Hodiny / Časovač (Zlaté kapesní hodiny)
  hourglass: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-clock" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="#2C3531" stroke="#D4AF37" stroke-width="2"/>
    <path d="M12 6v6l4 2" stroke="#F1E4C3" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`,

  // Meč / Poškození (Čistý obouruční meč)
  sword: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-sword" aria-hidden="true">
    <path d="M12 2l2 2.5v9.5h-4V4.5z" fill="#DFE6E9" stroke="#2A1608" stroke-width="1.3"/>
    <path d="M12 2v12" stroke="#B0BEC5" stroke-width="0.9"/>
    <rect x="7" y="14" width="10" height="2.5" rx="1" fill="#D4AF37" stroke="#2A1608" stroke-width="1"/>
    <rect x="11" y="16.5" width="2" height="4.5" fill="#8A5A2B"/>
    <circle cx="12" cy="22" r="1.5" fill="#D4AF37" stroke="#2A1608" stroke-width="0.8"/>
  </svg>`,

  // Štít / Max HP (Klasický rytířský štít)
  shield: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-shield" aria-hidden="true">
    <path d="M12 2L4 5.5v6c0 5.5 3.5 9.8 8 11.5 4.5-1.7 8-6 8-11.5v-6L12 2z" fill="#3E2723" stroke="#D4AF37" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M12 4.5v16c3.6-1.5 6.2-5 6.2-9.5V7.2L12 4.5z" fill="#D4AF37" opacity="0.35"/>
    <path d="M12 7v8M8.5 11h7" stroke="#F1E4C3" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // Boty / Rychlost (Křídlatá bota)
  boots: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-boots" aria-hidden="true">
    <path d="M4 14l5-2 3-8h5v5l-4 4v3l5 1v3H4z" fill="#2ECC71" stroke="#0F5132" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M14 4l6-2v4zM12 8l6-2v4z" fill="#FFF1B0" stroke="#0F5132" stroke-width="0.9"/>
  </svg>`,

  // Luk a zaměřovač / Dostřel
  bow: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-bow" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="#2C3531" stroke="#D4AF37" stroke-width="1.6"/>
    <circle cx="12" cy="12" r="5.5" fill="none" stroke="#C0392B" stroke-width="1.4"/>
    <circle cx="12" cy="12" r="2.2" fill="#F1E4C3"/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#D4AF37" stroke-width="1.3"/>
  </svg>`,

  // Rozptyl střel / Multishot (Tři vějířovité šípy)
  multishot: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-multishot" aria-hidden="true">
    <path d="M12 2l3 4.5h-2v11h-2v-11H9z" fill="#00E5FF" stroke="#07505A" stroke-width="1"/>
    <path d="M4.5 7l2.5 4.5-1.5 1 5.5 6-1.5 1.2-5.5-6-1.5 1z" fill="#00E5FF" stroke="#07505A" stroke-width="0.8" opacity="0.9"/>
    <path d="M19.5 7l-2.5 4.5 1.5 1-5.5 6 1.5 1.2 5.5-6 1.5 1z" fill="#00E5FF" stroke="#07505A" stroke-width="0.8" opacity="0.9"/>
  </svg>`,

  // Blesk / Rychlost útoku
  lightning: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-lightning" aria-hidden="true">
    <path d="M13 2L4.5 13h5.5l-2 9 11.5-12h-6l4-8z" fill="#FACC15" stroke="#713F12" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>`,

  // Exploze / Splash
  explosion: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-explosion" aria-hidden="true">
    <path d="M12 2l2.6 6 6.4.5-5 4.4 1.6 6.3-5.6-3.4-5.6 3.4 1.6-6.3-5-4.4 6.4-.5z" fill="#F97316" stroke="#7C2D12" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="3.5" fill="#FEF08A"/>
  </svg>`,

  // Průraz / Pierce
  pierce: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-pierce" aria-hidden="true">
    <path d="M21 3l-8 2 2.5 2.5-12 12 1.5 1.5 12-12 2.5 2.5z" fill="#DFE6E9" stroke="#1E293B" stroke-width="1.3"/>
    <circle cx="14" cy="10" r="4.5" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="3 2"/>
  </svg>`,

  // Orbitující čepele
  orbit: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-orbit" aria-hidden="true">
    <circle cx="12" cy="12" r="3" fill="#FFF" stroke="#00E5FF" stroke-width="1.2"/>
    <path d="M12 3a9 9 0 0 1 7.8 4.5l-3 1.2A6 6 0 0 0 12 6zM21 12a9 9 0 0 1-4.5 7.8l-1.2-3A6 6 0 0 0 18 12zM3 12a9 9 0 0 1 4.5-7.8l1.2 3A6 6 0 0 0 6 12z" fill="#00E5FF" stroke="#07505A" stroke-width="0.8"/>
  </svg>`,

  // Magnet na duše
  magnet: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-magnet" aria-hidden="true">
    <path d="M5 4v7a7 7 0 0 0 14 0V4h-4v7a3 3 0 0 1-6 0V4H5z" fill="#E11D48" stroke="#881337" stroke-width="1.4"/>
    <rect x="5" y="4" width="4" height="3.5" fill="#DFE6E9" stroke="#881337" stroke-width="1"/>
    <rect x="15" y="4" width="4" height="3.5" fill="#DFE6E9" stroke="#881337" stroke-width="1"/>
  </svg>`,

  // Lektvar / Léčení
  potion: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-potion" aria-hidden="true">
    <path d="M10 2h4v2h-4z" fill="#D4AF37" stroke="#4A3408" stroke-width="0.9"/>
    <path d="M11 4h2v3l4.5 7.5a4 4 0 0 1-3.5 5.5h-8a4 4 0 0 1-3.5-5.5L7 7V4h4z" fill="#2C3531" stroke="#D4AF37" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M6 14.5l2-3.5h8l2 3.5a4 4 0 0 1-3.5 5.5h-5a4 4 0 0 1-3.5-5.5z" fill="#EC4899"/>
    <circle cx="10" cy="16" r="1.2" fill="#FFF" opacity="0.8"/>
  </svg>`,

  // Kniha / XP Grimoire
  book: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-book" aria-hidden="true">
    <path d="M3 5.5C5.5 4 8.5 4 12 5.5c3.5-1.5 6.5-1.5 9 0v13c-2.5-1.5-5.5-1.5-9 0-3.5-1.5-6.5-1.5-9 0v-13z" fill="#F1E4C3" stroke="#3E2723" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M12 5.5v13" stroke="#8E44AD" stroke-width="1.6"/>
    <path d="M6 8.5h4M6 11.5h4M14 8.5h4M14 11.5h4" stroke="#8E44AD" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  // Hvězda / Level
  star: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-star" aria-hidden="true">
    <path d="m12 2 3 6.5 7 .8-5.2 4.7 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8Z" fill="#D4AF37" stroke="#4A3408" stroke-width="1.3" stroke-linejoin="round"/>
  </svg>`,

  // Mapa / Stage
  map: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-map" aria-hidden="true">
    <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2Z" fill="#3E2723" stroke="#D4AF37" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M9 4v14M15 6v14" stroke="#D4AF37" stroke-width="1"/>
  </svg>`,

  // Koruna
  crown: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-crown" aria-hidden="true">
    <path d="M4 18h16v2H4zM4 16l-1.5-9 5.5 4L12 4l4 7 5.5-4L20 16H4z" fill="#D4AF37" stroke="#4A3408" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="12" cy="4" r="1.5" fill="#00E5FF"/>
  </svg>`,

  // Svatyně / Obchod
  temple: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-temple" aria-hidden="true">
    <path d="M12 2L2 7v2h20V7L12 2zm-7 9v8h2v-8H5zm5 0v8h2v-8h-2zm5 0v8h2v-8h-2zm5 0v8h2v-8h-2zM2 20v2h20v-2H2z" fill="#D4AF37"/>
  </svg>`,

  // Trofej
  trophy: `<svg viewBox="0 0 24 24" width="24" height="24" class="ic svg-trophy" aria-hidden="true">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.5 1.9 4.6 4.4 4.9.6 1.5 2 2.6 3.6 3V19H7v2h10v-2h-4v-3.1c1.6-.4 3-1.5 3.6-3 2.5-.3 4.4-2.4 4.4-4.9V7c0-1.1-.9-2-2-2z" fill="#D4AF37" stroke="#4A3408" stroke-width="1.2"/>
  </svg>`,

  // Zvuk zapnutý
  soundOn: `<svg viewBox="0 0 24 24" width="20" height="20" class="ic" fill="currentColor" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4v8c1.5-.7 2.5-2.2 2.5-4zM14 3.2v2.1c2.9.9 5 3.5 5 6.7s-2.1 5.8-5 6.7v2.1c4-.9 7-4.5 7-8.8s-3-7.9-7-8.8z"/>
  </svg>`,

  // Zvuk vypnutý
  soundOff: `<svg viewBox="0 0 24 24" width="20" height="20" class="ic" fill="currentColor" aria-hidden="true">
    <path d="M16.5 12c0-1.8-1-3.3-2.5-4v2.2l2.5 2.5c0-.2 0-.5 0-.7zm2.5 0c0 .9-.2 1.8-.5 2.6l1.5 1.5c.7-1.3 1-2.7 1-4.1 0-4.3-3-7.9-7-8.8v2.1c2.9.9 5 3.5 5 6.7zM4.3 3L3 4.3 7.7 9H3v6h4l5 5v-6.7l4.3 4.3c-.7.5-1.4.9-2.3 1.2v2.1c1.4-.3 2.6-1 3.7-1.8l2 2 1.3-1.3-9-9L4.3 3zM12 4L9.9 6.1 12 8.2V4z"/>
  </svg>`,

  // Pauza
  pause: `<svg viewBox="0 0 24 24" width="20" height="20" class="ic" fill="currentColor" aria-hidden="true">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>`,

  // Pokračovat
  play: `<svg viewBox="0 0 24 24" width="20" height="20" class="ic" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z"/>
  </svg>`
};

function getSvg(name) {
  return SVG_ICONS[name] || '';
}

window.SVG_ICONS = SVG_ICONS;
window.getSvg = getSvg;
