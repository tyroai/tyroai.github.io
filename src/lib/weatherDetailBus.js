// Hava ayrıntı penceresini uygulamanın her yerinden açma kanalı (Denetim Merkezi'nin hava kutucuğu,
// Master kart). Pencere App'te bir kez yaşar (WeatherDetailHost): onu açan panel ya da kart
// kapanınca pencere onunla gitmesin.

const listeners = new Set()

/** Hava ayrıntı penceresini açar (Anasayfa'daki hava kartına tıklayınca açılanın aynısı). */
export function openWeatherDetail() {
  for (const fn of listeners) fn()
}

/** Açma isteklerini dinler; aboneliği bırakan fonksiyonu döndürür. */
export function onWeatherDetail(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
