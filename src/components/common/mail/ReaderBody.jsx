import { ErrorCause } from "@/components/common/ErrorCause"
import { FitFrame } from "./FitFrame"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * Okuyucunun gövdesi — Keşfet'in okuma bölmesi, çentiğin posta kartı ve büyük posta
 * okuyucusu: bekleme iskeleti, HTML çerçevesi (`useMailReader`), düz metin ya da "metin yok /
 * çok büyük / getirilemedi" kartı. Beyaz zemin yalnız ÇERÇEVEDE (postanın kendi tasarımı);
 * kabuk tema tokenlarında kalır, koyu temada kâğıt kenar boşluklu.
 * `fallback`: beklerken iskelet yerine çizilecek içerik (kart, elindeki özeti gösterir).
 * `className`: kabın ölçüsü (bölmede kalan yüksekliğin tamamı, kartta sabit boy).
 * `fit`: çerçeve içeriği kadar uzar (`FitFrame`) — telefon okuyucusu tek kaydırma ister.
 */
export function ReaderBody({ post, body, html, waiting, failed, title, fallback, className, fit }) {
  const { t } = useLocale()
  return (
    <div
      data-private=""
      className={cn(
        "min-h-0 flex-1 overflow-hidden border-t border-border/70 bg-card dark:bg-muted/30 dark:p-3",
        className,
      )}
    >
      {waiting && fallback}
      {waiting && !fallback && (
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {!waiting && html && fit && (
        <FitFrame
          title={title}
          html={html}
          className="block w-full border-0 bg-white dark:rounded-xl"
        />
      )}
      {!waiting && html && !fit && (
        <iframe
          title={title}
          /* ⚠️ `allow-popups` + `allow-popups-to-escape-sandbox`: bağlantılar
             yeni sekmede açılsın. Script, form ve same-origin KAPALI —
             gerekçe `lib/mailFrame.js`te. */
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          className="size-full border-0 bg-white dark:rounded-xl"
          srcDoc={html}
        />
      )}
      {/* Düz metin gövde de gösterilir: `useMailBody` HTML olmayan postayı `text`e yazar. */}
      {!waiting && !html && body?.text && (
        <div className="h-full overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <p className="whitespace-pre-line text-[0.875rem] leading-relaxed text-foreground/85">
            {body.text}
          </p>
        </div>
      )}
      {!waiting && !html && !body?.text && (
        <div className="grid h-full place-items-center px-6 text-center">
          <div className="max-w-sm">
            <p className="text-[0.875rem] font-medium text-foreground/80">
              {body?.oversize
                ? t("feed.oversize")
                : failed
                  ? t("feed.bodyError")
                  : t("feed.noBody")}
            </p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-muted-foreground">
              {body?.oversize ? t("feed.oversizeBody") : t("feed.noBodyHint")}
            </p>
            {failed && <ErrorCause detail={body?.detail} className="mt-2" />}
            {post.preview && (
              <p className="mt-3 rounded-lg bg-muted/40 p-3 text-left text-[0.75rem] leading-relaxed text-foreground/75">
                {post.preview}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
