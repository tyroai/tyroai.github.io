import { useState } from "react"
import { RecipientField } from "@/components/common/RecipientField"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLocale } from "@/hooks/useLocale"
import { useRecentPeople } from "@/hooks/useRecentPeople"
import { MAX_PEOPLE } from "@/lib/commonTime"

/**
 * Ortak saatin kişileri: alıcı alanı (yazıştıkların + şirket dizini), en çok 6 kişi. Adresi
 * olmayan (yalnız ad yazılmış) satır kaydedilmez — takvimi sorulamaz.
 */
function PeopleForm({ value, onSave, onCancel }) {
  const { t } = useLocale()
  const [list, setList] = useState(value)
  const suggestions = useRecentPeople(true)
  const resolved = list.filter((p) => p.address)
  return (
    <>
      <RecipientField
        id="common-time-people"
        label={t("widgets.commonTime.dialog.field")}
        value={list}
        onChange={(next) => setList(next.slice(0, MAX_PEOPLE))}
        suggestions={suggestions}
        placeholder={t("widgets.commonTime.dialog.placeholder")}
      />
      <DialogFooter className="mt-4">
        <Button variant="ghost" onClick={onCancel}>
          {t("spotlight.cancel")}
        </Button>
        <Button onClick={() => onSave(resolved)}>{t("widgets.commonTime.dialog.save")}</Button>
      </DialogFooter>
    </>
  )
}

export function PeopleDialog({ open, onOpenChange, value, onSave }) {
  const { t } = useLocale()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("widgets.commonTime.dialog.title")}</DialogTitle>
          <DialogDescription>{t("widgets.commonTime.dialog.hint")}</DialogDescription>
        </DialogHeader>
        {/* Her açılış kayıtlı listeden başlar: vazgeçilen düzenleme kalmaz. */}
        {open && (
          <PeopleForm
            value={value}
            onCancel={() => onOpenChange(false)}
            onSave={(list) => {
              onSave(list)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
