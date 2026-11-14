import { LEGACY_CONFIG_KEYS } from "@/lib/configCache"
import { LEGACY_ORB_STYLE_KEY } from "@/lib/orbStyle"

/**
 * Açılıştaki tek seferlik önbellek temizliği: eski katalog önbelleği (`tyro-config-v1`) silinir.
 * İçinde pakete gömülü yedek listenin satırları ve marka değişikliği öncesi adlar kalmış
 * olabilir; Dataverse okunamayan bir tarayıcıda bunlar katalog sanılıyordu. Yeni önbellek
 * (`configCache.js`) yalnız Dataverse cevabından dolar. Kaldırılan orb görünümü seçiminin kaydı
 * da silinir (orb herkeste varsayılan; kayıt "Bu tarayıcı" dökümünde boşuna görünmesin). Hazır
 * sahnelerin v1 düzenleri de: varsayılanlar 2+1+1 kalıbına dizilince kayıt v2'ye geçti
 * (`myspace/lib/scenes` › `sceneKey`).
 */
const LEGACY_SCENE_KEYS = ["morning", "evening", "travel"].map((id) => `tyro-home-scene-${id}-v1`)
// Kaldırılan Açık Raf düzeninin kaydı (TYRO'nun seçiminde sabitlenen ve kapatılan kartlar).
const LEGACY_SHELF_KEY = "tyro-home-picks-v1"

export function applyCacheMigration() {
  try {
    for (const key of [
      ...LEGACY_CONFIG_KEYS,
      LEGACY_ORB_STYLE_KEY,
      ...LEGACY_SCENE_KEYS,
      LEGACY_SHELF_KEY,
    ])
      window.localStorage.removeItem(key)
  } catch {
    // Depolama kapalı (gizli pencere, engellenmiş site verisi): silinecek bir şey de yok.
  }
}
