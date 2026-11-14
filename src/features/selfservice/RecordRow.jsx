import { Fragment, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useLocale } from "@/hooks/useLocale"
import { statusTone } from "@/lib/selfServiceModel"
import { cn } from "@/lib/utils"
import { tabOf } from "./kinds"
import { usePhone } from "./layout/phone"
import { describe } from "./recordText"
import { RowActions } from "./RowActions"
import { StatusPill } from "./StatusPill"

/**
 * Listedeki tek kayıt — satırın tamamı ayrıntıyı açar. Rozet tonu durumdan. `isNew`: önceki
 * yüklemede olmayan kayıt (sohbette açılan talep ERP'ye yansıdı) — "Yeni" rozeti. Masaüstünde
 * fareyle üstüne gelince ya da klavye odağında tutar/durum sütununun yerinde eylemler
 * (`RowActions`); dokunmatikte yok — aynı eylemler satıra basınca açılan pencerede.
 */
export function RecordRow({
  record,
  onOpen,
  onAsk = null,
  person = null,
  highlighted,
  isNew = false,
}) {
  const { t, locale } = useLocale()
  // Telefon düzeninde kartsız, ayraçlı satır: ikon ve ok yok (sekmede ikon hep aynı).
  const phone = usePhone()
  const tab = tabOf(record.kind)
  const { title, sub, value, amounts } = describe(record, t, locale)
  // Birden çok para birimi alt alta (her genişlikte): " + " ile tek satır sağ sütunu şişirip başlığı eziyordu.
  const stacked = amounts?.length > 1
  const tone = statusTone(record.status)
  // Düğmeler yalnız gerektiğinde kurulur (form HTML'i her satırda üretilmesin): fare üstte, klavye
  // odağı satırda ya da menü / imza penceresi açık. Dokunuşta kurulmaz: dokunma satırı açar.
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [busy, setBusy] = useState(false)
  const actions = !phone
  const shown = actions && (hover || focus || busy)
  return (
    // Ayraç içeriden başlar (ikonun hizasından, Apple listelerindeki gibi); ilk satırda yok.
    <li
      onPointerEnter={actions ? (e) => e.pointerType !== "touch" && setHover(true) : undefined}
      onPointerLeave={actions ? () => setHover(false) : undefined}
      onFocus={actions ? (e) => setFocus(e.target.matches(":focus-visible")) : undefined}
      onBlur={
        actions ? (e) => !e.currentTarget.contains(e.relatedTarget) && setFocus(false) : undefined
      }
      className={cn(
        "relative [&:not(:first-child)]:before:pointer-events-none [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:start-3 [&:not(:first-child)]:before:end-3 [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:h-px [&:not(:first-child)]:before:bg-border/70",
        !phone && "@[30rem]/ss:[&:not(:first-child)]:before:start-[4.25rem]",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(record)}
        data-picked={highlighted || undefined}
        className={cn(
          "group/row flex w-full min-w-0 items-center gap-3 text-start transition-colors",
          "rounded-2xl",
          phone ? "min-h-14 px-2.5 py-3" : "px-3 py-3",
          // Zemin %2,5: gri alt satır (muted) üstünde AA kalsın (%3 ile 4,46:1).
          "hover:bg-foreground/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
          highlighted && "bg-brand/[0.07]",
        )}
      >
        <span
          className={cn(
            "relative grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-ink",
            // Telefonda tutar ve durum hapı geniş: ikon (sekmede hep aynı) ada yer bıraksın.
            phone ? "hidden" : record.kind !== "leave" && "hidden @[30rem]/ss:grid",
          )}
        >
          <HugeiconsIcon icon={tab.icon} className="size-[1.125rem]" strokeWidth={1.8} />
          {record.status && tone === "warning" && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-amber-500 ring-2 ring-card"
            />
          )}
        </span>
        <span data-private="" className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            {/* Telefonda başlık iki satıra iner (masrafta iki kategori adı): kesik kalmasın. */}
            <span
              title={title}
              className={cn(
                "text-[0.875rem] font-semibold text-foreground",
                phone ? "line-clamp-2 min-w-0 break-words" : "truncate",
              )}
            >
              {title}
            </span>
            {isNew && (
              <span className="shrink-0 rounded-full bg-brand/[0.12] px-1.5 py-px text-[0.6875rem] font-bold uppercase tracking-[0.04em] text-brand-ink">
                {t("selfService.newBadge")}
              </span>
            )}
          </span>
          {/* Dar satırda alt satır alta kırılır (kesilmez); parçalar bölünmez. */}
          <span
            className={cn(
              "line-clamp-3 text-[0.75rem]",
              highlighted ? "text-foreground/70" : "text-muted-foreground",
            )}
          >
            {sub.split(" · ").map((part, i) => (
              <Fragment key={i}>
                {i > 0 && " · "}
                <span className="whitespace-nowrap">{part}</span>
              </Fragment>
            ))}
          </span>
        </span>
        <span
          data-row-end=""
          className={cn(
            "flex shrink-0 flex-col items-end gap-1 transition-opacity duration-150",
            // Eylemler bu sütunun yerine gelir (yazılar üst üste binmesin; satır boyu değişmez).
            shown && "@[30rem]/ss:opacity-0",
          )}
        >
          {stacked ? (
            <span
              data-private=""
              className="text-end text-[0.875rem] font-semibold tabular-nums text-foreground"
            >
              {amounts.map((a, i) => (
                <span
                  key={i}
                  className={cn(
                    "block whitespace-nowrap",
                    i && "text-[0.75rem] text-foreground/70",
                  )}
                >
                  {i ? `+ ${a}` : a}
                </span>
              ))}
            </span>
          ) : (
            value && (
              <span
                data-private=""
                className="text-[0.875rem] font-semibold tabular-nums text-foreground"
              >
                {value}
              </span>
            )
          )}
          <StatusPill status={record.status} className="max-w-[9.5rem]" />
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          aria-hidden="true"
          data-row-go=""
          className={cn(
            "hidden size-4 shrink-0 text-muted-foreground/50 transition group-hover/row:translate-x-0.5 group-hover/row:text-muted-foreground rtl:rotate-180",
            !phone && "@[30rem]/ss:block",
          )}
        />
      </button>
      {shown && (
        <div className="absolute inset-y-0 end-10 hidden items-center @[30rem]/ss:flex">
          <RowActions record={record} person={person} onAsk={onAsk} onBusy={setBusy} />
        </div>
      )}
    </li>
  )
}
