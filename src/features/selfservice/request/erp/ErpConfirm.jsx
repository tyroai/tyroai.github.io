import { useEffect, useRef, useState } from "react"
import { AlertDialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import ArrowTurnBackwardIcon from "@hugeicons/core-free-icons/ArrowTurnBackwardIcon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { askDelegate } from "@/features/selfservice/lib/delegateAsk"
import { DELEGATE } from "@/features/selfservice/lib/delegatePolicy"
import { erpProgress, erpTasks } from "@/features/selfservice/lib/erpProgress"
import { cn } from "@/lib/utils"
import { ProgressTile } from "../field/ProgressTile"
import { ErpDelegate } from "./ErpDelegate"
import { ErpDoneActions, ErpResult } from "./ErpDone"
import { ErpTaskList } from "./ErpSteps"
import { useDelegateErp } from "./useDelegateErp"
import { ErpSummary } from "./ErpSummary"
import { ERP_ICON } from "./erpIcon"

// Talep penceresinin alt şeridindeki düğmelerle aynı: hap, 44 px (dokunmatikte 48).
const BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-[0.9375rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 pointer-coarse:h-12 [&_svg]:size-[1.125rem] [&_svg]:shrink-0"
const PRIMARY =
  "bg-brand-fill-deep text-brand-on-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_20px_-8px_rgb(0_0_0/0.45)] hover:brightness-110 active:scale-[0.98]"
const SECONDARY =
  "border border-border bg-background text-foreground/85 shadow-xs hover:bg-foreground/[0.04] hover:text-foreground"
const RULE = "border-black/[0.06] dark:border-white/[0.08]"
// İşlendikten sonra şeritte beş düğmeye kadar (Kapat · Kaydı göster · Temsilci ata · Yazdır ·
// İmzala & Mail): aynı hap, biraz daha dar.
const DONE_LOOK = {
  base: cn(BUTTON, SECONDARY, "px-5"),
  primary: cn(BUTTON, PRIMARY, "px-5"),
  delegate: cn(
    BUTTON,
    "px-5 bg-violet-500/[0.12] text-violet-700 ring-1 ring-inset ring-violet-500/25 hover:bg-violet-500/[0.18] active:scale-[0.98] dark:bg-violet-400/[0.16] dark:text-violet-300 dark:ring-violet-400/30",
  ),
}

// Başlığın adı ve tonu (aşamaya göre). Sorunlu aşamalarda kutu markanın değil durumun tonunda.
const LOOK = {
  confirm: { tone: "brand", title: "selfService.erp.confirm.title" },
  writing: { tone: "brand", title: "selfService.erp.writing.title" },
  done: { tone: "brand", title: "selfService.erp.done.title" },
  invalid: { tone: "warn", title: "selfService.erp.invalid.title" },
  partial: { tone: "warn", title: "selfService.erp.partial.title" },
  error: { tone: "danger", title: "selfService.erp.error.title" },
}
const TONE = {
  warn: "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  danger: "bg-danger/[0.09] text-danger-ink ring-danger/20",
}

function stepText(t, step) {
  if (!step) return t("selfService.erp.step.start")
  return t(`selfService.erp.step.${step.name}`, { n: step.n, total: step.total })
}

/** ERP'nin kendi cümlesi — teşhis için tek kaynak, olduğu gibi. */
function ErpMessage({ error }) {
  const { t } = useLocale()
  if (!error?.message) return null
  return (
    <div className="rounded-2xl bg-muted/60 px-4 py-3 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]">
      <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {t("selfService.erp.error.erpSays")}
        {error.code ? <span className="font-mono normal-case"> · {error.code}</span> : null}
      </div>
      <p
        dir="auto"
        className="mt-1.5 max-h-32 overflow-y-auto font-mono text-[0.75rem] leading-relaxed text-foreground/85 [overflow-wrap:anywhere]"
      >
        {error.message}
      </p>
    </div>
  )
}

/** Sorunlu aşamaların gövdesi: eksikler listesi ya da ne olduğu + ERP'nin cümlesi. */
function Problem({ state }) {
  const { t } = useLocale()
  const { phase } = state
  if (phase === "invalid")
    return (
      <ul className="space-y-2 rounded-2xl bg-muted/55 px-4 py-3 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]">
        {state.problems.map((p, i) => (
          <li key={i} className="flex gap-2.5 text-[0.875rem] leading-snug">
            <span
              aria-hidden="true"
              className="mt-[0.3rem] size-2 shrink-0 rounded-full border-[1.5px] border-amber-600 bg-amber-500/20 dark:border-amber-400"
            />
            {t(p.key, p.vars)}
          </li>
        ))}
      </ul>
    )
  const p = state.partial
  const text =
    phase === "error"
      ? t(`selfService.erp.error.${state.error.kind}`)
      : p.number
        ? t("selfService.erp.partial.body", {
            number: p.number,
            lines: p.lines,
            total: state.plan.lines.length,
          })
        : t("selfService.erp.partial.noNumber")
  return (
    <>
      <p className="text-[0.9375rem] leading-relaxed text-foreground/80">{text}</p>
      <ErpMessage error={state.error} />
    </>
  )
}

/** Talep penceresinin başlığı: simge kutusu (yazımda doluluk halkası), ad, tek satır bağlam. */
function Header({ phase, look, progress, context }) {
  const { t } = useLocale()
  return (
    <div className={cn("relative flex shrink-0 items-center gap-4 border-b px-7 pb-5 pt-7", RULE)}>
      {look.tone === "brand" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_8%_0%,color-mix(in_oklab,var(--brand-via)_12%,transparent),transparent)]"
        />
      )}
      {look.tone === "brand" ? (
        <ProgressTile icon={ERP_ICON} progress={progress} />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-[0.9rem] ring-1",
            TONE[look.tone],
          )}
        >
          <HugeiconsIcon icon={Alert02Icon} className="size-[1.375rem]" strokeWidth={1.9} />
        </span>
      )}
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <AlertDialog.Title className="text-[1.375rem] font-semibold leading-tight tracking-[-0.02em]">
            {t(look.title)}
          </AlertDialog.Title>
          {/* Geri dönüşün ERP'den olduğu "i"de (talep penceresinin başlığındaki gibi). */}
          {look.tone === "brand" && (
            <InfoTip text={t("selfService.erp.confirm.note")} contentClassName="z-[70]" />
          )}
        </div>
        <p
          className={cn(
            "mt-1 truncate text-[0.9375rem] tabular-nums",
            phase === "writing" ? "text-brand-ink" : "text-muted-foreground",
          )}
        >
          {context}
        </p>
      </div>
    </div>
  )
}

