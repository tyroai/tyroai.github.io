import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { MARK_LOOK } from "./rail/markLook"

/**
 * Gönderinin Outlook işaretleri — sabitle · bayrak · önem (2026-09-30, istek:
 * *"sabitlenmiş, bayrak eklediğimiz, yüksek önemde gelen maillerin
 * işaretlerini de yanlarında göster, eğer var ise"*). Veri `lib/feed.js`in
 * `toPost`unda (sabitlemenin genişletilmiş özellikten okunma gerekçesi orada).
 *
 * ⚠️ **YALNIZ İKON, KELİME YOK** (2026-09-30, kullanıcının son kararı: *"ikonlara
 * yazı yazma, ikon olsun sadece"*). İlk sürüm ikon + kelimeydi (deponun
 * "hover'a bağlı bilgi yok" kuralı); aynı gün önce bayrak, sonra hepsi ikona
 * indi. Gerekçe: beşi de Outlook'un KENDİ işaretleri (iğne · bayrak · onay ·
 * ünlem · aşağı ok) ve kullanıcı onları gelen kutusundan tanıyor. Adı ekran
 * okuyucu için `sr-only` metinde, farede `title`da duruyor. Bilinen bedel:
 * dokunmatikte ikonun adı okunamıyor.
 *
 * ⚠️ **ÜÇ İŞARET ÜÇ AYRI TON** (`rail/markLook.js`, Özelleştir ve sağ rayla ortak):
 * sabit marka, bayrak tehlike, yüksek önem uyarı, tamamlanan bayrak başarı,
 * düşük önem nötr. Bayrak ile yüksek önem aynı kırmızıydı; yalnız ikonla ayrışıyordu.
 *
 * İşaret yoksa HİÇBİR ŞEY çizilmez (boş bir kap satıra boşluk bırakırdı).
 * Kart ve okuma penceresi aynı bileşeni çiziyor — ikisi ayrışamaz.
 */
const MARKS = [
  { key: "pinned", when: (p) => p.pinned },
  { key: "flagged", when: (p) => p.flag === "flagged" },
  { key: "complete", when: (p) => p.flag === "complete" },
  { key: "high", when: (p) => p.importance === "high" },
  { key: "low", when: (p) => p.importance === "low" },
]

export function FeedMarks({ post, className }) {
  const { t } = useLocale()
  const marks = MARKS.filter((m) => m.when(post))
  if (!marks.length) return null
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {marks.map((m) => (
        <span
          key={m.key}
          title={t(`feed.mark.${m.key}`)}
          className={cn(
            "inline-flex shrink-0 items-center rounded-md px-1 py-px leading-4",
            MARK_LOOK[m.key].tone,
          )}
        >
          <HugeiconsIcon
            icon={MARK_LOOK[m.key].icon}
            className="size-3"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <span className="sr-only">{t(`feed.mark.${m.key}`)}</span>
        </span>
      ))}
    </span>
  )
}
