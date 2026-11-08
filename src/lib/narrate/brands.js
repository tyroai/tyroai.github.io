/**
 * Fişlerde sık geçen markalar (Anlat › masraf; katlanmış yazı): [kalıp, firma adı, kategori
 * (yurtiçi, yurtdışı) ya da null]. Marka kalemin firmasını doldurur; kategori ancak kalemde
 * kategori kelimesi yoksa ondan gelir ("Opet 2000" akaryakıt, "Opet'ten kahve 90" yemek).
 * Kısa ya da başka anlamı olan adlar ("getir", "şok", "total") bilerek yok.
 */
const FUEL = ["Taşıt akaryakıt"]
const RIDE = ["Ulaşım (Yurtiçi)", "Ulaşım (Yurtdışı)"]
const RENT = ["Taşıt kira"]
const STAY = ["Konaklama (Yurtiçi)", "Konaklama (Yurtdışı)"]
const FOOD = ["Yemek (Yurtiçi)", "Yemek (Yurtdışı)"]
const CARGO = ["Kargo (Yurtiçi)", "Kargo (Yurtdışı)"]
const PARK = ["Taşıt otopark"]
const PHONE = ["Diğer haberleşme"]

// Ekler kesme işaretsiz yazının içinde: "BP'den" → "bpden", "THY'ye" → "thyye".
const SUFFIX = "[a-z]{0,5}\\b"
const brand = (words) => new RegExp(`\\b(?:${words})${SUFFIX}`)

const BRANDS = [
  [brand("shell"), "Shell", FUEL],
  [brand("opet"), "Opet", FUEL],
  [brand("bp"), "BP", FUEL],
  [brand("petrol ofisi?"), "Petrol Ofisi", FUEL],
  [brand("total ?energies"), "TotalEnergies", FUEL],
  [brand("aytemiz"), "Aytemiz", FUEL],
  [brand("lukoil"), "Lukoil", FUEL],
  [brand("alpet"), "Alpet", FUEL],
  [brand("bitaksi"), "BiTaksi", RIDE],
  [brand("uber"), "Uber", RIDE],
  [/\bmarti(?:ya|yla|dan|da|ile)?\b/, "Martı", RIDE],
  [brand("thy|turk hava yollar"), "Türk Hava Yolları", RIDE],
  [brand("pegasus"), "Pegasus", RIDE],
  [brand("ajet|anadolujet"), "AJet", RIDE],
  [brand("sunexpress"), "SunExpress", RIDE],
  [brand("lufthansa"), "Lufthansa", RIDE],
  [brand("klm"), "KLM", RIDE],
  [brand("emirates"), "Emirates", RIDE],
  [brand("tcdd|yht"), "TCDD", RIDE],
  [brand("kamil koc"), "Kamil Koç", RIDE],
  [brand("metro turizm"), "Metro Turizm", RIDE],
  [brand("pamukkale turizm"), "Pamukkale Turizm", RIDE],
  [brand("avis"), "Avis", RENT],
  [brand("budget"), "Budget", RENT],
  [brand("garenta"), "Garenta", RENT],
  [brand("europcar"), "Europcar", RENT],
  [brand("sixt"), "Sixt", RENT],
  [brand("hilton"), "Hilton", STAY],
  [brand("marriott"), "Marriott", STAY],
  [brand("radisson"), "Radisson", STAY],
  [brand("sheraton"), "Sheraton", STAY],
  [brand("novotel"), "Novotel", STAY],
  [brand("ibis"), "Ibis", STAY],
  [brand("ramada"), "Ramada", STAY],
  [brand("wyndham"), "Wyndham", STAY],
  [brand("holiday inn"), "Holiday Inn", STAY],
  [brand("swissotel"), "Swissôtel", STAY],
  [brand("hyatt"), "Hyatt", STAY],
  [brand("rixos"), "Rixos", STAY],
  [brand("dedeman"), "Dedeman", STAY],
  [brand("starbucks"), "Starbucks", FOOD],
  [brand("kahve dunyasi"), "Kahve Dünyası", FOOD],
  [brand("simit sarayi"), "Simit Sarayı", FOOD],
  [brand("burger king"), "Burger King", FOOD],
  [brand("mcdonalds?"), "McDonald's", FOOD],
  [brand("yemeksepeti"), "Yemeksepeti", FOOD],
  [brand("aras kargo"), "Aras Kargo", CARGO],
  [brand("yurtici kargo"), "Yurtiçi Kargo", CARGO],
  [brand("mng kargo"), "MNG Kargo", CARGO],
  [brand("surat kargo"), "Sürat Kargo", CARGO],
  [brand("ptt"), "PTT", CARGO],
  [brand("dhl"), "DHL", CARGO],
  [brand("fedex"), "FedEx", CARGO],
  [brand("ups"), "UPS", CARGO],
  [brand("ispark"), "İSPARK", PARK],
  [brand("turkcell"), "Turkcell", PHONE],
  [brand("vodafone"), "Vodafone", PHONE],
  [brand("turk ?telekom"), "Türk Telekom", PHONE],
  [brand("migros"), "Migros", null],
  [brand("carrefoursa"), "CarrefourSA", null],
]

/** Yazıdaki marka: `{ firm, category(abroad) }` ya da null. */
export function brandOf(folded) {
  for (const [re, firm, cats] of BRANDS) {
    if (!re.test(folded)) continue
    return { firm, category: (abroad) => (cats ? (abroad && cats[1]) || cats[0] : null) }
  }
  return null
}
