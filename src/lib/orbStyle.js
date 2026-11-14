/**
 * ORB GÖRÜNÜMÜ — herkeste maskot. Küre · maskot seçimi (Profil › Görünüm) kaldırıldı: orb her
 * yerde (giriş, Anasayfa, sohbet) varsayılan görünümde çizilir. Eski seçimin kaydı
 * (`tyro-orb-style-v1`) okunmaz; açılışta silinir (`cacheMigration`). Çağrı yerleri görünümü
 * yine tek addan okur (`useOrbStyle`).
 */
export const ORB_STYLE = "mascot"

/** Kaldırılan seçimin tarayıcıda kalmış kaydı (yalnız temizlik için). */
export const LEGACY_ORB_STYLE_KEY = "tyro-orb-style-v1"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  MASKOTUN AYARLARI — Orb oluşturucu sekmesinden kısılır
 * ═══════════════════════════════════════════════════════════════════════
 *
 * İstek: *"diğer parametreleri de profildeki yeni orb oluşturucuya koy ki
 * diğer özellikleri modifiye oradan edebilelim; cam parlaklığını vb. oradan
 * kısarız."*
 *
 * ⚠️ **BURADA OLAN VE OLMAYAN.** Bu kayıt maskotun GÖRÜNÜŞ ayarlarını taşır
 * (ifade · cam parlaklığı · ışık · hız · göz kırpma · imleç takibi · mesh).
 * Taşımadığı iki şey var ve ikisi de bilinçli:
 *
 *   • **RENK** — paletten gelir (`mascotPalette.js`). Maskotun kendi 12
 *     paleti var ama uygulamanın 17 paleti zaten kullanıcının seçimi; ikinci
 *     bir renk tercihi "orb neden paletimden farklı" sorusunu doğururdu.
 *     Login bunun dışında: orası kurumsal palete sabit (`LOGIN_PALETTE`).
 *   • **AGENT DURUMU** — yüzeyin ve canlı ajan durumunun işi (`BrandOrb`).
 *     Sohbette küre gerçekten dinliyor/düşünüyor/konuşuyor; kayıtlı bir
 *     "durum" onu ezip ekrandaki tek canlı göstergeyi yalancı yapardı.
 *
 * Stüdyodaki palet · ifade · durum seçicileri ÖNİZLEMEYE aittir; yalnız
 * yukarıdaki yedi alan diske yazılır.
 *
 * ⚠️ **ANLIK GÖRÜNTÜ ÖNBELLEKLENİR.** `useSyncExternalStore` okuyucunun
 * DÖNDÜĞÜ DEĞERİ kimlikle karşılaştırıyor; her çağrıda `JSON.parse` yeni bir
 * nesne döndürür ve React sonsuz döngüye girer. Bu yüzden ham dize ile
 * çözülmüş nesne birlikte saklanıyor ve ham dize değişmedikçe AYNI nesne
 * dönüyor.
 */
/**
 * ⚠️ **`-v2`: VARSAYILANLAR DEĞİŞTİ VE ESKİ KAYIT ONLARI BLOKLUYORDU**
 * (2026-09-13, istek üzerine: *"cam parlaklığını %5'e düşür, ışık yoğunluğunu
 * biraz daha artır, mesh'i biraz daha yay"*). v1 kaydı YEDİ ALANIN HEPSİNİ
 * yazıyordu — dokunulmamış olanları da — yani stüdyoyu bir kez açmış kişi
 * yeni varsayılanları HİÇ görmezdi. Anahtar bir kez atlıyor.
 *
 * ⚠️ **VE KAYIT ARTIK YALNIZ DOKUNULAN ALANI TUTUYOR.** `writeMascotSettings`
 * varsayılanları değil, o ana kadar YAZILMIŞ alanları temel alıyor; okuma
 * varsayılanların ÜSTÜNE biniyor. Böylece bir sonraki varsayılan değişikliği
 * için üçüncü bir sürüm atlamak gerekmeyecek: kişi neyi elle değiştirdiyse o
 * kalır, gerisi yeni varsayılanı alır. (Aynı ayrım paletin `defaultsMigration`
 * turunda da öğrenilmişti: "seçmedim" ile "seçtim" ayırt edilebilmeli.)
 */
const SETTINGS_KEY = "tyro-orb-mascot-v2"
const SETTINGS_EVENT = "tyro:orb-mascot"

/**
 * ⚠️ **VARSAYILANLAR İSTEKTE YAZILI.** *"Loginde ifade nötr olacak, mesh ışığı
 * açık olacak varsayılan; dashboard'da da aynı."* Gerisi maskot kaynağının
 * kendi varsayılanları (`TyroMascot.jsx`: glow .55, gloss .8, speed 1, blink
 * ve followPointer açık) — uyarlanan eksen sayılıdır, dokunulmadı.
 *
 * ⚠️ `mesh` kaynakta `false`, burada `true`: istek açıktı.
 */
