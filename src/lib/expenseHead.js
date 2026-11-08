import "@/lib/i18n/selfService"
import { getDateTimeFormat } from "@/lib/intl-cache"

/**
 * MASRAFIN BAŞLIĞI — kimin adına, hangi şirkete, hangi açıklamayla (saf). İK MCP'sinde üçü de
 * başlığın alanı (`create_employee_expense`: `mail` · `company` · `description`), yani bütün
 * kalemler için tek değer. Varsayılan: kendim · kendi şirketim · "Ekim 26 | TYRO Self Servis | <ad>". Ekranda
 * "kendim" kişinin adıyla, "kendi şirketim" İK kaydındaki şirketin kısa adıyla yazılır
 * (`useExpenseOwners`); gönderilen değer yine SELF · OWN.
 */
export const SELF = "self"
export const OWN = "own"

/**
 * Boş başlık. `company`: kişinin İK kaydındaki şirket listede varsa onun kodu (listeden seçilmiş
 * gibi gelir, `useExpenseOwners` › `company`); yoksa kendi şirketim (OWN).
 */
export const initialHead = (company = OWN) => ({
  owner: SELF,
  company: company || OWN,
  title: null,
})

const MONTH = { month: "long" }
const YEAR = { year: "2-digit" }
// Açıklamadaki kanal adı: masrafın hangi yoldan girildiği ERP'de okunsun; çevrilmez.
const CHANNEL = "TYRO Self Servis"

/**
 * Varsayılan açıklama: ilk kalemin ayı · kanal · masraf sahibinin adı — "Ekim 26 | TYRO Self Servis | Ayşe
 * Demir"; tarih yoksa bugünün ayı, ad yoksa son parça düşer. Ad `titleName`den: kendi
 * masrafında kişinin kendi adı, başkası adına girilende o kişinin adı.
 */
export function defaultTitle(t, locale, date, name = "") {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date()
  const month = getDateTimeFormat(locale, MONTH).format(d)
  const when = t("selfService.form.head.titleMonth", {
    month: month.charAt(0).toLocaleUpperCase(locale) + month.slice(1),
    year: getDateTimeFormat(locale, YEAR).format(d),
  })
  return [when, CHANNEL, String(name ?? "").trim()].filter(Boolean).join(" | ")
}

/**
 * Açıklamadaki ad: masrafın SAHİBİ. Kendim seçiliyse `selfName`;
 * başkası adına girilen masrafta "Kimin adına" listesindeki adı (`owners`: `{ name, email }`),
 * liste henüz gelmediyse e-postası — girenin adı yazılmaz, masraf onun değil.
 */
export function titleName(head, owners, selfName = "") {
  const email = head?.owner
  if (!email || email === SELF) return selfName
  return (owners ?? []).find((o) => o.email === email)?.name || email
}

/** Gönderilecek açıklama: kişinin yazdığı, boşsa varsayılan. */
export const titleOf = (head, fallback) => String(head?.title ?? "").trim() || fallback

/** Başlık kişinin dokunduğu bir değer taşıyor mu (dolu form sormadan kapanmaz). `base`: boş başlık. */
export const headChanged = (head, base = initialHead()) =>
  head.owner !== base.owner ||
  head.company !== base.company ||
  String(head.title ?? "").trim() !== ""

/** "Kendim için" ya da "Kerem Aydın (timur.karaman@…) adına". */
export function ownerPhrase(t, owner) {
  if (!owner || owner === SELF || !owner.email) return t("selfService.form.owner.self")
  return t("selfService.form.owner.other", { name: owner.name || owner.email, mail: owner.email })
}

/** Başlığın yan cümleleri: şirket (kod ya da "kendi şirketim") ve masraf açıklaması. */
export function headClauses(t, { company, title }) {
  const name = !company || company === OWN ? t("myspace.company.own") : company
  const out = t("myspace.clause.company", { value: name })
  return title ? out + t("selfService.form.clause.title", { value: title }) : out
}
