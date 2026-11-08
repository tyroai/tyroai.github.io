/**
 * Katalog önbelleğinin anahtarı (son Dataverse cevabı; açılışta ilk boya için). `v1` yedek
 * listeyi ve marka değişikliği öncesi adları ("TYRO Office") taşıyabildiği için açılışta
 * silinir (`cacheMigration.js`).
 */
export const CONFIG_CACHE_KEY = "tyro-config-v2"
export const LEGACY_CONFIG_KEYS = ["tyro-config-v1"]
