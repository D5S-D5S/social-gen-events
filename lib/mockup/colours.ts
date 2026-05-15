export interface BalloonColour {
  id: string;
  name: string;
  hex: string;
  brand: string;
  finish: "standard" | "fashion" | "metallic" | "chrome" | "pastel" | "neon" | "pearl";
  category: string;
}

export const BALLOON_COLOURS: BalloonColour[] = [
  // Whites & Neutrals
  { id: "wh-white",       name: "White",          hex: "#F8F6F2", brand: "Qualatex", finish: "standard", category: "Neutrals" },
  { id: "wh-ivory",       name: "Ivory",          hex: "#EFE8D8", brand: "Sempertex", finish: "pearl",   category: "Neutrals" },
  { id: "wh-sand",        name: "Sand",            hex: "#D9C9A8", brand: "Kalisan",  finish: "standard", category: "Neutrals" },
  { id: "wh-taupe",       name: "Taupe",           hex: "#B8A898", brand: "Sempertex", finish: "fashion", category: "Neutrals" },
  { id: "wh-silver",      name: "Silver",          hex: "#C8CACE", brand: "Qualatex", finish: "metallic", category: "Metallics" },
  { id: "wh-chrome-silver", name: "Chrome Silver", hex: "#D0D2D4", brand: "Kalisan",  finish: "chrome",   category: "Chromes" },

  // Pinks & Reds
  { id: "pk-blush",       name: "Blush",          hex: "#F2C4BE", brand: "Sempertex", finish: "fashion", category: "Pinks" },
  { id: "pk-baby",        name: "Baby Pink",      hex: "#F9C4D4", brand: "Qualatex", finish: "pastel",   category: "Pinks" },
  { id: "pk-rose",        name: "Rose",            hex: "#E87080", brand: "Kalisan",  finish: "fashion", category: "Pinks" },
  { id: "pk-hot",         name: "Hot Pink",       hex: "#E8186C", brand: "Sempertex", finish: "fashion", category: "Pinks" },
  { id: "pk-fuchsia",     name: "Fuchsia",        hex: "#CB1A6A", brand: "Qualatex", finish: "standard", category: "Pinks" },
  { id: "pk-dusty",       name: "Dusty Rose",     hex: "#D4909A", brand: "Tuftex",   finish: "fashion", category: "Pinks" },
  { id: "rd-red",         name: "Red",            hex: "#D01020", brand: "Qualatex", finish: "standard", category: "Reds" },
  { id: "rd-scarlet",     name: "Scarlet",        hex: "#E02010", brand: "Sempertex", finish: "fashion", category: "Reds" },
  { id: "rd-burgundy",    name: "Burgundy",       hex: "#7A1428", brand: "Kalisan",  finish: "fashion", category: "Reds" },
  { id: "rd-mocha",       name: "Mocha",          hex: "#8A5248", brand: "Gemar",    finish: "fashion", category: "Reds" },

  // Oranges & Yellows
  { id: "or-orange",      name: "Orange",         hex: "#F06020", brand: "Qualatex", finish: "standard", category: "Oranges" },
  { id: "or-peach",       name: "Peach",          hex: "#F4A880", brand: "Sempertex", finish: "fashion", category: "Oranges" },
  { id: "or-coral",       name: "Coral",          hex: "#F07060", brand: "Kalisan",  finish: "fashion", category: "Oranges" },
  { id: "or-gold",        name: "Gold",           hex: "#E0A020", brand: "Qualatex", finish: "metallic", category: "Metallics" },
  { id: "or-chrome-gold", name: "Chrome Gold",   hex: "#D4A824", brand: "Kalisan",  finish: "chrome",   category: "Chromes" },
  { id: "yl-yellow",      name: "Yellow",         hex: "#F4D030", brand: "Qualatex", finish: "standard", category: "Yellows" },
  { id: "yl-lemon",       name: "Lemon",          hex: "#F0E060", brand: "Sempertex", finish: "pastel",  category: "Yellows" },
  { id: "yl-butter",      name: "Butter",         hex: "#F5E898", brand: "Tuftex",   finish: "pastel",   category: "Yellows" },
  { id: "yl-rose-gold",   name: "Rose Gold",      hex: "#E8A898", brand: "Kalisan",  finish: "chrome",   category: "Chromes" },

  // Greens
  { id: "gr-lime",        name: "Lime",           hex: "#88C830", brand: "Qualatex", finish: "standard", category: "Greens" },
  { id: "gr-green",       name: "Green",          hex: "#30A840", brand: "Sempertex", finish: "standard", category: "Greens" },
  { id: "gr-sage",        name: "Sage",            hex: "#90A878", brand: "Tuftex",   finish: "fashion", category: "Greens" },
  { id: "gr-forest",      name: "Forest",         hex: "#285830", brand: "Kalisan",  finish: "fashion", category: "Greens" },
  { id: "gr-eucalyptus",  name: "Eucalyptus",     hex: "#78A890", brand: "Gemar",    finish: "fashion", category: "Greens" },
  { id: "gr-mint",        name: "Mint",           hex: "#B0E0C8", brand: "Sempertex", finish: "pastel",  category: "Greens" },
  { id: "gr-chrome-green", name: "Chrome Green",  hex: "#40B850", brand: "Kalisan",  finish: "chrome",   category: "Chromes" },

  // Blues & Purples
  { id: "bl-sky",         name: "Sky Blue",       hex: "#78C0E8", brand: "Qualatex", finish: "pastel",   category: "Blues" },
  { id: "bl-blue",        name: "Blue",           hex: "#2858D0", brand: "Sempertex", finish: "standard", category: "Blues" },
  { id: "bl-royal",       name: "Royal Blue",     hex: "#1838A8", brand: "Qualatex", finish: "fashion", category: "Blues" },
  { id: "bl-navy",        name: "Navy",           hex: "#102050", brand: "Kalisan",  finish: "fashion", category: "Blues" },
  { id: "bl-teal",        name: "Teal",           hex: "#189098", brand: "Tuftex",   finish: "fashion", category: "Blues" },
  { id: "bl-turquoise",   name: "Turquoise",      hex: "#30C8C0", brand: "Sempertex", finish: "standard", category: "Blues" },
  { id: "bl-baby",        name: "Baby Blue",      hex: "#B8D8F0", brand: "Qualatex", finish: "pastel",   category: "Blues" },
  { id: "pu-lavender",    name: "Lavender",       hex: "#C8B0E0", brand: "Sempertex", finish: "pastel",  category: "Purples" },
  { id: "pu-lilac",       name: "Lilac",          hex: "#C090D0", brand: "Tuftex",   finish: "fashion", category: "Purples" },
  { id: "pu-purple",      name: "Purple",         hex: "#7030A0", brand: "Qualatex", finish: "standard", category: "Purples" },
  { id: "pu-violet",      name: "Violet",         hex: "#5010A8", brand: "Kalisan",  finish: "fashion", category: "Purples" },
  { id: "pu-mulberry",    name: "Mulberry",       hex: "#902068", brand: "Sempertex", finish: "fashion", category: "Purples" },

  // Blacks & Darks
  { id: "bk-black",       name: "Black",          hex: "#202020", brand: "Qualatex", finish: "standard", category: "Darks" },
  { id: "bk-onyx",        name: "Onyx",           hex: "#181818", brand: "Kalisan",  finish: "fashion", category: "Darks" },
  { id: "bk-chrome-black", name: "Chrome Black",  hex: "#2A2A2A", brand: "Kalisan",  finish: "chrome",   category: "Chromes" },

  // Neons
  { id: "ne-pink",        name: "Neon Pink",      hex: "#FF1888", brand: "Sempertex", finish: "neon",    category: "Neons" },
  { id: "ne-orange",      name: "Neon Orange",    hex: "#FF6600", brand: "Sempertex", finish: "neon",    category: "Neons" },
  { id: "ne-yellow",      name: "Neon Yellow",    hex: "#E8F000", brand: "Sempertex", finish: "neon",    category: "Neons" },
  { id: "ne-green",       name: "Neon Green",     hex: "#00E040", brand: "Sempertex", finish: "neon",    category: "Neons" },
  { id: "ne-blue",        name: "Neon Blue",      hex: "#0070FF", brand: "Sempertex", finish: "neon",    category: "Neons" },
];

export const COLOUR_CATEGORIES = Array.from(new Set(BALLOON_COLOURS.map((c) => c.category)));

export function getColoursByCategory(cat: string) {
  return BALLOON_COLOURS.filter((c) => c.category === cat);
}

export function getColourById(id: string) {
  return BALLOON_COLOURS.find((c) => c.id === id);
}
