/**
 * Dünya saati şehirleri. `tz` IANA saat dilimi (yaz saatini tarayıcı
 * hesaplar), `cc` ülke kodu (ülke adı `Intl.DisplayNames` ile her dilde).
 * Ad dile göre: `names[locale] ?? names.en`.
 *
 * VARSAYILAN = TYRO'nun yurt dışı ofisleri (www.tyrotech.example › İletişim) +
 * İstanbul (ana şehir). Aynı saat dilimindeki ikinci ofis ayrı satır olmaz
 * (Buffalo, MO → Chicago; Basra → Bağdat); aramada ikisi de bulunur.
 */
export const HOME_CITY = "istanbul"

export const OFFICE_CITIES = [
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

// Aramada öne çıkan şehirler: [id, tz, cc, en, tr?]. Türkçe ad farklıysa
// verilir; RU/AR'de İngilizce ad gösterilir. Listede olmayan şehir için
// tarayıcının IANA listesi aranır (`lib/worldClock` › `searchCities`).
const EXTRA = [
  ["ankara", "Europe/Istanbul", "TR", "Ankara"],
  ["izmir", "Europe/Istanbul", "TR", "Izmir", "İzmir"],
  ["gaziantep", "Europe/Istanbul", "TR", "Gaziantep"],
  ["mersin", "Europe/Istanbul", "TR", "Mersin"],
  ["konya", "Europe/Istanbul", "TR", "Konya"],
  ["erbil", "Asia/Baghdad", "IQ", "Erbil"],
  ["london", "Europe/London", "GB", "London", "Londra"],
  ["paris", "Europe/Paris", "FR", "Paris"],
  ["berlin", "Europe/Berlin", "DE", "Berlin"],
  ["frankfurt", "Europe/Berlin", "DE", "Frankfurt"],
  ["geneva", "Europe/Zurich", "CH", "Geneva", "Cenevre"],
  ["zurich", "Europe/Zurich", "CH", "Zurich", "Zürih"],
  ["rome", "Europe/Rome", "IT", "Rome", "Roma"],
  ["milan", "Europe/Rome", "IT", "Milan", "Milano"],
  ["madrid", "Europe/Madrid", "ES", "Madrid"],
  ["brussels", "Europe/Brussels", "BE", "Brussels", "Brüksel"],
  ["vienna", "Europe/Vienna", "AT", "Vienna", "Viyana"],
  ["warsaw", "Europe/Warsaw", "PL", "Warsaw", "Varşova"],
  ["athens", "Europe/Athens", "GR", "Athens", "Atina"],
  ["bucharest", "Europe/Bucharest", "RO", "Bucharest", "Bükreş"],
  ["sofia", "Europe/Sofia", "BG", "Sofia", "Sofya"],
  ["kyiv", "Europe/Kiev", "UA", "Kyiv", "Kiev"],
  ["moscow", "Europe/Moscow", "RU", "Moscow", "Moskova"],
  ["tbilisi", "Asia/Tbilisi", "GE", "Tbilisi", "Tiflis"],
  ["baku", "Asia/Baku", "AZ", "Baku", "Bakü"],
  ["tehran", "Asia/Tehran", "IR", "Tehran", "Tahran"],
  ["riyadh", "Asia/Riyadh", "SA", "Riyadh", "Riyad"],
  ["doha", "Asia/Qatar", "QA", "Doha"],
  ["cairo", "Africa/Cairo", "EG", "Cairo", "Kahire"],
  ["lagos", "Africa/Lagos", "NG", "Lagos"],
  ["nairobi", "Africa/Nairobi", "KE", "Nairobi"],
  ["johannesburg", "Africa/Johannesburg", "ZA", "Johannesburg"],
  ["tashkent", "Asia/Tashkent", "UZ", "Tashkent", "Taşkent"],
  ["almaty", "Asia/Almaty", "KZ", "Almaty"],
  ["karachi", "Asia/Karachi", "PK", "Karachi", "Karaçi"],
  ["mumbai", "Asia/Kolkata", "IN", "Mumbai"],
  ["new-delhi", "Asia/Kolkata", "IN", "New Delhi", "Yeni Delhi"],
  ["dhaka", "Asia/Dhaka", "BD", "Dhaka", "Dakka"],
  ["bangkok", "Asia/Bangkok", "TH", "Bangkok"],
  ["singapore", "Asia/Singapore", "SG", "Singapore", "Singapur"],
  ["hong-kong", "Asia/Hong_Kong", "HK", "Hong Kong"],
  ["beijing", "Asia/Shanghai", "CN", "Beijing", "Pekin"],
  ["tokyo", "Asia/Tokyo", "JP", "Tokyo"],
  ["seoul", "Asia/Seoul", "KR", "Seoul", "Seul"],
  ["sydney", "Australia/Sydney", "AU", "Sydney"],
  ["auckland", "Pacific/Auckland", "NZ", "Auckland"],
  ["new-york", "America/New_York", "US", "New York"],
  ["washington", "America/New_York", "US", "Washington"],
  ["toronto", "America/Toronto", "CA", "Toronto"],
  ["vancouver", "America/Vancouver", "CA", "Vancouver"],
  ["los-angeles", "America/Los_Angeles", "US", "Los Angeles"],
  ["houston", "America/Chicago", "US", "Houston"],
  ["mexico-city", "America/Mexico_City", "MX", "Mexico City", "Meksiko"],
  ["bogota", "America/Bogota", "CO", "Bogotá"],
  ["lima", "America/Lima", "PE", "Lima"],
  ["sao-paulo", "America/Sao_Paulo", "BR", "São Paulo"],
  ["buenos-aires", "America/Argentina/Buenos_Aires", "AR", "Buenos Aires"],
]

export const EXTRA_CITIES = EXTRA.map(([id, tz, cc, en, tr]) => ({
  id,
  tz,
  cc,
  names: { en, tr: tr ?? en },
}))

export const DEFAULT_CITY_IDS = OFFICE_CITIES.map((c) => c.id)
