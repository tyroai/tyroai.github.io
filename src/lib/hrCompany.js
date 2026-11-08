import { anyOf, chunks, quote } from "@/lib/selfServiceOdata"

/**
 * Kişinin ŞİRKETİ İK görünümünden (saf; istek `hooks/useHrCompany.js`te). Self Servis profili,
 * Ekibim, izin formu ve sohbetteki izin formu şirketi buradan okur;
 * okunamazsa (yetki yok, kayıt yok, belirsiz) çağıran Graph'ın `companyName`ına düşer. Görünüm
 * Anasayfa tebrikleriyle aynı: `mserp_tryhcmemploymentdetaildomesticactiveviewentities`.
 *
 * EŞLEŞME ÖNCE PERSONNEL NUMBER, SONRA MAIL — ölçüldü (687 ERP kullanıcısı):
 * - Görünümde personnel number tekil (1.257 satır, 1.257 numara); mail değil — 3 kişi iki şirkette
 *   iki ayrı çalışan kaydıyla duruyor (ör. TEMA + EDGA) ve doğrusu kişinin ERP kaydındaki numara.
 * - Kişinin ERP numarasıyla (`mserp_tryaiworkersentities` → `borax_oldemplid`) 588'i bulunuyor,
 *   yalnız maille 479'u: görünümde 536 adres `@tyroholding.onmicrosoft.com`.
 * - Numara yoksa ve aynı maille birden çok şirket dönerse ŞİRKET SEÇİLMEZ (null): uydurmaktansa
 *   Graph'ın değeri kalır.
 */

export const COMPANY_SELECT =
  "mserp_mail,mserp_personnelnumber,mserp_companyinfodataarea,mserp_companyname"

const text = (v) => String(v ?? "").trim()
const lower = (v) => text(v).toLowerCase()

/** Sorgu parametreleri: personnel number (kesin) ve adresler (20'lik `or` öbekleri). */
export function companyParams({ personnel, addresses } = {}) {
  const out = []
  const number = text(personnel)
  if (number)
    out.push({ $select: COMPANY_SELECT, $filter: `mserp_personnelnumber eq ${quote(number)}` })
  const list = [...new Set((addresses ?? []).map(lower))].filter(Boolean)
  for (const part of chunks(list))
    out.push({ $select: COMPANY_SELECT, $filter: anyOf("mserp_mail", part) })
  return out
}

/** Görünüm satırı → `{ personnel, mail, code, name }`; şirketi olmayan satır null. */
export function toCompany(row) {
  const code = text(row?.mserp_companyinfodataarea).toUpperCase()
  if (!code) return null
  return {
    personnel: text(row.mserp_personnelnumber),
    mail: lower(row.mserp_mail),
    code,
    name: text(row.mserp_companyname),
  }
}

/**
 * Kişinin şirketi → `{ code, name }` ya da null. `list`: `toCompany` çıktıları (aynı satır iki
 * sorgudan gelebilir). Önce personnel number; yoksa adresle eşleşen TEK şirket.
 */
export function pickCompany(list, { personnel, addresses } = {}) {
  const rows = (list ?? []).filter(Boolean)
  const number = text(personnel)
  const exact = number && rows.find((r) => r.personnel === number)
  if (exact) return { code: exact.code, name: exact.name }
  const mails = new Set((addresses ?? []).map(lower).filter(Boolean))
  const byMail = rows.filter((r) => r.mail && mails.has(r.mail))
  const codes = [...new Set(byMail.map((r) => r.code))]
  return codes.length === 1 ? { code: byMail[0].code, name: byMail[0].name } : null
}
