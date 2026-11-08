import { TileTray } from "./summary/TileTray"
import { useSummaryTiles } from "./summary/useSummaryTiles"

/**
 * ÖZET — tek sakin yüzeyde ince ayraçlı üç stat (küçük büyük harfli ad, büyük değer, tek soluk
 * alt satır; ikon kutusu ve halka yok); üstünde `header`: dönem çubuğu: izin bakiyesi (yıllık, dönemden bağımsız) · seçili dönemin
 * masrafları · seçili dönemin iş avansları ("Masraflar · 2025" / "· Tüm yıllar"). Tutar ve
 * sayı yalnız toplama girenler; toplam dışılar alt satırda not. Bölüm okunamadıysa ya da masraf
 * durumları okunamadıysa (toplam kuralı uygulanamaz) tutar "—", alt satır ve ayrıntı nedeni.
 * Kutular sekme DEĞİŞTİRMEZ (altta sekmeler var) ve seçili sekmeye göre boyanmaz. Değer
 * dönem değişince sayaçla döner (`AnimatedCounter`; hareketi azalt tercihinde atlar). Ayrıntı
 * (`TileDetail`): ince işaretçili geniş kapta fareyle ya da klavye odağıyla hover kartı;
 * dokunmatikte ya da dar kapta tek satırlık özet düğmesi → alttan çekmecede üçünün ayrıntısı.
 * Escape kartı/çekmeceyi kapatır, sohbet rıhtımını kapatmaz. `bare`: gradyan kartın beyaz
 * tepsisinde, kendi zemini olmadan.
 */
export function SummaryTiles({
  data,
  summary,
  year,
  accrual = null,
  loading,
  header,
  bare = false,
  className,
}) {
  const erp = useSummaryTiles({ data, summary, year, accrual })
  return (
    <TileTray
      tiles={erp.tiles}
      summary={erp}
      accrual={accrual}
      loading={loading || !data}
      header={header}
      bare={bare}
      className={className}
    />
  )
}
