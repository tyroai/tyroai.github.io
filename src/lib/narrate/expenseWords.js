import { EXPENSE_CATEGORIES } from "@/data/hrValues"
import { brandOf } from "./brands"

/**
 * Masraf kategorisinin anahtar kelimeleri (Anlat; katlanmış yazı): [kalıp, yurtiçi, yurtdışı,
 * "weak" — türü belirlemez].
 * Sıra önemli — özel önce genel sonra: "müşteri yemeği" temsil ağırlama, "ekip yemeği" departman
 * yemeği, "mesai yemeği" fazla mesai; düz "yemek" ise yemek.
 */
const RULES = [
  [/\b(musteri\w*|temsil\w*|agirla\w*)\b.*\byeme|\byeme\w*\b.*\bmusteri/, "Temsil ağırlama yemek"],
  [/\b(ekip|departman|takim)\w*\s+yeme/, "Departman yemek ekip"],
  // "Mesai sonrası eve taksi": arada birkaç kelime olabilir.
  [/\bmesai\w*(?:\s+\w+){0,2}\s+yeme/, "Fazla mesai yemek"],
  [/\bmesai\w*(?:\s+\w+){0,2}\s+(taksi|ulasim|yol|servis)/, "Fazla mesai ulaşım"],
  [/\bikram\w*/, "Toplantı, fuar ve organizasyon"],
  [/\b(vize|pasaport|harc)\w*/, "Çıkış ve pasaport harç (Yurtdışı)"],
  [/\b(benzin|mazot|motorin|yakit|akaryakit|lpg)\w*/, "Taşıt akaryakıt"],
  [/\b(otopark|park ucret|parking|vale)\w*/, "Taşıt otopark"],
  [
    /\b(lastik|oto yikama|arac yikama|yag degisim)\w*|\barac\w* (bakim|tamir|servis)/,
    "Taşıt bakım onarım",
  ],
  [/\b(hgs|ogs|kopru|otoyol|gise)\w*/, "Taşıt hgs/ogs"],
  [/\b(arac kira|kiralik arac|rent a car)\w*/, "Taşıt kira"],
  [/\b(kargo|kurye)\w*/, "Kargo (Yurtiçi)", "Kargo (Yurtdışı)"],
  [/\b(otel|konaklama|pansiyon|airbnb|hostel)\w*/, "Konaklama (Yurtiçi)", "Konaklama (Yurtdışı)"],
  [
    /\b(taksi|uber|bitaksi|marti|metro|otobus|dolmus|minibus|tren|ucak|ucus|bilet|havalimani|feribot|vapur|tramvay|marmaray|akbil|istanbulkart|otogar|yol parasi|yol ucreti)\w*/,
    "Ulaşım (Yurtiçi)",
    "Ulaşım (Yurtdışı)",
  ],
  [
    /\b(yemek|yemeg|ogle|kahvalti|restoran|lokanta|kafe|kahve|cay)\w*/,
    "Yemek (Yurtiçi)",
    "Yemek (Yurtdışı)",
  ],
  [/\b(kirtasiye|toner|fotokopi|kagit|zarf|klasor)\w*|\ba[345]\b/, "Kırtasiye"],
  [/\b(klavye|mouse|sarj aleti|bilgisayar|laptop|monitor)\w*/, "Bilgisayar malzemeleri bakım o."],
  [/\bnoter\w*/, "Noter"],
  [/\b(ilac|eczane|tedavi|muayene|hastane|doktor)\w*/, "İlaç ve tedavi"],
  [/\b(egitim|kurs)\w*/, "Eğitim giderleri", null, "weak"],
  [/\b(fuar|organizasyon|toplanti)\w*/, "Toplantı, fuar ve organizasyon", null, "weak"],
  [/\b(telefon|internet|gsm)\w*/, "Diğer haberleşme"],
  [/\b(bagis|yardim)\w*/, "Bağış ve yardım"],
  [/\b(pasta|kutlama|piknik|dogum gunu)\w*/, "Sosyal aktivite"],
  [/\btemizlik\w*/, "Temizlik malzemesi"],
  [/\b(analiz|laboratuvar)\w*/, "Analiz giderleri"],
  [/\b(matbaa|baski|kartvizit)\w*/, "Matbaa"],
]

/** Yazıdaki masraf kategorisi (yurt dışındaysa yurtdışı karşılığı) ya da null. */
export function expenseCategoryOf(folded, abroad = false) {
  for (const [re, home, away] of RULES) {
    if (!re.test(folded)) continue
    const name = abroad && away ? away : home
    return EXPENSE_CATEGORIES.includes(name) ? name : null
  }
  return null
}

/**
 * Masraf kelimesi var mı (kategori anahtarı ya da fişlerde geçen bir marka: "Opet 2000"). Fuar,
 * eğitim gibi avansın amacı da olan kelimeler sayılmaz ("fuar için 5000" avanstır; "fuar masrafı"
 * masraf kelimesinden bulunur).
 */
export const saysExpense = (folded) =>
  RULES.some(([re, , , weak]) => !weak && re.test(folded)) || Boolean(brandOf(folded))
