import { useMemo, useRef } from "react"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import { useLocale } from "@/hooks/useLocale"
import { OTHER_LOCATION, locationLabel } from "@/lib/advanceLocations"
import { optionLabel } from "@/lib/promptTemplates"
import { cn } from "@/lib/utils"
import { day } from "../../kinds"
import { FieldTile } from "../field/FieldTile"
import { fieldState } from "../field/fieldState"
import { IconTile } from "../field/IconTile"
import { capFirst, errorText } from "../formUi"
import { DateField } from "../PickerFields"
import { purposeIcon, purposeTone } from "./advanceLooks"
import { TEXT_BUTTON, TILE_H, tileAria } from "./advanceUi"
import { ErrorLine, PickerTile } from "./PickerTile"
import { Segmented } from "./Segmented"
import { useTileColumns } from "./useTileColumns"

const sameDay = (a, b) =>
  a instanceof Date && b instanceof Date && a.toDateString() === b.toDateString()

/**
 * Avansın altı alanı karo olarak, tutarın altında. Geniş sütunda (≥ 44rem) iki satır: tarih ·
 * amaç · gidilecek yer, yansıtma şirketi · ödeme · belge; ≥ 26rem iki sütun, daha darda tek
 * (ödeme ve belge seçenekleri uzun dilde sütuna sığmazsa bir kademe az — `useTileColumns`).
 * Tarih talebin günü (varsayılan bugün; öneriler değiştirmez): karo takvimi açar. Amaç ikonlu
 * liste; gidilecek yer ERP'nin lokasyon listesi (aramalı; adı "İstanbul", değeri kodu
 * "İSTANBUL"; "Diğer" sonda); şirket aramalı kod · unvan listesi (masraf başlığının şirket
 * seçicisi). Zorunlu boş alan (yer, şirket) hafif kırmızı, dolu alan ✓. Kimlikler
 * `${idBase}-<alan>`: ilk hatalı alana odak, eksik çipleri ve taslak aynı kalır.
 * `company`: son avansın şirketi — şirket boşken altında "Son avansında: … · Kullan".
 */
export function AdvanceFields({ idBase, fields, form, company, today }) {
  const { t, locale } = useLocale()
  const { values, errors } = form
  const label = (name) => capFirst(t(`myspace.slot.${name}`), locale)
  const err = (name) => errorText(t, fields[name].slot, errors?.[name])
  const id = (name) => `${idBase}-${name}`
  const set = (name) => (v) => form.setSlot(name, v)
  const choose = t("selfService.form.choose")

  const purposeSlot = fields.purpose.slot
  const purposes = useMemo(
    () =>
      purposeSlot.options.map((k) => ({
        value: k,
        label: capFirst(optionLabel(t, purposeSlot, k), locale),
        icon: <IconTile icon={purposeIcon(k)} tone={purposeTone(k)} size="sm" />,
      })),
    [t, locale, purposeSlot],
  )
  const placeSlot = fields.destination.slot
  const places = useMemo(() => {
    const list = placeSlot.options.map((code) => {
      const name = locationLabel(t, code)
      return { value: code, label: name, search: `${name} ${code}` }
    })
    // "Diğer" şehirlerin arasında değil, sonda ve çizgiyle ayrı: listede olmayan yerin seçeneği.
    const other = list.filter((o) => o.value === OTHER_LOCATION).map((o) => ({ ...o, split: true }))
    return [...list.filter((o) => o.value !== OTHER_LOCATION), ...other]
  }, [t, placeSlot])
  const companySlot = fields.company.slot
  const companies = useMemo(
    () =>
      companySlot.options.map((code) => {
        const title = companySlot.describe(code) ?? ""
        return { value: code, code, label: title, search: `${code} ${title}` }
      }),
    [companySlot],
  )

  const date = values.date instanceof Date ? values.date : null
  const dateText = !date
    ? null
    : sameDay(date, today)
      ? capFirst(t("selfService.advance.summary.today", { day: day(date, locale, false) }), locale)
      : day(date, locale)
  const dateErr = err("date")
  const code = values.company
  const companyTitle = code ? companySlot.describe(code) : null
  const gridRef = useRef(null)
  const cols = useTileColumns(gridRef, locale)

  return (
    <div
      ref={gridRef}
      className={cn(
        "grid items-start gap-3",
        cols.fit2 && "@[26rem]/fields:grid-cols-2",
        cols.fit2 && cols.fit3 && "@[44rem]/fields:grid-cols-3",
      )}
    >
      <div className="min-w-0">
        <DateField
          id={id("date")}
          labelId={`${id("date")}-label`}
          value={date}
          onPick={set("date")}
          trigger={(open) => (
            <FieldTile
              className={TILE_H}
              id={id("date")}
              icon={Calendar03Icon}
              label={label("date")}
              labelId={`${id("date")}-label`}
              value={dateText}
              valueId={`${id("date")}-value`}
              placeholder={t("selfService.form.pickDate")}
              state={fieldState({ filled: Boolean(date), required: true, error: dateErr })}
              open={open}
              {...tileAria(id("date"), dateErr)}
            />
          )}
        />
        <ErrorLine id={id("date")} text={dateErr} />
      </div>

      <PickerTile
        id={id("purpose")}
        label={label("purpose")}
        icon={purposeIcon(values.purpose)}
        tone={purposeTone(values.purpose)}
        swap={values.purpose}
        options={purposes}
        value={values.purpose}
        display={purposes.find((o) => o.value === values.purpose)?.label}
        placeholder={choose}
        onPick={set("purpose")}
        error={err("purpose")}
        listClassName="w-[max(var(--radix-popover-trigger-width),15rem)]"
      />

      <PickerTile
        id={id("destination")}
        label={label("destination")}
        icon={Location01Icon}
        options={places}
        value={values.destination}
        display={values.destination ? locationLabel(t, values.destination) : null}
        placeholder={choose}
        onPick={set("destination")}
        search
        required
        error={err("destination")}
        listClassName="w-[max(var(--radix-popover-trigger-width),15rem)]"
      />

      <PickerTile
        id={id("company")}
        label={label("company")}
        icon={Building03Icon}
        options={companies}
        value={code}
        display={
          code && (
            <>
              {code}
              {companyTitle && (
                <span className="font-normal text-muted-foreground"> · {companyTitle}</span>
              )}
            </>
          )
        }
        placeholder={choose}
        onPick={set("company")}
        search
        required
        error={err("company")}
        listClassName="w-[max(var(--radix-popover-trigger-width),min(22rem,calc(100vw-1.5rem)))]"
      >
        {company && !code && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 ps-1 text-[0.75rem] text-muted-foreground">
            {t("selfService.advance.lastCompany", { code: company })}
            <button type="button" className={TEXT_BUTTON} onClick={() => set("company")(company)}>
              {t("selfService.advance.use")}
            </button>
          </p>
        )}
      </PickerTile>

      <Segmented
        idBase={idBase}
        field={fields.payment}
        value={values.payment}
        onChange={form.setSlot}
      />
      <Segmented
        idBase={idBase}
        field={fields.document}
        value={values.document}
        onChange={form.setSlot}
      />
    </div>
  )
}
