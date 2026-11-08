/**
 * Aynı anda tek açık örnek (kişi kartı gibi): `claim(sahip, kapat)` açık olanı kapatıp yerine
 * geçer, `release(sahip)` yalnız hâlâ sahibiyse bırakır. Sahip örneğin sabit kimliği (`useId`).
 * `handedOff(sahip)`: bu örnek başka biri açıldığı için mi kapandı (bir kez okunur) — kapanan
 * örnek odağı kendi tetiğine geri vermesin, yoksa yeni açılan "dışarı odaklanıldı" diye kapanır.
 */
let active = null
const passed = new Set()

export function claim(owner, close) {
  if (active && active.owner !== owner) {
    passed.add(active.owner)
    active.close()
  }
  active = { owner, close }
}

export function release(owner) {
  if (active?.owner === owner) active = null
}

export function handedOff(owner) {
  return passed.delete(owner)
}
