import { HugeiconsIcon } from "@hugeicons/react"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import User03Icon from "@hugeicons/core-free-icons/User03Icon"
import UserSwitchIcon from "@hugeicons/core-free-icons/UserSwitchIcon"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { companyOf, ownerOf } from "@/features/selfservice/lib/expenseHeadView"
import { cn } from "@/lib/utils"
import { HeadPicker } from "./HeadPicker"
import { TITLE_MAX, titleCount } from "./headTitle"
import { MetaPill, NameTip, PILL_BOX, PILL_VALUE, PillIcon } from "./MetaPill"
import { useHeadOptions } from "./useHeadOptions"

/**
 * Masaüstü pencerenin başlığında masrafın başlık bilgileri, hap hap tek satır: kimin adına ·
 * şirket (ikisi de basınca liste; şirket aramalı) · masraf açıklaması (hapın içinde yazılır, en
 * çok 120 harf, sınıra yaklaşınca sayaç; ne olduğu ⓘ balonunda). Gövdede ayrı bir alan bloğu yer
 * kaplamasın, kalemlere yer kalsın. Üçünün değeri hep dolu (varsayılanlar): ✓. Kimlikler gövdedeki
 * karolarla aynı (`${idBase}-head-owner` …): gözden geçirmeden dönüşte odak "Kimin adına"ya gelir.
 */
export function ExpenseMeta({ head, setHead, defaultTitle, idBase, owners }) {
  const { t, locale } = useLocale()
  const id = (name) => `${idBase}-head-${name}`
  const { self, ownCompany, ownerOptions, companyOptions, ownerNote } = useHeadOptions(owners)
  const other = ownerOf(head, owners.owners)
  const company = companyOf(head.company)
  const title = head.title ?? defaultTitle
  const count = titleCount(t, locale, title)
  const titleId = id("title")

  return (
    <div
      role="group"
      aria-label={t("selfService.form.head.label")}
      className="flex min-w-0 items-center gap-2"
    >
      <HeadPicker
        labelId={`${id("owner")}-label`}
        options={ownerOptions}
        value={head.owner}
        onPick={(v) => setHead({ owner: v })}
        search={ownerOptions.length > 7}
        note={ownerNote}
        className="w-[max(var(--radix-popover-trigger-width),min(22rem,calc(100vw-3rem)))]"
      >
        {(open) => (
          <MetaPill
            id={id("owner")}
            icon={other ? UserSwitchIcon : User03Icon}
            swap={other ? "other" : "self"}
            label={t("selfService.form.head.owner")}
            value={other ? other.name : self}
            pill={other ? t("selfService.expense.head.other") : null}
            open={open}
            className="max-w-[18rem] shrink-[2]"
          />
        )}
      </HeadPicker>
      <HeadPicker
        labelId={`${id("company")}-label`}
        options={companyOptions}
        value={head.company}
        onPick={(v) => setHead({ company: v })}
        search
        className="w-[max(var(--radix-popover-trigger-width),min(28rem,calc(100vw-3rem)))]"
      >
        {(open) => (
          <MetaPill
            id={id("company")}
            icon={Building03Icon}
            label={t("selfService.form.head.company")}
            value={company ? company.code : ownCompany}
            sub={company?.title || undefined}
            open={open}
            className="max-w-[17rem] shrink-[3]"
          />
        )}
      </HeadPicker>
      <span className="flex min-w-0 shrink items-center gap-0.5">
        <NameTip name={t("selfService.form.head.title")}>
          {/* Hapın tamamı etiket: nereye basılsa yazı alanı odaklanır. Eni yazı kadar (ızgaradaki
              görünmez ikiz), sığmazsa alan kendi içinde kayar. */}
          <label htmlFor={titleId} className={cn(PILL_BOX, "max-w-[26rem] cursor-text")}>
            <PillIcon icon={Note01Icon} />
            <span id={`${titleId}-label`} className="sr-only">
              {t("selfService.form.head.title")}
            </span>
            <span className="grid min-w-0">
              <span
                aria-hidden="true"
                className={cn(PILL_VALUE, "invisible col-start-1 row-start-1 whitespace-pre pe-px")}
              >
                {title || defaultTitle}
              </span>
              <input
                id={titleId}
                type="text"
                value={title}
                onChange={(e) => setHead({ title: e.target.value })}
                // Başlığı yazıp Enter'a basmak formu göndermesin (kalemler daha boş olabilir).
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.nativeEvent.isComposing && e.preventDefault()
                }
                placeholder={defaultTitle}
                maxLength={TITLE_MAX}
                autoComplete="off"
                spellCheck
                aria-labelledby={`${titleId}-label`}
                aria-describedby={`${titleId}-hint`}
                className={cn(
                  PILL_VALUE,
                  "col-start-1 row-start-1 w-full bg-transparent p-0 outline-none placeholder:font-normal placeholder:text-muted-foreground",
                )}
              />
            </span>
            {count && (
              <span
                aria-hidden="true"
                className={cn(
                  "shrink-0 text-[0.75rem] tabular-nums",
                  count.full ? "font-medium text-warning-ink" : "text-muted-foreground",
                )}
              >
                {count.text}
              </span>
            )}
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              aria-hidden="true"
              strokeWidth={1.8}
              className="-me-0.5 size-3.5 shrink-0 text-muted-foreground"
            />
          </label>
        </NameTip>
        <span id={`${titleId}-hint`} className="sr-only">
          {t("selfService.form.head.titleHint")}
        </span>
        <InfoTip text={t("selfService.form.head.titleHint")} className="size-6" />
      </span>
    </div>
  )
}
