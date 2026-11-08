/**
 * Anasayfa'daki "TYRO'yu yükle" kartının kaydı: kaç açılış oldu, bu oturumda "Şimdi değil" dendi mi.
 * Kart ilk açılışta değil ikinciden itibaren çıkar (uygulamayı tanımayan kişiye kurulum önermek
 * ret alır). "Şimdi değil" ya da tarayıcının penceresinde vazgeçmek kartı yalnız BU OTURUMDA
 * kapatır: uygulama yüklü değilse sonraki oturum (yeni sekme ya da pencere) yine önerir. Sayaç
 * kalıcı (localStorage), vazgeçme oturumluk (sessionStorage). Kullanıcı menüsündeki satır her
 * zaman durur. Kişisel veri değil: yalnız sayaç ve bayrak.
 */
export const PROMO_KEY = "tyro-pwa-promo-v1"
export const PROMO_LATER_KEY = "tyro-pwa-promo-later"
export const PROMO_MIN_VISITS = 2

const EMPTY = { visits: 0, dismissed: false }
let state = null
const listeners = new Set()

function readVisits() {
  try {
    return Number(JSON.parse(localStorage.getItem(PROMO_KEY) ?? "null")?.visits) || 0
  } catch {
    return 0
  }
}

function readLater() {
  try {
    return sessionStorage.getItem(PROMO_LATER_KEY) === "1"
  } catch {
    return false
  }
}

// Yalnız sayaç yazılır: eski kayıttaki kalıcı `dismissed` bayrağı ilk yüklemede düşer.
function writeVisits(visits) {
  try {
    localStorage.setItem(PROMO_KEY, JSON.stringify({ visits }))
  } catch {
    // Özel pencere ya da kapalı depolama: kart bu yüklemede yine doğru davranır.
  }
}

/** Bu yüklemenin kaydı; ilk okunuşta açılış sayısı bir artar (yükleme başına bir kez). */
export function promoState() {
  if (state) return state
  if (typeof window === "undefined") return EMPTY
  state = { visits: readVisits() + 1, dismissed: readLater() }
  writeVisits(state.visits)
  return state
}

export function subscribePromo(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function dismissPromo() {
  state = { ...promoState(), dismissed: true }
  try {
    sessionStorage.setItem(PROMO_LATER_KEY, "1")
  } catch {
    // Depolama kapalı: kart bu yüklemede kapalı kalır, yenileyince yine önerilir.
  }
  listeners.forEach((fn) => fn())
}

/** Kart görünsün mü: kurulabilir (ya da iPhone/iPad tarifi), bu oturumda ertelenmedi, ikinci açılıştan beri. */
export function promoVisible(promo, pwa) {
  return !promo.dismissed && promo.visits >= PROMO_MIN_VISITS && (pwa.canPrompt || pwa.ios)
}

/** Yalnız testler için: modülün bellekteki kaydını sıfırlar. */
export function resetPromoForTest() {
  state = null
}
