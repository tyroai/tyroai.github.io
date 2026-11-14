import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { MARKET_CATALOG, MAX_ROWS } from "@/lib/marketCatalog"
import { cityById, cityName } from "@/lib/worldClock"
import { cn } from "@/lib/utils"
import { price, rowNames } from "./marketFormat"
import { ChangePill } from "./MarketRow"

const HEAD = "px-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-foreground/60"
const SECTIONS = [
  ["offices", MARKET_CATALOG.filter((r) => r.city)],
  ["fx", MARKET_CATALOG.filter((r) => !r.city && r.kind === "fx")],
  ["gold", MARKET_CATALOG.filter((r) => r.kind !== "fx")],
]

function EditorRow({ item, data, checked, blocked, hint, onToggle, indicativeHint }) {
  const { t, locale } = useLocale()
  const names = rowNames(item, t, locale)
  const city = item.city ? cityName(cityById(item.city), locale) : null
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-disabled={blocked}
        title={blocked ? hint : undefined}
        onClick={() => !blocked && onToggle(item.id)}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2 text-start transition outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-brand/40 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent"
      >
        <span
          aria-hidden="true"
          className={cn(
            "grid size-4 shrink-0 place-items-center rounded border transition",
            checked
              ? "border-transparent bg-gradient-to-br from-brand-from via-brand-via to-brand-to text-brand-on-ramp"
              : "border-foreground/25",
            // Kilitli satırda yalnız kutu soluk: panel ofis kurlarını okumak için de açılıyor.
            blocked && "opacity-40",
          )}
        >
          {checked && <HugeiconsIcon icon={Tick02Icon} className="size-2.5" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-medium">
            {names.short}
            {city && <span className="font-normal text-muted-foreground"> · {city}</span>}
          </span>
          {names.long !== names.short && (
            <span className="block truncate text-[0.6875rem] text-muted-foreground">
              {names.long}
            </span>
          )}
        </span>
        {data && (
          <span className="flex shrink-0 items-center gap-1.5">
            <span
              title={data.indicative ? indicativeHint : undefined}
              className="text-[0.8125rem] tabular-nums"
            >
              {data.indicative && <span aria-hidden="true">≈ </span>}
              {price(data, locale)}
            </span>
            {data.indicative ? (
              <span className="rounded-md bg-muted px-1 text-[0.6875rem] text-foreground/75">
                {t("widgets.market.indicative")}
              </span>
            ) : (
              data.change != null && <ChangePill change={data.change} />
            )}
          </span>
        )}
      </button>
    </li>
  )
}

/**
 * Piyasa listesini seç: ofis kurları (şehriyle; Nijerya, Gana, Venezuela "gösterge"), öteki kurlar,
 * altın-gümüş-endeks — canlı değerleriyle. En çok `MAX_ROWS` satır, en az bir; dolunca seçilmemiş
 * satırlar kilitlenir ve nedenini söyler.
 */
export default function MarketEditor({ list, byId, indicativeHint, source }) {
  const { t } = useLocale()
  const hint = t("widgets.market.edit.full", { max: MAX_ROWS })
  return (
    <div className="flex flex-col gap-3 px-2 pb-3">
      <p role="status" dir="auto" className="px-2 text-[0.75rem] text-muted-foreground">
        {t("widgets.market.edit.count", { n: list.ids.length, max: MAX_ROWS })}
        {list.full && ` · ${t("widgets.market.edit.fullHint")}`}
      </p>
      {SECTIONS.map(([key, items]) => (
        <section key={key}>
          <h4 className={HEAD}>{t(`widgets.market.edit.${key}`)}</h4>
          <ul className="mt-1">
            {items.map((item) => {
              const checked = list.ids.includes(item.id)
              return (
                <EditorRow
                  key={item.id}
                  item={item}
                  data={byId.get(item.id)}
                  checked={checked}
                  blocked={checked ? list.ids.length === 1 : list.full}
                  hint={checked ? undefined : hint}
                  onToggle={list.toggle}
                  indicativeHint={indicativeHint}
                />
              )
            })}
          </ul>
        </section>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-2 pt-3">
        <button
          type="button"
          onClick={list.reset}
          className="inline-flex h-8 items-center rounded-full bg-muted px-3 text-[0.75rem] font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {t("widgets.market.edit.reset")}
        </button>
        <span className="text-[0.6875rem] text-muted-foreground">{source}</span>
      </div>
    </div>
  )
}