/**
 * "Gönder"in ERP yolunun penceresi — talep penceresinin devamı: aynı başlık (simge kutusu, yazım
 * sürerken çevresinde doluluk halkası; geri dönüşün ERP'den olduğu adın yanındaki "i"de), yazılan
 * değerlerin kartı (`ErpSummary`), yazım sürerken iş listesi (`ErpSteps`), aynı alt şerit. İşlenince
 * AYNI ekranda kalır: iş listesi ✓'lerle durur, sonuç kartı en alta gelir (`ErpResult`: markanın
 * ✓'si, numara) ve şerit sonucun düğmelerine döner (`ErpDoneActions`: Kaydı göster, Yazdır,
 * İmzala & Mail…). Yazım sürerken kapanmaz; ERP'nin reddi kendi cümlesiyle görünür. `erp`: `useErpSubmit` ya da `useDelegateErp` (kind "delegate").
 * `delegate`: izin işlenince "Temsilci ata" (`features/selfservice/lib/delegatePolicy.js`) — form bu pencerede açılır;
 * "Gönder" `mode` "chat"te atamayı İK asistanına yollar ve pencereyi kapatır, `"erp"`de aynı pencere
 * temsilcinin yazımını ve sonucunu gösterir; kapanış izni de kapatır.
 */
