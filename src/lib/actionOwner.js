/**
 * Toplantı görevlerinden "bana düşenler". Copilot görev sahibini serbest metin olarak verir
 * (`ownerDisplayName`); ayrım yalnız ad KESİN eşleşince yapılır: büyük/küçük harf, Türkçe ve
 * öteki aksanlar, sözcük sırası ("Gümüş, Ömer") önemsiz; eksik ya da fazla sözcük eşleşmez.
 * Tek sözcüklük ad (yalnız "Ömer") güvenilmez: başka biri de olabilir.
 */
const fold = (text) =>
  String(text ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")

/** Adın karşılaştırma anahtarı: küçük harf, aksansız, sözcükler sıralı. */
export const nameKey = (name) =>
  fold(name)
    .split(/[\s,.;()]+/)
    .filter(Boolean)
    .sort()
    .join(" ")

/**
 * Görevleri böl: `{ mine, others }` (dizinler) — en az biri kişiye düşüyorsa; yoksa `null` ("Sana 0"
 * yazılmaz, kart her şeyi birlikte gösterir). `names`: kişinin görünen adları (hesap adı vb.).
 */
export function splitMine(actions, names) {
  const keys = new Set(names.map(nameKey).filter((key) => key.includes(" ")))
  if (!keys.size || !actions?.length) return null
  const mine = []
  const others = []
  actions.forEach((a, i) => (a.owner && keys.has(nameKey(a.owner)) ? mine : others).push(i))
  return mine.length ? { mine, others } : null
}
