export const palettes = [
  // Varsayılan (uygulama ve giriş) — listede ilk: `getPalette` bilinmeyen kimlikte ilkine düşer.
  {
    id: "fiesta",
    labelKey: "palette.fiesta",
    swatch: ["#feda77", "#dd2a7b", "#8134af"],
    group: "gradient",
  },
  {
    id: "midnight",
    labelKey: "palette.midnight",
    // Kaynak spec bir YÜZEY tarifiydi (arka plan, panel, kenarlık); bu
    // uygulamada paletler yalnızca MARKA/vurgu token'ı verir, yüzeyler
    // dark/light temasından gelir. Uyarlama: verilen navy → buz rampası
    // marka rengi oldu. Kaşe üç rengi: derin gece · orta lacivert · buz.
    swatch: ["#17243C", "#425C87", "#B7C9E3"],
    group: "gradient",
  },
  // Kaşe koyudan açığa (diğer degradelerle aynı sıra): beyaz yazı `from`/`via` üstünde durur.
  {
    id: "cobalt-sky",
    labelKey: "palette.cobaltSky",
    swatch: ["#2a58a4", "#3e6db8", "#8eb0e2"],
    group: "gradient",
  },
  {
    id: "ocean-breeze",
    labelKey: "palette.oceanBreeze",
    swatch: ["#0077b6", "#00b4d8", "#48cae4"],
    group: "gradient",
  },
  {
    id: "arctic-mint",
    labelKey: "palette.arcticMint",
    swatch: ["#2563EB", "#22C1C3", "#A7F3D0"],
    group: "gradient",
  },
  {
    id: "rose-blush",
    labelKey: "palette.roseBlush",
    swatch: ["#850E35", "#EE6983", "#FFC4C4"],
    group: "gradient",
  },
  {
    id: "peach-sorbet",
    labelKey: "palette.peachSorbet",
    swatch: ["#ff835d", "#ffa583", "#db9df5"],
    group: "gradient",
  },
  {
    id: "sunset-gradient",
    labelKey: "palette.sunsetGradient",
    swatch: ["#ef5d0e", "#ff7b00", "#ffaa00"],
    group: "gradient",
  },
  {
    id: "pastel-lavender",
    labelKey: "palette.pastelLavender",
    swatch: ["#6247aa", "#b185db", "#c19ee0"],
    group: "gradient",
  },
  {
    id: "evergreen",
    labelKey: "palette.evergreen",
    swatch: ["#1f5e43", "#2e7a57", "#4f9c79"],
    group: "gradient",
  },
  {
    id: "green-garden",
    labelKey: "palette.greenGarden",
    swatch: ["#31572c", "#90a955", "#c5d566"],
    group: "gradient",
  },
  {
    id: "fiery-red",
    labelKey: "palette.fieryRed",
    swatch: ["#621708", "#bc3908", "#f6aa1c"],
    group: "gradient",
  },
  {
    id: "chocolate-delight",
    labelKey: "palette.chocolateDelight",
    swatch: ["#210f04", "#690500", "#bb6b00"],
    group: "gradient",
  },
  {
    id: "black",
    labelKey: "palette.black",
    swatch: ["#000000", "#000000", "#000000"],
    group: "solid",
  },
  // Kurumsal logo rengi (sign · office).
  {
    id: "periwinkle",
    labelKey: "palette.periwinkle",
    swatch: ["#6d74b5", "#6d74b5", "#6d74b5"],
    group: "solid",
  },
]

export const DEFAULT_PALETTE = "fiesta"

export function getPalette(id) {
  return palettes.find((p) => p.id === id) ?? palettes[0]
}

// Kaldırılan paletler: kayıtlı seçim varsayılana değil en yakın palete geçer (v2 artık asıl
// Ocean Breeze).
const RETIRED = {
  amber: "sunset-gradient",
  sky: "ocean-breeze",
  navy: "periwinkle",
  violet: "periwinkle",
  cyan: "ocean-breeze",
  green: "green-garden",
  marigold: "sunset-gradient",
  "ocean-breeze-v2": "ocean-breeze",
}

/** Kayıtlı palet kimliği: geçerliyse kendisi, kaldırılmışsa yerine geçen, değilse null. */
export function knownPaletteId(id) {
  const next = RETIRED[id] ?? id
  return palettes.some((p) => p.id === next) ? next : null
}
