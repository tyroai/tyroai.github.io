import "@/lib/i18n/selfService"
import { fold } from "@/lib/fold"

/**
 * İŞ AVANSININ GİDİLECEK YERİ — ERP'nin lokasyon listesi (kod = açıklama), ERP'deki sırayla.
 * Avansın "gidilecek yer"i bu listeden seçilir; sohbet cümlesine ve asistana KOD olduğu gibi
 * gider ("İSTANBUL"): ERP onu birebir eşliyor. Listede olmayan yer için "DİĞER".
 * Formda görünen ad Türkçe baş harf büyük ("İstanbul"); yalnız "DİĞER" çevrilir.
 */
export const ADVANCE_LOCATIONS = [
  "ADANA",
  "ANKARA",
  "BALIKESİR",
  "BANDIRMA",
  "ÇORUM",
  "DİĞER",
  "EDİRNE",
  "GAZİANTEP",
  "GİRESUN",
  "İSTANBUL",
  "İZMİR",
  "MARDİN",
  "MERSİN",
  "MERZİFON",
  "ŞANLIURFA",
  "TRABZON",
]

/** Listede olmayan yerin kodu. */
export const OTHER_LOCATION = "DİĞER"

const BY_FOLD = new Map(ADVANCE_LOCATIONS.map((code) => [fold(code), code]))

/**
 * Serbest yazıdan lokasyon kodu: ilk parça (virgül ya da noktalı virgülden önce), Türkçe
 * katlamalı ("İzmir", "izmir, Türkiye", "IZMIR" → "İZMİR"). Eşleşmezse null ("Hamburg"):
 * öneri yeri doldurmaz, eski taslağın serbest yazısı boş sayılır. Kod zaten listedeyse kendisi.
 */
export function matchLocation(text) {
  if (text == null) return null
  const first = String(text).split(/[,;]/)[0]
  return BY_FOLD.get(fold(first)) ?? null
}

/** Kodun formdaki adı: "İSTANBUL" → "İstanbul", "ŞANLIURFA" → "Şanlıurfa"; "DİĞER" sözlükten. */
export function locationLabel(t, code) {
  if (!code) return ""
  if (code === OTHER_LOCATION) return t("selfService.advance.location.other")
  return String(code)
    .toLocaleLowerCase("tr")
    .replace(/(^|[\s-])(\S)/g, (_, sep, ch) => sep + ch.toLocaleUpperCase("tr"))
}
