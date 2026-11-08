/**
 * Renk adı ailesi (#rrggbb → "mor", "pembe" …): paletin adı tek başına bir şey anlatmıyor
 * ("Festival" ne renk?), durakların aile adları anlatır. Kaba ama kararlı: ton aralığına göre,
 * çok koyu siyah, doygunluğu düşük gri/beyaz, koyu turuncu kahverengi.
 */
const HUES = [
  [12, "red"],
  [40, "orange"],
  [68, "yellow"],
  [160, "green"],
  [195, "teal"],
  [228, "blue"],
  [255, "indigo"],
  [295, "purple"],
  [350, "pink"],
  [361, "red"],
]

export function colorFamily(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "")
  if (!m) return null
  const n = parseInt(m[1], 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (l < 0.1) return "black"
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (s < 0.15) return l > 0.85 ? "white" : "gray"
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = (h * 60 + 360) % 360
  if (h >= 15 && h < 40 && l < 0.32) return "brown"
  const family = HUES.find(([limit]) => h < limit)[1]
  // Çok açık kırmızı göze pembe görünür (#ffc4c4).
  return family === "red" && l > 0.75 ? "pink" : family
}

/** Paletin durak aileleri, sırayla ve tekrarsız (ör. ["yellow", "pink", "purple"]). */
export function paletteFamilies(swatch) {
  const out = []
  for (const hex of swatch ?? []) {
    const f = colorFamily(hex)
    if (f && !out.includes(f)) out.push(f)
  }
  return out
}
