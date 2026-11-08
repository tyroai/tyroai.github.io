import { useState, useSyncExternalStore } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import Invoice03Icon from "@hugeicons/core-free-icons/Invoice03Icon"
import MoneyReceive01Icon from "@hugeicons/core-free-icons/MoneyReceive01Icon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { requestCloseChat } from "@/lib/chatBus"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { requestEdit } from "@/lib/requestEdits"
import { foundFor, requestStatusSnapshot, subscribeRequestStatus } from "@/lib/requestStatus"
import { cn } from "@/lib/utils"

const ICONS = { leave: CalendarAdd01Icon, expense: Invoice03Icon, advance: MoneyReceive01Icon }
const TIME = { hour: "2-digit", minute: "2-digit" }
const TEXT_BUTTON =
  "relative inline-flex min-h-6 items-center gap-1 rounded text-[0.8125rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-2.5"

/** Zaman çizgisinin adımı: biten adım dolu daire + tik, bekleyen halka + nokta. */
function Step({ done, children }) {
  return (
    <li className="flex items-center gap-2.5 text-[0.8125rem]">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-[1.125rem] shrink-0 place-items-center rounded-full",
          done ? "bg-foreground text-background" : "ring-[1.5px] ring-inset ring-brand-ink",
        )}
      >
        {done ? (
          <HugeiconsIcon icon={Tick02Icon} className="size-3" strokeWidth={2.5} />
        ) : (
          <span className="size-1.5 rounded-full bg-brand-ink" />
        )}
      </span>
      <span className={done ? "text-foreground" : "font-semibold text-foreground"}>{children}</span>
    </li>
  )
}

/**
 * Formdan giden talebin sohbetteki hâli (düz kullanıcı balonunun yerine): tür, iki satır özet,
 * gerçek olaylardan zaman çizgisi (gönderildi · ERP'ye işlendi — Self Servis'in gözcüsü bulunca)
 * ve gönderilen mesajın kendisi. Asistana giden metin değişmez (`message.content`). ERP'ye
 * işlenmeden "Formda düzenle" gönderilen formu Self Servis'te dolu açar (`card.form`,
 * `lib/requestEdits`); düzeltilen talep yeni bir mesaj olarak gider.
 */
export function RequestCard({ message }) {
  const { t, locale } = useLocale()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { card } = message
  const time = message.time instanceof Date ? message.time : new Date(message.time)
  const list = useSyncExternalStore(subscribeRequestStatus, requestStatusSnapshot)
  const found = foundFor(list, card.kind, time)
  const title = t(`selfService.cta.${card.kind}`)
  const facts = (card.facts ?? []).filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-end"
    >
      <article
        aria-label={title}
        className="w-full max-w-[30rem] rounded-[1.125rem] border border-black/[0.08] bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-16px_rgb(0_0_0/0.14)] dark:border-white/[0.1]"
      >
        <header className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-fill-deep text-brand-on-brand"
          >
            <HugeiconsIcon icon={ICONS[card.kind] ?? Invoice03Icon} className="size-4" />
          </span>
          <p className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold">{title}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold",
              found
                ? "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"
                : "bg-foreground/[0.06] text-foreground/80",
            )}
          >
            {t(found ? "selfService.card.inErp" : "selfService.card.sent")}
          </span>
        </header>
        <div className="mt-2.5 space-y-0.5 text-[0.8125rem] tabular-nums">
          {facts.map((f, i) => (
            <p key={f} className={i === 0 ? "font-medium" : "text-muted-foreground"}>
              {f}
            </p>
          ))}
          {card.receipts > 0 && (
            <p className="text-muted-foreground">
              {t("selfService.form.receiptCount", { n: card.receipts })}
            </p>
          )}
        </div>
        <ol className="mt-3 space-y-2 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
          <Step done>
            {t("selfService.card.sentAt", {
              time: getDateTimeFormat(locale, TIME).format(time),
            })}
          </Step>
          <Step done={Boolean(found)}>
            {found
              ? found.number
                ? t("selfService.card.foundNo", { no: found.number })
                : t("selfService.card.found")
              : t("selfService.card.waiting")}
          </Step>
        </ol>
        <footer className="mt-3 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-2.5 dark:border-white/[0.08]">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={cn(TEXT_BUTTON, "text-foreground/80 hover:text-foreground")}
          >
            {t("selfService.card.message")}
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              aria-hidden="true"
              strokeWidth={2}
              className={cn("size-3.5 transition-transform", open && "rotate-180")}
            />
          </button>
          {/* Talep ERP'ye işlenmeden (TYRO henüz onay beklerken) form düzeltilip yeniden gönderilebilir. */}
          {card.form && !found && (
            <button
              type="button"
              onClick={() => {
                requestEdit({
                  kind: card.kind,
                  form: card.form,
                  formId: card.formId,
                  receipts: card.receipts ?? 0,
                })
                requestCloseChat()
                navigate("/self-service")
              }}
              className={cn(TEXT_BUTTON, "text-brand-ink hover:underline")}
            >
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={2}
              />
              {t("selfService.card.edit")}
            </button>
          )}
          {found?.id && (
            <button
              type="button"
              onClick={() =>
                navigate(`/self-service?tab=${card.kind}&ref=${encodeURIComponent(found.id)}`)
              }
              className={cn(TEXT_BUTTON, "text-brand-ink hover:underline")}
            >
              {t("selfService.card.open")}
            </button>
          )}
        </footer>
        {open && (
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/60 px-3 py-2.5 text-[0.8125rem] leading-relaxed [overflow-wrap:anywhere]">
            {message.content}
          </p>
        )}
      </article>
    </motion.div>
  )
}
