import EditBarPanel from "./editBar/EditBarPanel"
import { useWidgetEditor } from "./widgetEditorContext"

/**
 * Düzenleme çubuğu kapısı: kip düzenleme düğmesinden açılır (Pano'da header, Anasayfa'da sağ
 * alttaki cam düğme). Çubuğun kendisi `editBar/EditBarPanel`. Tembel değil: ayrı parça yapınca
 * paketleyici ortak bir yardımcıyı ilk pakete ayrı dosya olarak çıkarıyordu (ilk JS bütçesi).
 */
export function BoardEditBar() {
  const { editing } = useWidgetEditor()
  if (!editing) return null
  return <EditBarPanel />
}