export function ErpConfirm({ erp: base, kind: baseKind, person = null, delegate = false }) {
  const { t } = useLocale()
  const primary = useRef(null)
  const sub = useDelegateErp({ onDone: () => base.cancel() })
  // Temsilci sohbete gidince odak sohbetin bestecisinde kalsın: pencere kapanırken geri çalmasın.
  const toChat = useRef(false)
  const sendDelegate = (plan) => {
    if (DELEGATE.mode !== "chat") return sub.start(plan, { direct: true })
    askDelegate(t, plan)
    toChat.current = true
    base.cancel()
  }
  const erp = sub.state ? sub : base
  const kind = sub.state ? "delegate" : baseKind
  const state = erp.state
  const phase = state?.phase
  const busy = phase === "writing"
  const done = phase === "done"
  const asking = phase === "confirm" || busy
  const look =
    done && kind === "delegate"
      ? { ...LOOK.done, title: "selfService.erp.done.titleDelegate" }
      : (LOOK[phase] ?? LOOK.confirm)
  // Temsilci formu hangi sonucun üstünde açıldı: yeni bir gönderimde kendiliğinden düşer.
  const [delegateOf, setDelegateOf] = useState(null)
  const delegating = done && delegateOf === state
  // Yazım sürerken kapanmaz; işlendikten sonra pencere açık kalır (Yazdır, İmzala), kapanış formu da kapatır.
  const locked = busy
  const progress =
    state?.plan && (busy || done)
      ? erpProgress(
          erpTasks(kind, { lines: state.plan.lines?.length, files: state.files?.length }),
          state.step,
          done,
        )
      : null
  const context = busy ? stepText(t, state.step) : t(`selfService.form.title.${kind}`)
  // İşlenince sonuç kartı görünsün (en altta) ve odak şeridin Kapat'ına geçsin: yazım sürerken
  // basılan düğme devre dışıydı, klavye odağı boşta kalmasın.
  const resultRef = useRef(null)
  useEffect(() => {
    if (!done) return
    primary.current?.focus({ preventScroll: true })
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    resultRef.current?.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" })
  }, [done])
  return (
    <AlertDialog.Root open={Boolean(state)} onOpenChange={(o) => !o && erp.cancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={cn(
            "fixed inset-0 bg-black/30 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            // İşlendikten sonra İmzala & Mail kendi penceresini (z-50) açıyor: üstte kalsın diye bu
            // pencere de z-50 (talep penceresinin üstünde DOM sırasıyla kalır).
            done ? "z-50" : "z-[60]",
          )}
        />
        <AlertDialog.Content
          onEscapeKeyDown={(e) => {
            // Sohbet rıhtımı Escape'i pencerede dinliyor: onu kapatmasın; yazım sürerken kapanmaz.
            e.stopPropagation()
            if (locked) e.preventDefault()
            // Temsilci formunda Escape başarı görünümüne döner, pencereyi kapatmaz.
            if (delegating) {
              e.preventDefault()
              setDelegateOf(null)
            }
          }}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            primary.current?.focus()
          }}
          onCloseAutoFocus={(e) => {
            if (!toChat.current) return
            toChat.current = false
            e.preventDefault()
          }}
          className={cn(
            "fixed left-1/2 top-1/2 flex max-h-[min(54rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.375rem] bg-popover outline-none text-popover-foreground shadow-[0_32px_64px_-24px_rgb(0_0_0/0.45),0_12px_24px_-12px_rgb(0_0_0/0.18)] ring-1 ring-foreground/10 transition-[max-width] duration-300 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-2 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:shadow-[0_32px_64px_-24px_rgb(0_0_0/0.8)]",
            done ? "z-50" : "z-[60]",
            delegating ? "max-w-[34rem]" : kind === "delegate" ? "max-w-[38rem]" : "max-w-[48rem]",
          )}
        >
          {state && delegating && (
            <ErpDelegate
              plan={state.plan}
              onBack={() => setDelegateOf(null)}
              onSubmit={sendDelegate}
            />
          )}
          {state && !delegating && (
            <>
              <Header phase={phase} look={look} progress={progress} context={context} />
              {!done && (
                <AlertDialog.Description className="sr-only">
                  {t("selfService.erp.confirm.body")}
                </AlertDialog.Description>
              )}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-7 py-6">
                {asking || done ? (
                  <>
                    {progress && (busy || done) && (
                      <ErpTaskList progress={progress} live={context} />
                    )}
                    <ErpSummary kind={kind} state={state} dim={busy} />
                    {done && <ErpResult kind={kind} state={state} cardRef={resultRef} />}
                  </>
                ) : (
                  <Problem state={state} />
                )}
              </div>
              <div
                className={cn(
                  "flex shrink-0 flex-col-reverse gap-2.5 border-t bg-background px-7 py-4 min-[480px]:flex-row min-[480px]:items-center",
                  RULE,
                )}
              >
                {done ? (
                  <ErpDoneActions
                    kind={kind}
                    state={state}
                    person={person}
                    okRef={primary}
                    look={DONE_LOOK}
                    onDelegate={delegate && kind === "leave" ? () => setDelegateOf(state) : null}
                    onShow={kind !== "delegate" && erp.show ? erp.show : null}
                  />
                ) : (
                  <>
                    <span className="hidden flex-1 min-[480px]:block" />
                    {phase !== "partial" && (
                      <AlertDialog.Cancel
                        ref={asking ? undefined : primary}
                        disabled={busy}
                        className={cn(BUTTON, SECONDARY)}
                      >
                        <HugeiconsIcon
                          icon={ArrowTurnBackwardIcon}
                          aria-hidden="true"
                          strokeWidth={2}
                        />
                        {t("selfService.erp.back")}
                      </AlertDialog.Cancel>
                    )}
                    {asking && (
                      <button
                        ref={primary}
                        type="button"
                        onClick={erp.confirm}
                        disabled={busy}
                        aria-busy={busy || undefined}
                        className={cn(BUTTON, PRIMARY)}
                      >
                        {t(busy ? "selfService.erp.sending" : "selfService.erp.confirm.action")}
                        <HugeiconsIcon
                          icon={busy ? Loading03Icon : ERP_ICON}
                          aria-hidden="true"
                          strokeWidth={2}
                          className={busy ? "animate-spin motion-reduce:animate-none" : undefined}
                        />
                      </button>
                    )}
                    {phase === "partial" && (
                      <AlertDialog.Cancel ref={primary} className={cn(BUTTON, PRIMARY)}>
                        {t("selfService.erp.ok")}
                      </AlertDialog.Cancel>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
