/**
 * Kişinin sabit tonu (ada göre): aynı kişi her yerde aynı renkte — toplantı kartındaki katılımcılar
 * ve Güvenlik'teki kullanıcılar. Palet markaya bağlı değil: palet değişince kişinin rengi
 * değişseydi avatar kimlik ipucu olmaktan çıkardı.
 */
const PERSON_HUES = [230, 25, 145, 300, 340, 65, 190]

/** Kişinin sabit renk tonu (derece): avatarla birlikte takvimdeki paylaşılan kayıtları da boyar. */
export function personHue(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return PERSON_HUES[Math.abs(hash) % PERSON_HUES.length]
}

export function personTone(name) {
  const hue = personHue(name)
  return {
    backgroundColor: `oklch(0.88 0.055 ${hue})`,
    color: `oklch(0.42 0.11 ${hue})`,
  }
}
