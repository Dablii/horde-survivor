// icons.js - Středověké fantasy SVG vektorové ikony nahrazující veškeré emoji
const SVG_ICONS = {
  // Srdce / Život
  heart: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-heart" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    <path d="M7.5 5C5.57 5 4 6.57 4 8.5c0 2.89 2.92 5.58 7.37 9.64L12 18.72l.63-.58C17.08 14.08 20 11.39 20 8.5 20 6.57 18.43 5 16.5 5c-1.48 0-2.9 0.77-3.72 2.01L12 8.24l-.78-1.23C10.4 5.77 8.98 5 7.5 5z" fill="rgba(255,255,255,0.2)"/>
  </svg>`,

  // Lebka / Zabitá monstra
  skull: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-skull" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 3.23 1.54 6.1 3.93 7.92.27.2.6.33.95.33h1.12v1.75c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V20.25h1.12c.35 0 .68-.13.95-.33C20.46 18.1 22 15.23 22 12c0-5.52-4.48-10-10-10zm-4 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm4 4.5h-1.5v-2h1.5v2zm0-3.5h-1.5v-1.5h1.5V16zm3 3.5h-1.5v-2H15v2zm0-3.5h-1.5v-1.5H15V16zm1-1c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>`,

  // Zlatá mince / Měna
  coin: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-coin" fill="currentColor">
    <circle cx="12" cy="12" r="10" stroke="#b45309" stroke-width="1.5" fill="#f59e0b"/>
    <circle cx="12" cy="12" r="7.5" stroke="#fef08a" stroke-width="1" stroke-dasharray="2 1.5" fill="#d97706"/>
    <path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4" stroke="#451a03" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  </svg>`,

  // Drahokam / XP Gem
  gem: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-gem" fill="currentColor">
    <path d="M12 2L3 9l9 13 9-13-9-7z" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>
    <path d="M7 9l5-7 5 7H7zm5 0v13m-5-13l5 13m5-13l-5 13" stroke="#e0f2fe" stroke-width="0.8" opacity="0.6"/>
  </svg>`,

  // Přesýpací hodiny / Časovač
  hourglass: `<svg viewBox="0 0 24 24" width="20" height="20" class="svg-icon svg-hourglass" fill="currentColor">
    <path d="M6 2v4c0 2.21 1.79 4 4 4v4c-2.21 0-4 1.79-4 4v4h12v-4c0-2.21-1.79-4-4-4v-4c2.21 0 4-1.79 4-4V2H6zm10 4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V4h8v2zm-2 10c1.1 0 2 .9 2 2v2H8v-2c0-1.1.9-2 2-2h4z" fill="#fde047"/>
  </svg>`,

  // Meč / Poškození / Útok
  sword: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-sword" fill="currentColor">
    <path d="M19.7 4.3a1 1 0 00-1.4 0L12 10.6 9.4 8A1 1 0 008 8l-.7.7a1 1 0 000 1.4L9.9 12.7 4.3 18.3a1 1 0 000 1.4l.7.7a1 1 0 001.4 0l5.6-5.6 2.6 2.6a1 1 0 001.4 0l.7-.7a1 1 0 000-1.4L13.4 12l6.3-6.3a1 1 0 000-1.4zM18.3 7L17 5.7l1.7-1.7.3.3-.7 2.7z" fill="#e2e8f0"/>
    <path d="M3.7 20.3l1.4-1.4-1.4-1.4-1.4 1.4 1.4 1.4z" fill="#d97706"/>
  </svg>`,

  // Štít / Max HP / Obrana
  shield: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-shield" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.11v4.71c0 4.54-3.08 8.79-7 9.92-3.92-1.13-7-5.38-7-9.92V6.29l7-3.11z" fill="#d4af37"/>
    <path d="M12 4.5v14c2.8-.9 5-4.2 5-7.5V7l-5-2.5z" fill="#b45309" opacity="0.4"/>
  </svg>`,

  // Boty / Rychlost pohybu
  boots: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-boots" fill="currentColor">
    <path d="M19 13l-4-4V3H9v6l-4 4c-1.1 1.1-2 2.7-2 4.3V20c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-2.7c0-1.6-.9-3.2-2-4.3zM9 5h4v3.2L10.8 10 9 8.2V5zm10 14H5v-1.7c0-1 .6-2.1 1.3-2.8L9 11.8l1.6 1.6L7.4 16.6l1.4 1.4 3.2-3.2 1.4 1.4-3.2 3.2H19V19z" fill="#38bdf8"/>
  </svg>`,

  // Luk a šípy / Dostřel
  bow: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-bow" fill="currentColor">
    <path d="M18 2c-4.42 0-8 3.58-8 8 0 1.25.29 2.43.8 3.48L2 22l8.52-8.8c1.05.51 2.23.8 3.48.8 4.42 0 8-3.58 8-8s-3.58-8-8-8zm-4 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm5.3-9.3c.78.78 1.3 1.74 1.54 2.8-.9-1.2-2.14-2.1-3.6-2.54 1-.2 1.56-.2 2.06-.26z" fill="#a3e635"/>
  </svg>`,

  // Blesk / Rychlost střelby / Magie
  lightning: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-lightning" fill="currentColor">
    <path d="M7 2v11h3v9l7-12h-4l4-8H7z" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
  </svg>`,

  // Magnet / Soul Magnet
  magnet: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-magnet" fill="currentColor">
    <path d="M5 3v8c0 3.87 3.13 7 7 7s7-3.13 7-7V3h-4v8c0 1.66-1.34 3-3 3s-3-1.34-3-3V3H5zm0 0h4V7H5V3zm10 0h4V7h-4V3z" fill="#f43f5e"/>
  </svg>`,

  // Grimoire / Kniha / XP násobič
  book: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-book" fill="currentColor">
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4zm12 16H6v-1h12v1zm0-2H6v-1h12v1zm0-2H6V4h12v12z" fill="#c084fc"/>
  </svg>`,

  // Koruna / Královská hodnost / Boss
  crown: `<svg viewBox="0 0 24 24" width="24" height="24" class="svg-icon svg-crown" fill="currentColor">
    <path d="M5 18h14v2H5v-2zm0-2l-2-9 4.5 3.5L12 4l4.5 6.5L21 7l-2 9H5z" fill="#fbbf24" stroke="#d97706" stroke-width="1.2"/>
    <circle cx="3" cy="7" r="1.5" fill="#ef4444"/>
    <circle cx="12" cy="4" r="1.5" fill="#38bdf8"/>
    <circle cx="21" cy="7" r="1.5" fill="#ef4444"/>
  </svg>`,

  // Síň Hrdinů / Obchod / Chrám
  temple: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-temple" fill="currentColor">
    <path d="M12 2L2 7v2h20V7L12 2zm-7 9v8h2v-8H5zm5 0v8h2v-8h-2zm5 0v8h2v-8h-2zm5 0v8h2v-8h-2zM2 20v2h20v-2H2z" fill="#fbbf24"/>
  </svg>`,

  // Lektvar / Regenerace
  potion: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-potion" fill="currentColor">
    <path d="M10 2h4v2h-4V2zm1 3h2v2.5l5 7.5c1 1.5.3 3.5-1.5 3.5H7.5c-1.8 0-2.5-2-1.5-3.5l5-7.5V5z" fill="#ec4899"/>
    <path d="M8 15h8c-.5 1.5-1.7 2.5-4 2.5s-3.5-1-4-2.5z" fill="#f43f5e" opacity="0.6"/>
  </svg>`,

  // Rotační čepele / Orbitals
  orbit: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-orbit" fill="currentColor">
    <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 17.93V17h-2v2.93A8 8 0 014.07 13H7v-2H4.07A8 8 0 0111 4.07V7h2V4.07A8 8 0 0119.93 11H17v2h2.93A8 8 0 0113 19.93z" fill="#06b6d4"/>
  </svg>`,

  // Exploze / Splash
  explosion: `<svg viewBox="0 0 24 24" width="22" height="22" class="svg-icon svg-explosion" fill="currentColor">
    <path d="M12 2l2.4 5.2 5.6.8-4.1 3.9 1 5.6-4.9-2.6-4.9 2.6 1-5.6-4.1-3.9 5.6-.8L12 2z" fill="#f97316"/>
  </svg>`,

  // Mapa / Stage
  map: `<svg viewBox="0 0 24 24" width="20" height="20" class="svg-icon svg-map" fill="currentColor">
    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" fill="#c084fc"/>
  </svg>`,

  // Hvězda / Level
  star: `<svg viewBox="0 0 24 24" width="20" height="20" class="svg-icon svg-star" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#facc15"/>
  </svg>`,

  // Zvuk zapnutý
  soundOn: `<svg viewBox="0 0 24 24" width="20" height="20" class="svg-icon" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>`,

  // Zvuk vypnutý
  soundOff: `<svg viewBox="0 0 24 24" width="20" height="20" class="svg-icon" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
  </svg>`,

  // Pauza
  pause: `<svg viewBox="0 0 24 24" width="20" height="20" class="svg-icon" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>`,

  // Pokračovat / Play
  play: `<svg viewBox="0 0 24 24" width="20" height="20" class="svg-icon" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>`,

  // Restart / Šipka
  restart: `<svg viewBox="0 0 24 24" width="20" height="20" class="svg-icon" fill="currentColor">
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
  </svg>`,

  // Trofej / Pokoření
  trophy: `<svg viewBox="0 0 24 24" width="26" height="26" class="svg-icon svg-trophy" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" fill="#facc15"/>
  </svg>`
};

function getSvg(name) {
  return SVG_ICONS[name] || '';
}

window.SVG_ICONS = SVG_ICONS;
window.getSvg = getSvg;
