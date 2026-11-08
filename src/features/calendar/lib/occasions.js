import { addDays } from "@/lib/leaveDays"
import { windowOccasions } from "@/lib/teamOccasions"

/**
 * Takvimin kutlama kaynakları (saf, testli): ekip (ve kendim) için İK tarihlerinden herhangi bir
 * pencere; departman arkadaşları için şirket listesinin bugünden 14 günlük dilimi (ek istek yok).
 * Doğum YILI ve yaş hiçbir yerde yok: yalnız gün-ay ve kaçıncı iş yılı.
 */

const lower = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()

/**
 * Kişiler ve İK tarihleri (`useTeamDates`) → görünen pencerenin doğum günleri ve iş yıl
 * dönümleri: `[{ person, occasion, self }]`. `person` satır anahtarıyla (`key`) zenginleşir;
 * `self` kişinin kendisi (`relation: "self"`). `first`–`last` uçlar dahil, yerel gece yarısı.
 */
export function teamOccasionEntries(people, dates, first, last, today) {
  const rows = (people ?? [])
    .map((person) => ({ key: lower(person.address || person.upn), person }))
    .filter((r) => r.key)
  const found = windowOccasions(rows, dates, first, last, today)
  return rows.flatMap((r) =>
    (found.get(r.key) ?? []).map((occasion) => ({
      person: { ...r.person, key: r.key },
      occasion,
      self: r.person.relation === "self",
    })),
  )
}

/**
 * Şirket kutlama listesinden (`useCelebrations`: bugünden 14 gün; her çizimde YENİ nesne) yalnız
 * `pick(posta)` doğru olanlar, düz bir özet dizisi olarak. Dizi bellek anahtarı: içerik aynıysa
 * dize de aynı, yani yeniden hesap yok.
 */
export function celebrationSignature(celebrations, pick) {
  if (celebrations?.status !== "ready") return ""
  const line = (kind, p) => [kind, p.key, p.name, p.mail ?? "", p.inDays, p.years ?? ""].join("\t")
  return [
    ...(celebrations.birthdays ?? []).filter((p) => pick(p.mail)).map((p) => line("birthday", p)),
    ...(celebrations.anniversaries ?? [])
      .filter((p) => pick(p.mail))
      .map((p) => line("anniversary", p)),
  ].join("\n")
}

/** `celebrationSignature` → `[{ person, occasion, self: false }]`; gün = bugün + `inDays`. */
export function occasionsFromSignature(signature, today) {
  if (!signature) return []
  return signature.split("\n").map((row) => {
    const [kind, key, name, mail, inDays, years] = row.split("\t")
    const date = addDays(today, Number(inDays))
    const occasion = { kind, date, inDays: Number(inDays) }
    if (kind === "anniversary") occasion.years = Number(years)
    return {
      person: { key: lower(mail) || key, name, address: lower(mail) },
      occasion,
      self: false,
    }
  })
}
