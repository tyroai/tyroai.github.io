/**
 * ŞEHİR FOTOĞRAFLARI — gidilecek yer kartındaki daireler (referanstaki simge yapı görselleri).
 * Wikimedia Commons'tan serbest lisanslı fotoğraflar (çoğu CC BY-SA), kare kırpılıp 240 px WebP'ye
 * küçültüldü; dosyalar `public/tyro-advance/cities/`, fotoğrafçı ve lisans listesi
 * `public/tyro-advance/credits.txt` (Yardım sayfasının altındaki "Görsel kaynakları" oraya gider —
 * atıf şartı; seçim ekranında kaynak gösterilmez, ürün sahibinin kararı).
 * `what`: fotoğraftaki yapı (özel ad, çevrilmez). "DİĞER"in fotoğrafı yok.
 */
const PHOTOS = {
  ADANA: { file: "adana", what: "Taşköprü" },
  ANKARA: { file: "ankara", what: "Anıtkabir" },
  BALIKESİR: { file: "balikesir", what: "Saat Kulesi" },
  EDİRNE: { file: "edirne", what: "Selimiye Camii" },
  GAZİANTEP: { file: "gaziantep", what: "Gaziantep Kalesi" },
  İSTANBUL: { file: "istanbul", what: "Galata Kulesi" },
  İZMİR: { file: "izmir", what: "Saat Kulesi" },
  MARDİN: { file: "mardin", what: "Zinciriye Medresesi" },
  MERSİN: { file: "mersin", what: "Kızkalesi" },
  ŞANLIURFA: { file: "sanliurfa", what: "Balıklıgöl" },
  TRABZON: { file: "trabzon", what: "Sümela Manastırı" },
}
const BASE = `${import.meta.env.BASE_URL}tyro-advance/`

/** Lokasyon kodunun fotoğrafı: `{ src, what }` ya da `null`. */
export function cityPhoto(code) {
  const p = PHOTOS[code]
  return p ? { src: `${BASE}cities/${p.file}.webp`, what: p.what } : null
}
