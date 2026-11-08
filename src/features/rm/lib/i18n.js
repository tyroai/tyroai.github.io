// tyroRM sözlükleri bölümle birlikte iner: ana sözlük ilk paketin içinde ve bütçe dar.
// Türkçe bölüm paketinde, öteki diller seçiliyse iner; eksik anahtar Türkçeye düşer.
import { strings as tr } from "@/data/rm/strings.tr"

const loaded = { tr }
const LOADERS = {
  en: () => import("@/data/rm/strings.en"),
  ru: () => import("@/data/rm/strings.ru"),
  ar: () => import("@/data/rm/strings.ar"),
}
const pending = {}

export function rmDictionaryFor(locale) {
  return loaded[locale] ?? null
}

export function loadRmDictionary(locale) {
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

/** Anahtarın metni; {ad} yer tutucuları değerle dolar ($ kalıpları kullanıcı verisini bozmasın). */
export function rmText(locale, key, vars) {
  const value = loaded[locale]?.[key] ?? loaded.en?.[key] ?? loaded.tr[key] ?? key
  if (!vars) return value
  return String(value).replace(/\{(\w+)\}/g, (m, name) =>
    vars[name] === undefined || vars[name] === null ? m : String(vars[name]),
  )
}
