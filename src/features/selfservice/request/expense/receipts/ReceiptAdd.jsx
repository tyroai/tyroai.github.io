import { HugeiconsIcon } from "@hugeicons/react"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import Camera01Icon from "@hugeicons/core-free-icons/Camera01Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { INK } from "../head/headUi"

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
// Kesik çizgi "buraya fiş" der: boş şerit ve şeridin sonundaki "Fiş ekle".
const DASHED = `border-[1.5px] border-dashed border-foreground/[0.16] text-foreground/80 transition hover:border-brand/45 hover:bg-brand/[0.04] hover:text-brand-ink dark:border-white/[0.18] ${RING}`

/** Marka tonlu yuvarlak "+" (boş şeritte ve "Fiş ekle"de aynı). */
function PlusDot() {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand/[0.1] text-brand-ink transition">
      <HugeiconsIcon
        icon={PlusSignIcon}
        aria-hidden="true"
        className="size-3.5"
        strokeWidth={2.2}
      />
    </span>
  )
}

/**
 * Fareli ekranda, fiş yokken şeridin tamamı: tek satır, ince, kesik çizgili düğme — "Fiş ekle ·
 * sürükle ya da ⌘V". Basınca dosya seçici (`onPick`). `add`: kimlik ve `data-receipt-add` (özetin
 * "Fiş ekle"si buna basar; kaldırınca odağın son durağı). `children`: sağ uçta (ⓘ).
 */
export function EmptyBar({ add, keys, onPick, children }) {
  const { t } = useLocale()
  return (
    <div className="flex min-h-12 items-center gap-1 pe-2">
      <button
        type="button"
        {...add}
        onClick={onPick}
        className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-[0.9375rem] ps-3 pe-2 text-start text-[0.8125rem] outline-none transition hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
      >
        <PlusDot />
        <span className="shrink-0 font-semibold">{t("selfService.form.receiptAdd")}</span>
        <span className="min-w-0 truncate text-muted-foreground">
          · {t("selfService.expense.receipts.empty", { keys })}
        </span>
      </button>
      {children}
    </div>
  )
}

/** Şeridin sonundaki "Fiş ekle" (fareli ekran): küçük resimlerle aynı boyda, kesik çizgili. */
export function AddButton({ add, onPick }) {
  const { t } = useLocale()
  return (
    <button
      type="button"
      {...add}
      onClick={onPick}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-[0.75rem] ps-1.5 pe-3 text-[0.8125rem] font-semibold",
        DASHED,
      )}
    >
      <PlusDot />
      {t("selfService.form.receiptAdd")}
    </button>
  )
}

const TAKE =
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-[0.875rem] text-[0.875rem] font-semibold transition active:scale-[0.98] motion-reduce:active:scale-100 [-webkit-tap-highlight-color:transparent] [&_svg]:size-[1.125rem] [&_svg]:shrink-0"
const CAMERA = cn("bg-brand/[0.1] hover:bg-brand/[0.14]", INK, RING)
const PICK = cn(
  "border border-black/[0.08] bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:border-black/[0.14] dark:border-white/[0.12]",
  RING,
)

/**
 * Dokunmatikte "Fotoğraf çek" (arka kamera; öne çıkan, marka tonu) ve "Fiş ekle" (galeri ya da
 * dosya). `big`: fiş yokken iki büyük düğme yarı yarıya; değilse şeridin ucunda — dar şeritte
 * (telefon) ikon kareleri (adları ekran okuyucuda), genişte yazılı haplar.
 */
export function TakeButtons({ add, big, onCamera, onPick, className }) {
  const { t } = useLocale()
  const size = big
    ? "h-12 px-4"
    : "size-11 px-0 @[30rem]/rcpt:h-11 @[30rem]/rcpt:w-auto @[30rem]/rcpt:px-3.5"
  const text = big ? "truncate" : "sr-only @[30rem]/rcpt:not-sr-only @[30rem]/rcpt:truncate"
  return (
    <div className={cn(big ? "grid grid-cols-2 gap-2" : "flex shrink-0 gap-2", className)}>
      <button type="button" onClick={onCamera} className={cn(TAKE, size, CAMERA)}>
        <HugeiconsIcon icon={Camera01Icon} aria-hidden="true" strokeWidth={1.8} />
        <span className={text}>{t("selfService.form.receiptCamera")}</span>
      </button>
      <button type="button" {...add} onClick={onPick} className={cn(TAKE, size, PICK)}>
        <HugeiconsIcon
          icon={PlusSignIcon}
          aria-hidden="true"
          strokeWidth={2}
          className="text-brand-ink"
        />
        <span className={text}>{t("selfService.form.receiptAdd")}</span>
      </button>
    </div>
  )
}

/**
 * Şeride dosya sürüklenirken: kesik marka çerçevesi ve ortada "Bırak; fişler masrafa eklenir"
 * (dolunca sınır). Olayları alttakine bırakır.
 */
export function DropOverlay({ full, text }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[inherit] border-2 border-dashed backdrop-blur-[1.5px]",
        full ? "border-foreground/25 bg-card/70" : "border-brand-ink/60 bg-brand/[0.06]",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-background px-3.5 py-1 text-[0.8125rem] font-semibold shadow-[0_8px_24px_-12px_rgb(0_0_0/0.3)] dark:border-white/[0.1]",
          full ? "text-muted-foreground" : "text-brand-ink",
        )}
      >
        <HugeiconsIcon icon={Attachment01Icon} className="size-4" strokeWidth={1.8} />
        {text}
      </span>
    </div>
  )
}
