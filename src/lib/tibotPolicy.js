/**
 * Ticket Talepler — Xurrent'teki açık talepler (widget + Self Servis › Talepler sekmesi).
 *
 * Veri bir Power Automate akışından gelir (`lib/tibot/tibotApi.ts`); akış kişiyi Power Platform'un
 * doğruladığı jetondan tanır ve yalnız onun taleplerini döndürür. Akış bugün tek bir Xurrent
 * anahtarıyla soruyor, bu yüzden kitle önizleme: akışın kendi izin listesiyle AYNI kişiler.
 * Herkese açmadan önce Xurrent Token Exchange (kişinin kendi kimliği) gerekir —
 * `docs/features/tibot-talepler.md`.
 */
/** Ticket sayfası (Self Servis'in Ticket sürümü; salt okunur). */
export const TIBOT_PATH = "/tibot"

export const TIBOT = Object.freeze({
  enabled: true,
  audience: Object.freeze([
    "omer.gumus@tyrotech.example", // Ömer Gümüş
    "ayse.demir@tyrotech.example", // Ayşe Demir
    // Kurumsal Sistemler ekibi
    "serkan.korkmaz@tyrotech.example", // Serkan Korkmaz
    "aslihan.yolcu@tyrotech.example", // Aslıhan Yolcu
    "ameliya.yussupova@tyrotech.example", // Ameliya Yussupova
    "ebru.karatepe@tyrotech.example", // Ebru Karatepe
    "ayse.sahin@tyrotech.example", // Ayşe Şahin
    "nuri.yilmaz@tyrotech.example", // Nuri Yılmaz
  ]),
})
