// Demo evreninin kurgusal sabitleri: sync betiği bunlarla gerçek kurum verisinin yerini doldurur.
// Hepsi uydurmadır; gerçek bir şirket, kişi ya da sistemle ilgisi yoktur.

/** Kurgusal şirketler grubu — ERP "yansıtma şirketleri" listesi (kod → unvan). */
export const GROUP_COMPANIES = {
  TYAG: "TYRO TARIM ÜRÜNLERİ TİCARET ANONİM ŞİRKETİ",
  TYEN: "TYRO ENERJİ ÜRETİM ANONİM ŞİRKETİ",
  TYHL: "TYRO HOLDING A.Ş.",
  TYIN: "TYRO INTERNATIONAL FZE",
  TYLJ: "TYRO LOJİSTİK VE DEPOLAMA HİZMETLERİ ANONİM ŞİRKETİ",
  TYOT: "TYRO OTOMOTİV VE MAKİNE SANAYİ ANONİM ŞİRKETİ",
  TYRT: "TYRO PERAKENDE GIDA ÜRÜNLERİ SANAYİ VE TİCARET A.Ş.",
  TYTC: "TYRO TECH YAZILIM DANIŞMANLIK HİZMETLERİ TİCARET ANONİM ŞİRKETİ",
}

const SHORT = {
  TYAG: "TYRO Tarım",
  TYEN: "TYRO Enerji",
  TYHL: "TYRO Holding",
  TYIN: "TYRO International",
  TYLJ: "TYRO Lojistik",
  TYOT: "TYRO Otomotiv",
  TYRT: "TYRO Perakende",
  TYTC: "TYRO Tech",
}

/** Şirket KISA ADLARI: kod → [ekranda yazılan ad, ERP'deki tam ünvan]. */
export const GROUP_SHORT_NAMES = Object.fromEntries(
  Object.entries(GROUP_COMPANIES).map(([code, full]) => [code, [SHORT[code], full]]),
)

/** Dünya saati: kurgusal grubun "ofis" şehirleri (kaynaktaki gerçek konum listesinin yerine). */
export const OFFICE_CITIES_JS = `export const OFFICE_CITIES = [
  {
    id: "istanbul",
    tz: "Europe/Istanbul",
    cc: "TR",
    names: { tr: "İstanbul", en: "Istanbul", ru: "Стамбул", ar: "إسطنبول" },
  },
  {
    id: "chicago",
    tz: "America/Chicago",
    cc: "US",
    names: { tr: "Chicago", en: "Chicago", ru: "Чикаго", ar: "شيكاغو" },
  },
  {
    id: "amsterdam",
    tz: "Europe/Amsterdam",
    cc: "NL",
    names: { tr: "Amsterdam", en: "Amsterdam", ru: "Амстердам", ar: "أمستردام" },
  },
  {
    id: "dubai",
    tz: "Asia/Dubai",
    cc: "AE",
    names: { tr: "Dubai", en: "Dubai", ru: "Дубай", ar: "دبي" },
  },
  {
    id: "shanghai",
    tz: "Asia/Shanghai",
    cc: "CN",
    names: { tr: "Şanghay", en: "Shanghai", ru: "Шанхай", ar: "شنغهاي" },
  },
]
`
