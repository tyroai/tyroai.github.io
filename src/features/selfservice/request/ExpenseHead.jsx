import { memo, useState } from "react"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon"
import User03Icon from "@hugeicons/core-free-icons/User03Icon"
import UserSwitchIcon from "@hugeicons/core-free-icons/UserSwitchIcon"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { titleOf } from "@/lib/expenseHead"
import { companyOf, onBehalfText, ownerOf } from "@/features/selfservice/lib/expenseHeadView"
import { SelectCell, TitleCell } from "./expense/head/HeadCells"
import { TITLE_MAX, titleCount } from "./expense/head/headTitle"
import { HeadToggle } from "./expense/head/HeadToggle"
import { useHeadOptions } from "./expense/head/useHeadOptions"
import { ReceiptBar } from "./expense/receipts/ReceiptBar"

/**
 * Masrafın başlığı, kalemlerin üstünde. Masaüstünde başlık bilgileri (kimin adına · şirket ·
 * masraf açıklaması) pencerenin başlığında hap hap (`expense/head/ExpenseMeta`); burada yalnız
 * fiş şeridi (`receipts`, akışın fiş nesnesi; ERP'de fişler kaleme değil masrafın başlığına
 * eklenir, yeri de burası) — gövdenin geri kalanı kalemlerin. Telefon çekmecesinde başlık yok:
 * üç alan karosu burada, katlı (tek karo özet "<ad> · Ekim 26 | TYRO Self Servis | <ad>" — şirket yalnız başkası
 * seçilmişse yazılır, kendi şirketin yazılmaz —, basınca açılır; kap ≥ 40rem ise — yatay telefon —
 * üçü tek satırda açık); fiş şeridi katın
 * dışında, hep görünür. `reading`: fişlerden doldurma (`receipts/useReceiptReading`; şeritte
 * "Fişlerden doldur"). `memo`: yalnız başlık, liste, varsayılan açıklama, fişler ya da okuma
 * değişince çizilir (kalem yazılırken değil).
 */
export const ExpenseHead = memo(function ExpenseHead({
  head,
  setHead,
  defaultTitle,
  idBase,
  owners,
  receipts,
  reading,
}) {
  const { t, locale } = useLocale()
  // Pencere (masaüstü) ile çekmece (telefon) aynı ölçütle seçilir: başlık bilgileri birinde
  // pencerenin başlığında, öbüründe burada.
  const mobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const id = (name) => `${idBase}-head-${name}`
  const { self, ownCompany, ownerOptions, companyOptions, ownerNote } = useHeadOptions(owners)
  const strip = receipts && <ReceiptBar idBase={idBase} receipts={receipts} reading={reading} />
  if (!mobile) return strip && <div className="mb-4 shorter:mb-3">{strip}</div>

  const other = ownerOf(head, owners.owners)
  const company = companyOf(head.company)
  const pill = other ? t("selfService.expense.head.other") : null
  const title = head.title ?? defaultTitle
  const count = titleCount(t, locale, title)

  return (
    <div className="@container/head mb-6 space-y-3">
      <div role="group" aria-label={t("selfService.form.head.label")} className="min-w-0">
        <HeadToggle
          id={id("toggle")}
          controls={id("panel")}
          open={open}
          onToggle={() => setOpen((v) => !v)}
          label={t("selfService.form.head.label")}
          pill={pill}
          summary={[
            onBehalfText(t, head, owners.owners) ?? self,
            company?.code,
            titleOf(head, defaultTitle),
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        {/* Katlanınca yükseklik ızgara satırıyla yumuşak; kapalıyken görünmez (odak da girmez). */}
        <div
          id={id("panel")}
          data-open={open || undefined}
          className="invisible grid grid-rows-[0fr] transition-[grid-template-rows,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none data-[open]:visible data-[open]:grid-rows-[1fr] @[40rem]/head:visible @[40rem]/head:grid-rows-[1fr]"
        >
          {/* Katın içinde karoların odak halkası ve gölgesi kırpılmasın: kenarda 4 px pay. */}
          <div className="-mx-1 -mb-1 min-h-0 overflow-hidden px-1 pb-1 @[40rem]/head:m-0 @[40rem]/head:overflow-visible @[40rem]/head:p-0">
            <div className="grid grid-cols-1 gap-2 pt-2 @[40rem]/head:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] @[40rem]/head:gap-3 @[40rem]/head:pt-0">
              <SelectCell
                id={id("owner")}
                icon={other ? UserSwitchIcon : User03Icon}
                swap={other ? "other" : "self"}
                label={t("selfService.form.head.owner")}
                value={other ? other.name : self}
                pill={pill}
                picker={{
                  options: ownerOptions,
                  value: head.owner,
                  onPick: (v) => setHead({ owner: v }),
                  search: ownerOptions.length > 7,
                  note: ownerNote,
                  className:
                    "w-[max(var(--radix-popover-trigger-width),min(22rem,calc(100vw-3rem)))]",
                }}
              />
              <SelectCell
                id={id("company")}
                icon={Building03Icon}
                label={t("selfService.form.head.company")}
                value={company ? company.code : ownCompany}
                sub={company?.title || undefined}
                picker={{
                  options: companyOptions,
                  value: head.company,
                  onPick: (v) => setHead({ company: v }),
                  search: true,
                  className:
                    "w-[max(var(--radix-popover-trigger-width),min(28rem,calc(100vw-3rem)))]",
                }}
              />
              <TitleCell
                id={id("title")}
                icon={Note01Icon}
                label={t("selfService.form.head.title")}
                hint={t("selfService.form.head.titleHint")}
                count={count?.text}
                full={count?.full}
                value={title}
                placeholder={defaultTitle}
                max={TITLE_MAX}
                onChange={(v) => setHead({ title: v })}
              />
            </div>
          </div>
        </div>
      </div>
      {strip}
    </div>
  )
})
