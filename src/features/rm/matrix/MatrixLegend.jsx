import { useRmText } from "../data/useRmText"

const ITEM = "flex items-center gap-1.5"

/**
 * Matrisin açıklaması: doluluk ısısı ve aşım her ölçekte; tatil, arife, kapanış, elle gün, bitiş
 * sonrası ve ülke tatili yalnız gün görünümünde (işaretler orada çizilir). Sonda düzenleme notu.
 * Kısa ekranda tek satırda kayar: tablo yer bulsun.
 */
export function MatrixLegend({ zoom, hint }) {
  const { rt } = useRmText()
  const days = zoom === "day"
  return (
    <ul
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground shortest:flex-nowrap shortest:overflow-x-auto shortest:whitespace-nowrap shortest:[scrollbar-width:none] shortest:[&>li]:shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      aria-label={rt("rm.matrix.legend")}
      // Kısa ekranda yatay kayar: klavyeyle de kaydırılabilsin.
      tabIndex={0}
    >
      <li className={ITEM}>
        {rt("rm.matrix.heat")}
        <span aria-hidden="true" className="flex overflow-hidden rounded ring-1 ring-border/60">
          <span className="h-3 w-4 bg-brand/[0.05]" />
          <span className="h-3 w-4 bg-brand/[0.1]" />
          <span className="h-3 w-4 bg-brand/[0.16]" />
        </span>
      </li>
      <li className={ITEM}>
        <span
          aria-hidden="true"
          className="rounded bg-danger/12 px-1 text-[0.6875rem] font-semibold leading-4 text-danger-ink tabular-nums"
        >
          9
        </span>
        {rt("rm.matrix.over")}
      </li>
      {days && (
        <>
          <li className={ITEM}>
            <span aria-hidden="true" className="inline-block size-3 rounded bg-foreground/[0.08]" />
            {rt("rm.matrix.holiday")}
          </li>
          <li>
            <span className="font-semibold text-warning-ink">½</span> {rt("rm.matrix.eve")}
          </li>
          <li>
            <span className="font-semibold">{rt("rm.matrix.closingMark")}</span>{" "}
            {rt("rm.matrix.closing")}
          </li>
          <li className={ITEM}>
            <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-brand" />
            {rt("rm.matrix.manual")}
          </li>
          <li className={ITEM}>
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-sm outline-1 outline-dashed outline-warning"
            />
            {rt("rm.matrix.afterEnd")}
          </li>
          <li className={ITEM}>
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-sm bg-[repeating-linear-gradient(135deg,transparent_0_3px,var(--border)_3px_4px)] ring-1 ring-border/60"
            />
            {rt("rm.matrix.countryHoliday")}
          </li>
        </>
      )}
      {hint ? <li className="text-foreground/65">{hint}</li> : null}
    </ul>
  )
}
