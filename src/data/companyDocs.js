/**
 * KEŞFET › DOKÜMANLAR — demo için KURGUSAL içerik kataloğu. Kaynak uygulamadaki kurumsal görsel
 * klasörleri ve intranet bağlantıları demoya alınmaz; politika klasörleri örnek addır, bağlantılar
 * var olmayan bir demo adresine gider.
 */

/** Kurumsal görsel klasörleri: demoda boş. */
export const DOC_FOLDERS = []

export const ORG_CHART_URL = "https://tyroai.github.io/team"

const POLICY_BASE = "https://tyrotech.sharepoint.example/sites/intranet/Shared%20Documents/Politika"

/** POLİTİKA VE PROSEDÜRLER — örnek klasör adları. */
export const POLICY_FOLDERS = [
  { id: "global", name: "Global (TYRO Tech)", url: `${POLICY_BASE}/Global` },
  { id: "satis", name: "Satış ve Kanal", url: `${POLICY_BASE}/Satis` },
  { id: "operasyon", name: "Operasyon ve Lojistik", url: `${POLICY_BASE}/Operasyon` },
]
