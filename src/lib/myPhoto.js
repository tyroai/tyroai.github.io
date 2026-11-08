import { PERSONAL_STORAGE } from "@/lib/sessionCache"

/**
 * Kendi profil fotoğrafım (saf mantık; kanca `hooks/useMe`). Fotoğraf bu tarayıcıda saklanır,
 * açılışta anında görünsün. Office'te değiştirilen fotoğraf eskiden bu tarayıcıda hiç
 * yenilenmiyordu (yalnız tarayıcı verisi silinince geliyordu). Artık Graph'a yeniden sorulur:
 * oturum açılınca (`markPhotoDue`) ve uygulama açılırken en çok günde bir (`PHOTO_TTL`; telefonda
 * oturum haftalarca açık kalıyor); arada sorgu yok. Soru ucuz: önce üst veri (`/me/photo`, ETag),
 * resim yalnız ETag değiştiyse iner. Oturum kapanınca kayıtlar silinir (`clearMyPhoto` ile aynı
 * önek, `lib/sessionCache` › PERSONAL_STORAGE — modül yüklenmemiş olsa da).
 * Kayıtlar: `tyro-photo-<id>` (data URL ya da "none"), `tyro-photo-etag-<id>`,
 * `tyro-photo-at-<id>` (son bakış).
 */
export const PHOTO_TTL = 24 * 60 * 60 * 1000
const ME_PHOTO = "https://graph.microsoft.com/v1.0/me/photo"

const PREFIX = PERSONAL_STORAGE.myPhoto.prefix // "tyro-photo-"
export const photoKey = (id, part) => (part ? `${PREFIX}${part}-${id}` : `${PREFIX}${id}`)

/** Saklanan fotoğraf: data URL · `null` (fotoğraf yok) · `undefined` (hiç sorulmadı). */
export function readPhoto(store, id) {
  const v = store.getItem(photoKey(id))
  if (v === null) return undefined
  return v === "none" ? null : v
}

/** Yeniden sorulmalı mı: hiç sorulmadıysa ya da son bakıştan beri `PHOTO_TTL` geçtiyse. */
export function photoDue(store, id, now) {
  if (readPhoto(store, id) === undefined) return true
  return now - Number(store.getItem(photoKey(id, "at")) || 0) > PHOTO_TTL
}

/**
 * Graph'a sor. `get(path, read)`: Graph hattı (`lib/graph` › graphRequest; `read` "json" ya da
 * "blob"). Dönen: `{ same: true }` (değişmemiş) · `{ blob, etag }` (yeni resim) ·
 * `{ blob: null, etag: null }` (fotoğraf yok, 404) · `null` (belirteç yok, kısma, sunucu ya da ağ
 * hatası: saklanan kalır).
 */
export async function checkPhoto({ get, knownEtag, hasPhoto }) {
  const meta = await get(ME_PHOTO, "json")
  if (meta.httpStatus === 404) return { blob: null, etag: null }
  if (meta.status !== "ready") return null
  const etag = meta.data?.["@odata.mediaEtag"] ?? null
  if (etag && etag === knownEtag && hasPhoto) return { same: true }
  const res = await get(`${ME_PHOTO}/$value`, "blob")
  if (res.httpStatus === 404) return { blob: null, etag: null }
  if (res.status !== "ready") return null
  return { blob: res.blob, etag }
}

/** Oturum açıldı: fotoğraf bir sonraki bakışta yeniden sorulur (saklanan, o arada görünür). */
export function markPhotoDue(store, id) {
  try {
    store.removeItem(photoKey(id, "at"))
  } catch {
    // Depo kapalı (gizli pencere) — sorun değil, saklanan bir şey de yok.
  }
}

/** Oturum kapandı: bütün fotoğraf kayıtları silinir (sonraki giriş tazesini alır). */
export function clearMyPhoto(store) {
  try {
    const keys = []
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (k?.startsWith(PREFIX)) keys.push(k)
    }
    for (const k of keys) store.removeItem(k)
  } catch {
    // Depo kapalı — silinecek bir şey yok.
  }
}
