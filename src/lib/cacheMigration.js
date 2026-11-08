import { LEGACY_CONFIG_KEYS } from "@/lib/configCache"

/**
 * Açılıştaki tek seferlik önbellek temizliği: eski katalog önbelleği (`tyro-config-v1`) silinir.
 * İçinde pakete gömülü yedek listenin satırları ve marka değişikliği öncesi adlar kalmış
 * olabilir; Dataverse okunamayan bir tarayıcıda bunlar katalog sanılıyordu. Yeni önbellek
 * (`configCache.js`) yalnız Dataverse cevabından dolar.
 */
export function applyCacheMigration() {
  try {
    for (const key of LEGACY_CONFIG_KEYS) window.localStorage.removeItem(key)
  } catch {
    // Depolama kapalı (gizli pencere, engellenmiş site verisi): silinecek bir şey de yok.
  }
}
