import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Image01Icon from "@hugeicons/core-free-icons/Image01Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import MagicWand01Icon from "@hugeicons/core-free-icons/MagicWand01Icon"
import Pdf01Icon from "@hugeicons/core-free-icons/Pdf01Icon"
import { useSpin } from "@/components/common/useSpin"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

// Küçük resmin kendisi önizleme düğmesi: odakta halka, üstüne gelince hafif koyulur.
const THUMB =
  "grid size-full cursor-zoom-in place-items-center overflow-hidden rounded-[0.625rem] border border-black/[0.08] bg-card text-foreground/60 shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/[0.12] dark:hover:brightness-110"
// Döndürülen fiş küçük resimde de döner; kare kırpım dönünce de kareyi doldurur.
export const SPIN = "transition-[rotate] duration-200 ease-out motion-reduce:transition-none"
// Köşedeki kaldır düğmesi: en az 24 px (kök yazı alçak ekranda küçülse de; WCAG hedef boyu).
// Dokunmatikte görünmez payı yalnız dışa (yukarı ve yana) büyür: küçük resmin ortasına dokunmak
// önizler, kaldırmaz.
const REMOVE =
  "absolute -end-1.5 -top-1.5 grid size-[max(1.5rem,24px)] place-items-center rounded-full border border-black/[0.08] bg-background text-foreground/70 shadow-[0_1px_3px_rgb(0_0_0/0.16)] transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:border-white/[0.14] pointer-coarse:after:absolute pointer-coarse:after:-end-2.5 pointer-coarse:after:-top-2.5 pointer-coarse:after:bottom-0 pointer-coarse:after:start-0"

/**
 * Başlıktaki tek fiş: 44 px küçük resim (dokunmatikte 52) — basınca önizleme (görsel ışık kutusunda; PDF ve
 * tarayıcının gösteremediği görsel, masaüstü Chrome'da HEIC gibi, yeni sekmede: `tab`) — ve
 * köşede ayrı kaldır düğmesi. Gelen fiş bir kez belirerek gelir: kişi fişin nereye (masrafın
 * başlığına) eklendiğini görür. Kaldırırken sönme yok: düğme hemen kalkmalı, odak yanındaki
 * fişe geçebilsin. `broken`: küçük resim çizilemedi (`onBroken`), yerine görsel simgesi. Fişin
 * `rotate`i (önizlemede döndürülür) küçük resme de uygulanır. `read`: fiş okumasının durumu —
 * okunurken üstünde dönen simge, okununca köşede değnek, okunamayınca köşede ünlem (adında da).
 */
export function ReceiptThumb({ item, tab, broken, read, onPreview, onBroken, onRemove }) {
  const { t } = useLocale()
  const name = item.file.name
  const state = read
    ? t(`selfService.expense.read.state.${read === "unreadable" ? "failed" : read}`)
    : null
  const spin = useSpin(item.rotate, item.id)
  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      // Kök yazı küçülse de 44 px: köşedeki 24 px'lik ×, önizleme hedefini 24 px'in altına
      // indirmesin.
      className="relative size-[max(2.75rem,44px)] shrink-0 snap-start last:snap-end pointer-coarse:size-13"
    >
      <button
        type="button"
        onClick={(e) => onPreview(item, e.currentTarget)}
        aria-label={
          t(
            tab
              ? "selfService.expense.receipts.previewTab"
              : "selfService.expense.receipts.preview",
            { name },
          ) + (state ? ` · ${state}` : "")
        }
        title={state ? `${name} · ${state}` : name}
        className={THUMB}
      >
        {item.url && !broken ? (
          <img
            src={item.url}
            alt=""
            onError={() => onBroken(item.id)}
            style={{ rotate: `${spin}deg` }}
            className={cn("size-full object-cover dark:brightness-[0.92]", SPIN)}
          />
        ) : (
          <HugeiconsIcon
            icon={item.url ? Image01Icon : Pdf01Icon}
            aria-hidden="true"
            className="size-5"
            strokeWidth={1.6}
          />
        )}
      </button>
      {read === "reading" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid place-items-center rounded-[0.625rem] bg-background/60 text-brand-ink backdrop-blur-[1px]"
        >
          <HugeiconsIcon
            icon={Loading03Icon}
            className="size-4 animate-spin motion-reduce:animate-none"
            strokeWidth={2}
          />
        </span>
      )}
      {read && read !== "reading" && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -bottom-1 -start-1 grid size-[1.0625rem] place-items-center rounded-full text-white ring-2 ring-card dark:text-background",
            read === "done"
              ? "bg-brand-fill-deep text-brand-on-brand dark:text-brand-on-brand"
              : "bg-warning",
          )}
        >
          {read === "done" ? (
            <HugeiconsIcon icon={MagicWand01Icon} className="size-2.5" strokeWidth={2.2} />
          ) : (
            <span className="text-[0.625rem] font-bold leading-none">!</span>
          )}
        </span>
      )}
      <button
        type="button"
        data-receipt-remove={item.id}
        onClick={() => onRemove(item.id)}
        aria-label={t("selfService.expense.receipts.remove", { name })}
        className={REMOVE}
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          aria-hidden="true"
          className="size-3"
          strokeWidth={2.2}
        />
      </button>
    </motion.li>
  )
}
