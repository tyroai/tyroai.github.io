/**
 * Alanın görünen durumu, öncelik sırasıyla: hata ("error", gönderme denemesinden sonra) · dolu
 * ("done", yeşil ✓) · zorunlu ama boş ("need", hafif kırmızı çerçeve) · yok (isteğe bağlı boş).
 */
export function fieldState({ filled, required = false, error = null }) {
  if (error) return "error"
  if (filled) return "done"
  return required ? "need" : null
}

/** Değer dolu mu: boş ya da yalnız boşluktan oluşan yazı, null ve undefined boş sayılır. */
export const isFilled = (value) => value != null && String(value).trim() !== ""
