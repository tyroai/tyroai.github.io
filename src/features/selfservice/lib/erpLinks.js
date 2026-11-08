/**
 * "ERP'de göster" — Self Servis kaydının ERP'deki (Dynamics 365 F&O) formunu açan bağlantı (saf).
 *
 * F&O bağlantısı `/?cmp=<şirket>&mi=<menü öğesi>` biçiminde FORMU açar. Tek bir kayda giden
 * bağlantının (`q=`) sorgusu sunucuda F&O'nun kendi anahtarıyla üretiliyor; tarayıcı onu kuramaz.
 * Bu yüzden form açılır ve kaydın numarası panoya kopyalanır (çağıran yapar): kişi ERP'nin
 * aramasına yapıştırır.
 *
 * Menü öğeleri: masraf `TRYEmployeExpenses` (TYRO paketi), avans `TrvCashAdvances` (standart
 * Seyahat ve Gider) F&O kaynağından doğrulandı; izin `BorAXAllowanceInfoByPersonnel` (BorAX,
 * personele göre izin bilgileri) sahibin verdiği adresten. İzin kaydının numarası yok: form açılır,
 * panoya bir şey kopyalanmaz.
 */

export const FNO_URL = import.meta.env.VITE_FNO_URL || "https://demo.operations.dynamics.com"

const MENU = Object.freeze({
  leave: "BorAXAllowanceInfoByPersonnel",
  expense: "TRYEmployeExpenses",
  advance: "TrvCashAdvances",
})

// Self Servis talepleri İK şirketinde açılıyor (İK MCP'si ve "Gönder" `HRMS` yazıyor). Masraf
// tablosu şirketten bağımsız; avans ve izin İK şirketinde. Kaydın `company`si (masraf satırının yansıtma
// şirketi) bilinçli olarak kullanılmaz.
const COMPANY = "hrms"

/** Kaydın ERP formunun adresi; bağlantısı olmayan türde `null`. */
export function erpRecordUrl(record) {
  const mi = MENU[record?.kind]
  if (!mi) return null
  return `${FNO_URL.replace(/\/+$/, "")}/?cmp=${COMPANY}&mi=${mi}`
}
