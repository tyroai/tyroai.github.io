import { createContext, useContext } from "react"

/**
 * Talep formunun okuduğu ERP kayıtları (sayfanın verisi): izin, masraf ve avans kayıtları. Formun
 * derindeki parçaları (masraf kaleminin mükerrer uyarısı, kategori seçicinin "son kullandıkların"ı)
 * sayfadan prop taşımadan okur. Kayıt yoksa (yükleniyor, bağlantı yok) `null`.
 */
export const RequestDataContext = createContext({ leaves: null, expenses: null, advances: null })

export const useRequestData = () => useContext(RequestDataContext)
