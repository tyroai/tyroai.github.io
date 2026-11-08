import { HugeiconsIcon } from "@hugeicons/react"
import Pdf01Icon from "@hugeicons/core-free-icons/Pdf01Icon"
import { useSpin } from "@/components/common/useSpin"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { countText, number } from "../../kinds"
import { SPIN } from "./receipts/ReceiptThumb"
import { useReceiptPreview } from "./receipts/useReceiptPreview"

// Üst üste gösterilen fiş görseli; fazlası "+n".
const SHOWN = 5

/**
 * Küçük görsel (28 px) — basınca önizleme (görsel ışık kutusunda, PDF yeni sekmede): görselin
 * ön izlemesi ya da PDF simgesi; üst üste dizilir, aradaki çizgi zeminin rengi. PDF'in
 * kırmızımsı zemini opak: alttaki görsel içinden görünmesin. Fişin döndürmesi görsele uygulanır.
 */
function Thumb({ file, index, label, onOpen }) {
  const spin = useSpin(file.rotate, file.id)
  return (
    <button
      type="button"
      aria-label={label}
      title={file.file.name}
      onClick={(e) => onOpen(file, e.currentTarget)}
      className={cn(
        "relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-[0.4375rem] bg-muted ring-2 ring-background shadow-[0_0_0_3px_rgb(0_0_0/0.07)] transition hover:z-10 hover:-translate-y-0.5 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-brand/60 dark:shadow-[0_0_0_3px_rgb(255_255_255/0.08)] pointer-coarse:after:absolute pointer-coarse:after:-inset-2",
        index > 0 && "-ms-2.5",
        !file.url && "bg-[color-mix(in_oklab,var(--destructive)_10%,var(--background))]",
      )}
    >
      {file.url ? (
        <img
          src={file.url}
          alt=""
          style={{ rotate: `${spin}deg` }}
          className={cn("size-full object-cover dark:brightness-90", SPIN)}
        />
      ) : (
        <HugeiconsIcon
          icon={Pdf01Icon}
          aria-hidden="true"
          className="size-3.5 text-red-700 dark:text-red-300"
        />
      )}
    </button>
  )
}

/**
 * Gözden geçirmede masrafın fişleri, başlık bilgilerinin altında bir kez: görseller üst üste
 * (basınca önizleme, `useReceiptPreview`), sayı ve nereye eklendikleri (ERP'de masrafın
 * başlığına; kaleme değil). Fiş yoksa çizilmez.
 * Önizlemede yakınlaştırılır, döndürülmez: gönderilecek dosyalar burada paketlenmiş.
 * `receipts`: `form.expense.receipts` (`{ id, file, url, rotate }`).
 */
export function ReviewReceipts({ receipts }) {
  const { t, locale } = useLocale()
  const preview = useReceiptPreview(receipts)
  if (!receipts.length) return null
  const more = receipts.length - SHOWN
  return (
    <div className="flex items-center gap-2.5 pt-0.5 text-[0.8125rem] text-muted-foreground">
      <span className="flex shrink-0 items-center">
        {receipts.slice(0, SHOWN).map((f, i) => (
          <Thumb
            key={f.id}
            file={f}
            index={i}
            label={t(
              preview.inTab(f)
                ? "selfService.expense.receipts.previewTab"
                : "selfService.expense.receipts.preview",
              { name: f.file.name },
            )}
            onOpen={preview.open}
          />
        ))}
        {more > 0 && (
          <span className="ms-1.5 text-[0.75rem] font-medium tabular-nums">
            +{number(more, locale)}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="font-medium text-foreground tabular-nums">
          {countText(t, locale, "selfService.expense.summary.receipts", receipts.length)}
        </span>
        {" · "}
        {t("selfService.expense.reviewReceipts")}
      </span>
      {preview.viewer}
    </div>
  )
}
