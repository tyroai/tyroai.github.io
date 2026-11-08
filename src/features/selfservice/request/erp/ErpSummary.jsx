import { HugeiconsIcon } from "@hugeicons/react"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { useLocale } from "@/hooks/useLocale"
import { formatMoney } from "@/lib/amountParse"
import {
  advanceFacts,
  categoryTitle,
  companyText,
  dayText,
  linesTotal,
} from "@/features/selfservice/lib/erpPreview"
import { leaveWorkdays } from "@/lib/requestForm"
import { cn } from "@/lib/utils"
import { countText, number, range } from "../../kinds"
import { leaveKindLabel } from "../requestCard"
import { CARD, RULE } from "../expense/summary/summaryUi"

// Masraf penceresinin dili: bölüm adı (gözden geçirme adımı), büyük toplam (özet kartı).
const EYEBROW = "text-[0.75rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground"
const FIGURE = "font-semibold leading-[1.15] tracking-[-0.025em] tabular-nums"

const dateOf = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Etiket · değer satırları (masraf sahibi, şirket, açıklama…). */
function Facts({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-5 gap-y-2 text-[0.875rem] min-[480px]:grid-cols-[minmax(0,8.5rem)_1fr] min-[480px]:gap-y-2">
      {items.map(([label, value]) => (
        <div key={label} className="contents max-[479px]:block">
          <dt className="text-muted-foreground max-[479px]:text-[0.75rem]">{label}</dt>
          <dd dir="auto" className="min-w-0 font-medium [overflow-wrap:anywhere]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function LeaveCard({ plan }) {
  const { t, locale } = useLocale()
  const r = plan.record
  const start = dateOf(r.mserp_startdate)
  const end = dateOf(r.mserp_enddate)
  const days = leaveWorkdays(start, end)
  // Kişinin seçtiği ad başlıkta; ERP'nin adı farklıysa koduyla yanında (babalık izni ERP'de
  // "Doğum İzni", TR03 — annenin izni "Analık Doğum İzni", TR04).
  const erpName = t(`selfService.leaveType.${plan.code}`)
  const chosen = leaveKindLabel(t, locale, plan.kind) ?? erpName
  const same = chosen.toLocaleLowerCase(locale) === erpName.toLocaleLowerCase(locale)
  return (
    <div className={CARD}>
      <div className="px-6 pb-4 pt-4">
        <p className={EYEBROW}>{t("selfService.field.type")}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-[1.5rem] font-semibold leading-tight tracking-[-0.02em]">
            {chosen}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[0.75rem] font-medium text-foreground/70">
            <span className="font-mono font-semibold">{plan.code}</span>
            {!same && <span>{t("selfService.erp.preview.erpName", { name: erpName })}</span>}
          </span>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.9375rem] tabular-nums text-foreground/80">
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon
              icon={Calendar03Icon}
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.8}
            />
            {range(start, end, locale)}
          </span>
          {days != null && (
            <span className="text-muted-foreground">
              {number(days, locale)} {t("selfService.form.workdays")}
            </span>
          )}
        </p>
      </div>
      <div className={cn("border-t px-6 py-3", RULE)}>
        <Facts
          items={[
            [t("selfService.erp.preview.employee"), r.mserp_email],
            [t("selfService.erp.preview.note"), r.mserp_description],
          ]}
        />
      </div>
    </div>
  )
}

/** İş avansı: büyük tutar, altında ERP'ye giden alanlar (kişi, tarih, amaç, yer, şirket…). */
function AdvanceCard({ plan }) {
  const { t, locale } = useLocale()
  const r = plan.record
  return (
    <div className={CARD}>
      <div className="px-6 pb-3.5 pt-3.5">
        <p className={EYEBROW}>{t("selfService.field.amount")}</p>
        <p className={cn(FIGURE, "mt-0.5 text-[1.875rem]")}>
          {formatMoney(r.mserp_requestedamountcur, r.mserp_currencycode, locale)}
        </p>
      </div>
      <div className={cn("border-t px-6 py-3", RULE)}>
        <Facts items={advanceFacts(t, locale, plan)} />
      </div>
    </div>
  )
}

/** Temsilci: kimin, hangi tarihler arası, kapsam. */
function DelegateCard({ plan }) {
  const { t, locale } = useLocale()
  const days = leaveWorkdays(plan.start, plan.end)
  const sameName = plan.person.name.toLowerCase() === plan.person.address.toLowerCase()
  return (
    <div className={CARD}>
      <div className="px-6 pb-4 pt-4">
        <p className={EYEBROW}>{t("selfService.erp.delegate.person")}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] [overflow-wrap:anywhere]">
            {plan.person.name}
          </span>
          {!sameName && (
            <span className="rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[0.75rem] font-medium text-foreground/70 [overflow-wrap:anywhere]">
              {plan.person.address}
            </span>
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.9375rem] tabular-nums text-foreground/80">
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon
              icon={Calendar03Icon}
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.8}
            />
            {range(plan.start, plan.end, locale)}
          </span>
          {days != null && (
            <span className="text-muted-foreground">
              {number(days, locale)} {t("selfService.form.workdays")}
            </span>
          )}
        </p>
      </div>
      <div className={cn("border-t px-6 py-3", RULE)}>
        <Facts
          items={[
            [t("selfService.erp.delegate.scopeLabel"), t("selfService.erp.delegate.scope")],
            [t("selfService.erp.delegate.mailLabel"), t("selfService.erp.delegate.noMail")],
          ]}
        />
      </div>
    </div>
  )
}

/** Bir kalem: "12 Eki · Ulaşım (Yurtiçi)" ve tutarı; altında yer, fiş no, firma, açıklama. */
function Line({ n, line }) {
  const { t, locale } = useLocale()
  const r = line.record
  const more = [
    t(`myspace.location.${line.location}`),
    r.mserp_trydocumentnumber &&
      t("selfService.erp.preview.receiptNo", { value: r.mserp_trydocumentnumber }),
    r.mserp_companyname !== r.mserp_explanation && r.mserp_companyname,
    r.mserp_explanation,
    r.mserp_numberofpeople !== "1" &&
      t("selfService.erp.preview.people", { n: r.mserp_numberofpeople }),
  ].filter(Boolean)
  return (
    <li className="flex items-start gap-3 py-2.5 text-[0.875rem]">
      <span className="w-4 shrink-0 pt-px text-end tabular-nums text-muted-foreground">{n}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">
          {dayText(r.mserp_transdate, locale)} · {categoryTitle(r.mserp_costtype)}
        </span>
        <span dir="auto" className="block text-muted-foreground min-[480px]:truncate">
          {more.join(" · ")}
        </span>
      </span>
      <span className="shrink-0 font-semibold tabular-nums">
        {formatMoney(r.mserp_amount, r.mserp_currency, locale)}
      </span>
    </li>
  )
}

function ExpenseCard({ plan, files, ownerName }) {
  const { t, locale } = useLocale()
  const total = linesTotal(plan.lines, locale)
  const meta = [
    countText(t, locale, "selfService.form.lineCount", plan.lines.length),
    files.length > 0 && countText(t, locale, "selfService.expense.summary.receipts", files.length),
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 px-6 pb-3.5 pt-3.5">
        <div className="min-w-0">
          <p className={EYEBROW}>{t("selfService.form.totalLabel")}</p>
          <p className={cn(FIGURE, "mt-0.5 text-[1.875rem]")}>{total}</p>
        </div>
        <p className="pb-1 text-[0.875rem] tabular-nums text-muted-foreground">{meta}</p>
      </div>
      <div className={cn("border-t px-6 py-3", RULE)}>
        <Facts
          items={[
            [
              t("selfService.erp.preview.owner"),
              ownerName ? `${ownerName} · ${plan.owner}` : plan.owner,
            ],
            [t("selfService.erp.preview.company"), companyText(t, plan.company)],
            [t("selfService.erp.preview.title"), plan.header.mserp_explanation],
          ]}
        />
      </div>
      <div className={cn("border-t px-6 pb-1 pt-3", RULE)}>
        <p className={EYEBROW}>{t("selfService.erp.preview.lines", { n: plan.lines.length })}</p>
        <ol className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
          {plan.lines.map((l, i) => (
            <Line key={i} n={i + 1} line={l} />
          ))}
        </ol>
      </div>
      {files.length > 0 && (
        <div className={cn("flex flex-wrap gap-1.5 border-t px-6 py-2.5", RULE)}>
          <span className="sr-only">{t("selfService.erp.preview.files", { n: files.length })}</span>
          {files.map((f, i) => (
            <span
              key={i}
              className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[0.75rem] font-medium text-foreground/80"
            >
              <HugeiconsIcon
                icon={Attachment01Icon}
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted-foreground"
                strokeWidth={1.8}
              />
              <span className="truncate">{f.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * ERP'ye yazılacak değerlerin kartı — masraf penceresinin özet kartıyla aynı dil: izinde ERP'nin
 * izin türü (kodu yanında), tarih ve iş günü; masrafta büyük toplam, başlık bilgileri, kalemler
 * ve fişler. Değerler `plan`dan (`erpPayloads.js`): ekranda görünen, ERP'ye giden kayıttır.
 */
export function ErpSummary({ kind, state, dim = false }) {
  return (
    <div className={cn("transition-opacity duration-300", dim && "opacity-55")}>
      {kind === "leave" ? (
        <LeaveCard plan={state.plan} />
      ) : kind === "advance" ? (
        <AdvanceCard plan={state.plan} />
      ) : kind === "delegate" ? (
        <DelegateCard plan={state.plan} />
      ) : (
        <ExpenseCard plan={state.plan} files={state.files ?? []} ownerName={state.ownerName} />
      )}
    </div>
  )
}
