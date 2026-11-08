// Kurgusal organizasyon: her veri setinde AYNI kişiler (ad ve unvan sabit); posta, toplantı ve görev
// içeriği sektöre göre değişir. Tüm kişiler uydurmadır.
import { PERSONA, TENANT_ID } from "./persona.js"

const guid = (n) => `a7c1e0${String(n).padStart(2, "0")}-3b5d-4f60-9a1c-${String(1000 + n).padStart(12, "0")}`

export const ascii = (s) =>
  String(s)
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")

export const slug = (s) => ascii(s).replace(/[^a-z0-9]+/g, "")

function person(n, displayName, jobTitle, department, extra = {}) {
  const [given, ...rest] = displayName.split(" ")
  const surname = rest.join(" ")
  const mail = `${ascii(given)}.${ascii(surname)}@tyrotech.example`
  return {
    id: guid(n),
    displayName,
    givenName: given,
    surname,
    mail,
    userPrincipalName: mail,
    jobTitle,
    department,
    companyName: PERSONA.companyName,
    officeLocation: "İstanbul · Maslak",
    mobilePhone: `+90 555 010 ${String(20 + n).padStart(2, "0")} ${String(10 + n).padStart(2, "0")}`,
    businessPhones: [`+90 212 555 01 ${String(20 + n).padStart(2, "0")}`],
    initials: `${given[0]}${surname[0] ?? ""}`,
    tenantId: TENANT_ID,
    ...extra,
  }
}

const me = {
  id: PERSONA.id,
  displayName: PERSONA.displayName,
  givenName: PERSONA.givenName,
  surname: PERSONA.surname,
  mail: PERSONA.mail,
  userPrincipalName: PERSONA.userPrincipalName,
  jobTitle: PERSONA.jobTitle,
  department: PERSONA.department,
  companyName: PERSONA.companyName,
  officeLocation: PERSONA.officeLocation,
  mobilePhone: PERSONA.mobilePhone,
  businessPhones: PERSONA.businessPhones,
  initials: PERSONA.initials,
}

/** Ömer'in yöneticisi. */
export const MANAGER = person(1, "Selin Aydın", "Satış Direktörü", "Satış")

/** Ömer'in doğrudan raporları (satış ekibi). */
export const REPORTS = [
  person(11, "Zeynep Acar", "Kurumsal Satış Uzmanı", "Satış"),
  person(12, "Kaan Özdemir", "Bölge Satış Temsilcisi", "Satış"),
  person(13, "Derya Çelik", "Satış Operasyon Uzmanı", "Satış"),
  person(14, "Onur Polat", "Kanal Satış Uzmanı", "Satış"),
  person(15, "Gizem Tunç", "Müşteri İlişkileri Uzmanı", "Satış"),
]

/** Diğer bölümlerden iş arkadaşları. */
export const COLLEAGUES = [
  person(21, "Can Yıldız", "Finans Müdürü", "Finans"),
  person(22, "Mert Aksoy", "Operasyon Müdürü", "Operasyon"),
  person(23, "Emre Şahin", "Pazarlama Müdürü", "Pazarlama"),
  person(24, "Ayşe Demir", "İnsan Kaynakları Uzmanı", "İnsan Kaynakları"),
  person(25, "Deniz Arslan", "Ürün Yöneticisi", "Ürün"),
  person(26, "Elif Kaya", "Yapay Zekâ Mühendisi", "Ürün"),
]

export const ME = me
export const EVERYONE = [me, MANAGER, ...REPORTS, ...COLLEAGUES]

export const byMail = (mail) =>
  EVERYONE.find((p) => p.mail.toLowerCase() === String(mail ?? "").toLowerCase()) ?? null
export const byId = (id) => EVERYONE.find((p) => p.id === id) ?? null
export const byName = (name) => EVERYONE.find((p) => p.displayName === name) ?? null

/** "Ad Soyad" → e-posta (kadroda yoksa üretir). */
export function mailOf(name) {
  return byName(name)?.mail ?? `${name.toLocaleLowerCase("tr").replace(/\s+/g, ".")}@musteri.example`
}

/** Graph kullanıcı nesnesi (alan seçimi yok: uygulama istediğini okur). */
export function graphUser(p) {
  return {
    "@odata.type": "#microsoft.graph.user",
    id: p.id,
    displayName: p.displayName,
    givenName: p.givenName,
    surname: p.surname,
    mail: p.mail,
    userPrincipalName: p.userPrincipalName,
    jobTitle: p.jobTitle,
    department: p.department,
    companyName: p.companyName,
    officeLocation: p.officeLocation,
    mobilePhone: p.mobilePhone,
    businessPhones: p.businessPhones,
    preferredLanguage: "tr-TR",
  }
}

/**
 * Veri seti metnindeki kişi tanımı → { name, address, org?, internal? }.
 * "Selin Aydın" kadrodadır; "Hakan Öz (Anadolu Ev)" dış müşteri kişisidir (adres alan adı firmadan
 * üretilir, hep `.example`); nesne verilirse olduğu gibi alınır.
 */
export function resolvePerson(spec) {
  if (spec && typeof spec === "object") {
    return { name: spec.name, address: spec.address ?? `${slug(spec.name)}@musteri.example`, org: spec.org }
  }
  const m = String(spec).match(/^(.*?)\s*(?:\((.*)\))?$/)
  const name = m[1].trim()
  const org = m[2]?.trim()
  const known = byName(name)
  if (known) return { name: known.displayName, address: known.mail, internal: true }
  const [first, ...rest] = name.split(/\s+/)
  return { name, address: `${ascii(first)}.${ascii(rest.join(""))}@${org ? slug(org) : "musteri"}.example`, org }
}
