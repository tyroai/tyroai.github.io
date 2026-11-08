import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import LinkSquare02Icon from "@hugeicons/core-free-icons/LinkSquare02Icon"
import { Button } from "@/components/ui/button"
import { BrandOrb } from "@/components/brand/BrandOrb"
import { useLocale } from "@/hooks/useLocale"

/**
 * Work IQ bağlantı izinleri — TEK özet onay kutusu ve otomatik onay bekleme örtüsü. Bot art
 * arda birçok "Connect to continue" kartı gönderiyor; kullanıcı bir kez onay verince hepsi
 * otomatik "Allow"lanır (bkz. features/chat/lib/turnEngine.ts › runConsentLoop).
 */
export function ConsentOverlays({ prompt, waiting, onApprove, onReject }) {
  const { t } = useLocale()
  return (
    <>
      <AnimatePresence>
        {prompt && (
          <motion.div
            key="consent-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
            >
              {/* marka aksan şeridi */}
              <div className="h-1.5 w-full bg-gradient-to-r from-brand-from via-brand-via to-brand-to" />
              <div className="p-7">
                <div className="flex items-start gap-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-from via-brand-via to-brand-to text-brand-on-ramp shadow-sm">
                    <HugeiconsIcon icon={LinkSquare02Icon} className="size-6" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-foreground">
                      {t("chat.consent.title")}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t("chat.consent.subtitle")}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {t("chat.consent.body")}{" "}
                  <span className="font-medium text-foreground">{t("chat.consent.question")}</span>
                </p>
                <div className="mt-6 flex justify-end gap-2.5">
                  <Button variant="ghost" onClick={onReject}>
                    {t("chat.consent.decline")}
                  </Button>
                  <Button
                    onClick={onApprove}
                    className="bg-brand-fill-deep text-white shadow-sm hover:bg-brand-fill-deep hover:opacity-90"
                  >
                    {t("chat.consent.allow")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Otomatik onaylanırken bekleme overlay'i */}
      <AnimatePresence>
        {waiting && (
          <motion.div
            key="consent-wait"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/75 backdrop-blur-sm"
          >
            {/* ⚠️ İKİ DURUM, ÇÜNKÜ İKİ GÖRÜNÜM VAR. Küre dört durum
                konuşuyor ve orada doğru karşılık `thinking`; maskotun
                `syncing`i var ve burada olan şey tam olarak o — düşünmek
                değil, kullanıcı adına iki tarafın izinlerini karşılıklı
                kurmak.
                ⚠️ `expressive`: bu örtü asistanın yüzü değil bir DURUM
                göstergesi (aynı gerekçe kutulardaki küreler için de
                yazılı), o yüzden ifadeyi durumun kendisi seçiyor —
                stüdyoda "mutlu" seçmiş biri bekleme ekranında gülümsemez. */}
            <BrandOrb
              surface="chat"
              state="thinking"
              mascotState="syncing"
              expressive
              level={0.4}
              size={90}
            />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t("chat.consent.preparing")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("chat.consent.preparingBody")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
