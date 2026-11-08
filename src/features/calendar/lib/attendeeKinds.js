/**
 * Katılımcının türü (zorunlu · isteğe bağlı), saf ve testli. Tek `people` dizisi iki seçiciyi besler:
 * isteğe bağlı kişide `optional: true` var, zorunluda alan yok; böylece türü olmayan eski kayıtlar
 * zorunlu sayılır ve dizi biçimi bozulmaz. Bir kişi tek listededir: birine eklenen öbüründen çıkar.
 */

const lower = (s) => String(s ?? "").toLowerCase()

export const isOptional = (p) => Boolean(p?.optional)

/** Graph'ın `attendees[].type` değeri. */
export const attendeeType = (p) => (isOptional(p) ? "optional" : "required")

/** İki seçicinin listeleri: `{ required, optional }` (sıra korunur). */
export function splitPeople(people) {
  const required = []
  const optional = []
  for (const p of people) (isOptional(p) ? optional : required).push(p)
  return { required, optional }
}

const plain = (p) => {
  const copy = { ...p }
  delete copy.optional
  return copy
}

/**
 * Bir seçicinin yeni listesini (`list`: o seçicinin ekle/kaldır sonrası hâli) `people`ya işler.
 * `optional`: hangi seçici. Listedeki kişi öbür türden çıkar (taşınmış olur); dizi her zaman
 * zorunlular önce, isteğe bağlılar sonra.
 */
export function withKind(people, list, optional) {
  const mine = list.map((p) => (optional ? { ...p, optional: true } : plain(p)))
  const taken = new Set(mine.map((p) => lower(p.address)))
  const split = splitPeople(people)
  const others = (optional ? split.required : split.optional).filter(
    (p) => !taken.has(lower(p.address)),
  )
  return optional ? [...others, ...mine] : [...mine, ...others]
}

/** Adresteki kişiyi öbür türe taşır; kişi yoksa dizi aynen döner. */
export function moveAttendee(people, address, optional) {
  const person = people.find((p) => lower(p.address) === lower(address))
  if (!person || isOptional(person) === optional) return people
  const { required, optional: opt } = splitPeople(people)
  return withKind(people, [...(optional ? opt : required), person], optional)
}
