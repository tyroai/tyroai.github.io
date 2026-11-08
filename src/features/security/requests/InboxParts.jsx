import { HugeiconsIcon } from "@hugeicons/react"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import InboxIcon from "@hugeicons/core-free-icons/InboxIcon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import FilterHorizontalIcon from "@hugeicons/core-free-icons/FilterHorizontalIcon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { AppLogo } from "../apps/AppLogo"
import { lookupApp } from "../apps/useCatalogLookup"
import { BTN, BTN_QUIET } from "./buttons"
import { PersonLine } from "./RequestItem"

const GROUPS = ["none", "person", "app"]

/** Gruplama seçimi: Tarih (düz liste) · Kişi · Uygulama — sessiz düğme, seçenekler menüde. */
export function GroupByMenu({ value, onChange }) {
  const { t } = useLocale()
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          BTN,
          BTN_QUIET,
          "shrink-0 border border-border px-2.5 pointer-coarse:min-w-11",
        )}
        aria-label={`${t("authz.inbox.groupBy")}: ${t(`authz.inbox.group.${value}`)}`}
      >
        <HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" strokeWidth={1.8} />
        <span className="hidden @[30rem]/inbox:inline">{t(`authz.inbox.group.${value}`)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>{t("authz.inbox.groupBy")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {GROUPS.map((g) => (
            <DropdownMenuRadioItem key={g} value={g} className="pointer-coarse:min-h-11">
              {t(`authz.inbox.group.${g}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Grup başlığı: kişiye göre adres, uygulamaya göre logo + ad; yanında adet ve (varsa) toplu eylem. */
export function GroupHead({ by, label, count, lookup, action }) {
  const { locale } = useLocale()
  return (
    <div className="flex min-h-9 items-center gap-2 px-1">
      <h3 className="flex min-w-0 flex-1 items-center gap-2 text-[0.8125rem]">
        {by === "app" ? (
          <>
            <AppLogo app={lookupApp(lookup, label)} name={label} size="sm" />
            <span className="font-semibold [overflow-wrap:anywhere]">{label}</span>
          </>
        ) : (
          <PersonLine upn={label} />
        )}
        <span className="tabular-nums text-muted-foreground">{count.toLocaleString(locale)}</span>
      </h3>
      {action}
    </div>
  )
}

/** Boş durum: ikon + tek cümle (+ sonraki adım). `success`: "bekleyen yok" sessiz başarı. */
export function InboxEmpty({ title, success, quiet, action }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl px-4 text-center",
        quiet ? "py-8" : "bg-muted/40 py-10 dark:bg-white/[0.04]",
      )}
    >
      <HugeiconsIcon
        icon={success ? CheckmarkCircle02Icon : InboxIcon}
        aria-hidden="true"
        className={cn("size-6", success ? "text-success-ink" : "text-muted-foreground/70")}
        strokeWidth={1.8}
      />
      <p className="text-[0.875rem] font-medium">{title}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(BTN, BTN_QUIET, "text-brand-ink")}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}

/** Liste yüklenemedi: sebep + Tekrar dene; elde olan son hâl altında kalır. */
export function InboxError({ ctx }) {
  const { t } = useLocale()
  return (
    <div
      role="alert"
      className="flex flex-wrap items-start gap-3 rounded-2xl bg-warning/12 px-4 py-3"
    >
      <HugeiconsIcon
        icon={Alert02Icon}
        aria-hidden="true"
        className="mt-0.5 size-4 text-warning-ink"
        strokeWidth={2}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-medium">
          {!ctx.fetchedAt && ctx.errorKey === "authz.error.generic"
            ? t("authz.inbox.loadFailed")
            : t(ctx.errorKey)}
        </p>
        <ErrorCause detail={ctx.errorDetail} className="mt-1.5" />
        <details className="mt-1">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            {t("authz.error.detail")}
          </summary>
          <p className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {String(ctx.error?.message ?? ctx.error)}
          </p>
        </details>
      </div>
      <button
        type="button"
        onClick={ctx.reload}
        disabled={ctx.status === "loading"}
        className={cn(BTN, BTN_QUIET, "border border-border")}
      >
        {t("authz.inbox.retry")}
      </button>
    </div>
  )
}

/** Kapı cümlesi (bekliyor · soramadık · yetkisiz — kabuğun verdiği anahtar). */
export function InboxGate({ text }) {
  return (
    <p className="rounded-2xl bg-muted/40 px-4 py-10 text-center text-[0.8125rem] text-muted-foreground dark:bg-white/[0.04]">
      {text}
    </p>
  )
}

/** İlk yükleme iskeleti: düşük opaklık, hareketsiz (hareketi azalt tercihine de uyar). */
export function InboxSkeleton({ rows = 4 }) {
  return (
    <ul
      aria-hidden="true"
      className="divide-y divide-border/60 rounded-2xl bg-muted/40 dark:bg-white/[0.04]"
    >
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-4 opacity-60">
          <span className="size-9 shrink-0 rounded-[0.625rem] bg-foreground/10" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-40 max-w-full rounded bg-foreground/10" />
            <span className="block h-3 w-24 rounded bg-foreground/[0.07]" />
            <span className="block h-3 w-64 max-w-full rounded bg-foreground/[0.07]" />
          </span>
        </li>
      ))}
    </ul>
  )
}
