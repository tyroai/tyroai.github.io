import { BottomSheet } from "@/components/common/BottomSheet"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { afterBackSettles } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { FeedTrends } from "../rail/FeedTrends"

// Rayın Özelleştir tercihleri burada uygulanmaz: telefonda o tercihler yok (`CustomizeList rail={false}`).
const NONE = new Set()

/**
 * Sağ rayın olmadığı kapta (< 64rem) Trendler: telefonda alttan açılan pencere, sosyal kipte
 * (geniş tablet) ortada pencere. İçerik rayın aynısı — gönderenler, sabitlenenler, kanallar.
 * Bir satıra basınca pencere kapanır, sonra akış filtrelenir ya da posta açılır: kapanış Geri
 * adımını geri alırken adresi değiştiren seçim onu beklemezse yeni adres silinirdi.
 */
export function TrendsSheet({ open, onOpenChange, social, trends }) {
  const { t } = useLocale()
  const then =
    (fn) =>
    (...args) => {
      onOpenChange(false)
      afterBackSettles(() => fn(...args))
    }
  const body = (
    <FeedTrends
      {...trends}
      bare
      hidden={NONE}
      onTagChange={then(trends.onTagChange)}
      onSelectSender={then(trends.onSelectSender)}
      onOpen={then(trends.onOpen)}
      personal={{ ...trends.personal, onSelect: then(trends.personal.onSelect) }}
    />
  )
  if (social) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          className="gap-3 sm:max-w-md pointer-coarse:[&_[data-slot=dialog-close]]:size-11"
        >
          <DialogTitle>{t("feed.discover")}</DialogTitle>
          {body}
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t("feed.discover")} closeOnBack>
      <div className="pb-2">{body}</div>
    </BottomSheet>
  )
}
