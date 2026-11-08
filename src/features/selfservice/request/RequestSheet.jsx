import { BottomSheet } from "@/components/common/BottomSheet"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { ProgressTile } from "./field/ProgressTile"
import { keepEscape } from "./formUi"

/**
 * Talep formunun telefondaki hâli: tam boy alt çekmece, kaymayan alt şeritte gönder ("Anlat" da
 * orada, `RequestFooter`). Gövdenin başında tek satır: `lead` (avansın "Önceki avansların" hapı),
 * yoksa bağlam çipi ("Kalan yıllık izin 11 gün"), o da yoksa açıklama — form ilk açılışta
 * olabildiğince sığsın (açıklama çekmecenin adında da var: ekran okuyucu iki kez okumasın). İzin ve
 * avansta (`step`: 1 · 2) sağında iki adımlı ilerleme. Yatay telefonda (`shortest`) satır yok.
 * Çekmecenin adının solunda pencerenin ikon kutusu ve doluluk halkası (`ProgressTile`, `icon` ·
 * `progress`): masaüstündeki başlıkla aynı kimlik, ek satır kaplamaz.
 */
export function RequestSheet({
  open,
  onOpenChange,
  title,
  icon,
  progress = null,
  description,
  context,
  footer,
  keepOutside,
  from,
  sent,
  step = null,
  lead = null,
  children,
}) {
  const { t } = useLocale()
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        icon ? (
          <span className="flex items-center gap-3">
            <ProgressTile icon={icon} progress={progress} />
            {title}
          </span>
        ) : (
          title
        )
      }
      description={description}
      onEscapeKeyDown={keepEscape}
      onPointerDownOutside={keepOutside}
      returnFocus={() => from}
      onCloseAutoFocus={(e) => sent.current && e.preventDefault()}
      footer={footer}
      className="max-h-[94dvh] data-[side=bottom]:h-[94dvh]"
    >
      <div className="mb-4 flex items-center gap-3 shorter:mb-3 shortest:hidden">
        {lead ? (
          <div className="flex min-w-0 flex-1 items-center">{lead}</div>
        ) : (
          <p
            aria-hidden="true"
            className="flex min-w-0 flex-1 items-center text-[0.8125rem] text-muted-foreground"
          >
            {context ? (
              // Uzun bağlam ("… adına · 12 kalem · ₺… + $…") çekmeceden taşmasın: tek satır, kesilir.
              <span className="inline-block h-6 max-w-full truncate rounded-full bg-muted px-2.5 text-[0.75rem] font-medium leading-6 text-foreground/80">
                {context}
              </span>
            ) : (
              description
            )}
          </p>
        )}
        {step && (
          <p className="flex shrink-0 items-center gap-2 text-[0.75rem] font-medium tabular-nums text-foreground/70">
            <span className="sr-only">{t("selfService.form.stepOf", { n: step, total: 2 })}</span>
            <span aria-hidden="true" className="flex gap-1">
              {[1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-5 rounded-full transition-colors",
                    i <= step ? "bg-brand-fill-deep" : "bg-foreground/15",
                  )}
                />
              ))}
            </span>
            <span aria-hidden="true">{step}/2</span>
          </p>
        )}
      </div>
      {children}
    </BottomSheet>
  )
}
