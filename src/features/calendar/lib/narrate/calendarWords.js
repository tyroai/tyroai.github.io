import { stem } from "@/lib/narrate/text"

/**
 * Takvim Anlat'ının kelime tabloları (katlanmış yazı). Her giriş `[kök, ek payı]`: kelime kökle
 * başlar ve en çok o kadar harf ek taşır ("toplantısı" ← toplanti, "demokrasi" ← demo DEĞİL).
 */

/** Toplantı kelimeleri: biri geçerse cümle toplantıdır. */
export const MEETING_WORDS = [
  ["toplanti", 6],
  ["gorusme", 6],
  ["gorusel", 4],
  ["sunum", 5],
  ["randevu", 5],
  ["call", 3],
  ["meeting", 3],
  ["demo", 3],
  ["mulakat", 5],
  ["calistay", 5],
  ["workshop", 3],
  ["webinar", 3],
  ["seminer", 5],
  ["brifing", 4],
  ["birebir", 4],
  ["ziyaret", 5],
]

/** Görev kelimeleri ("-e kadar" ayrıca aranır). */
export const TASK_WORDS = [
  ["gorev", 6],
  ["yapilacak", 6],
  ["hatirlat", 8],
  ["teslim", 6],
  ["unutma", 4],
]

/**
 * Kişi olmayanlar: öbekler ve unvanlar ("ekibiyle", "müşteriyle"), zamirler ("benimle") ve araçlar
 * ("arabayla", "kahveyle"): katılımcı sayılmaz, konuda kalır.
 */
const NOT_PEOPLE = [
  ["ekip", 6],
  ["ekib", 4],
  ["takim", 6],
  ["departman", 6],
  ["yonetim", 6],
  ["musteri", 6],
  ["tedarikci", 6],
  ["firma", 6],
  ["sirket", 6],
  ["grup", 6],
  ["grub", 4],
  ["herkes", 5],
  ["mudur", 6],
  ["yonetici", 6],
  ["direktor", 6],
  ["arkadas", 6],
  ["ortak", 6],
  ["ortag", 3],
  ["bayi", 4],
  ["calisan", 6],
  ["personel", 6],
  ["komite", 5],
  ["kurul", 5],
  ["birim", 5],
  ["bolum", 5],
  ["muhasebe", 5],
  ["banka", 5],
  // "benimle", "onunla": katılımcı değil
  ["benim", 4],
  ["bizim", 4],
  ["onun", 4],
  ["senin", 4],
  ["sizin", 4],
  ["kendi", 4],
  ["araba", 4],
  ["otobus", 4],
  ["tren", 3],
  ["ucak", 3],
  ["ucag", 3],
  ["taksi", 3],
  ["kahve", 4],
  ["cay", 3],
  ["yemek", 4],
  ["yemeg", 3],
  ["kahvalti", 3],
  ["telefon", 4],
  ["eposta", 3],
  ["mail", 3],
  ["mesaj", 4],
  ["posta", 3],
  ["kargo", 3],
  ["kisi", 4],
]

// Ad olamayacak yapı kelimeleri (tam eşleşme).
const FUNCTION_WORDS = new Set([
  "ve",
  "ile",
  "ya",
  "da",
  "de",
  "ki",
  "ama",
  "icin",
  "gibi",
  "kadar",
  "sonra",
  "once",
  "bugun",
  "yarin",
  "bu",
  "su",
  "bir",
  "bi",
  "her",
  "cok",
  "lutfen",
  "var",
  "yok",
  "ben",
  "biz",
  "sen",
  "siz",
  "saat",
])

/** Hitap sözleri: ad değildir, adın yanındaysa atılır ("Ahmet Bey ile"). */
export const HONORIFICS = new Set([
  "bey",
  "hanim",
  "hoca",
  "hocam",
  "abi",
  "abla",
  "sayin",
  "dr",
  "doktor",
  "prof",
])

/** Kelime tablodaki köklerden biriyle başlıyor mu. */
export const hasRoot = (word, table) => table.some(([root, max]) => stem(word, root, max))

/** Kelimelerden biri tabloda mı. */
export const hasWord = (list, table) => list.some((w) => hasRoot(w, table))

/** Katlanmış kelime (noktalamasız) bir ad olabilir mi: harf, yapı/öbek/toplantı kelimesi değil. */
export function nameLike(word) {
  return (
    /^[a-z]{2,}$/.test(word) &&
    !FUNCTION_WORDS.has(word) &&
    !hasRoot(word, NOT_PEOPLE) &&
    !hasRoot(word, MEETING_WORDS) &&
    !hasRoot(word, TASK_WORDS)
  )
}

/** Açık görev işaretleri: toplantı kelimesi geçse de ("görev: sunumu hazırla") cümle görevdir. */
export const TASK_MARKERS = [
  ["gorev", 6],
  ["yapilacak", 6],
  ["hatirlat", 8],
]

/**
 * Cümleyi bitiren görev fiilleri ("sunumu hazırla", "raporu gönder"): saat ve kişi yoksa toplantı
 * kelimesi geçse de ("toplantı notlarını gönder") görevdir.
 */
export const TASK_VERBS = new Set([
  "hazirla",
  "gonder",
  "ara",
  "yaz",
  "bitir",
  "tamamla",
  "onayla",
  "oku",
  "incele",
  "guncelle",
  "paylas",
  "ilet",
  "sor",
  "soyle",
  "ode",
  "iste",
  "hatirla",
  "yukle",
  "indir",
  "kaydet",
  "imzala",
  "dagit",
  "topla",
])

/** "-la/-le" ile biten fiillerin gövdesi: "ayarla", "hazırla" ad + "-la" değildir (kesmesiz yazımda). */
export const VERB_STEMS = new Set([
  "ayar",
  "plan",
  "hazir",
  "duzen",
  "guncel",
  "yeni",
  "temiz",
  "onay",
  "tamam",
  "incel",
  "ozet",
  "belir",
  "kutl",
  "baslat",
  "bagla",
  "kontrol",
  "imza",
  "not",
])

/** Toplantı konusundan atılan fiiller ve dolgu ("toplantı ayarla", "var", "olacak"). */
export const MEETING_FILLERS = new Set([
  "ayarla",
  "ayarlar",
  "ayarlayalim",
  "ayarlayin",
  "koy",
  "koyalim",
  "olustur",
  "olusturalim",
  "kur",
  "kuralim",
  "yap",
  "yapalim",
  "yapiyoruz",
  "yapacagiz",
  "yapacagim",
  "planla",
  "planlayalim",
  "ekle",
  "duzenle",
  "lazim",
  "gerek",
  "var",
  "olacak",
  "olsun",
  "istiyorum",
  "istiyoruz",
  "isterim",
  "lutfen",
  "rica",
  "ederim",
  "bana",
  "benim",
  "yeni",
  "takvime",
  "takvimime",
])

/** Görev başlığından atılanlar ("hatırlat", "görev ekle"). */
export const TASK_FILLERS = new Set([
  "hatirlat",
  "hatirlatir",
  "hatirlatin",
  "misin",
  "misiniz",
  "lutfen",
  "rica",
  "ederim",
  "bana",
  "yeni",
  "listeme",
  "listesine",
  "todo",
  "to",
  "do",
])

/** Konunun başında ve sonunda anlamsız kalan bağlaçlar. */
export const EDGE_WORDS = new Set(["ile", "ve", "icin", "de", "da", "ki", "ama", "bir", "bi"])