export const DEFAULT_MASCOT_SETTINGS = Object.freeze({
  expression: "neutral",
  mesh: true,
  // ⚠️ Sahada görülüp istendi: cam parlaklığı 0,8 → 0,05 ("%5'e düşür"), ışık
  // 0,55 → 0,75. Kaynağın kendi değerleri sırasıyla 0,8 · 0,55 · 1,0 · 1,0.
  glow: 0.75,
  gloss: 0.05,
  // ⚠️ **MESH ÜÇ TURDA OTURDU.** Önce 1,35 / 1,25 denendi ("biraz daha
  // yoğunlaştır ve yay"), ertesi gün geri çekildi (*"mesh çok fazla oldu,
  // azalt"* → 1,0 / 1,12) ve yayılım aynı gün bir kez daha kısıldı
  // (*"mesh spread'i 1,05'e çek"*). Yoğunluk kaynağın kendi düzeyinde;
  // yayılım artık yalnızca bir fısıltı kadar yukarıda.
  meshIntensity: 1,
  meshSpread: 1.05,
  speed: 1,
  blink: true,
  follow: true,
})

const clamp01 = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback

/** Maskot kaynağının kendi hız sınırı (`mascot.mjs`: clamp(speed,1,.4,2)). */
const clampSpeed = (value) =>
  Number.isFinite(value) ? Math.max(0.4, Math.min(2, value)) : DEFAULT_MASCOT_SETTINGS.speed

/**
 * Mesh çarpanları. Tavan 2,0: kaynağın en parlak durağı 0,5 ve `MascotMesh`
 * onu 1,0'a kırpıyor, yani daha yukarısı hiçbir şey yapmaz. Taban 0,5 —
 * altında ışık zaten görünmüyor ve "kapat" için `mesh` bayrağı var.
 */
const clampMesh = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0.5, Math.min(2, value)) : fallback

/**
 * Diskten okunan nesne SAHADAN GELİR — eski bir sürüm, elle düzenlenmiş bir
 * kayıt ya da yarım yazılmış bir JSON olabilir. Her alan tek tek süzülür;
 * tanınmayan alan düşer, bozuk değer varsayılana iner.
 */
function normalizeSettings(raw) {
  if (!raw || typeof raw !== "object") return DEFAULT_MASCOT_SETTINGS
  return {
    expression:
      typeof raw.expression === "string" && raw.expression
        ? raw.expression
        : DEFAULT_MASCOT_SETTINGS.expression,
    mesh: typeof raw.mesh === "boolean" ? raw.mesh : DEFAULT_MASCOT_SETTINGS.mesh,
    glow: clamp01(raw.glow, DEFAULT_MASCOT_SETTINGS.glow),
    gloss: clamp01(raw.gloss, DEFAULT_MASCOT_SETTINGS.gloss),
    meshIntensity: clampMesh(raw.meshIntensity, DEFAULT_MASCOT_SETTINGS.meshIntensity),
    meshSpread: clampMesh(raw.meshSpread, DEFAULT_MASCOT_SETTINGS.meshSpread),
    speed: clampSpeed(raw.speed),
    blink: typeof raw.blink === "boolean" ? raw.blink : DEFAULT_MASCOT_SETTINGS.blink,
    follow: typeof raw.follow === "boolean" ? raw.follow : DEFAULT_MASCOT_SETTINGS.follow,
  }
}

let cachedRaw = null
let cachedSettings = DEFAULT_MASCOT_SETTINGS

export function readMascotSettings() {
  if (typeof window === "undefined") return DEFAULT_MASCOT_SETTINGS
  let raw
  try {
    raw = window.localStorage.getItem(SETTINGS_KEY)
  } catch {
    return DEFAULT_MASCOT_SETTINGS
  }
  if (raw === cachedRaw) return cachedSettings
  cachedRaw = raw
  if (!raw) {
    cachedSettings = DEFAULT_MASCOT_SETTINGS
    return cachedSettings
  }
  try {
    cachedSettings = normalizeSettings(JSON.parse(raw))
  } catch {
    cachedSettings = DEFAULT_MASCOT_SETTINGS
  }
  return cachedSettings
}

/**
 * Kısmi güncelleme: stüdyo tek bir kaydırıcıyı oynattığında gerisi kalır.
 *
 * ⚠️ **YALNIZ DOKUNULAN ALAN YAZILIR.** Temel `readMascotSettings()` DEĞİL,
 * diskteki HAM kayıt — yoksa ilk dokunuşta yedi alanın hepsi (o günün
 * varsayılanlarıyla) çakılır ve bir sonraki varsayılan değişikliği o kişiye
 * hiç ulaşmaz. Gerekçe `SETTINGS_KEY`in yanında.
 */
export function writeMascotSettings(patch) {
  if (typeof window === "undefined") return
  let stored
  try {
    stored = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}")
  } catch {
    // Bozuk kayıt: temiz sayfadan devam. Kaybolan şey yalnız eski tercih.
  }
  if (!stored || typeof stored !== "object") stored = {}
  const next = { ...stored, ...patch }
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    // Depolama kapalı — seçim bu oturumda görünür.
  }
  window.dispatchEvent(new Event(SETTINGS_EVENT))
}

export function resetMascotSettings() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(SETTINGS_KEY)
  } catch {
    // Depolama kapalı.
  }
  window.dispatchEvent(new Event(SETTINGS_EVENT))
}

export function subscribeMascotSettings(callback) {
  window.addEventListener(SETTINGS_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(SETTINGS_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}
