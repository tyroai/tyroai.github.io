/**
 * Bayat parça imzaları — Chrome/Edge · Firefox · Safari · Vite'ın CSS ön
 * yüklemesi (`Unable to preload CSS`, dist'teki yardımcıda doğrulandı).
 * ⚠️ "Unexpected token '<'" BİLEREK YOK: HTML dönen bir fetch'in JSON.parse
 * hatası da böyle görünür ve yenilemek onu düzeltmez.
 */
const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i

/** Yeni sürümle yüklenemeyen parça mı (sayfa sınırı bir kez yeniler; kart sınırı devreder). */
export function isChunkLoadError(error) {
  try {
    return CHUNK_ERROR_RE.test(String(error?.message ?? ""))
  } catch {
    return false
  }
}
