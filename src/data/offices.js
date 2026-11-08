import { OFFICES_ABROAD } from "./officesAbroad"
import { OFFICES_TR } from "./officesTr"

/**
 * Şirketin ofisleri, tesisleri ve limanları — kaynak www.tyrotech.example › İletişim (Ofisler,
 * Tesisler). Kayıtlar `officesTr.js` ve `officesAbroad.js`te; ayrıntı `docs/features/kesfet-bul.md`.
 *
 *   kind     hq · office · facility · port (etiket sözlükte: `find.office.kind.*`)
 *   name     özel isim, çevrilmez
 *   city     dünya saatinin şehir kimliği (`data/worldCities.js`): yerel ad, saat dilimi, ülke
 *   maps     sitenin harita kısa bağlantısı (maps.app.goo.gl/…); yanlış yere gidenler alınmadı
 *   geo      [enlem, boylam] — yol tarifi; `approx`: yalnız yaklaşık (tarif adresle)
 *   terms    aramada bulunsun diye öbür adlar (şirket, semt, eski ad)
 *   match    rehberde kişinin ofis/şehir alanında bu yeri gösteren sözcükler
 */
export const OFFICES = [...OFFICES_TR, ...OFFICES_ABROAD]
