import { strings as trCore } from "@/data/strings.tr"
import { isPublicPage, LOGIN_PATH } from "@/lib/publicPages"

/**
 * Dil sözlükleri. Türkçe (varsayılan ve yedek) pakette; öteki diller yalnız seçilince iner —
 * dördü birlikte ilk yükün ~120 KB gz'siydi. `main.jsx` kayıtlı dilin sözlüğünü ilk çizimden
 * önce yükler (arayüz Türkçe yanıp sönmesin); dil değişince sözlük inene kadar eski dil kalır.
 *
 * Türkçenin büyük ve yalnız tembel ekranlarda kullanılan bölümleri (`strings.tr.<ad>.js`:
 * help, selfService …) ilk pakette değil: onları kullanan parça `@/lib/i18n/<ad>` modülünü
 * içe aktarır, modül çalışınca metinler buraya eklenir. Parça çizilmeden önce modülleri
 * çalıştığı için ham anahtar görünmez; kuralı `tests/unit/i18nSplit.test.js` bekler.
 */
/** Kişinin dil menüsünden BİLEREK seçtiği dil. Seçilmemişse kayıt yok, varsayılan adresten gelir. */
export const LOCALE_STORAGE_KEY = "tyro-locale-v2"
/**
 * Eski kayıt: etkin dil her açılışta kendiliğinden yazılıyordu, yani "tr" bir seçim değil
 * varsayılandı. Öteki diller ancak seçilerek yazılabildiği için seçim sayılır ve bir kez taşınır.
 */
const LEGACY_KEY = "tyro-locale"

const loaded = { tr: { ...trCore } }
const LOADERS = {
  en: () => import("@/data/strings.en"),
  ru: () => import("@/data/strings.ru"),
  ar: () => import("@/data/strings.ar"),
}
const pending = {}

/** Tembel Türkçe bölümünü sözlüğe ekler (yalnız `@/lib/i18n/<ad>` modülleri çağırır). */
export function addTurkishPart(part) {
  Object.assign(loaded.tr, part)
}

/** Yüklüyse dilin sözlüğü, değilse `null`. */
export function dictionaryFor(locale) {
  return loaded[locale] ?? null
}

/** Sözlüğü bir kez indirir; bilinmeyen dil için Türkçe döner. Ağ hatasında reddeder. */
export function loadDictionary(locale) {
  if (loaded[locale]) return Promise.resolve(loaded[locale])
  const load = LOADERS[locale]
  if (!load) return Promise.resolve(loaded.tr)
  pending[locale] ??= load()
    .then((mod) => {
      loaded[locale] = mod.strings
      return mod.strings
    })
    .catch((err) => {
      delete pending[locale]
      throw err
    })
  return pending[locale]
}

/** Seçilmiş dil; seçim yoksa ya da depo okunamazsa (gizli pencere, engel) `null`. */
export function chosenLocale() {
  try {
    const chosen = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (chosen) return chosen
    const legacy = window.localStorage.getItem(LEGACY_KEY)
    if (legacy == null) return null
    window.localStorage.removeItem(LEGACY_KEY)
    if (!LOADERS[legacy]) return null
    window.localStorage.setItem(LOCALE_STORAGE_KEY, legacy)
    return legacy
  } catch {
    return null
  }
}

/** Dil menüsünden seçim: bundan sonra giriş de uygulama da bu dilde açılır. */
export function saveChosenLocale(locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Depo kapalı: seçim yalnız bu sekmede geçerli.
  }
}

/**
 * Seçim yoksa dil: giriş ekranı ve tanıtım sayfaları (Hakkımızda · Ekibimiz) İngilizce,
 * uygulamanın içi Türkçe (ürün sahibinin kararı). Kişi dil menüsünden değiştirebilir.
 */
export function defaultLocaleFor(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/"
  return path === LOGIN_PATH || isPublicPage(path) ? "en" : "tr"
}
