import { getPalette, knownPaletteId } from "@/data/palettes"

/**
 * Widget'ın kendi rengi (`<görünüm>:<palet>`, ör. `glass:green-garden`): paletin token'ları stil
 * sayfalarından bir kez okunur ve kartın kabuğuna yazılır — renkler tek kaynakta kalır, ilk CSS
 * büyümez. Kart açık ya da koyu kipte çizilir (`lookProps` › `lookMode`); token'lar kaskadın
 * sırasıyla katlanır: genel kurallar (`:root`, koyuda `.dark`), sonra paletin kendi blokları
 * (`:root[data-palette=…]`, koyuda `.dark[data-palette=…]`). Genel kurallardan yalnız paletten
 * türeyenler alınır; `var(…)` olarak yazıldıkları için kartta yeniden çözülürler (kökte bir kez
 * çözülmüş değer miras kalsaydı kart uygulamanın paletini taşırdı).
 */
const ROOT = /^:root\[data-palette="([a-z-]+)"\]$/
const DARK = /^\.dark\[data-palette="([a-z-]+)"\]$/
// Renkli görünüm yazı mürekkebini paletin açıklığına göre kendisi verir (`lookTone.css`).
const INK = new Set(["--brand-text", "--brand-ink"])
let cache = null

const custom = (style) => {
  const out = {}
  for (const name of style)
    if (name.startsWith("--")) out[name] = style.getPropertyValue(name).trim()
  return out
}

/** Stil kurallarından katmanlar: genel `root` ve `dark`, paletin `light[id]` ve `darkOf[id]`. */
function scan() {
  const src = { root: {}, dark: {}, light: {}, darkOf: {} }
  const visit = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules && !rule.selectorText) {
        visit(rule.cssRules)
        continue
      }
      // Seçicisiz kurallar (@font-face …) atlanır; yoksa bütün sayfa okunamazdı.
      if (!rule.selectorText || !rule.style) continue
      for (const sel of rule.selectorText.split(",")) {
        const s = sel.trim()
        const root = s.match(ROOT)
        const dark = s.match(DARK)
        if (root) Object.assign((src.light[root[1]] ??= {}), custom(rule.style))
        else if (dark) Object.assign((src.darkOf[dark[1]] ??= {}), custom(rule.style))
        else if (s === ":root") Object.assign(src.root, custom(rule.style))
        else if (s === ".dark") Object.assign(src.dark, custom(rule.style))
      }
    }
  }
  for (const sheet of document.styleSheets) {
    try {
      visit(sheet.cssRules)
    } catch {
      // Başka kaynaktan gelen stil sayfası okunamaz: atlanır.
    }
  }
  return derivedOnly(src)
}

/**
 * Genel katmanlardan (`:root`, `.dark`) yalnız paletle ilgili olanlar kalır: bir paletin
 * tanımladığı ad ya da onlara (zincirleme) başvuran değer. Tema token'ları (zemin, kenar…)
 * kartın adasına aittir, kabuğa yazılmaz. Saf: testli.
 */
export function derivedOnly(src) {
  const names = new Set()
  for (const group of [src.light, src.darkOf])
    for (const vars of Object.values(group)) for (const name of Object.keys(vars)) names.add(name)
  const refs = (value) => [...value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  const generic = [...Object.entries(src.root), ...Object.entries(src.dark)]
  for (let grew = true; grew;) {
    grew = false
    for (const [name, value] of generic) {
      if (names.has(name) || !refs(value).some((r) => names.has(r))) continue
      names.add(name)
      grew = true
    }
  }
  const keep = (vars) => Object.fromEntries(Object.entries(vars).filter(([n]) => names.has(n)))
  return { ...src, root: keep(src.root), dark: keep(src.dark) }
}

/**
 * Kaskadın sonucu: `:root` ve `.dark` (0,1,0) önce, paletin blokları (0,2,0) sonra; aynı
 * özgüllükte kaynak sırası (açık sonra koyu). Saf: testli.
 */
export function layerTokens(src, id, mode, { ink = true } = {}) {
  const out =
    mode === "dark"
      ? { ...src.root, ...src.dark, ...src.light[id], ...src.darkOf[id] }
      : { ...src.root, ...src.light[id] }
  if (!ink) for (const name of INK) delete out[name]
  return out
}

/**
 * Paletin kartın kipindeki token'ları (`mode`: "light" | "dark"); `ink: false` → yazı mürekkebi
 * hariç (Renkli). Bilinmeyen palet ya da tarayıcı dışı → `null`.
 */
export function paletteTokens(id, mode = "light", options) {
  if (typeof document === "undefined" || !id) return null
  cache ??= scan()
  return cache.light[id] ? layerTokens(cache, id, mode, options) : null
}

/** Görünümün temeli: `glass:green-garden` → `glass`. */
export const baseLook = (look) => (typeof look === "string" ? look.split(":")[0] : look)

/** Widget'ın kendi rengi (yoksa `null`: uygulamanın paletini izler). */
export function lookPalette(look) {
  const at = typeof look === "string" ? look.indexOf(":") : -1
  return at > 0 ? knownPaletteId(look.slice(at + 1)) : null
}

/** Renk korunarak görünüm değişir; görünüm korunarak renk değişir (`null` → uygulamanınki). */
export const withBase = (look, base) => (lookPalette(look) ? `${base}:${lookPalette(look)}` : base)
export const withPalette = (look, id) => (id ? `${baseLook(look)}:${id}` : baseLook(look))

/**
 * Renkli camın renk payı (`--look-tint`, menüdeki örnek de aynı): koyu paletlerde az (camın
 * ikincil yazısı AA kalsın), açıklarda çok. `light`: paletin açıklığı (0–1). Saf: testli.
 */
export const glassTint = (light) => Math.round(Math.min(0.3, 0.12 + light * 0.5) * 100) / 100

/** Hex rengin göreli parlaklığı (WCAG, 0–1). Saf. */
export function hexLuminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "")
  if (!m) return 0
  const ch = (i) => {
    const s = parseInt(m[1].slice(i, i + 2), 16) / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4)
}

/** Paletin türü: degrade ya da düz renk (Profil › Tema'daki gruplar). */
export const paletteKind = (id) => (getPalette(id).group === "solid" ? "solid" : "gradient")
