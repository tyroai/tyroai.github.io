/**
 * "KİMİN ADINA" — kişinin masraf girebileceği kişiler (saf). Kaynak İK MCP'sinin
 * `list_expense_owners`ıyla aynı tablo: `mserp_tryaiexpensedelegationentities`, `delegatedemail`
 * = kişinin e-postası, şirket `hrms`. Satır, yetkiyi VEREN kişiyi (`delegatingemail`) taşır.
 * Süresi dolmuş ya da henüz başlamamış yetki listeye girmez: ERP o kişi adına masrafı reddeder.
 */

export const DELEGATION_SET = "mserp_tryaiexpensedelegationentities"
export const DELEGATION_SELECT =
  "mserp_delegatingemail,mserp_tryadusername,mserp_fromdateutc,mserp_todateutc"

const lower = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
// ERP boş bitiş tarihini 1900 olarak tutar: süresiz yetki.
const OPEN_END = "1901"

/** Yetki şu an geçerli mi (`from` ≤ şimdi ≤ `to`; bitişsiz yetki süresiz). */
export function isActiveDelegation(row, now = new Date()) {
  const iso = now.toISOString()
  const from = row?.mserp_fromdateutc
  const to = row?.mserp_todateutc
  if (from && from > iso) return false
  return !to || to < OPEN_END || to >= iso
}

/** "timur.karaman" → "Kerem Aydın" — ad okunamazsa gösterilecek yedek. */
export function nameFromAlias(alias) {
  return String(alias ?? "")
    .split("@")[0]
    .split(/[._\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr") + w.slice(1).toLocaleLowerCase("tr"))
    .join(" ")
}

/** ERP adları tümü büyük ("TİMUR KARAMAN"): Türkçe kuralıyla baş harfler büyük. */
export function titleCaseName(raw) {
  return String(raw ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const l = w.toLocaleLowerCase("tr")
      return l.charAt(0).toLocaleUpperCase("tr") + l.slice(1)
    })
    .join(" ")
}

/**
 * Yetki satırları → `[{ email, name }]`: yalnız geçerli yetkiler, kişi başına bir kez, kişinin
 * kendisi hariç (o "Kendim"), ada göre sıralı. `names`: e-posta (küçük harf) → ERP'deki ad.
 */
export function ownersFromDelegations(rows, { self = [], names = {}, now = new Date() } = {}) {
  const mine = new Set(self.map(lower))
  const seen = new Map()
  for (const r of rows ?? []) {
    const email = String(r?.mserp_delegatingemail ?? "").trim()
    const key = lower(email)
    if (!key || mine.has(key) || seen.has(key) || !isActiveDelegation(r, now)) continue
    const name = names[key] || nameFromAlias(r.mserp_tryadusername || email)
    seen.set(key, { email: key, name })
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"))
}

/** Yetki süzgeci: kişinin e-posta adlarından biri ve İK şirketi (`hrms`). */
export function delegationFilter(aliases) {
  const quote = (v) => `'${String(v).replace(/'/g, "''")}'`
  const who = aliases.map((a) => `mserp_delegatedemail eq ${quote(a)}`).join(" or ")
  return `(${who}) and mserp_dataareaid1 eq 'hrms'`
}
