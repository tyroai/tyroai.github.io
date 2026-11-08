import { DEFAULT_PALETTE, knownPaletteId } from "@/data/palettes"

export const PALETTE_KEY = "tyro-palette"

// Palet yalnız kullanıcı seçince yazılır; kayıt yoksa varsayılan geçerli, varsayılan değişince
// seçmemiş herkes onu izler. Eski sürümler paleti ilk açılışta kendiliğinden yazıyordu ve varsayılan
// bir gün Ocean Breeze oldu (o gün kayıtlı "fiesta" "ocean-breeze"e taşındı): kayıtlı "fiesta" ve
// "ocean-breeze" çoğunlukla seçim değil o günlerin varsayılanı — bir kez silinir.
const RESET_KEY = "tyro-palette-default-reset"
const OLD_FLAGS = ["tyro-palette-default-ocean"]
const AUTO_SAVED = new Set(["fiesta", "ocean-breeze"])

/** Uygulama paleti: kullanıcının seçimi, yoksa varsayılan. Depo okunamazsa varsayılan. */
export function readAiPalette(storage) {
  try {
    if (!storage.getItem(RESET_KEY)) {
      storage.setItem(RESET_KEY, "1")
      for (const key of OLD_FLAGS) storage.removeItem(key)
      if (AUTO_SAVED.has(storage.getItem(PALETTE_KEY))) storage.removeItem(PALETTE_KEY)
    }
    return knownPaletteId(storage.getItem(PALETTE_KEY)) ?? DEFAULT_PALETTE
  } catch {
    return DEFAULT_PALETTE
  }
}

/** Kullanıcının seçimini yazar; depo kapalıysa seçim bu oturumda kalır. */
export function saveChoice(storage, key, value) {
  try {
    storage.setItem(key, value)
  } catch {
    // Depo kapalı.
  }
}
